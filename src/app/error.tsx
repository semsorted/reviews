"use client";

export default function AppError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <h1 className="text-3xl font-bold">This page did not load</h1>
      <p className="mb-5 mt-2 text-moss">Check your connection and try again.</p>
      <button type="button" onClick={() => retry()} className="min-h-11 w-fit rounded-full bg-pine px-5 font-semibold text-white">
        Try again
      </button>
    </main>
  );
}
