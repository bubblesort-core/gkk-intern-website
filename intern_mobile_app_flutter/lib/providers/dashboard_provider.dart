import 'package:flutter/foundation.dart';
import '../core/supabase_client.dart';

class DashboardProvider extends ChangeNotifier {
  String? _currentUserId;
  Map<String, dynamic>? _currentTeam;
  List<dynamic> _currentProjects = [];
  List<dynamic> _workshops = [];
  bool _loadingDashboard = false;
  String? _errorMessage;

  String? get currentUserId => _currentUserId;
  Map<String, dynamic>? get currentTeam => _currentTeam;
  List<dynamic> get currentProjects => _currentProjects;
  List<dynamic> get workshops => _workshops;
  bool get loadingDashboard => _loadingDashboard;
  String? get errorMessage => _errorMessage;

  void clear() {
    _currentUserId = null;
    _currentTeam = null;
    _currentProjects = [];
    _workshops = [];
    _loadingDashboard = false;
    _errorMessage = null;
    notifyListeners();
  }

  Future<void> fetchDashboardData(String userId) async {
    _currentUserId = userId;
    _loadingDashboard = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final client = SupabaseClientConfig.client;

      // 1. Load Team and Projects
      final membershipList = await client
          .from('team_members')
          .select('team_id, role, teams(id, name, description, is_active, batch_id, created_at, batches(name), projects(id, title, status))')
          .eq('user_id', userId)
          .maybeSingle();

      if (membershipList != null && membershipList['teams'] != null) {
        final team = membershipList['teams'] as Map<String, dynamic>;
        
        // Get team members
        final membersList = await client
            .from('team_members')
            .select('id, user_id, role, profiles(id, full_name, email, avatar_url, github_url, linkedin_url)')
            .eq('team_id', team['id']);
            
        team['team_members'] = membersList;
        team['myRole'] = membershipList['role'];
        _currentTeam = team;
        
        // Get projects independently to include submissions
        final projectsData = await client
            .from('projects')
            .select('*, project_submissions(*)')
            .eq('assigned_team_id', team['id'])
            .order('created_at', ascending: false);
            
        _currentProjects = projectsData;
      }

      // 2. Load Active Workshops
      final workshopData = await client
          .from('workshops')
          .select()
          .eq('is_active', true)
          .order('created_at', ascending: false);
          
      _workshops = workshopData;

    } catch (err) {
      debugPrint('Error fetching dashboard data: $err');
      _errorMessage = 'Failed to load dashboard data.';
    } finally {
      _loadingDashboard = false;
      notifyListeners();
    }
  }
}
