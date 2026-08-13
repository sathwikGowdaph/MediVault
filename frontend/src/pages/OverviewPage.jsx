import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { FileText, ShieldAlert, BellRing, HeartPulse, ArrowRight, Activity, Calendar, AlertCircle } from 'lucide-react';
import SkeletonCard, { SkeletonStat, SkeletonRow } from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';

export default function OverviewPage() {
  const [data, setData] = useState({ records: [], reminders: [], profile: null });
  const [aiSummary, setAiSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    async function fetchOverviewData() {
      try {
        const [recordsRes, remindersRes, profileRes] = await Promise.all([
          api.get('/api/records?limit=5'),
          api.get('/api/reminders'),
          api.get('/api/patient/profile')
        ]);
        setData({
          records: recordsRes.data.records || [],
          reminders: remindersRes.data.reminders || [],
          profile: profileRes.data.profile
        });
      } catch (err) {
        console.error('Failed to load overview data', err);
      } finally {
        setLoading(false);
      }
    }

    async function fetchAiSummary() {
      try {
        const res = await api.get('/api/ai/emergency-summary');
        setAiSummary(res.data.summary);
      } catch (err) {
        setAiSummary('Unable to generate AI summary at this time.');
      } finally {
        setAiLoading(false);
      }
    }

    fetchOverviewData();
    fetchAiSummary();
  }, []);

  const totalRecords = data.records.length;
  const activeReminders = data.reminders.filter(r => r.status === 'active').length;
  const isProfileComplete = data.profile && data.profile.bloodGroup && data.profile.emergencyInfo;

  return (
    <div className="space-y-6">
      {/* Overview Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
          <>
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </>
        ) : (
          [
            {
              title: 'Medical Records',
              value: totalRecords,
              subtitle: 'Documents uploaded',
              icon: FileText,
              link: '/dashboard/records'
            },
            {
              title: 'Active Reminders',
              value: activeReminders,
              subtitle: 'Upcoming tasks',
              icon: BellRing,
              link: '/dashboard/reminders'
            },
            {
              title: 'Emergency Profile',
              value: isProfileComplete ? 'Ready' : 'Incomplete',
              subtitle: isProfileComplete ? 'QR scan ready' : 'Needs attention',
              icon: ShieldAlert,
              link: '/dashboard/emergency',
              badge: isProfileComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.link}
                className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-500">{item.title}</div>
                    <div className="mt-2 text-2xl font-bold text-slate-900 flex items-center gap-2">
                      {item.value}
                      {item.badge && (
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${item.badge}`}>
                          {item.value}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">{item.subtitle}</div>
                  </div>
                  <div className="rounded-2xl bg-brand-50 p-3.5 text-brand-600 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                    <Icon size={22} />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Main Grid: Records & AI Summary */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Recent Documents */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent Medical Documents</h2>
                <p className="text-xs text-slate-500">Your latest uploaded medical files</p>
              </div>
              <Link to="/dashboard/records" className="text-xs font-semibold text-brand-700 hover:underline flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : data.records.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No medical records yet"
                description="Upload prescriptions, lab reports, or scans to access them anytime."
                action={
                  <Link to="/dashboard/records" className="rounded-full bg-brand-500 px-4 py-2 text-xs font-semibold text-white">
                    Upload Record
                  </Link>
                }
              />
            ) : (
              <div className="space-y-3">
                {data.records.slice(0, 4).map((record) => (
                  <div key={record._id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="rounded-xl bg-brand-100 p-2.5 text-brand-700">
                        <FileText size={18} />
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-slate-900 text-sm truncate">{record.title}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {record.category} • {record.doctor || 'Self-uploaded'}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs font-medium text-slate-400 shrink-0">
                      {new Date(record.recordDate || record.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AI Medical Risk Summary */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-brand-700 font-semibold text-lg mb-2">
              <HeartPulse size={22} className="text-brand-500 animate-pulse" />
              AI Risk Summary
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Automated critical emergency synthesis of your current medical profile and records.
            </p>

            {aiLoading ? (
              <SkeletonCard lines={4} />
            ) : (
              <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-mono whitespace-pre-line">
                {aiSummary}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <AlertCircle size={14} /> AI-Generated Summary
            </span>
            <Link to="/dashboard/emergency" className="font-semibold text-brand-700 hover:underline">
              View Emergency QR
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
