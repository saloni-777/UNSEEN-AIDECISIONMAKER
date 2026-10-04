import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { LayoutDashboard, Plus, List, Zap, Shield, LogOut, User, Menu, X } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/new', label: 'New Decision', icon: Plus },
  { to: '/dashboard/decisions', label: 'My Decisions', icon: List },
  { to: '/dashboard/new?challenge=true', label: 'Challenge Mode', icon: Zap, isChallenge: true },
];

const accountItems = [
  { to: '/dashboard/account', label: 'Account', icon: User },
  { to: '/dashboard/security', label: 'Security', icon: Shield },
];

export function DashboardLayout() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const initials = user?.user_metadata?.name
    ? (user.user_metadata.name as string).split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5">
        <Logo />
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#52525b]">Workspace</p>
        {navItems.map((item) => {
          const isChallenge = 'isChallenge' in item && item.isChallenge;
          const isActive = isChallenge
            ? location.pathname === '/dashboard/new' && location.search === '?challenge=true'
            : location.pathname === item.to;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={'end' in item ? item.end : undefined}
              onClick={() => setMobileNavOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-[#18181b] text-[#f4f4f5]'
                  : 'text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#18181b]/50'
              }`}
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          );
        })}

        <div className="pt-6">
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#52525b]">Account</p>
          {accountItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={() => setMobileNavOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  isActive ? 'bg-[#18181b] text-[#f4f4f5]' : 'text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#18181b]/50'
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#18181b]/50 transition-all duration-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-[#27272a]">
        <div className="flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-[#27272a] flex items-center justify-center text-xs font-medium text-[#a1a1aa]">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[#f4f4f5] truncate">
              {user?.user_metadata?.name || 'User'}
            </p>
            <p className="text-[10px] text-[#52525b] truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 border-r border-[#27272a] bg-[#0a0a0b] hidden md:block">
        {sidebar}
      </aside>

      {/* Mobile header */}
      <div className="md:hidden sticky top-0 z-40 h-14 border-b border-[#27272a] bg-[#0a0a0b]/80 backdrop-blur-xl flex items-center justify-between px-4">
        <Logo size="sm" />
        <button
          onClick={() => setMobileNavOpen(true)}
          className="btn-ghost p-2"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile nav drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 md:hidden"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed left-0 top-0 bottom-0 w-64 border-r border-[#27272a] bg-[#0a0a0b] z-50 md:hidden"
            >
              <button
                onClick={() => setMobileNavOpen(false)}
                className="absolute top-4 right-4 btn-ghost p-2"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="md:ml-60 min-h-screen">
        <div className="max-w-4xl mx-auto px-6 py-8 md:py-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
