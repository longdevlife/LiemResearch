import 'package:flutter/material.dart';
import 'package:flutter_mobile/core/widgets/app_error_state.dart';
import 'package:flutter_mobile/core/widgets/app_loading.dart';
import 'package:flutter_mobile/features/rankings/data/rankings_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class RankingsScreen extends ConsumerWidget {
  const RankingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rankings = ref.watch(rankingsProvider);
    final me = ref.watch(myRankingProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Rankings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          me.when(
            data: (data) => data == null
                ? const SizedBox.shrink()
                : Card(
                    child: ListTile(
                      leading: const Icon(Icons.emoji_events),
                      title: Text('Your rank #${data.rank}'),
                      subtitle: Text('${data.points} points - ${data.uploadedPdfs} uploaded PDFs - ${data.requestedPapers} requests'),
                    ),
                  ),
            loading: () => const AppLoading(message: 'Loading your rank...'),
            error: (error, _) => Text(error.toString()),
          ),
          const SizedBox(height: 12),
          rankings.when(
            data: (data) => Column(
              children: data.rankings
                  .map((user) => Card(
                        child: ListTile(
                          leading: CircleAvatar(child: Text('#${user.rank}')),
                          title: Text(user.name),
                          subtitle: Text('${user.university ?? 'University'} - ${user.role}'),
                          trailing: Text('${user.points} pts'),
                        ),
                      ))
                  .toList(),
            ),
            loading: () => const AppLoading(message: 'Loading leaderboard...'),
            error: (error, _) => AppErrorState(message: error.toString()),
          ),
        ],
      ),
    );
  }
}
