import mongoose from 'mongoose';

const medicalRecordSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, required: true, enum: ['Prescription', 'Lab Report', 'X-Ray', 'MRI Report', 'CT Report', 'Discharge Summary', 'Insurance Document', 'Medical Image', 'Other'], index: true },
  doctor: { type: String, default: '' },
  hospital: { type: String, default: '' },
  recordDate: { type: Date, default: Date.now, index: true },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  cloudinaryPublicId: { type: String, default: null },
  cloudinaryUrl: { type: String, default: null },
  cloudinaryResourceType: { type: String, default: 'image' },
  cloudinaryFormat: { type: String, default: null },
  storageProvider: { type: String, enum: ['cloudinary', 'local'], default: 'cloudinary' },
  aiStatus: { type: String, default: 'pending' },
  aiSummary: { type: String, default: '' },
  extractedText: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
export default MedicalRecord;
