"use client";

import Link from "next/link";
import { Download, ChevronRight } from "lucide-react";
import { Plugin, PluginModule } from "@/lib/types";
import { SDKBadge } from "@/components/ui/Badge";
import { PluginIcon } from "@/components/ui/PluginIcon";
import { usePyPIStats } from "@/hooks/usePyPIStats";
import { formatDownloads } from "@/lib/utils";
import { MODULE_TYPE_COLORS } from "@/lib/constants";

function ModuleBar({ modules }: { modules: PluginModule[] }) {
  if (modules.length === 0) return null;

  const counts: Record<string, number> = {};
  for (const m of modules) {
    counts[m.type] = (counts[m.type] || 0) + 1;
  }

  const total = modules.length;
  const segments = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="flex w-full h-2 rounded-full bg-[var(--surface)] overflow-visible">
      {segments.map(([type, count], i) => (
        <div
          key={type}
          className="module-bar-segment cursor-default"
          style={{
            width: `${(count / total) * 100}%`,
            backgroundColor: MODULE_TYPE_COLORS[type] || MODULE_TYPE_COLORS.other,
            borderRadius:
              segments.length === 1
                ? "9999px"
                : i === 0
                  ? "9999px 0 0 9999px"
                  : i === segments.length - 1
                    ? "0 9999px 9999px 0"
                    : "0",
          }}
        >
          <span className="module-bar-tooltip">
            {count} {type}{count !== 1 ? "s" : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PluginCard({ plugin }: { plugin: Plugin }) {
  const { stats, loading } = usePyPIStats(plugin.packageName);

  return (
    <Link
      href={`/plugins/${plugin.slug}`}
      className="group flex items-center gap-5 rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] p-5 hover:border-[var(--accent-interactive)]/40 hover:shadow-md hover:-translate-y-0.5 hover:bg-[var(--surface)] transition-all duration-200"
    >
      {/* Icon */}
      <div className="flex-shrink-0 p-1.5 rounded-xl bg-[var(--accent-light)]">
        <PluginIcon slug={plugin.slug} name={plugin.name} className="w-10 h-10" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-[var(--heading)] group-hover:text-[var(--accent)] transition-colors truncate">
            {plugin.name}
          </h3>
          {plugin.sdk === "flyte-sdk" && (
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-gradient-to-r from-[var(--accent)] to-[var(--brand)] text-white leading-none">
              v2
            </span>
          )}
          <SDKBadge sdk={plugin.sdk} />
        </div>

        <p className="text-xs text-[var(--muted)] mb-1" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
          {plugin.packageName}
        </p>

        <p className="text-sm text-[var(--muted)] line-clamp-1 mb-3 leading-relaxed">
          {plugin.description}
        </p>

        {/* Module bar */}
        <div className="mb-2.5 overflow-visible relative">
          <ModuleBar modules={plugin.modules} />
        </div>

        {/* Footer stats */}
        <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
          <span className="font-medium">{plugin.modules.length} module{plugin.modules.length !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            {loading ? (
              <span className="w-8 h-3 bg-[var(--surface)] rounded animate-pulse inline-block" />
            ) : stats ? (
              <span>{formatDownloads(stats.lastMonth)}/mo</span>
            ) : null}
          </div>
          {plugin.minFlytekitVersion && plugin.minFlytekitVersion !== "1.0.0" && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface)] border border-[var(--border)]">
              {plugin.minFlytekitVersion}+
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-5 h-5 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </Link>
  );
}

export { ModuleBar };
