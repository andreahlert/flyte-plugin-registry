import type { Metadata } from "next";
import plugins from "@/data/plugins.json";
import { Plugin } from "@/lib/types";
import { PluginDetailClient, PluginNotFound } from "@/components/plugins/PluginDetailClient";
import { SITE_CONFIG } from "@/lib/constants";

const typedPlugins = plugins as Plugin[];

export function generateStaticParams() {
  return typedPlugins.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const plugin = typedPlugins.find((p) => p.slug === slug);
  if (!plugin) return { title: `Plugin Not Found - ${SITE_CONFIG.name}` };
  return {
    title: `${plugin.name} - ${SITE_CONFIG.name}`,
    description: plugin.description.slice(0, 160),
  };
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

  return <PluginDetailClient plugin={plugin} allPlugins={typedPlugins} />;
}
