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
    version: '1.3.8',
    date: '2026-03-12',
    highlights: 'Modular Architecture & Codebase Cleanup',
    changes: [
      { type: 'new', text: 'Project is now open source on GitHub.' },
      { type: 'fixed', text: 'Removed deprecated cleaner utilities.' },
      { type: 'fixed', text: 'Resolved stale file references.' },
      { type: 'fixed', text: 'Resolved Dev Updates panel rendering issue.' },
      { type: 'improved', text: 'Modular backend architecture for improved stability.' },
      { type: 'improved', text: 'Reorganized project structure for cleaner code organization.' },
    ],
  },
];

export default changelog;
