import 'package:dio/dio.dart';
import 'package:pharma_care/core/constants/api_constants.dart';
import 'package:pharma_care/data/models/invoice.dart';
import 'package:pharma_care/data/services/api_service.dart';
import 'package:http_parser/http_parser.dart';

class InvoiceRepository {
  final ApiService _apiService = ApiService.instance;

  Future<InvoiceExtraction> extractInvoice(String imagePath) async {
    try {
      print('📄 Extracting invoice from: $imagePath');

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

      print('📄 File info - Name: ${file.filename}, Length: ${file.length} bytes, Type: $contentType');

      final formData = FormData.fromMap({
        'invoice': file,
      });

      print('📄 Sending request to: ${ApiConstants.invoiceExtract}');

      final response = await _apiService.dio.post(
        ApiConstants.invoiceExtract,
        data: formData,
        options: Options(
          contentType: 'multipart/form-data',
        ),
      );

      print('📄 Invoice extraction response: ${response.statusCode}');
      print('📄 Response data: ${response.data}');

      if (response.statusCode == 200 && response.data['success'] == true) {
        final extractedData = response.data['data'];
        print('📄 Extracted invoice data: $extractedData');

        return InvoiceExtraction.fromJson(extractedData);
      } else {
        throw Exception(
            response.data['message'] ?? 'Failed to extract invoice');
      }
    } on DioException catch (e) {
      print('📄 DioException - Status: ${e.response?.statusCode}');
      print('📄 Error response data: ${e.response?.data}');
      print('📄 Error message: ${e.message}');

      if (e.response?.statusCode == 401) {
        throw Exception('Session expired. Please login again.');
      }
      if (e.response?.statusCode == 404) {
        throw Exception(
            'Invoice extraction endpoint not found. Please check the backend configuration.');
      }
      if (e.response?.statusCode == 500) {
        final errorMsg = e.response?.data['message'] ?? 'Server error while processing invoice';
        throw Exception('Unable to process this image. Please try:\n'
            '1. Taking a clearer photo with better lighting\n'
            '2. Ensuring the entire invoice is visible\n'
            '3. Using a different invoice image\n\n'
            'Error: $errorMsg');
      }
      throw Exception(
          e.response?.data['message'] ?? 'Failed to extract invoice');
    } catch (e) {
      print('📄 Unexpected error: $e');
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<void> saveInvoiceToInventory({
    required String invoiceNumber,
    required String supplierId,
    required DateTime invoiceDate,
    required List<Map<String, dynamic>> items,
  }) async {
    try {
      print('📄 Saving invoice to inventory...');

      final response = await _apiService.dio.post(
        ApiConstants.invoices,
        data: {
          'invoiceNumber': invoiceNumber,
          'supplierId': supplierId,
          'invoiceDate': invoiceDate.toIso8601String(),
          'items': items,
        },
      );

      if (response.statusCode == 201 && response.data['success'] == true) {
        print('📄 Invoice saved successfully');
      } else {
        throw Exception(response.data['message'] ?? 'Failed to save invoice');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        throw Exception('Session expired. Please login again.');
      }
      throw Exception(
          e.response?.data['message'] ?? 'Failed to save invoice');
    } catch (e) {
      throw Exception('An unexpected error occurred: $e');
    }
  }
}
