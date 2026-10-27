import { useCallback, useEffect, useRef, useState, type ComponentProps } from "react";
import { useFieldArray, useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { useAtom, useAtomValue } from "jotai";
import { TextInput } from "@/common/form";
import { ActiveFormAtom, Form2Atom, Form2ROOpenAtom } from "./atom";
import { initialSkills } from "./constants";
import type { Step2FormType } from "./type";
import { StepBody, StepTitle, StepWrapper } from "./ui";
import { Loading } from "../common-form-ui";
import { motion } from "motion/react";
import { fadeOpenVariants } from "@/common/animation";
import { VscChevronDown } from "react-icons/vsc";

const Button = ({ className, type = "button", ...props }: ComponentProps<"button">) => (
  <button
    {...props}
    type={type}
    className={`rounded border border-neutral-400 px-3 py-1 text-sm enabled:cursor-pointer disabled:opacity-40${className ? ` ${className}` : ""}`}
  />
);

type Skill = Step2FormType["result"][number];
type Question = Skill["questions"][number];
type MoveQuestion = (
  questionId: string,
  skillId: string,
  targetId?: string,
  after?: boolean,
) => void;
type MoveSkill = (skillId: string, targetId: string, after?: boolean) => void;
const optionNumbers = [1, 2, 3, 4, 5, 6] as const;
const nonBlank = (value: string) => value.trim().length > 0 || "내용을 입력해주세요.";
const newQuestion = (idx: number): Question => ({
  question_id: crypto.randomUUID(),
  idx,
  question_subject: "",
  option_count: 2,
  option_1: "",
  option_1_score: 0,
  option_2: "",
  option_2_score: 0,
  option_3: "",
  option_3_score: 0,
  option_4: "",
  option_4_score: 0,
  option_5: "",
  option_5_score: 0,
  option_6: "",
  option_6_score: 0,
});

type QuestionCardProps = {
  form: UseFormReturn<Step2FormType>;
  skillIndex: number;
  questionIndex: number;
  questionId: string;
  skillId: string;
  scope: symbol;
  moveQuestion: MoveQuestion;
  remove: () => void;
};
const QuestionCard = ({
  form,
  skillIndex,
  questionIndex,
  questionId,
  skillId,
  scope,
  moveQuestion,
  remove,
}: QuestionCardProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = useState(false);
  const [edge, setEdge] = useState<"before" | "after" | null>(null);
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = form;
  const path = `result.${skillIndex}.questions.${questionIndex}` as const;
  const count = useWatch({ control, name: `${path}.option_count` });
  const skills = useWatch({ control, name: "result" });
  const error = errors.result?.[skillIndex]?.questions?.[questionIndex];

  useEffect(() => {
    const element = ref.current;
    const dragHandle = handleRef.current;
    if (!element || !dragHandle) return;
    return combine(
      draggable({
        element,
        dragHandle,
        canDrag: () => !isSubmitting,
        getInitialData: () => ({ scope, kind: "question", questionId }),
        onDragStart: () => {
          setDragging(true);
        },
        onDrop: () => {
          setDragging(false);
        },
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) =>
          !isSubmitting && source.data.scope === scope && source.data.kind === "question",
        getData: ({ input }) => ({
          skillId,
          questionId,
          after:
            input.clientY >
            element.getBoundingClientRect().top + element.getBoundingClientRect().height / 2,
        }),
        onDrag: ({ self, source }) => {
          setEdge(
            source.data.questionId === questionId ? null : self.data.after ? "after" : "before",
          );
        },
        onDragLeave: () => {
          setEdge(null);
        },
        onDrop: () => {
          setEdge(null);
        },
      }),
    );
  }, [scope, skillId, questionId, isSubmitting]);

  const removeOption = (number: number) => {
    const question = getValues(path);
    for (const current of optionNumbers) {
      if (current < number) continue;
      const next = optionNumbers.find((value) => value === current + 1);
      setValue(
        `${path}.option_${current}`,
        next && current < count ? question[`option_${next}`] : "",
        { shouldDirty: true },
      );
      setValue(
        `${path}.option_${current}_score`,
        next && current < count ? question[`option_${next}_score`] : 0,
        { shouldDirty: true },
      );
    }
    setValue(`${path}.option_count`, count - 1, { shouldDirty: true });
    form.clearErrors(path);
  };
  return (
    <div
      ref={ref}
      className={`relative rounded border border-neutral-300 bg-white/80 p-3 ${dragging ? "opacity-40" : ""}`}
    >
      {edge && (
        <div
          className={`absolute inset-x-0 h-1 bg-blue-500 ${edge === "before" ? "-top-1" : "-bottom-1"}`}
        />
      )}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button
          ref={handleRef}

          className="cursor-grab touch-none"
          aria-label={`문제 ${questionIndex + 1} 드래그로 이동`}
        >
          ⠿
        </Button>
        <span className="mr-auto">문제 {questionIndex + 1}</span>
        <Button
          disabled={questionIndex === 0}
          onClick={() => {
            moveQuestion(
              questionId,
              skillId,
              skills[skillIndex].questions[questionIndex - 1].question_id,
            );
          }}
        >
          위로
        </Button>
        <Button
          disabled={questionIndex === skills[skillIndex].questions.length - 1}
          onClick={() => {
            moveQuestion(
              questionId,
              skillId,
              skills[skillIndex].questions[questionIndex + 1].question_id,
              true,
            );
          }}
        >
          아래로
        </Button>
        <select
          aria-label={`문제 ${questionIndex + 1} 이동할 스킬`}
          className="max-w-full rounded border border-neutral-400 p-1 text-sm"
          value=""
          onChange={(event) => {
            moveQuestion(questionId, event.target.value);
          }}
        >
          <option value="" disabled>
            다른 스킬로 이동
          </option>
          {skills
            .filter((skill) => skill.skill_id !== skillId)
            .map((skill) => (
              <option key={skill.skill_id} value={skill.skill_id}>
                {skill.skill_name}
              </option>
            ))}
        </select>
        <Button onClick={remove}>문제 삭제</Button>
      </div>
      <label className="flex flex-col gap-1">
        <span>문제 내용</span>
        <textarea
          className="min-h-20 rounded border border-neutral-400 p-2"
          aria-invalid={!!error?.question_subject}
          {...register(`${path}.question_subject`, { validate: nonBlank })}
        />
        {error?.question_subject && (
          <span role="alert" className="text-sm text-red-700">
            {error.question_subject.message}
          </span>
        )}
      </label>
      <div className="mt-3 flex flex-col gap-2">
        {optionNumbers.slice(0, count).map((number) => (
          <div key={number} className="flex flex-wrap items-start gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-sm">선택지 {number}</span>
              <TextInput
                aria-invalid={!!error?.[`option_${number}`]}
                {...register(`${path}.option_${number}`, {
                  validate: (value) =>
                    number > getValues(`${path}.option_count`) || nonBlank(value),
                })}
              />
              {error?.[`option_${number}`] && (
                <span role="alert" className="text-sm text-red-700">
                  {error[`option_${number}`]?.message}
                </span>
              )}
            </label>
            <label className="flex w-20 flex-col gap-1">
              <span className="text-sm">점수</span>
              <input
                type="number"
                step="any"
                className="w-full rounded border border-neutral-400 p-1"
                aria-invalid={!!error?.[`option_${number}_score`]}
                {...register(`${path}.option_${number}_score`, {
                  valueAsNumber: true,
                  validate: (value) =>
                    number > getValues(`${path}.option_count`) ||
                    Number.isFinite(value) ||
                    "점수를 입력해주세요.",
                })}
              />
              {error?.[`option_${number}_score`] && (
                <span role="alert" className="text-sm text-red-700">
                  {error[`option_${number}_score`]?.message}
                </span>
              )}
            </label>
            <Button
              className="mt-6"
              disabled={count <= 2}
              onClick={() => {
                removeOption(number);
              }}
              aria-label={`선택지 ${number} 삭제`}
            >
              삭제
            </Button>
          </div>
        ))}
        <Button
          className="self-start"
          disabled={count >= 6}
          onClick={() => {
            setValue(`${path}.option_count`, count + 1, { shouldDirty: true });
          }}
        >
          선택지 추가 ({count}/6)
        </Button>
      </div>
    </div>
  );
};

