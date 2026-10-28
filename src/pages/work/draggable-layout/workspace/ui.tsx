import type { ComponentPropsWithRef, ReactNode } from "react";

type ButtonProps = ComponentPropsWithRef<"button"> & {
  primary?: boolean;
  selected?: boolean;
  pill?: boolean;
};
export function Button({
  className = "px-3 py-2",
  primary = false,
  selected = false,
  pill = false,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`${pill ? "rounded-[999px]" : "rounded-md"} border font-medium disabled:cursor-not-allowed disabled:opacity-[0.42] ${
        primary
          ? "border-(--room-accent) bg-(--room-accent) text-(--room-panel) enabled:hover:brightness-[1.15]"
          : selected
            ? "border-(--room-accent) bg-(--room-surface) shadow-[inset_0_0_0_1px_var(--room-accent)] enabled:hover:border-(--room-accent) enabled:hover:bg-(--room-surface)"
            : "border-(--room-line) bg-(--room-panel) enabled:hover:border-(--room-accent) enabled:hover:bg-(--room-surface)"
      } ${className}`}
    />
  );
}

type WidgetFrameProps = ComponentPropsWithRef<"section"> & {
  title: string;
  editing: boolean;
  headerActions?: ReactNode;
  onRemove?: () => void;
  bodyClassName?: string;
};
export function WidgetFrame({
  title,
  editing,
  headerActions,
  onRemove,
  bodyClassName = "overflow-auto p-3 min-[521px]:p-4",
  className = "",
  children,
  ...props
}: WidgetFrameProps) {
  // RGL injects ref, style, pointer handlers and the resize handle into its child.
  return (
    <section
      {...props}
      aria-label={title}
      className={`workspace-widget flex flex-col overflow-hidden rounded-[10px] border border-(--room-line) bg-(--room-panel) ${editing ? "border-dashed" : ""} ${className}`}
    >
      <header
        className={`widget-header flex flex-[0_0_46px] items-center justify-between gap-1.5 border-b border-(--room-line) bg-(--room-surface) px-3 min-[521px]:px-4 ${editing ? "touch-none cursor-grab active:cursor-grabbing" : ""}`}
      >
        <h2 className="flex min-w-0 items-center gap-[7px] font-[650]">
          {editing && (
            <span className="text-[19px] text-(--room-muted)" aria-hidden="true">
              ⠿
            </span>
          )}
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {headerActions}
          {editing && onRemove && (
            <Button
              className="remove-widget size-[26px] p-0 text-xl leading-none"
              aria-label={`${title} 위젯 삭제`}
              onClick={onRemove}
            >
              ×
            </Button>
          )}
        </div>
      </header>
      <div className={`widget-body min-h-0 min-w-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
