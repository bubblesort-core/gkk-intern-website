import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:internmobileapp/theme/app_theme.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:internmobileapp/services/update_service.dart';
import 'package:internmobileapp/screens/update_modal.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with WidgetsBindingObserver {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;
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
    _emailController.dispose();
    _passwordController.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  Future<void> _signIn() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      _showErrorSnackBar('Please enter both email and password.');
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final response = await Supabase.instance.client.auth.signInWithPassword(
        email: email,
        password: password,
      );

      if (response.user != null) {
        // Success: Fetch Profile
        final profileResponse = await Supabase.instance.client
            .from('profiles')
            .select('role, status')
            .eq('id', response.user!.id)
            .maybeSingle();

        if (profileResponse != null &&
            profileResponse['status'] == 'suspended') {
          _showErrorSnackBar(
            'Your account has been suspended. Please contact support.',
          );
          await Supabase.instance.client.auth.signOut();
        } else {
          // Normal flow - Navigate to Dashboard Features later
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Login Successful! Welcome to GKK Intern.'),
                backgroundColor: AppTheme.primary,
              ),
            );
            // AuthGate in main.dart handles navigation automatically
          }
        }
      }
    } on AuthException catch (e) {
      _showErrorSnackBar(
        e.message == 'Invalid login credentials'
            ? 'Incorrect email or password.'
            : e.message,
      );
    } catch (e) {
      _showErrorSnackBar(
        'An unexpected error occurred. Please try again later.',
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showErrorSnackBar(String message) {
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
                  // Top Border highlight matching web
                  Container(
                    height: 4,
                    decoration: const BoxDecoration(
                      color: AppTheme.primary,
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

                        // Header
                        Text(
                              'Welcome back',
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
                          'Please enter your details to sign in.',
                          style: Theme.of(context).textTheme.bodyMedium
                              ?.copyWith(color: AppTheme.textBody),
                        ).animate().fadeIn(delay: 200.ms, duration: 600.ms),
                        const SizedBox(height: 32),

                        // Form Fields
                        Text(
                          'Email',
                          style: Theme.of(context).textTheme.bodySmall
                              ?.copyWith(
                                color: AppTheme.textMuted,
                                fontWeight: FontWeight.w600,
                              ),
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          textInputAction: TextInputAction.next,
                          decoration: const InputDecoration(
                            hintText: 'Enter your email',
                          ),
                        ),
                        const SizedBox(height: 20),

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
                        const SizedBox(height: 24),

                        // Remember Me / Forgot Password (Visual placeholders mimicking requested strictness)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                SizedBox(
                                  height: 24,
                                  width: 24,
                                  child: Checkbox(
                                    value: true,
                                    onChanged: (val) {},
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
                            // Optional: Could add forgot password native flow later
                          ],
                        ),
                        const SizedBox(height: 32),

                        // Submit Button
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
                                  : const Text('Sign in'),
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
