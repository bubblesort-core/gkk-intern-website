import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';

class TeamsScreen extends StatefulWidget {
  const TeamsScreen({super.key});
  @override
  State<TeamsScreen> createState() => _TeamsScreenState();
}

class _TeamsScreenState extends State<TeamsScreen> {
  List<Map<String, dynamic>> _teams = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await AdminSupabaseService.getAllTeams();
    if (mounted) {
      setState(() {
        _teams = data;
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
            : _teams.isEmpty
            ? ListView(
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.groups_outlined,
                          size: 48,
                          color: AppTheme.textMuted.withValues(alpha: 0.4),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'No teams yet',
                          style: TextStyle(color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _teams.length,
                itemBuilder: (ctx, i) {
                  final t = _teams[i];
                  final membersCount =
                      (t['team_members'] as List?)?.length ?? 0;
                  final projectsCount = (t['projects'] as List?)?.length ?? 0;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.groups_rounded,
                                color: AppTheme.primary,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    t['name'] ?? 'Untitled Team',
                                    style: const TextStyle(
                                      color: AppTheme.textMain,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                  Text(
                                    '$membersCount Members • $projectsCount Projects',
                                    style: const TextStyle(
                                      color: AppTheme.textMuted,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            PopupMenuButton<String>(
                              icon: const Icon(
                                Icons.more_horiz,
                                color: AppTheme.textMuted,
                              ),
                              onSelected: (val) {
                                if (val == 'edit') _showTeamDialog(t);
                                if (val == 'delete') _confirmDelete(t);
                              },
                              itemBuilder: (ctx) => [
                                const PopupMenuItem(
                                  value: 'edit',
                                  child: Text('Edit Team'),
                                ),
                                const PopupMenuItem(
                                  value: 'delete',
                                  child: Text(
                                    'Delete Team',
                                    style: TextStyle(color: AppTheme.error),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const Divider(height: 24, color: AppTheme.border),
                        if ((t['projects'] as List?)?.isNotEmpty ?? false) ...[
                          const Text(
                            'Current Projects',
                            style: TextStyle(
                              color: AppTheme.textMuted,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            children: (t['projects'] as List)
                                .map(
                                  (p) => Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 10,
                                      vertical: 4,
                                    ),
                                    decoration: BoxDecoration(
                                      color: AppTheme.bgBody,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(
                                        color: AppTheme.border,
                                      ),
                                    ),
                                    child: Text(
                                      p['title'] ?? '',
                                      style: const TextStyle(
                                        color: AppTheme.textMain,
                                        fontSize: 11,
                                      ),
                                    ),
                                  ),
                                )
                                .toList(),
                          ),
                          const SizedBox(height: 16),
                        ],
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => _showManageMembersDialog(t),
                                icon: const Icon(
                                  Icons.person_add_outlined,
                                  size: 16,
                                ),
                                label: const Text(
                                  'Members',
                                  style: TextStyle(fontSize: 12),
                                ),
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(
                                    color: AppTheme.border,
                                  ),
                                  foregroundColor: AppTheme.textMain,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 12,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () => _showAssignProjectDialog(t),
                                icon: const Icon(
                                  Icons.assignment_outlined,
                                  size: 16,
                                ),
                                label: const Text(
                                  'Assign Project',
                                  style: TextStyle(fontSize: 12),
                                ),
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(
                                    color: AppTheme.border,
                                  ),
                                  foregroundColor: AppTheme.textMain,
                                  padding: const EdgeInsets.symmetric(
                                    vertical: 12,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                ),
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
        onPressed: () => _showTeamDialog(),
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Future<void> _showTeamDialog([Map<String, dynamic>? team]) async {
    final nameController = TextEditingController(text: team?['name']);

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: Text(
          team == null ? 'Create Team' : 'Edit Team',
          style: const TextStyle(color: AppTheme.textMain),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              style: const TextStyle(color: AppTheme.textMain),
              decoration: const InputDecoration(
                labelText: 'Team Name',
                labelStyle: TextStyle(color: AppTheme.textMuted),
                enabledBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: AppTheme.border),
                ),
              ),
            ),
          ],
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
              if (nameController.text.trim().isEmpty) return;
              try {
                if (team == null) {
                  await AdminSupabaseService.createTeam({
                    'name': nameController.text.trim(),
                  });
                } else {
                  await AdminSupabaseService.updateTeam(team['id'], {
                    'name': nameController.text.trim(),
                  });
                }
                if (ctx.mounted) {
                  Navigator.pop(ctx);
                  _load();
                }
              } catch (e) {
                debugPrint('Team error: $e');
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            child: const Text('Save', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Future<void> _showManageMembersDialog(Map<String, dynamic> team) async {
    final teamId = team['id'].toString();
    final currentMembers = List<Map<String, dynamic>>.from(
      team['team_members'] ?? [],
    );

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _MemberManagementSheet(
        teamId: teamId,
        currentMembers: currentMembers,
        onChanged: _load,
      ),
    );
  }

  Future<void> _showAssignProjectDialog(Map<String, dynamic> team) async {
    final teamId = team['id'].toString();
    final projects = await AdminSupabaseService.getAllProjects();
    // Filter out projects already assigned to this team
    final unassignedProjects = projects
        .where((p) => p['assigned_team_id'] == null)
        .toList();

    if (!mounted) return;
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text(
          'Assign Project',
          style: TextStyle(color: AppTheme.textMain),
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: unassignedProjects.isEmpty
              ? const Text(
                  'No unassigned projects available.',
                  style: TextStyle(color: AppTheme.textMuted),
                )
              : ListView.builder(
                  shrinkWrap: true,
                  itemCount: unassignedProjects.length,
                  itemBuilder: (ctx, i) {
                    final p = unassignedProjects[i];
                    return ListTile(
                      title: Text(
                        p['title'] ?? '',
                        style: const TextStyle(color: AppTheme.textMain),
                      ),
                      subtitle: Text(
                        p['status'] ?? '',
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 12,
                        ),
                      ),
                      onTap: () async {
                        await AdminSupabaseService.assignProjectToTeam(
                          p['id'].toString(),
                          teamId,
                        );
                        if (ctx.mounted) Navigator.pop(ctx);
                        _load();
                      },
                    );
                  },
                ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text(
              'Close',
              style: TextStyle(color: AppTheme.textMuted),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(Map<String, dynamic> team) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text(
          'Delete Team',
          style: TextStyle(color: AppTheme.textMain),
        ),
        content: Text(
          'Are you sure you want to delete team "${team['name']}"?',
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
      await AdminSupabaseService.deleteTeam(team['id']);
      _load();
    }
  }
}

class _MemberManagementSheet extends StatefulWidget {
  final String teamId;
  final List<Map<String, dynamic>> currentMembers;
  final VoidCallback onChanged;

  const _MemberManagementSheet({
    required this.teamId,
    required this.currentMembers,
    required this.onChanged,
  });

  @override
  State<_MemberManagementSheet> createState() => _MemberManagementSheetState();
}

class _MemberManagementSheetState extends State<_MemberManagementSheet> {
  List<Map<String, dynamic>> _searchResults = [];
  Future<void> _searchUsers(String query) async {
    if (query.length < 2) {
      setState(() => _searchResults = []);
      return;
    }
    final results = await AdminSupabaseService.getAllInterns(search: query);
    setState(() => _searchResults = results);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppTheme.bgBody,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Manage Team Members',
            style: TextStyle(
              color: AppTheme.textMain,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            'Search to Add',
            style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
          ),
          const SizedBox(height: 8),
          TextField(
            onChanged: _searchUsers,
            style: const TextStyle(color: AppTheme.textMain),
            decoration: InputDecoration(
              hintText: 'Name or email...',
              prefixIcon: const Icon(
                Icons.person_search,
                color: AppTheme.textMuted,
              ),
              filled: true,
              fillColor: AppTheme.bgCard,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          if (_searchResults.isNotEmpty)
            Container(
              height: 150,
              margin: const EdgeInsets.only(top: 8),
              decoration: BoxDecoration(
                color: AppTheme.bgCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.border),
              ),
              child: ListView.builder(
                itemCount: _searchResults.length,
                itemBuilder: (ctx, i) {
                  final user = _searchResults[i];
                  return ListTile(
                    title: Text(
                      user['full_name'] ?? '',
                      style: const TextStyle(
                        color: AppTheme.textMain,
                        fontSize: 13,
                      ),
                    ),
                    subtitle: Text(
                      user['email'] ?? '',
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 11,
                      ),
                    ),
                    trailing: const Icon(Icons.add, color: AppTheme.primary),
                    onTap: () async {
                      await AdminSupabaseService.addMemberToTeam(
                        widget.teamId,
                        user['id'].toString(),
                      );
                      widget.onChanged();
                      setState(() => _searchResults = []);
                      // Refresh local members view if needed, but for now just popping might be easier or just refresh parent.
                    },
                  );
                },
              ),
            ),
          const SizedBox(height: 24),
          const Text(
            'Current Members',
            style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
          ),
          const SizedBox(height: 8),
          ...widget.currentMembers.map((m) {
            final p = m['profiles'];
            return ListTile(
              contentPadding: EdgeInsets.zero,
              leading: CircleAvatar(
                radius: 16,
                child: Text((p?['full_name'] ?? '?')[0]),
              ),
              title: Text(
                p?['full_name'] ?? 'Unknown',
                style: const TextStyle(color: AppTheme.textMain, fontSize: 14),
              ),
              subtitle: Text(
                p?['email'] ?? '',
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
              ),
              trailing: IconButton(
                icon: const Icon(
                  Icons.remove_circle_outline,
                  color: AppTheme.error,
                  size: 20,
                ),
                onPressed: () async {
                  final navigator = Navigator.of(context);
                  await AdminSupabaseService.removeMemberFromTeam(
                    widget.teamId,
                    p?['id'].toString() ?? '',
                  );
                  widget.onChanged();
                  if (mounted) navigator.pop();
                },
              ),
            );
          }),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}
