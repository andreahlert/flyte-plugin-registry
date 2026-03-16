"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  X,
  Download,
  Lightbulb,
  RefreshCw,
  ExternalLink,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useWishlist } from "@/hooks/useWishlist";
import { GapType, WishlistItem } from "@/lib/types";
import { GapTypeBadge, Badge } from "@/components/ui/Badge";
import { CATEGORIES } from "@/lib/constants";
import { formatDownloads } from "@/lib/utils";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

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

type SortOption = "downloads" | "name";
type GapFilter = "all" | "no-plugin" | "needs-v2-port";

const fmt = formatDownloads;

export function WishlistPageClient() {
  const { items } = useWishlist();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [gapFilter, setGapFilter] = useState<GapFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("downloads");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const hasActiveFilters = selectedCategory || gapFilter !== "all" || searchQuery;

  // Summary stats
  const totalGaps = items.length;
  const newOpportunities = items.filter((i) => i.gapType === "no-plugin").length;
  const needsV2 = items.filter((i) => i.gapType === "needs-v2-port").length;
  const totalOpportunityDownloads = items.reduce(
    (sum, i) => sum + (i.downloads?.lastMonth ?? 0),
    0
  );

  // Category counts based on all items
  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const cat of CATEGORIES) c[cat.slug] = items.filter((i) => i.category === cat.slug).length;
    return c;
  }, [items]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let result = [...items];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.packageName.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q)
      );
    }
    if (selectedCategory) result = result.filter((i) => i.category === selectedCategory);
    if (gapFilter !== "all") result = result.filter((i) => i.gapType === gapFilter);
    result.sort((a, b) => {
      switch (sortBy) {
        case "downloads":
          return (b.downloads?.lastMonth ?? 0) - (a.downloads?.lastMonth ?? 0);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    return result;
  }, [items, searchQuery, selectedCategory, gapFilter, sortBy]);

  const clearAll = () => {
    setSelectedCategory(null);
    setGapFilter("all");
    setSearchQuery("");
  };

  return (
    <div className="px-6 sm:px-10 lg:px-16 py-8 max-w-[1600px] mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to registry
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--heading)] mb-2">
          Plugin Wishlist
        </h1>
        <p className="text-sm sm:text-base text-[var(--muted)]">
          Popular Python packages that could benefit from Flyte integration.
        </p>
      </motion.div>

      {/* Summary cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8"
      >
        <div className="rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)]" />
            <span className="text-xs sm:text-sm text-[var(--muted)]">Total Gaps</span>
          </div>
          <p className="text-xl sm:text-2xl font-semibold text-[var(--heading)]">{totalGaps}</p>
        </div>
        <div className="rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Download className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--accent)]" />
            <span className="text-xs sm:text-sm text-[var(--muted)]">Opportunity Downloads</span>
          </div>
          <p className="text-xl sm:text-2xl font-semibold text-[var(--heading)]">
            {fmt(totalOpportunityDownloads)}
            <span className="text-sm font-normal text-[var(--muted)]">/mo</span>
          </p>
        </div>
        <div className="rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            <span className="text-xs sm:text-sm text-[var(--muted)]">New Opportunities</span>
          </div>
          <p className="text-xl sm:text-2xl font-semibold text-[var(--heading)]">
            {newOpportunities}
          </p>
        </div>
        <div className="rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] p-4 sm:p-5">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
            <span className="text-xs sm:text-sm text-[var(--muted)]">Needs V2 Port</span>
          </div>
          <p className="text-xl sm:text-2xl font-semibold text-[var(--heading)]">{needsV2}</p>
        </div>
      </motion.div>

      {/* Search + filters row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5"
      >
        <div />
        <div
          className={`relative w-full lg:w-96 transition-all duration-200 ${
            searchFocused ? "lg:w-[28rem]" : ""
          }`}
        >
          <Search
            className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
              searchFocused ? "text-[var(--brand)]" : "text-[var(--muted)]"
            }`}
          />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search packages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`w-full pl-9 pr-9 py-2 rounded-xl border-2 bg-[var(--card-bg)] text-sm text-[var(--heading)] placeholder:text-[var(--muted)] focus:outline-none transition-all duration-200 ${
              searchFocused
                ? "border-[var(--brand)]/50 shadow-md shadow-[var(--brand)]/8"
                : "border-[var(--border)]"
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                searchRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--heading)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Category strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-5"
      >
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
            <span className={`text-[10px] ${!selectedCategory ? "opacity-60" : "opacity-40"}`}>
              {items.length}
            </span>
          </button>
          {CATEGORIES.filter((cat) => categoryCounts[cat.slug] > 0).map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            const accent = CAT_ACCENT[cat.slug] || "#7c3aed";
            return (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(isSelected ? null : cat.slug)}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  !isSelected
                    ? "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-hover)]"
                    : ""
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: accent + "18",
                        color: accent,
                        boxShadow: `0 0 0 1px ${accent}40`,
                      }
                    : undefined
                }
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: accent }}
                />
                <CategoryIcon
                  category={cat.slug}
                  className="w-3.5 h-3.5"
                  style={!isSelected ? { color: "var(--muted)" } : undefined}
                />
                <span>{cat.name}</span>
                <span className={`text-[10px] ${isSelected ? "opacity-60" : "opacity-40"}`}>
                  {categoryCounts[cat.slug]}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Gap type + sort bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-5 pb-4 border-b-2 border-[var(--border)]"
      >
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { value: "all", label: "All" },
              { value: "no-plugin", label: "New Opportunity" },
              { value: "needs-v2-port", label: "Needs V2 Port" },
            ] as const
          ).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setGapFilter(value)}
              className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all duration-150 ${
                gapFilter === value
                  ? "bg-[var(--brand)] text-white shadow-sm shadow-[var(--brand)]/20"
                  : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {label}
            </button>
          ))}

          <div className="h-4 w-px bg-[var(--border)]" />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-[11px] font-medium bg-transparent text-[var(--muted)] cursor-pointer focus:outline-none border-none"
          >
            <option value="downloads">Downloads</option>
            <option value="name">A-Z</option>
          </select>

          <AnimatePresence>
            {hasActiveFilters && (
              <motion.button
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                onClick={clearAll}
                className="text-[11px] font-medium text-[var(--brand)] hover:underline whitespace-nowrap overflow-hidden ml-1"
              >
                Clear all
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Results count */}
      <p className="text-xs text-[var(--muted)] mb-4">
        <span className="font-semibold text-[var(--heading)]">{filtered.length}</span> result
        {filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Table */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden overflow-x-auto">
        <div className="grid grid-cols-[minmax(10rem,1.2fr)_2fr_7rem_6rem_5rem_6rem] min-w-[44rem] gap-2 px-4 py-2 bg-[var(--surface)] text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider border-b border-[var(--border)]">
          <span>Package</span>
          <span>Description</span>
          <span>Category</span>
          <span className="text-right">Downloads/mo</span>
          <span className="text-center">Type</span>
          <span className="text-center">Action</span>
        </div>
        <AnimatePresence mode="popLayout">
          {filtered.map((item, i) => (
            <WishlistRow key={item.packageName} item={item} index={i} isLast={i === filtered.length - 1} />
          ))}
        </AnimatePresence>
      </div>

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
            <p className="text-sm text-[var(--heading)] font-medium mb-1">No items found</p>
            <p className="text-xs text-[var(--muted)] mb-3">Try different filters or search terms.</p>
            <button
              onClick={clearAll}
              className="text-xs font-medium text-[var(--brand)] hover:underline"
            >
              Clear all filters
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WishlistRow({
  item,
  index,
  isLast,
}: {
  item: WishlistItem;
  index: number;
  isLast: boolean;
}) {
  const accent = CAT_ACCENT[item.category] || "#7c3aed";
  const catInfo = CATEGORIES.find((c) => c.slug === item.category);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12, delay: Math.min(index * 0.01, 0.2) }}
      className={`grid grid-cols-[minmax(10rem,1.2fr)_2fr_7rem_6rem_5rem_6rem] min-w-[44rem] gap-2 items-center px-4 py-2.5 hover:bg-[var(--surface)] transition-colors duration-100 ${
        !isLast ? "border-b border-[var(--border)]" : ""
      }`}
    >
      {/* Package */}
      <div className="min-w-0">
        <a
          href={item.pypiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-1"
        >
          <p className="text-[12px] font-semibold text-[var(--heading)] group-hover:text-[var(--brand)] transition-colors truncate">
            {item.name}
          </p>
          <ExternalLink className="w-3 h-3 text-[var(--muted)] opacity-0 group-hover:opacity-60 flex-shrink-0 transition-opacity" />
        </a>
        <p className="text-[10px] text-[var(--muted)] font-mono truncate">{item.packageName}</p>
      </div>

      {/* Description */}
      <p className="text-[11px] text-[var(--muted)] truncate">{item.description}</p>

      {/* Category */}
      <span className="inline-flex items-center gap-1 text-[10px] font-medium" style={{ color: accent }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
        {catInfo?.name}
      </span>

      {/* Downloads */}
      <span className="text-[11px] text-[var(--muted)] text-right tabular-nums">
        {item.downloads && item.downloads.lastMonth > 0
          ? fmt(item.downloads.lastMonth)
          : "\u2014"}
      </span>

      {/* Gap type */}
      <div className="flex justify-center">
        <GapTypeBadge gapType={item.gapType} />
      </div>

      {/* Action */}
      <div className="flex justify-center gap-1.5">
        {item.existingPluginSlug && (
          <Link
            href={`/plugins/${item.existingPluginSlug}`}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--heading)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            V1
          </Link>
        )}
        {item.githubUrl && (
          <a
            href={item.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--heading)] hover:bg-[var(--surface-hover)] transition-colors"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        )}
      </div>
    </motion.div>
  );
}
