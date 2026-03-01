import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';
import 'package:admin_mobile_app/widgets/target_selector.dart';

class RewardsScreen extends StatefulWidget {
  const RewardsScreen({super.key});
  @override
  State<RewardsScreen> createState() => _RewardsScreenState();
}

class _RewardsScreenState extends State<RewardsScreen> {
  List<Map<String, dynamic>> _rewards = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await AdminSupabaseService.getAllRewards();
    if (mounted) {
      setState(() {
        _rewards = data;
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
            : _rewards.isEmpty
            ? ListView(
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.card_giftcard_outlined,
                          size: 48,
                          color: AppTheme.textMuted.withValues(alpha: 0.4),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'No rewards yet',
                          style: TextStyle(color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _rewards.length,
                itemBuilder: (ctx, i) {
                  final r = _rewards[i];
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
                            color: AppTheme.accent.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(
                            Icons.card_giftcard,
                            color: AppTheme.accent,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                r['title'] ?? 'Reward',
                                style: const TextStyle(
                                  color: AppTheme.textMain,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              Row(
                                children: [
                                  Text(
                                    r['profiles']?['full_name'] ?? 'XP Reward',
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
                                      (r['target_type'] ?? 'intern') == 'intern'
                                          ? 'Direct'
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
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '+${r['xp'] ?? 0} XP',
                              style: const TextStyle(
                                color: AppTheme.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
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
                                  _showRewardDialog(r);
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
                      ],
                    ),
                  );
                },
              ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showRewardDialog(),
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  void _showRewardDialog([Map<String, dynamic>? reward]) {
    final titleCtrl = TextEditingController(text: reward?['title']);
    final xpCtrl = TextEditingController(text: reward?['xp']?.toString());
    String targetType = reward?['target_type'] ?? 'intern';
    List<String> targetIds = List<String>.from(
      reward?['target_ids'] ??
          (reward?['user_id'] != null ? [reward!['user_id']] : []),
    );

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.bgCard,
          title: Text(
            reward == null ? 'Record Reward' : 'Edit Reward',
            style: const TextStyle(color: AppTheme.textMain),
          ),
          content: Column(
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
              TextField(
                controller: xpCtrl,
                style: const TextStyle(color: AppTheme.textMain),
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'XP Amount',
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
                  'xp': int.tryParse(xpCtrl.text) ?? 0,
                  'user_id': targetType == 'intern' && targetIds.isNotEmpty
                      ? targetIds.first
                      : null,
                  'target_type': targetType,
                  'target_ids': targetIds,
                };
                if (reward == null) {
                  await AdminSupabaseService.createReward(data);
                } else {
                  await AdminSupabaseService.updateReward(
                    reward['id'].toString(),
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
                reward == null ? 'Record' : 'Save',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _confirmDelete(Map<String, dynamic> reward) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text(
          'Delete Reward',
          style: TextStyle(color: AppTheme.textMain),
        ),
        content: Text(
          'Are you sure you want to delete this reward for "${reward['profiles']?['full_name'] ?? 'user'}"?',
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
      await AdminSupabaseService.deleteReward(reward['id'].toString());
      _load();
    }
  }
}
