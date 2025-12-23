import 'package:dio/dio.dart';
import 'package:pharma_care/core/constants/api_constants.dart';
import 'package:pharma_care/data/models/dashboard_stats.dart';
import 'package:pharma_care/data/services/api_service.dart';

class DashboardRepository {
  final ApiService _apiService = ApiService.instance;

  Future<DashboardStats> getDashboardStats() async {
    try {
      final response = await _apiService.dio.get(ApiConstants.dashboard);

      print('📊 Dashboard response: ${response.data}');
      print('📊 Dashboard status: ${response.statusCode}');

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];

        print('📊 Dashboard data: $data');

        // Map backend field names to app field names
        return DashboardStats(
          totalDrugs: data['totalDrugs'] ?? data['totalProducts'] ?? 0,
          expiringThisMonth: data['expiringCount'] ?? data['expiringThisMonth'] ?? 0,
          pendingReorders: data['pendingReorders'] ?? 0,
          todaySales: data['todaySales'] ?? 0,
          lowStockItems: data['lowStockCount'] ?? data['lowStockItems'] ?? 0,
          outOfStockItems: data['outOfStockItems'] ?? 0,
          expiredItems: data['expiredCount'] ?? data['expiredItems'] ?? 0,
        );
      } else {
        throw Exception('Failed to fetch dashboard stats');
      }
    } on DioException catch (e) {
      print('❌ Dashboard DioException: ${e.message}');
      print('❌ Dashboard Response: ${e.response?.data}');
      if (e.response?.statusCode == 401) {
        throw Exception('Session expired. Please login again.');
      }
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch stats');
    } catch (e) {
      print('❌ Dashboard error: $e');
      print('❌ Dashboard error type: ${e.runtimeType}');
      throw Exception('An unexpected error occurred: $e');
    }
  }
}
