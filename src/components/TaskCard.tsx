import type { Priority, Status } from "../types/Task";

type TaskCardProps = {
  taskId: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  onStatusChange?: (status: Status) => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

const statuses: Status[] = ["To Do", "In Progress", "In Review", "Done"];
const priorityStyles: Record<Priority, string> = {
  High: "bg-red-500/15 text-red-200",
  Medium: "bg-amber-400/10 text-amber-200",
  Low: "bg-emerald-400/10 text-emerald-200",
};

function TaskCard({ taskId, title, description, status, priority, onStatusChange, onEdit, onDelete }: TaskCardProps) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", taskId);
        event.dataTransfer.effectAllowed = "move";
      }}
      className="cursor-grab overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/95 p-5 shadow-2xl shadow-slate-950/20 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-500/40 hover:shadow-cyan-500/20"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-white line-clamp-2">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100">
            {status}
          </span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${priorityStyles[priority]}`}>
            {priority}
          </span>

          {onStatusChange ? (
            <select
              value={status}
              onChange={(event) => onStatusChange(event.target.value as Status)}
              className="rounded-2xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            >
              {statuses.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-100 transition hover:bg-cyan-500/20 hover:text-white"
              >
                Edit
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-red-200 transition hover:bg-red-500/20 hover:text-white"
              >
                Delete
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskCard;
