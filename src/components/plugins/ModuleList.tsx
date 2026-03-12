import { PluginModule } from "@/lib/types";
import { CopyButton } from "@/components/ui/CopyButton";

const typeColors: Record<string, string> = {
  task: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  type: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  agent: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  sensor: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  workflow: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-400",
};

const SUBTYPE_HINTS: Record<string, string> = {
  transformer: "Converts Python types to/from Flyte-native types",
  connector: "Backend connector that runs external services",
  config: "Configuration or data structure for plugin setup",
  handler: "Handles data encoding/decoding and I/O operations",
  renderer: "Renders output for Flyte Deck visualizations",
  enum: "Enumeration of predefined options",
  task: "A Flyte task that can be used in workflows",
  agent: "A backend agent/connector that runs external services",
  sensor: "A sensor that waits for external conditions",
  workflow: "A workflow-level component or decorator",
};

function getTypeLabel(mod: PluginModule): string {
  // Prefer subtype from source code analysis (baseClass extraction)
  if (mod.subtype) return mod.subtype;
  // Fallback: infer from name
  const lower = mod.name.toLowerCase();
  if (lower.includes("transformer")) return "transformer";
  if (lower.includes("config")) return "config";
  if (lower.includes("connector")) return "connector";
  if (lower.includes("handler")) return "handler";
  if (lower.includes("renderer")) return "renderer";
  return mod.type;
}

function getTypeHint(mod: PluginModule): string {
  const label = getTypeLabel(mod);
  return SUBTYPE_HINTS[label] || "";
}

export function ModuleList({ modules }: { modules: PluginModule[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-[var(--heading)] mb-3">
        Available Imports ({modules.length})
      </h3>
      <div className="space-y-2">
        {modules.map((mod) => (
          <div
            key={mod.importPath + mod.name}
            className="rounded-xl border-2 border-[var(--border)] bg-[var(--card-bg)] px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0 ${
                      typeColors[mod.type] || typeColors.other
                    }`}
                    title={getTypeHint(mod)}
                  >
                    {getTypeLabel(mod)}
                  </span>
                  <span className="text-sm font-semibold text-[var(--heading)] truncate">{mod.name}</span>
                </div>
                {mod.description && (
                  <p className="text-xs text-[var(--muted)] mb-2 leading-relaxed">
                    {mod.description}
                  </p>
                )}
                {mod.baseClass && (
                  <p className="text-[10px] text-[var(--muted)]/50 mb-1.5">
                    extends <span style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>{mod.baseClass}</span>
                    {getTypeHint(mod) ? ` \u2014 ${getTypeHint(mod).toLowerCase()}` : ""}
                  </p>
                )}
                <p
                  className="text-xs text-[var(--muted)]/70 truncate"
                  style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
                >
                  from {mod.importPath} import {mod.name}
                </p>
              </div>
              <CopyButton
                text={`from ${mod.importPath} import ${mod.name}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
