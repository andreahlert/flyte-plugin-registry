import { Plugin } from "@/lib/types";
import { PluginGrid } from "@/components/plugins/PluginGrid";

export function NewPlugins({ plugins }: { plugins: Plugin[] }) {
  const newPlugins = [...plugins]
    .sort((a, b) => {
      const dateA = a.addedDate ? new Date(a.addedDate).getTime() : 0;
      const dateB = b.addedDate ? new Date(b.addedDate).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 8);

  return (
    <section className="px-6 sm:px-10 lg:px-16 mb-20">
      <h2 className="text-2xl font-semibold text-[var(--heading)] mb-6">Recently Added</h2>
      <PluginGrid plugins={newPlugins} />
    </section>
  );
}
