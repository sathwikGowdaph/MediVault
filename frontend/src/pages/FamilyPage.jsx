import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Users, Mail, Shield, Trash2, Clock, Check, X, Eye, FileText, HeartPulse, ShieldAlert, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';

export default function FamilyPage() {
  const { user } = useAuth();
  const [relationships, setRelationships] = useState([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);

  // Vault Modal State
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [vaultData, setVaultData] = useState(null);
  const [loadingVault, setLoadingVault] = useState(false);

  const fetchRelationships = async () => {
    try {
      const { data } = await api.get('/api/family');
      setRelationships(data.relationships || []);
    } catch (error) {
      toast.error('Unable to load family relationships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRelationships();
  }, []);

  // Open Family Member Vault
  const handleViewVault = async (relId) => {
    setLoadingVault(true);
    setVaultModalOpen(true);
    try {
      const { data } = await api.get(`/api/family/${relId}/vault`);
      setVaultData(data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load family vault');
      setVaultModalOpen(false);
    } finally {
      setLoadingVault(false);
    }
  };

  // Send Invitation
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    setInviting(true);
    try {
      await api.post('/api/family/invite', { email });
      toast.success(`Invitation sent to ${email}`);
      setEmail('');
      fetchRelationships();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  // Accept Pending Invitation (as family member)
  const handleAccept = async (id) => {
    try {
      await api.put(`/api/family/${id}/accept`);
      toast.success('Invitation accepted!');
      fetchRelationships();
    } catch (error) {
      toast.error('Failed to accept invitation');
    }
  };

  // Reject Pending Invitation
  const handleReject = async (id) => {
    try {
      await api.put(`/api/family/${id}/reject`);
      toast.info('Invitation rejected');
      fetchRelationships();
    } catch (error) {
      toast.error('Failed to reject invitation');
    }
  };

  // Remove Family Access
  const handleRemove = async (id) => {
    if (!window.confirm('Revoke family access for this user?')) return;
    try {
      await api.delete(`/api/family/${id}`);
      toast.success('Family relationship removed');
      fetchRelationships();
    } catch (error) {
      toast.error('Failed to remove relationship');
    }
  };

  // Toggle Permissions
  const handlePermissionToggle = async (relId, currentPerms, permKey) => {
    const newPerms = { ...currentPerms, [permKey]: !currentPerms[permKey] };
    try {
      await api.put(`/api/family/${relId}/permissions`, newPerms);
      toast.success('Permissions updated');
      setRelationships(relationships.map(r => r._id === relId ? { ...r, permissions: newPerms } : r));
    } catch (error) {
      toast.error('Failed to update permissions');
    }
  };

  if (loading) return <SkeletonCard lines={5} />;

  // Separate into relationships where current user is patient vs family member
  const pendingIncomingInvites = relationships.filter(
    r => r.familyMember?._id === user?.id && r.status === 'pending'
  );

  return (
    <div className="space-y-6">
      {/* Invite Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
          <Users className="text-brand-600" size={22} />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Invite Family Member</h2>
            <p className="text-xs text-slate-500">Grant trusted family members controlled access to your medical records</p>
          </div>
        </div>

        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="email"
              className="w-full rounded-2xl border border-slate-300 pl-11 pr-4 py-3 text-sm focus:border-brand-500 focus:outline-none"
              placeholder="family.member@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={inviting}
            className="rounded-full bg-brand-500 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {inviting ? 'Sending...' : 'Send Invite'}
          </button>
        </form>
      </div>

      {/* Pending Incoming Invitations Alert Box */}
      {pendingIncomingInvites.length > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
            <Clock size={18} /> Pending Family Invitations Received
          </h3>
          <div className="space-y-3">
            {pendingIncomingInvites.map((rel) => (
              <div key={rel._id} className="flex items-center justify-between rounded-2xl bg-white border border-amber-200 p-4">
                <div>
                  <div className="font-semibold text-slate-900">{rel.patient?.name}</div>
                  <div className="text-xs text-slate-500">{rel.patient?.email} invited you to access their medical profile.</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(rel._id)}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                  >
                    <Check size={14} /> Accept
                  </button>
                  <button
                    onClick={() => handleReject(rel._id)}
                    className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Family Access List */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Family Connections & Vault Access</h2>

        {relationships.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No family connections"
            description="Invite family members to share access to medical records during emergency situations."
          />
        ) : (
          <div className="space-y-4">
            {relationships.map((rel) => {
              const isOwner = rel.patient?._id === user?.id;
              const otherUser = isOwner ? rel.familyMember : rel.patient;

              return (
                <div key={rel._id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-700">
                        {otherUser?.name?.[0] || 'F'}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          {otherUser?.name || 'Pending User'}
                          <span className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                            rel.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                            rel.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {rel.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {otherUser?.email} • {isOwner ? 'Authorized Family Member' : 'Patient Sharing Vault'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {rel.status === 'accepted' && (
                        <button
                          onClick={() => handleViewVault(rel._id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-colors shadow-sm"
                        >
                          <Eye size={14} /> View Vault
                        </button>
                      )}
                      <button
                        onClick={() => handleRemove(rel._id)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={14} /> Remove Access
                      </button>
                    </div>
                  </div>

                  {/* Permissions Controls (Only owner can edit) */}
                  {rel.status === 'accepted' && (
                    <div className="mt-4 pt-2">
                      <div className="text-xs font-semibold text-slate-600 uppercase mb-2 flex items-center gap-1">
                        <Shield size={14} /> Shared Permissions
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        {[
                          { key: 'viewProfile', label: 'View Profile' },
                          { key: 'viewRecords', label: 'View Records' },
                          { key: 'manageRecords', label: 'Manage Records' },
                          { key: 'viewEmergency', label: 'Emergency Info' }
                        ].map((perm) => (
                          <label key={perm.key} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 cursor-pointer hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={rel.permissions?.[perm.key] || false}
                              disabled={!isOwner}
                              onChange={() => isOwner && handlePermissionToggle(rel._id, rel.permissions, perm.key)}
                              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                            />
                            <span className="text-slate-700 font-medium">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Family Vault Detail Modal */}
      <Modal
        isOpen={vaultModalOpen}
        onClose={() => setVaultModalOpen(false)}
        title={vaultData ? `${vaultData.patient?.name}'s Medical Vault` : 'Family Vault'}
      >
        {loadingVault ? (
          <div className="py-8 text-center text-slate-500">Loading Family Vault...</div>
        ) : vaultData ? (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
            {/* Header info */}
            <div className="rounded-2xl bg-brand-50 p-4 border border-brand-100 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-base">{vaultData.patient?.name}</div>
                <div className="text-xs text-slate-500">{vaultData.patient?.email}</div>
              </div>
              {vaultData.profile?.bloodGroup && (
                <div className="rounded-xl bg-red-600 px-3.5 py-1.5 text-white font-extrabold text-sm">
                  {vaultData.profile.bloodGroup}
                </div>
              )}
            </div>

            {/* Profile summary if permitted */}
            {vaultData.profile && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                  <HeartPulse size={14} className="text-brand-600" /> Medical Summary
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block mb-0.5">Gender</span>
                    <span className="font-semibold text-slate-800">{vaultData.profile.gender || 'N/A'}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-slate-400 block mb-0.5">Phone</span>
                    <span className="font-semibold text-slate-800">{vaultData.profile.phone || 'N/A'}</span>
                  </div>
                </div>

                {vaultData.profile.allergies?.length > 0 && (
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-xs">
                    <span className="text-red-700 font-bold block mb-1">⚠️ Allergies</span>
                    <span className="text-red-900 font-medium">{vaultData.profile.allergies.join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Emergency Contacts if permitted */}
            {vaultData.contacts?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                  <ShieldAlert size={14} className="text-red-500" /> Emergency Contacts
                </h4>
                <div className="space-y-2">
                  {vaultData.contacts.map((c) => (
                    <div key={c._id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{c.name}</span> ({c.relationship})
                      </div>
                      <a href={`tel:${c.phone}`} className="text-brand-600 font-bold flex items-center gap-1 hover:underline">
                        <Phone size={12} /> {c.phone}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shared Medical Records */}
            {vaultData.records?.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                  <FileText size={14} className="text-brand-600" /> Shared Medical Records ({vaultData.records.length})
                </h4>
                <div className="space-y-2">
                  {vaultData.records.map((rec) => (
                    <div key={rec._id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs">
                      <div>
                        <div className="font-semibold text-slate-900">{rec.title}</div>
                        <div className="text-[11px] text-slate-500">{rec.category} • {rec.doctor || 'File'}</div>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(rec.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic text-center py-4">No shared medical records or view records permission disabled.</div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
