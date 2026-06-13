import { useState } from "react";
import type { DailySeriesPoint } from "../hooks/useJobCards";

interface Props {
  points: DailySeriesPoint[];
}

const CHART_HEIGHT = 120;
const TOP_PAD = 8;

/** Pure-SVG daily revenue/expenses bar chart. No chart library. */
export default function RevenueChart({ points }: Props) {
  const [selected, setSelected] = useState<number | null>(null);

  if (points.length === 0) return null;

  const max = Math.max(...points.map((p) => Math.max(p.revenue, p.expenses)), 1);
  const n = points.length;
  // Bar geometry in a 0-100 viewBox width
  const slot = 100 / n;
  const barW = Math.min(slot * 0.55, 6);

  const scaleY = (v: number) => (v / max) * (CHART_HEIGHT - TOP_PAD);

  const sel = selected !== null ? points[selected] : null;
  const showEveryNth = n > 14 ? Math.ceil(n / 7) : 1;

  const dayLabel = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 mb-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Daily Revenue</h3>
        <div className="flex items-center gap-3 text-[10px] font-medium text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-[var(--brand)]" /> Revenue
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-amber-400" /> Expenses
          </span>
        </div>
      </div>

      {/* Selected day readout */}
      <div className="h-9 mb-1">
        {sel ? (
          <div className="flex items-baseline gap-3 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">{dayLabel(sel.date)}</span>
            <span className="text-[var(--brand)] font-semibold">
              PKR {sel.revenue.toLocaleString()}
            </span>
            {sel.expenses > 0 && (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                -PKR {sel.expenses.toLocaleString()}
              </span>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 dark:text-slate-500">Tap a bar for details</p>
        )}
      </div>

      <svg
        viewBox={`0 0 100 ${CHART_HEIGHT}`}
        preserveAspectRatio="none"
        className="w-full h-32"
        role="img"
        aria-label="Daily revenue and expenses chart"
      >
        {/* Baseline */}
        <line
          x1="0"
          y1={CHART_HEIGHT - 0.5}
          x2="100"
          y2={CHART_HEIGHT - 0.5}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-600"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => {
          const cx = i * slot + slot / 2;
          const revH = scaleY(p.revenue);
          const expH = scaleY(p.expenses);
          const isSel = selected === i;
          return (
            <g key={p.date} onClick={() => setSelected(isSel ? null : i)} className="cursor-pointer">
              {/* Invisible hit area covering the full slot */}
              <rect x={i * slot} y="0" width={slot} height={CHART_HEIGHT} fill="transparent" />
              {/* Revenue bar */}
              <rect
                x={cx - barW / 2}
                y={CHART_HEIGHT - revH}
                width={barW}
                height={revH}
                rx="1"
                className={isSel ? "fill-[var(--brand-hover)]" : "fill-[var(--brand)]"}
                opacity={selected === null || isSel ? 1 : 0.45}
              />
              {/* Expense bar (thin, beside revenue) */}
              {p.expenses > 0 && (
                <rect
                  x={cx + barW / 2 + 0.5}
                  y={CHART_HEIGHT - expH}
                  width={Math.max(barW * 0.45, 1)}
                  height={expH}
                  rx="0.5"
                  className="fill-amber-400"
                  opacity={selected === null || isSel ? 1 : 0.45}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* X-axis labels */}
      <div className="flex justify-between mt-1">
        {points.map((p, i) => (
          <span
            key={p.date}
            className="text-[8px] text-slate-400 dark:text-slate-500 text-center"
            style={{ width: `${slot}%` }}
          >
            {i % showEveryNth === 0 ? dayLabel(p.date).split(" ")[0] : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
