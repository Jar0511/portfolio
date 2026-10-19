import { useForm } from "react-hook-form";
import type { Step1FormType } from "./type";
import { RadioBox, required, TextInput } from "@/common/form";
import { scenarioTypeMap } from "./constants";
import { useAtomValue } from "jotai";
import { ActiveFormAtom, Form1Atom } from "./atom";
import { motion } from "motion/react";
import { StepBody, StepTitle, StepWrapper } from "./ui";
import { Loading } from "../common-form-ui";

type ActiveStep1FormProps = {
  submit: (data: Step1FormType) => Promise<void>;
};
const ActiveStep1Form = ({ submit }: ActiveStep1FormProps) => {
  const { register, handleSubmit } = useForm<Step1FormType>({
    defaultValues: {
      scenario_id: crypto.randomUUID(),
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
  );
};

const ReadOnlyStep1 = () => {
  const step1 = useAtomValue(Form1Atom);
  return (
    <motion.p layout="position" className="flex items-center gap-1 text-sm">
      {step1?.scenario_type ? (
        <span className="text-xs bg-blue-500 rounded-full py-1 px-2 text-white">
          {scenarioTypeMap[step1.scenario_type]}
        </span>
      ) : (
        ""
      )}
      {step1?.scenario_nm}
    </motion.p>
  );
};

type Step1FormProps = ActiveStep1FormProps;

export const Step1Form = ({ submit }: Step1FormProps) => {
  const active = useAtomValue(ActiveFormAtom);
  const is_active = active == 1;

  return (
    <StepWrapper>
      <StepTitle index={1} active={is_active} title="기초 정보">
        {is_active ? null : <ReadOnlyStep1 />}
      </StepTitle>
      <StepBody className="form1-wrapper h-48">
        {is_active ? <ActiveStep1Form submit={submit} /> : null}
        <Loading className="form1-loading-overlay" />
      </StepBody>
    </StepWrapper>
  )
}