import 'package:flutter/foundation.dart';

import 'api_service.dart';

class Session extends ChangeNotifier {
  Session(this.api);
  final ApiService api;
  Map<String, dynamic>? user;
  bool loading = true;

  bool get isAuthenticated => user != null;

  Future<void> restore() async {
    final token = await api.readToken();
    if (token != null) {
      try {
        final result = await api.me();
        user = Map<String, dynamic>.from(result['user'] as Map);
      } catch (_) {
        await api.clearSession();
      }
    }
    loading = false;
    notifyListeners();
  }

  Future<void> signIn(String username, String password) async {
    final result = await api.login(username, password);
    await api.saveSession(
      result['token'].toString(),
      Map<String, dynamic>.from(result['user'] as Map),
    );
    user = Map<String, dynamic>.from(result['user'] as Map);
    notifyListeners();
  }

  Future<void> register(Map<String, dynamic> data) async {
    final result = await api.register(data);
    await api.saveSession(
      result['token'].toString(),
      Map<String, dynamic>.from(result['user'] as Map),
    );
    user = Map<String, dynamic>.from(result['user'] as Map);
    notifyListeners();
  }

  Future<void> signOut() async {
    await api.clearSession();
    user = null;
    notifyListeners();
  }
}
