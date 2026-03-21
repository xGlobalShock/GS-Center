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
    version: '1.4.2',
    date: '2026-03-21',
    highlights: 'Benchmark and Rendering UI polish',
    changes: [
      { type: 'improved', text: 'Converted game benchmark panel to a compact right-side popover with smaller cards.' },
      { type: 'improved', text: 'Reduced FPS card dimensions and adjusted typography for better fit.' },
      { type: 'improved', text: 'Updated hardware spec row text to wrap cleanly and stay readable.' },
      { type: 'improved', text: 'Removed redundant renderer/status details from Settings rendering section.' },
    ],
  },
];

export default changelog;
