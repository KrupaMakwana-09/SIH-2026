import 'package:flutter/material.dart';

import '../core/api_service.dart';

class FacilitiesScreen extends StatefulWidget {
  const FacilitiesScreen({super.key});
  @override
  State<FacilitiesScreen> createState() => _FacilitiesScreenState();
}

class _FacilitiesScreenState extends State<FacilitiesScreen> {
  final api = ApiService();
  List<Map<String, dynamic>> items = [];
  String? error;
  bool loading = true;
  @override
  void initState() {
    super.initState();
    load();
  }

  Future<void> load() async {
    try {
      final data = await api.facilities();
      items = (data['facilities'] as List? ?? data['data'] as List? ?? [])
          .whereType<Map>()
          .map(Map<String, dynamic>.from)
          .toList();
    } on ApiException catch (e) {
      error = e.message;
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => RefreshIndicator(
    onRefresh: load,
    child: ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Text(
          'Care nearby',
          style: Theme.of(context).textTheme.headlineSmall
              ?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        const Text(
          'Verified facilities from the existing GraminArogya API.',
          style: TextStyle(color: Colors.black54),
        ),
        const SizedBox(height: 20),
        if (loading)
          const Center(child: CircularProgressIndicator())
        else if (error != null)
          Text(error!, style: const TextStyle(color: Colors.red))
        else if (items.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Text('No facilities are available right now.'),
            ),
          )
        else
          ...items.map(
            (facility) => Card(
              child: ListTile(
                leading: const Icon(
                  Icons.local_hospital_outlined,
                  color: Color(0xff087f5b),
                ),
                title: Text(
                  facility['name']?.toString() ?? 'Healthcare facility',
                ),
                subtitle: Text(
                  '${facility['type'] ?? 'Care centre'} • ${facility['village'] ?? facility['district'] ?? ''}',
                ),
                trailing: Text('${facility['distanceKm'] ?? '--'} km'),
              ),
            ),
          ),
      ],
    ),
  );
}
