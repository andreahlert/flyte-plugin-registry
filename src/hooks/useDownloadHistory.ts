"use client";

import { startTransition, useEffect, useState } from "react";

export interface DownloadDataPoint {
  date: string;
  downloads: number;
}

interface DownloadHistoryState {
  history: DownloadDataPoint[] | null;
  loading: boolean;
}

const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

function readCache(packageName: string): DownloadDataPoint[] | null {
  try {
    const cached = localStorage.getItem(`pypi-history:${packageName}`);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) return data;
    }
  } catch {}
  return null;
}

/**
 * Fetches 90-day download history from the static JSON (build time)
 * or falls back to pypistats.org API (client-side) if not available.
 */
export function useDownloadHistory(packageName: string): DownloadHistoryState {
  const [state, setState] = useState<DownloadHistoryState>(() => {
    if (!packageName) return { history: null, loading: false };
    const cached = readCache(packageName);
    if (cached) return { history: cached, loading: false };
    return { history: null, loading: true };
  });

  useEffect(() => {
    if (!packageName) {
      startTransition(() => setState({ history: null, loading: false }));
      return;
    }

    const cached = readCache(packageName);
    if (cached) {
      startTransition(() => setState({ history: cached, loading: false }));
      return;
    }

    let cancelled = false;

    async function load() {
      // Try static JSON first
      try {
        const mod = await import("@/data/pypi-history.json");
        const hist = (mod.default as { history: Record<string, DownloadDataPoint[]> }).history;
        if (hist[packageName]) {
          if (!cancelled) {
            startTransition(() => setState({ history: hist[packageName], loading: false }));
            localStorage.setItem(
              `pypi-history:${packageName}`,
              JSON.stringify({ data: hist[packageName], timestamp: Date.now() })
            );
          }
          return;
        }
      } catch {}

      // Fallback: fetch from API
      try {
        const res = await fetch(
          `https://pypistats.org/api/packages/${encodeURIComponent(packageName)}/overall?mirrors=false`
        );
        if (!res.ok) throw new Error("not ok");
        const json = await res.json();
        if (!json.data || !Array.isArray(json.data)) throw new Error("no data");

        const byDate: Record<string, number> = {};
        for (const row of json.data) {
          if (!row.date) continue;
          byDate[row.date] = (byDate[row.date] || 0) + row.downloads;
        }

        const entries = Object.entries(byDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-90)
          .map(([date, downloads]) => ({ date, downloads }));

        if (!cancelled) {
          startTransition(() => setState({ history: entries, loading: false }));
          localStorage.setItem(
            `pypi-history:${packageName}`,
            JSON.stringify({ data: entries, timestamp: Date.now() })
          );
        }
      } catch {
        if (!cancelled) {
          startTransition(() => setState({ history: null, loading: false }));
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [packageName]);

  return state;
}
