"use client";

import { Button } from "@/components/ui/button";

export default function ReviewError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-[30rem] flex-col items-start justify-center px-5">
      <h1 className="text-[2.35rem] font-bold">This page did not load</h1>
      <p className="mb-6 mt-3 text-moss">Check your connection and try again.</p>
      <Button onClick={() => retry()}>Try again</Button>
    </main>
  );
}
