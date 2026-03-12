import { PyPIStats } from "./types";
import { PYPI_STATS_CACHE_TTL } from "./constants";

interface CacheEntry {
  data: PyPIStats;
  timestamp: number;
}

function getCacheKey(packageName: string): string {
  return `pypi_stats_${packageName}`;
}

function getFromCache(packageName: string): PyPIStats | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getCacheKey(packageName));
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > PYPI_STATS_CACHE_TTL) {
      localStorage.removeItem(getCacheKey(packageName));
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setCache(packageName: string, data: PyPIStats): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry = { data, timestamp: Date.now() };
    localStorage.setItem(getCacheKey(packageName), JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable
  }
}

export async function fetchPyPIStats(
  packageName: string
): Promise<PyPIStats | null> {
  const cached = getFromCache(packageName);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://pypistats.org/api/packages/${packageName}/recent`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const stats: PyPIStats = {
      lastDay: json.data?.last_day ?? 0,
      lastWeek: json.data?.last_week ?? 0,
      lastMonth: json.data?.last_month ?? 0,
    };
    setCache(packageName, stats);
    return stats;
  } catch {
    return null;
  }
}

export async function fetchMultiplePyPIStats(
  packageNames: string[]
): Promise<Map<string, PyPIStats>> {
  const results = new Map<string, PyPIStats>();
  const promises = packageNames.map(async (name) => {
    const stats = await fetchPyPIStats(name);
    if (stats) results.set(name, stats);
  });
  await Promise.all(promises);
  return results;
}
