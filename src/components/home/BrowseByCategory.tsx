import Link from "next/link";
import { Plugin } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { PluginIcon } from "@/components/ui/PluginIcon";

function AvatarCircles({ plugins, max = 4 }: { plugins: Plugin[]; max?: number }) {
  const baseSlug = (slug: string) => slug.replace(/^v2-/, "");
  const unique = plugins.filter((p, i, arr) => arr.findIndex((q) => baseSlug(q.slug) === baseSlug(p.slug)) === i);
  const shown = unique.slice(0, max);
  const remaining = unique.length - max;

  return (
    <div className="flex -space-x-2">
      {shown.map((p) => (
        <div
          key={p.slug}
          className="relative w-7 h-7 rounded-full border-2 border-[var(--card-bg)] bg-[var(--surface)] overflow-visible flex-shrink-0 avatar-circle"
        >
          <div className="w-full h-full rounded-full overflow-hidden">
            <PluginIcon slug={p.slug} name={p.name} className="w-full h-full" />
          </div>
          <span className="avatar-tooltip">{p.name}</span>
        </div>
      ))}
      {remaining > 0 && (
        <div className="w-7 h-7 rounded-full border-2 border-[var(--card-bg)] bg-[var(--surface)] flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-semibold text-[var(--muted)]">+{remaining}</span>
        </div>
      )}
    </div>
  );
}

export function BrowseByCategory({ plugins }: { plugins: Plugin[] }) {
  return (
    <section className="w-full bg-[var(--surface)] border-y border-[var(--border)] py-16 mb-0">
      <div className="px-6 sm:px-10 lg:px-16">
        <h2 className="text-2xl font-semibold text-[var(--heading)] mb-8">Browse by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const catPlugins = plugins.filter((p) => p.category === cat.slug);
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="flex items-center gap-4 p-5 rounded-2xl border-2 border-[var(--border)] bg-[var(--card-bg)] hover:border-[#6f2aef]/40 hover:shadow-md transition-all group"
              >
                <div className="p-3 rounded-xl bg-[var(--accent-light)] text-[#6f2aef] group-hover:bg-[#6f2aef]/15 transition-colors">
                  <CategoryIcon category={cat.slug} className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--heading)] group-hover:text-[#6f2aef] transition-colors">
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <AvatarCircles plugins={catPlugins} />
                    <span className="text-xs text-[var(--muted)]">
                      {catPlugins.length} plugin{catPlugins.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
