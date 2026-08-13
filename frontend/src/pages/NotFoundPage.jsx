import { Link } from 'react-router-dom';
import { Activity, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-100 text-brand-700 mb-6">
        <Activity size={36} />
      </div>
      <h1 className="text-6xl font-extrabold text-slate-900">404</h1>
      <h2 className="mt-2 text-2xl font-semibold text-slate-800">Page not found</h2>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        The page or emergency resource you are looking for does not exist or has been moved.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={18} /> Home Page
        </Link>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
        >
          <Home size={18} /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
