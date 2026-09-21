/**
 * AI Triage & Voice NLP Engine for Rural Healthcare
 * Directly connected to MongoDB Atlas for patient database storage.
 */

const Patient = require('../models/Patient');

const symptomRules = [
  {
    keywords: ['chest pain', 'chhati me dard', 'seene me dard', 'heart attack', 'dil ka daura', 'left arm pain'],
    risk: 'CRITICAL',
    triageCategory: 'RED_EMERGENCY',
    tags: ['Chest Pain', 'Suspected Cardiac Emergency'],
    facilityType: 'District Hospital / Trauma & Cardiology Unit',
    actionNote: 'Immediate 108 ambulance dispatch recommended. Oxygen and ECG monitoring required immediately.'
  },
  {
    keywords: ['saans lene me takleef', 'difficulty breathing', 'shortness of breath', 'dum ghutna', 'blue lips', 'asthma attack', 'spo2 low'],
    risk: 'CRITICAL',
    triageCategory: 'RED_EMERGENCY',
    tags: ['Respiratory Distress', 'Hypoxia Risk'],
    facilityType: 'CHC or District Hospital with Oxygen Beds',
    actionNote: 'Immediate oxygen support required. Check SpO2 immediately. Triage to facility with active oxygen cylinders.'
  },
  {
    keywords: ['pregnancy pain', 'garbhavastha dard', 'high bp in pregnancy', 'preeclampsia', 'bleeding in pregnancy', 'delivery pain', 'prasav'],
    risk: 'HIGH',
    triageCategory: 'RED_EMERGENCY',
    tags: ['High Risk Pregnancy', 'Obstetric Emergency'],
    facilityType: 'CHC or District Hospital with Gynecologist & Labor Room',
    actionNote: 'Alert JSSK/108 Van. Ensure Gynecologist / trained SN available at target facility.'
  },
  {
    keywords: ['snake bite', 'saap ne kata', 'zeher', 'poisoning', 'loss of consciousness', 'behosh', 'seizure', 'daura'],
    risk: 'CRITICAL',
    triageCategory: 'RED_EMERGENCY',
    tags: ['Toxicology / Snake Bite', 'Neurological Emergency'],
    facilityType: 'CHC or District Hospital with Anti-Snake Venom (ASV)',
    actionNote: 'Emergency antidote (ASV) and resuscitation setup needed.'
  },
  {
    keywords: ['high fever', 'tez bukhar', 'chills', 'thand lagna', 'vomiting', 'ulti', 'persistent fever', 'malaria'],
    risk: 'MODERATE',
    triageCategory: 'YELLOW_PRIORITY',
    tags: ['Febrile Illness', 'Suspected Infection / Malaria / Dengue'],
    facilityType: 'PHC or CHC with Blood Testing Diagnostics',
    actionNote: 'Diagnostic workup: CBC, Rapid Malaria Test, Dengue NS1. Monitor hydration.'
  },
  {
    keywords: ['fracture', 'haddi tutna', 'swelling', 'severe sprain', 'chot lagna', 'accident injury'],
    risk: 'MODERATE',
    triageCategory: 'YELLOW_PRIORITY',
    tags: ['Trauma / Orthopedic Injury'],
    facilityType: 'CHC or District Hospital with Digital X-Ray & Orthopedic support',
    actionNote: 'Immobilize limb. Facility with functioning X-ray machine required.'
  },
  {
    keywords: ['dast', 'diarrhea', 'loose motion', 'dehydration', 'chakkar', 'kamzori', 'weakness'],
    risk: 'MODERATE',
    triageCategory: 'YELLOW_PRIORITY',
    tags: ['Acute Gastroenteritis', 'Dehydration Risk'],
    facilityType: 'PHC or Health & Wellness Sub-Centre',
    actionNote: 'Administer ORS + Zinc packets immediately. Monitor pulse and urine output.'
  },
  {
    keywords: ['mild fever', 'halka bukhar', 'cough', 'khansi', 'cold', 'zukham', 'headache', 'sar dard', 'skin rash', 'khujli'],
    risk: 'LOW',
    triageCategory: 'GREEN_ROUTINE',
    tags: ['Mild Upper Respiratory Infection / General Symptom'],
    facilityType: 'Health & Wellness Sub-Centre or Local PHC',
    actionNote: 'OPD consultation with Community Health Officer / MBBS Doctor. Symptomatic medication.'
  }
];

function parseAge(text) {
  const ageMatch = text.match(/(\d+)\s*(saal|sal|years|year|yrs|yr|mahine|months|month)/i) || text.match(/age\s*(?:is|:)?\s*(\d+)/i);
  if (ageMatch) return parseInt(ageMatch[1], 10);
  const rawNum = text.match(/\b(100|[1-9][0-9]?)\b/);
  return rawNum ? parseInt(rawNum[1], 10) : 30;
}

