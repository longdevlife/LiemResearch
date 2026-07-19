import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_mobile/core/widgets/app_error_state.dart';
import 'package:flutter_mobile/core/widgets/app_loading.dart';
import 'package:flutter_mobile/features/trends/components/trends_ai_tab.dart';
import 'package:flutter_mobile/features/trends/components/trends_compare_tab.dart';
import 'package:flutter_mobile/features/trends/components/trends_overview_tab.dart';
import 'package:flutter_mobile/features/trends/components/trends_scope_sheet.dart';
import 'package:flutter_mobile/features/trends/components/trends_signals_tab.dart';
import 'package:flutter_mobile/features/trends/data/trends_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class TrendsScreen extends ConsumerStatefulWidget {
  const TrendsScreen({super.key});

  @override
  ConsumerState<TrendsScreen> createState() => _TrendsScreenState();
}

class _TrendsScreenState extends ConsumerState<TrendsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Active Scope Parameters
  int _yearFrom = 2020;
  int _yearTo = 2026;
  int _minPapers = 1;
  final String _sortBy = 'momentum';
  TrendScopeFilters _scopeFilters = const TrendScopeFilters();

  String? _aiTabInitialTopic;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _openScopeBottomSheet(TrendFacets facets, TrendsOverviewParams currentParams) {
    unawaited(showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return TrendsScopeSheet(
          params: currentParams,
          facets: facets,
          onChanged: (newParams) {
            setState(() {
              _yearFrom = newParams.yearFrom ?? 2020;
              _yearTo = newParams.yearTo ?? 2026;
              _minPapers = newParams.minPapers ?? 1;
              _scopeFilters = newParams.scopeFilters;
            });
          },
        );
      },
    ));
  }

  void _navigateToAiTabWithTopic(String topic) {
    setState(() {
      _aiTabInitialTopic = topic;
    });
    _tabController.animateTo(3); // Index 3 is AI Explain Tab
  }

  @override
  Widget build(BuildContext context) {
    final currentParams = TrendsOverviewParams(
      yearFrom: _yearFrom,
      yearTo: _yearTo,
      minPapers: _minPapers,
      sortBy: _sortBy,
      limit: 30,
      scopeFilters: _scopeFilters,
    );

    final query = ref.watch(trendsOverviewProvider(currentParams));
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final bgColor = isDark ? const Color(0xFF0F1B2D) : theme.scaffoldBackgroundColor;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('Trends Workbench', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          query.maybeWhen(
            data: (overview) => overview.facets != null
                ? IconButton(
                    icon: const Icon(Icons.tune),
                    tooltip: 'Data Scope Filters',
                    onPressed: () => _openScopeBottomSheet(overview.facets!, currentParams),
                  )
                : const SizedBox.shrink(),
            orElse: () => const SizedBox.shrink(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF06B6D4),
          labelColor: const Color(0xFF06B6D4),
          unselectedLabelColor: const Color(0xFF94A3B8),
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Signals'),
            Tab(text: 'Compare'),
            Tab(text: 'AI Explain'),
          ],
        ),
      ),
      body: query.when(
        data: (overview) => TabBarView(
          controller: _tabController,
          children: [
            TrendsOverviewTab(
              overview: overview,
              onOpenScopeSheet: () {
                if (overview.facets != null) {
                  _openScopeBottomSheet(overview.facets!, currentParams);
                }
              },
            ),
            TrendsSignalsTab(overview: overview),
            TrendsCompareTab(
              overview: overview,
              params: currentParams,
              onExplainTopic: _navigateToAiTabWithTopic,
            ),
            TrendsAiTab(
              overview: overview,
              params: currentParams,
              initialTopic: _aiTabInitialTopic,
            ),
          ],
        ),
        loading: () => const AppLoading(fullScreen: true, message: 'Loading trends data...'),
        error: (error, _) => AppErrorState(message: error.toString()),
      ),
    );
  }
}
