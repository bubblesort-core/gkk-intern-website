import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../secure_video_player_screen.dart';
import '../../core/supabase_client.dart';
import '../../core/cache_service.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../theme/colors.dart';
import '../../widgets/shimmer_loader.dart';

class RecordingsScreen extends StatefulWidget {
  const RecordingsScreen({super.key});

  @override
  State<RecordingsScreen> createState() => _RecordingsScreenState();
}

class _RecordingsScreenState extends State<RecordingsScreen> {
  List<dynamic> _recordings = [];
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

  Future<void> _load({bool forceRefresh = false}) async {
    try {
      if (!forceRefresh) {
        final cachedData = CacheService.get('recordings_list');
        if (cachedData != null) {
          _processResponse(cachedData);
        }
      }

      final response = await SupabaseClientConfig.client
          .from('recordings')
          .select('*')
          .order('created_at', ascending: false)
          .limit(50);

      CacheService.set('recordings_list', response);
      _processResponse(response);
    } catch (e) {
      debugPrint('Error loading recordings: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  void _processResponse(dynamic response) {
    if (!mounted) return;
    setState(() {
      _recordings = (response as List<dynamic>).where(_isEligible).toList();
      _loading = false;
    });
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    final d = DateTime.tryParse(dateStr);
    if (d == null) return dateStr;
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${months[d.month - 1]} ${d.day}, ${d.year}';
  }

  String? _convertUrlToId(String url) {
    url = url.trim();
    if (url.isEmpty) return null;
    
    RegExp regExp = RegExp(
        r'^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|live\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*',
        caseSensitive: false,
    );
    Match? match = regExp.firstMatch(url);
    if (match != null && match.groupCount >= 1) {
      final id = match.group(1);
      if (id != null && id.isNotEmpty) return id;
    }
    
    if (!url.contains('http') && !url.contains('/')) {
      return url;
    }
    
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
              child: Row(
                children: [
                  Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(color: AppColors.primaryMuted, borderRadius: BorderRadius.circular(12)),
                    child: const Icon(Icons.play_circle_outline, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Text('Recordings', style: TextStyle(color: AppColors.text, fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.5)),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(color: AppColors.primaryMuted, borderRadius: BorderRadius.circular(20)),
                    child: Text('${_recordings.length}', style: const TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: AppColors.border),
            Expanded(
              child: _loading
                  ? const SkeletonList(itemCount: 5, cardHeight: 90)
                  : _recordings.isEmpty
                      ? _buildEmpty()
                      : RefreshIndicator(
                          color: AppColors.primary,
                          backgroundColor: AppColors.card,
                          onRefresh: () async {
                            setState(() => _loading = true);
                            await _load(forceRefresh: true);
                          },
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                            itemCount: _recordings.length,
                            itemBuilder: (_, i) => _buildCard(_recordings[i], i),
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCard(dynamic r, int index) {
    final title = r['title'] ?? 'Recording';
    String? urlStr = r['youtube_url'];
    if (urlStr != null && urlStr.trim().isEmpty) urlStr = null;
    urlStr ??= (r['youtube_video_id'] != null ? 'https://youtube.com/watch?v=${r['youtube_video_id']}' : null);
    
    String? videoId;
    if (urlStr != null) {
      videoId = _convertUrlToId(urlStr);
    }

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 300 + (index * 60)),
      curve: Curves.easeOut,
      builder: (_, val, child) => Opacity(
        opacity: val,
        child: Transform.translate(offset: Offset(0, 14 * (1 - val)), child: child),
      ),
      child: GestureDetector(
        onTap: () async {
          if (urlStr != null) {
            if (videoId != null) {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => SecureVideoPlayerScreen(
                    videoId: videoId!,
                    title: title,
                  ),
                ),
              );
            } else {
              // Fallback to launcher if it's not a standard YT link
              try {
                await launchUrl(Uri.parse(urlStr), mode: LaunchMode.externalApplication);
              } catch (e) {
                debugPrint('Could not launch $urlStr');
              }
            }
          }
        },
        child: Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Container(
                  width: 96, height: 64,
                  decoration: BoxDecoration(
                    color: AppColors.danger.withValues(alpha: 0.1),
                  ),
                  child: videoId != null
                    ? Stack(
                        fit: StackFit.expand,
                        children: [
                          Image.network(
                            'https://img.youtube.com/vi/$videoId/mqdefault.jpg',
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => const Icon(Icons.video_library, color: AppColors.textSecondary),
                          ),
                          Container(
                            color: Colors.black26,
                            child: const Center(
                              child: Icon(Icons.play_circle_fill, color: Colors.white, size: 28),
                            ),
                          ),
                        ],
                      )
                    : const Center(
                        child: Icon(Icons.play_arrow_rounded, color: AppColors.danger, size: 26),
                      ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.text, fontSize: 15, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 5),
                    Row(
                      children: [
                        Icon(Icons.calendar_today_outlined, size: 12, color: AppColors.textSecondary),
                        const SizedBox(width: 5),
                        Text(_formatDate(r['created_at']?.toString()), style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.primaryMuted,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.play_circle, size: 14, color: AppColors.primary),
                    SizedBox(width: 4),
                    Text('Watch', style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600)),
                  ],
                ),
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
          Icon(Icons.play_circle_outline, size: 48, color: AppColors.border),
          const SizedBox(height: 16),
          const Text('No Recordings', style: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text('No recorded sessions available yet.', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
        ],
      ),
    );
  }
}
