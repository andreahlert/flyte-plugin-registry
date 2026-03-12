import {
  Database,
  HardDrive,
  Cloud,
  Cpu,
  Rocket,
  LineChart,
  ShieldCheck,
  GitBranch,
  Wrench,
} from "lucide-react";
import { Category } from "@/lib/types";

const iconMap: Record<Category, React.ComponentType<{ className?: string }>> = {
  "data-dataframe": Database,
  "databases-warehouses": HardDrive,
  "cloud-infrastructure": Cloud,
  "ml-training": Cpu,
  "model-serving": Rocket,
  "experiment-tracking": LineChart,
  "data-validation": ShieldCheck,
  "workflow": GitBranch,
  "developer-tools": Wrench,
};

interface CategoryIconProps {
  category: Category;
  className?: string;
}

export function CategoryIcon({ category, className = "w-5 h-5" }: CategoryIconProps) {
  const Icon = iconMap[category];
  return Icon ? <Icon className={className} /> : null;
}
