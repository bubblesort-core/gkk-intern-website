import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Centralizes all admin Supabase CRUD operations.
class AdminSupabaseService {
  static final client = Supabase.instance.client;

  // ═══════════════════════════════════════════════
  // DASHBOARD STATS
  // ═══════════════════════════════════════════════

  static Future<Map<String, dynamic>> getDashboardStats() async {
    try {
      final pendingRes = await client
          .from('applications')
          .select('id')
          .eq('status', 'pending');
      final pendingCount = (pendingRes as List).length;

      // Active Interns (Definition: Approved + Profile + Paid)
      final profileData = await client.rpc('get_all_profile_emails');
      final activeProfileIds =
          (profileData as List?)
              ?.where((p) => p['status'] == 'active')
              .map((p) => p['id'])
              .toList() ??
          [];

      final teamsRes = await client.from('teams').select('id');
      final teamsCount = (teamsRes as List).length;

      // Total Revenue from payments table
      final paymentsRes = await client
          .from('payments')
          .select('amount')
          .filter('status', 'in', '("completed","captured")');

      double totalRevenue = 0;
      for (final p in paymentsRes as List) {
        totalRevenue += (double.tryParse(p['amount'].toString()) ?? 0);
      }
      // Deduct 2% gateway fee
      totalRevenue = totalRevenue * 0.98;

      return {
        'pending': pendingCount,
        'active': activeProfileIds.length,
        'teams': teamsCount,
        'revenue': totalRevenue.round(),
      };
    } catch (e) {
      debugPrint('[AdminSupabase] Stats error: $e');
      return {'pending': 0, 'active': 0, 'teams': 0, 'revenue': 0};
    }
  }

  // ═══════════════════════════════════════════════
  // APPLICATIONS
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getAllApplications({
    String? status,
    String? search,
  }) async {
    try {
      var query = client.from('applications').select('*');

      if (status != null && status.isNotEmpty) {
        query = query.eq('status', status);
      }

      final data = await query.order('created_at', ascending: false);
      List<Map<String, dynamic>> results = List.from(data);

      if (search != null && search.isNotEmpty) {
        final lower = search.toLowerCase();
        results = results.where((app) {
          final name = (app['full_name'] ?? '').toString().toLowerCase();
          final email = (app['email'] ?? '').toString().toLowerCase();
          return name.contains(lower) || email.contains(lower);
        }).toList();
      }

      return results;
    } catch (e) {
      debugPrint('[AdminSupabase] Applications error: $e');
      return [];
    }
  }

  static Future<void> updateApplicationStatus(
    String applicationId,
    String status, {
    String? notes,
  }) async {
    final updates = <String, dynamic>{'status': status};
    if (notes != null) updates['interview_notes'] = notes;

    await client.from('applications').update(updates).eq('id', applicationId);
  }

  static Future<Map<String, dynamic>?> getApplicationDetails(
    String applicationId,
  ) async {
    try {
      return await client
          .from('applications')
          .select('*')
          .eq('id', applicationId)
          .maybeSingle();
    } catch (e) {
      debugPrint('[AdminSupabase] App detail error: $e');
      return null;
    }
  }

  static Future<void> deleteApplication(String id) async {
    await client.from('applications').delete().eq('id', id);
  }

  static Future<void> updateApplicationRemark(String id, String remark) async {
    await client.from('applications').update({'remark': remark}).eq('id', id);
  }

  // ═══════════════════════════════════════════════
  // ACTIVE INTERNS
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getAllInterns({
    String? search,
    String? status,
  }) async {
    try {
      var query = client.from('profiles').select('*').eq('role', 'intern');

      if (status != null) {
        query = query.eq('status', status);
      }

      final data = await query.order('full_name');

      List<Map<String, dynamic>> results = List.from(data);

      if (search != null && search.isNotEmpty) {
        final lower = search.toLowerCase();
        results = results.where((p) {
          final name = (p['full_name'] ?? '').toString().toLowerCase();
          final email = (p['email'] ?? '').toString().toLowerCase();
          return name.contains(lower) || email.contains(lower);
        }).toList();
      }

      return results;
    } catch (e) {
      debugPrint('[AdminSupabase] Interns error: $e');
      return [];
    }
  }

  static Future<void> updateInternStatus(String userId, String status) async {
    await client.from('profiles').update({'status': status}).eq('id', userId);
  }

