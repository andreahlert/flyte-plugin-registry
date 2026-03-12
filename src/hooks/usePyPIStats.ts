"use client";

import { useMemo } from "react";
import { PyPIStats } from "@/lib/types";
import pypiData from "@/data/pypi-stats.json";

const statsRecord = pypiData.stats as Record<string, PyPIStats>;

export function usePyPIStats(packageName: string) {
  const stats = statsRecord[packageName] ?? null;
  return { stats, loading: false };
}

export function useMultiplePyPIStats(packageNames: string[]) {
  const statsMap = useMemo(() => {
    const map = new Map<string, PyPIStats>();
    for (const name of packageNames) {
      const s = statsRecord[name];
      if (s) map.set(name, s);
    }
    return map;
  }, [packageNames]);

  return { statsMap, loading: false };
}
