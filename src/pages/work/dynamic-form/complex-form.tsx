import { motion, useAnimate } from "motion/react";
import { useState } from "react";
import { TextInput } from "./common-form-ui";
import { useForm } from "react-hook-form";
import { required } from "./common-form";

type Step1FormType = {
  scenario_nm: string;
  scenario_cd: string;
  scenario_type: "a" | "b";
  cutoff?: number;
}
type Step1FormProps = {
  submitted: boolean;
  submit: (result: Step1FormType) => Promise<void>
}
const Step1Form = ({ submitted, submit }: Step1FormProps) => {
  const {
    register,
    handleSubmit
  } = useForm<Step1FormType>({
    defaultValues: {
      scenario_type: "a"
    }
  })
  return (
    <form className="font-escoredream" onSubmit={handleSubmit(submit)}>
      <div className="p-4 bg-neutral-300 dark:bg-neutral-700">기초 정보</div>
      <motion.div layout className="relative">

        {submitted ? "내용 요약" : "폼 형식"}
        <div className="p-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span>시나리오 이름</span>
            <TextInput {...register("scenario_nm", { required })} />
          </label>
          <div className="flex flex-col gap-1">
            <span>시나리오 종류</span>
            <div className="flex items-center">
              <label>
                <input
                  type="radio"
                  {...register("scenario_type")}
                  value={"a"}
                />
                면접형
              </label>
              <label>
                <input
                  type="radio"
                  {...register("scenario_type")}
                  value={"b"}
                />
                실습형
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
        </div>

        <div className="form1-loading-overlay size-full absolute bg-green-50/10 top-full left-0"></div>
      </motion.div>
    </form>
  )
}

export const ComplexForm = () => {
  const [scope, animate] = useAnimate();
  const [submitted, setSubmitted] = useState(false);

  const firstSubmit = async (result: Step1FormType) => {
    await animate(".form1-loading-overlay", { opacity: 1 }, { duration: 0.3 })
  }
  return (
    <div ref={scope} className="rounded-lg border border-neutral-300 dark:border-neutral-700 relative overflow-clip">
      <Step1Form submitted={submitted} submit={firstSubmit} />
    </div>
  )
}