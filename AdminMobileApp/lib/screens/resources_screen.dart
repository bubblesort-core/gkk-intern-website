import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';
import 'package:admin_mobile_app/widgets/target_selector.dart';

class ResourcesScreen extends StatefulWidget {
  const ResourcesScreen({super.key});
  @override
  State<ResourcesScreen> createState() => _ResourcesScreenState();
}

class _ResourcesScreenState extends State<ResourcesScreen> {
  List<Map<String, dynamic>> _resources = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await AdminSupabaseService.getAllResources();
    if (mounted) {
      setState(() {
        _resources = data;
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
            : _resources.isEmpty
            ? ListView(
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.menu_book_outlined,
                          size: 48,
                          color: AppTheme.textMuted.withValues(alpha: 0.4),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'No resources yet',
                          style: TextStyle(color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _resources.length,
                itemBuilder: (ctx, i) {
                  final r = _resources[i];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: AppTheme.info.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            _getIconForType(r['type']),
                            color: AppTheme.info,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                r['title'] ?? 'Resource',
                                style: const TextStyle(
                                  color: AppTheme.textMain,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              Row(
                                children: [
                                  Text(
                                    r['category'] ?? r['type'] ?? '',
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
                                      color: AppTheme.info.withValues(
                                        alpha: 0.1,
                                      ),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      (r['target_type'] ?? 'all') == 'all'
                                          ? 'All'
                                          : '${(r['target_type'] ?? '').toUpperCase()} (${(r['target_ids'] as List?)?.length ?? 0})',
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
                        IconButton(
                          icon: const Icon(
                            Icons.open_in_new,
                            size: 18,
                            color: AppTheme.primary,
                          ),
                          onPressed: () {
                            // Add URL launcher logic if needed
                          },
                        ),
                        PopupMenuButton<String>(
                          icon: const Icon(
                            Icons.more_vert,
                            size: 18,
                            color: AppTheme.textMuted,
                          ),
                          onSelected: (val) {
                            if (val == 'edit') {
                              _showResourceDialog(r);
                            } else if (val == 'delete') {
                              _confirmDelete(r);
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
                  );
                },
              ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showResourceDialog(),
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  void _showResourceDialog([Map<String, dynamic>? res]) {
    final titleCtrl = TextEditingController(text: res?['title']);
    final urlCtrl = TextEditingController(text: res?['url']);
    final categoryCtrl = TextEditingController(text: res?['category']);
    final descriptionCtrl = TextEditingController(text: res?['description']);
    String type = res?['type'] ?? 'link';
    String targetType = res?['target_type'] ?? 'all';
    List<String> targetIds = List<String>.from(res?['target_ids'] ?? []);

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.bgCard,
          title: Text(
            res == null ? 'Add Resource' : 'Edit Resource',
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
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: type,
                  dropdownColor: AppTheme.bgCard,
                  decoration: const InputDecoration(labelText: 'Type'),
                  style: const TextStyle(color: AppTheme.textMain),
                  items: const [
                    DropdownMenuItem(
                      value: 'link',
                      child: Text('External Link'),
                    ),
                    DropdownMenuItem(value: 'pdf', child: Text('PDF Document')),
                    DropdownMenuItem(
                      value: 'doc',
                      child: Text('Word/Text Doc'),
                    ),
                    DropdownMenuItem(value: 'video', child: Text('Video Link')),
                  ],
                  onChanged: (val) => setDialogState(() => type = val!),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: urlCtrl,
                  style: const TextStyle(color: AppTheme.textMain),
                  decoration: const InputDecoration(
                    labelText: 'URL',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: categoryCtrl,
                  style: const TextStyle(color: AppTheme.textMain),
                  decoration: const InputDecoration(
                    labelText: 'Category',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descriptionCtrl,
                  style: const TextStyle(color: AppTheme.textMain),
                  maxLines: 2,
                  decoration: const InputDecoration(
                    labelText: 'Description (Optional)',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
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
                final data = {
                  'title': titleCtrl.text.trim(),
                  'url': urlCtrl.text.trim(),
                  'category': categoryCtrl.text.trim(),
                  'description': descriptionCtrl.text.trim(),
                  'type': type,
                  'target_type': targetType,
                  'target_ids': targetIds,
                };
                if (res == null) {
                  await AdminSupabaseService.createResource(data);
                } else {
                  await AdminSupabaseService.updateResource(
                    res['id'].toString(),
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
                res == null ? 'Add' : 'Save',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getIconForType(String? type) {
    switch (type) {
      case 'pdf':
        return Icons.picture_as_pdf;
      case 'doc':
        return Icons.description;
      case 'video':
        return Icons.video_library;
      case 'link':
        return Icons.link;
      default:
        return Icons.menu_book;
    }
  }

  Future<void> _confirmDelete(Map<String, dynamic> res) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text(
          'Delete Resource',
          style: TextStyle(color: AppTheme.textMain),
        ),
        content: Text(
          'Are you sure you want to delete "${res['title']}"?',
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
      await AdminSupabaseService.deleteResource(res['id'].toString());
      _load();
    }
  }
}
