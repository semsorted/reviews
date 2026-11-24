"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Loud, repeating alert for new orders on kitchen and owner screens.
 * Browsers only allow sound after a tap, so the screen asks for one "Start" tap per shift.
 */
export function useOrderAlerts(shopName: string) {
  const [armed, setArmed] = useState(false);
  const [ringing, setRinging] = useState(0);
  const audio = useRef<AudioContext | null>(null);
  const wakeLock = useRef<{ release: () => Promise<void> } | null>(null);

  const beep = useCallback(() => {
    const context = audio.current;
    if (!context) return;
    const now = context.currentTime;
    for (const [offset, frequency] of [[0, 880], [0.22, 1175], [0.44, 880]] as const) {
      const tone = context.createOscillator();
      const gain = context.createGain();
      tone.type = "square";
      tone.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.35, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.18);
      tone.connect(gain).connect(context.destination);
      tone.start(now + offset);
      tone.stop(now + offset + 0.2);
    }
  }, []);

  const keepAwake = useCallback(async () => {
    try {
      const lock = await (navigator as Navigator & { wakeLock?: { request: (type: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request("screen");
      if (lock) wakeLock.current = lock;
    } catch {}
  }, []);

  const arm = useCallback(async () => {
    const Context = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Context && !audio.current) audio.current = new Context();
    await audio.current?.resume().catch(() => {});
    beep();
    await keepAwake();
    if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission().catch(() => "default");
    setArmed(true);
  }, [beep, keepAwake]);

  const ring = useCallback(
    (count: number, text: string) => {
      setRinging((current) => current + count);
      navigator.vibrate?.([300, 150, 300]);
      if (document.visibilityState !== "visible" && "Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(`${shopName}: new order`, { body: text, tag: "semsorted-order", requireInteraction: true });
        } catch {}
      }
    },
    [shopName]
  );

  const acknowledge = useCallback(() => setRinging(0), []);

  // Beeps every few seconds until someone taps "Got it", and flashes the tab title.
  useEffect(() => {
    if (!ringing) {
      document.title = shopName;
      return;
    }
    beep();
    let flip = false;
    const timer = setInterval(() => {
      beep();
      flip = !flip;
      document.title = flip ? `(${ringing}) New order` : shopName;
    }, 3000);
    return () => clearInterval(timer);
  }, [ringing, beep, shopName]);

  // Screen wake locks drop when the tab is hidden, so take it again on return.
  useEffect(() => {
    if (!armed) return;
    const onShow = () => document.visibilityState === "visible" && void keepAwake();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      document.removeEventListener("visibilitychange", onShow);
      void wakeLock.current?.release().catch(() => {});
    };
  }, [armed, keepAwake]);

  return { armed, arm, ringing, ring, acknowledge };
}
