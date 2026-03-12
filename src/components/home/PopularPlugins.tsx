import { Plugin } from "@/lib/types";
import { PluginGrid } from "@/components/plugins/PluginGrid";

const popularSlugs = [
  "spark",
  "bigquery",
  "ray",
  "kf-pytorch",
  "wandb",
  "snowflake",
  "airflow",
  "pandera",
];

export function PopularPlugins({ plugins }: { plugins: Plugin[] }) {
  const popular = popularSlugs
    .map((slug) => plugins.find((p) => p.slug === slug))
    .filter(Boolean) as Plugin[];

  return (
    <section className="px-6 sm:px-10 lg:px-16 mb-20">
      <h2 className="text-2xl font-bold text-[var(--heading)] mb-6">Popular Plugins</h2>
      <PluginGrid plugins={popular} />
    </section>
  );
}
