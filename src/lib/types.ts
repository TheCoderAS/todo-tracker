import type { Timestamp } from "firebase/firestore";

export type TodoStatus = "pending" | "completed";
export type TodoPriority = "low" | "medium" | "high";

export interface Todo {
  id: string;
  title: string;
  status: TodoStatus;
  scheduledDate: Timestamp | null;
  completedDate: Timestamp | null;
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
