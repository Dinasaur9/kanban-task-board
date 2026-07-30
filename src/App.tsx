import { useEffect, useMemo, useState, type FormEvent } from "react";
import Header from "./components/Header";
import Column from "./components/Column";
import type { Task, Status, Priority } from "./types/Task";
import { supabase, isSupabaseConfigured } from "./lib/supabaseClient";

const priorityOrder: Record<Priority, number> = {
  High: 1,
  Medium: 2,
  Low: 3,
};

const columns: Status[] = ["To Do", "In Progress", "In Review", "Done"];

function App() {
  const [guestLabel, setGuestLabel] = useState<string>("");
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [useLocalFallback, setUseLocalFallback] = useState(!isSupabaseConfigured);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getTaskStorageKey = (id: string) => `kanbanTasks:${id}`;

  const loadTasksForId = (id: string) => {
    const saved = localStorage.getItem(getTaskStorageKey(id));
    if (!saved) {
      return [];
    }

    try {
      return JSON.parse(saved) as Task[];
    } catch {
      setErrorMessage("Unable to load saved tasks from local storage.");
      return [];
    }
  };
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState<Status>("To Do");
  const [newPriority, setNewPriority] = useState<Priority>("Medium");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const initializeLocalGuest = () => {
    let localGuestId = localStorage.getItem("kanbanLocalGuestId");
    if (!localGuestId) {
      localGuestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("kanbanLocalGuestId", localGuestId);
    }

    setGuestLabel(`Guest ${localGuestId.slice(0, 6)}`);
    setUserId(localGuestId);
    setUseLocalFallback(true);
    setIsAuthReady(true);
  };

  useEffect(() => {
    let mounted = true;

    const initializeSupabase = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!mounted) {
        return;
      }

      let user = sessionData?.session?.user ?? null;
      if (!user) {
        const { data, error: anonymousError } = await supabase.auth.signInAnonymously();
        if (!mounted) {
          return;
        }

        if (anonymousError || !data?.user) {
          console.warn("Supabase anonymous auth failed, falling back to local guest.", anonymousError?.message);
          initializeLocalGuest();
          return;
        }

        user = data.user;
      }

      if (user) {
        setUserId(user.id);
        setGuestLabel(`Guest ${user.id.slice(0, 6)}`);
        setUseLocalFallback(false);
      }
      setIsAuthReady(true);
    };

    if (!isSupabaseConfigured) {
      initializeLocalGuest();
    } else {
      initializeSupabase();
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      const user = session?.user ?? null;
      if (user) {
        setUserId(user.id);
        setGuestLabel(`Guest ${user.id.slice(0, 6)}`);
        setUseLocalFallback(false);
        setIsAuthReady(true);
      } else if (!useLocalFallback) {
        initializeLocalGuest();
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const board = useMemo(
    () =>
      columns.map((status) => ({
        status,
        tasks: tasks
          .filter((task) => task.status === status)
          .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]),
      })),
    [tasks],
  );

  const fetchRemoteTasks = async (userId: string) => {
    setErrorMessage(null);
    setIsLoading(true);

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Failed to load tasks from Supabase.", error.message);
      setErrorMessage("Unable to load tasks from Supabase. Refresh to retry.");
      setTasks([]);
    } else {
      setTasks(data ?? []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (!userId) {
      return;
    }

    if (useLocalFallback) {
      setErrorMessage(null);
      setTasks(loadTasksForId(userId));
      setIsLoading(false);
      return;
    }

    fetchRemoteTasks(userId);
  }, [userId, useLocalFallback]);

  useEffect(() => {
    if (!userId || !useLocalFallback) {
      return;
    }

    localStorage.setItem(getTaskStorageKey(userId), JSON.stringify(tasks));
  }, [tasks, userId, useLocalFallback]);


  async function handleAddTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newTitle.trim() || !newDescription.trim() || !userId) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    if (editingTask) {
      const updatedTask: Task = {
        ...editingTask,
        title: newTitle.trim(),
        description: newDescription.trim(),
        status: newStatus,
        priority: newPriority,
      };

      setTasks((current) => current.map((task) => (task.id === updatedTask.id ? updatedTask : task)));

      if (!useLocalFallback && isSupabaseConfigured) {
        const { error } = await supabase
          .from("tasks")
          .update({
            title: updatedTask.title,
            description: updatedTask.description,
            status: updatedTask.status,
            priority: updatedTask.priority,
          })
          .eq("id", updatedTask.id)
          .eq("user_id", userId);
        if (error) {
          console.warn("Failed to update task in Supabase.", error.message);
          setErrorMessage("Unable to save edits. Try again.");
        }
      }

      setEditingTask(null);
    } else {
      const row = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: newTitle.trim(),
        description: newDescription.trim(),
        status: newStatus,
        priority: newPriority,
        user_id: userId,
        created_at: new Date().toISOString(),
      };

      if (!useLocalFallback && isSupabaseConfigured) {
        const { data, error } = await supabase.from("tasks").insert([row]).select().single();
        if (error) {
          console.warn("Failed to add task to Supabase.", error.message);
          setErrorMessage("Unable to create task. Try again.");
          setTasks((current) => [row, ...current]);
        } else {
          setTasks((current) => [data ?? row, ...current]);
        }
      } else {
        setTasks((current) => [row, ...current]);
      }
    }

    setNewTitle("");
    setNewDescription("");
    setNewStatus("To Do");
    setNewPriority("Medium");
    setIsModalOpen(false);
    setIsSaving(false);
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
    setNewTitle(task.title);
    setNewDescription(task.description);
    setNewStatus(task.status);
    setNewPriority(task.priority);
    setIsModalOpen(true);
  }

  async function handleDeleteTask(taskId: string) {
    setIsSaving(true);
    setErrorMessage(null);
    setTasks((current) => current.filter((task) => task.id !== taskId));

    if (!useLocalFallback && isSupabaseConfigured && userId) {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", userId);
      if (error) {
        console.warn("Failed to delete task from Supabase.", error.message);
        setErrorMessage("Unable to delete task. Refresh to retry.");
      }
    }

    setIsSaving(false);
  }

  async function handleStatusChange(taskId: string, status: Status) {
    setIsSaving(true);
    setErrorMessage(null);

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

    if (!useLocalFallback && isSupabaseConfigured) {
      const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId).eq("user_id", userId);
      if (error) {
        console.warn("Failed to update task status in Supabase.", error.message);
        setErrorMessage("Unable to move the task. Refresh to retry.");
      }
    }

    setIsSaving(false);
  }

  function handleMoveTask(taskId: string, status: Status) {
    handleStatusChange(taskId, status);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header
        guestLabel={guestLabel}
        onNewTask={() => {
          setEditingTask(null);
          setNewTitle("");
          setNewDescription("");
          setNewStatus("To Do");
          setNewPriority("Medium");
          setIsModalOpen(true);
        }}
      />

      <main className="mx-auto max-w-8xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-8 py-10 shadow-2xl shadow-cyan-500/10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Kanban task board</h2>
              <p className="mt-4 text-slate-300 sm:text-lg">
                Track work across every stage with a polished board. Add tasks, move them between columns, and manage your workflow easily.
              </p>
            </div>
            <div className="inline-flex items-center gap-3 rounded-3xl border border-cyan-500/20 bg-slate-950/70 px-5 py-4 text-sm text-cyan-100 shadow-lg shadow-cyan-500/5 backdrop-blur-sm">
              <span className="inline-flex h-3.5 w-3.5 rounded-full bg-cyan-400" />
              {guestLabel
                ? `Signed in as ${guestLabel}. Your board state is saved per anonymous user in this browser.`
                : isAuthReady
                ? "Anonymous guest session is ready. Refresh the page to keep your board."
                : "Starting anonymous guest session..."}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 text-white shadow-lg shadow-slate-950/10">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Total tasks</p>
              <p className="mt-3 text-3xl font-semibold text-white">{tasks.length}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 text-white shadow-lg shadow-slate-950/10">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Completed</p>
              <p className="mt-3 text-3xl font-semibold text-cyan-300">{tasks.filter((task) => task.status === "Done").length}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 text-white shadow-lg shadow-slate-950/10">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">In progress</p>
              <p className="mt-3 text-3xl font-semibold text-amber-300">{tasks.filter((task) => task.status === "In Progress").length}</p>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mb-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-100 shadow-inner shadow-red-500/10">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-10 text-center text-slate-300 shadow-2xl shadow-slate-950/10">
            Loading tasks…
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-4 lg:grid-cols-2">
            {board.map(({ status, tasks }) => (
              <Column
                key={status}
                title={status}
                tasks={tasks}
                onStatusChange={handleStatusChange}
                onMoveTask={handleMoveTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/90 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl shadow-slate-950/60">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  {editingTask ? "Edit task" : "Create a new task"}
                </h3>
                <p className="mt-2 text-sm text-slate-400">Add details and choose the initial status.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-500/30 hover:bg-slate-900"
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
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Example: Write feature spec"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-300">Description</span>
                <textarea
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                  rows={4}
                  placeholder="Describe the task..."
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <select
                  value={newStatus}
                  onChange={(event) => setNewStatus(event.target.value as Status)}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
                >
                  {columns.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-300">Priority</span>
                <select
                  value={newPriority}
                  onChange={(event) => setNewPriority(event.target.value as Priority)}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
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
                  disabled={isSaving}
                  className={`rounded-full px-5 py-3 text-sm font-semibold text-slate-950 transition ${isSaving ? "bg-slate-600 cursor-not-allowed" : "bg-cyan-500 hover:bg-cyan-400"}`}
                >
                  {isSaving ? "Saving..." : editingTask ? "Save task" : "Add task"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(null);
                    setIsModalOpen(false);
                  }}
                  className="rounded-full border border-slate-700 bg-slate-950/80 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-900"
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
