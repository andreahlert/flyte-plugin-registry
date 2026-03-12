"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Plugin, CategoryInfo } from "@/lib/types";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { PluginGrid } from "@/components/plugins/PluginGrid";

interface Props {
  category: CategoryInfo;
  plugins: Plugin[];
}

export function CategoryPageClient({ category, plugins }: Props) {
  return (
    <div className="px-6 sm:px-10 lg:px-16 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--accent)] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all plugins
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-[var(--accent-light)]">
          <CategoryIcon
            category={category.slug}
            className="w-8 h-8 text-[var(--accent)]"
          />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--heading)]">
            {category.name}
          </h1>
          <p className="text-[var(--muted)]">
            {category.description} · {plugins.length} plugin
            {plugins.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <PluginGrid
        plugins={plugins}
        emptyMessage="No plugins in this category"
      />
    </div>
  );
}
