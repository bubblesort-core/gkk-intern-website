import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import '../core/supabase_client.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('Background Firebase Init Error: $e');
  }
  debugPrint("Handling a background message: ${message.messageId}");
}

class NotificationService {
  static Future<void> initialize() async {
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Request permissions (important for iOS)
      await FirebaseMessaging.instance.requestPermission(
        alert: true,
        badge: true,
        sound: true,
      );

      // Listen to foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint('Got a message whilst in the foreground!');
        if (message.notification != null) {
          debugPrint('Notification Title: ${message.notification?.title}');
          debugPrint('Notification Body: ${message.notification?.body}');
        }
      });
    } catch (e) {
      debugPrint('Firebase initialization failed (probably missing google-services.json): $e');
    }
  }

  static Future<void> updateFcmToken(String userId) async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) return;

      final client = SupabaseClientConfig.client;
      final profileResponse = await client
          .from('profiles')
          .select('fcm_token')
          .eq('id', userId)
          .maybeSingle();
      
      if (profileResponse != null) {
        List<dynamic> currentTokens = profileResponse['fcm_token'] ?? [];
        if (!currentTokens.contains(token)) {
          currentTokens.add(token);
          await client.from('profiles').update({
            'fcm_token': currentTokens,
          }).eq('id', userId);
          debugPrint('FCM Token updated successfully.');
        }
      }
    } catch (e) {
      debugPrint('Failed to update FCM token: $e');
    }
  }
}
