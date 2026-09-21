class PatientProfile {
  PatientProfile({
    required this.user,
    required this.patient,
    required this.prescriptions,
  });

  final Map<String, dynamic> user;
  final Map<String, dynamic> patient;
  final List<Map<String, dynamic>> prescriptions;

  factory PatientProfile.fromJson(Map<String, dynamic> json) => PatientProfile(
    user: Map<String, dynamic>.from(json['user'] as Map? ?? {}),
    patient: Map<String, dynamic>.from(json['patient'] as Map? ?? {}),
    prescriptions: (json['prescriptions'] as List? ?? [])
        .whereType<Map>()
        .map(Map<String, dynamic>.from)
        .toList(),
  );

  String get name =>
      user['name']?.toString() ?? patient['name']?.toString() ?? 'Patient';
  String get patientId => patient['id']?.toString() ?? 'Not assigned';
  String get qrToken => patient['qrToken']?.toString() ?? patientId;
  String get bloodGroup => user['bloodGroup']?.toString().isNotEmpty == true
      ? user['bloodGroup'].toString()
      : patient['bloodGroup']?.toString() ?? 'Not set';
  String get village => user['village']?.toString().isNotEmpty == true
      ? user['village'].toString()
      : patient['village']?.toString() ?? 'Not set';
}
