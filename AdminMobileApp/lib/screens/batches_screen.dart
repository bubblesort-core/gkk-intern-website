import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';

class BatchesScreen extends StatefulWidget {
  const BatchesScreen({super.key});
  @override
  State<BatchesScreen> createState() => _BatchesScreenState();
}

class _BatchesScreenState extends State<BatchesScreen> {
  List<Map<String, dynamic>> _batches = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await AdminSupabaseService.getAllBatches();
    if (mounted) {
      setState(() {
        _batches = data;
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
            : _batches.isEmpty
            ? ListView(
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.layers_outlined,
                          size: 48,
                          color: AppTheme.textMuted.withValues(alpha: 0.4),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'No batches found',
                          style: TextStyle(color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _batches.length,
                itemBuilder: (ctx, i) {
                  final b = _batches[i];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(16),
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
                            color: AppTheme.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.layers,
                            color: AppTheme.primary,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                b['name'] ?? 'Batch',
                                style: const TextStyle(
                                  color: AppTheme.textMain,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              Text(
                                b['is_active'] == true ? 'Active' : 'Inactive',
                                style: TextStyle(
                                  color: b['is_active'] == true
                                      ? AppTheme.success
                                      : AppTheme.textMuted,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        PopupMenuButton<String>(
                          icon: const Icon(
                            Icons.more_vert,
                            color: AppTheme.textMuted,
                          ),
                          onSelected: (val) {
                            if (val == 'edit') {
                              _showBatchDialog(b);
                            } else if (val == 'delete') {
                              _confirmDelete(b);
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
        onPressed: () => _showBatchDialog(),
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Future<void> _showBatchDialog([Map<String, dynamic>? batch]) async {
    final nameController = TextEditingController(text: batch?['name']);
    bool isActive = batch?['is_active'] ?? true;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.bgCard,
          title: Text(
            batch == null ? 'Create Batch' : 'Edit Batch',
            style: const TextStyle(color: AppTheme.textMain),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                style: const TextStyle(color: AppTheme.textMain),
                decoration: const InputDecoration(
                  labelText: 'Batch Name',
                  labelStyle: TextStyle(color: AppTheme.textMuted),
                  enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: AppTheme.border),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SwitchListTile(
                title: const Text(
                  'Active',
                  style: TextStyle(color: AppTheme.textMain),
                ),
                value: isActive,
                onChanged: (val) => setDialogState(() => isActive = val),
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
                  if (batch == null) {
                    await AdminSupabaseService.createBatch({
                      'name': nameController.text.trim(),
                      'is_active': isActive,
                    });
                  } else {
                    await AdminSupabaseService.updateBatch(batch['id'], {
                      'name': nameController.text.trim(),
                      'is_active': isActive,
                    });
                  }
                  if (ctx.mounted) {
                    Navigator.pop(ctx);
                    _load();
                  }
                } catch (e) {
                  debugPrint('Batch error: $e');
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

  Future<void> _confirmDelete(Map<String, dynamic> batch) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text(
          'Delete Batch',
          style: TextStyle(color: AppTheme.textMain),
        ),
        content: Text(
          'Are you sure you want to delete batch "${batch['name']}"?',
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
      await AdminSupabaseService.deleteBatch(batch['id']);
      _load();
    }
  }
}
