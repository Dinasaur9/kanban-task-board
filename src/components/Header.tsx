type HeaderProps = {
  onNewTask?: () => void;
};

function Header({ onNewTask }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
      <h1 className="text-2xl font-bold text-slate-800">
        NextPlay Kanban
      </h1>

      <button
        onClick={onNewTask}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
      >
        + New Task
      </button>
    </header>
  );
}

export default Header;