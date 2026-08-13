/** Reusable skeleton card loader */
export default function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm animate-pulse ${className}`}>
      <div className="h-5 w-1/3 rounded-xl bg-slate-200 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`h-4 rounded-xl bg-slate-100 mb-3 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

/** Skeleton stat card */
export function SkeletonStat() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-24 rounded-lg bg-slate-200 mb-3" />
          <div className="h-8 w-16 rounded-lg bg-slate-100" />
        </div>
        <div className="h-12 w-12 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}

/** Skeleton list row */
export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 animate-pulse">
      <div className="flex-1">
        <div className="h-4 w-1/3 rounded-lg bg-slate-200 mb-2" />
        <div className="h-3 w-1/2 rounded-lg bg-slate-100" />
      </div>
      <div className="h-8 w-20 rounded-full bg-slate-200" />
    </div>
  );
}
