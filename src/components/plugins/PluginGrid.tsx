import { Plugin } from "@/lib/types";
import { PluginCard } from "./PluginCard";

interface PluginGridProps {
  plugins: Plugin[];
  emptyMessage?: string;
}

export function PluginGrid({ plugins, emptyMessage = "No plugins found" }: PluginGridProps) {
  if (plugins.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {plugins.map((plugin) => (
        <PluginCard key={plugin.slug} plugin={plugin} />
      ))}
    </div>
  );
}
