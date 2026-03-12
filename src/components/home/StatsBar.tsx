"use client";

import { Package, Boxes, Download, Plug } from "lucide-react";
import { Plugin } from "@/lib/types";
import { StatCard } from "@/components/ui/StatCard";
import { useMultiplePyPIStats } from "@/hooks/usePyPIStats";
import { CATEGORIES } from "@/lib/constants";
import { useMemo } from "react";

export function StatsBar({ plugins }: { plugins: Plugin[] }) {
  const packageNames = useMemo(
    () => plugins.map((p) => p.packageName),
    [plugins]
  );
  const { statsMap, loading } = useMultiplePyPIStats(packageNames);

  const totalModules = plugins.reduce((sum, p) => sum + p.modules.length, 0);
  const totalDownloads = Array.from(statsMap.values()).reduce(
    (sum, s) => sum + s.lastMonth,
    0
  );

  return (
    <section className="px-6 sm:px-10 lg:px-16 -mt-8 relative z-10 mb-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Plugins"
          value={plugins.length}
          icon={<Package className="w-6 h-6" />}
        />
        <StatCard
          label="Modules"
          value={totalModules}
          icon={<Boxes className="w-6 h-6" />}
        />
        <StatCard
          label="Monthly Downloads"
          value={totalDownloads}
          icon={<Download className="w-6 h-6" />}
          loading={loading}
        />
        <StatCard
          label="Categories"
          value={CATEGORIES.length}
          icon={<Plug className="w-6 h-6" />}
        />
      </div>
    </section>
  );
}
