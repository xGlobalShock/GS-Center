module.exports = {
  "WPFTweaksDisableStoreSearch": {
    "Content": "Disable Microsoft Store search results",
    "Description": "Will not display recommended Microsoft Store apps when searching for apps in the Start menu.",
    "category": "Essential Tweaks",
    "panel": "1",
    "InvokeScript": [
      "icacls \"$Env:LocalAppData\\Packages\\Microsoft.WindowsStore_8wekyb3d8bbwe\\LocalState\\store.db\" /deny Everyone:F"
    ],
    "UndoScript": [
      "icacls \"$Env:LocalAppData\\Packages\\Microsoft.WindowsStore_8wekyb3d8bbwe\\LocalState\\store.db\" /grant Everyone:F"
    ],
    "link": "https://winutil.christitus.com/dev/tweaks/essential-tweaks/disablestoresearch"
  },
  "WPFTweaksEndTaskOnTaskbar": {
    "Content": "Enable End Task With Right Click",
    "Description": "Enables option to end task when right clicking a program in the taskbar.",
    "category": "Essential Tweaks",
    "panel": "1",
    "registry": [
      {
        "Path": "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced\\TaskbarDeveloperSettings",
        "Name": "TaskbarEndTask",
        "Value": "1",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      }
    ],
    "link": "https://winutil.christitus.com/dev/tweaks/essential-tweaks/endtaskontaskbar"
  },
  "WPFTweaksLocation": {
    "Content": "Disable Location Tracking",
    "Description": "Disables Location Tracking.",
    "category": "Essential Tweaks",
    "panel": "1",
    "service": [
      {
        "Name": "lfsvc",
        "StartupType": "Disable",
        "OriginalType": "Manual"
      }
    ],
    "registry": [
      {
        "Path": "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location",
        "Name": "Value",
        "Value": "Deny",
        "Type": "String",
        "OriginalValue": "Allow"
      },
      {
        "Path": "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Sensor\\Overrides\\{BFA794E4-F964-4FDB-90F6-51056BFE4B44}",
        "Name": "SensorPermissionState",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "1"
      },
      {
        "Path": "HKLM:\\SYSTEM\\Maps",
        "Name": "AutoUpdateEnabled",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "1"
      }
    ],
    "link": "https://winutil.christitus.com/dev/tweaks/essential-tweaks/location"
  },
  "WPFTweaksWidget": {
    "Content": "Remove Widgets",
    "Description": "Removes the annoying widgets in the bottom left of the Taskbar.",
    "category": "Essential Tweaks",
    "panel": "1",
    "InvokeScript": [
      "\r\n      # Sometimes if you dont stop the Widgets process the removal may fail\r\n\r\n      Get-Process *Widget* | Stop-Process\r\n      Get-AppxPackage Microsoft.WidgetsPlatformRuntime -AllUsers | Remove-AppxPackage -AllUsers\r\n      Get-AppxPackage MicrosoftWindows.Client.WebExperience -AllUsers | Remove-AppxPackage -AllUsers\r\n\r\n      Invoke-WinUtilExplorerUpdate -action \"restart\"\r\n      Write-Host \"Removed widgets\"\r\n      "
    ],
    "UndoScript": [
      "\r\n      Write-Host \"Restoring widgets AppxPackages\"\r\n\r\n      Add-AppxPackage -Register \"C:\\Program Files\\WindowsApps\\Microsoft.WidgetsPlatformRuntime*\\AppxManifest.xml\" -DisableDevelopmentMode\r\n      Add-AppxPackage -Register \"C:\\Program Files\\WindowsApps\\MicrosoftWindows.Client.WebExperience*\\AppxManifest.xml\" -DisableDevelopmentMode\r\n\r\n      Invoke-WinUtilExplorerUpdate -action \"restart\"\r\n      "
    ],
    "link": "https://winutil.christitus.com/dev/tweaks/essential-tweaks/widget"
  },
  "WPFTweaksRestorePoint": {
    "Content": "Create Restore Point",
    "Description": "Creates a restore point at runtime in case a revert is needed from WinUtil modifications.",
    "category": "Essential Tweaks",
    "panel": "1",
    "Checked": "False",
    "registry": [
      {
        "Path": "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore",
        "Name": "SystemRestorePointCreationFrequency",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "1440"
      }
    ],
    "InvokeScript": [
      "\r\n      if (-not (Get-ComputerRestorePoint)) {\r\n          Enable-ComputerRestore -Drive $Env:SystemDrive\r\n      }\r\n\r\n      Checkpoint-Computer -Description \"System Restore Point created by WinUtil\" -RestorePointType MODIFY_SETTINGS\r\n      Write-Host \"System Restore Point Created Successfully\" -ForegroundColor Green\r\n      "
    ],
    "link": "https://winutil.christitus.com/dev/tweaks/essential-tweaks/restorepoint"
  },
  "WPFTweaksConsumerFeatures": {
    "Content": "Disable ConsumerFeatures",
    "Description": "Windows will not automatically install any games, third-party apps, or application links from the Windows Store for the signed-in user. Some default Apps will be inaccessible (eg. Phone Link).",
    "category": "Essential Tweaks",
    "panel": "1",
    "registry": [
      {
        "Path": "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\CloudContent",
        "Name": "DisableWindowsConsumerFeatures",
        "Value": "1",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      }
    ],
    "link": "https://winutil.christitus.com/dev/tweaks/essential-tweaks/consumerfeatures"
  },
  "WPFTweaksHiber": {
    "Content": "Disable Hibernation",
    "Description": "Hibernation is really meant for laptops as it saves what's in memory before turning the PC off. It really should never be used.",
    "category": "Essential Tweaks",
    "panel": "1",
    "registry": [
      {
        "Path": "HKLM:\\System\\CurrentControlSet\\Control\\Session Manager\\Power",
        "Name": "HibernateEnabled",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "1"
      },
      {
        "Path": "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\FlyoutMenuSettings",
        "Name": "ShowHibernateOption",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "1"
      }
    ],
    "InvokeScript": [
      "powercfg.exe /hibernate off"
    ],
    "UndoScript": [
      "powercfg.exe /hibernate on"
    ],
    "link": "https://winutil.christitus.com/dev/tweaks/essential-tweaks/hiber"
  },
  "WPFTweaksPowershell7Tele": {
    "Content": "Disable PowerShell 7 Telemetry",
    "Description": "Creates an Environment Variable called 'POWERSHELL_TELEMETRY_OPTOUT' with a value of '1' which will tell PowerShell 7 to not send Telemetry Data.",
    "category": "Essential Tweaks",
    "panel": "1",
    "InvokeScript": [
      "[Environment]::SetEnvironmentVariable('POWERSHELL_TELEMETRY_OPTOUT', '1', 'Machine')"
    ],
    "UndoScript": [
      "[Environment]::SetEnvironmentVariable('POWERSHELL_TELEMETRY_OPTOUT', '', 'Machine')"
    ],
    "link": "https://winutil.christitus.com/dev/tweaks/essential-tweaks/powershell7tele"
  },
  "WPFTweaksServices": {
    "Content": "Set Services to Manual",
    "Description": "Turns a bunch of system services to manual that don't need to be running all the time. This is pretty harmless as if the service is needed, it will simply start on demand.",
    "category": "Essential Tweaks",
    "panel": "1",
    "service": [
      {
        "Name": "ALG",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "AppMgmt",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "AppReadiness",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "AppVClient",
        "StartupType": "Disabled",
        "OriginalType": "Disabled"
      },
      {
        "Name": "Appinfo",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "AssignedAccessManagerSvc",
        "StartupType": "Disabled",
        "OriginalType": "Manual"
      },
      {
        "Name": "AudioEndpointBuilder",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "AudioSrv",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "Audiosrv",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "AxInstSV",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "BDESVC",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "BITS",
        "StartupType": "AutomaticDelayedStart",
        "OriginalType": "Automatic"
      },
      {
        "Name": "BTAGService",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "BthAvctpSvc",
        "StartupType": "Automatic",
        "OriginalType": "Manual"
      },
      {
        "Name": "CDPSvc",
        "StartupType": "Manual",
        "OriginalType": "Automatic"
      },
      {
        "Name": "COMSysApp",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "CertPropSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "CryptSvc",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "CscService",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "DPS",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "DevQueryBroker",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "DeviceAssociationService",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "DeviceInstall",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "Dhcp",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "DiagTrack",
        "StartupType": "Disabled",
        "OriginalType": "Automatic"
      },
      {
        "Name": "DialogBlockingService",
        "StartupType": "Disabled",
        "OriginalType": "Disabled"
      },
      {
        "Name": "DispBrokerDesktopSvc",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "DisplayEnhancementService",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "EFS",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "EapHost",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "EventLog",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "EventSystem",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "FDResPub",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "FontCache",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "FrameServer",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "FrameServerMonitor",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "GraphicsPerfSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "HvHost",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "IKEEXT",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "InstallService",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "InventorySvc",
        "StartupType": "Manual",
        "OriginalType": "Automatic"
      },
      {
        "Name": "IpxlatCfgSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "KeyIso",
        "StartupType": "Automatic",
        "OriginalType": "Manual"
      },
      {
        "Name": "KtmRm",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "LanmanServer",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "LanmanWorkstation",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "LicenseManager",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "LxpSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "MSDTC",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "MSiSCSI",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "MapsBroker",
        "StartupType": "AutomaticDelayedStart",
        "OriginalType": "Automatic"
      },
      {
        "Name": "McpManagementService",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "MicrosoftEdgeElevationService",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "NaturalAuthentication",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "NcaSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "NcbService",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "NcdAutoSetup",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "NetSetupSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "NetTcpPortSharing",
        "StartupType": "Disabled",
        "OriginalType": "Disabled"
      },
      {
        "Name": "Netman",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "NlaSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "PcaSvc",
        "StartupType": "Manual",
        "OriginalType": "Automatic"
      },
      {
        "Name": "PeerDistSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "PerfHost",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "PhoneSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "PlugPlay",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "PolicyAgent",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "Power",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "PrintNotify",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "ProfSvc",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "PushToInstall",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "QWAVE",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "RasAuto",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "RasMan",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "RemoteAccess",
        "StartupType": "Disabled",
        "OriginalType": "Disabled"
      },
      {
        "Name": "RemoteRegistry",
        "StartupType": "Disabled",
        "OriginalType": "Disabled"
      },
      {
        "Name": "RetailDemo",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "RmSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "RpcLocator",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "SCPolicySvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "SCardSvr",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "SDRSVC",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "SEMgrSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "SENS",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "SNMPTRAP",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "SNMPTrap",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "SSDPSRV",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "SamSs",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "ScDeviceEnum",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "SensorDataService",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "SensorService",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "SensrSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "SessionEnv",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "SharedAccess",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "ShellHWDetection",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "SmsRouter",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "Spooler",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "SstpSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "StiSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "StorSvc",
        "StartupType": "Manual",
        "OriginalType": "Automatic"
      },
      {
        "Name": "SysMain",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "TapiSrv",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "TermService",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "Themes",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "TieringEngineService",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "TokenBroker",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "TrkWks",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "TroubleshootingSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "TrustedInstaller",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "UevAgentService",
        "StartupType": "Disabled",
        "OriginalType": "Disabled"
      },
      {
        "Name": "UmRdpService",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "UserManager",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "UsoSvc",
        "StartupType": "Manual",
        "OriginalType": "Automatic"
      },
      {
        "Name": "VSS",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "VaultSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "W32Time",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "WEPHOSTSVC",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "WFDSConMgrSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "WMPNetworkSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "WManSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "WPDBusEnum",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "WSAIFabricSvc",
        "StartupType": "Manual",
        "OriginalType": "Automatic"
      },
      {
        "Name": "WSearch",
        "StartupType": "AutomaticDelayedStart",
        "OriginalType": "Automatic"
      },
      {
        "Name": "WalletService",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "WarpJITSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "WbioSrvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "Wcmsvc",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "WdiServiceHost",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "WdiSystemHost",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "WebClient",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "Wecsvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "WerSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "WiaRpc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "WinRM",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "Winmgmt",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "WpcMonSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "WpnService",
        "StartupType": "Manual",
        "OriginalType": "Automatic"
      },
      {
        "Name": "XblAuthManager",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "XblGameSave",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "XboxGipSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "XboxNetApiSvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "autotimesvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "bthserv",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "camsvc",
        "StartupType": "Manual",
        "OriginalType": "Automatic"
      },
      {
        "Name": "cloudidsvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "dcsvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "defragsvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "diagsvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "dmwappushservice",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "dot3svc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "edgeupdate",
        "StartupType": "Manual",
        "OriginalType": "Automatic"
      },
      {
        "Name": "edgeupdatem",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "fdPHost",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "fhsvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "hidserv",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "icssvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "iphlpsvc",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "lfsvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "lltdsvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "lmhosts",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "netprofm",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "nsi",
        "StartupType": "Automatic",
        "OriginalType": "Automatic"
      },
      {
        "Name": "perceptionsimulation",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "pla",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "seclogon",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "shpamsvc",
        "StartupType": "Disabled",
        "OriginalType": "Disabled"
      },
      {
        "Name": "smphost",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "ssh-agent",
        "StartupType": "Disabled",
        "OriginalType": "Disabled"
      },
      {
        "Name": "svsvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "swprv",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "tzautoupdate",
        "StartupType": "Disabled",
        "OriginalType": "Disabled"
      },
      {
        "Name": "upnphost",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "vds",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "vmicguestinterface",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "vmicheartbeat",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "vmickvpexchange",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "vmicrdv",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "vmicshutdown",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "vmictimesync",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "vmicvmsession",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "vmicvss",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "wbengine",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "wcncsvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "webthreatdefsvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "wercplsupport",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "wisvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "wlidsvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "wlpasvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "wmiApSrv",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "workfolderssvc",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      },
      {
        "Name": "wuauserv",
        "StartupType": "Manual",
        "OriginalType": "Manual"
      }
    ],
    "link": "https://winutil.christitus.com/dev/tweaks/essential-tweaks/services"
  },
  "WPFTweaksTelemetry": {
    "Content": "Disable Telemetry",
    "Description": "Disables Microsoft Telemetry.",
    "category": "Essential Tweaks",
    "panel": "1",
    "registry": [
      {
        "Path": "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo",
        "Name": "Enabled",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      },
      {
        "Path": "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Privacy",
        "Name": "TailoredExperiencesWithDiagnosticDataEnabled",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      },
      {
        "Path": "HKCU:\\Software\\Microsoft\\Speech_OneCore\\Settings\\OnlineSpeechPrivacy",
        "Name": "HasAccepted",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      },
      {
        "Path": "HKCU:\\Software\\Microsoft\\Input\\TIPC",
        "Name": "Enabled",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      },
      {
        "Path": "HKCU:\\Software\\Microsoft\\InputPersonalization",
        "Name": "RestrictImplicitInkCollection",
        "Value": "1",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      },
      {
        "Path": "HKCU:\\Software\\Microsoft\\InputPersonalization",
        "Name": "RestrictImplicitTextCollection",
        "Value": "1",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      },
      {
        "Path": "HKCU:\\Software\\Microsoft\\InputPersonalization\\TrainedDataStore",
        "Name": "HarvestContacts",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      },
      {
        "Path": "HKCU:\\Software\\Microsoft\\Personalization\\Settings",
        "Name": "AcceptedPrivacyPolicy",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      },
      {
        "Path": "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\DataCollection",
        "Name": "AllowTelemetry",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      },
      {
        "Path": "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced",
        "Name": "Start_TrackProgs",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      },
      {
        "Path": "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\System",
        "Name": "PublishUserActivities",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      },
      {
        "Path": "HKCU:\\Software\\Microsoft\\Siuf\\Rules",
        "Name": "NumberOfSIUFInPeriod",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      }
    ],
    "InvokeScript": [
      "\r\n      # Disable Defender Auto Sample Submission\r\n      Set-MpPreference -SubmitSamplesConsent 2\r\n\r\n      # Disable (Connected User Experiences and Telemetry) Service\r\n      Set-Service -Name diagtrack -StartupType Disabled\r\n\r\n      # Disable (Windows Error Reporting Manager) Service\r\n      Set-Service -Name wermgr -StartupType Disabled\r\n\r\n      $Memory = (Get-CimInstance Win32_PhysicalMemory | Measure-Object Capacity -Sum).Sum / 1KB\r\n      Set-ItemProperty -Path \"HKLM:\\SYSTEM\\CurrentControlSet\\Control\" -Name SvcHostSplitThresholdInKB -Value $Memory\r\n\r\n      Remove-ItemProperty -Path \"HKCU:\\Software\\Microsoft\\Siuf\\Rules\" -Name PeriodInNanoSeconds\r\n      "
    ],
    "UndoScript": [
      "\r\n      # Enable Defender Auto Sample Submission\r\n      Set-MpPreference -SubmitSamplesConsent 1\r\n\r\n      # Enable (Connected User Experiences and Telemetry) Service\r\n      Set-Service -Name diagtrack -StartupType Automatic\r\n\r\n      # Enable (Windows Error Reporting Manager) Service\r\n      Set-Service -Name wermgr -StartupType Automatic\r\n      "
    ],
    "link": "https://winutil.christitus.com/dev/tweaks/essential-tweaks/telemetry"
  },
  "WPFTweaksDeleteTempFiles": {
    "Content": "Delete Temporary Files",
    "Description": "Erases TEMP Folders.",
    "category": "Essential Tweaks",
    "panel": "1",
    "InvokeScript": [
      "\r\n      Remove-Item -Path \"$Env:Temp\\*\" -Recurse -Force\r\n      Remove-Item -Path \"$Env:SystemRoot\\Temp\\*\" -Recurse -Force\r\n      "
    ],
    "link": "https://winutil.christitus.com/dev/tweaks/essential-tweaks/deletetempfiles"
  },
  "WPFTweaksActivity": {
    "Content": "Disable Activity History",
    "Description": "Erases recent docs, clipboard, and run history.",
    "category": "Essential Tweaks",
    "panel": "1",
    "registry": [
      {
        "Path": "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\System",
        "Name": "EnableActivityFeed",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      },
      {
        "Path": "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\System",
        "Name": "PublishUserActivities",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      },
      {
        "Path": "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\System",
        "Name": "UploadUserActivities",
        "Value": "0",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      }
    ],
    "link": "https://winutil.christitus.com/dev/tweaks/essential-tweaks/activity"
  },
  "WPFTweaksWPBT": {
    "Content": "Disable Windows Platform Binary Table (WPBT)",
    "Description": "If enabled, WPBT allows your computer vendor to execute programs at boot time, such as anti-theft software, software drivers, as well as force install software without user consent. Poses potential security risk.",
    "category": "Essential Tweaks",
    "panel": "1",
    "registry": [
      {
        "Path": "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager",
        "Name": "DisableWpbtExecution",
        "Value": "1",
        "Type": "DWord",
        "OriginalValue": "<RemoveEntry>"
      }
    ],
    "link": "https://winutil.christitus.com/dev/tweaks/essential-tweaks/wpbt"
  },
  "WPFTweaksDisableExplorerAutoDiscovery": {
    "Content": "Disable Explorer Automatic Folder Discovery",
    "Description": "Windows Explorer automatically tries to guess the type of the folder based on its contents, slowing down the browsing experience. WARNING! Will disable File Explorer grouping.",
    "category": "Essential Tweaks",
    "panel": "1",
    "InvokeScript": [
      "\r\n      # Previously detected folders\r\n      $bags = \"HKCU:\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\Bags\"\r\n\r\n      # Folder types lookup table\r\n      $bagMRU = \"HKCU:\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\BagMRU\"\r\n\r\n      # Flush Explorer view database\r\n      Remove-Item -Path $bags -Recurse -Force\r\n      Write-Host \"Removed $bags\"\r\n\r\n      Remove-Item -Path $bagMRU -Recurse -Force\r\n      Write-Host \"Removed $bagMRU\"\r\n\r\n      # Every folder\r\n      $allFolders = \"HKCU:\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\Bags\\AllFolders\\Shell\"\r\n\r\n      if (!(Test-Path $allFolders)) {\r\n        New-Item -Path $allFolders -Force\r\n        Write-Host \"Created $allFolders\"\r\n      }\r\n\r\n      # Generic view\r\n      New-ItemProperty -Path $allFolders -Name \"FolderType\" -Value \"NotSpecified\" -PropertyType String -Force\r\n      Write-Host \"Set FolderType to NotSpecified\"\r\n\r\n      Write-Host Please sign out and back in, or restart your computer to apply the changes!\r\n      "
    ],
    "UndoScript": [
      "\r\n      # Previously detected folders\r\n      $bags = \"HKCU:\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\Bags\"\r\n\r\n      # Folder types lookup table\r\n      $bagMRU = \"HKCU:\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\BagMRU\"\r\n\r\n      # Flush Explorer view database\r\n      Remove-Item -Path $bags -Recurse -Force\r\n      Write-Host \"Removed $bags\"\r\n\r\n      Remove-Item -Path $bagMRU -Recurse -Force\r\n      Write-Host \"Removed $bagMRU\"\r\n\r\n      Write-Host Please sign out and back in, or restart your computer to apply the changes!\r\n      "
    ],
    "link": "https://winutil.christitus.com/dev/tweaks/essential-tweaks/disableexplorerautodiscovery"
  },
  "WPFTweaksDiskCleanup": {
    "Content": "Run Disk Cleanup",
    "Description": "Runs Disk Cleanup on Drive C: and removes old Windows Updates.",
    "category": "Essential Tweaks",
    "panel": "1",
    "InvokeScript": [
      "\r\n      cleanmgr.exe /d C: /VERYLOWDISK\r\n      Dism.exe /online /Cleanup-Image /StartComponentCleanup /ResetBase\r\n      "
    ],
    "link": "https://winutil.christitus.com/dev/tweaks/essential-tweaks/diskcleanup"
  }
}
;