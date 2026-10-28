import { pdf } from "@react-pdf/renderer";
import JSZip from "jszip";
import { BenchmarkDocument } from "./benchmark-document";

export const reports = [
  { id: "recording", label: "녹화 보고서" },
  { id: "grades", label: "개인 성적표" },
] as const;

export type BenchmarkOptions = {
  report: (typeof reports)[number]["id"];
  students: number;
  concurrency: number;
  compression: "STORE" | "DEFLATE";
};

export type BenchmarkResult = BenchmarkOptions & {
  pdfTime: number;
  zipTime: number;
  totalTime: number;
  pdfBytes: number;
  zipBytes: number;
};

export async function runBenchmark(
  options: BenchmarkOptions,
  onProgress: (label: string) => void,
): Promise<{ result: BenchmarkResult; blob: Blob }> {
  const start = performance.now();
  const title = reports.find((report) => report.id === options.report)?.label ?? "보고서";
  const zip = new JSZip();
  let pdfBytes = 0;
  let completed = 0;

  // 동시에 실행 중인 생성 작업 수를 제한합니다. 브라우저의 CPU 병렬 실행을 보장하지는 않습니다.
  for (let offset = 0; offset < options.students; offset += options.concurrency) {
    const blobs = await Promise.all(
      Array.from({ length: Math.min(options.concurrency, options.students - offset) }, (_, index) =>
        pdf(<BenchmarkDocument title={title} student={offset + index + 1} />).toBlob(),
      ),
    );
    for (const [index, blob] of blobs.entries()) {
      pdfBytes += blob.size;
      zip.file(`${options.report}-${String(offset + index + 1).padStart(3, "0")}.pdf`, blob);
      completed++;
    }
    onProgress(`PDF 생성 ${completed} / ${options.students}`);
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => {
        resolve();
      }),
    );
  }
  const pdfEnd = performance.now();
  const blob = await zip.generateAsync(
    { type: "blob", compression: options.compression, compressionOptions: { level: 3 } },
    ({ percent }) => {
      onProgress(`ZIP 생성 ${Math.round(percent)}%`);
    },
  );
  const end = performance.now();
  return {
    blob,
    result: {
      ...options,
      pdfTime: pdfEnd - start,
      zipTime: end - pdfEnd,
      totalTime: end - start,
      pdfBytes,
      zipBytes: blob.size,
    },
  };
}
