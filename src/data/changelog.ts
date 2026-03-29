export interface ChangelogEntry {
  version: string;
  date: string;
  highlights?: string;
  changes: {
    type: 'new' | 'improved' | 'fixed';
    text: string;
  }[];
}

const changelog: ChangelogEntry[] = [
  {
    version: '1.5.2',
    date: '2026-03-29',
    highlights: 'Network Diagnoser - Servers Bug Fix',
    changes: [
      { type: 'fixed', text: 'Fixed the issue where the Network Diagnoser was not able to ping the servers.' },
    ],
  },
  {
    version: '1.5.1',
    date: '2026-03-29',
    highlights: 'Network Diagnoser & Disk Analyzer updates',
    changes: [
      { type: 'improved', text: 'Enhanced Disk Analyzer with improved performance and user interface.' },
      { type: 'improved', text: 'Updated Network Diagnoser with more accurate diagnostics and a refreshed UI.' },
      { type: 'fixed', text: 'Resolved minor bugs in both tools for a smoother user experience.' },
      { type: 'new', text: 'Added new features to the Network Diagnoser for better network analysis.' },
      { type: 'new', text: 'Introduced new visualizations in the Disk Analyzer for easier data interpretation.' },
      { type: 'improved', text: 'Optimized resource usage in both tools for faster performance.' },
    ],
  },
];

export default changelog;
