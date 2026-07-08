import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod/src/providers/future_provider.dart';

import 'package:flutter_mobile/core/constants/api_routes.dart';
import 'package:flutter_mobile/core/network/api_client.dart';

final gapsApiProvider = Provider<GapsApi>((ref) {
  return GapsApi(ref.watch(apiClientProvider).dio);
});

final FutureProviderFamily<ListGapsResponse, GapsListParams> gapsProvider = FutureProvider.autoDispose.family<ListGapsResponse, GapsListParams>((ref, params) {
  return ref.watch(gapsApiProvider).list(params);
});

final FutureProviderFamily<GapAnalysisResult, String> gapStatusProvider = FutureProvider.autoDispose.family<GapAnalysisResult, String>((ref, id) {
  return ref.watch(gapsApiProvider).status(id);
});

class GapsListParams {
  const GapsListParams({this.topic, this.status = 'active', this.minConfidence, this.page = 1, this.pageSize = 30});

  final String? topic;
  final String status;
  final double? minConfidence;
  final int page;
  final int pageSize;

  Map<String, dynamic> toQuery() => {
        if (topic != null && topic!.trim().isNotEmpty) 'topic': topic!.trim(),
        'status': status,
        if (minConfidence != null) 'minConfidence': minConfidence,
        'page': page,
        'pageSize': pageSize,
      };

  @override
  bool operator ==(Object other) {
    return other is GapsListParams &&
        other.topic == topic &&
        other.status == status &&
        other.minConfidence == minConfidence &&
        other.page == page &&
        other.pageSize == pageSize;
  }

  @override
  int get hashCode => Object.hash(topic, status, minConfidence, page, pageSize);
}

class ListGapsResponse {

  factory ListGapsResponse.fromEnvelope(Map<String, dynamic> json) {
    return ListGapsResponse(
      data: (json['data'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(ResearchGapItem.fromJson)
          .toList(),
      total: ((json['meta'] as Map<String, dynamic>?)?['total'] as num?)?.toInt() ?? 0,
    );
  }
  const ListGapsResponse({required this.data, required this.total});

  final List<ResearchGapItem> data;
  final int total;
}

class ResearchGapItem {

  factory ResearchGapItem.fromJson(Map<String, dynamic> json) {
    return ResearchGapItem(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      topic: (json['topic'] ?? '').toString(),
      title: (json['title'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      rationale: (json['rationale'] ?? '').toString(),
      confidence: (json['evidenceConfidence'] as num?)?.toDouble() ?? (json['confidence'] as num?)?.toDouble() ?? 0,
      source: (json['source'] ?? 'standalone').toString(),
      status: (json['status'] ?? 'active').toString(),
    );
  }
  const ResearchGapItem({required this.id, required this.topic, required this.title, required this.description, required this.rationale, required this.confidence, required this.source, required this.status});

  final String id;
  final String topic;
  final String title;
  final String description;
  final String rationale;
  final double confidence;
  final String source;
  final String status;
}

class GapAnalysisResult {

  factory GapAnalysisResult.fromJson(Map<String, dynamic> json) {
    return GapAnalysisResult(
      id: (json['id'] ?? '').toString(),
      topic: (json['topic'] ?? '').toString(),
      status: (json['status'] ?? 'queued').toString(),
      errorMessage: json['errorMessage']?.toString(),
    );
  }
  const GapAnalysisResult({required this.id, required this.topic, required this.status, this.errorMessage});

  final String id;
  final String topic;
  final String status;
  final String? errorMessage;
}

class GapsApi {
  const GapsApi(this._dio);

  final Dio _dio;

  Future<String> analyze(String topic) async {
    final res = await _dio.post<Map<String, dynamic>>(ApiRoutes.gapsAnalyze, data: {'topic': topic});
    return ((res.data?['data'] as Map<String, dynamic>?)?['analysisId'] ?? '').toString();
  }

  Future<GapAnalysisResult> status(String id) async {
    final res = await _dio.get<Map<String, dynamic>>(ApiRoutes.gapsAnalyzeStatus(id));
    return GapAnalysisResult.fromJson((res.data?['data'] as Map<String, dynamic>?) ?? {});
  }

  Future<ListGapsResponse> list(GapsListParams params) async {
    final res = await _dio.get<Map<String, dynamic>>(ApiRoutes.gapsList, queryParameters: params.toQuery());
    return ListGapsResponse.fromEnvelope(res.data ?? {});
  }

  Future<void> patchStatus(String id, String status) {
    return _dio.patch<void>(ApiRoutes.gapsPatch(id), data: {'status': status});
  }
}
