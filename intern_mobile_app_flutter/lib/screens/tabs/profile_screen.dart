import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/supabase_client.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../theme/colors.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final TextEditingController _linkedInCtrl = TextEditingController();
  final TextEditingController _bioCtrl = TextEditingController();
  bool _saving = false;
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final currentUser = auth.profile?['userProfile'];
      if (currentUser != null) {
        _linkedInCtrl.text = currentUser['social_links']?['linkedin'] ?? '';
        _bioCtrl.text = currentUser['bio'] ?? '';
      }
      _initialized = true;
    }
  }

  @override
  void dispose() {
    _linkedInCtrl.dispose();
    _bioCtrl.dispose();
    super.dispose();
  }

  String _calculateLevel(int s) {
    if (s >= 30) return 'Expert';
    if (s >= 14) return 'Advanced';
    if (s >= 7) return 'Intermediate';
    return 'Beginner';
  }

  Future<void> _handleLogout() async {
    await SupabaseClientConfig.client.auth.signOut();
  }

  Future<void> _handleSave() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final currentUser = auth.profile?['userProfile'];
    if (currentUser == null) return;

    setState(() => _saving = true);
    try {
      final currentSocialLinks = currentUser['social_links'] ?? {};
      final newSocialLinks = Map<String, dynamic>.from(currentSocialLinks);
      newSocialLinks['linkedin'] = _linkedInCtrl.text;

      final updates = {
        'bio': _bioCtrl.text,
        'social_links': newSocialLinks,
      };

      await SupabaseClientConfig.client
          .from('profiles')
          .update(updates)
          .eq('id', currentUser['id']);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile updated successfully.')));
        auth.refreshProfile(); // refresh
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not update profile.')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Widget _buildStatCard(Widget top, String label) {
    return Container(
      width: (MediaQuery.of(context).size.width - 40 - 15) / 2,
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1f1f2e)),
      ),
      child: Column(
        children: [
          top,
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 13)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final dashboard = Provider.of<DashboardProvider>(context);

    final currentUser = auth.profile?['userProfile'];
    
    final fullName = currentUser?['full_name'] ?? currentUser?['email']?.split('@')[0] ?? 'Intern';
    final initial = fullName.isNotEmpty ? fullName[0].toUpperCase() : 'I';
    final isPaid = currentUser?['status'] == 'active';
    final streak = currentUser?['current_streak'] ?? 0;
    final level = _calculateLevel(streak);
    final title = currentUser?['title'] ?? 'Intern';
    final phone = currentUser?['phone'] ?? 'Not set';
    final batchName = dashboard.currentTeam?['batches']?['name'] ?? 'Not assigned';
    final email = currentUser?['email'] ?? '';
    final avatarUrl = currentUser?['avatar_url'];

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.only(top: 20, left: 20, right: 20, bottom: 20),
              width: double.infinity,
              decoration: const BoxDecoration(
                color: AppColors.surface,
                border: Border(bottom: BorderSide(color: Color(0xFF1f1f2e))),
              ),
              child: const Text('Profile', style: TextStyle(color: AppColors.text, fontSize: 28, fontWeight: FontWeight.bold)),
            ),
            Expanded(
              child: RefreshIndicator(
                color: AppColors.primary,
                backgroundColor: AppColors.card,
                onRefresh: () async {
                  final authProvider = Provider.of<AuthProvider>(context, listen: false);
                  final dashProvider = Provider.of<DashboardProvider>(context, listen: false);
                  await authProvider.refreshProfile();
                  final userId = authProvider.profile?['userProfile']?['id'];
                  if (userId != null) {
                    await dashProvider.fetchDashboardData(userId, forceRefresh: true);
                  }
                },
                child: ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                  // Profile Header
                  Column(
                    children: [
                      Container(
                        width: 100, height: 100,
                        margin: const EdgeInsets.only(bottom: 15),
                        decoration: BoxDecoration(
                          color: const Color(0x3322d87a),
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.primary, width: 2),
                        ),
                        alignment: Alignment.center,
                        clipBehavior: Clip.hardEdge,
                        child: avatarUrl != null
                            ? Image.network(avatarUrl, width: 100, height: 100, fit: BoxFit.cover)
                            : Text(initial, style: const TextStyle(color: AppColors.primary, fontSize: 40, fontWeight: FontWeight.bold)),
                      ),
                      Text(fullName, style: const TextStyle(color: AppColors.text, fontSize: 22, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(title, style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 16)),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isPaid ? const Color(0xFFd1fae5) : const Color(0xFFfef3c7),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(isPaid ? Icons.check_circle : Icons.access_time, size: 14, color: isPaid ? const Color(0xFF065f46) : const Color(0xFF92400e)),
                            const SizedBox(width: 4),
                            Text(isPaid ? 'Active Intern' : 'Pending Payment', style: TextStyle(color: isPaid ? const Color(0xFF065f46) : const Color(0xFF92400e), fontSize: 13, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      )
                    ],
                  ),
                  const SizedBox(height: 25),

                  // Stats Grid
                  Wrap(
                    spacing: 15,
                    children: [
                      _buildStatCard(
                        Row(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.local_fire_department, size: 24, color: Color(0xFFf97316)),
                          const SizedBox(width: 6),
                          Text(streak.toString(), style: const TextStyle(color: Color(0xFFf97316), fontSize: 22, fontWeight: FontWeight.bold)),
                        ]),
                        'Day Streak',
                      ),
                      _buildStatCard(
                        Text(level, style: const TextStyle(color: Color(0xFF8b5cf6), fontSize: 22, fontWeight: FontWeight.bold)),
                        'Level',
                      ),
                      _buildStatCard(
                        Row(mainAxisSize: MainAxisSize.min, children: [
                          const Icon(Icons.layers, size: 20, color: Color(0xFF3b82f6)),
                          const SizedBox(width: 6),
                          Text(batchName == 'Not assigned' ? 'None' : batchName.replaceAll('BATCH ', ''), style: const TextStyle(color: Color(0xFF3b82f6), fontSize: 18, fontWeight: FontWeight.bold)),
                        ]),
                        'Batch',
                      ),
                      _buildStatCard(
                        Icon(isPaid ? Icons.check_circle : Icons.error, size: 28, color: isPaid ? const Color(0xFF10b981) : const Color(0xFFf59e0b)),
                        isPaid ? 'Paid' : 'Pending',
                      ),
                    ],
                  ),
                  const SizedBox(height: 5),

                  // Edit Form
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF1f1f2e)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: const [
                            Icon(Icons.person, size: 20, color: AppColors.primary),
                            SizedBox(width: 8),
                            Text('Personal Information', style: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold)),
                          ],
                        ),
                        const SizedBox(height: 15),
                        
                        const Text('Full Name', style: TextStyle(color: Color(0xFF94a3b8), fontSize: 13)),
                        const SizedBox(height: 8),
                        _buildDisabledInput(fullName),
                        const SizedBox(height: 15),

                        const Text('Email', style: TextStyle(color: Color(0xFF94a3b8), fontSize: 13)),
                        const SizedBox(height: 8),
                        _buildDisabledInput(email),
                        const SizedBox(height: 15),

                        const Text('Phone Number', style: TextStyle(color: Color(0xFF94a3b8), fontSize: 13)),
                        const SizedBox(height: 8),
                        _buildDisabledInput(phone),
                        const SizedBox(height: 15),

                        const Text('LinkedIn Profile', style: TextStyle(color: Color(0xFF94a3b8), fontSize: 13)),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _linkedInCtrl,
                          style: const TextStyle(color: AppColors.text, fontSize: 15),
                          decoration: _inputDecoration('https://linkedin.com/in/...'),
                        ),
                        const SizedBox(height: 15),

                        const Text('Bio', style: TextStyle(color: Color(0xFF94a3b8), fontSize: 13)),
                        const SizedBox(height: 8),
                        TextField(
                          controller: _bioCtrl,
                          maxLines: 4,
                          style: const TextStyle(color: AppColors.text, fontSize: 15),
                          decoration: _inputDecoration('Tell us about yourself...'),
                        ),
                        const SizedBox(height: 25),

                        ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            minimumSize: const Size(double.infinity, 48),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          onPressed: _saving ? null : _handleSave,
                          icon: _saving ? const SizedBox() : const Icon(Icons.save, color: AppColors.background, size: 18),
                          label: _saving 
                              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: AppColors.background, strokeWidth: 2))
                              : const Text('Save Changes', style: TextStyle(color: AppColors.background, fontSize: 16, fontWeight: FontWeight.bold)),
                        )
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Logout
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      backgroundColor: const Color(0x1Aef4444),
                      side: const BorderSide(color: Color(0x33ef4444)),
                      minimumSize: const Size(double.infinity, 48),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    onPressed: _handleLogout,
                    icon: const Icon(Icons.logout, color: Color(0xFFef4444), size: 20),
                    label: const Text('Log Out', style: TextStyle(color: Color(0xFFef4444), fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDisabledInput(String value) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0x05FFFFFF),
        border: Border.all(color: const Color(0x1AFFFFFF)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(value, style: TextStyle(color: AppColors.text.withValues(alpha: 0.6), fontSize: 15)),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Color(0xFF475569)),
      filled: true,
      fillColor: const Color(0x0DFFFFFF),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: Color(0x1AFFFFFF))),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppColors.primary)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
    );
  }
}
