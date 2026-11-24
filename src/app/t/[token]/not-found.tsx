export default function TableUnavailable() {
  return (
    <main className="review-surface flex min-h-dvh flex-col justify-center bg-white px-5 text-review-ink">
      <div className="mx-auto w-full max-w-[28rem]">
        <h1 className="text-2xl font-medium">This table is not taking orders</h1>
        <p className="mt-2 text-review-muted">Please ask the staff to take your order.</p>
      </div>
    </main>
  );
}
