import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Admin authentication service.
/// Uses `admin_credentials` table (username/auth_email) + Supabase Auth.
class AdminAuthService {
  static final AdminAuthService _instance = AdminAuthService._();
  factory AdminAuthService() => _instance;
  AdminAuthService._();

  static final client = Supabase.instance.client;

  static const _sessionKey = 'admin_session_data';
  static const _sessionExpiryKey = 'admin_session_expiry';

  // ─── SIGN IN ───
  /// Signs in with username (or email) + password.
  /// 1. Looks up `admin_credentials` for username or auth_email match
  /// 2. Signs into Supabase Auth with the linked auth_email + password
  /// 3. Saves session locally
  Future<Map<String, dynamic>?> signIn({
    required String username,
    required String password,
    bool rememberMe = false,
  }) async {
    try {
      // 1. Look up admin in admin_credentials
      final response = await client
          .from('admin_credentials')
          .select(
            'id, username, password_hash, display_name, is_active, auth_email',
          )
          .or('username.eq."$username",auth_email.eq."$username"')
          .eq('is_active', true)
          .maybeSingle();

      if (response == null) {
        throw Exception('Invalid username or password.');
      }

      // 2. Sign into Supabase Auth using auth_email
      final authEmail = response['auth_email'] ?? response['username'];

      final authResponse = await client.auth.signInWithPassword(
        email: authEmail,
        password: password,
      );

      if (authResponse.user == null) {
        throw Exception('Authentication failed.');
      }

      // 3. Update last_login
      try {
        await client
            .from('admin_credentials')
            .update({'last_login': DateTime.now().toIso8601String()})
            .eq('id', response['id']);
      } catch (_) {}

      // 4. Save session locally
      final prefs = await SharedPreferences.getInstance();
      final duration = rememberMe
          ? const Duration(days: 36500) // 100 years
          : const Duration(hours: 24);
      final expiry = DateTime.now().add(duration).millisecondsSinceEpoch;

      await prefs.setString(
        _sessionKey,
        '${response['id']}|${response['username']}|${response['display_name'] ?? 'Admin'}',
      );
      await prefs.setInt(_sessionExpiryKey, expiry);

      return {
        'id': response['id'],
        'username': response['username'],
        'displayName': response['display_name'] ?? 'Admin',
      };
    } on AuthException catch (e) {
      debugPrint('[AdminAuth] Auth error: ${e.message}');
      throw Exception(
        e.message == 'Invalid login credentials'
            ? 'Incorrect username or password.'
            : e.message,
      );
    } catch (e) {
      debugPrint('[AdminAuth] Sign-in error: $e');
      rethrow;
    }
  }

  // ─── SESSION CHECK ───
  Future<bool> isAuthenticated() async {
    try {
      final session = client.auth.currentSession;
      if (session == null) return false;

      final prefs = await SharedPreferences.getInstance();
      final expiry = prefs.getInt(_sessionExpiryKey);
      if (expiry != null && DateTime.now().millisecondsSinceEpoch > expiry) {
        await signOut();
        return false;
      }

      // Verify still an admin via admin_credentials
      final user = client.auth.currentUser;
      if (user == null) return false;

      final admin = await client
          .from('admin_credentials')
          .select('id')
          .eq('auth_email', user.email ?? '')
          .eq('is_active', true)
          .maybeSingle();

      return admin != null;
    } catch (e) {
      debugPrint('[AdminAuth] Session check error: $e');
      return false;
    }
  }

  // ─── GET CURRENT ADMIN ───
  Future<Map<String, dynamic>?> getCurrentAdmin() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final sessionData = prefs.getString(_sessionKey);
      if (sessionData == null) return null;

      final parts = sessionData.split('|');
      if (parts.length < 3) return null;

      return {'id': parts[0], 'username': parts[1], 'displayName': parts[2]};
    } catch (e) {
      return null;
    }
  }

  // ─── SIGN OUT ───
  Future<void> signOut() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_sessionKey);
      await prefs.remove(_sessionExpiryKey);
      await client.auth.signOut();
    } catch (e) {
      debugPrint('[AdminAuth] Sign-out error: $e');
    }
  }

  // ─── AUTH STATE STREAM ───
  Stream<AuthState> get authStateChanges => client.auth.onAuthStateChange;
}
