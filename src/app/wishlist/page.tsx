import type { Metadata } from "next";
import { WishlistPageClient } from "@/components/wishlist/WishlistPageClient";

export const metadata: Metadata = {
  title: "Wishlist - Flyte Plugin Registry",
  description: "Discover gaps in the Flyte plugin ecosystem: popular Python packages without a Flyte plugin or needing a V2 port.",
};

export default function WishlistPage() {
  return <WishlistPageClient />;
}
