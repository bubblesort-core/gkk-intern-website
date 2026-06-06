import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/supabase_client.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../theme/colors.dart';
import '../../widgets/shimmer_loader.dart';
import '../main_tabs.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<dynamic> _announcements = [];
  bool _loadingAnnouncements = true;

  @override
  void initState() {
    super.initState();
    _fetchAnnouncements();
  }

  Future<void> _fetchAnnouncements() async {
    if (!mounted) return;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final dashboardProvider = Provider.of<DashboardProvider>(context, listen: false);
    final userId = authProvider.profile?['userProfile']?['id'];
    final teamId = dashboardProvider.currentTeam?['id'];
    final batchId = dashboardProvider.currentTeam?['batch_id'];
    if (userId == null) return;

    try {
      final response = await SupabaseClientConfig.client.rpc('get_targeted_announcements', params: {
        'p_user_id': userId,
        'p_team_id': teamId,
        'p_batch': batchId,
      });
      if (mounted) {
        setState(() {
          _announcements = response as List<dynamic>? ?? [];
          _loadingAnnouncements = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading announcements: $e');
      if (mounted) setState(() => _loadingAnnouncements = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final dashboardProvider = Provider.of<DashboardProvider>(context);

    if (dashboardProvider.loadingDashboard) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const ShimmerBox(width: 200, height: 28, borderRadius: 10),
                const SizedBox(height: 8),
                const ShimmerBox(width: 280, height: 14),
                const SizedBox(height: 24),
                const SkeletonStatsGrid(),
                const SizedBox(height: 24),
                const ShimmerBox(width: 150, height: 18),
                const SizedBox(height: 14),
                const SkeletonCard(height: 130),
                const SkeletonCard(height: 100),
              ],
            ),
          ),
        ),
      );
    }

    final profile = authProvider.profile;
    final currentTeam = dashboardProvider.currentTeam;
    final currentProjects = dashboardProvider.currentProjects;
    final workshops = dashboardProvider.workshops;

    final userName = profile?['userProfile']?['full_name'] ?? profile?['application']?['full_name'] ?? 'Intern';
    final firstName = userName.split(' ')[0];
    final role = currentTeam?['myRole'] ?? 'Intern';
    final streak = profile?['userProfile']?['current_streak'] ?? 0;
    final projectCount = currentProjects.length;
    final workshopCount = workshops.length;
    final memberCount = (currentTeam?['team_members'] as List?)?.length ?? 0;
    final completedCount = currentProjects.where((p) => p['status'] == 'completed' || p['status'] == 'approved').length;

    // Active project for "Current Focus"
    final activeProject = currentProjects.cast<Map<String, dynamic>?>().firstWhere(
      (p) => p?['status'] == 'in_progress',
      orElse: () => currentProjects.cast<Map<String, dynamic>?>().firstWhere(
        (p) => p?['status'] == 'assigned',
        orElse: () => currentProjects.isNotEmpty ? currentProjects[0] : null,
      ),
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          backgroundColor: AppColors.card,
          onRefresh: () async {
            final authProvider = Provider.of<AuthProvider>(context, listen: false);
            final dashboardProvider = Provider.of<DashboardProvider>(context, listen: false);
            setState(() => _loadingAnnouncements = true);
            await _fetchAnnouncements();
            final userId = authProvider.profile?['userProfile']?['id'];
            if (userId != null) {
              await dashboardProvider.fetchDashboardData(userId, forceRefresh: true);
            }
          },
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
            children: [
              // ─── Hero Section ───
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0.0, end: 1.0),
                duration: const Duration(milliseconds: 500),
                curve: Curves.easeOut,
                builder: (_, val, child) => Opacity(opacity: val, child: Transform.translate(offset: Offset(0, 20 * (1 - val)), child: child)),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF111118), Color(0xFF0d1a14)],
                    ),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Welcome back, $firstName', style: const TextStyle(color: AppColors.text, fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.5)),
                      const SizedBox(height: 8),
                      Text("Keep momentum by staying aligned with your projects.", style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.4)),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 8,
                        children: [
                          _pill(role.toUpperCase(), AppColors.primary, AppColors.primaryMuted),
                          if (currentTeam?['batches']?['name'] != null)
                            _pill(currentTeam!['batches']['name'], AppColors.info, AppColors.info.withValues(alpha: 0.1)),
                          if (currentTeam?['name'] != null)
                            _pill(currentTeam!['name'], const Color(0xFFa855f7), const Color(0x1Aa855f7)),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // ─── Stats Grid ───
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.55,
                children: [
                  _StatCard(icon: Icons.layers_outlined, color: AppColors.info, value: projectCount.toString(), label: 'Active Projects'),
                  _StatCard(icon: Icons.school_outlined, color: const Color(0xFFa855f7), value: workshopCount.toString(), label: 'Live Workshops'),
                  _StatCard(icon: Icons.people_outline, color: AppColors.success, value: memberCount.toString(), label: 'Team Members'),
                  _StatCard(icon: Icons.local_fire_department, color: AppColors.warning, value: streak.toString(), label: 'Day Streak'),
                ],
              ),
              const SizedBox(height: 28),

              // ─── Current Focus ───
              _sectionTitle('Current Focus'),
              const SizedBox(height: 14),
              activeProject != null
                  ? _buildCurrentFocus(activeProject)
                  : _emptyMini(Icons.layers_outlined, 'No active projects'),
              const SizedBox(height: 28),

              // ─── Progress Timeline ───
              _sectionTitle('Progress Timeline'),
              const SizedBox(height: 14),
              _buildTimeline(streak, completedCount, workshopCount, activeProject),
              const SizedBox(height: 28),

              // ─── Special Workshops ───
              if (workshops.isNotEmpty) ...[
                _sectionTitle('Special Workshops'),
                const SizedBox(height: 14),
                _buildWorkshopsList(workshops),
                const SizedBox(height: 28),
              ],

              // ─── Quick Actions ───
              _sectionTitle('Quick Actions'),
              const SizedBox(height: 14),
              _buildQuickActions(),
              const SizedBox(height: 28),

              // ─── Tip of the Day ───
              _sectionTitle('Tip of the Day'),
              const SizedBox(height: 14),
              _buildTipOfTheDay(),
              const SizedBox(height: 28),

              // ─── Latest Announcements ───
              _sectionTitle('Latest Updates'),
              const SizedBox(height: 14),
              if (_loadingAnnouncements)
                const SkeletonList(itemCount: 2, cardHeight: 90)
              else if (_announcements.isEmpty)
                _emptyMini(Icons.campaign_outlined, "You're all caught up!")
              else
                ..._announcements.take(3).map((a) => _buildAnnouncementCard(a)),
            ],
          ),
        ),
      ),
    );
  }

  // ── Helpers ──

  Widget _pill(String text, Color textColor, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(text, style: TextStyle(color: textColor, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }

  Widget _sectionTitle(String title) {
    return Row(
      children: [
        Container(width: 3, height: 16, decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(4))),
        const SizedBox(width: 10),
        Text(title, style: const TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _emptyMini(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 30),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      alignment: Alignment.center,
      child: Column(
        children: [
          Icon(icon, size: 32, color: AppColors.border),
          const SizedBox(height: 10),
          Text(text, style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
        ],
      ),
    );
  }

  Widget _buildCurrentFocus(dynamic project) {
    final status = (project['status'] ?? 'assigned').toString();
    final statusLabel = status == 'in_progress' ? 'Active' : status == 'completed' || status == 'approved' ? 'Completed' : 'Pending';
    Color statusColor;
    switch (status) {
      case 'in_progress': statusColor = AppColors.info; break;
      case 'completed': case 'approved': statusColor = AppColors.success; break;
      case 'changes_requested': statusColor = AppColors.warning; break;
      default: statusColor = AppColors.textSecondary;
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(width: 8, height: 8, decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle)),
              const SizedBox(width: 8),
              Text(statusLabel.toUpperCase(), style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
            ],
          ),
          const SizedBox(height: 10),
          Text(project['title'] ?? '', style: const TextStyle(color: AppColors.text, fontSize: 17, fontWeight: FontWeight.w600)),
          if (project['description'] != null) ...[
            const SizedBox(height: 6),
            Text(project['description'], maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4)),
          ],
        ],
      ),
    );
  }

  Widget _buildTimeline(int streak, int completedCount, int workshopCount, dynamic activeProject) {
    final events = [
      _TimelineItem('Consistency Streak', '$streak day${streak == 1 ? '' : 's'}', streak > 0 ? 'Active' : 'Pending'),
      _TimelineItem('Current Project', activeProject != null ? (activeProject['status'] ?? 'assigned').toString().replaceAll('_', ' ') : 'Awaiting assignment', activeProject != null ? 'Active' : 'Pending'),
      _TimelineItem('Completed Projects', '$completedCount completed', completedCount > 0 ? 'Completed' : 'Pending'),
      _TimelineItem('Workshop Activity', '$workshopCount live sessions', workshopCount > 0 ? 'Active' : 'Locked'),
    ];

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        children: events.asMap().entries.map((entry) {
          final i = entry.key;
          final e = entry.value;
          final isLast = i == events.length - 1;
          Color dotColor;
          switch (e.status) {
            case 'Active': dotColor = AppColors.primary; break;
            case 'Completed': dotColor = AppColors.success; break;
            case 'Locked': dotColor = AppColors.textFaint; break;
            default: dotColor = AppColors.warning;
          }
          Color badgeBg;
          Color badgeText;
          switch (e.status) {
            case 'Active': badgeBg = AppColors.primaryMuted; badgeText = AppColors.primary; break;
            case 'Completed': badgeBg = AppColors.success.withValues(alpha: 0.1); badgeText = AppColors.success; break;
            case 'Locked': badgeBg = AppColors.elevated; badgeText = AppColors.textFaint; break;
            default: badgeBg = AppColors.warning.withValues(alpha: 0.1); badgeText = AppColors.warning;
          }

          return Padding(
            padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(width: 10, height: 10, decoration: BoxDecoration(color: dotColor, shape: BoxShape.circle)),
                    if (!isLast) Container(width: 2, height: 30, color: AppColors.border),
                  ],
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(e.title, style: const TextStyle(color: AppColors.text, fontSize: 14, fontWeight: FontWeight.w600)),
                            const SizedBox(height: 2),
                            Text(e.value, style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: badgeBg, borderRadius: BorderRadius.circular(8)),
                        child: Text(e.status, style: TextStyle(color: badgeText, fontSize: 10, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildQuickActions() {
    return Row(
      children: [
        _quickAction(Icons.videocam_outlined, 'Meetings', AppColors.info, 'meetings'),
        const SizedBox(width: 12),
        _quickAction(Icons.library_books_outlined, 'Resources', AppColors.success, 'resources'),
        const SizedBox(width: 12),
        _quickAction(Icons.play_circle_outline, 'Recordings', const Color(0xFFa855f7), 'recordings'),
      ],
    );
  }

  Widget _quickAction(IconData icon, String label, Color color, String routeId) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          MainTabs.of(context)?.navigateTo(routeId);
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 18),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            children: [
              Container(
                width: 40, height: 40,
                decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(height: 8),
              Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAnnouncementCard(dynamic a) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(color: AppColors.primaryMuted, borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.campaign_outlined, color: AppColors.primary, size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(a['title'] ?? '', style: const TextStyle(color: AppColors.text, fontSize: 15, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(a['content'] ?? a['message'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWorkshopsList(List<dynamic> workshops) {
    return Column(
      children: workshops.take(2).map((w) {
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF14141e),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0x33a855f7)),
          ),
          child: Row(
            children: [
              if (w['hero_image_url'] != null)
                Container(
                  width: 60, height: 60,
                  margin: const EdgeInsets.only(right: 14),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    image: DecorationImage(image: NetworkImage(w['hero_image_url']), fit: BoxFit.cover),
                  ),
                ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(w['title'] ?? 'Workshop', style: const TextStyle(color: AppColors.text, fontSize: 15, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(w['description'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.3)),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              const Icon(Icons.chevron_right, color: AppColors.border, size: 20),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildTipOfTheDay() {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF1a1814),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0x33f59e0b)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.lightbulb_outline, color: AppColors.warning, size: 24),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Daily Tip', style: TextStyle(color: AppColors.warning, fontSize: 14, fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                const Text('Update your daily status in the Team Chat to keep your mentors informed.', style: TextStyle(color: AppColors.text, fontSize: 14, height: 1.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TimelineItem {
  final String title;
  final String value;
  final String status;
  _TimelineItem(this.title, this.value, this.status);
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String value;
  final String label;

  const _StatCard({required this.icon, required this.color, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF1e3a8a), // Deep Blue
            Color(0xFF3b82f6), // Vibrant Blue
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF3b82f6).withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: Colors.white, size: 20),
              ),
              Flexible(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    value,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.9),
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
