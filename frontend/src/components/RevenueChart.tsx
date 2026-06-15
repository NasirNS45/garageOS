import { useState } from "react";
import type { DailySeriesPoint } from "../hooks/useJobCards";
import { useT } from "../i18n/useT";
import { useLanguageStore } from "../stores/languageStore";
import { formatLocaleDate } from "../utils/dates";
import { Card } from "./ui";

interface Props {
  points: DailySeriesPoint[];
}

const CHART_HEIGHT = 120;
const TOP_PAD = 8;
const GRIDLINES = [0.25, 0.5, 0.75, 1];

/** Pure-SVG daily revenue/expenses bar chart. No chart library. */
export default function RevenueChart({ points }: Props) {
  const t = useT();
  const language = useLanguageStore((s) => s.language);
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  if (points.length === 0) return null;

  const max = Math.max(...points.map((p) => Math.max(p.revenue, p.expenses)), 1);
  const n = points.length;
  const slot = 100 / n;
  const barW = Math.min(slot * 0.55, 6);

  const scaleY = (v: number) => (v / max) * (CHART_HEIGHT - TOP_PAD);

  const activeIdx = hovered ?? selected;
  const sel = activeIdx !== null ? points[activeIdx] : null;
  const showEveryNth = n > 14 ? Math.ceil(n / 7) : 1;

  const dayLabel = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return formatLocaleDate(new Date(y, m - 1, d), language, {
      day: "numeric",
      month: "short",
    });
  };

  const compact = (v: number) =>
    v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v);

  return (
    <Card className="mb-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-[var(--text-strong)]">{t("summary.dailyRevenue")}</h3>
        <div className="flex items-center gap-3 text-[11px] font-medium text-[var(--text-faint)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-[var(--brand)]" /> {t("summary.revenue")}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-[var(--warning)]" /> {t("summary.expenses")}
          </span>
        </div>
      </div>

      {/* Selected/hovered day readout */}
      <div className="h-9 mb-1">
        {sel ? (
          <div className="flex items-baseline gap-3 text-xs">
            <span className="font-bold text-[var(--text-strong)]">{dayLabel(sel.date)}</span>
            <span className="text-[var(--brand)] font-semibold tnum" data-keep-ltr>
              PKR {sel.revenue.toLocaleString()}
            </span>
            {sel.expenses > 0 && (
              <span className="text-[var(--warning-fg)] font-semibold tnum" data-keep-ltr>
                -PKR {sel.expenses.toLocaleString()}
              </span>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-[var(--text-faint)]">{t("summary.tapBar")}</p>
        )}
      </div>

      <div className="relative">
        {/* Max-value caption (value axis hint) */}
        <span className="absolute top-0 start-0 text-[10px] font-medium text-[var(--text-faint)] tnum" data-keep-ltr>
          {compact(max)}
        </span>

        <svg
          viewBox={`0 0 100 ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          className="w-full h-32"
          role="img"
          aria-label="Daily revenue and expenses chart"
          onMouseLeave={() => setHovered(null)}
        >
          <defs>
            <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="[stop-color:var(--brand)]" stopOpacity="0.95" />
              <stop offset="100%" className="[stop-color:var(--brand)]" stopOpacity="0.32" />
            </linearGradient>
          </defs>

          {/* Gridlines */}
          {GRIDLINES.map((frac) => (
            <line
              key={frac}
              x1="0"
              y1={CHART_HEIGHT - frac * (CHART_HEIGHT - TOP_PAD)}
              x2="100"
              y2={CHART_HEIGHT - frac * (CHART_HEIGHT - TOP_PAD)}
              stroke="currentColor"
              className="text-[var(--border)]"
              strokeWidth="1"
              strokeDasharray="2 2"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* Baseline */}
          <line
            x1="0"
            y1={CHART_HEIGHT - 0.5}
            x2="100"
            y2={CHART_HEIGHT - 0.5}
            stroke="currentColor"
            className="text-[var(--border-strong)]"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />

          {points.map((p, i) => {
            const cx = i * slot + slot / 2;
            const revH = scaleY(p.revenue);
            const expH = scaleY(p.expenses);
            const isActive = activeIdx === i;
            const dim = activeIdx !== null && !isActive ? 0.4 : 1;
            return (
              <g
                key={p.date}
                onClick={() => setSelected(selected === i ? null : i)}
                onMouseEnter={() => setHovered(i)}
                className="cursor-pointer"
              >
                {/* Invisible hit area covering the full slot */}
                <rect x={i * slot} y="0" width={slot} height={CHART_HEIGHT} fill="transparent" />
                {/* Revenue bar */}
                <rect
                  x={cx - barW / 2}
                  y={CHART_HEIGHT - revH}
                  width={barW}
                  height={revH}
                  rx="1"
                  fill="url(#rev-grad)"
                  opacity={dim}
                />
                {/* Expense bar (thin, beside revenue) */}
                {p.expenses > 0 && (
                  <rect
                    x={cx + barW / 2 + 0.5}
                    y={CHART_HEIGHT - expH}
                    width={Math.max(barW * 0.45, 1)}
                    height={expH}
                    rx="0.5"
                    className="fill-[var(--warning)]"
                    opacity={dim}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-1">
        {points.map((p, i) => (
          <span
            key={p.date}
            className="text-[10px] text-[var(--text-faint)] text-center"
            style={{ width: `${slot}%` }}
          >
            {i % showEveryNth === 0 ? dayLabel(p.date).split(" ")[0] : ""}
          </span>
        ))}
      </div>
    </Card>
  );
}
