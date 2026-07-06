export function TaskSkeleton() {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-5">
      <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
      <div className="mt-4 h-4 w-full animate-pulse rounded bg-white/10" />
      <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-white/10" />
      <div className="mt-5 flex gap-2">
        <div className="h-7 w-20 animate-pulse rounded-full bg-white/10" />
        <div className="h-7 w-20 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}
