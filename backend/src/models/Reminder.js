import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['medicine', 'appointment', 'document'], required: true },
  title: { type: String, required: true },
  details: { type: String, default: '' },
  dueDate: { type: Date, required: true },
  dueTime: { type: String, default: '' },
  status: { type: String, enum: ['active', 'completed', 'dismissed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Reminder = mongoose.model('Reminder', reminderSchema);
export default Reminder;
