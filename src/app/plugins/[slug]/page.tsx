import plugins from "@/data/plugins.json";
import { Plugin } from "@/lib/types";
import { PluginDetailClient, PluginNotFound } from "@/components/plugins/PluginDetailClient";

const typedPlugins = plugins as Plugin[];

export function generateStaticParams() {
  return typedPlugins.map((p) => ({ slug: p.slug }));
}

export default async function PluginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const plugin = typedPlugins.find((p) => p.slug === slug);

  if (!plugin) {
    return <PluginNotFound slug={slug} />;
  }

  return <PluginDetailClient plugin={plugin} />;
}
