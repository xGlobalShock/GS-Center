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
    version: '1.5.0',
    date: '2026-03-28',
    highlights: 'Network Diagnoser',
    changes: [
      { type: 'new', text: 'Implemented SpeedEngine isolation to prevent background ping interference during telemetry tests.' },
      { type: 'new', text: 'Added a STOP TELEMETRY toggle with instant process termination for better resource management.' },
      { type: 'new', text: 'Automated background ping pausing during active telemetry to ensure 100% bandwidth accuracy.' },
      { type: 'fixed', text: 'Resolved "WebView not attached to DOM" crashes and ERR_FAILED errors on Speedtest.net.' },
      { type: 'improved', text: 'Enabled global ad-blocking for the telemetry session and added specialized CSS to clean TestMy.net UI.' },
      { type: 'improved', text: 'New structure / layout design of Disk Analyzer.' },
      { type: 'improved', text: 'Added a feature allowing the user to delete / rescan their Disk / file.' },
    ],
  },
  {
    version: '1.4.9',
    date: '2026-03-28',
    highlights: 'Global UI Standardization & Layout Refinement',
    changes: [
      { type: 'improved', text: 'Standardized vertical header alignment across all application modules.' },
      { type: 'improved', text: 'Compacted Performance Tweak cards for high-density information display.' },
      { type: 'fixed', text: 'Normalized Windows Debloat UI and search bar to match the Apps Manager ecosystem.' },
      { type: 'new', text: 'Added dynamic application version display to the main header.' },
    ],
  },
];

export default changelog;
