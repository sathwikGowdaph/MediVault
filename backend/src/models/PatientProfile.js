import mongoose from 'mongoose';

const patientProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.Mixed, required: true, index: true },
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date },
  gender: { type: String },
  bloodGroup: { type: String },
  height: { type: Number },
  weight: { type: Number },
  phone: { type: String },
  address: { type: String },
  emergencyInfo: { type: String },
  allergies: [{ type: String }],
  chronicDiseases: [{ type: String }],
  currentMedications: [{ type: String }],
  surgeries: [{ type: String }],
  vaccinations: [{ type: String }],
  medicalConditions: [{ type: String }],
  familyHistory: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PatientProfile = mongoose.model('PatientProfile', patientProfileSchema);
export default PatientProfile;
