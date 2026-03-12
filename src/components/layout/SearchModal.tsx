"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Plugin } from "@/lib/types";
import { searchPlugins } from "@/lib/search";
import { Badge } from "@/components/ui/Badge";
import { PluginIcon } from "@/components/ui/PluginIcon";

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

  const results = query.trim()
    ? searchPlugins(plugins, query).slice(0, 8)
    : [];

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
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
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
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
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
        <div className="bg-[var(--background)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden">
          <div className="flex items-center gap-3 px-4 border-b border-[var(--border)]">
            <Search className="w-5 h-5 text-[var(--muted)] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search plugins..."
              className="flex-1 py-4 bg-transparent outline-none placeholder:text-[var(--muted)]"
            />
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-[var(--surface)]"
            >
              <X className="w-4 h-4 text-[var(--muted)]" />
            </button>
          </div>

          {query.trim() && (
            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                  No plugins found for &ldquo;{query}&rdquo;
                </p>
              ) : (
                results.map((plugin, i) => (
                  <button
                    key={plugin.slug}
                    onClick={() => handleSelect(plugin)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      i === selectedIndex
                        ? "bg-[var(--accent)]/10"
                        : "hover:bg-[var(--surface)]"
                    }`}
                  >
                    <PluginIcon slug={plugin.slug} name={plugin.name} className="w-6 h-6 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--heading)] truncate">
                        {plugin.name}
                      </p>
                      <p className="text-xs text-[var(--muted)] truncate" style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}>
                        {plugin.packageName}
                      </p>
                    </div>
                    <Badge category={plugin.category} />
                  </button>
                ))
              )}
            </div>
          )}

          {!query.trim() && (
            <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">
              Type to search across all plugins
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
