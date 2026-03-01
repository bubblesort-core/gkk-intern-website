import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static final client = Supabase.instance.client;

  // ─── AUTH ───
  static User? get currentUser => client.auth.currentUser;
  static Stream<AuthState> get authStateChanges =>
      client.auth.onAuthStateChange;

  static Future<void> signOut() async {
    await client.auth.signOut();
  }

  // ─── PROFILE ───
  static Future<Map<String, dynamic>?> getCurrentProfile() async {
    try {
      final user = currentUser;
      if (user == null) return null;
      final data = await client
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
      return data;
    } catch (e) {
      debugPrint('Error fetching profile: $e');
      return null;
    }
  }

  static Stream<Map<String, dynamic>?> getProfileStream() {
    try {
      final user = currentUser;
      if (user == null) return const Stream.empty();
      return client
          .from('profiles')
          .stream(primaryKey: ['id'])
          .eq('id', user.id)
          .limit(1)
          .map((data) => data.isNotEmpty ? data.first : null)
          .handleError((error) {
            debugPrint('STREAM ERROR (Profile): $error');
          });
    } catch (e) {
      debugPrint('STREAM SETUP ERROR (Profile): $e');
      return const Stream.empty();
    }
  }

  static Future<void> updateProfile(Map<String, dynamic> updates) async {
    final user = currentUser;
    if (user == null) return;
    await client.from('profiles').update(updates).eq('id', user.id);
  }

  // ─── AVATAR UPLOAD ───
  static Future<String?> uploadAvatar(File imageFile) async {
    try {
      final user = currentUser;
      if (user == null) return null;

      final fileExt = imageFile.path.split('.').last;
      final fileName = '${user.id}/avatar.$fileExt';
      final bytes = await imageFile.readAsBytes();

      await client.storage
          .from('avatars')
          .uploadBinary(
            fileName,
            bytes,
            fileOptions: const FileOptions(cacheControl: '3600', upsert: true),
          );

      final publicUrl = client.storage.from('avatars').getPublicUrl(fileName);

      // Update profile with new avatar URL
      await updateProfile({'avatar_url': publicUrl});

      return publicUrl;
    } catch (e) {
      debugPrint('Error uploading avatar: $e');
      return null;
    }
  }

  // ─── PROJECTS ───
  static Future<List<Map<String, dynamic>>> getMyProjects() async {
    try {
      final user = currentUser;
      if (user == null) return [];

      // Get user's team memberships
      final memberships = await client
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.id);

      if (memberships.isEmpty) return [];

      final teamIds = (memberships as List).map((m) => m['team_id']).toList();

      final projects = await client
          .from('projects')
          .select('*, teams(id, name)')
          .inFilter('assigned_team_id', teamIds)
          .order('created_at', ascending: false);

      return List<Map<String, dynamic>>.from(projects);
    } catch (e) {
      debugPrint('Error fetching projects: $e');
      return [];
    }
  }

  // ─── TEAM ───
  static Future<Map<String, dynamic>?> getMyTeam() async {
    try {
      final user = currentUser;
      if (user == null) return null;

      final membership = await client
          .from('team_members')
          .select('team_id, role, teams(*)')
          .eq('user_id', user.id)
          .maybeSingle();

      return membership;
    } catch (e) {
      debugPrint('Error fetching team: $e');
      return null;
    }
  }

  static Future<List<Map<String, dynamic>>> getTeamMembers(
    String teamId,
  ) async {
    try {
      final data = await client
          .from('team_members')
          .select('*, profiles(id, full_name, email, avatar_url)')
          .eq('team_id', teamId);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('Error fetching team members: $e');
      return [];
    }
  }

  // ─── CUSTOM PROJECTS ───
  static Future<List<Map<String, dynamic>>> getMyCustomProjects() async {
    try {
      final user = currentUser;
      if (user == null) return [];
      final data = await client
          .from('custom_project_submissions')
          .select('*')
          .eq('intern_id', user.id)
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('Error fetching custom projects: $e');
      return [];
    }
  }

  static Future<void> submitCustomProject({
    required String title,
    required String description,
    required String deployedUrl,
    required String githubUrl,
  }) async {
    final user = currentUser;
    if (user == null) throw Exception('Not logged in');

    // Auto prepend https://
    String formattedDeployedUrl = deployedUrl.trim();
    if (formattedDeployedUrl.isNotEmpty &&
        !RegExp(
          r'^https?://',
          caseSensitive: false,
        ).hasMatch(formattedDeployedUrl)) {
      formattedDeployedUrl = 'https://$formattedDeployedUrl';
    }

    String formattedGithubUrl = githubUrl.trim();
    if (formattedGithubUrl.isNotEmpty &&
        !RegExp(
          r'^https?://',
          caseSensitive: false,
        ).hasMatch(formattedGithubUrl)) {
      formattedGithubUrl = 'https://$formattedGithubUrl';
    }

    await client.from('custom_project_submissions').insert({
      'intern_id': user.id,
      'title': title.trim(),
      'description': description.trim(),
      'deployed_url': formattedDeployedUrl,
      'github_url': formattedGithubUrl.isEmpty ? null : formattedGithubUrl,
      'status': 'submitted',
    });
  }

  static Future<List<Map<String, dynamic>>> getAnnouncements() async {
    try {
      final now = DateTime.now().toIso8601String();
      final data = await client
          .from('announcements')
          .select('*')
          .or('expires_at.is.null,expires_at.gt.$now')
          .order('is_pinned', ascending: false)
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('Error fetching announcements: $e');
      return [];
    }
  }

  static Stream<List<Map<String, dynamic>>> getAnnouncementsStream() {
    return client
        .from('announcements')
        .stream(primaryKey: ['id'])
        .order('is_pinned', ascending: false)
        .order('created_at', ascending: false)
        .map((data) {
          return data.where((item) {
            final expiresAt = item['expires_at'];
            if (expiresAt == null) return true;
            return DateTime.parse(expiresAt).isAfter(DateTime.now());
          }).toList();
        });
  }

  // ─── SESSIONS ───
  static Future<List<Map<String, dynamic>>> getActiveSessions() async {
    try {
      final data = await client
          .from('sessions')
          .select('*')
          .eq('status', 'live')
          .order('actual_start', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('Error fetching active sessions: $e');
      return [];
    }
  }

  static Stream<List<Map<String, dynamic>>> getActiveSessionsStream() {
    return client
        .from('sessions')
        .stream(primaryKey: ['id'])
        .order('scheduled_start', ascending: true);
  }

  static Future<Map<String, String?>> getUserTargetInfo() async {
    try {
      final user = currentUser;
      if (user == null) return {};

      // Get team membership
      final membership = await client
          .from('team_members')
          .select('team_id, teams(batch_id)')
          .eq('user_id', user.id)
          .maybeSingle();

      if (membership == null) {
        return {'user_id': user.id};
      }

      final teamId = membership['team_id']?.toString();
      final batchId =
          (membership['teams'] as Map<String, dynamic>?)?['batch_id']
              ?.toString();

      return {'user_id': user.id, 'team_id': teamId, 'batch_id': batchId};
    } catch (e) {
      debugPrint('Error getting target info: $e');
      return {'user_id': currentUser?.id};
    }
  }

  static Future<List<Map<String, dynamic>>> getRecordings() async {
    try {
      final data = await client
          .from('recordings')
          .select('*')
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('Error fetching recordings: $e');
      return [];
    }
  }

  // ─── LEADERBOARD ───
  static Future<List<Map<String, dynamic>>> getLeaderboard() async {
    try {
      final data = await client
          .from('profiles')
          .select('id, full_name, avatar_url, xp, current_streak')
          .eq('role', 'intern')
          .not('full_name', 'ilike', '%(Test)%')
          .order('xp', ascending: false)
          .limit(50);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('Error fetching leaderboard: $e');
      return [];
    }
  }

  // ─── RESOURCES ───
  static Future<List<Map<String, dynamic>>> getResources() async {
    try {
      final data = await client
          .from('resources')
          .select('*')
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('Error fetching resources: $e');
      return [];
    }
  }

  static Stream<List<Map<String, dynamic>>> getResourcesStream() {
    return client
        .from('resources')
        .stream(primaryKey: ['id'])
        .order('created_at', ascending: false);
  }

  // ─── REWARDS ───
  static Future<List<Map<String, dynamic>>> getRewards() async {
    try {
      final user = currentUser;
      if (user == null) return [];
      final data = await client
          .from('rewards')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('Error fetching rewards: $e');
      return [];
    }
  }

  // ─── REFERRALS ───
  static Future<Map<String, dynamic>?> getReferralInfo() async {
    try {
      final user = currentUser;
      if (user == null) return null;
      final data = await client
          .from('referrals')
          .select('*')
          .eq('referrer_id', user.id)
          .maybeSingle();
      return data;
    } catch (e) {
      debugPrint('Error fetching referral info: $e');
      return null;
    }
  }

  // ─── STREAK ───
  static Future<int> getLoginStreak() async {
    try {
      final profile = await getCurrentProfile();
      return profile?['current_streak'] ?? 0;
    } catch (e) {
      debugPrint('Error fetching login streak: $e');
      return 0;
    }
  }

  // ─── NOTIFICATIONS ───
  static Future<List<Map<String, dynamic>>> getNotifications() async {
    try {
      final user = currentUser;
      if (user == null) return [];
      final data = await client
          .from('admin_notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', ascending: false)
          .limit(50);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
      return [];
    }
  }

  static Stream<List<Map<String, dynamic>>> getNotificationsStream() {
    final user = currentUser;
    if (user == null) return const Stream.empty();
    return client
        .from('admin_notifications')
        .stream(primaryKey: ['id'])
        .eq('user_id', user.id)
        .order('created_at', ascending: false)
        .limit(50);
  }

  static Future<void> markNotificationsRead() async {
    try {
      final user = currentUser;
      if (user == null) return;
      await client
          .from('admin_notifications')
          .update({'is_read': true})
          .eq('user_id', user.id)
          .eq('is_read', false);
    } catch (e) {
      debugPrint('Error marking notifications read: $e');
    }
  }

  // ─── FCM TOKEN ───
  static Future<void> saveFcmToken(String token) async {
    try {
      final user = currentUser;
      if (user == null) return;
      // 1. Upsert into fcm_tokens table
      await client.from('fcm_tokens').upsert({
        'user_id': user.id,
        'token': token,
        'updated_at': DateTime.now().toIso8601String(),
      }, onConflict: 'user_id,token');

      // 2. Sync to profiles table (array)
      await client.rpc(
        'add_fcm_token',
        params: {'user_id_param': user.id, 'new_token': token},
      );
    } catch (e) {
      debugPrint('Error saving FCM token: $e');
    }
  }

  static Future<void> removeFcmToken(String token) async {
    try {
      final user = currentUser;
      if (user == null) return;
      // 1. Remove from fcm_tokens table
      await client
          .from('fcm_tokens')
          .delete()
          .eq('user_id', user.id)
          .eq('token', token);

      // 2. Remove from profiles table (array)
      await client.rpc(
        'remove_fcm_token',
        params: {'user_id_param': user.id, 'target_token': token},
      );
    } catch (e) {
      debugPrint('Error removing FCM token: $e');
    }
  }

  static Stream<List<Map<String, dynamic>>> getLeaderboardStream() {
    return client
        .from('profiles')
        .stream(primaryKey: ['id'])
        .eq('role', 'intern')
        .order('xp', ascending: false)
        .limit(100) // Fetch more to allow for filtering
        .map((data) {
          return data
              .where(
                (p) =>
                    !(p['full_name']?.toString().contains('(Test)') ?? false),
              )
              .take(50)
              .toList();
        })
        .handleError((e) {
          debugPrint('STREAM ERROR (Leaderboard): $e');
        });
  }
}
