"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink, Github, BookOpen, Package, Scale, Clock, Shield, GitCompare, FlaskConical, ArrowRightLeft } from "lucide-react";
import { Plugin } from "@/lib/types";
import { Badge, TagBadge, SDKBadge } from "@/components/ui/Badge";
import { InstallCommand } from "@/components/plugins/InstallCommand";
import { ModuleList } from "@/components/plugins/ModuleList";
import { PluginIcon } from "@/components/ui/PluginIcon";
import { usePyPIStats } from "@/hooks/usePyPIStats";
import { usePyPIMetadata } from "@/hooks/usePyPIMetadata";
import { RelatedPlugins } from "@/components/plugins/RelatedPlugins";

import { CopyButton } from "@/components/ui/CopyButton";
import { PluginModule } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

function generateQuickStart(plugin: Plugin): string | null {
  const modules = plugin.modules;
  if (modules.length === 0) return null;

  const tasks = modules.filter((m) => m.type === "task");
  const types = modules.filter((m) => m.type === "type");
  const agents = modules.filter((m) => m.type === "agent");

  const lines: string[] = [];

  // Always show install first
  lines.push(`pip install ${plugin.packageName}`);
  lines.push("");

  // Group imports by importPath, max 4 modules
  const importGroups = new Map<string, PluginModule[]>();
  for (const m of modules.slice(0, 4)) {
    const existing = importGroups.get(m.importPath) || [];
    existing.push(m);
    importGroups.set(m.importPath, existing);
  }

  // Add flytekit imports
  lines.push("from flytekit import task, workflow");
  for (const [path, mods] of importGroups) {
    const names = mods.map((m) => m.name).join(", ");
    lines.push(`from ${path} import ${names}`);
  }

  lines.push("");

  // Generate usage based on module types
  if (tasks.length > 0) {
    const t = tasks[0];
    if (/^[a-z]/.test(t.name)) {
      lines.push("@task");
      lines.push(`def my_task() -> None:`);
      lines.push(`    ${t.name}(...)`);
    } else {
      lines.push(`@task(task_config=${t.name}(...))`);
      lines.push(`def my_task() -> None:`);
      lines.push(`    ...`);
    }
  } else if (types.length > 0) {
    const t = types[0];
    lines.push(`config = ${t.name}(...)`);
    lines.push("");
    lines.push("@task");
    lines.push("def my_task() -> None:");
    lines.push("    ...");
  } else if (agents.length > 0) {
    const a = agents[0];
    lines.push(`agent = ${a.name}(...)`);
  } else {
    return null;
  }

  lines.push("");
  lines.push("@workflow");
  lines.push("def my_workflow() -> None:");
  lines.push("    my_task()");

  return lines.join("\n");
}

