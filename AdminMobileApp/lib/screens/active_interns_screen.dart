import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:admin_mobile_app/utils/url_utils.dart';
import 'package:cached_network_image/cached_network_image.dart';

class ActiveInternsScreen extends StatefulWidget {
  const ActiveInternsScreen({super.key});

  @override
  State<ActiveInternsScreen> createState() => _ActiveInternsScreenState();
}

class _ActiveInternsScreenState extends State<ActiveInternsScreen> {
  List<Map<String, dynamic>> _interns = [];
  bool _loading = true;
  String _search = '';
  final _searchController = TextEditingController();
  String? _statusFilter;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await AdminSupabaseService.getAllInterns(
      search: _search.isNotEmpty ? _search : null,
      status: _statusFilter,
    );
    if (mounted) {
      setState(() {
        _interns = data;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Search & Filter
        Container(
          padding: const EdgeInsets.all(16),
          color: AppTheme.bgCard,
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  onChanged: (v) {
                    _search = v;
                    _load();
                  },
                  decoration: InputDecoration(
                    hintText: 'Search interns...',
                    prefixIcon: const Icon(
                      Icons.search,
                      color: AppTheme.textMuted,
                      size: 20,
                    ),
                    suffixIcon: _search.isNotEmpty
                        ? IconButton(
                            icon: const Icon(
                              Icons.clear,
                              size: 18,
                              color: AppTheme.textMuted,
                            ),
                            onPressed: () {
                              _searchController.clear();
                              _search = '';
                              _load();
                            },
                          )
                        : null,
                    fillColor: AppTheme.bgBody,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              _buildFilterMenu(),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            children: [
              Text(
                '${_interns.length} Active Interns',
                style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(
                  Icons.refresh,
                  color: AppTheme.textMuted,
                  size: 20,
                ),
                onPressed: _load,
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            color: AppTheme.primary,
            backgroundColor: AppTheme.bgCard,
            onRefresh: _load,
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  )
                : _interns.isEmpty
                ? _emptyState('No active interns found', Icons.people_outline)
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                    itemCount: _interns.length,
                    itemBuilder: (ctx, i) =>
                        _internCard(_interns[i]).animate().fadeIn(
                          delay: Duration(milliseconds: 40 * i),
                          duration: 300.ms,
                        ),
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildFilterMenu() {
    return PopupMenuButton<String>(
      icon: Icon(
        Icons.filter_list,
        color: _statusFilter != null ? AppTheme.primary : AppTheme.textMuted,
      ),
      onSelected: (val) {
        setState(() {
          _statusFilter = (val == 'all') ? null : val;
          _load();
        });
      },
      itemBuilder: (ctx) => [
        const PopupMenuItem(value: 'active', child: Text('Active Only')),
        const PopupMenuItem(value: 'suspended', child: Text('Suspended Only')),
        const PopupMenuItem(value: 'completed', child: Text('Completed Only')),
        const PopupMenuItem(value: 'all', child: Text('All Interns')),
      ],
    );
  }

  Widget _internCard(Map<String, dynamic> intern) {
    final name = intern['full_name'] ?? 'Unknown';
    final email = intern['email'] ?? '';
    final status = intern['status'] ?? 'active';
    final xp = intern['xp'] ?? 0;
    final joinedAt = intern['created_at'] != null
        ? DateFormat('d MMM yyyy').format(DateTime.parse(intern['created_at']))
        : '';
    final statusColor = status == 'active'
        ? AppTheme.success
        : (status == 'suspended' ? AppTheme.error : AppTheme.warning);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                backgroundImage: intern['avatar_url'] != null
                    ? CachedNetworkImageProvider(
                        UrlUtils.getProxiedUrl(intern['avatar_url']),
                      )
                    : null,
                child: intern['avatar_url'] == null
                    ? Text(
                        name[0].toUpperCase(),
                        style: const TextStyle(
                          color: AppTheme.primary,
                          fontWeight: FontWeight.bold,
                        ),
                      )
                    : null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        color: AppTheme.textMain,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    Text(
                      email,
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      status.toUpperCase(),
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$xp XP',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const Divider(height: 24, color: AppTheme.border),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _detailRow(Icons.calendar_today, 'Joined', joinedAt),
              _detailRow(
                Icons.batch_prediction,
                'Batch',
                intern['batch'] ?? 'Not Set',
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                // Navigate to full profile/audit view
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.bgBody,
                foregroundColor: AppTheme.textMain,
                elevation: 0,
                side: const BorderSide(color: AppTheme.border),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                'View Full History',
                style: TextStyle(fontSize: 12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppTheme.textMuted),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 9),
            ),
            Text(
              value,
              style: const TextStyle(
                color: AppTheme.textMain,
                fontSize: 11,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _emptyState(String text, IconData icon) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 48,
            color: AppTheme.textMuted.withValues(alpha: 0.4),
          ),
          const SizedBox(height: 12),
          Text(text, style: const TextStyle(color: AppTheme.textMuted)),
        ],
      ),
    );
  }
}
