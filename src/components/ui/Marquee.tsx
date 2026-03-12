"use client";

import { type ComponentPropsWithoutRef } from "react";

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
  children: React.ReactNode;
  repeat?: number;
}

export function Marquee({
  className = "",
  reverse = false,
  pauseOnHover = false,
  children,
  repeat = 4,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={`marquee-container flex gap-[var(--gap)] overflow-hidden [--duration:40s] [--gap:1rem] ${pauseOnHover ? "[&:hover>div]:animate-paused" : ""} ${className}`}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className="flex shrink-0 justify-around gap-[var(--gap)] animate-marquee"
            style={{
              animationDirection: reverse ? "reverse" : "normal",
            }}
          >
            {children}
          </div>
        ))}
    </div>
  );
}
