import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import '../styles/CacheCleanupToast.css';

interface Props {
  toastKey: string;
  windowsIds?: string[];
}

interface CleanResult {
  success: boolean;
  message?: string;
  spaceSaved?: string;
}

const CacheCleanupToast: React.FC<Props> = ({ toastKey, windowsIds }) => {
  const { toasts, removeToast, addToast } = useToast();
  const [toastId, setToastId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState<string | null>(null);
  const [results, setResults] = useState<Array<{ id: string; success: boolean; message?: string; spaceSaved?: string }>>([]);
  const [started, setStarted] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // mapping of utility id -> ipc channel (kept in sync with Cleaner)
  const cleanerMap: { [key: string]: string } = {
    'nvidia-cache': 'cleaner:clear-nvidia-cache',
    'apex-shaders': 'cleaner:clear-apex-shaders',
    'forza-shaders': 'cleaner:clear-forza-shaders',
    'cod-shaders': 'cleaner:clear-cod-shaders',
    'cs2-shaders': 'cleaner:clear-cs2-shaders',
    'fortnite-shaders': 'cleaner:clear-fortnite-shaders',
    'lol-shaders': 'cleaner:clear-lol-shaders',
    'overwatch-shaders': 'cleaner:clear-overwatch-shaders',
    'r6-shaders': 'cleaner:clear-r6-shaders',
    'rocket-league-shaders': 'cleaner:clear-rocket-league-shaders',
    'valorant-shaders': 'cleaner:clear-valorant-shaders',
    'temp-files': 'cleaner:clear-temp-files',
    'update-cache': 'cleaner:clear-update-cache',
    'dns-cache': 'cleaner:clear-dns-cache',
    'ram-cache': 'cleaner:clear-ram-cache',
    'recycle-bin': 'cleaner:empty-recycle-bin',
    'thumbnail-cache': 'cleaner:clear-thumbnail-cache',
    'windows-logs': 'cleaner:clear-windows-logs',
    'crash-dumps': 'cleaner:clear-crash-dumps',
    'font-cache': 'cleaner:clear-font-cache',
    'prefetch': 'cleaner:clear-prefetch',
    'memory-dumps': 'cleaner:clear-memory-dumps',
  };

  const windowsUtilityIds = useMemo(() => {
    if (windowsIds && Array.isArray(windowsIds) && windowsIds.length) return windowsIds;
    return [
      'temp-files',
      'update-cache',
      'dns-cache',
      'ram-cache',
      'recycle-bin',
      'thumbnail-cache',
      'windows-logs',
      'crash-dumps',
      // additional safe cleaners implemented in main-process (fallback)
      'prefetch',
      'font-cache',
      'memory-dumps',
    ];
  }, [windowsIds]);

  // parse human-readable size strings (e.g. "93.38 MB", "1.2 GB") to MB
  // This will scan the provided string for all occurrences like "12 MB", "1.2 GB" etc
  // and sum them. Returns null if no explicit unit-based sizes are found.
  const parseSizeToMB = (s?: string): number | null => {
    if (!s) return null;
    const text = String(s);
    const regex = /([\d,]+(?:\.\d+)?)\s*(tb|gb|mb|kb|b)\b/gi;
    let m: RegExpExecArray | null;
    let total = 0;
    let found = false;

    while ((m = regex.exec(text)) !== null) {
      const raw = (m[1] || '').replace(/,/g, '');
      const num = parseFloat(raw);
      if (Number.isNaN(num)) continue;
      found = true;
      const unit = (m[2] || '').toLowerCase();
      switch (unit) {
        case 'tb':
          total += num * 1024 * 1024; // TB -> MB
          break;
        case 'gb':
          total += num * 1024; // GB -> MB
          break;
        case 'kb':
          total += num / 1024; // KB -> MB
          break;
        case 'b':
          total += num / (1024 * 1024); // bytes -> MB
          break;
        case 'mb':
        default:
          total += num; // MB
          break;
      }
    }

    if (!found) {
      // fallback: look for patterns like "FreedMB=123" or "FreedMB:123"
      const freedMatch = text.match(/freedmb\s*[:=]?\s*([-\d,]+(?:\.\d+)?)/i);
      if (freedMatch) {
        const raw = freedMatch[1].replace(/,/g, '');
        const num = parseFloat(raw);
        if (!Number.isNaN(num)) return num; // assume MB when returned as plain number
      }
      return null;
    }

    return total;
  };

  const formatMB = (mb: number): string => {
    if (mb >= 1024 * 1024) return `${(mb / (1024 * 1024)).toFixed(2)} TB`;
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
  };

  useEffect(() => {
    // find the toast id that contains this component (by matching the toastKey prop)
    const matched = toasts.find((t) => {
      try {
        // toast.message may be a React element with props
        // @ts-ignore
        return React.isValidElement(t.message) && (t.message.props?.toastKey === toastKey);
      } catch (e) {
        return false;
      }
    });

    if (matched) setToastId(matched.id);
  }, [toasts, toastKey]);

  const close = () => {
    if (toastId) removeToast(toastId);
    // reset transient overlay state when closed
    setSummary(null);
    setStarted(false);
    setResults([]);
  };

  const runAll = async () => {
    if (running) return;
    if (!window.electron?.ipcRenderer) {
      addToast('IPC not available — cannot run cleanup', 'error');
      return;
    }

    // mark that the user started the clear-all flow so size boxes become visible
    setStarted(true);
    setRunning(true);
    setResults([]);
    setProgress(0);

    const total = windowsUtilityIds.length;
    let succeeded = 0;
    let totalSavedMB = 0; // accumulate numeric MB values from handlers
    let permissionErrorDetected = false;

    for (let i = 0; i < windowsUtilityIds.length; i++) {
      const id = windowsUtilityIds[i];
      const channel = cleanerMap[id];
      setCurrentTask(id);

      if (!channel) {
        setResults((r) => [...r, { id, success: false, message: 'No handler registered', spaceSaved: undefined }]);
        setProgress(Math.round(((i + 1) / total) * 100));
        // slight pause for UI flow
        // eslint-disable-next-line no-await-in-loop
        // @ts-ignore
        await new Promise((res) => setTimeout(res, 200));
        continue;
      }

      try {
        // call main process
        // @ts-ignore
        const res: CleanResult = await window.electron.ipcRenderer.invoke(channel);

        if (res && res.success) {
          succeeded += 1;
          if (res.spaceSaved) {
            const mb = parseSizeToMB(res.spaceSaved);
            if (mb !== null) totalSavedMB += mb;
          }
          setResults((r) => [...r, { id, success: true, message: res.message, spaceSaved: res.spaceSaved }]);
        } else {
          const msg = res?.message || 'Failed';
          setResults((r) => [...r, { id, success: false, message: msg, spaceSaved: res?.spaceSaved }]);
          if (isPermissionError(msg)) {
            permissionErrorDetected = true;
            setAdminError(msg);
          }
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err) || 'Error';
        setResults((r) => [...r, { id, success: false, message: errMsg, spaceSaved: undefined }]);
        if (isPermissionError(errMsg)) {
          permissionErrorDetected = true;
          setAdminError(errMsg);
        }
      }

      // update progress
      setProgress(Math.round(((i + 1) / total) * 100));
      // slight pause for UI flow
      // eslint-disable-next-line no-await-in-loop
      await new Promise((res) => setTimeout(res, 300));
    }

    setCurrentTask(null);
    setRunning(false);

    // show concise summary inside the overlay (instead of an external toast)
    const displayCount = total >= 8 ? 8 : total;
    const totalFreed = formatMB(totalSavedMB);

    if (succeeded === total) {
      setSummary({ type: 'success', message: `Cleared ${displayCount} Windows cache items, freed ${totalFreed}` });
    } else if (succeeded > 0) {
      setSummary({ type: 'info', message: `${succeeded}/${total} items cleared, freed ${totalFreed}` });
    } else {
      setSummary({ type: 'error', message: 'Cache cleanup failed for all items' });
    }

    // If a permission error was detected, keep the overlay open and show the banner
    // (do not show a duplicate toast since the inline banner already informs the user).
    if (!permissionErrorDetected) {
      // auto-close overlay after giving user a moment
      setTimeout(() => {
        close();
      }, 1400);
    }
  };

  // helper to copy error text to clipboard
  // copyError removed — COPY action intentionally disabled (banner-only)

  // basic permission error heuristic
  function isPermissionError(msg?: string) {
    if (!msg) return false;
    const text = String(msg).toLowerCase();
    const patterns = ['access is denied', 'administrator', 'requires elevation', 'elevat', 'eperm', 'eacces', 'permission denied', 'not enough privileges', 'privileges'];
    return patterns.some((p) => text.includes(p));
  }

  return (
    <div className="cache-cleanup-toast">
      <div className="cache-header">
        <div className="cache-title">
          <span className="cache-icon"><Trash2 size={16} /></span>
          <div>
            <div className="title-text">Cache Cleanup</div>
            <div className="subtitle">Windows Cache — quick system sweep</div>
          </div>
        </div>

        <div className="cache-actions">
          <button className="cc-close" onClick={close} title="Close">×</button>
        </div>
      </div>

      {adminError && (
        <div className="admin-error-banner" role="alert">
          <div className="banner-left"><AlertCircle size={16} /></div>
          <div className="banner-body">
            <div className="banner-title">Permission required</div>
            <div className="banner-message">{adminError}</div>
            <div className="banner-note">Restart the app as administrator and try again.</div>
          </div>
        </div>
      )}

      {summary && (
        <div className={`summary-banner ${summary.type}`} role="status">
          <div className="banner-left">{summary.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}</div>
          <div className="banner-body">
            <div className="banner-message">{summary.message}</div>
          </div>
        </div>
      )}

      <div className="cache-body">
        <div className="cache-desc">Clears temporary files, thumbnails, logs, crash dumps and more from Windows system caches.</div>

        <div className="cache-progress-wrap">
          <div className="cache-progress">
            <div className="cache-progress-bar" style={{ width: `${progress}%` }} />
            <div className="cache-progress-energy" style={{ width: `${progress}%` }} />
          </div>
          <div className="cache-progress-label">{running ? `${progress}%` : 'Idle'}</div>
        </div>

        <div className="cache-controls">
          <button className={`cc-btn cc-start ${running ? 'running' : ''}`} onClick={runAll} disabled={running}>
            {running ? (
              <>
                <Loader2 size={14} className="spin" /> Running
              </>
            ) : (
              <>
                <CheckCircle2 size={14} /> Clear All Cache
              </>
            )}
          </button>

          <button className="cc-btn cc-close-btn" onClick={close} disabled={running}>Dismiss</button>
        </div>

        <div className="cache-task-list">
          {windowsUtilityIds.map((id) => {
            const r = results.find((x) => x.id === id);
            const showSize = started && r?.success && r.spaceSaved;
            const showRunningIndicator = started && currentTask === id && running;

            return (
              <div key={id} className={`cache-task ${r ? (r.success ? 'ok' : 'fail') : ''}`}>
                <div className="task-left">
                  <div className="task-id">{id.replace(/-/g, ' ')}</div>
                </div>

                <div className="task-right">
                  {showSize ? (
                    <div className="task-size">{r!.spaceSaved}</div>
                  ) : showRunningIndicator ? (
                    <div className="task-size">...</div>
                  ) : null}
                  <div className="task-status">{r ? (r.success ? 'OK' : 'ERR') : started && currentTask === id ? '...' : 'idle'}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CacheCleanupToast;
