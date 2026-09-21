import 'package:flutter/material.dart';

import 'core/api_service.dart';
import 'core/session.dart';
import 'screens/home_screen.dart';
import 'screens/login_screen.dart';

void main() => runApp(const GraminArogyaApp());

class GraminArogyaApp extends StatefulWidget {
  const GraminArogyaApp({super.key});
  @override
  State<GraminArogyaApp> createState() => _GraminArogyaAppState();
}

class _GraminArogyaAppState extends State<GraminArogyaApp> {
  late final ApiService api;
  late final Session session;

  @override
  void initState() {
    super.initState();
    api = ApiService();
    session = Session(api)..restore();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: session,
    builder: (context, _) => MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'GraminArogya',
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xff087f5b)),
        scaffoldBackgroundColor: const Color(0xfff7faf8),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide.none,
          ),
        ),
      ),
      home: session.loading
          ? const _Splash()
          : session.isAuthenticated
          ? HomeScreen(session: session, api: api)
          : LoginScreen(session: session),
    ),
  );
}

class _Splash extends StatelessWidget {
  const _Splash();
  @override
  Widget build(BuildContext context) => const Scaffold(
    body: Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.favorite_rounded, size: 58, color: Color(0xff087f5b)),
          SizedBox(height: 16),
          Text(
            'GRAMINAROGYA',
            style: TextStyle(fontWeight: FontWeight.w800, letterSpacing: 2),
          ),
          SizedBox(height: 20),
          CircularProgressIndicator(),
        ],
      ),
    ),
  );
}
