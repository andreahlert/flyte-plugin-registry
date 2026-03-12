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

export function ModuleList({ modules }: { modules: PluginModule[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[var(--heading)] mb-3">
        Modules ({modules.length})
      </h3>
      <div className="space-y-2">
        {modules.map((mod) => (
          <div
            key={mod.importPath + mod.name}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                  typeColors[mod.type] || typeColors.other
                }`}
              >
                {mod.type}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{mod.name}</p>
                <p
                  className="text-xs text-[var(--muted)] truncate"
                  style={{ fontFamily: "var(--font-jetbrains-mono), monospace" }}
                >
                  from {mod.importPath} import {mod.name}
                </p>
              </div>
            </div>
            <CopyButton
              text={`from ${mod.importPath} import ${mod.name}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
