import 'package:dio/dio.dart';
import 'package:pharma_care/core/constants/api_constants.dart';
import 'package:pharma_care/data/models/prescription.dart';
import 'package:pharma_care/data/services/api_service.dart';
import 'package:http_parser/http_parser.dart';

class PrescriptionRepository {
  final ApiService _apiService = ApiService.instance;

  Future<PrescriptionExtraction> extractPrescription(String imagePath) async {
    try {
      print('💊 Extracting prescription from: $imagePath');

      // Determine MIME type from file extension
      String contentType = 'image/jpeg';
      final extension = imagePath.split('.').last.toLowerCase();
      if (extension == 'png') {
        contentType = 'image/png';
      } else if (extension == 'jpg' || extension == 'jpeg') {
        contentType = 'image/jpeg';
      } else if (extension == 'webp') {
        contentType = 'image/webp';
      }

      // Create form data with the image file
      final file = await MultipartFile.fromFile(
        imagePath,
        filename: imagePath.split('/').last,
        contentType: MediaType.parse(contentType),
      );

      print('💊 File info - Name: ${file.filename}, Length: ${file.length} bytes, Type: $contentType');

      final formData = FormData.fromMap({
        'prescription': file,
      });

      print('💊 Sending request to: ${ApiConstants.prescriptionScan}');

      final response = await _apiService.dio.post(
        ApiConstants.prescriptionScan,
        data: formData,
        options: Options(
          contentType: 'multipart/form-data',
        ),
      );

      print('💊 Prescription scan response: ${response.statusCode}');
      print('💊 Response data: ${response.data}');

      if (response.statusCode == 200 && response.data['success'] == true) {
        final extractedData = response.data['data'];
        print('💊 Extracted prescription data: $extractedData');

        return PrescriptionExtraction.fromJson(extractedData);
      } else {
        throw Exception(
            response.data['message'] ?? 'Failed to scan prescription');
      }
    } on DioException catch (e) {
      print('💊 DioException - Status: ${e.response?.statusCode}');
      print('💊 Error response data: ${e.response?.data}');
      print('💊 Error message: ${e.message}');

      if (e.response?.statusCode == 401) {
        throw Exception('Session expired. Please login again.');
      }
      if (e.response?.statusCode == 404) {
        throw Exception(
            'Prescription scanning endpoint not found. Please check the backend configuration.');
      }
      if (e.response?.statusCode == 500) {
        final errorMsg = e.response?.data['message'] ?? 'Server error while processing prescription';
        throw Exception('Unable to process this image. Please try:\n'
            '1. Taking a clearer photo with better lighting\n'
            '2. Ensuring the entire prescription is visible and readable\n'
            '3. Making sure text is not blurry\n'
            '4. Using a different prescription image\n\n'
            'Error: $errorMsg');
      }
      throw Exception(
          e.response?.data['message'] ?? 'Failed to scan prescription');
    } catch (e) {
      print('💊 Unexpected error: $e');
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<void> savePrescription({
    required String? patientName,
    required String? doctorName,
    required DateTime? prescriptionDate,
    required List<Map<String, dynamic>> medications,
  }) async {
    try {
      print('💊 Saving prescription...');

      final response = await _apiService.dio.post(
        ApiConstants.prescriptions,
        data: {
          'patientName': patientName,
          'doctorName': doctorName,
          'prescriptionDate': prescriptionDate?.toIso8601String(),
          'medications': medications,
        },
      );

      if (response.statusCode == 201 && response.data['success'] == true) {
        print('💊 Prescription saved successfully');
      } else {
        throw Exception(
            response.data['message'] ?? 'Failed to save prescription');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Session expired. Please login again.');
      }
      throw Exception(
          e.response?.data['message'] ?? 'Failed to save prescription');
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }
}
