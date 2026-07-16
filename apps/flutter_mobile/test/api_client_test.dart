import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_mobile/core/network/api_client.dart';
import 'package:flutter_mobile/core/storage/secure_token_store.dart';
import 'package:flutter_mobile/features/auth/data/auth_models.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('notifies auth expiration when refresh fails after a 401', () async {
    var expiredCount = 0;
    final tokenStore = _FakeTokenStore(
      const AuthTokens(accessToken: 'expired-access', refreshToken: 'expired-refresh'),
    );
    final client = ApiClient(
      tokenStore,
      onAuthExpired: () => expiredCount++,
    )..dio.httpClientAdapter = _UnauthorizedAdapter();

    await expectLater(
      client.dio.get<void>('/protected'),
      throwsA(isA<DioException>()),
    );

    expect(tokenStore.deleted, isTrue);
    expect(expiredCount, 1);
  });
}

class _FakeTokenStore extends SecureTokenStore {
  _FakeTokenStore(this._tokens);

  AuthTokens? _tokens;
  bool deleted = false;

  @override
  Future<AuthTokens?> read() async => _tokens;

  @override
  Future<void> save(AuthTokens tokens) async {
    _tokens = tokens;
  }

  @override
  Future<void> delete() async {
    deleted = true;
    _tokens = null;
  }
}

class _UnauthorizedAdapter implements HttpClientAdapter {
  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    return ResponseBody.fromString(
      jsonEncode({
        'success': false,
        'error': {
          'code': 'UNAUTHORIZED',
          'message': 'Unauthorized',
        },
      }),
      401,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}
