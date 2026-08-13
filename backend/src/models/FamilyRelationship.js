import mongoose from 'mongoose';

const familyRelationshipSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  familyMember: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  permissions: {
    viewProfile: { type: Boolean, default: true },
    viewRecords: { type: Boolean, default: true },
    manageRecords: { type: Boolean, default: false },
    viewEmergency: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const FamilyRelationship = mongoose.model('FamilyRelationship', familyRelationshipSchema);
export default FamilyRelationship;
