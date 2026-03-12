"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  X,
  Download,
  ChevronRight,
  LayoutGrid,
  List,
  Rows3,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import plugins from "@/data/plugins.json";
import { Plugin } from "@/lib/types";
import { PluginIcon } from "@/components/ui/PluginIcon";
import { CATEGORIES, MODULE_TYPE_COLORS } from "@/lib/constants";
import { formatDownloads } from "@/lib/utils";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { searchPlugins } from "@/lib/search";
import { useMultiplePyPIStats } from "@/hooks/usePyPIStats";
import { ModuleBar } from "@/components/plugins/PluginCard";

const typedPlugins = plugins as Plugin[];
const MODULE_TYPES = ["task", "agent", "type", "sensor", "workflow", "other"] as const;

const MODULE_COLORS = MODULE_TYPE_COLORS;

const CAT_ACCENT: Record<string, string> = {
  "data-dataframe": "#3b82f6",
  "databases-warehouses": "#8b5cf6",
  "cloud-infrastructure": "#f97316",
  "ml-training": "#22c55e",
  "model-serving": "#ef4444",
  "experiment-tracking": "#eab308",
  "data-validation": "#14b8a6",
  "workflow": "#6366f1",
  "developer-tools": "#64748b",
};

type ViewMode = "grid" | "rows" | "list";
type SortOption = "name" | "modules" | "downloads";

const fmt = formatDownloads;


