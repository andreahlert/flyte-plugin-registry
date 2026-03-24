"use client";

import { WishlistItem } from "@/lib/types";
import wishlistData from "@/data/wishlist.json";

const typedItems = wishlistData.items as WishlistItem[];

export function useWishlist() {
  return {
    items: typedItems,
    fetchedAt: wishlistData.fetchedAt,
  };
}
