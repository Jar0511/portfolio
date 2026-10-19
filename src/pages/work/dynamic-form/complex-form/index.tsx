import { useAnimate } from "motion/react";
import { Step1Form } from "./step1-form";
import type { Step1FormType, Step2FormType, Step3FormType } from "./type";
import { useSetAtom } from "jotai";
import { ActiveFormAtom, Form1Atom, Form2Atom, Form3Atom } from "./atom";
import { Step2Form } from "./step2-form";
import { delay } from "@/common/animation";
import { Step3Form } from "./step3-form";

export const ComplexForm = () => {
  const [scope, animate] = useAnimate();
  const setForm1 = useSetAtom(Form1Atom);
  const setForm2 = useSetAtom(Form2Atom);
  const setForm3 = useSetAtom(Form3Atom);
  const setActive = useSetAtom(ActiveFormAtom);

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
      setActive(2);
      await loading(1, "0");
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
      setActive(4);
      await loading(3, "auto");
    }
  };

  return (
    <div
      ref={scope}
      className="rounded-lg relative overflow-clip border border-form-line"
    >
      <div className="font-escoredream">
        <Step1Form submit={submit} />
        <Step2Form submit={submit} />
        <Step3Form submit={submit} />
      </div>
    </div>
  );
};
