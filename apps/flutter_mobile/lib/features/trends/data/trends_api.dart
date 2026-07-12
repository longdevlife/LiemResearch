import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod/src/providers/future_provider.dart';

import 'package:flutter_mobile/core/constants/api_routes.dart';
import 'package:flutter_mobile/core/network/api_client.dart';

final trendsApiProvider = Provider<TrendsApi>((ref) {
  return TrendsApi(ref.watch(apiClientProvider).dio);
});

final FutureProviderFamily<TrendsOverview, TrendsOverviewParams> trendsOverviewProvider = FutureProvider.autoDispose.family<TrendsOverview, TrendsOverviewParams>((ref, params) {
  return ref.watch(trendsApiProvider).overview(params);
});

final FutureProviderFamily<PublicationTrend, String> trendTopicProvider = FutureProvider.autoDispose.family<PublicationTrend, String>((ref, topic) {
  return ref.watch(trendsApiProvider).topic(topic);
});

class TrendsOverviewParams {
  const TrendsOverviewParams({this.yearFrom, this.yearTo, this.limit, this.minPapers, this.sortBy});

  final int? yearFrom;
  final int? yearTo;
  final int? limit;
  final int? minPapers;
  final String? sortBy;

  Map<String, dynamic> toQuery() => {
        if (yearFrom != null) 'yearFrom': yearFrom,
        if (yearTo != null) 'yearTo': yearTo,
        if (limit != null) 'limit': limit,
        if (minPapers != null) 'minPapers': minPapers,
        if (sortBy != null) 'sortBy': sortBy,
      };

  @override
  bool operator ==(Object other) {
    return other is TrendsOverviewParams &&
        other.yearFrom == yearFrom &&
        other.yearTo == yearTo &&
        other.limit == limit &&
        other.minPapers == minPapers &&
        other.sortBy == sortBy;
  }

  @override
  int get hashCode => Object.hash(yearFrom, yearTo, limit, minPapers, sortBy);
}

class TrendsOverview {

  factory TrendsOverview.fromJson(Map<String, dynamic> json) {
    return TrendsOverview(
      topics: (json['topics'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(TrendingTopic.fromJson)
          .toList(),
    );
  }
  const TrendsOverview({required this.topics});

  final List<TrendingTopic> topics;
}

class TrendingTopic {

  factory TrendingTopic.fromJson(Map<String, dynamic> json) {
    return TrendingTopic(
      topic: (json['topic'] ?? json['topicName'] ?? 'Unknown topic').toString(),
      momentum: (json['momentum'] as num?)?.toDouble() ?? 0,
      growthRatePct: (json['growthRatePct'] as num?)?.toDouble() ?? 0,
      totalPapers: (json['totalPapers'] as num?)?.toInt() ?? 0,
      yearlyBreakdown: (json['yearlyBreakdown'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(YearlyCount.fromJson)
          .toList(),
    );
  }
  const TrendingTopic({
    required this.topic,
    required this.momentum,
    required this.growthRatePct,
    required this.totalPapers,
    required this.yearlyBreakdown,
  });

  final String topic;
  final double momentum;
  final double growthRatePct;
  final int totalPapers;
  final List<YearlyCount> yearlyBreakdown;
}

class YearlyCount {

  factory YearlyCount.fromJson(Map<String, dynamic> json) {
    return YearlyCount(
      year: (json['year'] as num?)?.toInt() ?? 0,
      count: (json['count'] as num?)?.toInt() ?? 0,
    );
  }
  const YearlyCount({required this.year, required this.count});

  final int year;
  final int count;
}

class PublicationTrend {

  factory PublicationTrend.fromJson(Map<String, dynamic> json) {
    return PublicationTrend(
      topic: (json['topic'] ?? 'Unknown topic').toString(),
      yearlyBreakdown: (json['yearlyBreakdown'] as List<dynamic>? ?? [])
          .whereType<Map<String, dynamic>>()
          .map(YearlyCount.fromJson)
          .toList(),
      keywords: (json['keywords'] as List<dynamic>? ?? [])
          .map<TrendKeyword>((value) => TrendKeyword.fromJson(value as Object))
          .toList(),
    );
  }
  const PublicationTrend({required this.topic, required this.yearlyBreakdown, required this.keywords});

  final String topic;
  final List<YearlyCount> yearlyBreakdown;
  final List<TrendKeyword> keywords;
}

class TrendKeyword {

  factory TrendKeyword.fromJson(Object value) {
    if (value is Map<String, dynamic>) {
      return TrendKeyword(keyword: (value['keyword'] ?? value['keywordName'] ?? '').toString(), count: (value['count'] as num?)?.toInt() ?? 0);
    }
    return TrendKeyword(keyword: value.toString(), count: 0);
  }
  const TrendKeyword({required this.keyword, required this.count});

  final String keyword;
  final int count;
}

class TrendsApi {
  const TrendsApi(this._dio);

  final Dio _dio;

  Future<TrendsOverview> overview(TrendsOverviewParams params) async {
    final res = await _dio.get<Map<String, dynamic>>(ApiRoutes.trendsOverview, queryParameters: params.toQuery());
    return TrendsOverview.fromJson((res.data?['data'] as Map<String, dynamic>?) ?? {});
  }

  Future<PublicationTrend> topic(String topic) async {
    final res = await _dio.get<Map<String, dynamic>>(ApiRoutes.trendsTopic(topic));
    return PublicationTrend.fromJson((res.data?['data'] as Map<String, dynamic>?) ?? {});
  }
}
