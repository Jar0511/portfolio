import type { Variants } from "motion";

type FadeOpenKey = "parent" | "child";
export const fadeOpenVariants = {
  parent: {
    open: {
      height: "auto",
      transition: {
        duration: 0.3,
        when: "beforeChildren",
      },
    },
    close: {
      height: 0,
      transition: {
        duration: 0.3,
        when: "afterChildren",
      },
    },
  },
  child: {
    open: {
      opacity: 1,
      transition: { duration: 0.2 },
    },
    close: {
      opacity: 0,
      transition: { duration: 0.2 },
    },
  },
} satisfies Record<FadeOpenKey, Variants>;
