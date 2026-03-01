import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';
import 'package:intl/intl.dart';

class AvailabilityScreen extends StatefulWidget {
  const AvailabilityScreen({super.key});
  @override
  State<AvailabilityScreen> createState() => _AvailabilityScreenState();
}

class _AvailabilityScreenState extends State<AvailabilityScreen> {
  Map<String, dynamic>? _settings;
  bool _loading = true;
  bool _hasUnsavedChanges = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await AdminSupabaseService.getFormSettings();
    if (mounted) {
      setState(() {
        _settings = data;
        _loading = false;
        _hasUnsavedChanges = false;
      });
    }
  }

  Future<void> _save() async {
    if (_settings == null) return;
    try {
      await AdminSupabaseService.updateFormSettings(_settings!);
      setState(() => _hasUnsavedChanges = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Settings saved successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error saving settings: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primary),
      );
    }

    if (_settings == null) {
      return const Center(
        child: Text(
          'Failed to load settings',
          style: TextStyle(color: AppTheme.textMuted),
        ),
      );
    }

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionHeader('Availability Overview'),
            _buildFormLockCard(),
            const SizedBox(height: 24),
            _buildSectionHeader('Weekly Recurring Days'),
            _buildWeeklyDaysCard(),
            const SizedBox(height: 24),
            _buildSectionHeader('Specific Dates'),
            _buildSpecificDatesCard(),
            const SizedBox(height: 24),
            _buildSectionHeader('Time Slots'),
            _buildTimeSlotsCard(),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _save,
                icon: const Icon(Icons.save, color: Colors.white),
                label: Text(
                  _hasUnsavedChanges ? 'Save Changes' : 'All Settings Saved',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _hasUnsavedChanges
                      ? AppTheme.primary
                      : AppTheme.success.withValues(alpha: 0.8),
                  padding: const EdgeInsets.all(16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 8),
      child: Text(
        title.toUpperCase(),
        style: const TextStyle(
          color: AppTheme.textMuted,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildFormLockCard() {
    final isLocked = _settings!['is_form_locked'] == true;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (isLocked ? AppTheme.error : AppTheme.success)
                      .withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  isLocked ? Icons.lock : Icons.lock_open,
                  color: isLocked ? AppTheme.error : AppTheme.success,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Form Lock Status',
                      style: TextStyle(
                        color: AppTheme.textMain,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      isLocked
                          ? 'Interviews are currently closed'
                          : 'Interviews are open for booking',
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
              Switch(
                value: isLocked,
                activeThumbColor: AppTheme.error,
                onChanged: (val) {
                  setState(() {
                    _settings!['is_form_locked'] = val;
                    _hasUnsavedChanges = true;
                  });
                },
              ),
            ],
          ),
          if (isLocked) ...[
            const SizedBox(height: 16),
            const Divider(color: AppTheme.border, height: 1),
            const SizedBox(height: 16),
            TextField(
              controller: TextEditingController(
                text: _settings!['lock_message'] ?? '',
              ),
              onChanged: (val) {
                _settings!['lock_message'] = val;
                _hasUnsavedChanges = true;
              },
              maxLines: 2,
              style: const TextStyle(color: AppTheme.textMain, fontSize: 13),
              decoration: InputDecoration(
                labelText: 'Maintenance Message',
                labelStyle: const TextStyle(color: AppTheme.textMuted),
                hintText: 'e.g., Enrollment is currently closed...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding: const EdgeInsets.all(12),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildWeeklyDaysCard() {
    final days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    final selectedDays = List<int>.from(_settings!['available_days'] ?? []);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: List.generate(7, (idx) {
          final isSelected = selectedDays.contains(idx);
          return GestureDetector(
            onTap: () {
              setState(() {
                if (isSelected) {
                  selectedDays.remove(idx);
                } else {
                  selectedDays.add(idx);
                }
                _settings!['available_days'] = selectedDays;
                _hasUnsavedChanges = true;
              });
            },
            child: Container(
              width: 40,
              height: 44,
              decoration: BoxDecoration(
                color: isSelected ? AppTheme.primary : Colors.transparent,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isSelected ? AppTheme.primary : AppTheme.border,
                ),
              ),
              child: Center(
                child: Text(
                  days[idx][0],
                  style: TextStyle(
                    color: isSelected ? Colors.white : AppTheme.textMuted,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildSpecificDatesCard() {
    final List<String> dates = List<String>.from(
      _settings!['available_dates'] ?? [],
    );
    dates.sort();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Add Calendar Exceptions',
                style: TextStyle(color: AppTheme.textMain, fontSize: 13),
              ),
              IconButton(
                icon: const Icon(
                  Icons.calendar_today,
                  color: AppTheme.primary,
                  size: 20,
                ),
                onPressed: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now(),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                    builder: (context, child) => Theme(
                      data: Theme.of(context).copyWith(
                        colorScheme: const ColorScheme.dark(
                          primary: AppTheme.primary,
                          onPrimary: Colors.white,
                          surface: AppTheme.bgCard,
                        ),
                      ),
                      child: child!,
                    ),
                  );
                  if (date != null) {
                    final str = DateFormat('yyyy-MM-dd').format(date);
                    if (!dates.contains(str)) {
                      setState(() {
                        dates.add(str);
                        _settings!['available_dates'] = dates;
                        _hasUnsavedChanges = true;
                      });
                    }
                  }
                },
              ),
            ],
          ),
          if (dates.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: dates
                  .map(
                    (d) => Chip(
                      label: Text(
                        d,
                        style: const TextStyle(
                          fontSize: 11,
                          color: Colors.white,
                        ),
                      ),
                      backgroundColor: AppTheme.primary.withValues(alpha: 0.6),
                      deleteIcon: const Icon(
                        Icons.close,
                        size: 14,
                        color: Colors.white,
                      ),
                      onDeleted: () {
                        setState(() {
                          dates.remove(d);
                          _settings!['available_dates'] = dates;
                          _hasUnsavedChanges = true;
                        });
                      },
                    ),
                  )
                  .toList(),
            ),
          ] else
            const Text(
              'No specific dates added.',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 12),
            ),
        ],
      ),
    );
  }

  Widget _buildTimeSlotsCard() {
    final List<String> slots = List<String>.from(
      _settings!['time_slots'] ?? [],
    );

    // Generate base range for selection if empty or for common pickers
    final List<String> allPossiblySlots = [];
    for (int h = 9; h <= 21; h++) {
      for (int m = 0; m < 60; m += 30) {
        allPossiblySlots.add(
          '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}',
        );
      }
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Active Time Slots',
                style: TextStyle(color: AppTheme.textMain, fontSize: 13),
              ),
              TextButton(
                onPressed: () {
                  setState(() {
                    if (slots.length == allPossiblySlots.length) {
                      slots.clear();
                    } else {
                      slots.clear();
                      slots.addAll(allPossiblySlots);
                    }
                    _settings!['time_slots'] = slots;
                    _hasUnsavedChanges = true;
                  });
                },
                child: Text(
                  slots.length == allPossiblySlots.length
                      ? 'Clear All'
                      : 'Select All',
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              childAspectRatio: 2.2,
            ),
            itemCount: allPossiblySlots.length,
            itemBuilder: (context, index) {
              final slot = allPossiblySlots[index];
              final isSelected = slots.contains(slot);
              return GestureDetector(
                onTap: () {
                  setState(() {
                    if (isSelected) {
                      slots.remove(slot);
                    } else {
                      slots.add(slot);
                    }
                    _settings!['time_slots'] = slots;
                    _hasUnsavedChanges = true;
                  });
                },
                child: Container(
                  decoration: BoxDecoration(
                    color: isSelected
                        ? AppTheme.primary
                        : AppTheme.bgBody.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: isSelected ? AppTheme.primary : AppTheme.border,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      _formatTime(slot),
                      style: TextStyle(
                        color: isSelected ? Colors.white : AppTheme.textMuted,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  String _formatTime(String time24) {
    try {
      final parts = time24.split(':');
      final hour = int.parse(parts[0]);
      final min = parts[1];
      final suffix = hour >= 12 ? 'PM' : 'AM';
      final h = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
      return '$h:$min $suffix';
    } catch (_) {
      return time24;
    }
  }
}
