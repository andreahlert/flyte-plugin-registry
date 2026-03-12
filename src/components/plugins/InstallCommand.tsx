import { CopyButton } from "@/components/ui/CopyButton";
import { Terminal } from "lucide-react";

export function InstallCommand({ command }: { command: string }) {
  return (
    <div className="rounded-xl border-2 border-[var(--border)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--surface)]">
        <Terminal className="w-4 h-4 text-[var(--muted)]" />
        <span className="text-xs text-[var(--muted)] font-medium">Install</span>
      </div>
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--background)]">
        <code className="text-sm" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
          {command}
        </code>
        <CopyButton text={command} />
      </div>
    </div>
  );
}
