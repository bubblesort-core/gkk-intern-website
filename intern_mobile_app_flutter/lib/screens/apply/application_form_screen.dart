import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:file_picker/file_picker.dart';
import 'package:go_router/go_router.dart';
import '../../core/supabase_client.dart';
import '../../theme/colors.dart';
import '../../services/application_service.dart';

class ApplicationFormScreen extends StatefulWidget {
  const ApplicationFormScreen({super.key});

  @override
  State<ApplicationFormScreen> createState() => _ApplicationFormScreenState();
}

class _ApplicationFormScreenState extends State<ApplicationFormScreen>
    with TickerProviderStateMixin {
  int _currentStep = 0; // 0-indexed
  bool _isSubmitting = false;
  bool _isFormLocked = false;
  String _lockMessage = '';
  bool _isCheckingLock = true;
  String? _activeBatch;

  // Step 1 — Identity
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _collegeController = TextEditingController();
  final _phoneController = TextEditingController();
  final _whatsappController = TextEditingController();
  final _ageController = TextEditingController();
  String _sex = '';

  // OTP Verification
  bool _otpSent = false;
  bool _emailVerified = false;
  final _otpController = TextEditingController();

  // Step 2 — Resume & Links
  PlatformFile? _cvFile;
  final _linkedinController = TextEditingController();
  final _githubController = TextEditingController();
  final _portfolioController = TextEditingController();

  // Step 3 — Schedule
  String? _interviewDate;
  String? _interviewTime;
  List<String> _availableTimeSlots = [];
  Map<String, int> _bookedSlots = {};
  int _maxPerSlot = 5;
  List<int> _availableDays = [];
  List<String> _availableDates = [];
  Map<String, List<String>> _specificDateTimes = {};

  // Step 4 — Additional
  final List<String> _selectedInterests = [];
  bool _termsAccepted = false;

  final _allInterests = [
    'Full-Stack Development',
    'Frontend Development',
    'Backend Development',
    'Mobile Development',
    'AI / Machine Learning',
    'Data Science',
    'UX / UI Design',
    'Cloud & DevOps',
    'Cybersecurity',
    'Blockchain',
    'Game Development',
    'Other',
  ];

  late AnimationController _fadeController;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 400));
    _fadeAnim = Tween<double>(begin: 0, end: 1)
        .animate(CurvedAnimation(parent: _fadeController, curve: Curves.easeOut));
    _fadeController.forward();
    _checkFormLock();
  }

  Future<void> _checkFormLock() async {
    try {
      final response = await SupabaseClientConfig.client
          .from('form_settings')
          .select('is_form_locked, lock_message, active_batch, available_days, available_dates, specific_date_times, time_slots, max_per_slot')
          .eq('id', '00000000-0000-0000-0000-000000000001')
          .single();

      if (mounted) {
        setState(() {
          _isFormLocked = response['is_form_locked'] == true;
          _lockMessage = response['lock_message'] ?? '';
          _activeBatch = response['active_batch'];
          _availableDays = List<int>.from(response['available_days'] ?? []);
          _availableDates = List<String>.from(response['available_dates'] ?? []);
          _specificDateTimes = (response['specific_date_times'] as Map<String, dynamic>? ?? {}).map(
            (key, value) => MapEntry(key, List<String>.from(value as List)),
          );
          _availableTimeSlots = List<String>.from(response['time_slots'] ?? []);
          _maxPerSlot = response['max_per_slot'] ?? 5;
          _isCheckingLock = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isCheckingLock = false);
    }
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _collegeController.dispose();
    _phoneController.dispose();
    _whatsappController.dispose();
    _ageController.dispose();
    _otpController.dispose();
    _linkedinController.dispose();
    _githubController.dispose();
    _portfolioController.dispose();
    super.dispose();
  }

  void _showSnack(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isError ? AppColors.danger : AppColors.primary,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  bool _validateCurrentStep() {
    switch (_currentStep) {
      case 0:
        if (_firstNameController.text.isEmpty ||
            _lastNameController.text.isEmpty ||
            _emailController.text.isEmpty ||
            !_emailVerified ||
            _collegeController.text.isEmpty ||
            _phoneController.text.isEmpty ||
            _whatsappController.text.isEmpty ||
            _ageController.text.isEmpty ||
            _sex.isEmpty) {
          _showSnack('Please complete all required fields.', isError: true);
          return false;
        }
        return true;
      case 1:
        if (_cvFile == null &&
            _linkedinController.text.isEmpty &&
            _githubController.text.isEmpty &&
            _portfolioController.text.isEmpty) {
          _showSnack('Upload a CV or add at least one profile link.',
              isError: true);
          return false;
        }
        return true;
      case 2:
        if (_interviewDate == null || _interviewTime == null) {
          _showSnack('Please pick both a date and time.', isError: true);
          return false;
        }
        return true;
      case 3:
        if (!_termsAccepted) {
          _showSnack('Please accept the Terms & Conditions.', isError: true);
          return false;
        }
        return true;
      default:
        return true;
    }
  }

  void _nextStep() {
    if (!_validateCurrentStep()) return;
    if (_currentStep < 3) {
      _fadeController.reset();
      setState(() => _currentStep++);
      _fadeController.forward();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      _fadeController.reset();
      setState(() => _currentStep--);
      _fadeController.forward();
    }
  }

  Future<void> _sendOtp() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      _showSnack('Enter your email first.', isError: true);
      return;
    }
    try {
      await SupabaseClientConfig.client.auth.signInWithOtp(email: email);
      setState(() => _otpSent = true);
      _showSnack('OTP sent! Check your inbox.');
    } catch (e) {
      _showSnack('Failed to send OTP: $e', isError: true);
    }
  }

  Future<void> _verifyOtp() async {
    try {
      await SupabaseClientConfig.client.auth.verifyOTP(
        type: OtpType.email,
        email: _emailController.text.trim(),
        token: _otpController.text.trim(),
      );
      // Sign out immediately — we only wanted to verify the email
      await SupabaseClientConfig.client.auth.signOut();
      setState(() => _emailVerified = true);
      _showSnack('Email verified!');
    } catch (e) {
      _showSnack('Invalid OTP. Try again.', isError: true);
    }
  }

  Future<void> _pickCv() async {
    final result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf'],
      withData: true,
    );
    if (result != null && result.files.isNotEmpty) {
      setState(() => _cvFile = result.files.first);
    }
  }

  Future<void> _fetchBookedSlots(String date) async {
    try {
      // Fetch from applications
      final appData = await SupabaseClientConfig.client
          .from('applications')
          .select('preferred_interview_time')
          .eq('preferred_interview_date', date);

      final counts = <String, int>{};
      for (final row in appData as List) {
        final t = row['preferred_interview_time'] as String?;
        if (t != null) counts[t] = (counts[t] ?? 0) + 1;
      }

      // Fetch from slot_bookings
      final slotData = await SupabaseClientConfig.client
          .from('slot_bookings')
          .select('booking_time')
          .eq('booking_date', date);

      for (final row in slotData as List) {
        final t = row['booking_time'] as String?;
        if (t != null) counts[t] = (counts[t] ?? 0) + 1;
      }

      if (mounted) setState(() => _bookedSlots = counts);
    } catch (_) {}
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 60)),
      selectableDayPredicate: (day) {
        final dateStr =
            '${day.year}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
        // Allow if day of week is in availableDays OR date is in availableDates
        if (_availableDays.contains(day.weekday % 7)) return true;
        if (_availableDates.contains(dateStr)) return true;
        return false;
      },
      builder: (context, child) => Theme(
        data: ThemeData.dark().copyWith(
          colorScheme: const ColorScheme.dark(
            primary: AppColors.primary,
            surface: AppColors.card,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      final dateStr =
          '${picked.year}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
      setState(() {
        _interviewDate = dateStr;
        _interviewTime = null;
      });
      await _fetchBookedSlots(dateStr);
    }
  }

  List<String> _getTimeSlotsForDate() {
    if (_interviewDate != null && _specificDateTimes.containsKey(_interviewDate)) {
      return _specificDateTimes[_interviewDate]!;
    }
    return _availableTimeSlots;
  }

  Future<void> _submitApplication() async {
    if (!_validateCurrentStep()) return;
    setState(() => _isSubmitting = true);

    try {
      final fullName =
          '${_firstNameController.text.trim()} ${_lastNameController.text.trim()}';

      final applicationId = await ApplicationService.submitApplication(
        fullName: fullName,
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim(),
        whatsappNumber: _whatsappController.text.trim(),
        age: _ageController.text.trim(),
        sex: _sex,
        college: _collegeController.text.trim(),
        linkedinUrl: _linkedinController.text.trim(),
        githubUrl: _githubController.text.trim(),
        portfolioUrl: _portfolioController.text.trim(),
        interviewDate: _interviewDate ?? '',
        interviewTime: _interviewTime ?? '',
        interests: _selectedInterests,
        batchNumber: _activeBatch ?? 'Phase 1',
      );

      // Upload CV if present
      if (_cvFile != null && applicationId.isNotEmpty && _cvFile!.bytes != null) {
        await ApplicationService.uploadCv(
          fileBytes: _cvFile!.bytes!,
          fileName: _cvFile!.name,
          applicationId: applicationId,
        );
      }

      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => AlertDialog(
            backgroundColor: AppColors.card,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20)),
            title: const Text('🎉 Application Submitted!',
                style: TextStyle(color: AppColors.text)),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  "We've received your application. You'll hear from us soon!",
                  style:
                      TextStyle(color: AppColors.textSecondary, height: 1.5),
                ),
                if (_interviewDate != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    '📅 Interview: $_interviewDate at $_interviewTime',
                    style: const TextStyle(
                        color: AppColors.primary, fontWeight: FontWeight.w600),
                  ),
                ],
              ],
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                  context.go('/landing');
                },
                child: const Text('Done',
                    style: TextStyle(color: AppColors.primary)),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      _showSnack('Error: ${e.toString()}', isError: true);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isCheckingLock) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    if (_isFormLocked) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.lock_outline,
                      color: AppColors.textMuted, size: 60),
                  const SizedBox(height: 20),
                  const Text('Applications Closed',
                      style: TextStyle(
                          color: AppColors.text,
                          fontSize: 24,
                          fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Text(
                    _lockMessage.isNotEmpty
                        ? _lockMessage
                        : 'The application form is currently closed. Please check back later.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                        color: AppColors.textSecondary, height: 1.5),
                  ),
                  const SizedBox(height: 24),
                  TextButton(
                    onPressed: () => context.go('/landing'),
                    child: const Text('Go Back',
                        style: TextStyle(color: AppColors.primary)),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    }

    final stepTitles = [
      'Personal Details',
      'Resume & Links',
      'Interview Schedule',
      'Interests & T&C'
    ];
    final percent = ((_currentStep + 1) / 4 * 100).round();

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ──
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => _currentStep > 0
                        ? _prevStep()
                        : context.go('/landing'),
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.elevated,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: const Icon(Icons.arrow_back_ios_new,
                          color: AppColors.text, size: 16),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Step ${_currentStep + 1} of 4',
                          style: const TextStyle(
                              color: AppColors.textMuted,
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 1),
                        ),
                        const SizedBox(height: 2),
                        Text(stepTitles[_currentStep],
                            style: const TextStyle(
                                color: AppColors.text,
                                fontSize: 16,
                                fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                  Text('$percent%',
                      style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w800,
                          fontSize: 14)),
                ],
              ),
            ),

            // ── Progress Bar ──
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: (_currentStep + 1) / 4,
                  backgroundColor: AppColors.border,
                  valueColor:
                      const AlwaysStoppedAnimation(AppColors.primary),
                  minHeight: 4,
                ),
              ),
            ),
            const SizedBox(height: 8),

            // ── Step Content ──
            Expanded(
              child: AnimatedBuilder(
                animation: _fadeController,
                builder: (context, _) => Opacity(
                  opacity: _fadeAnim.value,
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 12),
                    child: _buildStep(),
                  ),
                ),
              ),
            ),

            // ── Bottom Actions ──
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              decoration: BoxDecoration(
                color: AppColors.card,
                border: Border(
                    top: BorderSide(color: AppColors.border, width: 1)),
              ),
              child: _currentStep < 3
                  ? _buildNextButton()
                  : _buildSubmitButton(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep() {
    switch (_currentStep) {
      case 0:
        return _buildStepIdentity();
      case 1:
        return _buildStepResume();
      case 2:
        return _buildStepSchedule();
      case 3:
        return _buildStepAdditional();
      default:
        return const SizedBox.shrink();
    }
  }

  // ── Step 1: Identity ──
  Widget _buildStepIdentity() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildTextField('First Name *', _firstNameController),
        _buildTextField('Last Name *', _lastNameController),
        _buildTextField('Email *', _emailController,
            keyboardType: TextInputType.emailAddress,
            enabled: !_emailVerified,
            suffix: _emailVerified
                ? const Icon(Icons.check_circle,
                    color: AppColors.primary, size: 20)
                : null),
        if (!_emailVerified) ...[
          if (!_otpSent)
            _buildSmallButton('Verify Email', _sendOtp)
          else ...[
            _buildTextField('Enter OTP', _otpController,
                keyboardType: TextInputType.number),
            _buildSmallButton('Confirm OTP', _verifyOtp),
          ],
        ],
        const SizedBox(height: 8),
        _buildTextField('College / University *', _collegeController),
        _buildTextField('Phone *', _phoneController,
            keyboardType: TextInputType.phone),
        _buildTextField('WhatsApp Number *', _whatsappController,
            keyboardType: TextInputType.phone),
        _buildTextField('Age *', _ageController,
            keyboardType: TextInputType.number),
        const SizedBox(height: 8),
        const Text('Sex *',
            style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: ['Male', 'Female', 'Other'].map((s) {
            final selected = _sex == s;
            return GestureDetector(
              onTap: () => setState(() => _sex = s),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                decoration: BoxDecoration(
                  color: selected ? AppColors.primaryMuted : AppColors.elevated,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                      color: selected
                          ? AppColors.primary
                          : AppColors.border),
                ),
                child: Text(s,
                    style: TextStyle(
                        color:
                            selected ? AppColors.primary : AppColors.textMuted,
                        fontWeight: FontWeight.w600,
                        fontSize: 13)),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  // ── Step 2: Resume & Links ──
  Widget _buildStepResume() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Upload CV (PDF only)',
            style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _pickCv,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 28),
            decoration: BoxDecoration(
              color: AppColors.elevated,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                  color: _cvFile != null
                      ? AppColors.primary
                      : AppColors.border,
                  style: BorderStyle.solid),
            ),
            child: Column(
              children: [
                Icon(
                    _cvFile != null
                        ? Icons.check_circle
                        : Icons.upload_file,
                    color: _cvFile != null
                        ? AppColors.primary
                        : AppColors.textMuted,
                    size: 32),
                const SizedBox(height: 8),
                Text(
                  _cvFile != null ? _cvFile!.name : 'Tap to select a PDF',
                  style: TextStyle(
                      color: _cvFile != null
                          ? AppColors.text
                          : AppColors.textMuted,
                      fontWeight: FontWeight.w600,
                      fontSize: 13),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        _buildTextField('LinkedIn URL', _linkedinController,
            keyboardType: TextInputType.url),
        _buildTextField('GitHub URL', _githubController,
            keyboardType: TextInputType.url),
        _buildTextField('Portfolio URL', _portfolioController,
            keyboardType: TextInputType.url),
      ],
    );
  }

  // ── Step 3: Schedule ──
  Widget _buildStepSchedule() {
    final timeSlotsForDate = _getTimeSlotsForDate();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Select Interview Date *',
            style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _pickDate,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: AppColors.elevated,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_month,
                    color: AppColors.primary, size: 20),
                const SizedBox(width: 12),
                Text(
                  _interviewDate ?? 'Pick a date',
                  style: TextStyle(
                      color: _interviewDate != null
                          ? AppColors.text
                          : AppColors.textFaint,
                      fontSize: 15,
                      fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ),
        if (_interviewDate != null) ...[
          const SizedBox(height: 20),
          const Text('Select Time *',
              style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          if (timeSlotsForDate.isEmpty)
            const Text('No time slots available for this date.',
                style: TextStyle(color: AppColors.textMuted)),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: timeSlotsForDate.map((slot) {
              final booked = _bookedSlots[slot] ?? 0;
              final isFull = booked >= _maxPerSlot;
              final selected = _interviewTime == slot;

              return GestureDetector(
                onTap: isFull ? null : () => setState(() => _interviewTime = slot),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isFull
                        ? AppColors.elevated.withValues(alpha: 0.5)
                        : selected
                            ? AppColors.primaryMuted
                            : AppColors.elevated,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                        color: isFull
                            ? AppColors.border.withValues(alpha: 0.3)
                            : selected
                                ? AppColors.primary
                                : AppColors.border),
                  ),
                  child: Text(
                    isFull ? '$slot (Full)' : slot,
                    style: TextStyle(
                      color: isFull
                          ? AppColors.textFaint
                          : selected
                              ? AppColors.primary
                              : AppColors.textMuted,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
        const SizedBox(height: 16),
      ],
    );
  }

  // ── Step 4: Additional ──
  Widget _buildStepAdditional() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('What areas interest you?',
            style: TextStyle(
                color: AppColors.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w600)),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _allInterests.map((interest) {
            final selected = _selectedInterests.contains(interest);
            return GestureDetector(
              onTap: () => setState(() {
                if (selected) {
                  _selectedInterests.remove(interest);
                } else {
                  _selectedInterests.add(interest);
                }
              }),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                decoration: BoxDecoration(
                  color: selected ? AppColors.primaryMuted : AppColors.elevated,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                      color: selected
                          ? AppColors.primary
                          : AppColors.border),
                ),
                child: Text(interest,
                    style: TextStyle(
                        color: selected
                            ? AppColors.primary
                            : AppColors.textMuted,
                        fontWeight: FontWeight.w600,
                        fontSize: 12)),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 28),
        GestureDetector(
          onTap: () => setState(() => _termsAccepted = !_termsAccepted),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: _termsAccepted
                      ? AppColors.primary
                      : AppColors.elevated,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                      color: _termsAccepted
                          ? AppColors.primary
                          : AppColors.border),
                ),
                child: _termsAccepted
                    ? const Icon(Icons.check,
                        color: Color(0xFF0a0a0f), size: 16)
                    : null,
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'I accept the Terms & Conditions and agree to the internship policies.',
                  style: TextStyle(
                      color: AppColors.textSecondary,
                      fontSize: 13,
                      height: 1.5),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  // ── Helpers ──
  Widget _buildTextField(String label, TextEditingController controller,
      {TextInputType? keyboardType, bool enabled = true, Widget? suffix}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Container(
            decoration: BoxDecoration(
              color: AppColors.elevated,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: TextField(
              controller: controller,
              enabled: enabled,
              keyboardType: keyboardType,
              style: TextStyle(
                  color: enabled
                      ? AppColors.text
                      : AppColors.text.withValues(alpha: 0.5),
                  fontSize: 15),
              decoration: InputDecoration(
                hintText: label.replaceAll(' *', ''),
                hintStyle: const TextStyle(color: AppColors.textFaint),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                border: InputBorder.none,
                suffixIcon: suffix,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSmallButton(String text, VoidCallback onTap) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.primaryMuted,
            borderRadius: BorderRadius.circular(10),
            border:
                Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
          ),
          child: Text(text,
              style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 13,
                  fontWeight: FontWeight.w700)),
        ),
      ),
    );
  }

  Widget _buildNextButton() {
    return SizedBox(
      width: double.infinity,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(14),
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
            onTap: _nextStep,
            borderRadius: BorderRadius.circular(14),
            child: const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: Text('NEXT',
                    style: TextStyle(
                        color: Color(0xFF0a0a0f),
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 2)),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(14),
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
            onTap: _isSubmitting ? null : _submitApplication,
            borderRadius: BorderRadius.circular(14),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 16),
              child: Center(
                child: _isSubmitting
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                            color: Color(0xFF0a0a0f), strokeWidth: 2))
                    : const Text('SUBMIT APPLICATION',
                        style: TextStyle(
                            color: Color(0xFF0a0a0f),
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 2)),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
