"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getVotesBulk, upvote, downvote } from "@/lib/upstash";

const STORAGE_KEY = "flyte-registry-votes";

function getLocalVotes(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function setLocalVotes(votes: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...votes]));
  } catch {}
}

/**
 * Hook to manage upvote state for all wishlist items.
 * Loads counts from Upstash on mount, tracks user votes in localStorage.
 */
export function useUpvotes(packageNames: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // Load counts from Upstash + local vote state
  useEffect(() => {
    if (initialized.current || packageNames.length === 0) return;
    initialized.current = true;

    setVoted(getLocalVotes());

    // Batch fetch in chunks of 100 (Upstash MGET limit)
    async function fetchAll() {
      const allCounts: Record<string, number> = {};
      for (let i = 0; i < packageNames.length; i += 100) {
        const chunk = packageNames.slice(i, i + 100);
        const result = await getVotesBulk(chunk);
        Object.assign(allCounts, result);
      }
      setCounts(allCounts);
      setLoading(false);
    }

    fetchAll();
  }, [packageNames]);

  const toggle = useCallback(
    async (packageName: string) => {
      const alreadyVoted = voted.has(packageName);

      // Optimistic update
      setCounts((prev) => ({
        ...prev,
        [packageName]: Math.max(0, (prev[packageName] || 0) + (alreadyVoted ? -1 : 1)),
      }));

      const newVoted = new Set(voted);
      if (alreadyVoted) {
        newVoted.delete(packageName);
      } else {
        newVoted.add(packageName);
      }
      setVoted(newVoted);
      setLocalVotes(newVoted);

      // Persist to Upstash
      if (alreadyVoted) {
        await downvote(packageName);
      } else {
        await upvote(packageName);
      }
    },
    [voted],
  );

  return { counts, voted, toggle, loading };
}
