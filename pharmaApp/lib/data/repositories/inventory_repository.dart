import 'package:dio/dio.dart';
import 'package:pharma_care/core/constants/api_constants.dart';
import 'package:pharma_care/data/models/drug.dart';
import 'package:pharma_care/data/services/api_service.dart';

class InventoryRepository {
  final ApiService _apiService = ApiService.instance;

  Future<List<InventoryBatch>> getInventoryBatches({String? search}) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': 100,
      };

      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final response = await _apiService.dio.get(
        ApiConstants.inventory,
        queryParameters: queryParams,
      );

      print('📦 Inventory API Response status: ${response.statusCode}');

      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<dynamic> batchesList = response.data['data'];

        print('📦 Loaded ${batchesList.length} inventory batches');
        if (batchesList.isNotEmpty) {
          print('📦 First batch sample: ${batchesList[0]}');
        }

        return batchesList.map((json) => InventoryBatch.fromJson(json)).toList();
      } else {
        throw Exception('Failed to fetch inventory batches');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Session expired. Please login again.');
      }
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch inventory');
    } catch (e) {
      print('📦 Error parsing inventory: $e');
      throw Exception('An unexpected error occurred: $e');
    }
  }
}
