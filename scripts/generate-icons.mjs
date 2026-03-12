#!/usr/bin/env node

/**
 * Generates plugin icons from three sources (in priority order):
 * 1. simple-icons npm package (official brand SVGs)
 * 2. GitHub org/user avatar (fetched as fallback)
 * 3. Auto-generated initial letter SVG (last resort)
 */

import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";

const ICONS_DIR = join(import.meta.dirname, "../public/icons/plugins");
mkdirSync(ICONS_DIR, { recursive: true });

// ── Mapping: plugin slug → simple-icons slug ────────────────────────
const SIMPLE_ICONS_MAP = {
  airflow: "apacheairflow",
  bigquery: "googlebigquery",
  dask: "dask",
  duckdb: "duckdb",
  geopandas: "pandas",
  hive: "apachehive",
  huggingface: "huggingface",
  "kf-mpi": "kubernetes",
  "kf-pytorch": "pytorch",
  "kf-tensorflow": "tensorflow",
  "k8s-pod": "kubernetes",
  "k8sdataservice": "kubernetes",
  mlflow: "mlflow",
  modin: "modin",
  neptune: "neptune",
  "onnx-pytorch": "onnx",
  "onnx-scikitlearn": "onnx",
  "onnx-tensorflow": "onnx",
  optuna: "optuna",
  polars: "polars",
  ray: "ray",
  snowflake: "snowflake",
  spark: "apachespark",
  sqlalchemy: "sqlalchemy",
  wandb: "weightsandbiases",
  databricks: "databricks",
  // flyte-sdk plugins
  "v2-bigquery": "googlebigquery",
  "v2-dask": "dask",
  "v2-databricks": "databricks",
  "v2-polars": "polars",
  "v2-pytorch": "pytorch",
  "v2-ray": "ray",
  "v2-snowflake": "snowflake",
  "v2-spark": "apachespark",
  "v2-wandb": "weightsandbiases",
  "v2-anthropic": "anthropic",
  "v2-gemini": "googlegemini",
};

// ── Mapping: plugin slug → GitHub org (for avatar fallback) ─────────
const GITHUB_ORG_MAP = {
  "aws-athena": "aws",
  "aws-batch": "aws",
  "aws-sagemaker": "aws",
  "comet-ml": "comet-ml",
  dbt: "dbt-labs",
  openai: "openai",
  "v2-openai": "openai",
  papermill: "nteract",
  pandera: "pandera-dev",
  greatexpectations: "great-expectations",
  whylogs: "whylabs",
  vaex: "vaexio",
  geopandas: "geopandas",
  dolt: "dolthub",
  envd: "tensorchord",
  "dgxc-lepton": "leptonai",
  memray: "bloomberg",
  mmcloud: "memverge",
  "identity-aware-proxy": "google",
  perian: "perianlabs",
  "v2-sglang": "sgl-project",
  "v2-vllm": "vllm-project",
};

// ── Custom colors for fallback initials ─────────────────────────────
const FALLBACK_COLORS = {
  "async-fsspec": "#4A90D9",
  "data-fsspec": "#4A90D9",
  "deck-standard": "#6f2aef",
  flyteinteractive: "#6f2aef",
  inference: "#6f2aef",
  omegaconf: "#FF8C00",
  slurm: "#2E7D32",
  "v2-sglang": "#8B5CF6",
  "v2-vllm": "#4F46E5",
};

// ── Load plugins.json ───────────────────────────────────────────────
const pluginsPath = join(import.meta.dirname, "../src/data/plugins.json");
const plugins = JSON.parse(readFileSync(pluginsPath, "utf-8"));

