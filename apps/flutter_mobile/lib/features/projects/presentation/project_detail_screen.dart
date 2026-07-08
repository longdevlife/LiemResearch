import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:flutter_mobile/core/widgets/app_error_state.dart';
import 'package:flutter_mobile/core/widgets/app_loading.dart';
import 'package:flutter_mobile/features/projects/data/projects_api.dart';

class ProjectDetailScreen extends ConsumerStatefulWidget {
  const ProjectDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends ConsumerState<ProjectDetailScreen> {
  final message = TextEditingController();

  @override
  void dispose() {
    message.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (message.text.trim().isEmpty) return;
    await ref.read(projectsApiProvider).sendChat(widget.id, message.text.trim());
    message.clear();
    ref.invalidate(projectChatProvider(widget.id));
  }

  @override
  Widget build(BuildContext context) {
    final project = ref.watch(projectProvider(widget.id));
    final chat = ref.watch(projectChatProvider(widget.id));
    return Scaffold(
      appBar: AppBar(title: const Text('Project detail')),
      body: project.when(
        data: (project) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text(project.title, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
            Text(project.description ?? 'No description'),
            const SizedBox(height: 12),
            Text('${project.papers.length} papers - ${project.members.length} members'),
            const Divider(height: 32),
            Text('Project chat', style: Theme.of(context).textTheme.titleLarge),
            chat.when(
              data: (messages) => Column(
                children: messages
                    .map((item) => Align(
                          alignment: item.role == 'user' ? Alignment.centerRight : Alignment.centerLeft,
                          child: Card(child: Padding(padding: const EdgeInsets.all(12), child: Text(item.content))),
                        ))
                    .toList(),
              ),
              loading: () => const AppLoading(message: 'Loading chat...'),
              error: (error, _) => Text(error.toString()),
            ),
            Row(
              children: [
                Expanded(child: TextField(controller: message, decoration: const InputDecoration(labelText: 'Ask about this project'))),
                IconButton.filled(onPressed: _send, icon: const Icon(Icons.send)),
              ],
            ),
          ],
        ),
        loading: () => const AppLoading(fullScreen: true, message: 'Loading project...'),
        error: (error, _) => AppErrorState(message: error.toString()),
      ),
    );
  }
}
