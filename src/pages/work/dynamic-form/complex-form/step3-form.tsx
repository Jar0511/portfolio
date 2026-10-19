import { useAtomValue } from "jotai";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { RadioBox } from "@/common/form";
import { ActiveFormAtom, Form2Atom, Form3Atom } from "./atom";
import type { Step2FormType, Step3FormType } from "./type";
import { StepBody, StepTitle, StepWrapper } from "./ui";
import { Loading } from "../common-form-ui";

const optionNumbers = [1, 2, 3, 4, 5, 6] as const;
const inputClass =
  "w-28 rounded border border-neutral-400 bg-white/80 p-1 disabled:bg-neutral-100 disabled:text-neutral-500";
type SkillScore = { skill_id: string; skill_name: string; maximum: number; eligible: boolean };

const getSkillScores = (result: Step2FormType["result"]): SkillScore[] =>
  result.map((skill) => {
    const maximum = skill.questions.reduce(
      (sum, question) =>
        sum +
        Math.max(
          ...optionNumbers
            .slice(0, question.option_count)
            .map((number) => question[`option_${number}_score`]),
        ),
      0,
    );
    return {
      skill_id: skill.skill_id,
      skill_name: skill.skill_name,
      maximum,
      eligible: skill.questions.length > 0 && maximum > 0,
    };
  });

// Calculate in hundredths of a percent so rounding never changes the total.
const distributeRatio = (skills: SkillScore[]): NonNullable<Step3FormType["skill_ratio"]> => {
  const count = skills.filter((skill) => skill.eligible).length;
  let remaining = count ? 10000 % count : 0;
  return skills.map((skill) => {
    const extra = skill.eligible && remaining > 0 ? 1 : 0;
    remaining -= extra;
    return {
      skill_id: skill.skill_id,
      percent: skill.eligible ? (Math.floor(10000 / count) + extra) / 100 : 0,
    };
  });
};

