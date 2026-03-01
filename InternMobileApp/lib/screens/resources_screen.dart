import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:internmobileapp/theme/app_theme.dart';
import 'package:internmobileapp/services/supabase_service.dart';
import 'package:internmobileapp/services/update_service.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:flutter_animate/flutter_animate.dart';

class ResourcesScreen extends StatefulWidget {
  const ResourcesScreen({super.key});
  @override
  State<ResourcesScreen> createState() => _ResourcesScreenState();
}

class _ResourcesScreenState extends State<ResourcesScreen> {
  List<Map<String, dynamic>> _resources = [];

  static const _skeletonResources = [
    {
      'title': 'Resource Title Loading...',
      'description': 'Description placeholder for the resource.',
      'type': 'link',
      'url': 'https://example.com',
    },
    {
      'title': 'Getting Started Guide',
      'description': 'Everything you need to know to get started.',
      'type': 'pdf',
      'url': 'https://example.com',
    },
    {
      'title': 'Technical Documentation',
      'description': 'Deep dive into the architecture and APIs.',
      'type': 'doc',
      'url': 'https://example.com',
    },
  ];

  Future<void> _load() async {
    final data = await SupabaseService.getResources();
    if (mounted) setState(() => _resources = data);
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<List<Map<String, dynamic>>>(
      stream: SupabaseService.getResourcesStream(),
      builder: (context, snapshot) {
        final resources =
            snapshot.data ??
            (snapshot.connectionState == ConnectionState.waiting
                ? _skeletonResources
                : _resources);

        return Skeletonizer(
          enabled: snapshot.connectionState == ConnectionState.waiting,
          child: RefreshIndicator(
            color: AppTheme.primary,
            onRefresh: () async {
              await Future.wait([_load(), UpdateService().checkForUpdate()]);
            },
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: resources.length,
              itemBuilder: (ctx, i) {
                final r = resources[i];
                return Container(
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
                              color: _getResColor(
                                r['type'],
                              ).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              _getResIcon(r['type']),
                              color: _getResColor(r['type']),
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  r['title'] ?? 'Resource',
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
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                              ],
                            ),
                          ),
                          if (r['url'] != null)
                            IconButton(
                              icon: const Icon(
                                Icons.open_in_new,
                                color: AppTheme.textMuted,
                                size: 20,
                              ),
                              onPressed: () async =>
                                  await launchUrl(Uri.parse(r['url'])),
                            ),
                        ],
                      ),
                    )
                    .animate()
                    .fadeIn(duration: 400.ms, delay: (i * 100).ms)
                    .slideX(begin: 0.1, end: 0);
              },
            ),
          ),
        );
      },
    );
  }

  IconData _getResIcon(String? type) {
    switch (type) {
      case 'pdf':
        return Icons.picture_as_pdf;
      case 'video':
        return Icons.play_circle_fill_rounded;
      case 'link':
        return Icons.link_rounded;
      case 'doc':
        return Icons.description_rounded;
      case 'image':
        return Icons.image_rounded;
      default:
        return Icons.article_rounded;
    }
  }

  Color _getResColor(String? type) {
    switch (type) {
      case 'pdf':
        return const Color(0xFFEF4444);
      case 'video':
        return const Color(0xFFF59E0B);
      case 'link':
        return const Color(0xFF10B981);
      case 'doc':
        return const Color(0xFF3B82F6);
      default:
        return const Color(0xFF6366F1);
    }
  }
}
