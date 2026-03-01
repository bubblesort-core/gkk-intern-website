import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';
import 'package:intl/intl.dart';

class ActivityLogsScreen extends StatefulWidget {
  const ActivityLogsScreen({super.key});
  @override
  State<ActivityLogsScreen> createState() => _ActivityLogsScreenState();
}

class _ActivityLogsScreenState extends State<ActivityLogsScreen> {
  List<Map<String, dynamic>> _logs = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await AdminSupabaseService.getActivityLogs();
    if (mounted) {
      setState(() {
        _logs = data;
        _loading = false;
      });
    }
  }

  IconData _iconForAction(String action) {
    if (action.contains('login')) return Icons.login;
    if (action.contains('create')) return Icons.add_circle_outline;
    if (action.contains('delete')) return Icons.delete_outline;
    if (action.contains('update') || action.contains('edit')) return Icons.edit;
    if (action.contains('approve')) return Icons.check_circle_outline;
    if (action.contains('reject')) return Icons.cancel_outlined;
    return Icons.history;
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      color: AppTheme.primary,
      backgroundColor: AppTheme.bgCard,
      onRefresh: _load,
      child: _loading
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            )
          : _logs.isEmpty
          ? ListView(
              children: [
                SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.history,
                        size: 48,
                        color: AppTheme.textMuted.withValues(alpha: 0.4),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'No activity logs',
                        style: TextStyle(color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
              ],
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _logs.length,
              itemBuilder: (ctx, i) {
                final log = _logs[i];
                final action = log['action'] ?? '';
                final createdAt = log['created_at'] != null
                    ? DateFormat(
                        'd MMM, h:mm a',
                      ).format(DateTime.parse(log['created_at']))
                    : '';
                return Container(
                  margin: const EdgeInsets.only(bottom: 6),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.bgCard,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        _iconForAction(action.toLowerCase()),
                        size: 18,
                        color: AppTheme.primary,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              action,
                              style: const TextStyle(
                                color: AppTheme.textMain,
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            if (log['details'] != null)
                              Text(
                                log['details'].toString(),
                                style: const TextStyle(
                                  color: AppTheme.textMuted,
                                  fontSize: 11,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                          ],
                        ),
                      ),
                      Text(
                        createdAt,
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 10,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
