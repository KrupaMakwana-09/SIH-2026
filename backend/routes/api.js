const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const triageController = require('../controllers/triageController');
const facilityController = require('../controllers/facilityController');
const referralController = require('../controllers/referralController');
const analyticsController = require('../controllers/analyticsController');
const inventoryController = require('../controllers/inventoryController');
const outbreakController = require('../controllers/outbreakController');
const configController = require('../controllers/configController');
const doctorController = require('../controllers/doctorController');
const patientController = require('../controllers/patientController');
const bloodBankController = require('../controllers/bloodBankController');
const patientSearchController = require('../controllers/patientSearchController');
const diseaseController = require('../controllers/diseaseController');
const prescriptionController = require('../controllers/prescriptionController');
const stockController = require('../controllers/stockController');
const { authenticateJWT, authorizeRole } = require('../middleware/authMiddleware');

// 1. Authentication & User Management
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/verify-admin-otp', authController.verifyAdminOtp);
router.post('/auth/google', authController.googleAuth);
router.get('/auth/me', authController.getMe);
router.get('/auth/users', authController.getUsersList);
router.post('/admin/create-doctor', authController.createDoctor);
router.post('/doctor/create-staff', authController.createStaff);


// 2. AI Voice Triage & Patients
router.post('/triage/voice-parse', triageController.parseVoiceTriage);
router.post('/patients/register', triageController.registerPatient);
router.get('/patients', triageController.getPatients);
router.post('/sync-offline', triageController.syncOfflineQueue);

// 2.1 Unified Patient Identification & Search (Mobile, SSC, Client ID, QR)
router.post('/patients/search/mobile', authenticateJWT, patientSearchController.searchByMobile);
router.post('/patients/search/ssc', authenticateJWT, patientSearchController.searchBySsc);
router.post('/patients/search/client', authenticateJWT, patientSearchController.searchByClient);
router.post('/patients/lookup/qr', authenticateJWT, patientSearchController.lookupByQr);
router.get('/patients/:id/profile', authenticateJWT, patientSearchController.getUnifiedPatientProfile);

// 3. Healthcare Facilities & Smart Routing
router.get('/facilities', facilityController.getFacilities);
router.post('/facilities', facilityController.createFacility);
router.patch('/facilities/:id', facilityController.updateFacility);
router.delete('/facilities/:id', facilityController.deleteFacility);
router.post('/facilities/smart-routing', facilityController.getSmartRouting);

// 4. Medicine & Supply Inventory (Enhanced with Stock Management & Pharmacist Role)
router.get('/inventory', stockController.getInventory);
router.post('/inventory', inventoryController.createMedicine);
router.patch('/inventory/:id/stock', inventoryController.updateStock);
router.delete('/inventory/:id', inventoryController.deleteMedicine);

// 4.1 Medicines, Stock & Transactions
router.get('/medicines', stockController.getInventory);
router.get('/stock', stockController.getInventory);
router.get('/stock/dashboard', stockController.getStockDashboardMetrics);
router.post('/stock/in', authenticateJWT, stockController.stockIn);
router.post('/stock/adjustment', authenticateJWT, stockController.stockAdjustment);
router.get('/stock/history', authenticateJWT, stockController.getStockTransactions);
router.get('/stock/usage', authenticateJWT, stockController.getMedicineUsage);

// 4.2 Prescriptions & Medicine Dispensing Flow
router.post('/prescriptions', authenticateJWT, authorizeRole('doctor', 'admin'), prescriptionController.createPrescription);
router.get('/prescriptions', authenticateJWT, prescriptionController.getPrescriptions);
router.get('/prescriptions/:id', authenticateJWT, prescriptionController.getPrescriptionById);
router.get('/patients/:id/prescriptions', authenticateJWT, prescriptionController.getPatientPrescriptions);
router.post('/prescriptions/:id/dispense', authenticateJWT, authorizeRole('pharmacist', 'admin'), stockController.dispensePrescription);

