import 'dart:async';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:flutter/foundation.dart';
import 'package:open_filex/open_filex.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

/// Manages the full in-app update lifecycle:
/// - Automatic background polling (every 5 minutes)
/// - Manual force-fetch (button / pull-to-refresh)
/// - Progress-tracked download with cancel support
/// - APK validation & OS-level installation
class UpdateService {
  // — Singleton ——————————————————————————————————————————
  static final UpdateService _instance = UpdateService._internal();
  factory UpdateService() => _instance;
  UpdateService._internal();

  // — Private fields —————————————————————————————————————
  final _remoteConfig = FirebaseRemoteConfig.instance;
  final _dio = Dio();
  CancelToken? _cancelToken;
  Timer? _pollingTimer;

  int _currentBuildNumber = 0;
  String _currentVersion = '1.0.0';
  String _updateUrl = '';
  String? _downloadPath;
  String _latestVersion = '';

  // — Public state notifiers ————————————————————————————
  final ValueNotifier<bool> updateAvailable = ValueNotifier(false);
  final ValueNotifier<double> downloadProgress = ValueNotifier(0.0);
  final ValueNotifier<bool> isDownloading = ValueNotifier(false);
  final ValueNotifier<bool> isReadyToInstall = ValueNotifier(false);
  final ValueNotifier<String?> downloadError = ValueNotifier(null);

  String get currentVersion => _currentVersion;
  String get latestVersion =>
      _latestVersion.isNotEmpty ? _latestVersion : 'New';

  // ═══════════════════════════════════════════════════════
  // INITIALISATION (called once on app start)
  // ═══════════════════════════════════════════════════════

  Future<void> init() async {
    try {
      final info = await PackageInfo.fromPlatform();
      _currentVersion = info.version;
      _currentBuildNumber = int.tryParse(info.buildNumber) ?? 0;

      await _remoteConfig.setConfigSettings(
        RemoteConfigSettings(
          fetchTimeout: const Duration(minutes: 1),
          minimumFetchInterval: const Duration(minutes: 5),
        ),
      );
      await _remoteConfig.setDefaults({
        'required_build_number': 0,
        'update_url': '',
        'latest_version': '',
      });

      // Run first check immediately
      await checkForUpdate();

      // Start background polling every 5 minutes
      _startPolling();
    } catch (e) {
      debugPrint('[UpdateService] Init error: $e');
    }
  }

  // ═══════════════════════════════════════════════════════
  // CORE SHARED FETCH — used by button, pull-to-refresh, timer
  // ═══════════════════════════════════════════════════════

  /// Performs an instant network fetch regardless of cache interval,
  /// compares versions, and returns true if an update is available.
  Future<bool> checkForUpdate() async {
    try {
      // Zero interval guarantees a real network call every time
      await _remoteConfig.setConfigSettings(
        RemoteConfigSettings(
          fetchTimeout: const Duration(minutes: 1),
          minimumFetchInterval: Duration.zero,
        ),
      );
      await _remoteConfig.fetchAndActivate();
      // Restore normal interval for background polling
      await _remoteConfig.setConfigSettings(
        RemoteConfigSettings(
          fetchTimeout: const Duration(minutes: 1),
          minimumFetchInterval: const Duration(minutes: 5),
        ),
      );

      final requiredBuild = _remoteConfig.getInt('required_build_number');
      _updateUrl = _remoteConfig.getString('update_url');
      _latestVersion = _remoteConfig.getString('latest_version');

      debugPrint(
        '[UpdateService] current=$_currentBuildNumber '
        'required=$requiredBuild url=$_updateUrl '
        'latestVersion=$_latestVersion',
      );

      if (requiredBuild > _currentBuildNumber && _updateUrl.isNotEmpty) {
        updateAvailable.value = true;
        return true;
      } else {
        // No update needed — clear all state
        updateAvailable.value = false;
        resetDownloadState();
        return false;
      }
    } catch (e) {
      debugPrint('[UpdateService] checkForUpdate error: $e');
      return false;
    }
  }

