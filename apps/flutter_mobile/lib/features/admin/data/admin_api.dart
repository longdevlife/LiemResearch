import 'package:dio/dio.dart';
import 'package:flutter_mobile/core/constants/api_routes.dart';
import 'package:flutter_mobile/core/network/api_client.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final adminApiProvider = Provider<AdminApi>((ref) {
  return AdminApi(ref.watch(apiClientProvider).dio);
});

final FutureProvider<List<ApiSyncRun>> syncRunsProvider = FutureProvider.autoDispose<List<ApiSyncRun>>((ref) {
  return ref.watch(adminApiProvider).listRuns();
});

class ApiSyncRun {
  const ApiSyncRun({required this.id, required this.status, required this.searchText, required this.totalFetched, required this.totalInserted, this.errorMessage});

  factory ApiSyncRun.fromJson(Map<String, dynamic> json) {
    return ApiSyncRun(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      status: (json['runStatus'] ?? '').toString(),
      searchText: (json['searchText'] ?? '').toString(),
      totalFetched: (json['totalFetched'] as num?)?.toInt() ?? 0,
      totalInserted: (json['totalInserted'] as num?)?.toInt() ?? 0,
      errorMessage: json['errorMessage']?.toString(),
    );
  }

  final String id;
  final String status;
  final String searchText;
  final int totalFetched;
  final int totalInserted;
  final String? errorMessage;
}

class AdminApi {
  const AdminApi(this._dio);

  final Dio _dio;

  Future<void> triggerSync({required String searchText, int? yearFrom, int? maxPages}) {
    return _dio.post<void>(
      ApiRoutes.adminSync,
      data: {'searchText': searchText, 'yearFrom': ?yearFrom, 'maxPages': ?maxPages},
    );
  }

  Future<List<ApiSyncRun>> listRuns() async {
    final res = await _dio.get<Map<String, dynamic>>(ApiRoutes.adminSyncRuns);
    return (res.data?['data'] as List<dynamic>? ?? [])
        .whereType<Map<String, dynamic>>()
        .map(ApiSyncRun.fromJson)
        .toList();
  }
}
