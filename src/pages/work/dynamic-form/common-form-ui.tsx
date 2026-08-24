import type { ComponentProps } from "react";

export const TextInput = (props: ComponentProps<"input">) => {
  return (
    <input
      {...props}
      type="text"
      className="border border-neutral-400 focus:outline-neutral-600 rounded-sm"
    />
  );
};
