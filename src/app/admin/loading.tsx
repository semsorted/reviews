export default function AdminLoading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse space-y-4 motion-reduce:animate-none">
      <div className="h-10 w-48 rounded-lg bg-line/60" />
      <div className="h-64 rounded-xl bg-paper" />
    </div>
  );
}
