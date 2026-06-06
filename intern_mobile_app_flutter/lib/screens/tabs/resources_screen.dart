import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/supabase_client.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../theme/colors.dart';
import '../../widgets/shimmer_loader.dart';

class ResourcesScreen extends StatefulWidget {
  const ResourcesScreen({super.key});

  @override
  State<ResourcesScreen> createState() => _ResourcesScreenState();
}

class _ResourcesScreenState extends State<ResourcesScreen> {
  List<dynamic> _allResources = [];
  List<dynamic> _filtered = [];
  bool _loading = true;
  String _activeCategory = 'all';
  String _searchQuery = '';
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final dash = Provider.of<DashboardProvider>(context, listen: false);
    final userId = auth.profile?['userProfile']?['id'];
    if (userId == null) return;

    try {
      final data = await SupabaseClientConfig.client.rpc('get_targeted_resources', params: {
        'p_user_id': userId,
        'p_team_id': dash.currentTeam?['id'],
        'p_batch': dash.currentTeam?['batch_id'],
      });
      if (mounted) {
        setState(() {
          _allResources = data as List<dynamic>? ?? [];
          _applyFilters();
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading resources: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applyFilters() {
    var result = _allResources.toList();
    if (_activeCategory != 'all') {
      result = result.where((r) => r['type'] == _activeCategory).toList();
    }
    if (_searchQuery.trim().isNotEmpty) {
      result = result.where((r) => (r['title'] ?? '').toString().toLowerCase().contains(_searchQuery.toLowerCase())).toList();
    }
    _filtered = result;
  }

  bool _isNew(String? createdAt) {
    if (createdAt == null) return false;
    final d = DateTime.tryParse(createdAt);
    if (d == null) return false;
    return DateTime.now().difference(d).inDays < 7;
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    final d = DateTime.tryParse(dateStr);
    if (d == null) return dateStr;
    return '${d.month}/${d.day}/${d.year}';
  }

  Color _typeColor(String? type) {
    switch (type) {
      case 'pdf': return AppColors.danger;
      case 'doc': return AppColors.info;
      case 'video': return AppColors.warning;
      default: return AppColors.success;
    }
  }

  IconData _typeIcon(String? type) {
    switch (type) {
      case 'pdf': return Icons.picture_as_pdf;
      case 'doc': return Icons.description;
      case 'video': return Icons.play_circle;
      default: return Icons.link;
    }
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
                    child: const Icon(Icons.library_books_outlined, color: AppColors.primary, size: 20),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Text('Resources', style: TextStyle(color: AppColors.text, fontSize: 24, fontWeight: FontWeight.w700, letterSpacing: -0.5)),
                  ),
                ],
              ),
            ),
            // Search + Filters
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: TextField(
                  controller: _searchCtrl,
                  style: const TextStyle(color: AppColors.text, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'Search resources...',
                    hintStyle: TextStyle(color: AppColors.textSecondary, fontSize: 14),
                    prefixIcon: Icon(Icons.search, size: 20, color: AppColors.textSecondary),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onChanged: (val) {
                    setState(() {
                      _searchQuery = val;
                      _applyFilters();
                    });
                  },
                ),
              ),
            ),
            const SizedBox(height: 12),
            // Category chips
            SizedBox(
              height: 36,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                children: [
                  _buildChip('all', 'All', Icons.apps),
                  _buildChip('pdf', 'PDFs', Icons.picture_as_pdf),
                  _buildChip('video', 'Videos', Icons.play_circle_outline),
                  _buildChip('link', 'Links', Icons.link),
                ],
              ),
            ),
            const SizedBox(height: 8),
            const Divider(height: 1, color: AppColors.border),
            // Content
            Expanded(
              child: _loading
                  ? const SkeletonList(itemCount: 5, cardHeight: 90)
                  : _filtered.isEmpty
                      ? _buildEmpty()
                      : RefreshIndicator(
                          color: AppColors.primary,
                          backgroundColor: AppColors.card,
                          onRefresh: () async {
                            final auth = Provider.of<AuthProvider>(context, listen: false);
                            final dash = Provider.of<DashboardProvider>(context, listen: false);
                            setState(() => _loading = true);
                            await _load();
                            final userId = auth.profile?['userProfile']?['id'];
                            if (userId != null) {
                              await dash.fetchDashboardData(userId, forceRefresh: true);
                            }
                          },
                          child: ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                            itemCount: _filtered.length,
                            itemBuilder: (_, i) => _buildCard(_filtered[i], i),
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChip(String key, String label, IconData icon) {
    final isActive = _activeCategory == key;
    return GestureDetector(
      onTap: () {
        setState(() {
          _activeCategory = key;
          _applyFilters();
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isActive ? AppColors.primary : AppColors.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: isActive ? AppColors.background : AppColors.textSecondary),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(color: isActive ? AppColors.background : AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildCard(dynamic res, int index) {
    final type = res['type'] ?? 'link';
    final color = _typeColor(type);
    final isDownload = type == 'pdf' || type == 'doc';
    final isNewRes = _isNew(res['created_at']?.toString());

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 300 + (index * 50)),
      curve: Curves.easeOut,
      builder: (_, val, child) => Opacity(
        opacity: val,
        child: Transform.translate(offset: Offset(0, 14 * (1 - val)), child: child),
      ),
      child: GestureDetector(
        onTap: () async {
          if (res['url'] != null) {
            final url = Uri.parse(res['url']);
            try {
              await launchUrl(url, mode: LaunchMode.externalApplication);
            } catch (e) {
              debugPrint('Could not launch $url');
            }
          }
        },
        child: Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(_typeIcon(type), color: color, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            (res['category'] ?? res['type'] ?? '').toString().toUpperCase(),
                            style: TextStyle(color: AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                          ),
                        ),
                        if (isNewRes)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.danger.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text('NEW', style: TextStyle(color: AppColors.danger, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(res['title'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.text, fontSize: 15, fontWeight: FontWeight.w600)),
                    if (res['description'] != null) ...[
                      const SizedBox(height: 3),
                      Text(res['description'], maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                    ],
                    const SizedBox(height: 6),
                    Text(_formatDate(res['created_at']?.toString()), style: TextStyle(color: AppColors.textFaint, fontSize: 11)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: isDownload ? AppColors.primary : AppColors.elevated,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(isDownload ? Icons.download_outlined : Icons.open_in_new, size: 13, color: isDownload ? AppColors.background : AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      isDownload ? 'Get' : type == 'video' ? 'Watch' : 'Open',
                      style: TextStyle(color: isDownload ? AppColors.background : AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
                    ),
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
          Icon(Icons.library_books_outlined, size: 48, color: AppColors.border),
          const SizedBox(height: 16),
          const Text('No Resources Found', style: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text(
            _searchQuery.isNotEmpty || _activeCategory != 'all' ? 'Try changing your filters.' : 'No resources available yet.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 14),
          ),
        ],
      ),
    );
  }
}
