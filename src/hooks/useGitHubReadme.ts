"use client";

import { startTransition, useEffect, useState } from "react";

interface ReadmeState {
  content: string | null;
  loading: boolean;
}

const CACHE_TTL = 24 * 60 * 60 * 1000;

function readCache(githubUrl: string): string | null {
  try {
    const cached = localStorage.getItem(`readme:${githubUrl}`);
    if (cached) {
      const { content, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        return content;
      }
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export function useGitHubReadme(githubUrl: string): ReadmeState {
  const [state, setState] = useState<ReadmeState>(() => {
    const cached = readCache(githubUrl);
    if (cached) return { content: cached, loading: false };
    return { content: null, loading: true };
  });

  useEffect(() => {
    const cached = readCache(githubUrl);
    if (cached) {
      startTransition(() => setState({ content: cached, loading: false }));
      return;
    }

    startTransition(() => setState({ content: null, loading: true }));

    let cancelled = false;

    async function fetchReadme() {
      try {
        const match = githubUrl.match(
          /github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)/
        );
        if (!match) {
          if (!cancelled) setState({ content: null, loading: false });
          return;
        }

        const [, owner, repo, branch, path] = match;
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}/README.md?ref=${branch}`;

        const res = await fetch(apiUrl, {
          headers: { Accept: "application/vnd.github.v3.raw" },
        });

        if (!res.ok) {
          if (!cancelled) setState({ content: null, loading: false });
          return;
        }

        const text = await res.text();
        if (!cancelled) {
          setState({ content: text, loading: false });
        }
      } catch {
        if (!cancelled) {
          setState({ content: null, loading: false });
        }
      }
    }

    fetchReadme();

    return () => { cancelled = true; };
  }, [githubUrl]);

  // Cache on content change
  useEffect(() => {
    if (state.content) {
      const cacheKey = `readme:${githubUrl}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        content: state.content,
        timestamp: Date.now(),
      }));
    }
  }, [state.content, githubUrl]);

  return state;
}
