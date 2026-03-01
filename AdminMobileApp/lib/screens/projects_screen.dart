import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});
  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  List<Map<String, dynamic>> _projects = [];
  bool _loading = true;

  List<Map<String, dynamic>> _teams = [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final results = await Future.wait([
      AdminSupabaseService.getAllProjects(),
      AdminSupabaseService.getAllTeams(),
    ]);
    if (mounted) {
      setState(() {
        _projects = results[0];
        _teams = results[1];
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        color: AppTheme.primary,
        backgroundColor: AppTheme.bgCard,
        onRefresh: _load,
        child: _loading
            ? const Center(
                child: CircularProgressIndicator(color: AppTheme.primary),
              )
            : _projects.isEmpty
            ? ListView(
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.account_tree_outlined,
                          size: 48,
                          color: AppTheme.textMuted.withValues(alpha: 0.4),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'No projects yet',
                          style: TextStyle(color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _projects.length,
                itemBuilder: (ctx, i) {
                  final p = _projects[i];
                  final status = p['status'] ?? 'draft';
                  final statusColor = status == 'completed'
                      ? AppTheme.success
                      : status == 'assigned'
                      ? AppTheme.info
                      : status == 'in_progress'
                      ? AppTheme.warning
                      : AppTheme.textMuted;
                  final teamName = p['teams']?['name'] ?? 'Unassigned';
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
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
                                p['title'] ?? 'Project',
                                style: const TextStyle(
                                  color: AppTheme.textMain,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 15,
                                ),
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
                                status.toUpperCase(),
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: statusColor,
                                ),
                              ),
                            ),
                            PopupMenuButton<String>(
                              icon: const Icon(
                                Icons.more_vert,
                                color: AppTheme.textMuted,
                              ),
                              onSelected: (val) {
                                if (val == 'edit') {
                                  _showProjectDialog(p);
                                } else if (val == 'delete') {
                                  _confirmDelete(p);
                                }
                              },
                              itemBuilder: (ctx) => [
                                const PopupMenuItem(
                                  value: 'edit',
                                  child: Text('Edit'),
                                ),
                                const PopupMenuItem(
                                  value: 'delete',
                                  child: Text(
                                    'Delete',
                                    style: TextStyle(color: AppTheme.error),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        if (p['description'] != null) ...[
                          const SizedBox(height: 6),
                          Text(
                            p['description'],
                            style: const TextStyle(
                              color: AppTheme.textMuted,
                              fontSize: 12,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(
                              Icons.groups,
                              size: 14,
                              color: AppTheme.textMuted,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              teamName,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppTheme.textBody,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showProjectDialog(),
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Future<void> _showProjectDialog([Map<String, dynamic>? project]) async {
    final titleController = TextEditingController(text: project?['title']);
    final descController = TextEditingController(text: project?['description']);
    String? selectedTeamId = project?['assigned_team_id'];
    String status = project?['status'] ?? 'draft';

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.bgCard,
          title: Text(
            project == null ? 'Create Project' : 'Edit Project',
            style: const TextStyle(color: AppTheme.textMain),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleController,
                  style: const TextStyle(color: AppTheme.textMain),
                  decoration: const InputDecoration(
                    labelText: 'Project Title',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                    enabledBorder: UnderlineInputBorder(
                      borderSide: BorderSide(color: AppTheme.border),
                    ),
                  ),
                ),
                TextField(
                  controller: descController,
                  style: const TextStyle(color: AppTheme.textMain),
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Description',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                    enabledBorder: UnderlineInputBorder(
                      borderSide: BorderSide(color: AppTheme.border),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  dropdownColor: AppTheme.bgCard,
                  initialValue: selectedTeamId,
                  items: [
                    const DropdownMenuItem(
                      value: null,
                      child: Text(
                        'Unassigned',
                        style: TextStyle(color: AppTheme.textMuted),
                      ),
                    ),
                    ..._teams.map(
                      (t) => DropdownMenuItem(
                        value: t['id'].toString(),
                        child: Text(
                          t['name'] ?? 'Team',
                          style: const TextStyle(color: AppTheme.textMain),
                        ),
                      ),
                    ),
                  ],
                  onChanged: (val) =>
                      setDialogState(() => selectedTeamId = val),
                  decoration: const InputDecoration(
                    labelText: 'Team',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                  ),
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  dropdownColor: AppTheme.bgCard,
                  initialValue: status,
                  items: const [
                    DropdownMenuItem(
                      value: 'draft',
                      child: Text(
                        'Draft',
                        style: TextStyle(color: AppTheme.textMain),
                      ),
                    ),
                    DropdownMenuItem(
                      value: 'assigned',
                      child: Text(
                        'Assigned',
                        style: TextStyle(color: AppTheme.textMain),
                      ),
                    ),
                    DropdownMenuItem(
                      value: 'in_progress',
                      child: Text(
                        'In Progress',
                        style: TextStyle(color: AppTheme.textMain),
                      ),
                    ),
                    DropdownMenuItem(
                      value: 'completed',
                      child: Text(
                        'Completed',
                        style: TextStyle(color: AppTheme.textMain),
                      ),
                    ),
                  ],
                  onChanged: (val) => setDialogState(() => status = val!),
                  decoration: const InputDecoration(
                    labelText: 'Status',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: TextEditingController(
                    text: project?['difficulty']?.toString() ?? '1.0',
                  ),
                  onChanged: (val) =>
                      project?['difficulty'] = double.tryParse(val) ?? 1.0,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: AppTheme.textMain),
                  decoration: const InputDecoration(
                    labelText: 'Difficulty Multiplier (XP)',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                    hintText: 'e.g. 1.5',
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: TextEditingController(text: project?['deadline']),
                  onChanged: (val) => project?['deadline'] = val,
                  style: const TextStyle(color: AppTheme.textMain),
                  decoration: const InputDecoration(
                    labelText: 'Deadline (YYYY-MM-DD)',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                    hintText: 'e.g. 2026-12-31',
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text(
                'Cancel',
                style: TextStyle(color: AppTheme.textMuted),
              ),
            ),
            ElevatedButton(
              onPressed: () async {
                if (titleController.text.trim().isEmpty) return;
                try {
                  final data = {
                    'title': titleController.text.trim(),
                    'description': descController.text.trim(),
                    'assigned_team_id': selectedTeamId,
                    'status': status,
                  };
                  if (project == null) {
                    await AdminSupabaseService.createProject(data);
                  } else {
                    await AdminSupabaseService.updateProject(
                      project['id'],
                      data,
                    );
                  }
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                    _load();
                  }
                } catch (e) {
                  debugPrint('Project error: $e');
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
              ),
              child: const Text('Save', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmDelete(Map<String, dynamic> project) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text(
          'Delete Project',
          style: TextStyle(color: AppTheme.textMain),
        ),
        content: Text(
          'Are you sure you want to delete project "${project['title']}"?',
          style: const TextStyle(color: AppTheme.textBody),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppTheme.textMuted),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Delete',
              style: TextStyle(color: AppTheme.error),
            ),
          ),
        ],
      ),
    );

    if (ok == true) {
      await AdminSupabaseService.deleteProject(project['id']);
      _load();
    }
  }
}
