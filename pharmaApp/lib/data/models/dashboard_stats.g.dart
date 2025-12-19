// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_stats.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DashboardStats _$DashboardStatsFromJson(Map<String, dynamic> json) =>
    DashboardStats(
      totalDrugs: (json['totalDrugs'] as num).toInt(),
      expiringThisMonth: (json['expiringThisMonth'] as num).toInt(),
      pendingReorders: (json['pendingReorders'] as num).toInt(),
      todaySales: (json['todaySales'] as num).toInt(),
      lowStockItems: (json['lowStockItems'] as num).toInt(),
      outOfStockItems: (json['outOfStockItems'] as num).toInt(),
      expiredItems: (json['expiredItems'] as num).toInt(),
    );

Map<String, dynamic> _$DashboardStatsToJson(DashboardStats instance) =>
    <String, dynamic>{
      'totalDrugs': instance.totalDrugs,
      'expiringThisMonth': instance.expiringThisMonth,
      'pendingReorders': instance.pendingReorders,
      'todaySales': instance.todaySales,
      'lowStockItems': instance.lowStockItems,
      'outOfStockItems': instance.outOfStockItems,
      'expiredItems': instance.expiredItems,
    };
