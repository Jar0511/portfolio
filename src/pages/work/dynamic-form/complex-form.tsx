import { motion, useAnimate } from "motion/react";
import { useState } from "react";
import { TextInput } from "./common-form-ui";
import { useForm, type SubmitHandler } from "react-hook-form";
import { required } from "./common-form";
import { VscLoading } from "react-icons/vsc";

const scenarioTypeMap = {
  a: "면담형",
  b: "실기형",
};

type Step1FormType = {
  scenario_nm: string;
  scenario_cd: string;
  scenario_type: "a" | "b";
  cutoff?: number;
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
      <label className="flex flex-col gap-1">
        <span>컷오프(선택)</span>
        <div className="flex">
          <TextInput {...register("cutoff")} />
          <span>점</span>
        </div>
      </label>
      <button type="submit">저장</button>
    </form>
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
        <div className="p-4 bg-neutral-300 dark:bg-neutral-700">기초 정보</div>
        <motion.div layout className="relative">
          {submitted ? (
            <div>
              <p>
                {form1?.scenario_type ? (
                  <span className="bg-pink-50">{scenarioTypeMap[form1.scenario_type]}</span>
                ) : (
                  ""
                )}
                {form1?.scenario_nm}
              </p>
            </div>
          ) : (
            <Step1Form submit={firstSubmit} />
          )}

          <div className="form1-loading-overlay size-full absolute opacity-0 top-full left-0 bg-background/90 backdrop-blur-xs flex items-center justify-center">
            <div className="flex items-center gap-3 form1-loading-text">
              저장 중
              <VscLoading className="animate-spin" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
