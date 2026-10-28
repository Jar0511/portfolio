import { Button } from "../workspace/ui";
import { formatDuration } from "./format";
export function RecordingWidget({
  recording,
  elapsed,
  editing,
  dialogOpen,
  lastRecording,
  onToggle,
}: {
  recording: boolean;
  elapsed: number;
  editing: boolean;
  dialogOpen: boolean;
  lastRecording: string | null;
  onToggle: () => void;
}) {
  return (
    <div className="widget-stack flex flex-col gap-3">
      <div className="recording-row flex flex-wrap items-center gap-3">
        <Button
          type="button"
          className={`record-button inline-flex items-center gap-2 px-3 py-2 ${recording ? "is-recording" : ""}`}
          disabled={editing || dialogOpen}
          onClick={onToggle}
        >
          <span className="record-dot size-[9px] rounded-full bg-[#d2463f]" aria-hidden="true" />
          {recording ? "녹화 중단" : "녹화 시작"}
        </Button>
        <time
          className="elapsed font-space-mono text-[15px] leading-[normal] tabular-nums"
          aria-label="녹화 경과 시간"
        >
          {formatDuration(elapsed)}
        </time>
      </div>
      <p className="widget-hint text-[11px] leading-[1.6] text-(--room-muted) [overflow-wrap:anywhere]">
        {editing
          ? "편집을 마친 뒤 녹화할 수 있습니다."
          : recording
            ? "모의 녹화 진행 중"
            : lastRecording
              ? `최근 녹화: ${lastRecording}`
              : "영상 파일을 생성하지 않는 모의 녹화입니다."}
      </p>
    </div>
  );
}
