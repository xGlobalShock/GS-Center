/**
 * Software Updates Module
 * winget integration for checking/applying software updates.
 */

const { ipcMain, BrowserWindow } = require('electron');
const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { execAsync } = require('./utils');
const windowManager = require('./windowManager');

let _isElevated = false;

// Software updates cache (pre-warmed during splash)
let _softwareUpdatesCache = null;
let _softwareUpdatesCacheTime = 0;
const SOFTWARE_UPDATES_CACHE_TTL = 120000; // 2 min

// Active update state
let activeUpdateProc = null;
let cancelledUpdatePids = new Set();
let updateAllCancelled = false;

// Display name lookup, populated by check-updates (keyed by lowercased id)
const _packageNames = new Map();

// Reference to appInstaller's cache invalidation (set via init)
let _invalidateInstallerCaches = null;

function init({ isElevated, invalidateInstallerCaches }) {
  _isElevated = isElevated;
  _invalidateInstallerCaches = invalidateInstallerCaches;
}

// Check for outdated apps via winget
async function _checkSoftwareUpdatesImpl() {
  let stdout = '';
  try {
    const result = await execAsync(
      'chcp 65001 >nul && winget upgrade --include-unknown --accept-source-agreements 2>nul',
      {
        timeout: 45000,
        windowsHide: true,
        encoding: 'utf8',
        shell: 'cmd.exe',
        maxBuffer: 1024 * 1024 * 5,
        env: process.env,
        cwd: process.env.SYSTEMROOT || 'C:\\Windows',
      }
    );
    stdout = result.stdout || '';
  } catch (execErr) {
    if (execErr.stdout) {
      stdout = execErr.stdout;
    } else {
      throw execErr;
    }
  }

  const lines = stdout.split('\n').map(l => {
    const parts = l.split('\r').map(p => p.trimEnd()).filter(p => p.length > 0);
    return parts.length > 0 ? parts[parts.length - 1] : '';
  }).filter(l => l.length > 0);

  const headerIdx = lines.findIndex(l => /Name\s+Id\s+Version/i.test(l));
  if (headerIdx === -1) return { success: true, packages: [], count: 0 };

  const sepIdx = lines.findIndex((l, i) => i > headerIdx && /^-{10,}/.test(l.trim()));
  if (sepIdx === -1) return { success: true, packages: [], count: 0 };

  const header = lines[headerIdx];
  const nameStart = 0;
  const idStart = header.search(/\bId\b/);
  const versionStart = header.search(/\bVersion\b/);
  const availableStart = header.search(/\bAvailable\b/);
  const sourceStart = header.search(/\bSource\b/);

  const packages = [];
  for (let i = sepIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    if (/^\d+ upgrades? available/i.test(line.trim())) break;
    if (/^The following/i.test(line.trim())) break;
    if (line.length < idStart + 3) continue;

    const name = line.substring(nameStart, idStart).trim();
    const id = line.substring(idStart, versionStart).trim();
    const rawVersion = versionStart >= 0 && availableStart >= 0
      ? line.substring(versionStart, availableStart).trim()
      : '';
    const version = rawVersion.replace(/^<\s*/, '');
    const available = availableStart >= 0 && sourceStart >= 0
      ? line.substring(availableStart, sourceStart).trim()
      : availableStart >= 0
        ? line.substring(availableStart).trim()
        : '';
    const source = sourceStart >= 0 ? line.substring(sourceStart).trim() : 'winget';

    const isUnknownVersion = rawVersion.startsWith('<');

    if (name && id && id.includes('.') && !isUnknownVersion) {
      packages.push({ name, id, version, available, source });
      _packageNames.set(id.toLowerCase(), name);
    }
  }

  return { success: true, packages, count: packages.length };
}

// Combined check: winget only
async function _checkAllUpdatesImpl() {
  const wingetResult = await _checkSoftwareUpdatesImpl();
  return { success: true, packages: wingetResult.packages, count: wingetResult.packages.length };
}

