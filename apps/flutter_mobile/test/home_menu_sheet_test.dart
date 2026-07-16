import 'package:flutter/material.dart';
import 'package:flutter_mobile/features/home/presentation/home_screen.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('home menu sheet lays out without flex exceptions', (tester) async {
    final visited = <String>[];

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SizedBox(
            height: 420,
            child: HomeMenuSheet(onNavigate: visited.add),
          ),
        ),
      ),
    );

    expect(tester.takeException(), isNull);
    expect(find.text('Menu'), findsOneWidget);

    await tester.tap(find.text('AI Reports'));
    await tester.pumpAndSettle();

    expect(visited, contains('/reports'));
  });
}
