import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Workspace', to: '/' },
  { label: 'Canvas', to: '/canvas' },
];

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="w-64 border-r border-[#5C5A57] bg-[#464543] p-5">
      <div className="mb-8">
        <p className="font-display text-xs uppercase tracking-[0.24em] text-[#B8B5B0]">Architect</p>
        <h1 className="mt-2 font-display text-2xl text-[#F2EFE9]">Research Canvas</h1>
      </div>
      <nav className="space-y-2">
        {navItems.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`block rounded-xl px-3 py-2 text-sm transition ${
                active ? 'bg-[#E08A78]/20 text-[#E08A78]' : 'text-[#B8B5B0] hover:bg-white/5 hover:text-[#F2EFE9]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
