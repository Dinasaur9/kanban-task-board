import type { Priority, Status, Task } from "../types/Task";

type TaskCardProps = {
  task: Task;
  onStatusChange: (status: Status) => void;
  onEdit: () => void;
  onDelete: () => void;
};

const statusLabels: Record<Status, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

const priorityLabels: Record<Priority, string> = {
  high: "High",
  normal: "Normal",
  low: "Low",
};

const priorityStyles: Record<Priority, string> = {
  high: "border-red-500/20 bg-red-500/10 text-red-200",
  normal: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  low: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
};

function getDueDatePresentation(dueDate: string | null, status: Status) {
  if (!dueDate) return null;
  const date = new Date(`${dueDate}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const days = Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
  const label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  if (status !== "done" && days < 0) {
    return { label: `Overdue · ${label}`, className: "border-red-500/30 bg-red-500/10 text-red-200" };
  }
  if (status !== "done" && days <= 3) {
    return { label: `Due soon · ${label}`, className: "border-amber-500/30 bg-amber-500/10 text-amber-200" };
  }
  return { label, className: "border-slate-700 bg-slate-800 text-slate-300" };
}

function TaskCard({ task, onStatusChange, onEdit, onDelete }: TaskCardProps) {
  const dueDate = getDueDatePresentation(task.due_date, task.status);

  return (
    <article
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", task.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className="group cursor-grab rounded-3xl border border-slate-800 bg-slate-950/95 p-5 shadow-xl shadow-slate-950/20 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-500/40 hover:shadow-cyan-500/10 active:cursor-grabbing"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${priorityStyles[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>
        {dueDate ? (
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${dueDate.className}`}>
            {dueDate.label}
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 line-clamp-2 font-semibold leading-6 text-white">{task.title}</h3>
      {task.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">{task.description}</p> : null}

      <div className="mt-5 border-t border-slate-800 pt-4">
        <label className="block">
          <span className="sr-only">Move {task.title}</span>
          <select
            value={task.status}
            onChange={(event) => onStatusChange(event.target.value as Status)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 outline-none focus:border-cyan-400"
          >
            {(Object.keys(statusLabels) as Status[]).map((status) => (
              <option key={status} value={status}>{statusLabels[status]}</option>
            ))}
          </select>
        </label>

        <div className="mt-3 flex gap-2">
          <button type="button" onClick={onEdit} className="flex-1 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-500/30 hover:text-cyan-100">
            Edit
          </button>
          <button type="button" onClick={onDelete} className="flex-1 rounded-xl border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-red-500/30 hover:text-red-200">
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default TaskCard;
