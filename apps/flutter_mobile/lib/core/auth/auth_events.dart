import 'package:flutter_riverpod/flutter_riverpod.dart';

class AuthExpiredSignal extends Notifier<int> {
  @override
  int build() => 0;

  void notifyExpired() {
    state++;
  }
}

final authExpiredSignalProvider = NotifierProvider<AuthExpiredSignal, int>(() {
  return AuthExpiredSignal();
});
