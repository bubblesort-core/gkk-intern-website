import 'package:flutter/material.dart';
import 'package:internmobileapp/theme/app_theme.dart';
import 'package:internmobileapp/services/supabase_service.dart';
import 'package:internmobileapp/services/update_service.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:skeletonizer/skeletonizer.dart';

class OverviewScreen extends StatefulWidget {
  final void Function(int index)? onNavigate;
  const OverviewScreen({super.key, this.onNavigate});

  @override
  State<OverviewScreen> createState() => _OverviewScreenState();
}

class _OverviewScreenState extends State<OverviewScreen> {
  Map<String, dynamic>? _profile;
  int _projectCount = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        SupabaseService.getCurrentProfile(),
        SupabaseService.getMyProjects(),
        SupabaseService.getMyTeam(),
      ]);

      if (mounted) {
        final profile = results[0] as Map<String, dynamic>?;
        final teamData = results[2] as Map<String, dynamic>?;

        if (profile != null && teamData != null && teamData['teams'] != null) {
          final team = teamData['teams'];
          profile['team_name'] = team['name'];
          if (team['batches'] != null) {
            profile['batch_name'] = team['batches']['name'];
          }
        }

        setState(() {
          _profile = profile;
          _projectCount = (results[1] as List).length;
        });
      }
    } catch (e) {
      debugPrint('Error loading overview data: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<Map<String, dynamic>?>(
      stream: SupabaseService.getProfileStream(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          debugPrint('Profile stream error: ${snapshot.error}');
        }
        if (snapshot.connectionState == ConnectionState.waiting &&
            _profile == null) {
          return const Center(
            child: CircularProgressIndicator(color: AppTheme.primary),
          );
        }

        var profile = snapshot.data ?? _profile;
        if (profile != null && _profile != null) {
          // Re-inject the manually fetched data from initState over the stream data
          if (_profile!['team_name'] != null)
            profile['team_name'] = _profile!['team_name'];
          if (_profile!['batch_name'] != null)
            profile['batch_name'] = _profile!['batch_name'];
        }

        if (profile == null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.person_off,
                  size: 64,
                  color: AppTheme.textMuted.withValues(alpha: 0.5),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Profile not found',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 16),
                ),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: _loadData,
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text('Retry'),
                ),
              ],
            ),
          );
        }

        final name = profile['full_name'] ?? 'Intern';
        final streak = profile['current_streak'] ?? 0;
        final firstName = name.split(' ').first;

        return Skeletonizer(
          enabled: snapshot.connectionState == ConnectionState.waiting,
          child: RefreshIndicator(
            color: AppTheme.primary,
            onRefresh: () async {
              await Future.wait([
                _loadData(),
                UpdateService().checkForUpdate(),
              ]);
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Welcome Hero
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        AppTheme.bgCard,
                        AppTheme.bgBody.withValues(alpha: 0.8),
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: const Border(
                      left: BorderSide(color: AppTheme.primary, width: 4),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome back, $firstName 👋',
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textMain,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        profile['role']?.toString().toUpperCase() ?? 'INTERN',
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        profile['college'] ?? 'No college assigned',
                        style: const TextStyle(
                          color: AppTheme.textBody,
                          fontSize: 14,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ).animate().fadeIn(duration: 500.ms).slideY(begin: 0.2, end: 0),
                const SizedBox(height: 20),

                // Next Session Card
                StreamBuilder<List<Map<String, dynamic>>>(
                  stream: SupabaseService.getActiveSessionsStream(),
                  builder: (context, snapshot) {
                    if (!snapshot.hasData || snapshot.data!.isEmpty)
                      return const SizedBox.shrink();

                    final sessions = snapshot.data!;
                    final now = DateTime.now();

                    final nextSession = sessions
                        .where(
                          (m) =>
                              m['status'] == 'live' ||
                              (m['status'] == 'scheduled' &&
                                  m['scheduled_start'] != null &&
                                  DateTime.parse(
                                    m['scheduled_start'],
                                  ).isAfter(now)),
                        )
                        .firstOrNull;

                    if (nextSession == null) return const SizedBox.shrink();

                    final isActive = nextSession['status'] == 'live';
                    final scheduledStart =
                        nextSession['scheduled_start'] != null
                        ? DateTime.parse(nextSession['scheduled_start'])
                        : null;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 20),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.bgCard,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color:
                              (isActive
                                      ? const Color(0xFFEF4444)
                                      : AppTheme.primary)
                                  .withValues(alpha: 0.5),
                        ),
                      ),
                      child: InkWell(
                        onTap: () => widget.onNavigate?.call(5),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color:
                                    (isActive
                                            ? const Color(0xFFEF4444)
                                            : AppTheme.primary)
                                        .withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(
                                isActive ? Icons.live_tv : Icons.calendar_today,
                                color: isActive
                                    ? const Color(0xFFEF4444)
                                    : AppTheme.primary,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    isActive ? 'Live Now' : 'Upcoming Session',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: isActive
                                          ? const Color(0xFFEF4444)
                                          : AppTheme.primary,
                                    ),
                                  ),
                                  Text(
                                    nextSession['title'] ?? 'Session',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: AppTheme.textMain,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  if (scheduledStart != null && !isActive)
                                    Text(
                                      'Starts at ${scheduledStart.toLocal().toString().substring(11, 16)}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppTheme.textMuted,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            const Icon(
                              Icons.chevron_right,
                              color: AppTheme.textMuted,
                            ),
                          ],
                        ),
                      ),
                    ).animate().fadeIn().slideX();
                  },
                ),

                // Stats Row 1
                Row(
                      children: [
                        _buildStatCard(
                          Icons.layers,
                          '$_projectCount',
                          'Active Projects',
                          const Color(0xFF3B82F6),
                        ),
                        const SizedBox(width: 12),
                        _buildStatCard(
                          Icons.local_fire_department,
                          '$streak',
                          'Day Streak',
                          const Color(0xFFF59E0B),
                        ),
                      ],
                    )
                    .animate()
                    .fadeIn(duration: 500.ms, delay: 200.ms)
                    .slideY(begin: 0.2, end: 0),
                const SizedBox(height: 12),

                // Stats Row 2 (Intern info)
                Row(
                      children: [
                        _buildStatCard(
                          Icons.group,
                          profile['team_name'] ?? 'None',
                          'Team',
                          const Color(0xFF10B981),
                        ),
                        const SizedBox(width: 12),
                        _buildStatCard(
                          Icons.class_,
                          profile['batch_name'] ?? 'Unassigned',
                          'Batch',
                          const Color(0xFF8B5CF6),
                        ),
                      ],
                    )
                    .animate()
                    .fadeIn(duration: 500.ms, delay: 250.ms)
                    .slideY(begin: 0.2, end: 0),
                const SizedBox(height: 20),

                // Quick Actions
                const Text(
                  'Quick Actions',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textMain,
                  ),
                ).animate().fadeIn(duration: 400.ms, delay: 300.ms),
                const SizedBox(height: 12),
                _buildQuickAction(
                      Icons.play_arrow,
                      'Resume Project',
                      'Continue where you left off',
                      const Color(0xFF6366F1),
                      onTap: () => widget.onNavigate?.call(2), // Projects
                    )
                    .animate()
                    .fadeIn(duration: 400.ms, delay: 400.ms)
                    .slideX(begin: 0.1, end: 0),
                const SizedBox(height: 8),
                _buildQuickAction(
                      Icons.group,
                      'Team Chat',
                      'Connect with your teammates',
                      const Color(0xFF10B981),
                      onTap: () => widget.onNavigate?.call(3), // Team
                    )
                    .animate()
                    .fadeIn(duration: 400.ms, delay: 500.ms)
                    .slideX(begin: 0.1, end: 0),
                const SizedBox(height: 8),
                _buildQuickAction(
                      Icons.campaign,
                      'Announcements',
                      'Check latest updates',
                      const Color(0xFFF59E0B),
                      onTap: () => widget.onNavigate?.call(4), // Updates
                    )
                    .animate()
                    .fadeIn(duration: 400.ms, delay: 600.ms)
                    .slideX(begin: 0.1, end: 0),
                const SizedBox(height: 8),
                _buildQuickAction(
                      Icons.videocam,
                      'Meetings',
                      'Join live sessions',
                      const Color(0xFFEF4444),
                      onTap: () => widget.onNavigate?.call(5), // Meetings
                    )
                    .animate()
                    .fadeIn(duration: 400.ms, delay: 700.ms)
                    .slideX(begin: 0.1, end: 0),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatCard(
    IconData icon,
    String value,
    String label,
    Color color,
  ) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppTheme.bgCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textMain,
                    ),
                  ),
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppTheme.textMuted,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAction(
    IconData icon,
    String title,
    String subtitle,
    Color color, {
    VoidCallback? onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        splashColor: color.withValues(alpha: 0.1),
        highlightColor: color.withValues(alpha: 0.05),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.bgCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.border),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textMain,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppTheme.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
