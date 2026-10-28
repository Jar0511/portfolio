import { Button } from "../workspace/ui";
import { useEffect, useRef } from "react";
import { formatDuration } from "./format";

export function RecordingTitleDialog({
  open,
  title,
  duration,
  onTitleChange,
  onFinish,
}: {
  open: boolean;
  title: string;
  duration: number;
  onTitleChange: (value: string) => void;
  onFinish: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!open) return;
    lastFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.current?.showModal();
    input.current?.focus();
    input.current?.select();
  }, [open]);

  function finish() {
    onFinish();
    dialog.current?.close();
    lastFocus.current?.focus();
  }

  return (
    <dialog
      ref={dialog}
      className="recording-dialog m-auto w-[min(440px,calc(100vw-32px))] rounded-xl border border-(--room-line) bg-(--room-panel) p-7 text-inherit backdrop:bg-[#07160f99] backdrop:backdrop-blur-[3px] [&_h2]:text-[23px] [&_h2]:font-[650] [&_p]:text-(--room-muted) [&_label]:font-semibold"
      aria-labelledby="recording-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        finish();
      }}
    >
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          finish();
        }}
      >
        <span className="workspace-eyebrow font-space-mono text-[10px] tracking-[0.15em] text-(--room-muted)">
          RECORDING COMPLETE
        </span>
        <h2 id="recording-dialog-title">녹화 제목</h2>
        <p>{formatDuration(duration)} 동안의 모의 녹화를 마쳤습니다.</p>
        <label htmlFor="recording-title">제목</label>
        <input
          className="w-full rounded-md border border-(--room-line) bg-(--room-panel) p-3"
          ref={input}
          id="recording-title"
          value={title}
          onChange={(event) => {
            onTitleChange(event.target.value);
          }}
        />
        <p className="widget-hint text-[11px] leading-[1.6] text-(--room-muted) [overflow-wrap:anywhere]">
          녹화 파일은 생성되지 않으며 제목이 이벤트에 기록됩니다.
        </p>
        <Button type="submit" primary>
          제목 저장
        </Button>
      </form>
    </dialog>
  );
}
