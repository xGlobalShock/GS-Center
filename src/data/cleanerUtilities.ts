// lucide-react icons (used for cache utility cards)
import {
  Search,
  MousePointerClick,
  MapPin,
  LayoutGrid,
  Shield,
  Box,
  Power,
  Terminal,
  EyeOff,
  History,
  ShieldAlert,
  Database,
  Cpu,
  Trash2,
  FileText,
  Download,
  Globe,
  Folder,
  Image,
  ScrollText,
  Bug,
  DownloadCloud,
  RotateCcw,
  Wrench,
  Settings,
} from 'lucide-react';

// bring back game & nvidia asset logos
import PrefetchLogo from '../assets/Prefetch.png';
import ForzaLogo from '../assets/Forza.png';
import ApexLogo from '../assets/Apex legends.png';
import NvidiaLogo from '../assets/nvidia.png';
import CODLogo from '../assets/COD Banner.jpg';
import CS2Logo from '../assets/CS2 Banner.jpg';
import FortniteLogo from '../assets/Fortnite Banner.jpg';
import LoLLogo from '../assets/LoL Banner.jpg';
import OverwatchLogo from '../assets/Overwatch Banner.jpg';
import R6Logo from '../assets/R6 Banner.jpg';
import RocketLeagueLogo from '../assets/Rocket League Banner.jpg';
import ValorantLogo from '../assets/Valorant.jpg';

export interface CleanerUtility {
  id: string;
  title: string;
  icon: any;
  cacheType: string;
  description: string;
  buttonText: string;
  color: string;
  buttonColor: string;
}

