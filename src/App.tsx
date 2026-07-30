import { useMemo, useState, type FormEvent } from "react";
import Header from "./components/Header";
import Column from "./components/Column";
import type { Task, Status, Priority } from "./types/Task";

const priorityOrder: Record<Priority, number> = {
  High: 1,
  Medium: 2,
  Low: 3,
};

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Design wireframes",
    description: "Create the kanban dashboard layout.",
    status: "To Do",
    priority: "High",
  },
  {
    id: "2",
    title: "Implement drag and drop",
    description: "Enable moving tasks between columns.",
    status: "In Progress",
    priority: "Medium",
  },
  {
    id: "3",
    title: "Write review notes",
    description: "Collect feedback and finalize task details.",
    status: "In Review",
    priority: "Low",
  },
  {
    id: "4",
    title: "Deploy application",
    description: "Publish the kanban board for users.",
    status: "Done",
    priority: "Medium",
  },
];

const columns: Status[] = ["To Do", "In Progress", "In Review", "Done"];

function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState<Status>("To Do");
  const [newPriority, setNewPriority] = useState<Priority>("Medium");

  const board = useMemo(
    () => columns.map((status) => ({
      status,
      tasks: tasks
        .filter((task) => task.status === status)
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]),
    })),
    [tasks],
  );

  function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newTitle.trim() || !newDescription.trim()) {
      return;
    }

    const newTask: Task = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: newTitle.trim(),
      description: newDescription.trim(),
      status: newStatus,
      priority: newPriority,
    };

    setTasks((current) => [newTask, ...current]);
    setNewTitle("");
    setNewDescription("");
    setNewStatus("To Do");
    setIsModalOpen(false);
  }

  function handleStatusChange(taskId: string, status: Status) {
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
            }
          : task,
      ),
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header onNewTask={() => setIsModalOpen(true)} />

      <main className="p-6 lg:p-10">
        <div className="mb-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-8 text-white shadow-xl">
          <h2 className="text-3xl font-semibold">Kanban task board</h2>
          <p className="mt-3 max-w-2xl text-slate-200">
            Track work across every stage with a simple board. Add new tasks and move them between columns.
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-4 lg:grid-cols-2">
          {board.map(({ status, tasks }) => (
            <Column
              key={status}
              title={status}
              tasks={tasks}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/70 px-4 py-8">
          <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900">Create a new task</h3>
                <p className="mt-2 text-sm text-slate-500">Add details and choose the initial status.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 transition hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleAddTask}>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="Example: Write feature spec"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                  rows={4}
                  placeholder="Describe the task..."
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <select
                  value={newStatus}
                  onChange={(event) => setNewStatus(event.target.value as Status)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                >
                  {columns.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Priority</span>
                <select
                  value={newPriority}
                  onChange={(event) => setNewPriority(event.target.value as Priority)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-400"
                >
                  {(["High", "Medium", "Low"] as Priority[]).map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Add task
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
