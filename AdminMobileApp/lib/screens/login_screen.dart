import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_auth_service.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:admin_mobile_app/services/update_service.dart';
import 'package:admin_mobile_app/screens/update_modal.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with WidgetsBindingObserver {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;
  bool _rememberMe = true;
  final _updateService = UpdateService();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Initial check when screen loads
    _updateService.checkForUpdate();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Refresh update status when app is opened/resumed
      _updateService.checkForUpdate();
    }
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  Future<void> _signIn() async {
    final username = _usernameController.text.trim();
    final password = _passwordController.text;

    if (username.isEmpty || password.isEmpty) {
      _showError('Please enter both username and password.');
      return;
    }

    setState(() => _isLoading = true);

    try {
      await AdminAuthService().signIn(
        username: username,
        password: password,
        rememberMe: _rememberMe,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Login Successful! Welcome, Admin.'),
            backgroundColor: AppTheme.primary,
          ),
        );
      }
    } catch (e) {
      _showError(e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(color: Colors.white)),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bgBody,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 480),
              decoration: BoxDecoration(
                color: AppTheme.bgCard,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.border),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 20,
                    offset: Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Top accent bar
                  Container(
                    height: 4,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppTheme.primary, AppTheme.accent],
                      ),
                      borderRadius: BorderRadius.vertical(
                        top: Radius.circular(16),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Update Banner (Only if available)
                        ValueListenableBuilder<bool>(
                          valueListenable: _updateService.updateAvailable,
                          builder: (context, available, _) {
                            if (!available) return const SizedBox.shrink();
                            return Container(
                              margin: const EdgeInsets.only(bottom: 24),
                              child: InkWell(
                                onTap: () => UpdateModal.show(context),
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 12,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primary.withValues(
                                      alpha: 0.1,
                                    ),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: AppTheme.primary.withValues(
                                        alpha: 0.3,
                                      ),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(
                                        Icons.system_update_rounded,
                                        color: AppTheme.primary,
                                        size: 20,
                                      ),
                                      const SizedBox(width: 12),
                                      const Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Update Available',
                                              style: TextStyle(
                                                color: AppTheme.textMain,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 13,
                                              ),
                                            ),
                                            Text(
                                              'New features and bug fixes are ready.',
                                              style: TextStyle(
                                                color: AppTheme.textMuted,
                                                fontSize: 11,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 10,
                                          vertical: 6,
                                        ),
                                        decoration: BoxDecoration(
                                          color: AppTheme.primary,
                                          borderRadius: BorderRadius.circular(
                                            8,
                                          ),
                                        ),
                                        child: const Text(
                                          'INSTALL',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontWeight: FontWeight.bold,
                                            fontSize: 10,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ).animate().fadeIn().slideY(begin: -0.2, end: 0);
                          },
                        ),

                        // Admin Shield Icon
                        Center(
                              child: Container(
                                width: 56,
                                height: 56,
                                decoration: BoxDecoration(
                                  color: AppTheme.primary.withValues(
                                    alpha: 0.15,
                                  ),
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: AppTheme.primary.withValues(
                                      alpha: 0.3,
                                    ),
                                  ),
                                ),
                                child: const Icon(
                                  Icons.admin_panel_settings,
                                  color: AppTheme.primary,
                                  size: 28,
                                ),
                              ),
                            )
                            .animate()
                            .fadeIn(duration: 600.ms)
                            .scale(
                              begin: const Offset(0.8, 0.8),
                              end: const Offset(1, 1),
                            ),
                        const SizedBox(height: 20),

                        // Header
                        Text(
                              'Admin Portal',
                              textAlign: TextAlign.center,
                              style: Theme.of(context).textTheme.headlineMedium
                                  ?.copyWith(
                                    color: AppTheme.textMain,
                                    fontWeight: FontWeight.bold,
                                  ),
                            )
                            .animate()
                            .fadeIn(duration: 600.ms)
                            .slideY(begin: 0.1, end: 0),
                        const SizedBox(height: 8),
                        Text(
                          'Sign in to manage the platform',
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: AppTheme.textMuted),
                        ).animate().fadeIn(delay: 200.ms, duration: 600.ms),
                        const SizedBox(height: 32),

                        // Username
                        Text(
                          'Username',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: AppTheme.textMuted,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _usernameController,
                          keyboardType: TextInputType.text,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            hintText: 'Enter username or email',
                            prefixIcon: Icon(
                              Icons.person_outline,
                              color: AppTheme.textMuted,
                              size: 20,
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Password
                        Text(
                          'Password',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: AppTheme.textMuted,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          textInputAction: TextInputAction.done,
                          onFieldSubmitted: (_) => _signIn(),
                          decoration: InputDecoration(
                            hintText: '••••••••',
                            prefixIcon: const Icon(
                              Icons.lock_outline,
                              color: AppTheme.textMuted,
                              size: 20,
                            ),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_off
                                    : Icons.visibility,
                                color: AppTheme.textMuted,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscurePassword = !_obscurePassword;
                                });
                              },
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Remember Me
                        Row(
                          children: [
                            SizedBox(
                              height: 24,
                              width: 24,
                              child: Checkbox(
                                value: _rememberMe,
                                onChanged: (val) {
                                  setState(() => _rememberMe = val ?? true);
                                },
                                activeColor: AppTheme.primary,
                              ),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Remember me',
                              style: Theme.of(context).textTheme.bodySmall
                                  ?.copyWith(color: AppTheme.textBody),
                            ),
                          ],
                        ),
                        const SizedBox(height: 32),

                        // Submit
                        ElevatedButton(
                              onPressed: _isLoading ? null : _signIn,
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 16,
                                ),
                              ),
                              child: _isLoading
                                  ? const SizedBox(
                                      height: 24,
                                      width: 24,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Text('Sign In'),
                            )
                            .animate()
                            .fadeIn(delay: 600.ms)
                            .scale(
                              begin: const Offset(0.9, 0.9),
                              end: const Offset(1, 1),
                            ),
                      ],
                    ).animate(delay: 400.ms).fadeIn(duration: 400.ms),
                  ),
                ],
              ).animate().fadeIn(duration: 800.ms).slideY(begin: 0.05, end: 0),
            ),
          ),
        ),
      ),
    );
  }
}
