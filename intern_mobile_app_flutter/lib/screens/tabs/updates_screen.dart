import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/supabase_client.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../theme/colors.dart';
import '../../widgets/shimmer_loader.dart';

class UpdatesScreen extends StatefulWidget {
  const UpdatesScreen({super.key});

  @override
  State<UpdatesScreen> createState() => _UpdatesScreenState();
}

class _UpdatesScreenState extends State<UpdatesScreen> {
  List<dynamic> _announcements = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final dash = Provider.of<DashboardProvider>(context, listen: false);
    final userId = auth.profile?['userProfile']?['id'];
    if (userId == null) return;

    try {
      final data = await SupabaseClientConfig.client.rpc('get_targeted_announcements', params: {
        'p_user_id': userId,
        'p_team_id': dash.currentTeam?['id'],
        'p_batch': dash.currentTeam?['batch_id'],
      });
      if (mounted) {
        setState(() {
          _announcements = data as List<dynamic>? ?? [];
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading announcements: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Color _accentForType(String? type) {
    switch (type) {
      case 'success': return AppColors.success;
      case 'warning': return AppColors.warning;
      case 'alert': return AppColors.danger;
      default: return AppColors.info;
    }
  }

  IconData _iconForType(String? type) {
    switch (type) {
      case 'success': return Icons.check_circle_outline;
      case 'warning': return Icons.warning_amber_rounded;
      case 'alert': return Icons.error_outline;
      default: return Icons.info_outline;
    }
  }

  String _targetLabel(dynamic a) {
    switch (a['target_type']) {
      case 'personal': return 'Personal';
      case 'team': return 'Team';
      case 'batch': return 'Batch';
      default: return 'Global';
    }
  }

  Color _targetColor(dynamic a) {
    switch (a['target_type']) {
      case 'personal': return const Color(0xFFa855f7);
      case 'team': return AppColors.info;
      case 'batch': return AppColors.warning;
      default: return AppColors.success;
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    final d = DateTime.tryParse(dateStr);
    if (d == null) return dateStr;
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final hour = d.hour % 12 == 0 ? 12 : d.hour % 12;
    final ampm = d.hour >= 12 ? 'PM' : 'AM';
    return '${months[d.month - 1]} ${d.day}, $hour:${d.minute.toString().padLeft(2, '0')} $ampm';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
              child: Row(
                children: [
                  Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.primaryMuted,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.notifications_active_outlined, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Text('Updates', style: TextStyle(color: AppColors.text, fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.5)),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppColors.primaryMuted,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text('${_announcements.length}', style: const TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.border),
            // Content
            Expanded(
              child: _loading
                  ? const SkeletonList(itemCount: 5, cardHeight: 110)
                  : _announcements.isEmpty
                      ? _buildEmpty()
                      : RefreshIndicator(
                          color: AppColors.primary,
                          backgroundColor: AppColors.card,
                          onRefresh: () async {
                            setState(() => _loading = true);
                            await _load();
                          },
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                            itemCount: _announcements.length,
                            itemBuilder: (_, i) => _buildCard(_announcements[i], i),
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCard(dynamic a, int index) {
    final accent = _accentForType(a['type']);
    final tColor = _targetColor(a);
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 300 + (index * 60)),
      curve: Curves.easeOut,
      builder: (_, val, child) => Opacity(
        opacity: val,
        child: Transform.translate(offset: Offset(0, 16 * (1 - val)), child: child),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border(
            left: BorderSide(color: accent, width: 3),
            top: BorderSide(color: AppColors.border),
            right: BorderSide(color: AppColors.border),
            bottom: BorderSide(color: AppColors.border),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(
                      color: accent.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(_iconForType(a['type']), color: accent, size: 18),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(a['title'] ?? '', style: const TextStyle(color: AppColors.text, fontSize: 15, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 3),
                        Row(
                          children: [
                            Icon(Icons.access_time, size: 12, color: AppColors.textSecondary),
                            const SizedBox(width: 4),
                            Text(_formatDate(a['created_at']?.toString()), style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (a['is_pinned'] == true)
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Icon(Icons.push_pin, size: 14, color: AppColors.warning),
                        ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: tColor.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: tColor.withValues(alpha: 0.2)),
                        ),
                        child: Text(_targetLabel(a), style: TextStyle(color: tColor, fontSize: 11, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                a['content'] ?? a['message'] ?? '',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.55),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.campaign_outlined, size: 48, color: AppColors.border),
          const SizedBox(height: 16),
          const Text('No Updates', style: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text("You're all caught up!", style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
        ],
      ),
    );
  }
}
