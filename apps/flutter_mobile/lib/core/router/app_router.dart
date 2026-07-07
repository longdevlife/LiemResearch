import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/providers/auth_controller.dart';
import '../../features/auth/data/auth_models.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/home/presentation/app_shell_screen.dart';
import '../../features/profile/presentation/profile_screen.dart';
import '../widgets/app_loading.dart';

// Dummy screens for features not yet built
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

// Global navigator keys
final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorHomeKey = GlobalKey<NavigatorState>(debugLabel: 'homeTab');
final _shellNavigatorBookmarksKey = GlobalKey<NavigatorState>(debugLabel: 'bookmarksTab');
final _shellNavigatorAlertsKey = GlobalKey<NavigatorState>(debugLabel: 'alertsTab');
final _shellNavigatorProfileKey = GlobalKey<NavigatorState>(debugLabel: 'profileTab');

class RouterNotifier extends ChangeNotifier {
  final Ref _ref;
  RouterNotifier(this._ref) {
    _ref.listen<AsyncValue<User?>>(
      authControllerProvider,
      (_, __) => notifyListeners(),
    );
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final notifier = RouterNotifier(ref);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: notifier,
    redirect: (context, state) {
      final authState = ref.read(authControllerProvider);
      final isLoading = authState.isLoading;
      final user = authState.value;
      
      final isGoingToLogin = state.matchedLocation == '/login' || state.matchedLocation == '/register';
      final isSplash = state.matchedLocation == '/splash';
      
      
      if (isLoading && !isGoingToLogin) {
        return '/splash';
      }
      
      if (!isLoading && user == null && !isGoingToLogin) {
        return '/login';
      }
      
      
      if (user != null && (isGoingToLogin || isSplash)) {
        return '/';
      }
      
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const Scaffold(
          body: AppLoading(fullScreen: true, message: 'Initializing...'),
        ),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),

      // StatefulShellRoute for Bottom Navigation Tabs
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return AppShellScreen(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            navigatorKey: _shellNavigatorHomeKey,
            routes: [
              GoRoute(
                path: '/',
                name: 'home',
                builder: (context, state) => const PlaceholderScreen(title: 'Home Tab'),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellNavigatorBookmarksKey,
            routes: [
              GoRoute(
                path: '/bookmarks',
                name: 'bookmarks',
                builder: (context, state) => const PlaceholderScreen(title: 'Bookmarks Tab'),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellNavigatorAlertsKey,
            routes: [
              GoRoute(
                path: '/notifications',
                name: 'notifications',
                builder: (context, state) => const PlaceholderScreen(title: 'Alerts Tab'),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellNavigatorProfileKey,
            routes: [
              GoRoute(
                path: '/profile',
                name: 'profile',
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),

      // Other routes outside the shell
      GoRoute(
        path: '/paper/:id',
        name: 'paper_detail',
        builder: (context, state) => PlaceholderScreen(title: 'Paper: ${state.pathParameters['id']}'),
      ),
      GoRoute(
        path: '/trends',
        name: 'trends',
        builder: (context, state) => const PlaceholderScreen(title: 'Trends'),
      ),
      GoRoute(
        path: '/reports',
        name: 'reports',
        builder: (context, state) => const PlaceholderScreen(title: 'Reports'),
      ),
      GoRoute(
        path: '/report/:id',
        name: 'report_detail',
        builder: (context, state) => PlaceholderScreen(title: 'Report: ${state.pathParameters['id']}'),
      ),
      GoRoute(
        path: '/submit-paper',
        name: 'submit_paper',
        builder: (context, state) => const PlaceholderScreen(title: 'Submit Paper'),
      ),
      GoRoute(
        path: '/my-papers',
        name: 'my_papers',
        builder: (context, state) => const PlaceholderScreen(title: 'My Papers'),
      ),
      GoRoute(
        path: '/rankings',
        name: 'rankings',
        builder: (context, state) => const PlaceholderScreen(title: 'Rankings'),
      ),
      GoRoute(
        path: '/gaps',
        name: 'gaps',
        builder: (context, state) => const PlaceholderScreen(title: 'Gaps'),
      ),
      GoRoute(
        path: '/projects',
        name: 'projects',
        builder: (context, state) => const PlaceholderScreen(title: 'Projects'),
      ),
      GoRoute(
        path: '/project/:id',
        name: 'project_detail',
        builder: (context, state) => PlaceholderScreen(title: 'Project: ${state.pathParameters['id']}'),
      ),
      GoRoute(
        path: '/keyword/:keyword',
        name: 'keyword_detail',
        builder: (context, state) => PlaceholderScreen(title: 'Keyword: ${state.pathParameters['keyword']}'),
      ),
    ],
  );
});
