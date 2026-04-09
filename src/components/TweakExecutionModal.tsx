import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, CheckCircle, XCircle, Loader2, X, Terminal, Minimize2 } from 'lucide-react';
import { cleanerUtilities } from '../data/cleanerUtilities';
import '../styles/SystemRepairPanel.css';

interface TweakExecutionModalProps {
  tweakId: string | null;
  onClose: () => void;
}

interface TweakState {
  status: 'running' | 'done' | 'error';
  progress: number;
  lines: string[];
}

const TweakExecutionModal: React.FC<TweakExecutionModalProps> = ({ tweakId, onClose }) => {
  const [tweakState, setTweakState] = useState<TweakState>({
    status: 'running',
    progress: 0,
    lines: [],
  });

  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!tweakId) return;

    // Reset when a new tweak spawns
    setTweakState({ status: 'running', progress: 0, lines: [] });

    const unsubscribe = window.electron?.ipcRenderer.on(
      'tweak:progress',
      (data: { id: string; line: string; progress: number; status: 'running' | 'done' | 'error'; title?: string }) => {
        if (data.id !== tweakId) return;

        setTweakState(prev => {
          const newLines = [...prev.lines];
          if (data.line && data.line.trim()) {
            newLines.push(data.line.trim());
          }
          return {
            status: data.status,
            progress: data.progress,
            lines: newLines,
          };
        });
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [tweakId]);

  // Auto-scroll the modal log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [tweakState]);

  const handleMinimize = useCallback(() => {
    // Tweak is already being piped to repairOverlay on the backend natively 
    // We just need to close this big modal so the user can see it!
    onClose();
  }, [onClose]);

  if (!tweakId) return null;

  const utility = cleanerUtilities.find(u => u.id === tweakId);
  const color = utility?.color || '#3b82f6';
  const Icon = utility?.icon || Settings;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="repair-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={() => {
          if (tweakState.status !== 'running') onClose();
        }}
      />

      <div className="repair-modal-wrapper">
        <motion.div
          className="repair-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          style={{ '--repair-color': color } as React.CSSProperties}
        >
          {/* Modal Header */}
          <div className="repair-modal-header">
            <div className="repair-modal-title-row">
              <div className="repair-modal-icon">
                {typeof Icon === 'function' ? <Icon size={16} /> : <img src={Icon as string} alt="" width={16} height={16} />}
              </div>
              <div>
                <div className="repair-modal-title">{utility?.title || 'System Tweak'}</div>
                <div className="repair-modal-subtitle">{utility?.description || 'Executing...'}</div>
              </div>
              <div className={`repair-status-badge repair-status--${tweakState.status} repair-modal-badge`}>
                {tweakState.status === 'running' && <Loader2 size={11} className="repair-spin" />}
                {tweakState.status === 'done' && <CheckCircle size={11} />}
                {tweakState.status === 'error' && <XCircle size={11} />}
                <span>
                  {tweakState.status === 'running' ? 'Running...' : tweakState.status === 'done' ? 'Completed' : 'Failed'}
                </span>
              </div>
            </div>
            {tweakState.status === 'running' && (
              <button
                className="repair-modal-minimize"
                onClick={handleMinimize}
                title="Minimize to overlay"
              >
                <Minimize2 size={15} />
              </button>
            )}
            <button
              className="repair-modal-close"
              onClick={onClose}
              disabled={tweakState.status === 'running'}
              title={tweakState.status === 'running' ? 'Wait for tweak to finish' : 'Close'}
            >
              <X size={15} />
            </button>
          </div>

          {/* Log Output */}
          <div className="repair-modal-log" ref={logRef}>
            {tweakState.lines.length === 0 ? (
              <div className="repair-modal-log-empty">
                <Loader2 size={16} className="repair-spin" />
                <span>Waiting for output... (Accept the UAC Prompt if requested)</span>
              </div>
            ) : (
              <>
                {tweakState.lines.map((line, j) => {
                  const isResult = /done!|applied/i.test(line);
                  return (
                    <React.Fragment key={j}>
                      <div className={`repair-log-line${isResult ? ' repair-log-line--result' : ''}`}>{line}</div>
                    </React.Fragment>
                  );
                })}

                {tweakState.status === 'running' && (
                  <div className="repair-log-line repair-log-line--progress repair-log-line--progress-gap">
                    Execution [{tweakState.progress}%] complete.
                  </div>
                )}
                {tweakState.progress > 0 && (
                  <div className="repair-log-spacer" />
                )}
              </>
            )}
            {tweakState.status === 'running' && <div className="repair-log-cursor" />}
          </div>

          {/* Modal Footer */}
          <div className="repair-modal-footer">
            {tweakState.status === 'running' && (
              <button
                className="repair-minimize-btn"
                onClick={handleMinimize}
              >
                <Minimize2 size={13} />
                <span>Minimize</span>
              </button>
            )}
            <button
              className="repair-modal-close-btn"
              onClick={onClose}
              disabled={tweakState.status === 'running'}
            >
              {tweakState.status === 'running' ? 'Running...' : 'Close'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default React.memo(TweakExecutionModal);
