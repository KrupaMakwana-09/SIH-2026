const Patient = require('../models/Patient');
const Disease = require('../models/Disease');
const DiseaseMedicine = require('../models/DiseaseMedicine');
const Inventory = require('../models/Inventory');
const Prescription = require('../models/Prescription');
const StockTransaction = require('../models/StockTransaction');
const {
  initialDiseases,
  initialDiseaseMedicines,
  initialMedicines,
  initialPatients,
  initialPrescriptions,
  initialStockTransactions
} = require('../seed/seedData');

const initializeDatabaseDefaults = async () => {
  try {
    // 1. Ensure all patients have sscCode and qrToken
    const patientsNeedingMigration = await Patient.find({
      $or: [
        { sscCode: { $exists: false } },
        { sscCode: '' },
        { qrToken: { $exists: false } },
        { qrToken: '' }
      ]
    });

    if (patientsNeedingMigration.length > 0) {
      console.log(`⏳ Migrating ${patientsNeedingMigration.length} patient records with secure SSC & QR tokens...`);
      for (const p of patientsNeedingMigration) {
        const cleanId = (p.id || '').replace(/\D/g, '').slice(-6) || Math.floor(100000 + Math.random() * 900000);
        if (!p.sscCode) {
          p.sscCode = `SSC-GJ-2026-${cleanId}`;
        }
        if (!p.qrToken) {
          p.qrToken = `SEC-QR-${cleanId}-${Math.floor(1000 + Math.random() * 9000)}`;
        }
        await p.save();
      }
      console.log(`✅ Completed SSC & QR migration for existing patients.`);
    }

    // 2. If Patient collection is empty, seed demo patients
    const patientCount = await Patient.countDocuments();
    if (patientCount === 0) {
      console.log('🌱 Seeding initial patients into database...');
      await Patient.insertMany(initialPatients);
    }

    // 3. Ensure Disease collection is populated
    const diseaseCount = await Disease.countDocuments();
    if (diseaseCount === 0 && initialDiseases?.length > 0) {
      console.log('🌱 Seeding clinical disease catalog...');
      await Disease.insertMany(initialDiseases);
    }

    // 4. Ensure DiseaseMedicine links are populated
    const relationCount = await DiseaseMedicine.countDocuments();
    if (relationCount === 0 && initialDiseaseMedicines?.length > 0) {
      console.log('🌱 Seeding clinical disease-medicine relationships...');
      await DiseaseMedicine.insertMany(initialDiseaseMedicines);
    }

    // 5. Ensure Inventory has rich medicine fields populated
    const inventoryCount = await Inventory.countDocuments();
    if (inventoryCount === 0 && initialMedicines?.length > 0) {
      console.log('🌱 Seeding initial medicine stock inventory...');
      await Inventory.insertMany(initialMedicines);
    } else {
      // Update any legacy medicines missing batchNumber or expiryDate
      await Inventory.updateMany(
        { batchNumber: { $exists: false } },
        { $set: { batchNumber: 'BATCH-2026-A1', expiryDate: new Date('2027-08-31'), dosageForm: 'Tablet' } }
      );
    }

    // 6. Ensure Prescriptions exist for demo
    const prescriptionCount = await Prescription.countDocuments();
    if (prescriptionCount === 0 && initialPrescriptions?.length > 0) {
      console.log('🌱 Seeding initial demonstration prescriptions...');
      await Prescription.insertMany(initialPrescriptions);
    }

    // 7. Ensure Stock Transactions exist for demo
    const txnCount = await StockTransaction.countDocuments();
    if (txnCount === 0 && initialStockTransactions?.length > 0) {
      console.log('🌱 Seeding initial stock transactions...');
      await StockTransaction.insertMany(initialStockTransactions);
    }

    console.log('✅ SwasthyaSetu clinical medicine & patient identification database initialized!');
  } catch (error) {
    console.warn('Database initialization note:', error.message);
  }
};

module.exports = { initializeDatabaseDefaults };
