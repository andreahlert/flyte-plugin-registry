"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { Plugin } from "@/lib/types";
import { PluginIcon } from "@/components/ui/PluginIcon";

interface PluginComboboxProps {
  plugins: Plugin[];
  value: string;
  onChange: (slug: string) => void;
  disabledSlug?: string;
  placeholder?: string;
}

export function PluginCombobox({
  plugins,
  value,
  onChange,
  disabledSlug,
  placeholder = "Select a plugin...",
}: PluginComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = plugins.find((p) => p.slug === value) || null;

  const filtered = query
    ? plugins.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.slug.toLowerCase().includes(query.toLowerCase()) ||
          p.packageName.toLowerCase().includes(query.toLowerCase())
      )
    : plugins;

  const handleSelect = useCallback(
    (slug: string) => {
      onChange(slug);
      setOpen(false);
      setQuery("");
    },
    [onChange]
  );

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 rounded-xl border-2 border-[var(--border)] bg-[var(--card-bg)] text-left px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--accent-interactive)] transition-colors cursor-pointer hover:border-[var(--accent-interactive)]/50"
      >
        {selected ? (
          <>
            <PluginIcon slug={selected.slug} name={selected.name} className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 flex items-center gap-1.5 truncate">
              <span className="text-[var(--heading)] font-medium truncate">{selected.name}</span>
              {selected.sdk === "flyte-sdk" && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#7c3aed]/15 text-[#7c3aed] flex-shrink-0">
                  v2
                </span>
              )}
            </span>
          </>
        ) : (
          <span className="flex-1 text-[var(--muted)]">{placeholder}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-[var(--muted)] flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Clear button */}
      {selected && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onChange("");
            setOpen(false);
          }}
          className="absolute right-10 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border-2 border-[var(--border)] bg-[var(--card-bg)] shadow-xl overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)]">
            <Search className="w-4 h-4 text-[var(--muted)] flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plugins..."
              className="flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none"
            />
          </div>

          {/* Options */}
          <div className="max-h-64 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[var(--muted)] text-center">
                No plugins found
              </div>
            ) : (
              filtered.map((p) => {
                const isDisabled = p.slug === disabledSlug;
                const isSelected = p.slug === value;
                return (
                  <button
                    key={p.slug}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleSelect(p.slug)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                      isDisabled
                        ? "opacity-30 cursor-not-allowed"
                        : isSelected
                        ? "bg-[var(--accent-interactive)]/10 text-[var(--heading)]"
                        : "hover:bg-[var(--surface)] text-[var(--foreground)]"
                    }`}
                  >
                    <PluginIcon slug={p.slug} name={p.name} className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 flex items-center gap-1.5 truncate">
                      <span className="truncate">{p.name}</span>
                      {p.sdk === "flyte-sdk" && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#7c3aed] text-white flex-shrink-0 leading-none">
                          v2
                        </span>
                      )}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
