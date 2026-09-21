import 'package:flutter/material.dart';

import '../core/api_service.dart';
import '../core/session.dart';
import '../models/patient_profile.dart';
import 'profile_screen.dart';
import 'qr_screen.dart';
import 'facilities_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.session, required this.api});
  final Session session;
  final ApiService api;
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  PatientProfile? profile;
  String? error;
  bool loading = true;
  int tab = 0;

  Future<void> load() async {
    setState(() {
      loading = true;
      error = null;
    });
    try {
      profile = PatientProfile.fromJson(await widget.api.patientProfile());
    } on ApiException catch (e) {
      error = e.message;
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    load();
  }

  @override
  Widget build(BuildContext context) {
    final screens = [
      dashboard(context),
      const ProfileScreen(),
      const FacilitiesScreen(),
    ];
    return Scaffold(
      appBar: AppBar(
        title: const Text('GraminArogya'),
        actions: [
          IconButton(
            onPressed: () => widget.session.signOut(),
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'Logout',
          ),
        ],
      ),
      body: loading
          ? const Center(child: CircularProgressIndicator())
          : error != null
          ? _error()
          : screens[tab],
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (value) => setState(() => tab = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.grid_view_rounded),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            label: 'Profile',
          ),
          NavigationDestination(
            icon: Icon(Icons.local_hospital_outlined),
            label: 'Care nearby',
          ),
        ],
      ),
    );
  }

  Widget _error() => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.cloud_off_rounded, size: 46),
          const SizedBox(height: 12),
          Text(error!, textAlign: TextAlign.center),
          const SizedBox(height: 16),
          OutlinedButton(onPressed: load, child: const Text('Try again')),
        ],
      ),
    ),
  );

  Widget dashboard(BuildContext context) {
    final patient = profile!;
    return RefreshIndicator(
      onRefresh: load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
        children: [
          Text(
            'Good to see you, ${patient.name.split(' ').first}',
            style: Theme.of(context).textTheme.headlineSmall
                ?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          const Text(
            'Your health companion for every step of care.',
            style: TextStyle(color: Colors.black54),
          ),
          const SizedBox(height: 22),
          Card(
            color: const Color(0xff087f5b),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 28,
                    backgroundColor: Colors.white24,
                    child: Icon(Icons.favorite, color: Colors.white),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Digital health card',
                          style: TextStyle(color: Colors.white70),
                        ),
                        Text(
                          patient.patientId,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          'Blood group ${patient.bloodGroup}',
                          style: const TextStyle(color: Colors.white70),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => QrScreen(profile: patient),
                      ),
                    ),
                    icon: const Icon(
                      Icons.qr_code_2_rounded,
                      color: Colors.white,
                    ),
                    tooltip: 'Open QR card',
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.55,
            children: <Widget>[
              _Action(
                icon: Icons.calendar_month_outlined,
                label: 'Appointments',
                subtitle: 'Coming soon',
                onTap: () => _notice(
                  'Appointment API is not registered in the existing backend yet.',
                ),
              ),
              _Action(
                icon: Icons.receipt_long_outlined,
                label: 'Prescriptions',
                subtitle: '${patient.prescriptions.length} records',
                onTap: () => _prescriptions(context, patient),
              ),
              _Action(
                icon: Icons.history_rounded,
                label: 'Medical history',
                subtitle: 'View records',
                onTap: () => _history(context, patient),
              ),
              _Action(
                icon: Icons.emergency_outlined,
                label: 'Emergency help',
                subtitle: 'Call 108',
                onTap: () => _notice(
                  'Use your device dialer to call 108 in an emergency.',
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'Current profile',
            style: Theme.of(context).textTheme.titleLarge
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          Card(
            child: ListTile(
              leading: const Icon(Icons.location_on_outlined),
              title: Text(patient.village),
              subtitle: const Text('Registered care location'),
              trailing: const Icon(Icons.chevron_right),
            ),
          ),
        ],
      ),
    );
  }

  void _notice(String message) =>
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(message)));
  void _prescriptions(BuildContext context, PatientProfile patient) =>
      showModalBottomSheet(
        context: context,
        showDragHandle: true,
        builder: (_) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              'Digital prescriptions',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            if (patient.prescriptions.isEmpty)
              const Text('No prescriptions available yet.'),
            ...patient.prescriptions.map(
              (rx) => ListTile(
                leading: const Icon(Icons.medication_outlined),
                title: Text(rx['diagnosis']?.toString() ?? 'Prescription'),
                subtitle: Text(rx['doctorName']?.toString() ?? 'Doctor record'),
              ),
            ),
          ],
        ),
      );
  Future<void> _history(BuildContext context, PatientProfile patient) async {
    try {
      final data = await widget.api.patientHistory(patient.patientId);
      if (!context.mounted) return;
      showModalBottomSheet(
        context: context,
        showDragHandle: true,
        builder: (_) => ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              'Medical history',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Text(
              data['patient']?['currentHealthStatus']?['summary']?.toString() ??
                  'No additional history available through the current API.',
            ),
          ],
        ),
      );
    } on ApiException catch (e) {
      _notice(e.message);
    }
  }
}

class _Action extends StatelessWidget {
  const _Action({
    required this.icon,
    required this.label,
    required this.subtitle,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final String subtitle;
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) => Card(
    child: InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Icon(icon, color: const Color(0xff087f5b)),
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
            Text(
              subtitle,
              style: const TextStyle(fontSize: 12, color: Colors.black54),
            ),
          ],
        ),
      ),
    ),
  );
}
