import type { Status, Priority } from "../types/Task";

type TaskCardProps = {
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  onStatusChange?: (status: Status) => void;
};

const statuses: Status[] = ["To Do", "In Progress", "In Review", "Done"];
const priorityStyles: Record<Priority, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-emerald-100 text-emerald-700",
};

function TaskCard({ title, description, status, priority, onStatusChange }: TaskCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition hover:border-slate-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="text-sm text-slate-600 mt-2">{description}</p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
            {status}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${priorityStyles[priority]}`}>
            {priority}
          </span>

          {onStatusChange ? (
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value as Status)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            >
              {statuses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
