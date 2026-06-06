import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:screen_protector/screen_protector.dart';
import 'core/supabase_client.dart';
import 'providers/auth_provider.dart';
import 'providers/dashboard_provider.dart';
import 'router/app_router.dart';
import 'theme/colors.dart';
import 'components/maintenance_guard.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Apply DRM and Screenshot Protection Globally
  await ScreenProtector.preventScreenshotOn();
  await ScreenProtector.protectDataLeakageOn();
  
  await SupabaseClientConfig.initialize();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProxyProvider<AuthProvider, DashboardProvider>(
          create: (_) => DashboardProvider(),
          update: (_, auth, dashboard) {
            dashboard ??= DashboardProvider();
            final userId = auth.profile?['userProfile']?['id'];
            if (userId != dashboard.currentUserId) {
              if (userId == null) {
                Future.microtask(() => dashboard!.clear());
              } else {
                Future.microtask(() => dashboard!.fetchDashboardData(userId));
              }
            }
            return dashboard;
          },
        ),
      ],
      child: Builder(
        builder: (context) {
          final authProvider = Provider.of<AuthProvider>(context, listen: false);
          final appRouter = AppRouter(authProvider).router;

          return MaterialApp.router(
            title: 'InternMobileApp',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              scaffoldBackgroundColor: AppColors.background,
              primaryColor: AppColors.primary,
              colorScheme: const ColorScheme.dark(
                primary: AppColors.primary,
                secondary: AppColors.secondary,
                surface: AppColors.card,
                error: AppColors.danger,
              ),
              useMaterial3: true,
            ),
            routerConfig: appRouter,
            builder: (context, child) {
              return MaintenanceGuard(child: child!);
            },
          );
        }
      ),
    );
  }
}
