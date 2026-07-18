import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_mobile/core/widgets/app_error_state.dart';
import 'package:flutter_mobile/core/widgets/app_loading.dart';
import 'package:flutter_mobile/features/auth/providers/auth_controller.dart';
import 'package:flutter_mobile/features/projects/data/projects_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

enum _ChatMode { team, privateAi, teamAi }

class ProjectDetailScreen extends ConsumerStatefulWidget {
  const ProjectDetailScreen({required this.id, super.key});

  final String id;

  @override
  ConsumerState<ProjectDetailScreen> createState() =>
      _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends ConsumerState<ProjectDetailScreen> {
  final _message = TextEditingController();
  final _scrollController = ScrollController();
  _ChatMode _mode = _ChatMode.team;
  Timer? _poller;
  bool _sending = false;
  String? _sendError;

  @override
  void initState() {
    super.initState();
    _poller = Timer.periodic(const Duration(seconds: 5), (_) => _refresh());
  }

  @override
  void dispose() {
    _poller?.cancel();
    _message.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _refresh() {
    if (!mounted) return;
    if (_mode == _ChatMode.team) {
      ref.invalidate(projectTeamChatProvider(widget.id));
    } else {
      ref.invalidate(
        projectChatProvider((
          projectId: widget.id,
          scope: _mode == _ChatMode.privateAi ? 'private' : 'team',
        )),
      );
    }
  }

  void _selectMode(_ChatMode mode) {
    setState(() {
      _mode = mode;
      _sendError = null;
    });
    _refresh();
  }

  Future<void> _send(int paperCount) async {
    final text = _message.text.trim();
    if (text.isEmpty || _sending) return;
    if (_mode != _ChatMode.team && paperCount == 0) {
      setState(() => _sendError = 'Add papers before asking AI.');
      return;
    }
    setState(() {
      _sending = true;
      _sendError = null;
    });
    try {
      final api = ref.read(projectsApiProvider);
      if (_mode == _ChatMode.team) {
        await api.sendTeamChat(widget.id, text);
      } else {
        await api.sendChat(
          widget.id,
          text,
          scope: _mode == _ChatMode.privateAi ? 'private' : 'team',
        );
      }
      _message.clear();
      _refresh();
    } on Object catch (error) {
      if (mounted) setState(() => _sendError = error.toString());
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final project = ref.watch(projectProvider(widget.id));
    final colors = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(
        title: project.maybeWhen(
          data: (data) => Text(data.title),
          orElse: () => const Text('Project detail'),
        ),
        surfaceTintColor: Colors.transparent,
      ),
      body: project.when(
        data: (data) => Column(
          children: [
            _ChannelSwitcher(mode: _mode, onChanged: _selectMode),
            Expanded(
              child: _ChatPanel(
                projectId: widget.id,
                mode: _mode,
                ownerId: data.ownerId,
                paperCount: data.papers.length,
                controller: _scrollController,
                onRefresh: _refresh,
              ),
            ),
            if (_sendError != null)
              Container(
                width: double.infinity,
                color: Theme.of(context).colorScheme.errorContainer,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
                child: Text(
                  _sendError!,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onErrorContainer,
                  ),
                ),
              ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Container(
                        decoration: BoxDecoration(
                          color: colors.surfaceContainerHighest.withValues(
                            alpha: .5,
                          ),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: colors.outlineVariant.withValues(alpha: .18),
                          ),
                        ),
                        child: TextField(
                          controller: _message,
                          minLines: 1,
                          maxLines: 4,
                          maxLength: 2000,
                          textInputAction: TextInputAction.newline,
                          decoration: InputDecoration(
                            hintText: _mode == _ChatMode.team
                                ? 'Message your project team...'
                                : 'Ask about project papers...',
                            counterText: '',
                            border: InputBorder.none,
                            prefixIcon: Icon(
                              _mode == _ChatMode.team
                                  ? Icons.forum_outlined
                                  : Icons.auto_awesome_rounded,
                              size: 20,
                            ),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 13,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    SizedBox.square(
                      dimension: 48,
                      child: IconButton.filled(
                        style: IconButton.styleFrom(
                          shape: const CircleBorder(),
                          backgroundColor: const Color(0xFF1D4ED8),
                          foregroundColor: Colors.white,
                        ),
                        onPressed: _sending
                            ? null
                            : () => _send(data.papers.length),
                        icon: _sending
                            ? const SizedBox.square(
                                dimension: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : const Icon(Icons.send_rounded),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
        loading: () =>
            const AppLoading(fullScreen: true, message: 'Loading project...'),
        error: (error, _) => AppErrorState(message: error.toString()),
      ),
    );
  }
}

class _ChannelSwitcher extends StatelessWidget {
  const _ChannelSwitcher({required this.mode, required this.onChanged});

  final _ChatMode mode;
  final ValueChanged<_ChatMode> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      height: 48,
      margin: const EdgeInsets.fromLTRB(16, 6, 16, 10),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: colors.surfaceContainerHighest.withValues(alpha: .38),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: colors.outlineVariant.withValues(alpha: .55),
        ),
      ),
      child: Row(
        children: [
          _ChannelTab(
            label: 'Team',
            icon: Icons.groups_rounded,
            selected: mode == _ChatMode.team,
            onTap: () => onChanged(_ChatMode.team),
          ),
          _ChannelTab(
            label: 'My AI',
            icon: Icons.auto_awesome_rounded,
            selected: mode == _ChatMode.privateAi,
            onTap: () => onChanged(_ChatMode.privateAi),
          ),
          _ChannelTab(
            label: 'Team AI',
            icon: Icons.smart_toy_rounded,
            selected: mode == _ChatMode.teamAi,
            onTap: () => onChanged(_ChatMode.teamAi),
          ),
        ],
      ),
    );
  }
}

class _ChannelTab extends StatelessWidget {
  const _ChannelTab({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2),
        child: Material(
          color: selected
              ? colors.primary.withValues(alpha: .1)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          child: InkWell(
            borderRadius: BorderRadius.circular(8),
            onTap: onTap,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                border: selected
                    ? Border.all(color: colors.primary.withValues(alpha: .22))
                    : null,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    icon,
                    size: 17,
                    color: selected ? colors.primary : colors.onSurfaceVariant,
                  ),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      label,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: selected
                            ? FontWeight.w700
                            : FontWeight.w600,
                        color: selected
                            ? colors.primary
                            : colors.onSurfaceVariant,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ChatPanel extends ConsumerWidget {
  const _ChatPanel({
    required this.projectId,
    required this.mode,
    required this.ownerId,
    required this.paperCount,
    required this.controller,
    required this.onRefresh,
  });

  final String projectId;
  final _ChatMode mode;
  final String? ownerId;
  final int paperCount;
  final ScrollController controller;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final title = switch (mode) {
      _ChatMode.team => 'Team Chat',
      _ChatMode.privateAi => 'My AI - Private',
      _ChatMode.teamAi => 'Team AI Room - Shared',
    };
    final subtitle = switch (mode) {
      _ChatMode.team => 'Discuss with project members',
      _ChatMode.privateAi => 'Only you can see this AI conversation',
      _ChatMode.teamAi => 'AI answers are visible to every project member',
    };

    final body = mode == _ChatMode.team
        ? ref
              .watch(projectTeamChatProvider(projectId))
              .when(
                data: (messages) => _TeamMessages(
                  projectId: projectId,
                  messages: messages,
                  ownerId: ownerId,
                  controller: controller,
                  onRefresh: onRefresh,
                ),
                loading: () =>
                    const AppLoading(message: 'Loading team chat...'),
                error: (error, _) => AppErrorState(
                  message: error.toString(),
                  onRetry: onRefresh,
                ),
              )
        : ref
              .watch(
                projectChatProvider((
                  projectId: projectId,
                  scope: mode == _ChatMode.privateAi ? 'private' : 'team',
                )),
              )
              .when(
                data: (messages) => _AiMessages(
                  projectId: projectId,
                  messages: messages,
                  shared: mode == _ChatMode.teamAi,
                  paperCount: paperCount,
                  controller: controller,
                  onRefresh: onRefresh,
                ),
                loading: () =>
                    const AppLoading(message: 'Loading AI history...'),
                error: (error, _) => AppErrorState(
                  message: error.toString(),
                  onRetry: onRefresh,
                ),
              );

    final colors = Theme.of(context).colorScheme;
    return Container(
      margin: const EdgeInsets.fromLTRB(0, 0, 0, 4),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: colors.surfaceContainerLowest,
        border: Border(
          top: BorderSide(color: colors.outlineVariant.withValues(alpha: .45)),
          bottom: BorderSide(
            color: colors.outlineVariant.withValues(alpha: .35),
          ),
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(18, 10, 16, 10),
            decoration: BoxDecoration(
              color: colors.surface,
              border: Border(
                bottom: BorderSide(
                  color: colors.outlineVariant.withValues(alpha: .5),
                ),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 34,
                  height: 34,
                  decoration: BoxDecoration(
                    color: colors.primary.withValues(alpha: .1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    mode == _ChatMode.team
                        ? Icons.forum_rounded
                        : mode == _ChatMode.privateAi
                        ? Icons.auto_awesome_rounded
                        : Icons.smart_toy_rounded,
                    size: 18,
                    color: colors.primary,
                  ),
                ),
                const SizedBox(width: 11),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        subtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          fontSize: 11,
                          color: colors.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
                _StatusPill(private: mode == _ChatMode.privateAi),
              ],
            ),
          ),
          Expanded(
            child: ColoredBox(
              color: colors.surfaceContainerHighest.withValues(alpha: .18),
              child: body,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.private});

  final bool private;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final color = private ? colors.primary : const Color(0xFF16845B);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: .09),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            private ? Icons.lock_outline_rounded : Icons.circle,
            size: private ? 13 : 8,
            color: color,
          ),
          const SizedBox(width: 5),
          Text(
            private ? 'Private' : 'Live',
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _AiMessages extends ConsumerWidget {
  const _AiMessages({
    required this.projectId,
    required this.messages,
    required this.shared,
    required this.paperCount,
    required this.controller,
    required this.onRefresh,
  });

  final String projectId;
  final List<ProjectChatMessage> messages;
  final bool shared;
  final int paperCount;
  final ScrollController controller;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    if (messages.isEmpty) {
      return _EmptyChat(
        icon: Icons.auto_awesome,
        title: 'No AI messages yet',
        message: paperCount == 0
            ? 'Add papers before asking AI.'
            : 'Ask about methods, limitations, trends, or research gaps.',
      );
    }
    final sorted = [...messages]
      ..sort((a, b) {
        final timeA = DateTime.tryParse(a.createdAt) ?? DateTime(0);
        final timeB = DateTime.tryParse(b.createdAt) ?? DateTime(0);
        if (timeA.difference(timeB).abs() <= const Duration(seconds: 5) &&
            a.role != b.role) {
          return a.role == 'user' ? -1 : 1;
        }
        return timeA.compareTo(timeB);
      });
    return ListView.builder(
      controller: controller,
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 18),
      itemCount: sorted.length,
      itemBuilder: (context, index) {
        final item = sorted[index];
        final isUser = item.role == 'user';
        final isMe = item.userId == user?.id || item.requester?.id == user?.id;
        final name = isMe ? 'You' : (item.requester?.displayName ?? 'Member');
        return _MessageBubble(
          mine: isUser && isMe,
          icon: isUser ? null : Icons.auto_awesome,
          heading: isUser
              ? name
              : 'AI assistant${item.requester == null ? '' : ' - requested by ${item.requester!.displayName}'}',
          content: item.content,
          createdAt: item.createdAt,
          footer: isUser
              ? null
              : Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    if (item.creditCost != null)
                      _BubbleActionPill(
                        icon: Icons.bolt_outlined,
                        label: '${item.creditCost} credit',
                        subtle: true,
                      ),
                    if (item.isPinned)
                      const _BubbleActionPill(
                        icon: Icons.push_pin,
                        label: 'Pinned',
                        active: true,
                      ),
                    _BubbleActionPill(
                      icon: Icons.copy_rounded,
                      label: 'Copy',
                      onTap: () {
                        unawaited(
                          Clipboard.setData(ClipboardData(text: item.content)),
                        );
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('AI answer copied')),
                        );
                      },
                    ),
                    ...item.citedPaperIds
                        .take(3)
                        .map(
                          (id) => _BubbleActionPill(
                            label:
                                'Paper ${id.length > 6 ? id.substring(id.length - 6) : id}',
                            subtle: true,
                          ),
                        ),
                  ],
                ),
        );
      },
    );
  }
}

class _TeamMessages extends ConsumerWidget {
  const _TeamMessages({
    required this.projectId,
    required this.messages,
    required this.ownerId,
    required this.controller,
    required this.onRefresh,
  });

  final String projectId;
  final List<ProjectTeamChatMessage> messages;
  final String? ownerId;
  final ScrollController controller;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    if (messages.isEmpty) {
      return const _EmptyChat(
        icon: Icons.forum_outlined,
        title: 'No team messages yet',
        message: 'Start the discussion with your project members.',
      );
    }
    return ListView.builder(
      controller: controller,
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 18),
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final item = messages[index];
        final mine = item.sender.id == user?.id;
        final canDelete =
            mine || ownerId == user?.id || user?.role.name == 'admin';
        if (!mine && !item.readBy.any((reader) => reader.id == user?.id)) {
          unawaited(
            Future.microtask(
              () => ref
                  .read(projectsApiProvider)
                  .markTeamChatRead(projectId, item.id),
            ),
          );
        }
        return _MessageBubble(
          mine: mine,
          heading: mine ? 'You' : item.sender.displayName,
          content: item.isDeleted ? 'This message was removed.' : item.content,
          createdAt: item.createdAt,
          italic: item.isDeleted,
          footer: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (mine) ...[
                const Icon(Icons.done_all, size: 14),
                const SizedBox(width: 4),
                Text(
                  item.readCount > 1 ? 'Seen by ${item.readCount - 1}' : 'Sent',
                ),
              ],
              if (canDelete && !item.isDeleted)
                IconButton(
                  visualDensity: VisualDensity.compact,
                  constraints: const BoxConstraints.tightFor(
                    width: 24,
                    height: 24,
                  ),
                  padding: EdgeInsets.zero,
                  tooltip: 'Delete message',
                  onPressed: () async {
                    await ref
                        .read(projectsApiProvider)
                        .deleteTeamChat(projectId, item.id);
                    onRefresh();
                  },
                  icon: const Icon(Icons.delete_outline, size: 16),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _BubbleActionPill extends StatelessWidget {
  const _BubbleActionPill({
    required this.label,
    this.icon,
    this.onTap,
    this.active = false,
    this.subtle = false,
  });

  final String label;
  final IconData? icon;
  final VoidCallback? onTap;
  final bool active;
  final bool subtle;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final foreground = active ? const Color(0xFF1D4ED8) : colors.onSurface;
    final background = active
        ? const Color(0xFF1D4ED8).withValues(alpha: .1)
        : colors.surface.withValues(alpha: subtle ? .55 : .86);
    final borderColor = active
        ? const Color(0xFF1D4ED8).withValues(alpha: .16)
        : colors.outlineVariant.withValues(alpha: .18);

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Ink(
          padding: EdgeInsets.symmetric(
            horizontal: icon == null ? 12 : 10,
            vertical: 7,
          ),
          decoration: BoxDecoration(
            color: background,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: borderColor),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 14, color: foreground),
                const SizedBox(width: 6),
              ],
              Text(
                label,
                style: TextStyle(
                  color: foreground,
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  const _MessageBubble({
    required this.mine,
    required this.heading,
    required this.content,
    required this.createdAt,
    this.icon,
    this.footer,
    this.italic = false,
  });

  final bool mine;
  final String heading;
  final String content;
  final String createdAt;
  final IconData? icon;
  final Widget? footer;
  final bool italic;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    final timestamp = DateTime.tryParse(createdAt)?.toLocal();
    final bubbleColor = mine
        ? const Color(0xFF1D4ED8)
        : colors.surfaceContainerHighest.withValues(alpha: .78);
    final textColor = mine ? colors.onPrimary : colors.onSurface;
    final metaColor = mine
        ? colors.onPrimary.withValues(alpha: .72)
        : colors.onSurfaceVariant;
    final maxWidth = MediaQuery.sizeOf(context).width * .68;

    final bubble = Container(
      constraints: BoxConstraints(maxWidth: maxWidth),
      padding: const EdgeInsets.fromLTRB(13, 9, 13, 9),
      decoration: BoxDecoration(
        color: bubbleColor,
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(20),
          topRight: const Radius.circular(20),
          bottomLeft: Radius.circular(mine ? 20 : 5),
          bottomRight: Radius.circular(mine ? 5 : 20),
        ),
        boxShadow: [
          BoxShadow(
            color: colors.shadow.withValues(alpha: .035),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 14, color: colors.primary),
                const SizedBox(width: 5),
              ],
              Flexible(
                child: Text(
                  heading,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: metaColor,
                  ),
                ),
              ),
              if (timestamp != null) ...[
                const SizedBox(width: 5),
                Text(
                  DateFormat.Hm().format(timestamp),
                  style: TextStyle(fontSize: 10, color: metaColor),
                ),
              ],
            ],
          ),
          const SizedBox(height: 4),
          Text(
            content,
            style: TextStyle(
              color: textColor,
              fontSize: 14.5,
              height: 1.32,
              fontStyle: italic ? FontStyle.italic : null,
            ),
          ),
          if (footer != null) ...[
            const SizedBox(height: 8),
            IconTheme(
              data: IconThemeData(color: metaColor, size: 16),
              child: DefaultTextStyle(
                style: TextStyle(fontSize: 11, color: metaColor),
                child: footer!,
              ),
            ),
          ],
        ],
      ),
    );

    return Padding(
      padding: EdgeInsets.only(
        left: mine ? 58 : 0,
        right: mine ? 4 : 34,
        bottom: 10,
      ),
      child: Row(
        mainAxisAlignment: mine
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!mine) ...[
            _ChatAvatar(icon: icon ?? Icons.person_outline_rounded),
            const SizedBox(width: 7),
          ],
          Flexible(child: bubble),
        ],
      ),
    );
  }
}

class _ChatAvatar extends StatelessWidget {
  const _ChatAvatar({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: colors.primary.withValues(alpha: .12),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, size: 15, color: colors.primary),
    );
  }
}

class _EmptyChat extends StatelessWidget {
  const _EmptyChat({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: colors.primary.withValues(alpha: .1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, size: 26, color: colors.primary),
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: colors.onSurfaceVariant,
                height: 1.35,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
