import { useEffect, useRef, useState } from "react";
import { FiDownload, FiFileText } from "react-icons/fi";
import { reports, runBenchmark } from "./benchmark";
import type { BenchmarkOptions, BenchmarkResult } from "./benchmark";
import { button, formatBytes, panel, select } from "../ui";

export function PDFGeneration() {
  const [options, setOptions] = useState<BenchmarkOptions>({
    report: "recording",
    students: 10,
    concurrency: 1,
    compression: "STORE",
  });
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState<BenchmarkResult[]>([]);
  const [download, setDownload] = useState<{ url: string; filename: string } | null>(null);
  const busy = useRef(false);
  useEffect(
    () => () => {
      if (download) URL.revokeObjectURL(download.url);
    },
    [download],
  );

  async function execute() {
    if (busy.current) return;
    busy.current = true;
    setRunning(true);
    setError("");
    setStatus("PDF 생성 준비 중…");
    try {
      const { result, blob } = await runBenchmark(options, setStatus);
      const url = URL.createObjectURL(blob);
      const filename = `${options.report}-${options.students}-students.zip`;
      setDownload({ url, filename });
      setResults((previous) => [result, ...previous].slice(0, 10));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      setStatus("생성 완료 · ZIP 다운로드를 요청했습니다.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "PDF 생성 중 오류가 발생했습니다.");
      setStatus("");
    } finally {
      busy.current = false;
      setRunning(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className={panel}>
        <fieldset
          disabled={running}
          className="flex flex-wrap gap-2 border-b border-neutral-200 p-3 dark:border-neutral-800"
        >
          <legend className="sr-only">보고서 양식</legend>
          {reports.map((report) => (
            <button
              key={report.id}
              type="button"
              aria-pressed={options.report === report.id}
              onClick={() => {
                setOptions({ ...options, report: report.id });
              }}
              className={`${button} aria-pressed:bg-neutral-900 aria-pressed:text-white aria-pressed:hover:bg-neutral-800 dark:aria-pressed:bg-neutral-100 dark:aria-pressed:text-neutral-900 dark:aria-pressed:hover:bg-neutral-200`}
            >
              {report.label}
            </button>
          ))}
        </fieldset>
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 bg-neutral-50 p-8 text-center dark:bg-neutral-900/50">
          <FiFileText className="size-8 text-neutral-400" aria-hidden="true" />
          <h2 className="font-semibold">
            {reports.find((report) => report.id === options.report)?.label} 미리보기
          </h2>
          <p className="text-neutral-500">보고서 양식이 들어갈 영역입니다.</p>
          <p className="text-xs text-neutral-500">
            현재 다운로드는 Pretendard를 적용한 학생별 1페이지 임시 PDF로 측정합니다.
          </p>
        </div>
      </div>
      <form
        className={`${panel} p-5`}
        onSubmit={(event) => {
          event.preventDefault();
          void execute();
        }}
      >
        <h2 className="font-semibold">다운로드 벤치마크</h2>
        <fieldset disabled={running} className="mt-4 grid gap-4 sm:grid-cols-3">
          <legend className="sr-only">벤치마크 설정</legend>
          <label>
            학생 수
            <select
              aria-label="학생 수"
              className={select}
              value={options.students}
              onChange={(event) => {
                setOptions({ ...options, students: Number(event.target.value) });
              }}
            >
              {[10, 50, 100, 200].map((count) => (
                <option key={count} value={count}>
                  {count}명
                </option>
              ))}
            </select>
          </label>
          <label>
            동시 처리
            <select
              aria-label="동시 처리"
              className={select}
              value={options.concurrency}
              onChange={(event) => {
                setOptions({ ...options, concurrency: Number(event.target.value) });
              }}
            >
              <option value={1}>1개 (직렬)</option>
              <option value={5}>5개 (병렬)</option>
            </select>
          </label>
          <label>
            압축 방식
            <select
              aria-label="압축 방식"
              className={select}
              value={options.compression}
              onChange={(event) => {
                setOptions({
                  ...options,
                  compression: event.target.value === "STORE" ? "STORE" : "DEFLATE",
                });
              }}
            >
              <option value="STORE">STORE (무압축)</option>
              <option value="DEFLATE">DEFLATE 3</option>
            </select>
          </label>
        </fieldset>
        <p className="mt-3 text-xs text-neutral-500">
          동시 처리는 진행 중인 생성 작업 수입니다. 첫 실행 시간에는 폰트 로딩이 포함되며, 총 시간은
          ZIP 생성 완료까지 측정합니다.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={running} className={button}>
            <FiDownload aria-hidden="true" />
            {running ? "생성 중…" : "실행 및 ZIP 다운로드"}
          </button>
          {download && (
            <a
              className="underline underline-offset-4"
              href={download.url}
              download={download.filename}
            >
              최근 ZIP 다시 다운로드
            </a>
          )}
          <p role="status" className="text-xs text-neutral-500">
            {status}
          </p>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </form>
      <section className={`${panel} p-5`} aria-label="벤치마크 결과">
        <h2 className="font-semibold">
          실행 로그 <span className="ml-2 text-xs font-normal text-neutral-500">최근 10회</span>
        </h2>
        {results.length === 0 ? (
          <p className="py-10 text-center text-neutral-500">
            실행 후 생성 시간과 파일 크기가 표시됩니다.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-190 text-left text-xs tabular-nums">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 dark:border-neutral-800">
                  {["설정", "PDF 생성", "ZIP 생성", "총 시간", "PDF 합계", "ZIP 크기"].map(
                    (label) => (
                      <th key={label} className="px-3 py-3 font-medium">
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="px-3 py-3">
                      {reports.find((report) => report.id === result.report)?.label}
                      <br />
                      {result.students}명 · 동시 {result.concurrency}개 ·{" "}
                      {result.compression === "STORE" ? "STORE" : "DEFLATE 3"}
                    </td>
                    {[result.pdfTime, result.zipTime, result.totalTime].map((time, timeIndex) => (
                      <td key={timeIndex} className="px-3 py-3">
                        {(time / 1000).toFixed(3)} s
                      </td>
                    ))}
                    <td className="px-3 py-3">{formatBytes(result.pdfBytes)}</td>
                    <td className="px-3 py-3">{formatBytes(result.zipBytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
