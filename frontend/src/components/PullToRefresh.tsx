import { useRef, useState } from "react";
import { Loader2, ArrowDown } from "lucide-react";

const THRESHOLD = 70; // px pulled before a refresh fires
const MAX_PULL = 100;
const RESISTANCE = 0.5;

/**
 * Touch pull-to-refresh. Engages only when the page is scrolled to the top.
 * Inert on desktop (no touch events). Relies on body `overscroll-behavior-y:
 * contain` to suppress the browser's native pull-to-refresh.
 */
export default function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<unknown>;
  children: React.ReactNode;
}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    startY.current =
      window.scrollY <= 0 && !refreshing ? e.touches[0].clientY : null;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    setPull(dy > 0 ? Math.min(MAX_PULL, dy * RESISTANCE) : 0);
  };

  const onTouchEnd = async () => {
    if (startY.current === null) return;
    const trigger = pull >= THRESHOLD;
    startY.current = null;
    if (!trigger) {
      setPull(0);
      return;
    }
    setRefreshing(true);
    setPull(THRESHOLD);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setPull(0);
    }
  };

  const ready = pull >= THRESHOLD;

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden text-slate-400"
        style={{
          height: pull,
          transition: startY.current === null ? "height 0.2s ease" : undefined,
        }}
      >
        {refreshing ? (
          <Loader2 size={20} className="animate-spin text-[var(--brand)]" />
        ) : (
          <ArrowDown
            size={20}
            className="transition-transform"
            style={{ transform: ready ? "rotate(180deg)" : "none", opacity: pull / THRESHOLD }}
          />
        )}
      </div>
      {children}
    </div>
  );
}
