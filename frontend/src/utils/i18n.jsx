import React, { createContext, useContext, useState, useEffect } from 'react';

export const translations = {
  en: {
    // Nav & System
    brandName: 'SwasthyaSetu',
    subtitle: 'National Rural Health Access & Care Continuity Platform',
    patientLookup: 'Patient Lookup',
    scanQr: 'Scan Patient QR',
    myHealthQr: 'My Health QR',
    mobileNumber: 'Mobile Number',
    sscCode: 'SSC Code (Social Security Card)',
    clientId: 'Patient / Client ID',
    searchPatient: 'Search Patient',
    showQr: 'Show QR Code',
    downloadQr: 'Download / Print QR',
    language: 'Language',

    // Clinical & Disease
    diagnosis: 'Clinical Diagnosis',
    prescriptions: 'Prescriptions',
    prescriptionPad: 'Prescription Pad',
    disease: 'Disease',
    selectDisease: 'Select / Search Disease',
    relatedMedicines: 'Suggested / Related Medicines',
    dosage: 'Dosage',
    frequency: 'Frequency',
    duration: 'Duration',
    instructions: 'Instructions',
    clinicalNotes: 'Clinical Notes',
    savePrescription: 'Save & Issue Prescription',
    medicalHistory: 'Medical History',
    doctorVisits: 'Doctor Visits',
    followUpDate: 'Follow-up Date',

    // Pharmacy & Stock
    medicine: 'Medicine',
    stock: 'Stock Inventory',
    dispensing: 'Medicine Dispensing',
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    expired: 'Expired',
    expiringSoon: 'Expiring Soon',
    insufficientStock: 'Insufficient stock available',
    quantity: 'Quantity',
    batchNumber: 'Batch Number',
    expiryDate: 'Expiry Date',
    manufacturer: 'Manufacturer',
    dispenseNow: 'Confirm & Dispense',
    partiallyDispensed: 'Partially Dispensed',
    fullyDispensed: 'Fully Dispensed',
    prescribed: 'Prescribed',
    stockIn: 'Stock IN (Receive)',
    stockOut: 'Stock OUT',
    stockAdjustment: 'Stock Adjustment',
    transactions: 'Stock Transactions',
    dispensingHistory: 'Dispensing History',

    // Alerts & Errors
    patientNotFound: 'Patient not found.',
    multiplePatientsFound: 'Multiple patients found with this mobile number. Please select the correct patient.',
    invalidQr: 'Invalid or expired QR code.',
    unauthorized: 'You are not authorized to access this patient.',
    prescriptionNotFound: 'Prescription not found.',
    alreadyFullyDispensed: 'Prescription has already been fully dispensed.'
  },

  hi: {
    // Nav & System
    brandName: 'स्वास्थ्यसेतु',
    subtitle: 'राष्ट्रीय ग्रामीण स्वास्थ्य एवं देखभाल निरंतरता मंच',
    patientLookup: 'मरीज खोजें (Patient Lookup)',
    scanQr: 'मरीज का QR कोड स्कैन करें',
    myHealthQr: 'मेरा स्वास्थ्य QR (My Health QR)',
    mobileNumber: 'मोबाइल नंबर',
    sscCode: 'एसएससी कोड (सामाजिक सुरक्षा कार्ड)',
    clientId: 'मरीज / क्लाइंट आईडी',
    searchPatient: 'मरीज खोजें',
    showQr: 'QR कोड दिखाएं',
    downloadQr: 'QR डाउनलोड / प्रिंट करें',
    language: 'भाषा',

    // Clinical & Disease
    diagnosis: 'रोग निदान (Diagnosis)',
    prescriptions: 'दवा पर्ची (Prescriptions)',
    prescriptionPad: 'डॉक्टर पर्ची पैड',
    disease: 'बीमारी / रोग',
    selectDisease: 'बीमारी चुनें / खोजें',
    relatedMedicines: 'संबंधित सुझाई गई दवाएं',
    dosage: 'मात्रा (Dosage)',
    frequency: 'लेने का समय (Frequency)',
    duration: 'अवधि (दिन)',
    instructions: 'दवा लेने के निर्देश',
    clinicalNotes: 'चिकित्सकीय टिप्पणी',
    savePrescription: 'पर्ची सुरक्षित करें एवं जारी करें',
    medicalHistory: 'चिकित्सा इतिहास',
    doctorVisits: 'डॉक्टर परामर्श इतिहास',
    followUpDate: 'अगली जांच की तारीख (Follow-up)',

    // Pharmacy & Stock
    medicine: 'दवा (Medicine)',
    stock: 'दवा स्टॉक भंडार',
    dispensing: 'दवा वितरण (Dispensing)',
    inStock: 'पर्याप्त स्टॉक (In Stock)',
    lowStock: 'कम स्टॉक (Low Stock)',
    outOfStock: 'स्टॉक समाप्त (Out of Stock)',
    expired: 'अवधि समाप्त (Expired)',
    expiringSoon: 'शीघ्र समाप्त होने वाली (Expiring Soon)',
    insufficientStock: 'उपलब्ध स्टॉक अपर्याप्त है।',
    quantity: 'संख्या / मात्रा',
    batchNumber: 'बैच नंबर',
    expiryDate: 'समाप्ति तिथि',
    manufacturer: 'निर्माता कंपनी',
    dispenseNow: 'पुष्टि करें और दवा दें',
    partiallyDispensed: 'आंशिक रूप से वितरित (Partially Dispensed)',
    fullyDispensed: 'पूर्णतः वितरित (Fully Dispensed)',
    prescribed: 'निर्धारित (Prescribed)',
    stockIn: 'नया स्टॉक आवक (Stock IN)',
    stockOut: 'दवा निकासी (Stock OUT)',
    stockAdjustment: 'स्टॉक सुधार / समायोजन',
    transactions: 'स्टॉक लेनदेन इतिहास',
    dispensingHistory: 'दवा वितरण इतिहास',

    // Alerts & Errors
    patientNotFound: 'मरीज का रिकॉर्ड नहीं मिला।',
    multiplePatientsFound: 'इस मोबाइल नंबर से कई मरीज मिले। कृपया सही मरीज चुनें।',
    invalidQr: 'अमान्य या समाप्त QR कोड।',
    unauthorized: 'आप इस मरीज के रिकॉर्ड को देखने के लिए अधिकृत नहीं हैं।',
    prescriptionNotFound: 'दवा पर्ची नहीं मिली।',
    alreadyFullyDispensed: 'यह पर्ची पहले ही पूर्णतः वितरित की जा चुकी है।'
  },

  gu: {
    // Nav & System
    brandName: 'સ્વાસ્થ્યસેતુ',
    subtitle: 'રાષ્ટ્રીય ગ્રામીણ આરોગ્ય અને સતત સારવાર મંચ',
    patientLookup: 'દર્દી શોધો (Patient Lookup)',
    scanQr: 'દર્દીનો QR કોડ સ્કેન કરો',
    myHealthQr: 'મારો હેલ્થ QR (My Health QR)',
    mobileNumber: 'મોબાઇલ નંબર',
    sscCode: 'એસએસસી કોડ (સામાજિક સુરક્ષા કાર્ડ)',
    clientId: 'દર્દી / ક્લાયન્ટ આઈડી',
    searchPatient: 'દર્દી શોધો',
    showQr: 'QR કોડ બતાવો',
    downloadQr: 'QR ડાઉનલોડ / પ્રિન્ટ કરો',
    language: 'ભાષા',

    // Clinical & Disease
    diagnosis: 'રોગ નિદાન (Diagnosis)',
    prescriptions: 'દવા ચિઠ્ઠી (Prescriptions)',
    prescriptionPad: 'ડોક્ટર પ્રિસ્ક્રિપ્શન પેડ',
    disease: 'રોગ / બીમારી',
    selectDisease: 'રોગ પસંદ કરો / શોધો',
    relatedMedicines: 'સૂચવેલ સંબંધિત દવાઓ',
    dosage: 'ડોઝ (માત્રા)',
    frequency: 'દિવસમાં કેટલી વાર (Frequency)',
    duration: 'સમયગાળો (દિવસ)',
    instructions: 'દવા લેવાની સૂચનાઓ',
    clinicalNotes: 'ડોક્ટરની નોંધ',
    savePrescription: 'દવા ચિઠ્ઠી સાચવો અને આપો',
    medicalHistory: 'મેડિકલ હિસ્ટ્રી',
    doctorVisits: 'ડોક્ટર મુલાકાત ઇતિહાસ',
    followUpDate: 'આગામી તપાસની તારીખ',

    // Pharmacy & Stock
    medicine: 'દવા (Medicine)',
    stock: 'દવા સ્ટોક ઈન્વેન્ટરી',
    dispensing: 'દવા વિતરણ (Dispensing)',
    inStock: 'પૂરતો સ્ટોક (In Stock)',
    lowStock: 'ઓછો સ્ટોક (Low Stock)',
    outOfStock: 'સ્ટોક ખલાસ (Out of Stock)',
    expired: 'એક્સપાયર થયેલ (Expired)',
    expiringSoon: 'ટૂંક સમયમાં એક્સપાયર (Expiring Soon)',
    insufficientStock: 'પૂરતો સ્ટોક ઉપલબ્ધ નથી.',
    quantity: 'જથ્થો / માત્રા',
    batchNumber: 'બેચ નંબર',
    expiryDate: 'એક્સપાયરી તારીખ',
    manufacturer: 'ઉત્પાદક કંપની',
    dispenseNow: 'પુષ્ટિ કરો અને દવા આપો',
    partiallyDispensed: 'અંશતઃ વિતરિત (Partially Dispensed)',
    fullyDispensed: 'સંપૂર્ણ વિતરિત (Fully Dispensed)',
    prescribed: 'સૂચવેલ (Prescribed)',
    stockIn: 'નવો સ્ટોક આવ્યો (Stock IN)',
    stockOut: 'સ્ટોક આઉટ (Stock OUT)',
    stockAdjustment: 'સ્ટોક સુધારો / એડજસ્ટમેન્ટ',
    transactions: 'સ્ટોક ટ્રાન્ઝેક્શન હિસ્ટ્રી',
    dispensingHistory: 'દવા વપરાશ / વિતરણ હિસ્ટ્રી',

    // Alerts & Errors
    patientNotFound: 'દર્દીનો રેકોર્ડ મળ્યો નથી.',
    multiplePatientsFound: 'આ મોબાઈલ નંબર સાથે એકથી વધુ દર્દીઓ મળ્યા. કૃપા કરીને સાચા દર્દી પસંદ કરો.',
    invalidQr: 'અમાન્ય અથવા અયોગ્ય QR કોડ.',
    unauthorized: 'તમે આ દર્દીની વિગતો જોવા માટે અધિકૃત નથી.',
    prescriptionNotFound: 'પ્રિસ્ક્રિપ્શન મળ્યું નથી.',
    alreadyFullyDispensed: 'આ પ્રિસ્ક્રિપ્શનની તમામ દવાઓ પહેલેથી અપાઈ ચૂકી છે.'
  }
};

const I18nContext = createContext({
  lang: 'en',
  setLang: () => {},
  t: (key) => key
});

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    const saved = localStorage.getItem('swasthyasetu_lang') || localStorage.getItem('gramin_arogya_lang');
    if (saved && ['en', 'hi', 'gu'].includes(saved)) {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang) => {
    setLangState(newLang);
    localStorage.setItem('swasthyasetu_lang', newLang);
  };

  const t = (key) => {
    const dict = translations[lang] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
