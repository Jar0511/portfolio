import { motion, useAnimate } from "motion/react";
import { useState, type PropsWithChildren } from "react";
import { Loading, TextInput } from "./common-form-ui";
import { useFieldArray, useForm, type SubmitHandler } from "react-hook-form";
import { required } from "./common-form";
import { delay } from "@/helper/animate";

const StepTitle = ({ children }: PropsWithChildren) => (
  <div className="p-4">{children}</div>
);

const StepBody = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <motion.div layout="size" className={`${className ? className : ""} relative overflow-clip form1-wrapper h-48`}>
    {children}
  </motion.div>
)

const scenarioTypeMap = {
  a: "면담형",
  b: "실기형",
};

type Step1FormType = {
  scenario_nm: string;
  scenario_id: string;
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

type Step2FormType = {
  result: {
    skill_id: string;
    skill_name: string;
    questions: {
      question_id: string;
      idx: number;
      question_subject: string;
      answer: number;
      option_1: string;
      option_1_score: number;
      option_2: string;
      option_2_score: number;
      option_3: string;
      option_3_score: number;
      option_4: string;
      option_4_score: number;
      option_5: string;
      option_5_score: number;
      option_6: string;
      option_6_score: number;
    }[]
  }[]
}
const Step2Form = () => {
  const { register, control } = useForm<Step2FormType>({
    defaultValues: {
      result: [{ skill_id: "default", skill_name: "기타", questions: [] }]
    }
  })
  const { fields, append, remove } = useFieldArray({ control, name: "result" })

  const appendSkill = () => {
  }

  return (
    <form>
      <ul>
        {fields.map((skill, i) => (
          <li key={skill.id}>
            {skill.skill_id !== "default" && (
              <button type="button" onClick={() => { remove(i) }}>제거</button>
            )}
          </li>
        ))}
        <li>
          <button type="button">스킬 추가</button>
        </li>
      </ul>
    </form>
  )
}

export const ComplexForm = () => {
  const [scope, animate] = useAnimate();
  const [submitted, setSubmitted] = useState([false, false, false]);
  const [form1, setForm1] = useState<Step1FormType>();
  const [form2, setForm2] = useState<Step2FormType>();
  const [active, setActive] = useState(1);

  const firstSubmit = async (result: Step1FormType) => {
    await animate(".form1-loading-overlay", { top: 0 });
    await animate(".form1-loading-overlay", { opacity: 1 }, { duration: 0.3 });
    await delay(1500);
    await animate(".form1-loading-text", { opacity: 0 }, { duration: 0.3 });
    setForm1(result);
    setSubmitted([true, false, false]);
    await new Promise(requestAnimationFrame);
    await animate(".form1-wrapper", { height: "2.25rem" }, { duration: 0.3 });
    await animate(".form1-loading-overlay", { opacity: 0 }, { duration: 0.3 });
    await animate(".form1-loading-overlay", { top: "100%" });
    setActive(2)
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
            {submitted[0] ? <ReadOnlyStep1 step1={form1} /> : <Step1Form submit={firstSubmit} />}
            <Loading className="form1-loading-overlay" />
          </StepBody>
        </section>

        <section>
          <StepTitle>2. 평가 항목</StepTitle>
          <motion.div layout="size" className="relative overflow-clip">
            {form1 ? (submitted[1] ? <></> : <Step2Form />) : null}
          </motion.div>
        </section>

        <section>
          <StepTitle>3. 점수 산정 방식</StepTitle>
          <motion.div layout="size" className="relative overflow-clip">
            {form1 ? <></> : null}
          </motion.div>
        </section>
      </div>
    </div>
  );
};
