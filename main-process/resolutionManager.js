const { ipcMain, screen } = require('electron');
const { execFile } = require('child_process');
const path = require('path');

/**
 * Custom Resolution & Refresh Rate Manager
 *
 * Uses compiled C# helper (ResolutionHelper.exe) for Win32 display APIs:
 *   devices  — list active displays with names, adapters, current res
 *   modes [device]  — enumerate supported modes for a display
 *   set <w> <h> <hz> [device]  — apply resolution to a display
 *
 * Electron screen API supplements with human-readable labels.
 */

function getHelperPath() {
  const { app } = require('electron');
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'lib', 'ResolutionHelper.exe');
  }
  return path.join(__dirname, '..', 'lib', 'ResolutionHelper.exe');
}

function runHelper(args, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const exePath = getHelperPath();
    execFile(exePath, args, { timeout: timeoutMs, windowsHide: true, encoding: 'utf8' },
      (err, stdout) => {
        if (err && !stdout) { resolve(''); return; }
        resolve((stdout || '').trim());
      }
    );
  });
}

async function getDisplayInfo() {
  try {
    const stdout = await runHelper(['devices'], 10000);
    if (!stdout) return [];
    const devices = JSON.parse(stdout);

    // Try to enrich with Electron display labels
    const electronDisplays = screen.getAllDisplays();
    const primary = screen.getPrimaryDisplay();

    return devices.map((dev, idx) => {
      // Match by primary flag or index
      let label = '';
      if (dev.Primary && primary) {
        label = primary.label || '';
      } else {
        const ed = electronDisplays.find(d => d.id !== primary.id);
        if (ed) label = ed.label || '';
      }

      const monName = label
        || (dev.MonitorName !== 'Generic PnP Monitor' ? dev.MonitorName : '')
        || `Display ${idx + 1}`;

      return {
        DeviceName: dev.DeviceName,
        MonitorName: monName,
        Adapter: dev.Adapter,
        Width: dev.Width,
        Height: dev.Height,
        RefreshRate: dev.RefreshRate,
        Primary: dev.Primary,
      };
    });
  } catch {
    return [];
  }
}

async function getAvailableResolutions(deviceName) {
  try {
    const args = deviceName ? ['modes', deviceName] : ['modes'];
    const stdout = await runHelper(args, 15000);
    if (stdout) {
      const parsed = JSON.parse(stdout);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const mode of arr) {
        mode.RefreshRates = (mode.RefreshRates || []).filter(hz => hz >= 50);
      }
      const filtered = arr.filter(m => m.RefreshRates.length > 0);
      filtered.sort((a, b) => (b.Width * b.Height) - (a.Width * a.Height));
      if (filtered.length > 0) return filtered;
    }
  } catch {}

  // Fallback
  try {
    const p = screen.getPrimaryDisplay();
    return [{ Width: p.size.width, Height: p.size.height, RefreshRates: [p.displayFrequency || 60] }];
  } catch {
    return [{ Width: 1920, Height: 1080, RefreshRates: [60] }];
  }
}

async function setResolution(width, height, refreshRate, deviceName) {
  const w = parseInt(width), h = parseInt(height), hz = parseInt(refreshRate);
  if (!w || !h || !hz) return { success: false, result: 'BAD_PARAM' };
  try {
    const args = ['set', String(w), String(h), String(hz)];
    if (deviceName) args.push(deviceName);
    const stdout = await runHelper(args, 15000);
    const result = (stdout || '').trim();
    return { success: result === 'OK' || result === 'RESTART_REQUIRED', result: result || 'NO_OUTPUT' };
  } catch (err) {
    return { success: false, result: 'ERR', error: err.message };
  }
}

function registerIPC() {
  ipcMain.handle('resolution:get-displays', async () => getDisplayInfo());
  ipcMain.handle('resolution:get-modes', async (_e, deviceName) => getAvailableResolutions(deviceName));
  ipcMain.handle('resolution:get-current', async () => {
    try {
      const p = screen.getPrimaryDisplay();
      return { Width: p.size.width, Height: p.size.height, RefreshRate: p.displayFrequency || 60 };
    } catch {
      return { Width: 1920, Height: 1080, RefreshRate: 60 };
    }
  });
  ipcMain.handle('resolution:set', async (_e, w, h, hz, deviceName) => setResolution(w, h, hz, deviceName));
}

module.exports = { registerIPC };
