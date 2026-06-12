// ── Base ─────────────────────────────────────────────────────────────────────

export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} />
  )
}

// ── Pre-built patterns ────────────────────────────────────────────────────────

// Dashboard project card
export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Skeleton className="h-3 w-3/5" />
      <Skeleton className="h-3 w-1/4" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-7 flex-1 rounded-lg" />
        <Skeleton className="h-7 w-8 rounded-lg" />
      </div>
    </div>
  )
}

// Resource table row
export function TableRowSkeleton({ cols = 4 }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={`h-3.5 ${i === 0 ? 'w-28' : i === cols - 1 ? 'w-16' : 'flex-1'}`} />
      ))}
    </div>
  )
}

// Schema field row
export function FieldRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5">
      <Skeleton className="h-8 flex-1 rounded-lg" />
      <Skeleton className="h-8 w-28 rounded-lg" />
      <Skeleton className="h-4 w-4 rounded" />
      <Skeleton className="h-7 w-7 rounded-lg" />
    </div>
  )
}

// Endpoint viewer row
export function EndpointRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
      <Skeleton className="h-5 w-16 rounded" />
      <Skeleton className="h-3.5 flex-1" />
      <Skeleton className="h-7 w-20 rounded-lg" />
    </div>
  )
}

// Log panel row
export function LogRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5">
      <Skeleton className="h-5 w-12 rounded" />
      <Skeleton className="h-3.5 w-8" />
      <Skeleton className="h-3.5 flex-1" />
      <Skeleton className="h-3.5 w-12" />
    </div>
  )
}