import mongoose from 'mongoose';

const emergencyAccessSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'revoked', 'expired'], default: 'active' },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  lastAccessedAt: { type: Date }
});

const EmergencyAccess = mongoose.model('EmergencyAccess', emergencyAccessSchema);
export default EmergencyAccess;
