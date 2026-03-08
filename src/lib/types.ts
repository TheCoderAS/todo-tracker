import type { Timestamp } from "firebase/firestore";

export type TodoStatus = "pending" | "completed";
export type TodoPriority = "low" | "medium" | "high";
export type TodoRecurrence = "none" | "daily" | "weekly" | "monthly";
export type HabitFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "half-yearly"
  | "yearly";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Todo {
  id: string;
  title: string;
  status: TodoStatus;
  scheduledDate: Timestamp | null;
  completedDate: Timestamp | null;
  createdAt?: Timestamp | null;
  priority: TodoPriority;
  tags: string[];
  description: string;
  recurrence?: TodoRecurrence;
  subtasks?: Subtask[];
  manualOrder?: number;
}

export interface TodoInput {
  title: string;
  scheduledDate: string;
  scheduledTime: string;
  priority: TodoPriority;
  tags: string;
  description: string;
  recurrence: TodoRecurrence;
  subtasks: Subtask[];
}

export interface Habit {
  id: string;
  title: string;
  reminderTime: string;
  reminderDays: number[];
  completionDates: string[];
  timezone: string | null;
  frequency: HabitFrequency;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  lastNotifiedDate?: string | null;
  archivedAt?: Timestamp | null;
}

export interface HabitInput {
  title: string;
  reminderTime: string;
  reminderDays: number[];
  frequency: HabitFrequency;
}
