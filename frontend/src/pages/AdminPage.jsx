import { useEffect, useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { ShieldCheck, Users, FileText, Activity, Search, Filter, Power, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import SkeletonCard, { SkeletonStat } from '../components/SkeletonCard';
import { useDebounce } from '../hooks/useDebounce';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // User Filter & Search
  const [userSearch, setUserSearch] = useState('');
  const debouncedUserSearch = useDebounce(userSearch, 400);
  const [roleFilter, setRoleFilter] = useState('');

  // Pagination for logs
  const [logPage, setLogPage] = useState(1);
  const [logPagination, setLogPagination] = useState({ total: 0, pages: 1 });

  const fetchAdminData = async () => {
    try {
      const userParams = new URLSearchParams();
      if (roleFilter) userParams.append('role', roleFilter);
      if (debouncedUserSearch) userParams.append('search', debouncedUserSearch);

      const [usersRes, statsRes, logsRes] = await Promise.all([
        api.get(`/api/admin/users?${userParams.toString()}`),
        api.get('/api/admin/statistics'),
        api.get(`/api/admin/activity-logs?page=${logPage}&limit=10`)
      ]);

      setUsers(usersRes.data.users || []);
      setStats(statsRes.data.statistics || null);
      setLogs(logsRes.data.logs || []);
      setLogPagination(logsRes.data.pagination || { total: 0, pages: 1 });
    } catch (error) {
      toast.error('Unable to load administration data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [debouncedUserSearch, roleFilter, logPage]);

  // Toggle user active status
  const handleToggleUser = async (user) => {
    if (user.role === 'admin') return toast.error('Cannot disable admin accounts');
    try {
      const { data } = await api.put(`/api/admin/users/${user._id}/toggle`);
      toast.success(`User ${data.user.name} is now ${data.user.isActive ? 'Active' : 'Disabled'}`);
      setUsers(users.map(u => u._id === user._id ? data.user : u));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
          <SkeletonStat />
        </div>
        <SkeletonCard lines={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Overview Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-50 text-blue-700' },
          { label: 'Patients', value: stats?.totalPatients || 0, icon: Users, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Doctors', value: stats?.totalDoctors || 0, icon: ShieldCheck, color: 'bg-purple-50 text-purple-700' },
          { label: 'Medical Records', value: stats?.totalRecords || 0, icon: FileText, color: 'bg-brand-50 text-brand-700' }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">{item.label}</div>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900">{item.value}</div>
                </div>
                <div className={`rounded-2xl p-3 ${item.color}`}>
                  <Icon size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Management Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">User Account Management</h2>
            <p className="text-xs text-slate-500">Monitor active platform users and enable/disable account permissions</p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
              <input
                className="rounded-2xl border border-slate-300 pl-10 pr-4 py-2 text-xs"
                placeholder="Search user name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-slate-400" />
              <select
                className="rounded-2xl border border-slate-300 px-3 py-2 text-xs bg-white"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="family">Family</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="space-y-3">
          {users.map((u) => (
            <div key={u._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div>
                <div className="font-semibold text-slate-900 flex items-center gap-2">
                  {u.name}
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {u.role}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {u.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {u.email} • Joined: {new Date(u.createdAt).toLocaleDateString()}
                </div>
              </div>

              {u.role !== 'admin' && (
                <button
                  onClick={() => handleToggleUser(u)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                    u.isActive
                      ? 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                      : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <Power size={14} />
                  {u.isActive ? 'Disable User' : 'Enable User'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Audit Log Activity Feed */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Activity className="text-brand-600" size={20} />
            <h2 className="text-lg font-semibold text-slate-900">System Activity Audit Logs</h2>
          </div>
          <span className="text-xs text-slate-400">Total logs: {logPagination.total}</span>
        </div>

        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log._id} className="flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 p-3.5 text-xs">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-slate-200 p-2 text-slate-600 font-mono">
                  <Clock size={14} />
                </div>
                <div>
                  <span className="font-bold text-slate-800 uppercase tracking-wider">{log.action}</span>
                  <span className="text-slate-500"> on resource <span className="font-semibold text-slate-700">{log.resource}</span></span>
                  <div className="text-slate-400 mt-0.5">
                    User: <span className="font-medium text-slate-600">{log.user?.name || log.user?.email || 'System'}</span>
                  </div>
                </div>
              </div>
              <div className="text-slate-400 font-mono text-[11px]">
                {new Date(log.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {logPagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium text-slate-600">
            <div>Page {logPage} of {logPagination.pages}</div>
            <div className="flex gap-2">
              <button
                disabled={logPage <= 1}
                onClick={() => setLogPage(p => p - 1)}
                className="rounded-full border border-slate-300 p-2 disabled:opacity-30 hover:bg-slate-100"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={logPage >= logPagination.pages}
                onClick={() => setLogPage(p => p + 1)}
                className="rounded-full border border-slate-300 p-2 disabled:opacity-30 hover:bg-slate-100"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
