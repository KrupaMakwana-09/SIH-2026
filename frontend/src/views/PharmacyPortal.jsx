import React, { useState, useEffect } from 'react';
import {
  Pill,
  QrCode,
  PackageCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  History,
  FileText,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Calendar,
  AlertCircle,
  Database,
  Building,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import PatientLookup from '../components/PatientLookup';
import { useI18n } from '../utils/i18n';

export default function PharmacyPortal({ currentUser, activeSubTab = 'dispense' }) {
  const { t } = useI18n();

  // Tabs: 'dispense' | 'inventory' | 'transactions' | 'usage' | 'stockIn'
  const [currentTab, setCurrentTab] = useState(activeSubTab || 'dispense');

  // Dashboard metrics
  const [metrics, setMetrics] = useState({
    totalMedicines: 0,
    totalStockQty: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    expiringSoonCount: 0,
    expiredCount: 0,
    todayDispensingCount: 0,
    todayStockInUnits: 0,
    todayStockOutUnits: 0
  });
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Active Dispensing State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activePrescriptions, setActivePrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [dispenseQuantities, setDispenseQuantities] = useState({});
  const [dispensingLoading, setDispensingLoading] = useState(false);
  const [dispenseMsg, setDispenseMsg] = useState('');
  const [dispenseError, setDispenseError] = useState('');

  // Inventory Table State
  const [inventoryList, setInventoryList] = useState([]);
  const [inventoryFilter, setInventoryFilter] = useState('ALL');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Stock Transactions State
  const [transactions, setTransactions] = useState([]);
  const [txnFilter, setTxnFilter] = useState('ALL');
  const [txnLoading, setTxnLoading] = useState(false);

  // Usage History State
  const [usageList, setUsageList] = useState([]);
  const [usageLoading, setUsageLoading] = useState(false);

  // Stock IN Form State
  const [inMedName, setInMedName] = useState('');
  const [inGenericName, setInGenericName] = useState('');
  const [inCategory, setInCategory] = useState('Antibiotic');
  const [inDosageForm, setInDosageForm] = useState('Tablet');
  const [inStrength, setInStrength] = useState('500mg');
  const [inBatchNumber, setInBatchNumber] = useState('');
  const [inQty, setInQty] = useState(100);
  const [inThreshold, setInThreshold] = useState(40);
  const [inExpiryDate, setInExpiryDate] = useState('');
  const [inSupplier, setInSupplier] = useState('Central Medical Stores Depot (CMSD)');
  const [stockInLoading, setStockInLoading] = useState(false);
  const [stockInSuccess, setStockInSuccess] = useState('');
  const [stockInError, setStockInError] = useState('');

  // Load metrics & inventory
  const loadDashboardData = async () => {
    setLoadingMetrics(true);
    try {
      const [mRes, invRes] = await Promise.all([
        api.getStockDashboardMetrics(),
        api.getStock()
      ]);
      if (mRes.success && mRes.metrics) setMetrics(mRes.metrics);
      if (invRes.success && invRes.data) setInventoryList(invRes.data);
    } catch (e) {
      console.warn('Dashboard data load note:', e);
    } finally {
      setLoadingMetrics(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // When patient is verified via PatientLookup
  const handlePatientVerified = async (patient, preloadedRx = []) => {
    setSelectedPatient(patient);
    setDispenseMsg('');
    setDispenseError('');
    setSelectedPrescription(null);
    setDispenseQuantities({});

    if (preloadedRx && preloadedRx.length > 0) {
      setActivePrescriptions(preloadedRx);
      handleSelectPrescription(preloadedRx[0]);
    } else {
      // Fetch active prescriptions for this patient
      try {
        const res = await api.getPrescriptions({
          patientId: patient.id,
          status: 'Prescribed'
        });
        const partialRes = await api.getPrescriptions({
          patientId: patient.id,
          status: 'Partially Dispensed'
        });
        const combined = [
          ...(res.data || []),
          ...(partialRes.data || [])
        ];
        setActivePrescriptions(combined);
        if (combined.length > 0) {
          handleSelectPrescription(combined[0]);
        }
      } catch (e) {
        console.warn('Could not fetch prescriptions for patient:', e);
      }
    }
  };

  // Select a specific prescription to dispense
  const handleSelectPrescription = async (rx) => {
    try {
      const res = await api.getPrescriptionById(rx.prescriptionId || rx._id);
      if (res.success && res.prescription) {
        setSelectedPrescription(res.prescription);
        // Default dispense quantities to remaining prescribed quantities
        const defaults = {};
        res.prescription.medicines.forEach(m => {
          const remaining = Math.max(0, (m.prescribedQty || 0) - (m.dispensedQty || 0));
          const available = m.availableStock || 0;
          defaults[m.medicineId] = Math.min(remaining, available > 0 ? remaining : 0);
        });
        setDispenseQuantities(defaults);
      }
    } catch (e) {
      setSelectedPrescription(rx);
    }
  };

  // Execute dispensing
  const handleExecuteDispense = async () => {
    if (!selectedPrescription) return;
    setDispenseError('');
    setDispenseMsg('');

    const itemsToDispense = [];
    for (const m of selectedPrescription.medicines) {
      const qty = Number(dispenseQuantities[m.medicineId]) || 0;
      if (qty > 0) {
        itemsToDispense.push({
          medicineId: m.medicineId,
          medicineName: m.medicineName,
          quantity: qty
        });
      }
    }

    if (itemsToDispense.length === 0) {
      setDispenseError('Please enter at least one quantity greater than 0 to dispense.');
      return;
    }

    setDispensingLoading(true);
    try {
      const res = await api.dispensePrescription(selectedPrescription.prescriptionId, {
        items: itemsToDispense,
        notes: `Dispensed at ${new Date().toLocaleTimeString('en-IN')}`
      });

      if (res.success) {
        setDispenseMsg(res.message);
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        // Refresh prescription data
        handleSelectPrescription(res.prescription);
        // Refresh inventory and metrics
        loadDashboardData();
      } else {
        setDispenseError(res.message || 'Dispensing failed. Please check stock.');
      }
    } catch (e) {
      setDispenseError('Error during dispensing operation.');
    } finally {
      setDispensingLoading(false);
    }
  };

  // Load Transactions
  const loadTransactions = async () => {
    setTxnLoading(true);
    try {
      const filter = txnFilter !== 'ALL' ? { type: txnFilter } : {};
      const res = await api.getStockTransactions(filter);
      if (res.success && res.data) setTransactions(res.data);
    } catch (e) {
      console.warn('Txn error:', e);
    } finally {
      setTxnLoading(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'transactions') loadTransactions();
    if (currentTab === 'usage') loadUsage();
    if (currentTab === 'inventory') loadDashboardData();
  }, [currentTab, txnFilter]);

  // Load Usage History
  const loadUsage = async () => {
    setUsageLoading(true);
    try {
      const res = await api.getMedicineUsage();
      if (res.success && res.data) setUsageList(res.data);
    } catch (e) {
      console.warn('Usage error:', e);
    } finally {
      setUsageLoading(false);
    }
  };

  // Handle Stock IN submission
  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    setStockInError('');
    setStockInSuccess('');
    setStockInLoading(true);

    try {
      const payload = {
        name: inMedName.trim(),
        genericName: inGenericName.trim(),
        category: inCategory,
        dosageForm: inDosageForm,
        strength: inStrength.trim(),
        batchNumber: inBatchNumber.trim(),
        quantity: Number(inQty),
        minThreshold: Number(inThreshold),
        expiryDate: inExpiryDate ? new Date(inExpiryDate) : null,
        supplier: inSupplier.trim()
      };

      const res = await api.stockIn(payload);
      if (res.success) {
        setStockInSuccess(`Stock IN successful! Received +${inQty} units of ${inMedName}.`);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        setInMedName('');
        setInBatchNumber('');
        loadDashboardData();
      } else {
        setStockInError(res.message || 'Failed to record Stock IN.');
      }
    } catch (e) {
      setStockInError('Network error during Stock IN.');
    } finally {
      setStockInLoading(false);
    }
  };

  // Filtered inventory list
  const filteredInventory = inventoryList.filter(item => {
    const matchesFilter =
      inventoryFilter === 'ALL' ||
      item.status === inventoryFilter ||
      (inventoryFilter === 'In Stock' && (item.status === 'In Stock' || item.status === 'Adequate'));

    const query = inventorySearch.toLowerCase();
    const matchesSearch =
      !query ||
      item.name.toLowerCase().includes(query) ||
      (item.genericName && item.genericName.toLowerCase().includes(query)) ||
      (item.batchNumber && item.batchNumber.toLowerCase().includes(query));

    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px', fontFamily: "'Inter', sans-serif" }}>
      {/* Portal Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #0ea5e9 100%)',
        borderRadius: '24px',
        padding: '28px',
        color: '#ffffff',
        marginBottom: '24px',
        boxShadow: '0 12px 36px rgba(2,132,199,0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: '14px', borderRadius: '18px', backdropFilter: 'blur(10px)' }}>
            <Pill size={32} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 900, margin: 0, letterSpacing: '-0.5px' }}>
              Pharmacy & Medicine Stock Center
            </h1>
            <p style={{ color: '#e0f2fe', fontSize: '0.88rem', margin: '4px 0 0', fontWeight: 500 }}>
              Primary Health Centre Dispensary • Safe QR Lookup • Stock Movement & Dispensing Logs
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={loadDashboardData}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#ffffff',
              padding: '10px 16px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={15} className={loadingMetrics ? 'spin' : ''} />
            <span>Sync Stock Data</span>
          </button>
        </div>
      </div>

      {/* 9 Metrics Dashboard Cards (Prompt Section 15) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        {[
          { label: 'Total Medicines', value: metrics.totalMedicines, color: '#0284c7', bg: '#f0f9ff' },
          { label: 'Total Stock Qty', value: metrics.totalStockQty, color: '#059669', bg: '#ecfdf5' },
          { label: 'Low Stock Items', value: metrics.lowStockCount, color: '#d97706', bg: '#fffbeb', alert: metrics.lowStockCount > 0 },
          { label: 'Out of Stock', value: metrics.outOfStockCount, color: '#dc2626', bg: '#fef2f2', alert: metrics.outOfStockCount > 0 },
          { label: 'Expiring Soon', value: metrics.expiringSoonCount, color: '#ea580c', bg: '#fff7ed' },
          { label: 'Expired Drugs', value: metrics.expiredCount, color: '#991b1b', bg: '#fee2e2' },
          { label: "Today's Dispensed", value: metrics.todayDispensingCount, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Today Stock IN', value: `+${metrics.todayStockInUnits}`, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Today Stock OUT', value: `-${metrics.todayStockOutUnits}`, color: '#be123c', bg: '#fff1f2' }
        ].map((card, i) => (
          <div
            key={i}
            style={{
              background: card.bg,
              border: `1.5px solid ${card.color}25`,
              borderRadius: '16px',
              padding: '14px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ fontSize: '1.35rem', fontWeight: 900, color: card.color }}>
              {card.value}
            </div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', marginTop: '2px', textTransform: 'uppercase' }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Main Navigation Subtabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        borderBottom: '2px solid #e2e8f0',
        paddingBottom: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'dispense', label: '1. Patient & Rx Dispensing', icon: QrCode, color: '#0284c7' },
          { id: 'inventory', label: '2. Medicine Inventory', icon: Database, color: '#059669' },
          { id: 'transactions', label: '3. Stock Movement (IN/OUT)', icon: History, color: '#7c3aed' },
          { id: 'usage', label: '4. Dispensing / Usage History', icon: FileText, color: '#d97706' },
          { id: 'stockIn', label: '5. Receive New Stock (IN)', icon: Plus, color: '#16a34a' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              style={{
                padding: '10px 18px',
                borderRadius: '12px',
                border: isActive ? `2px solid ${tab.color}` : '1.5px solid #e2e8f0',
                background: isActive ? tab.color : '#ffffff',
                color: isActive ? '#ffffff' : '#475569',
                fontWeight: 800,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: isActive ? `0 4px 14px ${tab.color}35` : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PATIENT & PRESCRIPTION DISPENSING (Prompt Sections 12, 13, 14) */}
      {currentTab === 'dispense' && (
        <div>
          {/* Unified Patient Identification for Pharmacist */}
          <PatientLookup
            activeRole="pharmacist"
            title="Patient & Prescription Verification (Scan QR / Mobile)"
            onPatientSelect={handlePatientVerified}
          />

          {/* Active Patient & Prescription Display */}
          {selectedPatient && (
            <div style={{
              background: '#ffffff',
              border: '1.5px solid #bae6fd',
              borderRadius: '20px',
              padding: '24px',
              boxShadow: '0 8px 30px rgba(2,132,199,0.08)',
              marginBottom: '24px'
            }}>
              {/* Authorized Patient Header (Only Non-Sensitive Clinical Details) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                    Authorized Patient Dispensing Profile
                  </div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', margin: '2px 0 0' }}>
                    {selectedPatient.name} ({selectedPatient.age} Y / {selectedPatient.gender})
                  </h2>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                    Patient ID: <strong>{selectedPatient.id}</strong> • SSC: <strong>{selectedPatient.maskedSsc || selectedPatient.sscCode || 'Active'}</strong> • Blood Group: <strong>{selectedPatient.bloodGroup || 'B+'}</strong>
                  </div>
                </div>

                {/* Prescriptions Count Badge */}
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 800
                  }}>
                    {activePrescriptions.length} Active Prescription(s)
                  </span>
                </div>
              </div>

              {/* Prescription Selector Tabs if multiple */}
              {activePrescriptions.length > 1 && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                  {activePrescriptions.map(rx => (
                    <button
                      key={rx.prescriptionId}
                      onClick={() => handleSelectPrescription(rx)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: selectedPrescription?.prescriptionId === rx.prescriptionId ? '2px solid #0284c7' : '1px solid #cbd5e1',
                        background: selectedPrescription?.prescriptionId === rx.prescriptionId ? '#f0f9ff' : '#ffffff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {rx.prescriptionId} • {rx.diagnosis} ({rx.status})
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Prescription Dispensing Panel */}
              {selectedPrescription ? (
                <div>
                  {/* Rx Info Summary */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '14px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                    marginBottom: '18px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>PRESCRIPTION ID</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0284c7' }}>#{selectedPrescription.prescriptionId}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>DIAGNOSIS</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#1e293b' }}>{selectedPrescription.diagnosis}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>PRESCRIBING DOCTOR</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#334155' }}>{selectedPrescription.doctorName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>DISPENSING STATUS</div>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        background: selectedPrescription.status === 'Fully Dispensed' ? '#dcfce7' : selectedPrescription.status === 'Partially Dispensed' ? '#fef3c7' : '#e0f2fe',
                        color: selectedPrescription.status === 'Fully Dispensed' ? '#166534' : selectedPrescription.status === 'Partially Dispensed' ? '#92400e' : '#0369a1'
                      }}>
                        {selectedPrescription.status}
                      </span>
                    </div>
                  </div>

                  {/* Medicines Dispensing Table */}
                  <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                          <th style={{ padding: '10px 12px', color: '#334155', fontWeight: 800 }}>Medicine Name</th>
                          <th style={{ padding: '10px 12px', color: '#334155', fontWeight: 800 }}>Dosage & Regimen</th>
                          <th style={{ padding: '10px 12px', color: '#334155', fontWeight: 800, textAlign: 'center' }}>Prescribed</th>
                          <th style={{ padding: '10px 12px', color: '#334155', fontWeight: 800, textAlign: 'center' }}>Already Given</th>
                          <th style={{ padding: '10px 12px', color: '#334155', fontWeight: 800, textAlign: 'center' }}>Remaining</th>
                          <th style={{ padding: '10px 12px', color: '#334155', fontWeight: 800, textAlign: 'center' }}>Live Stock</th>
                          <th style={{ padding: '10px 12px', color: '#334155', fontWeight: 800, textAlign: 'center' }}>Dispense Now</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPrescription.medicines.map((m, idx) => {
                          const remaining = Math.max(0, m.prescribedQty - m.dispensedQty);
                          const isFullyGiven = m.dispensedQty >= m.prescribedQty;
                          const available = m.availableStock !== undefined ? m.availableStock : 100;
                          const isStockSufficient = available >= (dispenseQuantities[m.medicineId] || 0);
                          const isExpired = m.isExpired;

                          return (
                            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', background: isFullyGiven ? '#f8fafc' : '#ffffff' }}>
                              <td style={{ padding: '12px' }}>
                                <strong style={{ color: '#0f172a' }}>{m.medicineName}</strong>
                                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  Batch: {m.batchNumber || 'PCM-2026-A1'} • Form: {m.dosageForm || 'Tablet'}
                                </div>
                                {isExpired && (
                                  <div style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 800, marginTop: '2px' }}>
                                    ⚠️ EXPIRED MEDICINE (Dispensing Prohibited)
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '12px' }}>
                                <div>{m.dosage} • {m.frequency}</div>
                                <div style={{ fontSize: '0.72rem', color: '#059669' }}>{m.duration} • {m.instructions}</div>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>
                                {m.prescribedQty}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', color: '#059669', fontWeight: 700 }}>
                                {m.dispensedQty}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center', fontWeight: 800, color: remaining > 0 ? '#d97706' : '#166534' }}>
                                {remaining}
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: '8px',
                                  fontSize: '0.75rem',
                                  fontWeight: 800,
                                  background: available === 0 ? '#fee2e2' : available <= 50 ? '#fef3c7' : '#dcfce7',
                                  color: available === 0 ? '#991b1b' : available <= 50 ? '#92400e' : '#166534'
                                }}>
                                  {available} in stock
                                </span>
                              </td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                {isFullyGiven ? (
                                  <span style={{ color: '#059669', fontWeight: 700, fontSize: '0.75rem' }}>
                                    ✓ Fully Dispensed
                                  </span>
                                ) : (
                                  <input
                                    type="number"
                                    min="0"
                                    max={Math.min(remaining, available)}
                                    disabled={available === 0 || isExpired}
                                    value={dispenseQuantities[m.medicineId] ?? remaining}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      setDispenseQuantities(prev => ({
                                        ...prev,
                                        [m.medicineId]: val
                                      }));
                                    }}
                                    style={{
                                      width: '70px',
                                      padding: '6px 8px',
                                      borderRadius: '8px',
                                      border: '1.5px solid #0284c7',
                                      textAlign: 'center',
                                      fontWeight: 800,
                                      fontSize: '0.85rem'
                                    }}
                                  />
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Feedback Messages */}
                  {dispenseError && (
                    <div style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#991b1b',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.88rem'
                    }}>
                      <AlertCircle size={18} />
                      <span>{dispenseError}</span>
                    </div>
                  )}

                  {dispenseMsg && (
                    <div style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      color: '#065f46',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.88rem'
                    }}>
                      <CheckCircle2 size={18} />
                      <span>{dispenseMsg}</span>
                    </div>
                  )}

                  {/* Dispense Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                      onClick={handleExecuteDispense}
                      disabled={dispensingLoading || selectedPrescription.status === 'Fully Dispensed'}
                      className="btn-primary"
                      style={{
                        padding: '12px 28px',
                        fontSize: '0.95rem',
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #059669, #047857)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 14px rgba(5,150,105,0.35)'
                      }}
                    >
                      <PackageCheck size={18} />
                      <span>{dispensingLoading ? 'Verifying & Dispensing...' : 'Confirm Dispensing & Update Stock'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  No pending prescriptions found for this patient.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MEDICINE INVENTORY (Prompt Section 9) */}
      {currentTab === 'inventory' && (
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Medicine Stock Inventory
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                Accurate stock levels calculated dynamically based on quantity and expiration date
              </p>
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['ALL', 'In Stock', 'Low Stock', 'Out of Stock', 'Expired'].map(f => (
                <button
                  key={f}
                  onClick={() => setInventoryFilter(f)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: inventoryFilter === f ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                    background: inventoryFilter === f ? '#f0f9ff' : '#ffffff',
                    color: inventoryFilter === f ? '#0284c7' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input
              type="text"
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
              placeholder="Filter by medicine name, generic name, or batch number..."
              style={{
                width: '100%',
                padding: '10px 12px 10px 38px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Inventory Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Medicine Name</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Generic / Category</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Batch No.</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Expiry Date</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800, textAlign: 'center' }}>Available Qty</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800, textAlign: 'center' }}>Min Threshold</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Manufacturer</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map(med => {
                  const isExpired = med.status === 'Expired';
                  const isOut = med.status === 'Out of Stock';
                  const isLow = med.status === 'Low Stock';
                  return (
                    <tr key={med.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px' }}>
                        <strong style={{ color: '#0f172a' }}>{med.name}</strong>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{med.dosageForm || 'Tablet'} • {med.strength || ''}</div>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <div>{med.genericName || '—'}</div>
                        <div style={{ fontSize: '0.7rem', color: '#059669' }}>{med.category}</div>
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700 }}>
                        {med.batchNumber || 'BATCH-001'}
                      </td>
                      <td style={{ padding: '10px 12px', color: isExpired ? '#dc2626' : '#475569' }}>
                        {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString('en-IN') : '2027-08-31'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 900, color: isOut ? '#dc2626' : isLow ? '#d97706' : '#059669' }}>
                        {med.stockQty} {med.unit || 'Strips'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                        {med.minThreshold}
                      </td>
                      <td style={{ padding: '10px 12px', fontSize: '0.75rem', color: '#64748b' }}>
                        {med.manufacturer || 'Govt Depot'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '10px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: isExpired ? '#fee2e2' : isOut ? '#fef2f2' : isLow ? '#fef3c7' : '#dcfce7',
                          color: isExpired ? '#991b1b' : isOut ? '#dc2626' : isLow ? '#92400e' : '#166534'
                        }}>
                          {med.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STOCK TRANSACTIONS (Prompt Section 10) */}
      {currentTab === 'transactions' && (
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Stock Transactions Audit Trail (IN / OUT / Adjustment)
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                Complete verifiable history with quantities, timestamps, and authorized staff
              </p>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'IN', 'OUT', 'ADJUSTMENT'].map(t => (
                <button
                  key={t}
                  onClick={() => setTxnFilter(t)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    border: txnFilter === t ? '1.5px solid #7c3aed' : '1px solid #cbd5e1',
                    background: txnFilter === t ? '#f5f3ff' : '#ffffff',
                    color: txnFilter === t ? '#7c3aed' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Type</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Transaction ID</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Medicine & Batch</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800, textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800, textAlign: 'center' }}>Stock Before → After</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Patient / Source</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>User / Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(txn => (
                  <tr key={txn.transactionId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        background: txn.type === 'IN' ? '#dcfce7' : txn.type === 'OUT' ? '#fee2e2' : '#fef3c7',
                        color: txn.type === 'IN' ? '#166534' : txn.type === 'OUT' ? '#991b1b' : '#92400e'
                      }}>
                        {txn.type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700 }}>
                      {txn.transactionId}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <strong style={{ color: '#0f172a' }}>{txn.medicineName}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Batch: {txn.batchNumber}</div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: txn.type === 'IN' ? '#16a34a' : '#dc2626' }}>
                      {txn.type === 'IN' ? `+${txn.quantity}` : `-${txn.quantity}`}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                      {txn.previousQty} → <strong style={{ color: '#0f172a' }}>{txn.newQty}</strong>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {txn.patientName ? (
                        <div>
                          <strong>{txn.patientName}</strong>
                          <div style={{ fontSize: '0.7rem', color: '#0284c7' }}>Rx: {txn.prescriptionId}</div>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{txn.supplier || txn.reason || 'General'}</div>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '0.75rem', color: '#64748b' }}>
                      <div>{txn.userName}</div>
                      <div>{new Date(txn.timestamp).toLocaleString('en-IN')}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MEDICINE USAGE / DISPENSING HISTORY (Prompt Section 11) */}
      {currentTab === 'usage' && (
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Medicine Dispensing & Usage Tracking
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                Complete record of every prescription medicine dispensed to patients
              </p>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Dispense ID</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Patient</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Prescription & Doctor</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Medicines Dispensed</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Dispensed By</th>
                  <th style={{ padding: '10px 12px', color: '#475569', fontWeight: 800 }}>Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {usageList.map(rec => (
                  <tr key={rec.dispenseId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7' }}>
                      {rec.dispenseId}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <strong style={{ color: '#0f172a' }}>{rec.patientName}</strong>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ID: {rec.patientId}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div>Rx: <strong>#{rec.prescriptionId}</strong></div>
                      <div style={{ fontSize: '0.7rem', color: '#059669' }}>{rec.doctorName}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      {(rec.items || []).map((it, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', color: '#1e293b' }}>
                          • <strong>{it.medicineName}</strong> (Qty: {it.quantity}) [Batch: {it.batchNumber}]
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#475569' }}>
                      {rec.dispensedBy}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(rec.dispensedAt).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: STOCK IN (RECEIVE NEW STOCK) (Prompt Section 10) */}
      {currentTab === 'stockIn' && (
        <div style={{ background: '#ffffff', borderRadius: '20px', border: '1.5px solid #86efac', padding: '26px', maxWidth: '800px', margin: '0 auto', boxShadow: '0 8px 30px rgba(22,163,74,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
            <div style={{ background: '#dcfce7', padding: '10px', borderRadius: '12px', color: '#16a34a' }}>
              <Plus size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#166534', margin: 0 }}>
                Stock IN: Receive New Medicine Consignment
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '2px 0 0' }}>
                Creates a verified Stock IN transaction and increases available inventory automatically
              </p>
            </div>
          </div>

          <form onSubmit={handleStockInSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Medicine Brand Name *
                </label>
                <input
                  type="text"
                  value={inMedName}
                  onChange={(e) => setInMedName(e.target.value)}
                  placeholder="e.g. Paracetamol 500mg"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Generic Formulation
                </label>
                <input
                  type="text"
                  value={inGenericName}
                  onChange={(e) => setInGenericName(e.target.value)}
                  placeholder="e.g. Paracetamol IP"
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={inCategory}
                  onChange={(e) => setInCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="Antipyretic / Analgesic">Antipyretic / Analgesic</option>
                  <option value="Antibiotic">Antibiotic</option>
                  <option value="Electrolytes & Hydration">Electrolytes & Hydration</option>
                  <option value="Antimalarial">Antimalarial</option>
                  <option value="Oral Hypoglycemic / Diabetes">Oral Hypoglycemic / Diabetes</option>
                  <option value="Antihypertensive">Antihypertensive</option>
                  <option value="Maternal Health / IFA">Maternal Health / IFA</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Batch Number *
                </label>
                <input
                  type="text"
                  value={inBatchNumber}
                  onChange={(e) => setInBatchNumber(e.target.value)}
                  placeholder="e.g. BATCH-2026-X9"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 700, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Received Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  value={inQty}
                  onChange={(e) => setInQty(e.target.value)}
                  placeholder="100"
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', fontWeight: 700, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Expiration Date *
                </label>
                <input
                  type="date"
                  value={inExpiryDate}
                  onChange={(e) => setInExpiryDate(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Supplier / Medical Depot
                </label>
                <input
                  type="text"
                  value={inSupplier}
                  onChange={(e) => setInSupplier(e.target.value)}
                  placeholder="Central Medical Stores Depot"
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Minimum Warning Threshold
                </label>
                <input
                  type="number"
                  min="5"
                  value={inThreshold}
                  onChange={(e) => setInThreshold(e.target.value)}
                  placeholder="40"
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {stockInError && (
              <div style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '0.85rem' }}>
                {stockInError}
              </div>
            )}

            {stockInSuccess && (
              <div style={{ background: '#ecfdf5', color: '#065f46', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', fontSize: '0.85rem' }}>
                {stockInSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={stockInLoading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #16a34a, #15803d)'
              }}
            >
              {stockInLoading ? 'Processing Receipt...' : 'Record Consignment & Increase Stock'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
