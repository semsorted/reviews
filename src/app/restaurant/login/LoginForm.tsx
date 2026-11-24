"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/restaurant/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: String(data.get("login") ?? ""), password: String(data.get("password") ?? "") }),
      });
      const body = await res.json().catch(() => null);
      if (res.ok && typeof body?.home === "string") return window.location.assign(body.home);
      setError(body?.error ?? "Login did not work. Try again.");
    } catch {
      setError("No connection. Check the internet and try again.");
    }
    setBusy(false);
  };

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <div>
        <Label htmlFor="login">Email, mobile or username</Label>
        <Input id="login" name="login" required maxLength={140} autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="balaji.kitchen" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required maxLength={200} autoComplete="current-password" />
      </div>
      {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
      <Button type="submit" size="lg" isLoading={busy}>Log in</Button>
      <p className="text-sm text-moss">Forgot your password? Ask your restaurant owner to set a new one.</p>
    </form>
  );
}