type QuestionFormProps = {
  form: UseFormReturn<Step2FormType>;
  idx: number;
  skill: Skill;
  scope: symbol;
  moveQuestion: MoveQuestion;
  moveSkill: MoveSkill;
  removeSkill: () => void;
};
const QuestionForm = ({
  form,
  idx,
  skill,
  scope,
  moveQuestion,
  moveSkill,
  removeSkill,
}: QuestionFormProps) => {
  const { fields, append, remove } = useFieldArray({
    name: `result.${idx}.questions`,
    control: form.control,
  });
  const ref = useRef<HTMLElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);
  const [over, setOver] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [edge, setEdge] = useState<"before" | "after" | null>(null);
  const skills = useWatch({ control: form.control, name: "result" });
  const isSubmitting = form.formState.isSubmitting;
  useEffect(() => {
    const element = ref.current;
    const dragHandle = handleRef.current;
    if (!element || !dragHandle) return;
    return combine(
      draggable({
        element,
        dragHandle,
        canDrag: () => !isSubmitting,
        getInitialData: () => ({ scope, kind: "skill", skillId: skill.skill_id }),
        onDragStart: () => {
          setDragging(true);
        },
        onDrop: () => {
          setDragging(false);
        },
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) =>
          !isSubmitting &&
          source.data.scope === scope &&
          (source.data.kind === "skill" || source.data.kind === "question"),
        getData: ({ source, input }) => ({
          skillId: skill.skill_id,
          after:
            source.data.kind === "skill" &&
            input.clientY >
            element.getBoundingClientRect().top + element.getBoundingClientRect().height / 2,
        }),
        onDrag: ({ location, self, source }) => {
          setOver(
            source.data.kind === "question" &&
            location.current.dropTargets.at(0)?.element === self.element,
          );
          setEdge(
            source.data.kind === "skill" && source.data.skillId !== skill.skill_id
              ? self.data.after
                ? "after"
                : "before"
              : null,
          );
        },
        onDragLeave: () => {
          setOver(false);
          setEdge(null);
        },
        onDrop: () => {
          setOver(false);
          setEdge(null);
        },
      }),
    );
  }, [scope, skill.skill_id, isSubmitting]);
  return (
    <section
      ref={ref}
      className={`relative flex flex-col gap-3 rounded border p-3 ${over ? "border-blue-500 bg-blue-50" : "border-neutral-300 bg-white/40"} ${dragging ? "opacity-40" : ""}`}
    >
      {edge && (
        <div
          className={`absolute inset-x-0 h-1 bg-blue-500 ${edge === "before" ? "-top-1" : "-bottom-1"}`}
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          ref={handleRef}

          className="cursor-grab touch-none"
          aria-label={`${skill.skill_name} 스킬 드래그로 이동`}
        >
          ⠿
        </Button>
        <h3 className="mr-auto font-bold">
          {skill.skill_name} <span className="text-sm font-normal">({fields.length}문제)</span>
        </h3>
        <Button
          disabled={idx === 0}
          aria-label={`${skill.skill_name} 스킬 위로 이동`}
          onClick={() => {
            moveSkill(skill.skill_id, skills[idx - 1].skill_id);
          }}
        >
          위로
        </Button>
        <Button
          disabled={idx === skills.length - 1}
          aria-label={`${skill.skill_name} 스킬 아래로 이동`}
          onClick={() => {
            moveSkill(skill.skill_id, skills[idx + 1].skill_id, true);
          }}
        >
          아래로
        </Button>
        <Button onClick={removeSkill}>스킬 삭제</Button>
      </div>
      {fields.map((question, questionIndex) => (
        <QuestionCard
          key={question.id}
          form={form}
          skillIndex={idx}
          questionIndex={questionIndex}
          questionId={question.question_id}
          skillId={skill.skill_id}
          scope={scope}
          moveQuestion={moveQuestion}
          remove={() => {
            remove(questionIndex);
          }}
        />
      ))}
      {fields.length === 0 && (
        <p className="rounded border border-dashed border-neutral-400 p-4 text-sm">
          문제를 추가하거나 다른 스킬의 문제를 여기로 옮겨주세요.
        </p>
      )}
      <Button
        className="self-start"
        onClick={() => {
          append(newQuestion(fields.length));
        }}
      >
        문제 추가
      </Button>
    </section>
  );
};


type Step2FormProps = { submit: (data: Step2FormType) => Promise<void> };
const ReadOnlyStep2 = () => {
  const step2 = useAtomValue(Form2Atom);
  const open = useAtomValue(Form2ROOpenAtom);
  if (!step2) return null;

  return (
    <motion.div animate={open ? "open" : "close"} variants={fadeOpenVariants.parent} className=" overflow-clip">
      <motion.div variants={fadeOpenVariants.child} className="flex flex-col gap-4 p-4">
        {step2.result.map((skill) => (
          <section key={skill.skill_id} className="rounded border border-neutral-300 bg-white/40 p-3">
            <h3 className="mb-3 font-bold">
              {skill.skill_name}{" "}
              <span className="text-sm font-normal">({skill.questions.length}문제)</span>
            </h3>
            <ol className="flex flex-col gap-3">
              {skill.questions.map((question, index) => (
                <li
                  key={question.question_id}
                  className="rounded border border-neutral-300 bg-white/80 p-3"
                >
                  <p className="mb-1 text-sm text-neutral-600">문제 {index + 1}</p>
                  <p className="whitespace-pre-wrap wrap-anywhere">{question.question_subject}</p>
                  <ol className="mt-3 flex flex-col gap-2">
                    {optionNumbers.slice(0, question.option_count).map((number) => (
                      <li key={number} className="flex items-start gap-3 text-sm">
                        <span className="shrink-0 text-neutral-600">{number}.</span>
                        <span className="min-w-0 flex-1 whitespace-pre-wrap wrap-anywhere">
                          {question[`option_${number}`]}
                        </span>
                        <span className="shrink-0">{question[`option_${number}_score`]}점</span>
                      </li>
                    ))}
                  </ol>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </motion.div>
    </motion.div>
  );
};

const AbstractForm2 = () => {
  const step2 = useAtomValue(Form2Atom);
  if (!step2) return null;

  return (
    <p className="text-sm">
      {step2.result.map((skill) => `${skill.skill_name}(${skill.questions.length})`).join(', ')}
    </p>
  )
}

const ActiveStep2Form = ({ submit }: Step2FormProps) => {
  const saved = useAtomValue(Form2Atom);
  const form = useForm<Step2FormType>({ defaultValues: saved ?? { result: [] } });
  const {
    control,
    handleSubmit,
    getValues,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = form;
  const { fields, append, remove, replace } = useFieldArray({ name: "result", control });
  const [catalog, setCatalog] = useState(initialSkills);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [message, setMessage] = useState("");
  const [scope] = useState(() => Symbol("step2"));
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = catalog.filter((skill) =>
    skill.skill_name.toLocaleLowerCase().includes(normalizedQuery),
  );
  const canCreate = normalizedQuery.length > 0 && matches.length === 0;
  const optionCount = canCreate ? 1 : matches.length;
  const addSkill = (skill: (typeof initialSkills)[number]) => {
    if (getValues("result").some((value) => value.skill_id === skill.skill_id)) {
      setMessage("이미 추가한 스킬입니다.");
      return;
    }
    append({ ...skill, idx: fields.length, questions: [] });
    clearErrors("root");
    setQuery("");
    setOpen(false);
    setCursor(0);
    setMessage(`${skill.skill_name} 스킬을 추가했습니다.`);
  };
  const selectOption = (index: number) => {
    if (canCreate) {
      const skill = { skill_id: crypto.randomUUID(), skill_name: query.trim() };
      setCatalog((values) => [...values, skill]);
      addSkill(skill);
    } else if (matches[index]) addSkill(matches[index]);
  };
  const moveQuestion = useCallback<MoveQuestion>(
    (questionId, skillId, targetId, after = false) => {
      const values = getValues("result");
      const source = values.find((skill) =>
        skill.questions.some((question) => question.question_id === questionId),
      );
      const target = values.find((skill) => skill.skill_id === skillId);
      const question = source?.questions.find((value) => value.question_id === questionId);
      if (!source || !target || !question || targetId === questionId) return;
      const remaining = target.questions.filter((value) => value.question_id !== questionId);
      const targetIndex = targetId
        ? remaining.findIndex((value) => value.question_id === targetId)
        : remaining.length;
      if (targetIndex < 0) return;
      remaining.splice(targetIndex + (targetId && after ? 1 : 0), 0, question);
      replace(
        values.map((skill, idx) => ({
          ...skill,
          idx,
          questions: (skill.skill_id === skillId
            ? remaining
            : skill.questions.filter((value) => value.question_id !== questionId)
          ).map((value, index) => ({ ...value, idx: index })),
        })),
      );
      clearErrors();
      setMessage(
        `문제를 ${target.skill_name}의 ${remaining.findIndex((value) => value.question_id === questionId) + 1}번째로 이동했습니다.`,
      );
    },
    [getValues, replace, clearErrors],
  );
  const moveSkill = useCallback<MoveSkill>(
    (skillId, targetId, after = false) => {
      if (skillId === targetId) return;
      const values = getValues("result");
      const skill = values.find((value) => value.skill_id === skillId);
      const remaining = values.filter((value) => value.skill_id !== skillId);
      const targetIndex = remaining.findIndex((value) => value.skill_id === targetId);
      if (!skill || targetIndex < 0) return;
      const nextIndex = targetIndex + (after ? 1 : 0);
      remaining.splice(nextIndex, 0, skill);
      replace(remaining.map((value, idx) => ({ ...value, idx })));
      clearErrors();
      setMessage(`${skill.skill_name} 스킬을 ${nextIndex + 1}번째로 이동했습니다.`);
    },
    [getValues, replace, clearErrors],
  );
  useEffect(
    () =>
      monitorForElements({
        canMonitor: ({ source }) => source.data.scope === scope,
        onDrop: ({ source, location }) => {
          const target = location.current.dropTargets.at(0)?.data;
          if (source.data.kind === "skill") {
            if (typeof source.data.skillId === "string" && typeof target?.skillId === "string") {
              moveSkill(source.data.skillId, target.skillId, target.after === true);
            }
            return;
          }
          if (source.data.kind !== "question") return;
          if (typeof source.data.questionId !== "string" || typeof target?.skillId !== "string")
            return;
          moveQuestion(
            source.data.questionId,
            target.skillId,
            typeof target.questionId === "string" ? target.questionId : undefined,
            target.after === true,
          );
        },
      }),
    [scope, moveQuestion, moveSkill],
  );
  const save = async (data: Step2FormType) => {
    if (data.result.length === 0 || data.result.some((skill) => skill.questions.length === 0)) {
      setError("root", { message: "스킬을 추가하고, 각 스킬에 문제를 하나 이상 입력해주세요." });
      return;
    }
    try {
      await submit({
        result: data.result.map((skill, idx) => ({
          ...skill,
          idx,
          questions: skill.questions.map((question, index) => ({ ...question, idx: index })),
        })),
      });
      setMessage("평가 항목을 저장했습니다.");
    } catch {
      setError("root", { message: "저장하지 못했습니다. 다시 시도해주세요." });
    }
  };
  return (
    <form className="p-4" onSubmit={(event) => void handleSubmit(save)(event)}>
      <fieldset disabled={isSubmitting} className="flex min-w-0 flex-col gap-4">
        <div
          className="relative"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
          }}
        >
          <label htmlFor="skill-search" className="mb-1 block">
            스킬 선택 또는 추가
          </label>
          <div className="flex gap-2">
            <input
              id="skill-search"
              role="combobox"
              aria-expanded={open}
              aria-controls="skill-options"
              aria-autocomplete="list"
              aria-activedescendant={open && optionCount > 0 ? `skill-option-${cursor}` : undefined}
              autoComplete="off"
              className="min-w-0 flex-1 rounded border border-neutral-400 bg-white/80 p-2"
              placeholder="스킬을 검색하거나 새로 입력해주세요"
              value={query}
              onFocus={() => {
                setOpen(true);
              }}
              onChange={(event) => {
                setQuery(event.target.value);
                setCursor(0);
                setOpen(true);
              }}
              onKeyDown={(event) => {
                if (event.nativeEvent.isComposing) return;
                if (event.key === "Escape") setOpen(false);
                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                  event.preventDefault();
                  setOpen(true);
                  setCursor((value) =>
                    optionCount
                      ? (value + (event.key === "ArrowDown" ? 1 : -1) + optionCount) % optionCount
                      : 0,
                  );
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  selectOption(cursor);
                }
              }}
            />
            <Button
              disabled={
                !optionCount ||
                (!canCreate && fields.some((skill) => skill.skill_id === matches[cursor]?.skill_id))
              }
              onClick={() => {
                selectOption(cursor);
              }}
            >
              추가
            </Button>
          </div>
          {open && (
            <ul
              id="skill-options"
              role="listbox"
              aria-label="스킬 목록"
              className="absolute inset-x-0 top-full z-20 mt-1 max-h-60 overflow-auto rounded border border-neutral-300 bg-white shadow-lg"
            >
              {canCreate ? (
                <li
                  id="skill-option-0"
                  role="option"
                  aria-selected={cursor === 0}
                  className="cursor-pointer bg-blue-50 p-2"
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => {
                    selectOption(0);
                  }}
                >
                  “{query.trim()}” 새로 추가하기
                </li>
              ) : (
                matches.map((skill, index) => {
                  const added = fields.some((value) => value.skill_id === skill.skill_id);
                  return (
                    <li
                      key={skill.skill_id}
                      id={`skill-option-${index}`}
                      role="option"
                      aria-selected={cursor === index}
                      aria-disabled={added}
                      className={`cursor-pointer p-2 ${cursor === index ? "bg-blue-50" : ""} ${added ? "text-neutral-400" : ""}`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                      }}
                      onMouseEnter={() => {
                        setCursor(index);
                      }}
                      onClick={() => {
                        selectOption(index);
                      }}
                    >
                      {skill.skill_name}
                      {added ? " (추가됨)" : ""}
                    </li>
                  );
                })
              )}
            </ul>
          )}
        </div>
        <p className="text-sm text-neutral-600">
          스킬별로 문제와 선택지 2~6개를 입력하세요. 스킬과 문제의 ⠿ 핸들을 끌어 순서를 바꾸고,
          문제는 다른 스킬로 옮길 수도 있습니다.
        </p>
        {fields.length === 0 && (
          <p className="rounded border border-dashed border-neutral-400 p-6 text-center">
            먼저 평가할 스킬을 추가해주세요.
          </p>
        )}
        {fields.map((skill, idx) => (
          <QuestionForm
            key={`${skill.id}-${idx}`}
            form={form}
            idx={idx}
            skill={skill}
            scope={scope}
            moveQuestion={moveQuestion}
            moveSkill={moveSkill}
            removeSkill={() => {
              remove(idx);
              clearErrors();
              setMessage(`${skill.skill_name} 스킬을 삭제했습니다.`);
            }}
          />
        ))}
        {errors.root && (
          <p role="alert" className="text-sm text-red-700">
            {errors.root.message}
          </p>
        )}
        <p role="status" aria-live="polite" className="text-sm">
          {message}
        </p>
        <Button type="submit" className="self-end">
          {isSubmitting ? "저장 중" : "평가 항목 저장"}
        </Button>
      </fieldset>
    </form>
  );
};

export const Step2Form = ({ submit }: Step2FormProps) => {
  const active = useAtomValue(ActiveFormAtom);
  const [open, setOpen] = useAtom(Form2ROOpenAtom);
  const value = useAtomValue(Form2Atom);
  const is_active = active == 2;
  return (
    <StepWrapper>
      <StepTitle
        index={2}
        active={is_active}
        locked={active == 1}
        title={"평가 항목"}
      >
        {is_active || !value ?
          null :
          <div className="flex items-center justify-between">
            <AbstractForm2 />
            <button type="button" className={open ? 'rotate-180' : 'rotate-0'} onClick={() => { setOpen(o => !o) }}>
              <VscChevronDown />
            </button>
          </div>
        }
      </StepTitle>
      <StepBody className="form2-wrapper">
        {is_active ? <ActiveStep2Form submit={submit} /> : <ReadOnlyStep2 />}
        <Loading className="form2-loading-overlay" />
      </StepBody>
    </StepWrapper>
  )
}