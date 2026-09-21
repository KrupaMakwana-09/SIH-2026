import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Pill,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Calendar,
  FileText,
  Search,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../../utils/api';
import { useI18n } from '../../utils/i18n';

export default function DiagnosisPrescriptionForm({
  patient,
  currentUser,
  onPrescriptionSaved
}) {
  const { t } = useI18n();

  // Disease catalog
  const [diseasesList, setDiseasesList] = useState([]);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState('');
  const [diseaseSearchQuery, setDiseaseSearchQuery] = useState('');
  const [relatedMedicines, setRelatedMedicines] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Prescription Form Fields
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [followUpDays, setFollowUpDays] = useState(5);
  const [medicines, setMedicines] = useState([
    {
      medicineId: '',
      medicineName: '',
      genericName: '',
      dosageForm: 'Tablet',
      dosage: '1 tab (500mg)',
      frequency: 'Twice daily (BD)',
      duration: '5 days',
      instructions: 'After meals with water',
      prescribedQty: 10
    }
  ]);

  // Status & notifications
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch disease catalog on load
  useEffect(() => {
    const fetchDiseases = async () => {
      try {
        const res = await api.getDiseases();
        if (res.success && res.data) {
          setDiseasesList(res.data);
        }
      } catch (e) {
        console.warn('Could not fetch disease catalog:', e);
      }
    };
    fetchDiseases();
  }, []);

  // When a disease is selected, fetch suggested related medicines
  const handleDiseaseChange = async (diseaseId) => {
    setSelectedDiseaseId(diseaseId);
    const found = diseasesList.find(d => d.diseaseId === diseaseId);
    if (found) {
      setDiagnosis(found.diseaseName);
    }

    if (!diseaseId) {
      setRelatedMedicines([]);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const res = await api.getDiseaseMedicines(diseaseId);
      if (res.success && res.data) {
        setRelatedMedicines(res.data);
      }
    } catch (e) {
      console.warn('Error fetching related medicines:', e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Add medicine row to prescription
  const handleAddMedicineRow = () => {
    setMedicines(prev => [
      ...prev,
      {
        medicineId: `MED-${Math.floor(100 + Math.random() * 900)}`,
        medicineName: '',
        genericName: '',
        dosageForm: 'Tablet',
        dosage: '1 tab',
        frequency: 'Twice daily (BD)',
        duration: '5 days',
        instructions: 'After food',
        prescribedQty: 10
      }
    ]);
  };

  // Remove medicine row
  const handleRemoveMedicineRow = (index) => {
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  // Update specific field in a medicine row
  const handleMedicineFieldChange = (index, field, value) => {
    setMedicines(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Doctor clicks to adopt a suggested related medicine
  const handleSelectSuggestedMedicine = (suggested) => {
    // Check if already in list
    const alreadyAdded = medicines.some(m =>
      m.medicineName.toLowerCase() === suggested.medicineName.toLowerCase()
    );

    if (alreadyAdded) {
      setErrorMsg(`"${suggested.medicineName}" is already in the prescription list.`);
      return;
    }

    // If first row is empty, fill it; otherwise append
    setMedicines(prev => {
      const firstIsEmpty = prev.length === 1 && !prev[0].medicineName.trim();
      const newMed = {
        medicineId: suggested.medicineId || `MED-${Math.floor(100 + Math.random() * 900)}`,
        medicineName: suggested.medicineName,
        genericName: suggested.genericName || '',
        dosageForm: suggested.dosageForm || 'Tablet',
        dosage: suggested.standardDosage || '1 tab',
        frequency: suggested.standardFrequency || 'Twice daily (BD)',
        duration: suggested.standardDuration || '5 days',
        instructions: suggested.instructions || 'After meals with water',
        prescribedQty: 10
      };

      if (firstIsEmpty) return [newMed];
      return [...prev, newMed];
    });

    setSuccessMsg(`Added "${suggested.medicineName}" to prescription! Specify dosage and duration.`);
  };

  // Submit & Save Prescription
  const handleSavePrescription = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!patient || !patient.id) {
      setErrorMsg('No active patient selected for prescription.');
      return;
    }

    if (!diagnosis || !diagnosis.trim()) {
      setErrorMsg('Clinical diagnosis is required before issuing prescription.');
      return;
    }

    const validMeds = medicines.filter(m => m.medicineName && m.medicineName.trim());
    if (validMeds.length === 0) {
      setErrorMsg('Prescription must contain at least one medicine name.');
      return;
    }

    setSaving(true);
    try {
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + Number(followUpDays));

      const payload = {
        patientId: patient.id,
        diagnosis: diagnosis.trim(),
        diseaseId: selectedDiseaseId,
        clinicalNotes: clinicalNotes.trim(),
        followUpDate,
        medicines: validMeds.map(m => ({
          medicineId: m.medicineId || `MED-${Math.floor(100 + Math.random() * 900)}`,
          medicineName: m.medicineName.trim(),
          genericName: m.genericName || '',
          dosageForm: m.dosageForm || 'Tablet',
          dosage: m.dosage || '1 tab',
          frequency: m.frequency || 'Twice daily',
          duration: m.duration || '5 days',
          instructions: m.instructions || 'After meals',
          prescribedQty: Number(m.prescribedQty) || 10
        }))
      };

      const res = await api.createPrescription(payload);
      if (res.success) {
        setSuccessMsg(`Prescription #${res.prescription.prescriptionId} issued and saved to patient history! ✅`);
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        if (onPrescriptionSaved) onPrescriptionSaved(res.prescription, res.patient);
      } else {
        setErrorMsg(res.message || 'Failed to save prescription.');
      }
    } catch (err) {
      setErrorMsg('Network error while issuing prescription.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      background: '#ffffff',
      border: '1.5px solid #059669',
      borderRadius: '20px',
      padding: '24px',
      boxShadow: '0 10px 30px rgba(5,150,105,0.08)',
      marginTop: '16px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #e2e8f0', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ background: '#ecfdf5', padding: '10px', borderRadius: '12px', color: '#059669' }}>
            <Stethoscope size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#064e3b', margin: 0 }}>
              Diagnosis & Clinical Prescription
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '3px 0 0' }}>
              Patient: <strong>{patient.name}</strong> (ID: {patient.id} • {patient.age}Y/{patient.gender})
            </p>
          </div>
        </div>

        <span style={{
          background: '#f0fdf4',
          border: '1px solid #86efac',
          color: '#166534',
          borderRadius: '20px',
          padding: '4px 12px',
          fontSize: '0.75rem',
          fontWeight: 700
        }}>
          Direct Rx Database Integration
        </span>
      </div>

      <form onSubmit={handleSavePrescription}>
        {/* Step 1: Disease Selection & Diagnosis */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '18px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#059669" />
            <span>1. Disease Selection & Diagnosis:</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', marginBottom: '12px' }}>
            {/* Disease Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Select from Standard Clinical Catalog (Optional Reference)
              </label>
              <select
                value={selectedDiseaseId}
                onChange={(e) => handleDiseaseChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#0f172a'
                }}
              >
                <option value="">-- Choose Disease to View Suggested Medicines --</option>
                {diseasesList.map(d => (
                  <option key={d.diseaseId} value={d.diseaseId}>
                    {d.diseaseName} ({d.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Diagnosis Input / Editable */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Primary Diagnosis (Required for Prescription) *
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Febrile Illness / Malaria P. Vivax..."
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: '1.5px solid #059669',
                  background: '#ffffff',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#064e3b',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Suggested Related Medicines Pill Shelf */}
          {selectedDiseaseId && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: '12px',
              padding: '12px 14px',
              marginTop: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#065f46', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Pill size={15} color="#059669" />
                  <span>Suggested Reference Medications (Click to Add to Prescription):</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 600 }}>
                  * Suggestions only. Must be explicitly selected by doctor.
                </span>
              </div>

              {loadingSuggestions ? (
                <div style={{ fontSize: '0.8rem', color: '#047857' }}>Loading related medicines from formulary...</div>
              ) : relatedMedicines.length > 0 ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {relatedMedicines.map(m => (
                    <button
                      key={m.medicineId}
                      type="button"
                      onClick={() => handleSelectSuggestedMedicine(m)}
                      style={{
                        background: '#ffffff',
                        border: '1.5px solid #059669',
                        borderRadius: '20px',
                        padding: '6px 14px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#064e3b',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#d1fae5'}
                      onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                    >
                      <Plus size={14} />
                      <span>{m.medicineName}</span>
                      <span style={{
                        fontSize: '0.65rem',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        background: m.stockStatus === 'In Stock' ? '#dcfce7' : '#fee2e2',
                        color: m.stockStatus === 'In Stock' ? '#166534' : '#991b1b'
                      }}>
                        {m.stockStatus} ({m.availableStock})
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  No pre-mapped standard formulary for this disease. You can manually enter any medicine below.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Prescription Medicines Table / Rows */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '18px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Pill size={16} color="#0284c7" />
              <span>2. Prescribed Medications:</span>
            </div>
            <button
              type="button"
              onClick={handleAddMedicineRow}
              className="btn-secondary"
              style={{ padding: '6px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Plus size={14} />
              <span>Add Another Medicine</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {medicines.map((med, idx) => (
              <div
                key={idx}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '14px',
                  position: 'relative'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  {/* Medicine Name */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Medicine Name *
                    </label>
                    <input
                      type="text"
                      value={med.medicineName}
                      onChange={(e) => handleMedicineFieldChange(idx, 'medicineName', e.target.value)}
                      placeholder="e.g. Paracetamol 500mg, Amoxicillin 500mg..."
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Dosage */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={med.dosage}
                      onChange={(e) => handleMedicineFieldChange(idx, 'dosage', e.target.value)}
                      placeholder="e.g. 1 tab (500mg)"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Frequency */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Frequency
                    </label>
                    <select
                      value={med.frequency}
                      onChange={(e) => handleMedicineFieldChange(idx, 'frequency', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        background: '#ffffff',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="Once daily (OD)">Once daily (OD)</option>
                      <option value="Twice daily (BD)">Twice daily (BD)</option>
                      <option value="Thrice daily (TDS)">Thrice daily (TDS)</option>
                      <option value="Four times daily (QID)">Four times daily (QID)</option>
                      <option value="As needed (SOS)">As needed (SOS)</option>
                      <option value="At bedtime (HS)">At bedtime (HS)</option>
                    </select>
                  </div>

                  {/* Duration */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Duration
                    </label>
                    <input
                      type="text"
                      value={med.duration}
                      onChange={(e) => handleMedicineFieldChange(idx, 'duration', e.target.value)}
                      placeholder="e.g. 5 days, 10 days"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Total Prescribed Quantity */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Total Units to Dispense
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={med.prescribedQty}
                      onChange={(e) => handleMedicineFieldChange(idx, 'prescribedQty', e.target.value)}
                      placeholder="10"
                      required
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Instructions */}
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                      Instructions
                    </label>
                    <input
                      type="text"
                      value={med.instructions}
                      onChange={(e) => handleMedicineFieldChange(idx, 'instructions', e.target.value)}
                      placeholder="e.g. After food with plenty of water"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Remove Button */}
                  {medicines.length > 1 && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicineRow(idx)}
                        style={{
                          background: '#fee2e2',
                          border: 'none',
                          color: '#dc2626',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={13} />
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 3: Clinical Notes & Follow-up */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Doctor Clinical Notes / Dietary Advice
            </label>
            <textarea
              rows="3"
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              placeholder="Enter special clinical advice, hydration guidelines, warning signs..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.85rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Follow-up Review In (Days)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={followUpDays}
              onChange={(e) => setFollowUpDays(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '0.88rem',
                fontWeight: 700,
                boxSizing: 'border-box'
              }}
            />
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '6px' }}>
              A follow-up reminder will automatically be created for the patient.
            </div>
          </div>
        </div>

        {/* Feedback messages */}
        {errorMsg && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '0.95rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(5,150,105,0.3)'
            }}
          >
            <Save size={18} />
            <span>{saving ? 'Issuing Prescription...' : 'Save & Issue Prescription'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
