"use client";

import { useEffect, useRef } from "react";

type DashboardParallaxProps = {
  children: React.ReactNode;
};

export default function DashboardParallax({
  children
}: DashboardParallaxProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame: number | null = null;

    const update = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const offsetX = (x - 0.5) * 2;
      const offsetY = (y - 0.5) * 2;

      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        container.style.setProperty("--parallax-x", offsetX.toFixed(3));
        container.style.setProperty("--parallax-y", offsetY.toFixed(3));
      });
    };

    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        container.style.setProperty("--parallax-x", "0");
        container.style.setProperty("--parallax-y", "0");
      });
    };

    container.addEventListener("pointermove", update);
    container.addEventListener("pointerleave", reset);

    return () => {
      container.removeEventListener("pointermove", update);
      container.removeEventListener("pointerleave", reset);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={containerRef} className="dashboard-parallax relative">
      <div className="dashboard-parallax-bg" aria-hidden="true" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
