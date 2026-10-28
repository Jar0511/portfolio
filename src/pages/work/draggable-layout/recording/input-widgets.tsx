import { Button } from "../workspace/ui";
import type { SubmitEvent } from "react";
import { FaRegThumbsUp } from "react-icons/fa6";
import type { AddLog } from "../event-log/type";
import { formatDuration } from "./format";
const bookmarks = [{ id: "good", label: "잘했어요", icon: FaRegThumbsUp }];

export function BookmarkWidget({
  recording,
  elapsed,
  addLog,
}: {
  recording: boolean;
  elapsed: number;
  addLog: AddLog;
}) {
  return (
    <div className="widget-stack flex flex-col gap-3">
      <div className="button-row flex flex-wrap items-center gap-2">
        {bookmarks.map(({ id, label, icon: Icon }) => (
          <Button
            type="button"
            key={id}
            pill
            className="bookmark-badge inline-flex items-center gap-2 px-3 py-2"
            disabled={!recording}
            onClick={() => {
              addLog("recording", `북마크 · ${label} (${formatDuration(elapsed)})`);
            }}
          >
            <Icon aria-hidden="true" />
            {label}
          </Button>
        ))}
      </div>
      <p className="widget-hint text-[11px] leading-[1.6] text-(--room-muted) [overflow-wrap:anywhere]">
        {recording
          ? "기억하고 싶은 순간을 북마크로 남기세요."
          : "녹화 중에 북마크를 추가할 수 있습니다."}
      </p>
    </div>
  );
}
export function MemoWidget({
  recording,
  memo,
  onChange,
  onSubmit,
}: {
  recording: boolean;
  memo: string;
  onChange: (value: string) => void;
  onSubmit: (event: SubmitEvent) => void;
}) {
  return (
    <form className="memo-form flex h-full flex-col gap-2" onSubmit={onSubmit}>
      <textarea
        className="min-h-10 w-full flex-1 resize-none rounded-md border border-(--room-line) bg-(--room-panel) p-2.5 text-[12px] disabled:cursor-not-allowed disabled:bg-(--room-surface)"
        aria-label="녹화 메모"
        disabled={!recording}
        value={memo}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={
          recording
            ? "메모 입력 · Enter 전송 / Shift+Enter 줄바꿈"
            : "녹화를 시작하면 메모를 남길 수 있습니다."
        }
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
      />
      <Button className="self-end px-4 py-1.5" type="submit" disabled={!recording || !memo.trim()}>
        전송 ↗
      </Button>
    </form>
  );
}
