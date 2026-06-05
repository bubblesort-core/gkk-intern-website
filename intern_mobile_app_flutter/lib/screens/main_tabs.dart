import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/dashboard_provider.dart';
import '../core/supabase_client.dart';
import '../theme/colors.dart';
import 'tabs/home_screen.dart';
import 'tabs/projects_screen.dart';
import 'tabs/updates_screen.dart';
import 'tabs/meetings_screen.dart';
import 'tabs/profile_screen.dart';
import 'tabs/team_screen.dart';
import 'tabs/recordings_screen.dart';
import 'tabs/resources_screen.dart';

class MainTabs extends StatefulWidget {
  const MainTabs({super.key});

  static MainTabsState? of(BuildContext context) => 
      context.findAncestorStateOfType<MainTabsState>();

  @override
  State<MainTabs> createState() => MainTabsState();
}

class MainTabsState extends State<MainTabs> {
  int _currentIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // Bottom nav screens (primary 5)
  final List<Widget> _primaryScreens = [
    const HomeScreen(),
    const ProjectsScreen(),
    const UpdatesScreen(),
    const MeetingsScreen(),
    const ProfileScreen(),
  ];

  // Drawer-only screens
  Widget? _drawerScreen;

  // Map drawer items to their screen widgets
  Widget _screenForDrawerId(String id) {
    switch (id) {
      case 'home': return const HomeScreen();
      case 'profile': return const ProfileScreen();
      case 'projects': return const ProjectsScreen();
      case 'team': return const TeamScreen();
      case 'updates': return const UpdatesScreen();
      case 'meetings': return const MeetingsScreen();
      case 'recordings': return const RecordingsScreen();
      case 'resources': return const ResourcesScreen();
      default: return const HomeScreen();
    }
  }

  // Map drawer IDs to primary tab indices (-1 means drawer-only)
  int _tabIndexForDrawerId(String id) {
    switch (id) {
      case 'home': return 0;
      case 'projects': return 1;
      case 'updates': return 2;
      case 'meetings': return 3;
      case 'profile': return 4;
      default: return -1; // drawer-only
    }
  }

  void navigateTo(String id) {
    final tabIndex = _tabIndexForDrawerId(id);
    if (tabIndex >= 0) {
      setState(() {
        _currentIndex = tabIndex;
        _drawerScreen = null;
      });
    } else {
      setState(() {
        _drawerScreen = _screenForDrawerId(id);
        _currentIndex = -1; // Deselect bottom nav
      });
    }
  }

  void openDrawer() {
    _scaffoldKey.currentState?.openDrawer();
  }

