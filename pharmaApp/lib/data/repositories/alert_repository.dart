import 'package:dio/dio.dart';
import 'package:pharma_care/core/constants/api_constants.dart';
import 'package:pharma_care/data/models/stock_alert.dart';
import 'package:pharma_care/data/services/api_service.dart';

class AlertRepository {
  final ApiService _apiService = ApiService.instance;

  Future<List<StockAlert>> getAlerts() async {
    try {
      final response = await _apiService.dio.get(ApiConstants.alerts);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<dynamic> alertsList = response.data['data'];
        return alertsList.map((json) => StockAlert.fromJson(json)).toList();
      } else {
        throw Exception('Failed to fetch alerts');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Session expired. Please login again.');
      }
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch alerts');
    } catch (e) {
      throw Exception('An unexpected error occurred');
    }
  }

  Future<void> markAlertAsRead(String id) async {
    try {
      await _apiService.dio.patch(ApiConstants.markAlertRead(id));
    } catch (e) {
      throw Exception('Failed to mark alert as read');
    }
  }
}
