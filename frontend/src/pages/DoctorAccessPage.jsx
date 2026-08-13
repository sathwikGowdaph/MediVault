import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Activity, ShieldAlert, HeartPulse, Phone, AlertTriangle, CheckCircle2, User, Clock, Lock } from 'lucide-react';

export default function DoctorAccessPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    async function fetchEmergencyAccess() {
      try {
        const res = await axios.get(`${apiBase}/api/emergency/access/${token}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired QR access code');
      } finally {
        setLoading(false);
      }
    }
    fetchEmergencyAccess();
  }, [token, apiBase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-slate-300 font-medium">Verifying Emergency QR Access...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white p-4">
        <div className="w-full max-w-md rounded-3xl border border-red-800/50 bg-slate-800/80 p-8 text-center backdrop-blur-md shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-400 mb-4">
            <AlertTriangle size={36} />
          </div>
          <h1 className="text-2xl font-bold text-red-400">Emergency Access Revoked or Expired</h1>
          <p className="mt-3 text-slate-300 text-sm leading-relaxed">{error}</p>
          <div className="mt-6 pt-6 border-t border-slate-700">
            <Link to="/" className="inline-flex items-center justify-center rounded-full bg-slate-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-600 transition-colors">
              Return to MediVault
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { patient, profile, contacts } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      {/* Emergency Header Bar */}
      <header className="sticky top-0 z-50 bg-red-950/90 border-b border-red-800/60 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white animate-pulse">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="font-bold text-red-200 text-sm sm:text-base uppercase tracking-wider">Emergency Medical Profile</div>
              <div className="text-xs text-red-300/80 flex items-center gap-1">
                <Lock size={12} /> Read-Only Authorization Active
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-red-900/60 border border-red-700/50 rounded-full px-3 py-1 text-xs text-red-200">
            <Clock size={14} />
            <span className="hidden sm:inline">Access Time:</span> {new Date().toLocaleTimeString()}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Warning Banner */}
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-amber-300 text-xs sm:text-sm flex items-start gap-3">
          <AlertTriangle size={20} className="shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold">Medical Disclaimer:</span> This profile contains critical emergency medical information authorized by the patient for healthcare providers and first responders. Access is strictly audited.
          </div>
        </div>

        {/* Patient Core Summary Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 font-bold text-2xl">
                {patient?.name?.[0] || 'P'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{profile?.fullName || patient?.name || 'Patient'}</h1>
                <p className="text-sm text-slate-400 flex items-center gap-2 mt-0.5">
                  <User size={14} /> Gender: <span className="text-slate-200 font-medium">{profile?.gender || 'Not specified'}</span>
                  {profile?.dateOfBirth && (
                    <> • DOB: <span className="text-slate-200 font-medium">{new Date(profile.dateOfBirth).toLocaleDateString()}</span></>
                  )}
                </p>
              </div>
            </div>

            {/* Blood Group Badge */}
            <div className="flex items-center gap-3 bg-red-950/80 border border-red-700/60 rounded-2xl px-6 py-3 self-start sm:self-auto">
              <HeartPulse className="text-red-500" size={28} />
              <div>
                <div className="text-xs uppercase text-red-300/80 font-bold tracking-wider">Blood Group</div>
                <div className="text-3xl font-extrabold text-white">{profile?.bloodGroup || 'UNKNOWN'}</div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400">Height</div>
              <div className="text-lg font-bold text-slate-100 mt-1">{profile?.height ? `${profile.height} cm` : 'Not recorded'}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400">Weight</div>
              <div className="text-lg font-bold text-slate-100 mt-1">{profile?.weight ? `${profile.weight} kg` : 'Not recorded'}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400">Phone</div>
              <div className="text-lg font-bold text-slate-100 mt-1 truncate">{profile?.phone || 'Not recorded'}</div>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
              <div className="text-xs text-slate-400">Emergency Note</div>
              <div className="text-xs font-medium text-amber-300 mt-1 truncate">{profile?.emergencyInfo || 'None'}</div>
            </div>
          </div>
        </div>

        {/* Critical Medical Conditions & Allergies */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Allergies (Red Alert) */}
          <div className="rounded-3xl border border-red-900/40 bg-red-950/20 p-6">
            <div className="flex items-center gap-2 text-red-400 font-bold text-lg mb-4">
              <ShieldAlert size={22} />
              Critical Allergies
            </div>
            {profile?.allergies?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.allergies.map((allergy, i) => (
                  <span key={i} className="rounded-xl bg-red-500/20 border border-red-500/40 px-3.5 py-1.5 text-sm font-semibold text-red-200">
                    ⚠️ {allergy}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No known drug/food allergies recorded.</p>
            )}
          </div>

          {/* Chronic Diseases */}
          <div className="rounded-3xl border border-amber-900/40 bg-amber-950/20 p-6">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg mb-4">
              <Activity size={22} />
              Chronic Diseases & Conditions
            </div>
            {profile?.chronicDiseases?.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.chronicDiseases.map((disease, i) => (
                  <span key={i} className="rounded-xl bg-amber-500/20 border border-amber-500/40 px-3.5 py-1.5 text-sm font-semibold text-amber-200">
                    • {disease}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No chronic medical conditions recorded.</p>
            )}
          </div>
        </div>

        {/* Current Medications */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <HeartPulse className="text-emerald-400" size={22} />
            Current Medications
          </h2>
          {profile?.currentMedications?.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {profile.currentMedications.map((med, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl bg-slate-950 border border-slate-800 p-3.5 text-sm text-slate-200">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <span className="font-medium">{med}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 italic">No current medications listed.</p>
          )}
        </div>

        {/* Emergency Contacts */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Phone className="text-brand-400" size={22} />
            Emergency Contacts
          </h2>
          {contacts?.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {contacts.map((c) => (
                <div key={c._id} className="rounded-2xl bg-slate-950 border border-slate-800 p-4 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-100">{c.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{c.relationship} • {c.priority || 'Contact'}</div>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-600 transition-colors"
                  >
                    <Phone size={14} /> Call
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic">No emergency contacts registered.</p>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-slate-500 pt-6">
          Verified Access Token: <span className="font-mono text-slate-400">{token}</span> • Powered by MediVault Emergency System
        </div>
      </main>
    </div>
  );
}
