import 'package:flutter/material.dart';
import 'package:internmobileapp/theme/app_theme.dart';
import 'package:internmobileapp/services/supabase_service.dart';
import 'package:internmobileapp/screens/video_player_screen.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:flutter_animate/flutter_animate.dart';

class RecordingsScreen extends StatefulWidget {
  const RecordingsScreen({super.key});

  @override
  State<RecordingsScreen> createState() => _RecordingsScreenState();
}

class _RecordingsScreenState extends State<RecordingsScreen> {
  List<Map<String, dynamic>> _recordings = [];
  bool _isLoading = true;
  String _searchQuery = '';

  static const _skeletonRecordings = [
    {
      'id': 'skel1',
      'title': 'Kickoff Meeting Recording - Skeleton Test',
      'created_at': '2024-01-01T10:00:00Z',
      'duration_label': '45:00',
    },
    {
      'id': 'skel2',
      'title': 'Weekly Standup Session Recording',
      'created_at': '2024-01-02T10:00:00Z',
      'duration_label': '30:00',
    },
    {
      'id': 'skel3',
      'title': 'Project Architecture Deep Dive',
      'created_at': '2024-01-03T10:00:00Z',
      'duration_label': '1:15:00',
    },
  ];

  @override
  void initState() {
    super.initState();
    _fetchRecordings();
  }

