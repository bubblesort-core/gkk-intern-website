import 'package:flutter/material.dart';
import 'package:internmobileapp/theme/app_theme.dart';
import 'package:internmobileapp/services/supabase_service.dart';
import 'package:internmobileapp/services/update_service.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:internmobileapp/utils/url_utils.dart';

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  List<Map<String, dynamic>> _leaderboard = [];

  static const _skeletonLeaderboard = [
    {'full_name': 'Loading User...', 'level': 5, 'xp': 1200},
    {'full_name': 'Rank Holder', 'level': 4, 'xp': 950},
    {'full_name': 'GKK Intern', 'level': 3, 'xp': 800},
    {'full_name': 'Premium Intern', 'level': 2, 'xp': 600},
    {'full_name': 'New Intern', 'level': 1, 'xp': 450},
  ];

  Stream<List<Map<String, dynamic>>>? _stream;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final stream = await SupabaseService.getLeaderboardStream();
    if (mounted) setState(() => _stream = stream);

    final data = await SupabaseService.getLeaderboard();
    if (mounted) setState(() => _leaderboard = data);
  }

  @override
  Widget build(BuildContext context) {
    if (_stream == null) {
      return Skeletonizer(
        enabled: true,
        child: _buildList(_skeletonLeaderboard),
      );
    }

    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: _stream,
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          debugPrint('Leaderboard stream error: ${snapshot.error}');
        }
        final leaderboard = (snapshot.data != null && snapshot.data!.isNotEmpty)
            ? snapshot.data!
            : (snapshot.connectionState == ConnectionState.waiting
                  ? _skeletonLeaderboard
                  : _leaderboard);

        return Skeletonizer(
          enabled: snapshot.connectionState == ConnectionState.waiting,
          child: _buildList(leaderboard),
        );
      },
    );
  }

  Widget _buildList(List<Map<String, dynamic>> leaderboard) {
    return RefreshIndicator(
      color: AppTheme.primary,
      onRefresh: () async {
        await Future.wait([_load(), UpdateService().checkForUpdate()]);
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: leaderboard.length,
        itemBuilder: (ctx, i) {
          final p = leaderboard[i];
          final rank = i + 1;
          final isTop3 = rank <= 3;
          final medalColors = [
            const Color(0xFFFFD700),
            const Color(0xFFC0C0C0),
            const Color(0xFFCD7F32),
          ];
          return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.bgCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isTop3
                        ? medalColors[rank - 1].withValues(alpha: 0.4)
                        : AppTheme.border,
                  ),
                ),
                child: Row(
                  children: [
                    SizedBox(
                      width: 32,
                      child: isTop3
                          ? Icon(
                              Icons.emoji_events,
                              color: medalColors[rank - 1],
                              size: 24,
                            )
                          : Text(
                              '#$rank',
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textMuted,
                              ),
                              textAlign: TextAlign.center,
                            ),
                    ),
                    const SizedBox(width: 12),
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: AppTheme.primary.withValues(alpha: 0.2),
                      backgroundImage: p['avatar_url'] != null
                          ? CachedNetworkImageProvider(
                              UrlUtils.getProxiedUrl(p['avatar_url']),
                            )
                          : null,
                      child: p['avatar_url'] == null
                          ? Text(
                              (p['full_name'] ?? '?')[0].toUpperCase(),
                              style: const TextStyle(
                                color: AppTheme.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            p['full_name'] ?? 'Unknown',
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              color: AppTheme.textMain,
                            ),
                          ),
                          Text(
                            'Level ${p['level'] ?? 1}',
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppTheme.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '${p['xp'] ?? 0} XP',
                      style: TextStyle(
                        fontWeight: FontWeight.w600,
                        color: isTop3
                            ? medalColors[rank - 1]
                            : const Color(0xFFF59E0B),
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
    );
  }
}
