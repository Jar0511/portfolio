import { useEffect, useState } from "react";
import type { AddLog } from "../event-log/type";
import { formatDuration } from "./format";

// Called by Workspace so hiding the recording widget never resets a session.
export function useRecording(editing: boolean, addLog: AddLog) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [number, setNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [lastRecording, setLastRecording] = useState<string | null>(null);
  const [pendingDuration, setPendingDuration] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (startedAt === null) return;
    const interval = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    return () => {
      window.clearInterval(interval);
    };
  }, [startedAt]);

  function toggle() {
    if (editing || dialogOpen) return;
    if (startedAt === null) {
      setStartedAt(Date.now());
      setElapsed(0);
      addLog("recording", "녹화 시작");
    } else {
      const duration = Math.floor((Date.now() - startedAt) / 1000);
      setPendingDuration(duration);
      setElapsed(duration);
      setStartedAt(null);
      addLog("recording", `녹화 중단 · ${formatDuration(duration)}`);
      setTitle(`새로운 녹화_${String(number).padStart(2, "0")}`);
      setDialogOpen(true);
    }
  }

  function finish() {
    const trimmed = title.trim() || `새로운 녹화_${String(number).padStart(2, "0")}`;
    setLastRecording(trimmed);
    addLog("recording", `녹화 제목 저장 · ${trimmed} (${formatDuration(pendingDuration)})`);
    setNumber((value) => value + 1);
    setDialogOpen(false);
  }

  return {
    recording: startedAt !== null,
    elapsed,
    lastRecording,
    pendingDuration,
    dialogOpen,
    title,
    setTitle,
    toggle,
    finish,
  };
}
