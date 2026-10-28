import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { FiCheck, FiChevronLeft, FiChevronRight, FiCopy } from "react-icons/fi";
import { button, panel } from "../ui";

type Props = {
  document: PDFDocumentProxy;
  pageNumber: number;
  extractionEnabled: boolean;
  onPageChange: (page: number) => void;
};

export function PDFPageViewer({ document, pageNumber, extractionEnabled, onPageChange }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [view, setView] = useState<{
    document: PDFDocumentProxy;
    page: number;
    extractionEnabled: boolean;
    text: string;
    error: string;
  } | null>(null);
  const [phase, setPhase] = useState({ page: 0, step: 0 });
  const [copy, setCopy] = useState({ page: 0, message: "" });
  const current =
    view?.document === document &&
      view.page === pageNumber &&
      view.extractionEnabled === extractionEnabled
      ? view
      : null;

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(1, Math.floor(entry.contentRect.width - 32)));
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!width) return;
    const lifecycle = new AbortController();
    let renderTask: RenderTask | undefined;
    async function render() {
      try {
        const page = await document.getPage(pageNumber);
        lifecycle.signal.throwIfAborted();
        setPhase({ page: pageNumber, step: 1 });
        let text = "";
        if (extractionEnabled) {
          const content = await page.getTextContent();
          lifecycle.signal.throwIfAborted();
          text = content.items
            .map((item) => ("str" in item ? item.str + (item.hasEOL ? "\n" : " ") : ""))
            .join("")
            .trim();
        }
        setPhase({ page: pageNumber, step: 2 });
        // 취소된 작업과 canvas가 충돌하지 않도록 임시 canvas에서 렌더링합니다.
        const buffer = window.document.createElement("canvas");
        const scale = Math.min(width / page.getViewport({ scale: 1 }).width, 2);
        const viewport = page.getViewport({ scale });
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        buffer.width = Math.ceil(viewport.width * ratio);
        buffer.height = Math.ceil(viewport.height * ratio);
        renderTask = page.render({
          canvas: buffer,
          viewport,
          transform: ratio === 1 ? undefined : [ratio, 0, 0, ratio, 0, 0],
        });
        await renderTask.promise;
        lifecycle.signal.throwIfAborted();
        if (!canvas.current) return;
        const target = canvas.current;
        target.width = buffer.width;
        target.height = buffer.height;
        target.style.width = `${viewport.width}px`;
        target.style.height = `${viewport.height}px`;
        target.getContext("2d")?.drawImage(buffer, 0, 0);
        setView({ document, page: pageNumber, extractionEnabled, text, error: "" });
        setPhase({ page: pageNumber, step: 3 });
      } catch {
        if (!lifecycle.signal.aborted)
          setView({
            document,
            page: pageNumber,
            extractionEnabled,
            text: "",
            error: "페이지를 처리하지 못했습니다. 다른 페이지나 PDF 파일을 선택해 주세요.",
          });
      }
    }
    void render();
    return () => {
      lifecycle.abort();
      renderTask?.cancel();
    };
  }, [document, pageNumber, width, extractionEnabled]);

  async function copyText() {
    if (!current?.text) return;
    try {
      await navigator.clipboard.writeText(current.text);
      setCopy({ page: pageNumber, message: "복사 완료" });
    } catch {
      setCopy({
        page: pageNumber,
        message: "복사하지 못했습니다. 텍스트를 선택해 직접 복사해 주세요.",
      });
    }
  }

  return (
    <div className="space-y-4">
      {!current && (
        <div role="status" className="space-y-2">
          <p>{extractionEnabled ? "텍스트 추출 및 미리보기 처리 중…" : "PDF 미리보기 처리 중…"}</p>
          <progress
            aria-label="페이지 처리 진행도"
            value={phase.page === pageNumber ? phase.step : 0}
            max={3}
            className="h-2 w-full"
          />
        </div>
      )}
      {current?.error && (
        <p role="alert" className="text-red-600 dark:text-red-400">
          {current.error}
        </p>
      )}
      <div className={`${panel} grid min-w-0 md:grid-cols-2`} aria-busy={!current}>
        <section
          className="min-w-0 border-b border-neutral-200 md:border-r md:border-b-0 dark:border-neutral-800"
          aria-label="PDF 미리보기"
        >
          <h2 className="border-b border-neutral-200 px-4 py-3 font-medium dark:border-neutral-800">
            미리보기 <span className="ml-2 text-xs text-neutral-500">{pageNumber} 페이지</span>
          </h2>
          <div
            ref={container}
            className="flex h-[65vh] min-h-80 items-center justify-center overflow-auto bg-neutral-100 p-4 dark:bg-neutral-900"
          >
            <canvas
              ref={canvas}
              aria-label={`${pageNumber}페이지 PDF 미리보기`}
              className={`h-fit max-w-full shrink-0 shadow-sm ${current && !current.error ? "" : "invisible"}`}
            />
          </div>
        </section>
        <section className="min-w-0" aria-label="추출된 텍스트">
          <div className="flex min-h-12 items-center justify-between gap-2 border-b border-neutral-200 px-4 py-2 dark:border-neutral-800">
            <h2 className="font-medium">추출된 텍스트</h2>
            <button
              type="button"
              onClick={() => {
                void copyText();
              }}
              disabled={!current?.text}
              className={`${button} px-2 py-1`}
            >
              {copy.page === pageNumber && copy.message === "복사 완료" ? (
                <FiCheck aria-hidden="true" />
              ) : (
                <FiCopy aria-hidden="true" />
              )}
              복사
            </button>
          </div>
          <div className="h-[65vh] min-h-80 overflow-auto p-5">
            <pre className="whitespace-pre-wrap break-words font-pretendard text-sm leading-7">
              {!extractionEnabled
                ? "텍스트 추출 버튼을 누르면 이 페이지의 텍스트가 표시됩니다."
                : current
                  ? current.error ||
                  current.text ||
                  "추출할 수 있는 텍스트가 없습니다. 이미지로 된 PDF에는 OCR이 필요합니다."
                  : "텍스트 추출 중…"}
            </pre>
          </div>
        </section>
      </div>
      <p role="status" className="text-center text-xs text-neutral-500">
        {copy.page === pageNumber ? copy.message : ""}
      </p>
      <nav
        aria-label="PDF 페이지 이동"
        className="flex flex-wrap items-center justify-center gap-4"
      >
        <button
          type="button"
          aria-label="이전 페이지"
          disabled={pageNumber <= 1}
          className={button}
          onClick={() => {
            onPageChange(pageNumber - 1);
          }}
        >
          <FiChevronLeft aria-hidden="true" />
          이전
        </button>
        <label className="flex items-center gap-2">
          <span className="sr-only">페이지 선택</span>
          <select
            className="max-w-28 rounded border border-neutral-300 bg-white p-2 dark:border-neutral-700 dark:bg-neutral-950"
            value={pageNumber}
            onChange={(event) => {
              onPageChange(Number(event.target.value));
            }}
          >
            {Array.from({ length: document.numPages }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
          <span>/ {document.numPages}</span>
        </label>
        <button
          type="button"
          aria-label="다음 페이지"
          disabled={pageNumber >= document.numPages}
          className={button}
          onClick={() => {
            onPageChange(pageNumber + 1);
          }}
        >
          다음
          <FiChevronRight aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}
