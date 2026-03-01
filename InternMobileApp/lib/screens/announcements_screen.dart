import 'package:flutter/material.dart';
import 'package:internmobileapp/theme/app_theme.dart';
import 'package:internmobileapp/services/supabase_service.dart';
import 'package:internmobileapp/services/update_service.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:flutter_animate/flutter_animate.dart';

class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  List<Map<String, dynamic>> _announcements = [];

  static const _skeletonItems = [
    {
      'title': 'Exciting Update Coming Soon!',
      'content': 'We are working on something amazing for all our interns.',
      'type': 'info',
      'created_at': '2024-01-01T00:00:00Z',
    },
    {
      'title': 'New Internship Opportunities',
      'content': 'Check out the latest projects assigned to your team.',
      'type': 'success',
      'created_at': '2024-01-01T00:00:00Z',
    },
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await SupabaseService.getAnnouncements();
    if (mounted) {
      setState(() {
        _announcements = data;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: SupabaseService.getAnnouncementsStream(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          debugPrint('Announcements stream error: ${snapshot.error}');
        }

        final items = (snapshot.data != null && snapshot.data!.isNotEmpty)
            ? snapshot.data!
            : (snapshot.connectionState == ConnectionState.waiting
                  ? _skeletonItems
                  : _announcements);

        return Skeletonizer(
          enabled: snapshot.connectionState == ConnectionState.waiting,
          child: RefreshIndicator(
            color: AppTheme.primary,
            onRefresh: () async {
              await Future.wait([_load(), UpdateService().checkForUpdate()]);
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: items.length,
              itemBuilder: (ctx, i) {
                final a = items[i];
                final isPinned = a['is_pinned'] == true;
                return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.bgCard,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isPinned
                              ? AppTheme.primary.withValues(alpha: 0.4)
                              : AppTheme.border,
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              if (isPinned) ...[
                                const Icon(
                                  Icons.push_pin,
                                  size: 14,
                                  color: AppTheme.primary,
                                ),
                                const SizedBox(width: 6),
                              ],
                              Expanded(
                                child: Text(
                                  a['title'] ?? '',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.textMain,
                                  ),
                                ),
                              ),
                              if (a['type'] != null)
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _getTypeColor(
                                      a['type'],
                                    ).withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(
                                      color: _getTypeColor(
                                        a['type'],
                                      ).withValues(alpha: 0.3),
                                    ),
                                  ),
                                  child: Text(
                                    a['type'].toString().toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 9,
                                      fontWeight: FontWeight.bold,
                                      color: _getTypeColor(a['type']),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                          if (a['content'] != null) ...[
                            const SizedBox(height: 8),
                            Text(
                              a['content'],
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppTheme.textBody,
                              ),
                            ),
                          ],
                          const SizedBox(height: 8),
                          Text(
                            _formatDate(a['created_at']),
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    )
                    .animate()
                    .fadeIn(duration: 400.ms, delay: (i * 100).ms)
                    .slideX(begin: 0.1, end: 0);
              },
            ),
          ),
        );
      },
    );
  }

  Color _getTypeColor(String? type) {
    switch (type) {
      case 'success':
        return const Color(0xFF10B981);
      case 'warning':
        return const Color(0xFFF59E0B);
      case 'alert':
        return const Color(0xFFEF4444);
      case 'info':
      default:
        return const Color(0xFF3B82F6);
    }
  }

  String _formatDate(String? d) {
    if (d == null) return '';
    final dt = DateTime.tryParse(d);
    if (dt == null) return '';
    return '${dt.day} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][dt.month - 1]} ${dt.year}';
  }
}
