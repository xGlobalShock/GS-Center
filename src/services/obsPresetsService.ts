/**
 * OBS Presets Service
 * Handles downloading and applying OBS presets
 */

export interface ApplyPresetResult {
  success: boolean;
  message: string;
  presetId?: string;
}

/**
 * Apply an OBS preset by copying configuration to OBS config directory
 */
export const applyObsPreset = async (presetId: string): Promise<ApplyPresetResult> => {
  try {
    if (!window.electron?.ipcRenderer) {
      return {
        success: false,
        message: 'Electron IPC is not available',
      };
    }

    const result = await window.electron.ipcRenderer.invoke('obs:apply-preset', presetId);
    return result;
  } catch (error) {
    console.error(`Error applying preset ${presetId}:`, error);
    return {
      success: false,
      message: `Failed to apply preset: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};



/**
 * Launch OBS
 */
export const launchObs = async (): Promise<ApplyPresetResult> => {
  try {
    if (!window.electron?.ipcRenderer) {
      return {
        success: false,
        message: 'Electron IPC is not available',
      };
    }

    const result = await window.electron.ipcRenderer.invoke('obs:launch');
    return result;
  } catch (error) {
    console.error('Error launching OBS:', error);
    return {
      success: false,
      message: `Failed to launch OBS: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};


