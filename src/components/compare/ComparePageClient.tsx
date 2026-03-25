"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plugin } from "@/lib/types";
import plugins from "@/data/plugins.json";
import { usePyPIStats } from "@/hooks/usePyPIStats";
import { useDownloadHistory } from "@/hooks/useDownloadHistory";
import { DownloadChart } from "@/components/ui/DownloadChart";
import { Badge, TagBadge, SDKBadge } from "@/components/ui/Badge";
import { PluginIcon } from "@/components/ui/PluginIcon";
import { ModuleBar } from "@/components/plugins/PluginCard";
import { MODULE_TYPE_COLORS } from "@/lib/constants";
import { formatDownloads } from "@/lib/utils";
import { PluginCombobox } from "@/components/ui/PluginCombobox";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const allPlugins = plugins as Plugin[];

function DownloadStat({ packageName }: { packageName: string }) {
  const { stats, loading } = usePyPIStats(packageName);

  if (loading) {
    return <span className="w-16 h-4 bg-[var(--surface)] rounded animate-pulse inline-block" />;
  }

  if (!stats) return <span className="text-[var(--muted)]">N/A</span>;

  return <span>{formatDownloads(stats.lastMonth)}/mo</span>;
}

/* eslint-disable @next/next/no-img-element */
function MaintainerAvatars({ maintainers }: { maintainers?: Plugin["maintainers"] }) {
  if (!maintainers || maintainers.length === 0) {
    return <span className="text-[var(--muted)]">None</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {maintainers.slice(0, 6).map((m) => (
        <img
          key={m.login}
          src={m.avatarUrl}
          alt={m.login}
          title={m.login}
          width={28}
          height={28}
          className="w-7 h-7 rounded-full border border-[var(--border)]"
        />
      ))}
      {maintainers.length > 6 && (
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--muted)] font-medium">
          +{maintainers.length - 6}
        </span>
      )}
    </div>
  );
}

