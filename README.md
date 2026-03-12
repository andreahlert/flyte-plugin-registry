<p align="center">
  <img src="public/icons/plugins/airflow.svg" width="48" />
  <img src="public/icons/plugins/snowflake.svg" width="48" />
  <img src="public/icons/plugins/v2-anthropic.svg" width="48" />
  <img src="public/icons/plugins/spark.svg" width="48" />
  <img src="public/icons/plugins/ray.svg" width="48" />
  <img src="public/icons/plugins/duckdb.svg" width="48" />
  <img src="public/icons/plugins/v2-gemini.svg" width="48" />
  <img src="public/icons/plugins/mlflow.svg" width="48" />
  <img src="public/icons/plugins/wandb.svg" width="48" />
  <img src="public/icons/plugins/dask.svg" width="48" />
</p>

<h1 align="center">Flyte Plugin Registry</h1>

<p align="center">
  A browsable, searchable catalog of every plugin in the Flyte ecosystem.<br/>
  67 plugins, 213 exported modules, auto-generated icons, live PyPI stats, and contributor data.
</p>

<p align="center">
  <a href="https://github.com/flyteorg/flyte"><img src="https://img.shields.io/github/stars/flyteorg/flyte?style=flat&logo=github&label=Flyte" alt="GitHub Stars" /></a>
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss" alt="Tailwind 4" />
  <img src="https://img.shields.io/badge/Static_Export-SSG-green" alt="Static Export" />
</p>

---

## Screenshots

### Homepage (Dark Mode)
![Homepage](docs/screenshots/homepage-hero.png)

### Plugin Detail
![Plugin Detail - Anthropic Claude](docs/screenshots/plugin-detail.png)

### Explore Plugins
![Explore](docs/screenshots/explore.png)

### Compare Side-by-Side
![Compare - Spark vs Ray](docs/screenshots/compare.png)

### Statistics Dashboard
![Stats](docs/screenshots/stats.png)

### Plugin Detail (Light Mode)
![Plugin Detail Light - Spark](docs/screenshots/plugin-detail-light.png)

### Mobile
<p align="center">
  <img src="docs/screenshots/homepage-mobile.png" width="320" alt="Mobile Homepage" />
</p>

---

## What is this?

The Flyte Plugin Registry gives visibility to the full plugin ecosystem across both the legacy **flytekit** SDK and the new **flyte-sdk**. Each plugin page shows:

- Exported modules with type classification (task, type transformer, agent, sensor)
- Base class hierarchy extracted from source (e.g. `TypeTransformer`, `PythonTask`, `BaseSensor`)
- Quick Start code snippet generated from real import paths
- Live weekly download count from PyPI
- Version compatibility (minimum SDK version required)
- Top contributors with GitHub avatars (original author always included)
- Direct links to source, PyPI, and documentation

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with category grid, popular plugins, and icon cloud |
| `/plugins/[slug]` | Detail page per plugin with modules, quick start, stats, contributors |
| `/explore` | Visual exploration with module type distribution chart |
| `/compare` | Side-by-side comparison of up to 4 plugins |
| `/stats` | Ecosystem-wide download rankings and trends |
| `/category/[slug]` | Filtered plugin list per category (9 categories) |

## Architecture

```
registry/
├── scripts/
│   ├── generate-plugin-data.mjs   # Scrapes GitHub for plugins, modules, base classes, contributors
│   ├── fetch-pypi-stats.mjs       # Fetches weekly download stats from PyPI
│   └── generate-icons.mjs         # Generates SVG icons (simple-icons → GitHub avatar → initials)
├── src/
│   ├── app/                       # Next.js App Router pages
│   ├── components/
│   │   ├── home/                  # Landing page sections (Hero, Categories, Popular, Contribute)
│   │   ├── plugins/               # PluginCard, PluginDetailClient, ModuleList
│   │   ├── compare/               # Side-by-side plugin comparison
│   │   ├── explore/               # Visual ecosystem explorer
│   │   ├── stats/                 # Download stats dashboard
│   │   ├── layout/                # Header, Footer, SearchModal
│   │   └── ui/                    # ThemeToggle, IconCloud, Marquee, AnimatedTerminal
│   ├── data/
│   │   ├── plugins.json           # Generated plugin catalog (67 entries)
│   │   └── pypi-stats.json        # Generated download stats
│   ├── hooks/                     # usePyPIMetadata, useGitHubReadme
│   └── lib/
│       ├── constants.ts           # Shared config, colors, site metadata
│       ├── types.ts               # TypeScript interfaces (Plugin, PluginModule, etc.)
│       └── utils.ts               # Shared formatting (formatDownloads, formatNumber)
└── public/
    └── icons/plugins/             # 67 auto-generated SVG icons
```

## Data Pipeline

The build runs three scripts before `next build`:

1. **`generate-plugin-data.mjs`** scans two GitHub repositories (`flyteorg/flytekit` and `flyteorg/flyte-sdk`) for `setup.py` / `pyproject.toml` files, extracts module exports from `__init__.py`, fetches docstrings and base classes from Python source, and resolves top contributors via `git log`.

2. **`fetch-pypi-stats.mjs`** queries the PyPI Stats API for weekly download counts of every plugin package.

3. **`generate-icons.mjs`** generates an SVG icon per plugin using a three-tier fallback: official brand icon from `simple-icons` (39 plugins), GitHub org avatar (24 plugins), or auto-generated initials (4 plugins). Auto-discovery tries multiple slug variations so new plugins get icons without manual mapping.

## Getting Started

```bash
# Install dependencies
npm install

# Run the full build (data generation + static export)
npm run build

# Or run individual steps
npm run generate        # Regenerate plugin data from GitHub
npm run fetch-stats     # Refresh PyPI download stats
npm run generate-icons  # Regenerate plugin icons

# Development server
npm run dev
```

The dev server starts at [http://localhost:3000](http://localhost:3000). Data scripts require network access to GitHub and PyPI APIs.

## Tech Stack

- **Next.js 16** with App Router and Turbopack
- **React 19** with View Transitions API for theme switching
- **Tailwind CSS 4** with CSS custom properties for theming
- **Motion** (framer-motion) for page animations
- **Fuse.js** for client-side fuzzy search
- **simple-icons** for brand SVG icons
- Fully static export (no server required for hosting)

## Contributing

This project is part of the [Flyte](https://github.com/flyteorg/flyte) ecosystem. To add a new plugin to the registry, publish it as a flytekit or flyte-sdk plugin following the [contributing guide](https://www.union.ai/docs/v1/flyte/community/contributing-code/). The registry automatically discovers new plugins on the next build.

To improve the registry itself, open a PR with your changes. Run `npm run lint` and `npm run build` before submitting.

## License

Same license as [Flyte](https://github.com/flyteorg/flyte/blob/master/LICENSE).
