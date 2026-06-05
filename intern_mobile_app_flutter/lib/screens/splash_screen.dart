import 'package:flutter/material.dart';
import '../theme/colors.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with TickerProviderStateMixin {
  late AnimationController _ringController;
  late Animation<double> _ringScale;
  late Animation<double> _ringOpacity;

  late AnimationController _logoController;
  late Animation<double> _logoScale;
  late Animation<double> _logoOpacity;

  late AnimationController _titleController;
  late Animation<double> _titleOpacity;
  late Animation<Offset> _titleTranslateY;

  late AnimationController _subtitleController;
  late Animation<double> _subtitleOpacity;
  late Animation<Offset> _subtitleTranslateY;

  late AnimationController _barController;
  late Animation<double> _barWidth;

  late AnimationController _particleController;
  late Animation<double> _particleOpacity1;
  late Animation<double> _particleOpacity2;
  late Animation<double> _particleOpacity3;
  late Animation<Offset> _particleY1;
  late Animation<Offset> _particleY2;
  late Animation<Offset> _particleY3;

  @override
  void initState() {
    super.initState();

    _ringController = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _ringScale = Tween<double>(begin: 0.5, end: 1.2).animate(CurvedAnimation(parent: _ringController, curve: Curves.easeOutBack));
    _ringOpacity = Tween<double>(begin: 0.0, end: 0.3).animate(CurvedAnimation(parent: _ringController, curve: Curves.easeIn));

    _logoController = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _logoScale = Tween<double>(begin: 0.3, end: 1.0).animate(CurvedAnimation(parent: _logoController, curve: Curves.elasticOut));
    _logoOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _logoController, curve: Curves.easeIn));

    _titleController = AnimationController(vsync: this, duration: const Duration(milliseconds: 500));
    _titleOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(_titleController);
    _titleTranslateY = Tween<Offset>(begin: const Offset(0, 30), end: Offset.zero).animate(CurvedAnimation(parent: _titleController, curve: Curves.easeOut));

    _subtitleController = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));
    _subtitleOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(_subtitleController);
    _subtitleTranslateY = Tween<Offset>(begin: const Offset(0, 20), end: Offset.zero).animate(CurvedAnimation(parent: _subtitleController, curve: Curves.easeOut));

    _barController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200));
    _barWidth = Tween<double>(begin: 0.0, end: 1.0).animate(_barController);

    _particleController = AnimationController(vsync: this, duration: const Duration(milliseconds: 2700));
    
    _particleOpacity1 = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 0.6), weight: 15),
      TweenSequenceItem(tween: ConstantTween(0.6), weight: 70),
      TweenSequenceItem(tween: Tween(begin: 0.6, end: 0.0), weight: 15),
    ]).animate(CurvedAnimation(parent: _particleController, curve: const Interval(0.0, 0.8)));
    
    _particleY1 = Tween<Offset>(begin: Offset.zero, end: const Offset(0, -60)).animate(CurvedAnimation(parent: _particleController, curve: const Interval(0.0, 0.8)));

    _particleOpacity2 = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 0.6), weight: 15),
      TweenSequenceItem(tween: ConstantTween(0.6), weight: 70),
      TweenSequenceItem(tween: Tween(begin: 0.6, end: 0.0), weight: 15),
    ]).animate(CurvedAnimation(parent: _particleController, curve: const Interval(0.1, 0.9)));
    
    _particleY2 = Tween<Offset>(begin: Offset.zero, end: const Offset(0, -60)).animate(CurvedAnimation(parent: _particleController, curve: const Interval(0.1, 0.9)));

    _particleOpacity3 = TweenSequence([
      TweenSequenceItem(tween: Tween(begin: 0.0, end: 0.6), weight: 15),
      TweenSequenceItem(tween: ConstantTween(0.6), weight: 70),
      TweenSequenceItem(tween: Tween(begin: 0.6, end: 0.0), weight: 15),
    ]).animate(CurvedAnimation(parent: _particleController, curve: const Interval(0.2, 1.0)));
    
    _particleY3 = Tween<Offset>(begin: Offset.zero, end: const Offset(0, -60)).animate(CurvedAnimation(parent: _particleController, curve: const Interval(0.2, 1.0)));

    _startAnimationSequence();
  }

  void _startAnimationSequence() async {
    await Future.delayed(const Duration(milliseconds: 200));
    _ringController.forward();
    
    await Future.delayed(const Duration(milliseconds: 200));
    _logoController.forward();
    // Fade out ring
    _ringOpacity = Tween<double>(begin: 0.3, end: 0.1).animate(CurvedAnimation(parent: _logoController, curve: Curves.easeIn));
    
    await Future.delayed(const Duration(milliseconds: 400));
    _titleController.forward();
    
    await Future.delayed(const Duration(milliseconds: 200));
    _subtitleController.forward();
    
    await Future.delayed(const Duration(milliseconds: 200));
    _barController.forward();
    
    await Future.delayed(const Duration(milliseconds: 200));
    _particleController.forward();

    // After everything, navigate away if we were just showing splash, 
    // but AppRouter will handle navigation automatically since refreshListenable triggers 
    // once auth loads. The React Native app waited for auth to load and then hid splash.
    // In Flutter, the splash screen will just be replaced by the router once loading is false.
  }

  @override
  void dispose() {
    _ringController.dispose();
    _logoController.dispose();
    _titleController.dispose();
    _subtitleController.dispose();
    _barController.dispose();
    _particleController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        alignment: Alignment.center,
        children: [
          // Background gradient dots
          Positioned(
            top: -50,
            right: -80,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0x0D22d87a),
              ),
            ),
          ),
          Positioned(
            bottom: 100,
            left: -60,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0x0806e4f9),
              ),
            ),
          ),
          Positioned(
            bottom: -30,
            right: 40,
            child: Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0x0A22d87a),
              ),
            ),
          ),

          // Glow Ring
          AnimatedBuilder(
            animation: _ringController,
            builder: (context, child) {
              return Transform.scale(
                scale: _ringScale.value,
                child: Opacity(
                  opacity: _ringOpacity.value,
                  child: Container(
                    width: 180,
                    height: 180,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.primary, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.5),
                          blurRadius: 30,
                        )
                      ],
                    ),
                  ),
                ),
              );
            },
          ),

          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              AnimatedBuilder(
                animation: _logoController,
                builder: (context, child) {
                  return Transform.scale(
                    scale: _logoScale.value,
                    child: Opacity(
                      opacity: _logoOpacity.value,
                      child: Container(
                        width: 100,
                        height: 100,
                        margin: const EdgeInsets.only(bottom: 24),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: AppColors.glassBorder),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.3),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            )
                          ],
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            const Text(
                              'GKK',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontSize: 32,
                                fontWeight: FontWeight.w900,
                                letterSpacing: 3,
                              ),
                            ),
                            Positioned(
                              bottom: 14,
                              right: 18,
                              child: Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppColors.secondary,
                                  shape: BoxShape.circle,
                                ),
                              ),
                            )
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),

              // Title
              AnimatedBuilder(
                animation: _titleController,
                builder: (context, child) {
                  return Transform.translate(
                    offset: _titleTranslateY.value,
                    child: Opacity(
                      opacity: _titleOpacity.value,
                      child: const Text(
                        'GKK INTERNS',
                        style: TextStyle(
                          color: AppColors.text,
                          fontSize: 28,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 6,
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 8),

              // Subtitle
              AnimatedBuilder(
                animation: _subtitleController,
                builder: (context, child) {
                  return Transform.translate(
                    offset: _subtitleTranslateY.value,
                    child: Opacity(
                      opacity: _subtitleOpacity.value,
                      child: const Text(
                        'Your Career Starts Here',
                        style: TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          letterSpacing: 2,
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 40),

              // Loading Bar
              AnimatedBuilder(
                animation: _barController,
                builder: (context, child) {
                  return Container(
                    width: 160,
                    height: 3,
                    decoration: BoxDecoration(
                      color: const Color(0x0FFFFFFF),
                      borderRadius: BorderRadius.circular(2),
                    ),
                    alignment: Alignment.centerLeft,
                    child: Container(
                      width: 160 * _barWidth.value,
                      height: 3,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(2),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.8),
                            blurRadius: 6,
                          )
                        ],
                      ),
                    ),
                  );
                },
              ),
            ],
          ),

          // Particles
          AnimatedBuilder(
            animation: _particleController,
            builder: (context, child) {
              return Stack(
                children: [
                  Positioned(
                    left: size.width * 0.3,
                    bottom: size.height * 0.35 - _particleY1.value.dy,
                    child: Opacity(
                      opacity: _particleOpacity1.value,
                      child: Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    right: size.width * 0.3,
                    bottom: size.height * 0.38 - _particleY2.value.dy,
                    child: Opacity(
                      opacity: _particleOpacity2.value,
                      child: Container(
                        width: 4,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    left: size.width * 0.55,
                    bottom: size.height * 0.33 - _particleY3.value.dy,
                    child: Opacity(
                      opacity: _particleOpacity3.value,
                      child: Container(
                        width: 5,
                        height: 5,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}
