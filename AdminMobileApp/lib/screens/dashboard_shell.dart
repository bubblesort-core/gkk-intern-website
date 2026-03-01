import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_auth_service.dart';
import 'package:admin_mobile_app/services/update_service.dart';
import 'package:admin_mobile_app/screens/update_modal.dart';
import 'package:admin_mobile_app/screens/overview_screen.dart';
import 'package:admin_mobile_app/screens/applications_screen.dart';
import 'package:admin_mobile_app/screens/active_interns_screen.dart';
import 'package:admin_mobile_app/screens/batches_screen.dart';
import 'package:admin_mobile_app/screens/modifications_screen.dart';
import 'package:admin_mobile_app/screens/availability_screen.dart';
import 'package:admin_mobile_app/screens/teams_screen.dart';
import 'package:admin_mobile_app/screens/projects_screen.dart';
import 'package:admin_mobile_app/screens/submissions_screen.dart';
import 'package:admin_mobile_app/screens/rewards_screen.dart';
import 'package:admin_mobile_app/screens/qr_codes_screen.dart';
import 'package:admin_mobile_app/screens/invitations_screen.dart';
import 'package:admin_mobile_app/screens/announcements_screen.dart';
import 'package:admin_mobile_app/screens/resources_screen.dart';
import 'package:admin_mobile_app/screens/meetings_screen.dart';

import 'package:admin_mobile_app/screens/custom_email_screen.dart';
import 'package:admin_mobile_app/screens/push_notifications_screen.dart';
import 'package:admin_mobile_app/screens/payments_screen.dart';
import 'package:admin_mobile_app/screens/activity_logs_screen.dart';
import 'package:flutter_animate/flutter_animate.dart';

class DashboardShell extends StatefulWidget {
  const DashboardShell({super.key});

  @override
  State<DashboardShell> createState() => _DashboardShellState();
}

class _DashboardShellState extends State<DashboardShell> {
  int _currentIndex = 0;
  Map<String, dynamic>? _adminInfo;

  // Navigation items organized by category (matching web sidebar)
  static final List<_NavGroup> _navGroups = [
    _NavGroup('Overview', [_NavItem('Dashboard', Icons.dashboard_rounded)]),
    _NavGroup('Management', [
      _NavItem('Applications', Icons.description_rounded),
      _NavItem('Active Interns', Icons.person_search_rounded),
      _NavItem('Batches', Icons.layers_rounded),
      _NavItem('Access Control', Icons.security_rounded),
      _NavItem('Scheduling Settings', Icons.settings_suggest_rounded),
      _NavItem('Teams', Icons.groups_rounded),
      _NavItem('Projects', Icons.account_tree_rounded),
      _NavItem('Submissions', Icons.cloud_upload_rounded),
      _NavItem('Rewards', Icons.card_giftcard_rounded),
      _NavItem('QR Codes', Icons.qr_code_rounded),
    ]),
    _NavGroup('Communication', [
      _NavItem('Invitations', Icons.mail_rounded),
      _NavItem('Announcements', Icons.campaign_rounded),
      _NavItem('Resources', Icons.menu_book_rounded),
      _NavItem('Live Meetings', Icons.videocam_rounded),

      _NavItem('Custom Email', Icons.send_rounded),
      _NavItem('Push Notifications', Icons.notifications_active_rounded),
    ]),
    _NavGroup('Finance', [_NavItem('Payments', Icons.payments_rounded)]),
    _NavGroup('System', [_NavItem('Activity Logs', Icons.history_rounded)]),
  ];

  // Flatten nav items for indexing
  late final List<_NavItem> _allNavItems;
  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _allNavItems = _navGroups.expand((g) => g.items).toList();
    _loadAdmin();

