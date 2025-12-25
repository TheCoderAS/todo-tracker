import type { Timestamp } from "firebase/firestore";

export type TodoStatus = "pending" | "completed" | "skipped";
export type TodoPriority = "low" | "medium" | "high";
export type HabitFrequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "half-yearly"
  | "yearly";
export type HabitType = "positive" | "avoid";
export type FocusBlockStatus = "active" | "completed" | "cancelled";

export type FocusBlockMetrics = {
  totalTodos: number;
  completedTodos: number;
  totalHabits: number;
  completedHabits: number;
  completionRate: number;
  actualDurationMinutes: number;
};

export interface Todo {
  id: string;
  title: string;
  status: TodoStatus;
  scheduledDate: Timestamp | null;
  completedDate: Timestamp | null;
  skippedAt?: Timestamp | null;
  createdAt?: Timestamp | null;
  archivedAt?: Timestamp | null;
  priority: TodoPriority;
  tags: string[];
  contextTags: string[];
  description: string;
}

export interface TodoInput {
  title: string;
  scheduledDate: string;
  scheduledTime: string;
  priority: TodoPriority;
  tags: string;
  contextTags: string[];
  description: string;
}

export interface Habit {
  id: string;
  title: string;
  habitType: HabitType;
  reminderTime: string;
  reminderDays: number[];
  completionDates: string[];
  skippedDates?: string[];
  timezone: string | null;
  frequency: HabitFrequency;
  graceMisses: number;
  contextTags: string[];
  triggerAfterHabitId?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
  lastNotifiedDate?: string | null;
  archivedAt?: Timestamp | null;
}

export interface HabitInput {
  title: string;
  habitType: HabitType;
  reminderTime: string;
  reminderDays: number[];
  frequency: HabitFrequency;
  graceMisses: number;
  contextTags: string[];
  triggerAfterHabitId?: string | null;
}

export interface FocusBlock {
  id: string;
  status: FocusBlockStatus;
  selectedTodoIds: string[];
  selectedHabitIds: string[];
  durationMinutes: number;
  startedAt: Timestamp | null;
  endedAt?: Timestamp | null;
  createdAt?: Timestamp | null;
  metrics?: FocusBlockMetrics | null;
}
