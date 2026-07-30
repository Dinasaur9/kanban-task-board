export type Status = "To Do" | "In Progress" | "In Review" | "Done";

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
}