"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { Plugin } from "@/lib/types";
import { AnimatedTerminal } from "@/components/ui/AnimatedTerminal";

const quickLinks = [
  { label: "Spark", slug: "spark" },
  { label: "BigQuery", slug: "bigquery" },
  { label: "Ray", slug: "ray" },
  { label: "W&B", slug: "wandb" },
  { label: "PyTorch", slug: "kf-pytorch" },
  { label: "Airflow", slug: "airflow" },
];

const terminalLines = [
  { text: "pip install flytekit", type: "command" as const },
  { text: "Successfully installed flytekit-1.15.0", type: "success" as const, delay: 600 },
  { text: "pip install flytekitplugins-spark", type: "command" as const, delay: 400 },
  { text: "Successfully installed flytekitplugins-spark", type: "success" as const, delay: 500 },
  { text: "pyflyte run workflow.py", type: "command" as const, delay: 400 },
  { text: "Running Spark task on Flyte...", type: "info" as const, delay: 300 },
  { text: "Workflow completed successfully!", type: "success" as const, delay: 800 },
];

interface HeroSectionProps {
  plugins: Plugin[];
  onSearchOpen: () => void;
}

export function HeroSection({ plugins, onSearchOpen }: HeroSectionProps) {
  const totalModules = plugins.reduce((sum, p) => sum + p.modules.length, 0);

  return (
    <section className="relative w-full bg-[var(--surface)] border-b border-[var(--border)] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 right-[10%] w-[500px] h-[500px] rounded-full bg-[var(--accent)]/6 blur-[120px]" />
        <div className="absolute -bottom-32 left-[10%] w-[400px] h-[400px] rounded-full bg-[var(--accent)]/4 blur-[100px]" />
      </div>

      <div className="relative px-6 sm:px-10 lg:px-16 py-14 sm:py-20">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          {/* Left: Text */}
          <div className="flex-1 min-w-0 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[var(--heading)] mb-4 leading-tight text-center lg:text-left">
              Discover {plugins.length}+ Plugins
              <br />
              <span className="text-[var(--muted)]">and {totalModules}+ Modules</span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--muted)] mb-6 leading-relaxed max-w-lg text-center lg:text-left">
              Extend your Flyte workflows with community-built integrations for data
              processing, ML training, experiment tracking, and more.
            </p>

            <div className="flex justify-center lg:justify-start">
              <button
                onClick={onSearchOpen}
                className="btn-secondary w-full max-w-md text-[var(--muted)]"
              >
                <Search className="w-4 h-4" />
                <span>Search plugins...</span>
                <kbd className="ml-auto hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--surface)] border border-[var(--border)]">
                  ⌘K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-2 mt-4 flex-wrap justify-center lg:justify-start">
              <span className="text-xs text-[var(--muted)]">Popular:</span>
              {quickLinks.map((link) => (
                <Link
                  key={link.slug}
                  href={`/plugins/${link.slug}`}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Terminal */}
          <div className="flex-1 w-full min-w-0 hidden sm:block">
            <AnimatedTerminal lines={terminalLines} className="w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
