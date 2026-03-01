import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';
import 'package:admin_mobile_app/widgets/target_selector.dart';

class MeetingsScreen extends StatefulWidget {
  const MeetingsScreen({super.key});
  @override
  State<MeetingsScreen> createState() => _MeetingsScreenState();
}

class _MeetingsScreenState extends State<MeetingsScreen> {
  List<Map<String, dynamic>> _sessions = [];
  bool _loading = true;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await AdminSupabaseService.getAllSessions();
    if (mounted) {
      setState(() {
        _sessions = data;
        _loading = false;
      });
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
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
            : Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: TextField(
                      controller: _searchController,
                      onChanged: (val) => setState(() => _searchQuery = val),
                      style: const TextStyle(color: AppTheme.textMain),
                      decoration: InputDecoration(
                        hintText: 'Search sessions...',
                        hintStyle: const TextStyle(color: AppTheme.textMuted),
                        prefixIcon: const Icon(
                          Icons.search,
                          color: AppTheme.textMuted,
                        ),
                        suffixIcon: _searchQuery.isNotEmpty
                            ? IconButton(
                                icon: const Icon(
                                  Icons.clear,
                                  color: AppTheme.textMuted,
                                ),
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() => _searchQuery = '');
                                },
                              )
                            : null,
                        filled: true,
                        fillColor: AppTheme.bgCard,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: AppTheme.border),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(color: AppTheme.border),
                        ),
                      ),
                    ),
                  ),
                  Expanded(child: _buildSessionsList()),
                ],
              ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showSessionDialog(),
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildSessionsList() {
    final filtered = _sessions.where((m) {
      final title = (m['title'] ?? '').toString().toLowerCase();
      return title.contains(_searchQuery.toLowerCase());
    }).toList();

    if (filtered.isEmpty) {
      return ListView(
        children: [
          SizedBox(height: MediaQuery.of(context).size.height * 0.2),
          Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.videocam_outlined,
                  size: 48,
                  color: AppTheme.textMuted.withValues(alpha: 0.4),
                ),
                const SizedBox(height: 12),
                Text(
                  _searchQuery.isEmpty ? 'No sessions yet' : 'No results found',
                  style: const TextStyle(color: AppTheme.textMuted),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filtered.length,
      itemBuilder: (ctx, i) {
        final m = filtered[i];
        final isLive = m['status'] == 'live';
        final isScheduled = m['status'] == 'scheduled';
        final targetType = m['target_type'] ?? 'all';
        final targetIds = List.from(m['target_ids'] ?? []);

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppTheme.bgCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isLive
                  ? AppTheme.success.withValues(alpha: 0.3)
                  : isScheduled
                  ? AppTheme.warning.withValues(alpha: 0.3)
                  : AppTheme.border,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color:
                      (isLive
                              ? AppTheme.success
                              : isScheduled
                              ? AppTheme.warning
                              : AppTheme.textMuted)
                          .withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  Icons.videocam,
                  color: isLive
                      ? AppTheme.success
                      : isScheduled
                      ? AppTheme.warning
                      : AppTheme.textMuted,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      m['title'] ?? 'Meeting',
                      style: const TextStyle(
                        color: AppTheme.textMain,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    Row(
                      children: [
                        Text(
                          m['platform'] == 'youtube'
                              ? 'YouTube'
                              : 'Google Meet',
                          style: const TextStyle(
                            color: AppTheme.textMuted,
                            fontSize: 11,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: AppTheme.info.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            targetType == 'all'
                                ? 'All'
                                : '${targetType.toUpperCase()} (${targetIds.length})',
                            style: const TextStyle(
                              color: AppTheme.info,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (isLive)
                TextButton(
                  onPressed: () => _endSession(m),
                  child: const Text(
                    'END',
                    style: TextStyle(
                      color: AppTheme.error,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                )
              else
                Text(
                  isScheduled ? 'Scheduled' : (m['status'] ?? 'Ended'),
                  style: TextStyle(
                    fontSize: 11,
                    color: isScheduled ? AppTheme.warning : AppTheme.textMuted,
                  ),
                ),
              PopupMenuButton<String>(
                icon: const Icon(
                  Icons.more_vert,
                  size: 18,
                  color: AppTheme.textMuted,
                ),
                onSelected: (val) {
                  if (val == 'edit') {
                    _showSessionDialog(m);
                  } else if (val == 'delete') {
                    _confirmDelete(m);
                  }
                },
                itemBuilder: (ctx) => [
                  const PopupMenuItem(value: 'edit', child: Text('Edit')),
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
        );
      },
    );
  }

  void _showSessionDialog([Map<String, dynamic>? m]) {
    final titleCtrl = TextEditingController(text: m?['title']);
    final linkCtrl = TextEditingController(
      text: m?['video_url'] ?? m?['join_url'],
    );
    String platform = m?['platform'] ?? 'google_meet';
    String targetType = m?['target_type'] ?? 'all';
    List<String> targetIds = List<String>.from(m?['target_ids'] ?? []);
    DateTime? scheduledStart = m?['scheduled_start'] != null
        ? DateTime.parse(m!['scheduled_start'])
        : null;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.bgCard,
          title: Text(
            m == null ? 'Schedule Session' : 'Edit Session',
            style: const TextStyle(color: AppTheme.textMain),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleCtrl,
                  style: const TextStyle(color: AppTheme.textMain),
                  decoration: const InputDecoration(
                    labelText: 'Title',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                    fillColor: AppTheme.bgBody,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: linkCtrl,
                  style: const TextStyle(color: AppTheme.textMain),
                  decoration: const InputDecoration(
                    labelText: 'Meeting Link',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                    fillColor: AppTheme.bgBody,
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: platform,
                  dropdownColor: AppTheme.bgCard,
                  decoration: const InputDecoration(
                    labelText: 'Platform',
                    fillColor: AppTheme.bgBody,
                  ),
                  style: const TextStyle(color: AppTheme.textMain),
                  items: const [
                    DropdownMenuItem(
                      value: 'google_meet',
                      child: Text('Google Meet'),
                    ),
                    DropdownMenuItem(
                      value: 'youtube',
                      child: Text('YouTube Live'),
                    ),
                  ],
                  onChanged: (val) => setDialogState(() => platform = val!),
                ),
                const SizedBox(height: 12),
                ListTile(
                  title: Text(
                    scheduledStart == null
                        ? 'Instant (Now)'
                        : 'Scheduled: ${scheduledStart!.toString().substring(0, 16)}',
                    style: TextStyle(
                      color: scheduledStart == null
                          ? AppTheme.success
                          : AppTheme.textMain,
                      fontSize: 13,
                    ),
                  ),
                  subtitle: const Text(
                    'Tap to change date',
                    style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                  ),
                  onTap: () async {
                    final d = await showDatePicker(
                      context: ctx,
                      initialDate: scheduledStart ?? DateTime.now(),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (d != null) {
                      if (!ctx.mounted) return;
                      final t = await showTimePicker(
                        context: ctx,
                        initialTime: TimeOfDay.fromDateTime(
                          scheduledStart ?? DateTime.now(),
                        ),
                      );
                      if (t != null) {
                        setDialogState(() {
                          scheduledStart = DateTime(
                            d.year,
                            d.month,
                            d.day,
                            t.hour,
                            t.minute,
                          );
                        });
                      }
                    } else {
                      setDialogState(() => scheduledStart = null);
                    }
                  },
                  trailing: scheduledStart != null
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: AppTheme.error),
                          onPressed: () =>
                              setDialogState(() => scheduledStart = null),
                        )
                      : null,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: const BorderSide(color: AppTheme.border),
                  ),
                ),
                const Divider(height: 32),
                TargetSelector(
                  initialType: targetType,
                  initialIds: targetIds,
                  onChanged: (t, ids) {
                    targetType = t;
                    targetIds = ids;
                  },
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
                final link = linkCtrl.text.trim();
                final data = {
                  'title': titleCtrl.text.trim(),
                  'platform': platform,
                  'status': scheduledStart == null ? 'live' : 'scheduled',
                  'target_type': targetType,
                  'target_ids': targetIds,
                  'scheduled_start':
                      scheduledStart?.toIso8601String() ??
                      DateTime.now().toIso8601String(),
                };

                // Set video/join URL based on platform
                if (platform == 'youtube') {
                  data['video_url'] = link;
                } else if (platform == 'google_meet') {
                  data['join_url'] = link;
                }

                if (scheduledStart == null) {
                  data['actual_start'] = DateTime.now().toIso8601String();
                }

                if (m == null) {
                  await AdminSupabaseService.createSession(data);
                } else {
                  await AdminSupabaseService.updateSession(
                    m['id'].toString(),
                    data,
                  );
                }
                if (ctx.mounted) Navigator.pop(ctx);
                _load();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
              ),
              child: Text(
                m == null ? 'Create' : 'Save',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _endSession(Map<String, dynamic> m) async {
    await AdminSupabaseService.endSession(m['id'].toString());
    _load();
  }

  Future<void> _confirmDelete(Map<String, dynamic> m) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text(
          'Delete Session',
          style: TextStyle(color: AppTheme.textMain),
        ),
        content: Text(
          'Are you sure you want to delete "${m['title']}"?',
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
      await AdminSupabaseService.deleteSession(m['id'].toString());
      _load();
    }
  }
}
