/**
 * Government Health Administration & admin Intelligence Controller
 * Aggregates live data directly from MongoDB Atlas.
 */

const Facility = require('../models/Facility');
const Inventory = require('../models/Inventory');
const Referral = require('../models/Referral');
const DiseaseOutbreak = require('../models/DiseaseOutbreak');
const Patient = require('../models/Patient');

exports.getDashboardAnalytics = async (req, res) => {
  try {
    const [facilities, medicines, referrals, outbreaks, patients] = await Promise.all([
      Facility.find(),
      Inventory.find(),
      Referral.find().sort({ createdAt: -1 }),
      DiseaseOutbreak.find().sort({ detectedDate: -1 }),
      Patient.find().sort({ createdAt: -1 })
    ]);

    // 1. Bed & Capacity Overview
    const totalBeds = facilities.reduce((sum, f) => sum + (f.beds?.total || 0), 0);
    const occupiedBeds = facilities.reduce((sum, f) => sum + (f.beds?.occupied || 0), 0);
    const availableBeds = totalBeds - occupiedBeds;
    const bedOccupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const totalOxygen = facilities.reduce((sum, f) => sum + (f.oxygenCylinders || 0), 0);

    // 2. Medicine Inventory Alerts
    const criticalMedicines = medicines.filter(m => m.status === 'Critical Low' || m.status === 'Out of Stock');
    const lowStockMedicines = medicines.filter(m => m.status === 'Low Stock');

    // 3. Referral Analysis by Village
    const villageReferralCounts = {};
    referrals.forEach(r => {
      const v = r.village || 'Unknown Village';
      villageReferralCounts[v] = (villageReferralCounts[v] || 0) + 1;
    });

    const villageReferralData = Object.keys(villageReferralCounts).map(v => ({
      village: v,
      referralCount: villageReferralCounts[v],
      trend: villageReferralCounts[v] > 1 ? 'Elevated' : 'Normal'
    }));

    // 4. Referral Status Breakdown
    const statusCounts = {
      Initiated: 0,
      'In-Transit': 0,
      Received: 0,
      Doctor_Attended: 0,
      Admitted: 0,
      Discharged: 0
    };
    referrals.forEach(r => {
      if (statusCounts[r.status] !== undefined) {
        statusCounts[r.status] += 1;
      }
    });

    // 5. Emergency alerts
    const emergencyReferrals = referrals.filter(r => r.priority === 'EMERGENCY_RED');

    return res.json({
      success: true,
      data: {
        summary: {
          totalFacilities: facilities.length,
          totalPatients: patients.length,
          totalBeds,
          occupiedBeds,
          availableBeds,
          bedOccupancyRate,
          totalOxygen,
          activeReferrals: referrals.length,
          emergencyAlertsCount: emergencyReferrals.length,
          criticalStockoutsCount: criticalMedicines.length
        },
        facilitiesCapacity: facilities.map(f => ({
          id: f.id,
          name: f.name,
          type: f.type,
          village: f.village,
          beds: f.beds,
          doctorsAvailable: (f.doctors || []).filter(d => d.available).length,
          totalDoctors: (f.doctors || []).length,
          oxygenCylinders: f.oxygenCylinders,
          waitTimeMins: f.currentWaitTimeMins
        })),
        diseaseOutbreaks: outbreaks,
        inventoryAlerts: {
          critical: criticalMedicines,
          low: lowStockMedicines,
          all: medicines
        },
        villageReferrals: villageReferralData,
        referralStatusBreakdown: statusCounts,
        recentReferrals: referrals.slice(0, 8),
        recentPatients: patients.slice(0, 8)
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// District Admin Medicine & Stock Intelligence (Aggregated Data)
exports.getDistrictStockAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAhead = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [medicines, transactions, dispensingRecords, prescriptions] = await Promise.all([
      Inventory.find(),
      require('../models/StockTransaction').find().sort({ timestamp: -1 }),
      require('../models/MedicineDispensing').find().sort({ dispensedAt: -1 }),
      require('../models/Prescription').find().sort({ prescribedAt: -1 })
    ]);

    // 1. Stock Status Counts
    let totalStockQty = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiredCount = 0;
    let expiringSoonCount = 0;

    medicines.forEach(m => {
      totalStockQty += (m.stockQty || 0);
      const isExpired = m.expiryDate && new Date(m.expiryDate) <= now;
      const isExpSoon = m.expiryDate && new Date(m.expiryDate) > now && new Date(m.expiryDate) <= thirtyDaysAhead;

      if (isExpired) expiredCount++;
      else if (m.stockQty <= 0) outOfStockCount++;
      else if (m.stockQty <= m.minThreshold) lowStockCount++;

      if (isExpSoon) expiringSoonCount++;
    });

    // 2. Most Used / Consumed Medicines (Aggregated from Dispensing Logs)
    const medicineConsumptionMap = {};
    dispensingRecords.forEach(rec => {
      (rec.items || []).forEach(item => {
        const key = item.medicineName || item.medicineId;
        if (!medicineConsumptionMap[key]) {
          medicineConsumptionMap[key] = {
            medicineName: key,
            genericName: item.genericName || '',
            totalUnitsDispensed: 0,
            dispenseEvents: 0
          };
        }
        medicineConsumptionMap[key].totalUnitsDispensed += (item.quantity || 0);
        medicineConsumptionMap[key].dispenseEvents += 1;
      });
    });

    const topConsumedMedicines = Object.values(medicineConsumptionMap)
      .sort((a, b) => b.totalUnitsDispensed - a.totalUnitsDispensed)
      .slice(0, 10);

    // 3. Disease-wise Medicine Usage (Aggregated from Prescriptions)
    const diseaseMap = {};
    prescriptions.forEach(p => {
      const disease = p.diagnosis || 'General Clinical';
      if (!diseaseMap[disease]) {
        diseaseMap[disease] = {
          diseaseName: disease,
          prescriptionCount: 0,
          prescribedMedicines: {},
          totalMedicinesPrescribed: 0
        };
      }
      diseaseMap[disease].prescriptionCount += 1;

      (p.medicines || []).forEach(m => {
        const mName = m.medicineName;
        diseaseMap[disease].prescribedMedicines[mName] = (diseaseMap[disease].prescribedMedicines[mName] || 0) + (m.prescribedQty || 1);
        diseaseMap[disease].totalMedicinesPrescribed += (m.prescribedQty || 1);
      });
    });

    const diseaseMedicineUsage = Object.values(diseaseMap).map(d => ({
      diseaseName: d.diseaseName,
      prescriptionCount: d.prescriptionCount,
      totalMedicinesPrescribed: d.totalMedicinesPrescribed,
      topMedicines: Object.entries(d.prescribedMedicines)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5)
    })).sort((a, b) => b.prescriptionCount - a.prescriptionCount);

    // 4. Stock Movement Summary
    let totalStockInUnits = 0;
    let totalStockOutUnits = 0;
    let totalAdjustmentEvents = 0;

    transactions.forEach(t => {
      if (t.type === 'IN') totalStockInUnits += t.quantity;
      if (t.type === 'OUT') totalStockOutUnits += t.quantity;
      if (t.type === 'ADJUSTMENT') totalAdjustmentEvents += 1;
    });

    // 5. Expiring Soon List
    const expiringSoonList = medicines
      .filter(m => m.expiryDate && new Date(m.expiryDate) > now && new Date(m.expiryDate) <= thirtyDaysAhead)
      .map(m => ({
        id: m.id,
        name: m.name,
        batchNumber: m.batchNumber,
        stockQty: m.stockQty,
        expiryDate: m.expiryDate,
        facilityName: m.facilityName
      }));

    return res.json({
      success: true,
      analytics: {
        summary: {
          totalMedicines: medicines.length,
          totalStockQty,
          lowStockCount,
          outOfStockCount,
          expiredCount,
          expiringSoonCount,
          totalStockInUnits,
          totalStockOutUnits,
          totalAdjustmentEvents,
          totalDispensingEvents: dispensingRecords.length,
          totalPrescriptionsIssued: prescriptions.length
        },
        topConsumedMedicines,
        diseaseMedicineUsage,
        expiringSoonList,
        recentTransactions: transactions.slice(0, 10),
        criticalStockMedicines: medicines.filter(m => m.stockQty <= m.minThreshold)
      }
    });
  } catch (error) {
    console.error('getDistrictStockAnalytics error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Audit Logs for District Admin
exports.getAuditLogs = async (req, res) => {
  try {
    const { action, userRole, limit = 100 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (userRole) filter.userRole = userRole;

    const AuditLog = require('../models/AuditLog');
    const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(Number(limit));

    return res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
