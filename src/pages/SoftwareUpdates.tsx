import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw, Download, CheckCircle, Package, Loader2, X,
  ArrowRight, Clock, HardDrive, Zap, AlertTriangle, Activity,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useToast } from '../contexts/ToastContext';
import '../styles/SoftwareUpdates.css';
import { useAuth } from '../contexts/AuthContext';
import ProLockedWrapper from '../components/ProLockedWrapper';
import ProLineBadge from '../components/ProLineBadge';

/* ═══════════════════ Types ═══════════════════ */

interface PackageUpdate {
  name: string;
  id: string;
  version: string;
  available: string;
  source: string;
}

interface UpdateProgress {
  packageId: string;
  phase: 'preparing' | 'downloading' | 'verifying' | 'installing' | 'done' | 'error';
  status: string;
  percent: number;
  bytesDownloaded?: number;
  bytesTotal?: number;
  bytesPerSec?: number;
}

type CardState = 'idle' | 'queued' | 'updating' | 'done' | 'error';

/* ═══════════════════ Helpers ═══════════════════ */

const fmtBytes = (n?: number): string => {
  if (!n || n <= 0) return '';
  if (n >= 1073741824) return `${(n / 1073741824).toFixed(2)} GB`;
  if (n >= 1048576)    return `${(n / 1048576).toFixed(1)} MB`;
  if (n >= 1024)       return `${(n / 1024).toFixed(0)} KB`;
  return `${Math.round(n)} B`;
};

