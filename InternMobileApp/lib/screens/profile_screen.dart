import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:internmobileapp/theme/app_theme.dart';
import 'package:internmobileapp/services/supabase_service.dart';
import 'package:skeletonizer/skeletonizer.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:internmobileapp/services/update_service.dart';
import 'package:internmobileapp/screens/update_modal.dart';
import 'package:internmobileapp/utils/url_utils.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  Map<String, dynamic>? _profile;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    final profile = await SupabaseService.getCurrentProfile();
    if (mounted) setState(() => _profile = profile);
  }

  Future<void> _pickAndUploadImage() async {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.bgCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppTheme.textMuted.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Change Profile Photo',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textMain,
                ),
              ),
              const SizedBox(height: 16),
              ListTile(
                leading: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.camera_alt, color: AppTheme.primary),
                ),
                title: const Text(
                  'Take Photo',
                  style: TextStyle(color: AppTheme.textMain),
                ),
                subtitle: const Text(
                  'Use your camera',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
                onTap: () {
                  Navigator.pop(ctx);
                  _uploadImage(ImageSource.camera);
                },
              ),
              ListTile(
                leading: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: const Color(0xFF6366F1).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.photo_library,
                    color: Color(0xFF6366F1),
                  ),
                ),
                title: const Text(
                  'Choose from Gallery',
                  style: TextStyle(color: AppTheme.textMain),
                ),
                subtitle: const Text(
                  'Pick an existing photo',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
                ),
                onTap: () {
                  Navigator.pop(ctx);
                  _uploadImage(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _uploadImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: source,
        maxWidth: 512,
        maxHeight: 512,
        imageQuality: 80,
      );
      if (pickedFile == null) return;

      final file = File(pickedFile.path);
      final url = await SupabaseService.uploadAvatar(file);

      if (url != null && mounted) {
        setState(() {
          _profile?['avatar_url'] = url;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Profile photo updated! 🎉'),
            backgroundColor: AppTheme.primary,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Failed to upload photo'),
            backgroundColor: AppTheme.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: AppTheme.error,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<Map<String, dynamic>?>(
      stream: SupabaseService.getProfileStream(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          debugPrint('Profile screen stream error: ${snapshot.error}');
        }
        if (snapshot.connectionState == ConnectionState.waiting &&
            _profile == null) {
          return const Center(
            child: CircularProgressIndicator(color: AppTheme.primary),
          );
        }

        final profile = snapshot.data ?? _profile;
        if (profile == null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.person_off,
                  size: 64,
                  color: AppTheme.textMuted.withValues(alpha: 0.5),
                ),
                const SizedBox(height: 16),
                const Text(
                  'No profile found',
                  style: TextStyle(color: AppTheme.textMuted, fontSize: 16),
                ),
              ],
            ),
          );
        }

        final name = profile['full_name'] ?? 'Unknown';
        final email = SupabaseService.currentUser?.email ?? '';
        final avatarUrl = profile['avatar_url'];
        final role = profile['role'] ?? 'intern';
        final status = profile['status'] ?? 'active';
        final phone = profile['phone'] ?? 'Not set';
        final college = profile['college'] ?? 'Not set';
        final batch = profile['batch_name'] ?? 'Not assigned';
        final xp = profile['xp'] ?? 0;
        final level = profile['level'] ?? 1;

        return Skeletonizer(
          enabled: snapshot.connectionState == ConnectionState.waiting,
          child: RefreshIndicator(
            color: AppTheme.primary,
            onRefresh: () async {
              await Future.wait([
                _loadProfile(),
                UpdateService().checkForUpdate(),
              ]);
            },
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                // Profile Header Card
                Container(
                  padding: const EdgeInsets.fromLTRB(24, 48, 24, 32),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Color(0xFF10B981), Color(0xFF059669)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(24),
                      bottomRight: Radius.circular(24),
                    ),
                  ),
                  child: Column(
                    children: [
                      // Avatar with camera overlay
                      GestureDetector(
                        onTap: _pickAndUploadImage,
                        child: Stack(
                          children: [
                            Hero(
                              tag: 'profile-avatar',
                              child: CircleAvatar(
                                radius: 50,
                                backgroundColor: Colors.white,
                                backgroundImage: avatarUrl != null
                                    ? CachedNetworkImageProvider(
                                        UrlUtils.getProxiedUrl(avatarUrl),
                                      )
                                    : null,
                                child: avatarUrl == null
                                    ? Text(
                                        name.isNotEmpty
                                            ? name[0].toUpperCase()
                                            : '?',
                                        style: const TextStyle(
                                          fontSize: 36,
                                          fontWeight: FontWeight.bold,
                                          color: AppTheme.primary,
                                        ),
                                      )
                                    : null,
                              ),
                            ),
                            Positioned(
                              bottom: 0,
                              right: 0,
                              child: Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  color: AppTheme.primary,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: Colors.white,
                                    width: 2,
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(
                                        alpha: 0.2,
                                      ),
                                      blurRadius: 4,
                                    ),
                                  ],
                                ),
                                child: const Icon(
                                  Icons.camera_alt,
                                  color: Colors.white,
                                  size: 16,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ).animate().scale(
                        delay: 200.ms,
                        duration: 400.ms,
                        curve: Curves.easeOutBack,
                      ),
                      const SizedBox(height: 16),
                      Text(
                            name,
                            style: const TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          )
                          .animate()
                          .fadeIn(delay: 300.ms)
                          .slideY(begin: 0.1, end: 0),
                      const SizedBox(height: 4),
                      Text(
                            email,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.white.withValues(alpha: 0.8),
                            ),
                          )
                          .animate()
                          .fadeIn(delay: 400.ms)
                          .slideY(begin: 0.1, end: 0),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              status == 'active'
                                  ? Icons.check_circle
                                  : Icons.pause_circle,
                              color: Colors.white,
                              size: 16,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${role[0].toUpperCase()}${role.substring(1)} · ${status[0].toUpperCase()}${status.substring(1)}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ).animate().fadeIn(delay: 500.ms),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // XP & Level
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Row(
                    children: [
                      _buildMiniStat(
                        Icons.bolt,
                        '$xp XP',
                        const Color(0xFFF59E0B),
                      ),
                      const SizedBox(width: 12),
                      _buildMiniStat(
                        Icons.military_tech,
                        'Level $level',
                        const Color(0xFF6366F1),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.1, end: 0),
                const SizedBox(height: 20),

                // Info Cards
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Personal Details',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textMain,
                        ),
                      ).animate().fadeIn(delay: 700.ms),
                      const SizedBox(height: 12),
                      _buildInfoTile(Icons.email_outlined, 'Email', email),
                      _buildInfoTile(Icons.phone_outlined, 'Phone', phone),
                      _buildInfoTile(Icons.school_outlined, 'College', college),
                      _buildInfoTile(Icons.group_outlined, 'Batch', batch),

                      const SizedBox(height: 24),
                      const Text(
                        'App Information',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textMain,
                        ),
                      ).animate().fadeIn(delay: 900.ms),
                      const SizedBox(height: 12),
                      _buildInfoTile(
                        Icons.info_outline,
                        'Version',
                        UpdateService().currentVersion,
                      ),
                      Builder(
                        builder: (tileCtx) => GestureDetector(
                          onTap: () async {
                            final svc = UpdateService();
                            final messenger = ScaffoldMessenger.of(tileCtx);

                            messenger.showSnackBar(
                              const SnackBar(
                                content: Row(
                                  children: [
                                    SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    ),
                                    SizedBox(width: 12),
                                    Text('Checking for updates…'),
                                  ],
                                ),
                                duration: Duration(seconds: 10),
                                behavior: SnackBarBehavior.floating,
                              ),
                            );

                            final hasUpdate = await svc.checkForUpdate();
                            messenger.hideCurrentSnackBar();
                            if (!tileCtx.mounted) return;

                            if (hasUpdate) {
                              UpdateModal.show(tileCtx);
                            } else {
                              messenger.showSnackBar(
                                SnackBar(
                                  content: const Row(
                                    children: [
                                      Icon(
                                        Icons.check_circle,
                                        color: Colors.white,
                                        size: 18,
                                      ),
                                      SizedBox(width: 8),
                                      Text('App is up to date! 🎉'),
                                    ],
                                  ),
                                  backgroundColor: AppTheme.primary,
                                  behavior: SnackBarBehavior.floating,
                                ),
                              );
                            }
                          },
                          child: _buildInfoTile(
                            Icons.refresh,
                            'Updates',
                            'Check for updates',
                          ),
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 800.ms).slideY(begin: 0.05, end: 0),
                const SizedBox(height: 48),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildMiniStat(IconData icon, String text, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.bgCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Text(
              text,
              style: TextStyle(color: color, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoTile(IconData icon, String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Icon(icon, color: AppTheme.textMuted, size: 20),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  color: AppTheme.textMain,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
