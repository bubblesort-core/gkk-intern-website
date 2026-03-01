import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:internmobileapp/theme/app_theme.dart';
import 'package:internmobileapp/screens/login_screen.dart';
import 'package:internmobileapp/screens/dashboard_shell.dart';
import 'package:internmobileapp/services/update_service.dart';
import 'package:internmobileapp/services/notification_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock orientation to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Initialize Firebase
  await Firebase.initializeApp();

  // Initialize Update Service (version check)
  await UpdateService().init();

  // Background message handler
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  // Initialize Supabase
  await Supabase.initialize(
    url: 'https://gkkintern.in/supabase-main',
    anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqcHN5eHFha3pyaHZ6ZWdlaHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NTI5NjMsImV4cCI6MjA4NDMyODk2M30.nfBtyd_doPQBkBfzHYtQ2q0yl1vf5y0QZPRrkHCOwAU',
  );

  runApp(const GkkInternApp());
}

class GkkInternApp extends StatelessWidget {
  const GkkInternApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'GKK Intern',
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
    final session = Supabase.instance.client.auth.currentSession;

    setState(() {
      _isAuthenticated = session != null;
      _isLoading = false;
    });

    // Initialize notifications (polling + FCM) on login
    if (_isAuthenticated) {
      NotificationService().initialize();
    }

    Supabase.instance.client.auth.onAuthStateChange.listen((data) {
      if (mounted) {
        final wasAuth = _isAuthenticated;
        setState(() => _isAuthenticated = data.session != null);
        if (!wasAuth && _isAuthenticated) {
          NotificationService().initialize();
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
