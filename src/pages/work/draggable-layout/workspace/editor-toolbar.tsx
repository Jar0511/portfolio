import { Button } from "./ui";
import type { Dispatch } from "react";
import {
  widgetTitles,
  type EditorState,
  type EditorAction,
  type Columns,
  type WidgetId,
} from "./layout-state";
export function EditorToolbar({
  editor,
  dispatch,
  cols,
  recording,
  dialogOpen,
}: {
  editor: EditorState;
  dispatch: Dispatch<EditorAction>;
  cols: Columns;
  recording: boolean;
  dialogOpen: boolean;
}) {
  const { present, editing } = editor;
  return (
    <section
      className="editor-toolbar mb-[18px] flex flex-wrap items-center justify-between gap-[18px] rounded-[10px] border border-(--room-line) bg-(--room-surface) p-4 min-[521px]:p-[22px]"
      aria-label="레이아웃 편집"
    >
      <div className="editor-heading [&>div]:my-1.5 [&>div]:flex [&>div]:flex-wrap [&>div]:items-center [&>div]:gap-3 [&_strong]:text-[19px] [&_strong]:tracking-[-0.035em] [&_p]:text-[12px] [&_p]:text-(--room-muted)">
        <span className="workspace-eyebrow font-space-mono text-[10px] tracking-[0.15em] text-(--room-muted)">
          CONTROL ROOM
        </span>
        <div>
          <strong>{editing ? "나만의 작업 공간 만들기" : "카메라 모니터링"}</strong>
          <span className="column-count rounded border border-(--room-line) px-1.5 py-[3px] font-space-mono text-[10px] text-(--room-accent)">
            {cols} COLUMNS
          </span>
        </div>
        <p>
          {editing
            ? "제목 표시줄을 끌어 이동하세요. 변경 사항은 저장 후 적용됩니다."
            : "카메라 조작부터 녹화, 메모까지 한 공간에서 관리하세요."}
        </p>
      </div>
      <div className="editor-actions flex flex-wrap items-center gap-1.5 min-[521px]:gap-2 [&>button]:px-[9px] [&>button]:py-[7px] [&>button]:text-[12px] min-[521px]:[&>button]:px-3 min-[521px]:[&>button]:py-2 min-[521px]:[&>button]:text-[13px]">
        {editing ? (
          <>
            <Button
              type="button"
              onClick={() => {
                dispatch({ type: "reset" });
              }}
            >
              초기화
            </Button>
            <Button
              type="button"
              disabled={!editor.past.length}
              title="Ctrl+Z"
              onClick={() => {
                dispatch({ type: "undo" });
              }}
            >
              Undo ({editor.past.length})
            </Button>
            <Button
              type="button"
              disabled={!editor.future.length}
              title="Ctrl+Shift+Z"
              onClick={() => {
                dispatch({ type: "redo" });
              }}
            >
              Redo ({editor.future.length})
            </Button>
            <Button
              type="button"
              onClick={() => {
                dispatch({ type: "cancel" });
              }}
            >
              취소
            </Button>
            <Button
              type="button"
              primary
              onClick={() => {
                dispatch({ type: "save" });
              }}
            >
              저장
            </Button>
          </>
        ) : (
          <Button
            type="button"
            primary
            disabled={recording || dialogOpen}
            onClick={() => {
              dispatch({ type: "begin" });
            }}
          >
            레이아웃 수정하기
          </Button>
        )}
      </div>
      {recording && (
        <p className="toolbar-notice text-[12px] text-(--room-muted)">
          녹화 중에는 레이아웃을 편집할 수 없습니다.
        </p>
      )}
      {editing && (
        <div className="deleted-widgets flex basis-full flex-wrap items-center gap-2 border-t border-(--room-line) pt-3.5 [&>span]:mr-1.5 [&>span]:font-semibold [&_small]:text-(--room-muted)">
          <span>삭제된 위젯</span>
          {(Object.keys(widgetTitles) as WidgetId[])
            .filter((id) => !present.visible.includes(id))
            .map((id) => (
              <Button
                type="button"
                key={id}
                onClick={() => {
                  dispatch({ type: "add", id });
                }}
              >
                + {widgetTitles[id]}
              </Button>
            ))}
          {present.visible.length === Object.keys(widgetTitles).length && (
            <small>모든 위젯이 표시되고 있습니다.</small>
          )}
        </div>
      )}
    </section>
  );
}
