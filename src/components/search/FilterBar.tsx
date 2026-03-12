"use client";

import { Category } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

interface FilterBarProps {
  selectedCategory: Category | null;
  onCategoryChange: (category: Category | null) => void;
}

export function FilterBar({ selectedCategory, onCategoryChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button
        onClick={() => onCategoryChange(null)}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          !selectedCategory
            ? "bg-[var(--accent)] text-white"
            : "bg-[var(--surface)] text-[var(--muted)] border-2 border-[var(--border)] hover:border-[var(--accent-interactive)]/40"
        }`}
      >
        All
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.slug}
          onClick={() =>
            onCategoryChange(selectedCategory === cat.slug ? null : cat.slug)
          }
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === cat.slug
              ? "bg-[var(--accent)] text-white"
              : "bg-[var(--surface)] text-[var(--muted)] border-2 border-[var(--border)] hover:border-[var(--accent-interactive)]/40"
          }`}
        >
          <CategoryIcon category={cat.slug} className="w-3.5 h-3.5" />
          {cat.name}
        </button>
      ))}
    </div>
  );
}
