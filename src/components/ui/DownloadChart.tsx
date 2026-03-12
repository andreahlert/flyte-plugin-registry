"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatDownloads, formatNumber } from "@/lib/utils";

interface DataPoint {
  date: string;
  downloads: number;
}

interface Series {
  label: string;
  data: DataPoint[];
  color: string;
  isV2?: boolean;
}

interface DownloadChartProps {
  series: Series[];
  height?: number;
}

interface TooltipInfo {
  x: number;
  y: number;
  containerWidth: number;
  date: string;
  values: { label: string; value: number; color: string; isV2?: boolean }[];
}

const PAD = { top: 16, right: 16, bottom: 32, left: 52 };

function niceMax(raw: number): number {
  if (raw === 0) return 10;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  return Math.ceil(raw / mag) * mag;
}

function formatDate(d: string): string {
  const parts = d.split("-");
  return `${parts[1]}/${parts[2]}`;
}

/** Aggregate daily data points into ISO weeks (Mon-Sun). */
function aggregateWeekly(data: DataPoint[]): DataPoint[] {
  if (data.length === 0) return [];
  const weeks = new Map<string, number>();
  for (const d of data) {
    const date = new Date(d.date + "T00:00:00");
    // Get Monday of the week
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday = 1
    const monday = new Date(date);
    monday.setDate(monday.getDate() + diff);
    const key = monday.toISOString().slice(0, 10);
    weeks.set(key, (weeks.get(key) || 0) + d.downloads);
  }
  return [...weeks.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, downloads]) => ({ date, downloads }));
}

function formatWeekRange(mondayStr: string): string {
  const mon = new Date(mondayStr + "T00:00:00");
  const sun = new Date(mon);
  sun.setDate(sun.getDate() + 6);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m1 = months[mon.getMonth()];
  const m2 = months[sun.getMonth()];
  if (m1 === m2) {
    return `${m1} ${mon.getDate()}-${sun.getDate()}`;
  }
  return `${m1} ${mon.getDate()} - ${m2} ${sun.getDate()}`;
}

