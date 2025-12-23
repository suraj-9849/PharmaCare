import 'package:json_annotation/json_annotation.dart';
import 'package:pharma_care/data/models/drug.dart';

part 'stock_alert.g.dart';

@JsonSerializable()
class StockAlert {
  final String id;
  final String drugId;
  final String alertType;
  final String message;
  final bool isRead;
  final DateTime createdAt;
  final Drug? drug;

  StockAlert({
    required this.id,
    required this.drugId,
    required this.alertType,
    required this.message,
    required this.isRead,
    required this.createdAt,
    this.drug,
  });

  factory StockAlert.fromJson(Map<String, dynamic> json) =>
      _$StockAlertFromJson(json);
  Map<String, dynamic> toJson() => _$StockAlertToJson(this);

  String get priority {
    switch (alertType.toUpperCase()) {
      case 'EXPIRED':
      case 'OUT_OF_STOCK':
        return 'HIGH';
      case 'EXPIRING_SOON':
      case 'LOW_STOCK':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  }

  bool get isHighPriority => priority == 'HIGH';
  bool get isMediumPriority => priority == 'MEDIUM';
  bool get isLowPriority => priority == 'LOW';

  StockAlert copyWith({
    String? id,
    String? drugId,
    String? alertType,
    String? message,
    bool? isRead,
    DateTime? createdAt,
    Drug? drug,
  }) {
    return StockAlert(
      id: id ?? this.id,
      drugId: drugId ?? this.drugId,
      alertType: alertType ?? this.alertType,
      message: message ?? this.message,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
      drug: drug ?? this.drug,
    );
  }
}
