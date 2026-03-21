import { cn } from '../../utils/cn';

/** Animated pulse placeholder for loading states. */
export function Skeleton({ className }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700', className)}
    />
  );
}

/** Card-shaped skeleton with header and body lines. */
export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
      <Skeleton className="h-5 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

/** Full session page skeleton: header bar, story banner, 2 cards. */
export function SessionSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Story banner skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
        <Skeleton className="h-6 w-2/5 mb-3" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Two-column card skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
      </div>
    </div>
  );
}

/** Analytics page skeleton: stat boxes and chart area. */
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stat boxes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-2/3" />
          </div>
        ))}
      </div>
      {/* Chart area */}
      <SkeletonCard lines={5} />
    </div>
  );
}
