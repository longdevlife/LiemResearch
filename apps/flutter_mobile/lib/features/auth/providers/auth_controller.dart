import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/errors/api_exception.dart';
import '../../../core/storage/secure_token_store.dart';
import '../data/auth_api.dart';
import '../data/auth_models.dart';

final authControllerProvider = NotifierProvider<AuthController, AsyncValue<User?>>(() {
  return AuthController();
});

final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authControllerProvider).value;
});

class AuthController extends Notifier<AsyncValue<User?>> {
  late final AuthApi _authApi;
  late final SecureTokenStore _tokenStore;

  @override
  AsyncValue<User?> build() {
    _authApi = ref.watch(authApiProvider);
    _tokenStore = const SecureTokenStore();
    
    // We can't do async build directly with Notifier, so we trigger an async init
    Future.microtask(_initAuth);
    return const AsyncLoading();
  }

  Future<void> _initAuth() async {
    print('AuthController: _initAuth started');
    try {
      // Add a timeout to prevent hanging forever if secure storage is stuck
      final tokens = await _tokenStore.read().timeout(const Duration(seconds: 3));
      print('AuthController: token read result: ${tokens != null ? "found" : "null"}');
      if (tokens != null) {
        final user = await _authApi.me().timeout(const Duration(seconds: 10));
        print('AuthController: fetched user: ${user.email}');
        state = AsyncData(user);
      } else {
        state = const AsyncData(null);
      }
    } catch (e) {
      print('AuthController: _initAuth error: $e');
      // Ignore delete errors during initialization if it was a timeout
      try {
        await _tokenStore.delete().timeout(const Duration(seconds: 2));
      } catch (_) {}
      state = const AsyncData(null);
    }
    print('AuthController: _initAuth completed, state is ${state.value}');
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    try {
      final response = await _authApi.login(LoginRequest(email: email, password: password));
      await _tokenStore.save(response.tokens);
      state = AsyncData(response.user);
    } catch (e, st) {
      if (e is DioException && e.error is ApiException) {
        state = AsyncError(e.error as ApiException, st);
      } else {
        state = AsyncError(e, st);
      }
    }
  }

  Future<void> register(String email, String password, String fullName, UserRole role) async {
    state = const AsyncLoading();
    try {
      await _authApi.register(RegisterRequest(
        email: email,
        password: password,
        fullName: fullName,
        role: role,
      ));
      // Require user to login again after registration
      state = const AsyncData(null);
    } catch (e, st) {
      if (e is DioException && e.error is ApiException) {
        state = AsyncError(e.error as ApiException, st);
      } else {
        state = AsyncError(e, st);
      }
    }
  }

  Future<void> logout() async {
    state = const AsyncLoading();
    try {
      final tokens = await _tokenStore.read();
      if (tokens != null) {
        await _authApi.logout(tokens.refreshToken);
      }
    } catch (_) {}
    await _tokenStore.delete();
    state = const AsyncData(null);
  }
}
