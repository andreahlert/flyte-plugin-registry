import { ExternalLink, GitPullRequest, BookOpen } from "lucide-react";

export function ContributeSection() {
  return (
    <section className="px-6 sm:px-10 lg:px-16 py-20">
      <div className="rounded-3xl border border-[var(--border)] bg-[var(--accent-light)] p-10 sm:p-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--heading)] mb-4">
            Build Your Own Plugin
          </h2>
          <p className="text-[var(--muted)] text-lg mb-10 leading-relaxed">
            Flyte&apos;s plugin system is open and extensible. Create an integration
            for your favorite tool and share it with the community.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://docs.flyte.org/en/latest/community/contribute/contribute_code.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Read the Guide
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://github.com/flyteorg/flyte"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border-2 border-[var(--border)] font-medium hover:border-[var(--accent)]/50 transition-colors"
            >
              <GitPullRequest className="w-4 h-4" />
              Flyte on GitHub
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