  static Future<void> updateInternProfile(
    String userId,
    Map<String, dynamic> data,
  ) async {
    await client.from('profiles').update(data).eq('id', userId);
  }

  static Future<void> deleteInternProfile(String userId) async {
    // Delete profile (Supabase triggers/cascade should handle auth user if configured)
    await client.from('profiles').delete().eq('id', userId);
  }

  // ═══════════════════════════════════════════════
  // TEAMS
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getAllTeams() async {
    try {
      final data = await client
          .from('teams')
          .select('''
            *,
            team_members (
              id, role, user_id,
              profiles (id, full_name, email, avatar_url)
            ),
            projects (id, title, status)
          ''')
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Teams error: $e');
      return [];
    }
  }

  static Future<Map<String, dynamic>> createTeam(
    Map<String, dynamic> teamData,
  ) async {
    final response = await client
        .from('teams')
        .insert([teamData])
        .select()
        .single();
    return response;
  }

  static Future<void> deleteTeam(String teamId) async {
    await client.from('teams').delete().eq('id', teamId);
  }

  static Future<void> updateTeam(
    String teamId,
    Map<String, dynamic> data,
  ) async {
    await client.from('teams').update(data).eq('id', teamId);
  }

  static Future<void> addMemberToTeam(
    String teamId,
    String userId, {
    String role = 'member',
  }) async {
    await client.from('team_members').insert([
      {'team_id': teamId, 'user_id': userId, 'role': role},
    ]);
  }

