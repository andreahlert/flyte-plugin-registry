"use client";

import { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";

interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  className?: string;
}

interface BentoCardProps extends ComponentPropsWithoutRef<"a"> {
  name: string;
  className?: string;
  background?: ReactNode;
  Icon?: React.ElementType;
  description: string;
  href: string;
  cta?: string;
}

export function BentoGrid({ children, className = "", ...props }: BentoGridProps) {
  return (
    <div
      className={`grid w-full auto-rows-[18rem] grid-cols-3 gap-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  name,
  className = "",
  background,
  Icon,
  description,
  href,
  cta = "View plugin",
  ...props
}: BentoCardProps) {
  return (
    <a
      href={href}
      className={`group relative col-span-3 sm:col-span-1 flex flex-col justify-between overflow-hidden rounded-2xl bg-[var(--card-bg)] border-2 border-[var(--border)] hover:border-[#6f2aef]/40 transition-all duration-300 ${className}`}
      style={{
        boxShadow: `0 0 0 1px rgba(0,0,0,.03), 0 2px 4px rgba(0,0,0,.05), 0 12px 24px rgba(0,0,0,.05)`,
      }}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden">{background}</div>
      <div className="relative z-10 mt-auto p-5">
        <div className="flex transform-gpu flex-col gap-1 transition-all duration-300 lg:group-hover:-translate-y-8">
          {Icon && (
            <Icon className="h-10 w-10 origin-left transform-gpu text-[var(--heading)] transition-all duration-300 ease-in-out group-hover:scale-75" />
          )}
          <h3 className="text-base font-semibold text-[var(--heading)]">
            {name}
          </h3>
          <p className="text-sm text-[var(--muted)] line-clamp-2">{description}</p>
        </div>

        <div className="absolute bottom-5 left-5 hidden translate-y-8 transform-gpu opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 lg:block">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-[#6f2aef]">
            {cta}
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div className="mt-2 lg:hidden">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-[#6f2aef]">
            {cta}
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[0.03] dark:group-hover:bg-white/[0.03]" />
    </a>
  );
}
