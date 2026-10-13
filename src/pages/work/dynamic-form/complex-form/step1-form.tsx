import { useForm } from "react-hook-form";
import type { Step1FormType } from "./type";
import { RadioBox, required, TextInput } from "@/common/form";
import { scenarioTypeMap } from "./constants";
import { useAtomValue } from "jotai";
import { Form1Atom } from "./atom";
import { motion } from "motion/react";

type Step1FormProps = {
  submit: (data: Step1FormType) => Promise<void>
}
export const Step1Form = ({ submit }: Step1FormProps) => {
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
        <div className="flex items-center gap-4">
          <RadioBox {...register("scenario_type")} value={"a"}>
            {scenarioTypeMap["a"]}
          </RadioBox>
          <RadioBox {...register("scenario_type")} value={"b"}>
            {scenarioTypeMap["b"]}
          </RadioBox>
        </div>
      </div>
      <button type="submit">저장</button>
    </form>
  )
}

export const ReadOnlyStep1 = () => {
  const step1 = useAtomValue(Form1Atom);
  return (
    <motion.p layout="position">
      {step1?.scenario_type ? (
        <span className="bg-pink-50">{scenarioTypeMap[step1.scenario_type]}</span>
      ) : (
        ""
      )}
      {step1?.scenario_nm}
    </motion.p>
  );
};