    _screens = [
      OverviewScreen(onNavigate: _navigateTo),
      const ApplicationsScreen(),
      const ActiveInternsScreen(),
      const BatchesScreen(),
      const ModificationsScreen(),
      const AvailabilityScreen(),
      const TeamsScreen(),
      const ProjectsScreen(),
      const SubmissionsScreen(),
      const RewardsScreen(),
      const QRCodesScreen(),
      const InvitationsScreen(),
      const AnnouncementsScreen(),
      const ResourcesScreen(),
      const MeetingsScreen(),

      const CustomEmailScreen(),
      const PushNotificationsScreen(),
      const PaymentsScreen(),
      const ActivityLogsScreen(),
    ];
  }

  void _navigateTo(int index) {
    if (index >= 0 && index < _screens.length) {
      HapticFeedback.lightImpact();
      setState(() => _currentIndex = index);
    }
  }

  Future<void> _loadAdmin() async {
    final admin = await AdminAuthService().getCurrentAdmin();
    if (mounted) setState(() => _adminInfo = admin);
  }

  Future<void> _manualUpdateCheck() async {
    Navigator.pop(context); // Close drawer
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Checking for updates...'),
        duration: Duration(seconds: 2),
      ),
    );

    final hasUpdate = await UpdateService().checkForUpdate();

    if (mounted) {
      if (hasUpdate) {
        UpdateModal.show(context);
      } else {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('App is up to date')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final adminName = _adminInfo?['displayName'] ?? 'Admin';
    final adminUsername = _adminInfo?['username'] ?? '';

    return Scaffold(
      backgroundColor: AppTheme.bgBody,
      appBar: AppBar(
        backgroundColor: AppTheme.bgCard,
        surfaceTintColor: Colors.transparent,
        title: Text(
          _allNavItems[_currentIndex].label,
          style: const TextStyle(
            color: AppTheme.textMain,
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        iconTheme: const IconThemeData(color: AppTheme.textMain),
        actions: [
          // Update Available Button
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
                      onPressed: () => UpdateModal.show(context),
                      icon: const Icon(
                        Icons.upgrade,
                        size: 18,
                        color: Colors.white,
                      ),
                      label: const Text(
                        'Update',
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
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .shimmer(
                    duration: 2.seconds,
                    color: Colors.white.withValues(alpha: 0.3),
                  );
            },
          ),
          const SizedBox(width: 4),
        ],
      ),

      // ─── DRAWER ───
      drawer: Drawer(
        backgroundColor: AppTheme.bgBody,
        child: Column(
          children: [
            // Header
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.admin_panel_settings,
                          color: Colors.white,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'GKK Admin',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontSize: 18,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundColor: Colors.white,
                        child: Text(
                          adminName.isNotEmpty
                              ? adminName[0].toUpperCase()
                              : 'A',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.primary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              adminName,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                fontSize: 14,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            Text(
                              adminUsername,
                              style: TextStyle(
                                fontSize: 11,
                                color: Colors.white.withValues(alpha: 0.8),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              UpdateService().fullVersion,
                              style: TextStyle(
                                fontSize: 9,
                                color: Colors.white.withValues(alpha: 0.6),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Nav Items by Category
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: _buildDrawerItems(),
              ),
            ),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: AppTheme.border.withValues(alpha: 0.5),
                  ),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ListTile(
                    leading: const Icon(
                      Icons.refresh_rounded,
                      color: AppTheme.primary,
                      size: 22,
                    ),
                    title: const Text(
                      'Check for Updates',
                      style: TextStyle(
                        color: AppTheme.textMain,
                        fontWeight: FontWeight.w500,
                        fontSize: 13,
                      ),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    onTap: _manualUpdateCheck,
                  ),
                  const SizedBox(height: 8),
                  ListTile(
                    leading: const Icon(
                      Icons.logout,
                      color: AppTheme.error,
                      size: 22,
                    ),
                    title: const Text(
                      'Sign Out',
                      style: TextStyle(
                        color: AppTheme.error,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    tileColor: AppTheme.error.withValues(alpha: 0.05),
                    onTap: () async {
                      await AdminAuthService().signOut();
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),

      // ─── BODY ───
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        switchInCurve: Curves.easeOut,
        switchOutCurve: Curves.easeIn,
        child: KeyedSubtree(
          key: ValueKey(_currentIndex),
          child: _screens[_currentIndex],
        ),
      ),

      // ─── BOTTOM NAV ───
      bottomNavigationBar: Container(
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
              icon: Icon(
                Icons.dashboard_rounded,
                color: _currentIndex == 0
                    ? AppTheme.primary
                    : AppTheme.textMuted,
              ),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Icon(
                Icons.description_rounded,
                color: _currentIndex == 1
                    ? AppTheme.primary
                    : AppTheme.textMuted,
              ),
              label: 'Applications',
            ),
            BottomNavigationBarItem(
              icon: Icon(
                Icons.person_search_rounded,
                color: _currentIndex == 2
                    ? AppTheme.primary
                    : AppTheme.textMuted,
              ),
              label: 'Interns',
            ),
            BottomNavigationBarItem(
              icon: Icon(
                Icons.groups_rounded,
                color: _currentIndex == 3
                    ? AppTheme.primary
                    : AppTheme.textMuted,
              ),
              label: 'Teams',
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildDrawerItems() {
    final widgets = <Widget>[];
    int flatIndex = 0;

    for (final group in _navGroups) {
      // Category Label
      widgets.add(
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 16, 4),
          child: Text(
            group.label.toUpperCase(),
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: AppTheme.textMuted.withValues(alpha: 0.6),
              letterSpacing: 1.2,
            ),
          ),
        ),
      );

      for (final item in group.items) {
        final idx = flatIndex;
        final isSelected = idx == _currentIndex;

        widgets.add(
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppTheme.primary.withValues(alpha: 0.1)
                  : Colors.transparent,
              borderRadius: BorderRadius.circular(10),
              border: isSelected
                  ? Border.all(color: AppTheme.primary.withValues(alpha: 0.25))
                  : null,
            ),
            child: ListTile(
              dense: true,
              visualDensity: const VisualDensity(vertical: -1),
              leading: Icon(
                item.icon,
                size: 20,
                color: isSelected ? AppTheme.primary : AppTheme.textMuted,
              ),
              title: Text(
                item.label,
                style: TextStyle(
                  color: isSelected ? AppTheme.primary : AppTheme.textBody,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  fontSize: 13,
                ),
              ),
              onTap: () {
                _navigateTo(idx);
                Navigator.pop(context);
              },
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        );

        flatIndex++;
      }
    }

    return widgets;
  }
}

class _NavGroup {
  final String label;
  final List<_NavItem> items;
  const _NavGroup(this.label, this.items);
}

class _NavItem {
  final String label;
  final IconData icon;
  const _NavItem(this.label, this.icon);
}
