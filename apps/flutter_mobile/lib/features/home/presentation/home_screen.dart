import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_mobile/core/widgets/app_empty_state.dart';
import 'package:flutter_mobile/core/widgets/app_error_state.dart';
import 'package:flutter_mobile/core/widgets/app_loading.dart';
import 'package:flutter_mobile/core/widgets/paper_card.dart';
import 'package:flutter_mobile/features/auth/providers/auth_controller.dart';
import 'package:flutter_mobile/features/bookmarks/data/bookmarks_api.dart';
import 'package:flutter_mobile/features/home/data/analytics_api.dart';
import 'package:flutter_mobile/features/papers/data/papers_api.dart';
import 'package:flutter_mobile/features/rankings/domain/level_helper.dart';
import 'package:flutter_mobile/features/search/data/search_api.dart';
import 'package:flutter_mobile/features/trends/data/trends_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _searchController = TextEditingController();
  String _query = '';
  Timer? _debounce;

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      setState(() => _query = value.trim());
    });
  }

  Future<void> _toggleBookmark(String paperId) async {
    final api = ref.read(bookmarksApiProvider);
    final status = await api.checkStatus('paper', paperId);
    if (status.bookmarked && status.bookmarkId != null) {
      await api.delete(status.bookmarkId!);
    } else {
      await api.create(targetKind: 'paper', targetId: paperId);
    }
    ref
      ..invalidate(bookmarksProvider)
      ..invalidate(bookmarkStatusProvider(BookmarkTarget('paper', paperId)));
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final analytics = ref.watch(analyticsSummaryProvider);
    final papers = _query.isEmpty
        ? ref.watch(papersProvider(const PapersListParams(pageSize: 5)))
        : ref.watch(searchResultsProvider(SearchParams(q: _query, pageSize: 5)));
    final trends = ref.watch(trendsOverviewProvider(const TrendsOverviewParams(limit: 4, minPapers: 1, sortBy: 'momentum')));
    final theme = Theme.of(context);

    final userPoints = user?.points ?? 0;
    final userLevel = LevelHelper.getLevel(userPoints);
    final levelAsset = LevelHelper.getLevelAsset(userLevel);

    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () async {
          ref
            ..invalidate(analyticsSummaryProvider)
            ..invalidate(papersProvider(const PapersListParams(pageSize: 5)))
            ..invalidate(trendsOverviewProvider(const TrendsOverviewParams(limit: 4, minPapers: 1, sortBy: 'momentum')));
        },
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 112),
          children: [
            Row(
              children: [
                IconButton.filledTonal(
                  onPressed: () => _showHomeMenu(context),
                  icon: const Icon(Icons.menu),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Hi, ${user?.fullName.split(' ').first ?? 'Researcher'}',
                        style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold, fontSize: 22),
                      ),
                      Text(
                        'What are you researching today?',
                        style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 44,
                  height: 44,
                  padding: const EdgeInsets.all(4),
                  decoration: BoxDecoration(
                    color: theme.cardColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: theme.dividerColor),
                  ),
                  child: Image.asset(
                    levelAsset,
                    fit: BoxFit.contain,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            analytics.when(
              data: (data) => Container(
                margin: const EdgeInsets.only(bottom: 20),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.cardColor,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: theme.dividerColor),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: Colors.cyan.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.bar_chart, color: Color(0xFF06B6D4), size: 18),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Database Status',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${data.totalPapers} papers - ${data.totalSearches} searches - ${data.uniqueUsers} users',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.onSurfaceVariant,
                                    fontSize: 11,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.2)),
                      ),
                      child: const Text(
                        'Live',
                        style: TextStyle(
                          color: Color(0xFF22C55E),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              loading: () => const AppLoading(message: 'Loading metrics...'),
              error: (error, _) => AppErrorState(message: error.toString()),
            ),
            SearchBar(
              controller: _searchController,
              hintText: 'Search papers, authors, topics...',
              hintStyle: WidgetStateProperty.all(
                theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.6)),
              ),
              textStyle: WidgetStateProperty.all(theme.textTheme.bodyMedium),
              leading: Icon(Icons.search, color: theme.colorScheme.onSurfaceVariant),
              trailing: [Icon(Icons.tune, color: theme.colorScheme.onSurfaceVariant)],
              onChanged: _onSearchChanged,
              elevation: WidgetStateProperty.all(0),
              backgroundColor: WidgetStateProperty.all(theme.cardColor),
              shape: WidgetStateProperty.all(
                RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                  side: BorderSide(color: theme.dividerColor),
                ),
              ),
            ),
            const SizedBox(height: 24),
            _SectionTitle(
              title: 'Trending topics',
              action: 'View all',
              onTap: () => context.push('/trends'),
            ),
            const SizedBox(height: 8),
            trends.when(
              data: (data) => SizedBox(
                height: 145,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: data.topics.length,
                  separatorBuilder: (_, _) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final topic = data.topics[index];
                    return SizedBox(
                      width: 176,
                      child: Card(
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                          side: BorderSide(color: theme.dividerColor),
                        ),
                        color: theme.cardColor,
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                topic.topic,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Icon(
                                    topic.momentum >= 0 ? Icons.arrow_outward : Icons.south_east,
                                    size: 13,
                                    color: topic.momentum >= 0 ? const Color(0xFF22C55E) : const Color(0xFFF59E0B),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${topic.growthRatePct.round()}% growth',
                                    style: TextStyle(
                                      color: topic.momentum >= 0 ? const Color(0xFF22C55E) : const Color(0xFFF59E0B),
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const Spacer(),
                              Sparkline(points: topic.yearlyBreakdown),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
              loading: () => const AppLoading(message: 'Loading trends...'),
              error: (error, _) => AppErrorState(message: error.toString()),
            ),
            const SizedBox(height: 24),
            Text(_query.isEmpty ? 'Recent papers' : 'Search results', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            papers.when(
              data: (data) {
                if (data.papers.isEmpty) {
                  return const AppEmptyState(
                    icon: Icons.article_outlined,
                    title: 'No papers found',
                    message: 'Try another query or sync more papers.',
                  );
                }
                return Column(
                  children: data.papers.map((paper) {
                    final authors = paper.authors.map((author) => author.displayName).join(', ');
                    return PaperCard(
                      id: paper.id,
                      title: paper.title,
                      authors: authors.isEmpty ? 'Unknown authors' : authors,
                      venueAndYear: '${paper.journalName ?? 'Unknown venue'} - ${paper.publicationYear} - ${paper.citationCount} cites',
                      score: paper.dataQualityScore.toStringAsFixed(2),
                      onTap: () => context.push('/paper/${paper.id}'),
                      onBookmarkTap: () => _toggleBookmark(paper.id),
                    );
                  }).toList(),
                );
              },
              loading: () => const AppLoading(message: 'Loading papers...'),
              error: (error, _) => AppErrorState(message: error.toString()),
            ),
          ],
        ),
      ),
    );
  }

  void _showHomeMenu(BuildContext context) {
    final items = [
      ('Submit Paper', Icons.upload_file, '/submit-paper', const Color(0xFF06B6D4)),
      ('AI Reports', Icons.description, '/reports', const Color(0xFFA78BFA)),
      ('Ranks', Icons.emoji_events, '/rankings', const Color(0xFFA5B4FC)),
      ('Trends', Icons.trending_up, '/trends', const Color(0xFF22C55E)),
      ('Gaps', Icons.bolt, '/gaps', const Color(0xFFF59E0B)),
      ('Projects', Icons.folder, '/projects', const Color(0xFF06B6D4)),
      ('My Papers', Icons.archive, '/my-papers', const Color(0xFF38BDF8)),
    ];
    unawaited(showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Menu',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            const Divider(),
            Expanded(
              child: ListView(
                shrinkWrap: true,
                children: items
                    .map(
                      (item) => ListTile(
                        leading: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: item.$4.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(item.$2, color: item.$4, size: 18),
                        ),
                        title: Text(
                          item.$1,
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                        trailing: const Icon(Icons.chevron_right),
                        onTap: () {
                          Navigator.pop(context);
                          unawaited(context.push(item.$3));
                        },
                      ),
                    )
                    .toList(),
              ),
            ),
          ],
        ),
      ),
    ));
  }
}

class Sparkline extends StatelessWidget {
  const Sparkline({required this.points, super.key});
  final List<YearlyCount> points;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) return const SizedBox(height: 32);
    final maxCount = points.map((p) => p.count).reduce((a, b) => a > b ? a : b);
    final max = maxCount > 0 ? maxCount : 1;

    // Slice last 7 points
    final lastPoints = points.length > 7 ? points.sublist(points.length - 7) : points;

    return SizedBox(
      height: 32,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: lastPoints.map((point) {
          final heightRatio = point.count / max;
          final barHeight = (heightRatio * 32).clamp(8.0, 32.0);
          final opacity = (0.35 + heightRatio * 0.55).clamp(0.0, 1.0);
          return Expanded(
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              height: barHeight,
              decoration: BoxDecoration(
                color: const Color(0xFF8B5CF6).withValues(alpha: opacity),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, required this.action, required this.onTap});

  final String title;
  final String action;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
        TextButton(onPressed: onTap, child: Text(action)),
      ],
    );
  }
}
