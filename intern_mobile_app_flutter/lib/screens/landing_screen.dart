import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:provider/provider.dart';
import '../theme/colors.dart';
import '../providers/auth_provider.dart';

class LandingScreen extends StatefulWidget {
  const LandingScreen({super.key});

  @override
  State<LandingScreen> createState() => _LandingScreenState();
}

class _LandingScreenState extends State<LandingScreen>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  late AnimationController _orb1Controller;
  late Animation<Offset> _orb1Anim;

  late AnimationController _orb2Controller;
  late Animation<Offset> _orb2Anim;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();

    _fadeController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900));
    _fadeAnim = Tween<double>(begin: 0, end: 1).animate(
        CurvedAnimation(parent: _fadeController, curve: Curves.easeOut));
    _slideAnim = Tween<Offset>(
            begin: const Offset(0, 30), end: Offset.zero)
        .animate(CurvedAnimation(
            parent: _fadeController, curve: Curves.easeOutCubic));

    _orb1Controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 6000))
      ..repeat(reverse: true);
    _orb1Anim = Tween<Offset>(
            begin: Offset.zero, end: const Offset(0, -20))
        .animate(
            CurvedAnimation(parent: _orb1Controller, curve: Curves.easeInOut));

    _orb2Controller = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 8000))
      ..repeat(reverse: true);
    _orb2Anim = Tween<Offset>(
            begin: Offset.zero, end: const Offset(15, 0))
        .animate(
            CurvedAnimation(parent: _orb2Controller, curve: Curves.easeInOut));

    _pulseController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 3000))
      ..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.04, end: 0.10).animate(
        CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut));

    _fadeController.forward();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _orb1Controller.dispose();
    _orb2Controller.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _launchMerchandise() async {
    final uri = Uri.parse('https://www.gkkintern.in/merchandise');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final authProvider = context.watch<AuthProvider>();
    final isLoggedIn = authProvider.session != null;

    return Scaffold(
      backgroundColor: AppColors.background,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      drawer: Drawer(
        backgroundColor: AppColors.background,
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const DrawerHeader(
              decoration: BoxDecoration(
                color: AppColors.card,
                border: Border(bottom: BorderSide(color: AppColors.border)),
              ),
              child: Align(
                alignment: Alignment.bottomLeft,
                child: Text('GKK Interns',
                    style: TextStyle(
                        color: AppColors.primary,
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 2)),
              ),
            ),
            if (!isLoggedIn)
              ListTile(
                leading: const Icon(Icons.login, color: AppColors.primary),
                title: const Text('Login', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(context);
                  context.go('/login');
                },
              ),
            if (isLoggedIn)
              ListTile(
                leading: const Icon(Icons.dashboard, color: AppColors.primary),
                title: const Text('Dashboard', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(context);
                  context.go('/');
                },
              ),
          ],
        ),
      ),
      body: Stack(
        children: [
          // ── Ambient Orbs ──
          AnimatedBuilder(
            animation:
                Listenable.merge([_orb1Controller, _orb2Controller, _pulseController]),
            builder: (context, _) => Stack(
              children: [
                Positioned(
                  top: -80 + _orb1Anim.value.dy,
                  right: -60,
                  child: Opacity(
                    opacity: _pulseAnim.value,
                    child: Container(
                      width: 260,
                      height: 260,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 80 + _orb2Anim.value.dy,
                  left: -60 + _orb2Anim.value.dx,
                  child: Opacity(
                    opacity: _pulseAnim.value,
                    child: Container(
                      width: 180,
                      height: 180,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: AppColors.secondary,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // ── Grid Lines ──
          Positioned(
              top: size.height * 0.2,
              left: 0,
              right: 0,
              child:
                  Container(height: 1, color: const Color(0x05ffffff))),
          Positioned(
              top: size.height * 0.5,
              left: 0,
              right: 0,
              child:
                  Container(height: 1, color: const Color(0x05ffffff))),
          Positioned(
              top: size.height * 0.8,
              left: 0,
              right: 0,
              child:
                  Container(height: 1, color: const Color(0x05ffffff))),

          // ── Main Content ──
          Positioned.fill(
            bottom: isLoggedIn ? 100 : 160, // Space for sticky CTA
            child: SafeArea(
              bottom: false,
              child: AnimatedBuilder(
                animation: _fadeController,
                builder: (context, _) => Opacity(
                  opacity: _fadeAnim.value,
                  child: Transform.translate(
                    offset: _slideAnim.value,
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        const SizedBox(height: 40),

                        // ── Logo ──
                        Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            color: AppColors.elevated,
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(color: AppColors.glassBorder),
                            boxShadow: [
                              BoxShadow(
                                color:
                                    AppColors.primary.withValues(alpha: 0.25),
                                offset: const Offset(0, 6),
                                blurRadius: 16,
                              )
                            ],
                          ),
                          alignment: Alignment.center,
                          child: const Text('GKK',
                              style: TextStyle(
                                  color: AppColors.primary,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 2)),
                        ),
                        const SizedBox(height: 20),

                        // ── Hero Title ──
                        const Text(
                          'GKK',
                          style: TextStyle(
                            fontSize: 72,
                            fontWeight: FontWeight.w900,
                            color: AppColors.text,
                            letterSpacing: -2,
                            height: 0.9,
                          ),
                        ),
                        Text(
                          'INTERNS',
                          style: TextStyle(
                            fontSize: 36,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 8,
                            color: AppColors.text.withValues(alpha: 0.35),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // ── Tagline ──
                        const Text(
                          'Code. Build. Deploy.',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: AppColors.primary,
                            letterSpacing: 3,
                          ),
                        ),
                        const SizedBox(height: 32),

                        // ── About Blurb ──
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: const Text(
                            'GKK Interns was built to close the gap between classroom theory and industry execution. A do-first ecosystem where interns ship real features, contribute to active products, and graduate with proof of work — not just certificates.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 14,
                              height: 1.6,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // ── Info Chips ──
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          alignment: WrapAlignment.center,
                          children: [
                            _InfoChip(icon: Icons.code, label: 'Full-Stack'),
                            _InfoChip(icon: Icons.psychology, label: 'AI / ML'),
                            _InfoChip(icon: Icons.brush, label: 'UX Design'),
                            _InfoChip(icon: Icons.cloud, label: 'Cloud'),
                          ],
                        ),
                        const SizedBox(height: 36),

                        // ── Feature Sections ──
                        const SizedBox(height: 10),
                        const _SectionTitle(title: 'WHY GKK INTERNS?'),
                        const SizedBox(height: 20),
                        const _FeatureCard(
                          icon: Icons.rocket_launch,
                          title: 'Real-World Impact',
                          description: 'No mock projects. You will ship code to production and see real users interact with your work.',
                        ),
                        const SizedBox(height: 16),
                        const _FeatureCard(
                          icon: Icons.groups,
                          title: 'Elite Mentorship',
                          description: 'Work alongside industry veterans who will review your code and push you to your absolute limits.',
                        ),
                        const SizedBox(height: 16),
                        const _FeatureCard(
                          icon: Icons.military_tech,
                          title: 'Proof of Work',
                          description: 'Graduate with a portfolio of verifiable commits, a polished resume, and a certificate that actually matters.',
                        ),

                        const SizedBox(height: 40),
                        const _SectionTitle(title: 'THE PROCESS'),
                        const SizedBox(height: 24),
                        const _TimelineStep(step: '01', title: 'Apply', description: 'Submit your profile and past work.'),
                        const _TimelineStep(step: '02', title: 'Interview', description: 'Technical discussion and vibe check.'),
                        const _TimelineStep(step: '03', title: 'Build', description: 'Join a team and start shipping.'),
                        const _TimelineStep(step: '04', title: 'Graduate', description: 'Earn your badges and recommendations.'),

                        const SizedBox(height: 40),
                        const _SectionTitle(title: 'OUR ALUMNI'),
                        const SizedBox(height: 20),
                        SizedBox(
                          height: 220,
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            physics: const BouncingScrollPhysics(),
                            children: const [
                              _AlumniVideoCard(
                                name: 'Sarah Jenkins',
                                company: 'Google',
                                videoId: 'dQw4w9WgXcQ',
                                thumbnailUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=60',
                              ),
                              _AlumniVideoCard(
                                name: 'David Chen',
                                company: 'Amazon',
                                videoId: 'jNQXAC9IVRw',
                                thumbnailUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=60',
                              ),
                              _AlumniVideoCard(
                                name: 'Priya Sharma',
                                company: 'Microsoft',
                                videoId: 'dQw4w9WgXcQ',
                                thumbnailUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=500&auto=format&fit=crop&q=60',
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 40),

                        // ── Merchandise Section ──
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Column(
                            children: [
                              const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.shopping_bag_outlined,
                                      color: AppColors.primary, size: 20),
                                  SizedBox(width: 8),
                                  Text('MERCHANDISE',
                                      style: TextStyle(
                                          color: AppColors.text,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w800,
                                          letterSpacing: 3)),
                                ],
                              ),
                              const SizedBox(height: 10),
                              const Text(
                                'T-Shirts • Stickers • Posters\nCustomized on demand with premium fabric.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                    color: AppColors.textSecondary,
                                    fontSize: 13,
                                    height: 1.5),
                              ),
                              const SizedBox(height: 14),
                              Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  onTap: _launchMerchandise,
                                  borderRadius: BorderRadius.circular(10),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 20, vertical: 10),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                          color: AppColors.primary
                                              .withValues(alpha: 0.4)),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text('Browse Store',
                                            style: TextStyle(
                                                color: AppColors.primary,
                                                fontSize: 13,
                                                fontWeight: FontWeight.w700)),
                                        SizedBox(width: 6),
                                        Icon(Icons.open_in_new,
                                            color: AppColors.primary,
                                            size: 14),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 36),

                        // ── Contact Info ──
                        Text(
                          'info@gkkintern.in',
                          style: TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              letterSpacing: 1),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'www.gkkintern.in',
                          style: TextStyle(
                              color: AppColors.textFaint,
                              fontSize: 11,
                              letterSpacing: 1),
                        ),
                        const SizedBox(height: 40),

                        // ── Bottom Branding ──
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                                width: 4,
                                height: 4,
                                decoration: BoxDecoration(
                                    color: AppColors.primary
                                        .withValues(alpha: 0.5),
                                    shape: BoxShape.circle)),
                            const SizedBox(width: 8),
                            const Text('GKK INTERNS',
                                style: TextStyle(
                                    color: AppColors.textFaint,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    letterSpacing: 4)),
                            const SizedBox(width: 8),
                            Container(
                                width: 4,
                                height: 4,
                                decoration: BoxDecoration(
                                    color: AppColors.primary
                                        .withValues(alpha: 0.5),
                                    shape: BoxShape.circle)),
                          ],
                        ),
                        const SizedBox(height: 30),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
          ),

          // ── Sticky Bottom CTA ──
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.only(left: 24, right: 24, bottom: 30, top: 20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppColors.background.withValues(alpha: 0.0),
                    AppColors.background.withValues(alpha: 0.8),
                    AppColors.background,
                  ],
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (!isLoggedIn) ...[
                    _PrimaryActionButton(
                      text: 'APPLY NOW',
                      onPressed: () => context.go('/apply'),
                    ),
                    const SizedBox(height: 12),
                    _SecondaryActionButton(
                      text: 'Already an Intern? Login',
                      onPressed: () => context.go('/login'),
                    ),
                  ],
                  if (isLoggedIn)
                    _PrimaryActionButton(
                      text: 'GO TO DASHBOARD',
                      onPressed: () => context.go('/'),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Reusable Widgets ──

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.primaryMuted,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: AppColors.primary, size: 14),
          const SizedBox(width: 6),
          Text(label,
              style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 12,
                  fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

class _PrimaryActionButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  const _PrimaryActionButton(
      {required this.text, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.35),
              offset: const Offset(0, 6),
              blurRadius: 16,
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onPressed,
            borderRadius: BorderRadius.circular(14),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 18),
              child: Center(
                child: Text(text,
                    style: const TextStyle(
                        color: Color(0xFF0a0a0f),
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 3)),
              ),
            ),
          ),
        ),
      ),
    );
  }
}


