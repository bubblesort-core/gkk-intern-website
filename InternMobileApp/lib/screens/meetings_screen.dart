import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:internmobileapp/theme/app_theme.dart';
import 'package:internmobileapp/services/supabase_service.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:flutter_animate/flutter_animate.dart';

class MeetingsScreen extends StatefulWidget {
  const MeetingsScreen({super.key});

  @override
  State<MeetingsScreen> createState() => _MeetingsScreenState();
}

class _MeetingsScreenState extends State<MeetingsScreen>
    with SingleTickerProviderStateMixin {
  final TextEditingController _searchController = TextEditingController();
  Map<String, String?> _targetInfo = {};
  bool _isLoadingTarget = true;
  late Stream<List<Map<String, dynamic>>> _liveSessionsStream;

  // Cache last good data so stream re-emissions don't blank the UI
  List<Map<String, dynamic>> _cachedLiveMeetings = [];

  static const _skeletonLive = [
    {
      'title': 'Loading Meeting...',
      'platform': 'Google Meet',
      'join_url': 'https://example.com',
    },
    {
      'title': 'Weekly Sync',
      'platform': 'Zoom',
      'join_url': 'https://example.com',
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadTargetInfo();
    _initStreams();
  }

  void _initStreams() {
    _liveSessionsStream = SupabaseService.getActiveSessionsStream();
  }

  Future<void> _loadTargetInfo() async {
    final info = await SupabaseService.getUserTargetInfo();
    if (mounted) {
      setState(() {
        _targetInfo = info;
        _isLoadingTarget = false;
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // Removed _tabController init/dispose and _load method as it was redundant with StreamBuilder logic

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: StreamBuilder<List<Map<String, dynamic>>>(
            stream: _liveSessionsStream,
            builder: (ctx, snap) {
              // Still loading target info — show skeleton
              final isWaiting =
                  snap.connectionState == ConnectionState.waiting &&
                  snap.data == null;

              if (_isLoadingTarget || isWaiting) {
                return Skeletonizer(
                  enabled: true,
                  child: _buildLiveList(_skeletonLive),
                );
              }

              final rawData = snap.data;

              // Only process + cache when stream actually emits non-null data
              if (rawData != null) {
                // Filter by targeting
                final filtered = rawData.where((m) {
                  // Show live or upcoming sessions
                  final isLive = m['status'] == 'live';
                  final scheduledStart = m['scheduled_start'] != null
                      ? DateTime.tryParse(m['scheduled_start'].toString())
                      : null;
                  final isUpcoming =
                      m['status'] == 'scheduled' &&
                      scheduledStart != null &&
                      scheduledStart.isAfter(DateTime.now());

                  if (!isLive && !isUpcoming) return false;

                  final targetType = m['target_type'] ?? 'all';
                  final targetIds = List<String>.from(m['target_ids'] ?? []);

                  if (targetType == 'all') return true;
                  if (targetType == 'batch') {
                    return targetIds.contains(_targetInfo['batch_id']);
                  }
                  if (targetType == 'team') {
                    return targetIds.contains(_targetInfo['team_id']);
                  }
                  if (targetType == 'candidate') {
                    return targetIds.contains(_targetInfo['user_id']);
                  }
                  return false;
                }).toList();

                _cachedLiveMeetings = filtered;
              }

              // Use cached data — never flash empty on re-emission
              return _buildLiveList(_cachedLiveMeetings);
            },
          ),
        ),
      ],
    );
  }

  // Removed _handleStream as it was redundant with Skeletonizer logic

  // Removed _handleStream and _errorState as they were redundant with Skeletonizer logic

  Widget _buildLiveList(List<Map<String, dynamic>> meetings) {
    if (meetings.isEmpty) {
      return _emptyState(Icons.videocam_off, 'No live meetings right now');
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: meetings.length,
      itemBuilder: (ctx, i) {
        final m = meetings[i];
        final isActive = m['status'] == 'live';
        final scheduledStart = m['scheduled_start'] != null
            ? DateTime.parse(m['scheduled_start'])
            : null;
        final isUpcoming =
            m['status'] == 'scheduled' &&
            scheduledStart != null &&
            scheduledStart.isAfter(DateTime.now());

        return AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.bgCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: (isActive ? const Color(0xFFEF4444) : AppTheme.primary)
                      .withValues(alpha: 0.3),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: isActive
                          ? const Color(0xFFEF4444)
                          : AppTheme.primary,
                      shape: BoxShape.circle,
                      boxShadow: isActive
                          ? [
                              BoxShadow(
                                color: const Color(
                                  0xFFEF4444,
                                ).withValues(alpha: 0.5),
                                blurRadius: 8,
                                spreadRadius: 2,
                              ),
                            ]
                          : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          m['title'] ?? 'Meeting',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textMain,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          isActive
                              ? (m['platform'] ?? 'Live Now')
                              : (scheduledStart != null
                                    ? 'Scheduled: ${scheduledStart.toLocal().toString().substring(0, 16)}'
                                    : 'Upcoming'),
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: !isActive && !isUpcoming
                        ? null
                        : () async {
                            final link = m['join_url'] ?? m['video_url'];
                            if (link != null) await launchUrl(Uri.parse(link));
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isActive
                          ? const Color(0xFFEF4444)
                          : AppTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 10,
                      ),
                    ),
                    child: Text(
                      isActive ? 'Join' : 'Link',
                      style: const TextStyle(fontSize: 13),
                    ),
                  ),
                ],
              ),
            )
            .animate()
            .fadeIn(duration: 400.ms, delay: (i * 100).ms)
            .slideX(begin: 0.1, end: 0);
      },
    );
  }

  // End of recordings functionality removal

  Widget _emptyState(IconData icon, String text) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            icon,
            size: 64,
            color: AppTheme.textMuted.withValues(alpha: 0.5),
          ),
          const SizedBox(height: 16),
          Text(
            text,
            style: const TextStyle(color: AppTheme.textMuted, fontSize: 16),
          ),
        ],
      ),
    );
  }
}
