import { ExternalLink } from "lucide-react";

export function AnnouncementBanner() {
  return (
    <div className="w-full bg-[var(--banner-bg)] text-white text-center py-2.5 px-4 text-sm">
      <a
        href="https://www.union.ai/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
      >
        <span className="font-medium">Preview Flyte 2 for production</span>
        <span className="opacity-70">Hosted on Union.ai</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
      </a>
    </div>
  );
}