  void _onBottomNavTap(int index) {
    setState(() {
      _currentIndex = index;
      _drawerScreen = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final dash = Provider.of<DashboardProvider>(context);
    final profile = auth.profile?['userProfile'];
    final userName = profile?['full_name'] ?? 'Intern';
    final initial = userName.isNotEmpty ? userName[0].toUpperCase() : 'I';

    final Widget activeScreen = _drawerScreen ?? (_currentIndex >= 0 ? _primaryScreens[_currentIndex] : const HomeScreen());

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.menu, color: AppColors.text),
          onPressed: () => openDrawer(),
        ),
        title: const Text('GKK Dashboard', style: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.w600)),
        centerTitle: true,
      ),
      drawer: _buildDrawer(userName, initial, dash),
      body: activeScreen,
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  // ────────────────────── DRAWER ──────────────────────

  Widget _buildDrawer(String userName, String initial, DashboardProvider dash) {
    return Drawer(
      backgroundColor: AppColors.drawerBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(topRight: Radius.circular(20), bottomRight: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // ── Header ──
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 16, 12),
              child: Row(
                children: [
                  // Back Arrow
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        color: AppColors.elevated,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.chevron_left, color: AppColors.textSecondary, size: 20),
                    ),
                  ),
                  const SizedBox(width: 14),
                  // Avatar
                  Container(
                    width: 42, height: 42,
                    decoration: BoxDecoration(
                      color: AppColors.primaryMuted,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.3), width: 1.5),
                    ),
                    alignment: Alignment.center,
                    child: Text(initial, style: const TextStyle(color: AppColors.primary, fontSize: 18, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(userName, style: const TextStyle(color: AppColors.text, fontSize: 15, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
                        const SizedBox(height: 2),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primaryMuted,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Text('Intern', style: TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Divider(color: AppColors.drawerDivider, height: 1),
            const SizedBox(height: 8),

            // ── Nav Groups ──
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  _drawerGroupLabel('OVERVIEW'),
                  _drawerItem('home', Icons.grid_view_rounded, 'Overview'),
                  _drawerItem('profile', Icons.person_outline, 'Profile'),

                  const SizedBox(height: 8),
                  _drawerGroupLabel('PROGRESS'),
                  _drawerItem('projects', Icons.layers_outlined, 'Projects'),
                  _drawerItem('team', Icons.people_outline, 'Team'),
                  _drawerItem('updates', Icons.notifications_active_outlined, 'Updates'),
                  _drawerItem('meetings', Icons.videocam_outlined, 'Meetings'),
                  _drawerItem('recordings', Icons.play_circle_outline, 'Recordings'),

                  const SizedBox(height: 8),
                  _drawerGroupLabel('ACCOUNT'),
                  _drawerItem('resources', Icons.library_books_outlined, 'Resources'),
                ],
              ),
            ),

            // ── Footer ──
            Divider(color: AppColors.drawerDivider, height: 1),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: _drawerItem('logout', Icons.logout, 'Sign Out', isLogout: true),
            ),
          ],
        ),
      ),
    );
  }

  Widget _drawerGroupLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(left: 14, top: 12, bottom: 6),
      child: Text(label, style: TextStyle(color: AppColors.textFaint, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1)),
    );
  }

  Widget _drawerItem(String id, IconData icon, String label, {bool isLogout = false}) {
    // Determine active state
    bool isActive = false;
    if (_drawerScreen == null && _currentIndex >= 0) {
      isActive = _tabIndexForDrawerId(id) == _currentIndex;
    } else if (_drawerScreen != null) {
      // For drawer-only screens, check screen type
      isActive = _drawerScreen.runtimeType == _screenForDrawerId(id).runtimeType;
    }

    return GestureDetector(
      onTap: () {
        if (isLogout) {
          Navigator.of(context).pop();
          SupabaseClientConfig.client.auth.signOut();
          return;
        }
        Navigator.of(context).pop();
        navigateTo(id);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 2),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isActive ? AppColors.drawerItemActive : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: isLogout ? AppColors.danger : (isActive ? AppColors.primary : AppColors.textSecondary)),
            const SizedBox(width: 14),
            Text(
              label,
              style: TextStyle(
                color: isLogout ? AppColors.danger : (isActive ? AppColors.primary : AppColors.text),
                fontSize: 14,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
            if (isActive) ...[
              const Spacer(),
              Container(width: 4, height: 4, decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle)),
            ],
          ],
        ),
      ),
    );
  }

  // ────────────────────── BOTTOM NAV ──────────────────────

  Widget _buildBottomNav() {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.navBarBg,
        border: Border(top: BorderSide(color: AppColors.border, width: 1)),
      ),
      child: SafeArea(
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _navItem(0, Icons.home_outlined, Icons.home_rounded, 'Home'),
              _navItem(1, Icons.layers_outlined, Icons.layers, 'Projects'),
              _navItem(2, Icons.notifications_none_outlined, Icons.notifications_active, 'Updates'),
              _navItem(3, Icons.videocam_outlined, Icons.videocam, 'Meetings'),
              _navItem(4, Icons.person_outline, Icons.person, 'Profile'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _navItem(int index, IconData icon, IconData activeIcon, String label) {
    final isSelected = _currentIndex == index && _drawerScreen == null;
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => _onBottomNavTap(index),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: Icon(
                  isSelected ? activeIcon : icon,
                  key: ValueKey(isSelected),
                  size: 22,
                  color: isSelected ? AppColors.primary : AppColors.navUnselected,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  color: isSelected ? AppColors.primary : AppColors.navUnselected,
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
              const SizedBox(height: 3),
              AnimatedContainer(
                duration: const Duration(milliseconds: 250),
                width: isSelected ? 16 : 0,
                height: 2.5,
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : Colors.transparent,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
