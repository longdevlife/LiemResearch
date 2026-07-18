import 'package:flutter/material.dart';
import 'package:flutter_mobile/core/widgets/app_empty_state.dart';
import 'package:flutter_mobile/core/widgets/app_error_state.dart';
import 'package:flutter_mobile/core/widgets/app_loading.dart';
import 'package:flutter_mobile/features/papers/data/papers_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class MyPapersScreen extends ConsumerWidget {
  const MyPapersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = ref.watch(myPapersProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Papers'),
        actions: [IconButton(onPressed: () => context.push('/submit-paper'), icon: const Icon(Icons.add))],
      ),
      body: query.when(
        data: (papers) {
          if (papers.isEmpty) {
            return ListView(
              padding: const EdgeInsets.all(24),
              children: [
                AppEmptyState(
                  icon: Icons.archive_outlined,
                  title: 'No papers yet',
                  message: 'Submit a paper request to start.',
                  actionLabel: 'Submit paper',
                  onAction: () => context.push('/submit-paper'),
                ),
              ],
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myPapersProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemBuilder: (context, index) {
                final paper = papers[index];
                return Card(
                  child: ListTile(
                    title: Text(paper.title, maxLines: 2, overflow: TextOverflow.ellipsis),
                    subtitle: Text('${paper.paperStatus ?? paper.dataStatus} - ${paper.publicationYear}'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () => context.push('/paper/${paper.id}'),
                  ),
                );
              },
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemCount: papers.length,
            ),
          );
        },
        loading: () => const AppLoading(fullScreen: true, message: 'Loading your papers...'),
        error: (error, _) => AppErrorState(message: error.toString()),
      ),
    );
  }
}
