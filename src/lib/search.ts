import Fuse, { IFuseOptions } from "fuse.js";
import { Plugin } from "./types";

const fuseOptions: IFuseOptions<Plugin> = {
  keys: [
    { name: "name", weight: 2 },
    { name: "packageName", weight: 1.5 },
    { name: "description", weight: 1 },
    { name: "tags", weight: 0.8 },
    { name: "modules.name", weight: 1.2 },
    { name: "modules.importPath", weight: 0.6 },
  ],
  threshold: 0.3,
  includeScore: true,
};

let fuseInstance: Fuse<Plugin> | null = null;

export function getSearchIndex(plugins: Plugin[]): Fuse<Plugin> {
  if (!fuseInstance) {
    fuseInstance = new Fuse(plugins, fuseOptions);
  }
  return fuseInstance;
}

export function searchPlugins(
  plugins: Plugin[],
  query: string
): Plugin[] {
  if (!query.trim()) return plugins;
  const fuse = getSearchIndex(plugins);
  return fuse.search(query).map((result) => result.item);
}
