import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:pharma_care/data/services/api_service.dart';
import 'dart:io' show Platform;

class FirebaseMessagingService {
  static FirebaseMessagingService? _instance;
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  final ApiService _apiService = ApiService.instance;

  static FirebaseMessagingService get instance {
    _instance ??= FirebaseMessagingService._();
    return _instance!;
  }

  FirebaseMessagingService._();

  /// Initialize Firebase Cloud Messaging
  Future<void> initialize() async {
    print('🔔 Initializing Firebase Messaging...');

    // Request permission for iOS
    await _requestPermission();

    // Initialize local notifications
    await _initializeLocalNotifications();

    // Subscribe to topics
    await _subscribeToTopics();

    // Get FCM token and register device
    await _registerDevice();

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Handle notification taps
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

    // Check if app was opened from a terminated state via notification
    final initialMessage = await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      _handleMessageOpenedApp(initialMessage);
    }

    print('✅ Firebase Messaging initialized');
  }

  /// Request notification permissions (iOS)
  Future<void> _requestPermission() async {
    final settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    print('📱 Notification permission status: ${settings.authorizationStatus}');
  }

  /// Subscribe to Firebase Cloud Messaging topics
  Future<void> _subscribeToTopics() async {
    try {
      await _firebaseMessaging.subscribeToTopic('all-users');
      await _firebaseMessaging.subscribeToTopic('sales-alerts');
      await _firebaseMessaging.subscribeToTopic('inventory-alerts');
      print('✅ Subscribed to FCM topics');
    } catch (e) {
      print('❌ Error subscribing to topics: $e');
    }
  }

  /// Initialize local notifications for foreground handling
  Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Create notification channels for Android
    const androidChannel = AndroidNotificationChannel(
      'pharmacare_alerts',
      'PharmaCare Alerts',
      description: 'Inventory and expiry alerts',
      importance: Importance.high,
      enableVibration: true,
      playSound: true,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);
  }

  /// Register device with Firebase Cloud Functions
  Future<void> _registerDevice() async {
    try {
      final token = await _firebaseMessaging.getToken();

      if (token == null) {
        print('⚠️  FCM token is null');
        return;
      }

      print('📱 FCM Token: ${token.substring(0, 20)}...');

      // Get user ID from shared preferences
      final userId = await _apiService.getToken(); // Using this as userId for now

      if (userId == null) {
        print('⚠️  User not logged in, skipping device registration');
        return;
      }

      // Register with Firebase Cloud Function
      // Replace YOUR_REGION and YOUR_PROJECT with actual values
      const functionUrl = 'https://us-central1-pharmacare-app.cloudfunctions.net/registerDevice';

      final response = await _apiService.dio.post(
        functionUrl,
        data: {
          'fcmToken': token,
          'deviceId': await _getDeviceId(),
          'platform': Platform.isIOS ? 'ios' : 'android',
          'userId': userId,
        },
      );

      if (response.data['success'] == true) {
        print('✅ Device registered for notifications');
      }

      // Listen for token refresh
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        print('🔄 FCM token refreshed');
        _registerDevice();
      });
    } catch (e) {
      print('❌ Error registering device: $e');
    }
  }

  /// Get device identifier
  Future<String> _getDeviceId() async {
    // In production, use device_info_plus package to get actual device ID
    return 'device_${DateTime.now().millisecondsSinceEpoch}';
  }

  /// Handle foreground messages
  void _handleForegroundMessage(RemoteMessage message) {
    print('📬 Foreground message received');
    print('Title: ${message.notification?.title}');
    print('Body: ${message.notification?.body}');
    print('Data: ${message.data}');

    // Show local notification when app is in foreground
    _showLocalNotification(message);
  }

  /// Handle notification tap
  void _onNotificationTapped(NotificationResponse response) {
    print('🔔 Notification tapped');
    print('Payload: ${response.payload}');

    // Navigate to appropriate screen based on notification type
    // This will be implemented with navigation logic
    _handleNotificationNavigation(response.payload);
  }

  /// Handle when app is opened from notification
  void _handleMessageOpenedApp(RemoteMessage message) {
    print('🚀 App opened from notification');
    print('Data: ${message.data}');

    // Navigate based on notification type
    final type = message.data['type'];
    _handleNotificationNavigation(type);
  }

  /// Show local notification
  Future<void> _showLocalNotification(RemoteMessage message) async {
    const androidDetails = AndroidNotificationDetails(
      'pharmacare_alerts',
      'PharmaCare Alerts',
      channelDescription: 'Inventory and expiry alerts',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      enableVibration: true,
      playSound: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      message.hashCode,
      message.notification?.title ?? 'PharmaCare Alert',
      message.notification?.body ?? 'New notification',
      notificationDetails,
      payload: message.data['type'],
    );
  }

  /// Handle notification navigation
  void _handleNotificationNavigation(String? type) {
    if (type == null) return;

    print('🧭 Navigating for notification type: $type');

    switch (type) {
      case 'SALE_COMPLETED':
        // Navigate to sales screen
        print('📊 Navigate to Sales screen');
        break;
      case 'LOW_STOCK':
        // Navigate to inventory screen with low stock filter
        print('📦 Navigate to Inventory screen (Low Stock)');
        break;
      case 'EXPIRY_ALERT':
      case 'EXPIRING_SOON':
        // Navigate to expiry alerts screen
        print('⏰ Navigate to Expiry Alerts screen');
        break;
      default:
        print('Unknown notification type: $type');
    }
  }

  /// Unregister device (call on logout)
  Future<void> unregisterDevice() async {
    try {
      final token = await _firebaseMessaging.getToken();
      if (token == null) return;

      // Call Firebase Cloud Function
      const functionUrl = 'https://us-central1-pharmacare-app.cloudfunctions.net/unregisterDevice';

      await _apiService.dio.post(
        functionUrl,
        data: {'fcmToken': token},
      );

      print('✅ Device unregistered from notifications');
    } catch (e) {
      print('❌ Error unregistering device: $e');
    }
  }

  /// Get all alerts from Firebase Cloud Functions
  Future<List<Map<String, dynamic>>> getAlerts({bool unreadOnly = false}) async {
    try {
      const functionUrl = 'https://us-central1-pharmacare-app.cloudfunctions.net/getAlerts';

      final response = await _apiService.dio.get(
        '$functionUrl?unreadOnly=$unreadOnly',
      );

      if (response.data['success'] == true) {
        return List<Map<String, dynamic>>.from(response.data['data']);
      }

      return [];
    } catch (e) {
      print('❌ Error fetching alerts: $e');
      return [];
    }
  }

  /// Mark alert as read
  Future<bool> markAlertRead(String alertId) async {
    try {
      const functionUrl = 'https://us-central1-pharmacare-app.cloudfunctions.net/markAlertRead';

      final response = await _apiService.dio.post(
        functionUrl,
        data: {'alertId': alertId},
      );

      return response.data['success'] == true;
    } catch (e) {
      print('❌ Error marking alert as read: $e');
      return false;
    }
  }

  /// Mark all alerts as read
  Future<bool> markAllAlertsRead() async {
    try {
      const functionUrl = 'https://us-central1-pharmacare-app.cloudfunctions.net/markAllAlertsRead';

      final response = await _apiService.dio.post(functionUrl);

      return response.data['success'] == true;
    } catch (e) {
      print('❌ Error marking all alerts as read: $e');
      return false;
    }
  }
}

/// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('📭 Background message received');
  print('Title: ${message.notification?.title}');
  print('Body: ${message.notification?.body}');
  print('Data: ${message.data}');
}
