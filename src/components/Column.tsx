import TaskCard from "./TaskCard";
import type { Task, Status } from "../types/Task";

type ColumnProps = {
  title: string;
  tasks: Task[];
  onStatusChange: (taskId: string, status: Status) => void;
  onMoveTask: (taskId: string, status: Status) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
};

function Column({ title, tasks, onStatusChange, onMoveTask, onEditTask, onDeleteTask }: ColumnProps) {
  return (
    <div
      className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-5 shadow-2xl shadow-slate-950/20 backdrop-blur-sm min-h-[650px]"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const taskId = event.dataTransfer.getData("text/plain");

        if (taskId) {
          onMoveTask(taskId, title as Status);
        }
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-white">{title}</h2>

        <span className="rounded-full bg-slate-800 px-3 py-1.5 text-sm font-semibold text-slate-300">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-4">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              taskId={task.id}
              title={task.title}
              description={task.description}
              status={task.status}
              priority={task.priority}
              onStatusChange={(status) => onStatusChange(task.id, status)}
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))
        ) : (
          <p className="text-sm text-gray-500">No tasks in this column.</p>
        )}
      </div>
    </div>
  );
}

export default Column;
