import TaskCard from "./TaskCard";
import type { Task, Status } from "../types/Task";

type ColumnProps = {
  title: string;
  tasks: Task[];
  onStatusChange: (taskId: string, status: Status) => void;
};

function Column({ title, tasks, onStatusChange }: ColumnProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 min-h-[650px]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>

        <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
          {tasks.length}
        </span>
      </div>

      <div className="space-y-4">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              title={task.title}
              description={task.description}
              status={task.status}
              priority={task.priority}
              onStatusChange={(status) => onStatusChange(task.id, status)}
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
