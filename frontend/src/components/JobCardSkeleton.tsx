interface JobCardSkeletonProps {
  count?: number;
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-7 w-24" />
        <SkeletonBlock className="h-6 w-20 rounded-full" />
      </div>
      <SkeletonBlock className="h-4 w-40" />
      <SkeletonBlock className="h-4 w-56" />
      <div className="flex justify-between items-center pt-1">
        <SkeletonBlock className="h-5 w-20" />
        <SkeletonBlock className="h-4 w-16" />
      </div>
    </div>
  );
}

export default function JobCardSkeleton({ count = 3 }: JobCardSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
