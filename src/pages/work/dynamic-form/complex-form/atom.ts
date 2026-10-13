import { atom } from "jotai";
import { type Step2FormType, type Step1FormType, type Step3FormType } from "./type";

export const Form1Atom = atom<Step1FormType>();
export const Form2Atom = atom<Step2FormType>();
export const Form3Atom = atom<Step3FormType>();
