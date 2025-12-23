import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:developer' as developer;

// Background message handler - must be top-level function
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  developer.log('Background message received: ${message.messageId}');
  developer.log('Title: ${message.notification?.title}');
  developer.log('Body: ${message.notification?.body}');
  developer.log('Data: ${message.data}');
}

class FirebaseNotificationService {
  static final FirebaseNotificationService _instance =
      FirebaseNotificationService._internal();
  factory FirebaseNotificationService() => _instance;
  FirebaseNotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  bool _isInitialized = false;
  String? _fcmToken;

  String? get fcmToken => _fcmToken;

  /// Initialize Firebase Cloud Messaging
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Request notification permissions
      NotificationSettings settings =
          await _firebaseMessaging.requestPermission(
        alert: true,
        announcement: true,
        badge: true,
        carPlay: false,
        criticalAlert: true,
        provisional: false,
        sound: true,
      );

      developer.log('FCM Permission status: ${settings.authorizationStatus}');

      if (settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional) {
        // Initialize local notifications
        await _initializeLocalNotifications();

        // Get FCM token
        _fcmToken = await _firebaseMessaging.getToken();
        developer.log('FCM Token: $_fcmToken');

        // Save token to local storage
        if (_fcmToken != null) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('fcm_token', _fcmToken!);
        }

        // Subscribe to topics
        await _subscribeToTopics();

        // Set up message handlers
        _setupMessageHandlers();

        // Set up background message handler
        FirebaseMessaging.onBackgroundMessage(
            _firebaseMessagingBackgroundHandler);

        _isInitialized = true;
        developer.log('✅ Firebase Messaging initialized successfully');
      } else {
        developer.log('❌ Notification permissions denied');
      }
    } catch (e) {
      developer.log('❌ Error initializing Firebase Messaging: $e');
    }
  }

  /// Initialize local notifications for Android
  Future<void> _initializeLocalNotifications() async {
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings iosSettings =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Create notification channel for Android
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'pharma_alerts', // channel ID
      'Pharmacy Alerts', // channel name
      description: 'Notifications for sales, low stock, and expiry alerts',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    developer.log('✅ Local notifications initialized');
  }

  /// Subscribe to Firebase Cloud Messaging topics
  Future<void> _subscribeToTopics() async {
    try {
      await _firebaseMessaging.subscribeToTopic('all-users');
      await _firebaseMessaging.subscribeToTopic('sales-alerts');
      await _firebaseMessaging.subscribeToTopic('inventory-alerts');
      developer.log('✅ Subscribed to FCM topics');
    } catch (e) {
      developer.log('❌ Error subscribing to topics: $e');
    }
  }

  /// Set up Firebase message handlers
  void _setupMessageHandlers() {
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      developer.log('📩 Foreground message received');
      developer.log('Title: ${message.notification?.title}');
      developer.log('Body: ${message.notification?.body}');
      developer.log('Data: ${message.data}');

      // Show local notification when app is in foreground
      _showLocalNotification(message);
    });

    // Handle notification tap when app is in background/terminated
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      developer.log('📱 Notification tapped (background)');
      _handleNotificationTap(message.data);
    });

    // Check if app was opened from a notification (terminated state)
    _firebaseMessaging.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        developer.log('📱 App opened from notification (terminated)');
        _handleNotificationTap(message.data);
      }
    });
  }

  /// Show local notification
  Future<void> _showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) return;

    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'pharma_alerts',
      'Pharmacy Alerts',
      channelDescription: 'Notifications for sales, low stock, and expiry alerts',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      playSound: true,
      enableVibration: true,
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      details,
      payload: message.data.toString(),
    );
  }

  /// Handle notification tap
  void _handleNotificationTap(Map<String, dynamic> data) {
    developer.log('Notification tapped with data: $data');

    final type = data['type'] as String?;

    switch (type) {
      case 'SALE_COMPLETED':
        // Navigate to sales screen
        developer.log('Navigate to Sales screen');
        // TODO: Implement navigation
        break;
      case 'LOW_STOCK':
        // Navigate to inventory screen
        developer.log('Navigate to Inventory screen');
        // TODO: Implement navigation
        break;
      case 'EXPIRY_ALERT':
        // Navigate to expiry alerts screen
        developer.log('Navigate to Expiry Alerts screen');
        // TODO: Implement navigation
        break;
      default:
        developer.log('Unknown notification type: $type');
    }
  }

  /// Called when local notification is tapped
  void _onNotificationTapped(NotificationResponse response) {
    developer.log('Local notification tapped: ${response.payload}');
    // Parse payload and handle navigation
    // TODO: Implement navigation based on payload
  }

  /// Unsubscribe from all topics
  Future<void> unsubscribeFromAllTopics() async {
    try {
      await _firebaseMessaging.unsubscribeFromTopic('all-users');
      await _firebaseMessaging.unsubscribeFromTopic('sales-alerts');
      await _firebaseMessaging.unsubscribeFromTopic('inventory-alerts');
      developer.log('✅ Unsubscribed from all topics');
    } catch (e) {
      developer.log('❌ Error unsubscribing from topics: $e');
    }
  }

  /// Delete FCM token
  Future<void> deleteToken() async {
    try {
      await _firebaseMessaging.deleteToken();
      _fcmToken = null;
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('fcm_token');
      developer.log('✅ FCM token deleted');
    } catch (e) {
      developer.log('❌ Error deleting FCM token: $e');
    }
  }

  /// Get saved FCM token from local storage
  Future<String?> getSavedToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString('fcm_token');
    } catch (e) {
      developer.log('❌ Error getting saved token: $e');
      return null;
    }
  }

  /// Request notification permissions (useful for settings screen)
  Future<bool> requestPermissions() async {
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: true,
      badge: true,
      carPlay: false,
      criticalAlert: true,
      provisional: false,
      sound: true,
    );

    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }
}
