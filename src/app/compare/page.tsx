import type { Metadata } from "next";
import { ComparePageClient } from "@/components/compare/ComparePageClient";

export const metadata: Metadata = {
  title: "Compare Plugins - Flyte Plugin Registry",
  description: "Compare two Flyte plugins side by side to see differences in modules, downloads, and dependencies.",
};

export default function ComparePage() {
  return <ComparePageClient />;
}
