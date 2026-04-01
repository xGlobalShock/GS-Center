const { ipcMain } = require('electron');

/**
 * AI Performance Advisor — Rule-based local analysis engine.
 * Analyzes real-time metrics + hardware info to detect bottlenecks
 * and produce actionable recommendations.
 */

function analyzeBottlenecks(stats, hardwareInfo) {
  const insights = [];
  const cpuUsage = stats?.cpu ?? 0;
  const gpuUsage = stats?.gpuUsage ?? -1;
  const ramUsage = stats?.ram ?? 0;
  const cpuTemp = stats?.temperature ?? 0;
  const gpuTemp = stats?.gpuTemp ?? -1;
  const ramTotalGB = stats?.ramTotalGB ?? (hardwareInfo?.ramTotalGB ?? 0);
  const latency = stats?.latencyMs ?? 0;
  const diskUsage = stats?.disk ?? 0;

  // ── CPU Bottleneck Detection ────────────────────────────────────────────
  if (cpuUsage > 85 && gpuUsage >= 0 && gpuUsage < 60) {
    insights.push({
      id: 'cpu-bottleneck',
      severity: 'critical',
      icon: 'cpu',
      title: 'CPU Bottleneck Detected',
      description: `Your CPU is at ${Math.round(cpuUsage)}% while GPU is only at ${Math.round(gpuUsage)}%. Your CPU is limiting GPU performance.`,
      suggestions: [
        'Close background applications (browsers, Discord, etc.)',
        'Lower CPU-intensive game settings (view distance, NPC density, physics)',
        'Enable performance tweaks in the Tweaks page',
        hardwareInfo?.cpuCores <= 6 ? 'Consider upgrading to a CPU with more cores' : null,
      ].filter(Boolean),
    });
  }

  // ── GPU Bottleneck Detection ────────────────────────────────────────────
  if (gpuUsage > 90 && cpuUsage < 50) {
    insights.push({
      id: 'gpu-bottleneck',
      severity: 'warning',
      icon: 'gpu',
      title: 'GPU Saturated',
      description: `GPU usage is at ${Math.round(gpuUsage)}% while CPU is at ${Math.round(cpuUsage)}%. Your GPU is the limiting factor.`,
      suggestions: [
        'Lower resolution or render scale',
        'Reduce graphics quality settings (shadows, anti-aliasing, ray tracing)',
        'Enable DLSS/FSR if available in your game',
        'Consider a GPU upgrade for higher performance',
      ],
    });
  }

  // ── Thermal Throttling ─────────────────────────────────────────────────
  if (cpuTemp > 85) {
    insights.push({
      id: 'cpu-thermal',
      severity: 'critical',
      icon: 'thermometer',
      title: 'CPU Overheating',
      description: `CPU temperature is ${Math.round(cpuTemp)}°C — this may cause thermal throttling and reduce performance.`,
      suggestions: [
        'Check CPU cooler mounting and thermal paste',
        'Improve case airflow (clean dust filters, add fans)',
        'Lower ambient room temperature',
        'Consider upgrading to a better CPU cooler',
      ],
    });
  }
  if (gpuTemp > 85) {
    insights.push({
      id: 'gpu-thermal',
      severity: 'warning',
      icon: 'thermometer',
      title: 'GPU Running Hot',
      description: `GPU temperature is ${Math.round(gpuTemp)}°C — performance may degrade under sustained load.`,
      suggestions: [
        'Increase GPU fan curve using MSI Afterburner',
        'Improve case airflow',
        'Clean dust from GPU heatsink',
        'Consider undervolting the GPU for cooler temps',
      ],
    });
  }

  // ── RAM Pressure ───────────────────────────────────────────────────────
  if (ramUsage > 85) {
    insights.push({
      id: 'ram-pressure',
      severity: ramUsage > 93 ? 'critical' : 'warning',
      icon: 'memory',
      title: 'High Memory Usage',
      description: `RAM usage is at ${Math.round(ramUsage)}%. System may start using swap which severely impacts gaming.`,
      suggestions: [
        'Close memory-heavy apps (Chrome tabs, video editors)',
        'Clear RAM cache from the Utilities page',
        ramTotalGB <= 16 ? 'Upgrade to 32GB RAM for modern gaming' : null,
        'Disable startup programs that consume RAM',
      ].filter(Boolean),
    });
  }

  // ── Low RAM Amount ─────────────────────────────────────────────────────
  if (ramTotalGB > 0 && ramTotalGB < 16) {
    insights.push({
      id: 'low-ram',
      severity: 'warning',
      icon: 'memory',
      title: 'Low System RAM',
      description: `Your system has ${ramTotalGB}GB RAM. Most modern games recommend 16GB minimum.`,
      suggestions: [
        'Upgrade to at least 16GB RAM',
        'Close all background apps when gaming',
        'Use lower texture settings in games',
      ],
    });
  }

  // ── Disk Space ─────────────────────────────────────────────────────────
  if (diskUsage > 90) {
    insights.push({
      id: 'disk-space',
      severity: 'warning',
      icon: 'disk',
      title: 'Low Disk Space',
      description: `Primary disk is ${Math.round(diskUsage)}% full. This can affect performance and prevent game updates.`,
      suggestions: [
        'Run the Utilities cleaner to free up space',
        'Use Space Analyzer to find large files',
        'Move games to another drive',
        'Uninstall unused applications',
      ],
    });
  }

  // ── Network Latency ────────────────────────────────────────────────────
  if (latency > 100) {
    insights.push({
      id: 'high-latency',
      severity: latency > 200 ? 'critical' : 'warning',
      icon: 'network',
      title: 'High Network Latency',
      description: `Network latency is ${Math.round(latency)}ms — this causes noticeable lag in online games.`,
      suggestions: [
        'Use a wired ethernet connection instead of WiFi',
        'Run DNS benchmark in Network Optimizer and switch to fastest DNS',
        'Close bandwidth-heavy applications (streaming, downloads)',
        'Disable Nagle algorithm for lower TCP latency',
      ],
    });
  }

  // ── All Good ───────────────────────────────────────────────────────────
  if (insights.length === 0) {
    insights.push({
      id: 'all-good',
      severity: 'good',
      icon: 'check',
      title: 'System Running Optimally',
      description: 'No performance issues detected. Your system is running well for gaming.',
      suggestions: [],
    });
  }

  return insights;
}

