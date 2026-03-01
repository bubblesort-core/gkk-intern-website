import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';
import 'package:admin_mobile_app/utils/url_utils.dart';
import 'package:cached_network_image/cached_network_image.dart';

class QRCodesScreen extends StatefulWidget {
  const QRCodesScreen({super.key});
  @override
  State<QRCodesScreen> createState() => _QRCodesScreenState();
}

class _QRCodesScreenState extends State<QRCodesScreen> {
  List<Map<String, dynamic>> _interns = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await AdminSupabaseService.getInternQRDirectory();
    if (mounted) {
      setState(() {
        _interns = data;
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
            : _interns.isEmpty
            ? ListView(
                children: [
                  SizedBox(height: MediaQuery.of(context).size.height * 0.3),
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.qr_code_2,
                          size: 48,
                          color: AppTheme.textMuted.withValues(alpha: 0.4),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'No intern directory data',
                          style: TextStyle(color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _interns.length,
                itemBuilder: (ctx, i) {
                  final intern = _interns[i];
                  final token = intern['token'];
                  final hasQR = token != null;
                  final hasIDCard = hasQR && token['id_card_url'] != null;

                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.bgCard,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 20,
                              backgroundColor: AppTheme.primary.withValues(
                                alpha: 0.1,
                              ),
                              backgroundImage: intern['avatar_url'] != null
                                  ? CachedNetworkImageProvider(
                                      UrlUtils.getProxiedUrl(
                                        intern['avatar_url'],
                                      ),
                                    )
                                  : null,
                              child: intern['avatar_url'] == null
                                  ? Text(
                                      (intern['full_name'] ?? '?')[0]
                                          .toUpperCase(),
                                      style: const TextStyle(
                                        color: AppTheme.primary,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    )
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    intern['full_name'] ?? 'Unknown',
                                    style: const TextStyle(
                                      color: AppTheme.textMain,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 15,
                                    ),
                                  ),
                                  Text(
                                    intern['email'] ?? '',
                                    style: const TextStyle(
                                      color: AppTheme.textMuted,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            PopupMenuButton<String>(
                              icon: const Icon(
                                Icons.more_horiz,
                                color: AppTheme.textMuted,
                              ),
                              onSelected: (val) {
                                if (val == 'revoke') {
                                  _revoke(token['id'].toString());
                                } else if (val == 'id_card') {
                                  _showIDCardDialog(intern);
                                }
                              },
                              itemBuilder: (ctx) => [
                                if (hasQR) ...[
                                  const PopupMenuItem(
                                    value: 'id_card',
                                    child: Row(
                                      children: [
                                        Icon(Icons.badge_outlined, size: 18),
                                        SizedBox(width: 8),
                                        Text('ID Card'),
                                      ],
                                    ),
                                  ),
                                  const PopupMenuItem(
                                    value: 'revoke',
                                    child: Row(
                                      children: [
                                        Icon(
                                          Icons.block,
                                          size: 18,
                                          color: AppTheme.error,
                                        ),
                                        SizedBox(width: 8),
                                        Text(
                                          'Revoke QR',
                                          style: TextStyle(
                                            color: AppTheme.error,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            _buildStatusTag(
                              hasQR ? 'QR ACTIVE' : 'NO QR',
                              hasQR ? AppTheme.primary : AppTheme.textMuted,
                            ),
                            const SizedBox(width: 8),
                            _buildStatusTag(
                              hasIDCard ? 'ID UPLOADED' : 'NO ID CARD',
                              hasIDCard ? AppTheme.success : AppTheme.textMuted,
                            ),
                            const Spacer(),
                            if (!hasQR)
                              ElevatedButton.icon(
                                onPressed: intern['application_id'] != null
                                    ? () => _generateQR(
                                        intern['application_id'].toString(),
                                      )
                                    : null,
                                icon: const Icon(Icons.add, size: 16),
                                label: const Text('Generate'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.primary,
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 0,
                                  ),
                                  visualDensity: VisualDensity.compact,
                                ),
                              )
                            else
                              IconButton(
                                icon: const Icon(
                                  Icons.qr_code,
                                  color: AppTheme.primary,
                                ),
                                onPressed: () => _showQRDialog(intern),
                                tooltip: 'View QR',
                              ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ),
      ),
    );
  }

  Widget _buildStatusTag(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Future<void> _generateQR(String applicationId) async {
    try {
      await AdminSupabaseService.generateInternQR(applicationId);
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _revoke(String tokenId) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text(
          'Revoke QR',
          style: TextStyle(color: AppTheme.textMain),
        ),
        content: const Text(
          'This will disable the intern\'s profile link immediately.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
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
      await AdminSupabaseService.revokeInternQR(tokenId);
      _load();
    }
  }

  void _showQRDialog(Map<String, dynamic> intern) {
    final token = intern['token'];
    final url =
        'https://gkkintern.in/Dashboard/intern-profile/?token=${token['token']}';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: Text(intern['full_name'] ?? 'QR Code'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Image.network(
                'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=$url',
                width: 200,
                height: 200,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              url,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showIDCardDialog(Map<String, dynamic> intern) {
    final token = intern['token'];
    final url = token['id_card_url'];

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text('ID Card'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (url != null)
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image(
                  image: CachedNetworkImageProvider(
                    UrlUtils.getProxiedUrl(url),
                  ),
                ),
              )
            else
              const Text('No ID card uploaded.'),
            const SizedBox(height: 16),
            const Text(
              'To upload a new ID card, please use the web dashboard.',
              style: TextStyle(
                fontSize: 12,
                color: AppTheme.textMuted,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}
