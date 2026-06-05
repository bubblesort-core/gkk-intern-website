import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';

// Import screens (to be created)
import '../screens/login_screen.dart';
import '../screens/no_account_screen.dart';
import '../screens/pending_screen.dart';
import '../screens/payment_required_screen.dart';
import '../screens/main_tabs.dart';
import '../screens/splash_screen.dart';
import '../screens/error_screen.dart';

class AppRouter {
  final AuthProvider authProvider;
  
  AppRouter(this.authProvider);

  late final router = GoRouter(
    initialLocation: '/splash',
    refreshListenable: authProvider,
    redirect: (context, state) {
      final loading = authProvider.loading;
      final session = authProvider.session;
      final profile = authProvider.profile;

      final isSplash = state.uri.path == '/splash';

      if (loading) {
        return isSplash ? null : '/splash';
      }

      if (session == null) {
        return '/login';
      }

      if (authProvider.errorMessage != null) {
        return '/error';
      }

      final hasApplication = profile?['application'] != null;
      final status = profile?['application']?['status']?.toString().toLowerCase();
      final isApproved = status == 'approved';
      final isPaid = profile?['userProfile']?['status'] == 'active';

      if (!hasApplication) {
        return '/no-account';
      }

      if (!isApproved) {
        return '/pending';
      }

      if (!isPaid) {
        return '/payment-required';
      }

      // If fully approved and paid, and currently on a non-dashboard path, send to dashboard
      if (state.uri.path == '/login' || 
          state.uri.path == '/splash' || 
          state.uri.path == '/no-account' || 
          state.uri.path == '/pending' || 
          state.uri.path == '/payment-required' ||
          state.uri.path == '/error') {
        return '/';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/no-account',
        builder: (context, state) => const NoAccountScreen(),
      ),
      GoRoute(
        path: '/pending',
        builder: (context, state) => const PendingScreen(),
      ),
      GoRoute(
        path: '/payment-required',
        builder: (context, state) => const PaymentRequiredScreen(),
      ),
      GoRoute(
        path: '/',
        builder: (context, state) => const MainTabs(),
      ),
      GoRoute(
        path: '/error',
        builder: (context, state) => const ErrorScreen(),
      ),
    ],
  );
}
