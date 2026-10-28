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
import { FaRegThumbsUp } from "react-icons/fa6";
import { TitledSection } from "@/common/layout";
import { CameraController, CameraWall, type CameraPresets, type LogCategory } from "./cameras";
import {
  editorReducer,
  initialEditor,
  widgetTitles,
  type Columns,
  type WidgetId,
} from "./layout-state";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./styles.css";

const bookmarks = [{ id: "good", label: "잘했어요", icon: FaRegThumbsUp }];
const filters = [
  { id: "all", label: "전체" },
  { id: "session", label: "녹화·메모·시나리오" },
  { id: "ptz", label: "PTZ" },
] as const;
const categoryLabels: Record<LogCategory, string> = {
  recording: "녹화",
  memo: "메모",
  scenario: "시나리오",
  ptz: "PTZ",
};
interface LogEntry {
  id: number;
  category: LogCategory;
  message: string;
  time: string;
}
const formatDuration = (seconds: number) =>
  `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export default function DraggableLayoutPage() {
  const [editor, dispatch] = useReducer(editorReducer, undefined, initialEditor);
  const { present, editing } = editor;
  const { width, containerRef, mounted } = useContainerWidth({ measureBeforeMount: true });
  const cols: Columns = width >= 1100 ? 8 : width >= 760 ? 6 : 4;
  const [selectedCamera, setSelectedCamera] = useState<number | null>(null);
  const selected =
    selectedCamera !== null && selectedCamera <= present.cameraCount ? selectedCamera : null;
  const [feedback, setFeedback] = useState<Record<number, string>>({});
  const [presets, setPresets] = useState<CameraPresets>({});
  const [recordingStart, setRecordingStart] = useState<number | null>(null);
  const recording = recordingStart !== null;
  const [elapsed, setElapsed] = useState(0);
  const [memo, setMemo] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const logId = useRef(0);
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [recordingNumber, setRecordingNumber] = useState(1);
  const [recordingTitle, setRecordingTitle] = useState("");
  const [lastRecording, setLastRecording] = useState<string | null>(null);
  const [pendingDuration, setPendingDuration] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const lastFocus = useRef<HTMLElement | null>(null);
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

  useEffect(() => {
    if (recordingStart === null) return;
    const interval = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - recordingStart) / 1000));
    }, 250);
    return () => {
      window.clearInterval(interval);
    };
  }, [recordingStart]);

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

  useEffect(() => {
    if (!dialogOpen) return;
    dialog.current?.showModal();
    titleInput.current?.focus();
    titleInput.current?.select();
  }, [dialogOpen]);

  function toggleRecording() {
    if (editing || dialogOpen) return;
    if (recordingStart === null) {
      setRecordingStart(Date.now());
      setElapsed(0);
      addLog("recording", "녹화 시작");
    } else {
      const duration = Math.floor((Date.now() - recordingStart) / 1000);
      setPendingDuration(duration);
      setElapsed(duration);
      setRecordingStart(null);
      addLog("recording", `녹화 중단 · ${formatDuration(duration)}`);
      setRecordingTitle(`새로운 녹화_${String(recordingNumber).padStart(2, "0")}`);
      lastFocus.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setDialogOpen(true);
    }
  }
  function finishRecording(event?: SubmitEvent) {
    event?.preventDefault();
    const title =
      recordingTitle.trim() || `새로운 녹화_${String(recordingNumber).padStart(2, "0")}`;
    setLastRecording(title);
    addLog("recording", `녹화 제목 저장 · ${title} (${formatDuration(pendingDuration)})`);
    setRecordingNumber((number) => number + 1);
    dialog.current?.close();
    setDialogOpen(false);
    lastFocus.current?.focus();
  }
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
      <>
        <div className="camera-toolbar">
          <span className="widget-hint">
            {editing
              ? "개수를 선택하고 모서리를 끌어 크기를 조절하세요."
              : "카메라를 선택하면 PTZ 컨트롤이 활성화됩니다."}
          </span>
          {editing && (
            <label>
              영상 개수{" "}
              <select
                value={present.cameraCount}
                onChange={(event) => {
                  dispatch({ type: "count", count: Number(event.target.value) });
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
          count={present.cameraCount}
          selected={selected}
          editing={editing}
          feedback={feedback}
          onSelect={setSelectedCamera}
        />
      </>
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
    bookmarks: (
      <div className="widget-stack">
        <div className="button-row">
          {bookmarks.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              className="bookmark-badge"
              disabled={!recording}
              onClick={() => {
                addLog("recording", `북마크 · ${label} (${formatDuration(elapsed)})`);
              }}
            >
              <Icon aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
        <p className="widget-hint">
          {recording
            ? "기억하고 싶은 순간을 북마크로 남기세요."
            : "녹화 중에 북마크를 추가할 수 있습니다."}
        </p>
      </div>
    ),
    recording: (
      <div className="widget-stack">
        <div className="recording-row">
          <button
            type="button"
            className={`record-button ${recording ? "is-recording" : ""}`}
            disabled={editing || dialogOpen}
            onClick={toggleRecording}
          >
            <span className="record-dot" aria-hidden="true" />
            {recording ? "녹화 중단" : "녹화 시작"}
          </button>
          <time className="elapsed" aria-label="녹화 경과 시간">
            {formatDuration(elapsed)}
          </time>
        </div>
        <p className="widget-hint">
          {editing
            ? "편집을 마친 뒤 녹화할 수 있습니다."
            : recording
              ? "모의 녹화 진행 중"
              : lastRecording
                ? `최근 녹화: ${lastRecording}`
                : "영상 파일을 생성하지 않는 모의 녹화입니다."}
        </p>
      </div>
    ),
    memo: (
      <form className="memo-form" onSubmit={submitMemo}>
        <textarea
          aria-label="녹화 메모"
          disabled={!recording}
          value={memo}
          onChange={(event) => {
            setMemo(event.target.value);
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
        <button type="submit" disabled={!recording || !memo.trim()}>
          전송 ↗
        </button>
      </form>
    ),
    scenario: (
      <div className="scenario-placeholder">
        <span aria-hidden="true">≡</span>
        <p>시나리오 영역</p>
        <small>이곳에 시나리오가 표시됩니다.</small>
      </div>
    ),
    history: (
      <div className="history-content">
        <div className="history-tabs" role="tablist" aria-label="이벤트 필터">
          {filters.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`history-tab-${tab.id}`}
              aria-controls="history-panel"
              aria-selected={filter === tab.id}
              tabIndex={filter === tab.id ? 0 : -1}
              onClick={() => {
                setFilter(tab.id);
              }}
              onKeyDown={(event) => {
                const index = filters.findIndex((item) => item.id === filter);
                const next =
                  event.key === "ArrowRight"
                    ? (index + 1) % filters.length
                    : event.key === "ArrowLeft"
                      ? (index + filters.length - 1) % filters.length
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? filters.length - 1
                          : -1;
                if (next >= 0) {
                  event.preventDefault();
                  setFilter(filters[next].id);
                  document.getElementById(`history-tab-${filters[next].id}`)?.focus();
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div
          id="history-panel"
          role="tabpanel"
          aria-labelledby={`history-tab-${filter}`}
          tabIndex={0}
          className="event-list"
        >
          {logs
            .filter(
              (entry) =>
                filter === "all" ||
                (filter === "ptz" ? entry.category === "ptz" : entry.category !== "ptz"),
            )
            .map((entry) => (
              <div className="event-entry" key={entry.id}>
                <time>{entry.time}</time>
                <span className={`event-category category-${entry.category}`}>
                  {categoryLabels[entry.category]}
                </span>
                <p>{entry.message}</p>
              </div>
            ))}
          {!logs.some(
            (entry) =>
              filter === "all" ||
              (filter === "ptz" ? entry.category === "ptz" : entry.category !== "ptz"),
          ) && (
            <p className="empty-history">
              표시할 이벤트가 없습니다. 카메라를 조작하거나 녹화를 시작해 보세요.
            </p>
          )}
        </div>
        <span className="sr-only" role="status">
          {logs[0]?.message}
        </span>
      </div>
    ),
  };

  return (
    <TitledSection title="Draggable Grid Layout" subtitle="UI EXPERIMENT / 03">
      <div className={`layout-workspace ${editing ? "is-editing" : ""}`}>
        <section className="editor-toolbar" aria-label="레이아웃 편집">
          <div className="editor-heading">
            <span className="workspace-eyebrow">CONTROL ROOM</span>
            <div>
              <strong>{editing ? "나만의 작업 공간 만들기" : "카메라 모니터링"}</strong>
              <span className="column-count">{cols} COLUMNS</span>
            </div>
            <p>
              {editing
                ? "제목 표시줄을 끌어 이동하세요. 변경 사항은 저장 후 적용됩니다."
                : "카메라 조작부터 녹화, 메모까지 한 공간에서 관리하세요."}
            </p>
          </div>
          <div className="editor-actions">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: "reset" });
                  }}
                >
                  초기화
                </button>
                <button
                  type="button"
                  disabled={!editor.past.length}
                  title="Ctrl+Z"
                  onClick={() => {
                    dispatch({ type: "undo" });
                  }}
                >
                  Undo ({editor.past.length})
                </button>
                <button
                  type="button"
                  disabled={!editor.future.length}
                  title="Ctrl+Shift+Z"
                  onClick={() => {
                    dispatch({ type: "redo" });
                  }}
                >
                  Redo ({editor.future.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: "cancel" });
                  }}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    dispatch({ type: "save" });
                  }}
                >
                  저장
                </button>
              </>
            ) : (
              <button
                type="button"
                className="primary-button"
                disabled={recording || dialogOpen}
                onClick={() => {
                  dispatch({ type: "begin" });
                }}
              >
                레이아웃 수정하기
              </button>
            )}
          </div>
          {recording && (
            <p className="toolbar-notice">녹화 중에는 레이아웃을 편집할 수 없습니다.</p>
          )}
          {editing && (
            <div className="deleted-widgets">
              <span>삭제된 위젯</span>
              {(Object.keys(widgetTitles) as WidgetId[])
                .filter((id) => !present.visible.includes(id))
                .map((id) => (
                  <button
                    type="button"
                    key={id}
                    onClick={() => {
                      dispatch({ type: "add", id });
                    }}
                  >
                    + {widgetTitles[id]}
                  </button>
                ))}
              {present.visible.length === Object.keys(widgetTitles).length && (
                <small>모든 위젯이 표시되고 있습니다.</small>
              )}
            </div>
          )}
        </section>
        <div ref={containerRef} className="grid-container">
          {mounted && (
            <GridLayout
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
                <section
                  key={id}
                  className={`workspace-widget widget-${id}`}
                  aria-label={widgetTitles[id]}
                >
                  <header className="widget-header">
                    <h2>
                      {editing && (
                        <span className="drag-grip" aria-hidden="true">
                          ⠿
                        </span>
                      )}
                      {widgetTitles[id]}
                    </h2>
                    <div className="widget-header-actions">
                      {id === "cameras" && (
                        <span className="widget-counter">{present.cameraCount} FEEDS</span>
                      )}
                      {editing && id !== "cameras" && (
                        <button
                          type="button"
                          className="remove-widget"
                          aria-label={`${widgetTitles[id]} 위젯 삭제`}
                          onClick={() => {
                            dispatch({ type: "remove", id });
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </header>
                  <div className="widget-body">{content[id]}</div>
                </section>
              ))}
            </GridLayout>
          )}
        </div>
        <dialog
          ref={dialog}
          className="recording-dialog"
          aria-labelledby="recording-dialog-title"
          onCancel={(event) => {
            event.preventDefault();
            finishRecording();
          }}
        >
          <form onSubmit={finishRecording}>
            <span className="workspace-eyebrow">RECORDING COMPLETE</span>
            <h2 id="recording-dialog-title">녹화 제목</h2>
            <p>{formatDuration(pendingDuration)} 동안의 모의 녹화를 마쳤습니다.</p>
            <label htmlFor="recording-title">제목</label>
            <input
              ref={titleInput}
              id="recording-title"
              value={recordingTitle}
              onChange={(event) => {
                setRecordingTitle(event.target.value);
              }}
            />
            <p className="widget-hint">녹화 파일은 생성되지 않으며 제목이 이벤트에 기록됩니다.</p>
            <button type="submit" className="primary-button">
              제목 저장
            </button>
          </form>
        </dialog>
      </div>
    </TitledSection>
  );
}
