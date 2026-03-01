import 'package:flutter/material.dart';
import 'package:internmobileapp/theme/app_theme.dart';
import 'package:internmobileapp/services/supabase_service.dart';
import 'package:internmobileapp/services/update_service.dart';

class RewardsScreen extends StatefulWidget {
  const RewardsScreen({super.key});
  @override
  State<RewardsScreen> createState() => _RewardsScreenState();
}

class _RewardsScreenState extends State<RewardsScreen> {
  List<Map<String, dynamic>> _rewards = [];
  bool _isLoading = true;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      setState(() {
        _isLoading = true;
        _hasError = false;
      });
      final data = await SupabaseService.getRewards();
      if (mounted) setState(() => _rewards = data);
    } catch (e) {
      if (mounted) setState(() => _hasError = true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primary),
      );
    }
    if (_hasError) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.cloud_off,
              size: 64,
              color: AppTheme.textMuted.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            const Text(
              'Failed to load rewards',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 16),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: _load,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 10,
                ),
              ),
            ),
          ],
        ),
      );
    }
    if (_rewards.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.card_giftcard,
              size: 64,
              color: AppTheme.textMuted.withValues(alpha: 0.5),
            ),
            const SizedBox(height: 16),
            const Text(
              'No rewards earned yet',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 16),
            ),
            const SizedBox(height: 8),
            const Text(
              'Complete projects and tasks to earn rewards!',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
            ),
          ],
        ),
      );
    }
    return RefreshIndicator(
      color: AppTheme.primary,
      onRefresh: () async {
        await Future.wait([_load(), UpdateService().checkForUpdate()]);
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _rewards.length,
        itemBuilder: (ctx, i) {
          final r = _rewards[i];
          return AnimatedContainer(
            duration: Duration(milliseconds: 200 + (i * 50)),
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.star,
                    color: Color(0xFFF59E0B),
                    size: 22,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        r['title'] ?? 'Reward',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textMain,
                        ),
                      ),
                      if (r['description'] != null)
                        Text(
                          r['description'],
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.textMuted,
                          ),
                        ),
                    ],
                  ),
                ),
                if (r['xp_value'] != null)
                  Text(
                    '+${r['xp_value']} XP',
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      color: Color(0xFFF59E0B),
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
