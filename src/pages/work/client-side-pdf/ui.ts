export const panel =
  "border border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-950";
export const button =
  "inline-flex items-center justify-center gap-2 rounded border border-neutral-300 px-4 py-2 text-sm hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:hover:bg-neutral-800";
export const select =
  "mt-2 w-full rounded border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-700 dark:bg-neutral-950";

export function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
