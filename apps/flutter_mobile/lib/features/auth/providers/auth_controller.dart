import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/storage/secure_token_store.dart';
import '../data/auth_api.dart';
import '../data/auth_models.dart';

// Provider for the controller
final authControllerProvider = StateNotifierProvider<AuthController, AsyncValue<User?>>((ref) {
  final authApi = ref.watch(authApiProvider);
  return AuthController(authApi, const SecureTokenStore());
});

// Expose currentUser separately for easy access in UI
final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authControllerProvider).value;
});

class AuthController extends StateNotifier<AsyncValue<User?>> {
  final AuthApi _authApi;
  final SecureTokenStore _tokenStore;

  AuthController(this._authApi, this._tokenStore) : super(const AsyncValue.data(null)) {
    _initAuth();
  }

  Future<void> _initAuth() async {
    state = const AsyncValue.loading();
    try {
      final tokens = await _tokenStore.read();
      if (tokens != null) {
        // We have tokens, fetch fresh user data
        final user = await _authApi.me();
        state = AsyncValue.data(user);
      } else {
        state = const AsyncValue.data(null);
      }
    } catch (e, st) {
      // If fetching user fails (e.g. token expired and refresh failed)
      await _tokenStore.delete();
      state = const AsyncValue.data(null);
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    try {
      final response = await _authApi.login(LoginRequest(email: email, password: password));
      await _tokenStore.save(response.tokens);
      state = AsyncValue.data(response.user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> register(String email, String password, String fullName, UserRole role) async {
    state = const AsyncValue.loading();
    try {
      final response = await _authApi.register(RegisterRequest(
        email: email,
        password: password,
        fullName: fullName,
        role: role,
      ));
      await _tokenStore.save(response.tokens);
      state = AsyncValue.data(response.user);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    try {
      final tokens = await _tokenStore.read();
      if (tokens != null) {
        await _authApi.logout(tokens.refreshToken);
      }
    } catch (_) {
      // Ignore errors on logout
    } finally {
      await _tokenStore.delete();
      state = const AsyncValue.data(null);
    }
  }
}
