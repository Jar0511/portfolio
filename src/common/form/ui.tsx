import type { ComponentProps, PropsWithChildren } from "react";

export const TextInput = (props: Omit<ComponentProps<"input">, "type">) => {
  return (
    <input
      {...props}
      type="text"
      className="border p-1 border-neutral-400 invalid:border-red-500 focus:border-neutral-600 focus:outline-0 rounded-sm"
    />
  );
};

type RadioBoxProps = Omit<ComponentProps<"input">, "type"> &
  PropsWithChildren &
{
  /** inline/block 요소 */
  inline?: boolean; gap?: number | string
}

export const RadioBox = ({ inline, children, gap = "0.4em", ...props }: RadioBoxProps) => {
  return (
    <label
      className={`${inline ? 'inline-flex' : 'flex'} items-center has-not-disabled:cursor-pointer`}
      style={{ columnGap: gap }}
    >
      <input
        {...props}
        type="radio"
        className="hidden peer"
      />
      <span
        className="rounded-full size-[1em] peer-checked:bg-red-700 bg-background border-background border-[0.25em] outline-1 outline-neutral-400 transition-colors"
      />
      {children}
    </label>
  )
}