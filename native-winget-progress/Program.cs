using System;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Management.Deployment;
using WinRT;

namespace GsWingetProgress;

/// <summary>
/// CLI wrapper around Microsoft.Management.Deployment (same API the Store uses).
/// Emits one JSON line per progress event to stdout so Node can parse it.
///
/// Exit codes:
///   0  = success
///   1  = install/upgrade failed (logical)
///   2  = bad arguments
///   3  = package not found / not upgradeable
///   4  = COM activation / WinGet service unavailable
/// </summary>
internal static class Program
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private static async Task<int> Main(string[] args)
    {
        Console.OutputEncoding = Encoding.UTF8;

        string? packageId = null;
        bool isInstall = false;      // default: upgrade
        string scope = "user";        // user | system | any
        string mode = "silent";       // silent | interactive | default

        for (int i = 0; i < args.Length; i++)
        {
            switch (args[i])
            {
                case "--id":
                    if (i + 1 >= args.Length) { EmitError("BAD_ARGS", "--id requires a value"); return 2; }
                    packageId = args[++i];
                    break;
                case "--install": isInstall = true; break;
                case "--upgrade": isInstall = false; break;
                case "--scope":
                    if (i + 1 >= args.Length) { EmitError("BAD_ARGS", "--scope requires a value"); return 2; }
                    scope = args[++i].ToLowerInvariant();
                    break;
                case "--mode":
                    if (i + 1 >= args.Length) { EmitError("BAD_ARGS", "--mode requires a value"); return 2; }
                    mode = args[++i].ToLowerInvariant();
                    break;
                default:
                    EmitError("BAD_ARGS", $"Unknown argument: {args[i]}");
                    return 2;
            }
        }

        if (string.IsNullOrWhiteSpace(packageId))
        {
            EmitError("BAD_ARGS", "--id is required");
            return 2;
        }

        PackageManager manager;
        try
        {
            manager = CreatePackageManager();
        }
        catch (Exception ex)
        {
            EmitError("COM_UNAVAILABLE", ex.Message);
            return 4;
        }

        // Find the package across available catalogs
        CatalogPackage? package;
        try
        {
            package = await FindPackageAsync(manager, packageId);
        }
        catch (Exception ex)
        {
            EmitError("CATALOG_ERROR", ex.Message);
            return 4;
        }

        if (package is null)
        {
            EmitError("NOT_FOUND", $"Package '{packageId}' not found in any source");
            return 3;
        }

        // Emit install-state diagnostics so the Node side can log what the COM API sees.
        Console.Error.WriteLine(
            $"[diag] id={packageId} " +
            $"installed={(package.InstalledVersion != null ? package.InstalledVersion.Version : "<none>")} " +
            $"default={(package.DefaultInstallVersion != null ? package.DefaultInstallVersion.Version : "<none>")} " +
            $"updateAvail={package.IsUpdateAvailable}");

        if (!isInstall && !package.IsUpdateAvailable)
        {
            EmitError("NO_UPGRADE", $"No upgrade available for '{packageId}' (installed version already matches latest, or installer not tracked by winget)");
            return 3;
        }

        try
        {
            return await RunOperationAsync(manager, package, isInstall, scope, mode);
        }
        catch (Exception ex)
        {
            EmitError("OPERATION_FAILED", ex.Message);
            return 1;
        }
    }

    /// <summary>
    /// Instantiates PackageManager via COM. The CsWinRT projection handles CLSID activation.
    /// </summary>
    private static PackageManager CreatePackageManager() => new PackageManager();

    private static async Task<CatalogPackage?> FindPackageAsync(PackageManager manager, string packageId)
    {
        // Composite catalog (winget + installed) so InstalledVersion / IsUpdateAvailable
        // get populated — required for UpgradePackageAsync to know the source version.
        var wingetRef = manager.GetPredefinedPackageCatalog(PredefinedPackageCatalog.OpenWindowsCatalog);

        var compositeOptions = new CreateCompositePackageCatalogOptions();
        compositeOptions.Catalogs.Add(wingetRef);
        compositeOptions.CompositeSearchBehavior = CompositeSearchBehavior.LocalCatalogs;

        var compositeRef = manager.CreateCompositePackageCatalog(compositeOptions);

        var connectResult = await compositeRef.ConnectAsync();
        if (connectResult.Status != ConnectResultStatus.Ok)
        {
            throw new InvalidOperationException($"Connect failed: {connectResult.Status}");
        }

        var catalog = connectResult.PackageCatalog;

        var findOptions = new FindPackagesOptions();
        findOptions.Selectors.Add(new PackageMatchFilter
        {
            Field  = PackageMatchField.Id,
            Option = PackageFieldMatchOption.Equals,
            Value  = packageId,
        });

        var result = await catalog.FindPackagesAsync(findOptions);
        if (result.Status != FindPackagesResultStatus.Ok)
        {
            throw new InvalidOperationException($"Find failed: {result.Status}");
        }

        if (result.Matches.Count == 0) return null;
        return result.Matches[0].CatalogPackage;
    }

    private static async Task<int> RunOperationAsync(
        PackageManager manager,
        CatalogPackage package,
        bool isInstall,
        string scope,
        string mode)
    {
        var options = new InstallOptions();
        options.PackageInstallMode = mode switch
        {
            "interactive" => PackageInstallMode.Interactive,
            "default"     => PackageInstallMode.Default,
            _             => PackageInstallMode.Silent,
        };
        options.PackageInstallScope = scope switch
        {
            "system" => PackageInstallScope.System,
            "any"    => PackageInstallScope.Any,
            _        => PackageInstallScope.User,
        };
        options.AcceptPackageAgreements = true;

        EmitProgress(new ProgressPayload
        {
            State = "preparing",
            Percent = 0,
        });

        var op = isInstall
            ? manager.InstallPackageAsync(package, options)
            : manager.UpgradePackageAsync(package, options);

        var tcs = new TaskCompletionSource<InstallResult>();

        op.Progress = (info, progress) =>
        {
            try
            {
                EmitProgress(new ProgressPayload
                {
                    State            = progress.State.ToString().ToLowerInvariant(),
                    BytesDownloaded  = progress.BytesDownloaded,
                    BytesRequired    = progress.BytesRequired,
                    DownloadProgress = progress.DownloadProgress,
                    InstallProgress  = progress.InstallationProgress,
                    Percent          = ComputePercent(progress),
                });
            }
            catch
            {
                // Never let serialization crash the operation
            }
        };

        op.Completed = (info, status) =>
        {
            try
            {
                switch (status)
                {
                    case Windows.Foundation.AsyncStatus.Completed:
                        tcs.TrySetResult(info.GetResults());
                        break;
                    case Windows.Foundation.AsyncStatus.Canceled:
                        tcs.TrySetCanceled();
                        break;
                    case Windows.Foundation.AsyncStatus.Error:
                        tcs.TrySetException(info.ErrorCode);
                        break;
                    default:
                        tcs.TrySetException(new InvalidOperationException($"Unexpected status: {status}"));
                        break;
                }
            }
            catch (Exception ex) { tcs.TrySetException(ex); }
        };

        InstallResult result;
        try
        {
            result = await tcs.Task;
        }
        catch (TaskCanceledException)
        {
            EmitError("CANCELLED", "Operation cancelled");
            return 1;
        }

        var final = new ResultPayload
        {
            Status             = result.Status.ToString(),
            RebootRequired     = result.RebootRequired,
            InstallerErrorCode = result.InstallerErrorCode,
            ExtendedErrorCode  = result.ExtendedErrorCode?.HResult ?? 0,
        };
        EmitResult(final);

        return result.Status == InstallResultStatus.Ok ? 0 : 1;
    }

    private static double ComputePercent(InstallProgress p)
    {
        // Bar mirrors the real download/install ratio. Download fills 0–100 %; once the
        // installer takes over, the UI switches to an indeterminate stripe (percent = -1)
        // because most installers don't emit granular install progress.
        return p.State switch
        {
            PackageInstallProgressState.Queued        => -1,
            PackageInstallProgressState.Downloading   => p.DownloadProgress * 100.0,
            PackageInstallProgressState.Installing    => p.InstallationProgress > 0 ? p.InstallationProgress * 100.0 : -1,
            PackageInstallProgressState.PostInstall   => -1,
            PackageInstallProgressState.Finished      => 100,
            _ => -1,
        };
    }

    /* ---------- JSON line emitters ---------- */

    private static void Emit(object payload)
    {
        var json = JsonSerializer.Serialize(payload, JsonOpts);
        Console.Out.WriteLine(json);
        Console.Out.Flush();
    }

    private static void EmitProgress(ProgressPayload p) => Emit(new { type = "progress", data = p });
    private static void EmitResult(ResultPayload r)     => Emit(new { type = "result",   data = r });
    private static void EmitError(string code, string message) => Emit(new { type = "error", code, message });

    /* ---------- payload DTOs ---------- */

    private sealed class ProgressPayload
    {
        public string State { get; set; } = "";
        public ulong  BytesDownloaded  { get; set; }
        public ulong  BytesRequired    { get; set; }
        public double DownloadProgress { get; set; }
        public double InstallProgress  { get; set; }
        public double Percent          { get; set; }
    }

    private sealed class ResultPayload
    {
        public string Status             { get; set; } = "";
        public bool   RebootRequired     { get; set; }
        public uint   InstallerErrorCode { get; set; }
        public int    ExtendedErrorCode  { get; set; }
    }
}
