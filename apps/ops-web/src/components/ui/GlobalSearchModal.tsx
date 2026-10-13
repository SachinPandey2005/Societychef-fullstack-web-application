import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
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
  SearchX,
  ChevronRight,
} from 'lucide-react';

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Navigation' | 'Orders' | 'Kitchens & Chefs' | 'Consumers' | 'Societies' | 'Support';
  path: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}

const NAVIGATION_SEARCH_ITEMS: SearchResultItem[] = [
  { id: 'nav-dashboard', title: 'Dashboard', subtitle: 'Overview & live telemetry', category: 'Navigation', path: '/', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'nav-kitchens', title: 'Chefs & Kitchens', subtitle: 'Onboarded chefs, KYC, verification', category: 'Navigation', path: '/kitchens', icon: <ChefHat className="w-4 h-4" /> },
  { id: 'nav-consumers', title: 'Consumers', subtitle: 'Registered users & household activity', category: 'Navigation', path: '/consumers', icon: <Users className="w-4 h-4" /> },
  { id: 'nav-societies', title: 'Housing Societies', subtitle: 'Partnered residential complexes', category: 'Navigation', path: '/societies', icon: <Building2 className="w-4 h-4" /> },
  { id: 'nav-orders', title: 'Live Orders', subtitle: 'Real-time order dispatch & tracking', category: 'Navigation', path: '/orders', icon: <ShoppingBag className="w-4 h-4" /> },
  { id: 'nav-dishes', title: 'Dishes Catalog', subtitle: 'Menu items, pricing, availability', category: 'Navigation', path: '/dishes', icon: <UtensilsCrossed className="w-4 h-4" /> },
  { id: 'nav-delivery', title: 'Delivery Fleet', subtitle: 'Rider dispatch & fleet metrics', category: 'Navigation', path: '/delivery', icon: <Bike className="w-4 h-4" /> },
  { id: 'nav-support', title: 'Support Desk', subtitle: 'Customer & chef support tickets', category: 'Navigation', path: '/support', icon: <Headphones className="w-4 h-4" /> },
  { id: 'nav-trust', title: 'Trust & Safety', subtitle: 'Kitchen hygiene & compliance', category: 'Navigation', path: '/trust', icon: <ShieldCheck className="w-4 h-4" /> },
  { id: 'nav-party', title: 'Party Mode', subtitle: 'Bulk event & party orders', category: 'Navigation', path: '/party-mode', icon: <PartyPopper className="w-4 h-4" /> },
  { id: 'nav-settlements', title: 'Chef Settlements', subtitle: 'Payouts & earnings calculation', category: 'Navigation', path: '/settlements', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'nav-payments', title: 'Gateway Payments', subtitle: 'Transactions & payment gateways', category: 'Navigation', path: '/payments', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'nav-finance', title: 'Finance Ops', subtitle: 'Ledger & revenue reconciliations', category: 'Navigation', path: '/finance', icon: <Wallet className="w-4 h-4" /> },
  { id: 'nav-analytics', title: 'Performance Analytics', subtitle: 'Platform growth & cohort metrics', category: 'Navigation', path: '/analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'nav-reports', title: 'Reports', subtitle: 'Financial & operational statements', category: 'Navigation', path: '/reports', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'nav-notifications', title: 'Notifications', subtitle: 'Broadcast alerts & notifications', category: 'Navigation', path: '/notifications', icon: <Bell className="w-4 h-4" /> },
  { id: 'nav-settings', title: 'Settings', subtitle: 'System preferences & parameters', category: 'Navigation', path: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
  { id: 'nav-rbac', title: 'Roles & Access', subtitle: 'Admin permissions & security', category: 'Navigation', path: '/admin/rbac', icon: <ShieldAlert className="w-4 h-4" /> },
  { id: 'nav-campaigns', title: 'Campaigns', subtitle: 'Promotional banners & discounts', category: 'Navigation', path: '/admin/campaigns', icon: <Megaphone className="w-4 h-4" /> },
  { id: 'nav-audit', title: 'Audit Logs', subtitle: 'System activity & admin logs', category: 'Navigation', path: '/admin/audit-logs', icon: <ClipboardList className="w-4 h-4" /> },
  { id: 'nav-monitoring', title: 'System Health', subtitle: 'API status & telemetry', category: 'Navigation', path: '/admin/monitoring', icon: <Activity className="w-4 h-4" /> },
];

const MOCK_ENTITY_ITEMS: SearchResultItem[] = [
  // Orders
  { id: 'ord-1042', title: 'Order #1042', subtitle: 'Spicy Paneer Biryani • Delivered to Prestige Falcon', category: 'Orders', path: '/orders', icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />, badge: 'Delivered', badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  { id: 'ord-1041', title: 'Order #1041', subtitle: 'Chef\'s Special Thali • Out for Delivery', category: 'Orders', path: '/orders', icon: <ShoppingBag className="w-4 h-4 text-amber-500" />, badge: 'In Transit', badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  { id: 'ord-1040', title: 'Order #1040', subtitle: 'Dal Makhani & Naan • Preparing by Gujju Rasoi', category: 'Orders', path: '/orders', icon: <ShoppingBag className="w-4 h-4 text-blue-500" />, badge: 'Preparing', badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },

  // Kitchens & Chefs
  { id: 'chef-1', title: 'Gujju Rasoi (Chef Swati)', subtitle: 'Prestige Falcon City • Verified Kitchen (4.9★)', category: 'Kitchens & Chefs', path: '/kitchens', icon: <ChefHat className="w-4 h-4 text-teal-500" />, badge: 'Active', badgeColor: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  { id: 'chef-2', title: 'Royal Spice (Chef Aarti)', subtitle: 'DLF Cybercity • Verified Kitchen (4.8★)', category: 'Kitchens & Chefs', path: '/kitchens', icon: <ChefHat className="w-4 h-4 text-teal-500" />, badge: 'Active', badgeColor: 'bg-teal-500/10 text-teal-600 border-teal-500/20' },
  { id: 'chef-3', title: 'Punjabi Tadka (Chef Rajesh)', subtitle: 'Hiranandani Estate • Pending Verification', category: 'Kitchens & Chefs', path: '/kitchens', icon: <ChefHat className="w-4 h-4 text-amber-500" />, badge: 'Pending KYC', badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },

  // Consumers
  { id: 'con-1', title: 'Ananya Verma', subtitle: 'Tower B-402, Prestige Falcon City • 24 Orders', category: 'Consumers', path: '/consumers', icon: <Users className="w-4 h-4 text-indigo-500" />, badge: 'VIP Consumer', badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
  { id: 'con-2', title: 'Rahul Sharma', subtitle: 'Villa 12, DLF Cybercity • 18 Orders', category: 'Consumers', path: '/consumers', icon: <Users className="w-4 h-4 text-indigo-500" />, badge: 'Regular', badgeColor: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },

  // Societies
  { id: 'soc-1', title: 'Prestige Falcon City', subtitle: 'Bangalore South • 450 Active Residents • 12 Chefs', category: 'Societies', path: '/societies', icon: <Building2 className="w-4 h-4 text-purple-500" />, badge: 'Tier 1 Society', badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  { id: 'soc-2', title: 'DLF Cybercity Phase 2', subtitle: 'Gurugram • 600 Active Residents • 18 Chefs', category: 'Societies', path: '/societies', icon: <Building2 className="w-4 h-4 text-purple-500" />, badge: 'Tier 1 Society', badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },

  // Support
  { id: 'ticket-409', title: 'TICKET-409: Delayed Refund', subtitle: 'Customer: Ananya Verma • Priority: High', category: 'Support', path: '/support', icon: <Headphones className="w-4 h-4 text-rose-500" />, badge: 'Open Ticket', badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20' },
  { id: 'ticket-408', title: 'TICKET-408: Food Quality Dispute', subtitle: 'Kitchen: Royal Spice • Assigned to Support Agent', category: 'Support', path: '/support', icon: <Headphones className="w-4 h-4 text-amber-500" />, badge: 'In Progress', badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
];

const ALL_SEARCH_ITEMS = [...NAVIGATION_SEARCH_ITEMS, ...MOCK_ENTITY_ITEMS];

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Reset query and selected index on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setActiveCategory('All');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter items based on query & category
  const filteredResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    let items = ALL_SEARCH_ITEMS;

    if (activeCategory !== 'All') {
      items = items.filter((item) => item.category === activeCategory);
    }

    if (!trimmed) {
      // Show top navigation & recent entities when query is empty
      return items.slice(0, 10);
    }

    return items.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(trimmed);
      const matchSubtitle = item.subtitle?.toLowerCase().includes(trimmed);
      const matchCategory = item.category.toLowerCase().includes(trimmed);
      const matchPath = item.path.toLowerCase().includes(trimmed);
      return matchTitle || matchSubtitle || matchCategory || matchPath;
    });
  }, [query, activeCategory]);

  // Handle item selection & navigation
  const handleSelectItem = (item: SearchResultItem) => {
    onClose();
    navigate(item.path);
  };

  // Keyboard navigation inside search results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length));
      } else if (e.key === 'Enter' && filteredResults.length > 0) {
        e.preventDefault();
        if (filteredResults[selectedIndex]) {
          handleSelectItem(filteredResults[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredResults, selectedIndex]);

  if (!isOpen) return null;

  const categories = ['All', 'Navigation', 'Orders', 'Kitchens & Chefs', 'Consumers', 'Societies', 'Support'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/70 backdrop-blur-sm transition-opacity">
        {/* Backdrop click to close */}
        <div className="fixed inset-0" onClick={onClose} />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header Search Input */}
          <div className="relative flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
            <Search className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mr-3" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search orders, chefs, consumers, tickets, pages..."
              className="w-full text-base bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden"
            />
            {query ? (
              <button
                onClick={() => {
                  setQuery('');
                  setSelectedIndex(0);
                  inputRef.current?.focus();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors mr-1"
                title="Clear query"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="p-1.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors font-medium border border-slate-200 dark:border-slate-800"
            >
              ESC
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20 overflow-x-auto no-scrollbar text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setSelectedIndex(0);
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 ${
                  activeCategory === cat
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Results List */}
          <div className="max-h-96 overflow-y-auto p-2 space-y-1">
            {filteredResults.length > 0 ? (
              filteredResults.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectItem(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-100 border border-teal-200/60 dark:border-teal-800/50'
                        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/50 text-slate-800 dark:text-slate-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-teal-600 text-white border-teal-500 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{item.title}</span>
                          {item.badge && (
                            <span
                              className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.subtitle && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden sm:inline-block">
                        {item.category}
                      </span>
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400'}`} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <SearchX className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    No results found for "{query}"
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Try searching for orders, kitchen names, tickets, or section titles.
                  </div>
                </div>
                <button
                  onClick={() => setQuery('')}
                  className="px-3 py-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-xl transition-colors"
                >
                  Clear search query
                </button>
              </div>
            )}
          </div>

          {/* Modal Footer Keyboard Shortcut Guide */}
          <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-2xs">
                  ↑
                </kbd>
                <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-2xs">
                  ↓
                </kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-2xs">
                  ↵
                </kbd>
                Select
              </span>
            </div>
            <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold">
              SocietyChef Global Console Search
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
