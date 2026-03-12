/**
 * Generates plugins.json by reading the actual flytekit plugin source code.
 *
 * For each plugin it extracts:
 *   - name, packageName, description from setup.py
 *   - dependencies from install_requires
 *   - min flytekit version from the flytekit requirement
 *   - exported modules from __init__.py
 *   - description from README.md (first paragraph)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FLYTEKIT_PLUGINS_DIR = join(__dirname, "../../flytekit/plugins");
const OUTPUT_PATH = join(__dirname, "../src/data/plugins.json");

// Category mapping based on plugin slug
const CATEGORY_MAP = {
  polars: "data-dataframe",
  vaex: "data-dataframe",
  modin: "data-dataframe",
  geopandas: "data-dataframe",
  huggingface: "data-dataframe",
  "async-fsspec": "data-dataframe",
  "data-fsspec": "data-dataframe",
  bigquery: "databases-warehouses",
  snowflake: "databases-warehouses",
  duckdb: "databases-warehouses",
  hive: "databases-warehouses",
  sqlalchemy: "databases-warehouses",
  dolt: "databases-warehouses",
  "aws-batch": "cloud-infrastructure",
  "aws-athena": "cloud-infrastructure",
  "aws-sagemaker": "cloud-infrastructure",
  "k8s-pod": "cloud-infrastructure",
  k8sdataservice: "cloud-infrastructure",
  mmcloud: "cloud-infrastructure",
  perian: "cloud-infrastructure",
  slurm: "cloud-infrastructure",
  "kf-pytorch": "ml-training",
  "kf-tensorflow": "ml-training",
  "kf-mpi": "ml-training",
  spark: "ml-training",
  ray: "ml-training",
  dask: "ml-training",
  inference: "model-serving",
  openai: "model-serving",
  "dgxc-lepton": "model-serving",
  "onnx-pytorch": "model-serving",
  "onnx-scikitlearn": "model-serving",
  "onnx-tensorflow": "model-serving",
  wandb: "experiment-tracking",
  mlflow: "experiment-tracking",
  "comet-ml": "experiment-tracking",
  neptune: "experiment-tracking",
  greatexpectations: "data-validation",
  pandera: "data-validation",
  whylogs: "data-validation",
  airflow: "workflow",
  dbt: "workflow",
  papermill: "workflow",
  flyteinteractive: "developer-tools",
  envd: "developer-tools",
  memray: "developer-tools",
  "deck-standard": "developer-tools",
  optuna: "developer-tools",
  omegaconf: "developer-tools",
  "identity-aware-proxy": "developer-tools",
};

// Tags per plugin
const TAGS_MAP = {
  spark: ["spark", "pyspark", "distributed", "big-data"],
  bigquery: ["bigquery", "google", "sql", "warehouse"],
  ray: ["ray", "distributed", "ml", "compute"],
  wandb: ["wandb", "experiment-tracking", "ml", "logging"],
  "kf-pytorch": ["pytorch", "kubeflow", "distributed-training", "deep-learning"],
  "kf-tensorflow": ["tensorflow", "kubeflow", "distributed-training"],
  "kf-mpi": ["mpi", "kubeflow", "distributed", "horovod"],
  dask: ["dask", "distributed", "parallel", "compute"],
  snowflake: ["snowflake", "sql", "warehouse", "analytics"],
  duckdb: ["duckdb", "sql", "analytics", "olap"],
  hive: ["hive", "hadoop", "sql", "big-data"],
  sqlalchemy: ["sqlalchemy", "sql", "orm", "database"],
  dolt: ["dolt", "versioned-database", "sql"],
  polars: ["polars", "dataframe", "rust", "fast"],
  vaex: ["vaex", "dataframe", "out-of-core"],
  modin: ["modin", "dataframe", "pandas", "parallel"],
  geopandas: ["geopandas", "geospatial", "gis"],
  huggingface: ["huggingface", "datasets", "nlp", "ml"],
  "async-fsspec": ["fsspec", "async", "filesystem"],
  "data-fsspec": ["fsspec", "filesystem", "storage"],
  "aws-batch": ["aws", "batch", "cloud", "compute"],
  "aws-athena": ["aws", "athena", "sql", "serverless"],
  "aws-sagemaker": ["aws", "sagemaker", "ml", "training"],
  "k8s-pod": ["kubernetes", "k8s", "pod", "container"],
  k8sdataservice: ["kubernetes", "k8s", "data-service"],
  mmcloud: ["mmcloud", "memverge", "cloud"],
  perian: ["perian", "gpu", "infrastructure"],
  slurm: ["slurm", "hpc", "cluster", "batch"],
  inference: ["inference", "serving", "nim", "ollama"],
  openai: ["openai", "gpt", "llm", "ai"],
  "dgxc-lepton": ["nvidia", "dgx", "lepton", "gpu"],
  "onnx-pytorch": ["onnx", "pytorch", "model"],
  "onnx-scikitlearn": ["onnx", "scikit-learn", "sklearn"],
  "onnx-tensorflow": ["onnx", "tensorflow", "model"],
  mlflow: ["mlflow", "experiment-tracking", "model-registry"],
  "comet-ml": ["comet", "experiment-tracking", "visualization"],
  neptune: ["neptune", "experiment-tracking", "metadata"],
  greatexpectations: ["great-expectations", "data-quality", "validation"],
  pandera: ["pandera", "validation", "schema", "dataframe"],
  whylogs: ["whylogs", "data-profiling", "monitoring"],
  airflow: ["airflow", "orchestration", "operators"],
  dbt: ["dbt", "data-transformation", "sql"],
  papermill: ["papermill", "jupyter", "notebook"],
  flyteinteractive: ["interactive", "vscode", "jupyter"],
  envd: ["envd", "container", "image-builder"],
  memray: ["memray", "memory", "profiling"],
  "deck-standard": ["deck", "visualization", "rendering"],
  optuna: ["optuna", "hyperparameter", "optimization"],
  omegaconf: ["omegaconf", "config", "hydra"],
  "identity-aware-proxy": ["gcp", "iap", "authentication"],
};

function parseSetupPy(content) {
  const result = {
    title: null,
    name: null,
    description: null,
    installRequires: [],
  };

  // Extract title
  const titleMatch = content.match(/title\s*=\s*"([^"]+)"/);
  if (titleMatch) result.title = titleMatch[1];

  // Extract name
  const nameMatch = content.match(/name\s*=\s*(?:microlib_name|f?"([^"]*)")/);
  if (nameMatch && nameMatch[1]) result.name = nameMatch[1];

  // Try to extract microlib_name pattern
  const microlibMatch = content.match(/microlib_name\s*=\s*f"([^"]+)"/);
  const pluginNameMatch = content.match(/PLUGIN_NAME\s*=\s*"([^"]+)"/);
  if (microlibMatch && pluginNameMatch) {
    result.name = microlibMatch[1].replace("{PLUGIN_NAME}", pluginNameMatch[1]);
  }

  // Extract description
  const descMatch = content.match(/description\s*=\s*"([^"]+)"/);
  if (descMatch) result.description = descMatch[1];

  // Extract install_requires
  const reqMatch = content.match(/plugin_requires\s*=\s*\[([\s\S]*?)\]/);
  if (reqMatch) {
    const reqs = reqMatch[1].match(/"([^"]+)"/g);
    if (reqs) {
      result.installRequires = reqs.map((r) => r.replace(/"/g, ""));
    }
  }

  return result;
}

function extractMinFlytekitVersion(requires) {
  for (const req of requires) {
    const match = req.match(/flytekit[><=]+([0-9.]+)/);
    if (match) return match[1];
  }
  return "1.0.0";
}

function extractDependencies(requires) {
  return requires
    .filter((r) => !r.startsWith("flytekit") && !r.startsWith("flyteidl"))
    .map((r) => r.replace(/[><=!~\[].*$/, "").trim())
    .filter(Boolean);
}

function parseInitPy(content) {
  const modules = [];
  // Match "from .xxx import Yyy, Zzz" patterns
  const importRegex = /from\s+\.[a-z_.]+\s+import\s+([^#\n]+)/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const names = match[1]
      .replace(/\([\s\S]*?\)/g, (m) => m.replace(/\n/g, ""))
      .split(",")
      .map((n) => n.replace(/#.*$/, "").trim())
      .filter((n) => n && !n.startsWith("_") && n !== "noqa");

    for (const name of names) {
      const cleanName = name.replace(/\s+#.*$/, "").trim();
      if (cleanName && /^[A-Za-z]/.test(cleanName)) {
        modules.push(cleanName);
      }
    }
  }
  return [...new Set(modules)];
}

function classifyModule(name) {
  const lower = name.toLowerCase();
  if (lower.includes("task") || lower.includes("job") || lower === "spark" || lower === "dask" || lower.includes("databricks")) return "task";
  if (lower.includes("connector") || lower.includes("agent")) return "agent";
  if (lower.includes("sensor")) return "sensor";
  if (lower.includes("config") || lower.includes("transformer") || lower.includes("handler") || lower.includes("renderer") || lower.includes("schema") || lower.includes("secret") || lower.includes("model") || lower.includes("policy")) return "type";
  // Decorators and functions
  if (lower.startsWith("new_") || lower.endsWith("_init") || lower === "mlflow_autolog" || lower === "wandb_init" || lower === "comet_ml_init" || lower === "neptune_init_run" || lower === "vscode" || lower === "jupyter" || lower === "memray_profiling") return "task";
  return "other";
}

function getReadmeDescription(pluginDir) {
  const readmePath = join(pluginDir, "README.md");
  if (!existsSync(readmePath)) return null;
  const content = readFileSync(readmePath, "utf-8");
  const lines = content.split("\n");
  // Skip title line and blank lines, get first paragraph
  let desc = "";
  let foundContent = false;
  for (const line of lines) {
    if (line.startsWith("#")) {
      foundContent = true;
      continue;
    }
    if (foundContent && line.trim()) {
      desc = line.trim();
      break;
    }
  }
  // Clean up markdown links and formatting
  desc = desc.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  desc = desc.replace(/`/g, "");
  return desc || null;
}

function findInitPy(pluginDir) {
  const pluginsDir = join(pluginDir, "flytekitplugins");
  if (!existsSync(pluginsDir)) return null;

  const subdirs = readdirSync(pluginsDir).filter((f) => {
    const fullPath = join(pluginsDir, f);
    return statSync(fullPath).isDirectory() && !f.startsWith("__");
  });

  for (const sub of subdirs) {
    const initPath = join(pluginsDir, sub, "__init__.py");
    if (existsSync(initPath)) {
      return { path: initPath, modulePath: `flytekitplugins.${sub}` };
    }
  }
  return null;
}

function main() {
  const pluginDirs = readdirSync(FLYTEKIT_PLUGINS_DIR)
    .filter((d) => d.startsWith("flytekit-"))
    .map((d) => join(FLYTEKIT_PLUGINS_DIR, d))
    .filter((d) => statSync(d).isDirectory());

  console.log(`Found ${pluginDirs.length} plugin directories`);

  const plugins = [];

  for (const dir of pluginDirs) {
    const slug = basename(dir).replace("flytekit-", "");
    const setupPath = join(dir, "setup.py");

    if (!existsSync(setupPath)) {
      console.warn(`  Skipping ${slug}: no setup.py`);
      continue;
    }

    const setupContent = readFileSync(setupPath, "utf-8");
    const setup = parseSetupPy(setupContent);

    const initInfo = findInitPy(dir);
    let moduleNames = [];
    let modulePath = "";

    if (initInfo) {
      const initContent = readFileSync(initInfo.path, "utf-8");
      moduleNames = parseInitPy(initContent);
      modulePath = initInfo.modulePath;
    }

    const readmeDesc = getReadmeDescription(dir);
    const description = readmeDesc || setup.description || `Flytekit ${setup.title || slug} plugin`;
    const minFlytekitVersion = extractMinFlytekitVersion(setup.installRequires);
    const dependencies = extractDependencies(setup.installRequires);
    const category = CATEGORY_MAP[slug] || "developer-tools";
    const tags = TAGS_MAP[slug] || [slug];

    const modules = moduleNames.map((name) => ({
      name,
      type: classifyModule(name),
      importPath: modulePath,
      description: `${name} from ${setup.title || slug} plugin`,
    }));

    const packageName = setup.name || `flytekitplugins-${slug}`;

    const plugin = {
      slug,
      name: setup.title || slug.charAt(0).toUpperCase() + slug.slice(1),
      packageName,
      description,
      category,
      tags,
      dependencies,
      installCommand: `pip install ${packageName}`,
      githubUrl: `https://github.com/flyteorg/flytekit/tree/master/plugins/flytekit-${slug}`,
      docsUrl: `https://docs.flyte.org/en/latest/flytesnacks/examples/${slug.replace(/-/g, "_")}_plugin/index.html`,
      pypiUrl: `https://pypi.org/project/${packageName}/`,
      minFlytekitVersion,
      modules,
      isDeprecated: false,
    };

    plugins.push(plugin);
    console.log(`  ${slug}: ${modules.length} modules, ${dependencies.length} deps`);
  }

  // Sort by name
  plugins.sort((a, b) => a.name.localeCompare(b.name));

  writeFileSync(OUTPUT_PATH, JSON.stringify(plugins, null, 2));
  console.log(`\nGenerated ${plugins.length} plugins to ${OUTPUT_PATH}`);
}

main();
