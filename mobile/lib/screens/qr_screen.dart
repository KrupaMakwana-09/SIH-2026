import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../models/patient_profile.dart';

class QrScreen extends StatelessWidget {
  const QrScreen({super.key, required this.profile});
  final PatientProfile profile;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Digital health card')),
    body: ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Icon(
                  Icons.shield_outlined,
                  color: Color(0xff087f5b),
                  size: 34,
                ),
                const SizedBox(height: 8),
                Text(
                  profile.name,
                  style: Theme.of(context).textTheme.titleLarge
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
                Text(
                  profile.patientId,
                  style: const TextStyle(color: Colors.black54),
                ),
                const SizedBox(height: 18),
                QrImageView(data: profile.qrToken, size: 220),
                const SizedBox(height: 12),
                const Text(
                  'This QR contains a secure reference only. Authorized staff must retrieve records from the server.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.black54),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const QrScannerScreen()),
          ),
          icon: const Icon(Icons.qr_code_scanner),
          label: const Text('Scan a patient QR'),
        ),
      ],
    ),
  );
}

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});
  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen> {
  String? value;
  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Scan secure QR')),
    body: Stack(
      children: [
        MobileScanner(
          onDetect: (capture) {
            final raw = capture.barcodes.firstOrNull?.rawValue;
            if (raw != null && value == null) setState(() => value = raw);
          },
        ),
        if (value != null)
          Align(
            alignment: Alignment.bottomCenter,
            child: Container(
              color: Colors.white,
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Reference captured',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 6),
                  Text(value!, maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 12),
                  FilledButton(
                    onPressed: () => Navigator.pop(context, value),
                    child: const Text('Done'),
                  ),
                ],
              ),
            ),
          ),
      ],
    ),
  );
}
