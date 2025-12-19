import 'package:dio/dio.dart';
import 'package:pharma_care/core/constants/api_constants.dart';
import 'package:pharma_care/data/models/user.dart';
import 'package:pharma_care/data/services/api_service.dart';

class AuthRepository {
  final ApiService _apiService = ApiService.instance;

  Future<AuthResponse> login(String email, String password) async {
    try {
      final response = await _apiService.dio.post(
        ApiConstants.login,
        data: {
          'email': email,
          'password': password,
        },
      );

      print('📦 Response data: ${response.data}');
      print('📦 Response status: ${response.statusCode}');

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];

        print('📦 Data: $data');
        print('📦 Access Token: ${data['token']}');
        print('📦 User: ${data['user']}');

        final authResponse = AuthResponse(
          accessToken: data['token'],
          refreshToken: data['token'], // Using same token for now
          user: User.fromJson(data['user']),
        );

        // Save token
        await _apiService.saveToken(authResponse.accessToken);

        return authResponse;
      } else {
        throw Exception(response.data['message'] ?? 'Login failed');
      }
    } on DioException catch (e) {
      print('❌ DioException: ${e.message}');
      print('❌ Response: ${e.response?.data}');
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Login failed');
      } else {
        throw Exception('Network error. Please check your connection.');
      }
    } catch (e) {
      print('❌ Unexpected error: $e');
      print('❌ Error type: ${e.runtimeType}');
      throw Exception('An unexpected error occurred: $e');
    }
  }

  Future<User> getCurrentUser() async {
    try {
      final response = await _apiService.dio.get(ApiConstants.me);

      if (response.statusCode == 200 && response.data['status'] == 'success') {
        return User.fromJson(response.data['data']);
      } else {
        throw Exception('Failed to fetch user data');
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 401) {
        await _apiService.clearToken();
        throw Exception('Session expired. Please login again.');
      }
      throw Exception(e.response?.data['message'] ?? 'Failed to fetch user');
    }
  }

  Future<void> logout() async {
    await _apiService.clearToken();
  }

  Future<bool> isAuthenticated() async {
    return await _apiService.isAuthenticated();
  }
}
