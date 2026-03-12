"use client";

import { useCallback } from "react";
import plugins from "@/data/plugins.json";
import { Plugin } from "@/lib/types";
import { HeroSection } from "@/components/home/HeroSection";
import { StatsBar } from "@/components/home/StatsBar";
import { PopularPlugins } from "@/components/home/PopularPlugins";
import { NewPlugins } from "@/components/home/NewPlugins";
import { BrowseByCategory } from "@/components/home/BrowseByCategory";
import { ContributeSection } from "@/components/home/ContributeSection";

const typedPlugins = plugins as Plugin[];

export default function HomePage() {
  const openSearch = useCallback(() => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true })
    );
  }, []);

  return (
    <>
      <HeroSection plugins={typedPlugins} onSearchOpen={openSearch} />
      <StatsBar plugins={typedPlugins} />
      <PopularPlugins plugins={typedPlugins} />
      <NewPlugins plugins={typedPlugins} />
      <BrowseByCategory plugins={typedPlugins} />
      <ContributeSection />
    </>
  );
}
