"use client";

import Link from "next/link";
import { Plugin } from "@/lib/types";
import { PluginIcon } from "@/components/ui/PluginIcon";
import { Marquee } from "@/components/ui/Marquee";
import { ModuleBar } from "@/components/plugins/PluginCard";
import { usePyPIStats } from "@/hooks/usePyPIStats";
import { Download } from "lucide-react";
import pypiData from "@/data/pypi-stats.json";
import { formatDownloads } from "@/lib/utils";

function PluginMarqueeCard({ plugin }: { plugin: Plugin }) {
  const { stats, loading } = usePyPIStats(plugin.packageName);

  return (
    <Link
      href={`/plugins/${plugin.slug}`}
      className="flex flex-col w-[320px] rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] p-5 hover:border-[var(--accent-interactive)]/40 hover:shadow-lg transition-all duration-200 group/card"
      style={{
        boxShadow: "0 2px 8px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)",
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-shrink-0 p-1.5 rounded-xl bg-[var(--accent-light)]">
          <PluginIcon slug={plugin.slug} name={plugin.name} className="w-8 h-8" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--heading)] group-hover/card:text-[var(--accent-interactive)] transition-colors truncate">
            {plugin.name}
          </p>
          <p className="text-xs text-[var(--muted)] truncate" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
            {plugin.packageName}
          </p>
        </div>
      </div>

      <p className="text-sm text-[var(--muted)] line-clamp-3 mb-3 leading-relaxed flex-1">
        {plugin.description}
      </p>

      <div className="mb-2">
        <ModuleBar modules={plugin.modules} />
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span className="font-medium">{plugin.modules.length} module{plugin.modules.length !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-1">
          <Download className="w-2.5 h-2.5" />
          {loading ? (
            <span className="w-6 h-2.5 bg-[var(--surface)] rounded animate-pulse inline-block" />
          ) : stats ? (
            <span>{formatDownloads(stats.lastMonth)}/mo</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export function PopularPlugins({ plugins }: { plugins: Plugin[] }) {
  const statsRecord = pypiData.stats as Record<string, { lastDay: number; lastWeek: number; lastMonth: number }>;
  const popular = [...plugins]
    .sort((a, b) => (statsRecord[b.packageName]?.lastMonth ?? 0) - (statsRecord[a.packageName]?.lastMonth ?? 0))
    .slice(0, 16);

  const firstRow = popular.slice(0, 8);
  const secondRow = popular.slice(8);

  return (
    <section className="px-6 sm:px-10 lg:px-16 mb-20">
      <h2 className="text-2xl font-semibold text-[var(--heading)] mb-6">Popular Plugins</h2>

      <div className="relative space-y-4 -mx-6 sm:-mx-10 lg:-mx-16">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 sm:w-32 lg:w-48 z-10" style={{ background: "linear-gradient(to right, var(--background), transparent)" }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 sm:w-32 lg:w-48 z-10" style={{ background: "linear-gradient(to left, var(--background), transparent)" }} />

        <Marquee pauseOnHover reverse className="[--duration:35s] [--gap:1rem]">
          {firstRow.map((plugin) => (
            <PluginMarqueeCard key={plugin.slug} plugin={plugin} />
          ))}
        </Marquee>

        <Marquee pauseOnHover className="[--duration:35s] [--gap:1rem]">
          {secondRow.map((plugin) => (
            <PluginMarqueeCard key={plugin.slug} plugin={plugin} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}
