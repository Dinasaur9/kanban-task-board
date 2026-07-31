import TaskCard from "./TaskCard";
import type { Status, Task } from "../types/Task";

const columnDetails: Record<Status, { title: string; dot: string; empty: string }> = {
  todo: { title: "To Do", dot: "bg-slate-400", empty: "Start by adding the next piece of work." },
  in_progress: { title: "In Progress", dot: "bg-amber-400", empty: "Drag a task here when work begins." },
  in_review: { title: "In Review", dot: "bg-violet-400", empty: "Tasks waiting for feedback appear here." },
  done: { title: "Done", dot: "bg-cyan-400", empty: "Completed work will collect here." },
};

type ColumnProps = {
  status: Status;
  tasks: Task[];
  onMoveTask: (taskId: string, status: Status) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: () => void;
};

function Column({ status, tasks, onMoveTask, onEditTask, onDeleteTask, onAddTask }: ColumnProps) {
  const details = columnDetails[status];

  return (
    <section
      aria-labelledby={`column-${status}`}
      className={`board-column column-${status} min-h-[440px] rounded-[1.75rem] p-4 sm:p-5`}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }}
      onDrop={(event) => {
        event.preventDefault();
        const taskId = event.dataTransfer.getData("text/plain");
        if (taskId) void onMoveTask(taskId, status);
      }}
    >
      <div className="mb-5 flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <span className={`h-2.5 w-2.5 rounded-full ${details.dot}`} />
          <h2 id={`column-${status}`} className="font-semibold text-white">{details.title}</h2>
        </div>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-sm font-semibold text-slate-300">{tasks.length}</span>
      </div>

      <div className="space-y-4">
        {tasks.length ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={(nextStatus) => void onMoveTask(task.id, nextStatus)}
              onEdit={() => onEditTask(task)}
              onDelete={() => void onDeleteTask(task.id)}
            />
          ))
        ) : (
          <button
            type="button"
            onClick={onAddTask}
            className="flex min-h-36 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-slate-700 px-6 text-center transition hover:border-cyan-500/40 hover:bg-slate-950/40"
          >
            <span className="text-2xl text-slate-500">+</span>
            <span className="mt-2 text-sm font-medium text-slate-300">No tasks yet</span>
            <span className="mt-1 text-xs leading-5 text-slate-500">{details.empty}</span>
          </button>
        )}
      </div>
    </section>
  );
}

export default Column;
