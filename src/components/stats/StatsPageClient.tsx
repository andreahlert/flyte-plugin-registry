"use client";

import Link from "next/link";
import { Download, Package, Boxes, ArrowLeft } from "lucide-react";
import plugins from "@/data/plugins.json";
import { Plugin } from "@/lib/types";
import { useMultiplePyPIStats } from "@/hooks/usePyPIStats";
import { PluginIcon } from "@/components/ui/PluginIcon";
import { MODULE_TYPE_COLORS } from "@/components/plugins/PluginCard";
import { CATEGORIES } from "@/lib/constants";
import { useMemo, useState } from "react";

const typedPlugins = plugins as Plugin[];

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function StatsPageClient() {
  const packageNames = useMemo(() => typedPlugins.map((p) => p.packageName), []);
  const { statsMap } = useMultiplePyPIStats(packageNames);
  const [rankBy, setRankBy] = useState<"downloads" | "modules">("downloads");

  const totalModules = typedPlugins.reduce((sum, p) => sum + p.modules.length, 0);
  const totalDownloads = Array.from(statsMap.values()).reduce((sum, s) => sum + s.lastMonth, 0);

  // Module type breakdown
  const typeCounts: Record<string, number> = {};
  for (const p of typedPlugins) {
    for (const m of p.modules) {
      typeCounts[m.type] = (typeCounts[m.type] || 0) + 1;
    }
  }
  const typeEntries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  // SDK breakdown
  const flytekitCount = typedPlugins.filter((p) => p.sdk !== "flyte-sdk").length;
  const flyteSdkCount = typedPlugins.filter((p) => p.sdk === "flyte-sdk").length;

  // Top 10 rankings
  const topByDownloads = [...typedPlugins]
    .map((p) => ({ plugin: p, downloads: statsMap.get(p.packageName)?.lastMonth || 0 }))
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 10);

  const topByModules = [...typedPlugins]
    .sort((a, b) => b.modules.length - a.modules.length)
    .slice(0, 10);

  return (
    <div className="px-6 sm:px-10 lg:px-16 py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to registry
      </Link>

      <h1 className="text-3xl font-bold text-[var(--heading)] mb-2">Registry Statistics</h1>
      <p className="text-[var(--muted)] mb-10">Overview of the Flyte plugin ecosystem.</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-[var(--accent)]" />
            <span className="text-sm text-[var(--muted)]">Total Plugins</span>
          </div>
          <p className="text-2xl font-bold text-[var(--heading)]">{typedPlugins.length}</p>
          <p className="text-xs text-[var(--muted)] mt-1">{flytekitCount} flytekit, {flyteSdkCount} flyte-sdk</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center gap-3 mb-2">
            <Boxes className="w-5 h-5 text-[var(--accent)]" />
            <span className="text-sm text-[var(--muted)]">Total Modules</span>
          </div>
          <p className="text-2xl font-bold text-[var(--heading)]">{totalModules}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center gap-3 mb-2">
            <Download className="w-5 h-5 text-[var(--accent)]" />
            <span className="text-sm text-[var(--muted)]">Monthly Downloads</span>
          </div>
          <p className="text-2xl font-bold text-[var(--heading)]">{formatNumber(totalDownloads)}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-[var(--accent)]" />
            <span className="text-sm text-[var(--muted)]">Categories</span>
          </div>
          <p className="text-2xl font-bold text-[var(--heading)]">{CATEGORIES.length}</p>
        </div>
      </div>

      {/* Module type breakdown */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-[var(--heading)] mb-4">Module Types</h2>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
          {/* Bar */}
          <div className="flex w-full h-4 rounded-full overflow-hidden mb-5">
            {typeEntries.map(([type, count]) => (
              <div
                key={type}
                style={{
                  width: `${(count / totalModules) * 100}%`,
                  backgroundColor: MODULE_TYPE_COLORS[type] || MODULE_TYPE_COLORS.other,
                }}
                title={`${type}: ${count}`}
              />
            ))}
          </div>
          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {typeEntries.map(([type, count]) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: MODULE_TYPE_COLORS[type] || MODULE_TYPE_COLORS.other }}
                />
                <span className="text-sm text-[var(--muted)] capitalize">{type}</span>
                <span className="text-sm font-medium text-[var(--heading)]">{count}</span>
                <span className="text-xs text-[var(--muted)]">({((count / totalModules) * 100).toFixed(0)}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rankings */}
      <div>
        <div className="flex items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold text-[var(--heading)]">Top 10</h2>
          <div className="flex rounded-full border border-[var(--border)] overflow-hidden">
            <button
              onClick={() => setRankBy("downloads")}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                rankBy === "downloads"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Downloads
            </button>
            <button
              onClick={() => setRankBy("modules")}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                rankBy === "modules"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              Modules
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
          {(rankBy === "downloads" ? topByDownloads : topByModules.map((p) => ({ plugin: p, downloads: 0 }))).map(
            ({ plugin }, i) => (
              <Link
                key={plugin.slug}
                href={`/plugins/${plugin.slug}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--surface)] transition-colors border-b border-[var(--border)] last:border-b-0"
              >
                <span className="w-6 text-sm text-[var(--muted)] text-right font-medium">{i + 1}</span>
                <PluginIcon slug={plugin.slug} name={plugin.name} className="w-7 h-7 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--heading)] truncate">{plugin.name}</p>
                  <p className="text-xs text-[var(--muted)] truncate" style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                    {plugin.packageName}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  {rankBy === "downloads" ? (
                    <p className="text-sm font-medium text-[var(--heading)]">
                      {formatNumber(statsMap.get(plugin.packageName)?.lastMonth || 0)}/mo
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-[var(--heading)]">
                      {plugin.modules.length} modules
                    </p>
                  )}
                </div>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  );
}
