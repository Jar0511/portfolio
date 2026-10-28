import { Button } from "../workspace/ui";
import { commands, commandPositions, usePtzControls } from "./controls";
import { useState, type Dispatch, type SetStateAction } from "react";
import type { Preset, CameraPresets } from "./type";
import type { AddLog } from "../event-log/type";
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
  const { held, start, stop, getLastCommand, rememberCommand } = usePtzControls(
    selected,
    editing,
    addLog,
    onFeedback,
  );
  const [slots, setSlots] = useState<Partial<Record<number, number>>>({});
  const slot = selected === null ? undefined : slots[selected];
  const preset = selected === null || slot === undefined ? null : presets[selected]?.[slot];

  function savePreset() {
    if (editing || selected === null || slot === undefined) return;
    const next = [...(presets[selected] ?? Array<Preset | null>(6).fill(null))];
    next[slot] = {
      savedAt: new Date().toLocaleTimeString("ko-KR"),
      command: getLastCommand(selected) ?? "기본 위치",
    };
    setPresets((previous) => ({ ...previous, [selected]: next }));
    addLog("ptz", `CAM ${selected} · 프리셋 ${slot + 1} 저장`);
    onFeedback(selected, `프리셋 ${slot + 1} · 저장`);
  }
  function recallPreset() {
    if (editing || selected === null || slot === undefined || !preset) return;
    rememberCommand(selected, preset.command);
    onFeedback(selected, `프리셋 ${slot + 1} · 호출`);
    addLog("ptz", `CAM ${selected} · 프리셋 ${slot + 1} 호출 (${preset.command})`);
  }
  return (
    <div className="controller-content flex flex-col gap-2.5">
      <p className="widget-hint text-[11px] leading-[1.6] text-(--room-muted) [overflow-wrap:anywhere]">
        {editing
          ? "편집 중에는 카메라를 조작할 수 없습니다."
          : selected === null
            ? "영상 영역에서 카메라를 선택하세요."
            : `CAM ${String(selected).padStart(2, "0")} 선택됨 · 버튼을 누르는 동안 조작`}
      </p>
      <fieldset
        disabled={disabled}
        className="ptz-controls grid min-w-0 w-[min(100%,175px)] grid-cols-3 grid-rows-[repeat(2,45px)] gap-[5px] self-center border-0 p-0"
      >
        {commands.map((command) => (
          <Button
            key={command.id}
            type="button"
            className={`ptz-button ptz-${command.id} flex touch-none flex-col items-center justify-center p-[3px] select-none [&>span]:text-[21px] [&>span]:leading-none [&_small]:font-space-mono [&_small]:text-[8px] [&_small]:text-(--room-muted) ${commandPositions[command.id]} ${held === command.id ? "active" : ""}`}
            selected={held === command.id}
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
            <small className="text-[9px] text-(--room-muted)">{command.key}</small>
          </Button>
        ))}
      </fieldset>
      <div className="preset-heading flex items-center justify-between gap-1.5 [&>span]:text-[10px] [&>span]:text-(--room-muted)">
        <strong>프리셋</strong>
        <span>카메라당 6개</span>
      </div>
      <div className="preset-grid grid grid-cols-3 gap-1.5">
        {Array.from({ length: 6 }, (_, index) => (
          <Button
            type="button"
            key={index}
            disabled={disabled}
            aria-pressed={slot === index}
            selected={slot === index}
            className={`flex flex-col items-center gap-0.5 p-[5px] ${slot === index ? "active" : ""}`}
            title={selected !== null ? presets[selected]?.[index]?.savedAt : undefined}
            onClick={() => {
              if (selected !== null) setSlots((previous) => ({ ...previous, [selected]: index }));
            }}
          >
            <strong className="font-space-mono text-[12px] leading-[normal] font-normal">
              {String(index + 1).padStart(2, "0")}
            </strong>
            <small className="text-[9px] text-(--room-muted)">
              {selected !== null && presets[selected]?.[index] ? "저장됨" : "비어 있음"}
            </small>
          </Button>
        ))}
      </div>
      <div className="button-row flex flex-wrap items-center gap-2 [&>button]:flex-1 [&>button]:px-1 [&>button]:py-[7px] [&>button]:text-[11px]">
        <Button
          type="button"
          disabled={disabled || slot === undefined || held !== null}
          onClick={savePreset}
        >
          선택 슬롯에 저장
        </Button>
        <Button
          type="button"
          disabled={disabled || !preset || held !== null}
          onClick={recallPreset}
        >
          호출
        </Button>
      </div>
      <p className="widget-hint text-[11px] leading-[1.6] text-(--room-muted) [overflow-wrap:anywhere]">
        {slot === undefined
          ? "슬롯을 선택한 뒤 저장하거나 호출하세요."
          : `${slot + 1}번 슬롯 선택 · ${preset ? "저장된 프리셋" : "비어 있는 슬롯"}`}
      </p>
    </div>
  );
}
