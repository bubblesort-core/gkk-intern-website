import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';

class CustomEmailScreen extends StatefulWidget {
  const CustomEmailScreen({super.key});
  @override
  State<CustomEmailScreen> createState() => _CustomEmailScreenState();
}

class _CustomEmailScreenState extends State<CustomEmailScreen> {
  final _subjectCtrl = TextEditingController();
  final _bodyCtrl = TextEditingController();
  final _recipientCtrl = TextEditingController();
  bool _sending = false;

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _bodyCtrl.dispose();
    _recipientCtrl.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (_recipientCtrl.text.isEmpty || _subjectCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill all fields'),
          backgroundColor: AppTheme.warning,
        ),
      );
      return;
    }
    setState(() => _sending = true);
    try {
      final recipients = _recipientCtrl.text
          .split(',')
          .map((e) => e.trim())
          .toList();
      await AdminSupabaseService.sendCustomEmail(
        recipients: recipients,
        subject: _subjectCtrl.text,
        body: _bodyCtrl.text,
      );
      if (mounted) {
        _subjectCtrl.clear();
        _bodyCtrl.clear();
        _recipientCtrl.clear();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Email sent!'),
            backgroundColor: AppTheme.primary,
          ),
        );
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
                'Compose Email',
                style: TextStyle(
                  color: AppTheme.textMain,
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _recipientCtrl,
                decoration: const InputDecoration(
                  hintText: 'Recipients (comma separated)',
                  prefixIcon: Icon(
                    Icons.people_outline,
                    color: AppTheme.textMuted,
                    size: 20,
                  ),
                  fillColor: AppTheme.bgBody,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _subjectCtrl,
                decoration: const InputDecoration(
                  hintText: 'Subject',
                  prefixIcon: Icon(
                    Icons.subject,
                    color: AppTheme.textMuted,
                    size: 20,
                  ),
                  fillColor: AppTheme.bgBody,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _bodyCtrl,
                maxLines: 6,
                decoration: const InputDecoration(
                  hintText: 'Email body...',
                  fillColor: AppTheme.bgBody,
                ),
              ),
              const SizedBox(height: 16),
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
                    _sending ? 'Sending...' : 'Send Email',
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
}