function generateUpgradeRecommendations(hardwareInfo) {
  const recommendations = [];

  if (!hardwareInfo) return recommendations;

  const ramGB = hardwareInfo.ramTotalGB || 0;
  if (ramGB > 0 && ramGB < 16) {
    recommendations.push({
      component: 'RAM',
      current: `${ramGB}GB`,
      recommended: '16GB or 32GB DDR4/DDR5',
      impact: 'High — eliminates memory bottlenecks in modern games',
      priority: 1,
    });
  } else if (ramGB === 16) {
    recommendations.push({
      component: 'RAM',
      current: `${ramGB}GB`,
      recommended: '32GB DDR4/DDR5',
      impact: 'Medium — helps with streaming, multitasking while gaming',
      priority: 3,
    });
  }

  const diskType = (hardwareInfo.diskType || '').toUpperCase();
  if (diskType === 'HDD' || diskType.includes('HDD')) {
    recommendations.push({
      component: 'Storage',
      current: `HDD (${hardwareInfo.diskName || 'Unknown'})`,
      recommended: 'NVMe SSD (e.g., Samsung 980 Pro, WD SN850X)',
      impact: 'Very High — dramatically improves load times and texture streaming',
      priority: 1,
    });
  }

  return recommendations;
}

function registerIPC() {
  ipcMain.handle('advisor:analyze', async (_event, stats, hardwareInfo) => {
    const insights = analyzeBottlenecks(stats, hardwareInfo);
    const upgrades = generateUpgradeRecommendations(hardwareInfo);
    return { insights, upgrades };
  });
}

module.exports = { registerIPC };
