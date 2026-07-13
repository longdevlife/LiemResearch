import 'package:dio/dio.dart';
import 'package:flutter_mobile/core/constants/api_routes.dart';
import 'package:flutter_mobile/core/network/api_client.dart';
import 'package:flutter_mobile/features/papers/data/papers_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:meta/meta.dart';

final reportsApiProvider = Provider<ReportsApi>((ref) {
  return ReportsApi(ref.watch(apiClientProvider).dio);
});

final FutureProviderFamily<ReportsList, ReportsParams> reportsProvider = FutureProvider.autoDispose.family<ReportsList, ReportsParams>((ref, params) {
  return ref.watch(reportsApiProvider).list(params);
});

final FutureProviderFamily<AnalyticalReport, String> reportProvider = FutureProvider.autoDispose.family<AnalyticalReport, String>((ref, id) {
  return ref.watch(reportsApiProvider).detail(id);
});

@immutable
class ReportsParams {
  const ReportsParams({this.page = 1, this.pageSize = 20});

  final int page;
  final int pageSize;

  @override
  bool operator ==(Object other) => other is ReportsParams && other.page == page && other.pageSize == pageSize;

  @override
  int get hashCode => Object.hash(page, pageSize);
}

class ReportsList {
  const ReportsList({required this.reports, this.total});

  final List<ReportListItem> reports;
  final int? total;
}

class ReportListItem {
  const ReportListItem({required this.id, required this.query, required this.status, this.topic, this.createdAt});

  factory ReportListItem.fromJson(Map<String, dynamic> json) {
    return ReportListItem(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      query: (json['query'] ?? '').toString(),
      topic: json['topic']?.toString(),
      status: (json['status'] ?? 'queued').toString(),
      createdAt: json['createdAt']?.toString(),
    );
  }

  final String id;
  final String query;
  final String? topic;
  final String status;
  final String? createdAt;
}

class AnalyticalReport extends ReportListItem {
  const AnalyticalReport({
    required super.id,
    required super.query,
    required super.status,
    super.topic,
    super.createdAt,
    this.markdown,
    this.errorMessage,
    this.groundingPapers = const [],
    this.researchGaps = const [],
  });

  factory AnalyticalReport.fromJson(Map<String, dynamic> json) {
    return AnalyticalReport(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      query: (json['query'] ?? '').toString(),
      topic: json['topic']?.toString(),
      status: (json['status'] ?? 'queued').toString(),
      createdAt: json['createdAt']?.toString(),
      markdown: json['markdown']?.toString(),
      errorMessage: json['errorMessage']?.toString(),
      groundingPapers: (json['groundingPapers'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(PaperRef.fromJson)
          .toList(),
      researchGaps: (json['researchGaps'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(ReportGap.fromJson)
          .toList(),
    );
  }

  final String? markdown;
  final String? errorMessage;
  final List<PaperRef> groundingPapers;
  final List<ReportGap> researchGaps;
}

class ReportGap {
  const ReportGap({required this.title, required this.description, required this.confidence});

  factory ReportGap.fromJson(Map<String, dynamic> json) {
    return ReportGap(
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
    );
  }

  final String title;
  final String description;
  final double confidence;
}

class ReportsApi {
  const ReportsApi(this._dio);

  final Dio _dio;

  Future<ReportsList> list(ReportsParams params) async {
    final res = await _dio.get<Map<String, dynamic>>(ApiRoutes.reportsList, queryParameters: {'page': params.page, 'pageSize': params.pageSize});
    return ReportsList(
      reports: (res.data?['data'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(ReportListItem.fromJson)
          .toList(),
      total: (res.data?['meta'] as Map<String, dynamic>?)?['total'] as int?,
    );
  }

  Future<AnalyticalReport> detail(String id) async {
    final res = await _dio.get<Map<String, dynamic>>(ApiRoutes.reportsDetail(id));
    return AnalyticalReport.fromJson((res.data?['data'] as Map<String, dynamic>?) ?? {});
  }

  Future<String> create({required String query, String? topic, bool deepAnalysis = false}) async {
    final res = await _dio.post<Map<String, dynamic>>(
      ApiRoutes.reportsCreate,
      data: {'query': query, if (topic != null && topic.trim().isNotEmpty) 'topic': topic.trim(), 'yearFrom': 2020, 'yearTo': DateTime.now().year, 'deepAnalysis': deepAnalysis},
    );
    return ((res.data?['data'] as Map<String, dynamic>?)?['id'] ?? '').toString();
  }

  Future<void> delete(String id) => _dio.delete<void>(ApiRoutes.reportsDelete(id));
}
