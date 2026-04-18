"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";

const CONFIG_JSON = `{
  "mcpServers": {
    "flyte": {
      "command": "uvx",
      "args": ["flyte-mcp"]
    }
  }
}`;

const CLI_INSTALL = `claude mcp add flyte -- uvx flyte-mcp`;
const PIP_INSTALL = `uvx flyte-mcp`;

const TOOLS = [
  { name: "get_flyte_symbol", desc: "Full API detail for any public Flyte V2 symbol" },
  { name: "search_flyte_api", desc: "Keyword search over the V2 Python API" },
  { name: "get_flyte_pattern", desc: "Canonical example code by theme (caching, GPU, GenAI, ...)" },
  { name: "find_flyte_example_for", desc: "Natural-language match to example themes" },
  { name: "suggest_flyte_plugin_for", desc: "Plugin recommendation, prefers V2 entries" },
  { name: "migrate_v1_to_v2", desc: "Rewrite flytekit V1 code to flyte-sdk V2 syntax" },
  { name: "run_flyte_task", desc: "Execute a task on the configured Flyte cluster" },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="absolute top-3 right-3 rounded-md border border-[var(--border)] bg-[var(--card-bg)] p-1.5 text-[var(--muted-foreground)] hover:text-[var(--heading)] transition-colors"
      aria-label="Copy"
    >
      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <pre className="rounded-lg border border-[var(--border)] bg-[var(--card-bg)] p-4 pr-12 text-sm overflow-x-auto text-[var(--heading)]">
        <code>{code}</code>
      </pre>
      <CopyButton text={code} />
    </div>
  );
}

export function MCPSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border-2 border-[var(--border)] bg-gradient-to-br from-[var(--card-bg)] to-transparent p-8 md:p-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--heading)]">
            NEW
          </span>
          <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
            For AI-assisted Flyte development
          </span>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold text-[var(--heading)]">
          flyte-mcp: Flyte V2 for AI agents
        </h2>
        <p className="mt-3 text-lg text-[var(--muted-foreground)] max-w-3xl">
          Give Claude, Cursor, and Claude Code accurate, versioned answers about Flyte V2 without
          scraping READMEs or hallucinating import paths. 17 tools covering the SDK API, canonical
          example patterns, plugin registry, V1 to V2 migration, and optional cluster runtime.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
              Claude Code
            </h3>
            <CodeBlock code={CLI_INSTALL} />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
              Try it: one-shot
            </h3>
            <CodeBlock code={PIP_INSTALL} />
          </div>
          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-3">
              Cursor / Claude Desktop (~/.cursor/mcp.json or ~/.claude.json)
            </h3>
            <CodeBlock code={CONFIG_JSON} />
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-4">
            What the agent can do
          </h3>
          <ul className="grid gap-2 md:grid-cols-2">
            {TOOLS.map((t) => (
              <li
                key={t.name}
                className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--card-bg)]/50 p-3"
              >
                <code className="text-xs font-mono text-[var(--heading)] whitespace-nowrap">
                  {t.name}
                </code>
                <span className="text-xs text-[var(--muted-foreground)]">{t.desc}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="https://github.com/andreahlert/flyte-mcp"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--heading)] px-4 py-2 text-sm font-semibold text-[var(--bg)] hover:opacity-90 transition-opacity"
          >
            View on GitHub
            <ExternalLink className="h-4 w-4" />
          </a>
          <a
            href="https://pypi.org/project/flyte-mcp/"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--heading)] hover:bg-[var(--card-bg)] transition-colors"
          >
            PyPI
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
