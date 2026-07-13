import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_mobile/core/widgets/app_error_state.dart';
import 'package:flutter_mobile/core/widgets/app_loading.dart';
import 'package:flutter_mobile/features/auth/providers/auth_controller.dart';
import 'package:flutter_mobile/features/bookmarks/data/bookmarks_api.dart';
import 'package:flutter_mobile/features/papers/data/papers_api.dart';
import 'package:flutter_mobile/features/projects/data/projects_api.dart';
import 'package:flutter_mobile/features/quality/data/quality_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

class PaperDetailScreen extends ConsumerStatefulWidget {
  const PaperDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<PaperDetailScreen> createState() => _PaperDetailScreenState();
}

class _PaperDetailScreenState extends ConsumerState<PaperDetailScreen> {
  String _activeTab = 'abstract';
  int rating = 0;
  final commentController = TextEditingController();

  @override
  void dispose() {
    commentController.dispose();
    super.dispose();
  }

  Future<void> _toggleBookmark(bool isBookmarked, String? bookmarkId) async {
    final api = ref.read(bookmarksApiProvider);
    if (isBookmarked && bookmarkId != null) {
      await api.delete(bookmarkId);
    } else {
      await api.create(targetKind: 'paper', targetId: widget.id);
    }
    ref.invalidate(bookmarkStatusProvider(BookmarkTarget('paper', widget.id)));
  }

