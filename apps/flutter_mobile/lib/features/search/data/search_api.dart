import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod/src/providers/future_provider.dart';

import 'package:flutter_mobile/core/constants/api_routes.dart';
import 'package:flutter_mobile/core/network/api_client.dart';
import 'package:flutter_mobile/features/papers/data/papers_api.dart';

final searchApiProvider = Provider<SearchApi>((ref) {
  return SearchApi(ref.watch(apiClientProvider).dio);
});

final FutureProviderFamily<PagedPapers, SearchParams> searchResultsProvider = FutureProvider.autoDispose.family<PagedPapers, SearchParams>((ref, params) {
  if (params.q.trim().isEmpty) return Future.value(const PagedPapers(papers: []));
  return ref.watch(searchApiProvider).semantic(params);
});

class SearchParams {
  const SearchParams({required this.q, this.page = 1, this.pageSize = 10, this.rerank = false});

  final String q;
  final int page;
  final int pageSize;
  final bool rerank;

  @override
  bool operator ==(Object other) {
    return other is SearchParams &&
        other.q == q &&
        other.page == page &&
        other.pageSize == pageSize &&
        other.rerank == rerank;
  }

  @override
  int get hashCode => Object.hash(q, page, pageSize, rerank);
}

class SearchApi {
  const SearchApi(this._dio);

  final Dio _dio;

  Future<PagedPapers> semantic(SearchParams params) async {
    final res = await _dio.get<Map<String, dynamic>>(
      ApiRoutes.searchSemantic,
      queryParameters: {
        'q': params.q,
        'page': params.page,
        'pageSize': params.pageSize,
        'rerank': params.rerank,
      },
    );
    return PagedPapers(
      papers: (res.data?['data'] as List<dynamic>? ?? []).map(parsePaper).toList(),
      meta: res.data?['meta'] as Map<String, dynamic>?,
    );
  }
}
