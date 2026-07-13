"use client";

import { useEffect, useState } from "react";

export function useCountUp(target: number, durationMs: number, shouldStart: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!shouldStart) {
      setValue(0);
      return;
    }

    let frameId = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.min(now - startedAt, durationMs);
      const progress = durationMs > 0 ? elapsed / durationMs : 1;
      setValue(Math.round(target * progress));

      if (elapsed < durationMs) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [durationMs, shouldStart, target]);

  return value;
}
