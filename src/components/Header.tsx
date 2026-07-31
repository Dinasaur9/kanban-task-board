type HeaderProps = {
  guestLabel?: string;
  onNewTask?: () => void;
};

function Header({ guestLabel, onNewTask }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 px-4 py-4 shadow-sm shadow-slate-950/30 backdrop-blur-xl sm:px-8">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">NextPlay Kanban</h1>
          <p className="mt-1 hidden text-sm text-slate-400 sm:block">Focused work, from idea to done.</p>
        </div>

        <div className="flex items-center gap-3">
          {guestLabel ? (
            <span className="hidden rounded-full border border-cyan-500/20 bg-slate-800 px-3 py-2 text-sm font-semibold text-cyan-100 shadow-sm shadow-slate-950/20 md:inline-flex">
              {guestLabel}
            </span>
          ) : null}

          <button
            type="button"
            onClick={onNewTask}
            className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:bg-cyan-400 sm:px-5"
          >
            + New Task
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
