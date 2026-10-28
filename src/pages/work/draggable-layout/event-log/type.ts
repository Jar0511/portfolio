export type LogCategory = "recording" | "memo" | "scenario" | "ptz";
export type AddLog = (category: LogCategory, message: string) => void;
export interface LogEntry {
  id: number;
  category: LogCategory;
  message: string;
  time: string;
}
export type EventFilter = "all" | "session" | "ptz";
