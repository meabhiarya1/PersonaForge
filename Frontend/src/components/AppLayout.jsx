import { NavLink, Outlet } from 'react-router-dom';
import { FolderSearch, LayoutDashboard, UserRoundCog, WandSparkles } from 'lucide-react';
import TopBar from './TopBar.jsx';

const navItems = [
  {
    to: '/',
    label: 'Create Video',
    description: 'Prompt to video',
    icon: WandSparkles
  },
  {
    to: '/profiles',
    label: 'Profiles',
    description: 'Creator defaults',
    icon: UserRoundCog
  },
  {
    to: '/projects',
    label: 'Projects',
    description: 'Lookup and output',
    icon: FolderSearch
  }
];

const navClass = ({ isActive }) =>
  [
    'group flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition',
    isActive
      ? 'border-teal/30 bg-teal/10 text-teal shadow-sm'
      : 'border-transparent text-steel hover:border-line hover:bg-white hover:text-ink'
  ].join(' ');

const AppLayout = ({ apiHealthy, onHealthCheck }) => {
  return (
    <div className="app-surface min-h-screen">
      <TopBar apiHealthy={apiHealthy} onHealthCheck={onHealthCheck} />

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <nav className="rounded-2xl border border-line bg-white/90 p-3 shadow-soft">
            <div className="mb-3 flex items-center gap-2 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-white">
                <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Workspace</p>
                <p className="text-xs text-steel">Phase v2</p>
              </div>
            </div>

            <div className="grid gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navClass}>
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{item.label}</span>
                      <span className="block truncate text-xs opacity-75">{item.description}</span>
                    </span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </aside>

        <section className="min-w-0">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default AppLayout;
