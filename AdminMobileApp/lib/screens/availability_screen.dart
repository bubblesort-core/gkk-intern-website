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

  // Lock-message controller kept alive across rebuilds
  late final TextEditingController _lockMsgCtrl;
  late final TextEditingController _batchCtrl;

  @override
  void initState() {
    super.initState();
    _lockMsgCtrl = TextEditingController();
    _batchCtrl = TextEditingController();
    _load();
  }

  @override
  void dispose() {
    _lockMsgCtrl.dispose();
    _batchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await AdminSupabaseService.getFormSettings();
    if (mounted) {
      setState(() {
        _settings = data;
        _lockMsgCtrl.text = data?['lock_message'] ?? '';
        _batchCtrl.text = data?['active_batch'] ?? '';
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

  /// Generate all possible 15-min slots from 9 AM to 11 PM
  List<String> get _allSlots {
    final list = <String>[];
    for (int h = 9; h <= 22; h++) {
      for (int m = 0; m < 60; m += 15) {
        if (h == 23) break;
        list.add(
          '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}',
        );
      }
    }
    return list;
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
            _buildSectionHeader('Batch & Capacity'),
            _buildBatchCapacityCard(),
            const SizedBox(height: 24),
            _buildSectionHeader('Weekly Recurring Days'),
            _buildWeeklyDaysCard(),
            const SizedBox(height: 24),
            _buildSectionHeader('Specific Dates'),
            _buildSpecificDatesCard(),
            const SizedBox(height: 24),
            _buildSectionHeader('Default Time Slots'),
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

  // ── Form Lock ──
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
              controller: _lockMsgCtrl,
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

  // ── Batch & Slot Capacity ──
  Widget _buildBatchCapacityCard() {
    final int capacity = _settings!['max_per_slot'] ?? 1;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        children: [
          // Active Batch
          TextField(
            controller: _batchCtrl,
            onChanged: (val) {
              _settings!['active_batch'] = val;
              _hasUnsavedChanges = true;
            },
            style: const TextStyle(color: AppTheme.textMain, fontSize: 13),
            decoration: InputDecoration(
              labelText: 'Active Batch',
              labelStyle: const TextStyle(color: AppTheme.textMuted),
              hintText: 'e.g., Batch 3',
              prefixIcon: const Icon(
                Icons.group_work,
                size: 20,
                color: AppTheme.textMuted,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 12,
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Slot Capacity
          Row(
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Slot Capacity',
                      style: TextStyle(
                        color: AppTheme.textMain,
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                      ),
                    ),
                    Text(
                      'Max interviews per time slot',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: capacity > 1
                    ? () {
                        setState(() {
                          _settings!['max_per_slot'] = capacity - 1;
                          _hasUnsavedChanges = true;
                        });
                      }
                    : null,
                icon: const Icon(Icons.remove_circle_outline),
                color: AppTheme.primary,
                iconSize: 28,
              ),
              Container(
                width: 48,
                height: 36,
                decoration: BoxDecoration(
                  color: AppTheme.bgBody,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Center(
                  child: Text(
                    '$capacity',
                    style: const TextStyle(
                      color: AppTheme.textMain,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              IconButton(
                onPressed: capacity < 50
                    ? () {
                        setState(() {
                          _settings!['max_per_slot'] = capacity + 1;
                          _hasUnsavedChanges = true;
                        });
                      }
                    : null,
                icon: const Icon(Icons.add_circle_outline),
                color: AppTheme.primary,
                iconSize: 28,
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Weekly Days ──
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
                  days[idx],
                  style: TextStyle(
                    color: isSelected ? Colors.white : AppTheme.textMuted,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  // ── Specific Dates with per-date custom times ──
  Widget _buildSpecificDatesCard() {
    final List<String> dates = List<String>.from(
      _settings!['available_dates'] ?? [],
    );
    dates.sort();

    final Map<String, dynamic> specificDateTimes = Map<String, dynamic>.from(
      _settings!['specific_date_times'] ?? {},
    );

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
                'Calendar Exceptions',
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
              children: dates.map((d) {
                final hasCustomTimes = specificDateTimes.containsKey(d);
                return GestureDetector(
                  onTap: () => _showDateTimesModal(d),
                  child: Chip(
                    avatar: hasCustomTimes
                        ? const Icon(
                            Icons.schedule,
                            size: 14,
                            color: Colors.white,
                          )
                        : null,
                    label: Text(
                      d,
                      style: const TextStyle(
                        fontSize: 11,
                        color: Colors.white,
                      ),
                    ),
                    backgroundColor: hasCustomTimes
                        ? AppTheme.accent.withValues(alpha: 0.7)
                        : AppTheme.primary.withValues(alpha: 0.6),
                    deleteIcon: const Icon(
                      Icons.close,
                      size: 14,
                      color: Colors.white,
                    ),
                    onDeleted: () {
                      setState(() {
                        dates.remove(d);
                        specificDateTimes.remove(d);
                        _settings!['available_dates'] = dates;
                        _settings!['specific_date_times'] = specificDateTimes;
                        _hasUnsavedChanges = true;
                      });
                    },
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 8),
            const Text(
              'Tap a date to set custom time slots for it.',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 11),
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

  /// Modal to choose custom time overrides for a specific date
  void _showDateTimesModal(String dateStr) {
    final Map<String, dynamic> specificDateTimes = Map<String, dynamic>.from(
      _settings!['specific_date_times'] ?? {},
    );
    final List<String> dateTimes = List<String>.from(
      specificDateTimes[dateStr] ?? [],
    );

    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.bgBody,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return DraggableScrollableSheet(
              initialChildSize: 0.75,
              minChildSize: 0.5,
              maxChildSize: 0.9,
              expand: false,
              builder: (ctx, scroll) => SingleChildScrollView(
                controller: scroll,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: AppTheme.textMuted.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Custom Times for $dateStr',
                      style: const TextStyle(
                        color: AppTheme.textMain,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${dateTimes.length} slot(s) selected',
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Quick actions
                    Row(
                      children: [
                        _quickBtn('Select All', () {
                          setSheetState(() {
                            dateTimes.clear();
                            dateTimes.addAll(_allSlots);
                          });
                        }),
                        const SizedBox(width: 8),
                        _quickBtn('Evening (6-9 PM)', () {
                          setSheetState(() {
                            dateTimes.clear();
                            for (final s in _allSlots) {
                              final h = int.parse(s.split(':')[0]);
                              if (h >= 18 && h < 21) dateTimes.add(s);
                            }
                          });
                        }),
                        const SizedBox(width: 8),
                        _quickBtn('Clear', () {
                          setSheetState(() => dateTimes.clear());
                        }),
                      ],
                    ),
                    const SizedBox(height: 16),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 4,
                        crossAxisSpacing: 6,
                        mainAxisSpacing: 6,
                        childAspectRatio: 2.2,
                      ),
                      itemCount: _allSlots.length,
                      itemBuilder: (ctx, i) {
                        final slot = _allSlots[i];
                        final isOn = dateTimes.contains(slot);
                        return GestureDetector(
                          onTap: () {
                            setSheetState(() {
                              isOn
                                  ? dateTimes.remove(slot)
                                  : dateTimes.add(slot);
                            });
                          },
                          child: Container(
                            decoration: BoxDecoration(
                              color: isOn
                                  ? AppTheme.accent
                                  : AppTheme.bgCard,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: isOn
                                    ? AppTheme.accent
                                    : AppTheme.border,
                              ),
                            ),
                            child: Center(
                              child: Text(
                                _formatTime(slot),
                                style: TextStyle(
                                  color: isOn
                                      ? Colors.white
                                      : AppTheme.textMuted,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              // Remove custom override for this date
                              specificDateTimes.remove(dateStr);
                              _settings!['specific_date_times'] =
                                  specificDateTimes;
                              _hasUnsavedChanges = true;
                              setState(() {});
                              Navigator.pop(ctx);
                            },
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: AppTheme.error),
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            child: const Text(
                              'Use Default',
                              style: TextStyle(color: AppTheme.error),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              specificDateTimes[dateStr] = dateTimes;
                              _settings!['specific_date_times'] =
                                  specificDateTimes;
                              _hasUnsavedChanges = true;
                              setState(() {});
                              Navigator.pop(ctx);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primary,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            child: const Text(
                              'Save Custom Times',
                              style: TextStyle(color: Colors.white),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _quickBtn(String label, VoidCallback onTap) {
    return Expanded(
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: AppTheme.border),
          padding: const EdgeInsets.symmetric(vertical: 8),
        ),
        child: Text(
          label,
          style: const TextStyle(
            color: AppTheme.textBody,
            fontSize: 10,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  // ── Default Time Slots (15-min intervals) ──
  Widget _buildTimeSlotsCard() {
    final List<String> slots = List<String>.from(
      _settings!['time_slots'] ?? [],
    );
    final allPossiblySlots = _allSlots;

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
              const Expanded(
                child: Text(
                  'Active Time Slots',
                  style: TextStyle(color: AppTheme.textMain, fontSize: 13),
                ),
              ),
              TextButton(
                onPressed: () {
                  setState(() {
                    // Quick Evening: 6-9 PM
                    slots.clear();
                    for (final s in allPossiblySlots) {
                      final h = int.parse(s.split(':')[0]);
                      if (h >= 18 && h < 21) slots.add(s);
                    }
                    _settings!['time_slots'] = slots;
                    _hasUnsavedChanges = true;
                  });
                },
                child: const Text(
                  'Evening',
                  style: TextStyle(fontSize: 12),
                ),
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
                  style: const TextStyle(fontSize: 12),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '${slots.length} of ${allPossiblySlots.length} slots active  •  15-min intervals',
            style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
          ),
          const SizedBox(height: 12),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              crossAxisSpacing: 6,
              mainAxisSpacing: 6,
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
