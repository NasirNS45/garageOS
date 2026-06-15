import { useEffect, useRef, useState } from "react";

/**
 * Animate a number from 0 to `target` with ease-out cubic.
 * Respects prefers-reduced-motion (jumps straight to the value).
 */
export function useCountUp(target: number, durationMs = 700): number {
  const [value, setValue] = useState(target);
  const frame = useRef(0);
  const start = useRef<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target === 0 || !Number.isFinite(target)) {
      setValue(target);
      return;
    }

    start.current = null;
    const step = (ts: number) => {
      if (start.current === null) start.current = ts;
      const progress = Math.min(1, (ts - start.current) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };

    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, durationMs]);

  return value;
}
