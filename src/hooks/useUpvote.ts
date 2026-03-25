"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getVotesBulk, upvote, downvote, getFingerprintedVotes } from "@/lib/upstash";

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

/** Generate a browser fingerprint hash (not unique per user, but good enough to prevent casual multi-voting) */
async function getFingerprint(): Promise<string> {
  const raw = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    // Canvas fingerprint
    (() => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return "";
        ctx.textBaseline = "top";
        ctx.font = "14px Arial";
        ctx.fillText("fp", 2, 2);
        return canvas.toDataURL().slice(-50);
      } catch {
        return "";
      }
    })(),
  ].join("|");

  // Hash with SubtleCrypto
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
}

/**
 * Hook to manage upvote state for all wishlist items.
 * Uses browser fingerprint stored server-side in Upstash to prevent
 * duplicate votes across incognito/different browsers on the same device.
 * localStorage provides instant UI state.
 */
export function useUpvotes(packageNames: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);
  const fpRef = useRef<string>("");

  useEffect(() => {
    if (initialized.current || packageNames.length === 0) return;
    initialized.current = true;

    async function init() {
      // Generate fingerprint
      const fp = await getFingerprint();
      fpRef.current = fp;

      // Fetch vote counts
      const allCounts: Record<string, number> = {};
      for (let i = 0; i < packageNames.length; i += 100) {
        const chunk = packageNames.slice(i, i + 100);
        const result = await getVotesBulk(chunk);
        Object.assign(allCounts, result);
      }
      setCounts(allCounts);

      // Check which packages this fingerprint already voted on
      const fpVoted = await getFingerprintedVotes(fp, packageNames);

      // Merge: server-side fingerprint is the source of truth,
      // but also include localStorage for instant state
      const localVotes = getLocalVotes();
      const merged = new Set([...fpVoted, ...localVotes]);
      setVoted(merged);
      setLocalVotes(merged);

      setLoading(false);
    }

    init();
  }, [packageNames]);

  const toggle = useCallback(
    async (packageName: string) => {
      const fp = fpRef.current;
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

      // Persist to Upstash with fingerprint
      if (alreadyVoted) {
        await downvote(packageName, fp);
      } else {
        const result = await upvote(packageName, fp);
        if (result === -1) {
          // Server rejected: fingerprint already voted
          // Revert optimistic update
          setCounts((prev) => ({
            ...prev,
            [packageName]: Math.max(0, (prev[packageName] || 0) - 1),
          }));
          newVoted.delete(packageName);
          setVoted(newVoted);
          setLocalVotes(newVoted);
        }
      }
    },
    [voted],
  );

  return { counts, voted, toggle, loading };
}