// ── Load simple-icons dynamically ───────────────────────────────────
async function getSimpleIcon(siSlug) {
  try {
    const mod = await import("simple-icons");
    // simple-icons exports as siXxx where Xxx is PascalCase of slug
    const key =
      "si" +
      siSlug
        .split(/[-_]/)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("");
    const icon = mod[key];
    if (icon) return icon;

    // Try alternative: iterate to find by slug
    for (const [, val] of Object.entries(mod)) {
      if (typeof val === "object" && val.slug === siSlug) return val;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Fetch GitHub org avatar and save as SVG wrapper ─────────────────
async function fetchGitHubAvatar(org) {
  const url = `https://github.com/${org}.png?size=80`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mime = res.headers.get("content-type") || "image/png";
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 40 40">
  <defs>
    <clipPath id="clip">
      <rect width="40" height="40" rx="8"/>
    </clipPath>
  </defs>
  <image href="data:${mime};base64,${base64}" width="40" height="40" clip-path="url(#clip)" preserveAspectRatio="xMidYMid slice"/>
</svg>`;
  } catch {
    return null;
  }
}

// ── Generate fallback initial SVG ───────────────────────────────────
function initialSVG(name, color = "#6f2aef") {
  // Get initials (max 2 chars)
  const words = name.split(/[\s-]+/);
  let initials;
  if (words.length >= 2) {
    initials = words
      .slice(0, 2)
      .map((w) => w.charAt(0).toUpperCase())
      .join("");
  } else {
    initials = name.slice(0, 2).toUpperCase();
  }
  const fontSize = initials.length > 2 ? 12 : 16;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
  <rect width="40" height="40" rx="8" fill="${color}"/>
  <text x="20" y="26" text-anchor="middle" font-family="sans-serif" font-weight="bold" font-size="${fontSize}" fill="white">${initials}</text>
</svg>`;
}

// ── Auto-discovery helpers ───────────────────────────────────────────

/**
 * Try to find a simple-icons match for a plugin automatically.
 * Attempts several slug variations derived from the plugin slug/name.
 */
async function autoDiscoverSimpleIcon(plugin) {
  const baseSlug = plugin.slug.replace(/^v2-/, "");
  const candidates = [
    baseSlug,                                          // e.g. "anthropic"
    baseSlug.replace(/-/g, ""),                        // e.g. "comet-ml" → "cometml"
    plugin.name.toLowerCase().replace(/[\s-]+/g, ""),  // e.g. "Google Gemini" → "googlegemini"
  ];

  // Also try main dependency name (first non-flyte dep)
  if (plugin.dependencies?.length > 0) {
    const mainDep = plugin.dependencies[0].toLowerCase().replace(/[-_]/g, "");
    candidates.push(mainDep);
  }

  for (const candidate of [...new Set(candidates)]) {
    const icon = await getSimpleIcon(candidate);
    if (icon) return icon;
  }
  return null;
}

/**
 * Try to find a GitHub org for avatar, derived from plugin dependencies.
 * e.g. dependency "anthropic" → try github.com/anthropic
 */
function autoDiscoverGitHubOrg(plugin) {
  const baseSlug = plugin.slug.replace(/^v2-/, "");
  const candidates = [baseSlug];

  if (plugin.dependencies?.length > 0) {
    for (const dep of plugin.dependencies.slice(0, 3)) {
      const clean = dep.toLowerCase().replace(/[-_]/g, "");
      if (clean !== baseSlug) candidates.push(dep.toLowerCase());
    }
  }

  return [...new Set(candidates)];
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  let fromSimpleIcons = 0;
  let fromGitHub = 0;
  let fromFallback = 0;

  for (const plugin of plugins) {
    const slug = plugin.slug;
    const outPath = join(ICONS_DIR, `${slug}.svg`);

    // 1. Try simple-icons (manual map first, then auto-discover if no GitHub map override)
    const siSlug = SIMPLE_ICONS_MAP[slug];
    const hasGitHubOverride = slug in GITHUB_ORG_MAP;
    const icon = siSlug
      ? await getSimpleIcon(siSlug)
      : hasGitHubOverride ? null : await autoDiscoverSimpleIcon(plugin);

    if (icon) {
      const bg = `#${icon.hex}`;
      const r = parseInt(icon.hex.slice(0, 2), 16);
      const g = parseInt(icon.hex.slice(2, 4), 16);
      const b = parseInt(icon.hex.slice(4, 6), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const fg = luminance > 0.6 ? "#1a1a2e" : "#ffffff";

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
  <rect width="40" height="40" rx="8" fill="${bg}"/>
  <g transform="translate(8,8)">
    <svg viewBox="0 0 24 24" width="24" height="24" fill="${fg}">
      <path d="${icon.path}"/>
    </svg>
  </g>
</svg>`;
      writeFileSync(outPath, svg);
      fromSimpleIcons++;
      const source = siSlug ? "simple-icons" : "simple-icons:auto";
      console.log(`✓ [${source}] ${slug} → ${icon.title}`);
      continue;
    }

    // 2. Try GitHub org avatar (manual map first, then auto-discover)
    const manualOrg = GITHUB_ORG_MAP[slug];
    const orgCandidates = manualOrg ? [manualOrg] : autoDiscoverGitHubOrg(plugin);

    let resolved = false;
    for (const org of orgCandidates) {
      console.log(`  [github] Trying ${org} avatar for ${slug}...`);
      const svg = await fetchGitHubAvatar(org);
      if (svg) {
        writeFileSync(outPath, svg);
        fromGitHub++;
        const source = manualOrg ? "github" : "github:auto";
        console.log(`✓ [${source}] ${slug} → github.com/${org}`);
        resolved = true;
        break;
      }
    }
    if (resolved) continue;

    // 3. Fallback to initials
    const color = FALLBACK_COLORS[slug] || "#6f2aef";
    writeFileSync(outPath, initialSVG(plugin.name, color));
    fromFallback++;
    console.log(`○ [fallback] ${slug} → "${plugin.name}" initials`);
  }

  console.log(
    `\nDone! ${plugins.length} icons generated:`,
    `${fromSimpleIcons} simple-icons,`,
    `${fromGitHub} GitHub avatars,`,
    `${fromFallback} fallback initials`
  );
}

main().catch(console.error);
