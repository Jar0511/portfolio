import { motion, useAnimate } from "motion/react";
import { useState } from "react";
import { Loading, StepTitle, TextInput } from "./common-form-ui";
import { useForm, type SubmitHandler } from "react-hook-form";
import { required } from "./common-form";

const scenarioTypeMap = {
  a: "면담형",
  b: "실기형",
};

type Step1FormType = {
  scenario_nm: string;
  scenario_cd: string;
  scenario_type: "a" | "b";
};
type Step1FormProps = {
  submit: SubmitHandler<Step1FormType>;
};
const Step1Form = ({ submit }: Step1FormProps) => {
  const { register, handleSubmit } = useForm<Step1FormType>({
    defaultValues: {
      scenario_type: "a",
    },
  });
  return (
    <form className="p-4 flex flex-col gap-3" onSubmit={(e) => void handleSubmit(submit)(e)}>
      <label className="flex flex-col gap-1">
        <span>시나리오 이름</span>
        <TextInput {...register("scenario_nm", { required })} />
      </label>
      <div className="flex flex-col gap-1">
        <span>시나리오 종류</span>
        <div className="flex items-center">
          <label>
            <input type="radio" {...register("scenario_type")} value={"a"} />
            {scenarioTypeMap["a"]}
          </label>
          <label>
            <input type="radio" {...register("scenario_type")} value={"b"} />
            {scenarioTypeMap["b"]}
          </label>
        </div>
      </div>
      <button type="submit">저장</button>
    </form>
  );
};

const ReadOnlyStep1 = ({ step1 }: { step1?: Step1FormType }) => {
  return (
    <p>
      {step1?.scenario_type ? (
        <span className="bg-pink-50">{scenarioTypeMap[step1.scenario_type]}</span>
      ) : (
        ""
      )}
      {step1?.scenario_nm}
    </p>
  );
};

export const ComplexForm = () => {
  const [scope, animate] = useAnimate();
  const [submitted, setSubmitted] = useState(false);
  const [form1, setForm1] = useState<Step1FormType>();

  const firstSubmit = async (result: Step1FormType) => {
    await animate(".form1-loading-overlay", { top: 0 });
    await animate(".form1-loading-overlay", { opacity: 1 }, { duration: 0.3 });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await animate(".form1-loading-text", { opacity: 0 }, { duration: 0.3 });
    setForm1(result);
    setSubmitted(true);
    await new Promise(requestAnimationFrame);
    await animate(".form1-loading-overlay", { opacity: 0 }, { duration: 0.3 });
    await animate(".form1-loading-overlay", { top: "100%" });
  };
  return (
    <div
      ref={scope}
      className="rounded-lg border border-neutral-300 dark:border-neutral-700 relative overflow-clip"
    >
      <div className="font-escoredream">
        <StepTitle>1. 기초 정보</StepTitle>
        <motion.div layout className="relative overflow-clip">
          {submitted ? <ReadOnlyStep1 step1={form1} /> : <Step1Form submit={firstSubmit} />}
          <Loading className="form1-loading-overlay" />
        </motion.div>

        <StepTitle>2. 평가 항목</StepTitle>
        <motion.div layout className="relative overflow-clip">
          {form1 ? <></> : null}
        </motion.div>

        <StepTitle>3. 점수 산정 방식</StepTitle>
        <motion.div layout className="relative overflow-clip">
          {form1 ? <></> : null}
        </motion.div>
      </div>
    </div>
  );
};
