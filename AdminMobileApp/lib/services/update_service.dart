import 'dart:async';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:flutter/foundation.dart';
import 'package:open_filex/open_filex.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

/// Manages the full in-app update lifecycle for Admin app:
/// - Automatic background polling (every 5 minutes)
/// - Manual force-fetch
/// - Progress-tracked download with cancel support
/// - APK validation & OS-level installation
class UpdateService {
  // — Singleton ——————————————————————————————————
  static final UpdateService _instance = UpdateService._internal();
  factory UpdateService() => _instance;
  UpdateService._internal();

  // — Private fields —————————————————————————————
  final _remoteConfig = FirebaseRemoteConfig.instance;
  final _dio = Dio();
  CancelToken? _cancelToken;
  Timer? _pollingTimer;

  int _currentBuildNumber = 0;
  String _currentVersion = '1.0.0';
  String _updateUrl = '';
  String? _downloadPath;
  String _latestVersion = '';

  // — Public state notifiers ————————————————————
  final ValueNotifier<bool> updateAvailable = ValueNotifier(false);
  final ValueNotifier<double> downloadProgress = ValueNotifier(0.0);
  final ValueNotifier<bool> isDownloading = ValueNotifier(false);
  final ValueNotifier<bool> isReadyToInstall = ValueNotifier(false);
  final ValueNotifier<String?> downloadError = ValueNotifier(null);

  String get currentVersion => _currentVersion;
  String get fullVersion => 'v$_currentVersion+$_currentBuildNumber';
  String get latestVersion =>
      _latestVersion.isNotEmpty ? _latestVersion : 'New';

  // Admin-specific Remote Config keys
  static const _keyBuildNumber = 'admin_required_build_number';
  static const _keyUpdateUrl = 'admin_update_url';
  static const _keyLatestVersion = 'admin_latest_version';

  // GitHub PAT for private release repo downloads
  static const _githubToken = 'REDACTED';

