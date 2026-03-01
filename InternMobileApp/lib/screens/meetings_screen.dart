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
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  Map<String, String?> _targetInfo = {};
  bool _isLoadingTarget = true;
  late Stream<List<Map<String, dynamic>>> _liveSessionsStream;
  late Stream<List<Map<String, dynamic>>> _recordingsStream;

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

  static const _skeletonRecorded = [
    {
      'title': 'System Overview Recording',
      'started_at': '2023-10-27T10:00:00Z',
      'recording_url': 'https://example.com',
    },
    {
      'title': 'Database Design Session',
      'started_at': '2023-10-26T14:30:00Z',
      'recording_url': 'https://example.com',
    },
    {
      'title': 'API Integration Guide',
      'started_at': '2023-10-25T09:00:00Z',
      'recording_url': 'https://example.com',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadTargetInfo();
    _initStreams();
  }

  void _initStreams() {
    _liveSessionsStream = SupabaseService.getActiveSessionsStream();
    _recordingsStream = SupabaseService.client
        .from('recordings')
        .stream(primaryKey: ['id'])
        .order('created_at', ascending: false);
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
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  // Removed _tabController init/dispose and _load method as it was redundant with StreamBuilder logic

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primary,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textMuted,
          tabs: const [
            Tab(text: 'Live Meetings'),
            Tab(text: 'Recordings'),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              StreamBuilder<List<Map<String, dynamic>>>(
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
                      final targetIds = List<String>.from(
                        m['target_ids'] ?? [],
                      );

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
              StreamBuilder<List<Map<String, dynamic>>>(
                stream: _recordingsStream,
                builder: (ctx, snap) {
                  final rawData = snap.data ?? [];
                  final filteredData = rawData.where((m) {
                    final title = (m['title'] ?? '').toString().toLowerCase();
                    return title.contains(_searchQuery.toLowerCase());
                  }).toList();

                  final data =
                      snap.connectionState == ConnectionState.waiting &&
                          snap.data == null
                      ? _skeletonRecorded
                      : filteredData;

                  return Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (val) =>
                              setState(() => _searchQuery = val),
                          style: const TextStyle(color: AppTheme.textMain),
                          decoration: InputDecoration(
                            hintText: 'Search recordings...',
                            hintStyle: const TextStyle(
                              color: AppTheme.textMuted,
                            ),
                            prefixIcon: const Icon(
                              Icons.search,
                              color: AppTheme.textMuted,
                            ),
                            suffixIcon: _searchQuery.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(
                                      Icons.clear,
                                      color: AppTheme.textMuted,
                                    ),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() => _searchQuery = '');
                                    },
                                  )
                                : null,
                            filled: true,
                            fillColor: AppTheme.bgCard,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: AppTheme.border),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: BorderSide(color: AppTheme.border),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: Skeletonizer(
                          enabled:
                              snap.connectionState == ConnectionState.waiting &&
                              snap.data == null,
                          child: _buildRecordedList(data),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ],
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

  String _getYoutubeThumbnail(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return '';
    String? videoId;
    if (uri.host.contains('youtube.com')) {
      videoId = uri.queryParameters['v'];
    } else if (uri.host.contains('youtu.be')) {
      videoId = uri.pathSegments.isNotEmpty ? uri.pathSegments[0] : null;
    }
    if (videoId != null) {
      return 'https://img.youtube.com/vi/$videoId/mqdefault.jpg';
    }
    return '';
  }

  Widget _buildRecordedList(List<Map<String, dynamic>> recordings) {
    if (recordings.isEmpty) {
      return _emptyState(
        Icons.play_circle_outline,
        _searchQuery.isEmpty ? 'No recordings available' : 'No results found',
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: recordings.length,
      itemBuilder: (ctx, i) {
        final r = recordings[i];
        final recordingUrl = r['youtube_url'] ?? '';
        final thumb = r['thumbnail_url'] ?? _getYoutubeThumbnail(recordingUrl);

        return GestureDetector(
              onTap: () async {
                final url = r['youtube_url'];
                if (url != null) await launchUrl(Uri.parse(url));
              },
              child: Container(
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: AppTheme.bgCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: AppTheme.border.withValues(alpha: 0.5),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.2),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(16),
                          ),
                          child: AspectRatio(
                            aspectRatio: 16 / 9,
                            child: thumb.isNotEmpty
                                ? Image.network(
                                    thumb,
                                    fit: BoxFit.cover,
                                    errorBuilder: (c, e, s) => Container(
                                      color: Colors.black87,
                                      child: const Icon(
                                        Icons.play_circle,
                                        color: Colors.white,
                                        size: 48,
                                      ),
                                    ),
                                  )
                                : Container(
                                    color: Colors.black87,
                                    child: const Icon(
                                      Icons.play_circle,
                                      color: Colors.white,
                                      size: 48,
                                    ),
                                  ),
                          ),
                        ),
                        Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.6),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: const Icon(
                            Icons.play_arrow,
                            color: Colors.white,
                            size: 30,
                          ),
                        ),
                      ],
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            r['title'] ?? 'Session Recording',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textMain,
                              fontSize: 16,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(
                                    Icons.calendar_today,
                                    size: 14,
                                    color: AppTheme.textMuted,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    r['created_at']?.toString().substring(
                                          0,
                                          10,
                                        ) ??
                                        '',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppTheme.textMuted,
                                    ),
                                  ),
                                ],
                              ),
                              const Text(
                                'Watch Now',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            )
            .animate()
            .fadeIn(duration: 400.ms, delay: (i * 100).ms)
            .slideY(begin: 0.1, end: 0);
      },
    );
  }

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