function getSoftwareUpdatesCache() {
  return { cache: _softwareUpdatesCache, cacheTime: _softwareUpdatesCacheTime };
}

function setSoftwareUpdatesCache(result) {
  _softwareUpdatesCache = result;
  _softwareUpdatesCacheTime = Date.now();
}

// Helper: follow redirects and get Content-Length via HEAD request
function headContentLength(url, redirects = 0) {
  if (redirects > 5) return Promise.resolve(0);
  const mod = url.startsWith('https') ? require('https') : require('http');
  return new Promise(resolve => {
    const req = mod.request(url, { method: 'HEAD', timeout: 8000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        resolve(headContentLength(res.headers.location, redirects + 1));
      } else {
        resolve(parseInt(res.headers['content-length'] || '0', 10));
        res.resume();
      }
    });
    req.on('error', () => resolve(0));
    req.on('timeout', () => { req.destroy(); resolve(0); });
    req.end();
  });
}

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '';
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return bytes + ' B';
}

function _invalidateCaches() {
  if (_invalidateInstallerCaches) _invalidateInstallerCaches();
}

function registerIPC() {

  ipcMain.handle('software:check-updates', async (_event, forceRefresh) => {
    if (!forceRefresh && _softwareUpdatesCache && (Date.now() - _softwareUpdatesCacheTime) < SOFTWARE_UPDATES_CACHE_TTL) {
      return _softwareUpdatesCache;
    }
    try {
      const result = await _checkAllUpdatesImpl();
      _softwareUpdatesCache = result;
      _softwareUpdatesCacheTime = Date.now();
      return result;
    } catch (error) {
      return { success: false, message: `Failed to check updates: ${error.message}`, packages: [], count: 0 };
    }
  });

  ipcMain.handle('software:get-package-size', async (_event, packageId) => {
    const cleanId = String(packageId).replace(/[^\x20-\x7E]/g, '').trim();
    try {
      const { stdout } = await execAsync(
        `chcp 65001 >nul && winget show --id ${cleanId} --accept-source-agreements 2>nul`,
        { timeout: 15000, windowsHide: true, encoding: 'utf8', shell: 'cmd.exe' }
      );
      const urlMatch = stdout.match(/Installer\s+Url:\s*(https?:\/\/\S+)/i);
      if (!urlMatch) return { id: cleanId, size: '', bytes: 0 };

      const bytes = await headContentLength(urlMatch[1].trim());
      return { id: cleanId, size: formatBytes(bytes), bytes };
    } catch (e) {
      return { id: cleanId, size: '', bytes: 0 };
    }
  });

  ipcMain.handle('software:cancel-update', async () => {
    updateAllCancelled = true;

    const win = windowManager.getMainWindow() || BrowserWindow.getAllWindows()[0];

    if (activeUpdateProc && !activeUpdateProc.killed) {
      const pid = activeUpdateProc.pid;
      cancelledUpdatePids.add(pid);
      activeUpdateProc = null;
      try {
        spawn('taskkill', ['/F', '/T', '/PID', String(pid)], { windowsHide: true });
      } catch (e) { }
      if (win && !win.isDestroyed()) {
        win.webContents.send('software:update-progress', { packageId: '__cancelled__', packageName: '', phase: 'error', status: 'Update cancelled', percent: 0 });
      }
      return { success: true };
    }
    return { success: false, message: 'No active update' };
  });

  ipcMain.handle('software:update-app', async (_event, packageId) => {
    const cleanId = String(packageId).replace(/[^\x20-\x7E]/g, '').trim();
    const win = windowManager.getMainWindow() || BrowserWindow.getAllWindows()[0];
    const packageName = _packageNames.get(cleanId.toLowerCase()) || cleanId;

    const sendProgress = (data) => {
      if (win && !win.isDestroyed()) {
        win.webContents.send('software:update-progress', { packageId: cleanId, packageName, ...data });
      }
    };

    /* Known running-process names per winget id. Squirrel/NSIS/Electron installers
       fail to replace files while the app is running, so we taskkill before upgrading. */
    const _getProcessNames = (id) => {
      const map = {
        'anthropic.claude':            ['Claude.exe', 'claude.exe'],
        'spotify.spotify':             ['Spotify.exe'],
        'discord.discord':             ['Discord.exe', 'DiscordPTB.exe', 'DiscordCanary.exe'],
        'mikrotik.winbox':             ['winbox.exe', 'winbox64.exe'],
        'mikrotik.winbox.4':           ['winbox.exe', 'winbox64.exe'],
        'telegram.telegramdesktop':    ['Telegram.exe'],
        'microsoft.visualstudiocode':  ['Code.exe'],
        'obsproject.obsstudio':        ['obs64.exe', 'obs32.exe'],
        'zoom.zoom':                   ['Zoom.exe'],
        'notion.notion':               ['Notion.exe'],
        'figma.figma':                 ['Figma.exe'],
        'slacktechnologies.slack':     ['slack.exe'],
      };
      return map[id.toLowerCase()] || null;
    };

    const _closeKnownProcesses = async (reason = 'Closing app before update...') => {
      const names = _getProcessNames(cleanId);
      if (!names || !names.length) return false;
      sendProgress({ phase: 'preparing', status: reason, percent: -1 });
      for (const name of names) {
        try { execSync(`taskkill /F /IM "${name}" /T`, { stdio: 'ignore', windowsHide: true }); } catch {}
      }
      await new Promise(r => setTimeout(r, 1500));
      return true;
    };

    /* Microsoft.Management.Deployment COM API via the bundled GsWingetProgress.exe helper.
       Emits real byte/speed/percent events. This is the only update path — no CLI fallback. */
    const resolveHelperPath = () => {
      const candidates = [
        path.resolve(__dirname, '..', 'native-winget-progress', 'bin', 'Release', 'net8.0-windows10.0.22000.0', 'win-x64', 'publish', 'GsWingetProgress.exe'),
        path.resolve(process.resourcesPath || '', 'bin', 'winget-progress', 'GsWingetProgress.exe'),
        path.resolve(process.cwd(), 'bin', 'winget-progress', 'GsWingetProgress.exe'),
      ];
      for (const p of candidates) {
        try { if (fs.existsSync(p)) return p; } catch { }
      }
      return null;
    };

    const runWingetHelper = () => new Promise((resolve) => {
      const helperPath = resolveHelperPath();
      if (!helperPath) {
        const msg = 'GsWingetProgress.exe not found — run: npm run build:winget';
        console.error(`[Software Update] ${msg}`);
        resolve({ success: false, message: msg });
        return;
      }

      console.log(`[Software Update] Spawning COM helper: ${helperPath} --id ${cleanId} --upgrade --mode silent`);
      sendProgress({ phase: 'preparing', status: 'Preparing update...', percent: 0 });

      const proc = spawn(helperPath, ['--id', cleanId, '--upgrade', '--mode', 'silent'], { windowsHide: true });
      activeUpdateProc = proc;

      let phase = 'preparing';
      let lastPct = -2;
      let lastBytes = 0;
      let lastBytesAt = 0;
      let bytesPerSec = 0;
      let lastEmitAt = 0;
      let finalResult = null;
      let finalError = null;
      let finalErrorCode = null;
      let stdoutBuf = '';
      let fullOutput = '';
      let stderrOutput = '';

      const stateToPhase = (s) => {
        const v = (s || '').toLowerCase();
        if (v === 'queued' || v === 'preparing') return 'preparing';
        if (v === 'downloading')                 return 'downloading';
        if (v === 'installing')                  return 'installing';
        if (v === 'postinstall')                 return 'installing';
        if (v === 'finished')                    return 'done';
        return phase;
      };

      const handleProgress = (data) => {
        const newPhase = stateToPhase(data.state);
        if (newPhase !== phase) {
          phase = newPhase;
          lastBytes = 0; lastBytesAt = 0; bytesPerSec = 0;
          lastPct = -2;
        }

        const bytesDownloaded = Number(data.bytesDownloaded) || 0;
        const bytesTotal      = Number(data.bytesRequired)   || 0;

        if (phase === 'downloading' && bytesDownloaded > 0) {
          const now = Date.now();
          if (lastBytesAt > 0) {
            const dt = (now - lastBytesAt) / 1000;
            const db = bytesDownloaded - lastBytes;
            if (dt >= 0.1 && db >= 0) {
              const instant = db / dt;
              bytesPerSec = bytesPerSec > 0 ? bytesPerSec * 0.6 + instant * 0.4 : instant;
            }
          }
          lastBytes = bytesDownloaded;
          lastBytesAt = now;
        }

        // Preserve negative values — the UI renders percent < 0 as an indeterminate stripe.
        const rawPct = Number(data.percent);
        const pct = !Number.isFinite(rawPct) || rawPct < 0
          ? -1
          : Math.min(100, Math.max(0, Math.round(rawPct)));
        const now = Date.now();
        if (pct === lastPct && (now - lastEmitAt) < 150) return;
        lastPct = pct;
        lastEmitAt = now;

        const statusLine =
          phase === 'downloading' ? 'Downloading' :
          phase === 'installing'  ? 'Installing'  :
          phase === 'preparing'   ? 'Preparing'   :
          phase === 'done'        ? 'Complete'    : '';

        sendProgress({
          phase,
          status: statusLine,
          percent: pct,
          bytesDownloaded: bytesDownloaded > 0 ? bytesDownloaded : undefined,
          bytesTotal:      bytesTotal > 0      ? bytesTotal      : undefined,
          bytesPerSec:     bytesPerSec > 0     ? Math.round(bytesPerSec) : undefined,
        });
      };

      const handleRecord = (obj) => {
        if (!obj || !obj.type) return;
        if (obj.type === 'error') {
          finalError = obj.message || obj.code || 'error';
          finalErrorCode = obj.code || null;
          return;
        }
        if (obj.type === 'result')   { finalResult = obj.data; return; }
        if (obj.type === 'progress') { handleProgress(obj.data || {}); return; }
      };

      proc.stdout.on('data', (chunk) => {
        const s = chunk.toString();
        fullOutput += s;
        stdoutBuf += s;
        let idx;
        while ((idx = stdoutBuf.indexOf('\n')) !== -1) {
          const line = stdoutBuf.slice(0, idx).trim();
          stdoutBuf = stdoutBuf.slice(idx + 1);
          if (!line) continue;
          if (line[0] !== '{') {
            console.log(`[Software Update][helper stdout] ${line}`);
            continue;
          }
          try { handleRecord(JSON.parse(line)); }
          catch (e) { console.log(`[Software Update][helper stdout non-JSON] ${line}`); }
        }
      });
      proc.stderr.on('data', (chunk) => {
        const s = chunk.toString();
        fullOutput += s;
        stderrOutput += s;
        s.split(/\r?\n/).filter(Boolean).forEach(line =>
          console.log(`[Software Update][helper stderr] ${line}`)
        );
      });

      const timeout = setTimeout(() => {
        console.error('[Software Update] COM helper timed out (10 min) — killing');
        try { proc.kill('SIGTERM'); } catch { }
        try { execSync(`taskkill /F /T /PID ${proc.pid}`, { stdio: 'ignore', windowsHide: true }); } catch { }
      }, 600000);

      proc.on('close', (code) => {
        clearTimeout(timeout);
        if (activeUpdateProc === proc) activeUpdateProc = null;

        if (proc.killed || cancelledUpdatePids.delete(proc.pid)) {
          sendProgress({ phase: 'error', status: 'Update cancelled', percent: 0 });
          resolve({ success: false, cancelled: true, message: 'Update cancelled' });
          return;
        }

        if (finalResult && finalResult.status === 'Ok') {
          _invalidateCaches();
          sendProgress({ phase: 'done', status: 'Update complete!', percent: 100 });
          resolve({ success: true, message: `${packageId} updated successfully` });
          return;
        }

        // Helper failed — log full output so the real cause is visible.
        console.error(
          `[Software Update] COM helper failed for ${cleanId}\n` +
          `  exit code:   ${code}\n` +
          `  error code:  ${finalErrorCode || '(none)'}\n` +
          `  error msg:   ${finalError || '(none)'}\n` +
          `  COM result:  ${finalResult ? JSON.stringify(finalResult) : '(none)'}\n` +
          `  stderr:\n${stderrOutput || '  (empty)'}\n` +
          `  stdout tail:\n${(fullOutput || '').slice(-1500)}`
        );

        const friendlyByCode = {
          NO_UPGRADE:      'No upgrade available for this package',
          NOT_FOUND:       'Package not found in the winget catalog',
          COM_UNAVAILABLE: 'Windows Package Manager COM service is unavailable',
          CATALOG_ERROR:   'Failed to connect to the winget catalog',
          BAD_ARGS:        'Helper received invalid arguments (internal bug)',
        };

        let msg;
        if (finalResult && finalResult.status === 'InstallError') {
          const rawCode = finalResult.installerErrorCode >>> 0;
          const hex = `0x${rawCode.toString(16).toUpperCase().padStart(8, '0')}`;
          // 0x80073D28 = ERROR_REMOVE_FAILED — Squirrel/NSIS couldn't replace files
          // because the target app was still running and holding file locks.
          if (rawCode === 0x80073D28 || rawCode === 0x80073CF0 || rawCode === 26) {
            msg = `Installer couldn't replace files — close the app and try again (${hex})`;
          } else {
            msg = `Installer failed (${hex}) — close the app (and any auto-launch helpers) and retry`;
          }
        } else {
          msg =
            friendlyByCode[finalErrorCode] ||
            finalError ||
            (finalResult ? `Update failed: ${finalResult.status}` : `Helper exited with code ${code}`);
        }

        resolve({
          success: false,
          message: msg,
          errorCode: finalErrorCode,
          exitCode: code,
          comStatus: finalResult ? finalResult.status : null,
          installerErrorCode: finalResult ? (finalResult.installerErrorCode >>> 0) : null,
        });
      });

      proc.on('error', (err) => {
        clearTimeout(timeout);
        console.error(`[Software Update] Failed to spawn COM helper: ${err.message}`);
        resolve({ success: false, message: `Helper spawn failed: ${err.message}` });
      });
    });

    // COM helper is the sole update path. No CLI fallback.
    // Step 1: Close known running processes (avoids file-lock errors during install).
    await _closeKnownProcesses();

    // Step 2: Run the COM helper.
    let comResult = await runWingetHelper();
    if (comResult.success || comResult.cancelled) return comResult;

    // Step 3: If install failed (typical cause: app relaunched itself or another
    // helper process was holding files), close processes again and retry once.
    const isFileLockError =
      comResult.comStatus === 'InstallError' &&
      [0x80073D28, 0x80073CF0, 26].includes(comResult.installerErrorCode);

    if (isFileLockError && _getProcessNames(cleanId)) {
      await _closeKnownProcesses('Retrying after closing app...');
      comResult = await runWingetHelper();
      if (comResult.success || comResult.cancelled) return comResult;
    }

    const finalMsg = (comResult.message || 'Update failed').substring(0, 200);
    sendProgress({ phase: 'error', status: finalMsg, percent: 0 });
    return { success: false, message: finalMsg };
  });

} // end registerIPC

module.exports = {
  init,
  checkSoftwareUpdatesImpl: _checkAllUpdatesImpl,
  getSoftwareUpdatesCache,
  setSoftwareUpdatesCache,
  registerIPC,
};
