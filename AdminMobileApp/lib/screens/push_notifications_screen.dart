import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';
import 'package:admin_mobile_app/widgets/target_selector.dart';

class PushNotificationsScreen extends StatefulWidget {
  const PushNotificationsScreen({super.key});
  @override
  State<PushNotificationsScreen> createState() =>
      _PushNotificationsScreenState();
}

class _PushNotificationsScreenState extends State<PushNotificationsScreen> {
  final _titleCtrl = TextEditingController();
  final _bodyCtrl = TextEditingController();
  bool _sending = false;

  String _targetType = 'all';
  List<String> _selectedIds = [];

  Future<void> _send() async {
    if (_titleCtrl.text.isEmpty || _bodyCtrl.text.isEmpty) {
      _showSnackBar('Please fill all fields', AppTheme.warning);
      return;
    }

    if (_targetType != 'all' && _selectedIds.isEmpty) {
      _showSnackBar('Please select at least one target', AppTheme.warning);
      return;
    }

    setState(() => _sending = true);
    try {
      await AdminSupabaseService.sendPushNotification(
        title: _titleCtrl.text,
        body: _bodyCtrl.text,
        targetType: _targetType,
        targetIds: _selectedIds,
      );
      if (mounted) {
        _titleCtrl.clear();
        _bodyCtrl.clear();
        setState(() {
          _selectedIds.clear();
        });
        _showSnackBar('Push notification sent!', AppTheme.primary);
      }
    } catch (e) {
      if (mounted) {
        _showSnackBar('Error: $e', AppTheme.error);
      }
    }
    if (mounted) setState(() => _sending = false);
  }

  void _showSnackBar(String msg, Color color) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(msg), backgroundColor: color));
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
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
                'Send Push Notification',
                style: TextStyle(
                  color: AppTheme.textMain,
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Target specific users or broadcast to all',
                style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
              ),
              const SizedBox(height: 20),

              // Title Header
              _fieldLabel('Notification Title'),
              TextField(
                controller: _titleCtrl,
                decoration: const InputDecoration(
                  hintText: 'e.g. New Project Assigned',
                  prefixIcon: Icon(
                    Icons.title,
                    color: AppTheme.textMuted,
                    size: 20,
                  ),
                  fillColor: AppTheme.bgBody,
                ),
              ),
              const SizedBox(height: 16),

              // Message Header
              _fieldLabel('Message Body'),
              TextField(
                controller: _bodyCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Enter notification message contents...',
                  fillColor: AppTheme.bgBody,
                ),
              ),
              const Divider(height: 40, color: AppTheme.border),

              // Targeting Section
              TargetSelector(
                onChanged: (type, ids) {
                  setState(() {
                    _targetType = type;
                    _selectedIds = ids;
                  });
                },
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _sending ? null : _send,
                  icon: _sending
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.send, color: Colors.white, size: 18),
                  label: Text(
                    _sending ? 'Sending...' : 'Broadcast Notification',
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _fieldLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          color: AppTheme.textMuted,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
