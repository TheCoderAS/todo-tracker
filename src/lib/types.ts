import type { Timestamp } from "firebase/firestore";

export type TodoStatus = "pending" | "completed";
export type TodoPriority = "low" | "medium" | "high";
export type HabitFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "half-yearly"
  | "yearly";

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
}

export interface TodoInput {
  title: string;
  scheduledDate: string;
  scheduledTime: string;
  priority: TodoPriority;
  tags: string;
  description: string;
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
