"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => startTransition(() => setMounted(true)), []);

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;

    const newTheme = resolvedTheme === "dark" ? "light" : "dark";

    const { top, left, width, height } = button.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    );

    if (typeof document.startViewTransition !== "function") {
      setTheme(newTheme);
      return;
    }

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setTheme(newTheme);
      });
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  }, [resolvedTheme, setTheme]);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      ref={buttonRef}
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}