class _SecondaryActionButton extends StatelessWidget {
  final String text;
  final VoidCallback onPressed;
  const _SecondaryActionButton(
      {required this.text, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.glassBorder),
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onPressed,
            borderRadius: BorderRadius.circular(14),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: Text(text,
                    style: const TextStyle(
                        color: AppColors.text,
                        fontSize: 14,
                        fontWeight: FontWeight.w600)),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 24,
          height: 2,
          color: AppColors.primary,
        ),
        const SizedBox(width: 12),
        Text(title,
            style: const TextStyle(
                color: AppColors.text,
                fontSize: 14,
                fontWeight: FontWeight.w800,
                letterSpacing: 2)),
      ],
    );
  }
}

class _FeatureCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  const _FeatureCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: AppColors.primary, size: 24),
          ),
          const SizedBox(height: 16),
          Text(title,
              style: const TextStyle(
                  color: AppColors.text,
                  fontSize: 18,
                  fontWeight: FontWeight.w800)),
          const SizedBox(height: 8),
          Text(description,
              style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                  height: 1.5,
                  fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _TimelineStep extends StatelessWidget {
  final String step;
  final String title;
  final String description;
  const _TimelineStep({
    required this.step,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(step,
              style: TextStyle(
                  color: AppColors.primary.withValues(alpha: 0.5),
                  fontSize: 24,
                  fontWeight: FontWeight.w900)),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: const TextStyle(
                        color: AppColors.text,
                        fontSize: 18,
                        fontWeight: FontWeight.w800)),
                const SizedBox(height: 4),
                Text(description,
                    style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 14,
                        fontWeight: FontWeight.w500)),
              ],
            ),
          )
        ],
      ),
    );
  }
}

