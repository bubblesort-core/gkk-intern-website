import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/supabase_client.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../theme/colors.dart';
import '../../widgets/shimmer_loader.dart';

class MeetingsScreen extends StatefulWidget {
  const MeetingsScreen({super.key});

  @override
  State<MeetingsScreen> createState() => _MeetingsScreenState();
}

class _MeetingsScreenState extends State<MeetingsScreen> {
  List<dynamic> _liveMeetings = [];
  List<dynamic> _upcomingMeetings = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  bool _isEligible(dynamic m) {
    if (m == null) return false;
    if (m['target_type'] == null || m['target_type'] == 'all') return true;
    final tIds = (m['target_ids'] as List?) ?? [];
    final dash = Provider.of<DashboardProvider>(context, listen: false);
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final myTeamId = dash.currentTeam?['id'];
    final myBatchId = dash.currentTeam?['batch_id'] ?? dash.currentTeam?['batches']?['id'];
    final myUserId = auth.profile?['userProfile']?['id'];

    if (m['target_type'] == 'team') return myTeamId != null && tIds.contains(myTeamId);
    if (m['target_type'] == 'batch') return myBatchId != null && tIds.contains(myBatchId);
    if (m['target_type'] == 'intern') return myUserId != null && tIds.contains(myUserId);
    return false;
  }

  Future<void> _load() async {
    try {
      final response = await SupabaseClientConfig.client
          .from('sessions')
          .select('*')
          .order('scheduled_start', ascending: false)
          .limit(50);

      if (mounted) {
        final visible = (response as List<dynamic>).where(_isEligible).toList();
        final now = DateTime.now();
        setState(() {
          _liveMeetings = visible.where((s) => s['status'] == 'live').toList();
          _upcomingMeetings = visible.where((s) => s['status'] == 'scheduled' && DateTime.tryParse(s['scheduled_start'] ?? '')?.isAfter(now) == true).toList();
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading meetings: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    final d = DateTime.tryParse(dateStr);
    if (d == null) return dateStr;
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final h = d.hour % 12 == 0 ? 12 : d.hour % 12;
    final ampm = d.hour >= 12 ? 'PM' : 'AM';
    return '${days[d.weekday - 1]}, ${months[d.month - 1]} ${d.day}, $h:${d.minute.toString().padLeft(2, '0')} $ampm';
  }

  String _formatTime(String? dateStr) {
    if (dateStr == null) return '';
    final d = DateTime.tryParse(dateStr);
    if (d == null) return dateStr;
    final h = d.hour % 12 == 0 ? 12 : d.hour % 12;
    final ampm = d.hour >= 12 ? 'PM' : 'AM';
    return '$h:${d.minute.toString().padLeft(2, '0')} $ampm';
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
                    decoration: BoxDecoration(color: AppColors.primaryMuted, borderRadius: BorderRadius.circular(12)),
                    child: const Icon(Icons.videocam_outlined, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Text('Meetings', style: TextStyle(color: AppColors.text, fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.5)),
                  ),
                  if (_liveMeetings.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.danger.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.danger.withValues(alpha: 0.25)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.danger, shape: BoxShape.circle)),
                          const SizedBox(width: 6),
                          Text('${_liveMeetings.length} Live', style: const TextStyle(color: AppColors.danger, fontSize: 12, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.border),
            // Content
            Expanded(
              child: _loading
                  ? const SkeletonList(itemCount: 4, cardHeight: 120)
                  : (_liveMeetings.isEmpty && _upcomingMeetings.isEmpty)
                      ? _buildEmpty()
                      : RefreshIndicator(
                          color: AppColors.primary,
                          backgroundColor: AppColors.card,
                          onRefresh: () async {
                            setState(() => _loading = true);
                            await _load();
                          },
                          child: ListView(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                            children: [
                              if (_liveMeetings.isNotEmpty) ...[
                                _sectionTitle('Live Now', AppColors.danger),
                                const SizedBox(height: 12),
                                ..._liveMeetings.asMap().entries.map((e) => _buildCard(e.value, true, e.key)),
                              ],
                              if (_upcomingMeetings.isNotEmpty) ...[
                                SizedBox(height: _liveMeetings.isNotEmpty ? 24 : 0),
                                _sectionTitle('Upcoming Sessions', AppColors.primary),
                                const SizedBox(height: 12),
                                ..._upcomingMeetings.asMap().entries.map((e) => _buildCard(e.value, false, e.key)),
                              ],
                            ],
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String title, Color color) {
    return Row(
      children: [
        Container(width: 3, height: 16, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(4))),
        const SizedBox(width: 10),
        Text(title, style: TextStyle(color: AppColors.text, fontSize: 16, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _buildCard(dynamic m, bool isLive, int index) {
    final title = m['title'] ?? '';
    final platform = m['platform'] == 'google_meet' ? 'Google Meet' : 'YouTube Live';

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
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(14),
          border: Border(
            left: BorderSide(color: isLive ? AppColors.danger : AppColors.border, width: isLive ? 3 : 1),
            top: const BorderSide(color: AppColors.border),
            right: const BorderSide(color: AppColors.border),
            bottom: const BorderSide(color: AppColors.border),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (isLive)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppColors.danger.withValues(alpha: 0.1),
                      border: Border.all(color: AppColors.danger.withValues(alpha: 0.2)),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppColors.danger, shape: BoxShape.circle)),
                        const SizedBox(width: 6),
                        const Text('LIVE NOW', style: TextStyle(color: AppColors.danger, fontSize: 11, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  )
                else
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.access_time, size: 14, color: AppColors.primary),
                      const SizedBox(width: 6),
                      Text(_formatDate(m['scheduled_start']), style: const TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w600)),
                    ],
                  ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: AppColors.elevated, borderRadius: BorderRadius.circular(6)),
                  child: Text(platform, style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(title, style: const TextStyle(color: AppColors.text, fontSize: 17, fontWeight: FontWeight.w600)),
            if (isLive) ...[
              const SizedBox(height: 4),
              Text('Started at ${_formatTime(m['actual_start'] ?? m['scheduled_start'])}', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.background,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                  ),
                  icon: const Icon(Icons.open_in_new, size: 16),
                  label: const Text('Join Meeting', style: TextStyle(fontWeight: FontWeight.bold)),
                  onPressed: () async {
                    if (m['join_url'] != null) {
                      final url = Uri.parse(m['join_url']);
                      try {
                        await launchUrl(url, mode: LaunchMode.externalApplication);
                      } catch (e) {
                        debugPrint('Could not launch $url');
                      }
                    }
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.videocam_off_outlined, size: 48, color: AppColors.border),
          const SizedBox(height: 16),
          const Text('No Meetings', style: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text('No live or upcoming sessions right now.', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
        ],
      ),
    );
  }
}
