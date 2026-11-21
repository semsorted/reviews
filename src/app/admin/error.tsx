"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="max-w-md py-12">
      <h1 className="text-[2.35rem] font-bold">This page did not load</h1>
      <p className="mb-6 mt-3 text-moss">The database may be unavailable. Try again in a moment.</p>
      <Button onClick={() => retry()}>Try again</Button>
    </div>
  );
}
