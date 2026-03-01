import 'package:flutter/material.dart';
import 'package:internmobileapp/theme/app_theme.dart';
import 'package:internmobileapp/services/supabase_service.dart';
import 'package:internmobileapp/services/update_service.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:flutter_animate/flutter_animate.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});

  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  List<Map<String, dynamic>> _projects = [];
  bool _isLoading = true;

  List<Map<String, dynamic>> _customProjects = [];
  bool _isLoadingCustom = true;
  bool _isSubmitting = false;

  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _deployedUrlController = TextEditingController();
  final _githubUrlController = TextEditingController();

  static const _skeletonProjects = [
    {
      'title': 'Project Alpha',
      'status': 'in_progress',
      'description': 'Description of project alpha...',
      'teams': {'name': 'Team Web'},
      'deadline': '2023-12-31',
    },
    {
      'title': 'Project Beta',
      'status': 'assigned',
      'description': 'Description of project beta...',
      'teams': {'name': 'Team Mobile'},
      'deadline': '2023-11-15',
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadProjects();
    _loadCustomProjects();
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _deployedUrlController.dispose();
    _githubUrlController.dispose();
    super.dispose();
  }

  Future<void> _loadProjects() async {
    final projects = await SupabaseService.getMyProjects();
    if (mounted) {
      setState(() {
        _projects = projects;
        _isLoading = false;
      });
    }
  }

  Future<void> _loadCustomProjects() async {
    final custom = await SupabaseService.getMyCustomProjects();
    if (mounted) {
      setState(() {
        _customProjects = custom;
        _isLoadingCustom = false;
      });
    }
  }

  Future<void> _submitCustomProject() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);

    try {
      await SupabaseService.submitCustomProject(
        title: _titleController.text,
        description: _descController.text,
        deployedUrl: _deployedUrlController.text,
        githubUrl: _githubUrlController.text,
      );

      _titleController.clear();
      _descController.clear();
      _deployedUrlController.clear();
      _githubUrlController.clear();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Project submitted successfully!'),
            backgroundColor: AppTheme.success,
          ),
        );
      }
      await _loadCustomProjects();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to submit: $e'),
            backgroundColor: AppTheme.error,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  Color _statusColor(String? status) {
    switch (status) {
      case 'assigned':
        return const Color(0xFF3B82F6);
      case 'in_progress':
        return const Color(0xFFF59E0B);
      case 'completed':
      case 'approved':
        return const Color(0xFF10B981);
      case 'review':
      case 'reviewed':
        return const Color(0xFF8B5CF6);
      case 'rejected':
        return const Color(0xFFEF4444);
      case 'submitted':
      default:
        return const Color(0xFF6366F1); // Pending Review
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
              Tab(text: 'Assigned Projects'),
              Tab(text: 'Submit Your Own'),
            ],
          ),
          Expanded(
            child: TabBarView(
              children: [
                _buildAssignedProjectsTab(),
                _buildCustomProjectsTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAssignedProjectsTab() {
    final items = _isLoading ? _skeletonProjects : _projects;

    return Skeletonizer(
      enabled: _isLoading,
      child: RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: () async {
          await Future.wait([
            _loadProjects(),
            UpdateService().checkForUpdate(),
          ]);
        },
        child: _projects.isEmpty && !_isLoading
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.folder_open_outlined,
                      size: 64,
                      color: AppTheme.textMuted.withValues(alpha: 0.5),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'No assigned projects yet',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textMain,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Check back later for assigned tasks.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: AppTheme.textMuted),
                    ),
                  ],
                ),
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: items.length,
                itemBuilder: (context, index) {
                  final project = items[index];
                  final status = project['status'] ?? 'unknown';
                  final teamName = project['teams']?['name'] ?? 'No Team';

                  return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
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
                                Expanded(
                                  child: Text(
                                    project['title'] ?? 'Untitled Project',
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.textMain,
                                    ),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _statusColor(
                                      status,
                                    ).withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: _statusColor(
                                        status,
                                      ).withValues(alpha: 0.3),
                                    ),
                                  ),
                                  child: Text(
                                    status.replaceAll('_', ' ').toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: _statusColor(status),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            if (project['description'] != null) ...[
                              const SizedBox(height: 8),
                              Text(
                                project['description'],
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppTheme.textBody,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                const Icon(
                                  Icons.group,
                                  size: 14,
                                  color: AppTheme.textMuted,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  teamName,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: AppTheme.textMuted,
                                  ),
                                ),
                                if (project['deadline'] != null) ...[
                                  const Spacer(),
                                  const Icon(
                                    Icons.schedule,
                                    size: 14,
                                    color: AppTheme.textMuted,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    project['deadline'].toString().substring(
                                      0,
                                      10,
                                    ),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppTheme.textMuted,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      )
                      .animate()
                      .fadeIn(duration: 400.ms, delay: (index * 100).ms)
                      .slideX(begin: 0.1, end: 0);
                },
              ),
      ),
    );
  }

  Widget _buildCustomProjectsTab() {
    return RefreshIndicator(
      color: AppTheme.primary,
      onRefresh: _loadCustomProjects,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Submission Form
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.bgCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.border),
              ),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      'Submit Custom Project',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textMain,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildInputField(
                      'Project Title',
                      _titleController,
                      'e.g. Dashboard App',
                    ),
                    const SizedBox(height: 12),
                    _buildInputField(
                      'Purpose / Description',
                      _descController,
                      'Features and tech stack...',
                      maxLines: 3,
                    ),
                    const SizedBox(height: 12),
                    _buildInputField(
                      'Project Deployed Link',
                      _deployedUrlController,
                      'your-project.vercel.app',
                      prefixIcon: Icons.public,
                    ),
                    const SizedBox(height: 12),
                    _buildInputField(
                      'GitHub Repository Link (Optional)',
                      _githubUrlController,
                      'github.com/username/repo',
                      prefixIcon: Icons.code,
                      isRequired: false,
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: _isSubmitting ? null : _submitCustomProject,
                      child: _isSubmitting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  Colors.white,
                                ),
                              ),
                            )
                          : const Text(
                              'Submit Project',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Your Submissions',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppTheme.textMain,
              ),
            ),
            const SizedBox(height: 12),
            if (_isLoadingCustom)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: CircularProgressIndicator(color: AppTheme.primary),
                ),
              )
            else if (_customProjects.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 30),
                  child: Column(
                    children: [
                      Icon(
                        Icons.folder_off_outlined,
                        size: 48,
                        color: AppTheme.textMuted.withValues(alpha: 0.5),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'No custom submissions found',
                        style: TextStyle(color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
              )
            else
              ..._customProjects.map((p) => _buildCustomProjectCard(p)),
          ],
        ),
      ),
    );
  }

  Widget _buildInputField(
    String label,
    TextEditingController controller,
    String hint, {
    int maxLines = 1,
    IconData? prefixIcon,
    bool isRequired = true,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.textSecondary,
              ),
            ),
            if (isRequired)
              const Text(
                ' *',
                style: TextStyle(
                  color: Colors.red,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
          ],
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          style: const TextStyle(color: AppTheme.textMain, fontSize: 14),
          validator: isRequired
              ? (value) =>
                    value == null || value.trim().isEmpty ? 'Required' : null
              : null,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 14),
            prefixIcon: prefixIcon != null
                ? Icon(prefixIcon, color: AppTheme.textMuted, size: 18)
                : null,
            filled: true,
            fillColor: Colors.black.withValues(alpha: 0.3),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 14,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppTheme.border),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppTheme.border),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppTheme.primary),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCustomProjectCard(Map<String, dynamic> project) {
    final status = project['status'] ?? 'submitted';
    final statusColor = _statusColor(status);
    final String label = status == 'submitted'
        ? 'PENDING REVIEW'
        : status.toUpperCase();

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  project['title'] ?? 'Custom Project',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textMain,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: statusColor.withValues(alpha: 0.3)),
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
          const SizedBox(height: 8),
          Text(
            project['description'] ?? '',
            style: const TextStyle(fontSize: 13, color: AppTheme.textBody),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.public, size: 14, color: AppTheme.primary),
              const SizedBox(width: 4),
              const Text(
                'Live Demo',
                style: TextStyle(fontSize: 12, color: AppTheme.primary),
              ),
              if (project['github_url'] != null) ...[
                const SizedBox(width: 16),
                const Icon(Icons.code, size: 14, color: AppTheme.textSecondary),
                const SizedBox(width: 4),
                const Text(
                  'GitHub',
                  style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
              ],
            ],
          ),
          if (project['admin_notes'] != null) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.03),
                borderRadius: BorderRadius.circular(8),
                border: Border(left: BorderSide(color: statusColor, width: 3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Admin Feedback',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.textMuted,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    project['admin_notes'],
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
