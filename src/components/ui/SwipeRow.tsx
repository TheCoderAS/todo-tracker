import { useRef, useState, type ReactNode } from "react";

type SwipeAction = {
  icon: ReactNode;
  label: string;
  /** Tailwind/class for the revealed background. */
  className: string;
  onAction: () => void;
};

type SwipeRowProps = {
  children: ReactNode;
  left?: SwipeAction; // revealed when swiping right (finger moves →)
  right?: SwipeAction; // revealed when swiping left (finger moves ←)
  disabled?: boolean;
};

const THRESHOLD = 80; // px to trigger
const MAX = 120; // px max reveal

/**
 * Touch swipe-to-action row (native list pattern). Swipe right to fire `left`
 * action, swipe left to fire `right` action. Pointer-based so it also works
 * with a trackpad/mouse drag; vertical scrolls are left untouched.
 */
export default function SwipeRow({ children, left, right, disabled }: SwipeRowProps) {
  const [dx, setDx] = useState(0);
  const startX = useRef(0);
  const startY = useRef(0);
  const dragging = useRef(false);
  const decided = useRef<"h" | "v" | null>(null);

  const reset = () => {
    setDx(0);
    dragging.current = false;
    decided.current = null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    dragging.current = true;
    decided.current = null;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const deltaX = e.clientX - startX.current;
    const deltaY = e.clientY - startY.current;

    if (decided.current === null) {
      if (Math.abs(deltaX) < 6 && Math.abs(deltaY) < 6) return;
      decided.current = Math.abs(deltaX) > Math.abs(deltaY) ? "h" : "v";
    }
    if (decided.current === "v") return; // let the page scroll

    // Clamp, and don't reveal a side that has no action.
    let next = Math.max(-MAX, Math.min(MAX, deltaX));
    if (next > 0 && !left) next = 0;
    if (next < 0 && !right) next = 0;
    setDx(next);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    if (dx >= THRESHOLD && left) left.onAction();
    else if (dx <= -THRESHOLD && right) right.onAction();
    reset();
  };

  return (
    <div className="relative overflow-hidden rounded-3xl">
      {/* Left action background (revealed swiping right) */}
      {left && dx > 0 && (
        <div
          className={`absolute inset-y-0 left-0 flex items-center gap-2 pl-5 text-sm font-medium text-[#fff] ${left.className}`}
          style={{ width: Math.abs(dx) }}
        >
          {dx >= THRESHOLD && (
            <span className="flex items-center gap-2">
              {left.icon}
              <span className="truncate">{left.label}</span>
            </span>
          )}
        </div>
      )}
      {/* Right action background (revealed swiping left) */}
      {right && dx < 0 && (
        <div
          className={`absolute inset-y-0 right-0 flex items-center justify-end gap-2 pr-5 text-sm font-medium text-[#fff] ${right.className}`}
          style={{ width: Math.abs(dx) }}
        >
          {dx <= -THRESHOLD && (
            <span className="flex items-center gap-2">
              <span className="truncate">{right.label}</span>
              {right.icon}
            </span>
          )}
        </div>
      )}
      <div
        className="relative touch-pan-y"
        style={{
          transform: `translateX(${dx}px)`,
          transition: dragging.current ? "none" : "transform 0.2s ease"
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={reset}
        onPointerLeave={onPointerUp}
      >
        {children}
      </div>
    </div>
  );
}