function parseDuration(text) {
  const durationMatch = text.match(/(\d+|kal|aaj|parso|do|teen|char|ek)\s*(din|days|day|hours|ghante|hafte|weeks)?/i);
  if (durationMatch) return durationMatch[0];
  if (/kal se|since yesterday/i.test(text)) return '1-2 Days (Since Yesterday)';
  if (/aaj se|since today/i.test(text)) return 'Since Today (< 24 hrs)';
  return '2-3 Days';
}

exports.parseVoiceTriage = async (req, res) => {
  try {
    const { transcript, language = 'hi-IN', vitalsInput = {} } = req.body;

    if (!transcript || transcript.trim() === '') {
      return res.status(400).json({ success: false, message: 'Voice transcript or text is required.' });
    }

    const lower = transcript.toLowerCase();
    let matchedRule = null;
    let matchedTags = [];

    for (const rule of symptomRules) {
      const match = rule.keywords.some(kw => lower.includes(kw.toLowerCase()));
      if (match) {
        matchedRule = rule;
        matchedTags = [...rule.tags];
        break;
      }
    }

    if (!matchedRule) {
      matchedRule = {
        risk: 'LOW',
        triageCategory: 'GREEN_ROUTINE',
        tags: ['General Health Assessment'],
        facilityType: 'Local PHC / Health & Wellness Sub-Centre',
        actionNote: 'General clinical consultation with available Medical Officer.'
      };
      matchedTags = ['General Complaint'];
    }

    const estimatedAge = parseAge(lower);
    const estimatedDuration = parseDuration(lower);

    let vitals = {
      bp: vitalsInput.bp || (matchedRule.risk === 'CRITICAL' ? '155/98' : '120/80'),
      spo2: vitalsInput.spo2 || (matchedRule.tags.includes('Respiratory Distress') ? 91 : 98),
      temp: vitalsInput.temp || (matchedRule.tags.includes('Febrile Illness') ? 102.1 : 98.6),
      pulse: vitalsInput.pulse || (matchedRule.risk === 'CRITICAL' ? 108 : 76),
      sugar: vitalsInput.sugar || 'Normal (98 mg/dL)'
    };

    let finalRisk = matchedRule.risk;
    let finalCategory = matchedRule.triageCategory;

    if (vitals.spo2 < 92 || vitals.pulse > 120 || vitals.temp > 103) {
      finalRisk = 'CRITICAL';
      finalCategory = 'RED_EMERGENCY';
    } else if (vitals.spo2 < 95 || vitals.temp > 101) {
      if (finalRisk === 'LOW') {
        finalRisk = 'MODERATE';
        finalCategory = 'YELLOW_PRIORITY';
      }
    }

    const triageResult = {
      originalTranscript: transcript,
      detectedLanguage: language,
      structuredData: {
        estimatedAge,
        duration: estimatedDuration,
        chiefComplaint: transcript.length > 120 ? transcript.slice(0, 117) + '...' : transcript,
        symptomTags: matchedTags,
        vitals: vitals
      },
      triageAssessment: {
        riskLevel: finalRisk,
        triageCategory: finalCategory,
        badgeColor: finalRisk === 'CRITICAL' ? '#DC2626' : finalRisk === 'HIGH' ? '#EA580C' : finalRisk === 'MODERATE' ? '#D97706' : '#16A34A',
        recommendedFacilityType: matchedRule.facilityType,
        actionGuidance: matchedRule.actionNote,
        responsibleAiDisclaimer: 'AI assists health workers for triage prioritization; it does not substitute for a qualified doctor’s clinical diagnosis.'
      }
    };

    return res.json({ success: true, data: triageResult });
  } catch (error) {
    console.error('Triage error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.registerPatient = async (req, res) => {
  try {
    const patientData = {
      id: `PAT-IND-${Math.floor(1000 + Math.random() * 9000)}`,
      ...req.body,
      registrationDate: new Date()
    };

    const newPatient = new Patient(patientData);
    await newPatient.save();

    return res.status(201).json({ success: true, data: newPatient, message: 'Patient saved in database' });
  } catch (error) {
    console.error('Patient register error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPatients = async (req, res) => {
  try {
    const list = await Patient.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncOfflineQueue = async (req, res) => {
  try {
    const { queuedPatients = [] } = req.body;
    const synced = [];

    for (const item of queuedPatients) {
      const patientData = {
        id: item.id || `PAT-IND-${Math.floor(1000 + Math.random() * 9000)}`,
        ...item,
        syncedAt: new Date()
      };
      const p = new Patient(patientData);
      await p.save();
      synced.push(p);
    }

    return res.json({
      success: true,
      syncedCount: synced.length,
      message: `Successfully synchronized ${synced.length} records to MongoDB Atlas database.`,
      data: synced
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
