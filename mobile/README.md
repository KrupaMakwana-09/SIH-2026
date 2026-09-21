# GraminArogya Android App

This is a native Flutter Android client. It does not embed the React website and it never connects directly to MongoDB. The app calls the existing Node.js/Express API with a bearer JWT and stores that token with `flutter_secure_storage`.

## Run locally

From the repository root:

```powershell
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:5001/api
```

`10.0.2.2` is the Android emulator's route to the host machine. For a physical device, use the host computer's LAN address, for example:

```powershell
flutter run --dart-define=API_BASE_URL=http://192.168.1.25:5001/api
```

For production, pass the HTTPS API root:

```powershell
flutter run --dart-define=API_BASE_URL=https://your-api-host.example/api
```

The backend must be running on port `5001` locally and must allow the device to reach it. Keep MongoDB credentials and JWT secrets in the backend environment only.

## Build APK

```powershell
cd mobile
flutter build apk --release --dart-define=API_BASE_URL=https://your-api-host.example/api
```

The generated APK is under `build/app/outputs/flutter-apk/`.

On the current Windows machine, Android SDK setup must be repaired first because the local NDK package `28.2.13676358` is missing. Open Android Studio SDK Manager and install Android SDK Platform 35, Android SDK Build-Tools, and NDK `28.2.13676358`, then rerun the build. Flutter analysis and widget tests already pass.

## Implemented client workflows

- Splash, patient login, patient registration, secure JWT session restore, and logout
- Patient dashboard with profile summary and loading/error/empty states
- Patient profile shell and nearby facilities from `GET /api/facilities`
- Digital health card and QR generation using only the server-issued `qrToken` reference
- QR scanner using `mobile_scanner`; scanned values are intended for authorized lookup via `POST /api/patients/lookup/qr`
- Digital prescriptions from `GET /api/patient/profile`
- Authorized patient profile/history retrieval

## Existing API mapping

| App capability | Existing API |
| --- | --- |
| Login | `POST /api/auth/login` with `role: patient` |
| Registration | `POST /api/auth/register` with `role: patient` |
| Session validation | `GET /api/auth/me` |
| Patient profile, QR token, prescriptions | `GET /api/patient/profile` |
| Patient profile update | `POST /api/patient/profile` |
| Secure QR lookup | `POST /api/patients/lookup/qr` |
| Unified authorized patient record | `GET /api/patients/:id/profile` |
| Facilities | `GET /api/facilities` |
| Blood bank directory | `GET /api/blood-banks` |
| Prescription list/detail | `GET /api/prescriptions`, `GET /api/prescriptions/:id`, `GET /api/patients/:id/prescriptions` |
| Doctor profiles | `GET /api/doctor/profile` |
| Referrals | `GET /api/referrals`, `GET /api/referrals/:code` |

## Backend gaps found during inspection

The existing `Appointment` and `MedicalRecord` Mongoose models are present, but `backend/routes/api.js` does not register appointment or medical-record routes. Password reset, patient lab-report upload, document upload, patient family members, patient feedback, patient medicine reminders, and push notifications also have no registered patient APIs. The mobile UI marks these as unavailable rather than inventing an incompatible database contract.

No database, collection, existing model, or existing API was deleted or reset for this app.# gramin_arogya

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
