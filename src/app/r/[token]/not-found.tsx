export default function ReviewUnavailable() {
  return (
    <main className="review-surface flex min-h-dvh flex-col justify-center bg-white px-5 text-review-ink">
      <div className="mx-auto w-full max-w-[28rem]">
        <h1 className="text-2xl font-medium">This review link is not active</h1>
        <p className="mt-2 text-review-muted">Ask the shop for its current QR code.</p>
      </div>
    </main>
  );
}
