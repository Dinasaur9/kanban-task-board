export type Status = "To Do" | "In Progress" | "In Review" | "Done";
export type Priority = "High" | "Medium" | "Low";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  user_id?: string;
  created_at?: string;
}
