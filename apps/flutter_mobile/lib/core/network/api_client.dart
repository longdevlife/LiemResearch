import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../storage/secure_token_store.dart';
import '../errors/api_exception.dart';
import '../constants/api_routes.dart';
import '../../features/auth/data/auth_models.dart';
import '../network/api_envelope.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(SecureTokenStore());
});

class ApiClient {
  late final Dio _dio;
  final SecureTokenStore _tokenStore;
  Future<String?>? _refreshFuture;

  ApiClient(this._tokenStore) {
    const baseUrl = String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://10.0.2.2:4000/api/v1',
    );

    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final tokens = await _tokenStore.read();
        if (tokens != null && tokens.accessToken.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer ${tokens.accessToken}';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) async {
        // Handle 401 Unauthorized
        if (e.response?.statusCode == 401 && !e.requestOptions.path.contains('/auth/refresh')) {
          final tokens = await _tokenStore.read();
          if (tokens != null && tokens.refreshToken.isNotEmpty) {
            try {
              final newAccessToken = await _refreshAccessToken(tokens.refreshToken);
              if (newAccessToken != null) {
                // Retry original request
                final opts = Options(
                  method: e.requestOptions.method,
                  headers: e.requestOptions.headers,
                );
                opts.headers?['Authorization'] = 'Bearer $newAccessToken';
                final cloneReq = await _dio.request(
                  e.requestOptions.path,
                  options: opts,
                  data: e.requestOptions.data,
                  queryParameters: e.requestOptions.queryParameters,
                );
                return handler.resolve(cloneReq);
              }
            } catch (refreshErr) {
              await _tokenStore.delete();
              // In UI logic, this will trigger router redirect since token is gone.
            }
          }
        }

        // Parse backend errors into ApiException
        ApiErrorDetail? apiError;
        if (e.response?.data != null && e.response?.data is Map<String, dynamic>) {
          try {
            final data = e.response!.data as Map<String, dynamic>;
            if (data.containsKey('error')) {
              apiError = ApiErrorDetail.fromJson(data['error'] as Map<String, dynamic>);
            }
          } catch (_) {}
        }

        return handler.next(
          DioException(
            requestOptions: e.requestOptions,
            response: e.response,
            type: e.type,
            error: ApiException(
              message: apiError?.message ?? e.message ?? 'Unknown error',
              errorDetail: apiError,
              statusCode: e.response?.statusCode,
            ),
          ),
        );
      },
    ));
  }

  Dio get dio => _dio;

  Future<String?> _refreshAccessToken(String refreshToken) async {
    if (_refreshFuture != null) {
      return _refreshFuture;
    }

    _refreshFuture = () async {
      try {
        final response = await _dio.post(ApiRoutes.authRefresh, data: {
          'refreshToken': refreshToken,
        });
        
        final dataMap = response.data['data'] as Map<String, dynamic>;
        final tokens = AuthTokens.fromJson(dataMap);
        
        await _tokenStore.save(tokens);
        return tokens.accessToken;
      } catch (e) {
        rethrow;
      } finally {
        _refreshFuture = null;
      }
    }();

    return _refreshFuture;
  }
}