  Future<void> _submitRating() async {
    if (rating < 1) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select 1-5 stars before submitting.')),
      );
      return;
    }
    final api = ref.read(qualityApiProvider);
    final target = QualityTarget('paper', widget.id);
    try {
      await api.rate(
        'paper',
        widget.id,
        rating,
        commentController.text.trim().isEmpty ? null : commentController.text.trim(),
      );
      ref.invalidate(qualityViewProvider(target));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Review submitted successfully.')),
        );
      }
    } on Exception catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit review: $e')),
        );
      }
    }
  }

  Future<void> _runAiEvaluation() async {
    final api = ref.read(qualityApiProvider);
    final target = QualityTarget('paper', widget.id);
    try {
      await api.evaluate('paper', widget.id);
      ref.invalidate(qualityViewProvider(target));
    } on Exception catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('AI evaluation failed: $e')),
        );
      }
    }
  }

  Future<void> _deleteReview(String ratingId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete review'),
        content: const Text('Remove your review for this paper?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(qualityApiProvider).deleteRate(ratingId);
      ref.invalidate(qualityViewProvider(QualityTarget('paper', widget.id)));
      setState(() {
        rating = 0;
        commentController.clear();
      });
    }
  }

  void _openProjectPicker(BuildContext context) {
    unawaited(showModalBottomSheet<void>(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Consumer(
          builder: (context, ref, child) {
            final projectsAsync = ref.watch(projectsProvider);
            final theme = Theme.of(context);
            return SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Add to project',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    projectsAsync.when(
                      data: (projects) {
                        if (projects.isEmpty) {
                          return Center(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 24),
                              child: OutlinedButton(
                                onPressed: () {
                                  Navigator.pop(context);
                                  unawaited(context.push('/projects'));
                                },
                                child: const Text('Create your first project'),
                              ),
                            ),
                          );
                        }
                        return Flexible(
                          child: ListView.builder(
                            shrinkWrap: true,
                            itemCount: projects.length,
                            itemBuilder: (context, index) {
                              final project = projects[index];
                              return ListTile(
                                leading: Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: Colors.cyan.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(Icons.folder, color: Color(0xFF06B6D4), size: 17),
                                ),
                                title: Text(project.title, maxLines: 1, overflow: TextOverflow.ellipsis),
                                subtitle: Text('${project.papers.length} papers'),
                                trailing: const Icon(Icons.add, color: Color(0xFF06B6D4)),
                                onTap: () async {
                                  Navigator.pop(context);
                                  try {
                                    await ref.read(projectsApiProvider).addPaper(project.id, widget.id);
                                    ref.invalidate(projectsProvider);
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        const SnackBar(content: Text('Added paper to project')),
                                      );
                                    }
                                  } on Exception catch (e) {
                                    if (context.mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(content: Text('Failed to add: $e')),
                                      );
                                    }
                                  }
                                },
                              );
                            },
                          ),
                        );
                      },
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (e, _) => Text('Error loading projects: $e'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    ));
  }

  @override
  Widget build(BuildContext context) {
    final paperQuery = ref.watch(paperProvider(widget.id));
    final statusQuery = ref.watch(bookmarkStatusProvider(BookmarkTarget('paper', widget.id)));
    final qualityTarget = QualityTarget('paper', widget.id);
    final qualityQuery = ref.watch(qualityViewProvider(qualityTarget));
    final currentUser = ref.watch(currentUserProvider);

    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    ref.listen<AsyncValue<QualityView>>(
      qualityViewProvider(qualityTarget),
      (previous, next) {
        final view = next.value;
        if (view != null) {
          if (view.myStars != null && rating == 0) {
            setState(() {
              rating = view.myStars!;
              if (view.myComment != null && commentController.text.isEmpty) {
                commentController.text = view.myComment!;
              }
            });
          }
        }
      },
    );

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.chevron_left, size: 28),
          onPressed: () => context.pop(),
        ),
        title: const Text('Paper Detail', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, size: 20),
            onPressed: () {},
          )
        ],
      ),
      body: paperQuery.when(
        data: (paper) {
          final isBookmarked = statusQuery.value?.bookmarked ?? false;
          final bookmarkId = statusQuery.value?.bookmarkId;

          return Stack(
            children: [
              ListView(
                padding: EdgeInsets.fromLTRB(16, 16, 16, paper.openAccessUrl != null ? 112 : 24),
                children: [
                  Text(
                    paper.title,
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: paper.authors.take(3).map((author) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: theme.cardColor,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: theme.dividerColor),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.person, size: 12, color: Color(0xFF06B6D4)),
                            const SizedBox(width: 6),
                            Text(
                              author.displayName,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    '${paper.journalName != null ? "${paper.journalName} · " : ""}${paper.publicationYear}',
                    style: const TextStyle(
                      color: Color(0xFF06B6D4),
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E1B4B),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          '${paper.citationCount} Citations',
                          style: const TextStyle(
                            color: Color(0xFFA5B4FC),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      if (paper.isAiAnalyzable)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF064E3B),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.auto_awesome, color: Color(0xFF34D399), size: 10),
                              SizedBox(width: 4),
                              Text(
                                'AI Analyzable',
                                style: TextStyle(
                                  color: Color(0xFF34D399),
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      if (paper.openAccessUrl != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF451A03),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.lock_open, color: Color(0xFFFBBF24), size: 10),
                              SizedBox(width: 4),
                              Text(
                                'Open Access',
                                style: TextStyle(
                                  color: Color(0xFFFBBF24),
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Actions panel
                  Container(
                    decoration: BoxDecoration(
                      color: theme.cardColor,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: theme.dividerColor),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _ActionButton(
                          icon: Icons.bookmark,
                          label: isBookmarked ? 'Saved' : 'Save',
                          active: isBookmarked,
                          onTap: () => _toggleBookmark(isBookmarked, bookmarkId),
                          isDark: isDark,
                        ),
                        _ActionButton(
                          icon: Icons.person_add,
                          label: 'Follow',
                          onTap: () {},
                          isDark: isDark,
                        ),
                        _ActionButton(
                          icon: Icons.add_box,
                          label: 'Add',
                          onTap: () => _openProjectPicker(context),
                          isDark: isDark,
                        ),
                        _ActionButton(
                          icon: Icons.picture_as_pdf,
                          label: 'PDF',
                          disabled: paper.openAccessUrl == null,
                          onTap: paper.openAccessUrl == null
                              ? null
                              : () => launchUrl(Uri.parse(paper.openAccessUrl!)),
                          isDark: isDark,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // AI Analysis Card
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF082F49),
                      border: Border.all(color: const Color(0xFF06B6D4)),
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
                            color: const Color(0xFF0E7490),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.auto_awesome, color: Color(0xFFA5F3FC), size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'AI Analysis: ${paper.dataQualityScore.toStringAsFixed(2)}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Strong metadata quality and citation context make this paper suitable for semantic search, trend analysis, and report grounding.',
                                style: TextStyle(
                                  color: Color(0xFFCFFAFE),
                                  fontSize: 12,
                                  height: 1.4,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // AI Quality review panel & Community ratings
                  qualityQuery.when(
                    data: (view) {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // AI Quality review card
                          Container(
                            decoration: BoxDecoration(
                              color: theme.cardColor,
                              border: Border.all(color: theme.dividerColor),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            padding: const EdgeInsets.all(16),
                            margin: const EdgeInsets.only(bottom: 20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.auto_awesome, color: Color(0xFF06B6D4), size: 18),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        'AI quality review',
                                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                    ElevatedButton(
                                      onPressed: _runAiEvaluation,
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: const Color(0xFF1D4ED8),
                                        foregroundColor: Colors.white,
                                        elevation: 0,
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                      ),
                                      child: Text(
                                        view.evaluation != null ? 'Refresh' : 'Evaluate',
                                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                if (view.evaluation != null) ...[
                                  Row(
                                    children: [
                                      _QualityBadge(label: 'Overall', score: view.evaluation!.overall),
                                      const SizedBox(width: 8),
                                      _QualityBadge(label: 'Relevant', score: view.evaluation!.relevance),
                                      const SizedBox(width: 8),
                                      _QualityBadge(label: 'Grounded', score: view.evaluation!.groundedness),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Text(
                                    view.evaluation!.rationale,
                                    style: TextStyle(
                                      color: theme.colorScheme.onSurfaceVariant,
                                      fontSize: 14,
                                      height: 1.4,
                                    ),
                                  ),
                                ] else ...[
                                  Text(
                                    "Run AI evaluation to score relevance, groundedness, and completeness from this paper's metadata.",
                                    style: TextStyle(
                                      color: theme.colorScheme.onSurfaceVariant,
                                      fontSize: 14,
                                      height: 1.4,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ),

                          // Community rating card
                          Container(
                            decoration: BoxDecoration(
                              color: theme.cardColor,
                              border: Border.all(color: theme.dividerColor),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            padding: const EdgeInsets.all(16),
                            margin: const EdgeInsets.only(bottom: 20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Community rating',
                                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${view.ratingCount} ratings · average ${view.ratingAvg.toStringAsFixed(1)}',
                                  style: TextStyle(
                                    color: theme.colorScheme.onSurfaceVariant,
                                    fontSize: 12,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: List.generate(5, (index) {
                                    final starVal = index + 1;
                                    return Padding(
                                      padding: const EdgeInsets.only(right: 8),
                                      child: GestureDetector(
                                        onTap: () => setState(() => rating = starVal),
                                        child: Icon(
                                          starVal <= rating ? Icons.star : Icons.star_border,
                                          color: const Color(0xFFF59E0B),
                                          size: 32,
                                        ),
                                      ),
                                    );
                                  }),
                                ),
                                const SizedBox(height: 12),
                                TextField(
                                  controller: commentController,
                                  maxLines: 3,
                                  style: const TextStyle(fontSize: 14),
                                  decoration: InputDecoration(
                                    hintText: 'Write a short review...',
                                    hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide(color: theme.dividerColor),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: BorderSide(color: theme.dividerColor),
                                    ),
                                    contentPadding: const EdgeInsets.all(12),
                                  ),
                                ),
                                const SizedBox(height: 12),
                                SizedBox(
                                  width: double.infinity,
                                  child: ElevatedButton(
                                    onPressed: rating == 0 ? null : _submitRating,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFF1D4ED8),
                                      foregroundColor: Colors.white,
                                      elevation: 0,
                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    ),
                                    child: const Text('Submit review', style: TextStyle(fontWeight: FontWeight.bold)),
                                  ),
                                ),
                                if (view.ratings.isNotEmpty) ...[
                                  const SizedBox(height: 16),
                                  ...view.ratings.map((item) {
                                    final isMine = item.userName == currentUser?.fullName;
                                    return Container(
                                      padding: const EdgeInsets.symmetric(vertical: 12),
                                      decoration: BoxDecoration(
                                        border: Border(
                                          top: BorderSide(color: theme.dividerColor),
                                        ),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(
                                                item.userName,
                                                style: const TextStyle(fontWeight: FontWeight.bold),
                                              ),
                                              Row(
                                                children: [
                                                  const Icon(Icons.star, color: Color(0xFFF59E0B), size: 14),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    '${item.stars}',
                                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                                  ),
                                                  if (isMine) ...[
                                                    const SizedBox(width: 12),
                                                    GestureDetector(
                                                      onTap: () => _deleteReview(item.id),
                                                      child: const Icon(Icons.delete, color: Colors.red, size: 16),
                                                    ),
                                                  ],
                                                ],
                                              ),
                                            ],
                                          ),
                                          if (item.comment != null && item.comment!.isNotEmpty) ...[
                                            const SizedBox(height: 6),
                                            Text(
                                              item.comment!,
                                              style: TextStyle(
                                                color: theme.colorScheme.onSurfaceVariant,
                                                fontSize: 13,
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    );
                                  }),
                                ],
                              ],
                            ),
                          ),
                        ],
                      );
                    },
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (e, _) => Text(e.toString()),
                  ),
                  const SizedBox(height: 12),

                  // Custom Underlined Tabs selector
                  Container(
                    decoration: BoxDecoration(
                      border: Border(bottom: BorderSide(color: theme.dividerColor)),
                    ),
                    margin: const EdgeInsets.only(bottom: 16),
                    child: Row(
                      children: [
                        _buildTabButton('abstract', 'Abstract', theme),
                        _buildTabButton('topics', 'Topics', theme),
                        _buildTabButton('references', 'References', theme),
                      ],
                    ),
                  ),

                  // Tab content
                  if (_activeTab == 'abstract')
                    Text(
                      paper.abstractText ?? 'No abstract available for this paper.',
                      style: TextStyle(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontSize: 14,
                        height: 1.6,
                      ),
                    )
                  else if (_activeTab == 'topics')
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: paper.topics.isNotEmpty
                          ? paper.topics.map((topic) {
                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: theme.cardColor,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: theme.dividerColor),
                                ),
                                child: Text(
                                  topic.topicName,
                                  style: const TextStyle(fontSize: 12),
                                ),
                              );
                            }).toList()
                          : [
                              Text(
                                'No topics available.',
                                style: TextStyle(
                                  color: theme.colorScheme.onSurfaceVariant,
                                  fontStyle: FontStyle.italic,
                                ),
                              )
                            ],
                    )
                  else if (_activeTab == 'references')
                    _ReferencesTabContent(id: widget.id, theme: theme),
                ],
              ),
              if (paper.openAccessUrl != null)
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: theme.scaffoldBackgroundColor,
                      border: Border(top: BorderSide(color: theme.dividerColor)),
                    ),
                    child: ElevatedButton.icon(
                      onPressed: () => launchUrl(Uri.parse(paper.openAccessUrl!)),
                      icon: const Icon(Icons.open_in_new, size: 16, color: Color(0xFF0F1B2D)),
                      label: const Text(
                        'Open full text',
                        style: TextStyle(
                          color: Color(0xFF0F1B2D),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF06B6D4),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
        loading: () => const AppLoading(fullScreen: true, message: 'Loading paper...'),
        error: (error, _) => AppErrorState(message: error.toString()),
      ),
    );
  }

  Widget _buildTabButton(String tabValue, String tabLabel, ThemeData theme) {
    final active = _activeTab == tabValue;
    return GestureDetector(
      onTap: () => setState(() => _activeTab = tabValue),
      child: Container(
        padding: const EdgeInsets.only(bottom: 12),
        margin: const EdgeInsets.only(right: 20),
        decoration: BoxDecoration(
          border: active
              ? const Border(bottom: BorderSide(color: Color(0xFF06B6D4), width: 2))
              : null,
        ),
        child: Text(
          tabLabel,
          style: TextStyle(
            color: active ? const Color(0xFF06B6D4) : theme.colorScheme.onSurfaceVariant,
            fontWeight: active ? FontWeight.bold : FontWeight.normal,
            fontSize: 14,
          ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.isDark,
    this.active = false,
    this.disabled = false,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final bool active;
  final bool disabled;
  final VoidCallback? onTap;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final color = disabled
        ? const Color(0xFF475569)
        : active
            ? const Color(0xFF06B6D4)
            : isDark
                ? const Color(0xFF94A3B8)
                : const Color(0xFF64748B);

    return GestureDetector(
      onTap: disabled ? null : onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

class _QualityBadge extends StatelessWidget {
  const _QualityBadge({required this.label, required this.score});

  final String label;
  final double score;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: const Color(0xFF06B6D4).withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: Color(0xFF0891B2),
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              score.toStringAsFixed(1),
              style: TextStyle(
                color: Theme.of(context).textTheme.bodyMedium?.color,
                fontSize: 18,
                fontWeight: FontWeight.w900,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReferencesTabContent extends ConsumerWidget {
  const _ReferencesTabContent({required this.id, required this.theme});

  final String id;
  final ThemeData theme;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = ref.watch(paperReferencesProvider(id));
    return query.when(
      data: (data) {
        if (data.references.isEmpty) {
          return const Text('No in-library references found yet.');
        }
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Showing ${data.inCorpus} of ${data.totalReferenced} cited works found in this library.',
              style: TextStyle(
                color: theme.colorScheme.onSurfaceVariant,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 12),
            ...data.references.map((reference) {
              final authors = reference.authors.map((a) => a.displayName).take(3).join(', ');
              return Card(
                elevation: 0,
                margin: const EdgeInsets.only(bottom: 12),
                color: theme.cardColor,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(color: theme.dividerColor),
                ),
                child: InkWell(
                  onTap: () => context.push('/paper/${reference.id}'),
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          reference.title,
                          style: theme.textTheme.titleSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                            height: 1.3,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (authors.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            authors,
                            style: TextStyle(
                              color: theme.colorScheme.onSurfaceVariant,
                              fontSize: 12,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Text(
                              '${reference.publicationYear}',
                              style: const TextStyle(
                                color: Color(0xFF06B6D4),
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                            if (reference.doi != null && reference.doi!.isNotEmpty) ...[
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'DOI: ${reference.doi}',
                                  style: TextStyle(
                                    color: theme.colorScheme.onSurfaceVariant,
                                    fontSize: 11,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ],
        );
      },
      loading: () => const AppLoading(message: 'Loading references...'),
      error: (error, _) => AppErrorState(message: error.toString()),
    );
  }
}
