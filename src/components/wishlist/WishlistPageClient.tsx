"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  X,
  Download,
  ExternalLink,
  Lightbulb,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type SortingState,
  type ColumnDef,
} from "@tanstack/react-table";
import { useWishlist } from "@/hooks/useWishlist";
import { useUpvotes } from "@/hooks/useUpvote";
import { WishlistItem } from "@/lib/types";
import { GapTypeBadge } from "@/components/ui/Badge";
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

type GapFilter = "all" | "no-plugin" | "needs-v2-port";

const fmt = formatDownloads;

type WishlistRowData = WishlistItem & {
  voteCount: number;
  hasVoted: boolean;
};

function SortIcon({ isSorted }: { isSorted: false | "asc" | "desc" }) {
  if (isSorted === "asc") return <ChevronUp className="w-4 h-4" />;
  if (isSorted === "desc") return <ChevronDown className="w-4 h-4" />;
  return <ChevronsUpDown className="w-4 h-4 opacity-30" />;
}

export function WishlistPageClient() {
  const { items } = useWishlist();
  const packageNames = useMemo(() => items.map((i) => i.packageName), [items]);
  const { counts, voted, toggle, loading: votesLoading } = useUpvotes(packageNames);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [gapFilter, setGapFilter] = useState<GapFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([{ id: "downloads", desc: true }]);
  const searchRef = useRef<HTMLInputElement>(null);

  const hasActiveFilters = selectedCategory || gapFilter !== "all" || searchQuery;

  const totalGaps = items.length;
  const newOpportunities = items.filter((i) => i.gapType === "no-plugin").length;
  const needsV2 = items.filter((i) => i.gapType === "needs-v2-port").length;
  const totalOpportunityDownloads = items.reduce(
    (sum, i) => sum + (i.downloads?.lastMonth ?? 0),
    0
  );

  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const cat of CATEGORIES) c[cat.slug] = items.filter((i) => i.category === cat.slug).length;
    return c;
  }, [items]);

  // Enrich data with vote info
  const data = useMemo<WishlistRowData[]>(() => {
    let result = items.map((item) => ({
      ...item,
      voteCount: counts[item.packageName] || 0,
      hasVoted: voted.has(item.packageName),
    }));
    if (selectedCategory) result = result.filter((i) => i.category === selectedCategory);
    if (gapFilter !== "all") result = result.filter((i) => i.gapType === gapFilter);
    return result;
  }, [items, counts, voted, selectedCategory, gapFilter]);

  const columns = useMemo<ColumnDef<WishlistRowData, unknown>[]>(
    () => [
      {
        id: "votes",
        header: "Vote",
        accessorFn: (row) => row.voteCount,
        size: 70,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex justify-center">
              <button
                onClick={() => toggle(item.packageName)}
                disabled={votesLoading}
                className={`group flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl transition-all duration-200 ${
                  item.hasVoted
                    ? "bg-[var(--brand)]/10 text-[var(--brand)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--heading)]"
                }`}
                title={item.hasVoted ? "Remove vote" : "Upvote this plugin"}
              >
                <ChevronUp
                  className={`w-5 h-5 transition-transform duration-200 ${
                    item.hasVoted ? "text-[var(--brand)]" : "group-hover:-translate-y-0.5"
                  }`}
                />
                <span
                  className={`text-sm font-semibold tabular-nums leading-none ${
                    item.hasVoted ? "text-[var(--brand)]" : ""
                  }`}
                >
                  {votesLoading ? (
                    <span className="inline-block w-4 h-4 bg-[var(--surface)] rounded animate-pulse" />
                  ) : (
                    item.voteCount
                  )}
                </span>
              </button>
            </div>
          );
        },
        enableGlobalFilter: false,
      },
      {
        id: "package",
        header: "Package",
        accessorFn: (row) => `${row.name} ${row.packageName}`,
        size: 220,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="min-w-0">
              <a
                href={item.pypiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-1.5"
              >
                <p className="text-base font-semibold text-[var(--heading)] group-hover:text-[var(--brand)] transition-colors truncate">
                  {item.name}
                </p>
                <ExternalLink className="w-4 h-4 text-[var(--muted)] opacity-0 group-hover:opacity-60 flex-shrink-0 transition-opacity" />
              </a>
              <p className="text-sm text-[var(--muted)] font-mono truncate">
                {item.packageName}
              </p>
            </div>
          );
        },
      },
      {
        id: "description",
        header: "Description",
        accessorKey: "description",
        size: 350,
        enableSorting: false,
        cell: ({ getValue }) => (
          <p className="text-sm text-[var(--muted)] leading-relaxed line-clamp-2">
            {getValue() as string}
          </p>
        ),
      },
      {
        id: "category",
        header: "Category",
        accessorKey: "category",
        size: 140,
        cell: ({ row }) => {
          const accent = CAT_ACCENT[row.original.category] || "#7c3aed";
          const catInfo = CATEGORIES.find((c) => c.slug === row.original.category);
          return (
            <span
              className="inline-flex items-center gap-1.5 text-sm font-medium"
              style={{ color: accent }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: accent }}
              />
              {catInfo?.name}
            </span>
          );
        },
      },
      {
        id: "downloads",
        header: "Downloads/mo",
        accessorFn: (row) => row.downloads?.lastMonth ?? 0,
        size: 130,
        cell: ({ getValue }) => {
          const dl = getValue() as number;
          return (
            <span className="text-base font-medium text-[var(--muted)] tabular-nums">
              {dl > 0 ? fmt(dl) : "\u2014"}
            </span>
          );
        },
      },
      {
        id: "type",
        header: "Type",
        accessorKey: "gapType",
        size: 120,
        cell: ({ row }) => (
          <div className="flex justify-center">
            <GapTypeBadge
              gapType={row.original.gapType}
              belowThreshold={row.original.belowThreshold}
            />
          </div>
        ),
      },
    ],
    [votesLoading, toggle],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: searchQuery,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearchQuery,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 25 },
    },
  });

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
          Vote on which integrations the Flyte community should build next.
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

      {/* Search */}
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
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 transition-colors ${
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
            className={`w-full pl-10 pr-10 py-2.5 rounded-xl border-2 bg-[var(--card-bg)] text-sm text-[var(--heading)] placeholder:text-[var(--muted)] focus:outline-none transition-all duration-200 ${
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
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--heading)]"
            >
              <X className="w-4 h-4" />
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
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
              !selectedCategory
                ? "bg-[var(--heading)] text-[var(--background)] shadow-sm"
                : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-hover)]"
            }`}
          >
            All
            <span className={`text-xs ${!selectedCategory ? "opacity-60" : "opacity-40"}`}>
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
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
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
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: accent }}
                />
                <CategoryIcon
                  category={cat.slug}
                  className="w-4 h-4"
                  style={!isSelected ? { color: "var(--muted)" } : undefined}
                />
                <span>{cat.name}</span>
                <span className={`text-xs ${isSelected ? "opacity-60" : "opacity-40"}`}>
                  {categoryCounts[cat.slug]}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Gap type filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6 pb-5 border-b-2 border-[var(--border)]"
      >
        <div className="flex flex-wrap items-center gap-2.5">
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
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                gapFilter === value
                  ? "bg-[var(--brand)] text-white shadow-sm shadow-[var(--brand)]/20"
                  : "bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--surface-hover)]"
              }`}
            >
              {label}
            </button>
          ))}

          <AnimatePresence>
            {hasActiveFilters && (
              <motion.button
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                onClick={clearAll}
                className="text-sm font-medium text-[var(--brand)] hover:underline whitespace-nowrap overflow-hidden ml-1"
              >
                Clear all
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Results count */}
      <p className="text-sm text-[var(--muted)] mb-5">
        <span className="font-semibold text-[var(--heading)]">
          {table.getFilteredRowModel().rows.length}
        </span>{" "}
        result{table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
      </p>

      {/* Data Table */}
      <div className="rounded-2xl border-2 border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-[var(--surface)] border-b border-[var(--border)]">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`px-5 py-3.5 text-sm font-semibold text-[var(--muted)] uppercase tracking-wider text-left ${
                        header.column.getCanSort() ? "cursor-pointer select-none hover:text-[var(--heading)] transition-colors" : ""
                      } ${header.id === "votes" || header.id === "type" ? "text-center" : ""} ${
                        header.id === "downloads" ? "text-right" : ""
                      }`}
                      style={{ width: header.getSize() }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className={`inline-flex items-center gap-1.5 ${
                        header.id === "votes" || header.id === "type" ? "justify-center w-full" : ""
                      } ${header.id === "downloads" ? "justify-end w-full" : ""}`}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <SortIcon isSorted={header.column.getIsSorted()} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`hover:bg-[var(--surface)] transition-colors duration-100 ${
                    i < table.getRowModel().rows.length - 1 ? "border-b border-[var(--border)]" : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-5 py-4 ${
                        cell.column.id === "downloads" ? "text-right" : ""
                      }`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {table.getPageCount() > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[var(--border)] bg-[var(--surface)]">
            <p className="text-sm text-[var(--muted)]">
              Page{" "}
              <span className="font-semibold text-[var(--heading)]">
                {table.getState().pagination.pageIndex + 1}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[var(--heading)]">
                {table.getPageCount()}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--card-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--heading)] hover:border-[var(--accent-interactive)] disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--card-bg)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--heading)] hover:border-[var(--accent-interactive)] disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {table.getFilteredRowModel().rows.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-6 h-6 text-[var(--muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--heading)] font-medium mb-1">No items found</p>
          <p className="text-sm text-[var(--muted)] mb-3">
            Try different filters or search terms.
          </p>
          <button
            onClick={clearAll}
            className="text-sm font-medium text-[var(--brand)] hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
