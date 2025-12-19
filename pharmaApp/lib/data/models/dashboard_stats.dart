import 'package:json_annotation/json_annotation.dart';

part 'dashboard_stats.g.dart';

@JsonSerializable()
class DashboardStats {
  final int totalDrugs;
  final int expiringThisMonth;
  final int pendingReorders;
  final int todaySales;
  final int lowStockItems;
  final int outOfStockItems;
  final int expiredItems;

  DashboardStats({
    required this.totalDrugs,
    required this.expiringThisMonth,
    required this.pendingReorders,
    required this.todaySales,
    required this.lowStockItems,
    required this.outOfStockItems,
    required this.expiredItems,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) =>
      _$DashboardStatsFromJson(json);
  Map<String, dynamic> toJson() => _$DashboardStatsToJson(this);

  factory DashboardStats.empty() {
    return DashboardStats(
      totalDrugs: 0,
      expiringThisMonth: 0,
      pendingReorders: 0,
      todaySales: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      expiredItems: 0,
    );
  }
}
