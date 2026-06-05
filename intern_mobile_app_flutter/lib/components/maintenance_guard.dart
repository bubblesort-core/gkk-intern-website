import 'package:flutter/material.dart';
import '../core/supabase_client.dart';
import '../theme/colors.dart';

class MaintenanceGuard extends StatefulWidget {
  final Widget child;

  const MaintenanceGuard({super.key, required this.child});

  @override
  State<MaintenanceGuard> createState() => _MaintenanceGuardState();
}

class _MaintenanceGuardState extends State<MaintenanceGuard> {
  bool _loading = true;
  bool _enabled = false;
  String _title = '';
  String _message = '';

  @override
  void initState() {
    super.initState();
    _checkMaintenance();
  }

  Future<void> _checkMaintenance() async {
    try {
      final response = await SupabaseClientConfig.client
          .from('system_config')
          .select('value')
          .eq('key', 'maintenance_mode')
          .maybeSingle();

      if (response != null && response['value'] != null) {
        final val = response['value'] as Map<String, dynamic>;
        setState(() {
          _enabled = val['enabled'] == true;
          _title = val['title'] ?? 'Scheduled Maintenance';
          _message = val['message'] ?? 'We are currently undergoing scheduled maintenance. Please check back soon.';
          _loading = false;
        });
        return;
      }
    } catch (e) {
      debugPrint('Error checking maintenance state: $e');
    }

    if (mounted) {
      setState(() {
        _loading = false;
        _enabled = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    if (_enabled) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.build, size: 64, color: AppColors.primary),
                const SizedBox(height: 24),
                Text(
                  _title,
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.text),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                Text(
                  _message,
                  style: const TextStyle(fontSize: 16, color: Color(0xFF94a3b8), height: 1.5),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return widget.child;
  }
}
