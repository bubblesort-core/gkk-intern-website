import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';
import '../theme/colors.dart';

class SecureVideoPlayerScreen extends StatefulWidget {
  final String videoId;
  final String title;

  const SecureVideoPlayerScreen({
    super.key,
    required this.videoId,
    required this.title,
  });

  @override
  State<SecureVideoPlayerScreen> createState() => _SecureVideoPlayerScreenState();
}

class _SecureVideoPlayerScreenState extends State<SecureVideoPlayerScreen> {
  late YoutubePlayerController _controller;
  Timer? _clipboardTimer;

  @override
  void initState() {
    super.initState();

    _controller = YoutubePlayerController.fromVideoId(
      videoId: widget.videoId,
      autoPlay: true,
      params: const YoutubePlayerParams(
        showControls: true, // Native YouTube Controls!
        showFullscreenButton: true,
        enableCaption: false,
        playsInline: true,
        strictRelatedVideos: true,
        showVideoAnnotations: false,
      ),
    );

    _clipboardTimer = Timer.periodic(const Duration(milliseconds: 500), (_) async {
      try {
        final clipboardData = await Clipboard.getData(Clipboard.kTextPlain);
        final text = clipboardData?.text ?? '';
        if (text.contains('youtube.com') || text.contains('youtu.be')) {
          await Clipboard.setData(const ClipboardData(text: 'INVALID'));
          if (!mounted) return;
          ScaffoldMessenger.of(context).clearSnackBars();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Copying video links is disabled for security reasons.'),
              backgroundColor: AppColors.danger,
              duration: Duration(seconds: 2),
            ),
          );
        }
      } catch (_) {}
    });
  }

  @override
  void dispose() {
    _clipboardTimer?.cancel();
    _controller.close();
    super.dispose();
  }

  Widget _badge(IconData icon, String label, Color color, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(6)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 13),
          const SizedBox(width: 5),
          Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.primaryMuted,
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.lock, color: AppColors.primary, size: 14),
                SizedBox(width: 4),
                Text('Secure', style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // ── Player ──
          YoutubePlayer(controller: _controller), // Uses the native YoutubePlayer with built-in controls

              // ── Video info section ──
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.title,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 12),

                      // ── Security badges ──
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _badge(Icons.shield, 'DRM Protected', AppColors.primary, AppColors.primaryMuted),
                          _badge(Icons.videocam_off, 'No Recording', AppColors.danger, AppColors.danger.withValues(alpha: 0.15)),
                          _badge(Icons.screenshot_monitor, 'Screenshot Blocked', AppColors.warning, AppColors.warning.withValues(alpha: 0.15)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
  }
}
