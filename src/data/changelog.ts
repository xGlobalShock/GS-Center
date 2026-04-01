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
    version: '1.6.2',
    date: '2026-04-01',
    highlights: 'Splash Screen & Cache Cleanup UI Overhaul',
    changes: [
      { type: 'new', text: 'Splash screen now uses LHM for HW detection instead of PS WMI queries, dramatically reducing load time.' },
      { type: 'new', text: 'Added smooth progress tickers so the progress bar never stalls or freezes during loading.' },
      { type: 'new', text: 'Added a polished fade-out animation when transitioning to the main window.' },
      { type: 'fixed', text: 'Fixed splash screen freezing at ~20% during hardware info loading.' },
      { type: 'fixed', text: 'Fixed blank gap between splash close and main window appearing.' },
      { type: 'fixed', text: 'Fixed active task indicator visibility below cache overlay gauge.' },
      { type: 'improved', text: 'Cache cleanup overlay redesigned with 2-column grid layout — all 8 cleanup items visible without scrolling.' },
      { type: 'improved', text: 'Cache overlay progress ring optimized from 160px to 120px for better space utilization.' },
      { type: 'improved', text: 'Task rows now feature colored left-accent borders for better visual state indication.' },
      { type: 'improved', text: 'Stat boxes enhanced with gradient backgrounds and colored top borders.' },
      { type: 'improved', text: 'Queue item count styled as a professional pill badge.' },
      { type: 'improved', text: 'Proceed button updated with gradient fill and enhanced hover state.' },
      { type: 'improved', text: 'Progress bar now smoothly animates from 0% to 100% without jumps or stalls.' },
      { type: 'improved', text: 'Hardware info loads in parallel during splash, so System Details are ready on launch.' },
    ],
  },
];

export default changelog;
