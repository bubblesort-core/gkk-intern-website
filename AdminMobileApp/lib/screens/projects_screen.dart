import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});
  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  List<Map<String, dynamic>> _projects = [];
  bool _loading = true;
  bool _showArchived = false;
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

  List<Map<String, dynamic>> get _filteredProjects {
    return _projects.where((p) {
      final isActive = p['is_active'] ?? true;
      return _showArchived ? !isActive : isActive;
    }).toList();
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'completed':
      case 'approved':
        return AppTheme.success;
      case 'assigned':
      case 'in_progress':
        return AppTheme.info;
      case 'under_review':
        return AppTheme.warning;
      case 'rejected':
        return AppTheme.error;
      case 'changes_requested':
        return Colors.orange;
      default:
        return AppTheme.textMuted;
    }
  }

  Color _priorityColor(String priority) {
    switch (priority) {
      case 'urgent':
        return AppTheme.error;
      case 'high':
        return Colors.amber;
      case 'medium':
        return AppTheme.warning;
      default:
        return AppTheme.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredProjects;

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
            : Column(
                children: [
                  // Toggle bar
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Row(
                      children: [
                        Text(
                          '${filtered.length} project${filtered.length != 1 ? 's' : ''}',
                          style: const TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 13,
                          ),
                        ),
                        const Spacer(),
                        ChoiceChip(
                          label: const Text('Active', style: TextStyle(fontSize: 12)),
                          selected: !_showArchived,
                          selectedColor: AppTheme.primary,
                          labelStyle: TextStyle(
                            color: !_showArchived ? Colors.white : AppTheme.textBody,
                          ),
                          onSelected: (_) =>
                              setState(() => _showArchived = false),
                          visualDensity: VisualDensity.compact,
                        ),
                        const SizedBox(width: 6),
                        ChoiceChip(
                          label: const Text('Archived', style: TextStyle(fontSize: 12)),
                          selected: _showArchived,
                          selectedColor: AppTheme.textMuted,
                          labelStyle: TextStyle(
                            color: _showArchived ? Colors.white : AppTheme.textBody,
                          ),
                          onSelected: (_) =>
                              setState(() => _showArchived = true),
                          visualDensity: VisualDensity.compact,
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: filtered.isEmpty
                        ? ListView(
                            children: [
                              SizedBox(
                                height:
                                    MediaQuery.of(context).size.height * 0.3,
                              ),
                              Center(
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.account_tree_outlined,
                                      size: 48,
                                      color: AppTheme.textMuted
                                          .withValues(alpha: 0.4),
                                    ),
                                    const SizedBox(height: 12),
                                    Text(
                                      _showArchived
                                          ? 'No archived projects'
                                          : 'No active projects',
                                      style: const TextStyle(
                                        color: AppTheme.textMuted,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: filtered.length,
                            itemBuilder: (ctx, i) =>
                                _buildProjectCard(filtered[i]),
                          ),
                  ),
                ],
              ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showProjectDialog(),
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildProjectCard(Map<String, dynamic> p) {
    final status = p['status'] ?? 'draft';
    final statusClr = _statusColor(status);
    final teamName = p['teams']?['name'] ?? 'Unassigned';
    final techStack = List<String>.from(p['tech_stack'] ?? []);
    final priority = p['priority'] ?? 'low';
    final deadline = p['deadline'];
    final isActive = p['is_active'] ?? true;

    return GestureDetector(
      onTap: () => _showProjectDetail(p),
      child: Opacity(
        opacity: isActive ? 1.0 : 0.55,
        child: Container(
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
                  // Priority flag
                  if (priority != 'low')
                    Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: Icon(
                        Icons.flag,
                        size: 16,
                        color: _priorityColor(priority),
                      ),
                    ),
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
                      color: statusClr.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      status.replaceAll('_', ' ').toUpperCase(),
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: statusClr,
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
                      } else if (val == 'archive') {
                        _toggleArchive(p);
                      }
                    },
                    itemBuilder: (ctx) => [
                      const PopupMenuItem(value: 'edit', child: Text('Edit')),
                      PopupMenuItem(
                        value: 'archive',
                        child:
                            Text(isActive ? 'Archive' : 'Restore'),
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
              // Tech stack tags
              if (techStack.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Wrap(
                    spacing: 6,
                    runSpacing: 4,
                    children: techStack
                        .map(
                          (t) => Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              t,
                              style: const TextStyle(
                                fontSize: 10,
                                color: AppTheme.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
              Row(
                children: [
                  const Icon(Icons.groups, size: 14, color: AppTheme.textMuted),
                  const SizedBox(width: 4),
                  Text(
                    teamName,
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.textBody,
                    ),
                  ),
                  if (deadline != null) ...[
                    const Spacer(),
                    const Icon(
                      Icons.event,
                      size: 14,
                      color: AppTheme.textMuted,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      deadline.toString(),
                      style: const TextStyle(
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
      ),
    );
  }

  // ── Project Detail View ──
  void _showProjectDetail(Map<String, dynamic> p) {
    final techStack = List<String>.from(p['tech_stack'] ?? []);
    final resourceLinks = List<Map<String, dynamic>>.from(
      p['resource_links'] ?? [],
    );
    final teamName = p['teams']?['name'] ?? 'Unassigned';

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => Container(
        decoration: const BoxDecoration(
          color: AppTheme.bgBody,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: DraggableScrollableSheet(
          initialChildSize: 0.7,
          minChildSize: 0.4,
          maxChildSize: 0.9,
          expand: false,
          builder: (ctx, scroll) => SingleChildScrollView(
            controller: scroll,
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
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
                const SizedBox(height: 20),
                Text(
                  p['title'] ?? 'Project',
                  style: const TextStyle(
                    color: AppTheme.textMain,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                // Status + Priority row
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _statusColor(p['status'] ?? 'draft')
                            .withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        (p['status'] ?? 'draft')
                            .toString()
                            .replaceAll('_', ' ')
                            .toUpperCase(),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: _statusColor(p['status'] ?? 'draft'),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    if ((p['priority'] ?? 'low') != 'low')
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color:
                              _priorityColor(p['priority']).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.flag,
                              size: 12,
                              color: _priorityColor(p['priority']),
                            ),
                            const SizedBox(width: 4),
                            Text(
                              (p['priority'] ?? '').toString().toUpperCase(),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: _priorityColor(p['priority']),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                if (p['description'] != null) ...[
                  const SizedBox(height: 16),
                  const Text(
                    'DESCRIPTION',
                    style: TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    p['description'],
                    style: const TextStyle(
                      color: AppTheme.textBody,
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                // Info chips
                Wrap(
                  spacing: 12,
                  runSpacing: 8,
                  children: [
                    _infoChip(Icons.groups, teamName),
                    if (p['deadline'] != null)
                      _infoChip(Icons.event, 'Due: ${p['deadline']}'),
                    if (p['difficulty'] != null)
                      _infoChip(
                        Icons.speed,
                        '${p['difficulty']}x XP',
                      ),
                  ],
                ),
                // Tech stack
                if (techStack.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Text(
                    'TECH STACK',
                    style: TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: techStack
                        .map(
                          (t) => Chip(
                            label: Text(
                              t,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppTheme.primary,
                              ),
                            ),
                            backgroundColor:
                                AppTheme.primary.withValues(alpha: 0.1),
                            side: BorderSide(
                              color: AppTheme.primary.withValues(alpha: 0.3),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ],
                // Resource Links
                if (resourceLinks.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  const Text(
                    'RESOURCES',
                    style: TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...resourceLinks.map(
                    (link) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: InkWell(
                        onTap: () async {
                          final url = link['url']?.toString() ?? '';
                          if (url.isNotEmpty) {
                            final uri = Uri.parse(url);
                            if (await canLaunchUrl(uri)) {
                              await launchUrl(
                                uri,
                                mode: LaunchMode.externalApplication,
                              );
                            }
                          }
                        },
                        child: Row(
                          children: [
                            const Icon(
                              Icons.link,
                              size: 16,
                              color: AppTheme.primary,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                link['title'] ?? link['url'] ?? 'Link',
                                style: const TextStyle(
                                  color: AppTheme.primary,
                                  fontSize: 13,
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _infoChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppTheme.textMuted),
          const SizedBox(width: 6),
          Text(
            text,
            style: const TextStyle(
              color: AppTheme.textBody,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  // ── Create / Edit Dialog ──
  Future<void> _showProjectDialog([Map<String, dynamic>? project]) async {
    final titleController = TextEditingController(text: project?['title']);
    final descController = TextEditingController(text: project?['description']);
    final techTagController = TextEditingController();
    final resourceLinksController = TextEditingController(
      text: (project?['resource_links'] as List?)
              ?.map((l) => l['url'])
              .join('\n') ??
          '',
    );
    String? selectedTeamId = project?['assigned_team_id'];
    String status = project?['status'] ?? 'draft';
    String priority = project?['priority'] ?? 'low';
    double difficulty =
        double.tryParse(project?['difficulty']?.toString() ?? '1.0') ?? 1.0;
    String? deadline = project?['deadline'];
    List<String> techStack = List<String>.from(project?['tech_stack'] ?? []);

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
              crossAxisAlignment: CrossAxisAlignment.start,
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
                // Team
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
                const SizedBox(height: 12),
                // Status
                DropdownButtonFormField<String>(
                  dropdownColor: AppTheme.bgCard,
                  initialValue: status,
                  items: const [
                    DropdownMenuItem(
                      value: 'draft',
                      child: Text('Draft',
                          style: TextStyle(color: AppTheme.textMain)),
                    ),
                    DropdownMenuItem(
                      value: 'assigned',
                      child: Text('Assigned',
                          style: TextStyle(color: AppTheme.textMain)),
                    ),
                    DropdownMenuItem(
                      value: 'in_progress',
                      child: Text('In Progress',
                          style: TextStyle(color: AppTheme.textMain)),
                    ),
                    DropdownMenuItem(
                      value: 'completed',
                      child: Text('Completed',
                          style: TextStyle(color: AppTheme.textMain)),
                    ),
                  ],
                  onChanged: (val) => setDialogState(() => status = val!),
                  decoration: const InputDecoration(
                    labelText: 'Status',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                  ),
                ),
                const SizedBox(height: 12),
                // Priority
                DropdownButtonFormField<String>(
                  dropdownColor: AppTheme.bgCard,
                  initialValue: priority,
                  items: const [
                    DropdownMenuItem(
                      value: 'low',
                      child: Text('Low',
                          style: TextStyle(color: AppTheme.textMain)),
                    ),
                    DropdownMenuItem(
                      value: 'medium',
                      child: Text('Medium',
                          style: TextStyle(color: AppTheme.textMain)),
                    ),
                    DropdownMenuItem(
                      value: 'high',
                      child: Text('High',
                          style: TextStyle(color: AppTheme.textMain)),
                    ),
                    DropdownMenuItem(
                      value: 'urgent',
                      child: Text('Urgent',
                          style: TextStyle(color: AppTheme.error)),
                    ),
                  ],
                  onChanged: (val) => setDialogState(() => priority = val!),
                  decoration: const InputDecoration(
                    labelText: 'Priority',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                  ),
                ),
                const SizedBox(height: 12),
                // Difficulty
                TextField(
                  controller: TextEditingController(
                    text: difficulty.toString(),
                  ),
                  onChanged: (val) =>
                      difficulty = double.tryParse(val) ?? 1.0,
                  keyboardType: TextInputType.number,
                  style: const TextStyle(color: AppTheme.textMain),
                  decoration: const InputDecoration(
                    labelText: 'Difficulty Multiplier (XP)',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                    hintText: 'e.g. 1.5',
                  ),
                ),
                const SizedBox(height: 12),
                // Deadline (date picker)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    deadline ?? 'No deadline set',
                    style: TextStyle(
                      color: deadline != null
                          ? AppTheme.textMain
                          : AppTheme.textMuted,
                      fontSize: 14,
                    ),
                  ),
                  subtitle: const Text(
                    'Deadline',
                    style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
                  ),
                  trailing: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      IconButton(
                        icon: const Icon(
                          Icons.calendar_today,
                          color: AppTheme.primary,
                          size: 20,
                        ),
                        onPressed: () async {
                          final date = await showDatePicker(
                            context: ctx,
                            initialDate: deadline != null
                                ? DateTime.tryParse(deadline!) ?? DateTime.now()
                                : DateTime.now(),
                            firstDate: DateTime.now(),
                            lastDate:
                                DateTime.now().add(const Duration(days: 730)),
                            builder: (context, child) => Theme(
                              data: Theme.of(context).copyWith(
                                colorScheme: const ColorScheme.dark(
                                  primary: AppTheme.primary,
                                  onPrimary: Colors.white,
                                  surface: AppTheme.bgCard,
                                ),
                              ),
                              child: child!,
                            ),
                          );
                          if (date != null) {
                            setDialogState(() {
                              deadline = DateFormat('yyyy-MM-dd').format(date);
                            });
                          }
                        },
                      ),
                      if (deadline != null)
                        IconButton(
                          icon: const Icon(
                            Icons.clear,
                            color: AppTheme.textMuted,
                            size: 18,
                          ),
                          onPressed: () =>
                              setDialogState(() => deadline = null),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // Tech Stack Tags
                const Text(
                  'Tech Stack',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
                const SizedBox(height: 4),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    ...techStack.map(
                      (tag) => Chip(
                        label: Text(
                          tag,
                          style: const TextStyle(
                            fontSize: 11,
                            color: AppTheme.primary,
                          ),
                        ),
                        backgroundColor:
                            AppTheme.primary.withValues(alpha: 0.1),
                        deleteIcon: const Icon(Icons.close, size: 14),
                        onDeleted: () => setDialogState(
                          () => techStack.remove(tag),
                        ),
                      ),
                    ),
                  ],
                ),
                TextField(
                  controller: techTagController,
                  style: const TextStyle(
                    color: AppTheme.textMain,
                    fontSize: 13,
                  ),
                  decoration: const InputDecoration(
                    hintText: 'Type & press Enter to add tag',
                    hintStyle:
                        TextStyle(color: AppTheme.textMuted, fontSize: 12),
                  ),
                  onSubmitted: (val) {
                    final tag = val.trim();
                    if (tag.isNotEmpty && !techStack.contains(tag)) {
                      setDialogState(() {
                        techStack.add(tag);
                        techTagController.clear();
                      });
                    }
                  },
                ),
                const SizedBox(height: 12),
                // Resource Links
                TextField(
                  controller: resourceLinksController,
                  style: const TextStyle(
                    color: AppTheme.textMain,
                    fontSize: 13,
                  ),
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Resource Links (one URL per line)',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                    hintText:
                        'https://docs.example.com\nhttps://design.figma.com',
                    hintStyle:
                        TextStyle(color: AppTheme.textMuted, fontSize: 11),
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(color: AppTheme.border),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(color: AppTheme.primary),
                    ),
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
                  // Parse resource links
                  final links = resourceLinksController.text
                      .split('\n')
                      .map((l) => l.trim())
                      .where((l) => l.isNotEmpty)
                      .map((l) => {'title': 'Link', 'url': l})
                      .toList();

                  final data = {
                    'title': titleController.text.trim(),
                    'description': descController.text.trim(),
                    'assigned_team_id': selectedTeamId,
                    'status': status,
                    'priority': priority,
                    'difficulty': difficulty,
                    'deadline': deadline,
                    'tech_stack': techStack,
                    'resource_links': links,
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

  Future<void> _toggleArchive(Map<String, dynamic> project) async {
    final isActive = project['is_active'] ?? true;
    try {
      await AdminSupabaseService.updateProject(
        project['id'],
        {'is_active': !isActive},
      );
      _load();
    } catch (e) {
      debugPrint('Archive toggle error: $e');
    }
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
