import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:flutter_mobile/core/widgets/app_empty_state.dart';
import 'package:flutter_mobile/core/widgets/app_error_state.dart';
import 'package:flutter_mobile/core/widgets/app_loading.dart';
import 'package:flutter_mobile/features/projects/data/projects_api.dart';

class ProjectsScreen extends ConsumerStatefulWidget {
  const ProjectsScreen({super.key});

  @override
  ConsumerState<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends ConsumerState<ProjectsScreen> {
  final title = TextEditingController();
  final description = TextEditingController();

  @override
  void dispose() {
    title.dispose();
    description.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    final cleanTitle = title.text.trim();
    if (cleanTitle.isEmpty || cleanTitle.length > 100) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Project title must be 1-100 characters.')));
      return;
    }
    final project = await ref.read(projectsApiProvider).create(cleanTitle, description.text.trim());
    ref.invalidate(projectsProvider);
    if (mounted) context.push('/project/${project.id}');
  }

  @override
  Widget build(BuildContext context) {
    final projects = ref.watch(projectsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Projects')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  TextField(controller: title, decoration: const InputDecoration(labelText: 'Project title')),
                  TextField(controller: description, decoration: const InputDecoration(labelText: 'Description')),
                  const SizedBox(height: 12),
                  FilledButton(onPressed: _create, child: const Text('Create project')),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          projects.when(
            data: (items) {
              if (items.isEmpty) return const AppEmptyState(title: 'No projects yet', message: 'Create your first project above.');
              return Column(
                children: items.map((project) {
                  return Card(
                    child: ListTile(
                      leading: const Icon(Icons.folder),
                      title: Text(project.title),
                      subtitle: Text('${project.description ?? 'No description'}\n${project.papers.length} papers - ${project.members.length} members'),
                      isThreeLine: true,
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.push('/project/${project.id}'),
                    ),
                  );
                }).toList(),
              );
            },
            loading: () => const AppLoading(message: 'Loading projects...'),
            error: (error, _) => AppErrorState(message: error.toString()),
          ),
        ],
      ),
    );
  }
}
