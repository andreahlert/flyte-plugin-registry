import { Category, SDK } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";

const categoryColors: Record<Category, string> = {
  "data-dataframe": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "databases-warehouses": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  "cloud-infrastructure": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  "ml-training": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "model-serving": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  "experiment-tracking": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  "data-validation": "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  "workflow": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  "developer-tools": "bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300",
};

export function Badge({ category }: { category: Category }) {
  const info = CATEGORIES.find((c) => c.slug === category);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[category]}`}
    >
      {info?.name ?? category}
    </span>
  );
}

export function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]">
      {tag}
    </span>
  );
}

export function SDKBadge({ sdk }: { sdk?: SDK }) {
  const isV2 = sdk === "flyte-sdk";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
        isV2
          ? "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20"
          : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)]"
      }`}
    >
      {isV2 ? "Flyte SDK (v2)" : "Flytekit"}
    </span>
  );
}
