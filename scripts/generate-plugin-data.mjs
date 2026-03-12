/**
 * Single source of truth for plugins.json generation.
 *
 * This script does EVERYTHING in one pass:
 *   1. Reads plugin source code from local flytekit/flyte-sdk clones
 *   2. Merges curated fields from existing plugins.json (docsUrl, addedDate, snacksUrl)
 *   3. Fetches docstrings from GitHub API for module descriptions
 *   4. Fetches contributors from GitHub API
 *   5. Writes plugins.json ONCE at the end
 *
 * Usage:
 *   node scripts/generate-plugin-data.mjs
 *
 * Environment variables:
 *   FLYTEKIT_PATH    - path to flytekit/plugins dir (default: ../flytekit/plugins)
 *   FLYTE_SDK_PATH   - path to flyte-sdk/plugins dir (default: ../flyte-sdk/plugins)
 *   SKIP_DOCSTRINGS  - set to "1" to skip GitHub API calls for docstrings
 *   SKIP_CONTRIBUTORS - set to "1" to skip GitHub API calls for contributors
 *   GH_TOKEN         - GitHub token for API calls (set automatically in CI)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "fs";
import { join, dirname, basename } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FLYTEKIT_PLUGINS_DIR = process.env.FLYTEKIT_PATH || join(__dirname, "../../flytekit/plugins");
const FLYTE_SDK_PLUGINS_DIR = process.env.FLYTE_SDK_PATH || join(__dirname, "../../flyte-sdk/plugins");
const OUTPUT_PATH = join(__dirname, "../src/data/plugins.json");

// ── Static mappings ─────────────────────────────────────────────

const CATEGORY_MAP = {
  polars: "data-dataframe", vaex: "data-dataframe", modin: "data-dataframe",
  geopandas: "data-dataframe", huggingface: "data-dataframe",
  "async-fsspec": "data-dataframe", "data-fsspec": "data-dataframe",
  bigquery: "databases-warehouses", snowflake: "databases-warehouses",
  duckdb: "databases-warehouses", hive: "databases-warehouses",
  sqlalchemy: "databases-warehouses", dolt: "databases-warehouses",
  "aws-batch": "cloud-infrastructure", "aws-athena": "cloud-infrastructure",
  "aws-sagemaker": "cloud-infrastructure", "k8s-pod": "cloud-infrastructure",
  k8sdataservice: "cloud-infrastructure", mmcloud: "cloud-infrastructure",
  perian: "cloud-infrastructure", slurm: "cloud-infrastructure",
  "kf-pytorch": "ml-training", "kf-tensorflow": "ml-training",
  "kf-mpi": "ml-training", spark: "ml-training", ray: "ml-training", dask: "ml-training",
  inference: "model-serving", openai: "model-serving", "dgxc-lepton": "model-serving",
  "onnx-pytorch": "model-serving", "onnx-scikitlearn": "model-serving",
  "onnx-tensorflow": "model-serving",
  wandb: "experiment-tracking", mlflow: "experiment-tracking",
  "comet-ml": "experiment-tracking", neptune: "experiment-tracking",
  greatexpectations: "data-validation", pandera: "data-validation",
  whylogs: "data-validation",
  airflow: "workflow", dbt: "workflow", papermill: "workflow",
  flyteinteractive: "developer-tools", envd: "developer-tools",
  memray: "developer-tools", "deck-standard": "developer-tools",
  optuna: "developer-tools", omegaconf: "developer-tools",
  "identity-aware-proxy": "developer-tools",
};

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

const V2_CATEGORY_MAP = {
  bigquery: "databases-warehouses", dask: "ml-training",
  databricks: "cloud-infrastructure", openai: "model-serving",
  polars: "data-dataframe", pytorch: "ml-training",
  ray: "ml-training", sglang: "model-serving",
  snowflake: "databases-warehouses", spark: "ml-training",
  vllm: "model-serving", wandb: "experiment-tracking",
};

const V2_TAGS_MAP = {
  bigquery: ["bigquery", "google", "sql", "warehouse", "connector"],
  dask: ["dask", "distributed", "parallel", "dataframe"],
  databricks: ["databricks", "spark", "cloud", "connector"],
  openai: ["openai", "llm", "agents", "ai"],
  polars: ["polars", "dataframe", "type"],
  pytorch: ["pytorch", "deep-learning", "distributed", "elastic"],
  ray: ["ray", "distributed", "parallel"],
  sglang: ["sglang", "inference", "llm", "serving", "gpu"],
  snowflake: ["snowflake", "sql", "warehouse", "connector"],
  spark: ["spark", "pyspark", "distributed", "big-data"],
  vllm: ["vllm", "inference", "llm", "serving", "gpu"],
  wandb: ["wandb", "experiment-tracking", "logging", "sweeps"],
};

// ── Parsing helpers ─────────────────────────────────────────────

function parseSetupPy(content) {
  const result = { title: null, name: null, description: null, installRequires: [] };
  const titleMatch = content.match(/title\s*=\s*"([^"]+)"/);
  if (titleMatch) result.title = titleMatch[1];
  const nameMatch = content.match(/name\s*=\s*(?:microlib_name|f?"([^"]*)")/);
  if (nameMatch && nameMatch[1]) result.name = nameMatch[1];
  const microlibMatch = content.match(/microlib_name\s*=\s*f"([^"]+)"/);
  const pluginNameMatch = content.match(/PLUGIN_NAME\s*=\s*"([^"]+)"/);
  if (microlibMatch && pluginNameMatch) {
    result.name = microlibMatch[1].replace("{PLUGIN_NAME}", pluginNameMatch[1]);
  }
  const descMatch = content.match(/description\s*=\s*"([^"]+)"/);
  if (descMatch) result.description = descMatch[1];
  const reqMatch = content.match(/plugin_requires\s*=\s*\[([\s\S]*?)\]/);
  if (reqMatch) {
    const reqs = reqMatch[1].match(/"([^"]+)"/g);
    if (reqs) result.installRequires = reqs.map((r) => r.replace(/"/g, ""));
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
  const importRegex = /from\s+(?:\.|flyte(?:kit)?plugins\.)[a-z0-9_.]+\s+import\s+([^#\n]+)/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const names = match[1]
      .replace(/\([\s\S]*?\)/g, (m) => m.replace(/\n/g, ""))
      .split(",")
      .map((n) => n.replace(/#.*$/, "").trim())
      .filter((n) => n && !n.startsWith("_") && n !== "noqa");
    for (const name of names) {
      const cleanName = name.replace(/\s+#.*$/, "").trim();
      if (cleanName && /^[A-Za-z]/.test(cleanName)) modules.push(cleanName);
    }
  }
  if (modules.length === 0) {
    const allMatch = content.match(/__all__\s*=\s*\[([\s\S]*?)\]/);
    if (allMatch) {
      const names = allMatch[1].match(/"([^"]+)"/g);
      if (names) {
        for (const n of names) {
          const clean = n.replace(/"/g, "");
          if (clean && !clean.startsWith("_")) modules.push(clean);
        }
      }
    }
  }
  return [...new Set(modules)];
}

function classifyModule(name) {
  const lower = name.toLowerCase();
  if (lower.includes("task") || lower.includes("job")) return "task";
  if (lower.includes("connector") || lower.includes("agent")) return "agent";
  if (lower.includes("sensor")) return "sensor";
  if (lower.includes("workflow")) return "workflow";
  if (lower.includes("config") || lower.includes("transformer") || lower.includes("handler") ||
      lower.includes("renderer") || lower.includes("schema") || lower.includes("secret") ||
      lower.includes("model") || lower.includes("policy")) return "type";
  if (/^[a-z]/.test(name)) return "task";
  return "type";
}

function getReadmeDescription(pluginDir) {
  const readmePath = join(pluginDir, "README.md");
  if (!existsSync(readmePath)) return null;
  const content = readFileSync(readmePath, "utf-8");
  const lines = content.split("\n");
  let desc = "";
  let foundContent = false;
  for (const line of lines) {
    if (line.startsWith("#")) { foundContent = true; continue; }
    if (foundContent && line.trim()) {
      // Skip markdown blockquotes and callouts
      if (line.trim().startsWith(">")) continue;
      // Skip badges/images
      if (line.trim().startsWith("[![") || line.trim().startsWith("![")) continue;
      desc = line.trim();
      break;
    }
  }
  desc = desc.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
  desc = desc.replace(/`/g, "");
  desc = desc.replace(/\*\*/g, "");
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
    if (existsSync(initPath)) return { path: initPath, modulePath: `flytekitplugins.${sub}` };
  }
  return null;
}