  static Future<void> removeMemberFromTeam(String teamId, String userId) async {
    await client
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);
  }

  // ═══════════════════════════════════════════════
  // PROJECTS
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getAllProjects() async {
    try {
      final data = await client
          .from('projects')
          .select('''
            *,
            teams (id, name, current_members),
            project_submissions (id, status, submitted_at)
          ''')
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Projects error: $e');
      return [];
    }
  }

  static Future<Map<String, dynamic>> createProject(
    Map<String, dynamic> projectData,
  ) async {
    final response = await client
        .from('projects')
        .insert([projectData])
        .select()
        .single();
    return response;
  }

  static Future<void> assignProjectToTeam(
    String projectId,
    String teamId,
  ) async {
    await client
        .from('projects')
        .update({'assigned_team_id': teamId, 'status': 'assigned'})
        .eq('id', projectId);
  }

  static Future<void> updateProjectStatus(
    String projectId,
    String status,
  ) async {
    await client
        .from('projects')
        .update({'status': status})
        .eq('id', projectId);
  }

  static Future<void> updateProject(
    String projectId,
    Map<String, dynamic> data,
  ) async {
    await client.from('projects').update(data).eq('id', projectId);
  }

  static Future<void> deleteProject(String projectId) async {
    await client.from('projects').delete().eq('id', projectId);
  }

  // ═══════════════════════════════════════════════
  // BATCHES
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getAllBatches() async {
    try {
      final data = await client
          .from('batches')
          .select('*')
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Batches error: $e');
      return [];
    }
  }

  static Future<Map<String, dynamic>> createBatch(
    Map<String, dynamic> batchData,
  ) async {
    final response = await client
        .from('batches')
        .insert([batchData])
        .select()
        .single();
    return response;
  }

  static Future<void> updateBatch(
    String batchId,
    Map<String, dynamic> updates,
  ) async {
    await client.from('batches').update(updates).eq('id', batchId);
  }

  static Future<void> deleteBatch(String batchId) async {
    await client.from('batches').delete().eq('id', batchId);
  }

  // ═══════════════════════════════════════════════
  // ANNOUNCEMENTS
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getAllAnnouncements() async {
    try {
      final data = await client
          .from('announcements')
          .select('*')
          .order('is_pinned', ascending: false)
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Announcements error: $e');
      return [];
    }
  }

  static Future<Map<String, dynamic>> createAnnouncement(
    Map<String, dynamic> data,
  ) async {
    final user = client.auth.currentUser;
    final response = await client
        .from('announcements')
        .insert([
          {...data, 'created_by': user?.id},
        ])
        .select()
        .single();
    return response;
  }

  static Future<void> deleteAnnouncement(String id) async {
    await client.from('announcements').delete().eq('id', id);
  }

  static Future<void> updateAnnouncement(
    String id,
    Map<String, dynamic> data,
  ) async {
    await client.from('announcements').update(data).eq('id', id);
  }

  // ═══════════════════════════════════════════════
  // RESOURCES
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getAllResources() async {
    try {
      final data = await client
          .from('resources')
          .select('*')
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Resources error: $e');
      return [];
    }
  }

  static Future<void> createResource(Map<String, dynamic> data) async {
    await client.from('resources').insert([
      {...data, 'created_at': DateTime.now().toIso8601String()},
    ]);
  }

  static Future<void> updateResource(
    String id,
    Map<String, dynamic> data,
  ) async {
    await client.from('resources').update(data).eq('id', id);
  }

  static Future<void> deleteResource(String id) async {
    await client.from('resources').delete().eq('id', id);
  }

  // ═══════════════════════════════════════════════
  // SESSIONS
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getAllSessions() async {
    try {
      final data = await client
          .from('sessions')
          .select('*')
          .order('scheduled_start', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Sessions error: $e');
      return [];
    }
  }

  static Future<void> createSession(Map<String, dynamic> data) async {
    final user = client.auth.currentUser;
    await client.from('sessions').insert([
      {...data, 'created_by': user?.id},
    ]);
  }

  static Future<void> updateSession(
    String id,
    Map<String, dynamic> data,
  ) async {
    await client.from('sessions').update(data).eq('id', id);
  }

  static Future<void> endSession(String sessionId) async {
    await client
        .from('sessions')
        .update({
          'status': 'ended',
          'actual_end': DateTime.now().toIso8601String(),
        })
        .eq('id', sessionId);
  }

  static Future<void> deleteSession(String sessionId) async {
    await client.from('sessions').delete().eq('id', sessionId);
  }

  // ═══════════════════════════════════════════════
  // RECORDINGS
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getAllRecordings() async {
    try {
      final data = await client
          .from('recordings')
          .select('*')
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Recordings error: $e');
      return [];
    }
  }

  static Future<void> createRecording(Map<String, dynamic> data) async {
    final user = client.auth.currentUser;
    await client.from('recordings').insert([
      {...data, 'created_by': user?.id},
    ]);
  }

  static Future<void> updateRecording(
    String id,
    Map<String, dynamic> data,
  ) async {
    await client.from('recordings').update(data).eq('id', id);
  }

  static Future<void> deleteRecording(String recordingId) async {
    await client.from('recordings').delete().eq('id', recordingId);
  }

  // ═══════════════════════════════════════════════
  // INVITATIONS
  // ═══════════════════════════════════════════════

  static Future<Map<String, dynamic>> createInvitation({
    required String email,
    String? applicationId,
    String? teamId,
  }) async {
    final user = client.auth.currentUser;
    final response = await client
        .from('invitations')
        .insert([
          {
            'email': email,
            'application_id': applicationId,
            'team_id': teamId,
            'created_by': user?.id,
          },
        ])
        .select()
        .single();
    return response;
  }

  // ═══════════════════════════════════════════════
  // SUBMISSIONS
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getSubmissions() async {
    try {
      final data = await client
          .from('project_submissions')
          .select('*, projects(title), profiles(full_name, email)')
          .order('submitted_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Submissions error: $e');
      return [];
    }
  }

  static Future<void> reviewSubmission(
    String submissionId,
    String status, {
    String? feedback,
    int? grade,
  }) async {
    final updates = <String, dynamic>{'status': status};
    if (feedback != null) updates['feedback'] = feedback;
    if (grade != null) updates['grade'] = grade;
    await client
        .from('project_submissions')
        .update(updates)
        .eq('id', submissionId);
  }

  static Future<void> deleteSubmission(String id) async {
    await client.from('project_submissions').delete().eq('id', id);
  }

  // ═══════════════════════════════════════════════
  // CUSTOM PROJECT SUBMISSIONS
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getCustomSubmissions() async {
    try {
      final data = await client
          .from('custom_project_submissions')
          .select('*, profiles(full_name, email)')
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Custom Submissions error: $e');
      return [];
    }
  }

  static Future<void> reviewCustomSubmission(
    String submissionId,
    String status, {
    String? adminNotes,
  }) async {
    final updates = <String, dynamic>{'status': status};
    if (adminNotes != null) updates['admin_notes'] = adminNotes;

    await client
        .from('custom_project_submissions')
        .update(updates)
        .eq('id', submissionId);
  }

  // ═══════════════════════════════════════════════
  // REWARDS
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getAllRewards() async {
    try {
      final data = await client
          .from('rewards')
          .select('*, profiles(full_name, email)')
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Rewards error: $e');
      return [];
    }
  }

  static Future<void> createReward(Map<String, dynamic> data) async {
    final user = client.auth.currentUser;
    await client.from('rewards').insert([
      {
        ...data,
        'created_by': user?.id,
        'created_at': DateTime.now().toIso8601String(),
      },
    ]);
  }

  static Future<void> addXP(String userId, int xp) async {
    // Get current XP then increment
    final profile = await client
        .from('profiles')
        .select('xp')
        .eq('id', userId)
        .single();
    final currentXP = profile['xp'] ?? 0;
    await client
        .from('profiles')
        .update({'xp': currentXP + xp})
        .eq('id', userId);
  }

  static Future<void> deleteReward(String id) async {
    await client.from('rewards').delete().eq('id', id);
  }

  static Future<void> updateReward(String id, Map<String, dynamic> data) async {
    await client.from('rewards').update(data).eq('id', id);
  }

  static Future<List<Map<String, dynamic>>> getInternQRDirectory() async {
    try {
      // 1. Fetch all approved/active interns profiles
      final profiles = await client
          .from('profiles')
          .select('id, full_name, email, avatar_url, status')
          .eq('role', 'intern')
          .eq('status', 'active');

      // 2. Fetch all approved applications (to get application_id)
      final apps = await client
          .from('applications')
          .select('id, email, status')
          .eq('status', 'approved');

      // 3. Fetch all active QR tokens
      final tokens = await client
          .from('intern_qr_tokens')
          .select('*')
          .eq('is_active', true);

      final tokenMap = {for (var t in (tokens as List)) t['application_id']: t};

      final appMap = {
        for (var a in (apps as List)) (a['email'] as String).toLowerCase(): a,
      };

      return (profiles as List).map((p) {
        final profileMap = Map<String, dynamic>.from(p as Map);
        final email = (profileMap['email'] ?? '').toString().toLowerCase();
        final app = appMap[email];
        final applicationId = app?['id'];

        return {
          ...profileMap,
          'application_id': applicationId,
          'token': applicationId != null ? tokenMap[applicationId] : null,
        };
      }).toList();
    } catch (e) {
      debugPrint('[AdminSupabase] QR Directory error: $e');
      return [];
    }
  }

  static Future<Map<String, dynamic>> generateInternQR(
    String applicationId,
  ) async {
    // Generate 64-char hex token
    final token = List.generate(
      64,
      (_) => '0123456789abcdef'[DateTime.now().millisecond % 16],
    ).join();

    final response = await client
        .from('intern_qr_tokens')
        .insert([
          {'application_id': applicationId, 'token': token, 'is_active': true},
        ])
        .select()
        .single();
    return response;
  }

  static Future<void> updateIDCardURL(String tokenId, String url) async {
    await client
        .from('intern_qr_tokens')
        .update({'id_card_url': url})
        .eq('id', tokenId);
  }

  static Future<void> revokeInternQR(String tokenId) async {
    await client.from('intern_qr_tokens').delete().eq('id', tokenId);
  }

  // ═══════════════════════════════════════════════
  // MODIFICATIONS
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getModificationRequests() async {
    try {
      final data = await client
          .from('profile_modifications')
          .select('*, profiles(full_name, email)')
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Modifications error: $e');
      return [];
    }
  }

  static Future<void> approveModification(String id) async {
    await client
        .from('profile_modifications')
        .update({'status': 'approved'})
        .eq('id', id);
  }

  static Future<void> rejectModification(String id) async {
    await client
        .from('profile_modifications')
        .update({'status': 'rejected'})
        .eq('id', id);
  }

  static Future<void> deleteModificationRequest(String id) async {
    await client.from('profile_modifications').delete().eq('id', id);
  }

  // ═══════════════════════════════════════════════
  // AVAILABILITY
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getAvailability() async {
    try {
      final data = await client
          .from('availability')
          .select('*, profiles(full_name, email)')
          .order('date', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Availability error: $e');
      return [];
    }
  }

  static Future<void> createAvailability(Map<String, dynamic> data) async {
    await client.from('availability').insert([data]);
  }

  static Future<void> updateAvailability(
    String id,
    Map<String, dynamic> data,
  ) async {
    await client.from('availability').update(data).eq('id', id);
  }

  static Future<void> deleteAvailability(String id) async {
    await client.from('availability').delete().eq('id', id);
  }

  // ═══════════════════════════════════════════════
  // PAYMENTS
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getPayments() async {
    try {
      final data = await client
          .from('payments')
          .select('*, profiles(full_name, email)')
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Payments error: $e');
      return [];
    }
  }

  static Future<void> deletePayment(String id) async {
    await client.from('payments').delete().eq('id', id);
  }

  // ═══════════════════════════════════════════════
  // ACTIVITY LOGS
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getActivityLogs() async {
    try {
      final data = await client
          .from('admin_activity_logs')
          .select('*')
          .order('created_at', ascending: false)
          .limit(200);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Logs error: $e');
      return [];
    }
  }

  static Future<void> deleteActivityLog(String id) async {
    await client.from('admin_activity_logs').delete().eq('id', id);
  }

  // ═══════════════════════════════════════════════
  // PUSH NOTIFICATIONS (via Edge Function)
  // ═══════════════════════════════════════════════

  static Future<void> sendPushNotification({
    required String title,
    required String body,
    String? targetType,
    List<String>? targetIds,
  }) async {
    await client.functions.invoke(
      'send-push-notification',
      body: {
        'title': title,
        'body': body,
        'targetType': targetType ?? 'all',
        'targetIds': targetIds ?? [],
      },
    );
  }

  // ═══════════════════════════════════════════════
  // CUSTOM EMAIL (via Edge Function)
  // ═══════════════════════════════════════════════

  static Future<void> sendCustomEmail({
    required List<String> recipients,
    required String subject,
    required String body,
  }) async {
    await client.functions.invoke(
      'send-custom-email',
      body: {'recipients': recipients, 'subject': subject, 'body': body},
    );
  }

  // ═══════════════════════════════════════════════
  // UTILITY
  // ═══════════════════════════════════════════════

  static Future<List<Map<String, dynamic>>> getInternList() async {
    try {
      final data = await client
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .eq('role', 'intern')
          .order('full_name');
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      return [];
    }
  }

  static Future<List<Map<String, dynamic>>> getActiveBatches() async {
    try {
      final data = await client
          .from('batches')
          .select('id, name')
          .eq('is_active', true)
          .order('name');
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Batches error: $e');
      return [];
    }
  }

  // --- Access Controls (Locking) ---
  static Future<List<Map<String, dynamic>>> getAccessLocks() async {
    try {
      final data = await client
          .from('access_controls')
          .select('*, profiles(full_name, email)')
          .order('created_at', ascending: false);
      return List<Map<String, dynamic>>.from(data);
    } catch (e) {
      debugPrint('[AdminSupabase] Access locks error: $e');
      return [];
    }
  }

  static Future<void> createAccessLock({
    required String userId,
    required String pageIdentifier,
    required String reason,
  }) async {
    final adminId = client.auth.currentUser?.id;
    await client.from('access_controls').insert({
      'target_user_id': userId,
      'page_identifier': pageIdentifier,
      'reason': reason,
      'is_locked': true,
      'created_by': adminId,
    });
  }

  static Future<void> deleteAccessLock(String id) async {
    await client.from('access_controls').delete().eq('id', id);
  }

  // --- Form Settings (Scheduling & Lock) ---
  static Future<Map<String, dynamic>?> getFormSettings() async {
    try {
      final data = await client
          .from('form_settings')
          .select('*')
          .eq('id', '00000000-0000-0000-0000-000000000001')
          .maybeSingle();

      if (data == null) {
        debugPrint(
          '[AdminSupabase] Form settings row not found. Using defaults.',
        );
        return {
          'is_form_locked': false,
          'lock_message': '',
          'available_days': [1, 2, 3, 4, 5],
          'available_dates': [],
          'time_slots': [],
          'start_time': '09:00',
          'end_time': '18:00',
          'slot_interval': 30,
        };
      }
      return data;
    } catch (e) {
      debugPrint('[AdminSupabase] Form settings error: $e');
      return null;
    }
  }

  static Future<void> updateFormSettings(Map<String, dynamic> settings) async {
    // Ensure we are using the correct field names for the database
    // Web dashboard uses: available_days, available_dates, time_slots, is_form_locked, lock_message
    await client
        .from('form_settings')
        .update(settings)
        .eq('id', '00000000-0000-0000-0000-000000000001');
  }
}
