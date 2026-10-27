import { TitledSection } from "@/common/layout";
import { useRef, useState } from "react";
import {
  FiArrowUp,
  FiChevronDown,
  FiChevronRight,
  FiCornerDownRight,
} from "react-icons/fi";

const groups = [
  { name: "웹사이트 리뉴얼", owner: "김민서", category: "Design", count: 10 },
  { name: "디자인 시스템", owner: "박지훈", category: "System", count: 8 },
  { name: "사용자 경험 개선", owner: "이서연", category: "Research", count: 12 },
  { name: "모바일 서비스", owner: "정도윤", category: "Product", count: 9 },
  { name: "운영 및 유지보수", owner: "최유진", category: "Operations", count: 7 },
];

const tasks = [
  "요구사항 정리 및 범위 정의",
  "기존 화면 분석",
  "레퍼런스 수집",
  "사용자 흐름 설계",
  "와이어프레임 작성",
  "주요 화면 디자인",
  "컴포넌트 상세 설계",
  "인터랙션 프로토타입",
  "접근성 검토",
  "개발 전달 및 리뷰",
  "사용성 테스트",
  "피드백 반영",
];

const statuses = ["완료", "진행 중", "검토 중", "예정"] as const;
const columns = "grid grid-cols-[76px_minmax(280px,1fr)_140px_140px_140px] items-center";
const cell = "min-w-0 px-5";

export default function NestedTablePage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());

  function toggleGroup(name: string) {
    setExpandedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  return (
    <TitledSection
      title="Nested table"
      subtitle="UI EXPERIMENT / 02"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 dark:text-neutral-400 pb-2">
        <p>※ 모든 내용은 가상의 데이터입니다.</p>
        <button
          type="button"
          onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-1.5 rounded px-2 py-1.5 hover:bg-neutral-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500 dark:hover:bg-neutral-800"
        >
          <FiArrowUp aria-hidden="true" />맨 위로
        </button>
      </div>

      <div
        ref={scrollRef}
        role="region"
        aria-label="프로젝트별 중첩 테이블 스크롤 영역"
        tabIndex={0}
        className="isolate h-[min(640px,70dvh)] min-h-80 overflow-auto overscroll-contain bg-white text-neutral-800 outline-offset-4 focus-visible:outline-2 focus-visible:outline-neutral-500 dark:bg-neutral-950 dark:text-neutral-200"
      >
        <div role="table" aria-label="프로젝트와 하위 작업" className="min-w-210 text-sm">
          {/* 부모 헤더(48px) 아래에 현재 그룹의 부모 행과 자식 헤더가 붙습니다. */}
          <div role="rowgroup" className="sticky top-0 z-30">
            <div
              role="row"
              className={`${columns} h-12 border-y border-neutral-300 bg-white text-xs font-semibold text-neutral-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-400`}
            >
              {["그룹", "프로젝트", "담당자", "분류", "하위 작업 수"].map((label) => (
                <div key={label} role="columnheader" className={cell}>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {groups.map((group, groupIndex) => (
            // 부모 행과 자식 헤더를 함께 고정해 그룹 끝에서 동시에 다음 그룹으로 교체합니다.
            <div key={group.name} role="rowgroup">
              <div className="sticky top-12 z-20">
                <div
                  role="row"
                  className={`${columns} h-16 border-y border-neutral-300 bg-white font-medium dark:border-neutral-700 dark:bg-neutral-950`}
                >
                  <div role="cell" className={`${cell} font-space-mono text-xs`}>
                    {String(groupIndex + 1).padStart(2, "0")}
                  </div>
                  <div role="rowheader" className={`${cell} font-semibold`}>
                    <button
                      type="button"
                      aria-expanded={expandedGroups.has(group.name)}
                      aria-controls={`nested-table-children-${groupIndex}`}
                      aria-label={`${group.name} 하위 작업 ${expandedGroups.has(group.name) ? "접기" : "열기"}`}
                      onClick={() => {
                        toggleGroup(group.name);
                      }}
                      className="flex w-full items-center gap-3 rounded py-2 text-left hover:text-neutral-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500"
                    >
                      {expandedGroups.has(group.name) ? (
                        <FiChevronDown aria-hidden="true" className="shrink-0" />
                      ) : (
                        <FiChevronRight aria-hidden="true" className="shrink-0" />
                      )}
                      <span>{group.name}</span>
                    </button>
                  </div>
                  <div role="cell" className={cell}>
                    {group.owner}
                  </div>
                  <div role="cell" className={`${cell} font-space-mono text-xs`}>
                    {group.category}
                  </div>
                  <div role="cell" className={`${cell} font-space-mono text-xs`}>
                    {group.count} tasks
                  </div>
                </div>

                {expandedGroups.has(group.name) && (
                  <div
                    role="row"
                    className={`${columns} h-12 border-b border-neutral-200 bg-neutral-100 text-xs font-medium text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400`}
                  >
                    {["번호", "하위 작업", "담당자", "상태", "마감일"].map((label) => (
                      <div key={label} role="columnheader" className={cell}>
                        {label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div id={`nested-table-children-${groupIndex}`}>
                {expandedGroups.has(group.name) &&
                  Array.from({ length: group.count }, (_, taskIndex) => {
                    const status = statuses[(groupIndex + taskIndex) % statuses.length];

                    return (
                      <div
                        key={taskIndex}
                        role="row"
                        className={`${columns} h-16 border-b border-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800`}
                      >
                        <div
                          role="cell"
                          className={`${cell} font-space-mono text-[11px] text-neutral-400`}
                        >
                          {groupIndex + 1}.{String(taskIndex + 1).padStart(2, "0")}
                        </div>
                        <div role="rowheader" className={`${cell} flex items-center gap-3`}>
                          <FiCornerDownRight
                            className="shrink-0 text-neutral-400"
                            aria-hidden="true"
                          />
                          <span>{tasks[taskIndex]}</span>
                        </div>
                        <div
                          role="cell"
                          className={`${cell} text-neutral-500 dark:text-neutral-400`}
                        >
                          {group.owner}
                        </div>
                        <div role="cell" className={`${cell} flex items-center gap-2 text-xs`}>
                          <span
                            aria-hidden="true"
                            className={`size-1.5 rounded-full ${status === "완료" ? "bg-emerald-500" : status === "진행 중" ? "bg-blue-500" : status === "검토 중" ? "bg-amber-500" : "bg-neutral-400"}`}
                          />
                          {status}
                        </div>
                        <div
                          role="cell"
                          className={`${cell} font-space-mono text-xs text-neutral-500 dark:text-neutral-400`}
                        >
                          2026.11.{String(taskIndex + groupIndex + 1).padStart(2, "0")}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </TitledSection>
  );
}
