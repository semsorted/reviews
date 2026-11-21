"use client";

export default function ReviewError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="review-surface flex min-h-dvh flex-col justify-center bg-white px-5 text-review-ink">
      <div className="mx-auto w-full max-w-[28rem]">
        <h1 className="text-2xl font-medium">This page did not load</h1>
        <p className="mb-5 mt-2 text-review-muted">Check your connection and try again.</p>
        <button type="button" onClick={() => retry()} className="min-h-11 rounded-full bg-review-blue px-5 font-medium text-white">
          Try again
        </button>
      </div>
    </main>
  );
}
