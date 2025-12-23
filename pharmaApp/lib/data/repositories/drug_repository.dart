import 'package:dio/dio.dart';
import 'package:pharma_care/core/constants/api_constants.dart';
import 'package:pharma_care/data/models/drug.dart';
import 'package:pharma_care/data/services/api_service.dart';

class DrugRepository {
  final ApiService _apiService = ApiService.instance;

  Future<List<Drug>> getDrugs({String? search}) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': 100, // Get up to 100 drugs at once
      };

      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final response = await _apiService.dio.get(
        ApiConstants.drugs,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<dynamic> drugsList = response.data['data'];

        print('💊 Loaded ${drugsList.length} drugs');
        if (drugsList.isNotEmpty) {
          final firstDrug = drugsList[0];
          final batches = firstDrug['inventoryBatches'] as List?;
          print('💊 First drug: ${firstDrug['brandName']} - Batches: ${batches?.length ?? 0}');
          if (batches != null && batches.isNotEmpty) {
            print('💊 First batch quantity: ${batches[0]['quantity']}');
          }
        }

        return drugsList.map((json) => Drug.fromJson(json)).toList();
      } else {
        throw Exception('Failed to fetch drugs');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Session expired. Please login again.');
      }
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch drugs');
    } catch (e) {
      print('💊 Error parsing drugs: $e');
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<Drug> getDrugById(String id) async {
    try {
      final response = await _apiService.dio.get(ApiConstants.drugById(id));

      if (response.statusCode == 200 && response.data['success'] == true) {
        return Drug.fromJson(response.data['data']);
      } else {
        throw Exception('Failed to fetch drug details');
      }
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch drug');
    }
  }
}
