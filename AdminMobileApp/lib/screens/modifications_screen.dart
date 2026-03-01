import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';

class ModificationsScreen extends StatefulWidget {
  const ModificationsScreen({super.key});
  @override
  State<ModificationsScreen> createState() => _ModificationsScreenState();
}

class _ModificationsScreenState extends State<ModificationsScreen> {
  List<Map<String, dynamic>> _locks = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await AdminSupabaseService.getAccessLocks();
    if (mounted) {
      setState(() {
        _locks = data;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateLockDialog,
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.lock_person, color: Colors.white),
      ),
      body: RefreshIndicator(
        color: AppTheme.primary,
        backgroundColor: AppTheme.bgCard,
        onRefresh: _load,
        child: _loading
            ? const Center(
                child: CircularProgressIndicator(color: AppTheme.primary),
              )
            : _locks.isEmpty
            ? ListView(
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.security_outlined,
                          size: 48,
                          color: AppTheme.textMuted.withValues(alpha: 0.4),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'No active access locks',
                          style: TextStyle(color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _locks.length,
                itemBuilder: (ctx, i) {
                  final lock = _locks[i];
                  final profile = lock['profiles'];
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
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                profile?['full_name'] ?? 'System Wide',
                                style: const TextStyle(
                                  color: AppTheme.textMain,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              Text(
                                'Page: ${lock['page_identifier'] ?? 'All'}',
                                style: const TextStyle(
                                  color: AppTheme.primary,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              if (lock['reason'] != null)
                                Text(
                                  'Reason: ${lock['reason']}',
                                  style: const TextStyle(
                                    color: AppTheme.textMuted,
                                    fontSize: 11,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(
                            Icons.lock_open,
                            color: AppTheme.success,
                            size: 20,
                          ),
                          onPressed: () => _unlock(lock['id'].toString()),
                          tooltip: 'Unlock Access',
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }

  Future<void> _unlock(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text(
          'Confirm Unlock',
          style: TextStyle(color: AppTheme.textMain),
        ),
        content: const Text(
          'Are you sure you want to remove this access lock?',
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
              'Unlock',
              style: TextStyle(color: AppTheme.success),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await AdminSupabaseService.deleteAccessLock(id);
      _load();
    }
  }

  void _showCreateLockDialog() async {
    final result = await showDialog<Map<String, String>>(
      context: context,
      builder: (ctx) => const _CreateLockDialog(),
    );

    if (result != null) {
      await AdminSupabaseService.createAccessLock(
        userId: result['userId']!,
        pageIdentifier: result['page']!,
        reason: result['reason']!,
      );
      _load();
    }
  }
}

class _CreateLockDialog extends StatefulWidget {
  const _CreateLockDialog();
  @override
  State<_CreateLockDialog> createState() => _CreateLockDialogState();
}

class _CreateLockDialogState extends State<_CreateLockDialog> {
  final _reasonController = TextEditingController();
  String _selectedPage = 'all';
  Map<String, dynamic>? _selectedUser;
  List<Map<String, dynamic>> _searchResults = [];

  final List<String> _pages = [
    'all',
    'dashboard',
    'profile',
    'projects',
    'teams',
    'submissions',
    'attendance',
  ];

  Future<void> _searchUsers(String query) async {
    if (query.length < 2) {
      setState(() => _searchResults = []);
      return;
    }
    final results = await AdminSupabaseService.getAllInterns(search: query);
    setState(() {
      _searchResults = results;
    });
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppTheme.bgCard,
      title: const Text(
        'Apply Access Lock',
        style: TextStyle(color: AppTheme.textMain),
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Search User',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
            ),
            const SizedBox(height: 8),
            if (_selectedUser != null)
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: AppTheme.primary.withValues(alpha: 0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${_selectedUser!['full_name']}\n${_selectedUser!['email']}',
                        style: const TextStyle(
                          color: AppTheme.textMain,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.close,
                        size: 18,
                        color: AppTheme.error,
                      ),
                      onPressed: () => setState(() => _selectedUser = null),
                    ),
                  ],
                ),
              )
            else
              TextField(
                onChanged: _searchUsers,
                style: const TextStyle(color: AppTheme.textMain, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Type name or email...',
                  hintStyle: TextStyle(
                    color: AppTheme.textMuted.withValues(alpha: 0.5),
                  ),
                  prefixIcon: const Icon(
                    Icons.search,
                    size: 18,
                    color: AppTheme.textMuted,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            if (_searchResults.isNotEmpty && _selectedUser == null)
              Container(
                height: 150,
                margin: const EdgeInsets.only(top: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: AppTheme.border),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: _searchResults.length,
                  itemBuilder: (ctx, i) {
                    final u = _searchResults[i];
                    return ListTile(
                      title: Text(
                        u['full_name'] ?? '',
                        style: const TextStyle(
                          color: AppTheme.textMain,
                          fontSize: 13,
                        ),
                      ),
                      subtitle: Text(
                        u['email'] ?? '',
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 11,
                        ),
                      ),
                      onTap: () => setState(() {
                        _selectedUser = u;
                        _searchResults = [];
                      }),
                    );
                  },
                ),
              ),
            const SizedBox(height: 16),
            const Text(
              'Target Page',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
            ),
            DropdownButton<String>(
              value: _selectedPage,
              isExpanded: true,
              dropdownColor: AppTheme.bgCard,
              style: const TextStyle(color: AppTheme.textMain),
              onChanged: (val) => setState(() => _selectedPage = val!),
              items: _pages
                  .map(
                    (p) => DropdownMenuItem(
                      value: p,
                      child: Text(p.toUpperCase()),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 16),
            const Text(
              'Reason',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
            ),
            TextField(
              controller: _reasonController,
              maxLines: 2,
              style: const TextStyle(color: AppTheme.textMain, fontSize: 14),
              decoration: const InputDecoration(
                hintText: 'e.g. Terms violation, Pending payment...',
                hintStyle: TextStyle(color: AppTheme.textMuted, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text(
            'Cancel',
            style: TextStyle(color: AppTheme.textMuted),
          ),
        ),
        ElevatedButton(
          onPressed: _selectedUser == null || _reasonController.text.isEmpty
              ? null
              : () => Navigator.pop(context, {
                  'userId': _selectedUser!['id'].toString(),
                  'page': _selectedPage,
                  'reason': _reasonController.text,
                }),
          style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
          child: const Text(
            'Apply Lock',
            style: TextStyle(color: Colors.white),
          ),
        ),
      ],
    );
  }
}
