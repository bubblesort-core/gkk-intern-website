import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:internmobileapp/services/supabase_service.dart';

/// Dual notification system:
/// 1. POLLING — auto-detects new data in Supabase tables (announcements, resources, meetings)
/// 2. FCM — receives admin custom push notifications via Firebase Cloud Messaging
class NotificationService {
  static final NotificationService _instance = NotificationService._();
  factory NotificationService() => _instance;
  NotificationService._();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifs =
      FlutterLocalNotificationsPlugin();

  String? _currentToken;

  /// Unread notification count (polling + FCM combined)
  final ValueNotifier<int> unreadCount = ValueNotifier<int>(0);

  /// List of notification items
  final ValueNotifier<List<NotificationItem>> notifications =
      ValueNotifier<List<NotificationItem>>([]);

  /// Set of section table names that have unread content (for icon badges)
  final ValueNotifier<Set<String>> unreadSections = ValueNotifier<Set<String>>(
    {},
  );

  /// Callback for notification clicks
  void Function(String section)? onNotificationTap;

  /// Sections to monitor via polling
  static const _sections = [
    _Section('announcements', 'Announcement', Icons.campaign, 'created_at'),
    _Section('resources', 'Resource', Icons.menu_book, 'created_at'),
    _Section('sessions', 'Session', Icons.videocam, 'scheduled_start'),
  ];

  // ==========================================
  // INITIALIZATION
  // ==========================================

  final List<StreamSubscription> _subscriptions = [];

  Future<void> initialize() async {
    await _initFCM();
    await _initLocalNotifications();
    _initRealtimeListeners();
  }

