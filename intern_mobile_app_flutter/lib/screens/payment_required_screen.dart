import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/supabase_client.dart';
import '../theme/colors.dart';

class PaymentRequiredScreen extends StatelessWidget {
  const PaymentRequiredScreen({super.key});

  Future<void> _handlePayNow() async {
    final url = Uri.parse('https://hire.gkk.com/dashboard');
    try {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (e) {
      debugPrint('Could not launch $url');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.glassBorder),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  offset: const Offset(0, 4),
                  blurRadius: 12,
                )
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('💳', style: TextStyle(fontSize: 48)),
                const SizedBox(height: 16),
                const Text('Payment Required', style: TextStyle(color: AppColors.text, fontSize: 22, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                const Text(
                  "Your application is approved! However, you need to complete your fee payment on the website to unlock the mobile dashboard.",
                  style: TextStyle(color: AppColors.textMuted, fontSize: 15, height: 1.4),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: const Color(0xFF0a0a0f),
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 32),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: _handlePayNow,
                    child: const Text('Pay on Website', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: () => SupabaseClientConfig.client.auth.signOut(),
                  child: const Text('Log Out', style: TextStyle(color: AppColors.textMuted, fontSize: 15)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
