"use client";

import { startTransition, useEffect, useState } from "react";

export interface PyPIMetadata {
  license: string | null;
  requiresPython: string | null;
  latestVersion: string;
  author: string | null;
  releases: { version: string; date: string }[];
}

interface PyPIMetadataState {
  metadata: PyPIMetadata | null;
  loading: boolean;
}

const CACHE_TTL = 24 * 60 * 60 * 1000;

function readCache(packageName: string): PyPIMetadata | null {
  try {
    const cached = localStorage.getItem(`pypi:${packageName}`);
    if (cached) {
      const { metadata, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        return metadata;
      }
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export function usePyPIMetadata(packageName: string): PyPIMetadataState {
  const [state, setState] = useState<PyPIMetadataState>(
    packageName ? { metadata: null, loading: true } : { metadata: null, loading: false }
  );

  useEffect(() => {
    if (!packageName) {
      startTransition(() => setState({ metadata: null, loading: false }));
      return;
    }

    const cached = readCache(packageName);
    if (cached) {
      startTransition(() => setState({ metadata: cached, loading: false }));
      return;
    }

    startTransition(() => setState({ metadata: null, loading: true }));

    let cancelled = false;
    const cacheKey = `pypi:${packageName}`;

    async function fetchMetadata() {
      try {
        const res = await fetch(
          `https://pypi.org/pypi/${encodeURIComponent(packageName)}/json`
        );

        if (!res.ok) {
          if (!cancelled) setState({ metadata: null, loading: false });
          return;
        }

        const data = await res.json();
        const info = data.info ?? {};

        const recentReleases = Object.entries(data.releases ?? {})
          .filter(
            ([, files]) => Array.isArray(files) && (files as unknown[]).length > 0
          )
          .map(([version, files]) => {
            const uploads = files as { upload_time: string }[];
            const latest = uploads.reduce((a, b) =>
              a.upload_time > b.upload_time ? a : b
            );
            return { version, date: latest.upload_time.split("T")[0] };
          })
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 5);

        const metadata: PyPIMetadata = {
          license: info.license || null,
          requiresPython: info.requires_python || null,
          latestVersion: info.version ?? "",
          author: info.author || info.author_email || null,
          releases: recentReleases,
        };

        if (!cancelled) {
          setState({ metadata, loading: false });
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ metadata, timestamp: Date.now() })
          );
        }
      } catch {
        if (!cancelled) {
          setState({ metadata: null, loading: false });
        }
      }
    }

    fetchMetadata();

    return () => {
      cancelled = true;
    };
  }, [packageName]);

  return state;
}
