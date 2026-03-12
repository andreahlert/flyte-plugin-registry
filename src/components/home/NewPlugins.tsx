import { Plugin } from "@/lib/types";
import { PluginGrid } from "@/components/plugins/PluginGrid";

const newSlugs = [
  "inference",
  "openai",
  "dgxc-lepton",
  "perian",
  "slurm",
  "optuna",
  "neptune",
  "comet-ml",
];

export function NewPlugins({ plugins }: { plugins: Plugin[] }) {
  const newPlugins = newSlugs
    .map((slug) => plugins.find((p) => p.slug === slug))
    .filter(Boolean) as Plugin[];

  return (
    <section className="px-6 sm:px-10 lg:px-16 mb-20">
      <h2 className="text-2xl font-bold text-[var(--heading)] mb-6">Recently Added</h2>
      <PluginGrid plugins={newPlugins} />
    </section>
  );
}
