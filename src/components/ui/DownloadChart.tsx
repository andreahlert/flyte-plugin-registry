"use client";

import { useMemo } from "react";
import { formatDownloads } from "@/lib/utils";

interface DataPoint {
  date: string;
  downloads: number;
}

interface Series {
  label: string;
  data: DataPoint[];
  color: string;
}

interface DownloadChartProps {
  series: Series[];
  height?: number;
}

const PADDING = { top: 20, right: 12, bottom: 28, left: 48 };

export function DownloadChart({ series, height = 200 }: DownloadChartProps) {
  const { paths, yTicks, xLabels } = useMemo(() => {
    if (series.length === 0 || series.every((s) => s.data.length === 0)) {
      return { paths: [], yTicks: [], xLabels: [] };
    }

    // Collect all dates across all series
    const dateSet = new Set<string>();
    for (const s of series) {
      for (const d of s.data) dateSet.add(d.date);
    }
    const allDates = [...dateSet].sort();

    // Build lookup maps
    const lookups = series.map((s) => {
      const map = new Map<string, number>();
      for (const d of s.data) map.set(d.date, d.downloads);
      return map;
    });

    // Find max value
    let maxY = 0;
    for (const lookup of lookups) {
      for (const v of lookup.values()) {
        if (v > maxY) maxY = v;
      }
    }

    // Round max up to nice number
    if (maxY === 0) maxY = 10;
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxY)));
    maxY = Math.ceil(maxY / magnitude) * magnitude;

    const chartW = 100; // percentage-based viewBox
    const chartH = height;
    const drawW = chartW - PADDING.left - PADDING.right;
    const drawH = chartH - PADDING.top - PADDING.bottom;

    // Map data points to SVG coordinates
    const paths = series.map((s, si) => {
      const lookup = lookups[si];
      const points: string[] = [];

      for (let i = 0; i < allDates.length; i++) {
        const x = PADDING.left + (i / Math.max(allDates.length - 1, 1)) * drawW;
        const val = lookup.get(allDates[i]) ?? 0;
        const y = PADDING.top + drawH - (val / maxY) * drawH;
        points.push(`${x},${y}`);
      }

      // Create area path (fill under curve)
      const linePoints = points.join(" L");
      const firstX = PADDING.left;
      const lastX = PADDING.left + ((allDates.length - 1) / Math.max(allDates.length - 1, 1)) * drawW;
      const bottomY = PADDING.top + drawH;

      return {
        line: `M${linePoints}`,
        area: `M${firstX},${bottomY} L${linePoints} L${lastX},${bottomY} Z`,
        color: s.color,
        label: s.label,
      };
    });

    // Y-axis ticks (4 ticks)
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
      value: Math.round(maxY * pct),
      y: PADDING.top + drawH - pct * drawH,
    }));

    // X-axis labels (first, middle, last)
    const xLabels: { label: string; x: number }[] = [];
    const indices = [0, Math.floor(allDates.length / 2), allDates.length - 1];
    for (const idx of indices) {
      if (idx >= 0 && idx < allDates.length) {
        const d = allDates[idx];
        const label = d.slice(5); // MM-DD
        const x = PADDING.left + (idx / Math.max(allDates.length - 1, 1)) * drawW;
        xLabels.push({ label, x });
      }
    }

    return { paths, yTicks, xLabels };
  }, [series, height]);

  if (paths.length === 0) {
    return null;
  }

  const chartW = 100;
  const chartH = height;

  return (
    <div className="w-full">
      {series.length > 1 && (
        <div className="flex items-center gap-4 mb-2">
          {series.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <span className="w-3 h-[2px] rounded" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}
      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        {/* Grid lines */}
        {yTicks.map((tick) => (
          <line
            key={tick.value}
            x1={PADDING.left}
            y1={tick.y}
            x2={chartW - PADDING.right}
            y2={tick.y}
            stroke="var(--border)"
            strokeWidth="0.15"
          />
        ))}

        {/* Area fills */}
        {paths.map((p, i) => (
          <path
            key={`area-${i}`}
            d={p.area}
            fill={p.color}
            fillOpacity={series.length > 1 ? 0.08 : 0.12}
          />
        ))}

        {/* Line paths */}
        {paths.map((p, i) => (
          <path
            key={`line-${i}`}
            d={p.line}
            fill="none"
            stroke={p.color}
            strokeWidth="0.4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick) => (
          <text
            key={`y-${tick.value}`}
            x={PADDING.left - 2}
            y={tick.y + 1}
            textAnchor="end"
            className="fill-[var(--muted)]"
            style={{ fontSize: "3.5px", fontFamily: "var(--font-ibm-plex-mono), monospace" }}
          >
            {formatDownloads(tick.value)}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((l, i) => (
          <text
            key={`x-${i}`}
            x={l.x}
            y={chartH - 4}
            textAnchor="middle"
            className="fill-[var(--muted)]"
            style={{ fontSize: "3px", fontFamily: "var(--font-ibm-plex-mono), monospace" }}
          >
            {l.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
