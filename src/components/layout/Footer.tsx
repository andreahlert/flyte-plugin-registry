import Link from "next/link";
import { FlyteLogo } from "@/components/ui/FlyteLogo";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="px-6 sm:px-10 lg:px-16 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <FlyteLogo className="w-6 h-6 text-[#6f2aef]" />
              <span className="tracking-tight text-[var(--heading)]">
                <span className="font-semibold">Flyte</span>
                <span className="font-light text-sm text-[var(--muted)] ml-1">Plugin Registry</span>
              </span>
            </div>
            <p className="text-sm text-[var(--muted)] max-w-md leading-relaxed">
              Discover, explore, and integrate plugins for your Flyte workflows.
              Built by the Flyte community.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--heading)] mb-4">Resources</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="https://www.union.ai/docs/flyte/" target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="https://github.com/flyteorg/flytekit" target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://flyte.org" target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  Flyte.org
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--heading)] mb-4">Community</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="https://slack.flyte.org" target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  Slack
                </a>
              </li>
              <li>
                <Link href="/" className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors">
                  All Plugins
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-[var(--border)] space-y-2">
          <p className="text-sm text-[var(--muted)]">
            &copy; {new Date().getFullYear()} Flyte Authors. Apache 2.0 License.
          </p>
          <p className="text-xs text-[var(--muted)]/60">
            Community project, not officially affiliated with Flyte or Union.ai.
            Flyte is a trademark of its respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}