  // ═══════════════════════════════════════════════════════
  // BACKGROUND POLLING
  // ═══════════════════════════════════════════════════════

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(minutes: 5), (_) {
      debugPrint('[UpdateService] Background poll fired');
      checkForUpdate();
    });
  }

  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  // ═══════════════════════════════════════════════════════
  // DOWNLOAD
  // ═══════════════════════════════════════════════════════

  /// Resolves the update URL to a direct download link.
  /// Firebase Storage URLs are already direct — no processing needed.
  /// Google Drive links are handled as a legacy fallback.
  String _resolveUrl(String url) {
    // Firebase Storage URLs are direct downloads — use as-is
    if (url.contains('firebasestorage.googleapis.com') ||
        url.contains('firebasestorage.app')) {
      return url;
    }
    // Legacy Google Drive fallback: append confirm=t to bypass virus scan
    if (url.contains('drive.google.com')) {
      return url.contains('?') ? '$url&confirm=t' : '$url?confirm=t';
    }
    return url;
  }

  /// Validates that the downloaded file is actually an APK (ZIP/PK header).
  Future<bool> _validateApk(String path) async {
    try {
      final file = File(path);
      if (!await file.exists()) return false;

      final length = await file.length();
      if (length < 1000) return false; // way too small for an APK

      // APK files are ZIP archives — first two bytes should be 'PK' (0x50 0x4B)
      final bytes = await file.openRead(0, 4).expand((b) => b).toList();
      if (bytes.length >= 2 && bytes[0] == 0x50 && bytes[1] == 0x4B) {
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('[UpdateService] APK validation error: $e');
      return false;
    }
  }

  Future<void> startDownload() async {
    if (_updateUrl.isEmpty) return;

    resetDownloadState();

    if (Platform.isAndroid) {
      await Permission.storage.request();
    }

    try {
      isDownloading.value = true;
      _cancelToken = CancelToken();

      final dir =
          await getExternalStorageDirectory() ??
          await getApplicationDocumentsDirectory();
      _downloadPath = '${dir.path}/update.apk';

      // Delete old file if exists
      final oldFile = File(_downloadPath!);
      if (await oldFile.exists()) await oldFile.delete();

      final resolvedUrl = _resolveUrl(_updateUrl);

      await _dio.download(
        resolvedUrl,
        _downloadPath,
        cancelToken: _cancelToken,
        options: Options(headers: {'User-Agent': 'Mozilla/5.0'}),
        onReceiveProgress: (received, total) {
          if (total > 0) downloadProgress.value = received / total;
        },
      );

      // Validate the downloaded file is a real APK
      final isValid = await _validateApk(_downloadPath!);
      if (!isValid) {
        // Delete the corrupt file
        final file = File(_downloadPath!);
        if (await file.exists()) await file.delete();
        isDownloading.value = false;
        downloadError.value =
            'Download failed: received an invalid file. Please check the update URL.';
        debugPrint('[UpdateService] APK validation failed — not a valid APK');
        return;
      }

      isDownloading.value = false;
      isReadyToInstall.value = true;
    } on DioException catch (e) {
      isDownloading.value = false;
      if (!CancelToken.isCancel(e)) {
        downloadError.value = 'Download failed. Check your connection.';
        debugPrint('[UpdateService] Download error: $e');
      }
    } catch (e) {
      isDownloading.value = false;
      downloadError.value = 'Unexpected download error.';
      debugPrint('[UpdateService] Download error: $e');
    }
  }

  void cancelDownload() {
    _cancelToken?.cancel('User cancelled');
    resetDownloadState();
  }

  void resetDownloadState() {
    downloadProgress.value = 0.0;
    isDownloading.value = false;
    isReadyToInstall.value = false;
    downloadError.value = null;
    _cancelToken = null;
  }

  // ═══════════════════════════════════════════════════════
  // INSTALLATION
  // ═══════════════════════════════════════════════════════

  Future<void> install() async {
    if (_downloadPath == null) return;
    if (Platform.isAndroid) {
      final status = await Permission.requestInstallPackages.request();
      if (status.isPermanentlyDenied) {
        openAppSettings();
        return;
      }
    }
    try {
      await OpenFilex.open(_downloadPath!);
    } catch (e) {
      debugPrint('[UpdateService] Install error: $e');
    }
  }
}
