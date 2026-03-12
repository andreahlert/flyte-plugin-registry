"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";

interface AnimatedListProps {
  items: React.ReactNode[];
  className?: string;
  delay?: number;
}

export function AnimatedList({ items, className = "", delay = 2000 }: AnimatedListProps) {
  const [entries, setEntries] = useState<{ id: number; itemIndex: number }[]>([]);
  const counterRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef as React.RefObject<Element>, { once: true, amount: 0.3 });

  useEffect(() => {
    if (!isInView) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < items.length) {
        const id = counterRef.current++;
        setEntries((prev) => [{ id, itemIndex: index }, ...prev].slice(0, items.length));
        index++;
      } else {
        index = 0;
        setEntries([]);
      }
    }, delay);

    return () => clearInterval(interval);
  }, [isInView, items.length, delay]);

  return (
    <div ref={containerRef} className={`flex flex-col gap-2 overflow-hidden ${className}`}>
      <AnimatePresence mode="popLayout">
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            layout
          >
            {items[entry.itemIndex]}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
