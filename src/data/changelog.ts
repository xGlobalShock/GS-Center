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
    highlights: 'OBS Presets UI Refinement & Network Monitoring Fixes',
    changes: [
      { type: 'improved', text: 'Redesigned OBS Preset feature tags with refined spacing and visual hierarchy.' },
      { type: 'improved', text: 'System monitoring components typography and sizing refinements.' },
      { type: 'improved', text: 'Network stats calculation efficiency improved for consistent speed updates.' },
    ],
  },
];

export default changelog;
