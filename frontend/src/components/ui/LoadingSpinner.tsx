/** Skeleton loading shimmer */
export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-3">
      <SkeletonBlock className="h-4 w-1/3" />
      <SkeletonBlock className="h-8 w-full" />
      <SkeletonBlock className="h-8 w-4/5" />
      <SkeletonBlock className="h-6 w-2/3" />
    </div>
  );
}

/** Loading spinner với glow */
export function LoadingSpinner({ label = 'Đang xử lý...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
        <div
          className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-indigo-500"
          style={{ filter: 'drop-shadow(0 0 8px rgba(99,102,241,0.5))' }}
        />
      </div>
      <p className="text-sm font-medium text-gray-500 animate-pulse">{label}</p>
    </div>
  );
}

