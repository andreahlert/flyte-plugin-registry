"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { Plugin } from "@/lib/types";
import { FlyteLogo } from "@/components/ui/FlyteLogo";

const quickLinks = [
  { label: "Spark", slug: "spark" },
  { label: "BigQuery", slug: "bigquery" },
  { label: "Ray", slug: "ray" },
  { label: "W&B", slug: "wandb" },
  { label: "PyTorch", slug: "kf-pytorch" },
  { label: "Airflow", slug: "airflow" },
];

interface HeroSectionProps {
  plugins: Plugin[];
  onSearchOpen: () => void;
}

export function HeroSection({ plugins, onSearchOpen }: HeroSectionProps) {
  const totalModules = plugins.reduce((sum, p) => sum + p.modules.length, 0);

  return (
    <section className="relative w-full bg-[var(--surface)] border-b border-[var(--border)]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 right-[10%] w-[500px] h-[500px] rounded-full bg-[var(--accent)]/8 blur-[120px]" />
        <div className="absolute -bottom-32 left-[10%] w-[400px] h-[400px] rounded-full bg-[var(--accent)]/5 blur-[100px]" />
      </div>

      <div className="relative px-6 sm:px-10 lg:px-16 py-20 sm:py-28">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8">
            <FlyteLogo className="w-16 h-16 text-[var(--accent)]" />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--heading)] mb-5 leading-tight">
            Discover{" "}
            <span className="text-[var(--accent)]">{plugins.length}+ Plugins</span>
            <br />
            and{" "}
            <span className="text-[var(--accent)]">{totalModules}+ Modules</span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Extend your Flyte workflows with community-built integrations for data
            processing, ML training, experiment tracking, and more.
          </p>

          <button
            onClick={onSearchOpen}
            className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full border border-[var(--border)] bg-[var(--card-bg)] text-[var(--muted)] hover:border-[var(--accent)]/50 hover:shadow-xl shadow-lg transition-all w-full max-w-lg mx-auto"
          >
            <Search className="w-5 h-5" />
            <span className="text-base">Search plugins...</span>
            <kbd className="ml-auto hidden sm:inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--surface)] border border-[var(--border)]">
              ⌘K
            </kbd>
          </button>

          <div className="flex items-center justify-center gap-2.5 mt-8 flex-wrap">
            <span className="text-sm text-[var(--muted)]">Popular:</span>
            {quickLinks.map((link) => (
              <Link
                key={link.slug}
                href={`/plugins/${link.slug}`}
                className="px-3.5 py-1.5 rounded-full text-sm font-medium bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
