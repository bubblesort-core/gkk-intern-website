import 'dart:async';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/supabase_client.dart';
import '../theme/colors.dart';

/// Banner widget that mirrors BannerDisplay.tsx from the web app.
/// Fetches active banners from the `banners` table and auto-rotates through them.
class BannerWidget extends StatefulWidget {
  const BannerWidget({super.key});

  @override
  State<BannerWidget> createState() => _BannerWidgetState();
}

class _BannerWidgetState extends State<BannerWidget> {
  List<Map<String, dynamic>> _banners = [];
  int _currentIndex = 0;
  bool _isVisible = true;
  Timer? _autoRotateTimer;

  @override
  void initState() {
    super.initState();
    _fetchBanners();
  }

  @override
  void dispose() {
    _autoRotateTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchBanners() async {
    try {
      final data = await SupabaseClientConfig.client
          .from('banners')
          .select('*')
          .eq('is_active', true)
          .order('created_at', ascending: false);

      if (mounted && (data as List).isNotEmpty) {
        setState(() => _banners = List<Map<String, dynamic>>.from(data));
        _startAutoRotate();
      }
    } catch (_) {}
  }

  void _startAutoRotate() {
    if (_banners.length <= 1) return;
    _autoRotateTimer = Timer.periodic(const Duration(seconds: 6), (_) {
      if (mounted) {
        setState(() => _currentIndex = (_currentIndex + 1) % _banners.length);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_banners.isEmpty || !_isVisible) return const SizedBox.shrink();

    final banner = _banners[_currentIndex];
    final title = banner['title'] as String? ?? '';
    final description = banner['description'] as String? ?? '';
    final imageUrl = banner['image_url'] as String?;
    final keyPoints = List<String>.from(banner['key_points'] ?? []);
    final bgColor = _parseColor(banner['bg_color'] as String?, const Color(0xFF0f172a));
    final textColor = _parseColor(banner['text_color'] as String?, AppColors.primary);
    final buttonText = banner['button_text'] as String?;
    final buttonLink = banner['button_link'] as String?;

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 500),
      child: Container(
        key: ValueKey(_currentIndex),
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
        ),
        child: Stack(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Image
                  if (imageUrl != null && imageUrl.isNotEmpty) ...[
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        imageUrl,
                        width: double.infinity,
                        height: 140,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => const SizedBox.shrink(),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Title
                  Text(title,
                      style: TextStyle(
                          color: textColor,
                          fontSize: 18,
                          fontWeight: FontWeight.w800)),
                  if (description.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Text(description,
                        style: TextStyle(
                            color: Colors.white.withValues(alpha: 0.75),
                            fontSize: 13,
                            height: 1.5)),
                  ],

                  // Key Points
                  if (keyPoints.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: keyPoints
                          .map((kp) => Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: textColor.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                      color:
                                          Colors.white.withValues(alpha: 0.12)),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 5,
                                      height: 5,
                                      decoration: BoxDecoration(
                                          color: textColor,
                                          shape: BoxShape.circle),
                                    ),
                                    const SizedBox(width: 6),
                                    Text(kp,
                                        style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 11,
                                            fontWeight: FontWeight.w500)),
                                  ],
                                ),
                              ))
                          .toList(),
                    ),
                  ],

                  // CTA Button
                  if (buttonText != null && buttonText.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    GestureDetector(
                      onTap: () async {
                        if (buttonLink != null && buttonLink.isNotEmpty) {
                          final uri = Uri.parse(buttonLink);
                          if (await canLaunchUrl(uri)) {
                            await launchUrl(uri,
                                mode: LaunchMode.externalApplication);
                          }
                        }
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 18, vertical: 10),
                        decoration: BoxDecoration(
                          color: textColor,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(buttonText,
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Close button
            Positioned(
              top: 8,
              right: 8,
              child: GestureDetector(
                onTap: () => setState(() => _isVisible = false),
                child: Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.9),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.close,
                      color: Colors.black87, size: 18),
                ),
              ),
            ),

            // Carousel dots
            if (_banners.length > 1)
              Positioned(
                bottom: 8,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(
                    _banners.length,
                    (i) => Container(
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      width: i == _currentIndex ? 20 : 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: i == _currentIndex
                            ? textColor
                            : Colors.white.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Color _parseColor(String? hex, Color fallback) {
    if (hex == null || hex.isEmpty) return fallback;
    hex = hex.replaceFirst('#', '');
    if (hex.length == 6) hex = 'FF$hex';
    try {
      return Color(int.parse(hex, radix: 16));
    } catch (_) {
      return fallback;
    }
  }
}
