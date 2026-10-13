import React, { useState, useCallback, useEffect } from 'react';
import { NavLink, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GlobalSearchModal } from './ui/GlobalSearchModal';
import {
  LayoutDashboard,
  ChefHat,
  Users,
  Building2,
  ShoppingBag,
  UtensilsCrossed,
  Bike,
  Headphones,
  ShieldCheck,
  CreditCard,
  DollarSign,
  Wallet,
  PartyPopper,
  BarChart3,
  TrendingUp,
  Bell,
  Settings,
  ShieldAlert,
  Megaphone,
  ClipboardList,
  Activity,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Search,
  ChevronRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavSection {
  title: string;
  items: {
    path: string;
    label: string;
    icon: React.ReactNode;
    badge?: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Core Operations',
    items: [
      { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
      { path: '/kitchens', label: 'Chefs & Kitchens', icon: <ChefHat className="w-4 h-4" /> },
      { path: '/consumers', label: 'Consumers', icon: <Users className="w-4 h-4" /> },
      { path: '/societies', label: 'Housing Societies', icon: <Building2 className="w-4 h-4" /> },
      { path: '/orders', label: 'Live Orders', icon: <ShoppingBag className="w-4 h-4" /> },
      { path: '/dishes', label: 'Dishes Catalog', icon: <UtensilsCrossed className="w-4 h-4" /> },
      { path: '/delivery', label: 'Delivery Fleet', icon: <Bike className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Support & Safety',
    items: [
      { path: '/support', label: 'Support Desk', icon: <Headphones className="w-4 h-4" /> },
      { path: '/trust', label: 'Trust & Safety', icon: <ShieldCheck className="w-4 h-4" /> },
      { path: '/party-mode', label: 'Party Mode', icon: <PartyPopper className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Finance & Payouts',
    items: [
      { path: '/settlements', label: 'Chef Settlements', icon: <CreditCard className="w-4 h-4" /> },
      { path: '/payments', label: 'Gateway Payments', icon: <DollarSign className="w-4 h-4" /> },
      { path: '/finance', label: 'Finance Ops', icon: <Wallet className="w-4 h-4" /> },
    ],
  },
  {
    title: 'Analytics & Admin',
    items: [
      { path: '/analytics', label: 'Performance', icon: <BarChart3 className="w-4 h-4" /> },
      { path: '/reports', label: 'Reports', icon: <TrendingUp className="w-4 h-4" /> },
      { path: '/notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
      { path: '/admin/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
      { path: '/admin/rbac', label: 'Roles & Access', icon: <ShieldAlert className="w-4 h-4" /> },
      { path: '/admin/campaigns', label: 'Campaigns', icon: <Megaphone className="w-4 h-4" /> },
      { path: '/admin/audit-logs', label: 'Audit Logs', icon: <ClipboardList className="w-4 h-4" /> },
      { path: '/admin/monitoring', label: 'System Health', icon: <Activity className="w-4 h-4" /> },
    ],
  },
];

const TypedNavLink = NavLink as any;
const TypedOutlet = Outlet as any;

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Keyboard shortcut listener (Cmd+K / Ctrl+K / /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  const allNavItems = NAV_SECTIONS.flatMap((s) => s.items);
  const activeItem = allNavItems.find((item) =>
    item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-900/40">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-tight flex items-center gap-1.5">
                RasoHi
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  OPS
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Enterprise Console</div>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="p-1 rounded-lg text-slate-400 hover:text-white md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grouped Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {section.title}
              </div>
              {section.items.map((item) => (
                <TypedNavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={closeSidebar}
                  className={({ isActive }: { isActive: boolean }) =>
                    `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 group ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-xs font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="shrink-0 transition-transform group-hover:scale-110">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {item.badge}
                    </span>
                  )}
                </TypedNavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-teal-800 text-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate">
                  {user?.name || 'Ops Admin'}
                </div>
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                  {user?.role || 'SUPER_ADMIN'}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 px-4 md:px-8 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 md:hidden hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Back Button & Breadcrumb Path */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => navigate(-1)}
                title="Go Back"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-600 dark:hover:text-white hover:border-teal-500 transition-all shadow-2xs group cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-white transition-colors shrink-0" />
                <span>Back</span>
              </button>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-2.5">
                <span>Ops Console</span>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {activeItem?.label || 'Dashboard'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions & Controls */}
          <div className="flex items-center gap-3">
            {/* Global Search trigger (Desktop) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="hidden lg:flex items-center justify-between px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition-all w-64 shadow-2xs group text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-500 transition-colors shrink-0" />
                <span className="truncate">Search orders, chefs, tickets...</span>
              </div>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-2xs">
                ⌘K
              </kbd>
            </button>

            {/* Global Search trigger (Mobile) */}
            <button
              onClick={() => setIsSearchOpen(true)}
              title="Search Console (⌘K)"
              className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Theme Switcher Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Notifications Button */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            </button>
          </div>
        </header>

        {/* Page Content View */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 dark:bg-slate-950">
          <TypedOutlet />
        </main>
      </div>

      {/* Global Command Palette / Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
}
