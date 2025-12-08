import { useEffect, useState } from "react";

export function useCountUp(end: number, duration = 2000, start: boolean) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return; // wait until triggered

    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setValue(Math.floor(progress * end));

      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [start, end, duration]);

  return value;
}
