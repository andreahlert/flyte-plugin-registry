import plugins from "@/data/plugins.json";
import { Plugin } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";
import { CategoryPageClient } from "@/components/plugins/CategoryPageClient";

const typedPlugins = plugins as Plugin[];

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ slug: c.slug }));
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = CATEGORIES.find((c) => c.slug === slug);
  const filtered = typedPlugins.filter((p) => p.category === slug);

  if (!category) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Category not found
        </h1>
      </div>
    );
  }

  return <CategoryPageClient category={category} plugins={filtered} />;
}
