import type { scenarioTypeMap } from "./constants";

export type Step1FormType = {
  scenario_nm: string;
  scenario_id: string;
  scenario_type: keyof typeof scenarioTypeMap;
};

export type Step2FormType = {
  result: {
    skill_id: string;
    skill_name: string;
    idx: number;
    questions: {
      question_id: string;
      idx: number;
      question_subject: string;
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
    }[];
  }[];
};

export type Step3FormType = {
  use_skill_ratio: boolean;
  skill_ratio?: {
    skill_id: string;
    percent: number;
  }[];
  cutoff: {
    type: "raw" | "convt";
    value: number;
  };
};
