import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const candidatesPath = join(__dirname, "../src/data/wishlist-candidates.json");
const pluginsPath = join(__dirname, "../src/data/plugins.json");
const outputPath = join(__dirname, "../src/data/wishlist.json");

const candidates = JSON.parse(readFileSync(candidatesPath, "utf-8")).candidates;
const plugins = JSON.parse(readFileSync(pluginsPath, "utf-8"));

// Detect V1-only plugins (exist in flytekit but not in flyte-sdk)
function detectV1Only() {
  const v2Slugs = new Set();
  const v1Plugins = [];

  for (const p of plugins) {
    if (p.sdk === "flyte-sdk") {
      // v2-spark -> spark, v2-bigquery -> bigquery
      const base = p.slug.replace(/^v2-/, "");
      v2Slugs.add(base);
    }
  }

  for (const p of plugins) {
    if (p.sdk !== "flyte-sdk" && !v2Slugs.has(p.slug)) {
      v1Plugins.push(p);
    }
  }

  return v1Plugins;
}

// Filter out candidates that already have a plugin
function filterCandidates() {
  const existingPackages = new Set(plugins.map((p) => p.packageName));
  return candidates.filter((c) => !existingPackages.has(c.packageName));
}

async function fetchStats(packageName) {
  try {
    const res = await fetch(
      `https://pypistats.org/api/packages/${packageName}/recent`
    );
    if (!res.ok) return null;
    const json = await res.json();
    return {
      lastDay: json.data?.last_day ?? 0,
      lastWeek: json.data?.last_week ?? 0,
      lastMonth: json.data?.last_month ?? 0,
    };
  } catch {
    return null;
  }
}

async function main() {
  const filteredCandidates = filterCandidates();
  const v1Only = detectV1Only();

  console.log(
    `Wishlist: ${filteredCandidates.length} new candidates, ${v1Only.length} V1-only plugins`
  );

  // Build wishlist items
  const items = [];

  // New candidates (no-plugin)
  for (const c of filteredCandidates) {
    items.push({
      packageName: c.packageName,
      name: c.name,
      description: c.description,
      category: c.category,
      gapType: "no-plugin",
      pypiUrl: `https://pypi.org/project/${c.packageName}/`,
      githubUrl: c.githubUrl || undefined,
      discussionUrl: undefined,
      downloads: null,
      voteCount: 0,
    });
  }

  // V1-only (needs-v2-port)
  for (const p of v1Only) {
    items.push({
      packageName: p.packageName,
      name: p.name,
      description: p.description,
      category: p.category,
      gapType: "needs-v2-port",
      pypiUrl: p.pypiUrl,
      githubUrl: p.githubUrl || undefined,
      discussionUrl: undefined,
      downloads: null,
      voteCount: 0,
      existingPluginSlug: p.slug,
    });
  }

  // Fetch PyPI stats in batches of 3
  const packageNames = items.map((i) => i.packageName);
  console.log(`Fetching PyPI stats for ${packageNames.length} packages...`);

  for (let i = 0; i < items.length; i += 3) {
    const batch = items.slice(i, i + 3);
    const results = await Promise.all(
      batch.map((item) => fetchStats(item.packageName))
    );
    batch.forEach((item, idx) => {
      item.downloads = results[idx];
    });
    console.log(`  ${Math.min(i + 3, items.length)}/${items.length}`);
    if (i + 3 < items.length) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    items,
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Saved ${items.length} wishlist items to ${outputPath}`);
}

main();
