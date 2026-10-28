import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
} from "react";

export type LogCategory = "recording" | "memo" | "scenario" | "ptz";
export type AddLog = (category: LogCategory, message: string) => void;

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
  let best = { columns: 1, width: 0 };
  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns);
    const width = Math.max(
      0,
      Math.min(
        (size.width - (columns - 1) * 8) / columns,
        (((size.height - (rows - 1) * 8) / rows) * 16) / 9,
      ),
    );
    if (width > best.width) best = { columns, width };
  }
  return (
    <div className="camera-wall" ref={ref}>
      <div
        className="camera-grid"
        style={
          { "--camera-columns": best.columns, "--camera-width": `${best.width}px` } as CSSProperties
        }
      >
        {Array.from({ length: count }, (_, index) => index + 1).map((id) => (
          <div className="camera-tile" key={id}>
            <button
              type="button"
              className={`camera-feed ${selected === id ? "selected" : ""}`}
              disabled={editing}
              aria-pressed={selected === id}
              aria-label={`카메라 ${id} 선택`}
              onClick={() => {
                onSelect(id);
              }}
            >
              <span className="camera-id">CAM {String(id).padStart(2, "0")}</span>
              <span className="camera-crosshair" aria-hidden="true">
                ＋
              </span>
              <span className="camera-feedback">{feedback[id] ?? "신호 대기"}</span>
              <span className="camera-simulation">SIMULATED FEED · 16:9</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

const commands = [
  { id: "up", label: "위", symbol: "↑", key: "W / ↑" },
  { id: "left", label: "왼쪽", symbol: "←", key: "A / ←" },
  { id: "down", label: "아래", symbol: "↓", key: "S / ↓" },
  { id: "right", label: "오른쪽", symbol: "→", key: "D / →" },
  { id: "out", label: "줌아웃", symbol: "−", key: "Q" },
  { id: "in", label: "줌인", symbol: "+", key: "E" },
] as const;
const keyCommands: Record<string, string> = {
  w: "up",
  arrowup: "up",
  a: "left",
  arrowleft: "left",
  s: "down",
  arrowdown: "down",
  d: "right",
  arrowright: "right",
  q: "out",
  e: "in",
};
const isInput = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || !!target.closest("input, textarea, select, [role='dialog']"));
type Preset = { savedAt: string; command: string };
export type CameraPresets = Partial<Record<number, (Preset | null)[]>>;

export function CameraController({
  selected,
  editing,
  addLog,
  onFeedback,
  presets,
  setPresets,
}: {
  selected: number | null;
  editing: boolean;
  addLog: AddLog;
  onFeedback: (id: number, command: string) => void;
  presets: CameraPresets;
  setPresets: Dispatch<SetStateAction<CameraPresets>>;
}) {
  const disabled = editing || selected === null;
  const active = useRef<{ command: string; source: string; camera: number } | null>(null);
  const lastCommand = useRef<Record<number, string>>({});
  const [held, setHeld] = useState<string | null>(null);
  const [slots, setSlots] = useState<Partial<Record<number, number>>>({});
  const slot = selected === null ? undefined : slots[selected];
  const preset = selected === null || slot === undefined ? null : presets[selected]?.[slot];

  const stop = useCallback(
    (source?: string) => {
      const current = active.current;
      if (!current || (source && current.source !== source)) return;
      active.current = null;
      setHeld(null);
      onFeedback(current.camera, `${current.command} · 종료`);
      addLog("ptz", `CAM ${current.camera} · ${current.command} 종료`);
    },
    [addLog, onFeedback],
  );
  const start = useCallback(
    (id: string, source: string) => {
      if (editing || selected === null || active.current) return;
      const command = commands.find((command) => command.id === id)?.label;
      if (!command) return;
      active.current = { command, source, camera: selected };
      lastCommand.current[selected] = command;
      setHeld(id);
      onFeedback(selected, `${command} · 조작 중`);
      addLog("ptz", `CAM ${selected} · ${command} 시작`);
    },
    [editing, selected, addLog, onFeedback],
  );

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (
        disabled ||
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        isInput(event.target)
      )
        return;
      const key = event.key.toLowerCase();
      if (keyCommands[key]) {
        event.preventDefault();
        start(keyCommands[key], `key:${key}`);
      }
    };
    const keyup = (event: KeyboardEvent) => {
      stop(`key:${event.key.toLowerCase()}`);
    };
    const blur = () => {
      stop();
    };
    const visibility = () => {
      if (document.hidden) stop();
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      stop();
    };
  }, [disabled, start, stop]);

  function savePreset() {
    if (editing || selected === null || slot === undefined) return;
    const next = [...(presets[selected] ?? Array<Preset | null>(6).fill(null))];
    next[slot] = {
      savedAt: new Date().toLocaleTimeString("ko-KR"),
      command: lastCommand.current[selected] ?? "기본 위치",
    };
    setPresets((previous) => ({ ...previous, [selected]: next }));
    addLog("ptz", `CAM ${selected} · 프리셋 ${slot + 1} 저장`);
    onFeedback(selected, `프리셋 ${slot + 1} · 저장`);
  }
  function recallPreset() {
    if (editing || selected === null || slot === undefined || !preset) return;
    lastCommand.current[selected] = preset.command;
    onFeedback(selected, `프리셋 ${slot + 1} · 호출`);
    addLog("ptz", `CAM ${selected} · 프리셋 ${slot + 1} 호출 (${preset.command})`);
  }
  return (
    <div className="controller-content">
      <p className="widget-hint">
        {editing
          ? "편집 중에는 카메라를 조작할 수 없습니다."
          : selected === null
            ? "영상 영역에서 카메라를 선택하세요."
            : `CAM ${String(selected).padStart(2, "0")} 선택됨 · 버튼을 누르는 동안 조작`}
      </p>
      <fieldset disabled={disabled} className="ptz-controls">
        {commands.map((command) => (
          <button
            key={command.id}
            type="button"
            className={`ptz-button ptz-${command.id} ${held === command.id ? "active" : ""}`}
            aria-label={command.label}
            title={`${command.label} (${command.key})`}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              event.preventDefault();
              event.currentTarget.focus();
              event.currentTarget.setPointerCapture(event.pointerId);
              start(command.id, `pointer:${event.pointerId}`);
            }}
            onPointerUp={(event) => {
              stop(`pointer:${event.pointerId}`);
            }}
            onPointerCancel={(event) => {
              stop(`pointer:${event.pointerId}`);
            }}
            onLostPointerCapture={(event) => {
              stop(`pointer:${event.pointerId}`);
            }}
            onKeyDown={(event) => {
              if ((event.key === " " || event.key === "Enter") && !event.repeat) {
                event.preventDefault();
                start(command.id, `button:${command.id}`);
              }
            }}
            onKeyUp={(event) => {
              if (event.key === " " || event.key === "Enter") stop(`button:${command.id}`);
            }}
            onBlur={() => {
              stop(`button:${command.id}`);
            }}
          >
            <span>{command.symbol}</span>
            <small>{command.key}</small>
          </button>
        ))}
      </fieldset>
      <div className="preset-heading">
        <strong>프리셋</strong>
        <span>카메라당 6개</span>
      </div>
      <div className="preset-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <button
            type="button"
            key={index}
            disabled={disabled}
            aria-pressed={slot === index}
            className={slot === index ? "active" : ""}
            title={selected !== null ? presets[selected]?.[index]?.savedAt : undefined}
            onClick={() => {
              if (selected !== null) setSlots((previous) => ({ ...previous, [selected]: index }));
            }}
          >
            <strong>{String(index + 1).padStart(2, "0")}</strong>
            <small>
              {selected !== null && presets[selected]?.[index] ? "저장됨" : "비어 있음"}
            </small>
          </button>
        ))}
      </div>
      <div className="button-row">
        <button
          type="button"
          disabled={disabled || slot === undefined || held !== null}
          onClick={savePreset}
        >
          선택 슬롯에 저장
        </button>
        <button
          type="button"
          disabled={disabled || !preset || held !== null}
          onClick={recallPreset}
        >
          호출
        </button>
      </div>
      <p className="widget-hint">
        {slot === undefined
          ? "슬롯을 선택한 뒤 저장하거나 호출하세요."
          : `${slot + 1}번 슬롯 선택 · ${preset ? "저장된 프리셋" : "비어 있는 슬롯"}`}
      </p>
    </div>
  );
}
