import 'package:flutter/material.dart';
import 'package:pharma_care/core/constants/app_colors.dart';
import 'package:pharma_care/core/constants/app_strings.dart';
import 'package:pharma_care/data/models/dashboard_stats.dart';
import 'package:pharma_care/data/models/stock_alert.dart';
import 'package:pharma_care/data/repositories/dashboard_repository.dart';
import 'package:pharma_care/data/repositories/alert_repository.dart';
import 'package:pharma_care/presentation/screens/home/widgets/alert_card.dart';
import 'package:pharma_care/presentation/screens/home/widgets/stats_card.dart';
import 'package:pharma_care/presentation/screens/home/widgets/activity_feed.dart';
import 'package:pharma_care/presentation/widgets/low_stock_notification_widget.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _isLoading = false;
  DashboardStats? _stats;
  List<StockAlert> _alerts = [];
  String? _errorMessage;

  final DashboardRepository _dashboardRepo = DashboardRepository();
  final AlertRepository _alertRepo = AlertRepository();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Load dashboard stats (required)
      final stats = await _dashboardRepo.getDashboardStats();

      // Try to load alerts (optional - backend may not have this endpoint yet)
      List<StockAlert> alerts = [];
      try {
        alerts = await _alertRepo.getAlerts();
      } catch (e) {
        print('ℹ️ Alerts not available: $e');
        // Continue without alerts - backend may not have this endpoint yet
      }

      if (mounted) {
        setState(() {
          _stats = stats;
          _alerts = alerts;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleRefresh() async {
    await _loadData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(AppStrings.appName),
            Text(
              AppStrings.appTagline,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // TODO: Navigate to notifications screen
            },
          ),
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () {
              // TODO: Navigate to profile screen
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _handleRefresh,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _errorMessage != null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.error_outline,
                            size: 64,
                            color: AppColors.error,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Failed to load data',
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _errorMessage!,
                            style: Theme.of(context).textTheme.bodyMedium,
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton(
                            onPressed: _loadData,
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  )
                : SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Quick Stats Section
                        Padding(
                          padding: const EdgeInsets.all(16.0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                AppStrings.quickStats,
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              const SizedBox(height: 16),
                              Row(
                                children: [
                                  Expanded(
                                    child: StatsCard(
                                      title: AppStrings.totalDrugs,
                                      value: '${_stats?.totalDrugs ?? 0}',
                                      icon: Icons.medication_outlined,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: StatsCard(
                                      title: AppStrings.expiringThisMonth,
                                      value: '${_stats?.expiringThisMonth ?? 0}',
                                      icon: Icons.warning_amber_outlined,
                                      color: AppColors.warning,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: StatsCard(
                                      title: 'Low Stock',
                                      value: '${_stats?.lowStockItems ?? 0}',
                                      icon: Icons.inventory_outlined,
                                      color: Colors.orange,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: StatsCard(
                                      title: AppStrings.todaySales,
                                      value: '${_stats?.todaySales ?? 0}',
                                      icon: Icons.trending_up_outlined,
                                      color: AppColors.success,
                                    ),
                                  ),
                                ],
                              ),
                        ],
                      ),
                    ),

                    const Divider(height: 1),

                    // Low Stock Notifications Section (New!)
                    const LowStockNotificationWidget(),

                    const Divider(height: 1),

                    // Alerts Section
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                AppStrings.alerts,
                                style: Theme.of(context).textTheme.titleLarge,
                              ),
                              TextButton(
                                onPressed: () {
                                  // TODO: View all alerts
                                },
                                child: const Text('View All'),
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          const AlertCard(
                            alertType: 'EXPIRED',
                            title: 'Expired Medicines',
                            message: 'No expired medicines',
                            count: 0,
                            isRead: true,
                          ),
                          const SizedBox(height: 12),
                          const AlertCard(
                            alertType: 'EXPIRING_SOON',
                            title: 'Expiring Soon',
                            message: 'No medicines expiring soon',
                            count: 0,
                            isRead: true,
                          ),
                          const SizedBox(height: 12),
                          const AlertCard(
                            alertType: 'LOW_STOCK',
                            title: 'Low Stock',
                            message: 'No low stock items',
                            count: 0,
                            isRead: true,
                          ),
                        ],
                      ),
                    ),

                    const Divider(height: 1),

                    // Recent Activity Section
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AppStrings.recentActivity,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const SizedBox(height: 16),
                          const ActivityFeed(),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
