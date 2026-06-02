"use client";

import { useEffect, useState } from "react";
import type { CiHealthData } from "@/types";

const UNKNOWN: CiHealthData = {
  state: "unknown",
  consecutiveReds: 0,
  threshold: 2,
  latestRun: null,
  staleSince: null,
};

const POLL_MS = 30_000;

export function useCiHealth(): CiHealthData | null {
  const [data, setData] = useState<CiHealthData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/ci-health", { cache: "no-store" });
        if (cancelled) return;
        if (!res.ok) {
          setData(UNKNOWN);
          return;
        }
        const json = (await res.json()) as CiHealthData;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(UNKNOWN);
      }
    }

    void poll();
    const id = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return data;
}

export function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}
