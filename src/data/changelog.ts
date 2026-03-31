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
    version: '1.5.8',
    date: '2026-03-31',
    highlights: 'Cleanup Toolkit - Clear All Cache Feature',
    changes: [
      { type: 'new', text: 'Enhanced the "Cleanup Toolkit" with a new "Clear All Cache" feature, allowing users to quickly remove all cached data for improved performance.' },
      { type: 'improved', text: 'Optimized the cache clearing algorithm for faster execution and reduced resource usage during the cleanup process.' },
      { type: 'improved', text: 'Updated the user interface for the "Clear All Cache" feature to provide clearer feedback on the progress and completion of the cache clearing operation.' },
    ],
  },
  {
    version: '1.5.7',
    date: '2026-03-30',
    highlights: 'PC Tweaks - Description Updates', 
    changes: [
      { type: 'improved', text: 'Updated descriptions for various PC tweaks to provide clearer explanations and usage guidance.' },
      { type: 'fixed', text: 'Fixed a bug causing incorrect tweak status display in certain scenarios.' },
    ],  
  },
];

export default changelog;
