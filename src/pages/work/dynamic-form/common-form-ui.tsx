import type { ComponentProps } from "react";
import { VscLoading } from "react-icons/vsc";

export const TextInput = (props: ComponentProps<"input">) => {
  return (
    <input
      {...props}
      type="text"
      className="border border-neutral-400 focus:outline-neutral-600 rounded-sm"
    />
  );
};

export const Loading = ({ className }: { className?: string }) => (
  <div
    className={`${className ? className : ""} size-full absolute opacity-0 top-full left-0 bg-background/90 backdrop-blur-xs flex items-center justify-center`}
  >
    <div className="flex items-center gap-3 form1-loading-text">
      저장 중
      <VscLoading className="animate-spin" />
    </div>
  </div>
);