function CompareDownloadChart({ pluginA, pluginB }: { pluginA: Plugin; pluginB: Plugin }) {
  const { history: histA } = useDownloadHistory(pluginA.packageName);
  const { history: histB } = useDownloadHistory(pluginB.packageName);

  if ((!histA || histA.length < 7) && (!histB || histB.length < 7)) return null;

  const series = [];
  if (histA && histA.length > 7) {
    series.push({ label: pluginA.name, data: histA, color: "#7c3aed", isV2: pluginA.sdk === "flyte-sdk" });
  }
  if (histB && histB.length > 7) {
    series.push({ label: pluginB.name, data: histB, color: "#3b82f6", isV2: pluginB.sdk === "flyte-sdk" });
  }

  if (series.length === 0) return null;

  return (
    <div className="mt-8 rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] p-5">
      <h3 className="text-sm font-medium text-[var(--muted)] mb-3">Download History (last 90 days)</h3>
      <DownloadChart series={series} height={200} />
    </div>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const slugA = searchParams.get("a") || "";
  const slugB = searchParams.get("b") || "";

  const pluginA = allPlugins.find((p) => p.slug === slugA) || null;
  const pluginB = allPlugins.find((p) => p.slug === slugB) || null;

  function updateParam(key: "a" | "b", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`/compare?${params.toString()}`);
  }

  const rows: {
    label: string;
    render: (plugin: Plugin) => React.ReactNode;
  }[] = [
    {
      label: "Name",
      render: (p) => (
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-lg bg-[var(--accent-light)] flex-shrink-0">
            <PluginIcon slug={p.slug} name={p.name} className="w-8 h-8" />
          </div>
          <Link
            href={`/plugins/${p.slug}`}
            className="font-semibold text-[var(--heading)] hover:text-[var(--accent)] transition-colors"
          >
            {p.name}
          </Link>
        </div>
      ),
    },
    {
      label: "Package",
      render: (p) => (
        <span
          className="text-sm text-[var(--muted)]"
          style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
        >
          {p.packageName}
        </span>
      ),
    },
    {
      label: "Category",
      render: (p) => <Badge category={p.category} />,
    },
    {
      label: "SDK",
      render: (p) => (
        <span className="text-sm">
          <SDKBadge sdk={p.sdk} />
          {(!p.sdk || p.sdk === "flytekit") && (
            <span className="text-[var(--muted)] text-xs">flytekit</span>
          )}
        </span>
      ),
    },
    {
      label: "Modules",
      render: (p) => (
        <div className="space-y-1.5">
          <span className="text-sm font-medium">
            {p.modules.length} module{p.modules.length !== 1 ? "s" : ""}
          </span>
          <div className="w-full overflow-visible relative">
            <ModuleBar modules={p.modules} />
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--muted)]">
            {Object.entries(
              p.modules.reduce<Record<string, number>>((acc, m) => {
                acc[m.type] = (acc[m.type] || 0) + 1;
                return acc;
              }, {})
            ).map(([type, count]) => (
              <span key={type} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: MODULE_TYPE_COLORS[type] || MODULE_TYPE_COLORS.other }}
                />
                {count} {type}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: "Dependencies",
      render: (p) => (
        <span className="text-sm">
          {p.dependencies.length} dependenc{p.dependencies.length !== 1 ? "ies" : "y"}
        </span>
      ),
    },
    {
      label: "Min SDK Version",
      render: (p) => (
        <div className="space-y-1">
          <span
            className="text-sm px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] inline-block"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
          >
            {p.minFlytekitVersion}+
          </span>
          <p className="text-xs text-[var(--muted)]">
            {p.sdk === "flyte-sdk" ? "Flyte SDK" : "Flytekit"}
          </p>
        </div>
      ),
    },
    {
      label: "Downloads",
      render: (p) => (
        <span className="text-sm font-medium">
          <DownloadStat packageName={p.packageName} />
        </span>
      ),
    },
    {
      label: "Contributors",
      render: (p) => <MaintainerAvatars maintainers={p.maintainers} />,
    },
    {
      label: "Tags",
      render: (p) => (
        <div className="flex flex-wrap gap-1.5">
          {p.tags.length > 0 ? (
            p.tags.map((tag) => <TagBadge key={tag} tag={tag} />)
          ) : (
            <span className="text-[var(--muted)] text-sm">None</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="px-6 sm:px-10 lg:px-16 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to registry
      </Link>

      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--heading)] mb-2">
        Compare Plugins
      </h1>
      <p className="text-[var(--muted)] mb-8">
        Pick two plugins to see how they differ side by side.
      </p>

      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1.5 uppercase tracking-wider">
            Plugin A
          </label>
          <PluginCombobox
            plugins={allPlugins}
            value={slugA}
            onChange={(slug) => updateParam("a", slug)}
            disabledSlug={slugB}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1.5 uppercase tracking-wider">
            Plugin B
          </label>
          <PluginCombobox
            plugins={allPlugins}
            value={slugB}
            onChange={(slug) => updateParam("b", slug)}
            disabledSlug={slugA}
          />
        </div>
      </div>

      {/* Comparison */}
      {pluginA && pluginB ? (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[var(--border)]">
                  <th className="text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider px-5 py-3 w-[140px]">
                    Attribute
                  </th>
                  <th className="text-left px-5 py-3">
                    <span className="text-sm font-semibold text-[var(--heading)]">{pluginA.name}</span>
                  </th>
                  <th className="text-left px-5 py-3 border-l border-[var(--border)]">
                    <span className="text-sm font-semibold text-[var(--heading)]">{pluginB.name}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.label}
                    className={i % 2 === 0 ? "bg-[var(--surface)]/30" : ""}
                  >
                    <td className="px-5 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wider align-top whitespace-nowrap">
                      {row.label}
                    </td>
                    <td className="px-5 py-3 align-top">{row.render(pluginA)}</td>
                    <td className="px-5 py-3 align-top border-l border-[var(--border)]">
                      {row.render(pluginB)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Download History Chart */}
          <CompareDownloadChart pluginA={pluginA} pluginB={pluginB} />

          {/* Mobile stacked view */}
          <div className="md:hidden space-y-6">
            {[pluginA, pluginB].map((plugin) => (
              <div
                key={plugin.slug}
                className="rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--surface)]/50">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-[var(--accent-light)]">
                      <PluginIcon slug={plugin.slug} name={plugin.name} className="w-6 h-6" />
                    </div>
                    <span className="font-semibold text-[var(--heading)]">{plugin.name}</span>
                  </div>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {rows.slice(1).map((row) => (
                    <div key={row.label} className="px-5 py-3">
                      <div className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-1">
                        {row.label}
                      </div>
                      {row.render(plugin)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--card-bg)] p-12 text-center">
          <p className="text-[var(--muted)]">
            {!slugA && !slugB
              ? "Select two plugins above to start comparing."
              : "Select both plugins to see the comparison."}
          </p>
        </div>
      )}
    </div>
  );
}

export function ComparePageClient() {
  return (
    <Suspense
      fallback={
        <div className="px-6 sm:px-10 lg:px-16 py-10">
          <div className="h-8 w-48 bg-[var(--surface)] rounded animate-pulse mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="h-12 bg-[var(--surface)] rounded-xl animate-pulse" />
            <div className="h-12 bg-[var(--surface)] rounded-xl animate-pulse" />
          </div>
        </div>
      }
    >
      <CompareContent />
    </Suspense>
  );
}
