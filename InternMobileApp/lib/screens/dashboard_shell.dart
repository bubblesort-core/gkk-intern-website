import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:internmobileapp/theme/app_theme.dart';
import 'package:internmobileapp/services/supabase_service.dart';
import 'package:internmobileapp/services/notification_service.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:internmobileapp/utils/url_utils.dart';
import 'package:internmobileapp/screens/overview_screen.dart';
import 'package:internmobileapp/screens/profile_screen.dart';
import 'package:internmobileapp/screens/projects_screen.dart';
import 'package:internmobileapp/screens/teams_screen.dart';
import 'package:internmobileapp/screens/announcements_screen.dart';
import 'package:internmobileapp/screens/meetings_screen.dart';
import 'package:internmobileapp/screens/recordings_screen.dart';

import 'package:internmobileapp/screens/leaderboard_screen.dart';
import 'package:internmobileapp/screens/resources_screen.dart';
import 'package:internmobileapp/screens/rewards_screen.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:internmobileapp/services/update_service.dart';
import 'package:internmobileapp/screens/update_modal.dart';
import 'package:flutter_animate/flutter_animate.dart';

class DashboardShell extends StatefulWidget {
  const DashboardShell({super.key});

  @override
  State<DashboardShell> createState() => _DashboardShellState();
}

class _DashboardShellState extends State<DashboardShell> {
  int _currentIndex = 0;
  Map<String, dynamic>? _profile;
  bool _isLoading = true;
  final _notifService = NotificationService();

  final List<_NavItem> _navItems = [
    _NavItem('Overview', Icons.home_rounded, null),
    _NavItem('Profile', Icons.person_rounded, null),
    _NavItem('Projects', Icons.layers_rounded, null),
    _NavItem('Team', Icons.group_rounded, null),
    _NavItem('Leaderboard', Icons.leaderboard_rounded, 'leaderboard'),
    _NavItem('Updates', Icons.campaign_rounded, 'announcements'),
    _NavItem('Sessions', Icons.videocam_rounded, 'sessions'),
    _NavItem('Recordings', Icons.play_circle_outline_rounded, 'recordings'),

    _NavItem('Resources', Icons.menu_book_rounded, 'resources'),
    _NavItem('Rewards', Icons.card_giftcard_rounded, null),
  ];

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _loadProfile();

    _screens = [
      OverviewScreen(onNavigate: _navigateTo),
      const ProfileScreen(),
      const ProjectsScreen(),
      const TeamsScreen(),
      const LeaderboardScreen(),
      const AnnouncementsScreen(),
      const MeetingsScreen(),
      const RecordingsScreen(),

      const ResourcesScreen(),
      const RewardsScreen(),
    ];

