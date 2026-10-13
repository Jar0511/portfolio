import { motion, useAnimate } from "motion/react";
import { useState, type PropsWithChildren } from "react";
import { Loading } from "../common-form-ui";
import { delay } from "@/helper/animate";
import { ReadOnlyStep1, Step1Form } from "./step1-form";
import { ReadOnlyStep2, Step2Form } from "./step2-form";
import type { Step1FormType, Step2FormType, Step3FormType } from "./type";
import { useSetAtom } from "jotai";
import { Form1Atom, Form2Atom, Form3Atom } from "./atom";

const StepTitle = ({ children }: PropsWithChildren) => <div className="p-4">{children}</div>;

const StepBody = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <motion.div layout="size" className={`${className ? className : ""} relative`}>
    {children}
  </motion.div>
);

export const ComplexForm = () => {
  const [scope, animate] = useAnimate();
  const setForm1 = useSetAtom(Form1Atom);
  const setForm2 = useSetAtom(Form2Atom);
  const setForm3 = useSetAtom(Form3Atom);
  const [active, setActive] = useState(1);

  const loading = async (idx: number, targetHeight?: string) => {
    const prefix = `.form${idx}-`;
    const wrapper = prefix + "wrapper";
    const overlay = prefix + "loading-overlay";
    const text = prefix + "loading-text";

    if (!targetHeight) {
      await animate(overlay, { top: 0 });
      await animate(overlay, { opacity: 1 }, { duration: 0.3 });
      await animate(text, { opacity: 1 }, { duration: 0 });
      await delay(1000);
      await animate(text, { opacity: 0 }, { duration: 0.3 });
    } else {
      await new Promise(requestAnimationFrame);
      await animate(wrapper, { height: targetHeight }, { duration: 0.3 });
      await animate(overlay, { opacity: 0 }, { duration: 0.3 });
      await animate(overlay, { top: "100%" });
    }
  };

  const submit = async (result: Step1FormType | Step2FormType | Step3FormType) => {
    if ("scenario_id" in result) {
      // step1
      await loading(1);
      setForm1(result);
      await loading(1, "2.25rem");
      setActive(2);
    } else if ("result" in result) {
      // step2
      await loading(2);
      setForm2(result);
      setActive(3);
      await loading(2, "auto");
    } else {
      // step3
      await loading(3);
      setForm3(result);
    }
  };

  return (
    <div
      ref={scope}
      className="rounded-lg relative overflow-clip bg-amber-100 border border-form-line"
    >
      <div className="font-escoredream">
        <section>
          <StepTitle>1. 기초 정보</StepTitle>
          <StepBody className="form1-wrapper h-48">
            {active == 1 ? <Step1Form submit={submit} /> : <ReadOnlyStep1 />}
            <Loading className="form1-loading-overlay" />
          </StepBody>
        </section>

        <section>
          <StepTitle>2. 평가 항목</StepTitle>
          <StepBody className="form2-wrapper">
            {active == 2 ? <Step2Form submit={submit} /> : <ReadOnlyStep2 />}
            <Loading className="form2-loading-overlay" />
          </StepBody>
        </section>

        <section>
          <StepTitle>3. 점수 산정 방식</StepTitle>
          <motion.div layout="size" className="relative overflow-clip">
            {active == 3 ? <></> : null}
          </motion.div>
        </section>
      </div>
    </div>
  );
};
