import 'package:flutter/material.dart';
import 'package:internmobileapp/theme/app_theme.dart';
import 'package:internmobileapp/services/supabase_service.dart';
import 'package:internmobileapp/services/update_service.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:internmobileapp/utils/url_utils.dart';

class TeamsScreen extends StatefulWidget {
  const TeamsScreen({super.key});

  @override
  State<TeamsScreen> createState() => _TeamsScreenState();
}

class _TeamsScreenState extends State<TeamsScreen> {
  Map<String, dynamic>? _teamInfo;
  List<Map<String, dynamic>> _members = [];
  bool _isLoading = true;

  static const _skeletonMembers = [
    {
      'role': 'lead',
      'profiles': {'full_name': 'Team Leader', 'email': 'lead@example.com'},
    },
    {
      'role': 'member',
      'profiles': {'full_name': 'Intern Member', 'email': 'member@example.com'},
    },
    {
      'role': 'member',
      'profiles': {
        'full_name': 'Another Intern',
        'email': 'intern@example.com',
      },
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadTeam();
  }

  Future<void> _loadTeam() async {
    final teamInfo = await SupabaseService.getMyTeam();
    List<Map<String, dynamic>> members = [];
    if (teamInfo != null && teamInfo['team_id'] != null) {
      members = await SupabaseService.getTeamMembers(teamInfo['team_id']);
    }
    if (mounted) {
      setState(() {
        _teamInfo = teamInfo;
        _members = members;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final team = _teamInfo?['teams'];
    final teamName = team?['name'] ?? 'Your Team';
    final teamDesc = team?['description'] ?? '';
    final myRole = _teamInfo?['role'] ?? 'member';
    final members = _isLoading ? _skeletonMembers : _members;

    return Skeletonizer(
      enabled: _isLoading,
      child: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: () async {
          await Future.wait([_loadTeam(), UpdateService().checkForUpdate()]);
        },
        child: _teamInfo == null && !_isLoading
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.group_off_outlined,
                      size: 64,
                      color: AppTheme.textMuted.withValues(alpha: 0.5),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'No team yet',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textMain,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'You are not assigned to any team yet.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: AppTheme.textMuted),
                    ),
                  ],
                ),
              )
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Team Header
                  Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6366F1), Color(0xFF8B5CF6)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                const Icon(
                                  Icons.groups,
                                  color: Colors.white,
                                  size: 28,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    teamName,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            if (teamDesc.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              Text(
                                teamDesc,
                                style: TextStyle(
                                  color: Colors.white.withValues(alpha: 0.8),
                                  fontSize: 13,
                                ),
                              ),
                            ],
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                'Your role: $myRole',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ),
                          ],
                        ),
                      )
                      .animate()
                      .fadeIn(duration: 500.ms)
                      .slideY(begin: 0.2, end: 0),
                  const SizedBox(height: 20),

                  // Members
                  const Text(
                    'Team Members',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textMain,
                    ),
                  ).animate().fadeIn(delay: 200.ms),
                  const SizedBox(height: 12),
                  ...members.asMap().entries.map((entry) {
                    final i = entry.key;
                    final m = entry.value;
                    final profile = m['profiles'];
                    final memberName = profile?['full_name'] ?? 'Unknown';
                    final memberEmail = profile?['email'] ?? '';
                    final memberAvatar = profile?['avatar_url'];
                    final memberRole = m['role'] ?? 'member';

                    return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppTheme.bgCard,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 22,
                                backgroundColor: AppTheme.primary.withValues(
                                  alpha: 0.2,
                                ),
                                backgroundImage: memberAvatar != null
                                    ? CachedNetworkImageProvider(
                                        UrlUtils.getProxiedUrl(memberAvatar),
                                      )
                                    : null,
                                child: memberAvatar == null
                                    ? Text(
                                        memberName.isNotEmpty
                                            ? memberName[0].toUpperCase()
                                            : '?',
                                        style: const TextStyle(
                                          color: AppTheme.primary,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      )
                                    : null,
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      memberName,
                                      style: const TextStyle(
                                        color: AppTheme.textMain,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    Text(
                                      memberEmail,
                                      style: const TextStyle(
                                        color: AppTheme.textMuted,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color: memberRole == 'lead'
                                      ? const Color(
                                          0xFFF59E0B,
                                        ).withValues(alpha: 0.15)
                                      : AppTheme.bgBody,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  memberRole,
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                    color: memberRole == 'lead'
                                        ? const Color(0xFFF59E0B)
                                        : AppTheme.textMuted,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )
                        .animate()
                        .fadeIn(duration: 400.ms, delay: (200 + i * 100).ms)
                        .slideX(begin: 0.1, end: 0);
                  }),
                ],
              ),
      ),
    );
  }
}
