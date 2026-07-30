type HeaderProps = {
  guestLabel?: string;
  onNewTask?: () => void;
};

function Header({ guestLabel, onNewTask }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/95 px-8 py-4 shadow-sm shadow-slate-950/30 backdrop-blur-xl">
      <div className="mx-auto flex max-w-8xl items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">NextPlay Kanban</h1>
          <p className="mt-1 text-sm text-slate-400">A smooth board for anonymous guest workflows.</p>
        </div>

        <div className="flex items-center gap-3">
          {guestLabel ? (
            <span className="rounded-full border border-cyan-500/20 bg-slate-800 px-3 py-2 text-sm font-semibold text-cyan-100 shadow-sm shadow-slate-950/20">
              {guestLabel}
            </span>
          ) : null}

          <button
            type="button"
            onClick={onNewTask}
            className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400"
          >
            + New Task
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
