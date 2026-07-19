import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_mobile/core/utils/number_format.dart';
import 'package:flutter_mobile/features/trends/data/trends_api.dart';
import 'package:go_router/go_router.dart';

class TrendsSignalsTab extends StatelessWidget {
  const TrendsSignalsTab({
    required this.overview,
    super.key,
  });

  final TrendsOverview overview;

  Widget _buildSparkline(List<YearlyCount> timeline, bool isDark) {
    if (timeline.isEmpty) return const SizedBox(width: 80, height: 32);

    final spots = timeline.asMap().entries.map((e) {
      return FlSpot(e.key.toDouble(), e.value.count.toDouble());
    }).toList();

    return SizedBox(
      width: 80,
      height: 32,
      child: LineChart(
        LineChartData(
          gridData: const FlGridData(show: false),
          titlesData: const FlTitlesData(show: false),
          borderData: FlBorderData(show: false),
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              color: const Color(0xFF06B6D4),
              dotData: const FlDotData(show: false),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final keywords = overview.risingKeywords;

    if (keywords.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'No emerging signal keywords found in the current scope. Try widening the year filter.',
            textAlign: TextAlign.center,
            style: TextStyle(fontStyle: FontStyle.italic, color: Color(0xFF94A3B8)),
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: keywords.length,
      separatorBuilder: (_, _) => const SizedBox(height: 10),
      itemBuilder: (context, idx) {
        final kw = keywords[idx];
        final cardBg = isDark ? const Color(0xFF1A2332) : theme.cardColor;
        final borderColor = isDark ? const Color(0xFF26334A) : const Color(0xFFE2E8F0);

        return Container(
          decoration: BoxDecoration(
            color: cardBg,
            border: Border.all(color: borderColor),
            borderRadius: BorderRadius.circular(16),
          ),
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      kw.keyword,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Text(
                          '${formatNumber(kw.totalPapers)} papers',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                        ),
                        const SizedBox(width: 8),
                        const Text('·', style: TextStyle(color: Color(0xFF94A3B8))),
                        const SizedBox(width: 8),
                        Text(
                          '${formatSigned(kw.growthRatePct)}% YoY',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: kw.growthRatePct >= 0 ? const Color(0xFF22C55E) : const Color(0xFFEF4444),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              _buildSparkline(kw.yearlyBreakdown, isDark),
              const SizedBox(width: 12),
              IconButton(
                icon: const Icon(Icons.arrow_forward_ios, size: 14, color: Color(0xFF06B6D4)),
                onPressed: () => context.push('/keyword/${Uri.encodeComponent(kw.keyword)}'),
              ),
            ],
          ),
        );
      },
    );
  }
}
