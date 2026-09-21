import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiException implements Exception {
  ApiException(this.message);
  final String message;
  @override
  String toString() => message;
}

class ApiService {
  ApiService({String? baseUrl})
    : _dio = Dio(
        BaseOptions(
          baseUrl:
              baseUrl ??
              const String.fromEnvironment(
                'API_BASE_URL',
                defaultValue: 'http://10.0.2.2:5001/api',
              ),
          connectTimeout: const Duration(seconds: 12),
          receiveTimeout: const Duration(seconds: 20),
          headers: {'Content-Type': 'application/json'},
        ),
      ),
      _storage = const FlutterSecureStorage() {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'auth_token');
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  final Dio _dio;
  final FlutterSecureStorage _storage;

  Future<Map<String, dynamic>> _request(
    Future<Response<dynamic>> request,
  ) async {
    try {
      final response = await request;
      final data = Map<String, dynamic>.from(response.data as Map);
      if (data['success'] == false) {
        throw ApiException(data['message']?.toString() ?? 'Request failed');
      }
      return data;
    } on DioException catch (error) {
      final message =
          (error.response?.data is Map ? error.response?.data['message'] : null)
              ?.toString();
      throw ApiException(
        message ?? 'Unable to connect to GraminArogya. Check your network.',
      );
    }
  }

  Future<Map<String, dynamic>> login(String username, String password) =>
      _request(
        _dio.post(
          '/auth/login',
          data: {'username': username, 'password': password, 'role': 'patient'},
        ),
      );

  Future<Map<String, dynamic>> register(Map<String, dynamic> data) =>
      _request(_dio.post('/auth/register', data: data));

  Future<Map<String, dynamic>> me() => _request(_dio.get('/auth/me'));

  Future<Map<String, dynamic>> patientProfile() =>
      _request(_dio.get('/patient/profile'));

  Future<Map<String, dynamic>> updatePatientProfile(
    Map<String, dynamic> data,
  ) => _request(_dio.post('/patient/profile', data: data));

  Future<Map<String, dynamic>> facilities() =>
      _request(_dio.get('/facilities'));

  Future<Map<String, dynamic>> bloodBanks() =>
      _request(_dio.get('/blood-banks'));

  Future<Map<String, dynamic>> lookupQr(String value) =>
      _request(_dio.post('/patients/lookup/qr', data: {'qrData': value}));

  Future<Map<String, dynamic>> patientHistory(String id) =>
      _request(_dio.get('/patients/$id/profile'));

  Future<void> saveSession(String token, Map<String, dynamic> user) async {
    await _storage.write(key: 'auth_token', value: token);
    await _storage.write(key: 'auth_user', value: user.toString());
  }

  Future<String?> readToken() => _storage.read(key: 'auth_token');

  Future<void> clearSession() async {
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'auth_user');
  }
}
