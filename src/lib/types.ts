export interface PluginModule {
  name: string;
  type: "task" | "type" | "agent" | "sensor" | "workflow" | "other";
  importPath: string;
  description?: string;
  subtype?: string;   // e.g. "transformer", "connector", "config" - derived from base class
  baseClass?: string; // e.g. "TypeTransformer", "PythonTask" - actual Python base class
}

export type SDK = "flytekit" | "flyte-sdk";

export interface Maintainer {
  login: string;
  avatarUrl: string;
}

export interface Plugin {
  slug: string;
  name: string;
  packageName: string;
  description: string;
  category: Category;
  tags: string[];
  dependencies: string[];
  installCommand: string;
  githubUrl: string;
  docsUrl: string;
  pypiUrl: string;
  minFlytekitVersion: string;
  modules: PluginModule[];
  isDeprecated: boolean;
  addedDate?: string;
  snacksUrl?: string;
  sdk?: SDK;
  maintainers?: Maintainer[];
}

export type Category =
  | "data-dataframe"
  | "databases-warehouses"
  | "cloud-infrastructure"
  | "ml-training"
  | "model-serving"
  | "experiment-tracking"
  | "data-validation"
  | "workflow"
  | "developer-tools";

export interface CategoryInfo {
  slug: Category;
  name: string;
  description: string;
  icon: string;
}

export interface PyPIStats {
  lastDay: number;
  lastWeek: number;
  lastMonth: number;
}

export interface SearchResult {
  item: Plugin;
  score: number;
}

export type GapType = "no-plugin" | "needs-v2-port";

export interface WishlistItem {
  packageName: string;
  name: string;
  description: string;
  category: Category;
  gapType: GapType;
  pypiUrl: string;
  githubUrl?: string;
  discussionUrl?: string;
  downloads: PyPIStats | null;
  voteCount: number;
  existingPluginSlug?: string;
  belowThreshold?: boolean;
}
