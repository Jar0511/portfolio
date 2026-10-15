import { motion } from "motion/react";
import { type PropsWithChildren } from "react";
import { MdCheck, MdLockOutline } from "react-icons/md";

export const StepTitle = ({ children, active, locked, index }: PropsWithChildren<{ active?: boolean; locked?: boolean, index: number }>) => {
  return (
    <div className="px-4">
      <div className={`gap-2 py-4 flex items-center ${index != 3 ? 'border-b dark:border-b-form-line/40 border-b-form-line/15' : ''}`}>
        <span
          className={`font-space-mono rounded-lg self-stretch p-2 inline-flex items-center justify-center ${active ? 'bg-form-line text-background' : 'bg-stone-500/20 text-form-line'}`}
          title={`${index}단계${locked ? ': 대기중' : active ? '' : ': 완료'}`}
        >
          {active ? `0${index}` : locked ? <MdLockOutline /> : <MdCheck />}
        </span>
        {children}
      </div>
    </div>
  )
};

export const StepBody = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <motion.div layout="size" className={`${className ? className : ""} relative`}>
    {children}
  </motion.div>
);

export const StepWrapper = ({ children }: PropsWithChildren) => {
  return (
    <section className="not-last:border-b">
      {children}
    </section>
  )
}