import { useRef, useState } from "react";
import { PDFGeneration } from "./pdf-generation";
import { PDFParsing } from "./pdf-parsing";

const tabs = ["PDF 생성", "PDF 파싱"] as const;

export function Workspace() {
  const [activeTab, setActiveTab] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  return (
    <div className="space-y-6 text-sm text-neutral-800 dark:text-neutral-200">
      <div
        role="tablist"
        aria-label="PDF 기능"
        className="flex border-b border-neutral-300 dark:border-neutral-700"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            id={`pdf-tab-${index}`}
            role="tab"
            aria-selected={activeTab === index}
            aria-controls={`pdf-panel-${index}`}
            tabIndex={activeTab === index ? 0 : -1}
            onClick={() => {
              setActiveTab(index);
            }}
            onKeyDown={(event) => {
              let next: number;
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") next = 1 - activeTab;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = 1;
              else return;
              event.preventDefault();
              setActiveTab(next);
              buttons.current[next]?.focus();
            }}
            className={`border-b-2 px-6 py-3 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 ${activeTab === index ? "border-current" : "border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"}`}
          >
            {tab}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="pdf-panel-0" aria-labelledby="pdf-tab-0" hidden={activeTab !== 0}>
        <PDFGeneration />
      </div>
      <div role="tabpanel" id="pdf-panel-1" aria-labelledby="pdf-tab-1" hidden={activeTab !== 1}>
        <PDFParsing />
      </div>
    </div>
  );
}
