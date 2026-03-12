"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Github, BookOpen, Package } from "lucide-react";
import { Plugin } from "@/lib/types";
import { Badge, TagBadge, SDKBadge } from "@/components/ui/Badge";
import { InstallCommand } from "@/components/plugins/InstallCommand";
import { ModuleList } from "@/components/plugins/ModuleList";
import { PluginIcon } from "@/components/ui/PluginIcon";
import { usePyPIStats } from "@/hooks/usePyPIStats";

function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function PluginDetailClient({ plugin }: { plugin: Plugin }) {
  const { stats, loading } = usePyPIStats(plugin.packageName);

  return (
    <div className="px-6 sm:px-10 lg:px-16 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all plugins
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-[var(--accent-light)]">
                <PluginIcon slug={plugin.slug} name={plugin.name} className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-[var(--heading)]">
                  {plugin.name}
                </h1>
                <p className="text-sm text-[var(--muted)]" style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                  {plugin.packageName}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <SDKBadge sdk={plugin.sdk} />
              <Badge category={plugin.category} />
              {plugin.tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
              {plugin.isDeprecated && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  Deprecated
                </span>
              )}
            </div>

            <p className="text-[var(--muted)] text-lg leading-relaxed">
              {plugin.description}
            </p>
          </div>

          <InstallCommand command={plugin.installCommand} />

          <ModuleList modules={plugin.modules} />

          {plugin.dependencies.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--heading)] mb-3">Dependencies</h3>
              <div className="flex flex-wrap gap-2">
                {plugin.dependencies.map((dep) => (
                  <span
                    key={dep}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-sm bg-[var(--surface)] border border-[var(--border)]"
                    style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 space-y-4">
            <h3 className="font-semibold text-[var(--heading)]">Package Info</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Min Flytekit</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                  {plugin.minFlytekitVersion}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Modules</span>
                <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                  {plugin.modules.length}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--border)]">
              <h4 className="text-sm font-medium text-[var(--muted)] mb-3">
                Downloads
              </h4>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-5 bg-[var(--border)] rounded animate-pulse"
                    />
                  ))}
                </div>
              ) : stats ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Last day</span>
                    <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                      {formatNumber(stats.lastDay)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Last week</span>
                    <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                      {formatNumber(stats.lastWeek)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Last month</span>
                    <span style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                      {formatNumber(stats.lastMonth)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)]">Stats unavailable</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 space-y-3">
            <h3 className="font-semibold text-[var(--heading)]">Links</h3>
            <div className="space-y-2">
              <a
                href={plugin.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
              >
                <Github className="w-4 h-4" />
                Source Code
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
              <a
                href={plugin.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
              >
                <BookOpen className="w-4 h-4" />
                Documentation
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
              <a
                href={plugin.pypiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
              >
                <Package className="w-4 h-4" />
                PyPI
                <ExternalLink className="w-3 h-3 ml-auto" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PluginNotFound({ slug }: { slug: string }) {
  return (
    <div className="px-6 sm:px-10 lg:px-16 py-20 text-center">
      <h1 className="text-2xl font-bold text-[var(--heading)] mb-2">Plugin not found</h1>
      <p className="text-[var(--muted)] mb-6">
        The plugin &ldquo;{slug}&rdquo; does not exist.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-[var(--accent)] hover:underline"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all plugins
      </Link>
    </div>
  );
}