const ReadOnlyStep3 = () => {
  const step2 = useAtomValue(Form2Atom);
  const step3 = useAtomValue(Form3Atom);
  if (!step3) return null;

  const skills = getSkillScores(step2?.result ?? []);
  const rawMaximum = skills.reduce((sum, skill) => sum + skill.maximum, 0);
  const maximum = step3.cutoff.type === "convt" ? 100 : rawMaximum;

  return (
    <div className="flex flex-col gap-4 p-4">
      <section className="rounded border border-neutral-300 bg-white/40 p-3">
        <h3 className="mb-3 font-bold">컷오프</h3>
        <p>
          {step3.cutoff.type === "raw" ? "원점수 기준" : "100점 환산 기준"}: {step3.cutoff.value}점
          / {maximum}점
        </p>
      </section>
      <section className="rounded border border-neutral-300 bg-white/40 p-3">
        <h3 className="mb-3 font-bold">스킬별 성적 반영 비율</h3>
        {step3.use_skill_ratio ? (
          <>
            <p className="mb-3 text-sm text-neutral-600">사용 · 시나리오 만점 {rawMaximum}점</p>
            <dl className="flex flex-col gap-2">
              {skills.map((skill) => (
                <div key={skill.skill_id} className="flex items-start gap-3">
                  <dt className="min-w-0 flex-1 wrap-anywhere">{skill.skill_name}</dt>
                  <dd className="shrink-0">
                    {step3.skill_ratio?.find((ratio) => ratio.skill_id === skill.skill_id)
                      ?.percent ?? 0}
                    %
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <p>사용하지 않음</p>
        )}
      </section>
    </div>
  );
};

const AbstractForm3 = () => {
  const step3 = useAtomValue(Form3Atom);
  const step2 = useAtomValue(Form2Atom);
  if (!step3 || !step2) return null;

  const raw_max_points = step2.result.reduce(
    (skillSum, skill) =>
      skillSum + skill.questions.reduce(
        (questionSum, question) =>
          questionSum + Math.max(
            question.option_1_score || 0,
            question.option_2_score || 0,
            question.option_3_score || 0,
            question.option_4_score || 0,
            question.option_5_score || 0,
            question.option_6_score || 0
          )
        , 0
      )
    , 0
  )
  return (
    <p className="text-sm">
      ◎ 컷 오프 {step3.cutoff.value}점/{step3.cutoff.type == "convt" ? "100점" : `${raw_max_points}점`}
      {step3.use_skill_ratio ? ` ◎ 스킬별 성적 반영 비율: ${step2.result.map((skill) => {
        const ratio = step3.skill_ratio?.find(
          (ratio) => ratio.skill_id === skill.skill_id
        );
        return `${skill.skill_name}(${ratio?.percent ?? 0}%)`;
      }).join(", ")}` : ''}
    </p>
  )
}

type Step3FormProps = { submit: (data: Step3FormType) => Promise<void> };
const ActiveStep3Form = ({ submit }: Step3FormProps) => {
  const step2 = useAtomValue(Form2Atom);
  const saved = useAtomValue(Form3Atom);
  const skills = getSkillScores(step2?.result ?? []);
  const rawMaximum = skills.reduce((sum, skill) => sum + skill.maximum, 0);
  const eligibleCount = skills.filter((skill) => skill.eligible).length;
  const useSavedRatio = !!saved?.use_skill_ratio && eligibleCount > 0;
  const {
    control,
    register,
    getValues,
    setValue,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<Step3FormType>({
    defaultValues: {
      use_skill_ratio: useSavedRatio,
      skill_ratio: distributeRatio(skills).map((ratio, index) => ({
        ...ratio,
        percent: !skills[index].eligible
          ? 0
          : eligibleCount === 1
            ? 100
            : (saved?.skill_ratio?.find((value) => value.skill_id === ratio.skill_id)?.percent ??
              ratio.percent),
      })),
      cutoff: {
        type: rawMaximum === 100 || rawMaximum <= 0 ? "raw" : (saved?.cutoff.type ?? "raw"),
        value: saved?.cutoff.value ?? 0,
      },
    },
  });
  const useRatio = useWatch({ control, name: "use_skill_ratio" });
  const cutoffType = useWatch({ control, name: "cutoff.type" });
  const ratios = useWatch({ control, name: "skill_ratio" }) ?? [];
  const maximum = cutoffType === "convt" ? 100 : Math.max(0, rawMaximum);
  const totalPercent =
    ratios.reduce(
      (sum, ratio) => sum + (Number.isFinite(ratio.percent) ? Math.round(ratio.percent * 100) : 0),
      0,
    ) / 100;
  const validRatios = ratios.every(
    (ratio, index) =>
      Number.isFinite(ratio.percent) &&
      ratio.percent >= 0 &&
      ratio.percent <= 100 &&
      Math.abs(ratio.percent * 100 - Math.round(ratio.percent * 100)) < 1e-8 &&
      (skills[index].eligible || ratio.percent === 0),
  );
  const [message, setMessage] = useState("");

  const updateCutoffType = (type: Step3FormType["cutoff"]["type"]) => {
    const previous = getValues("cutoff.type");
    const value = getValues("cutoff.value");
    if (previous !== type && Number.isFinite(value)) {
      setValue(
        "cutoff.value",
        rawMaximum > 0
          ? Math.round(
            (type === "convt" ? (value / rawMaximum) * 100 : (value / 100) * rawMaximum) * 100,
          ) / 100
          : 0,
        { shouldDirty: true },
      );
    }
    setValue("cutoff.type", type, { shouldDirty: true });
    clearErrors("cutoff");
  };

  const save = async (data: Step3FormType) => {
    if (data.use_skill_ratio && (eligibleCount === 0 || totalPercent !== 100 || !validRatios)) {
      setError("root", {
        message: "반영 비율의 합은 100%여야 하며, 반영할 수 없는 스킬은 0%여야 합니다.",
      });
      return;
    }
    try {
      await submit({
        use_skill_ratio: data.use_skill_ratio,
        ...(data.use_skill_ratio ? { skill_ratio: data.skill_ratio } : {}),
        cutoff: {
          type: rawMaximum === 100 ? "raw" : data.cutoff.type,
          value: data.cutoff.value,
        },
      });
      setMessage("점수 산정 방식을 저장했습니다.");
    } catch {
      setError("root", { message: "저장하지 못했습니다. 다시 시도해주세요." });
    }
  };

  return (
    <form className="p-4" onSubmit={(event) => void handleSubmit(save)(event)}>
      <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-4">
        <p className="text-sm text-neutral-600">전체 원점수 최고점: {rawMaximum}점</p>
        <section className="flex flex-col gap-3 rounded border border-neutral-300 bg-white/40 p-3">
          <h3 className="font-bold">컷오프</h3>
          {rawMaximum !== 100 && (
            <div className="flex flex-wrap gap-4">
              <RadioBox
                {...register("cutoff.type")}
                value="raw"
                onChange={() => {
                  updateCutoffType("raw");
                }}
              >
                원점수 기준 ({rawMaximum}점 만점)
              </RadioBox>
              <RadioBox
                {...register("cutoff.type")}
                value="convt"
                disabled={rawMaximum <= 0}
                onChange={() => {
                  updateCutoffType("convt");
                }}
              >
                100점 환산 기준
              </RadioBox>
            </div>
          )}
          {rawMaximum === 100 && <p className="text-sm">100점 기준</p>}
          <label className="flex flex-wrap items-center gap-2">
            <span>컷오프 점수</span>
            <input
              type="number"
              min={0}
              max={maximum}
              step="any"
              className={inputClass}
              aria-invalid={!!errors.cutoff?.value}
              {...register("cutoff.value", {
                valueAsNumber: true,
                validate: (value) =>
                  (Number.isFinite(value) && value >= 0 && value <= maximum) ||
                  `0~${maximum}점 사이로 입력해주세요.`,
              })}
            />
            <span>점 / {maximum}점</span>
          </label>
          {errors.cutoff?.value && (
            <p role="alert" className="text-sm text-red-700">
              {errors.cutoff.value.message}
            </p>
          )}
        </section>
        <section className="flex flex-col gap-3 rounded border border-neutral-300 bg-white/40 p-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register("use_skill_ratio")}
              disabled={eligibleCount === 0 || isSubmitting}
              onChange={(event) => {
                setValue("use_skill_ratio", event.target.checked, { shouldDirty: true });
                clearErrors("root");
                clearErrors("skill_ratio");
              }}
            />
            <span className="font-bold">스킬별 성적 반영 비율 사용</span>
          </label>
          {eligibleCount === 0 && (
            <p className="text-sm text-neutral-600">
              반영 가능한 스킬이 없어 비율을 사용할 수 없습니다.
            </p>
          )}
          {useRatio && (
            <>
              <p className="text-sm text-neutral-600">
                가중치 = (반영 비율 ÷ 100 × 시나리오 만점) ÷ 스킬 원점수 만점. 가중 점수 = 원점수 ×
                가중치. 시나리오 만점은 {rawMaximum}점으로 유지됩니다. 각 비율을 입력하고 합계를
                100%로 맞춰주세요.
              </p>
              <button
                type="button"
                className="self-start rounded border border-neutral-400 px-3 py-1 enabled:cursor-pointer"
                onClick={() => {
                  setValue("skill_ratio", distributeRatio(skills), { shouldDirty: true });
                  clearErrors("skill_ratio");
                  clearErrors("root");
                }}
              >
                균등 배분
              </button>
              {skills.map((skill, index) => (
                <div key={skill.skill_id} className="flex flex-wrap items-center gap-2">
                  <label className="flex flex-wrap items-center gap-2">
                    <span>
                      {skill.skill_name}{" "}
                      <span className="text-sm text-neutral-600">(최고점 {skill.maximum}점)</span>
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      className={inputClass}
                      aria-invalid={!!errors.skill_ratio?.[index]?.percent}
                      {...register(`skill_ratio.${index}.percent`, {
                        valueAsNumber: true,
                        validate: (value) =>
                          !getValues("use_skill_ratio") ||
                          (typeof value === "number" &&
                            Number.isFinite(value) &&
                            value >= 0 &&
                            value <= 100 &&
                            Math.abs(value * 100 - Math.round(value * 100)) < 1e-8) ||
                          "0~100% 사이로 소수점 두 자리까지 입력해주세요.",
                        onChange: () => {
                          clearErrors("root");
                        },
                      })}
                      disabled={!skill.eligible || eligibleCount === 1 || isSubmitting}
                      onFocus={(event) => {
                        event.currentTarget.select();
                      }}
                    />
                    <span>%</span>
                  </label>
                  {errors.skill_ratio?.[index]?.percent && (
                    <span role="alert" className="text-sm text-red-700">
                      {errors.skill_ratio[index].percent.message}
                    </span>
                  )}
                  {!skill.eligible && (
                    <span className="text-sm text-neutral-600">
                      문제가 없거나 최고점이 0점 이하이므로 0% 고정
                    </span>
                  )}
                  {skill.eligible && eligibleCount === 1 && (
                    <span className="text-sm text-neutral-600">
                      반영 가능한 유일한 스킬이므로 100% 고정
                    </span>
                  )}
                </div>
              ))}
              <p className="font-bold" role="status">
                반영 비율 합계: {totalPercent}%
                {totalPercent < 100
                  ? ` · ${Number((100 - totalPercent).toFixed(2))}% 부족`
                  : totalPercent > 100
                    ? ` · ${Number((totalPercent - 100).toFixed(2))}% 초과`
                    : ""}
                {!validRatios
                  ? " · 모든 비율을 0~100% 사이로 소수점 두 자리까지 입력해주세요."
                  : ""}
              </p>
            </>
          )}
        </section>
        {errors.root && (
          <p role="alert" className="text-sm text-red-700">
            {errors.root.message}
          </p>
        )}
        <p role="status" className="text-sm">
          {message}
        </p>
        <button
          type="submit"
          disabled={useRatio && (totalPercent !== 100 || !validRatios)}
          className="self-end rounded border border-neutral-400 px-3 py-1 enabled:cursor-pointer disabled:opacity-40"
        >
          {isSubmitting ? "저장 중" : "점수 산정 방식 저장"}
        </button>
        {rawMaximum <= 0 && (
          <p className="text-sm text-neutral-600">
            전체 최고점이 0점 이하이면 100점 환산을 사용할 수 없습니다.
          </p>
        )}
      </fieldset>
    </form>
  );
};

export const Step3Form = ({ submit }: Step3FormProps) => {
  const active = useAtomValue(ActiveFormAtom);
  const is_active = active == 3;
  return (
    <StepWrapper>
      <StepTitle
        index={3}
        active={is_active}
        locked={active == 1 || active == 2}
        title="점수 산정 방식"
      >
        <AbstractForm3 />
      </StepTitle>
      <StepBody className="form3-wrapper">
        {is_active ? <ActiveStep3Form submit={submit} /> : <ReadOnlyStep3 />}
        <Loading className="form3-loading-overlay" />
      </StepBody>
    </StepWrapper>
  )
}