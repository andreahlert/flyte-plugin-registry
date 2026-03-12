import type { Metadata } from "next";
import { ExplorePageClient } from "@/components/explore/ExplorePageClient";

export const metadata: Metadata = {
  title: "Explore Plugins - Flyte Plugin Registry",
  description: "Browse, filter, and search all Flyte plugins by category, module type, and SDK version.",
};

export default function ExplorePage() {
  return <ExplorePageClient />;
}
