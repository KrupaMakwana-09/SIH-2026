import {
  Activity,
  HeartPulse,
  Share2,
  Stethoscope,
  BarChart3,
  ShieldCheck,
  Bell,
  Calendar,
  FileText,
  UserCheck,
  Sparkles,
  Phone,
  Pill,
  PackageCheck,
  History,
  TrendingUp,
  PlusCircle
} from 'lucide-react';

/**
 * Role-based panel configuration for GraminArogya.
 * Ensures strict panel isolation: whichever system role logs in,
 * ONLY their relevant panel(s) are accessible and visible in navigation.
 */
export const ROLE_NAV_ITEMS = {
  // Doctor: has their full professional desk modules directly in the navbar
  doctor: [
    {
      id: 'history',
      label: 'Patient History',
      description: 'Medical Records & Timeline',
      icon: Stethoscope,
      color: '#059669',
      activeBg: 'linear-gradient(135deg, #059669, #047857)'
    },
    {
      id: 'reminders',
      label: 'Reminders',
      description: 'Follow-ups & OTP Confirmation',
      icon: Bell,
      color: '#d97706',
      activeBg: 'linear-gradient(135deg, #d97706, #b45309)',
      badgeKey: 'reminders'
    },
    {
      id: 'leaveSchedule',
      label: 'Leave & Schedule',
      description: 'Duty Roster & Time-off',
      icon: Calendar,
      color: '#7c3aed',
      activeBg: 'linear-gradient(135deg, #7c3aed, #6d28d9)'
    },
    {
      id: 'prescriptions',
      label: 'Rx Pad & Print',
      description: 'Clinical Prescriptions',
      icon: FileText,
      color: '#0ea5e9',
      activeBg: 'linear-gradient(135deg, #0ea5e9, #0284c7)'
    },
    {
      id: 'branding',
      label: 'Custom Branding',
      description: 'Header, Logo & Letterhead',
      icon: Sparkles,
      color: '#ec4899',
      activeBg: 'linear-gradient(135deg, #ec4899, #db2777)'
    },
    {
      id: 'phoneFetch',
      label: 'Mobile Lookup',
      description: 'Search Records by Phone',
      icon: Phone,
      color: '#475569',
      activeBg: 'linear-gradient(135deg, #475569, #334155)'
    },
    {
      id: 'profile',
      label: 'My Profile',
      description: 'Doctor Profile & Settings',
      icon: UserCheck,
      color: '#059669',
      activeBg: 'linear-gradient(135deg, #059669, #047857)'
    }
  ],

  // ASHA: field intake, health assessments, smart routing, referrals
  asha: [
    { id: 'staff', label: 'ASHA Field Portal', description: 'Patient Intake & Triage', icon: Activity, color: '#059669' },
    { id: 'routing', label: 'Smart Routing', description: 'Emergency & Facility Routing', icon: HeartPulse, color: '#10b981' },
    { id: 'referrals', label: 'Referral Hub', description: 'Referral Slips & Tracking', icon: Share2, color: '#047857' }
  ],

  // Staff: same as ASHA portal
  staff: [
    { id: 'staff', label: 'Field Portal', description: 'Patient Intake & Triage', icon: Activity, color: '#059669' },
    { id: 'routing', label: 'Smart Routing', description: 'Emergency & Facility Routing', icon: HeartPulse, color: '#10b981' },
    { id: 'referrals', label: 'Referral Hub', description: 'Referral Slips & Tracking', icon: Share2, color: '#047857' }
  ],

  // CMO: district disease intelligence, health facility routing & referral oversight
  cmo: [
    { id: 'gov', label: 'Gov & CMO Intel', description: 'Epidemic & Facility Intel', icon: BarChart3, color: '#7c3aed' },
    { id: 'routing', label: 'Facility Routing', description: 'Bed & Resource Allocation', icon: HeartPulse, color: '#10b981' },
    { id: 'referrals', label: 'Referral Intelligence', description: 'District Patient Transfers', icon: Share2, color: '#047857' }
  ],

  // System Admin: comprehensive system management & oversight of all modules
  admin: [
    { id: 'admin', label: 'Admin Portal', description: 'System Management', icon: ShieldCheck, color: '#dc2626' },
    { id: 'history', label: 'Doctor Panel', description: 'Clinical Desks', icon: Stethoscope, color: '#0284c7' },
    { id: 'staff', label: 'ASHA Field Portal', description: 'ASHA Intake', icon: Activity, color: '#059669' },
    { id: 'routing', label: 'Smart Routing', description: 'Routing Engine', icon: HeartPulse, color: '#10b981' },
    { id: 'referrals', label: 'Referral Hub', description: 'Digital Referrals', icon: Share2, color: '#047857' },
    { id: 'gov', label: 'Gov & CMO Intel', description: 'Health Analytics', icon: BarChart3, color: '#7c3aed' }
  ],

  // Pharmacist: medicine dispensing, stock management, inventory, transactions
  pharmacist: [
    {
      id: 'pharmacy',
      label: 'Dispense Rx',
      description: 'Prescription Dispensing',
      icon: Pill,
      color: '#7c3aed',
      activeBg: 'linear-gradient(135deg, #7c3aed, #6d28d9)'
    },
    {
      id: 'pharmacyInventory',
      label: 'Inventory',
      description: 'Medicine Stock & Status',
      icon: PackageCheck,
      color: '#0ea5e9',
      activeBg: 'linear-gradient(135deg, #0ea5e9, #0284c7)'
    },
    {
      id: 'pharmacyStockIn',
      label: 'Stock IN',
      description: 'Receive New Supplies',
      icon: PlusCircle,
      color: '#059669',
      activeBg: 'linear-gradient(135deg, #059669, #047857)'
    },
    {
      id: 'pharmacyTransactions',
      label: 'Transactions',
      description: 'Stock Movement Logs',
      icon: History,
      color: '#d97706',
      activeBg: 'linear-gradient(135deg, #d97706, #b45309)'
    },
    {
      id: 'pharmacyUsage',
      label: 'Usage Report',
      description: 'Medicine Consumption',
      icon: TrendingUp,
      color: '#dc2626',
      activeBg: 'linear-gradient(135deg, #dc2626, #b91c1c)'
    }
  ],

  // Citizen / Patient: public healthcare navigation + own profile
  citizen: [
    { id: 'routing', label: 'Find Care & Route', description: 'Nearest PHC/CHC Clinics', icon: HeartPulse, color: '#10b981' },
    { id: 'patientProfile', label: 'My Profile', description: 'Health Records & Details', icon: UserCheck, color: '#d97706' }
  ],
  patient: [
    { id: 'routing', label: 'Find Care & Route', description: 'Nearest PHC/CHC Clinics', icon: HeartPulse, color: '#10b981' },
    { id: 'patientProfile', label: 'My Profile', description: 'Health Records & Details', icon: UserCheck, color: '#d97706' }
  ]
};

export const getRoleDefaultTab = (role) => {
  switch (role) {
    case 'doctor':
      return 'history';
    case 'admin':
      return 'admin';
    case 'patient':
    case 'citizen':
      return 'routing';
    case 'pharmacist':
      return 'pharmacy';
    case 'staff':
    case 'asha':
    default:
      return 'staff';
  }
};

export const isTabAllowedForRole = (tabId, role) => {
  if (!role) return false;
  // Admin always has full access
  if (role === 'admin') return true;
  if (role === 'doctor' && (tabId === 'doctor' || ['history', 'reminders', 'leaveSchedule', 'prescriptions', 'profile', 'branding', 'phoneFetch'].includes(tabId))) return true;
  if (['patient', 'citizen'].includes(role) && (tabId === 'patientProfile' || tabId === 'PatientProfile' || tabId === 'routing')) return true;
  const items = ROLE_NAV_ITEMS[role] || (['patient', 'citizen'].includes(role) ? ROLE_NAV_ITEMS.citizen : []);
  return items.some(item => item.id === tabId);
};


