import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:admin_mobile_app/theme/app_theme.dart';
import 'package:admin_mobile_app/services/admin_supabase_service.dart';
import 'package:admin_mobile_app/widgets/target_selector.dart';

class MeetingsScreen extends StatefulWidget {
  const MeetingsScreen({super.key});
  @override
  State<MeetingsScreen> createState() => _MeetingsScreenState();
}

class _MeetingsScreenState extends State<MeetingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Sessions
  List<Map<String, dynamic>> _sessions = [];
  bool _loadingSessions = true;
  final TextEditingController _sessionSearchCtrl = TextEditingController();
  String _sessionSearch = '';

  // Recordings
  List<Map<String, dynamic>> _recordings = [];
  bool _loadingRecordings = true;
  final TextEditingController _recSearchCtrl = TextEditingController();
  String _recSearch = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadSessions();
    _loadRecordings();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _sessionSearchCtrl.dispose();
    _recSearchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadSessions() async {
    setState(() => _loadingSessions = true);
    final data = await AdminSupabaseService.getAllSessions();
    if (mounted) {
      setState(() {
        _sessions = data;
        _loadingSessions = false;
      });
    }
  }

  Future<void> _loadRecordings() async {
    setState(() => _loadingRecordings = true);
    final data = await AdminSupabaseService.getAllRecordings();
    if (mounted) {
      setState(() {
        _recordings = data;
        _loadingRecordings = false;
      });
    }
  }

  // ────────────────────────────────────────────────
  // BUILD
  // ────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        children: [
          // Tab bar
          Container(
            margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            decoration: BoxDecoration(
              color: AppTheme.bgCard,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: TabBar(
              controller: _tabController,
              indicatorSize: TabBarIndicatorSize.tab,
              indicatorColor: AppTheme.primary,
              labelColor: AppTheme.primary,
              unselectedLabelColor: AppTheme.textMuted,
              dividerHeight: 0,
              tabs: const [
                Tab(
                  text: 'Sessions',
                  icon: Icon(Icons.videocam, size: 18),
                ),
                Tab(
                  text: 'Recordings',
                  icon: Icon(Icons.play_circle_outline, size: 18),
                ),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildSessionsTab(),
                _buildRecordingsTab(),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          if (_tabController.index == 0) {
            _showSessionDialog();
          } else {
            _showRecordingDialog();
          }
        },
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  // ────────────────────────────────────────────────
  // SESSIONS TAB
  // ────────────────────────────────────────────────

  Widget _buildSessionsTab() {
    return RefreshIndicator(
      color: AppTheme.primary,
      backgroundColor: AppTheme.bgCard,
      onRefresh: _loadSessions,
      child: _loadingSessions
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            )
          : Column(
              children: [
                _buildSearchBar(
                  _sessionSearchCtrl,
                  _sessionSearch,
                  'Search sessions...',
                  (val) => setState(() => _sessionSearch = val),
                ),
                Expanded(child: _buildSessionsList()),
              ],
            ),
    );
  }

  Widget _buildSessionsList() {
    final filtered = _sessions.where((m) {
      final title = (m['title'] ?? '').toString().toLowerCase();
      return title.contains(_sessionSearch.toLowerCase());
    }).toList();

    if (filtered.isEmpty) {
      return _buildEmpty(
        Icons.videocam_outlined,
        _sessionSearch.isEmpty ? 'No sessions yet' : 'No results found',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filtered.length,
      itemBuilder: (ctx, i) => _buildSessionCard(filtered[i]),
    );
  }

  Widget _buildSessionCard(Map<String, dynamic> m) {
    final isLive = m['status'] == 'live';
    final isScheduled = m['status'] == 'scheduled';
    final targetType = m['target_type'] ?? 'all';
    final targetIds = List.from(m['target_ids'] ?? []);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isLive
              ? AppTheme.success.withValues(alpha: 0.3)
              : isScheduled
                  ? AppTheme.warning.withValues(alpha: 0.3)
                  : AppTheme.border,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: (isLive
                      ? AppTheme.success
                      : isScheduled
                          ? AppTheme.warning
                          : AppTheme.textMuted)
                  .withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              Icons.videocam,
              color: isLive
                  ? AppTheme.success
                  : isScheduled
                      ? AppTheme.warning
                      : AppTheme.textMuted,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  m['title'] ?? 'Meeting',
                  style: const TextStyle(
                    color: AppTheme.textMain,
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                ),
                Row(
                  children: [
                    Text(
                      m['platform'] == 'youtube' ? 'YouTube' : 'Google Meet',
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.info.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        targetType == 'all'
                            ? 'All'
                            : '${targetType.toUpperCase()} (${targetIds.length})',
                        style: const TextStyle(
                          color: AppTheme.info,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          // Action buttons
          if (isScheduled)
            TextButton(
              onPressed: () => _goLive(m),
              child: const Text(
                'GO LIVE',
                style: TextStyle(
                  color: AppTheme.success,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            )
          else if (isLive)
            TextButton(
              onPressed: () => _endSession(m),
              child: const Text(
                'END',
                style: TextStyle(
                  color: AppTheme.error,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            )
          else
            Text(
              m['status'] ?? 'Ended',
              style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
            ),
          PopupMenuButton<String>(
            icon: const Icon(
              Icons.more_vert,
              size: 18,
              color: AppTheme.textMuted,
            ),
            onSelected: (val) {
              if (val == 'edit') {
                _showSessionDialog(m);
              } else if (val == 'delete') {
                _confirmDeleteSession(m);
              }
            },
            itemBuilder: (ctx) => [
              const PopupMenuItem(value: 'edit', child: Text('Edit')),
              const PopupMenuItem(
                value: 'delete',
                child: Text(
                  'Delete',
                  style: TextStyle(color: AppTheme.error),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ────────────────────────────────────────────────
  // RECORDINGS TAB
  // ────────────────────────────────────────────────

  Widget _buildRecordingsTab() {
    return RefreshIndicator(
      color: AppTheme.primary,
      backgroundColor: AppTheme.bgCard,
      onRefresh: _loadRecordings,
      child: _loadingRecordings
          ? const Center(
              child: CircularProgressIndicator(color: AppTheme.primary),
            )
          : Column(
              children: [
                _buildSearchBar(
                  _recSearchCtrl,
                  _recSearch,
                  'Search recordings...',
                  (val) => setState(() => _recSearch = val),
                ),
                Expanded(child: _buildRecordingsList()),
              ],
            ),
    );
  }

  Widget _buildRecordingsList() {
    final filtered = _recordings.where((r) {
      final title = (r['title'] ?? '').toString().toLowerCase();
      return title.contains(_recSearch.toLowerCase());
    }).toList();

    if (filtered.isEmpty) {
      return _buildEmpty(
        Icons.play_circle_outline,
        _recSearch.isEmpty ? 'No recordings yet' : 'No results found',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: filtered.length,
      itemBuilder: (ctx, i) => _buildRecordingCard(filtered[i]),
    );
  }

  Widget _buildRecordingCard(Map<String, dynamic> r) {
    final videoId =
        r['youtube_video_id'] ?? _extractVideoId(r['youtube_url']);
    final thumbUrl = videoId != null
        ? 'https://img.youtube.com/vi/$videoId/mqdefault.jpg'
        : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppTheme.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Thumbnail
          if (thumbUrl != null)
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
              child: Stack(
                children: [
                  AspectRatio(
                    aspectRatio: 16 / 9,
                    child: Image.network(
                      thumbUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, _, _) => Container(
                        color: Colors.black26,
                        child: const Center(
                          child: Icon(
                            Icons.play_circle_outline,
                            color: Colors.white54,
                            size: 48,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Positioned.fill(
                    child: Center(
                      child: Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withValues(alpha: 0.9),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.play_arrow,
                          color: Colors.white,
                          size: 32,
                        ),
                      ),
                    ),
                  ),
                  if (r['duration_label'] != null)
                    Positioned(
                      bottom: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.8),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          r['duration_label'],
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          // Info
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        r['title'] ?? 'Recording',
                        style: const TextStyle(
                          color: AppTheme.textMain,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        r['created_at'] != null
                            ? DateTime.tryParse(r['created_at'])
                                    ?.toString()
                                    .substring(0, 10) ??
                                ''
                            : '',
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                // Watch button
                if (r['youtube_url'] != null)
                  IconButton(
                    onPressed: () => _openUrl(r['youtube_url']),
                    icon: const Icon(Icons.open_in_new, size: 20),
                    color: AppTheme.primary,
                    tooltip: 'Watch',
                  ),
                PopupMenuButton<String>(
                  icon: const Icon(
                    Icons.more_vert,
                    size: 18,
                    color: AppTheme.textMuted,
                  ),
                  onSelected: (val) {
                    if (val == 'edit') {
                      _showRecordingDialog(r);
                    } else if (val == 'delete') {
                      _confirmDeleteRecording(r);
                    }
                  },
                  itemBuilder: (ctx) => [
                    const PopupMenuItem(value: 'edit', child: Text('Edit')),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Text(
                        'Delete',
                        style: TextStyle(color: AppTheme.error),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ────────────────────────────────────────────────
  // SHARED WIDGETS
  // ────────────────────────────────────────────────

  Widget _buildSearchBar(
    TextEditingController ctrl,
    String query,
    String hint,
    ValueChanged<String> onChanged,
  ) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: TextField(
        controller: ctrl,
        onChanged: onChanged,
        style: const TextStyle(color: AppTheme.textMain),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: AppTheme.textMuted),
          prefixIcon: const Icon(Icons.search, color: AppTheme.textMuted),
          suffixIcon: query.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.clear, color: AppTheme.textMuted),
                  onPressed: () {
                    ctrl.clear();
                    onChanged('');
                  },
                )
              : null,
          filled: true,
          fillColor: AppTheme.bgCard,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: AppTheme.border),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: AppTheme.border),
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty(IconData icon, String msg) {
    return ListView(
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.15),
        Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 48,
                color: AppTheme.textMuted.withValues(alpha: 0.4),
              ),
              const SizedBox(height: 12),
              Text(msg, style: const TextStyle(color: AppTheme.textMuted)),
            ],
          ),
        ),
      ],
    );
  }

  // ────────────────────────────────────────────────
  // SESSION ACTIONS
  // ────────────────────────────────────────────────

  Future<void> _goLive(Map<String, dynamic> m) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text(
          'Go Live',
          style: TextStyle(color: AppTheme.textMain),
        ),
        content: Text(
          'Start "${m['title']}" now? Any currently live session will be ended.',
          style: const TextStyle(color: AppTheme.textBody),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppTheme.textMuted),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.success),
            child: const Text(
              'Go Live',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
    if (ok == true) {
      await AdminSupabaseService.goLiveSession(m['id'].toString());
      _loadSessions();
    }
  }

  Future<void> _endSession(Map<String, dynamic> m) async {
    await AdminSupabaseService.endSession(m['id'].toString());
    _loadSessions();
  }

  Future<void> _confirmDeleteSession(Map<String, dynamic> m) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text(
          'Delete Session',
          style: TextStyle(color: AppTheme.textMain),
        ),
        content: Text(
          'Delete "${m['title']}"? This will also remove chat messages and unlink recordings.',
          style: const TextStyle(color: AppTheme.textBody),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppTheme.textMuted),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Delete',
              style: TextStyle(color: AppTheme.error),
            ),
          ),
        ],
      ),
    );
    if (ok == true) {
      await AdminSupabaseService.deleteSession(m['id'].toString());
      _loadSessions();
    }
  }

  void _showSessionDialog([Map<String, dynamic>? m]) {
    final titleCtrl = TextEditingController(text: m?['title']);
    final linkCtrl = TextEditingController(
      text: m?['video_url'] ?? m?['join_url'],
    );
    String platform = m?['platform'] ?? 'google_meet';
    String targetType = m?['target_type'] ?? 'all';
    List<String> targetIds = List<String>.from(m?['target_ids'] ?? []);
    DateTime? scheduledStart = m?['scheduled_start'] != null
        ? DateTime.parse(m!['scheduled_start'])
        : null;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          backgroundColor: AppTheme.bgCard,
          title: Text(
            m == null ? 'Schedule Session' : 'Edit Session',
            style: const TextStyle(color: AppTheme.textMain),
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: titleCtrl,
                  style: const TextStyle(color: AppTheme.textMain),
                  decoration: const InputDecoration(
                    labelText: 'Title',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                    fillColor: AppTheme.bgBody,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: linkCtrl,
                  style: const TextStyle(color: AppTheme.textMain),
                  decoration: const InputDecoration(
                    labelText: 'Meeting Link',
                    labelStyle: TextStyle(color: AppTheme.textMuted),
                    fillColor: AppTheme.bgBody,
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: platform,
                  dropdownColor: AppTheme.bgCard,
                  decoration: const InputDecoration(
                    labelText: 'Platform',
                    fillColor: AppTheme.bgBody,
                  ),
                  style: const TextStyle(color: AppTheme.textMain),
                  items: const [
                    DropdownMenuItem(
                      value: 'google_meet',
                      child: Text('Google Meet'),
                    ),
                    DropdownMenuItem(
                      value: 'youtube',
                      child: Text('YouTube Live'),
                    ),
                  ],
                  onChanged: (val) =>
                      setDialogState(() => platform = val!),
                ),
                const SizedBox(height: 12),
                ListTile(
                  title: Text(
                    scheduledStart == null
                        ? 'Instant (Now)'
                        : 'Scheduled: ${scheduledStart!.toString().substring(0, 16)}',
                    style: TextStyle(
                      color: scheduledStart == null
                          ? AppTheme.success
                          : AppTheme.textMain,
                      fontSize: 13,
                    ),
                  ),
                  subtitle: const Text(
                    'Tap to change date',
                    style: TextStyle(
                      fontSize: 11,
                      color: AppTheme.textMuted,
                    ),
                  ),
                  onTap: () async {
                    final d = await showDatePicker(
                      context: ctx,
                      initialDate: scheduledStart ?? DateTime.now(),
                      firstDate: DateTime.now(),
                      lastDate:
                          DateTime.now().add(const Duration(days: 365)),
                    );
                    if (d != null) {
                      if (!ctx.mounted) return;
                      final t = await showTimePicker(
                        context: ctx,
                        initialTime: TimeOfDay.fromDateTime(
                          scheduledStart ?? DateTime.now(),
                        ),
                      );
                      if (t != null) {
                        setDialogState(() {
                          scheduledStart = DateTime(
                            d.year,
                            d.month,
                            d.day,
                            t.hour,
                            t.minute,
                          );
                        });
                      }
                    } else {
                      setDialogState(() => scheduledStart = null);
                    }
                  },
                  trailing: scheduledStart != null
                      ? IconButton(
                          icon: const Icon(
                            Icons.clear,
                            color: AppTheme.error,
                          ),
                          onPressed: () => setDialogState(
                            () => scheduledStart = null,
                          ),
                        )
                      : null,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: const BorderSide(color: AppTheme.border),
                  ),
                ),
                const Divider(height: 32),
                TargetSelector(
                  initialType: targetType,
                  initialIds: targetIds,
                  onChanged: (t, ids) {
                    targetType = t;
                    targetIds = ids;
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text(
                'Cancel',
                style: TextStyle(color: AppTheme.textMuted),
              ),
            ),
            ElevatedButton(
              onPressed: () async {
                final link = linkCtrl.text.trim();
                final data = {
                  'title': titleCtrl.text.trim(),
                  'platform': platform,
                  'status':
                      scheduledStart == null ? 'live' : 'scheduled',
                  'target_type': targetType,
                  'target_ids': targetIds,
                  'scheduled_start':
                      scheduledStart?.toIso8601String() ??
                      DateTime.now().toIso8601String(),
                };

                if (platform == 'youtube') {
                  data['video_url'] = link;
                } else if (platform == 'google_meet') {
                  data['join_url'] = link;
                }

                if (scheduledStart == null) {
                  data['actual_start'] =
                      DateTime.now().toIso8601String();
                }

                if (m == null) {
                  await AdminSupabaseService.createSession(data);
                } else {
                  await AdminSupabaseService.updateSession(
                    m['id'].toString(),
                    data,
                  );
                }
                if (ctx.mounted) Navigator.pop(ctx);
                _loadSessions();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
              ),
              child: Text(
                m == null ? 'Create' : 'Save',
                style: const TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ────────────────────────────────────────────────
  // RECORDING ACTIONS
  // ────────────────────────────────────────────────

  void _showRecordingDialog([Map<String, dynamic>? r]) {
    final titleCtrl = TextEditingController(text: r?['title']);
    final urlCtrl = TextEditingController(text: r?['youtube_url']);
    final durationCtrl = TextEditingController(text: r?['duration_label']);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: Text(
          r == null ? 'Add Recording' : 'Edit Recording',
          style: const TextStyle(color: AppTheme.textMain),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleCtrl,
                style: const TextStyle(color: AppTheme.textMain),
                decoration: const InputDecoration(
                  labelText: 'Title',
                  labelStyle: TextStyle(color: AppTheme.textMuted),
                  fillColor: AppTheme.bgBody,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: urlCtrl,
                style: const TextStyle(color: AppTheme.textMain),
                decoration: const InputDecoration(
                  labelText: 'YouTube URL',
                  labelStyle: TextStyle(color: AppTheme.textMuted),
                  fillColor: AppTheme.bgBody,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: durationCtrl,
                style: const TextStyle(color: AppTheme.textMain),
                decoration: const InputDecoration(
                  labelText: 'Duration (e.g. 45:30)',
                  labelStyle: TextStyle(color: AppTheme.textMuted),
                  fillColor: AppTheme.bgBody,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppTheme.textMuted),
            ),
          ),
          ElevatedButton(
            onPressed: () async {
              final title = titleCtrl.text.trim();
              final url = urlCtrl.text.trim();
              if (title.isEmpty || url.isEmpty) return;

              final vid = _extractVideoId(url);
              final data = {
                'title': title,
                'youtube_url': url,
                'youtube_video_id': vid,
                'thumbnail_url': vid != null
                    ? 'https://img.youtube.com/vi/$vid/maxresdefault.jpg'
                    : null,
                'duration_label': durationCtrl.text.trim().isNotEmpty
                    ? durationCtrl.text.trim()
                    : null,
              };

              if (r == null) {
                await AdminSupabaseService.createRecording(data);
              } else {
                await AdminSupabaseService.updateRecording(
                  r['id'].toString(),
                  data,
                );
              }
              if (ctx.mounted) Navigator.pop(ctx);
              _loadRecordings();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
            ),
            child: Text(
              r == null ? 'Add' : 'Save',
              style: const TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDeleteRecording(Map<String, dynamic> r) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.bgCard,
        title: const Text(
          'Delete Recording',
          style: TextStyle(color: AppTheme.textMain),
        ),
        content: Text(
          'Delete "${r['title']}"?',
          style: const TextStyle(color: AppTheme.textBody),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text(
              'Cancel',
              style: TextStyle(color: AppTheme.textMuted),
            ),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text(
              'Delete',
              style: TextStyle(color: AppTheme.error),
            ),
          ),
        ],
      ),
    );
    if (ok == true) {
      await AdminSupabaseService.deleteRecording(r['id'].toString());
      _loadRecordings();
    }
  }

  // ────────────────────────────────────────────────
  // HELPERS
  // ────────────────────────────────────────────────

  String? _extractVideoId(String? url) {
    if (url == null) return null;
    final match = RegExp(
      r'(?:youtu\.be/|youtube\.com/(?:embed/|v/|watch\?v=|watch\?.+&v=))([^"&?/\s]{11})',
    ).firstMatch(url);
    return match?.group(1);
  }

  Future<void> _openUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }
}
