import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';
import 'package:admin_mobile_app/widgets/target_selector.dart';

class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});
  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  List<Map<String, dynamic>> _announcements = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await AdminSupabaseService.getAllAnnouncements();
    if (mounted) {
      setState(() {
        _announcements = data;
        _loading = false;
      });
    }
  }

  void _showAnnouncementDialog([Map<String, dynamic>? ann]) {
    final titleCtrl = TextEditingController(text: ann?['title']);
    final contentCtrl = TextEditingController(
      text: ann?['content'] ?? ann?['message'],
    );
    bool isPinned = ann?['is_pinned'] ?? false;
    String type = ann?['type'] ?? 'info';
    String targetType = ann?['target_type'] ?? 'all';
    List<String> targetIds = List<String>.from(ann?['target_ids'] ?? []);

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.bgCard,
          title: Text(
            ann == null ? 'New Announcement' : 'Edit Announcement',
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
                  controller: contentCtrl,
                  style: const TextStyle(color: AppTheme.textMain),
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Content',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                    fillColor: AppTheme.bgBody,
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: type,
                  dropdownColor: AppTheme.bgCard,
                  decoration: const InputDecoration(
                    labelText: 'Type',
                    fillColor: AppTheme.bgBody,
                  ),
                  style: const TextStyle(color: AppTheme.textMain),
                  items: const [
                    DropdownMenuItem(value: 'info', child: Text('Info')),
                    DropdownMenuItem(value: 'success', child: Text('Success')),
                    DropdownMenuItem(value: 'warning', child: Text('Warning')),
                    DropdownMenuItem(value: 'alert', child: Text('Alert')),
                  ],
                  onChanged: (val) => setDialogState(() => type = val!),
                ),
                const SizedBox(height: 12),
                SwitchListTile(
                  title: const Text(
                    'Pinned',
                    style: TextStyle(color: AppTheme.textMain),
                  ),
                  value: isPinned,
                  onChanged: (val) => setDialogState(() => isPinned = val),
                  contentPadding: EdgeInsets.zero,
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
                final data = {
                  'title': titleCtrl.text.trim(),
                  'content': contentCtrl.text.trim(),
                  'type': type,
                  'is_pinned': isPinned,
                  'target_type': targetType,
                  'target_ids': targetIds,
                };
                if (ann == null) {
                  await AdminSupabaseService.createAnnouncement(data);
                } else {
                  await AdminSupabaseService.updateAnnouncement(
                    ann['id'].toString(),
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
                ann == null ? 'Create' : 'Save',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAnnouncementDialog(),
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: RefreshIndicator(
        color: AppTheme.primary,
        backgroundColor: AppTheme.bgCard,
        onRefresh: _load,
        child: _loading
            ? const Center(
                child: CircularProgressIndicator(color: AppTheme.primary),
              )
            : _announcements.isEmpty
            ? ListView(
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.campaign_outlined,
                          size: 48,
                          color: AppTheme.textMuted.withValues(alpha: 0.4),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'No announcements',
                          style: TextStyle(color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _announcements.length,
                itemBuilder: (ctx, i) {
                  final a = _announcements[i];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: a['is_pinned'] == true
                            ? AppTheme.primary.withValues(alpha: 0.3)
                            : AppTheme.border,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: _getAnnColor(
                                  a['type'],
                                ).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Icon(
                                _getAnnIcon(a['type']),
                                size: 14,
                                color: _getAnnColor(a['type']),
                              ),
                            ),
                            const SizedBox(width: 8),
                            if (a['is_pinned'] == true)
                              const Icon(
                                Icons.push_pin,
                                size: 12,
                                color: AppTheme.primary,
                              ),
                            if (a['is_pinned'] == true)
                              const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                a['title'] ?? 'Announcement',
                                style: const TextStyle(
                                  color: AppTheme.textMain,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
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
                                  _showAnnouncementDialog(a);
                                } else if (val == 'delete') {
                                  _confirmDelete(a);
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
                        const SizedBox(height: 8),
                        Text(
                          a['content'] ?? a['message'] ?? '',
                          style: const TextStyle(
                            color: AppTheme.textBody,
                            fontSize: 13,
                          ),
                          maxLines: 4,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (a['target_type'] != null &&
                            a['target_type'] != 'all') ...[
                          const SizedBox(height: 8),
                          Text(
                            'Target: ${a['target_type'].toString().toUpperCase()}',
                            style: const TextStyle(
                              color: AppTheme.textMuted,
                              fontSize: 10,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }

  Future<void> _confirmDelete(Map<String, dynamic> ann) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text(
          'Delete Announcement',
          style: TextStyle(color: AppTheme.textMain),
        ),
        content: Text(
          'Are you sure you want to delete this announcement?',
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
      await AdminSupabaseService.deleteAnnouncement(ann['id'].toString());
      _load();
    }
  }

  Color _getAnnColor(String? type) {
    switch (type) {
      case 'success':
        return AppTheme.success;
      case 'warning':
        return AppTheme.warning;
      case 'alert':
        return AppTheme.error;
      default:
        return AppTheme.info;
    }
  }

  IconData _getAnnIcon(String? type) {
    switch (type) {
      case 'success':
        return Icons.check_circle_outline;
      case 'warning':
        return Icons.warning_amber_rounded;
      case 'alert':
        return Icons.error_outline_rounded;
      default:
        return Icons.info_outline_rounded;
    }
  }
}
