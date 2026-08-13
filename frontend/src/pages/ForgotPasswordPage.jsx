import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Activity, Mail, ArrowLeft, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/forgot-password', { email });
      toast.success('Password reset instructions generated');
      if (data.token) {
        setResetToken(data.token);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process password reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white">
            <Activity size={22} />
          </div>
          <span className="text-xl font-bold text-slate-900">MediVault</span>
        </div>

        <h1 className="mt-6 text-center text-2xl font-semibold text-slate-900">Forgot your password?</h1>
        <p className="mt-2 text-center text-sm text-slate-600">Enter your email address and we'll generate a reset token for you.</p>

        {resetToken ? (
          <div className="mt-6 rounded-2xl bg-brand-50 border border-brand-100 p-5 text-center">
            <KeyRound className="mx-auto text-brand-600 mb-2" size={28} />
            <h3 className="font-semibold text-brand-900">Reset Token Generated</h3>
            <p className="mt-1 text-xs text-brand-700">Use this token to reset your password:</p>
            <div className="mt-3 rounded-xl bg-white border border-brand-200 p-3 font-mono text-xs text-slate-800 break-all select-all">
              {resetToken}
            </div>
            <Link
              to={`/reset-password?token=${resetToken}`}
              className="mt-4 inline-flex items-center justify-center w-full rounded-full bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Proceed to Reset Password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  className="w-full rounded-2xl border border-slate-300 pl-11 pr-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              className="w-full rounded-full bg-brand-500 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating token...
                </>
              ) : (
                'Generate Reset Token'
              )}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            <ArrowLeft size={16} /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