const getInitials = (name: string): string => {
  const words = name.replace(/[^A-Za-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const sizeToBytes = (s: string): number => {
  if (!s) return 0;
  const m = s.match(/([\d.]+)\s*(GB|MB|KB|B)/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const u = m[2].toUpperCase();
  return u === 'GB' ? n * 1073741824 : u === 'MB' ? n * 1048576 : u === 'KB' ? n * 1024 : n;
};

const phaseLabel = (phase: UpdateProgress['phase']): string => ({
  preparing:   'Preparing',
  downloading: 'Downloading',
  verifying:   'Verifying',
  installing:  'Installing',
  done:        'Complete',
  error:       'Failed',
}[phase] || '');

/* ═══════════════════ Component ═══════════════════ */

interface SoftwareUpdatesProps {
  isActive?: boolean;
}

const SoftwareUpdates: React.FC<SoftwareUpdatesProps> = ({ isActive = false }) => {
  const { addToast } = useToast();
  const { isPro } = useAuth();

  const [packages, setPackages] = useState<PackageUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingAll, setUpdatingAll] = useState(false);
  const [updatedIds, setUpdatedIds] = useState<Set<string>>(new Set());
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [packageSizes, setPackageSizes] = useState<Record<string, string>>({});
  const [cancelRequested, setCancelRequested] = useState(false);
  const cancelAllRef = useRef(false);
  const hasScanned = useRef(false);

  useEffect(() => {
    if (!window.electron?.ipcRenderer) return;
    const unsub = window.electron.ipcRenderer.on('software:update-progress', (data: UpdateProgress) => {
      setProgress(prev => {
        if (!prev || prev.packageId === data.packageId) return data;
        return data;
      });
    });
    return () => { if (unsub) unsub(); };
  }, []);

  const checkUpdates = useCallback(async () => {
    if (!window.electron?.ipcRenderer) {
      addToast('Electron IPC not available', 'error');
      return;
    }
    setLoading(true);
    setUpdatedIds(new Set());
    setPackages([]);
    setPackageSizes({});
    setProgress(null);
    try {
      const result = await window.electron.ipcRenderer.invoke('software:check-updates', true);
      if (result.success) {
        setPackages(result.packages);
        setPackageSizes({});
        setLastChecked(new Date().toLocaleTimeString());
        if (result.count === 0) {
          addToast('All software is up to date!', 'success');
        } else {
          addToast(`Found ${result.count} update${result.count > 1 ? 's' : ''} available`, 'info');
          (async () => {
            for (const pkg of result.packages) {
              try {
                const res: { id: string; size: string } = await window.electron.ipcRenderer.invoke('software:get-package-size', pkg.id);
                setPackageSizes(prev => ({ ...prev, [res.id]: res.size }));
              } catch {
                setPackageSizes(prev => ({ ...prev, [pkg.id]: '' }));
              }
            }
          })();
        }
      } else {
        addToast(result.message || 'Failed to check updates', 'error');
      }
    } catch (err) {
      addToast('Failed to check for updates', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (isActive && isPro && !hasScanned.current) {
      hasScanned.current = true;
      checkUpdates();
    }
  }, [isActive, isPro, checkUpdates]);

  const handleCancelUpdate = async () => {
    if (!window.electron?.ipcRenderer) return;
    setCancelRequested(true);
    cancelAllRef.current = true;
    try {
      await window.electron.ipcRenderer.invoke('software:cancel-update');
    } catch {}
  };

  const handleUpdate = async (pkg: PackageUpdate) => {
    if (!window.electron?.ipcRenderer) return;
    setUpdatingId(pkg.id);
    setProgress(null);
    setCancelRequested(false);
    cancelAllRef.current = false;
    try {
      const result = await window.electron.ipcRenderer.invoke('software:update-app', pkg.id);
      if (result.success) {
        setUpdatedIds(prev => new Set(prev).add(pkg.id));
        setTimeout(() => setPackages(prev => prev.filter(p => p.id !== pkg.id)), 2400);
      }
    } catch {
    } finally {
      setTimeout(() => setProgress(null), 3000);
      setUpdatingId(null);
      setCancelRequested(false);
    }
  };

  const handleUpdateAll = async () => {
    if (!window.electron?.ipcRenderer) return;
    setUpdatingAll(true);
    setCancelRequested(false);
    cancelAllRef.current = false;
    let successCount = 0;
    let failCount = 0;
    for (const pkg of pendingPackages) {
      if (cancelAllRef.current) break;
      setUpdatingId(pkg.id);
      setProgress(null);
      try {
        const result = await window.electron.ipcRenderer.invoke('software:update-app', pkg.id);
        if (cancelAllRef.current || result.cancelled) break;
        if (result.success) {
          successCount++;
          setUpdatedIds(prev => new Set(prev).add(pkg.id));
          setPackages(prev => prev.filter(p => p.id !== pkg.id));
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }
    setUpdatingId(null);
    setTimeout(() => setProgress(null), 3000);
    const wasCancelled = cancelAllRef.current;
    setUpdatingAll(false);
    setCancelRequested(false);
    cancelAllRef.current = false;
    if (wasCancelled) {
      addToast(`Update cancelled — ${successCount} updated before cancel`, 'info');
    } else if (failCount === 0) {
      addToast(`All ${successCount} package${successCount !== 1 ? 's' : ''} updated successfully`, 'success');
    } else if (successCount > 0) {
      addToast(`${successCount} updated, ${failCount} failed`, 'info');
    } else {
      addToast('Failed to update packages', 'error');
    }
  };

  const pendingPackages = packages.filter(p => !updatedIds.has(p.id));

  const totalSize = useMemo(() => {
    const sum = pendingPackages.reduce((acc, p) => acc + sizeToBytes(packageSizes[p.id] || ''), 0);
    return sum > 0 ? fmtBytes(sum) : null;
  }, [pendingPackages, packageSizes]);

  const deckStatus: { label: string; tone: 'idle' | 'active' | 'success' | 'warn' } =
    loading                ? { label: 'Scanning',   tone: 'active'  } :
    updatingAll            ? { label: 'Updating',   tone: 'active'  } :
    updatingId             ? { label: 'Updating',   tone: 'active'  } :
    packages.length === 0  ? { label: 'Up to date', tone: 'success' } :
                             { label: 'Ready',       tone: 'warn'    };

  return (
    <motion.div className="su" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
      <PageHeader
        icon={<Package size={16} />}
        title="Software Updates"
        lineContent={<ProLineBadge pageName="Software Updates" />}
        actions={isPro ? (
          <>
            {updatingAll ? (
              <button className="su-btn su-btn--cancel" onClick={handleCancelUpdate} disabled={cancelRequested}>
                <X size={14} />
                {cancelRequested ? 'Cancelling…' : 'Cancel All'}
              </button>
            ) : pendingPackages.length > 1 ? (
              <button className="su-btn su-btn--update-all" onClick={handleUpdateAll} disabled={updatingId !== null}>
                <Zap size={14} />
                {`Update All (${pendingPackages.length})`}
              </button>
            ) : null}
            <button className="su-btn su-btn--scan" onClick={checkUpdates} disabled={loading || updatingId !== null || updatingAll}>
              <RefreshCw size={14} className={loading ? 'su-spin' : ''} />
              {loading ? 'Scanning…' : 'Check for Updates'}
            </button>
          </>
        ) : undefined}
      />

      <ProLockedWrapper featureName="Software Updates" message="PRO Feature">

        {/* Summary deck */}
        <div className="su-deck">
          <div className="su-deck__stat">
            <span className="su-deck__label">Pending</span>
            <span className="su-deck__value">
              {pendingPackages.length}
              <span className="su-deck__unit">{pendingPackages.length === 1 ? 'update' : 'updates'}</span>
            </span>
          </div>
          <div className="su-deck__divider" />
          <div className="su-deck__stat">
            <span className="su-deck__label">Total Size</span>
            <span className="su-deck__value">{totalSize || '—'}</span>
          </div>
          <div className="su-deck__divider" />
          <div className="su-deck__stat">
            <span className="su-deck__label">Last Scanned</span>
            <span className="su-deck__value su-deck__value--sm">{lastChecked || 'Never'}</span>
          </div>
          <div className="su-deck__divider" />
          <div className="su-deck__stat">
            <span className="su-deck__label">Status</span>
            <span className={`su-deck__value su-deck__value--sm su-deck__status su-deck__status--${deckStatus.tone}`}>
              <span className="su-deck__dot" />
              {deckStatus.label}
            </span>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="su-loading">
            <Loader2 size={28} className="su-spin" />
            <p>Scanning for updates…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && packages.length === 0 && (
          <motion.div className="su-empty" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <CheckCircle size={44} />
            <h3>All Up to Date</h3>
            <p>Your installed software is on the latest version.</p>
          </motion.div>
        )}

        {/* Cards */}
        {!loading && packages.length > 0 && (
          <div className="su-cards">
            <AnimatePresence>
              {packages.map((pkg, i) => {
                const isUpdated  = updatedIds.has(pkg.id);
                const isUpdating = updatingId === pkg.id;
                const isQueued   = updatingAll && !isUpdating && !isUpdated;
                const pkgProgress = progress && progress.packageId === pkg.id ? progress : null;

                let state: CardState = 'idle';
                if (isUpdated) state = 'done';
                else if (isUpdating) state = pkgProgress?.phase === 'error' ? 'error' : 'updating';
                else if (isQueued) state = 'queued';

                const showProgress = isUpdating || (pkgProgress && (pkgProgress.phase === 'done' || pkgProgress.phase === 'error'));
                const rawPct = pkgProgress?.percent ?? 0;
                const indeterminate = rawPct < 0;
                const displayPct = indeterminate ? 0 : Math.max(0, Math.min(100, Math.round(rawPct)));

                return (
                  <motion.div
                    key={pkg.id}
                    layout
                    className={`su-card su-card--${state}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                  >
                    <span className="su-card__rail" />

                    <div className="su-card__avatar">
                      <span>{getInitials(pkg.name)}</span>
                    </div>

                    <div className="su-card__info">
                      <div className="su-card__name-row">
                        <span className="su-card__name">{pkg.name}</span>
                        <span className="su-card__id">{pkg.id}</span>
                      </div>
                      <div className="su-card__versions">
                        <span className="su-card__ver su-card__ver--old">v{pkg.version}</span>
                        <ArrowRight size={11} className="su-card__ver-arrow" />
                        <span className="su-card__ver su-card__ver--new">v{pkg.available}</span>
                      </div>
                    </div>

                    <div className="su-card__meta">
                      <span className="su-card__chip su-card__chip--size">
                        <HardDrive size={10} />
                        {packageSizes[pkg.id] === undefined
                          ? <span className="su-card__chip-loading">…</span>
                          : packageSizes[pkg.id] || '—'}
                      </span>
                      <span className="su-card__chip su-card__chip--source">{pkg.source}</span>
                    </div>

                    <div className="su-card__action">
                      {state === 'done' ? (
                        <span className="su-card__badge su-card__badge--done">
                          <CheckCircle size={14} /> Updated
                        </span>
                      ) : state === 'queued' ? (
                        <span className="su-card__badge su-card__badge--queued">
                          <Clock size={12} /> Queued
                        </span>
                      ) : state === 'updating' && !updatingAll ? (
                        <button className="su-btn su-btn--cancel" onClick={handleCancelUpdate} disabled={cancelRequested}>
                          <X size={14} /> {cancelRequested ? 'Cancelling…' : 'Cancel'}
                        </button>
                      ) : state === 'updating' && updatingAll ? (
                        <span className="su-card__badge su-card__badge--active">
                          <Activity size={12} /> Active
                        </span>
                      ) : (
                        <button
                          className="su-btn su-btn--row-update"
                          onClick={() => handleUpdate(pkg)}
                          disabled={isUpdating || updatingAll || !isPro}
                        >
                          <Download size={13} /> Update
                        </button>
                      )}
                    </div>

                    {showProgress && pkgProgress && (
                      <div className="su-card__progress">
                        <div className="su-card__pbar-wrap">
                          <div
                            className={`su-card__pbar su-card__pbar--${pkgProgress.phase}${indeterminate ? ' su-card__pbar--indeterminate' : ''}`}
                            style={{ width: indeterminate ? '100%' : `${Math.max(displayPct, 2)}%` }}
                          />
                        </div>
                        <div className="su-card__pinfo">
                          <span className={`su-card__pphase su-card__pphase--${pkgProgress.phase}`}>
                            {pkgProgress.phase === 'error' && <AlertTriangle size={11} />}
                            {phaseLabel(pkgProgress.phase)}
                          </span>
                          <span className="su-card__pstats">
                            {pkgProgress.phase === 'downloading' && pkgProgress.bytesTotal ? (
                              <>
                                {fmtBytes(pkgProgress.bytesDownloaded)}
                                <span className="su-card__psep"> / </span>
                                {fmtBytes(pkgProgress.bytesTotal)}
                                {pkgProgress.bytesPerSec ? (
                                  <>
                                    <span className="su-card__psep"> · </span>
                                    <span className="su-card__pspeed">{fmtBytes(pkgProgress.bytesPerSec)}/s</span>
                                  </>
                                ) : null}
                              </>
                            ) : (
                              pkgProgress.status
                            )}
                          </span>
                          <span className="su-card__ppct">
                            {indeterminate ? '…' : `${displayPct}%`}
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </ProLockedWrapper>
    </motion.div>
  );
};

export default React.memo(SoftwareUpdates);