export function DownloadChart({ series, height = 180 }: DownloadChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null);
  const dataRef = useRef<{
    allDates: string[];
    lookups: Map<string, number>[];
    maxY: number;
    drawW: number;
    drawH: number;
    width: number;
  } | null>(null);

  // Aggregate to weekly
  const weeklySeries = series.map((s) => ({
    ...s,
    data: aggregateWeekly(s.data),
  }));
  const validSeries = weeklySeries.filter((s) => s.data.length > 0);

  const draw = useCallback((hoverIndex?: number) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || validSeries.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const drawW = width - PAD.left - PAD.right;
    const drawH = height - PAD.top - PAD.bottom;

    // Collect dates
    const dateSet = new Set<string>();
    for (const s of validSeries) {
      for (const d of s.data) dateSet.add(d.date);
    }
    const allDates = [...dateSet].sort();

    // Lookups
    const lookups = validSeries.map((s) => {
      const map = new Map<string, number>();
      for (const d of s.data) map.set(d.date, d.downloads);
      return map;
    });

    // Max Y
    let rawMax = 0;
    for (const lookup of lookups) {
      for (const v of lookup.values()) {
        if (v > rawMax) rawMax = v;
      }
    }
    const maxY = niceMax(rawMax);

    // Store for hover calculations
    dataRef.current = { allDates, lookups, maxY, drawW, drawH, width };

    // Styles
    const styles = getComputedStyle(document.documentElement);
    const mutedColor = styles.getPropertyValue("--muted").trim() || "#888";
    const borderColor = styles.getPropertyValue("--border").trim() || "#333";

    ctx.clearRect(0, 0, width, height);

    // Grid + Y labels
    const tickCount = 4;
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let i = 0; i <= tickCount; i++) {
      const pct = i / tickCount;
      const y = PAD.top + drawH - pct * drawH;
      const val = Math.round(maxY * pct);

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + drawW, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = mutedColor;
      ctx.fillText(formatDownloads(val), PAD.left - 8, y);
    }

    // X labels
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = mutedColor;
    const xIndices = [0, Math.floor(allDates.length * 0.25), Math.floor(allDates.length * 0.5), Math.floor(allDates.length * 0.75), allDates.length - 1];
    for (const idx of [...new Set(xIndices)]) {
      if (idx < 0 || idx >= allDates.length) continue;
      const x = PAD.left + (idx / Math.max(allDates.length - 1, 1)) * drawW;
      ctx.fillText(formatDate(allDates[idx]), x, PAD.top + drawH + 10);
    }

    // Draw series
    for (let si = 0; si < validSeries.length; si++) {
      const lookup = lookups[si];
      const color = validSeries[si].color;

      const points: { x: number; y: number }[] = [];
      for (let i = 0; i < allDates.length; i++) {
        const x = PAD.left + (i / Math.max(allDates.length - 1, 1)) * drawW;
        const val = lookup.get(allDates[i]) ?? 0;
        const y = PAD.top + drawH - (val / maxY) * drawH;
        points.push({ x, y });
      }

      if (points.length === 0) continue;

      // Area
      ctx.beginPath();
      ctx.moveTo(points[0].x, PAD.top + drawH);
      for (const p of points) ctx.lineTo(p.x, p.y);
      ctx.lineTo(points[points.length - 1].x, PAD.top + drawH);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.globalAlpha = validSeries.length > 1 ? 0.06 : 0.12;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    }

    // Hover crosshair + dots
    if (hoverIndex !== undefined && hoverIndex >= 0 && hoverIndex < allDates.length) {
      const hx = PAD.left + (hoverIndex / Math.max(allDates.length - 1, 1)) * drawW;

      // Vertical line
      ctx.strokeStyle = mutedColor;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(hx, PAD.top);
      ctx.lineTo(hx, PAD.top + drawH);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dots on each series
      for (let si = 0; si < validSeries.length; si++) {
        const val = lookups[si].get(allDates[hoverIndex]) ?? 0;
        const hy = PAD.top + drawH - (val / maxY) * drawH;
        const color = validSeries[si].color;

        // Outer glow
        ctx.beginPath();
        ctx.arc(hx, hy, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Inner dot
        ctx.beginPath();
        ctx.arc(hx, hy, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }, [validSeries, height]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const data = dataRef.current;
    const canvas = canvasRef.current;
    if (!data || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;

    const { allDates, lookups, drawW } = data;

    // Find nearest date index
    const relX = mx - PAD.left;
    const ratio = relX / drawW;
    const idx = Math.round(ratio * (allDates.length - 1));
    const clampedIdx = Math.max(0, Math.min(allDates.length - 1, idx));

    const hx = PAD.left + (clampedIdx / Math.max(allDates.length - 1, 1)) * drawW;

    const values = validSeries.map((s, si) => ({
      label: s.label,
      value: lookups[si].get(allDates[clampedIdx]) ?? 0,
      color: s.color,
      isV2: s.isV2,
    }));

    setTooltip({
      x: hx,
      y: e.clientY - rect.top,
      containerWidth: data.width,
      date: allDates[clampedIdx],
      values,
    });

    draw(clampedIdx);
  }, [draw, validSeries]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
    draw();
  }, [draw]);

  if (validSeries.length === 0) return null;

  return (
    <div ref={containerRef} className="w-full relative">
      {validSeries.length > 1 && (
        <div className="flex items-center gap-4 mb-2">
          {validSeries.map((s, i) => (
            <div key={`${s.label}-${i}`} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <span className="w-3 h-0.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
              {s.label}
              {s.isV2 && (
                <span className="text-[8px] font-bold px-1 py-px rounded bg-[#7c3aed] text-white leading-none">v2</span>
              )}
            </div>
          ))}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg cursor-crosshair"
        style={{ height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] shadow-lg text-xs"
          style={{
            left: Math.min(tooltip.x, tooltip.containerWidth - 140),
            top: 8,
            minWidth: 120,
          }}
        >
          <div className="text-[var(--muted)] mb-1.5 font-medium">
            {formatWeekRange(tooltip.date)}
          </div>
          {tooltip.values.map((v) => (
            <div key={v.label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: v.color }} />
                <span className="text-[var(--muted)] flex items-center gap-1">
                  {validSeries.length > 1 ? v.label : "Downloads"}
                  {v.isV2 && (
                    <span className="text-[8px] font-bold px-1 py-px rounded bg-[#7c3aed] text-white leading-none">v2</span>
                  )}
                </span>
              </span>
              <span className="font-medium text-[var(--foreground)] tabular-nums">
                {formatNumber(v.value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