// ── GitHub API helpers ──────────────────────────────────────────

function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end);
}

function ghFetchFile(repo, path) {
  try {
    const cmd = `gh api "repos/${repo}/contents/${path}" --jq '.content'`;
    const b64 = execSync(cmd, { encoding: "utf-8", timeout: 15000 }).trim();
    return Buffer.from(b64, "base64").toString("utf-8");
  } catch { return null; }
}

function ghListPyFiles(repo, dirPath) {
  try {
    const cmd = `gh api "repos/${repo}/contents/${dirPath}" --jq '[.[] | {name: .name, type: .type}]'`;
    const entries = JSON.parse(execSync(cmd, { encoding: "utf-8", timeout: 15000 }));
    const pyFiles = entries.filter((e) => e.type === "file" && e.name.endsWith(".py")).map((e) => e.name);
    // Also list .py files in immediate subdirectories
    const subdirs = entries.filter((e) => e.type === "dir" && !e.name.startsWith("_"));
    for (const sub of subdirs) {
      try {
        const subCmd = `gh api "repos/${repo}/contents/${dirPath}/${sub.name}" --jq '[.[] | select(.name | endswith(".py")) | .name]'`;
        const subFiles = JSON.parse(execSync(subCmd, { encoding: "utf-8", timeout: 15000 }));
        pyFiles.push(...subFiles.map((f) => `${sub.name}/${f}`));
        sleep(100);
      } catch {}
    }
    return pyFiles;
  } catch { return []; }
}

