import 'package:flutter/material.dart';
import 'package:flutter_mobile/core/widgets/app_error_state.dart';
import 'package:flutter_mobile/core/widgets/app_loading.dart';
import 'package:flutter_mobile/features/trends/data/trends_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class TrendsScreen extends ConsumerWidget {
  const TrendsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = ref.watch(trendsOverviewProvider(const TrendsOverviewParams(limit: 30, minPapers: 1, sortBy: 'momentum')));
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final bgColor = isDark ? const Color(0xFF0F1B2D) : theme.scaffoldBackgroundColor;
    final cardBg = isDark ? const Color(0xFF1A2332) : theme.cardColor;
    final borderColor = isDark ? const Color(0xFF26334A) : const Color(0xFFE2E8F0);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Trends'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: query.when(
        data: (overview) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(trendsOverviewProvider(const TrendsOverviewParams(limit: 30, minPapers: 1, sortBy: 'momentum'))),
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: overview.topics.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final topic = overview.topics[index];
              return Container(
                decoration: BoxDecoration(
                  color: cardBg,
                  border: Border.all(color: borderColor),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: ExpansionTile(
                    title: Text(
                      topic.topic,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Text(
                      '${topic.totalPapers} papers - ${topic.growthRatePct.round()}% growth',
                      style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                    ),
                    leading: Icon(
                      topic.momentum >= 0 ? Icons.trending_up : Icons.trending_down,
                      color: topic.momentum >= 0 ? const Color(0xFF22C55E) : const Color(0xFFEF4444),
                    ),
                    childrenPadding: const EdgeInsets.all(16),
                    expandedCrossAxisAlignment: CrossAxisAlignment.start,
                    shape: const Border(),
                    collapsedShape: const Border(),
                    children: [
                      const Text(
                        'YEARLY BREAKDOWN',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF94A3B8),
                        ),
                      ),
                      const SizedBox(height: 12),
                      _TrendChart(points: topic.yearlyBreakdown),
                      const SizedBox(height: 12),
                      Align(
                        alignment: Alignment.centerRight,
                        child: TextButton.icon(
                          onPressed: () => context.push('/keyword/${Uri.encodeComponent(topic.topic)}'),
                          icon: const Icon(Icons.open_in_new, size: 14, color: Color(0xFF06B6D4)),
                          label: const Text(
                            'Open papers',
                            style: TextStyle(color: Color(0xFF06B6D4), fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        loading: () => const AppLoading(fullScreen: true, message: 'Loading trends...'),
        error: (error, _) => AppErrorState(message: error.toString()),
      ),
    );
  }
}

class _TrendChart extends StatelessWidget {
  const _TrendChart({required this.points});
  final List<YearlyCount> points;

  @override
  Widget build(BuildContext context) {
    if (points.isEmpty) return const SizedBox(height: 52);

    // Slice last 8 points to fit nicely on mobile screens
    final visible = points.length > 8 ? points.sublist(points.length - 8) : points;
    final maxCount = visible.map((point) => point.count).reduce((a, b) => a > b ? a : b);
    final max = maxCount > 0 ? maxCount : 1;

    return Container(
      height: 80,
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: visible.map((point) {
          final heightRatio = point.count / max;
          final barHeight = (heightRatio * 52).clamp(8.0, 52.0);
          final yearStr = point.year.toString();
          final shortYear = yearStr.length >= 4 ? yearStr.substring(yearStr.length - 2) : yearStr;

          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Expanded(
                    child: Align(
                      alignment: Alignment.bottomCenter,
                      child: Container(
                        height: barHeight,
                        decoration: const BoxDecoration(
                          color: Color(0xFF06B6D4),
                          borderRadius: BorderRadius.vertical(top: Radius.circular(4)),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    shortYear,
                    style: const TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF94A3B8),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          );
        }).toList(),
      ),
    );
  }
}
