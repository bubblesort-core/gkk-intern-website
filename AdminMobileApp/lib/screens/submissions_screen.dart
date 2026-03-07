import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';

class SubmissionsScreen extends StatefulWidget {
  const SubmissionsScreen({super.key});
  @override
  State<SubmissionsScreen> createState() => _SubmissionsScreenState();
}

class _SubmissionsScreenState extends State<SubmissionsScreen> {
  List<Map<String, dynamic>> _submissions = [];
  bool _loading = true;

  List<Map<String, dynamic>> _customSubmissions = [];
  bool _loadingCustom = true;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    await Future.wait([_loadAssigned(), _loadCustom()]);
  }

  Future<void> _loadAssigned() async {
    setState(() => _loading = true);
    final data = await AdminSupabaseService.getSubmissions();
    if (mounted) {
      setState(() {
        _submissions = data;
        _loading = false;
      });
    }
  }

  Future<void> _loadCustom() async {
    setState(() => _loadingCustom = true);
    final data = await AdminSupabaseService.getCustomSubmissions();
    if (mounted) {
      setState(() {
        _customSubmissions = data;
        _loadingCustom = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          const TabBar(
            indicatorColor: AppTheme.primary,
            labelColor: AppTheme.primary,
            unselectedLabelColor: AppTheme.textMuted,
            indicatorSize: TabBarIndicatorSize.tab,
            dividerColor: Colors.transparent,
            tabs: [
              Tab(text: 'Assigned'),
              Tab(text: 'Custom Projects'),
            ],
          ),
          Expanded(
            child: TabBarView(
              children: [_buildAssignedTab(), _buildCustomTab()],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAssignedTab() {
    return RefreshIndicator(
      color: AppTheme.primary,
      backgroundColor: AppTheme.bgCard,
      onRefresh: _loadAssigned,
      child: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            )
          : _submissions.isEmpty
          ? ListView(
              children: [
                SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.cloud_upload_outlined,
                        size: 48,
                        color: AppTheme.textMuted.withValues(alpha: 0.4),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'No submissions yet',
                        style: TextStyle(color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
              ],
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _submissions.length,
              itemBuilder: (ctx, i) {
                final s = _submissions[i];
                final status = s['status'] ?? 'pending';
                final statusColor = status == 'approved'
                    ? AppTheme.success
                    : status == 'rejected'
                    ? AppTheme.error
                    : status == 'changes_requested'
                    ? Colors.orange
                    : AppTheme.warning;
                return GestureDetector(
                  onTap: () => _showReviewDialog(s),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                s['projects']?['title'] ?? 'Project',
                                style: const TextStyle(
                                  color: AppTheme.textMain,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              Text(
                                s['profiles']?['full_name'] ?? 'Unknown',
                                style: const TextStyle(
                                  color: AppTheme.textMuted,
                                  fontSize: 12,
                                ),
                              ),
                              if (s['submission_url'] != null)
                                Padding(
                                  padding: const EdgeInsets.only(top: 4),
                                  child: Text(
                                    s['submission_url'],
                                    style: const TextStyle(
                                      color: AppTheme.primary,
                                      fontSize: 11,
                                      decoration: TextDecoration.underline,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            status.toUpperCase(),
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: statusColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  Widget _buildCustomTab() {
    return RefreshIndicator(
      color: AppTheme.primary,
      backgroundColor: AppTheme.bgCard,
      onRefresh: _loadCustom,
      child: _loadingCustom
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            )
          : _customSubmissions.isEmpty
          ? ListView(
              children: [
                SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.folder_off_outlined,
                        size: 48,
                        color: AppTheme.textMuted.withValues(alpha: 0.4),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'No custom projects yet',
                        style: TextStyle(color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
              ],
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _customSubmissions.length,
              itemBuilder: (ctx, i) {
                final s = _customSubmissions[i];
                final status = s['status'] ?? 'submitted';
                final statusColor = status == 'approved'
                    ? AppTheme.success
                    : status == 'rejected'
                    ? AppTheme.error
                    : (status == 'submitted'
                          ? const Color(0xFF6366F1)
                          : AppTheme.warning);
                final String label = status == 'submitted'
                    ? 'PENDING'
                    : status.toUpperCase();

                return GestureDetector(
                  onTap: () => _showCustomReviewDialog(s),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                s['title'] ?? 'Custom Project',
                                style: const TextStyle(
                                  color: AppTheme.textMain,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                s['profiles']?['full_name'] ?? 'Unknown Intern',
                                style: const TextStyle(
                                  color: AppTheme.textMuted,
                                  fontSize: 12,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  if (s['deployed_url'] != null) ...[
                                    const Icon(
                                      Icons.public,
                                      size: 12,
                                      color: AppTheme.primary,
                                    ),
                                    const SizedBox(width: 4),
                                    const Text(
                                      'Live Demo',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                  ],
                                  if (s['github_url'] != null) ...[
                                    const Icon(
                                      Icons.code,
                                      size: 12,
                                      color: AppTheme.textMuted,
                                    ),
                                    const SizedBox(width: 4),
                                    const Text(
                                      'GitHub',
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: AppTheme.textMuted,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            label,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: statusColor,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  void _showReviewDialog(Map<String, dynamic> submission) {
    final feedbackCtrl = TextEditingController(text: submission['feedback']);
    final gradeCtrl = TextEditingController(
      text: submission['grade']?.toString() ?? '',
    );

    // Quick feedback templates
    final templates = [
      {'icon': '✨', 'label': 'Great Work', 'text': 'Great work! Your submission meets all requirements.'},
      {'icon': '🎨', 'label': 'UI Improvements', 'text': 'Please improve the UI/UX design and responsiveness.'},
      {'icon': '💻', 'label': 'Code Quality', 'text': 'Code quality needs improvement. Please refactor and add comments.'},
      {'icon': '📋', 'label': 'Missing Features', 'text': 'Missing required features. Please review the project requirements.'},
      {'icon': '🐛', 'label': 'Fix Bugs', 'text': 'Fix bugs and test thoroughly before resubmitting.'},
    ];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.bgCard,
          title: const Text(
            'Review Submission',
            style: TextStyle(color: AppTheme.textMain),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Project: ${submission['projects']?['title']}',
                  style: const TextStyle(
                    color: AppTheme.textBody,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'By: ${submission['profiles']?['full_name']}',
                  style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
                const SizedBox(height: 16),
                // Quick Feedback Templates
                const Text(
                  'Quick Feedback',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 11, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: templates.map((t) => InkWell(
                    onTap: () {
                      setDialogState(() {
                        feedbackCtrl.text = t['text']!;
                      });
                    },
                    borderRadius: BorderRadius.circular(6),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppTheme.bgBody,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: Text(
                        '${t['icon']} ${t['label']}',
                        style: const TextStyle(fontSize: 11, color: AppTheme.textBody),
                      ),
                    ),
                  )).toList(),
                ),
                const SizedBox(height: 12),
                const Text(
                  'Feedback',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
                TextField(
                  controller: feedbackCtrl,
                  maxLines: 3,
                  style: const TextStyle(color: AppTheme.textMain, fontSize: 14),
                  decoration: const InputDecoration(
                    hintText: 'Add your review comments here...',
                    hintStyle: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Grade / XP Awarded',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
                TextField(
                  controller: gradeCtrl,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: AppTheme.textMain, fontSize: 14),
                  decoration: const InputDecoration(
                    hintText: 'e.g. 50',
                    hintStyle: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            // Changes Requested
            TextButton(
              onPressed: () async {
                await AdminSupabaseService.reviewSubmission(
                  submission['id'].toString(),
                  'changes_requested',
                  feedback: feedbackCtrl.text,
                  grade: int.tryParse(gradeCtrl.text),
                );
                if (ctx.mounted) Navigator.pop(ctx);
                _loadAssigned();
              },
              child: const Text(
                'Changes',
                style: TextStyle(color: Colors.orange, fontWeight: FontWeight.w600),
              ),
            ),
            // Reject
            TextButton(
              onPressed: () async {
                await AdminSupabaseService.reviewSubmission(
                  submission['id'].toString(),
                  'rejected',
                  feedback: feedbackCtrl.text,
                  grade: int.tryParse(gradeCtrl.text),
                );
                if (ctx.mounted) Navigator.pop(ctx);
                _loadAssigned();
              },
              child: const Text(
                'Reject',
                style: TextStyle(color: AppTheme.error),
              ),
            ),
            // Approve
            ElevatedButton(
              onPressed: () async {
                await AdminSupabaseService.reviewSubmission(
                  submission['id'].toString(),
                  'approved',
                  feedback: feedbackCtrl.text,
                  grade: int.tryParse(gradeCtrl.text),
                );
                if (ctx.mounted) Navigator.pop(ctx);
                _loadAssigned();
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.success),
              child: const Text('Approve', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  void _showCustomReviewDialog(Map<String, dynamic> submission) {
    final notesCtrl = TextEditingController(text: submission['admin_notes']);

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: AppTheme.bgCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(
                      Icons.rocket_launch,
                      color: AppTheme.primary,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          submission['title'] ?? 'Custom Project',
                          style: const TextStyle(
                            color: AppTheme.textMain,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'By ${submission['profiles']?['full_name'] ?? 'Unknown'}',
                          style: const TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Text(
                'Description',
                style: TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Text(
                  submission['description'] ?? 'No description provided.',
                  style: const TextStyle(
                    color: AppTheme.textBody,
                    fontSize: 14,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              if (submission['deployed_url'] != null) ...[
                const Text(
                  'Deployed URL',
                  style: TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  submission['deployed_url'],
                  style: const TextStyle(
                    color: AppTheme.primary,
                    fontSize: 13,
                    decoration: TextDecoration.underline,
                  ),
                ),
                const SizedBox(height: 12),
              ],
              if (submission['github_url'] != null) ...[
                const Text(
                  'GitHub Repository',
                  style: TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  submission['github_url'],
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 13,
                    decoration: TextDecoration.underline,
                  ),
                ),
                const SizedBox(height: 20),
              ],

              const Divider(color: AppTheme.border),
              const SizedBox(height: 16),

              const Text(
                'Admin Remarks (Optional)',
                style: TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: notesCtrl,
                maxLines: 3,
                style: const TextStyle(color: AppTheme.textMain, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Feedback for the intern...',
                  hintStyle: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 13,
                  ),
                  filled: true,
                  fillColor: Colors.black.withValues(alpha: 0.2),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTheme.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTheme.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: AppTheme.primary),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  // Changes Requested
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                          side: const BorderSide(color: Colors.orange),
                        ),
                        side: const BorderSide(color: Colors.orange),
                      ),
                      onPressed: () async {
                        await AdminSupabaseService.reviewCustomSubmission(
                          submission['id'].toString(),
                          'changes_requested',
                          adminNotes: notesCtrl.text,
                        );
                        if (ctx.mounted) Navigator.pop(ctx);
                        _loadCustom();
                      },
                      child: const Text(
                        'Changes',
                        style: TextStyle(
                          color: Colors.orange,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Reject
                  Expanded(
                    child: TextButton(
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                          side: const BorderSide(color: AppTheme.error),
                        ),
                      ),
                      onPressed: () async {
                        await AdminSupabaseService.reviewCustomSubmission(
                          submission['id'].toString(),
                          'rejected',
                          adminNotes: notesCtrl.text,
                        );
                        if (ctx.mounted) Navigator.pop(ctx);
                        _loadCustom();
                      },
                      child: const Text(
                        'Reject',
                        style: TextStyle(
                          color: AppTheme.error,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Approve
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.success,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      onPressed: () async {
                        await AdminSupabaseService.reviewCustomSubmission(
                          submission['id'].toString(),
                          'approved',
                          adminNotes: notesCtrl.text,
                        );
                        if (ctx.mounted) Navigator.pop(ctx);
                        _loadCustom();
                      },
                      child: const Text(
                        'Approve',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Center(
                child: TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text(
                    'Cancel',
                    style: TextStyle(color: AppTheme.textMuted),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