// 4.3 Disease & Related Medicines Recommendation
router.get('/diseases', diseaseController.getDiseases);
router.post('/diseases', authenticateJWT, authorizeRole('doctor', 'admin'), diseaseController.createDisease);
router.get('/diseases/:id/medicines', diseaseController.getDiseaseMedicines);
router.post('/diseases/:id/medicines', authenticateJWT, authorizeRole('doctor', 'admin'), diseaseController.linkDiseaseMedicine);

// 5. Disease Outbreak Surveillance
router.get('/outbreaks', outbreakController.getOutbreaks);
router.post('/outbreaks', outbreakController.createOutbreak);
router.patch('/outbreaks/:id', outbreakController.updateOutbreakStatus);
router.delete('/outbreaks/:id', outbreakController.deleteOutbreak);

// 6. Digital Referrals & QR Continuity
router.post('/referrals', referralController.createReferral);
router.get('/referrals', referralController.getReferrals);
router.get('/referrals/:code', referralController.getReferralByCode);
router.patch('/referrals/:id/status', referralController.updateReferralStatus);

// 7. Government / CMO Intelligence Analytics & Audit Logs
router.get('/analytics/dashboard', analyticsController.getDashboardAnalytics);
router.get('/analytics/stock', authenticateJWT, analyticsController.getDistrictStockAnalytics);
router.get('/analytics/audit-logs', authenticateJWT, authorizeRole('admin', 'cmo'), analyticsController.getAuditLogs);

// 8. Database Status & Maintenance
router.get('/db/status', configController.getStatus);
router.post('/db/connect', configController.updateMongoUri);
router.post('/db/seed', configController.seedAtlasDatabase);
router.post('/db/clean-dummy', configController.cleanDummyAndSyncRealPatients);

// 9. Doctor Panel, Authentication & Profile Management
router.get('/doctor/profile', doctorController.getDoctorProfile);
router.post('/doctor/profile', doctorController.updateDoctorProfile);
router.get('/doctor/lookup-phone/:phone', doctorController.lookupDoctorByPhone);
router.get('/doctor/patient-phone/:phone', doctorController.lookupPatientDataByPhone);
router.post('/doctor/send-otp', doctorController.sendEmailOtp);
router.post('/doctor/verify-otp', doctorController.verifyEmailOtp);
router.post('/doctor/google-login', doctorController.googleLogin);

// 10. Patient Medical History, Profile & Follow-Up Reminders
router.get('/doctor/patient-history/:id', doctorController.getPatientHistory);
router.post('/doctor/patient-history/:id', doctorController.addPatientMedicalHistory);
router.post('/doctor/patient-profile/:id', doctorController.updatePatientProfile);
router.post('/doctor/reminder', doctorController.addFollowUpReminder);
router.get('/doctor/reminders', doctorController.getDoctorReminders);
router.patch('/doctor/reminder/:id', doctorController.updateReminderStatus);
router.post('/doctor/reminder/send-otp', doctorController.sendFollowUpOtp);
router.post('/doctor/reminder/verify-otp', doctorController.verifyFollowUpOtp);

// 11. Doctor Leave Management & OPD Schedule
router.post('/doctor/leave', doctorController.submitDoctorLeave);
router.get('/doctor/schedule-leaves', doctorController.getDoctorScheduleAndLeaves);
router.post('/doctor/schedule', doctorController.updateDoctorSchedule);

// 12. Patient / Citizen Self-Profile Management
router.get('/patient/profile', patientController.getMyProfile);
router.post('/patient/profile', patientController.updateMyProfile);
router.post('/patient/send-otp', patientController.sendProfileOtp);
router.post('/patient/verify-otp', patientController.verifyProfileOtp);

// 13. Emergency Blood Bank & Donation NGO Finder
router.get('/blood-banks', bloodBankController.getBloodBanks);
router.post('/blood-request', bloodBankController.createBloodRequest);

module.exports = router;
