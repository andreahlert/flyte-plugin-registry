import { CategoryInfo } from "./types";

export const CATEGORIES: CategoryInfo[] = [
  {
    slug: "data-dataframe",
    name: "Data & DataFrame",
    description: "DataFrame libraries and data processing tools",
    icon: "database",
  },
  {
    slug: "databases-warehouses",
    name: "Databases & Warehouses",
    description: "Database connectors and data warehouse integrations",
    icon: "hard-drive",
  },
  {
    slug: "cloud-infrastructure",
    name: "Cloud & Infrastructure",
    description: "Cloud providers and infrastructure orchestration",
    icon: "cloud",
  },
  {
    slug: "ml-training",
    name: "ML Training",
    description: "Distributed training frameworks and compute engines",
    icon: "cpu",
  },
  {
    slug: "model-serving",
    name: "Model Serving",
    description: "Model inference, serving, and deployment",
    icon: "rocket",
  },
  {
    slug: "experiment-tracking",
    name: "Experiment Tracking",
    description: "ML experiment tracking and model registries",
    icon: "line-chart",
  },
  {
    slug: "data-validation",
    name: "Data Validation",
    description: "Data quality, validation, and profiling",
    icon: "shield-check",
  },
  {
    slug: "workflow",
    name: "Workflow",
    description: "Workflow orchestration and pipeline tools",
    icon: "git-branch",
  },
  {
    slug: "developer-tools",
    name: "Developer Tools",
    description: "Development, debugging, and productivity tools",
    icon: "wrench",
  },
];

export const PYPI_STATS_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const SITE_CONFIG = {
  name: "Flyte Plugin Registry",
  description: "Discover and explore 50+ plugins for the Flyte ecosystem",
  url: "https://plugins.flyte.org",
};
