import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { BellRing, Plus, Calendar, Clock, CheckCircle2, Trash2, Edit3, Pill, Stethoscope, FileText, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [form, setForm] = useState({
    type: 'medicine',
    title: '',
    details: '',
    dueDate: '',
    dueTime: ''
  });

  const fetchReminders = async () => {
    try {
      const { data } = await api.get('/api/reminders');
      setReminders(data.reminders || []);
    } catch (error) {
      toast.error('Unable to load reminders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const openModal = (reminder = null) => {
    if (reminder) {
      setEditingReminder(reminder);
      setForm({
        type: reminder.type || 'medicine',
        title: reminder.title || '',
        details: reminder.details || '',
        dueDate: reminder.dueDate ? new Date(reminder.dueDate).toISOString().slice(0, 10) : '',
        dueTime: reminder.dueTime || ''
      });
    } else {
      setEditingReminder(null);
      setForm({ type: 'medicine', title: '', details: '', dueDate: '', dueTime: '' });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingReminder) {
        await api.put(`/api/reminders/${editingReminder._id}`, form);
        toast.success('Reminder updated');
      } else {
        await api.post('/api/reminders', form);
        toast.success('Reminder created');
      }
      setModalOpen(false);
      fetchReminders();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save reminder');
    }
  };

  const handleToggleStatus = async (reminder) => {
    const nextStatus = reminder.status === 'completed' ? 'active' : 'completed';
    try {
      await api.put(`/api/reminders/${reminder._id}`, { status: nextStatus });
      toast.success(`Reminder marked as ${nextStatus}`);
      fetchReminders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reminder?')) return;
    try {
      await api.delete(`/api/reminders/${id}`);
      toast.success('Reminder deleted');
      fetchReminders();
    } catch (error) {
      toast.error('Failed to delete reminder');
    }
  };

  if (loading) return <SkeletonCard lines={5} />;

  const typeIcons = {
    medicine: Pill,
    appointment: Stethoscope,
    document: FileText
  };

  const typeBadges = {
    medicine: 'bg-emerald-100 text-emerald-800',
    appointment: 'bg-blue-100 text-blue-800',
    document: 'bg-purple-100 text-purple-800'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellRing className="text-brand-600" size={24} />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Medical Reminders & Alerts</h2>
            <p className="text-xs text-slate-500">Track medication schedules, doctor appointments & document renewals</p>
          </div>
        </div>

        <button
          onClick={() => openModal(null)}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Reminder
        </button>
      </div>

      {/* Reminders List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {reminders.length === 0 ? (
          <EmptyState
            icon={BellRing}
            title="No reminders set"
            description="Keep track of your medicine dosages and upcoming medical visits."
            action={
              <button onClick={() => openModal(null)} className="rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-white">
                Create First Reminder
              </button>
            }
          />
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const Icon = typeIcons[reminder.type] || BellRing;
              const isCompleted = reminder.status === 'completed';
              const isOverdue = !isCompleted && new Date(reminder.dueDate) < new Date();

              return (
                <div
                  key={reminder._id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
                    isCompleted ? 'bg-slate-50 border-slate-200 opacity-65' :
                    isOverdue ? 'bg-red-50/40 border-red-200' : 'bg-white border-slate-200 hover:border-brand-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleStatus(reminder)}
                      className={`mt-0.5 rounded-full p-1 transition-colors ${
                        isCompleted ? 'text-emerald-600 bg-emerald-100' : 'text-slate-300 hover:text-slate-500'
                      }`}
                      title={isCompleted ? 'Mark Active' : 'Mark Complete'}
                    >
                      <CheckCircle2 size={22} />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${isCompleted ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {reminder.title}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${typeBadges[reminder.type]}`}>
                          {reminder.type}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                            <AlertCircle size={10} /> Overdue
                          </span>
                        )}
                      </div>

                      {reminder.details && (
                        <p className="text-xs text-slate-600 mt-1">{reminder.details}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} /> {new Date(reminder.dueDate).toLocaleDateString()}
                        </span>
                        {reminder.dueTime && (
                          <span className="flex items-center gap-1">
                            <Clock size={13} /> {reminder.dueTime}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => openModal(reminder)}
                      className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(reminder._id)}
                      className="rounded-full p-2 text-slate-400 hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reminder Add/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingReminder ? 'Edit Reminder' : 'Add New Reminder'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Title</label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"
              placeholder="e.g. Take Metformin 500mg"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Reminder Category</label>
              <select
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm bg-white"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="medicine">Medicine Dosage</option>
                <option value="appointment">Doctor Appointment</option>
                <option value="document">Document Expiry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Due Date</label>
              <input
                type="date"
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Time (Optional)</label>
            <input
              type="time"
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"
              value={form.dueTime}
              onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Details / Dosage Notes</label>
            <textarea
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm h-20"
              placeholder="e.g. Take with food after breakfast."
              value={form.details}
              onChange={(e) => setForm({ ...form, details: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-full px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-brand-500 px-6 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              {editingReminder ? 'Save Changes' : 'Create Reminder'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
