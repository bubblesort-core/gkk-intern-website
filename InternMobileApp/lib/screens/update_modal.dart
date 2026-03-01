import 'package:flutter/material.dart';
import 'package:internmobileapp/services/update_service.dart';
import 'package:internmobileapp/theme/app_theme.dart';

class UpdateModal extends StatelessWidget {
  const UpdateModal({super.key});

  /// Opens the update info modal WITHOUT auto-downloading.
  static void show(BuildContext context) {
    final svc = UpdateService();
    svc.resetDownloadState(); // start fresh every time
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const UpdateModal(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final svc = UpdateService();

    return PopScope(
      canPop: false,
      child: Dialog(
        backgroundColor: AppTheme.bgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: _ModalContent(svc: svc),
        ),
      ),
    );
  }
}

class _ModalContent extends StatelessWidget {
  final UpdateService svc;
  const _ModalContent({required this.svc});

  @override
  Widget build(BuildContext context) {
    // React to isDownloading changes
    return ValueListenableBuilder<bool>(
      valueListenable: svc.isDownloading,
      builder: (_, downloading, _) {
        // React to isReadyToInstall changes
        return ValueListenableBuilder<bool>(
          valueListenable: svc.isReadyToInstall,
          builder: (_, ready, _) {
            // React to downloadError changes
            return ValueListenableBuilder<String?>(
              valueListenable: svc.downloadError,
              builder: (_, error, _) {
                if (ready) {
                  return _buildReadyToInstall(context);
                }
                if (error != null) {
                  return _buildError(context, error);
                }
                if (downloading) {
                  return _buildDownloading(context);
                }
                return _buildInfo(context);
              },
            );
          },
        );
      },
    );
  }

  // ── Step 1: Info — shows version details + Download button ──
  Widget _buildInfo(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.system_update, size: 48, color: AppTheme.primary),
        const SizedBox(height: 16),
        const Text(
          'Update Available',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppTheme.textMain,
          ),
        ),
        const SizedBox(height: 12),
        // Version info
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.bgBody,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.border),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _versionChip('v${svc.currentVersion}', AppTheme.textMuted),
              const SizedBox(width: 10),
              const Icon(
                Icons.arrow_forward,
                size: 16,
                color: AppTheme.primary,
              ),
              const SizedBox(width: 10),
              _versionChip('v${svc.latestVersion}', AppTheme.primary),
            ],
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'A new version is available.\nDownload now for the latest features.',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 13,
            color: AppTheme.textMuted,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 20),
        // Buttons: Cancel + Download
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.textMuted),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text(
                  'Later',
                  style: TextStyle(color: AppTheme.textMuted),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () => svc.startDownload(),
                icon: const Icon(Icons.download, color: Colors.white, size: 18),
                label: const Text(
                  'Download',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ── Step 2: Downloading — progress bar + Cancel ──
  Widget _buildDownloading(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.downloading, size: 48, color: AppTheme.primary),
        const SizedBox(height: 16),
        const Text(
          'Downloading Update',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppTheme.textMain,
          ),
        ),
        const SizedBox(height: 20),
        ValueListenableBuilder<double>(
          valueListenable: svc.downloadProgress,
          builder: (_, progress, _) => Column(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: LinearProgressIndicator(
                  value: progress > 0 ? progress : null,
                  backgroundColor: AppTheme.bgBody,
                  color: AppTheme.primary,
                  minHeight: 10,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                progress > 0
                    ? '${(progress * 100).toStringAsFixed(0)}%'
                    : 'Starting download…',
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.primary,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        TextButton(
          onPressed: () {
            svc.cancelDownload();
            Navigator.pop(context);
          },
          child: const Text(
            'Cancel',
            style: TextStyle(color: AppTheme.textMuted),
          ),
        ),
      ],
    );
  }

  // ── Step 3: Ready to Install ──
  Widget _buildReadyToInstall(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.check_circle, size: 48, color: AppTheme.primary),
        const SizedBox(height: 16),
        const Text(
          'Ready to Install',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppTheme.textMain,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Download complete! Tap Install to update.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: 13, color: AppTheme.textMuted),
        ),
        const SizedBox(height: 20),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () => svc.install(),
            icon: const Icon(Icons.install_mobile, color: Colors.white),
            label: const Text(
              'Install Now',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              padding: const EdgeInsets.symmetric(vertical: 14),
            ),
          ),
        ),
        const SizedBox(height: 10),
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text(
            'Install later',
            style: TextStyle(color: AppTheme.textMuted),
          ),
        ),
      ],
    );
  }

  // ── Step 4: Error ──
  Widget _buildError(BuildContext context, String error) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(Icons.error_outline, size: 48, color: Color(0xFFEF4444)),
        const SizedBox(height: 16),
        const Text(
          'Download Failed',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppTheme.textMain,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          error,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 13, color: Color(0xFFEF4444)),
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () {
                  svc.cancelDownload();
                  Navigator.pop(context);
                },
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppTheme.textMuted),
                ),
                child: const Text(
                  'Close',
                  style: TextStyle(color: AppTheme.textMuted),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: () => svc.startDownload(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                ),
                child: const Text(
                  'Retry',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _versionChip(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}
