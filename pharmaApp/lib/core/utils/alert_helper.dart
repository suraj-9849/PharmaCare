import 'package:flutter/material.dart';
import 'package:pharma_care/core/constants/app_colors.dart';

enum AlertType {
  expired,
  expiringSoon,
  lowStock,
  outOfStock,
  reorder,
  incorrectPick,
  info
}

class AlertHelper {
  static Color getAlertColor(String alertType) {
    switch (alertType.toUpperCase()) {
      case 'EXPIRED':
      case 'OUT_OF_STOCK':
      case 'CRITICAL':
        return AppColors.alertCritical;
      case 'EXPIRING_SOON':
      case 'LOW_STOCK':
      case 'WARNING':
        return AppColors.alertWarning;
      case 'REORDER':
      case 'INFO':
        return AppColors.alertInfo;
      default:
        return AppColors.textSecondary;
    }
  }

  static IconData getAlertIcon(String alertType) {
    switch (alertType.toUpperCase()) {
      case 'EXPIRED':
        return Icons.dangerous_outlined;
      case 'EXPIRING_SOON':
        return Icons.warning_amber_outlined;
      case 'LOW_STOCK':
        return Icons.inventory_2_outlined;
      case 'OUT_OF_STOCK':
        return Icons.remove_circle_outline;
      case 'REORDER':
        return Icons.shopping_cart_outlined;
      case 'INCORRECT_PICK':
        return Icons.error_outline;
      default:
        return Icons.info_outline;
    }
  }

  static String getAlertPriority(String alertType) {
    switch (alertType.toUpperCase()) {
      case 'EXPIRED':
      case 'OUT_OF_STOCK':
        return 'HIGH';
      case 'EXPIRING_SOON':
      case 'LOW_STOCK':
      case 'INCORRECT_PICK':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  static Color getStockStatusColor(int quantity, int reorderLevel) {
    if (quantity == 0) {
      return AppColors.stockOut;
    } else if (quantity <= reorderLevel * 0.5) {
      return AppColors.stockCritical;
    } else if (quantity <= reorderLevel) {
      return AppColors.stockLow;
    } else {
      return AppColors.stockGood;
    }
  }

  static String getStockStatusText(int quantity, int reorderLevel) {
    if (quantity == 0) {
      return 'Out of Stock';
    } else if (quantity <= reorderLevel * 0.5) {
      return 'Critical';
    } else if (quantity <= reorderLevel) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  }

  static void showSnackBar(
    BuildContext context,
    String message, {
    bool isError = false,
    Duration duration = const Duration(seconds: 3),
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.error : AppColors.success,
        duration: duration,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }

  static Future<bool?> showConfirmDialog(
    BuildContext context, {
    required String title,
    required String message,
    String confirmText = 'Confirm',
    String cancelText = 'Cancel',
  }) {
    return showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(cancelText),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: Text(confirmText),
          ),
        ],
      ),
    );
  }
}
