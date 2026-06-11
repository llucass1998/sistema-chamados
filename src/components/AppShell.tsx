import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface AppShellProps {
  title: string;
  description: string;
  userName?: string;
  userRole?: string;
  isStaff?: boolean;
  onLogout: () => void;
  children: ReactNode;
  actions?: ReactNode;
}

const navItems = [
  { href: '/dashboard', label: 'Portal', staffOnly: false },
  { href: '/admin', label: 'Painel tecnico', staffOnly: true },
];

function AppShell({ title, description, userName, userRole, isStaff = false, onLogout, children, actions }: AppShellProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f4f6fb] text-slate-950">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-slate-200 bg-[#0f172a] text-white lg:border-b-0 lg:border-r lg:border-slate-900">
          <div className="flex h-full flex-col px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-white text-sm font-black text-[#0f172a]">
                SD
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-sky-300">ServiceDesk</p>
                <p className="text-xs text-slate-400">Operations Suite</p>
              </div>
            </div>

            <nav className="mt-8 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
              {navItems
                .filter((item) => !item.staffOnly || isStaff)
                .map((item) => {
                  const isActive = location.pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold transition ${
                        isActive
                          ? 'bg-white text-slate-950 shadow-sm'
                          : 'text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
            </nav>

            <div className="mt-6 hidden border-t border-white/10 pt-5 lg:block">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Conta</p>
              <p className="mt-3 truncate text-sm font-bold text-white">{userName ?? 'Colaborador'}</p>
              <p className="mt-1 text-xs capitalize text-slate-400">{userRole ?? 'colaborador'}</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">Central de atendimento</p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {actions}
                <button
                  onClick={onLogout}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                >
                  Sair
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
