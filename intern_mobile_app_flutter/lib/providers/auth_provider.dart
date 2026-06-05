import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';

class AuthProvider extends ChangeNotifier {
  Session? _session;
  Map<String, dynamic>? _profile;
  bool _loading = true;
  String? _errorMessage;

  Session? get session => _session;
  Map<String, dynamic>? get profile => _profile;
  bool get loading => _loading;
  String? get errorMessage => _errorMessage;

  AuthProvider() {
    _init();
  }

  void _init() {
    final client = SupabaseClientConfig.client;

    client.auth.onAuthStateChange.listen((data) {
      final session = data.session;
      _session = session;
      if (session != null) {
        _fetchProfile(session.user);
      } else {
        _profile = null;
        _loading = false;
        _errorMessage = null;
        notifyListeners();
      }
    });
  }

  Future<void> _fetchProfile(User user) async {
    final client = SupabaseClientConfig.client;
    try {
      _errorMessage = null;
      // 1. Fetch Application data
      final appDataList = await client
          .from('applications')
          .select()
          .eq('email', user.email ?? '')
          .limit(1);
      final appData = appDataList.isNotEmpty ? appDataList.first : null;

      // 2. Fetch Profile data
      final profileDataList = await client
          .from('profiles')
          .select()
          .eq('id', user.id)
          .limit(1);
      final profileData = profileDataList.isNotEmpty ? profileDataList.first : null;

      _profile = {
        'application': appData,
        'userProfile': profileData,
      };
    } catch (error) {
      debugPrint('Error fetching profile: $error');
      _errorMessage = 'Failed to load profile. Please check your connection.';
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> refreshProfile() async {
    if (_session?.user != null) {
      _loading = true;
      notifyListeners();
      await _fetchProfile(_session!.user);
    }
  }
}
