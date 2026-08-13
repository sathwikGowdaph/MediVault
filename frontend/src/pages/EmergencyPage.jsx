import { useEffect, useState } from 'react';
import api from '../services/api';
import QRCode from 'qrcode';
import { toast } from 'react-toastify';
import { ShieldAlert, QrCode, Download, RefreshCw, XCircle, Copy, HeartPulse, User, Phone, Check } from 'lucide-react';
import SkeletonCard from '../components/SkeletonCard';

export default function EmergencyPage() {
  const [profile, setProfile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [qrToken, setQrToken] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/api/emergency/profile');
      setProfile(data.profile);
      setContacts(data.contacts || []);
      if (data.activeQrToken) {
        await generateQRCodeImage(data.activeQrToken);
      }
    } catch (error) {
      toast.error('Unable to load emergency profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateQRCodeImage = async (tokenStr) => {
    try {
      const fullAccessUrl = `${window.location.origin}/emergency/access/${tokenStr}`;
      const url = await QRCode.toDataURL(fullAccessUrl, { width: 300, margin: 2 });
      setQrDataUrl(url);
      setQrToken(tokenStr);
    } catch (err) {
      toast.error('Error generating QR image');
    }
  };

  const handleGenerateQR = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/api/emergency/qr');
      await generateQRCodeImage(data.token);
      toast.success('Emergency access QR generated');
    } catch (error) {
      toast.error('Unable to generate QR code');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerateQR = async () => {
    setGenerating(true);
    try {
      const { data } = await api.post('/api/emergency/qr/regenerate');
      await generateQRCodeImage(data.token);
      toast.success('New QR code regenerated');
    } catch (error) {
      toast.error('Unable to regenerate QR code');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeQR = async () => {
    if (!window.confirm('Revoke all existing emergency QR access codes? First responders will no longer be able to scan your previous QR.')) return;
    try {
      await api.post('/api/emergency/qr/revoke');
      setQrDataUrl('');
      setQrToken('');
      toast.success('QR access revoked');
    } catch (error) {
      toast.error('Unable to revoke QR access');
    }
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `MediVault_Emergency_QR_${profile?.fullName || 'Patient'}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCopyLink = () => {
    if (!qrToken) return;
    const link = `${window.location.origin}/emergency/access/${qrToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Emergency URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <SkeletonCard lines={6} />;

  const fullAccessUrl = qrToken ? `${window.location.origin}/emergency/access/${qrToken}` : '';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl border border-red-200 bg-red-50/70 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-red-600 p-3 text-white shrink-0">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-900">Emergency Readiness & QR Sharing</h2>
            <p className="text-xs text-red-700 mt-1 max-w-xl">
              First responders can scan your QR code or open your emergency link to view critical allergies, blood group, medications, and contact details without needing your account password.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!qrDataUrl ? (
            <button
              onClick={handleGenerateQR}
              disabled={generating}
              className="rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Emergency QR'}
            </button>
          ) : (
            <button
              onClick={handleRegenerateQR}
              disabled={generating}
              className="rounded-full border border-red-300 bg-white px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={generating ? 'animate-spin' : ''} /> Regenerate QR
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: QR Access Card & Emergency Profile Preview */}
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        {/* QR Access Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center justify-between text-center">
          <div className="w-full">
            <div className="flex items-center justify-center gap-2 text-slate-900 font-semibold text-lg mb-1">
              <QrCode size={22} className="text-brand-600" /> Emergency Access QR Code
            </div>
            <p className="text-xs text-slate-500 mb-6">Contains a secure, revocable token link</p>

            {qrDataUrl ? (
              <div className="space-y-4">
                <div className="relative inline-block rounded-3xl border-4 border-brand-500 p-4 bg-white shadow-md">
                  <img src={qrDataUrl} alt="Emergency Medical QR Code" className="h-56 w-56 mx-auto" />
                </div>

                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 text-xs flex items-center justify-between gap-2">
                  <span className="truncate font-mono text-slate-600">{fullAccessUrl}</span>
                  <button
                    onClick={handleCopyLink}
                    className="rounded-lg bg-white border border-slate-300 p-1.5 text-slate-700 hover:bg-slate-100"
                    title="Copy URL"
                  >
                    {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <button
                    onClick={handleDownloadQR}
                    className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition-colors"
                  >
                    <Download size={14} /> Download QR PNG
                  </button>
                  <button
                    onClick={handleRevokeQR}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <XCircle size={14} /> Revoke Access
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 border-2 border-dashed border-slate-200 rounded-3xl">
                <QrCode size={48} className="mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-600">No active QR code generated yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">Click "Generate Emergency QR" to create your shareable scan code.</p>
              </div>
            )}
          </div>
        </div>

        {/* Profile Readiness Display */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-semibold text-slate-900">Emergency Information Summary</h2>
            <p className="text-xs text-slate-500">This data will be visible to doctors scanning your QR code.</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                <div className="text-xs font-semibold text-slate-500 uppercase">Patient Name</div>
                <div className="text-base font-bold text-slate-900 mt-1">{profile?.fullName || 'Not set'}</div>
              </div>
              <div className="rounded-2xl bg-red-50 p-4 border border-red-100">
                <div className="text-xs font-semibold text-red-700 uppercase">Blood Group</div>
                <div className="text-xl font-extrabold text-red-900 mt-1">{profile?.bloodGroup || 'Not set'}</div>
              </div>
            </div>

            <div className="rounded-2xl bg-red-50/50 p-4 border border-red-100">
              <div className="text-xs font-semibold text-red-700 uppercase mb-2">Critical Allergies</div>
              {profile?.allergies?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.allergies.map((a, i) => (
                    <span key={i} className="rounded-lg bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1">⚠️ {a}</span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">None listed</span>
              )}
            </div>

            <div className="rounded-2xl bg-amber-50/50 p-4 border border-amber-100">
              <div className="text-xs font-semibold text-amber-700 uppercase mb-2">Chronic Diseases / Conditions</div>
              {profile?.chronicDiseases?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {profile.chronicDiseases.map((d, i) => (
                    <span key={i} className="rounded-lg bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1">• {d}</span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">None listed</span>
              )}
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Current Medications</div>
              {profile?.currentMedications?.length > 0 ? (
                <div className="text-xs text-slate-800 font-medium">{profile.currentMedications.join(', ')}</div>
              ) : (
                <span className="text-xs text-slate-500 italic">None listed</span>
              )}
            </div>

            {profile?.emergencyInfo && (
              <div className="rounded-2xl bg-slate-100 p-4">
                <div className="text-xs font-semibold text-slate-600 uppercase mb-1">Emergency Warning Note</div>
                <div className="text-xs text-slate-800 italic">{profile.emergencyInfo}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
