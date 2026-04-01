import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import '../styles/Settings.css';
import { loadSettings, saveSettings } from '../utils/settings';
import PageHeader from '../components/PageHeader';
import { Settings as SettingsIcon, Monitor, AlertTriangle, Layers } from 'lucide-react';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState(() => {
    const saved = loadSettings();
    return {
      autoCleanupOnStartup: saved.autoCleanupOnStartup ?? false,
      theme: saved.theme ?? 'dark',
    };
  });
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [gpuStatus, setGpuStatus] = useState<{ status: string; renderer: string; detail: string } | null>(null);

  // Overlay state
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [overlayPosition, setOverlayPosition] = useState<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'>('top-right');
  const ipc = (window as any).electron?.ipcRenderer;

  useEffect(() => {
    window.electron?.updater?.getVersion().then((v: string) => {
      if (v) setAppVersion(v);
    }).catch(() => {});

    // Fetch GPU rendering status
    (window as any).electron?.gpu?.getStatus().then((s: any) => {
      if (s) setGpuStatus(s);
    }).catch(() => {});

    const unsub = (window as any).electron?.gpu?.onStatusChanged((s: any) => {
      if (s) setGpuStatus(s);
    });

    // Load overlay state
    ipc?.invoke('overlay:get-state').then((state: any) => {
      if (state) {
        setOverlayVisible(state.visible);
        if (state.config?.position) setOverlayPosition(state.config.position);
      }
    }).catch(() => {});

    // Keep toggle in sync when the hotkey is used
    const unsubOverlay = ipc?.on?.('overlay:state-changed', (visible: boolean) => {
      setOverlayVisible(!!visible);
    });

    return () => {
      unsub?.();
      if (typeof unsubOverlay === 'function') unsubOverlay();
    };
  }, []);

  useEffect(() => {
    const s = loadSettings();
    setSettings(prev => ({ ...prev, ...s }));

    const onUpdated = (e: Event) => {
      try {
        // @ts-ignore
        const detail = (e as CustomEvent)?.detail || {};
        setSettings(prev => ({ ...prev, ...detail }));
      } catch {}
    };

    window.addEventListener('settings:updated', onUpdated as EventListener);
    return () => window.removeEventListener('settings:updated', onUpdated as EventListener);
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    saveSettings(updated as any);
  };

  const handleOverlayToggle = async () => {
    try {
      const res = await ipc?.invoke('overlay:toggle');
      if (res) setOverlayVisible(res.visible);
    } catch {}
  };

  const handleOverlayPosition = async (pos: typeof overlayPosition) => {
    setOverlayPosition(pos);
    try {
      await ipc?.invoke('overlay:set-config', { position: pos });
    } catch {}
  };

  return (
    <motion.div
      className="settings-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      <PageHeader icon={<SettingsIcon size={16} />} title="Settings" />

      <div className="settings-sections">
        <div className="settings-section">
          <h3 className="section-header">Startup</h3>

          <div className="setting-item">
            <div className="setting-label">
              <span className="label-title">Auto Cleanup Toolkit</span>
              <span className="label-description">Automatically run Windows cache cleanup each time the app launches</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={!!settings.autoCleanupOnStartup}
                onChange={() => handleToggle('autoCleanupOnStartup')}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-header">Appearance</h3>
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-title">Theme</span>
              <span className="label-description">Choose your preferred theme</span>
            </div>
            <select
              className="theme-select"
              value={settings.theme}
              onChange={(e) => setSettings(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))}
            >
              <option value="dark">Dark (Default)</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-header">Rendering</h3>
          <div className="gpu-status-card">
            <div className="gpu-status-row">
              <div className="gpu-status-icon-wrap">
                {gpuStatus?.status === 'crashed'
                  ? <AlertTriangle size={20} className="gpu-icon-crashed" />
                  : <Monitor size={20} className="gpu-icon-active" />
                }
              </div>
              <div className="gpu-status-info">
                <span className="gpu-status-label">Hardware Acceleration</span>
                <span className={`gpu-status-badge ${gpuStatus?.status === 'crashed' ? 'crashed' : 'active'}`}>
                  {gpuStatus?.status === 'crashed' ? 'Crashed' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-header">Overlay</h3>

          {/* Toggle */}
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-title">
                <Layers size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle', opacity: 0.7 }} />
                Enable FPS Overlay
              </span>
              <span className="label-description">
                Show real-time stats overlay in-game · <kbd className="overlay-hotkey">Ctrl+Shift+F</kbd>
              </span>
            </div>
            <label className="toggle-switch">
              <input type="checkbox" checked={overlayVisible} onChange={handleOverlayToggle} />
              <span className="slider"></span>
            </label>
          </div>

          {/* Position picker */}
          <div className="setting-item">
            <div className="setting-label">
              <span className="label-title">Overlay Position</span>
              <span className="label-description">Where to display the overlay on screen</span>
            </div>
            <div className="overlay-pos-grid">
              {([
                ['top-left', '↖ Top Left'],
                ['top-right', '↗ Top Right'],
                ['bottom-left', '↙ Bottom Left'],
                ['bottom-right', '↘ Bottom Right'],
              ] as const).map(([pos, label]) => (
                <button
                  key={pos}
                  className={`overlay-pos-btn${overlayPosition === pos ? ' overlay-pos-btn--active' : ''}`}
                  onClick={() => handleOverlayPosition(pos)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overlay-note">
            Works in <strong>Borderless Windowed</strong> mode. Exclusive fullscreen bypasses the compositor.
          </div>
        </div>

        <div className="settings-section">
          <h3 className="section-header">About</h3>
          <div className="about-info">
            <p><strong>GS Center</strong></p>
            <p>Version {appVersion}</p>
            <p>Advanced system optimization tool with gaming focus</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(Settings);