  Future<void> _fetchRecordings() async {
    try {
      final teamData = await SupabaseService.getMyTeam();
      final profileData = await SupabaseService.getCurrentProfile();

      final response = await SupabaseService.client
          .from('recordings')
          .select('*')
          .order('created_at', ascending: false)
          .limit(50);

      final myTeamId = teamData?['team_id'];
      final myBatchId =
          teamData?['teams']?['batch_id'] ??
          teamData?['teams']?['batches']?['id'];
      final myUserId = profileData?['id'];

      final visible = (response as List<dynamic>).where((m) {
        if (m['target_type'] == null || m['target_type'] == 'all') return true;
        final tIds = (m['target_ids'] as List<dynamic>?) ?? [];
        if (m['target_type'] == 'team')
          return myTeamId != null && tIds.contains(myTeamId);
        if (m['target_type'] == 'batch')
          return myBatchId != null && tIds.contains(myBatchId);
        if (m['target_type'] == 'intern')
          return myUserId != null && tIds.contains(myUserId);
        return false;
      }).toList();

      if (mounted) {
        setState(() {
          _recordings = List<Map<String, dynamic>>.from(visible);
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetchings recordings: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String? _getVideoId(String? url) {
    if (url == null) return null;
    final RegExp regExp = RegExp(
      r'(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|live\/|watch\?v=|watch\?.+&v=))([^&?]+)',
    );
    final match = regExp.firstMatch(url);
    return match?.group(1);
  }

  Future<void> _openRecording(Map<String, dynamic> recording) async {
    final videoId =
        recording['youtube_video_id'] ?? _getVideoId(recording['youtube_url']);

    if (videoId == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No valid video ID found for this recording.'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
      return;
    }

    if (mounted) {
      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (_) => VideoPlayerScreen(
            videoId: videoId,
            title: recording['title'] ?? 'Session Recording',
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _recordings.where((r) {
      final title = (r['title'] as String?)?.toLowerCase() ?? '';
      return title.contains(_searchQuery.toLowerCase());
    }).toList();

    final displayList = _isLoading ? _skeletonRecordings : filtered;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Session Recordings',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textMain,
                    ),
                  ).animate().fadeIn().slideX(),
                  const SizedBox(height: 8),
                  const Text(
                    'Catch up on missed meetings and project sessions.',
                    style: TextStyle(fontSize: 14, color: AppTheme.textMuted),
                  ).animate().fadeIn(delay: 100.ms).slideX(),
                  const SizedBox(height: 24),

                  // Search Bar
                  Container(
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppTheme.primary.withValues(alpha: 0.15),
                      ),
                    ),
                    child: TextField(
                      style: const TextStyle(color: AppTheme.textMain),
                      decoration: const InputDecoration(
                        hintText: 'Search recordings...',
                        hintStyle: TextStyle(color: AppTheme.textMuted),
                        prefixIcon: Icon(
                          Icons.search,
                          color: AppTheme.textMuted,
                        ),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 14,
                        ),
                      ),
                      onChanged: (val) => setState(() => _searchQuery = val),
                    ),
                  ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1, end: 0),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
          if (!_isLoading && displayList.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      _searchQuery.isNotEmpty
                          ? Icons.search_off
                          : Icons.play_disabled_rounded,
                      size: 64,
                      color: AppTheme.textMuted.withValues(alpha: 0.3),
                    ).animate().scale(),
                    const SizedBox(height: 16),
                    Text(
                      _searchQuery.isNotEmpty
                          ? 'No matching recordings found'
                          : 'No recordings available',
                      style: const TextStyle(
                        fontSize: 16,
                        color: AppTheme.textSecondary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: Skeletonizer(
                enabled: _isLoading,
                child: SliverList(
                  delegate: SliverChildBuilderDelegate((context, index) {
                    final r = displayList[index];
                    final title = r['title'] ?? 'Recording';
                    final videoId =
                        r['youtube_video_id'] ?? _getVideoId(r['youtube_url']);
                    final thumbUrl =
                        r['thumbnail_url'] ??
                        (videoId != null
                            ? 'https://img.youtube.com/vi/$videoId/mqdefault.jpg'
                            : null);
                    final date =
                        DateTime.tryParse(r['created_at'] ?? '') ??
                        DateTime.now();
                    final dateStr = '${date.day}/${date.month}/${date.year}';
                    final duration = r['duration_label'] ?? 'Video';

                    return Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: Material(
                            color: AppTheme.bgCard,
                            borderRadius: BorderRadius.circular(16),
                            clipBehavior: Clip.antiAlias,
                            child: InkWell(
                              onTap: _isLoading
                                  ? null
                                  : () => _openRecording(r),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  // Thumbnail Area
                                  AspectRatio(
                                    aspectRatio: 16 / 9,
                                    child: Stack(
                                      fit: StackFit.expand,
                                      children: [
                                        if (thumbUrl != null)
                                          CachedNetworkImage(
                                            imageUrl: thumbUrl,
                                            fit: BoxFit.cover,
                                            errorWidget:
                                                (context, url, error) =>
                                                    Container(
                                                      color: Colors.black26,
                                                      child: const Icon(
                                                        Icons.videocam,
                                                        color:
                                                            AppTheme.textMuted,
                                                        size: 48,
                                                      ),
                                                    ),
                                          )
                                        else
                                          Container(
                                            color: Colors.black26,
                                            child: const Icon(
                                              Icons.videocam,
                                              color: AppTheme.textMuted,
                                              size: 48,
                                            ),
                                          ),
                                        // Dark Overlay on bottom
                                        Positioned(
                                          bottom: 0,
                                          left: 0,
                                          right: 0,
                                          height: 40,
                                          child: DecoratedBox(
                                            decoration: BoxDecoration(
                                              gradient: LinearGradient(
                                                begin: Alignment.bottomCenter,
                                                end: Alignment.topCenter,
                                                colors: [
                                                  Colors.black.withValues(
                                                    alpha: 0.8,
                                                  ),
                                                  Colors.transparent,
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                        // Duration badge
                                        Positioned(
                                          bottom: 8,
                                          right: 8,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 6,
                                              vertical: 2,
                                            ),
                                            decoration: BoxDecoration(
                                              color: Colors.black.withValues(
                                                alpha: 0.8,
                                              ),
                                              borderRadius:
                                                  BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              duration,
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 10,
                                                fontWeight: FontWeight.bold,
                                              ),
                                            ),
                                          ),
                                        ),
                                        // Play icon center overlay
                                        Center(
                                          child: Container(
                                            width: 48,
                                            height: 48,
                                            decoration: BoxDecoration(
                                              color: Colors.black.withValues(
                                                alpha: 0.5,
                                              ),
                                              shape: BoxShape.circle,
                                              border: Border.all(
                                                color: Colors.white.withValues(
                                                  alpha: 0.5,
                                                ),
                                              ),
                                            ),
                                            child: const Icon(
                                              Icons.play_arrow_rounded,
                                              color: Colors.white,
                                              size: 32,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  // Details Area
                                  Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          title,
                                          style: const TextStyle(
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                            color: AppTheme.textMain,
                                          ),
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                        const SizedBox(height: 8),
                                        Row(
                                          children: [
                                            const Icon(
                                              Icons.calendar_today,
                                              size: 12,
                                              color: AppTheme.textMuted,
                                            ),
                                            const SizedBox(width: 6),
                                            Text(
                                              dateStr,
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: AppTheme.textMuted,
                                              ),
                                            ),
                                            const Spacer(),
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
                          ),
                        )
                        .animate()
                        .fadeIn(delay: (100 * (index % 5)).ms)
                        .slideY(begin: 0.1, end: 0);
                  }, childCount: displayList.length),
                ),
              ),
            ),
          // Bottom padding for nav bar overscroll
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ),
    );
  }
}
