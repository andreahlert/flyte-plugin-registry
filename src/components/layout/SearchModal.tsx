"use client";

import { startTransition, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Search, X, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { Plugin } from "@/lib/types";
import { searchPlugins } from "@/lib/search";
import { Badge } from "@/components/ui/Badge";
import { PluginIcon } from "@/components/ui/PluginIcon";
import pypiData from "@/data/pypi-stats.json";

const statsRecord = pypiData.stats as Record<string, { lastMonth: number }>;

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  plugins: Plugin[];
}

export function SearchModal({ open, onClose, plugins }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const popularPlugins = useMemo(() => {
    return [...plugins]
      .sort((a, b) => (statsRecord[b.packageName]?.lastMonth ?? 0) - (statsRecord[a.packageName]?.lastMonth ?? 0))
      .slice(0, 8);
  }, [plugins]);

  const results = query.trim()
    ? searchPlugins(plugins, query).slice(0, 8)
    : [];

  const displayList = query.trim() ? results : popularPlugins;

  const handleSelect = useCallback(
    (plugin: Plugin) => {
      router.push(`/plugins/${plugin.slug}`);
      onClose();
      setQuery("");
    },
    [router, onClose]
  );

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      startTransition(() => {
        setQuery("");
        setSelectedIndex(0);
      });
    }
  }, [open]);

  useEffect(() => {
    startTransition(() => setSelectedIndex(0));
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, displayList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && displayList[selectedIndex]) {
      handleSelect(displayList[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-w-xl mx-auto mt-[20vh] px-4">
        <div className="bg-[var(--background)] rounded-2xl shadow-2xl border-2 border-[var(--border)] overflow-hidden">
          <div className="flex items-center gap-3 px-4 border-b border-[var(--border)]">
            <Search className="w-5 h-5 text-[var(--muted)] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search plugins..."
              className="search-input flex-1 py-4 bg-transparent outline-none border-none placeholder:text-[var(--muted)]"
            />
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[var(--surface)]"
            >
              <X className="w-4 h-4 text-[var(--muted)]" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {query.trim() && results.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                No plugins found for &ldquo;{query}&rdquo;
              </p>
            ) : (
              <>
                {!query.trim() && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                    <TrendingUp className="w-3 h-3" />
                    Popular
                  </div>
                )}
                {displayList.map((plugin, i) => (
                  <button
                    key={plugin.slug}
                    onClick={() => handleSelect(plugin)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      i === selectedIndex
                        ? "bg-[var(--surface)]"
                        : "hover:bg-[var(--surface)]"
                    }`}
                  >
                    <PluginIcon slug={plugin.slug} name={plugin.name} className="w-6 h-6 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--heading)] truncate flex items-center gap-1.5">
                        {plugin.name}
                        {plugin.sdk === "flyte-sdk" && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide bg-gradient-to-r from-[var(--accent)] to-[var(--brand)] text-white leading-none">
                            v2
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-[var(--muted)] truncate" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
                        {plugin.packageName}
                      </p>
                    </div>
                    <Badge category={plugin.category} />
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
