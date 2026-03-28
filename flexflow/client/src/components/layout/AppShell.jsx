import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MAIN_NAV } from './navigationConfig.js';
import { useApp } from '@/context/AppContext.jsx';
import { Button } from '@/components/ui/Button.jsx';

/**
 * Application chrome: header, outlet, mobile tab bar.
 */
export function AppShell() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const displayName = user?.name?.trim() || user?.username || 'Signed in';
  const handleSignOut = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col pb-24 md:pb-6">
      <header className="sticky top-0 z-40 border-b border-white/10 glass">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <motion.div
              className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-soft ring-1 ring-white/10"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              aria-hidden
            />
            <div className="min-w-0">
              <p className="font-display font-bold text-base leading-tight truncate">
                FlexFlow
              </p>
              <p className="text-[10px] text-slate-500 hidden sm:block truncate">
                Schedule smarter. Sleep better.
              </p>
            </div>
          </div>
          <nav
            className="flex items-center gap-1 overflow-x-auto max-w-[65vw] sm:max-w-none planner-scroll"
            aria-label="Main"
          >
            {MAIN_NAV.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all glass-hover ${
                    isActive
                      ? 'bg-white/15 text-white border border-white/20 shadow-soft'
                      : 'text-slate-400 border border-transparent'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className="shrink-0 md:!hidden !px-2 !py-1 text-[11px]"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
          <div className="hidden md:flex flex-col items-end gap-1 shrink-0 min-w-0 max-w-[10rem]">
            <span
              className="text-xs font-medium text-slate-200 truncate w-full text-right"
              title={user?.username ? `@${user.username}` : displayName}
            >
              {displayName}
            </span>
            {user?.username && user?.name?.trim() ? (
              <span className="text-[10px] text-slate-500 truncate w-full text-right">
                @{user.username}
              </span>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="!px-2 !py-1 text-[11px]"
              onClick={handleSignOut}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8">
        <Outlet />
      </main>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-white/10 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
        aria-label="Mobile tabs"
      >
        <div className="flex justify-around py-2 max-w-7xl mx-auto">
          {MAIN_NAV.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `text-[10px] font-medium px-2 py-1.5 rounded-lg min-w-[3.25rem] text-center ${
                  isActive ? 'text-indigo-300 bg-white/10' : 'text-slate-500'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
