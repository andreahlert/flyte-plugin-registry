"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { Plugin } from "@/lib/types";
import { Badge, SDKBadge } from "@/components/ui/Badge";
import { PluginIcon } from "@/components/ui/PluginIcon";
import { usePyPIStats } from "@/hooks/usePyPIStats";

function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function PluginCard({ plugin }: { plugin: Plugin }) {
  const { stats, loading } = usePyPIStats(plugin.packageName);

  return (
    <Link
      href={`/plugins/${plugin.slug}`}
      className="group block rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 hover:border-[var(--accent)]/40 hover:shadow-lg transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-1.5 rounded-xl bg-[var(--accent-light)]">
          <PluginIcon slug={plugin.slug} name={plugin.name} className="w-7 h-7" />
        </div>
        <div className="flex items-center gap-1.5">
          <SDKBadge sdk={plugin.sdk} />
          <Badge category={plugin.category} />
        </div>
      </div>

      <h3 className="font-semibold text-[var(--heading)] group-hover:text-[var(--accent)] transition-colors mb-1">
        {plugin.name}
      </h3>

      <p className="text-xs text-[var(--muted)] mb-2" style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
        {plugin.packageName}
      </p>

      <p className="text-sm text-[var(--muted)] line-clamp-2 mb-4 leading-relaxed">
        {plugin.description}
      </p>

      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>{plugin.modules.length} module{plugin.modules.length !== 1 ? "s" : ""}</span>
        <div className="flex items-center gap-1">
          <Download className="w-3.5 h-3.5" />
          {loading ? (
            <span className="w-8 h-3 bg-[var(--surface)] rounded animate-pulse inline-block" />
          ) : stats ? (
            <span>{formatDownloads(stats.lastMonth)}/mo</span>
          ) : (
            <span>N/A</span>
          )}
        </div>
      </div>
    </Link>
  );
}
