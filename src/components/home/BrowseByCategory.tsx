import Link from "next/link";
import { Plugin } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { CategoryIcon } from "@/components/ui/CategoryIcon";

export function BrowseByCategory({ plugins }: { plugins: Plugin[] }) {
  return (
    <section className="w-full bg-[var(--surface)] border-y border-[var(--border)] py-16 mb-0">
      <div className="px-6 sm:px-10 lg:px-16">
        <h2 className="text-2xl font-bold text-[var(--heading)] mb-8">Browse by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => {
            const count = plugins.filter((p) => p.category === cat.slug).length;
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border)] bg-[var(--card-bg)] hover:border-[var(--accent)]/40 hover:shadow-md transition-all group"
              >
                <div className="p-3 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] group-hover:bg-[var(--accent)]/15 transition-colors">
                  <CategoryIcon category={cat.slug} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--heading)] group-hover:text-[var(--accent)] transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-sm text-[var(--muted)]">
                    {count} plugin{count !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
