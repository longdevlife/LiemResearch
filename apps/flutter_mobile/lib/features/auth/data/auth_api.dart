import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_mobile/core/constants/api_routes.dart';
import 'package:flutter_mobile/core/network/api_client.dart';
import 'package:flutter_mobile/core/network/api_envelope.dart';
import 'package:flutter_mobile/features/auth/data/auth_models.dart';

final authApiProvider = Provider<AuthApi>((ref) {
  final client = ref.watch(apiClientProvider);
  return AuthApi(client);
});

class AuthApi {

  AuthApi(this._client);
  final ApiClient _client;

  Future<AuthResponse> login(LoginRequest request) async {
    final response = await _client.dio.post(
      ApiRoutes.authLogin,
      data: request.toJson(),
    );
    final data = response.data['data'] as Map<String, dynamic>;
    return AuthResponse.fromJson(data);
  }

  Future<AuthResponse> register(RegisterRequest request) async {
    final response = await _client.dio.post(
      ApiRoutes.authRegister,
      data: request.toJson(),
    );
    final data = response.data['data'] as Map<String, dynamic>;
    return AuthResponse.fromJson(data);
  }

  Future<void> logout(String refreshToken) async {
    await _client.dio.post(
      ApiRoutes.authLogout,
      data: {'refreshToken': refreshToken},
    );
  }

  Future<User> me() async {
    final response = await _client.dio.get(ApiRoutes.authMe);
    final data = response.data['data'] as Map<String, dynamic>;
    return User.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    await _client.dio.post(
      ApiRoutes.authChangePassword,
      data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      },
    );
  }
}
