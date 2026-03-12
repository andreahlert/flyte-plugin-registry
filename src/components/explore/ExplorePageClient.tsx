"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Filter } from "lucide-react";
import plugins from "@/data/plugins.json";
import { Plugin, PluginModule } from "@/lib/types";
import { PluginIcon } from "@/components/ui/PluginIcon";
import { CATEGORIES } from "@/lib/constants";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

const typedPlugins = plugins as Plugin[];

const MODULE_TYPES = ["task", "agent", "type", "sensor", "workflow", "other"] as const;

export function ExplorePageClient() {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSdk, setSelectedSdk] = useState<string | null>(null);

  const filtered = typedPlugins.filter((p) => {
    if (selectedCategory && p.category !== selectedCategory) return false;
    if (selectedSdk && p.sdk !== selectedSdk) return false;
    if (selectedType && !p.modules.some((m) => m.type === selectedType)) return false;
    return true;
  });

  // Group by category for display
  const groupedByCategory = CATEGORIES.map((cat) => ({
    category: cat,
    plugins: filtered.filter((p) => p.category === cat.slug),
  })).filter((g) => g.plugins.length > 0);

  return (
    <div className="px-6 sm:px-10 lg:px-16 py-10">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to registry
      </Link>

      <h1 className="text-3xl font-bold text-[var(--heading)] mb-2">Explore Plugins</h1>
      <p className="text-[var(--muted)] mb-8">Filter and browse plugins by category, SDK, or module type.</p>

      {/* Filters */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] p-5 mb-8 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--heading)]">
          <Filter className="w-4 h-4" />
          Filters
        </div>

        {/* Module type filter */}
        <div>
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">Module Type</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !selectedType
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:border-[var(--accent)]/40"
              }`}
            >
              All
            </button>
            {MODULE_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  selectedType === type
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:border-[var(--accent)]/40"
                }`}
              >
                {type}s
              </button>
            ))}
          </div>
        </div>

        {/* Category filter */}
        <div>
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">Category</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !selectedCategory
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:border-[var(--accent)]/40"
              }`}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(selectedCategory === cat.slug ? null : cat.slug)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat.slug
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:border-[var(--accent)]/40"
                }`}
              >
                <CategoryIcon category={cat.slug} className="w-3 h-3" />
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* SDK filter */}
        <div>
          <p className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider mb-2">SDK</p>
          <div className="flex flex-wrap gap-2">
            {[null, "flytekit", "flyte-sdk"].map((sdk) => (
              <button
                key={sdk || "all"}
                onClick={() => setSelectedSdk(sdk)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedSdk === sdk
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)] hover:border-[var(--accent)]/40"
                }`}
              >
                {sdk === null ? "All" : sdk === "flytekit" ? "Flytekit" : "Flyte SDK"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-[var(--muted)] mb-6">{filtered.length} plugin{filtered.length !== 1 ? "s" : ""} found</p>

      {/* Grouped results */}
      {groupedByCategory.map(({ category, plugins: catPlugins }) => (
        <div key={category.slug} className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-[var(--accent-light)]">
              <CategoryIcon category={category.slug} className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--heading)]">{category.name}</h2>
              <p className="text-xs text-[var(--muted)]">{catPlugins.length} plugin{catPlugins.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {catPlugins.map((plugin) => (
              <Link
                key={plugin.slug}
                href={`/plugins/${plugin.slug}`}
                className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--accent)]/40 hover:shadow-sm transition-all group"
              >
                <PluginIcon slug={plugin.slug} name={plugin.name} className="w-8 h-8 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--heading)] group-hover:text-[var(--accent)] transition-colors truncate">
                    {plugin.name}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{plugin.modules.length} modules</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[var(--muted)]">No plugins match the selected filters.</p>
        </div>
      )}
    </div>
  );
}
