import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Dummy screens for now to avoid compilation errors
class PlaceholderScreen extends StatelessWidget {
  final String title;
  const PlaceholderScreen({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(child: Text('Screen: $title')),
    );
  }
}

// Router Provider
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    // TODO: Add redirect logic for authentication
    redirect: (context, state) {
      return null;
    },
    routes: [
      // (tabs) - Main App
      GoRoute(
        path: '/',
        name: 'home',
        builder: (context, state) => const PlaceholderScreen(title: 'Tabs Root'),
      ),
      
      // (auth)
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const PlaceholderScreen(title: 'Login'),
      ),
      GoRoute(
        path: '/register',
        name: 'register',
        builder: (context, state) => const PlaceholderScreen(title: 'Register'),
      ),

      // paper/[id]
      GoRoute(
        path: '/paper/:id',
        name: 'paper_detail',
        builder: (context, state) {
          final id = state.pathParameters['id'];
          return PlaceholderScreen(title: 'Paper Detail: $id');
        },
      ),

      // trends
      GoRoute(
        path: '/trends',
        name: 'trends',
        builder: (context, state) => const PlaceholderScreen(title: 'Trends'),
      ),

      // reports
      GoRoute(
        path: '/reports',
        name: 'reports',
        builder: (context, state) => const PlaceholderScreen(title: 'Reports'),
      ),

      // report/[id]
      GoRoute(
        path: '/report/:id',
        name: 'report_detail',
        builder: (context, state) {
          final id = state.pathParameters['id'];
          return PlaceholderScreen(title: 'Report Detail: $id');
        },
      ),

      // submit-paper
      GoRoute(
        path: '/submit-paper',
        name: 'submit_paper',
        builder: (context, state) => const PlaceholderScreen(title: 'Submit Paper'),
      ),

      // my-papers
      GoRoute(
        path: '/my-papers',
        name: 'my_papers',
        builder: (context, state) => const PlaceholderScreen(title: 'My Papers'),
      ),

      // rankings
      GoRoute(
        path: '/rankings',
        name: 'rankings',
        builder: (context, state) => const PlaceholderScreen(title: 'Rankings'),
      ),

      // gaps
      GoRoute(
        path: '/gaps',
        name: 'gaps',
        builder: (context, state) => const PlaceholderScreen(title: 'Gaps'),
      ),

      // projects
      GoRoute(
        path: '/projects',
        name: 'projects',
        builder: (context, state) => const PlaceholderScreen(title: 'Projects'),
      ),

      // project/[id]
      GoRoute(
        path: '/project/:id',
        name: 'project_detail',
        builder: (context, state) {
          final id = state.pathParameters['id'];
          return PlaceholderScreen(title: 'Project Detail: $id');
        },
      ),

      // keyword/[keyword]
      GoRoute(
        path: '/keyword/:keyword',
        name: 'keyword_detail',
        builder: (context, state) {
          final keyword = state.pathParameters['keyword'];
          return PlaceholderScreen(title: 'Keyword: $keyword');
        },
      ),
    ],
  );
});
