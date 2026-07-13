import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_mobile/core/widgets/app_empty_state.dart';
import 'package:flutter_mobile/core/widgets/app_error_state.dart';
import 'package:flutter_mobile/core/widgets/app_loading.dart';
import 'package:flutter_mobile/features/notifications/data/notifications_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = ref.watch(notificationsProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(notificationsApiProvider).markAllRead();
              ref.invalidate(notificationsProvider);
            },
            child: const Text('Read all'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(notificationsProvider),
        child: query.when(
          data: (items) {
            if (items.isEmpty) {
              return ListView(
                padding: const EdgeInsets.all(24),
                children: const [
                  AppEmptyState(icon: Icons.notifications_none, title: 'No notifications', message: 'Research activity will appear here.'),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 112),
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final item = items[index];
                return Card(
                  color: item.isRead ? null : Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.35),
                  child: ListTile(
                    leading: Icon(item.isRead ? Icons.notifications_none : Icons.notifications_active),
                    title: Text(item.title),
                    subtitle: Text(item.message),
                    onTap: () async {
                      await ref.read(notificationsApiProvider).markRead(item.id);
                      ref.invalidate(notificationsProvider);
                      if (!context.mounted) return;
                      _openTarget(context, item);
                    },
                  ),
                );
              },
            );
          },
          loading: () => const AppLoading(fullScreen: true, message: 'Loading notifications...'),
          error: (error, _) => AppErrorState(message: error.toString()),
        ),
      ),
    );
  }

  void _openTarget(BuildContext context, AppNotification item) {
    if (item.targetKind == 'paper' && item.targetId != null) unawaited(context.push('/paper/${item.targetId}'));
    if (item.targetKind == 'report' && item.targetId != null) unawaited(context.push('/report/${item.targetId}'));
    if (item.targetKind == 'project' && item.targetId != null) unawaited(context.push('/project/${item.targetId}'));
    if (item.targetKind == 'gap') unawaited(context.push('/gaps'));
  }
}