  Future<void> _initFCM() async {
    try {
      // Request notification permission
      final settings = await _fcm.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional) {
        // Get token and save to Supabase
        final token = await _fcm.getToken();
        if (token != null) {
          _currentToken = token;
          await SupabaseService.saveFcmToken(token);
        }

        // Refresh token listener
        _fcm.onTokenRefresh.listen((newToken) {
          _currentToken = newToken;
          SupabaseService.saveFcmToken(newToken);
        });
      }

      // Foreground messages → show as local notification + add to list
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Background tap → navigate
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // App was terminated, opened from notification
      final initial = await _fcm.getInitialMessage();
      if (initial != null) _handleNotificationTap(initial);
    } catch (e) {
      debugPrint('FCM init error: $e');
    }
  }

  Future<void> _initLocalNotifications() async {
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInit);

    await _localNotifs.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (details) {
        final payload = details.payload;
        if (payload != null) {
          onNotificationTap?.call(payload);
        }
      },
    );

    // Create channel
    const channel = AndroidNotificationChannel(
      'gkk_intern_notifications',
      'GKK Intern Notifications',
      description: 'Admin push notifications from GKK Intern',
      importance: Importance.high,
    );

    await _localNotifs
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(channel);
  }

  void _handleNotificationTap(RemoteMessage message) {
    final section = message.data['section'] ?? 'push';
    onNotificationTap?.call(section);
  }

  void _initRealtimeListeners() {
    // Cancel any existing subscriptions
    for (var sub in _subscriptions) {
      sub.cancel();
    }
    _subscriptions.clear();

    // 1. Listen for new Notifications (history)
    _subscriptions.add(
      SupabaseService.getNotificationsStream().listen((data) {
        final List<NotificationItem> history = data.map((n) {
          return NotificationItem(
            title: n['title'] ?? 'GKK Notification',
            subtitle: n['message'] ?? n['body'] ?? '',
            icon: Icons.notifications_active,
            section: 'notifications',
            timestamp:
                DateTime.tryParse(n['created_at']?.toString() ?? '') ??
                DateTime.now(),
          );
        }).toList();

        _mergeAndNotify(history);
      }),
    );

    // 2. Listen for Announcements, Meetings, Resources to show badges
    for (final section in _sections) {
      Stream<List<Map<String, dynamic>>> stream;
      if (section.table == 'announcements') {
        stream = SupabaseService.getAnnouncementsStream();
      } else if (section.table == 'sessions') {
        stream = SupabaseService.getActiveSessionsStream();
      } else {
        stream = SupabaseService.getResourcesStream();
      }

      _subscriptions.add(
        stream.listen((data) async {
          final prefs = await SharedPreferences.getInstance();
          final lastSeen = prefs.getString('lastSeen_${section.table}');

          if (data.isNotEmpty) {
            final latestTime = data.first[section.timeField].toString();
            if (lastSeen == null || latestTime.compareTo(lastSeen) > 0) {
              final updatedSections = Set<String>.from(unreadSections.value);
              updatedSections.add(section.table);
              unreadSections.value = updatedSections;
            }
          }
        }),
      );
    }
  }

  void _mergeAndNotify(List<NotificationItem> history) {
    // Merge FCM-only notifications that might not be in the DB yet
    final fcmOnly = notifications.value
        .where((n) => n.section == 'push')
        .toList();

    // Sort combined list by timestamp
    final combined = [...history, ...fcmOnly];
    combined.sort((a, b) => b.timestamp.compareTo(a.timestamp));

    notifications.value = combined;
    unreadCount.value = combined.length;

    if (history.isNotEmpty) {
      final updatedSections = Set<String>.from(unreadSections.value);
      updatedSections.add('notifications');
      unreadSections.value = updatedSections;
    }
  }

  void _handleForegroundMessage(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    // Add to in-app notification list as 'push' (until it syncs from DB)
    final item = NotificationItem(
      title: notification.title ?? 'New Notification',
      subtitle: notification.body ?? '',
      icon: Icons.notifications_active,
      section: 'push',
      timestamp: DateTime.now(),
    );

    // Show local notification
    _localNotifs.show(
      notification.hashCode,
      notification.title ?? 'GKK Intern',
      notification.body ?? '',
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'gkk_intern_notifications',
          'GKK Intern Notifications',
          channelDescription: 'Admin push notifications from GKK Intern',
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
      ),
      payload: item.section,
    );

    final current = List<NotificationItem>.from(notifications.value);
    notifications.value = [item, ...current];
    unreadCount.value++;

    final updatedSections = Set<String>.from(unreadSections.value);
    updatedSections.add('push');
    unreadSections.value = updatedSections;
  }

  // (rest of the class remains similar but without old checkForUpdates logic)

  /// Mark a section as "seen"
  Future<void> markSectionSeen(String table) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final section = _sections.firstWhere(
        (s) => s.table == table,
        orElse: () => _sections.first,
      );

      final data = await SupabaseService.client
          .from(table)
          .select(section.timeField)
          .order(section.timeField, ascending: false)
          .limit(1);

      final results = List<Map<String, dynamic>>.from(data);
      if (results.isNotEmpty) {
        await prefs.setString(
          'lastSeen_$table',
          results.first[section.timeField].toString(),
        );
      }

      final updated = notifications.value
          .where((n) => n.section != table)
          .toList();
      notifications.value = updated;
      unreadCount.value = updated.length;

      // Remove from badge set
      final updatedSections = Set<String>.from(unreadSections.value);
      updatedSections.remove(table);
      unreadSections.value = updatedSections;
    } catch (_) {}
  }

  /// Clear all notifications
  void clearAll() {
    notifications.value = [];
    unreadCount.value = 0;
    unreadSections.value = {};
  }

  /// Clean up FCM token from Supabase (typically on logout)
  Future<void> clearToken() async {
    if (_currentToken != null) {
      await SupabaseService.removeFcmToken(_currentToken!);
      _currentToken = null;
    }
  }
}

// ==========================================
// DATA CLASSES
// ==========================================

class NotificationItem {
  final String title;
  final String subtitle;
  final IconData icon;
  final String section; // table name or 'push' for FCM
  final DateTime timestamp;

  const NotificationItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.section,
    required this.timestamp,
  });
}

class _Section {
  final String table;
  final String label;
  final IconData icon;
  final String timeField;
  const _Section(this.table, this.label, this.icon, this.timeField);
}

/// Required top-level handler for background FCM messages
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Auto-displayed by Android system — handler required but minimal
}
