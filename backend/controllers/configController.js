const { connectDB, getDBStatus } = require('../config/db');
const Facility = require('../models/Facility');
const Inventory = require('../models/Inventory');
const Patient = require('../models/Patient');
const Referral = require('../models/Referral');
const DiseaseOutbreak = require('../models/DiseaseOutbreak');

const {
  initialFacilities,
  initialMedicines,
  initialPatients,
  initialReferrals,
  initialOutbreaks
} = require('../seed/seedData');

exports.getStatus = (req, res) => {
  const status = getDBStatus();
  return res.json({ success: true, ...status });
};

exports.updateMongoUri = async (req, res) => {
  try {
    const { uri } = req.body;
    if (!uri) {
      return res.status(400).json({ success: false, message: 'MongoDB connection URI is required.' });
    }

    const result = await connectDB(uri);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error || 'Failed to connect to MongoDB Atlas.' });
    }

    return res.json({
      success: true,
      message: 'Successfully connected to MongoDB Atlas!',
      status: getDBStatus()
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.seedAtlasDatabase = async (req, res) => {
  try {
    const status = getDBStatus();
    if (!status.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Database is not connected to MongoDB Atlas. Please configure Atlas URI first or use default in-memory demo data.'
      });
    }

    const Disease = require('../models/Disease');
    const DiseaseMedicine = require('../models/DiseaseMedicine');
    const Prescription = require('../models/Prescription');
    const StockTransaction = require('../models/StockTransaction');

    const {
      initialDiseases,
      initialDiseaseMedicines,
      initialPrescriptions,
      initialStockTransactions
    } = require('../seed/seedData');

    // Clear and seed
    await Facility.deleteMany({});
    await Inventory.deleteMany({});
    await Patient.deleteMany({});
    await Referral.deleteMany({});
    await DiseaseOutbreak.deleteMany({});
    await Disease.deleteMany({});
    await DiseaseMedicine.deleteMany({});
    await Prescription.deleteMany({});
    await StockTransaction.deleteMany({});

    await Facility.insertMany(initialFacilities);
    await Inventory.insertMany(initialMedicines);
    await Patient.insertMany(initialPatients);
    await Referral.insertMany(initialReferrals);
    await DiseaseOutbreak.insertMany(initialOutbreaks);
    if (initialDiseases) await Disease.insertMany(initialDiseases);
    if (initialDiseaseMedicines) await DiseaseMedicine.insertMany(initialDiseaseMedicines);
    if (initialPrescriptions) await Prescription.insertMany(initialPrescriptions);
    if (initialStockTransactions) await StockTransaction.insertMany(initialStockTransactions);

    return res.json({
      success: true,
      message: 'MongoDB Atlas successfully populated with realistic Rural Healthcare demonstration records!',
      counts: {
        facilities: initialFacilities.length,
        medicines: initialMedicines.length,
        diseases: initialDiseases?.length || 0,
        prescriptions: initialPrescriptions?.length || 0,
        patients: initialPatients.length,
        referrals: initialReferrals.length,
        outbreaks: initialOutbreaks.length
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.cleanDummyAndSyncRealPatients = async (req, res) => {
  try {
    const User = require('../models/User');
    const DoctorProfile = require('../models/DoctorProfile');

    // 1. Delete all dummy/seed patients
    const dummyNames = ['Aarav Sharma (Child)', 'Aarav Sharma', 'Ram Singh', 'Savitri Devi', 'Kavita Bai', 'Ramesh Kumar'];
    const dummyIds = ['PAT-IND-7391', 'PAT-IND-4102', 'PAT-IND-8921', 'PAT-IND-1044', 'PAT-IND-9021'];

    const delPatients = await Patient.deleteMany({
      $or: [
        { id: { $in: dummyIds } },
        { name: { $in: dummyNames } }
      ]
    });

    // 2. Delete referrals belonging to dummy patients
    const delReferrals = await Referral.deleteMany({
      $or: [
        { patientId: { $in: dummyIds } },
        { patientName: { $in: dummyNames } }
      ]
    });

    // 3. Clear dummy reminders from DoctorProfile
    await DoctorProfile.updateMany({}, { $set: { reminders: [] } });

    // 4. Find all registered users and sync them as real Patients
    const users = await User.find({});
    const syncedPatients = [];

    for (const u of users) {
      const ispatientOrHasPhone = u.role === 'patient' || (u.phone && u.phone.trim().length >= 4);
      if (!ispatientOrHasPhone) continue;

      let patient = await Patient.findOne({
        $or: [
          { phone: u.phone },
          { name: u.name }
        ]
      });

      const cleanPhone = (u.phone || '').trim();
      const lastDigits = cleanPhone.replace(/\D/g, '').slice(-4) || '0000';
      const patId = `PAT-${cleanPhone ? cleanPhone.replace(/\D/g, '').slice(-6) : u._id.toString().slice(-6).toUpperCase()}`;

      if (!patient) {
        patient = new Patient({
          id: patId,
          name: u.name,
          age: 26,
          gender: 'Male',
          village: u.village || 'MAHENDRA NAGAR - 363642',
          phone: cleanPhone,
          abhaId: `ABHA-91-${lastDigits}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
          guardianName: 'Self',
          chiefComplaint: 'General Health Consultation & Care Record',
          symptomTags: ['Health Checkup'],
          vitals: { bp: '120/80', spo2: 98, temp: 98.4, pulse: 72, sugar: 'Normal' },
          currentHealthStatus: { condition: 'Healthy', summary: 'Active Registered patient', lastEvaluatedAt: new Date() },
          riskLevel: 'LOW',
          triageCategory: 'GREEN_ROUTINE',
          bloodGroup: 'B+',
          medicalHistory: [],
          accessLogs: [],
          followUpReminders: [],
          registrationDate: u.createdAt || new Date()
        });
        await patient.save();
      } else {
        patient.name = u.name;
        patient.phone = cleanPhone;
        patient.village = u.village || patient.village;
        await patient.save();
      }
      syncedPatients.push({ id: patient.id, name: patient.name, phone: patient.phone, village: patient.village });
    }

    const allCurrentPatients = await Patient.find({}).select('id name phone village abhaId medicalHistory');

    return res.json({
      success: true,
      message: 'All dummy patient data removed completely! Only real database patients are active.',
      deletedDummyPatients: delPatients.deletedCount,
      deletedDummyReferrals: delReferrals.deletedCount,
      syncedPatients,
      activeRealPatients: allCurrentPatients
    });
  } catch (error) {
    console.error('cleanDummyAndSyncRealPatients error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
