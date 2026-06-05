import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/supabase_client.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../theme/colors.dart';
import '../../widgets/shimmer_loader.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});

  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  String _activeTab = 'team';

  // Data states
  List<dynamic> _customProjects = [];
  List<dynamic> _reportLinks = [];
  bool _loadingData = false;

  // Custom project modal states
  bool _submittingCustom = false;
  final TextEditingController _cpTitleCtrl = TextEditingController();
  final TextEditingController _cpDescCtrl = TextEditingController();
  final TextEditingController _cpLiveUrlCtrl = TextEditingController();
  final TextEditingController _cpGithubUrlCtrl = TextEditingController();

  // Team project modal states
  bool _submittingTeam = false;
  String? _modalProjectId;
  final TextEditingController _modalLiveUrlCtrl = TextEditingController();
  final TextEditingController _modalGithubUrlCtrl = TextEditingController();
  final TextEditingController _modalNotesCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadDataForActiveTab();
    });
  }

  @override
  void dispose() {
    _cpTitleCtrl.dispose();
    _cpDescCtrl.dispose();
    _cpLiveUrlCtrl.dispose();
    _cpGithubUrlCtrl.dispose();
    _modalLiveUrlCtrl.dispose();
    _modalGithubUrlCtrl.dispose();
    _modalNotesCtrl.dispose();
    super.dispose();
  }

  void _loadDataForActiveTab() {
    if (_activeTab == 'custom') _loadCustomProjects();
    if (_activeTab == 'reports') _loadReportLinks();
  }

  Future<void> _loadCustomProjects() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userId = authProvider.profile?['userProfile']?['id'];
    if (userId == null) return;

    setState(() => _loadingData = true);
    try {
      final response = await SupabaseClientConfig.client
          .from('custom_project_submissions')
          .select('*')
          .eq('intern_id', userId)
          .order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          _customProjects = response;
        });
      }
    } catch (e) {
      debugPrint('Error loading custom projects: $e');
    } finally {
      if (mounted) setState(() => _loadingData = false);
    }
  }

  Future<void> _loadReportLinks() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.profile?['userProfile']?['id'] == null) return;

    setState(() => _loadingData = true);
    try {
      final response = await SupabaseClientConfig.client
          .from('report_submission_links')
          .select('*')
          .eq('is_enabled', true)
          .order('created_at', ascending: false);
      if (mounted) {
        setState(() {
          _reportLinks = response;
        });
      }
    } catch (e) {
      debugPrint('Error loading report links: $e');
    } finally {
      if (mounted) setState(() => _loadingData = false);
    }
  }

  Map<String, dynamic> _getStatusInfo(dynamic project) {
    final subs = project['project_submissions'] as List?;
    final sub = (subs != null && subs.isNotEmpty) ? subs[0] : null;

    Color statusColor = const Color(0xFF94a3b8);
    String statusText = 'Assigned';
    Color bg = const Color(0x1A94a3b8);

    final pStatus = project['status'];
    if (pStatus == 'approved' || pStatus == 'completed') {
      statusColor = const Color(0xFF10b981);
      statusText = 'Completed';
      bg = const Color(0x1A10b981);
    } else if (pStatus == 'rejected') {
      statusColor = const Color(0xFFef4444);
      statusText = 'Rejected';
      bg = const Color(0x1Aef4444);
    } else if (pStatus == 'changes_requested') {
      statusColor = const Color(0xFFf59e0b);
      statusText = 'Changes Requested';
      bg = const Color(0x1Af59e0b);
    } else if (pStatus == 'under_review' || pStatus == 'in_progress') {
      statusColor = const Color(0xFF3b82f6);
      statusText = pStatus == 'under_review' ? 'Under Review' : 'In Progress';
      bg = const Color(0x1A3b82f6);
    } else if (sub != null) {
      final subStatus = sub['status'];
      if (subStatus == 'approved') {
        statusColor = const Color(0xFF10b981);
        statusText = 'Completed';
        bg = const Color(0x1A10b981);
      } else if (subStatus == 'rejected') {
        statusColor = const Color(0xFFef4444);
        statusText = 'Rejected';
        bg = const Color(0x1Aef4444);
      } else if (subStatus == 'changes_requested') {
        statusColor = const Color(0xFFf59e0b);
        statusText = 'Changes Requested';
        bg = const Color(0x1Af59e0b);
      } else {
        statusColor = const Color(0xFF3b82f6);
        statusText = 'Submitted (Review Pending)';
        bg = const Color(0x1A3b82f6);
      }
    }
    return {'statusColor': statusColor, 'statusText': statusText, 'bg': bg, 'sub': sub};
  }

  Future<void> _handleTeamSubmit() async {
    final dashboardProvider = Provider.of<DashboardProvider>(context, listen: false);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final currentTeam = dashboardProvider.currentTeam;
    final currentUser = authProvider.profile?['userProfile'];

    if (currentTeam == null || currentUser == null || _submittingTeam || _modalProjectId == null) return;
    setState(() => _submittingTeam = true);

    try {
      await SupabaseClientConfig.client.from('project_submissions').upsert({
        'team_id': currentTeam['id'],
        'project_id': _modalProjectId,
        'github_url': _modalGithubUrlCtrl.text,
        'live_url': _modalLiveUrlCtrl.text,
        'notes': _modalNotesCtrl.text,
        'submitted_by': currentUser['id'],
        'submitted_at': DateTime.now().toIso8601String(),
      });

      await SupabaseClientConfig.client.from('projects').update({'status': 'submitted'}).eq('id', _modalProjectId!);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Project Submitted!')));
        Navigator.of(context).pop(); // Close dialog
        dashboardProvider.fetchDashboardData(currentUser['id']); // Refresh
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _submittingTeam = false);
    }
  }

  Future<void> _submitCustomProject() async {
    if (_submittingCustom) return;

    final title = _cpTitleCtrl.text.trim();
    final desc = _cpDescCtrl.text.trim();
    final liveUrl = _cpLiveUrlCtrl.text.trim();
    final githubUrl = _cpGithubUrlCtrl.text.trim();

    if (title.isEmpty || desc.isEmpty || liveUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill in Title, Description, and Live URL.')));
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final currentUser = authProvider.profile?['userProfile'];
    if (currentUser == null) return;

    setState(() => _submittingCustom = true);

    try {
      String deployedUrl = liveUrl;
      if (!deployedUrl.startsWith('http')) deployedUrl = 'https://$deployedUrl';

      String? gUrl = githubUrl.isEmpty ? null : githubUrl;
      if (gUrl != null && !gUrl.startsWith('http')) gUrl = 'https://$gUrl';

      await SupabaseClientConfig.client.from('custom_project_submissions').insert({
        'intern_id': currentUser['id'],
        'title': title,
        'description': desc,
        'deployed_url': deployedUrl,
        'github_url': gUrl,
        'status': 'submitted'
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Project Submitted! Your project is under review.')));
        Navigator.of(context).pop(); // Close dialog
        _cpTitleCtrl.clear();
        _cpDescCtrl.clear();
        _cpLiveUrlCtrl.clear();
        _cpGithubUrlCtrl.clear();
        _loadCustomProjects();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    } finally {
      if (mounted) setState(() => _submittingCustom = false);
    }
  }

  void _showTeamModal(dynamic project) {
    final sub = _getStatusInfo(project)['sub'];
    setState(() {
      _modalProjectId = project['id'];
      _modalLiveUrlCtrl.text = sub?['live_url'] ?? '';
      _modalGithubUrlCtrl.text = sub?['github_url'] ?? '';
      _modalNotesCtrl.text = sub?['notes'] ?? '';
    });

    showDialog(
      context: context,
      builder: (ctx) => _buildTeamModal(),
    );
  }

  void _showCustomModal() {
    showDialog(
      context: context,
      builder: (ctx) => _buildCustomModal(),
    );
  }

  Widget _buildTeamModal() {
    return Dialog(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: StatefulBuilder(
        builder: (context, setDialogState) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Submit Project', style: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold)),
                    IconButton(
                      icon: const Icon(Icons.close, color: Color(0xFF94a3b8)),
                      onPressed: () => Navigator.of(context).pop(),
                    )
                  ],
                ),
                const SizedBox(height: 10),
                const Text('Live / Deployed URL (Required)', style: TextStyle(color: Color(0xFFcbd5e1), fontSize: 14)),
                const SizedBox(height: 8),
                _buildTextField(_modalLiveUrlCtrl, 'https://...'),
                const SizedBox(height: 15),
                const Text('GitHub URL (Optional)', style: TextStyle(color: Color(0xFFcbd5e1), fontSize: 14)),
                const SizedBox(height: 8),
                _buildTextField(_modalGithubUrlCtrl, 'https://github.com/...'),
                const SizedBox(height: 15),
                const Text('Notes (Optional)', style: TextStyle(color: Color(0xFFcbd5e1), fontSize: 14)),
                const SizedBox(height: 8),
                _buildTextField(_modalNotesCtrl, 'Any additional notes...', maxLines: 3),
                const SizedBox(height: 25),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: _submittingTeam ? null : () {
                      setDialogState(() => _submittingTeam = true);
                      _handleTeamSubmit();
                    },
                    child: _submittingTeam 
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: AppColors.background, strokeWidth: 2))
                        : const Text('Submit', style: TextStyle(color: AppColors.background, fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildCustomModal() {
    return Dialog(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: StatefulBuilder(
        builder: (context, setDialogState) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Submit Custom Project', style: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold)),
                    IconButton(
                      icon: const Icon(Icons.close, color: Color(0xFF94a3b8)),
                      onPressed: () => Navigator.of(context).pop(),
                    )
                  ],
                ),
                const SizedBox(height: 10),
                const Text('Project Title (Required)', style: TextStyle(color: Color(0xFFcbd5e1), fontSize: 14)),
                const SizedBox(height: 8),
                _buildTextField(_cpTitleCtrl, 'E.g., Personal Portfolio'),
                const SizedBox(height: 15),
                const Text('Description (Required)', style: TextStyle(color: Color(0xFFcbd5e1), fontSize: 14)),
                const SizedBox(height: 8),
                _buildTextField(_cpDescCtrl, 'What is this project about?', maxLines: 3),
                const SizedBox(height: 15),
                const Text('Live / Deployed URL (Required)', style: TextStyle(color: Color(0xFFcbd5e1), fontSize: 14)),
                const SizedBox(height: 8),
                _buildTextField(_cpLiveUrlCtrl, 'https://...'),
                const SizedBox(height: 15),
                const Text('GitHub URL (Optional)', style: TextStyle(color: Color(0xFFcbd5e1), fontSize: 14)),
                const SizedBox(height: 8),
                _buildTextField(_cpGithubUrlCtrl, 'https://github.com/...'),
                const SizedBox(height: 25),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: _submittingCustom ? null : () {
                       setDialogState(() => _submittingCustom = true);
                      _submitCustomProject();
                    },
                    child: _submittingCustom 
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: AppColors.background, strokeWidth: 2))
                        : const Text('Submit', style: TextStyle(color: AppColors.background, fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, {int maxLines = 1}) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      style: const TextStyle(color: AppColors.text, fontSize: 15),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Color(0xFF475569)),
        filled: true,
        fillColor: const Color(0x0DFFFFFF),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0x1AFFFFFF))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.primary)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      ),
    );
  }

  Widget _buildTabsRow() {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: Color(0xFF1f1f2e))),
      ),
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 15),
        child: Row(
          children: [
            _buildTabButton('team', 'Team Projects', Icons.business_center),
            _buildTabButton('custom', 'Custom', Icons.rocket_launch),
            _buildTabButton('reports', 'Reports', Icons.description),
          ],
        ),
      ),
    );
  }

  Widget _buildTabButton(String id, String label, IconData icon) {
    final isActive = _activeTab == id;
    return GestureDetector(
      onTap: () {
        setState(() => _activeTab = id);
        _loadDataForActiveTab();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color: isActive ? const Color(0x1A22d87a) : const Color(0x0DFFFFFF),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: isActive ? AppColors.primary : const Color(0xFF94a3b8)),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(color: isActive ? AppColors.primary : const Color(0xFF94a3b8), fontSize: 14, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildTeamProjects(DashboardProvider dashboard) {
    if (dashboard.loadingDashboard) {
      return const SkeletonList();
    }
    if (dashboard.currentTeam == null) {
      return _buildEmptyState(Icons.people, 'No Team Assigned', "You haven't been assigned to a team yet.");
    }
    if (dashboard.currentProjects.isEmpty) {
      return _buildEmptyState(Icons.folder_open, 'No Projects', 'No projects assigned yet.');
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: dashboard.currentProjects.length,
      itemBuilder: (context, index) {
        final project = dashboard.currentProjects[index];
        final info = _getStatusInfo(project);
        final sub = info['sub'];

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF1f1f2e)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(color: info['bg'], borderRadius: BorderRadius.circular(12)),
                child: Text(info['statusText'], style: TextStyle(color: info['statusColor'], fontSize: 12, fontWeight: FontWeight.bold)),
              ),
              Text(project['title'] ?? '', style: const TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              if (project['description'] != null)
                Text(project['description'], maxLines: 3, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 14, height: 1.4)),
              
              if (sub?['feedback'] != null)
                Container(
                  margin: const EdgeInsets.only(top: 10, bottom: 15),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0x1Aef4444),
                    borderRadius: BorderRadius.circular(8),
                    border: const Border(left: BorderSide(color: Color(0xFFef4444), width: 3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Admin Feedback', style: TextStyle(color: Color(0xFFef4444), fontSize: 12, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(sub['feedback'], style: const TextStyle(color: Color(0xFFf8fafc), fontSize: 13)),
                    ],
                  ),
                ),

              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  minimumSize: const Size(double.infinity, 44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () => _showTeamModal(project),
                child: Text(sub != null ? 'Update Submission' : 'Submit Project', style: const TextStyle(color: AppColors.background, fontWeight: FontWeight.bold)),
              )
            ],
          ),
        );
      },
    );
  }

  Widget _buildCustomProjects() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(20).copyWith(bottom: 0),
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              minimumSize: const Size(double.infinity, 44),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            icon: const Icon(Icons.add, color: AppColors.background, size: 20),
            label: const Text('Submit New Custom Project', style: TextStyle(color: AppColors.background, fontWeight: FontWeight.bold)),
            onPressed: _showCustomModal,
          ),
        ),
        Expanded(
          child: _loadingData 
              ? const SkeletonList()
              : _customProjects.isEmpty
                  ? _buildEmptyState(Icons.rocket_launch, 'No Custom Projects', "You haven't submitted any custom projects yet.")
                  : ListView.builder(
                      padding: const EdgeInsets.all(20),
                      itemCount: _customProjects.length,
                      itemBuilder: (context, index) {
                        final cp = _customProjects[index];
                        Color sColor = const Color(0xFF94a3b8);
                        String sText = 'Pending';
                        if (cp['status'] == 'approved') { sColor = const Color(0xFF10b981); sText = 'Approved'; }
                        if (cp['status'] == 'rejected') { sColor = const Color(0xFFef4444); sText = 'Rejected'; }
                        if (cp['status'] == 'reviewed') { sColor = const Color(0xFFf59e0b); sText = 'Reviewed'; }

                        return Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFF1f1f2e)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                margin: const EdgeInsets.only(bottom: 12),
                                decoration: BoxDecoration(color: sColor.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
                                child: Text(sText, style: TextStyle(color: sColor, fontSize: 12, fontWeight: FontWeight.bold)),
                              ),
                              Text(cp['title'] ?? '', style: const TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 8),
                              Text(cp['description'] ?? '', style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 14, height: 1.4)),
                              if (cp['feedback'] != null)
                                Container(
                                  margin: const EdgeInsets.only(top: 10),
                                  padding: const EdgeInsets.all(12),
                                  decoration: BoxDecoration(
                                    color: const Color(0x1Aef4444),
                                    borderRadius: BorderRadius.circular(8),
                                    border: const Border(left: BorderSide(color: Color(0xFFef4444), width: 3)),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text('Admin Feedback', style: TextStyle(color: Color(0xFFef4444), fontSize: 12, fontWeight: FontWeight.bold)),
                                      const SizedBox(height: 4),
                                      Text(cp['feedback'], style: const TextStyle(color: Color(0xFFf8fafc), fontSize: 13)),
                                    ],
                                  ),
                                ),
                            ],
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }

  Widget _buildReports() {
    if (_loadingData) {
      return const SkeletonList();
    }
    if (_reportLinks.isEmpty) {
      return _buildEmptyState(Icons.description, 'No Reports Required', 'No active report submission links.');
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: _reportLinks.length,
      itemBuilder: (context, index) {
        final link = _reportLinks[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF1f1f2e)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(link['title'] ?? '', style: const TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(link['description'] ?? '', style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 14)),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  minimumSize: const Size(double.infinity, 44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: const Icon(Icons.open_in_new, color: AppColors.background, size: 18),
                label: const Text('Open Form', style: TextStyle(color: AppColors.background, fontWeight: FontWeight.bold)),
                onPressed: () async {
                  if (link['form_url'] != null) {
                    final url = Uri.parse(link['form_url']);
                    try {
                      await launchUrl(url, mode: LaunchMode.externalApplication);
                    } catch (e) {
                      debugPrint('Could not launch $url');
                    }
                  }
                },
              )
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(IconData icon, String title, String desc) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 48, color: const Color(0xFF334155)),
            const SizedBox(height: 15),
            Text(title, style: const TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(desc, textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF94a3b8), fontSize: 14)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final dashboard = Provider.of<DashboardProvider>(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.only(top: 20, left: 20, right: 20, bottom: 20),
              color: AppColors.surface,
              width: double.infinity,
              child: const Text('Projects', style: TextStyle(color: AppColors.text, fontSize: 28, fontWeight: FontWeight.bold)),
            ),
            _buildTabsRow(),
            Expanded(
              child: _activeTab == 'team'
                  ? _buildTeamProjects(dashboard)
                  : _activeTab == 'custom'
                      ? _buildCustomProjects()
                      : _buildReports(),
            ),
          ],
        ),
      ),
    );
  }
}
