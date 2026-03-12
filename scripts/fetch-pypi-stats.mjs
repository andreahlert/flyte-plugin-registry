import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginsPath = join(__dirname, "../src/data/plugins.json");
const outputPath = join(__dirname, "../src/data/pypi-stats.json");

const plugins = JSON.parse(readFileSync(pluginsPath, "utf-8"));
const packageNames = plugins.map((p) => p.packageName);

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
  console.log(`Fetching PyPI stats for ${packageNames.length} packages...`);
  const stats = {};

  // Fetch in batches of 5 to avoid rate limiting
  for (let i = 0; i < packageNames.length; i += 5) {
    const batch = packageNames.slice(i, i + 5);
    const results = await Promise.all(batch.map(fetchStats));
    batch.forEach((name, idx) => {
      if (results[idx]) {
        stats[name] = results[idx];
      }
    });
    console.log(`  ${Math.min(i + 5, packageNames.length)}/${packageNames.length}`);
    if (i + 5 < packageNames.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    stats,
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Saved stats to ${outputPath}`);
}

main();
