type HeaderProps = {
  guestLabel?: string;
  onNewTask?: () => void;
};

function Header({ guestLabel, onNewTask }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/6 bg-slate-950/75 px-4 py-3 shadow-xl shadow-slate-950/20 backdrop-blur-2xl sm:px-8">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-cyan-500 text-lg font-black text-slate-950 shadow-lg shadow-cyan-500/20">N</div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white sm:text-xl">NextPlay <span className="text-slate-400">Kanban</span></h1>
            <p className="hidden text-xs text-slate-500 sm:block">Focused work, from idea to done.</p>
          </div>
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
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-300 to-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:shadow-cyan-400/30 sm:px-5"
          >
            + New Task
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
