import { useCallback, useEffect, useRef, useState } from "react";
import type { AddLog } from "../event-log/type";
export const commandPositions: Record<string, string> = {
  up: "col-start-2 row-start-1",
  left: "col-start-1 row-start-2",
  down: "col-start-2 row-start-2",
  right: "col-start-3 row-start-2",
  out: "col-start-1 row-start-1",
  in: "col-start-3 row-start-1",
};
export const commands = [
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

export function usePtzControls(
  selected: number | null,
  editing: boolean,
  addLog: AddLog,
  onFeedback: (id: number, command: string) => void,
) {
  const disabled = editing || selected === null;
  const active = useRef<{ command: string; source: string; camera: number } | null>(null);
  const lastCommand = useRef<Partial<Record<number, string>>>({});
  const [held, setHeld] = useState<string | null>(null);
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

  return {
    held,
    start,
    stop,
    getLastCommand: (camera: number) => lastCommand.current[camera],
    rememberCommand: (camera: number, command: string) => {
      lastCommand.current[camera] = command;
    },
  };
}
