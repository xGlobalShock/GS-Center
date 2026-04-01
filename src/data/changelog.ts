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
    version: '1.6.1',
    date: '2026-04-01',
    highlights: 'Splash Screen Overhaul — LHM-Powered Hardware Discovery',
    changes: [
      { type: 'new', text: 'Splash screen now uses LHM for HW detection instead of PS WMI queries, dramatically reducing load time.' },
      { type: 'new', text: 'Added smooth progress tickers so the progress bar never stalls or freezes during loading.' },
      { type: 'new', text: 'Added a polished fade-out animation when transitioning to the main window.' },
      { type: 'fixed', text: 'Fixed splash screen freezing at ~20% during hardware info loading.' },
      { type: 'fixed', text: 'Fixed blank gap between splash close and main window appearing.' },
      { type: 'improved', text: 'Progress bar now smoothly animates from 0% to 100% without jumps or stalls.' },
      { type: 'improved', text: 'Hardware info loads in parallel during splash, so System Details are ready on launch.' },
    ],
  },
];

export default changelog;
