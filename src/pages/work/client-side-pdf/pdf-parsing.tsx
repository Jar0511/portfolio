import { useEffect, useRef, useState } from "react";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { FiFileText, FiLoader, FiTrash2, FiUpload } from "react-icons/fi";
import { PDFPageViewer } from "./pdf-page-viewer";
import { button, formatBytes, panel } from "./ui";

GlobalWorkerOptions.workerSrc = workerUrl;

export function PDFParsing() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [loadingLabel, setLoadingLabel] = useState("");
  const [extractionEnabled, setExtractionEnabled] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  function upload(files: File[]) {
    if (files.length !== 1) {
      setError("PDF 파일을 한 개씩 선택해 주세요.");
      return;
    }
    const next = files[0];
    if (!next.name.toLowerCase().endsWith(".pdf") && next.type !== "application/pdf") {
      setError("PDF 파일만 업로드할 수 있습니다.");
      return;
    }
    setDocument(null);
    setFile(next);
    setPage(1);
    setLoading(true);
    setProgress(0);
    setLoadingLabel("PDF 파일을 읽는 중…");
    setExtractionEnabled(false);
    setError("");
  }

  function removeFile() {
    setFile(null);
    setDocument(null);
    setPage(1);
    setLoading(false);
    setProgress(null);
    setExtractionEnabled(false);
    setError("");
  }

  useEffect(() => {
    if (!file) return;
    const lifecycle = new AbortController();
    const selectedFile = file;
    const reader = new FileReader();
    let task: ReturnType<typeof getDocument> | undefined;
    async function load() {
      try {
        const data = await new Promise<ArrayBuffer>((resolve, reject) => {
          reader.onprogress = ({ loaded, total, lengthComputable }) => {
            if (!lifecycle.signal.aborted && lengthComputable) {
              setProgress(Math.round((loaded / total) * 100));
            }
          };
          reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) resolve(reader.result);
            else reject(new Error("PDF 파일을 읽지 못했습니다."));
          };
          reader.onerror = () => {
            reject(reader.error ?? new Error("PDF 파일을 읽지 못했습니다."));
          };
          reader.onabort = () => {
            reject(new DOMException("파일 읽기를 취소했습니다.", "AbortError"));
          };
          reader.readAsArrayBuffer(selectedFile);
        });
        lifecycle.signal.throwIfAborted();
        setProgress(null);
        setLoadingLabel("PDF 문서와 미리보기를 준비하는 중…");
        const assets = `${import.meta.env.BASE_URL}pdfjs/`;
        task = getDocument({
          data,
          cMapUrl: `${assets}cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `${assets}standard_fonts/`,
          wasmUrl: `${assets}wasm/`,
        });
        const pdfDocument = await task.promise;
        lifecycle.signal.throwIfAborted();
        setDocument(pdfDocument);
        setLoading(false);
      } catch (cause) {
        if (lifecycle.signal.aborted) return;
        setLoading(false);
        setError(
          cause instanceof Error && cause.name === "PasswordException"
            ? "암호로 보호된 PDF는 지원하지 않습니다. 암호를 해제한 파일을 선택해 주세요."
            : "PDF를 열 수 없습니다. 파일이 손상되었거나 지원하지 않는 형식입니다.",
        );
      }
    }
    void load();
    return () => {
      lifecycle.abort();
      if (reader.readyState === FileReader.LOADING) reader.abort();
      void task?.destroy();
    };
  }, [file]);

  return (
    <div className="space-y-5">
      <input
        ref={input}
        type="file"
        accept=".pdf,application/pdf"
        className="sr-only"
        tabIndex={-1}
        aria-label="PDF 파일 선택"
        onChange={(event) => {
          if (event.target.files?.length) upload(Array.from(event.target.files));
          event.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepth.current++;
          setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (--dragDepth.current <= 0) {
            dragDepth.current = 0;
            setDragging(false);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          upload(Array.from(event.dataTransfer.files));
        }}
        className={`flex w-full flex-col items-center gap-3 border-2 border-dashed p-8 text-center focus-visible:outline-2 focus-visible:outline-offset-2 ${dragging ? "border-neutral-700 bg-neutral-200 dark:border-neutral-200 dark:bg-neutral-800" : "border-neutral-300 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"}`}
      >
        <FiUpload className="size-6" aria-hidden="true" />
        <span className="font-medium">클릭하거나 PDF 파일을 이곳에 끌어 놓으세요</span>
        <span className="text-xs text-neutral-500">
          파일은 서버에 업로드되지 않고 브라우저에서 처리됩니다.
        </span>
      </button>
      {file && (
        <div className={`${panel} flex flex-wrap items-center gap-4 p-4`}>
          <FiFileText className="size-6 shrink-0 text-neutral-500" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="break-all font-medium">{file.name}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {formatBytes(file.size)}
              {document && ` · ${document.numPages}페이지`}
              {document && !extractionEnabled && " · 텍스트 추출 대기"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={button} onClick={() => input.current?.click()}>
              파일 변경
            </button>
            <button type="button" className={button} onClick={removeFile}>
              <FiTrash2 aria-hidden="true" />
              삭제
            </button>
            <button
              type="button"
              className={button}
              disabled={loading || !document || extractionEnabled}
              onClick={() => {
                setExtractionEnabled(true);
              }}
            >
              텍스트 추출
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {loading && (
        <div role="status" aria-live="polite" className={`${panel} space-y-3 p-5`}>
          <p className="flex items-center gap-2">
            <FiLoader
              aria-hidden="true"
              className="size-4 animate-spin motion-reduce:animate-none"
            />
            {loadingLabel}
            {progress !== null && ` ${progress}%`}
          </p>
          <progress
            aria-label="PDF 로딩 진행도"
            value={progress ?? undefined}
            max={100}
            className="h-2 w-full accent-neutral-700 dark:accent-neutral-300"
          />
        </div>
      )}
      {document ? (
        <PDFPageViewer
          document={document}
          pageNumber={page}
          extractionEnabled={extractionEnabled}
          onPageChange={setPage}
        />
      ) : (
        !loading && (
          <div className={`${panel} grid min-h-96 md:grid-cols-2`}>
            <div className="flex items-center justify-center border-b border-neutral-200 p-8 text-neutral-500 md:border-r md:border-b-0 dark:border-neutral-800">
              PDF 미리보기
            </div>
            <div className="flex items-center justify-center p-8 text-neutral-500">
              페이지에서 추출한 텍스트
            </div>
          </div>
        )
      )}
      <p className="text-xs text-neutral-500">
        텍스트 레이어가 있는 PDF를 지원합니다. 스캔한 이미지의 문자 인식(OCR)은 포함되지 않으며,
        추출 순서는 PDF 내부 구조에 따라 달라질 수 있습니다.
      </p>
    </div>
  );
}
