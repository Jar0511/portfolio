import { Button } from "../workspace/ui";
import type { LogCategory, LogEntry, EventFilter } from "./type";
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

export function EventHistory({
  logs,
  filter,
  onFilterChange,
}: {
  logs: LogEntry[];
  filter: EventFilter;
  onFilterChange: (filter: EventFilter) => void;
}) {
  return (
    <div className="history-content flex h-full flex-col">
      <div
        className="history-tabs flex shrink-0 gap-1 border-b border-(--room-line) px-3 py-2"
        role="tablist"
        aria-label="이벤트 필터"
      >
        {filters.map((tab) => (
          <Button
            key={tab.id}
            type="button"
            className={`border-transparent bg-transparent px-2.5 py-1.5 text-[11px] ${filter === tab.id ? "border-(--room-line)! bg-(--room-surface)! text-(--room-accent)" : ""}`}
            role="tab"
            id={`history-tab-${tab.id}`}
            aria-controls="history-panel"
            aria-selected={filter === tab.id}
            tabIndex={filter === tab.id ? 0 : -1}
            onClick={() => {
              onFilterChange(tab.id);
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
                onFilterChange(filters[next].id);
                document.getElementById(`history-tab-${filters[next].id}`)?.focus();
              }
            }}
          >
            {tab.label}
          </Button>
        ))}
      </div>
      <div
        id="history-panel"
        role="tabpanel"
        aria-labelledby={`history-tab-${filter}`}
        tabIndex={0}
        className="event-list flex-1 overflow-auto px-4"
      >
        {logs
          .filter(
            (entry) =>
              filter === "all" ||
              (filter === "ptz" ? entry.category === "ptz" : entry.category !== "ptz"),
          )
          .map((entry) => (
            <div
              className="event-entry grid grid-cols-[60px_32px_1fr] items-baseline gap-1.5 border-b border-(--room-line) py-2.5 text-[11px] min-[521px]:grid-cols-[68px_48px_1fr] min-[521px]:gap-2.5 min-[521px]:text-[12px] [&_time]:font-space-mono [&_time]:text-[10px] [&_time]:leading-[normal] [&_time]:whitespace-nowrap [&_time]:text-(--room-muted) [&_p]:whitespace-pre-wrap [&_p]:[overflow-wrap:anywhere]"
              key={entry.id}
            >
              <time>{entry.time}</time>
              <span
                className={`event-category category-${entry.category} text-[10px] ${entry.category === "recording" ? "text-[#c05a50]" : "text-(--room-accent)"}`}
              >
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
          <p className="empty-history py-[30px] text-center text-[12px] text-(--room-muted)">
            표시할 이벤트가 없습니다. 카메라를 조작하거나 녹화를 시작해 보세요.
          </p>
        )}
      </div>
      <span className="sr-only" role="status">
        {logs[0]?.message}
      </span>
    </div>
  );
}
