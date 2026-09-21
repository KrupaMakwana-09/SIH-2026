/**
 * Offline-First Storage & Network Queue Manager for ASHA field health workers.
 * Manages local queue, auto-sync when online, and formats SMS/IVR fallback payloads.
 */

const STORAGE_KEY = 'gramin_arogya_offline_queue';
const CACHED_FACILITIES_KEY = 'gramin_arogya_cached_facilities';

export const getOfflineQueue = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to read offline queue:', e);
    return [];
  }
};

export const saveToOfflineQueue = (patientRecord) => {
  try {
    const queue = getOfflineQueue();
    const itemWithMeta = {
      ...patientRecord,
      tempId: `OFFLINE-${Date.now()}`,
      queuedAt: new Date().toISOString(),
      syncStatus: 'PENDING_OFFLINE'
    };
    queue.unshift(itemWithMeta);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return itemWithMeta;
  } catch (e) {
    console.error('Failed to queue offline record:', e);
    return null;
  }
};

export const clearOfflineQueue = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const removeQueuedItem = (tempId) => {
  const queue = getOfflineQueue();
  const filtered = queue.filter(item => item.tempId !== tempId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

/**
 * Formats structured SMS / USSD string for zero-internet feature phones
 * Format: GA#NAME#AGE#GENDER#COMPLAINT#BP#SPO2#RISK
 */
export const formatSmsPayload = (patient) => {
  const name = (patient.name || 'PATIENT').toUpperCase().slice(0, 16);
  const age = patient.age || '30';
  const gen = (patient.gender || 'F')[0];
  const complaint = (patient.chiefComplaint || 'FEVER').slice(0, 30);
  const bp = patient.vitals?.bp || '120/80';
  const spo2 = patient.vitals?.spo2 || '98';
  const risk = patient.riskLevel || 'MOD';

  return `GA*${name}*${age}${gen}*${bp}*${spo2}*${risk}*${complaint}#`;
};

export const cacheFacilities = (facilities) => {
  try {
    localStorage.setItem(CACHED_FACILITIES_KEY, JSON.stringify(facilities));
  } catch (e) {}
};

export const getCachedFacilities = () => {
  try {
    const raw = localStorage.getItem(CACHED_FACILITIES_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};
