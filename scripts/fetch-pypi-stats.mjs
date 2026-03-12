import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginsPath = join(__dirname, "../src/data/plugins.json");
const outputPath = join(__dirname, "../src/data/pypi-stats.json");
const historyPath = join(__dirname, "../src/data/pypi-history.json");

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

async function fetchHistory(packageName) {
  try {
    const res = await fetch(
      `https://pypistats.org/api/packages/${packageName}/overall?mirrors=false`
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.data || !Array.isArray(json.data)) return null;

    // Aggregate categories per date, keep last 90 days
    const byDate = {};
    for (const row of json.data) {
      if (!row.date) continue;
      byDate[row.date] = (byDate[row.date] || 0) + row.downloads;
    }

    const entries = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-90);

    return entries.map(([date, downloads]) => ({ date, downloads }));
  } catch {
    return null;
  }
}

async function main() {
  console.log(`Fetching PyPI stats for ${packageNames.length} packages...`);
  const stats = {};
  const history = {};

  // Fetch in batches of 3 to avoid rate limiting (2 requests per package now)
  for (let i = 0; i < packageNames.length; i += 3) {
    const batch = packageNames.slice(i, i + 3);
    const [recentResults, historyResults] = await Promise.all([
      Promise.all(batch.map(fetchStats)),
      Promise.all(batch.map(fetchHistory)),
    ]);
    batch.forEach((name, idx) => {
      if (recentResults[idx]) {
        stats[name] = recentResults[idx];
      }
      if (historyResults[idx]) {
        history[name] = historyResults[idx];
      }
    });
    console.log(`  ${Math.min(i + 3, packageNames.length)}/${packageNames.length}`);
    if (i + 3 < packageNames.length) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  const output = {
    fetchedAt: new Date().toISOString(),
    stats,
  };

  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`Saved stats to ${outputPath}`);

  const historyOutput = {
    fetchedAt: new Date().toISOString(),
    history,
  };

  writeFileSync(historyPath, JSON.stringify(historyOutput));
  console.log(`Saved download history to ${historyPath} (${Object.keys(history).length} packages)`);
}

main();
