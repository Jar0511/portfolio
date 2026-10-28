import { calculateCameraLayout } from "./layout";
import { useEffect, useRef, useState, type CSSProperties } from "react";
export function CameraWall({
  count,
  selected,
  editing,
  feedback,
  onSelect,
}: {
  count: number;
  selected: number | null;
  editing: boolean;
  feedback: Record<number, string>;
  onSelect: (id: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);
  const best = calculateCameraLayout(count, size);
  return (
    <div className="camera-wall grid min-h-0 flex-1 place-items-center" ref={ref}>
      <div
        className="camera-grid grid grid-cols-[repeat(var(--camera-columns),var(--camera-width))] gap-2"
        style={
          { "--camera-columns": best.columns, "--camera-width": `${best.width}px` } as CSSProperties
        }
      >
        {Array.from({ length: count }, (_, index) => index + 1).map((id) => (
          <div className="camera-tile grid aspect-video min-w-0" key={id}>
            <button
              type="button"
              className={`camera-feed font-medium relative aspect-video w-full overflow-hidden rounded-md border-2 border-[#45594d] bg-[radial-gradient(ellipse_at_50%_45%,#283b32,#14221a)] p-0 text-left text-[#dcebe2] disabled:cursor-not-allowed enabled:hover:border-[#b5e6a8] enabled:hover:bg-[radial-gradient(ellipse_at_50%_45%,#314d3e,#14221a)] ${selected === id ? "selected border-[#b5e6a8]! shadow-[inset_0_0_0_1px_#b5e6a8]" : ""}`}
              disabled={editing}
              aria-pressed={selected === id}
              aria-label={`카메라 ${id} 선택`}
              onClick={() => {
                onSelect(id);
              }}
            >
              <span className="camera-id absolute top-1.5 left-2 font-space-mono text-[10px]">
                CAM {String(id).padStart(2, "0")}
              </span>
              <span
                className="camera-crosshair absolute inset-0 grid place-items-center text-[26px] font-extralight opacity-30"
                aria-hidden="true"
              >
                ＋
              </span>
              <span className="camera-feedback absolute inset-x-1.5 bottom-[22px] text-center text-[11px]">
                {feedback[id] ?? "신호 대기"}
              </span>
              <span className="camera-simulation font-normal absolute inset-x-1 bottom-1.5 text-center font-space-mono text-[8px] leading-[normal] tracking-[0.06em] opacity-50">
                SIMULATED FEED · 16:9
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
