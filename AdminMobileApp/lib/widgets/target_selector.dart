import 'package:flutter/material.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';

class TargetSelector extends StatefulWidget {
  final Function(String type, List<String> ids) onChanged;
  final String? initialType;
  final List<String>? initialIds;

  const TargetSelector({
    super.key,
    required this.onChanged,
    this.initialType,
    this.initialIds,
  });

  @override
  State<TargetSelector> createState() => _TargetSelectorState();
}

class _TargetSelectorState extends State<TargetSelector> {
  String _selectedType = 'all';
  List<String> _selectedIds = [];

  List<Map<String, dynamic>> _options = [];
  List<Map<String, dynamic>> _filteredOptions = [];
  bool _loading = false;
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _selectedType = widget.initialType ?? 'all';
    _selectedIds = List.from(widget.initialIds ?? []);
    if (_selectedType != 'all') {
      _loadOptions();
    }
  }

  Future<void> _loadOptions() async {
    setState(() => _loading = true);
    List<Map<String, dynamic>> data = [];

    try {
      if (_selectedType == 'interns') {
        data = await AdminSupabaseService.getInternList();
      } else if (_selectedType == 'teams') {
        data = await AdminSupabaseService.getAllTeams();
      } else if (_selectedType == 'batches') {
        data = await AdminSupabaseService.getActiveBatches();
      }
    } catch (e) {
      debugPrint('[TargetSelector] Error loading options: $e');
    }

    if (mounted) {
      setState(() {
        _options = data;
        _filteredOptions = data;
        _loading = false;
      });
      _filter();
    }
  }

  void _filter() {
    final query = _searchCtrl.text.toLowerCase();
    setState(() {
      _filteredOptions = _options.where((opt) {
        final name = (opt['full_name'] ?? opt['name'] ?? '')
            .toString()
            .toLowerCase();
        final email = (opt['email'] ?? '').toString().toLowerCase();
        return name.contains(query) || email.contains(query);
      }).toList();
    });
  }

  void _toggleSelection(String id) {
    setState(() {
      if (_selectedIds.contains(id)) {
        _selectedIds.remove(id);
      } else {
        _selectedIds.add(id);
      }
    });
    widget.onChanged(_selectedType, _selectedIds);
  }

  void _selectAll(bool select) {
    setState(() {
      if (select) {
        _selectedIds = _filteredOptions.map((e) => e['id'].toString()).toList();
      } else {
        _selectedIds.clear();
      }
    });
    widget.onChanged(_selectedType, _selectedIds);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Target Audience',
          style: TextStyle(
            color: AppTheme.textMuted,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: AppTheme.bgCard,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _selectedType,
              isExpanded: true,
              dropdownColor: AppTheme.bgCard,
              style: const TextStyle(color: AppTheme.textMain),
              items: const [
                DropdownMenuItem(value: 'all', child: Text('All Interns')),
                DropdownMenuItem(
                  value: 'interns',
                  child: Text('Specific Interns'),
                ),
                DropdownMenuItem(value: 'teams', child: Text('Specific Teams')),
                DropdownMenuItem(
                  value: 'batches',
                  child: Text('Specific Batches'),
                ),
              ],
              onChanged: (val) {
                if (val != null) {
                  setState(() {
                    _selectedType = val;
                    _selectedIds.clear();
                    _options.clear();
                    _filteredOptions.clear();
                  });
                  if (val != 'all') _loadOptions();
                  widget.onChanged(val, []);
                }
              },
            ),
          ),
        ),
        if (_selectedType != 'all') ...[
          const SizedBox(height: 12),
          TextField(
            controller: _searchCtrl,
            onChanged: (_) => _filter(),
            style: const TextStyle(color: AppTheme.textMain, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Search...',
              hintStyle: const TextStyle(color: AppTheme.textMuted),
              prefixIcon: const Icon(
                Icons.search,
                size: 18,
                color: AppTheme.textMuted,
              ),
              filled: true,
              fillColor: AppTheme.bgCard,
              contentPadding: const EdgeInsets.symmetric(vertical: 0),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.border),
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${_selectedIds.length} Selected',
                style: const TextStyle(color: AppTheme.textMuted, fontSize: 12),
              ),
              Row(
                children: [
                  TextButton(
                    onPressed: () => _selectAll(true),
                    child: const Text(
                      'Select All',
                      style: TextStyle(fontSize: 12),
                    ),
                  ),
                  TextButton(
                    onPressed: () => _selectAll(false),
                    child: const Text(
                      'Clear',
                      style: TextStyle(fontSize: 12, color: AppTheme.error),
                    ),
                  ),
                ],
              ),
            ],
          ),
          Container(
            height: 200,
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: _loading
                ? const Center(child: CircularProgressIndicator(strokeWidth: 2))
                : _filteredOptions.isEmpty
                ? const Center(
                    child: Text(
                      'No matches found',
                      style: TextStyle(color: AppTheme.textMuted),
                    ),
                  )
                : ListView.builder(
                    itemCount: _filteredOptions.length,
                    itemBuilder: (ctx, i) {
                      final item = _filteredOptions[i];
                      final id = item['id'].toString();
                      final name =
                          item['full_name'] ?? item['name'] ?? 'Unknown';
                      final email = item['email'] ?? '';
                      final isSelected = _selectedIds.contains(id);

                      return CheckboxListTile(
                        value: isSelected,
                        onChanged: (_) => _toggleSelection(id),
                        title: Text(
                          name,
                          style: const TextStyle(
                            color: AppTheme.textMain,
                            fontSize: 13,
                          ),
                        ),
                        subtitle: email.isNotEmpty
                            ? Text(
                                email,
                                style: const TextStyle(
                                  color: AppTheme.textMuted,
                                  fontSize: 11,
                                ),
                              )
                            : null,
                        activeColor: AppTheme.primary,
                        dense: true,
                        controlAffinity: ListTileControlAffinity.leading,
                      );
                    },
                  ),
          ),
        ],
      ],
    );
  }
}
