import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/supabase_client.dart';
import '../theme/colors.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with TickerProviderStateMixin {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _otpController = TextEditingController();

  bool _loading = false;
  String _loginMode = 'otp'; // 'otp' or 'password'
  bool _otpSent = false;

  // Animations
  late AnimationController _cardController;
  late Animation<double> _cardOpacity;
  late Animation<Offset> _cardTranslateY;

  late AnimationController _orb1YController;
  late Animation<Offset> _orb1Y;
  
  late AnimationController _orb2XController;
  late Animation<Offset> _orb2X;

  late AnimationController _orb3ScaleController;
  late Animation<double> _orb3Scale;

  late AnimationController _glowPulseController;
  late Animation<double> _glowPulse;

  late AnimationController _borderGlowController;
  late Animation<double> _borderGlow;

  late AnimationController _shimmerController;
  late Animation<double> _shimmerOpacity;

  @override
  void initState() {
    super.initState();

    _cardController = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    _cardOpacity = Tween<double>(begin: 0, end: 1).animate(_cardController);
    _cardTranslateY = Tween<Offset>(begin: const Offset(0, 40), end: Offset.zero).animate(CurvedAnimation(parent: _cardController, curve: Curves.easeOutBack));

    _orb1YController = AnimationController(vsync: this, duration: const Duration(milliseconds: 6000))..repeat();
    _orb1Y = TweenSequence([
      TweenSequenceItem(tween: Tween<Offset>(begin: Offset.zero, end: const Offset(0, -25)), weight: 50),
      TweenSequenceItem(tween: Tween<Offset>(begin: const Offset(0, -25), end: Offset.zero), weight: 50),
    ]).animate(CurvedAnimation(parent: _orb1YController, curve: Curves.easeInOut));

    _orb2XController = AnimationController(vsync: this, duration: const Duration(milliseconds: 8000))..repeat();
    _orb2X = TweenSequence([
      TweenSequenceItem(tween: Tween<Offset>(begin: Offset.zero, end: const Offset(20, 0)), weight: 50),
      TweenSequenceItem(tween: Tween<Offset>(begin: const Offset(20, 0), end: Offset.zero), weight: 50),
    ]).animate(CurvedAnimation(parent: _orb2XController, curve: Curves.easeInOut));

    _orb3ScaleController = AnimationController(vsync: this, duration: const Duration(milliseconds: 5000))..repeat();
    _orb3Scale = TweenSequence([
      TweenSequenceItem(tween: Tween<double>(begin: 1.0, end: 1.3), weight: 50),
      TweenSequenceItem(tween: Tween<double>(begin: 1.3, end: 0.8), weight: 50),
    ]).animate(CurvedAnimation(parent: _orb3ScaleController, curve: Curves.easeInOut));

    _glowPulseController = AnimationController(vsync: this, duration: const Duration(milliseconds: 4000))..repeat();
    _glowPulse = TweenSequence([
      TweenSequenceItem(tween: Tween<double>(begin: 0.04, end: 0.09), weight: 50),
      TweenSequenceItem(tween: Tween<double>(begin: 0.09, end: 0.03), weight: 50),
    ]).animate(CurvedAnimation(parent: _glowPulseController, curve: Curves.easeInOut));

    _borderGlowController = AnimationController(vsync: this, duration: const Duration(milliseconds: 6000))..repeat();
    _borderGlow = TweenSequence([
      TweenSequenceItem(tween: Tween<double>(begin: 0.0, end: 1.0), weight: 50),
      TweenSequenceItem(tween: Tween<double>(begin: 1.0, end: 0.0), weight: 50),
    ]).animate(CurvedAnimation(parent: _borderGlowController, curve: Curves.easeInOut));

    _shimmerController = AnimationController(vsync: this, duration: const Duration(milliseconds: 5000))..repeat();
    _shimmerOpacity = TweenSequence([
      TweenSequenceItem(tween: Tween<double>(begin: 0.85, end: 1.0), weight: 50),
      TweenSequenceItem(tween: Tween<double>(begin: 1.0, end: 0.85), weight: 50),
    ]).animate(CurvedAnimation(parent: _shimmerController, curve: Curves.easeInOut));

    _cardController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _otpController.dispose();

    _cardController.dispose();
    _orb1YController.dispose();
    _orb2XController.dispose();
    _orb3ScaleController.dispose();
    _glowPulseController.dispose();
    _borderGlowController.dispose();
    _shimmerController.dispose();
    super.dispose();
  }



  void _showError(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.card,
        title: Text(title, style: const TextStyle(color: AppColors.text)),
        content: Text(message, style: const TextStyle(color: AppColors.textMuted)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK', style: TextStyle(color: AppColors.primary)),
          ),
        ],
      ),
    );
  }

  Future<void> _handleSendOtp() async {
    final email = _emailController.text;
    if (email.isEmpty) {
      _showError('Error', 'Please enter a valid email.');
      return;
    }

    setState(() => _loading = true);



    try {
      await SupabaseClientConfig.client.auth.signInWithOtp(email: email.trim());
      setState(() => _otpSent = true);
      _showError('Check your inbox', 'An OTP has been sent to your email.');
    } catch (error) {
      _showError('Login Failed', error.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _handleVerifyOtp() async {
    final email = _emailController.text;
    final otp = _otpController.text;
    if (email.isEmpty || otp.isEmpty) {
      _showError('Error', 'Please enter both email and OTP.');
      return;
    }

    setState(() => _loading = true);
    try {
      await SupabaseClientConfig.client.auth.verifyOTP(
        type: OtpType.email,
        email: email.trim(),
        token: otp.trim(),
      );
      // Auth provider will catch the session change
    } catch (error) {
      _showError('Verification Failed', error.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _handlePasswordLogin() async {
    final email = _emailController.text;
    final password = _passwordController.text;
    if (email.isEmpty || password.isEmpty) {
      _showError('Error', 'Please enter both email and password.');
      return;
    }

    setState(() => _loading = true);



    try {
      await SupabaseClientConfig.client.auth.signInWithPassword(
        email: email.trim(),
        password: password.trim(),
      );
      // Auth provider catches state
    } catch (error) {
      _showError('Login Failed', error.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // Ambient Orbs
          AnimatedBuilder(
            animation: Listenable.merge([_orb1YController, _orb2XController, _orb3ScaleController, _glowPulseController]),
            builder: (context, child) {
              return Stack(
                children: [
                  Positioned(
                    top: -60 + _orb1Y.value.dy,
                    right: -80 + _orb1Y.value.dx,
                    child: Opacity(
                      opacity: _glowPulse.value,
                      child: Container(
                        width: 280,
                        height: 280,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: 60 + _orb2X.value.dy,
                    left: -70 + _orb2X.value.dx,
                    child: Opacity(
                      opacity: _glowPulse.value,
                      child: Container(
                        width: 200,
                        height: 200,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.secondary,
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -20,
                    right: 50,
                    child: Opacity(
                      opacity: _glowPulse.value,
                      child: Transform.scale(
                        scale: _orb3Scale.value,
                        child: Container(
                          width: 120,
                          height: 120,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),

          // Grid lines
          Positioned(top: size.height * 0.2, left: 0, right: 0, child: Container(height: 1, color: const Color(0x05ffffff))),
          Positioned(top: size.height * 0.5, left: 0, right: 0, child: Container(height: 1, color: const Color(0x05ffffff))),
          Positioned(top: size.height * 0.8, left: 0, right: 0, child: Container(height: 1, color: const Color(0x05ffffff))),

          // Main Card
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: AnimatedBuilder(
                animation: Listenable.merge([_cardController, _borderGlowController]),
                builder: (context, child) {
                  final glowColor = Color.lerp(
                    const Color(0x1422d87a), 
                    const Color(0x4022d87a), 
                    _borderGlow.value
                  )!;

                  return Transform.translate(
                    offset: _cardTranslateY.value,
                    child: Opacity(
                      opacity: _cardOpacity.value,
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: glowColor),
                        ),
                        child: Container(
                          padding: const EdgeInsets.all(28),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(19),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Logo Mark
                              Container(
                                width: 56,
                                height: 56,
                                margin: const EdgeInsets.only(bottom: 20),
                                decoration: BoxDecoration(
                                  color: AppColors.elevated,
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: AppColors.glassBorder),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primary.withValues(alpha: 0.2),
                                      offset: const Offset(0, 4),
                                      blurRadius: 12,
                                    )
                                  ],
                                ),
                                alignment: Alignment.center,
                                child: const Text('GKK', style: TextStyle(color: AppColors.primary, fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: 2)),
                              ),

                              const Text('Welcome Back', style: TextStyle(color: AppColors.text, fontSize: 26, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 6),
                              Text(
                                _otpSent ? 'Enter the OTP sent to your email.' : 'Sign in to access your intern dashboard.',
                                style: const TextStyle(color: AppColors.textMuted, fontSize: 14, height: 1.4),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 28),

                              // Email Input
                              Container(
                                margin: const EdgeInsets.only(bottom: 14),
                                decoration: BoxDecoration(
                                  color: AppColors.elevated,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: TextField(
                                  controller: _emailController,
                                  enabled: !_otpSent,
                                  style: TextStyle(color: _otpSent ? AppColors.text.withValues(alpha: 0.5) : AppColors.text, fontSize: 16),
                                  keyboardType: TextInputType.emailAddress,
                                  decoration: const InputDecoration(
                                    hintText: 'Email address',
                                    hintStyle: TextStyle(color: AppColors.textFaint),
                                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                    border: InputBorder.none,
                                  ),
                                ),
                              ),

                              if (!_otpSent && _loginMode == 'password')
                                Container(
                                  margin: const EdgeInsets.only(bottom: 14),
                                  decoration: BoxDecoration(
                                    color: AppColors.elevated,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: AppColors.border),
                                  ),
                                  child: TextField(
                                    controller: _passwordController,
                                    obscureText: true,
                                    style: const TextStyle(color: AppColors.text, fontSize: 16),
                                    decoration: const InputDecoration(
                                      hintText: 'Password',
                                      hintStyle: TextStyle(color: AppColors.textFaint),
                                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                      border: InputBorder.none,
                                    ),
                                  ),
                                ),

                              if (_otpSent)
                                Container(
                                  margin: const EdgeInsets.only(bottom: 14),
                                  decoration: BoxDecoration(
                                    color: AppColors.elevated,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: AppColors.border),
                                  ),
                                  child: TextField(
                                    controller: _otpController,
                                    keyboardType: TextInputType.number,
                                    autofocus: true,
                                    style: const TextStyle(color: AppColors.text, fontSize: 16),
                                    decoration: const InputDecoration(
                                      hintText: 'Enter OTP',
                                      hintStyle: TextStyle(color: AppColors.textFaint),
                                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                                      border: InputBorder.none,
                                    ),
                                  ),
                                ),

                              if (!_otpSent) ...[
                                AnimatedBuilder(
                                  animation: _shimmerController,
                                  builder: (context, child) {
                                    return Opacity(
                                      opacity: _shimmerOpacity.value,
                                      child: _PrimaryButton(
                                        loading: _loading,
                                        text: _loginMode == 'otp' ? 'Send Login OTP' : 'Login with Password',
                                        onPressed: _loginMode == 'otp' ? _handleSendOtp : _handlePasswordLogin,
                                      ),
                                    );
                                  }
                                ),
                                TextButton(
                                  onPressed: () => setState(() => _loginMode = _loginMode == 'otp' ? 'password' : 'otp'),
                                  child: Text(
                                    _loginMode == 'otp' ? 'Switch to Password Login' : 'Switch to Email OTP Login',
                                    style: const TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w500),
                                  ),
                                )
                              ] else ...[
                                AnimatedBuilder(
                                  animation: _shimmerController,
                                  builder: (context, child) {
                                    return Opacity(
                                      opacity: _shimmerOpacity.value,
                                      child: _PrimaryButton(
                                        loading: _loading,
                                        text: 'Verify OTP',
                                        onPressed: _handleVerifyOtp,
                                      ),
                                    );
                                  }
                                ),
                                TextButton(
                                  onPressed: () {
                                    setState(() {
                                      _otpSent = false;
                                      _otpController.clear();
                                    });
                                  },
                                  child: const Text('← Go back', style: TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w500)),
                                )
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          // Bottom Branding
          Positioned(
            bottom: 40,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(width: 4, height: 4, decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.5), shape: BoxShape.circle)),
                const SizedBox(width: 8),
                const Text('GKK INTERNS', style: TextStyle(color: AppColors.textFaint, fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 4)),
                const SizedBox(width: 8),
                Container(width: 4, height: 4, decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.5), shape: BoxShape.circle)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _PrimaryButton extends StatelessWidget {
  final bool loading;
  final String text;
  final VoidCallback onPressed;

  const _PrimaryButton({required this.loading, required this.text, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.3),
            offset: const Offset(0, 4),
            blurRadius: 12,
          )
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: loading ? null : onPressed,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Center(
              child: loading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Color(0xFF0a0a0f), strokeWidth: 2),
                    )
                  : Text(
                      text,
                      style: const TextStyle(color: Color(0xFF0a0a0f), fontSize: 16, fontWeight: FontWeight.w700),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}
