import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

class ApplicationsScreen extends StatefulWidget {
  const ApplicationsScreen({super.key});

  @override
  State<ApplicationsScreen> createState() => _ApplicationsScreenState();
}

class _ApplicationsScreenState extends State<ApplicationsScreen> {
  List<Map<String, dynamic>> _applications = [];
  bool _loading = true;
  String _statusFilter = '';
  String _searchQuery = '';
  final _searchController = TextEditingController();

  final _statusOptions = [
    '',
    'pending',
    'shortlisted',
    'interview_ready',
    'approved',
    'rejected',
  ];

  @override
  void initState() {
    super.initState();
    _loadApplications();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadApplications() async {
    setState(() => _loading = true);
    try {
      final data = await AdminSupabaseService.getAllApplications(
        status: _statusFilter.isNotEmpty ? _statusFilter : null,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
      );
      if (mounted) {
        setState(() {
          _applications = data;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showApplicationDetails(Map<String, dynamic> app) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) =>
          _ApplicationDetailSheet(app: app, onChanged: _loadApplications),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Search & Filter Bar
        Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          color: AppTheme.bgCard,
          child: Column(
            children: [
              // Search
              TextField(
                controller: _searchController,
                onChanged: (val) {
                  _searchQuery = val;
                  _loadApplications();
                },
                decoration: InputDecoration(
                  hintText: 'Search by name or email...',
                  prefixIcon: const Icon(
                    Icons.search,
                    color: AppTheme.textMuted,
                    size: 20,
                  ),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(
                            Icons.clear,
                            color: AppTheme.textMuted,
                            size: 18,
                          ),
                          onPressed: () {
                            _searchController.clear();
                            _searchQuery = '';
                            _loadApplications();
                          },
                        )
                      : null,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  fillColor: AppTheme.bgBody,
                ),
              ),
              const SizedBox(height: 10),

              // Status Filter Chips
              SizedBox(
                height: 34,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  children: _statusOptions.map((status) {
                    final isSelected = _statusFilter == status;
                    final label = status.isEmpty ? 'All' : _capitalize(status);
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(
                          label,
                          style: TextStyle(
                            fontSize: 12,
                            color: isSelected
                                ? Colors.white
                                : AppTheme.textBody,
                          ),
                        ),
                        selected: isSelected,
                        selectedColor: AppTheme.primary,
                        backgroundColor: AppTheme.bgBody,
                        side: BorderSide(
                          color: isSelected
                              ? AppTheme.primary
                              : AppTheme.border,
                        ),
                        onSelected: (_) {
                          setState(() => _statusFilter = status);
                          _loadApplications();
                        },
                        visualDensity: VisualDensity.compact,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),
        ),

        // Results Count
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Row(
            children: [
              Text(
                '${_applications.length} application${_applications.length != 1 ? 's' : ''}',
                style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(
                  Icons.refresh,
                  color: AppTheme.textMuted,
                  size: 20,
                ),
                onPressed: _loadApplications,
              ),
            ],
          ),
        ),

        // Application List
        Expanded(
          child: RefreshIndicator(
            color: AppTheme.primary,
            backgroundColor: AppTheme.bgCard,
            onRefresh: _loadApplications,
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: AppTheme.primary),
                  )
                : _applications.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.inbox_rounded,
                          size: 48,
                          color: AppTheme.textMuted.withValues(alpha: 0.4),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'No applications found',
                          style: TextStyle(color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                    itemCount: _applications.length,
                    itemBuilder: (ctx, i) {
                      return _buildAppCard(_applications[i]).animate().fadeIn(
                        delay: Duration(milliseconds: 50 * i),
                        duration: 300.ms,
                      );
                    },
                  ),
          ),
        ),
      ],
    );
  }

  Widget _buildAppCard(Map<String, dynamic> app) {
    final status = app['status'] ?? 'pending';
    final statusColor = _getStatusColor(status);
    final createdAt = app['created_at'] != null
        ? DateFormat('d MMM, h:mm a').format(DateTime.parse(app['created_at']))
        : '';
    final phone = app['phone'] ?? '';
    final college = app['college'] ?? '';

    return GestureDetector(
      onTap: () => _showApplicationDetails(app),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.bgCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
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
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    _capitalize(status),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            if (college.isNotEmpty || phone.isNotEmpty) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  if (college.isNotEmpty) ...[
                    Icon(
                      Icons.school,
                      size: 14,
                      color: AppTheme.textMuted.withValues(alpha: 0.6),
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        college,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.textMuted,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                  if (phone.isNotEmpty) ...[
                    const SizedBox(width: 12),
                    Icon(
                      Icons.phone,
                      size: 14,
                      color: AppTheme.textMuted.withValues(alpha: 0.6),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      phone,
                      style: const TextStyle(
                        fontSize: 11,
                        color: AppTheme.textMuted,
                      ),
                    ),
                  ],
                ],
              ),
            ],
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.centerRight,
              child: Text(
                createdAt,
                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'approved':
        return AppTheme.success;
      case 'rejected':
        return AppTheme.error;
      case 'interview_ready':
      case 'interview':
        return Colors.orange;
      case 'shortlisted':
        return AppTheme.info;
      default:
        return AppTheme.warning;
    }
  }

  String _capitalize(String s) => s.isNotEmpty
      ? '${s[0].toUpperCase()}${s.substring(1).replaceAll('_', ' ')}'
      : '';
}

// ─── APPLICATION DETAIL SHEET ───

class _ApplicationDetailSheet extends StatefulWidget {
  final Map<String, dynamic> app;
  final VoidCallback onChanged;

