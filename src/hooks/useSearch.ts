"use client";

import { useState, useMemo, useCallback } from "react";
import { Plugin, Category } from "@/lib/types";
import { searchPlugins } from "@/lib/search";

export function useSearch(plugins: Plugin[]) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const results = useMemo(() => {
    let filtered = query ? searchPlugins(plugins, query) : plugins;
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }
    return filtered;
  }, [plugins, query, selectedCategory]);

  const reset = useCallback(() => {
    setQuery("");
    setSelectedCategory(null);
  }, []);

  return {
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    results,
    reset,
  };
}
