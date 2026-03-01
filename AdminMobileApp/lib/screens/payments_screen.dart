import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';
import 'package:intl/intl.dart';

class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({super.key});
  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  List<Map<String, dynamic>> _payments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await AdminSupabaseService.getPayments();
    if (mounted) {
      setState(() {
        _payments = data;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // Note: status 'completed' and 'captured' are treated as paid
    final paidCount = _payments
        .where((p) => ['completed', 'captured'].contains(p['status']))
        .length;
    final totalRevenue = _payments
        .where((p) => ['completed', 'captured'].contains(p['status']))
        .fold<double>(
          0,
          (sum, p) =>
              sum + (double.tryParse(p['amount']?.toString() ?? '0') ?? 0),
        );

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
            : ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Stats
                  Row(
                    children: [
                      _statCard(
                        'Paid Count',
                        paidCount.toString(),
                        AppTheme.success,
                      ),
                      const SizedBox(width: 12),
                      _statCard(
                        'Revenue',
                        '₹${totalRevenue.round()}',
                        AppTheme.primary,
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (_payments.isEmpty)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.only(top: 40),
                        child: Text(
                          'No payments found',
                          style: TextStyle(color: AppTheme.textMuted),
                        ),
                      ),
                    ),
                  // List
                  ..._payments.map((p) {
                    final status = p['status'] ?? 'pending';
                    final isPaid = ['completed', 'captured'].contains(status);
                    final date = p['created_at'] != null
                        ? DateFormat(
                            'd MMM yyyy, HH:mm',
                          ).format(DateTime.parse(p['created_at']))
                        : 'Unknown Date';
                    final amount = p['amount']?.toString() ?? '0';
                    final fullName = p['profiles']?['full_name'] ?? 'Unknown';

                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppTheme.bgCard,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: AppTheme.primary.withValues(
                              alpha: 0.15,
                            ),
                            child: const Icon(
                              Icons.currency_rupee,
                              size: 16,
                              color: AppTheme.primary,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  fullName,
                                  style: const TextStyle(
                                    color: AppTheme.textMain,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                ),
                                Text(
                                  '₹$amount • $date',
                                  style: const TextStyle(
                                    color: AppTheme.textMuted,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 3,
                                ),
                                decoration: BoxDecoration(
                                  color:
                                      (isPaid
                                              ? AppTheme.success
                                              : AppTheme.warning)
                                          .withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  status.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: isPaid
                                        ? AppTheme.success
                                        : AppTheme.warning,
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
                                  if (val == 'delete') {
                                    _confirmDelete(p);
                                  }
                                },
                                itemBuilder: (ctx) => [
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
                  }),
                ],
              ),
      ),
    );
  }

  Future<void> _confirmDelete(Map<String, dynamic> payment) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text(
          'Delete Payment Record',
          style: TextStyle(color: AppTheme.textMain),
        ),
        content: const Text(
          'Are you sure you want to delete this payment record? This will not refund the user.',
          style: TextStyle(color: AppTheme.textBody),
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
      await AdminSupabaseService.deletePayment(payment['id'].toString());
      _load();
    }
  }

  Widget _statCard(String label, String value, Color color) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
          ),
        ],
      ),
    ),
  );
}
