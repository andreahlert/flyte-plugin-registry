"use client";

import { useState, useEffect, startTransition } from "react";
import Link from "next/link";
import { Search, Menu, X, ExternalLink } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { FlyteLogo } from "@/components/ui/FlyteLogo";

interface HeaderProps {
  onSearchOpen: () => void;
}

const GH_STARS_KEY = "flyte-gh-stars";
const GH_STARS_TTL = 60 * 60 * 1000; // 1 hour

function formatStars(count: number): string {
  return count >= 1000
    ? `${(count / 1000).toFixed(1)}K`
    : count.toLocaleString();
}

function readStarsCache(): { stars: string | null; fresh: boolean } {
  try {
    const cached = localStorage.getItem(GH_STARS_KEY);
    if (cached) {
      const { value, ts } = JSON.parse(cached);
      return { stars: formatStars(value), fresh: Date.now() - ts < GH_STARS_TTL };
    }
  } catch {}
  return { stars: null, fresh: false };
}

function GitHubStars() {
  const [stars, setStars] = useState<string | null>(null);

  useEffect(() => {
    const { stars: cached, fresh } = readStarsCache();
    if (cached) startTransition(() => setStars(cached));
    if (fresh) return;

    fetch("https://api.github.com/repos/flyteorg/flyte")
      .then((r) => r.json())
      .then((data) => {
        if (data.stargazers_count) {
          setStars(formatStars(data.stargazers_count));
          try {
            localStorage.setItem(GH_STARS_KEY, JSON.stringify({ value: data.stargazers_count, ts: Date.now() }));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  return (
    <a
      href="https://github.com/flyteorg/flyte"
      target="_blank"
      rel="noopener noreferrer"
      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-[var(--border)] text-sm text-[var(--muted)] hover:border-[var(--accent-interactive)] hover:text-[var(--foreground)] transition-all"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
      {stars && <span className="font-medium">{stars}</span>}
    </a>
  );
}

export function Header({ onSearchOpen }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] backdrop-blur-md" style={{ background: "var(--header-bg)" }}>
      <div className="w-full px-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <FlyteLogo className="w-7 h-7 text-[#6f2aef]" />
            <span className="tracking-tight text-[var(--heading)]">
              <span className="font-semibold text-base">Flyte</span>
              <span className="font-light text-sm text-[var(--muted)] ml-1">Plugin Registry</span>
            </span>
          </Link>

          {/* Nav links - desktop */}
          <nav className="hidden md:flex items-center gap-6 ml-8">
            <Link
              href="/"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Plugins
            </Link>
            <Link
              href="/explore"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/stats"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Stats
            </Link>
            <Link
              href="/compare"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Compare
            </Link>
            <Link
              href="/wishlist"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Wishlist
            </Link>
            <a
              href="https://www.union.ai/docs/flyte/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Docs
              <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={onSearchOpen}
              className="flex items-center gap-2 p-2 sm:px-3.5 sm:py-1.5 rounded-full border-2 border-[var(--border)] text-sm text-[var(--muted)] hover:border-[var(--accent-interactive)] hover:text-[var(--foreground)] transition-all"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--surface)] border border-[var(--border)] ml-1">
                ⌘K
              </kbd>
            </button>

            <GitHubStars />

            <a
              href="https://slack.flyte.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex btn-primary !py-1.5 !px-4 !text-sm"
            >
              Join
            </a>

            <ThemeToggle />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border)] py-2 space-y-0.5">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] px-3 py-2.5 rounded-lg transition-colors"
            >
              Plugins
            </Link>
            <Link
              href="/explore"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] px-3 py-2.5 rounded-lg transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/stats"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] px-3 py-2.5 rounded-lg transition-colors"
            >
              Stats
            </Link>
            <Link
              href="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] px-3 py-2.5 rounded-lg transition-colors"
            >
              Compare
            </Link>
            <Link
              href="/wishlist"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] px-3 py-2.5 rounded-lg transition-colors"
            >
              Wishlist
            </Link>
            <a
              href="https://www.union.ai/docs/flyte/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] px-3 py-2.5 rounded-lg transition-colors"
            >
              Docs
            </a>
            <a
              href="https://github.com/flyteorg/flyte"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] px-3 py-2.5 rounded-lg transition-colors"
            >
              GitHub
            </a>
            <div className="pt-2 px-3">
              <a
                href="https://slack.flyte.org"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-sm font-medium text-white bg-[var(--accent)] hover:bg-[var(--accent)]/90 px-4 py-2.5 rounded-lg transition-colors"
              >
                Join Slack
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
