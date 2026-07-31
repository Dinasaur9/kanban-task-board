import { useEffect, useMemo, useState, type FormEvent } from "react";
import Header from "./components/Header";
import Column from "./components/Column";
import type { Priority, Status, Task } from "./types/Task";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";

const priorityOrder: Record<Priority, number> = {
  high: 1,
  normal: 2,
  low: 3,
};

const columns: Status[] = ["todo", "in_progress", "in_review", "done"];
const localGuestIdKey = "kanbanLocalGuestId";

function getTaskStorageKey(id: string) {
  return `kanbanTasks:${id}`;
}

function getOrCreateLocalGuestId() {
  const savedId = localStorage.getItem(localGuestIdKey);
  if (savedId) return savedId;

  const id = crypto.randomUUID();
  localStorage.setItem(localGuestIdKey, id);
  return id;
}

function loadLocalTasks(id: string): Task[] {
  const saved = localStorage.getItem(getTaskStorageKey(id));
  if (!saved) return [];

  try {
    return JSON.parse(saved) as Task[];
  } catch {
    return [];
  }
}

function isOverdue(task: Task) {
  if (!task.due_date || task.status === "done") return false;
  const endOfDueDate = new Date(`${task.due_date}T23:59:59`);
  return endOfDueDate.getTime() < Date.now();
}

