import 'package:intl/intl.dart';

class DateFormatter {
  static String formatDate(DateTime date) {
    return DateFormat('dd MMM yyyy').format(date);
  }

  static String formatDateTime(DateTime date) {
    return DateFormat('dd MMM yyyy, hh:mm a').format(date);
  }

  static String formatTime(DateTime date) {
    return DateFormat('hh:mm a').format(date);
  }

  static String formatDateShort(DateTime date) {
    return DateFormat('dd/MM/yyyy').format(date);
  }

  static String getDaysUntilExpiry(DateTime expiryDate) {
    final now = DateTime.now();
    final difference = expiryDate.difference(now).inDays;

    if (difference < 0) {
      return 'Expired ${difference.abs()} days ago';
    } else if (difference == 0) {
      return 'Expires today';
    } else if (difference == 1) {
      return 'Expires tomorrow';
    } else if (difference < 7) {
      return 'Expires in $difference days';
    } else if (difference < 30) {
      final weeks = (difference / 7).floor();
      return 'Expires in $weeks ${weeks == 1 ? 'week' : 'weeks'}';
    } else if (difference < 365) {
      final months = (difference / 30).floor();
      return 'Expires in $months ${months == 1 ? 'month' : 'months'}';
    } else {
      final years = (difference / 365).floor();
      return 'Expires in $years ${years == 1 ? 'year' : 'years'}';
    }
  }

  static String getRelativeTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      final minutes = difference.inMinutes;
      return '$minutes ${minutes == 1 ? 'minute' : 'minutes'} ago';
    } else if (difference.inHours < 24) {
      final hours = difference.inHours;
      return '$hours ${hours == 1 ? 'hour' : 'hours'} ago';
    } else if (difference.inDays < 7) {
      final days = difference.inDays;
      return '$days ${days == 1 ? 'day' : 'days'} ago';
    } else {
      return formatDate(dateTime);
    }
  }

  static bool isExpiringSoon(DateTime expiryDate, {int daysThreshold = 30}) {
    final now = DateTime.now();
    final difference = expiryDate.difference(now).inDays;
    return difference >= 0 && difference <= daysThreshold;
  }

  static bool isExpired(DateTime expiryDate) {
    return DateTime.now().isAfter(expiryDate);
  }
}
