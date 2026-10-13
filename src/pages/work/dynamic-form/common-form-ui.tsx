import { VscLoading } from "react-icons/vsc";

export const Loading = ({ className }: { className?: string }) => (
  <div
    className={`${className ? className : ""} pointer-events-none size-full absolute opacity-0 top-full left-0 bg-background/90 backdrop-blur-xs flex items-center justify-center`}
  >
    <div
      className={`flex items-center gap-3 ${className?.replace("loading-overlay", "loading-text") ?? ""}`}
    >
      저장 중
      <VscLoading className="animate-spin" />
    </div>
  </div>
);