function QuickStart({ plugin }: { plugin: Plugin }) {
  const code = generateQuickStart(plugin);
  if (!code) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-[var(--heading)]">
          Quick Start
          <span className="ml-2 text-xs font-normal text-[var(--muted)]">(example, may need adjustment)</span>
        </h3>
        {plugin.snacksUrl && (
          <a
            href={plugin.snacksUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            <FlaskConical className="w-3 h-3" />
            See full examples
          </a>
        )}
      </div>
      <div className="relative rounded-2xl border-2 border-[var(--border)] bg-[#1a1a2e] p-5 overflow-x-auto">
        <div className="absolute top-3 right-3">
          <CopyButton text={code} />
        </div>
        <pre className="text-sm text-green-300 leading-relaxed" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

function VersionHistory({ releases }: { releases: { version: string; date: string }[] }) {
  if (releases.length === 0) return null;

  return (
    <div className="pt-3 border-t border-[var(--border)]">
      <h4 className="text-sm font-medium text-[var(--muted)] mb-3 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5" />
        Recent Releases
      </h4>
      <div className="space-y-2">
        {releases.map((r, i) => (
          <div key={r.version} className="flex items-center justify-between text-sm">
            <span
              className={i === 0 ? "font-medium text-[var(--heading)]" : "text-[var(--muted)]"}
              style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
            >
              {r.version}
            </span>
            <span className="text-xs text-[var(--muted)]">{r.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AlternativeVersionBanner({ plugin, allPlugins }: { plugin: Plugin; allPlugins: Plugin[] }) {
  const isV2 = plugin.slug.startsWith("v2-");
  const baseSlug = isV2 ? plugin.slug.replace("v2-", "") : plugin.slug;
  const altSlug = isV2 ? baseSlug : `v2-${baseSlug}`;
  const alt = allPlugins.find((p) => p.slug === altSlug);

  if (!alt) return null;

  return (
    <div className="rounded-xl border-2 border-[var(--accent)]/20 bg-[var(--accent)]/5 px-4 py-3 mb-6">
      <div className="flex items-center gap-3">
        <ArrowRightLeft className="w-4 h-4 text-[var(--accent)] flex-shrink-0" />
        <p className="text-sm text-[var(--foreground)] flex-1">
          {isV2 ? (
            <>
              This is the <strong>Flyte SDK (v2)</strong> version of this plugin.
              The Flytekit version is available as{" "}
              <Link href={`/plugins/${altSlug}`} className="font-medium text-[var(--accent)] hover:underline">
                {alt.packageName}
              </Link>.
            </>
          ) : (
            <>
              A <strong>Flyte SDK (v2)</strong> version of this plugin is available as{" "}
              <Link href={`/plugins/${altSlug}`} className="font-medium text-[var(--accent)] hover:underline">
                {alt.packageName}
              </Link>.
            </>
          )}
        </p>
      </div>
    </div>
  );
}

export function PluginDetailClient({ plugin, allPlugins = [] }: { plugin: Plugin; allPlugins?: Plugin[] }) {
  const { stats, loading } = usePyPIStats(plugin.packageName);
  const { metadata, loading: metaLoading } = usePyPIMetadata(plugin.packageName);

  return (
    <div className="px-6 sm:px-10 lg:px-16 py-10">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all plugins
        </Link>
        <Link
          href={`/compare?a=${plugin.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        >
          <GitCompare className="w-4 h-4" />
          Compare
        </Link>
      </div>

      <AlternativeVersionBanner plugin={plugin} allPlugins={allPlugins} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-[var(--accent-light)]">
                <PluginIcon slug={plugin.slug} name={plugin.name} className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-[var(--heading)]">
                  {plugin.name}
                </h1>
                <p className="text-sm text-[var(--muted)]" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
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

          <QuickStart plugin={plugin} />

          <ModuleList modules={plugin.modules} />

          {plugin.dependencies.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--heading)] mb-3">Dependencies</h3>
              <div className="flex flex-wrap gap-2">
                {plugin.dependencies.map((dep, i) => (
                  <span
                    key={`${dep}-${i}`}
                    className="inline-flex items-center px-3 py-1 rounded-lg text-sm bg-[var(--surface)] border-2 border-[var(--border)]"
                    style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Related Plugins */}
          {allPlugins.length > 0 && (
            <RelatedPlugins currentPlugin={plugin} allPlugins={allPlugins} />
          )}
        </div>

        <div className="space-y-6">
          {/* Package Info */}
          <div className="rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] p-5 space-y-4">
            <h3 className="font-semibold text-[var(--heading)]">Package Info</h3>

            <div className="space-y-3">
              {/* Latest version */}
              {metaLoading ? (
                <div className="h-5 bg-[var(--border)] rounded animate-pulse" />
              ) : metadata ? (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">Latest</span>
                  <span className="font-medium text-[var(--heading)]" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
                    {metadata.latestVersion}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">{plugin.sdk === "flyte-sdk" ? "Min Flyte SDK" : "Min Flytekit"}</span>
                <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
                  {plugin.minFlytekitVersion}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Modules</span>
                <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
                  {plugin.modules.length}
                </span>
              </div>

              {/* License */}
              {metadata?.license && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)] flex items-center gap-1">
                    <Scale className="w-3 h-3" />
                    License
                  </span>
                  <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
                    {metadata.license.length > 20 ? metadata.license.split(/[,(]/)[0].trim() : metadata.license}
                  </span>
                </div>
              )}

              {/* Python compatibility */}
              {metadata?.requiresPython && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)] flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Python
                  </span>
                  <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
                    {metadata.requiresPython}
                  </span>
                </div>
              )}
            </div>

            {/* Downloads */}
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
                    <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
                      {formatNumber(stats.lastDay)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Last week</span>
                    <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
                      {formatNumber(stats.lastWeek)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--muted)]">Last month</span>
                    <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
                      {formatNumber(stats.lastMonth)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[var(--muted)]">Stats unavailable</p>
              )}
            </div>

            {/* Version History */}
            {metadata?.releases && (
              <VersionHistory releases={metadata.releases} />
            )}
          </div>

          {/* Contributors */}
          {plugin.maintainers && plugin.maintainers.length > 0 && (
            <div className="rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] p-5 space-y-3">
              <h3 className="font-semibold text-[var(--heading)]">Contributors</h3>
              <div className="space-y-2.5">
                {plugin.maintainers.map((m) => (
                  <a
                    key={m.login}
                    href={`https://github.com/${m.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
                  >
                    <img
                      src={m.avatarUrl}
                      alt={m.login}
                      className="w-7 h-7 rounded-full border border-[var(--border)]"
                    />
                    <span>{m.login}</span>
                    <ExternalLink className="w-3 h-3 ml-auto text-[var(--muted)]" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] p-5 space-y-3">
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
              {plugin.snacksUrl && (
                <a
                  href={plugin.snacksUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                >
                  <FlaskConical className="w-4 h-4" />
                  Examples
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </a>
              )}
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
      <h1 className="text-2xl font-semibold text-[var(--heading)] mb-2">Plugin not found</h1>
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
