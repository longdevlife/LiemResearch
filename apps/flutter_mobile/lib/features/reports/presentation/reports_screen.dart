import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_mobile/core/widgets/app_empty_state.dart';
import 'package:flutter_mobile/core/widgets/app_error_state.dart';
import 'package:flutter_mobile/core/widgets/app_loading.dart';
import 'package:flutter_mobile/core/widgets/swipe_delete_tile.dart';
import 'package:flutter_mobile/features/bookmarks/data/bookmarks_api.dart';
import 'package:flutter_mobile/features/reports/data/reports_api.dart';

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  final topic = TextEditingController(text: 'LLM in education');
  final query = TextEditingController(text: 'Analyze research trends in large language models for education');
  bool deepAnalysis = false;
  bool creating = false;
  String? _selectedId;
  Timer? _pollTimer;

  @override
  void dispose() {
    topic.dispose();
    query.dispose();
    _pollTimer?.cancel();
    super.dispose();
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (_selectedId != null) {
        ref.invalidate(reportProvider(_selectedId!));
      }
      ref.invalidate(reportsProvider(const ReportsParams()));
    });
  }

  void _stopPolling() {
    _pollTimer?.cancel();
    _pollTimer = null;
  }

  Future<void> _create() async {
    if (query.text.trim().length < 3) return;
    setState(() => creating = true);
    try {
      final id = await ref.read(reportsApiProvider).create(
            query: query.text.trim(),
            topic: topic.text.trim(),
            deepAnalysis: deepAnalysis,
          );
      setState(() {
        _selectedId = id;
      });
      _startPolling();
      try {
        await ref.read(bookmarksApiProvider).create(targetKind: 'report', targetId: id);
      } catch (_) {
        // A duplicate bookmark should not block report creation.
      }
      ref.invalidate(reportsProvider(const ReportsParams()));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Report queued. Worker will generate it in the background.'),
            backgroundColor: Color(0xFF06B6D4),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => creating = false);
    }
  }

  Future<void> _deleteReport(String id) async {
    try {
      await ref.read(reportsApiProvider).delete(id);
      if (_selectedId == id) {
        setState(() {
          _selectedId = null;
        });
      }
      ref.invalidate(reportsProvider(const ReportsParams()));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Report deleted successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete report: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'ready':
        return const Color(0xFF10B981);
      case 'failed':
        return const Color(0xFFEF4444);
      case 'generating':
        return const Color(0xFFF59E0B);
      default:
        return const Color(0xFF06B6D4);
    }
  }

  @override
  Widget build(BuildContext context) {
    final reports = ref.watch(reportsProvider(const ReportsParams()));
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final bgColor = isDark ? const Color(0xFF0F1B2D) : theme.scaffoldBackgroundColor;
    final cardBg = isDark ? const Color(0xFF1A2332) : theme.cardColor;
    final borderColor = isDark ? const Color(0xFF26334A) : const Color(0xFFE2E8F0);
    final inputBg = isDark ? const Color(0xFF0F1B2D) : Colors.white;

    // Load selected report details
    if (_selectedId != null) {
      ref.listen(reportProvider(_selectedId!), (previous, next) {
        next.whenData((report) {
          if (report.status == 'ready' || report.status == 'failed') {
            _stopPolling();
          } else {
            if (_pollTimer == null) {
              _startPolling();
            }
          }
        });
      });
    }
    final selectedReportQuery = _selectedId != null ? ref.watch(reportProvider(_selectedId!)) : null;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        title: const Text('AI Reports'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(reportsProvider(const ReportsParams()));
          if (_selectedId != null) {
            ref.invalidate(reportProvider(_selectedId!));
          }
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            const Text(
              'Generate Report',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 20),

            // Input Form Container
            Container(
              decoration: BoxDecoration(
                color: cardBg,
                border: Border.all(color: borderColor),
                borderRadius: BorderRadius.circular(24),
              ),
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'TOPIC',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 48,
                    decoration: BoxDecoration(
                      color: inputBg,
                      border: Border.all(color: borderColor),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    alignment: Alignment.centerLeft,
                    child: TextField(
                      controller: topic,
                      style: const TextStyle(fontSize: 14),
                      enabled: !creating,
                      decoration: const InputDecoration.collapsed(
                        hintText: 'Topic label',
                        hintStyle: TextStyle(color: Color(0xFF64748B)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  const Text(
                    'QUESTION',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8)),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      color: inputBg,
                      border: Border.all(color: borderColor),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    child: TextField(
                      controller: query,
                      style: const TextStyle(fontSize: 14),
                      minLines: 3,
                      maxLines: 5,
                      enabled: !creating,
                      decoration: const InputDecoration.collapsed(
                        hintText: 'What should AI analyze?',
                        hintStyle: TextStyle(color: Color(0xFF64748B)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Deep Analysis toggle Switch
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B).withValues(alpha: 0.4) : const Color(0xFFF8FAFC).withValues(alpha: 0.4),
                      border: Border.all(color: borderColor.withValues(alpha: 0.5)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Deep Analysis',
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Let Gemini autonomously run searches and trends analysis to write a highly detailed report.',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                                  height: 1.3,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Switch(
                          value: deepAnalysis,
                          onChanged: creating ? null : (value) => setState(() => deepAnalysis = value),
                          activeColor: Colors.white,
                          activeTrackColor: const Color(0xFF06B6D4),
                          inactiveThumbColor: const Color(0xFFF4F3F4),
                          inactiveTrackColor: const Color(0xFF94A3B8),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: creating ? null : _create,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1D4ED8),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: creating
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Text(
                              'Create report',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Live preview panel for selected report
            if (selectedReportQuery != null) ...[
              selectedReportQuery.when(
                data: (report) => Container(
                  margin: const EdgeInsets.only(bottom: 24),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF082F49) : const Color(0xFFECFEFF),
                    border: Border.all(color: const Color(0xFF06B6D4)),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        report.topic ?? report.query,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        report.status.toUpperCase(),
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: _statusColor(report.status),
                        ),
                      ),
                      if (report.errorMessage != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          report.errorMessage!,
                          style: const TextStyle(fontSize: 13, color: Colors.red),
                        ),
                      ],
                      if (report.markdown != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          report.markdown!,
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark ? const Color(0xFFCFFAFE) : const Color(0xFF155E75),
                            height: 1.5,
                          ),
                          maxLines: 4,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          height: 40,
                          child: ElevatedButton.icon(
                            onPressed: () => context.push('/report/${report.id}'),
                            icon: const Icon(Icons.visibility, size: 16, color: Colors.white),
                            label: const Text(
                              'View Full Report',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF06B6D4),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              elevation: 0,
                            ),
                          ),
                        ),
                      ] else ...[
                        const SizedBox(height: 12),
                        const Text(
                          'No markdown yet. Keep the report worker running and pull down to refresh.',
                          style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8), fontStyle: FontStyle.italic),
                        ),
                      ],
                    ],
                  ),
                ),
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.symmetric(vertical: 16),
                    child: CircularProgressIndicator(),
                  ),
                ),
                error: (err, _) => Container(
                  margin: const EdgeInsets.only(bottom: 24),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF2F2),
                    border: Border.all(color: const Color(0xFFFCA5A5)),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    err.toString(),
                    style: const TextStyle(color: Colors.red),
                  ),
                ),
              ),
            ],

            const Text(
              'My reports',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),

            reports.when(
              data: (data) {
                if (data.reports.isEmpty) {
                  return const AppEmptyState(
                    title: 'No reports yet',
                    message: 'Create one above.',
                  );
                }
                return Column(
                  children: data.reports.map((report) {
                    final isSelected = _selectedId == report.id;
                    return SwipeDeleteTile(
                      tileKey: ValueKey(report.id),
                      margin: const EdgeInsets.only(bottom: 12),
                      borderRadius: BorderRadius.circular(16),
                      onDelete: () => _deleteReport(report.id),
                      child: GestureDetector(
                        onTap: () {
                          if (report.status == 'ready') {
                            context.push('/report/${report.id}');
                          } else {
                            setState(() => _selectedId = report.id);
                            _startPolling();
                          }
                        },
                        child: Container(
                          decoration: BoxDecoration(
                            color: isSelected
                                ? (isDark ? const Color(0xFF082F49) : const Color(0xFFECFEFF))
                                : cardBg,
                            border: Border.all(
                              color: isSelected ? const Color(0xFF06B6D4) : borderColor,
                              width: isSelected ? 2 : 1,
                            ),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: isDark ? const Color(0xFF1E1B4B) : const Color(0xFFF3E8FF),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                alignment: Alignment.center,
                                child: const Icon(Icons.auto_awesome, size: 18, color: Color(0xFF8B5CF6)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      report.topic ?? report.query,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.bold,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      report.query,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF94A3B8),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      report.status.toUpperCase(),
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                        color: _statusColor(report.status),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                );
              },
              loading: () => const AppLoading(message: 'Loading reports...'),
              error: (error, _) => AppErrorState(message: error.toString()),
            ),
          ],
        ),
      ),
    );
  }
}