class _AlumniVideoCard extends StatelessWidget {
  final String name;
  final String company;
  final String videoId;
  final String thumbnailUrl;

  const _AlumniVideoCard({
    required this.name,
    required this.company,
    required this.videoId,
    required this.thumbnailUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 280,
      margin: const EdgeInsets.only(right: 16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: Stack(
          children: [
            // Thumbnail Image
            Positioned.fill(
              child: Image.network(
                thumbnailUrl,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: AppColors.card,
                  child: const Icon(Icons.person, color: AppColors.textMuted, size: 50),
                ),
              ),
            ),
            // Gradient Overlay
            Positioned.fill(
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withValues(alpha: 0.8),
                    ],
                  ),
                ),
              ),
            ),
            // Play Button Center
            Center(
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    context.push('/video', extra: {'videoId': videoId, 'title': '\$name @ \$company'});
                  },
                  borderRadius: BorderRadius.circular(30),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.9),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.4),
                          blurRadius: 10,
                          spreadRadius: 2,
                        )
                      ],
                    ),
                    child: const Icon(Icons.play_arrow, color: Colors.black, size: 30),
                  ),
                ),
              ),
            ),
            // Text Details Bottom
            Positioned(
              left: 16,
              bottom: 16,
              right: 16,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name,
                      style: const TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.w800)),
                  Text(company,
                      style: const TextStyle(
                          color: AppColors.primary,
                          fontSize: 13,
                          fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
