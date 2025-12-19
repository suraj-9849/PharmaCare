import 'package:pharma_care/data/services/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class NotificationModel {
  final String id;
  final String title;
  final String message;
  final String type; // 'SALE_COMPLETED', 'LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRY_ALERT'
  final DateTime createdAt;
  bool isRead;
  final Map<String, dynamic>? data;

  NotificationModel({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.createdAt,
    this.isRead = false,
    this.data,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? json['body'] ?? '',
      type: json['type'] ?? json['alertType'] ?? 'UNKNOWN',
      createdAt: json['createdAt'] != null 
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      isRead: json['isRead'] ?? false,
      data: json['data'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'message': message,
      'type': type,
      'createdAt': createdAt.toIso8601String(),
      'isRead': isRead,
      'data': data,
    };
  }
}

class NotificationService {
  static NotificationService? _instance;
  final ApiService _apiService = ApiService.instance;
  final String _notificationsKey = 'local_notifications';

  static NotificationService get instance {
    _instance ??= NotificationService._();
    return _instance!;
  }

  NotificationService._();

  /// Get all notifications (local + server)
  Future<List<NotificationModel>> getAllNotifications() async {
    try {
      // Get local notifications
      final localNotifications = await _getLocalNotifications();

      // Get server notifications (stock alerts)
      try {
        final response = await _apiService.dio.get('/alerts');
        if (response.statusCode == 200 && response.data['success'] == true) {
          final serverAlerts = (response.data['data'] as List)
              .map((alert) => NotificationModel(
                    id: alert['id'],
                    title: _getAlertTitle(alert['alertType']),
                    message: alert['message'],
                    type: alert['alertType'],
                    createdAt: DateTime.parse(alert['createdAt']),
                    isRead: alert['isRead'] ?? false,
                    data: {
                      'drugId': alert['drugId'],
                      'drugName': alert['drug']['brandName'],
                    },
                  ))
              .toList();

          // Merge local and server notifications
          final allNotifications = [...localNotifications, ...serverAlerts];
          
          // Sort by date (newest first)
          allNotifications.sort((a, b) => b.createdAt.compareTo(a.createdAt));
          
          return allNotifications;
        }
      } catch (e) {
        print('⚠️ Failed to fetch server alerts: $e');
      }

      return localNotifications;
    } catch (e) {
      print('❌ Error getting notifications: $e');
      return [];
    }
  }

  /// Get unread notifications
  Future<List<NotificationModel>> getUnreadNotifications() async {
    final allNotifications = await getAllNotifications();
    return allNotifications.where((n) => !n.isRead).toList();
  }

  /// Get low stock notifications only
  Future<List<NotificationModel>> getLowStockNotifications() async {
    final allNotifications = await getAllNotifications();
    return allNotifications
        .where((n) => n.type == 'LOW_STOCK' || n.type == 'OUT_OF_STOCK')
        .toList();
  }

  /// Add a new notification locally
  Future<void> addNotification(NotificationModel notification) async {
    try {
      final notifications = await _getLocalNotifications();
      notifications.insert(0, notification); // Add to beginning
      
      // Keep only last 100 notifications
      if (notifications.length > 100) {
        notifications.removeRange(100, notifications.length);
      }
      
      await _saveLocalNotifications(notifications);
    } catch (e) {
      print('❌ Error adding notification: $e');
    }
  }

  /// Mark notification as read
  Future<void> markAsRead(String id) async {
    try {
      // Try to mark as read on server first (if it's a server alert)
      try {
        await _apiService.dio.patch('/alerts/$id/read');
      } catch (e) {
        print('⚠️ Not a server alert or failed to update: $e');
      }

      // Update local notification
      final notifications = await _getLocalNotifications();
      final index = notifications.indexWhere((n) => n.id == id);
      if (index != -1) {
        notifications[index].isRead = true;
        await _saveLocalNotifications(notifications);
      }
    } catch (e) {
      print('❌ Error marking notification as read: $e');
    }
  }

  /// Delete a notification
  Future<void> deleteNotification(String id) async {
    try {
      // Try to delete from server first (if it's a server alert)
      try {
        await _apiService.dio.delete('/alerts/$id');
      } catch (e) {
        print('⚠️ Not a server alert or failed to delete: $e');
      }

      // Delete from local storage
      final notifications = await _getLocalNotifications();
      notifications.removeWhere((n) => n.id == id);
      await _saveLocalNotifications(notifications);
    } catch (e) {
      print('❌ Error deleting notification: $e');
    }
  }

  /// Clear all notifications
  Future<void> clearAllNotifications() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_notificationsKey);
    } catch (e) {
      print('❌ Error clearing notifications: $e');
    }
  }

  /// Get local notifications from storage
  Future<List<NotificationModel>> _getLocalNotifications() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final notificationsJson = prefs.getString(_notificationsKey);
      
      if (notificationsJson == null) return [];
      
      final List<dynamic> decoded = json.decode(notificationsJson);
      return decoded.map((n) => NotificationModel.fromJson(n)).toList();
    } catch (e) {
      print('❌ Error loading local notifications: $e');
      return [];
    }
  }

  /// Save notifications to local storage
  Future<void> _saveLocalNotifications(List<NotificationModel> notifications) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final notificationsJson = json.encode(
        notifications.map((n) => n.toJson()).toList(),
      );
      await prefs.setString(_notificationsKey, notificationsJson);
    } catch (e) {
      print('❌ Error saving local notifications: $e');
    }
  }

  /// Helper to get alert title based on type
  String _getAlertTitle(String alertType) {
    switch (alertType) {
      case 'LOW_STOCK':
        return '⚠️ Low Stock Alert';
      case 'OUT_OF_STOCK':
        return '🚨 Out of Stock';
      case 'EXPIRY_ALERT':
      case 'EXPIRING_SOON':
        return '⏰ Expiry Alert';
      case 'SALE_COMPLETED':
        return '✅ Sale Completed';
      default:
        return '📬 Notification';
    }
  }

  /// Register device for push notifications
  Future<bool> registerDevice(String fcmToken, {String? deviceId, String? platform}) async {
    try {
      final response = await _apiService.dio.post('/devices/register', data: {
        'fcmToken': fcmToken,
        'deviceId': deviceId,
        'platform': platform,
      });

      return response.statusCode == 200 && response.data['success'] == true;
    } catch (e) {
      print('❌ Error registering device: $e');
      return false;
    }
  }

  /// Unregister device (on logout)
  Future<bool> unregisterDevice(String fcmToken) async {
    try {
      final response = await _apiService.dio.post('/devices/unregister', data: {
        'fcmToken': fcmToken,
      });

      return response.statusCode == 200;
    } catch (e) {
      print('❌ Error unregistering device: $e');
      return false;
    }
  }
}
