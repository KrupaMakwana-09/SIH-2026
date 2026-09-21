const mongoose = require('mongoose');

const DoctorProfileSchema = new mongoose.Schema({
  doctorId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility' }, // Link to working facility
  doctorName: { type: String, required: true },
  specialization: { type: String, default: '' },
  qualification: { type: String, default: '' },
  phone: { type: String, required: true, index: true },
  email: { type: String, default: '', index: true },
  registrationNumber: { type: String, default: '' }, // Medical Council / License No.
  medicalCouncil: { type: String, default: '' },
  experienceYears: { type: Number, default: 0 },
  profilePhoto: { type: String, default: '' }, // Base64 or image URL
  clinicName: { type: String, default: '' },
  clinicAddress: { type: String, default: '' },
  consultationHours: { type: String, default: '' },
  consultationFee: { type: Number, default: 0 },
  bio: { type: String, default: '' },
  
  // Custom Branding Settings (Logo, Header, Footer, Stamp)
  branding: {
    logo: { type: String, default: '' }, // Clinic / Hospital Logo
    headerTitle: { type: String, default: '' },
    headerSubtitle: { type: String, default: '' },
    headerContact: { type: String, default: '' },
    headerBgColor: { type: String, default: '#064e3b' },
    footerText: { type: String, default: '' },
    signatureImage: { type: String, default: '' }, // Digital Signature
    themeColor: { type: String, default: '#059669' },
    showWatermark: { type: Boolean, default: true }
  },

  // Doctor OPD Schedule Management
  schedule: {
    opdDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    startTime: { type: String, default: '09:00 AM' },
    endTime: { type: String, default: '05:00 PM' },
    roomNumber: { type: String, default: 'Room 104, OPD Block' },
    maxPatientsPerDay: { type: Number, default: 40 },
    dutyStatus: {
      type: String,
      enum: ['AVAILABLE', 'ON_LEAVE', 'EMERGENCY_DUTY', 'IN_SURGERY'],
      default: 'AVAILABLE'
    }
  },

  // Doctor Leave Management (Leave Form records)
  leaves: [{
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    leaveType: {
      type: String,
      enum: ['CASUAL', 'MEDICAL', 'CONFERENCE', 'DUTY_OFF', 'EMERGENCY'],
      default: 'CASUAL'
    },
    reason: { type: String, required: true },
    substituteDoctor: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    status: {
      type: String,
      enum: ['APPROVED', 'PENDING', 'CANCELLED'],
      default: 'APPROVED'
    },
    appliedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.models.DoctorProfile || mongoose.model('DoctorProfile', DoctorProfileSchema);