export function ExplorePageClient() {
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSdk, setSelectedSdk] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const packageNames = useMemo(() => typedPlugins.map((p) => p.packageName), []);
  const { statsMap } = useMultiplePyPIStats(packageNames);

  const hasActiveFilters = selectedTypes.size > 0 || selectedCategory || selectedSdk || searchQuery;

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  const filtered = useMemo(() => {
    let result = searchQuery ? searchPlugins(typedPlugins, searchQuery) : [...typedPlugins];
    if (selectedCategory) result = result.filter((p) => p.category === selectedCategory);
    if (selectedSdk) result = result.filter((p) => p.sdk === selectedSdk);
    if (selectedTypes.size > 0) result = result.filter((p) => p.modules.some((m) => selectedTypes.has(m.type)));
    if (!searchQuery) {
      result.sort((a, b) => {
        switch (sortBy) {
          case "name": return a.name.localeCompare(b.name);
          case "modules": return b.modules.length - a.modules.length;
          case "downloads": return (statsMap.get(b.packageName)?.lastMonth ?? 0) - (statsMap.get(a.packageName)?.lastMonth ?? 0);
          default: return 0;
        }
      });
    }
    return result;
  }, [searchQuery, selectedCategory, selectedSdk, selectedTypes, sortBy, statsMap]);

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const cat of CATEGORIES) c[cat.slug] = typedPlugins.filter((p) => p.category === cat.slug).length;
    return c;
  }, []);

  const clearAll = () => {
    setSelectedTypes(new Set());
    setSelectedCategory(null);
    setSelectedSdk(null);
    setSearchQuery("");
  };

  return (
    <div className="px-6 sm:px-10 lg:px-16 py-8 max-w-[1600px] mx-auto">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to registry
      </Link>

      {/* Header row */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--heading)] mb-1">Explore Plugins</h1>
          <p className="text-sm text-[var(--muted)]">{typedPlugins.length} plugins across {CATEGORIES.length} categories</p>
        </div>
        {/* Search */}
        <div className={`relative w-full lg:w-96 transition-all duration-200 ${searchFocused ? "lg:w-[28rem]" : ""}`}>
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchFocused ? "text-[var(--brand)]" : "text-[var(--muted)]"}`} />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search plugins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`w-full pl-9 pr-9 py-2 rounded-xl border-2 bg-[var(--card-bg)] text-sm text-[var(--heading)] placeholder:text-[var(--muted)] focus:outline-none transition-all duration-200 ${searchFocused ? "border-[var(--brand)]/50 shadow-md shadow-[var(--brand)]/8" : "border-[var(--border)]"}`}
          />
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--heading)]">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Category horizontal strip */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-5">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              !selectedCategory
                ? "bg-[var(--heading)] text-[var(--background)] shadow-sm"
                : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            All
            <span className={`text-[10px] ${!selectedCategory ? "opacity-60" : "opacity-40"}`}>{typedPlugins.length}</span>
          </button>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            const accent = CAT_ACCENT[cat.slug] || "#7c3aed";
            return (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(isSelected ? null : cat.slug)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  !isSelected ? "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-hover)]" : ""
                }`}
                style={isSelected ? {
                  backgroundColor: accent + "18",
                  color: accent,
                  boxShadow: `0 0 0 1px ${accent}40`,
                } : undefined}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: accent }}
                />
                <CategoryIcon category={cat.slug} className="w-3.5 h-3.5" style={!isSelected ? { color: "var(--muted)" } : undefined} />
                <span>{cat.name}</span>
                <span className={`text-[10px] ${isSelected ? "opacity-60" : "opacity-40"}`}>{categoryCounts[cat.slug]}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Filter + view bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b-2 border-[var(--border)]">
        {/* Module types - multi select */}
        <div className="flex flex-wrap items-center gap-1">
          {MODULE_TYPES.map((type) => {
            const isSelected = selectedTypes.has(type);
            return (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium capitalize transition-all duration-150 ${
                  isSelected
                    ? "text-white"
                    : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-hover)]"
                }`}
                style={isSelected ? {
                  backgroundColor: MODULE_COLORS[type],
                  boxShadow: `0 2px 8px ${MODULE_COLORS[type]}30`,
                } : undefined}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: isSelected ? "#fff" : MODULE_COLORS[type] }} />
                {type}
              </button>
            );
          })}
        </div>

        {/* SDK */}
        <div className="h-4 w-px bg-[var(--border)]" />
        {(["flytekit", "flyte-sdk"] as const).map((sdk) => (
          <button
            key={sdk}
            onClick={() => setSelectedSdk(selectedSdk === sdk ? null : sdk)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${
              selectedSdk === sdk
                ? "bg-[var(--brand)] text-white shadow-sm shadow-[var(--brand)]/20"
                : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            {sdk === "flytekit" ? "Flytekit" : "Flyte SDK"}
          </button>
        ))}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Clear */}
        <AnimatePresence>
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              onClick={clearAll}
              className="text-[11px] font-medium text-[var(--brand)] hover:underline whitespace-nowrap overflow-hidden"
            >
              Clear all
            </motion.button>
          )}
        </AnimatePresence>

        <div className="h-4 w-px bg-[var(--border)]" />

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="text-[11px] font-medium bg-transparent text-[var(--muted)] cursor-pointer focus:outline-none border-none"
        >
          <option value="name">A-Z</option>
          <option value="modules">Modules</option>
          <option value="downloads">Downloads</option>
        </select>

        <div className="h-4 w-px bg-[var(--border)]" />

        {/* View toggle */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-[var(--surface)]">
          {([
            { mode: "grid" as const, icon: LayoutGrid, title: "Grid" },
            { mode: "rows" as const, icon: Rows3, title: "Rows" },
            { mode: "list" as const, icon: List, title: "Table" },
          ]).map(({ mode, icon: Icon, title }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              title={title}
              className={`p-1.5 rounded-md transition-all duration-150 ${
                viewMode === mode
                  ? "bg-[var(--card-bg)] text-[var(--heading)] shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--heading)]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </motion.div>

      {/* Results count */}
      <p className="text-xs text-[var(--muted)] mb-4">
        <span className="font-semibold text-[var(--heading)]">{filtered.length}</span> result{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Results - Grid */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          <AnimatePresence mode="popLayout">
            {filtered.map((plugin, i) => {
              const stats = statsMap.get(plugin.packageName);
              const accent = CAT_ACCENT[plugin.category] || "#7c3aed";
              return (
                <motion.div
                  key={plugin.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.3) }}
                >
                  <Link
                    href={`/plugins/${plugin.slug}`}
                    className="group relative block p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                  >
                    {/* Top accent line */}
                    <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ backgroundColor: accent }} />

                    <div className="flex items-center gap-2.5 mb-2">
                      <PluginIcon slug={plugin.slug} name={plugin.name} className="w-8 h-8 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-semibold text-[var(--heading)] group-hover:text-[var(--brand)] transition-colors truncate leading-tight">
                            {plugin.name}
                          </p>
                          {plugin.sdk === "flyte-sdk" && (
                            <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-gradient-to-r from-[var(--accent)] to-[var(--brand)] text-white leading-none">
                              v2
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--muted)] font-mono truncate">{plugin.packageName}</p>
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--muted)] line-clamp-2 mb-2.5 leading-relaxed min-h-[2.5em]">
                      {plugin.description}
                    </p>

                    <div className="mb-2.5 overflow-visible relative">
                      <ModuleBar modules={plugin.modules} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--muted)] font-medium">{plugin.modules.length} module{plugin.modules.length !== 1 ? "s" : ""}</span>
                      {stats && stats.lastMonth > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-[var(--muted)]">
                          <Download className="w-2.5 h-2.5" />
                          {fmt(stats.lastMonth)}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Results - Rows (compact cards) */}
      {viewMode === "rows" && (
        <div className="flex flex-col gap-1.5">
          <AnimatePresence mode="popLayout">
            {filtered.map((plugin, i) => {
              const stats = statsMap.get(plugin.packageName);
              const accent = CAT_ACCENT[plugin.category] || "#7c3aed";
              return (
                <motion.div
                  key={plugin.slug}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.15, delay: Math.min(i * 0.015, 0.25) }}
                >
                  <Link
                    href={`/plugins/${plugin.slug}`}
                    className="group flex items-center gap-3 px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--surface)] hover:border-[var(--accent-interactive)]/30 transition-all duration-150"
                  >
                    <div className="w-1 h-6 rounded-full flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: accent }} />
                    <PluginIcon slug={plugin.slug} name={plugin.name} className="w-7 h-7 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-semibold text-[var(--heading)] group-hover:text-[var(--brand)] transition-colors truncate">
                          {plugin.name}
                        </p>
                        {plugin.sdk === "flyte-sdk" && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide bg-gradient-to-r from-[var(--accent)] to-[var(--brand)] text-white leading-none">
                            v2
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--muted)] truncate leading-tight">{plugin.description}</p>
                    </div>
                    <div className="w-20 flex-shrink-0 overflow-visible relative">
                      <ModuleBar modules={plugin.modules} />
                    </div>
                    <span className="text-[10px] text-[var(--muted)] w-8 text-right tabular-nums flex-shrink-0">{plugin.modules.length}m</span>
                    {stats && stats.lastMonth > 0 ? (
                      <span className="flex items-center gap-0.5 text-[10px] text-[var(--muted)] w-14 justify-end tabular-nums">
                        <Download className="w-2.5 h-2.5" />
                        {fmt(stats.lastMonth)}
                      </span>
                    ) : <span className="w-14" />}
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--muted)] opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Results - Table/List */}
      {viewMode === "list" && (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[minmax(10rem,1fr)_2fr_7rem_5rem_5rem] gap-2 px-4 py-2 bg-[var(--surface)] text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)]">
            <span>Plugin</span>
            <span>Description</span>
            <span>Category</span>
            <span className="text-right">Modules</span>
            <span className="text-right">Downloads</span>
          </div>
          <AnimatePresence mode="popLayout">
            {filtered.map((plugin, i) => {
              const stats = statsMap.get(plugin.packageName);
              const catInfo = CATEGORIES.find((c) => c.slug === plugin.category);
              const accent = CAT_ACCENT[plugin.category] || "#7c3aed";
              return (
                <motion.div
                  key={plugin.slug}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12, delay: Math.min(i * 0.01, 0.2) }}
                >
                  <Link
                    href={`/plugins/${plugin.slug}`}
                    className={`group grid grid-cols-[minmax(10rem,1fr)_2fr_7rem_5rem_5rem] gap-2 items-center px-4 py-2 hover:bg-[var(--surface)] transition-colors duration-100 ${
                      i < filtered.length - 1 ? "border-b border-[var(--border)]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <PluginIcon slug={plugin.slug} name={plugin.name} className="w-6 h-6 flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[12px] font-semibold text-[var(--heading)] group-hover:text-[var(--brand)] transition-colors truncate">
                            {plugin.name}
                          </p>
                          {plugin.sdk === "flyte-sdk" && (
                            <span className="flex-shrink-0 px-1 py-px rounded text-[8px] font-bold uppercase tracking-wide bg-gradient-to-r from-[var(--accent)] to-[var(--brand)] text-white leading-none">
                              v2
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--muted)] font-mono truncate">{plugin.packageName}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--muted)] truncate">{plugin.description}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: accent }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
                      {catInfo?.name}
                    </span>
                    <div className="flex items-center gap-1.5 justify-end overflow-visible relative">
                      <div className="w-14 flex-shrink-0 overflow-visible relative">
                        <ModuleBar modules={plugin.modules} />
                      </div>
                      <span className="text-[11px] text-[var(--muted)] tabular-nums">{plugin.modules.length}</span>
                    </div>
                    <span className="text-[11px] text-[var(--muted)] text-right tabular-nums">
                      {stats && stats.lastMonth > 0 ? fmt(stats.lastMonth) : "\u2014"}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Empty state */}
      <AnimatePresence>
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-16"
          >
            <Search className="w-6 h-6 text-[var(--muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--heading)] font-medium mb-1">No plugins found</p>
            <p className="text-xs text-[var(--muted)] mb-3">Try different filters or search terms.</p>
            <button onClick={clearAll} className="text-xs font-medium text-[var(--brand)] hover:underline">
              Clear all filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
