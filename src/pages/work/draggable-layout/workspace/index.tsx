import { WidgetFrame } from "./ui";
import { EventHistory } from "../event-log";
import type { LogCategory, LogEntry, EventFilter } from "../event-log/type";
import { RecordingWidget } from "../recording";
import { BookmarkWidget, MemoWidget } from "../recording/input-widgets";
import { useRecording } from "../recording/use-recording";
import { RecordingTitleDialog } from "../recording/title-dialog";
import { EditorToolbar } from "./editor-toolbar";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type SubmitEvent,
  type ReactNode,
} from "react";
import { GridLayout, useContainerWidth, type Layout } from "react-grid-layout";
import { CameraController, CameraWidget, type CameraPresets } from "../camera";
import {
  editorReducer,
  initialEditor,
  widgetTitles,
  type Columns,
  type WidgetId,
} from "./layout-state";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "../styles.css";

export function Workspace() {
  const [editor, dispatch] = useReducer(editorReducer, undefined, initialEditor);
  const { present, editing } = editor;
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true });
  const cols: Columns = width >= 1100 ? 8 : width >= 760 ? 6 : 4;
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);
  const selected =
    selectedCamera !== null && selectedCamera <= present.cameraCount ? selectedCamera : null;
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [presets, setPresets] = useState<CameraPresets>({});
  const [memo, setMemo] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logId = useRef(0);
  const [filter, setFilter] = useState<EventFilter>("all");
  const addLog = useCallback((category: LogCategory, message: string) => {
    const entry = {
      id: ++logId.current,
      category,
      message,
      time: new Date().toLocaleTimeString("ko-KR", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    };
    setLogs((previous) => [entry, ...previous]);
  }, []);
  const onFeedback = useCallback((id: number, command: string) => {
    setFeedback((previous) => ({ ...previous, [id]: command }));
  }, []);

  const {
    recording,
    elapsed,
    lastRecording,
    pendingDuration,
    dialogOpen,
    title,
    setTitle,
    toggle,
    finish,
  } = useRecording(editing, addLog);

  useEffect(() => {
    if (!editing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable || target.closest("input, textarea, select"))
      )
        return;
      if ((event.ctrlKey || event.metaKey) && !event.altKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        dispatch({ type: event.shiftKey ? "redo" : "undo" });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [editing]);

  function submitMemo(event: SubmitEvent) {
    event.preventDefault();
    if (!recording || !memo.trim()) return;
    addLog("memo", memo.trim());
    setMemo("");
  }
  function commitLayout(layout: Layout) {
    dispatch({ type: "layout", cols, layout });
  }

  const content: Record<WidgetId, ReactNode> = {
    cameras: (
      <CameraWidget
        count={present.cameraCount}
        selected={selected}
        editing={editing}
        feedback={feedback}
        onSelect={setSelectedCamera}
        onCountChange={(count) => {
          dispatch({ type: "count", count });
        }}
      />
    ),
    controller: (
      <CameraController
        selected={selected}
        editing={editing || dialogOpen}
        addLog={addLog}
        onFeedback={onFeedback}
        presets={presets}
        setPresets={setPresets}
      />
    ),
    bookmarks: <BookmarkWidget recording={recording} elapsed={elapsed} addLog={addLog} />,
    recording: (
      <RecordingWidget
        recording={recording}
        elapsed={elapsed}
        editing={editing}
        dialogOpen={dialogOpen}
        lastRecording={lastRecording}
        onToggle={toggle}
      />
    ),
    memo: <MemoWidget recording={recording} memo={memo} onChange={setMemo} onSubmit={submitMemo} />,
    scenario: (
      <div className="scenario-placeholder flex h-full min-h-[60px] flex-col items-center justify-center gap-[5px] rounded-md border border-dashed border-(--room-line) text-(--room-muted) [&>span]:text-2xl [&>span]:leading-none [&_small]:text-[11px]">
        <span aria-hidden="true">≡</span>
        <p>시나리오 영역</p>
        <small>이곳에 시나리오가 표시됩니다.</small>
      </div>
    ),
    history: <EventHistory logs={logs} filter={filter} onFilterChange={setFilter} />,
  };

  return (
    <div
      className={`layout-workspace text-[13px] text-[#202d25] dark:text-[#e4ede6] [&_:focus-visible]:outline-2 [&_:focus-visible]:outline-offset-3 [&_:focus-visible]:outline-(--room-accent) ${editing ? "is-editing" : ""}`}
    >
      <EditorToolbar
        editor={editor}
        dispatch={dispatch}
        cols={cols}
        recording={recording}
        dialogOpen={dialogOpen}
      />
      <div ref={containerRef} className="grid-container min-w-0">
        {mounted && (
          <GridLayout
            // Preserve the current breakpoint remount and PTZ cleanup behavior.
            key={cols}
            width={width}
            layout={present.layouts[cols]}
            gridConfig={{ cols, rowHeight: 28, margin: [12, 12], containerPadding: [0, 0] }}
            dragConfig={{
              enabled: editing,
              handle: ".widget-header",
              cancel: "button, input, select, textarea",
            }}
            resizeConfig={{ enabled: editing, handles: ["se"] }}
            onDragStop={commitLayout}
            onResizeStop={commitLayout}
          >
            {present.visible.map((id) => (
              <WidgetFrame
                key={id}
                className={`widget-${id}`}
                title={widgetTitles[id]}
                editing={editing}
                headerActions={
                  id === "cameras" ? (
                    <span className="widget-counter font-space-mono text-[10px] whitespace-nowrap text-(--room-muted)">
                      {present.cameraCount} FEEDS
                    </span>
                  ) : undefined
                }
                onRemove={
                  id !== "cameras"
                    ? () => {
                        dispatch({ type: "remove", id });
                      }
                    : undefined
                }
                bodyClassName={
                  id === "cameras"
                    ? "flex flex-col gap-2.5 overflow-hidden p-3 min-[521px]:p-4"
                    : id === "history"
                      ? "overflow-hidden p-0"
                      : undefined
                }
              >
                {content[id]}
              </WidgetFrame>
            ))}
          </GridLayout>
        )}
      </div>
      <RecordingTitleDialog
        open={dialogOpen}
        title={title}
        duration={pendingDuration}
        onTitleChange={setTitle}
        onFinish={finish}
      />
    </div>
  );
}
