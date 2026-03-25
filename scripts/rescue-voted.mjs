/**
 * Rescue packages that fell below the discovery threshold but have community votes.
 *
 * Runs between discover-opportunities.py and fetch-wishlist.mjs.
 * Reads voted packages from Upstash Redis, checks which ones were filtered out
 * of wishlist-candidates.json, fetches their PyPI metadata, and adds them back
 * with belowThreshold: true.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const candidatesPath = join(__dirname, "../src/data/wishlist-candidates.json");

const UPSTASH_URL = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN;

async function redis(command) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.log("Upstash credentials not set, skipping rescue step.");
    return null;
  }
  const res = await fetch(UPSTASH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.result;
}

async function fetchPyPIInfo(packageName) {
  try {
    const res = await fetch(`https://pypi.org/pypi/${packageName}/json`);
    if (!res.ok) return null;
    const data = await res.json();
    const info = data.info || {};

    // Find GitHub URL
    let githubUrl = null;
    const urls = info.project_urls || {};
    for (const key of ["Source", "Source Code", "Repository", "GitHub", "Homepage", "Code"]) {
      if (urls[key] && urls[key].includes("github.com")) {
        githubUrl = urls[key].replace(/\/$/, "");
        break;
      }
    }
    if (!githubUrl && info.home_page && info.home_page.includes("github.com")) {
      githubUrl = info.home_page.replace(/\/$/, "");
    }

    let displayName = info.name || packageName;
    if (displayName === displayName.toLowerCase()) {
      displayName = displayName.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }

    return {
      name: displayName,
      description: (info.summary || "").slice(0, 200),
      githubUrl,
    };
  } catch {
    return null;
  }
}

async function main() {
  // 1. Get all voted package names from Upstash
  const keys = await redis(["KEYS", "votes:*"]);
  if (!keys || keys.length === 0) {
    console.log("No votes found in Upstash, nothing to rescue.");
    return;
  }

  // 2. Get vote counts
  const values = await redis(["MGET", ...keys]);
  const votedPackages = {};
  keys.forEach((key, i) => {
    const name = key.replace("votes:", "");
    const count = parseInt(values[i] || "0", 10);
    if (count > 0) {
      votedPackages[name] = count;
    }
  });

  console.log(`Found ${Object.keys(votedPackages).length} packages with votes.`);

  // 3. Load current candidates
  const candidates = JSON.parse(readFileSync(candidatesPath, "utf-8"));
  const existingNames = new Set(candidates.candidates.map((c) => c.packageName));

  // 4. Find voted packages NOT in candidates
  const missing = Object.keys(votedPackages).filter((name) => !existingNames.has(name));

  if (missing.length === 0) {
    console.log("All voted packages are already in the candidates list.");
    return;
  }

  console.log(`Rescuing ${missing.length} below-threshold packages with votes: ${missing.join(", ")}`);

  // 5. Fetch PyPI info and add them back
  for (const packageName of missing) {
    const info = await fetchPyPIInfo(packageName);
    if (!info) {
      console.log(`  Skipping ${packageName}: not found on PyPI`);
      continue;
    }

    candidates.candidates.push({
      packageName,
      name: info.name,
      description: info.description,
      category: "developer-tools", // safe default, heuristics already missed it
      githubUrl: info.githubUrl,
      belowThreshold: true,
    });

    console.log(`  Rescued: ${packageName} (${votedPackages[packageName]} votes)`);
  }

  // 6. Save updated candidates
  writeFileSync(candidatesPath, JSON.stringify(candidates, null, 2));
  console.log(`Updated candidates: ${candidates.candidates.length} total.`);
}

main();
