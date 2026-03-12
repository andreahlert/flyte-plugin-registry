import Link from "next/link";
import { Plugin } from "@/lib/types";
import { PluginIcon } from "@/components/ui/PluginIcon";
import { Badge } from "@/components/ui/Badge";

interface RelatedPluginsProps {
  currentPlugin: Plugin;
  allPlugins: Plugin[];
}

function scorePlugin(candidate: Plugin, current: Plugin): number {
  let score = 0;
  if (candidate.category === current.category) score += 2;
  for (const tag of candidate.tags) {
    if (current.tags.includes(tag)) score += 1;
  }
  return score;
}

export function RelatedPlugins({ currentPlugin, allPlugins }: RelatedPluginsProps) {
  const scored = allPlugins
    .filter((p) => p.slug !== currentPlugin.slug)
    .map((p) => ({ plugin: p, score: scorePlugin(p, currentPlugin) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (scored.length === 0) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold text-[var(--heading)] mb-4">
        Related Plugins
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {scored.map(({ plugin }) => (
          <Link
            key={plugin.slug}
            href={`/plugins/${plugin.slug}`}
            className="group flex flex-col gap-3 rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] p-4 hover:border-[var(--accent-interactive)]/40 hover:shadow-md hover:-translate-y-0.5 hover:bg-[var(--surface)] transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 p-1.5 rounded-xl bg-[var(--accent-light)]">
                <PluginIcon slug={plugin.slug} name={plugin.name} className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-sm text-[var(--heading)] group-hover:text-[var(--accent)] transition-colors truncate">
                {plugin.name}
              </h3>
            </div>

            <Badge category={plugin.category} />

            <p className="text-sm text-[var(--muted)] line-clamp-2 leading-relaxed">
              {plugin.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
