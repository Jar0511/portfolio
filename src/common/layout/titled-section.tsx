import type { PropsWithChildren } from "react"

type TitledSectionProps = PropsWithChildren<{
  title: string
  subtitle: string
}>

export const TitledSection = ({ children, title, subtitle }: TitledSectionProps) => {
  return (
    <section className="mx-auto max-w-7xl px-2 py-8 font-pretendard sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-col gap-1">
        <p className="font-space-mono text-xs tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
          {subtitle}
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      </div>
      {children}
    </section>
  )
}