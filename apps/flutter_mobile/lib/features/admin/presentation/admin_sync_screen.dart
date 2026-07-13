import 'package:flutter/material.dart';
import 'package:flutter_mobile/core/widgets/app_error_state.dart';
import 'package:flutter_mobile/core/widgets/app_loading.dart';
import 'package:flutter_mobile/features/admin/data/admin_api.dart';
import 'package:flutter_mobile/features/auth/data/auth_models.dart';
import 'package:flutter_mobile/features/auth/providers/auth_controller.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AdminSyncScreen extends ConsumerStatefulWidget {
  const AdminSyncScreen({super.key});

  @override
  ConsumerState<AdminSyncScreen> createState() => _AdminSyncScreenState();
}

class _AdminSyncScreenState extends ConsumerState<AdminSyncScreen> {
  final searchText = TextEditingController(text: 'large language models');
  final yearFrom = TextEditingController(text: '2020');
  final maxPages = TextEditingController(text: '1');

  @override
  void dispose() {
    searchText.dispose();
    yearFrom.dispose();
    maxPages.dispose();
    super.dispose();
  }

  Future<void> _sync() async {
    await ref.read(adminApiProvider).triggerSync(
          searchText: searchText.text.trim(),
          yearFrom: int.tryParse(yearFrom.text),
          maxPages: int.tryParse(maxPages.text),
        );
    ref.invalidate(syncRunsProvider);
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    if (user?.role != UserRole.admin) {
      return Scaffold(appBar: AppBar(title: const Text('Admin Sync')), body: const Center(child: Text('Access denied.')));
    }
    final runs = ref.watch(syncRunsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Admin Sync')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(controller: searchText, decoration: const InputDecoration(labelText: 'Search text')),
          TextField(controller: yearFrom, decoration: const InputDecoration(labelText: 'Year from')),
          TextField(controller: maxPages, decoration: const InputDecoration(labelText: 'Max pages')),
          const SizedBox(height: 12),
          FilledButton(onPressed: _sync, child: const Text('Trigger sync')),
          const Divider(height: 32),
          runs.when(
            data: (items) => Column(
              children: items
                  .map((run) => Card(
                        child: ListTile(
                          title: Text(run.searchText),
                          subtitle: Text('${run.status} - fetched ${run.totalFetched}, inserted ${run.totalInserted}${run.errorMessage == null ? '' : '\n${run.errorMessage}'}'),
                        ),
                      ))
                  .toList(),
            ),
            loading: () => const AppLoading(message: 'Loading sync runs...'),
            error: (error, _) => AppErrorState(message: error.toString()),
          ),
        ],
      ),
    );
  }
}
