import type { Metadata } from "next";
import { StatsPageClient } from "@/components/stats/StatsPageClient";

export const metadata: Metadata = {
  title: "Stats - Flyte Plugin Registry",
  description: "Download statistics and trends for the Flyte plugin ecosystem.",
};

export default function StatsPage() {
  return <StatsPageClient />;
}