  // ═══════════════════════════════════════════════
  // INITIALISATION
  // ═══════════════════════════════════════════════

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
        _keyBuildNumber: 0,
        _keyUpdateUrl: '',
        _keyLatestVersion: '',
      });

      await checkForUpdate();
      _startPolling();
    } catch (e) {
      debugPrint('[UpdateService] Init error: $e');
    }
  }

  // ═══════════════════════════════════════════════
  // CORE CHECK
  // ═══════════════════════════════════════════════

  Future<bool> checkForUpdate() async {
    try {
      await _remoteConfig.setConfigSettings(
        RemoteConfigSettings(
          fetchTimeout: const Duration(minutes: 1),
          minimumFetchInterval: Duration.zero,
        ),
      );
      await _remoteConfig.fetchAndActivate();
      await _remoteConfig.setConfigSettings(
        RemoteConfigSettings(
          fetchTimeout: const Duration(minutes: 1),
          minimumFetchInterval: const Duration(minutes: 5),
        ),
      );

      final requiredBuild = _remoteConfig.getInt(_keyBuildNumber);
      _updateUrl = _remoteConfig.getString(_keyUpdateUrl);
      _latestVersion = _remoteConfig.getString(_keyLatestVersion);

      debugPrint(
        '[UpdateService] current=$_currentBuildNumber '
        'required=$requiredBuild url=$_updateUrl',
      );

      if (requiredBuild > _currentBuildNumber && _updateUrl.isNotEmpty) {
        updateAvailable.value = true;
        return true;
      } else {
        updateAvailable.value = false;
        resetDownloadState();
        return false;
      }
    } catch (e) {
      debugPrint('[UpdateService] checkForUpdate error: $e');
      return false;
    }
  }

  // ═══════════════════════════════════════════════
  // BACKGROUND POLLING
  // ═══════════════════════════════════════════════

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(minutes: 5), (_) {
      checkForUpdate();
    });
  }

  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  // ═══════════════════════════════════════════════
  // DOWNLOAD
  // ═══════════════════════════════════════════════

  /// Resolves download URL.
  /// For private GitHub repos, converts browser release URLs to API asset URLs
  /// so we can authenticate with the token.
  Future<String> _getFinalDownloadUrl(String url) async {
    if (url.contains('firebasestorage.googleapis.com') ||
        url.contains('firebasestorage.app')) {
      return url;
    }
    if (url.contains('drive.google.com')) {
      return url.contains('?') ? '$url&confirm=t' : '$url?confirm=t';
    }

    // GitHub Private Asset Resolution
    if (url.contains('github.com') && url.contains('/releases/download/')) {
      try {
        final uri = Uri.parse(url);
        final segments = uri.pathSegments;
        // Expected: /owner/repo/releases/download/tag/filename
        if (segments.length >= 6) {
          final owner = segments[0];
          final repo = segments[1];
          final tag = segments[4];
          final filename = segments[5];

          debugPrint('[UpdateService] Resolving asset: $owner/$repo @ $tag');

          final resp = await _dio.get(
            'https://api.github.com/repos/$owner/$repo/releases/tags/$tag',
            options: Options(
              headers: {
                'Authorization': 'Bearer $_githubToken',
                'Accept': 'application/vnd.github.v3+json',
              },
            ),
          );

          if (resp.statusCode == 200) {
            final assets = resp.data['assets'] as List;
            for (final a in assets) {
              if (a['name'] == filename) {
                final assetId = a['id'];
                return 'https://api.github.com/repos/$owner/$repo/releases/assets/$assetId';
              }
            }
          }
        }
      } catch (e) {
        debugPrint('[UpdateService] GitHub resolution error: $e');
      }
    }

    return url;
  }

  /// Builds headers for the download request.
  /// Adds GitHub token auth for private repo downloads.
  Map<String, dynamic> _downloadHeaders(String url) {
    final headers = <String, dynamic>{'User-Agent': 'GKK-Admin-App'};
    if (url.contains('api.github.com')) {
      headers['Authorization'] = 'Bearer $_githubToken';
      headers['Accept'] = 'application/octet-stream';
    }
    return headers;
  }

  Future<bool> _validateApk(String path) async {
    try {
      final file = File(path);
      if (!await file.exists()) return false;
      final length = await file.length();
      if (length < 1000) return false;
      final bytes = await file.openRead(0, 4).expand((b) => b).toList();
      if (bytes.length >= 2 && bytes[0] == 0x50 && bytes[1] == 0x4B) {
        return true;
      }
      return false;
    } catch (e) {
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
      _downloadPath = '${dir.path}/admin_update.apk';

      final oldFile = File(_downloadPath!);
      if (await oldFile.exists()) await oldFile.delete();

      final resolvedUrl = await _getFinalDownloadUrl(_updateUrl);
      var headers = _downloadHeaders(resolvedUrl);

      // Special handling for api.github.com to prevent Authorization header leak to S3
      if (resolvedUrl.contains('api.github.com')) {
        debugPrint(
          '[UpdateService] Following secure redirect for GitHub API...',
        );
        final resp = await _dio.get(
          resolvedUrl,
          options: Options(
            headers: headers,
            followRedirects: false,
            validateStatus: (status) => status != null && status < 400,
          ),
        );

        if (resp.statusCode == 302) {
          final location = resp.headers.value('location');
          if (location != null) {
            debugPrint('[UpdateService] Redirected to S3: $location');
            // Remove GitHub token for S3 download
            headers = {'User-Agent': 'GKK-Admin-App'};
            await _dio.download(
              location,
              _downloadPath,
              cancelToken: _cancelToken,
              options: Options(headers: headers),
              onReceiveProgress: (received, total) {
                if (total > 0) downloadProgress.value = received / total;
              },
            );
          }
        } else {
          throw Exception('Failed to get redirect from GitHub API');
        }
      } else {
        await _dio.download(
          resolvedUrl,
          _downloadPath,
          cancelToken: _cancelToken,
          options: Options(
            headers: headers,
            followRedirects: true,
            maxRedirects: 5,
          ),
          onReceiveProgress: (received, total) {
            if (total > 0) downloadProgress.value = received / total;
          },
        );
      }

      final isValid = await _validateApk(_downloadPath!);
      if (!isValid) {
        final file = File(_downloadPath!);
        if (await file.exists()) await file.delete();
        isDownloading.value = false;
        downloadError.value = 'Download failed: received an invalid file.';
        return;
      }

      isDownloading.value = false;
      isReadyToInstall.value = true;
    } on DioException catch (e) {
      isDownloading.value = false;
      if (!CancelToken.isCancel(e)) {
        downloadError.value = 'Download failed. Check your connection.';
      }
    } catch (e) {
      isDownloading.value = false;
      downloadError.value = 'Unexpected download error.';
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

  // ═══════════════════════════════════════════════
  // INSTALLATION
  // ═══════════════════════════════════════════════

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
      debugPrint('[UpdateService] Opening APK: $_downloadPath');
      final result = await OpenFilex.open(
        _downloadPath!,
        type: 'application/vnd.android.package-archive',
      );
      debugPrint(
        '[UpdateService] Open result: ${result.message} - ${result.type}',
      );
    } catch (e) {
      debugPrint('[UpdateService] Install error: $e');
    }
  }
}
