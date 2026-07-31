export type Status = "todo" | "in_progress" | "in_review" | "done";
export type Priority = "high" | "normal" | "low";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  user_id: string;
  created_at: string;
  due_date: string | null;
}