// Map Python base classes to module subtypes
const BASE_CLASS_MAP = {
  // Transformers
  "TypeTransformer": "transformer",
  "TypeEngine": "transformer",
  "BatchDecodingHandler": "handler",
  "BatchEncodingHandler": "handler",
  // Tasks
  "PythonTask": "task",
  "PythonFunctionTask": "task",
  "PythonAutoContainerTask": "task",
  "PythonCustomizedContainerTask": "task",
  "ShellTask": "task",
  "SQLTask": "task",
  // Sensors
  "SensorTask": "sensor",
  "BaseSensor": "sensor",
  // Agents / Connectors
  "AgentBase": "agent",
  "AsyncAgentBase": "agent",
  "SyncAgentBase": "agent",
  "Connector": "connector",
  "DefaultConnector": "connector",
  "AsyncAgentExecutorMixin": "agent",
  // Workflows
  "WorkflowBase": "workflow",
  // Renderers
  "Renderer": "renderer",
  "TopFrameRenderer": "renderer",
  // Config / data types
  "Enum": "enum",
  "IntEnum": "enum",
  "StrEnum": "enum",
};

function extractBaseClass(source, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Check for class with base classes
  const classRegex = new RegExp(`class\\s+${escaped}\\s*\\(([^)]+)\\)`, "m");
  const classMatch = source.match(classRegex);
  if (classMatch) {
    const bases = classMatch[1].split(",").map((b) => b.replace(/\[.*$/, "").trim());
    for (const base of bases) {
      const clean = base.split(".").pop();
      if (BASE_CLASS_MAP[clean]) return { baseClass: clean, subtype: BASE_CLASS_MAP[clean] };
    }
  }

  // Check for @dataclass decorator → config subtype
  const dcRegex = new RegExp(`@dataclass[^\\n]*\\nclass\\s+${escaped}`, "m");
  if (dcRegex.test(source)) return { baseClass: "dataclass", subtype: "config" };

  // Check for NamedTuple
  const ntRegex = new RegExp(`class\\s+${escaped}\\s*\\(.*NamedTuple.*\\)`, "m");
  if (ntRegex.test(source)) return { baseClass: "NamedTuple", subtype: "config" };

  // Check for plain class (no base) with @dataclass-like patterns
  const plainRegex = new RegExp(`class\\s+${escaped}\\s*[:(]`, "m");
  if (plainRegex.test(source)) {
    // Check if it's a simple class with no interesting base
    const noBaseRegex = new RegExp(`class\\s+${escaped}\\s*:`, "m");
    if (noBaseRegex.test(source)) return { baseClass: "class", subtype: "config" };
  }

  return null;
}

function extractDocstring(source, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `(?:class|def)\\s+${escaped}[^:]*:[\\s]*\\n\\s+(?:"""|\\'\\'\\'|""")([\\s\\S]*?)(?:"""|\\'\\'\\'|""")`,
    "m"
  );
  const match = source.match(regex);
  if (!match) return null;
  const doc = match[1].trim();
  const firstLine = doc
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith(":") && !l.startsWith(".."))
    .join(" ")
    .split(". ")[0]
    .trim();
  if (firstLine.length < 5) return null;
  return firstLine.endsWith(".") ? firstLine : firstLine + ".";
}

