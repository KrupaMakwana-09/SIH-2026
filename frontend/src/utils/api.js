/**
 * API client with robust endpoints connected to MongoDB Atlas.
 */

const API_BASE = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('gramin_arogya_token');
  const user = localStorage.getItem('gramin_arogya_user');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (user) {
    try {
      const parsed = JSON.parse(user);
      if (parsed && (parsed.id || parsed._id)) {
        headers['x-user-id'] = parsed.id || parsed._id;
      }
    } catch {}
  }
  return headers;
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch (err) {
    return { success: false, message: `Server error (${res.status || 'unknown'})` };
  }
};

export const api = {
  // Authentication
  
  verifyAdminOtp: async (otp) => {
    const res = await fetch(`${API_BASE}/auth/verify-admin-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ otp })
    });
    return safeJson(res);
  },
  login: async ({ username, password, role }) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, role })
    });
    return safeJson(res);
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getUsers: async () => {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Voice AI Triage
  parseVoiceTriage: async (transcript, language, vitals) => {
    const res = await fetch(`${API_BASE}/triage/voice-parse`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ transcript, language, vitalsInput: vitals })
    });
    return res.json();
  },

  // Patients
  registerPatient: async (patientData) => {
    const res = await fetch(`${API_BASE}/patients/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(patientData)
    });
    return res.json();
  },

  getPatients: async () => {
    const res = await fetch(`${API_BASE}/patients`, {
      headers: getHeaders()
    });
    return res.json();
  },

  syncOfflineQueue: async (queuedPatients) => {
    const res = await fetch(`${API_BASE}/sync-offline`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ queuedPatients })
    });
    return res.json();
  },

  // Facilities & Smart Routing
  getFacilities: async () => {
    const res = await fetch(`${API_BASE}/facilities`, {
      headers: getHeaders()
    });
    return res.json();
  },

  createFacility: async (data) => {
    const res = await fetch(`${API_BASE}/facilities`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateFacility: async (id, data) => {
    const res = await fetch(`${API_BASE}/facilities/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteFacility: async (id) => {
    const res = await fetch(`${API_BASE}/facilities/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  getSmartRouting: async (params) => {
    const res = await fetch(`${API_BASE}/facilities/smart-routing`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    return res.json();
  },

  // Inventory & Medicines
  getInventory: async () => {
    const res = await fetch(`${API_BASE}/inventory`, {
      headers: getHeaders()
    });
    return res.json();
  },

  createMedicine: async (data) => {
    const res = await fetch(`${API_BASE}/inventory`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateMedicineStock: async (id, payload) => {
    const res = await fetch(`${API_BASE}/inventory/${id}/stock`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  deleteMedicine: async (id) => {
    const res = await fetch(`${API_BASE}/inventory/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // Outbreaks
  getOutbreaks: async () => {
    const res = await fetch(`${API_BASE}/outbreaks`, {
      headers: getHeaders()
    });
    return res.json();
  },

  createOutbreak: async (data) => {
    const res = await fetch(`${API_BASE}/outbreaks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateOutbreak: async (id, data) => {
    const res = await fetch(`${API_BASE}/outbreaks/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  deleteOutbreak: async (id) => {
    const res = await fetch(`${API_BASE}/outbreaks/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // Digital Referrals
  createReferral: async (referralData) => {
    const res = await fetch(`${API_BASE}/referrals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(referralData)
    });
    return res.json();
  },

  getReferrals: async () => {
    const res = await fetch(`${API_BASE}/referrals`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getReferralByCode: async (code) => {
    const res = await fetch(`${API_BASE}/referrals/${code}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  updateReferralStatus: async (id, updatePayload) => {
    const res = await fetch(`${API_BASE}/referrals/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updatePayload)
    });
    return res.json();
  },

  // Analytics & CMO Dashboard
  getDashboardAnalytics: async () => {
    const res = await fetch(`${API_BASE}/analytics/dashboard`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Doctor Panel & Profile Management
  getDoctorProfile: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_BASE}/doctor/profile?${query}` : `${API_BASE}/doctor/profile`;
    const res = await fetch(url, { headers: getHeaders() });
    return res.json();
  },

  updateDoctorProfile: async (data) => {
    const res = await fetch(`${API_BASE}/doctor/profile`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  lookupDoctorByPhone: async (phone) => {
    const res = await fetch(`${API_BASE}/doctor/lookup-phone/${encodeURIComponent(phone)}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  lookupPatientByPhone: async (phone) => {
    const res = await fetch(`${API_BASE}/doctor/patient-phone/${encodeURIComponent(phone)}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  sendDoctorEmailOtp: async (email) => {
    const res = await fetch(`${API_BASE}/doctor/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  verifyDoctorEmailOtp: async (email, otp) => {
    const res = await fetch(`${API_BASE}/doctor/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    return res.json();
  },

  // Real Google OAuth — sends Google ID token to backend for verification
  googleAuth: async (credential, role = 'patient') => {
    const res = await fetch(`${API_BASE}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, role })
    });
    return res.json();
  },

  doctorGoogleLogin: async (payload) => {
    const res = await fetch(`${API_BASE}/doctor/google-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },


  // Patient Medical History, Profile & Access Logs
  getPatientHistory: async (id, doctorName = '', doctorId = '') => {
    const params = new URLSearchParams();
    if (doctorName) params.append('doctorName', doctorName);
    if (doctorId) params.append('doctorId', doctorId);
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/doctor/patient-history/${encodeURIComponent(id)}${query}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  addPatientMedicalHistory: async (id, data) => {
    const res = await fetch(`${API_BASE}/doctor/patient-history/${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updatePatientProfile: async (id, data) => {
    const targetId = id || (data && (data.id || data._id || data.phone)) || 'patient';
    const res = await fetch(`${API_BASE}/doctor/patient-profile/${encodeURIComponent(targetId)}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Doctor Follow-Up Reminders (e.g. Following Day checkup)
  addFollowUpReminder: async (data) => {
    const res = await fetch(`${API_BASE}/doctor/reminder`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getDoctorReminders: async () => {
    const res = await fetch(`${API_BASE}/doctor/reminders`, {
      headers: getHeaders()
    });
    return res.json();
  },

  updateReminderStatus: async (id, status = 'COMPLETED') => {
    const res = await fetch(`${API_BASE}/doctor/reminder/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return res.json();
  },

  // Step 1: Doctor clicks "Mark Done" → OTP sent to patient's email
  sendFollowUpOtp: async (data) => {
    const res = await fetch(`${API_BASE}/doctor/reminder/send-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Step 2: Doctor enters OTP received from patient → follow-up marked COMPLETED
  verifyFollowUpOtp: async (data) => {
    const res = await fetch(`${API_BASE}/doctor/reminder/verify-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Doctor Leave Form & Schedule Management
  submitDoctorLeave: async (data) => {
    const res = await fetch(`${API_BASE}/doctor/leave`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getDoctorScheduleAndLeaves: async () => {
    const res = await fetch(`${API_BASE}/doctor/schedule-leaves`, {
      headers: getHeaders()
    });
    return res.json();
  },

  updateDoctorSchedule: async (data) => {
    const res = await fetch(`${API_BASE}/doctor/schedule`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Patient / Citizen Self-Profile
  getMyPatientProfile: async () => {
    const res = await fetch(`${API_BASE}/patient/profile`, {
      headers: getHeaders()
    });
    return res.json();
  },

  updateMyPatientProfile: async (data) => {
    const res = await fetch(`${API_BASE}/patient/profile`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Patient Profile OTP — auto-fetches email from profile, no manual input needed
  sendPatientProfileOtp: async () => {
    const res = await fetch(`${API_BASE}/patient/send-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({})
    });
    return res.json();
  },

  verifyPatientProfileOtp: async (otp) => {
    const res = await fetch(`${API_BASE}/patient/verify-otp`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ otp })
    });
    return res.json();
  },

  // Emergency Blood Bank & Donation NGO Finder
  getBloodBanks: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/blood-banks${query ? `?${query}` : ''}`, {
      headers: getHeaders()
    });
    return safeJson(res);
  },

  createBloodRequest: async (data) => {
    const res = await fetch(`${API_BASE}/blood-request`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return safeJson(res);
  },

  // 14. Unified Patient Identification & Search (Mobile, SSC, ID, QR)
  searchPatientByMobile: async (phone) => {
    const res = await fetch(`${API_BASE}/patients/search/mobile`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ phone })
    });
    return res.json();
  },

  searchPatientBySsc: async (sscCode) => {
    const res = await fetch(`${API_BASE}/patients/search/ssc`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ sscCode })
    });
    return res.json();
  },

  searchPatientByClient: async (clientId) => {
    const res = await fetch(`${API_BASE}/patients/search/client`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ clientId })
    });
    return res.json();
  },

  lookupPatientByQr: async (qrData, qrToken, patientId) => {
    const res = await fetch(`${API_BASE}/patients/lookup/qr`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ qrData, qrToken, patientId })
    });
    return res.json();
  },

  getUnifiedPatientProfile: async (id) => {
    const res = await fetch(`${API_BASE}/patients/${encodeURIComponent(id)}/profile`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // 15. Diseases & Recommendation Catalog
  getDiseases: async () => {
    const res = await fetch(`${API_BASE}/diseases`, {
      headers: getHeaders()
    });
    return res.json();
  },

  createDisease: async (data) => {
    const res = await fetch(`${API_BASE}/diseases`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getDiseaseMedicines: async (diseaseId) => {
    const res = await fetch(`${API_BASE}/diseases/${encodeURIComponent(diseaseId)}/medicines`, {
      headers: getHeaders()
    });
    return res.json();
  },

  linkDiseaseMedicine: async (diseaseId, data) => {
    const res = await fetch(`${API_BASE}/diseases/${encodeURIComponent(diseaseId)}/medicines`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // 16. Prescriptions Database
  createPrescription: async (data) => {
    const res = await fetch(`${API_BASE}/prescriptions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getPrescriptions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/prescriptions${query ? `?${query}` : ''}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getPrescriptionById: async (id) => {
    const res = await fetch(`${API_BASE}/prescriptions/${encodeURIComponent(id)}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getPatientPrescriptions: async (patientId) => {
    const res = await fetch(`${API_BASE}/patients/${encodeURIComponent(patientId)}/prescriptions`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // 17. Medicine Stock Management & Dispensing
  getStock: async () => {
    const res = await fetch(`${API_BASE}/stock`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getStockDashboardMetrics: async () => {
    const res = await fetch(`${API_BASE}/stock/dashboard`, {
      headers: getHeaders()
    });
    return res.json();
  },

  stockIn: async (data) => {
    const res = await fetch(`${API_BASE}/stock/in`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  stockAdjustment: async (data) => {
    const res = await fetch(`${API_BASE}/stock/adjustment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getStockTransactions: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/stock/history${query ? `?${query}` : ''}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getMedicineUsage: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/stock/usage${query ? `?${query}` : ''}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  dispensePrescription: async (prescriptionId, payload) => {
    const res = await fetch(`${API_BASE}/prescriptions/${encodeURIComponent(prescriptionId)}/dispense`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  // 18. District Admin Stock Analytics & Audit Logs
  getDistrictStockAnalytics: async () => {
    const res = await fetch(`${API_BASE}/analytics/stock`, {
      headers: getHeaders()
    });
    return res.json();
  },

  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/analytics/audit-logs${query ? `?${query}` : ''}`, {
      headers: getHeaders()
    });
    return res.json();
  }
};