    // Handle background notification taps
    _notifService.onNotificationTap = (section) {
      final index = _navItems.indexWhere((n) => n.table == section);
      if (index >= 0) {
        _navigateTo(index);
      } else if (section == 'notifications') {
        _showNotificationSheet();
      }
    };
  }

  void _navigateTo(int index) {
    if (index >= 0 && index < _screens.length) {
      HapticFeedback.lightImpact();
      setState(() => _currentIndex = index);
      _markCurrentSectionSeen(index);
    }
  }

  void _markCurrentSectionSeen(int index) {
    final table = _navItems[index].table;
    if (table != null) {
      _notifService.markSectionSeen(table);
    }
  }

  Future<void> _loadProfile() async {
    final p = await SupabaseService.getCurrentProfile();
    if (mounted) {
      setState(() {
        _profile = p;
        _isLoading = false;
      });
    }
  }

  /// Build an icon with an optional red badge dot
  Widget _buildBadgedIcon(
    IconData icon,
    String? table, {
    Color? color,
    double size = 22,
  }) {
    return ValueListenableBuilder<Set<String>>(
      valueListenable: _notifService.unreadSections,
      builder: (ctx, unread, _) {
        final hasBadge = table != null && unread.contains(table);
        return Stack(
          clipBehavior: Clip.none,
          children: [
            Icon(icon, color: color, size: size),
            if (hasBadge)
              Positioned(
                right: -4,
                top: -4,
                child: Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEF4444),
                    shape: BoxShape.circle,
                    border: Border.all(color: AppTheme.bgBody, width: 1.5),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  void _showNotificationSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.bgCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => ValueListenableBuilder<List<NotificationItem>>(
        valueListenable: _notifService.notifications,
        builder: (ctx, items, _) {
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.textMuted.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Text(
                        'Notifications',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textMain,
                        ),
                      ),
                      const Spacer(),
                      if (items.isNotEmpty)
                        TextButton(
                          onPressed: () {
                            _notifService.clearAll();
                            Navigator.pop(ctx);
                          },
                          child: const Text(
                            'Clear all',
                            style: TextStyle(
                              color: AppTheme.primary,
                              fontSize: 13,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (items.isEmpty)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 32),
                      child: Column(
                        children: [
                          Icon(
                            Icons.notifications_none,
                            size: 48,
                            color: AppTheme.textMuted.withValues(alpha: 0.4),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            "You're all caught up! 🎉",
                            style: TextStyle(
                              color: AppTheme.textMuted,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    ...items.map((item) => _buildNotifTile(ctx, item)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildNotifTile(BuildContext ctx, NotificationItem item) {
    final targetIndex = _navItems.indexWhere((n) => n.table == item.section);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: () {
            Navigator.pop(ctx);
            if (targetIndex >= 0) _navigateTo(targetIndex);
          },
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.bgBody,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppTheme.primary.withValues(alpha: 0.2),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(item.icon, color: AppTheme.primary, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.title,
                        style: const TextStyle(
                          color: AppTheme.textMain,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        item.subtitle,
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right,
                  color: AppTheme.textMuted,
                  size: 20,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppTheme.bgBody,
        body: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
      );
    }

    // Check if user is locked out
    final isLocked =
        _profile?['status'] != 'active' && _profile?['role'] == 'intern';

    if (isLocked) {
      return _buildLockedScreen();
    }

    final name = _profile?['full_name'] ?? 'Intern';
    final email = SupabaseService.currentUser?.email ?? '';
    final avatarUrl = _profile?['avatar_url'];

    return Scaffold(
      backgroundColor: AppTheme.bgBody,
      appBar: AppBar(
        backgroundColor: AppTheme.bgCard,
        surfaceTintColor: Colors.transparent,
        title: Text(
          _navItems[_currentIndex].label,
          style: const TextStyle(
            color: AppTheme.textMain,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        iconTheme: const IconThemeData(color: AppTheme.textMain),
        actions: [
          ValueListenableBuilder<bool>(
            valueListenable: UpdateService().updateAvailable,
            builder: (ctx, available, _) {
              if (!available) return const SizedBox.shrink();
              return Container(
                    margin: const EdgeInsets.symmetric(
                      vertical: 8,
                      horizontal: 8,
                    ),
                    child: TextButton.icon(
                      onPressed: () {
                        UpdateModal.show(context);
                      },
                      icon: const Icon(
                        Icons.upgrade,
                        size: 18,
                        color: Colors.white,
                      ),
                      label: const Text(
                        'Update available',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      style: TextButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        padding: const EdgeInsets.symmetric(horizontal: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(20),
                        ),
                      ),
                    ),
                  )
                  .animate(
                    onPlay: (controller) => controller.repeat(reverse: true),
                  )
                  .shimmer(
                    duration: 2.seconds,
                    color: Colors.white.withValues(alpha: 0.3),
                  )
                  .scale(
                    begin: const Offset(1, 1),
                    end: const Offset(1.05, 1.05),
                    duration: 1.seconds,
                  );
            },
          ),

          // Notification Bell with Badge
          ValueListenableBuilder<int>(
            valueListenable: _notifService.unreadCount,
            builder: (ctx, count, _) {
              return Stack(
                children: [
                  IconButton(
                    icon: Icon(
                      count > 0
                          ? Icons.notifications_active
                          : Icons.notifications_outlined,
                      color: count > 0 ? AppTheme.primary : AppTheme.textMuted,
                    ),
                    onPressed: _showNotificationSheet,
                  ),
                  if (count > 0)
                    Positioned(
                      right: 6,
                      top: 6,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Color(0xFFEF4444),
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 18,
                          minHeight: 18,
                        ),
                        child: Text(
                          count > 9 ? '9+' : '$count',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      drawer: Drawer(
        backgroundColor: AppTheme.bgBody,
        child: Column(
          children: [
            // Drawer Header with GKKIntern Branding
            Container(
              padding: const EdgeInsets.fromLTRB(20, 50, 20, 16),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF10B981), Color(0xFF059669)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.asset(
                          'assets/gkk-intern-logo.png',
                          width: 36,
                          height: 36,
                          errorBuilder: (ctx, err, stack) => Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(
                              Icons.work,
                              color: Colors.white,
                              size: 20,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Text(
                        'GKK Intern',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontSize: 18,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Row(
                    children: [
                      Hero(
                        tag: 'profile-avatar',
                        child: CircleAvatar(
                          radius: 24,
                          backgroundColor: Colors.white,
                          backgroundImage: avatarUrl != null
                              ? CachedNetworkImageProvider(
                                  UrlUtils.getProxiedUrl(avatarUrl),
                                )
                              : null,
                          child: avatarUrl == null
                              ? Text(
                                  name.isNotEmpty ? name[0].toUpperCase() : '?',
                                  style: const TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primary,
                                  ),
                                )
                              : null,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                fontSize: 15,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              email,
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.white.withValues(alpha: 0.8),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            // Nav Items with badges
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(vertical: 8),
                itemCount: _navItems.length,
                itemBuilder: (ctx, i) {
                  final isSelected = i == _currentIndex;
                  final navItem = _navItems[i];
                  return Container(
                    margin: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppTheme.primary.withValues(alpha: 0.1)
                          : Colors.transparent,
                      borderRadius: BorderRadius.circular(12),
                      border: isSelected
                          ? Border.all(
                              color: AppTheme.primary.withValues(alpha: 0.25),
                            )
                          : null,
                    ),
                    child: ListTile(
                      leading: _buildBadgedIcon(
                        navItem.icon,
                        navItem.table,
                        color: isSelected
                            ? AppTheme.primary
                            : AppTheme.textMuted,
                      ),
                      title: Text(
                        navItem.label,
                        style: TextStyle(
                          color: isSelected
                              ? AppTheme.primary
                              : AppTheme.textBody,
                          fontWeight: isSelected
                              ? FontWeight.w600
                              : FontWeight.normal,
                          fontSize: 14,
                        ),
                      ),
                      onTap: () {
                        _navigateTo(i);
                        Navigator.pop(context);
                      },
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  );
                },
              ),
            ),
            // Sign Out
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: AppTheme.border.withValues(alpha: 0.5),
                  ),
                ),
              ),
              child: ListTile(
                leading: const Icon(
                  Icons.logout,
                  color: Color(0xFFEF4444),
                  size: 22,
                ),
                title: const Text(
                  'Sign Out',
                  style: TextStyle(
                    color: Color(0xFFEF4444),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                tileColor: const Color(0xFFEF4444).withValues(alpha: 0.05),
                onTap: () async {
                  await NotificationService().clearToken();
                  await SupabaseService.signOut();
                },
              ),
            ),
          ],
        ),
      ),
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        switchInCurve: Curves.easeOut,
        switchOutCurve: Curves.easeIn,
        child: KeyedSubtree(
          key: ValueKey(_currentIndex),
          child: _screens[_currentIndex],
        ),
      ),
      // Bottom Nav with badges
      bottomNavigationBar: ValueListenableBuilder<Set<String>>(
        valueListenable: _notifService.unreadSections,
        builder: (ctx, unread, _) {
          return Container(
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              border: Border(
                top: BorderSide(color: AppTheme.border.withValues(alpha: 0.5)),
              ),
            ),
            child: BottomNavigationBar(
              currentIndex: _currentIndex < 4 ? _currentIndex : 0,
              onTap: (i) => _navigateTo(i),
              backgroundColor: Colors.transparent,
              elevation: 0,
              type: BottomNavigationBarType.fixed,
              selectedItemColor: AppTheme.primary,
              unselectedItemColor: AppTheme.textMuted,
              selectedFontSize: 11,
              unselectedFontSize: 11,
              items: [
                BottomNavigationBarItem(
                  icon: _buildBadgedIcon(
                    Icons.home_rounded,
                    null,
                    color: _currentIndex == 0
                        ? AppTheme.primary
                        : AppTheme.textMuted,
                  ),
                  label: 'Home',
                ),
                BottomNavigationBarItem(
                  icon: _buildBadgedIcon(
                    Icons.person_rounded,
                    null,
                    color: _currentIndex == 1
                        ? AppTheme.primary
                        : AppTheme.textMuted,
                  ),
                  label: 'Profile',
                ),
                BottomNavigationBarItem(
                  icon: _buildBadgedIcon(
                    Icons.layers_rounded,
                    null,
                    color: _currentIndex == 2
                        ? AppTheme.primary
                        : AppTheme.textMuted,
                  ),
                  label: 'Projects',
                ),
                BottomNavigationBarItem(
                  icon: _buildBadgedIcon(
                    Icons.group_rounded,
                    null,
                    color: _currentIndex == 3
                        ? AppTheme.primary
                        : AppTheme.textMuted,
                  ),
                  label: 'Team',
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildLockedScreen() {
    return Scaffold(
      backgroundColor: AppTheme.bgBody,
      appBar: AppBar(
        backgroundColor: AppTheme.bgCard,
        surfaceTintColor: Colors.transparent,
        title: const Text(
          'Account Locked',
          style: TextStyle(color: AppTheme.textMain),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Color(0xFFEF4444)),
            onPressed: () async {
              await NotificationService().clearToken();
              await SupabaseService.signOut();
            },
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 400),
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.border),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black26,
                  blurRadius: 20,
                  offset: Offset(0, 10),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.lock_outline_rounded,
                  size: 64,
                  color: AppTheme.primary,
                ).animate().scale(delay: 200.ms).fadeIn(),
                const SizedBox(height: 24),
                const Text(
                  'Access Restricted',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textMain,
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Your account is not yet active. Please complete the payment of your training fees on the dashboard to unlock your workspace.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.textMuted,
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 32),
                ElevatedButton.icon(
                  onPressed: () async {
                    final url = Uri.parse(
                      'https://gkk-intern.com/user/dashboard/payment',
                    );
                    if (await canLaunchUrl(url)) {
                      await launchUrl(
                        url,
                        mode: LaunchMode.externalApplication,
                      );
                    }
                  },
                  icon: const Icon(Icons.payment_rounded, color: Colors.white),
                  label: const Text('Pay Training Fees'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    padding: const EdgeInsets.symmetric(
                      vertical: 16,
                      horizontal: 24,
                    ),
                    textStyle: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ).animate().slideY(begin: 0.2, end: 0).fadeIn(delay: 400.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final String label;
  final IconData icon;
  final String? table;
  const _NavItem(this.label, this.icon, this.table);
}
