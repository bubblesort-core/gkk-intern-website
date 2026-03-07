import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';
import 'package:intl/intl.dart';

class InvitationsScreen extends StatefulWidget {
  const InvitationsScreen({super.key});
  @override
  State<InvitationsScreen> createState() => _InvitationsScreenState();
}

class _InvitationsScreenState extends State<InvitationsScreen> {
  final _emailController = TextEditingController();
  bool _sending = false;

  List<Map<String, dynamic>> _invitations = [];
  List<Map<String, dynamic>> _teams = [];
  bool _loading = true;
  String? _selectedTeamId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final results = await Future.wait([
      AdminSupabaseService.getAllInvitations(),
      AdminSupabaseService.getAllTeams(),
    ]);
    if (mounted) {
      setState(() {
        _invitations = results[0];
        _teams = results[1];
        _loading = false;
      });
    }
  }

  Future<void> _sendInvitation() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) return;
    setState(() => _sending = true);
    try {
      await AdminSupabaseService.createInvitation(
        email: email,
        teamId: _selectedTeamId,
      );
      if (mounted) {
        _emailController.clear();
        setState(() => _selectedTeamId = null);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Invitation sent to $email'),
            backgroundColor: AppTheme.success,
          ),
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppTheme.error),
        );
      }
    }
    if (mounted) setState(() => _sending = false);
  }

  Future<void> _revokeInvitation(Map<String, dynamic> inv) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text(
          'Revoke Invitation',
          style: TextStyle(color: AppTheme.textMain),
        ),
        content: Text(
          'Revoke invitation for ${inv['email']}?',
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
              'Revoke',
              style: TextStyle(color: AppTheme.error),
            ),
          ),
        ],
      ),
    );
    if (ok == true) {
      await AdminSupabaseService.revokeInvitation(inv['id'].toString());
      _load();
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'accepted':
        return AppTheme.success;
      case 'expired':
        return AppTheme.error;
      default:
        return AppTheme.warning;
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
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Send Invitation Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppTheme.bgCard,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Send Invitation',
                    style: TextStyle(
                      color: AppTheme.textMain,
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _emailController,
                    style: const TextStyle(
                      color: AppTheme.textMain,
                    ),
                    decoration: const InputDecoration(
                      hintText: 'Email address',
                      prefixIcon: Icon(
                        Icons.email_outlined,
                        color: AppTheme.textMuted,
                        size: 20,
                      ),
                      fillColor: AppTheme.bgBody,
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Team picker
                  DropdownButtonFormField<String>(
                    initialValue: _selectedTeamId,
                    dropdownColor: AppTheme.bgCard,
                    style: const TextStyle(color: AppTheme.textMain),
                    decoration: const InputDecoration(
                      labelText: 'Assign Team (optional)',
                      labelStyle: TextStyle(color: AppTheme.textMuted),
                      fillColor: AppTheme.bgBody,
                      prefixIcon: Icon(
                        Icons.groups_outlined,
                        color: AppTheme.textMuted,
                        size: 20,
                      ),
                    ),
                    items: [
                      const DropdownMenuItem(
                        value: null,
                        child: Text(
                          '-- No Team --',
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
                        setState(() => _selectedTeamId = val),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _sending ? null : _sendInvitation,
                      icon: _sending
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: Colors.white,
                              ),
                            )
                          : const Icon(
                              Icons.send,
                              color: Colors.white,
                              size: 18,
                            ),
                      label: Text(
                        _sending ? 'Sending...' : 'Send Invitation',
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Invitations List Header
            Row(
              children: [
                const Text(
                  'Sent Invitations',
                  style: TextStyle(
                    color: AppTheme.textMain,
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                const Spacer(),
                if (!_loading)
                  Text(
                    '${_invitations.length} total',
                    style: const TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // Invitations List
            if (_loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(color: AppTheme.primary),
                ),
              )
            else if (_invitations.isEmpty)
              Container(
                padding: const EdgeInsets.all(40),
                decoration: BoxDecoration(
                  color: AppTheme.bgCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Center(
                  child: Column(
                    children: [
                      Icon(
                        Icons.mail_outline,
                        size: 48,
                        color: AppTheme.textMuted.withValues(alpha: 0.4),
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'No invitations sent yet',
                        style: TextStyle(color: AppTheme.textMuted),
                      ),
                    ],
                  ),
                ),
              )
            else
              ...List.generate(_invitations.length, (i) {
                final inv = _invitations[i];
                final status = inv['status'] ?? 'sent';
                final teamName = inv['teams']?['name'];
                final createdAt = inv['created_at'] != null
                    ? DateFormat('d MMM yyyy').format(
                        DateTime.parse(inv['created_at']),
                      )
                    : '';

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
                      // Avatar
                      CircleAvatar(
                        radius: 20,
                        backgroundColor:
                            AppTheme.primary.withValues(alpha: 0.15),
                        child: Text(
                          (inv['email'] ?? '?')[0].toUpperCase(),
                          style: const TextStyle(
                            color: AppTheme.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Details
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              inv['email'] ?? '',
                              style: const TextStyle(
                                color: AppTheme.textMain,
                                fontWeight: FontWeight.w500,
                                fontSize: 14,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${teamName != null ? 'Team: $teamName • ' : ''}$createdAt',
                              style: const TextStyle(
                                color: AppTheme.textMuted,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Status badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: _statusColor(status).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          status.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            color: _statusColor(status),
                          ),
                        ),
                      ),
                      // Revoke button (only for 'sent' status)
                      if (status == 'sent')
                        IconButton(
                          icon: const Icon(
                            Icons.delete_outline,
                            color: AppTheme.error,
                            size: 20,
                          ),
                          onPressed: () => _revokeInvitation(inv),
                          tooltip: 'Revoke',
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
}
