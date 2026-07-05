export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-48 animate-pulse rounded-md bg-secondary" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-secondary" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg border border-border bg-secondary/40" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg border border-border bg-secondary/40" />
    </div>
  );
}
