import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';
import 'package:screen_protector/screen_protector.dart';
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
  bool _showControls = true;
  bool _isPlaying = false;
  bool _isBuffering = false;
  bool _isFullscreen = false;
  double _currentTime = 0;
  double _totalDuration = 0;
  double _playbackSpeed = 1.0;
  bool _isMuted = false;
  double _volume = 100;
  Timer? _hideTimer;
  Timer? _progressTimer;
  bool _isSeeking = false;
  bool _playerReady = false;

  final List<double> _speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

  @override
  void initState() {
    super.initState();
    _secureScreen();

    _controller = YoutubePlayerController.fromVideoId(
      videoId: widget.videoId,
      autoPlay: true,
      params: const YoutubePlayerParams(
        showControls: false,
        showFullscreenButton: false,
        enableCaption: false,
        playsInline: true,
        strictRelatedVideos: true,
        showVideoAnnotations: false,
        pointerEvents: PointerEvents.none,
      ),
    );

    _controller.listen((event) {
      if (!mounted) return;

      final playing = event.playerState == PlayerState.playing;
      final buffering = event.playerState == PlayerState.buffering;

      if (!_playerReady && (playing || buffering)) {
        _playerReady = true;
        _injectHideCSS();
      }

      setState(() {
        _isPlaying = playing;
        _isBuffering = buffering;
      });
    });

    _startProgressTracking();
    _resetHideTimer();
  }

  Future<void> _secureScreen() async {
    await ScreenProtector.preventScreenshotOn();
    await ScreenProtector.protectDataLeakageOn();
  }

  /// Inject CSS into the WebView to nuke all YouTube branding overlays
  void _injectHideCSS() {
    try {
      _controller.webViewController.runJavaScript('''
        (function() {
          var style = document.createElement('style');
          style.textContent = `
            .ytp-chrome-top,
            .ytp-chrome-bottom,
            .ytp-watermark,
            .ytp-pause-overlay,
            .ytp-show-cards-title,
            .ytp-ce-element,
            .ytp-gradient-top,
            .ytp-gradient-bottom,
            .ytp-impression-link,
            .ytp-title,
            .ytp-title-text,
            .ytp-menuitem,
            .ytp-overflow-menu,
            .ytp-popup,
            .ytp-contextmenu,
            .ytp-share-panel,
            .ytp-copylink-button,
            .ytp-watch-later-button,
            .ytp-button[aria-label="Share"],
            .ytp-button[aria-label="Copy link"],
            .ytp-button[data-tooltip-target-id="ytp-autonav-toggle-button"],
            a[href*="youtube.com"],
            .branding-img-container,
            .ytp-youtube-button,
            .ytp-spinner,
            .annotation,
            .video-annotations,
            .iv-branding {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
              width: 0 !important;
              height: 0 !important;
              overflow: hidden !important;
            }
            .html5-video-player {
              overflow: hidden !important;
            }
            .ytp-cued-thumbnail-overlay {
              display: none !important;
            }
          `;
          document.head.appendChild(style);

          // Repeatedly remove elements in case YouTube re-injects them
          setInterval(function() {
            var selectors = [
              '.ytp-chrome-top', '.ytp-watermark', '.ytp-pause-overlay',
              '.ytp-show-cards-title', '.ytp-ce-element', '.ytp-impression-link',
              '.ytp-contextmenu', '.ytp-share-panel', '.branding-img-container',
              '.ytp-youtube-button', '.annotation', '.video-annotations',
              '.iv-branding', '.ytp-copylink-button'
            ];
            selectors.forEach(function(sel) {
              document.querySelectorAll(sel).forEach(function(el) {
                el.style.display = 'none';
                el.style.visibility = 'hidden';
                el.style.pointerEvents = 'none';
              });
            });
          }, 500);

          // Disable right-click context menu
          document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
        })();
      ''');
    } catch (e) {
      debugPrint('CSS injection error: $e');
    }
  }

  void _startProgressTracking() {
    _progressTimer = Timer.periodic(const Duration(milliseconds: 500), (_) async {
      if (!mounted || _isSeeking) return;
      try {
        final current = await _controller.currentTime;
        final total = await _controller.duration;
        if (mounted) {
          setState(() {
            _currentTime = current;
            if (total > 0) _totalDuration = total;
          });
        }
      } catch (_) {}
    });
  }

  void _resetHideTimer() {
    _hideTimer?.cancel();
    if (mounted) setState(() => _showControls = true);
    _hideTimer = Timer(const Duration(seconds: 4), () {
      if (mounted && _isPlaying) setState(() => _showControls = false);
    });
  }

  void _togglePlayPause() {
    if (_isPlaying) {
      _controller.pauseVideo();
    } else {
      _controller.playVideo();
    }
    _resetHideTimer();
  }

  void _seekTo(double seconds) {
    _controller.seekTo(seconds: seconds, allowSeekAhead: true);
    setState(() => _currentTime = seconds);
    _resetHideTimer();
  }

  void _skip(int seconds) {
    final target = (_currentTime + seconds).clamp(0.0, _totalDuration);
    _seekTo(target);
  }

  void _toggleMute() async {
    if (_isMuted) {
      await _controller.unMute();
      await _controller.setVolume(_volume.toInt());
    } else {
      await _controller.mute();
    }
    setState(() => _isMuted = !_isMuted);
    _resetHideTimer();
  }

  void _setVolume(double vol) async {
    final v = vol.clamp(0.0, 100.0);
    setState(() {
      _volume = v;
      _isMuted = v == 0;
    });
    await _controller.setVolume(v.toInt());
    if (v == 0) {
      await _controller.mute();
    } else {
      await _controller.unMute();
    }
    _resetHideTimer();
  }

  void _changeSpeed() {
    final idx = _speeds.indexOf(_playbackSpeed);
    final next = _speeds[(idx + 1) % _speeds.length];
    _controller.setPlaybackRate(next);
    setState(() => _playbackSpeed = next);

    // Show speed change feedback
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Playback speed: ${next}x',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.elevated,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(seconds: 1),
        margin: const EdgeInsets.only(bottom: 80, left: 20, right: 20),
      ),
    );
    _resetHideTimer();
  }

  void _showSpeedPicker() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.elevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Playback Speed',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 16),
            ..._speeds.map((s) {
              final isActive = s == _playbackSpeed;
              return ListTile(
                onTap: () {
                  _controller.setPlaybackRate(s);
                  setState(() => _playbackSpeed = s);
                  Navigator.pop(context);
                },
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                tileColor: isActive ? AppColors.primaryMuted : Colors.transparent,
                leading: Icon(
                  isActive ? Icons.check_circle : Icons.circle_outlined,
                  color: isActive ? AppColors.primary : AppColors.textSecondary,
                  size: 22,
                ),
                title: Text('${s}x',
                    style: TextStyle(
                      color: isActive ? AppColors.primary : Colors.white,
                      fontWeight: isActive ? FontWeight.w700 : FontWeight.w500,
                      fontSize: 15,
                    )),
                trailing: s == 1.0
                    ? Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.border,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text('Normal',
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                      )
                    : null,
              );
            }),
          ],
        ),
      ),
    );
  }

  void _toggleFullscreen() {
    setState(() => _isFullscreen = !_isFullscreen);
    if (_isFullscreen) {
      SystemChrome.setPreferredOrientations([
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    } else {
      SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    }
    _resetHideTimer();
  }

  String _formatDuration(double seconds) {
    final total = seconds.toInt();
    final h = total ~/ 3600;
    final m = (total % 3600) ~/ 60;
    final s = total % 60;
    if (h > 0) {
      return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
    }
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _hideTimer?.cancel();
    _progressTimer?.cancel();
    ScreenProtector.preventScreenshotOff();
    ScreenProtector.protectDataLeakageOff();
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    _controller.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final playerWidget = _buildPlayerStack();

    if (_isFullscreen) {
      return PopScope(
        canPop: false,
        onPopInvokedWithResult: (didPop, _) {
          if (!didPop) _toggleFullscreen();
        },
        child: Scaffold(
          backgroundColor: Colors.black,
          body: Center(
            child: playerWidget,
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0a0a0f),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0d0d14),
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
          AspectRatio(
            aspectRatio: 16 / 9,
            child: playerWidget,
          ),

          // ── Video info section ──
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700, letterSpacing: -0.3)),
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
                  const SizedBox(height: 20),
                  const Divider(height: 1, color: AppColors.border),
                  const SizedBox(height: 16),

                  // ── Speed selector row ──
                  const Text('Playback Speed',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 10),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _speeds.map((s) {
                        final isActive = s == _playbackSpeed;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: GestureDetector(
                            onTap: () {
                              _controller.setPlaybackRate(s);
                              setState(() => _playbackSpeed = s);
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: isActive ? AppColors.primary : AppColors.elevated,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: isActive ? AppColors.primary : AppColors.border),
                              ),
                              child: Text('${s}x',
                                  style: TextStyle(
                                    color: isActive ? Colors.black : AppColors.textSecondary,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  )),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
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

  Widget _buildPlayerStack() {
    return Stack(
      children: [
        // ── 1. YouTube player — AbsorbPointer blocks ALL native YouTube touches ──
        Positioned.fill(
          child: AbsorbPointer(
            absorbing: true,
            child: YoutubePlayer(
              controller: _controller,
              aspectRatio: 16 / 9,
            ),
          ),
        ),

        // ── 2. Buffering spinner ──
        if (_isBuffering)
          const Positioned.fill(
            child: Center(
              child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
            ),
          ),

        // ── 3. When controls HIDDEN: simple tap-to-show + double-tap-to-skip ──
        if (!_showControls)
          Positioned.fill(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => _resetHideTimer(),
              onDoubleTapDown: _handleDoubleTap,
              child: Container(color: Colors.transparent),
            ),
          ),

        // ── 4. When controls VISIBLE: overlay with interactive widgets ──
        if (_showControls) _buildControlsOverlay(),
      ],
    );
  }

  void _handleDoubleTap(TapDownDetails details) {
    final renderBox = context.findRenderObject() as RenderBox;
    final localPos = renderBox.globalToLocal(details.globalPosition);
    final width = renderBox.size.width;
    if (localPos.dx < width / 3) {
      _skip(-10);
      _showSkipFeedback(context, false);
    } else if (localPos.dx > width * 2 / 3) {
      _skip(10);
      _showSkipFeedback(context, true);
    } else {
      _togglePlayPause();
    }
  }

  void _showSkipFeedback(BuildContext context, bool forward) {
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(forward ? Icons.forward_10 : Icons.replay_10, color: Colors.white, size: 18),
            const SizedBox(width: 6),
            Text(forward ? '+10 seconds' : '-10 seconds',
                style: const TextStyle(color: Colors.white, fontSize: 13)),
          ],
        ),
        backgroundColor: Colors.black87,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        duration: const Duration(milliseconds: 700),
        margin: const EdgeInsets.only(bottom: 80, left: 60, right: 60),
      ),
    );
  }

  Widget _buildControlsOverlay() {
    final progress = _totalDuration > 0 ? (_currentTime / _totalDuration).clamp(0.0, 1.0) : 0.0;

    return Positioned.fill(
      child: Stack(
        children: [
          // ── Background: gradient + tap-to-hide + double-tap-to-skip ──
          Positioned.fill(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: () => setState(() => _showControls = false),
              onDoubleTapDown: _handleDoubleTap,
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Color(0xBB000000),
                      Color(0x00000000),
                      Color(0x00000000),
                      Color(0xDD000000),
                    ],
                    stops: [0.0, 0.22, 0.65, 1.0],
                  ),
                ),
              ),
            ),
          ),

          // ── Interactive controls on top (buttons & sliders absorb their own gestures) ──
          Positioned.fill(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // ── Top bar (fullscreen mode title) ──
                _isFullscreen
                    ? SafeArea(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                          child: Row(
                            children: [
                              GestureDetector(
                                onTap: _toggleFullscreen,
                                child: const Padding(
                                  padding: EdgeInsets.all(8),
                                  child: Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(widget.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                              ),
                              _badge(Icons.lock, 'Secure', AppColors.primary, AppColors.primary.withValues(alpha: 0.2)),
                            ],
                          ),
                        ),
                      )
                    : const SizedBox(height: 4),

                // ── Center play controls ──
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _controlButton(
                      icon: Icons.replay_10,
                      size: 44, iconSize: 28,
                      color: Colors.white, bgColor: Colors.black38,
                      onTap: () => _skip(-10),
                    ),
                    const SizedBox(width: 28),
                    _controlButton(
                      icon: _isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
                      size: 64, iconSize: 38,
                      color: Colors.black, bgColor: AppColors.primary,
                      shadow: true,
                      onTap: _togglePlayPause,
                    ),
                    const SizedBox(width: 28),
                    _controlButton(
                      icon: Icons.forward_10,
                      size: 44, iconSize: 28,
                      color: Colors.white, bgColor: Colors.black38,
                      onTap: () => _skip(10),
                    ),
                  ],
                ),

                // ── Bottom: Seek bar + controls row ──
                Padding(
                  padding: const EdgeInsets.fromLTRB(10, 0, 10, 6),
                  child: Column(
                    children: [
                      // ── Seek slider ──
                      SizedBox(
                        height: 32,
                        child: SliderTheme(
                          data: SliderThemeData(
                            trackHeight: 3.5,
                            activeTrackColor: AppColors.primary,
                            inactiveTrackColor: Colors.white24,
                            thumbColor: AppColors.primary,
                            thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
                            overlayShape: const RoundSliderOverlayShape(overlayRadius: 16),
                            overlayColor: AppColors.primary.withValues(alpha: 0.2),
                          ),
                          child: Slider(
                            value: progress,
                            onChangeStart: (_) {
                              _isSeeking = true;
                              _hideTimer?.cancel();
                            },
                            onChanged: (v) {
                              setState(() => _currentTime = v * _totalDuration);
                            },
                            onChangeEnd: (v) {
                              _isSeeking = false;
                              _seekTo(v * _totalDuration);
                              _resetHideTimer();
                            },
                          ),
                        ),
                      ),

                      // ── Bottom row: time + volume + speed + fullscreen ──
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: Row(
                          children: [
                            Text(
                              '${_formatDuration(_currentTime)} / ${_formatDuration(_totalDuration)}',
                              style: const TextStyle(
                                color: Colors.white70, fontSize: 12,
                                fontFamily: 'monospace', fontWeight: FontWeight.w500,
                              ),
                            ),
                            const Spacer(),

                            // Volume icon
                            GestureDetector(
                              onTap: _toggleMute,
                              child: Padding(
                                padding: const EdgeInsets.only(left: 4, right: 2),
                                child: Icon(
                                  _isMuted || _volume == 0
                                      ? Icons.volume_off
                                      : _volume < 50
                                          ? Icons.volume_down
                                          : Icons.volume_up,
                                  color: Colors.white70, size: 22,
                                ),
                              ),
                            ),

                            // Volume slider
                            SizedBox(
                              width: 70, height: 22,
                              child: SliderTheme(
                                data: SliderThemeData(
                                  trackHeight: 2.5,
                                  activeTrackColor: Colors.white70,
                                  inactiveTrackColor: Colors.white24,
                                  thumbColor: Colors.white,
                                  thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 5),
                                  overlayShape: const RoundSliderOverlayShape(overlayRadius: 10),
                                  overlayColor: Colors.white24,
                                ),
                                child: Slider(
                                  value: _isMuted ? 0 : _volume,
                                  min: 0, max: 100,
                                  onChanged: (v) => _setVolume(v),
                                ),
                              ),
                            ),

                            // Speed
                            GestureDetector(
                              onTap: _isFullscreen ? _changeSpeed : _showSpeedPicker,
                              child: Container(
                                margin: const EdgeInsets.symmetric(horizontal: 6),
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white12,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text('${_playbackSpeed}x',
                                    style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                              ),
                            ),

                            // Fullscreen
                            GestureDetector(
                              onTap: _toggleFullscreen,
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                                child: Icon(
                                  _isFullscreen ? Icons.fullscreen_exit : Icons.fullscreen,
                                  color: Colors.white, size: 26,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _controlButton({
    required IconData icon,
    required double size,
    required double iconSize,
    required Color color,
    required Color bgColor,
    bool shadow = false,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(size / 2),
          boxShadow: shadow
              ? [BoxShadow(color: AppColors.primary.withValues(alpha: 0.4), blurRadius: 20, spreadRadius: 2)]
              : null,
        ),
        child: Center(child: Icon(icon, color: color, size: iconSize)),
      ),
    );
  }
}
