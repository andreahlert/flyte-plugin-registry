"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SearchModal } from "@/components/layout/SearchModal";
import plugins from "@/data/plugins.json";
import { Plugin } from "@/lib/types";

const typedPlugins = plugins as Plugin[];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Header onSearchOpen={openSearch} />
      <main>
        {children}
      </main>
      <Footer />
      <SearchModal
        open={searchOpen}
        onClose={closeSearch}
        plugins={typedPlugins}
      />
    </>
  );
}
