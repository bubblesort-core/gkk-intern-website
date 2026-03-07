import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

class OverviewScreen extends StatefulWidget {
  final void Function(int index)? onNavigate;
  const OverviewScreen({super.key, this.onNavigate});

  @override
  State<OverviewScreen> createState() => _OverviewScreenState();
}

class _OverviewScreenState extends State<OverviewScreen> {
  Map<String, dynamic> _stats = {};
  List<Map<String, dynamic>> _recentApps = [];
  List<Map<String, dynamic>> _allInterns = [];
  List<Map<String, dynamic>> _filteredInterns = [];
  List<Map<String, dynamic>> _payments = [];
  bool _loading = true;
  bool _isDatabaseView = false;
  String _searchQuery = '';
  String? _statusFilter;
  final String _sortBy = 'full_name';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        AdminSupabaseService.getDashboardStats(),
        AdminSupabaseService.getAllApplications(),
        AdminSupabaseService.getAllInterns(),
        AdminSupabaseService.getPayments(),
      ]);

      if (mounted) {
        setState(() {
          _stats = results[0] as Map<String, dynamic>;
          _recentApps =
              (results[1] as List<Map<String, dynamic>>).take(10).toList();
          _allInterns = results[2] as List<Map<String, dynamic>>;
          _payments = results[3] as List<Map<String, dynamic>>;
          _applyFilters();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applyFilters() {
    var filtered = List<Map<String, dynamic>>.from(_allInterns);
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      filtered = filtered.where((i) {
        final name = (i['full_name'] ?? '').toString().toLowerCase();
        final email = (i['email'] ?? '').toString().toLowerCase();
        return name.contains(q) || email.contains(q);
      }).toList();
    }
    if (_statusFilter != null) {
      filtered = filtered.where((i) => i['status'] == _statusFilter).toList();
    }
    filtered.sort(
      (a, b) => (a[_sortBy] ?? '').toString().compareTo(
        (b[_sortBy] ?? '').toString(),
      ),
    );
    setState(() => _filteredInterns = filtered);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        color: AppTheme.primary,
        backgroundColor: AppTheme.bgCard,
        onRefresh: _loadData,
        child: _loading
            ? const Center(
                child: CircularProgressIndicator(color: AppTheme.primary),
              )
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildHeaderActions(),
                  const SizedBox(height: 16),
                  if (!_isDatabaseView) ...[
                    _buildStatsGrid()
                        .animate()
                        .fadeIn(duration: 500.ms)
                        .slideY(begin: 0.05, end: 0),
                    const SizedBox(height: 20),
                    _buildQuickActions().animate().fadeIn(
                      delay: 200.ms,
                      duration: 500.ms,
                    ),
                    const SizedBox(height: 20),
                    _buildRecentApplications().animate().fadeIn(
                      delay: 400.ms,
                      duration: 500.ms,
                    ),
                  ] else ...[
                    _buildDatabaseTools(),
                    const SizedBox(height: 16),
                    _buildInternList(),
                  ],
                ],
              ),
      ),
    );
  }

  Widget _buildHeaderActions() {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _isDatabaseView ? 'Student Database' : 'Dashboard Overview',
                style: const TextStyle(
                  color: AppTheme.textMain,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                _isDatabaseView
                    ? '${_filteredInterns.length} total interns'
                    : 'Welcome back, Admin',
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
              ),
            ],
          ),
        ),
        IconButton(
          onPressed: () => setState(() => _isDatabaseView = !_isDatabaseView),
          icon: Icon(
            _isDatabaseView ? Icons.dashboard_rounded : Icons.storage_rounded,
            color: AppTheme.primary,
          ),
          tooltip: _isDatabaseView ? 'Show Dashboard' : 'Show Database',
        ),
      ],
    );
  }

  Widget _buildDatabaseTools() {
    return Row(
      children: [
        Expanded(
          child: TextField(
            onChanged: (val) {
              _searchQuery = val;
              _applyFilters();
            },
            style: const TextStyle(color: AppTheme.textMain, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Search interns...',
              hintStyle: const TextStyle(color: AppTheme.textMuted),
              prefixIcon: const Icon(
                Icons.search,
                size: 20,
                color: AppTheme.textMuted,
              ),
              filled: true,
              fillColor: AppTheme.bgCard,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: EdgeInsets.zero,
            ),
          ),
        ),
        const SizedBox(width: 8),
        _buildFilterMenu(),
      ],
    );
  }

  Widget _buildFilterMenu() {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.filter_list, color: AppTheme.textMuted),
      onSelected: (val) {
        setState(() {
          if (val == 'clear') {
            _statusFilter = null;
          } else {
            _statusFilter = val;
          }
          _applyFilters();
        });
      },
      itemBuilder: (ctx) => [
        const PopupMenuItem(value: 'active', child: Text('Active Only')),
        const PopupMenuItem(value: 'suspended', child: Text('Suspended Only')),
        const PopupMenuItem(value: 'completed', child: Text('Completed Only')),
        const PopupMenuItem(
          value: 'pending_profile',
          child: Text('Pending Profile'),
        ),
        const PopupMenuItem(
          value: 'pending_payment',
          child: Text('Pending Payment'),
        ),
        const PopupMenuItem(
          value: 'clear',
          child: Text('Clear Filters', style: TextStyle(color: AppTheme.error)),
        ),
      ],
    );
  }

  Widget _buildInternList() {
    if (_filteredInterns.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(32),
        child: Center(
          child: Text(
            'No interns found',
            style: TextStyle(color: AppTheme.textMuted),
          ),
        ),
      );
    }
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _filteredInterns.length,
      itemBuilder: (ctx, i) {
        final intern = _filteredInterns[i];
        final status = intern['status'] ?? 'active';
        final color = status == 'active' ? AppTheme.success : AppTheme.warning;

        // Find payment for this intern
        final payment = _findPayment(intern);
        final isPaid = payment != null;
        final paidAmt = isPaid
            ? ((double.tryParse(payment['amount']?.toString() ?? '0') ?? 0) *
                    0.98)
                .round()
            : 0;

        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.bgCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.border),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                child: Text(
                  (intern['full_name'] ?? '?')[0].toUpperCase(),
                  style: const TextStyle(
                    color: AppTheme.primary,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      intern['full_name'] ?? 'Unknown',
                      style: const TextStyle(
                        color: AppTheme.textMain,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      intern['email'] ?? '',
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
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      status.toUpperCase(),
                      style: TextStyle(
                        color: color,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    isPaid ? '₹$paidAmt' : 'Unpaid',
                    style: TextStyle(
                      color: isPaid ? AppTheme.success : AppTheme.error,
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  /// Find payment record for an intern by user_id or email match
  Map<String, dynamic>? _findPayment(Map<String, dynamic> intern) {
    final userId = intern['id']?.toString();
    final email = (intern['email'] ?? '').toString().toLowerCase();
    for (final p in _payments) {
      final pStatus = (p['status'] ?? '').toString().toLowerCase();
      if (pStatus != 'completed' && pStatus != 'captured') continue;
      if (p['user_id']?.toString() == userId) return p;
      final customerEmail =
          (p['customer_email'] ?? '').toString().toLowerCase();
      if (customerEmail.isNotEmpty && customerEmail == email) return p;
    }
    return null;
  }

  Widget _buildStatsGrid() {
    final statItems = [
      _StatData(
        'Pending',
        _stats['pending']?.toString() ?? '0',
        Icons.hourglass_top_rounded,
        AppTheme.warning,
      ),
      _StatData(
        'Active Interns',
        _stats['active']?.toString() ?? '0',
        Icons.people_rounded,
        AppTheme.info,
      ),
      _StatData(
        'Teams',
        _stats['teams']?.toString() ?? '0',
        Icons.groups_rounded,
        AppTheme.primary,
      ),
      _StatData(
        'Revenue',
        '₹${NumberFormat('#,##,###').format(_stats['revenue'] ?? 0)}',
        Icons.payments_rounded,
        AppTheme.accent,
      ),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.6,
      ),
      itemCount: statItems.length,
      itemBuilder: (context, index) {
        final stat = statItems[index];
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppTheme.bgCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      _loading ? '–' : stat.value,
                      style: const TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textMain,
                      ),
                    ),
                  ),
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: stat.color.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(stat.icon, color: stat.color, size: 18),
                  ),
                ],
              ),
              Text(
                stat.label,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildQuickActions() {
    final actions = [
      _QuickAction('Applications', Icons.description_rounded, 1),
      _QuickAction('Teams', Icons.groups_rounded, 5),
      _QuickAction('Projects', Icons.account_tree_rounded, 6),
      _QuickAction('Announcements', Icons.campaign_rounded, 12),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppTheme.textMain,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: actions.map((action) {
            return Expanded(
              child: GestureDetector(
                onTap: () => widget.onNavigate?.call(action.index),
                child: Container(
                  margin: EdgeInsets.only(
                    right: action != actions.last ? 8 : 0,
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  decoration: BoxDecoration(
                    color: AppTheme.bgCard,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Column(
                    children: [
                      Icon(action.icon, color: AppTheme.primary, size: 22),
                      const SizedBox(height: 6),
                      Text(
                        action.label,
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppTheme.textBody,
                          fontWeight: FontWeight.w500,
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildRecentApplications() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Recent Applications',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textMain,
              ),
            ),
            TextButton(
              onPressed: () => widget.onNavigate?.call(1),
              child: const Text(
                'View All',
                style: TextStyle(color: AppTheme.primary, fontSize: 13),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (_loading)
          ...List.generate(
            3,
            (_) => Container(
              height: 70,
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: AppTheme.bgCard,
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          )
        else if (_recentApps.isEmpty)
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: const Center(
              child: Column(
                children: [
                  Icon(
                    Icons.inbox_rounded,
                    size: 40,
                    color: AppTheme.textMuted,
                  ),
                  SizedBox(height: 8),
                  Text(
                    'No applications yet',
                    style: TextStyle(color: AppTheme.textMuted),
                  ),
                ],
              ),
            ),
          )
        else
          ..._recentApps.map((app) => _buildAppCard(app)),
      ],
    );
  }

  Widget _buildAppCard(Map<String, dynamic> app) {
    final status = app['status'] ?? 'pending';
    final statusColor = status == 'approved'
        ? AppTheme.success
        : status == 'rejected'
        ? AppTheme.error
        : AppTheme.warning;
    final createdAt = app['created_at'] != null
        ? DateFormat('d MMM yyyy').format(DateTime.parse(app['created_at']))
        : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundColor: AppTheme.primary.withValues(alpha: 0.15),
            child: Text(
              (app['full_name'] ?? '?')[0].toUpperCase(),
              style: const TextStyle(
                color: AppTheme.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  app['full_name'] ?? 'Unknown',
                  style: const TextStyle(
                    color: AppTheme.textMain,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  app['email'] ?? '',
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 12,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  status.toString().toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    color: statusColor,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                createdAt,
                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatData {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  const _StatData(this.label, this.value, this.icon, this.color);
}

class _QuickAction {
  final String label;
  final IconData icon;
  final int index;
  const _QuickAction(this.label, this.icon, this.index);
}
