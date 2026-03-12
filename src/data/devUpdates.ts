export interface DevUpdate {
  id: string;
  date: string;
  type: 'bug' | 'in-progress' | 'planned' | 'info';
  title: string;
  description?: string;
}

const devUpdates: DevUpdate[] = [
  {
    id: 'du-008',
    date: '2026-03-12',
    type: 'info',
    title: 'OBS Presets UI & Network Speed Improvements',
    description: 'Redesigned OBS Preset feature tags with refined styling and tighter spacing. Fixed Live Speed display to accurately show real-time network throughput instead of intermittent readings. UI enhancements across system monitoring components.',
  },
];

export default devUpdates;
