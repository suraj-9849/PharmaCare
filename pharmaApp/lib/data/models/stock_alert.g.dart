// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'stock_alert.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

StockAlert _$StockAlertFromJson(Map<String, dynamic> json) => StockAlert(
      id: json['id'] as String,
      drugId: json['drugId'] as String,
      alertType: json['alertType'] as String,
      message: json['message'] as String,
      isRead: json['isRead'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      drug: json['drug'] == null
          ? null
          : Drug.fromJson(json['drug'] as Map<String, dynamic>),
    );

Map<String, dynamic> _$StockAlertToJson(StockAlert instance) =>
    <String, dynamic>{
      'id': instance.id,
      'drugId': instance.drugId,
      'alertType': instance.alertType,
      'message': instance.message,
      'isRead': instance.isRead,
      'createdAt': instance.createdAt.toIso8601String(),
      'drug': instance.drug,
    };