function App() {
  const [guestLabel, setGuestLabel] = useState("");
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [useLocalFallback, setUseLocalFallback] = useState(!isSupabaseConfigured);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState<Status>("todo");
  const [newPriority, setNewPriority] = useState<Priority>("normal");
  const [newDueDate, setNewDueDate] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeLocalGuest = () => {
      const id = getOrCreateLocalGuestId();
      if (!mounted) return;
      setGuestLabel(`Guest ${id.slice(0, 6)}`);
      setUserId(id);
      setUseLocalFallback(true);
      setIsAuthReady(true);
    };

    const initializeAuth = async () => {
      if (!isSupabaseConfigured) {
        initializeLocalGuest();
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!mounted) return;

      let user = sessionData.session?.user ?? null;
      if (!user && !sessionError) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (!mounted) return;
        if (!error) user = data.user;
      }

      if (!user) {
        setErrorMessage("Cloud sync is unavailable. Tasks are saved safely on this device.");
        initializeLocalGuest();
        return;
      }

      setUserId(user.id);
      setGuestLabel(`Guest ${user.id.slice(0, 6)}`);
      setUseLocalFallback(false);
      setIsAuthReady(true);
    };

    void initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted || !session?.user) return;
      setUserId(session.user.id);
      setGuestLabel(`Guest ${session.user.id.slice(0, 6)}`);
      setUseLocalFallback(false);
      setIsAuthReady(true);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const loadTasks = async () => {
      if (useLocalFallback) {
        const localTasks = loadLocalTasks(userId);
        if (!cancelled) {
          setTasks(localTasks);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (error) {
        setErrorMessage("Unable to load your board. Refresh to try again.");
        setTasks([]);
      } else {
        setTasks((data ?? []) as Task[]);
      }
      setIsLoading(false);
    };

    void loadTasks();
    return () => {
      cancelled = true;
    };
  }, [userId, useLocalFallback]);

  useEffect(() => {
    if (userId && useLocalFallback && !isLoading) {
      localStorage.setItem(getTaskStorageKey(userId), JSON.stringify(tasks));
    }
  }, [tasks, userId, useLocalFallback, isLoading]);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query);
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [priorityFilter, searchQuery, tasks]);

  const board = useMemo(
    () =>
      columns.map((status) => ({
        status,
        tasks: filteredTasks
          .filter((task) => task.status === status)
          .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]),
      })),
    [filteredTasks],
  );

  const resetForm = () => {
    setEditingTask(null);
    setNewTitle("");
    setNewDescription("");
    setNewStatus("todo");
    setNewPriority("normal");
    setNewDueDate("");
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    resetForm();
    setIsModalOpen(false);
  };

  async function handleSaveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim() || !userId) return;

    setIsSaving(true);
    setErrorMessage(null);

    if (editingTask) {
      const previousTask = editingTask;
      const updatedTask: Task = {
        ...editingTask,
        title: newTitle.trim(),
        description: newDescription.trim(),
        status: newStatus,
        priority: newPriority,
        due_date: newDueDate || null,
      };
      setTasks((current) => current.map((task) => (task.id === updatedTask.id ? updatedTask : task)));

      if (!useLocalFallback) {
        const { error } = await supabase
          .from("tasks")
          .update({
            title: updatedTask.title,
            description: updatedTask.description,
            status: updatedTask.status,
            priority: updatedTask.priority,
            due_date: updatedTask.due_date,
          })
          .eq("id", updatedTask.id)
          .eq("user_id", userId);

        if (error) {
          setTasks((current) => current.map((task) => (task.id === previousTask.id ? previousTask : task)));
          setErrorMessage("Unable to save those changes. Please try again.");
          setIsSaving(false);
          return;
        }
      }
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: newTitle.trim(),
        description: newDescription.trim(),
        status: newStatus,
        priority: newPriority,
        due_date: newDueDate || null,
        user_id: userId,
        created_at: new Date().toISOString(),
      };

      if (!useLocalFallback) {
        const { data, error } = await supabase.from("tasks").insert(newTask).select().single();
        if (error) {
          setErrorMessage("Unable to create the task. Please try again.");
          setIsSaving(false);
          return;
        }
        setTasks((current) => [data as Task, ...current]);
      } else {
        setTasks((current) => [newTask, ...current]);
      }
    }

    setIsSaving(false);
    closeModal();
  }

  function handleEditTask(task: Task) {
    setEditingTask(task);
    setNewTitle(task.title);
    setNewDescription(task.description);
    setNewStatus(task.status);
    setNewPriority(task.priority);
    setNewDueDate(task.due_date ?? "");
    setIsModalOpen(true);
  }

  async function handleDeleteTask(taskId: string) {
    const previousTasks = tasks;
    setTasks((current) => current.filter((task) => task.id !== taskId));
    setErrorMessage(null);

    if (!useLocalFallback && userId) {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", userId);
      if (error) {
        setTasks(previousTasks);
        setErrorMessage("Unable to delete the task. Please try again.");
      }
    }
  }

  async function handleStatusChange(taskId: string, status: Status) {
    const previousTasks = tasks;
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status } : task)));
    setErrorMessage(null);

    if (!useLocalFallback && userId) {
      const { error } = await supabase
        .from("tasks")
        .update({ status })
        .eq("id", taskId)
        .eq("user_id", userId);
      if (error) {
        setTasks(previousTasks);
        setErrorMessage("Unable to move the task. Please try again.");
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Header guestLabel={guestLabel} onNewTask={openCreateModal} />

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <section className="mb-8 overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-5 py-7 shadow-2xl shadow-cyan-500/10 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">Your workspace</p>
              <h2 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">Turn plans into progress.</h2>
              <p className="mt-4 max-w-2xl text-slate-300 sm:text-lg">
                Capture the next step, set its priority, and move work forward with a board that stays focused.
              </p>
            </div>
            <div className="inline-flex max-w-md items-center gap-3 rounded-3xl border border-cyan-500/20 bg-slate-950/70 px-5 py-4 text-sm text-cyan-100 shadow-lg shadow-cyan-500/5 backdrop-blur-sm">
              <span className="inline-flex h-3 w-3 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.8)]" />
              {guestLabel
                ? `${guestLabel} workspace · ${useLocalFallback ? "saved on this device" : "securely synced"}`
                : isAuthReady
                  ? "Your guest workspace is ready"
                  : "Preparing your private guest workspace…"}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total tasks" value={tasks.length} accent="text-white" />
            <StatCard label="Completed" value={tasks.filter((task) => task.status === "done").length} accent="text-cyan-300" />
            <StatCard label="In progress" value={tasks.filter((task) => task.status === "in_progress").length} accent="text-amber-300" />
            <StatCard label="Overdue" value={tasks.filter(isOverdue).length} accent="text-rose-300" />
          </div>
        </section>

        <section aria-label="Board controls" className="mb-6 flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search tasks</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tasks…"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20"
            />
          </label>
          <label>
            <span className="sr-only">Filter by priority</span>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as Priority | "all")}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 sm:w-52"
            >
              <option value="all">All priorities</option>
              <option value="high">High priority</option>
              <option value="normal">Normal priority</option>
              <option value="low">Low priority</option>
            </select>
          </label>
        </section>

        {errorMessage ? (
          <div role="alert" className="mb-6 rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-100">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div aria-live="polite" className="rounded-[2rem] border border-slate-800 bg-slate-900/90 p-10 text-center text-slate-300">
            Loading your workspace…
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2 2xl:grid-cols-4">
            {board.map(({ status, tasks: columnTasks }) => (
              <Column
                key={status}
                status={status}
                tasks={columnTasks}
                onMoveTask={handleStatusChange}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onAddTask={openCreateModal}
              />
            ))}
          </div>
        )}
      </main>

      {isModalOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto bg-slate-950/90 px-4 py-8 backdrop-blur-sm" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeModal();
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="task-dialog-title" className="w-full max-w-lg rounded-[2rem] border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/60 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{editingTask ? "Update work" : "Plan work"}</p>
                <h3 id="task-dialog-title" className="mt-2 text-2xl font-semibold text-white">
                  {editingTask ? "Edit task" : "Create a new task"}
                </h3>
              </div>
              <button type="button" onClick={closeModal} aria-label="Close task dialog" className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">
                Close
              </button>
            </div>

            <form className="mt-7 space-y-5" onSubmit={handleSaveTask}>
              <FieldLabel label="Title" required>
                <input
                  autoFocus
                  required
                  maxLength={120}
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  className="form-control"
                  placeholder="Example: Write feature spec"
                />
              </FieldLabel>

              <FieldLabel label="Description">
                <textarea
                  maxLength={1000}
                  value={newDescription}
                  onChange={(event) => setNewDescription(event.target.value)}
                  className="form-control"
                  rows={4}
                  placeholder="Add context, acceptance criteria, or a helpful note…"
                />
              </FieldLabel>

              <div className="grid gap-5 sm:grid-cols-2">
                <FieldLabel label="Due date">
                  <input type="date" value={newDueDate} onChange={(event) => setNewDueDate(event.target.value)} className="form-control" />
                </FieldLabel>
                <FieldLabel label="Priority">
                  <select value={newPriority} onChange={(event) => setNewPriority(event.target.value as Priority)} className="form-control">
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </select>
                </FieldLabel>
              </div>

              <FieldLabel label="Status">
                <select value={newStatus} onChange={(event) => setNewStatus(event.target.value as Status)} className="form-control">
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="in_review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </FieldLabel>

              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" disabled={isSaving} className="rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-600">
                  {isSaving ? "Saving…" : editingTask ? "Save task" : "Add task"}
                </button>
                <button type="button" onClick={closeModal} className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/10">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

function FieldLabel({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-300">
        {label}
        {required ? <span className="ml-1 text-cyan-300">*</span> : null}
      </span>
      {children}
    </label>
  );
}

export default App;
