import 'package:flutter/material.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});
  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(20),
    children: [
      Text(
        'Profile & settings',
        style: Theme.of(context).textTheme.headlineSmall
            ?.copyWith(fontWeight: FontWeight.w800),
      ),
      const SizedBox(height: 8),
      const Text(
        'Manage your personal care preferences.',
        style: TextStyle(color: Colors.black54),
      ),
      const SizedBox(height: 24),
      const Card(
        child: Column(
          children: [
            ListTile(
              leading: Icon(Icons.edit_outlined),
              title: Text('Personal details'),
              subtitle: Text('Update through the secure profile service'),
              trailing: Icon(Icons.chevron_right),
            ),
            Divider(height: 1),
            ListTile(
              leading: Icon(Icons.notifications_none),
              title: Text('Notifications'),
              subtitle: Text('Push notifications require a backend channel'),
              trailing: Icon(Icons.chevron_right),
            ),
            Divider(height: 1),
            ListTile(
              leading: Icon(Icons.help_outline),
              title: Text('Help & support'),
              subtitle: Text('Contact your local health facility'),
              trailing: Icon(Icons.chevron_right),
            ),
          ],
        ),
      ),
    ],
  );
}