  const _ApplicationDetailSheet({required this.app, required this.onChanged});

  @override
  State<_ApplicationDetailSheet> createState() =>
      _ApplicationDetailSheetState();
}

class _ApplicationDetailSheetState extends State<_ApplicationDetailSheet> {
  late Map<String, dynamic> _app;
  bool _updating = false;
  final _remarkController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _app = widget.app;
    _remarkController.text = _app['remark'] ?? '';
  }

  @override
  void dispose() {
    _remarkController.dispose();
    super.dispose();
  }

  Future<void> _updateStatus(String status) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: Text('Change Status to ${status.toUpperCase()}?'),
        content: Text(
          'Are you sure you want to change the application status?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppTheme.textMuted),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: status == 'rejected'
                  ? AppTheme.error
                  : AppTheme.primary,
            ),
            child: const Text('Confirm', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _updating = true);
    try {
      await AdminSupabaseService.updateApplicationStatus(
        _app['id'].toString(),
        status,
      );
      widget.onChanged();
      if (mounted) {
        setState(() {
          _app['status'] = status;
          _updating = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Application $status successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _updating = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppTheme.error),
        );
      }
    }
  }

  Future<void> _saveRemark() async {
    setState(() => _updating = true);
    try {
      await AdminSupabaseService.updateApplicationRemark(
        _app['id'].toString(),
        _remarkController.text,
      );
      if (mounted) {
        setState(() => _updating = false);
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Remark saved')));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _updating = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppTheme.error),
        );
      }
    }
  }

  Future<void> _launchURL(String? url) async {
    if (url == null || url.isEmpty) return;
    try {
      final uri = Uri.parse(url);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      }
    } catch (e) {
      debugPrint('Launch URL error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.bgBody,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (ctx, scroll) => Stack(
          children: [
            SingleChildScrollView(
              controller: scroll,
              padding: const EdgeInsets.fromLTRB(24, 30, 24, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Handle
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppTheme.textMuted.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Header area
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 32,
                        backgroundColor: AppTheme.primary.withValues(
                          alpha: 0.15,
                        ),
                        child: Text(
                          (_app['full_name'] ?? '?')[0].toUpperCase(),
                          style: const TextStyle(
                            color: AppTheme.primary,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _app['full_name'] ?? 'Unknown',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textMain,
                              ),
                            ),
                            Text(
                              _app['email'] ?? '',
                              style: const TextStyle(
                                color: AppTheme.textMuted,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 4),
                            _buildStatusBadge(_app['status'] ?? 'pending'),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Contact Info
                  _buildSectionTitle('Contact Info', Icons.contacts_rounded),
                  _buildDetailGrid([
                    _DetailItem(
                      'Phone',
                      '+91 ${_app['phone'] ?? '-'}',
                      onTap: () => _launchURL('tel:+91${_app['phone']}'),
                    ),
                    _DetailItem(
                      'WhatsApp',
                      '+91 ${_app['whatsapp_number'] ?? _app['phone'] ?? '-'}',
                      onTap: () => _launchURL(
                        'https://wa.me/91${_app['whatsapp_number'] ?? _app['phone']}',
                      ),
                    ),
                  ]),
                  const SizedBox(height: 24),

                  // Personal Grid
                  _buildSectionTitle('Personal Details', Icons.person_rounded),
                  _buildDetailGrid([
                    _DetailItem('Age', _app['age']?.toString() ?? '-'),
                    _DetailItem('Sex', _app['sex'] ?? '-'),
                    _DetailItem('Source', _app['discovery_source'] ?? '-'),
                  ]),
                  const SizedBox(height: 24),

                  // Education
                  _buildSectionTitle(
                    'Education & Experience',
                    Icons.school_rounded,
                  ),
                  _buildDetailGrid([
                    _DetailItem('College', _app['college'] ?? '-'),
                    _DetailItem('Year', _app['year']?.toString() ?? '-'),
                    _DetailItem('Experience', _app['experience'] ?? 'Fresher'),
                  ]),
                  const SizedBox(height: 24),

                  // Skills & Why Join
                  _buildSectionTitle('Skills', Icons.stars_rounded),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: List<String>.from(_app['skills'] ?? [])
                        .map(
                          (s) => Chip(
                            label: Text(
                              s,
                              style: const TextStyle(fontSize: 12),
                            ),
                            backgroundColor: AppTheme.bgCard,
                            side: const BorderSide(color: AppTheme.border),
                          ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 24),
                  _buildSectionTitle('Statement', Icons.description_rounded),
                  Container(
                    padding: const EdgeInsets.all(16),
                    width: double.infinity,
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Text(
                      _app['why_join'] ??
                          _app['project_description'] ??
                          'No statement provided.',
                      style: const TextStyle(
                        color: AppTheme.textBody,
                        height: 1.5,
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Digital Footprint / Links
                  _buildSectionTitle('Digital Footprint', Icons.link_rounded),
                  Row(
                    children: [
                      if (_app['linkedin_url'] != null)
                        _buildLinkBtn(
                          'LinkedIn',
                          Icons.work,
                          () => _launchURL(_app['linkedin_url']),
                        ),
                      if (_app['github_url'] != null)
                        _buildLinkBtn(
                          'GitHub',
                          Icons.code,
                          () => _launchURL(_app['github_url']),
                        ),
                      if (_app['portfolio_url'] != null)
                        _buildLinkBtn(
                          'Portfolio',
                          Icons.language,
                          () => _launchURL(_app['portfolio_url']),
                        ),
                      if (_app['resume_url'] != null)
                        _buildLinkBtn(
                          'Resume',
                          Icons.file_present,
                          () => _launchURL(_app['resume_url']),
                        ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Remarks
                  _buildSectionTitle(
                    'Internal Remarks',
                    Icons.note_alt_rounded,
                  ),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _remarkController,
                          maxLines: 3,
                          decoration: const InputDecoration(
                            hintText: 'Add internal notes...',
                            fillColor: AppTheme.bgCard,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      IconButton.filled(
                        onPressed: _saveRemark,
                        icon: const Icon(Icons.save),
                        style: IconButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 40),

                  // Actions
                  _buildActionButtons(),
                  const SizedBox(height: 40),
                ],
              ),
            ),
            if (_updating)
              Container(
                color: Colors.black26,
                child: const Center(child: CircularProgressIndicator()),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.primary),
          const SizedBox(width: 8),
          Text(
            title.toUpperCase(),
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: AppTheme.textMuted,
              letterSpacing: 1.2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailGrid(List<_DetailItem> items) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisExtent: 50,
        ),
        itemCount: items.length,
        itemBuilder: (ctx, i) => InkWell(
          onTap: items[i].onTap,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                items[i].label,
                style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 2),
              Text(
                items[i].value,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: items[i].onTap != null
                      ? AppTheme.primary
                      : AppTheme.textMain,
                  decoration: items[i].onTap != null
                      ? TextDecoration.underline
                      : null,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLinkBtn(String label, IconData icon, VoidCallback onTap) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.only(right: 8.0),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: Column(
              children: [
                Icon(icon, size: 20, color: AppTheme.textMuted),
                const SizedBox(height: 4),
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 10,
                    color: AppTheme.textMuted,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color = AppTheme.warning;
    if (status == 'approved') color = AppTheme.success;
    if (status == 'rejected') color = AppTheme.error;
    if (status == 'shortlisted') color = AppTheme.info;
    if (status.contains('interview')) color = Colors.orange;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    final status = _app['status'] ?? 'pending';

    return Column(
      children: [
        if (status == 'pending') ...[
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _updateStatus('shortlisted'),
                  icon: const Icon(Icons.star, color: Colors.white, size: 18),
                  label: const Text(
                    'Shortlist',
                    style: TextStyle(color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.info,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _updateStatus('rejected'),
                  icon: const Icon(Icons.close, color: Colors.white, size: 18),
                  label: const Text(
                    'Reject',
                    style: TextStyle(color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.error,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
            ],
          ),
        ] else if (status == 'shortlisted') ...[
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => _updateStatus('interview_ready'),
              icon: const Icon(Icons.video_call, color: Colors.white, size: 20),
              label: const Text(
                'Mark Interview Ready',
                style: TextStyle(color: Colors.white),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
        ] else if (status == 'interview_ready') ...[
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _updateStatus('approved'),
                  icon: const Icon(Icons.check, color: Colors.white, size: 18),
                  label: const Text(
                    'Approve',
                    style: TextStyle(color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.success,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () => _updateStatus('rejected'),
                  icon: const Icon(Icons.close, color: Colors.white, size: 18),
                  label: const Text(
                    'Reject',
                    style: TextStyle(color: Colors.white),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.error,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ),
        ] else ...[
          Center(
            child: Text(
              'NO FURTHER ACTIONS AVAILABLE',
              style: TextStyle(
                color: AppTheme.textMuted.withValues(alpha: 0.5),
                fontSize: 11,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _DetailItem {
  final String label;
  final String value;
  final VoidCallback? onTap;
  _DetailItem(this.label, this.value, {this.onTap});
}