export const cleanerUtilities: CleanerUtility[] = [
  {
    id: 'forza-shaders',
    title: 'Clear Forza Horizon 5 Shaders',
    icon: ForzaLogo,
    cacheType: 'Forza Shader Cache',
    description: 'Deletes old Forza shader cache data so the game rebuilds fresh shaders, reducing stutters and load-time hitches.',
    buttonText: 'Clear Cache',
    color: '#0074D9',
    buttonColor: '#27ae60',
  },
  {
    id: 'nvidia-cache',
    title: 'Clear NVIDIA Cache',
    icon: NvidiaLogo,
    cacheType: 'DXCache/GLCache',
    description: 'Deletes NVIDIA driver shader caches so the GPU can regenerate optimized shaders and avoid stutters in games after driver or game updates.',
    buttonText: 'Clear Cache',
    color: '#0074D9',
    buttonColor: '#00FF00',
  },
  {
    id: 'apex-shaders',
    title: 'Clear Apex Shaders',
    icon: ApexLogo,
    cacheType: 'Shader Cache',
    description: 'Removes stale shader caches in Apex Legends to force a clean rebuild and reduce potential hitching and frame drops.',
    buttonText: 'Clear Cache',
    color: '#0074D9',
    buttonColor: '#FF6B35',
  },
  {
    id: 'cod-shaders',
    title: 'Clear Call of Duty Shaders',
    icon: CODLogo,
    cacheType: 'Shader Cache',
    description: 'Deletes Call of Duty shader caches that may become corrupted and cause microstutters or low FPS spikes.',
    buttonText: 'Clear Cache',
    color: '#000000',
    buttonColor: '#27ae60',
  },
  {
    id: 'cs2-shaders',
    title: 'Clear CS2 Shaders',
    icon: CS2Logo,
    cacheType: 'Shader Cache',
    description: 'Clears Counter-Strike 2 shader cache to avoid stutter spikes after updates or driver changes.',
    buttonText: 'Clear Cache',
    color: '#1B1B1B',
    buttonColor: '#27ae60',
  },
  {
    id: 'fortnite-shaders',
    title: 'Clear Fortnite Shaders',
    icon: FortniteLogo,
    cacheType: 'Shader Cache',
    description: 'Removes aged Fortnite shader files so the game regenerates new shaders and reduces texture hitching.',
    buttonText: 'Clear Cache',
    color: '#3B82F6',
    buttonColor: '#27ae60',
  },
  {
    id: 'lol-shaders',
    title: 'Clear LoL Shaders',
    icon: LoLLogo,
    cacheType: 'Shader Cache',
    description: 'Clears League of Legends shader and texture caches to prevent visual artifacts and reduce CPU/GPU spikes.',
    buttonText: 'Clear Cache',
    color: '#0A7EBB',
    buttonColor: '#27ae60',
  },
  {
    id: 'overwatch-shaders',
    title: 'Clear Overwatch 2 Shaders',
    icon: OverwatchLogo,
    cacheType: 'Shader Cache',
    description: 'Removes Overwatch 2 shader cache so the game can recompile shaders cleanly and reduce frame stutter.',
    buttonText: 'Clear Cache',
    color: '#F4A300',
    buttonColor: '#27ae60',
  },
  {
    id: 'r6-shaders',
    title: 'Clear Rainbow Six Siege Shaders',
    icon: R6Logo,
    cacheType: 'Shader Cache',
    description: 'Purges Rainbow Six Siege shader cache to address in-game lag and rendering pauses after updates.',
    buttonText: 'Clear Cache',
    color: '#FFA500',
    buttonColor: '#27ae60',
  },
  {
    id: 'rocket-league-shaders',
    title: 'Clear Rocket League Shaders',
    icon: RocketLeagueLogo,
    cacheType: 'Shader Cache',
    description: 'Removes stale Rocket League shader cache to prevent animation stutters and texture glitches.',
    buttonText: 'Clear Cache',
    color: '#4169E1',
    buttonColor: '#27ae60',
  },
  {
    id: 'valorant-shaders',
    title: 'Clear Valorant Shaders',
    icon: ValorantLogo,
    cacheType: 'Shader Cache',
    description: 'Clears Valorant shader caches, which can grow stale and trigger slowdowns or micro-stutters during matches.',
    buttonText: 'Clear Cache',
    color: '#FF4655',
    buttonColor: '#27ae60',
  },
  {
    id: 'thumbnail-cache',
    title: 'Clear Thumbnail Cache',
    icon: Image,
    cacheType: 'Explorer Thumbnails',
    description: 'Removes outdated thumbnail preview files so Windows Explorer rebuilds them and avoids slow folder loading.',
    buttonText: 'Clear Cache',
    color: '#0074D9',
    buttonColor: '#48BFE3',
  },
  {
    id: 'windows-logs',
    title: 'Clear Windows Logs',
    icon: ScrollText,
    cacheType: 'Log Files',
    description: 'Clears accumulated Windows event logs to reclaim disk space and reduce clutter, while keeping recent logs intact.',
    buttonText: 'Clear Logs',
    color: '#0074D9',
    buttonColor: '#56CFE1',
  },
  {
    id: 'crash-dumps',
    title: 'Clear Crash Dumps',
    icon: Bug,
    cacheType: 'Crash Reports',
    description: 'Removes old crash dump files to free disk space, keep this clean unless needed for troubleshooting.',
    buttonText: 'Clear Dumps',
    color: '#0074D9',
    buttonColor: '#FF6B6B',
  },
  {
    id: 'temp-files',
    title: 'Clear Temp Files',
    icon: FileText,
    cacheType: 'Temporary Files',
    description: 'Deletes Windows temporary files that can accumulate and consume disk space, improving performance and freeing up storage.',
    buttonText: 'Clear Files',
    color: '#0074D9',
    buttonColor: '#9D4EDD',
  },
  {
    id: 'update-cache',
    title: 'Clear Update Cache',
    icon: Download,
    cacheType: 'Windows Updates',
    description: 'Clears Windows Update download cache so future patches can start fresh and avoid update errors.',
    buttonText: 'Clear Cache',
    color: '#0074D9',
    buttonColor: '#00D4FF',
  },
  {
    id: 'dns-cache',
    title: 'Clear DNS Cache',
    icon: Globe,
    cacheType: 'Network Resolver',
    description: 'Flushes DNS cache so domain lookups are re-resolved and network name changes take effect quickly.',
    buttonText: 'Clear Cache',
    color: '#0074D9',
    buttonColor: '#00A3FF',
  },
  {
    id: 'ram-cache',
    title: 'Clear RAM Cache',
    icon: Cpu, // RAM Cache: CPU/memory icon
    cacheType: 'Memory Cache',
    description: 'Purges Windows standby memory list to free physical RAM for active apps and prevent slowdowns from memory pressure.',
    buttonText: 'Clear Cache',
    color: '#0074D9',
    buttonColor: '#FF00FF',
  },
  {
    id: 'recycle-bin',
    title: 'Empty Recycle Bin',
    icon: Trash2,
    cacheType: 'Recycle Bin',
    description: 'Permanently deletes recycled files to recover disk space, make sure you no longer need deleted items before running.',
    buttonText: 'Empty Bin',
    color: '#0074D9',
    buttonColor: '#E74C3C',
  },
  {
    id: 'windows-temp',
    title: 'Clear System Temp',
    icon: Folder,
    cacheType: 'System Temp Folder',
    description: 'Clears the Windows system-wide temp folder (C:\\Windows\\Temp), which accumulates files from system processes and installers.',
    buttonText: 'Clear Temp',
    color: '#0074D9',
    buttonColor: '#7B61FF',
  },
  {
    id: 'delivery-optimization',
    title: 'Clear Delivery Optimization',
    icon: DownloadCloud,
    cacheType: 'Delivery Optimization',
    description: 'Clears the Windows Update delivery optimization cache used for peer-to-peer update sharing, freeing up disk space without affecting future updates.',
    buttonText: 'Clear Cache',
    color: '#0074D9',
    buttonColor: '#0094D4',
  },
  // Essential Tweaks
  {
    id: "ct-tweak:WPFTweaksDiskCleanup",
    title: "Run Disk Cleanup",
    icon: Database,
    cacheType: "System Tweak",
    description: "Runs Disk Cleanup on Drive C: and removes old Windows Updates.",
    buttonText: "Apply Tweak",
    color: "#3b82f6",
    buttonColor: "#2563eb"
  },
  {
    id: 'revert-startmenu',
    title: 'Revert Old Start Menu',
    icon: Settings,
    cacheType: 'Start Menu Tweak',
    description: 'Disables the newly styled Windows 11 Start Menu, reverting back to the classic layout style. This can slightly improve UI responsiveness.',
    buttonText: 'Apply Tweak',
    color: '#3b82f6',
    buttonColor: '#2563eb',
  },
  {
    id: "ct-tweak:WPFTweaksServices",
    title: "Set Services to Manual",
    icon: Wrench,
    cacheType: "System Tweak",
    description: "Turns a bunch of system services to manual that don't need to be running all the time. This is pretty harmless as if the service is needed, it will simply start on demand.",
    buttonText: "Apply Tweak",
    color: "#3b82f6",
    buttonColor: "#2563eb"
  },
  {
    id: "ct-tweak:WPFTweaksEndTaskOnTaskbar",
    title: "Enable End Task With Right Click",
    icon: MousePointerClick,
    cacheType: "System Tweak",
    description: "Enables option to end task when right clicking a program in the taskbar.",
    buttonText: "Apply Tweak",
    color: "#3b82f6",
    buttonColor: "#2563eb"
  },
  {
    id: "ct-tweak:WPFTweaksDisableStoreSearch",
    title: "Disable Microsoft Store search results",
    icon: Search,
    cacheType: "System Tweak",
    description: "Will not display recommended Microsoft Store apps when searching for apps in the Start menu.",
    buttonText: "Apply Tweak",
    color: "#3b82f6",
    buttonColor: "#2563eb"
  },
  {
    id: "ct-tweak:WPFTweaksLocation",
    title: "Disable Location Tracking",
    icon: MapPin,
    cacheType: "System Tweak",
    description: "Disables Windows location tracking and clears stored location data to protect your privacy.",
    buttonText: "Apply Tweak",
    color: "#3b82f6",
    buttonColor: "#2563eb"
  },
  {
    id: "ct-tweak:WPFTweaksWidget",
    title: "Remove Widgets",
    icon: LayoutGrid,
    cacheType: "System Tweak",
    description: "Removes the Windows 11 widgets feature, which can improve performance and reduce distractions for users who don't use it.",
    buttonText: "Apply Tweak",
    color: "#3b82f6",
    buttonColor: "#2563eb"
  },
  {
    id: "ct-tweak:WPFTweaksConsumerFeatures",
    title: "Disable ConsumerFeatures",
    icon: Box,
    cacheType: "System Tweak",
    description: "Windows will not automatically install any games, third-party apps, or application links from the Windows Store for the signed-in user. Some default Apps will be inaccessible (eg. Phone Link).",
    buttonText: "Apply Tweak",
    color: "#3b82f6",
    buttonColor: "#2563eb"
  },
  {
    id: "ct-tweak:WPFTweaksHiber",
    title: "Disable Hibernation",
    icon: Power,
    cacheType: "System Tweak",
    description: "Hibernation is really meant for laptops as it saves what's in memory before turning the PC off. It really should never be used.",
    buttonText: "Apply Tweak",
    color: "#3b82f6",
    buttonColor: "#2563eb"
  },
  {
    id: "ct-tweak:WPFTweaksPowershell7Tele",
    title: "Disable PowerShell 7 Telemetry",
    icon: Terminal,
    cacheType: "System Tweak",
    description: "Disables PowerShell 7 Telemetry, which collects anonymous usage data and sends it to Microsoft. This tweak prevents the telemetry service from running and stops data collection.",
    buttonText: "Apply Tweak",
    color: "#3b82f6",
    buttonColor: "#2563eb"
  },
  {
    id: "ct-tweak:WPFTweaksTelemetry",
    title: "Disable Telemetry",
    icon: EyeOff,
    cacheType: "System Tweak",
    description: "Disables Windows Telemetry, which collects diagnostic and usage data to send to Microsoft. This tweak turns off telemetry services and prevents data collection for improved privacy.",
    buttonText: "Apply Tweak",
    color: "#3b82f6",
    buttonColor: "#2563eb"
  },
  {
    id: "ct-tweak:WPFTweaksDeleteTempFiles",
    title: "Delete Temporary Files",
    icon: Trash2,
    cacheType: "System Tweak",
    description: "Deletes all files in the Windows Temp folder (C:\\Windows\\Temp). This folder is used by the system and applications to store temporary files, but it can accumulate a lot of junk over time. This tweak will clear out that folder to free up disk space and potentially improve performance.",
    buttonText: "Apply Tweak",
    color: "#3b82f6",
    buttonColor: "#2563eb"
  },
  {
    id: "ct-tweak:WPFTweaksActivity",
    title: "Disable Activity History",
    icon: History,
    cacheType: "System Tweak",
    description: "Deletes recent activity history, including recently opened documents, clipboard history, and run history. This can help protect your privacy by removing traces of your recent actions on the computer.",
    buttonText: "Apply Tweak",
    color: "#3b82f6",
    buttonColor: "#2563eb"
  },
  {
    id: "ct-tweak:WPFTweaksWPBT",
    title: "Disable Windows Platform Binary Table (WPBT)",
    icon: ShieldAlert,
    cacheType: "System Tweak",
    description: "If enabled, WPBT allows your computer vendor to execute programs at boot time, such as anti-theft software, software drivers, as well as force install software without user consent. Poses potential security risk.",
    buttonText: "Apply Tweak",
    color: "#3b82f6",
    buttonColor: "#2563eb"
  },
  {
    id: "ct-tweak:WPFTweaksDisableExplorerAutoDiscovery",
    title: "Disable Explorer Automatic Folder Discovery",
    icon: Search,
    cacheType: "System Tweak",
    description: "Windows Explorer automatically tries to guess the type of the folder based on its contents, slowing down the browsing experience. WARNING! Will disable File Explorer grouping.",
    buttonText: "Apply Tweak",
    color: "#3b82f6",
    buttonColor: "#2563eb"
  },
];
