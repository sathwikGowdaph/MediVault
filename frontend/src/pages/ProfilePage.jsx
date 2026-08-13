import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { User, HeartPulse, ShieldAlert, Plus, Trash2, Edit3, Save, Phone, AlertCircle } from 'lucide-react';
import Modal from '../components/Modal';
import SkeletonCard from '../components/SkeletonCard';

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    height: '',
    weight: '',
    phone: '',
    address: '',
    emergencyInfo: '',
    allergies: [],
    chronicDiseases: [],
    currentMedications: [],
    surgeries: [],
    vaccinations: [],
    medicalConditions: [],
    familyHistory: []
  });

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Modal State for Emergency Contact
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    relationship: '',
    phone: '',
    email: '',
    priority: 'Primary'
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/api/patient/profile');
      if (data.profile) {
        setProfile({
          ...data.profile,
          allergies: data.profile.allergies || [],
          chronicDiseases: data.profile.chronicDiseases || [],
          currentMedications: data.profile.currentMedications || [],
          surgeries: data.profile.surgeries || [],
          vaccinations: data.profile.vaccinations || [],
          medicalConditions: data.profile.medicalConditions || [],
          familyHistory: data.profile.familyHistory || []
        });
      }
      setContacts(data.contacts || []);
    } catch (error) {
      toast.error('Unable to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const payload = {
        ...profile,
        height: profile.height ? Number(profile.height) : undefined,
        weight: profile.weight ? Number(profile.weight) : undefined,
        dateOfBirth: profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString() : null
      };

      const { data } = await api.put('/api/patient/profile', payload);
      toast.success('Medical profile updated successfully');
      setProfile(prev => ({ ...prev, ...data.profile }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Tag Array inputs (allergies, medications, etc.)
  const handleTagInput = (field, valueStr) => {
    const list = valueStr.split(',').map(s => s.trim()).filter(Boolean);
    setProfile(prev => ({ ...prev, [field]: list }));
  };

  // Open Contact Modal for Add or Edit
  const openContactModal = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setContactForm({
        name: contact.name || '',
        relationship: contact.relationship || '',
        phone: contact.phone || '',
        email: contact.email || '',
        priority: contact.priority || 'Primary'
      });
    } else {
      setEditingContact(null);
      setContactForm({ name: '', relationship: '', phone: '', email: '', priority: 'Primary' });
    }
    setContactModalOpen(true);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        const { data } = await api.put(`/api/patient/contacts/${editingContact._id}`, contactForm);
        toast.success('Contact updated');
        setContacts(contacts.map(c => (c._id === editingContact._id ? data.contact : c)));
      } else {
        const { data } = await api.post('/api/patient/contacts', contactForm);
        toast.success('Contact added');
        setContacts([data.contact, ...contacts]);
      }
      setContactModalOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save contact');
    }
  };

  const handleContactDelete = async (id) => {
    if (!window.confirm('Remove this emergency contact?')) return;
    try {
      await api.delete(`/api/patient/contacts/${id}`);
      toast.success('Contact removed');
      setContacts(contacts.filter(c => c._id !== id));
    } catch (error) {
      toast.error('Failed to remove contact');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard lines={6} />
        <SkeletonCard lines={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Form Container */}
      <form onSubmit={handleProfileSave} className="space-y-6">
        {/* Personal & Vitals Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <User className="text-brand-600" size={22} />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Personal & Vital Medical Details</h2>
              <p className="text-xs text-slate-500">Core personal metadata for your emergency medical profile</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 text-sm focus:border-brand-500 focus:outline-none"
                placeholder="Full Name"
                value={profile.fullName || ''}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Date of Birth</label>
              <input
                type="date"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 text-sm focus:border-brand-500 focus:outline-none"
                value={profile.dateOfBirth ? new Date(profile.dateOfBirth).toISOString().slice(0, 10) : ''}
                onChange={(e) => setProfile({ ...profile, dateOfBirth: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Gender</label>
              <select
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 text-sm focus:border-brand-500 focus:outline-none bg-white"
                value={profile.gender || ''}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Blood Group</label>
              <select
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 text-sm focus:border-brand-500 focus:outline-none bg-white font-bold text-brand-700"
                value={profile.bloodGroup || ''}
                onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
              >
                <option value="">Select Blood Group</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Height (cm)</label>
              <input
                type="number"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 text-sm focus:border-brand-500 focus:outline-none"
                placeholder="e.g. 175"
                value={profile.height || ''}
                onChange={(e) => setProfile({ ...profile, height: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Weight (kg)</label>
              <input
                type="number"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 text-sm focus:border-brand-500 focus:outline-none"
                placeholder="e.g. 70"
                value={profile.weight || ''}
                onChange={(e) => setProfile({ ...profile, weight: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Phone Number</label>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 text-sm focus:border-brand-500 focus:outline-none"
                placeholder="+91 9876543210"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Address</label>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 text-sm focus:border-brand-500 focus:outline-none"
                placeholder="City, Country"
                value={profile.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Medical History & Conditions Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <HeartPulse className="text-brand-600" size={22} />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Medical History & Allergies</h2>
              <p className="text-xs text-slate-500">Comma-separated entries (e.g. Penicillin, Asthma)</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">
                ⚠️ Allergies (Comma separated)
              </label>
              <textarea
                className="w-full rounded-2xl border border-red-200 bg-red-50/30 px-4 py-3 text-slate-900 text-sm focus:border-red-500 focus:outline-none h-24"
                placeholder="e.g. Penicillin, Peanuts, Sulfa drugs"
                value={profile.allergies?.join(', ') || ''}
                onChange={(e) => handleTagInput('allergies', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
                Chronic Diseases / Conditions
              </label>
              <textarea
                className="w-full rounded-2xl border border-amber-200 bg-amber-50/30 px-4 py-3 text-slate-900 text-sm focus:border-amber-500 focus:outline-none h-24"
                placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                value={profile.chronicDiseases?.join(', ') || ''}
                onChange={(e) => handleTagInput('chronicDiseases', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Current Medications
              </label>
              <textarea
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 text-sm focus:border-brand-500 focus:outline-none h-24"
                placeholder="e.g. Metformin 500mg daily, Amlodipine 5mg"
                value={profile.currentMedications?.join(', ') || ''}
                onChange={(e) => handleTagInput('currentMedications', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Important Emergency Warning Note
              </label>
              <textarea
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900 text-sm focus:border-brand-500 focus:outline-none h-24"
                placeholder="e.g. Pacemaker implanted in 2022. Contact Dr. Sharma immediately."
                value={profile.emergencyInfo || ''}
                onChange={(e) => setProfile({ ...profile, emergencyInfo: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save size={18} />
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </div>
      </form>

      {/* Emergency Contacts Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={22} />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Emergency Contacts</h2>
              <p className="text-xs text-slate-500">People to contact during medical emergencies</p>
            </div>
          </div>

          <button
            onClick={() => openContactModal(null)}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            <Plus size={16} /> Add Contact
          </button>
        </div>

        {contacts.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No emergency contacts added yet. Click "Add Contact" above.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {contacts.map((contact) => (
              <div key={contact._id} className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    {contact.name}
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${contact.priority === 'Primary' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
                      {contact.priority || 'Contact'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                    <span>{contact.relationship}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700 flex items-center gap-1">
                      <Phone size={12} /> {contact.phone}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openContactModal(contact)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                    title="Edit contact"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleContactDelete(contact._id)}
                    className="rounded-full p-2 text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                    title="Delete contact"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Modal */}
      <Modal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        title={editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
      >
        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Contact Name</label>
            <input
              className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"
              placeholder="e.g. Jane Doe"
              value={contactForm.name}
              onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Relationship</label>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"
                placeholder="e.g. Spouse / Mother"
                value={contactForm.relationship}
                onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Priority Level</label>
              <select
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm bg-white"
                value={contactForm.priority}
                onChange={(e) => setContactForm({ ...contactForm, priority: e.target.value })}
              >
                <option value="Primary">Primary</option>
                <option value="Secondary">Secondary</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Phone Number</label>
              <input
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"
                placeholder="+91 9876543210"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Email (Optional)</label>
              <input
                type="email"
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"
                placeholder="jane@example.com"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setContactModalOpen(false)}
              className="rounded-full px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-full bg-brand-500 px-6 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
            >
              {editingContact ? 'Update Contact' : 'Add Contact'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