// ── Main ────────────────────────────────────────────────────────

function main() {
  // Load existing data for merging curated fields
  let existingMap = new Map();
  if (existsSync(OUTPUT_PATH)) {
    const existing = JSON.parse(readFileSync(OUTPUT_PATH, "utf-8"));
    existingMap = new Map(existing.map((p) => [p.slug, p]));
    console.log(`Loaded ${existingMap.size} existing plugins for merge`);
  }

  const plugins = [];

  // ── Step 1: Parse flytekit plugins ──────────────────────────

  const pluginDirs = readdirSync(FLYTEKIT_PLUGINS_DIR)
    .filter((d) => d.startsWith("flytekit-"))
    .map((d) => join(FLYTEKIT_PLUGINS_DIR, d))
    .filter((d) => statSync(d).isDirectory());

  console.log(`\nFound ${pluginDirs.length} flytekit plugin directories`);

  for (const dir of pluginDirs) {
    const slug = basename(dir).replace("flytekit-", "");
    const setupPath = join(dir, "setup.py");
    if (!existsSync(setupPath)) { console.warn(`  Skipping ${slug}: no setup.py`); continue; }

    const setup = parseSetupPy(readFileSync(setupPath, "utf-8"));
    const initInfo = findInitPy(dir);
    let moduleNames = [];
    let modulePath = "";
    if (initInfo) {
      moduleNames = parseInitPy(readFileSync(initInfo.path, "utf-8"));
      modulePath = initInfo.modulePath;
    }

    const readmeDesc = getReadmeDescription(dir);
    const packageName = setup.name || `flytekitplugins-${slug}`;
    const prev = existingMap.get(slug);

    plugins.push({
      slug,
      name: setup.title || slug.charAt(0).toUpperCase() + slug.slice(1),
      packageName,
      description: readmeDesc || setup.description || `Flytekit ${setup.title || slug} plugin`,
      category: CATEGORY_MAP[slug] || "developer-tools",
      tags: TAGS_MAP[slug] || [slug],
      dependencies: extractDependencies(setup.installRequires),
      installCommand: `pip install ${packageName}`,
      githubUrl: `https://github.com/flyteorg/flytekit/tree/master/plugins/flytekit-${slug}`,
      docsUrl: prev?.docsUrl || `https://www.union.ai/docs/flyte/integrations/`,
      pypiUrl: `https://pypi.org/project/${packageName}/`,
      minFlytekitVersion: extractMinFlytekitVersion(setup.installRequires),
      modules: moduleNames.map((name) => ({
        name,
        type: classifyModule(name),
        importPath: modulePath,
        description: null, // filled later by docstring fetch or merge
      })),
      isDeprecated: false,
      sdk: "flytekit",
      addedDate: prev?.addedDate || null,
      snacksUrl: prev?.snacksUrl || null,
      maintainers: [], // filled later
    });
    console.log(`  ${slug}: ${moduleNames.length} modules`);
  }

  // ── Step 2: Parse flyte-sdk plugins ─────────────────────────

  if (existsSync(FLYTE_SDK_PLUGINS_DIR)) {
    const v2Dirs = readdirSync(FLYTE_SDK_PLUGINS_DIR)
      .filter((d) => statSync(join(FLYTE_SDK_PLUGINS_DIR, d)).isDirectory() && !d.startsWith("__"));

    console.log(`\nFound ${v2Dirs.length} flyte-sdk plugin directories`);

    for (const dirName of v2Dirs) {
      const dir = join(FLYTE_SDK_PLUGINS_DIR, dirName);
      const pyprojectPath = join(dir, "pyproject.toml");
      if (!existsSync(pyprojectPath)) { console.warn(`  Skipping v2-${dirName}: no pyproject.toml`); continue; }

      const pyproject = readFileSync(pyprojectPath, "utf-8");
      const nameMatch = pyproject.match(/name\s*=\s*"([^"]+)"/);
      const packageName = nameMatch ? nameMatch[1] : `flyteplugins-${dirName}`;
      const descMatch = pyproject.match(/description\s*=\s*"([^"]+)"/);
      const description = descMatch ? descMatch[1] : `${dirName} plugin for Flyte SDK`;

      const depsMatch = pyproject.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
      let deps = [];
      if (depsMatch) {
        const depStrings = depsMatch[1].match(/"([^"]+)"/g);
        if (depStrings) {
          deps = depStrings.map((d) => d.replace(/"/g, ""))
            .filter((d) => !d.startsWith("flyte"))
            .map((d) => d.replace(/[><=!~\[].*$/, "").trim())
            .filter(Boolean);
        }
      }

      const initDir = join(dir, "src", "flyteplugins", dirName);
      const initPath = join(initDir, "__init__.py");
      let moduleNames = [];
      let modulePath = `flyteplugins.${dirName}`;
      if (existsSync(initPath)) moduleNames = parseInitPy(readFileSync(initPath, "utf-8"));
      if (moduleNames.length === 0 && existsSync(initDir)) {
        for (const sub of readdirSync(initDir).filter((f) => statSync(join(initDir, f)).isDirectory() && !f.startsWith("_"))) {
          const subInit = join(initDir, sub, "__init__.py");
          if (existsSync(subInit)) {
            moduleNames.push(...parseInitPy(readFileSync(subInit, "utf-8")));
            if (!modulePath.includes(sub)) modulePath = `flyteplugins.${dirName}.${sub}`;
          }
        }
      }

      const readmeDesc = getReadmeDescription(dir);
      const slug = `v2-${dirName}`;
      const prev = existingMap.get(slug);

      plugins.push({
        slug,
        name: descMatch ? descMatch[1].replace(/ plugin for [Ff]lyte.*/, "") : dirName.charAt(0).toUpperCase() + dirName.slice(1),
        packageName,
        description: readmeDesc || description,
        category: V2_CATEGORY_MAP[dirName] || "developer-tools",
        tags: V2_TAGS_MAP[dirName] || [dirName],
        dependencies: deps,
        installCommand: `pip install ${packageName}`,
        githubUrl: `https://github.com/flyteorg/flyte-sdk/tree/main/plugins/${dirName}`,
        docsUrl: prev?.docsUrl || `https://www.union.ai/docs/flyte/integrations/`,
        pypiUrl: `https://pypi.org/project/${packageName}/`,
        minFlytekitVersion: "",
        modules: moduleNames.map((name) => ({
          name, type: classifyModule(name), importPath: modulePath, description: null,
        })),
        isDeprecated: false,
        sdk: "flyte-sdk",
        addedDate: prev?.addedDate || null,
        snacksUrl: prev?.snacksUrl || null,
        maintainers: [],
      });
      console.log(`  v2-${dirName}: ${moduleNames.length} modules`);
    }
  } else {
    console.log("\nflyte-sdk plugins directory not found, skipping");
  }

  plugins.sort((a, b) => a.name.localeCompare(b.name));

  // ── Step 3: Merge module descriptions from existing data ────
  // This preserves docstrings fetched in previous runs so they
  // survive even if SKIP_DOCSTRINGS=1 or the API is down.

  let mergedDescriptions = 0;
  let mergedBaseClasses = 0;
  for (const plugin of plugins) {
    const prev = existingMap.get(plugin.slug);
    if (!prev?.modules) continue;
    const prevModMap = new Map(prev.modules.map((m) => [m.name, m]));
    for (const mod of plugin.modules) {
      const prevMod = prevModMap.get(mod.name);
      if (!prevMod) continue;
      if (prevMod.description && !isGenericDescription(prevMod.description)) {
        mod.description = prevMod.description;
        mergedDescriptions++;
      }
      if (prevMod.baseClass) {
        mod.baseClass = prevMod.baseClass;
        mod.subtype = prevMod.subtype;
        mergedBaseClasses++;
      }
    }
  }
  console.log(`\nMerged ${mergedDescriptions} descriptions, ${mergedBaseClasses} base classes from existing data`);

  // ── Step 4: Fetch docstrings + base classes from GitHub ─────
  // Reads source files to extract docstrings and class hierarchy.

  if (process.env.SKIP_DOCSTRINGS !== "1") {
    console.log("\nFetching docstrings and base classes from GitHub...");
    let fetchedDocs = 0;
    let fetchedBases = 0;

    for (const plugin of plugins) {
      const needsDocstring = plugin.modules.filter(
        (m) => !m.description || isGenericDescription(m.description)
      );
      const needsBaseClass = plugin.modules.filter((m) => !m.baseClass);
      if (needsDocstring.length === 0 && needsBaseClass.length === 0) continue;

      let repo, basePath;
      if (plugin.slug.startsWith("v2-")) {
        repo = "flyteorg/flyte-sdk";
        const name = plugin.slug.replace("v2-", "");
        basePath = `plugins/${name}/src/flyteplugins/${name}`;
      } else {
        repo = "flyteorg/flytekit";
        const modParts = plugin.modules[0]?.importPath.replace("flytekitplugins.", "").split(".") || [];
        basePath = `plugins/flytekit-${plugin.slug}/flytekitplugins/${modParts[0] || plugin.slug}`;
      }

      const pyFiles = ghListPyFiles(repo, basePath);
      sleep(100);
      if (pyFiles.length === 0) continue;

      const docNameSet = new Set(needsDocstring.map((m) => m.name));
      const baseNameSet = new Set(needsBaseClass.map((m) => m.name));
      const allNeeded = new Set([...docNameSet, ...baseNameSet]);

      for (const file of pyFiles) {
        if (allNeeded.size === 0) break;
        const source = ghFetchFile(repo, `${basePath}/${file}`);
        sleep(100);
        if (!source) continue;

        for (const mod of plugin.modules) {
          if (!allNeeded.has(mod.name)) continue;

          // Extract docstring
          if (docNameSet.has(mod.name)) {
            const doc = extractDocstring(source, mod.name);
            if (doc) {
              mod.description = doc;
              docNameSet.delete(mod.name);
              fetchedDocs++;
              console.log(`  ${plugin.slug}/${mod.name}: ${doc}`);
            }
          }

          // Extract base class
          if (baseNameSet.has(mod.name)) {
            const baseInfo = extractBaseClass(source, mod.name);
            if (baseInfo) {
              mod.baseClass = baseInfo.baseClass;
              mod.subtype = baseInfo.subtype;
              baseNameSet.delete(mod.name);
              fetchedBases++;
            }
          }

          if (!docNameSet.has(mod.name) && !baseNameSet.has(mod.name)) {
            allNeeded.delete(mod.name);
          }
        }
      }
    }
    console.log(`Fetched ${fetchedDocs} docstrings, ${fetchedBases} base classes from source code`);
  } else {
    console.log("\nSkipping docstring fetch (SKIP_DOCSTRINGS=1)");
  }

  // ── Step 5: Fill remaining empty descriptions ───────────────

  for (const plugin of plugins) {
    for (const mod of plugin.modules) {
      if (!mod.description || isGenericDescription(mod.description)) {
        const typeLabel = {
          task: "Task for", type: "Configuration type for",
          agent: "Backend connector for", sensor: "Sensor for",
          workflow: "Workflow component for",
        };
        mod.description = `${typeLabel[mod.type] || "Component from"} ${plugin.name}.`;
      }
    }
  }

  // ── Step 6: Fetch contributors from GitHub ──────────────────

  if (process.env.SKIP_CONTRIBUTORS !== "1") {
    console.log("\nFetching contributors from GitHub...");
    for (const plugin of plugins) {
      let repo, path;
      if (plugin.slug.startsWith("v2-")) {
        repo = "flyteorg/flyte-sdk";
        path = `plugins/${plugin.slug.replace("v2-", "")}`;
      } else {
        repo = "flyteorg/flytekit";
        path = `plugins/flytekit-${plugin.slug}`;
      }
      try {
        const cmd = `gh api "repos/${repo}/commits?path=${path}&per_page=100" --jq "[.[] | {login: .author.login, avatar: .author.avatar_url}]"`;
        const commits = JSON.parse(execSync(cmd, { encoding: "utf-8", timeout: 15000 }));
        const counts = {};
        commits.forEach((c) => {
          if (!c.login || c.login.endsWith("[bot]")) return;
          if (!counts[c.login]) counts[c.login] = { login: c.login, avatar: c.avatar, commits: 0 };
          counts[c.login].commits++;
        });
        const sorted = Object.values(counts).sort((a, b) => b.commits - a.commits);
        const top3 = sorted.slice(0, 3);
        // Ensure the original author (oldest commit) is always included
        const oldest = commits.filter((c) => c.login && !c.login.endsWith("[bot]")).at(-1);
        if (oldest && !top3.some((t) => t.login === oldest.login)) {
          const original = counts[oldest.login];
          if (original) {
            top3.pop();
            top3.push(original);
          }
        }
        plugin.maintainers = top3.map((c) => ({ login: c.login, avatarUrl: c.avatar }));
        console.log(`  ${plugin.slug}: ${plugin.maintainers.map((m) => m.login).join(", ")}`);
      } catch {
        // Preserve existing contributors if API fails
        const prev = existingMap.get(plugin.slug);
        plugin.maintainers = prev?.maintainers || [];
        console.warn(`  ${plugin.slug}: API failed, preserved existing`);
      }
    }
  } else {
    console.log("\nSkipping contributor fetch (SKIP_CONTRIBUTORS=1)");
    // Preserve existing contributors
    for (const plugin of plugins) {
      const prev = existingMap.get(plugin.slug);
      plugin.maintainers = prev?.maintainers || [];
    }
  }

  // ── Step 7: Write output ────────────────────────────────────

  // Clean up null fields before writing
  for (const plugin of plugins) {
    if (!plugin.addedDate) delete plugin.addedDate;
    if (!plugin.snacksUrl) delete plugin.snacksUrl;
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(plugins, null, 2) + "\n");
  console.log(`\nDone! Generated ${plugins.length} plugins to ${OUTPUT_PATH}`);
}

function isGenericDescription(desc) {
  if (!desc) return true;
  // "X from Y plugin" or "Task for Y." or "Configuration type for Y."
  if (desc.includes(" from ") && desc.includes(" plugin")) return true;
  if (/^(Task for|Configuration type for|Backend connector for|Sensor for|Workflow component for|Component from) /.test(desc)) return true;
  return false;
}

main();
