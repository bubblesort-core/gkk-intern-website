import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/screens/login_screen.dart';
import 'package:admin_mobile_app/screens/dashboard_shell.dart';
import 'package:admin_mobile_app/services/update_service.dart';
import 'package:admin_mobile_app/services/admin_auth_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock orientation to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Initialize Firebase
  await Firebase.initializeApp();

  // Initialize Supabase first (needed by auth and services)
  await Supabase.initialize(
    url: 'https://gkkintern.in/supabase-main',
    anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcHN5eHFha3pyaHZ6ZWdlaHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTI5NjMsImV4cCI6MjA4NDMyODk2M30.nfBtyd_doPQBkBfzHYtQ2q0yl1vf5y0QZPRrkHCOwAU',
    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
  );

  // Initialize Update Service (uses Firebase Remote Config)
  await UpdateService().init();

  runApp(const GkkAdminApp());
}

class GkkAdminApp extends StatelessWidget {
  const GkkAdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GKK Admin',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _isLoading = true;
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    _checkStatus();
  }

  Future<void> _checkStatus() async {
    final isAuth = await AdminAuthService().isAuthenticated();

    setState(() {
      _isAuthenticated = isAuth;
      _isLoading = false;
    });

    Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      if (mounted) {
        if (data.event == AuthChangeEvent.signedOut) {
          setState(() => _isAuthenticated = false);
        } else if (data.event == AuthChangeEvent.signedIn) {
          // Re-verify admin status
          AdminAuthService().isAuthenticated().then((isAdmin) {
            if (mounted) setState(() => _isAuthenticated = isAdmin);
          });
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppTheme.bgBody,
        body: Center(child: CircularProgressIndicator(color: AppTheme.primary)),
      );
    }

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 400),
      child: _isAuthenticated ? const DashboardShell() : const LoginScreen(),
    );
  }
}
