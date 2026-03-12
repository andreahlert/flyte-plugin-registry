"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

interface TerminalLine {
  text: string;
  type: "command" | "output" | "success" | "info";
  delay?: number;
}

interface AnimatedTerminalProps {
  lines: TerminalLine[];
  className?: string;
}

function TypingText({
  text,
  started,
  duration = 40,
  onComplete,
  className,
}: {
  text: string;
  started: boolean;
  duration?: number;
  onComplete?: () => void;
  className?: string;
}) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, duration);
    return () => clearInterval(interval);
  }, [started, text, duration, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {started && displayed.length < text.length && (
        <span className="animate-pulse">▋</span>
      )}
    </span>
  );
}

export function AnimatedTerminal({ lines, className = "" }: AnimatedTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef as React.RefObject<Element>, {
    amount: 0.3,
    once: true,
  });
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    if (isInView && activeIndex === -1) {
      startTransition(() => setActiveIndex(0));
    }
  }, [isInView, activeIndex]);

  const handleLineComplete = (index: number) => {
    const nextLine = lines[index + 1];
    const delay = nextLine?.delay ?? 300;
    setTimeout(() => setActiveIndex(index + 1), delay);
  };

  const lineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "command":
        return "text-[var(--foreground)]";
      case "output":
        return "text-[var(--muted)]";
      case "success":
        return "text-green-400";
      case "info":
        return "text-blue-400";
    }
  };

  return (
    <div
      ref={containerRef}
      className={`rounded-2xl border-2 border-[var(--border)] bg-[var(--code-bg)] overflow-hidden ${className}`}
      style={{
        boxShadow: `
          0 4px 6px rgba(0, 0, 0, 0.04),
          0 12px 24px rgba(0, 0, 0, 0.08),
          0 24px 48px rgba(0, 0, 0, 0.06),
          0 0 0 1px rgba(0, 0, 0, 0.03),
          inset 0 1px 0 rgba(255, 255, 255, 0.1)
        `,
        transform: "perspective(1200px) rotateY(-2deg) rotateX(1deg)",
      }}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-xs text-[var(--muted)]">terminal</span>
      </div>
      <div className="p-4 font-mono text-sm space-y-1.5 min-h-[180px]" style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}>
        {lines.map((line, i) => {
          if (i > activeIndex) return null;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="flex"
            >
              {line.type === "command" && (
                <span className="text-[var(--accent)] mr-2 select-none">$</span>
              )}
              {line.type === "command" && i === activeIndex ? (
                <TypingText
                  text={line.text}
                  started={true}
                  duration={35}
                  onComplete={() => handleLineComplete(i)}
                  className={lineColor(line.type)}
                />
              ) : (
                <span className={lineColor(line.type)}>
                  {i === activeIndex ? (
                    <TypingText
                      text={line.text}
                      started={true}
                      duration={10}
                      onComplete={() => handleLineComplete(i)}
                      className={lineColor(line.type)}
                    />
                  ) : (
                    line.text
                  )}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
