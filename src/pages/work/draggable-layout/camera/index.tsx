import { CameraWall } from "./wall";
export { CameraController } from "./controller";
export type { CameraPresets } from "./type";
export function CameraWidget({
  count,
  selected,
  editing,
  feedback,
  onSelect,
  onCountChange,
}: {
  count: number;
  selected: number | null;
  editing: boolean;
  feedback: Record<number, string>;
  onSelect: (id: number) => void;
  onCountChange: (count: number) => void;
}) {
  return (
    <>
      <div className="camera-toolbar flex flex-wrap items-center justify-between gap-2 [&_label]:flex [&_label]:items-center [&_label]:gap-1.5 [&_label]:text-[11px]">
        <span className="widget-hint text-[11px] leading-[1.6] text-(--room-muted) [overflow-wrap:anywhere]">
          {editing
            ? "개수를 선택하고 모서리를 끌어 크기를 조절하세요."
            : "카메라를 선택하면 PTZ 컨트롤이 활성화됩니다."}
        </span>
        {editing && (
          <label>
            영상 개수{" "}
            <select
              className="rounded-md border border-(--room-line) bg-(--room-panel) px-1.5 py-[3px]"
              value={count}
              onChange={(event) => {
                onCountChange(Number(event.target.value));
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((count) => (
                <option key={count} value={count}>
                  {count}개
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <CameraWall
        count={count}
        selected={selected}
        editing={editing}
        feedback={feedback}
        onSelect={onSelect}
      />
    </>
  );
}
