#!/usr/bin/env bash
set -e
# Run this from the ROOT of your admin-dashboard repo (the folder that contains `src/`).
echo "Applying files..."

mkdir -p "src"
cat > "src/App.tsx" << 'CLAUDE_EOF'
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Events from './pages/Events';
import Clubs from './pages/Clubs';
import Ticketing from './pages/Ticketing';
import Admins from './pages/Admins';
import Analytics from './pages/Analytics';
import AdsBroadcast from './pages/AdsBroadcast';
import PollsContests from './pages/PollsContests';
import SupportActivity from './pages/SupportActivity';
import ActivityLogs from './pages/ActivityLogs';
import Settings from './pages/Settings';
import ManageFilters from './pages/ManageFilters';
import Recommendations from './pages/Recommendations';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

import ClubOnboarding from './pages/ClubOnboarding';
import EventAdminOnboarding from './pages/EventAdminOnboarding';
import OrganiserRequests from './pages/OrganiserRequests';

const ProtectedRoute = ({ 
  children, 
  requireSuperAdmin = false,
  allowedRoles
}: { 
  children: React.ReactNode, 
  requireSuperAdmin?: boolean,
  allowedRoles?: string[]
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#0B0B0F] text-white font-bold uppercase tracking-widest text-xs">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireSuperAdmin && user.role !== 'SUPER_ADMIN') return <Navigate to="/" replace />;
  
  // Onboarding check for CLUB_ADMIN
  const isClaiming = window.location.pathname.startsWith('/claim-club/');
  if (user.role === 'CLUB_ADMIN' && !user.organisation && window.location.pathname !== '/club-onboarding' && !isClaiming) {
    return <Navigate to="/club-onboarding" replace />;
  }

  // Onboarding check for EVENT_ADMIN
  if (user.role === 'EVENT_ADMIN' && !user.organisation && window.location.pathname !== '/event-onboarding') {
    return <Navigate to="/event-onboarding" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
};

import AccountSettings from './pages/AccountSettings';
import EventAccountSettings from './pages/EventAccountSettings';
import ClaimClubForm from './pages/ClaimClubForm';
import EventAdminProfilePage from './pages/EventAdminProfilePage';
import ClubProfilePage from './pages/ClubProfilePage';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter basename="/app/admin">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/club-onboarding" element={<ProtectedRoute><ClubOnboarding /></ProtectedRoute>} />
            <Route path="/event-onboarding" element={<ProtectedRoute><EventAdminOnboarding /></ProtectedRoute>} />
            <Route path="/claim-club/:clubId" element={<ProtectedRoute><ClaimClubForm /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<ProtectedRoute requireSuperAdmin><Users /></ProtectedRoute>} />
              <Route path="organiser-requests" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'NORMAL_ADMIN']}><OrganiserRequests /></ProtectedRoute>} />
              <Route path="events" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'EVENT_ADMIN', 'NORMAL_ADMIN']}><Events /></ProtectedRoute>} />
              <Route path="clubs" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'CLUB_ADMIN', 'NORMAL_ADMIN']}><Clubs /></ProtectedRoute>} />
              <Route path="ticketing" element={<Ticketing />} />
              <Route path="ads-broadcast" element={<ProtectedRoute requireSuperAdmin><AdsBroadcast /></ProtectedRoute>} />
              <Route path="polls-contests" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'NORMAL_ADMIN']}><PollsContests /></ProtectedRoute>} />
              <Route path="support-activity" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'NORMAL_ADMIN', 'CLUB_ADMIN', 'EVENT_ADMIN']}><SupportActivity /></ProtectedRoute>} />
              <Route path="activity-logs" element={<ProtectedRoute requireSuperAdmin><ActivityLogs /></ProtectedRoute>} />
              <Route path="analytics" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_ADMIN']}><Analytics /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><Settings /></ProtectedRoute>} />
              <Route path="manage-filters" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'NORMAL_ADMIN']}><ManageFilters /></ProtectedRoute>} />
              <Route path="recommendations" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'NORMAL_ADMIN']}><Recommendations /></ProtectedRoute>} />
              <Route path="admins" element={<ProtectedRoute requireSuperAdmin><Admins /></ProtectedRoute>} />
              <Route path="account-settings" element={<ProtectedRoute allowedRoles={['CLUB_ADMIN']}><AccountSettings /></ProtectedRoute>} />
              <Route path="event-account-settings" element={<ProtectedRoute allowedRoles={['EVENT_ADMIN']}><EventAccountSettings /></ProtectedRoute>} />
              <Route path="event-profile" element={<ProtectedRoute allowedRoles={['EVENT_ADMIN']}><EventAdminProfilePage /></ProtectedRoute>} />
              <Route path="club-profile" element={<ProtectedRoute allowedRoles={['CLUB_ADMIN']}><ClubProfilePage /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
CLAUDE_EOF
echo "  wrote src/App.tsx"

mkdir -p "src/components"
cat > "src/components/Layout.tsx" << 'CLAUDE_EOF'
import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Calendar,
  MapPin,
  ShieldAlert,
  BarChart3,
  Radio,
  Shield,
  LogOut,
  Search,
  Bell,
  History,
  Star,
  User,
  CreditCard,
  Building2,
  FileText,
  MessageSquare,
  ChevronRight,
  Command,
  Bug,
  CheckCircle2,
  UserPlus,
  Radio as RadioIcon,
  Settings,
  HelpCircle,
  Mail,
  Zap,
  Layers,
  Layout as LayoutIcon,
  Plus,
  RefreshCw,
  Vote,
  Trophy,
  AlertCircle,
  Activity,
  ChevronLeft,
  PanelRightClose,
  PanelRightOpen,
  TrendingUp,
  MousePointer2,
  Eye,
  Ticket,
  PieChart as PieChartIcon,
  Filter,
  Download,
  Calendar as CalendarIcon,
  ChevronDown,
  Users as Users2,
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ClubProfilePreview from './ClubProfilePreview';
import EventProfilePreview from './EventProfilePreview';
import RightClubProfile from './RightClubProfile';

import { API_BASE } from '../lib/apiConfig';
function RightSidebar({ isOpen, toggle, currentPage }: { isOpen: boolean, toggle: () => void, currentPage: string }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const notifications: any[] = [];
  const team: any[] = [];

  // FIXED: real backend path is /vendor/get_all_vendors, response is
  // wrapped as { success, message, data }, so unwrap .data.
  const { data: clubs } = useQuery({
    queryKey: ['clubs-sidebar'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!token && user?.role === 'CLUB_ADMIN',
  });

  const clubData = Array.isArray(clubs) ? clubs.find((c: any) => c.name === user?.organisation) : null;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 320 : 0, opacity: isOpen ? 1 : 0 }}
      className={cn(
        "border-l border-border bg-sidebar overflow-hidden flex flex-col shrink-0 relative",
        !isOpen && "border-l-0"
      )}
    >
      <div className="w-[320px] h-full flex flex-col overflow-hidden relative">
        {user?.role === 'CLUB_ADMIN' ? (
          <div className="flex-1 overflow-hidden p-6 space-y-8 custom-scrollbar">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Navigation</h3>
                <button onClick={toggle} className="p-2 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/60 transition-colors">
                  <PanelRightClose className="w-4 h-4 text-white" />
                </button>
             </div>
             <div className="space-y-4">
                <button
                  onClick={() => navigate('/club-profile')}
                  className="w-full flex items-center justify-between p-4 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-primary/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white uppercase tracking-tight">Full Profile</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Manage venue presence</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-all" />
                </button>

                <button
                  onClick={() => navigate('/account-settings')}
                  className="w-full flex items-center justify-between p-4 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:border-emerald-500/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-white uppercase tracking-tight">Account Settings</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest mt-0.5">Manage account details</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400 transition-all" />
                </button>
             </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Notifications</h3>
              <button onClick={toggle} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
                <PanelRightClose className="w-4 h-4 text-muted-foreground hover:text-white" />
              </button>
            </div>
            <div className="space-y-4">
              {notifications.map((n) => (
                <div key={n.id} className="flex gap-3 group cursor-pointer">
                  <div className={cn("w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", n.color)}>
                    <n.icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-white leading-snug truncate group-hover:text-primary transition-colors">{n.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="py-6 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  No notifications
                </p>
              )}
            </div>

            {currentPage !== 'events' && currentPage !== 'clubs' && user?.role !== 'EVENT_ADMIN' && user?.role !== 'CLUB_ADMIN' && user?.role !== 'NORMAL_ADMIN' && (
              <div>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">Team Members</h3>
                <div className="space-y-4">
                  {team.map((t) => (
                    <div key={t.name} className="flex items-center gap-3 group cursor-pointer">
                      <img src={t.avatar} alt={t.name} className="w-8 h-8 rounded-full object-cover border border-white/10 group-hover:border-primary transition-colors" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <p className="text-xs text-white font-medium truncate">{t.name}</p>
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-bold", t.color)}>
                          {t.role === 'SUPER ADMIN' ? 'Main Admin' :
                           t.role === 'EVENT_ADMIN' ? 'Event Manager' :
                           t.role === 'CITY_ADMIN' ? 'City Manager' :
                           t.role === 'CLUB_ADMIN' ? 'Club Manager' : t.role}
                        </span>
                      </div>
                    </div>
                  ))}
                  {team.length === 0 && (
                    <p className="py-6 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      No team members available
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.aside>
  );
}

export default function Layout() {
  const { user, logout, token, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // ── New: refresh + notification state ──────────────────────────────────────
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Persistence
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('leftSidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('rightSidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem('leftSidebarOpen', JSON.stringify(isLeftSidebarOpen));
  }, [isLeftSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('rightSidebarOpen', JSON.stringify(isRightSidebarOpen));
  }, [isRightSidebarOpen]);

  // TODO: BROKEN - there is no /search route on the real backend. This query
  // will always 404 until a searchRoute.js is added server-side.
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return null;
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: searchQuery.length > 0,
  });

  // FIXED: real backend path is /notification/all, response is wrapped as
  // { success, message, data }, so unwrap .data.
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/notification/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!token,
    refetchInterval: 30_000, // poll every 30s
  });

  const notifList = Array.isArray(notifications) ? notifications : [];
  const unreadCount = notifList.filter((n: any) => !n.read).length;

  const [isClubProfileOpen, setIsClubProfileOpen] = useState(false);
  const [isEventProfileOpen, setIsEventProfileOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  // FIXED: real backend path is /vendor/get_all_vendors, response is
  // wrapped as { success, message, data }, so unwrap .data.
  const { data: clubs } = useQuery({
    queryKey: ['clubs-header'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!token && user?.role === 'CLUB_ADMIN',
  });

  const clubData = Array.isArray(clubs) ? clubs.find((c: any) => c.name === user?.organisation) : null;

  // ── Keyboard shortcut for search ───────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        const input = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Click-outside: search ──────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Click-outside: notifications ───────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Refresh handler ────────────────────────────────────────────────────────
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const currentPage = location.pathname.split('/')[1] || 'overview';

  const NavLink = ({ to, icon: Icon, children, badge }: any) => {
    const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
    return (
      <Link to={to} className={cn(
        "flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative mb-1",
        isLeftSidebarOpen ? "justify-between overflow-hidden" : "justify-center",
        isActive ? "bg-gradient-to-r from-primary/10 to-secondary/10 text-white border border-primary/20" : "text-muted-foreground hover:text-white hover:bg-white/5"
      )}>
        {isActive && (
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-secondary shadow-[0_0_10px_rgba(255,45,154,0.8)]" />
        )}
        <div className={cn("flex items-center relative z-10", isLeftSidebarOpen ? "gap-3" : "justify-center")}>
          <div className="relative">
            <Icon className={cn("w-4 h-4 transition-colors shrink-0", isActive ? "text-primary drop-shadow-[0_0_8px_rgba(255,45,154,0.8)]" : "text-muted-foreground group-hover:text-white")} />
            {!isLeftSidebarOpen && badge && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center bg-primary text-white text-[8px] font-black rounded-full shadow-[0_0_10px_rgba(255,45,154,0.5)] border border-background z-20">
                {badge}
              </span>
            )}
          </div>
          <span className={cn(!isLeftSidebarOpen && "hidden")}>{children}</span>
        </div>
        {isLeftSidebarOpen && badge && (
          <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold relative z-10">{badge}</span>
        )}
      </Link>
    );
  };

  const hasRightSidebar = user?.role === 'SUPER_ADMIN' || user?.role === 'NORMAL_ADMIN';

  return (
    <div className="min-h-screen bg-background flex text-white font-sans overflow-hidden">
      {/* Left Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isLeftSidebarOpen ? 260 : 80 }}
        className="border-r border-border bg-sidebar flex flex-col shrink-0 relative z-40"
      >
        <div className={cn("p-6 flex items-center shrink-0 overflow-hidden", isLeftSidebarOpen ? "gap-3" : "justify-center")}>
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-lg shadow-primary/20 shrink-0 flex items-center justify-center bg-gradient-to-br from-primary to-purple-600">
            <img src="./hii-logo.png" alt="Hii" className="w-full h-full object-cover" />
          </div>
          <AnimatePresence>
            {isLeftSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="min-w-0"
              >
                <h1 className="text-sm font-black text-white tracking-tighter uppercase truncate">
                  Hii Admin Dashboard
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar overflow-x-hidden">
          <AnimatePresence initial={false}>
            {isLeftSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="px-6 mb-3 overflow-hidden"
              >
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Main Menu</p>
              </motion.div>
            )}
          </AnimatePresence>
          <nav className={cn("px-3 space-y-1", isLeftSidebarOpen ? "mb-8" : "mb-2")}>
            <NavLink to="/" icon={LayoutDashboard}>Overview</NavLink>
            {user?.role !== 'NORMAL_ADMIN' && <NavLink to="/analytics" icon={BarChart3}>Analytics</NavLink>}
            {user?.role === 'SUPER_ADMIN' && (
              <NavLink to="/ads-broadcast" icon={Radio}>Ads & Broadcast</NavLink>
            )}
          </nav>

          <AnimatePresence initial={false}>
            {isLeftSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="px-6 mb-3 overflow-hidden"
              >
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Management</p>
              </motion.div>
            )}
          </AnimatePresence>
          <nav className={cn("px-3 space-y-1", isLeftSidebarOpen ? "mb-8" : "mb-2")}>
            {user?.role === 'SUPER_ADMIN' && (
              <NavLink to="/users" icon={Users}>Users</NavLink>
            )}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'NORMAL_ADMIN') && (
              <NavLink to="/organiser-requests" icon={UserPlus}>Organiser Requests</NavLink>
            )}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'EVENT_ADMIN' || user?.role === 'NORMAL_ADMIN') && (
              <NavLink to="/events" icon={Calendar}>Events</NavLink>
            )}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'CLUB_ADMIN' || user?.role === 'NORMAL_ADMIN') && (
              <NavLink to="/clubs" icon={user?.role === 'CLUB_ADMIN' ? Calendar : Building2}>
                {user?.role === 'CLUB_ADMIN' ? 'Event Listings' : 'Clubs & Venues'}
              </NavLink>
            )}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'NORMAL_ADMIN') && <NavLink to="/polls-contests" icon={Vote}>Polls & Contests</NavLink>}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'NORMAL_ADMIN') && <NavLink to="/recommendations" icon={Sparkles}>Recommendations</NavLink>}
          </nav>

          <AnimatePresence initial={false}>
            {isLeftSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="px-6 mb-3 overflow-hidden"
              >
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">Support & Requests</p>
              </motion.div>
            )}
          </AnimatePresence>
          <nav className="px-3 space-y-1 mb-8">
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'NORMAL_ADMIN' || user?.role === 'CLUB_ADMIN' || user?.role === 'EVENT_ADMIN') && (
              <NavLink to="/support-activity" icon={MessageSquare} badge="7">
                Support & Requests
              </NavLink>
            )}
          </nav>
        </div>

        {/* Profile Section */}
        <div className="relative p-3 border-t border-border/20 bg-sidebar shrink-0 z-20">
          <AnimatePresence>
            {isProfileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className={cn(
                  "absolute bottom-full left-3 right-3 mb-2 bg-[#09090B] border border-white/20 rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.9)] p-1.5 z-50 ring-1 ring-white/5",
                  !isLeftSidebarOpen && "left-4 w-48"
                )}
              >
                <div className="space-y-0.5">
                  {user?.role === 'SUPER_ADMIN' && (
                    <>
                      <Link to="/admins" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all">
                        <Shield className="w-3.5 h-3.5" />
                        Admins
                      </Link>
                      <Link to="/manage-filters" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all">
                        <Filter className="w-3.5 h-3.5" />
                        Manage Filters
                      </Link>
                      <Link to="/activity-logs" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all">
                        <History className="w-3.5 h-3.5" />
                        Activity Logs
                      </Link>
                      <Link to="/settings" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all">
                        <Settings className="w-3.5 h-3.5" />
                        Settings
                      </Link>
                    </>
                  )}

                  {user?.role === 'NORMAL_ADMIN' && (
                    <Link to="/manage-filters" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all">
                      <Filter className="w-3.5 h-3.5" />
                      Manage Filters
                    </Link>
                  )}

                  {user?.role === 'CLUB_ADMIN' && (
                    <Link to="/account-settings" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all">
                      <Settings className="w-3.5 h-3.5" />
                      Account Settings
                    </Link>
                  )}

                  {user?.role === 'EVENT_ADMIN' && (
                    <Link to="/event-account-settings" onClick={() => setIsProfileDropdownOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all">
                      <Settings className="w-3.5 h-3.5" />
                      Account Settings
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold text-red-400 hover:bg-red-400/10 transition-all text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className={cn(
              "w-full flex items-center gap-3 p-2 rounded-2xl transition-all group overflow-hidden",
              isProfileDropdownOpen ? "bg-white/5" : "hover:bg-white/5",
              !isLeftSidebarOpen && "justify-center px-0"
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-primary/20 shrink-0 group-hover:scale-105 transition-transform">
              {user?.role === 'CLUB_ADMIN' ? user?.organisation?.charAt(0) : (user?.name?.charAt(0) || 'A')}
            </div>

            {isLeftSidebarOpen && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-black text-white leading-none truncate mb-1">
                    {user?.role === 'CLUB_ADMIN' ? user?.organisation : (user?.name || 'Hii Admin')}
                  </p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest truncate">
                    {user?.role === 'SUPER_ADMIN' ? 'Main Admin' :
                     user?.role === 'NORMAL_ADMIN' ? 'Admin' :
                     user?.role === 'EVENT_ADMIN' ? 'Event Manager' :
                     user?.role === 'CLUB_ADMIN' ? 'Club Manager' : user?.role?.replace('_', ' ')}
                  </p>
                </div>
                <ChevronDown className={cn(
                  "w-3.5 h-3.5 text-muted-foreground transition-transform duration-300",
                  isProfileDropdownOpen && "rotate-180"
                )} />
              </>
            )}
          </button>
        </div>

        {/* Sidebar Toggle */}
        <button
          onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-white transition-colors z-50 shadow-xl"
        >
          {isLeftSidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-background relative selection:bg-primary/20">
        {/* Top Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 bg-background/50 backdrop-blur-xl z-30 gap-4">
          <div className="flex-1 hidden sm:flex justify-start" />

          {/* Search */}
          <div className="flex-1 flex justify-start sm:justify-center">
            <div className="relative group w-full max-w-[240px] md:max-w-[320px] lg:max-w-[384px]" ref={searchRef}>
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 w-full transition-all hover:bg-white/10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] text-muted-foreground border border-white/10 rounded px-1.5 bg-white/5 font-mono">
                <Command className="w-2.5 h-2.5" /> K
              </div>

              <AnimatePresence>
                {isSearchOpen && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full mt-2 w-full left-0 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 glass"
                  >
                    {isSearching ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
                    ) : searchResults && searchResults.length > 0 ? (
                      <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                        <div className="p-2">
                          {searchResults.map((result: any) => (
                            <button
                              key={`${result.type}-${result.id}`}
                              onClick={() => {
                                navigate(result.link);
                                setIsSearchOpen(false);
                                setSearchQuery('');
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg flex items-center justify-between group transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20">
                                  {result.type.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-white group-hover:text-primary transition-colors">{result.title}</div>
                                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{result.type}</div>
                                </div>
                              </div>
                              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : searchQuery ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">No results found for "{searchQuery}"</div>
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex-none sm:flex-1 flex items-center justify-end gap-2 sm:gap-4">

            {/* ── Refresh button ── */}
            <button
              onClick={handleRefresh}
              title="Refresh all data"
              className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <RefreshCw className={cn("w-4 h-4 transition-all", isRefreshing && "animate-spin text-primary")} />
            </button>

            {/* ── Notification button + dropdown ── */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-all relative"
              >
                <Bell className={cn("w-4 h-4 transition-colors", isNotifOpen && "text-primary")} />
                {/* Dot: red if unread, grey if none */}
                <div className={cn(
                  "absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full border border-background transition-colors",
                  unreadCount > 0 ? "bg-primary" : "bg-white/20"
                )} />
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-[#09090B] border border-white/10 rounded-2xl shadow-[0_40px_80px_rgba(0,0,0,0.8)] z-50 overflow-hidden"
                  >
                    {/* Dropdown header */}
                    <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-white uppercase tracking-widest">Notifications</h4>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-black">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setIsNotifOpen(false)}
                        className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <X className="w-3.5 h-3.5 text-muted-foreground hover:text-white" />
                      </button>
                    </div>

                    {/* Dropdown body */}
                    <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                      {notifList.length > 0 ? (
                        <div className="p-2">
                          {notifList.map((n: any) => (
                            <div
                              key={n._id || n.id}
                              className={cn(
                                "flex items-start gap-3 px-3 py-3 rounded-xl transition-all cursor-pointer group",
                                !n.read ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-white/5"
                              )}
                            >
                              {/* Icon or avatar */}
                              <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                                !n.read ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"
                              )}>
                                <Bell className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={cn(
                                  "text-xs leading-snug",
                                  !n.read ? "text-white font-bold" : "text-white/60 font-medium"
                                )}>
                                  {n.message || n.text || 'New notification'}
                                </p>
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  {n.time || n.createdAt
                                    ? new Date(n.time || n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : ''}
                                </p>
                              </div>
                              {!n.read && (
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-2" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center space-y-3">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
                            <Bell className="w-6 h-6 text-white/10" />
                          </div>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                            No new notifications
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Footer — only show when there are notifications */}
                    {notifList.length > 0 && (
                      <div className="px-5 py-3 border-t border-white/5">
                        <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors w-full text-center">
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="w-px h-4 bg-border mx-1" />

            {/* Profile avatar */}
            <div
              onClick={() => {
                if (user?.role === 'CLUB_ADMIN') navigate('/club-profile');
                else if (user?.role === 'EVENT_ADMIN') navigate('/event-profile');
              }}
              className="flex items-center gap-3 pl-2 group cursor-pointer shrink-0"
            >
              <div className="flex-col items-end hidden sm:flex whitespace-nowrap">
                <span className="text-xs font-bold text-white leading-none group-hover:text-primary transition-colors">
                  {user?.role === 'CLUB_ADMIN' ? user?.organisation : (user?.name || 'Admin')}
                </span>
                <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
                  {user?.role === 'SUPER_ADMIN' ? 'Main Admin' :
                   user?.role === 'NORMAL_ADMIN' ? 'Admin' :
                   user?.role === 'EVENT_ADMIN' ? 'Event Manager' :
                   user?.role === 'CLUB_ADMIN' ? 'Club Manager' : user?.role?.replace('_', ' ') || 'Manager'}
                </span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-xs font-bold text-white border border-white/10 shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                {user?.role === 'CLUB_ADMIN' ? user?.organisation?.charAt(0) : (user?.name?.charAt(0) || 'A')}
              </div>
            </div>

            {hasRightSidebar && !isRightSidebarOpen && (
              <button
                onClick={() => setIsRightSidebarOpen(true)}
                className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                <PanelRightOpen className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto min-h-full flex flex-col pb-6">
            <Outlet context={{ setIsClubProfileOpen, setIsEventProfileOpen }} />
          </div>
        </div>

        {/* Footer */}
        <footer className="shrink-0 py-3 px-4 sm:px-6 border-t border-border/50 bg-background/50 backdrop-blur-xl text-center">
          <p className="text-[10px] font-medium text-muted-foreground tracking-wide">
            App designed by The Branding Hood
          </p>
        </footer>
      </main>

      {/* Right Sidebar */}
      {hasRightSidebar && (
        <RightSidebar
          isOpen={isRightSidebarOpen}
          toggle={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
          currentPage={currentPage}
        />
      )}

      {/* Club Profile Panel */}
      <AnimatePresence>
        {isClubProfileOpen && user?.role === 'CLUB_ADMIN' && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsClubProfileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[111] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden border-l border-white/5"
            >
              <ClubProfilePreview club={clubData} onClose={() => setIsClubProfileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Event Profile Panel */}
      <AnimatePresence>
        {isEventProfileOpen && user?.role === 'EVENT_ADMIN' && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsEventProfileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[111] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden border-l border-white/5"
            >
              <EventProfilePreview onClose={() => setIsEventProfileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
CLAUDE_EOF
echo "  wrote src/components/Layout.tsx"

mkdir -p "src/pages"
cat > "src/pages/Users.tsx" << 'CLAUDE_EOF'
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  TrendingUp, 
  TrendingDown,
  Mail,
  Bell,
  MessageSquare,
  Send,
  Users as UsersIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  BarChart2,
  Trophy,
  Zap,
  MessageCircle,
  FileText,
  User,
  ChevronRight,
  Shield,
  Activity,
  ArrowRight,
  Database,
  Lock,
  Eye,
  Settings,
  UserPlus,
  Layout as LayoutIcon,
  MousePointer2,
  Loader2,
  Check,
  Info,
  Star,
  MapPin,
  Building2,
  Phone,
  Globe,
  Camera,
  Heart,
  Share2,
  ChevronLeft,
  Wine,
  Trees,
  Headphones,
  Instagram,
  Ticket,
  Music,
  Mic2,
  PartyPopper,
  Sparkles,
  UserCheck,
  UserX,
  UserMinus,
  MailCheck,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ExternalLink
} from 'lucide-react';
import { cn } from '../lib/utils';
import { FilterDropdown } from '../components/FilterDropdown';
import { FilterPanel } from '../components/FilterPanel';
import { motion, AnimatePresence } from 'motion/react';

const statusColors: any = {
  'ACTIVE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'INACTIVE': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  'BANNED': 'bg-red-500/10 text-red-400 border-red-500/20',
  'PENDING': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

import UserProfilePreview from '../components/UserProfilePreview';

import { API_BASE } from '../lib/apiConfig';
export default function Users() {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCity, setFilterCity] = useState('ALL');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/users/get_all_user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      // Backend returns { success, message, data: { users, total, page, limit } }
      return json.data?.users ?? [];
    }
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/city/get_all_cities`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const filteredUsers = (Array.isArray(users) ? users : [])?.filter((u: any) => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || u.status === filterStatus;
    const matchesCity = filterCity === 'ALL' || u.city === filterCity;
    return matchesSearch && matchesStatus && matchesCity;
  }).sort((a: any, b: any) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">User <span className="text-primary neon-text">Management</span></h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
            <UsersIcon className="w-3 h-3" />
            Monitor and manage your users
          </div>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: Array.isArray(users) ? users.length : '0', icon: UsersIcon, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Active Now', value: (Array.isArray(users) ? users : []).filter((u: any) => u.status === 'ACTIVE').length || '0', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Banned Users', value: (Array.isArray(users) ? users : []).filter((u: any) => u.status === 'BANNED').length || '0', icon: UserX, color: 'text-red-400', bg: 'bg-red-400/10' },
          { label: 'Verified Accounts', value: '84%', icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-400/10' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 rounded-[2rem] border border-white/10 flex flex-col gap-3 hover:border-white/20 transition-all group">
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-xl font-black text-white leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-2xl border border-white/10">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">User List</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..." 
                className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
              />
            </div>
            <FilterPanel>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</label>
                <FilterDropdown
                  value={filterCity}
                  onChange={setFilterCity}
                  options={[
                    { label: 'All Cities', value: 'ALL' },
                    // Only active cities are ever returned by /city/get_all_cities,
                    // so this list can't include inactive/disabled cities.
                    ...((Array.isArray(cities) ? cities : []).map((c: any) => ({ label: c.city_name, value: c.city_name }))),
                  ]}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</label>
                <FilterDropdown
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { label: 'All Status', value: 'ALL' },
                    { label: 'Active', value: 'ACTIVE' },
                    { label: 'Inactive', value: 'INACTIVE' },
                    { label: 'Pending', value: 'PENDING' },
                    { label: 'Banned', value: 'BANNED' },
                  ]}
                />
              </div>
            </FilterPanel>
          </div>
        </div>

        <div className="overflow-x-auto rounded-b-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-[10px] font-black">
                <th 
                  className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Name / Email
                    {sortField === 'name' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    {sortField === 'status' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    Joined Date
                    {sortField === 'createdAt' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">No users found.</td>
                </tr>
              ) : filteredUsers.map((user: any) => (
                <tr key={user.id} className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedUser(user)}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-primary font-bold text-sm">
                        {user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("text-[10px] px-2 py-1 rounded-lg font-bold border", statusColors[user.status] || statusColors.ACTIVE)}>
                      {user.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-white font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Profile Drawer */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-[111] w-full max-w-[420px] bg-black border-l border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
            >
              <UserProfilePreview 
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
CLAUDE_EOF
echo "  wrote src/pages/Users.tsx"

mkdir -p "src/pages"
cat > "src/pages/AdsBroadcast.tsx" << 'CLAUDE_EOF'
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { FormSection, RefinedField } from '../components/RefinedForm';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  TrendingUp, 
  TrendingDown,
  Mail,
  Bell,
  MessageSquare,
  CreditCard,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  BarChart2,
  Trophy,
  Zap,
  MessageCircle,
  FileText,
  User,
  ChevronRight,
  Shield,
  Activity,
  ArrowRight,
  Database,
  Lock,
  Eye,
  Settings,
  UserPlus,
  Layout as LayoutIcon,
  MousePointer2,
  Loader2,
  Check,
  Info,
  Image,
  Star,
  MapPin,
  Building2,
  Phone,
  Globe,
  Instagram,
  Ticket,
  Music,
  X,
  ChevronLeft,
  Upload,
  RefreshCw,
  Edit,
  Pause,
  Play,
  Trash2,
  Mic2,
  PartyPopper,
  Sparkles,
  Smartphone,
  Share2,
  Megaphone,
  Target,
  Layers,
  Download,
  Video,
  Link as LinkIcon,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { FilterDropdown } from '../components/FilterDropdown';
import { FilterPanel } from '../components/FilterPanel';
import { motion, AnimatePresence } from 'motion/react';
import { FeatureEventModal } from '../components/FeatureEventModal';

import { API_BASE } from '../lib/apiConfig';

// Backend serves uploaded files (ad images/videos) from a static `/uploads`
// route alongside the API, not under API_BASE itself. No root server file
// was available to confirm the exact mount path, so this is the standard
// convention for this codebase's `middleware/upload.js` (files land in a
// project-root `/uploads` folder) — verify against the real deployment and
// adjust here if it differs.
const UPLOADS_BASE = API_BASE.replace(/\/app\/server\/api\/v1\/admin\/?$/, '') + '/uploads';
const adAssetUrl = (filename?: string | null) => (filename ? `${UPLOADS_BASE}/${filename}` : '');

const channels = [
  { id: 'push', label: 'Push Notification', icon: Bell, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'email', label: 'Email', icon: Mail, color: 'text-purple-400', bg: 'bg-purple-400/10' },
];

export default function AdsBroadcast() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('ads');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['push']);
  const [isSending, setIsSending] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    audience: 'All Active Users (12.4k)',
    city: 'ALL',
    subject: '',
    content: ''
  });
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [adStep, setAdStep] = useState(1);
  const [adFormData, setAdFormData] = useState({
    name: '',
    city: 'all',
    audience: 'all',
    startDate: '',
    endDate: '',
    untilPaused: false,
    imageUrl: '',
    videoUrl: '',
    linkUrl: ''
  });
  const [adImageFile, setAdImageFile] = useState<File | null>(null);
  const [adVideoFile, setAdVideoFile] = useState<File | null>(null);
  const [adSubmitError, setAdSubmitError] = useState('');
  const [filterAdStatus, setFilterAdStatus] = useState('ALL');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [filterCity, setFilterCity] = useState('ALL');

  const [isFeaturingEvent, setIsFeaturingEvent] = useState(false);
  const [featureEventData, setFeatureEventData] = useState({
    eventId: '',
    duration: '7'
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      // NOTE: was hitting `${API_BASE}/cities` (bare alias root, no handler → 404),
      // which is why the featured-events / broadcast city dropdowns were empty.
      const res = await fetch(`${API_BASE}/city/get_all_cities`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    }
  });

  const { data: ads, isLoading: adsLoading } = useQuery({
    queryKey: ['ads'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/ads/get_all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      // Was returning the raw { success, message, data } object instead of
      // unwrapping it, so the ads table/exports were always empty.
      return json.data ?? [];
    }
  });

  // The "Create Campaign" wizard previously had no submit handler at all —
  // the image picker was a non-interactive div and the final button just
  // closed the modal. This wires it to the real backend, which only
  // persists: ad_image (required), ad_video (optional), expiry_date
  // (required), link_url (optional). Campaign name / city / audience
  // targeting aren't stored anywhere on the backend yet — see the note in
  // the Targeting section of the form.
  const createAdMutation = useMutation({
    mutationFn: async () => {
      if (!adImageFile) throw new Error('An ad image is required.');

      const expiryDate = adFormData.untilPaused
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) // far-future "until paused"
        : adFormData.endDate;
      if (!expiryDate) throw new Error('Set an end date, or turn on "Run Until Paused".');

      if (adFormData.linkUrl && !/^https?:\/\/.+/i.test(adFormData.linkUrl)) {
        throw new Error('Destination link must start with http:// or https://');
      }

      const body = new FormData();
      body.append('ad_image', adImageFile);
      if (adVideoFile) body.append('ad_video', adVideoFile);
      body.append('expiry_date', expiryDate);
      if (adFormData.linkUrl) body.append('link_url', adFormData.linkUrl);

      const res = await fetch(`${API_BASE}/ads/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message?.[0] || json?.message || 'Failed to create ad');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      setIsCreatingAd(false);
      setAdStep(1);
      setAdFormData({ name: '', city: 'all', audience: 'all', startDate: '', endDate: '', untilPaused: false, imageUrl: '', videoUrl: '', linkUrl: '' });
      setAdImageFile(null);
      setAdVideoFile(null);
      setAdSubmitError('');
    },
    onError: (err: any) => setAdSubmitError(err.message || 'Failed to create ad'),
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/ads/delete/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete ad');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      setOpenMenuId(null);
    },
  });

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/events/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const featureEventMutation = useMutation({
    mutationFn: async (data: { city: string; eventId: string; duration: number }) => {
      const res = await fetch(`${API_BASE}/events/feature`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });

  const sendBroadcastMutation = useMutation({
    mutationFn: async (broadcast: any) => {
      const res = await fetch(`${API_BASE}/broadcasts`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(broadcast)
      });
      return res.json();
    },
    onSuccess: () => {
      setIsSending(false);
      // Show success toast
    }
  });

  const filteredAds = (Array.isArray(ads) ? ads : []).filter((ad: any) => {
    const isExpired = ad.expiry_date ? new Date(ad.expiry_date).getTime() < Date.now() : false;
    const status = isExpired ? 'EXPIRED' : 'ACTIVE';
    return filterAdStatus === 'ALL' || status === filterAdStatus;
  });

  const featuredEventsList = Array.isArray(events) ? events.slice(0, 5) : [];
  const filteredFeaturedEvents = featuredEventsList.filter((event: any) => {
    return filterCity === 'ALL' || event.city === filterCity;
  });

  // Export was reading fields (title, city, ctr, progress) that don't exist
  // anywhere on the real Ads model, so every exported row came out blank.
  // Now exports the real fields, respects the status filter above, and
  // offers a CSV or JSON download format.
  const exportData = (format: 'csv' | 'json' = 'csv') => {
    const rows = filteredAds.map((ad: any) => {
      const isExpired = ad.expiry_date ? new Date(ad.expiry_date).getTime() < Date.now() : false;
      return {
        id: ad._id || ad.id,
        status: isExpired ? 'EXPIRED' : 'ACTIVE',
        image_url: adAssetUrl(ad.ad_image),
        video_url: ad.ad_video ? adAssetUrl(ad.ad_video) : '',
        link_url: ad.link_url || '',
        expiry_date: ad.expiry_date ? new Date(ad.expiry_date).toLocaleDateString() : '',
        created_at: ad.createdAt ? new Date(ad.createdAt).toLocaleDateString() : '',
      };
    });

    let blob: Blob;
    let filename: string;
    if (format === 'json') {
      blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
      filename = `ads-${new Date().toISOString().slice(0, 10)}.json`;
    } else {
      const headers = ['ID', 'Status', 'Image URL', 'Video URL', 'Link URL', 'Expiry Date', 'Created'];
      const csvRows = rows.map((r) => [r.id, r.status, r.image_url, r.video_url, r.link_url, r.expiry_date, r.created_at].map((v) => `"${v}"`));
      const csv = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
      blob = new Blob([csv], { type: 'text/csv' });
      filename = `ads-${new Date().toISOString().slice(0, 10)}.csv`;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-black text-white tracking-tight uppercase">Ad Campaigns & <span className="text-primary neon-text">Broadcasts</span></h2>
        <div className="flex items-center gap-3">
          <div className="relative group/export">
            <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Data
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all">
              <button onClick={() => exportData('csv')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-white/5 transition-colors">Download as CSV</button>
              <button onClick={() => exportData('json')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-white/5 transition-colors">Download as JSON</button>
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setActiveTab('ads')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider",
                activeTab === 'ads' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
              )}
            >
              Ads
            </button>
            <button
              onClick={() => setActiveTab('featured')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider",
                activeTab === 'featured' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
              )}
            >
              Featured Events
            </button>
            <button
              onClick={() => setActiveTab('broadcast')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider",
                activeTab === 'broadcast' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
              )}
            >
              Direct Broadcast
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'ads' ? (
          <motion.div
            key="ads"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Ads Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Ads', value: Array.isArray(ads) ? ads.length : '0', icon: Megaphone, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                { label: 'Active Ads', value: (Array.isArray(ads) ? ads : []).filter((a: any) => !a.expiry_date || new Date(a.expiry_date).getTime() >= Date.now()).length || '0', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                { label: 'With Video', value: (Array.isArray(ads) ? ads : []).filter((a: any) => a.ad_video).length || '0', icon: Video, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                { label: 'With Link', value: (Array.isArray(ads) ? ads : []).filter((a: any) => a.link_url).length || '0', icon: LinkIcon, color: 'text-amber-400', bg: 'bg-amber-400/10' },
              ].map((stat) => (
                <div key={stat.label} className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <p className="text-2xl font-black text-white tracking-tight">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Ads Table */}
            <div className="glass-card rounded-2xl border border-white/10">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Ad Campaigns</h3>
                <div className="flex items-center gap-4">
                  <FilterPanel>
                    <div className="space-y-1">
                      {/* Ads have no city-targeting field on the backend yet
                          (see the note in the Create Campaign > Targeting
                          section), so a city filter here would never match
                          anything real. Filtering by status uses actual
                          stored data instead. */}
                      <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Filter Status</label>
                      <FilterDropdown
                        value={filterAdStatus}
                        onChange={setFilterAdStatus}
                        options={[
                          { label: 'All', value: 'ALL' },
                          { label: 'Active', value: 'ACTIVE' },
                          { label: 'Expired', value: 'EXPIRED' },
                        ]}
                      />
                    </div>
                  </FilterPanel>
                  <button
                    onClick={() => setIsCreatingAd(true)}
                    className="px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Ad
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-b-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Creative</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Destination Link</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Expires</th>
                      <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {adsLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">Loading campaigns...</td>
                      </tr>
                    ) : filteredAds.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none">No ads yet. Create one to get started.</td>
                      </tr>
                    ) : filteredAds.map((ad: any) => {
                      const adId = ad._id || ad.id;
                      const isExpired = ad.expiry_date ? new Date(ad.expiry_date).getTime() < Date.now() : false;
                      return (
                      <tr key={adId} className="group hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center relative">
                              {ad.ad_image ? (
                                <img src={adAssetUrl(ad.ad_image)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Image className="w-5 h-5 text-white/20" />
                              )}
                              {ad.ad_video && (
                                <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center" title="Has video">
                                  <Video className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className={cn(
                                "text-[10px] uppercase font-bold tracking-wider",
                                isExpired ? "text-amber-400" : "text-emerald-400"
                              )}>{isExpired ? 'Expired' : 'Active'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {ad.link_url ? (
                            <a href={ad.link_url} target="_blank" rel="noreferrer" className="text-[11px] text-primary font-bold flex items-center gap-1 hover:underline max-w-[220px] truncate">
                              <LinkIcon className="w-3 h-3 shrink-0" /> <span className="truncate">{ad.link_url}</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">No link set</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[11px] text-white font-medium">{ad.expiry_date ? new Date(ad.expiry_date).toLocaleDateString() : '—'}</span>
                        </td>
                        <td className="px-6 py-4 text-right relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === adId ? null : adId)}
                            className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          <AnimatePresence>
                            {openMenuId === adId && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-8 top-10 w-48 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 glass text-left"
                              >
                                <div className="p-1">
                                  <button
                                    onClick={() => deleteAdMutation.mutate(adId)}
                                    disabled={deleteAdMutation.isPending}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete Ad
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : activeTab === 'featured' ? (
          <motion.div
            key="featured"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="glass-card rounded-2xl border border-white/10">
              <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Featured Events</h3>
                <div className="flex items-center gap-4">
                  <FilterPanel>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</label>
                      <FilterDropdown
                        value={filterCity}
                        onChange={setFilterCity}
                        options={[
                          { label: 'All Cities', value: 'ALL' },
                          ...((Array.isArray(cities) ? cities : []).map((c: any) => ({ label: c.city_name, value: c.city_name }))),
                        ]}
                      />
                    </div>
                  </FilterPanel>
                  <button
                    onClick={() => setIsFeaturingEvent(true)}
                    className="px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Feature Event
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto rounded-b-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Event</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Date</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredFeaturedEvents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-xs text-muted-foreground">No featured events found.</td>
                      </tr>
                    ) : filteredFeaturedEvents.map((event: any) => (
                      <tr key={event.id} className="group hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                              <img src={`https://picsum.photos/seed/event${event.id}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{event.title}</p>
                              <p className={cn(
                                "text-[10px] uppercase font-bold tracking-wider",
                                event.status === 'ACTIVE' ? "text-emerald-400" : "text-amber-400"
                              )}>{event.status}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">{event.date}</td>
                        <td className="px-6 py-4 text-sm text-white">{event.city}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="broadcast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10"
          >
            {/* Broadcast Form */}
            <div className="lg:col-span-2 space-y-10">
              <div className="glass-card p-12 rounded-[40px] border border-white/5 space-y-12 relative overflow-hidden group/broadcast">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] to-transparent pointer-events-none" />

                <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(255,45,154,0.1)]">
                      <Send className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">New <span className="text-primary neon-text">Broadcast</span></h3>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {channels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => {
                          setSelectedChannels(prev =>
                            prev.includes(channel.id)
                              ? prev.filter(id => id !== channel.id)
                              : [...prev, channel.id]
                          );
                        }}
                        className={cn(
                          "p-6 rounded-[32px] border transition-all flex flex-col items-center gap-4 group/channel relative overflow-hidden",
                          selectedChannels.includes(channel.id)
                            ? "bg-primary/10 border-primary/40 shadow-[0_10px_30px_rgba(255,45,154,0.1)]"
                            : "bg-[#09090B] border-white/5 hover:bg-white/5 hover:border-white/10"
                        )}
                      >
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-500 group-hover/channel:scale-110 group-hover/channel:rotate-6", channel.bg)}>
                          <channel.icon className={cn("w-6 h-6", channel.color)} />
                        </div>
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-[0.2em]",
                          selectedChannels.includes(channel.id) ? "text-primary" : "text-white/30"
                        )}>
                          {channel.label}
                        </span>
                        {selectedChannels.includes(channel.id) && (
                          <motion.div
                            layoutId="check"
                            className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
                          >
                            <Check className="w-2.5 h-2.5 text-white" />
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                  <div className="space-y-4 group/field">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Select Audience</label>
                    <select
                      value={broadcastData.audience}
                      onChange={(e) => setBroadcastData({ ...broadcastData, audience: e.target.value })}
                      className="w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 appearance-none font-medium"
                    >
                      <option>All Users (12.4k)</option>
                      <option>Club Owners (42)</option>
                      <option>Premium Users (2.1k)</option>
                      <option>Inactive Users (840)</option>
                    </select>
                  </div>
                  <div className="space-y-4 group/field">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Select City</label>
                    <select
                      value={broadcastData.city}
                      onChange={(e) => setBroadcastData({ ...broadcastData, city: e.target.value })}
                      className="w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 appearance-none font-medium"
                    >
                      <option value="ALL">All Hubs</option>
                      {(Array.isArray(cities) ? cities : []).map((city: any) => (
                        <option key={city._id || city.id} value={city.city_name}>{city.city_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-8 relative z-10">
                  <RefinedField
                    label="Subject"
                    name="subject"
                    value={broadcastData.subject}
                    onChange={(e: any) => setBroadcastData({ ...broadcastData, subject: e.target.value })}
                    placeholder="Enter broadcast subject..."
                    icon={<Zap className="w-4 h-4" />}
                  />

                  <div className="space-y-4 group/field">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Message Content</label>
                    <textarea
                      rows={6}
                      value={broadcastData.content}
                      onChange={(e) => setBroadcastData({ ...broadcastData, content: e.target.value })}
                      placeholder="Type your message here..."
                      className="w-full bg-[#09090B] border border-white/5 rounded-[32px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 resize-none placeholder:text-white/10 font-medium"
                    ></textarea>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-10 border-t border-white/5 relative z-10">
                  <div className="flex items-center gap-6">
                    <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/20 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center">
                      <Plus className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Add Attachment</span>
                  </div>
                  <button
                    onClick={() => setIsSending(true)}
                    className="px-12 py-5 rounded-[24px] bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:shadow-[0_15px_50px_rgba(255,45,154,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 group"
                  >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    {isSending ? 'Sending...' : 'Send Broadcast'}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview & History */}
            <div className="space-y-6">
              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Preview</h3>
                <div className="aspect-[9/16] max-w-[240px] mx-auto bg-[#0B0B0F] rounded-[32px] border-[6px] border-white/10 p-4 relative overflow-hidden shadow-2xl">
                  <div className="w-16 h-1 bg-white/20 rounded-full mx-auto mb-4"></div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 animate-pulse">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-4 h-4 rounded bg-primary/40"></div>
                        <div className="w-12 h-2 rounded bg-white/20"></div>
                      </div>
                      <div className="w-full h-2 rounded bg-white/10 mb-1"></div>
                      <div className="w-2/3 h-2 rounded bg-white/10"></div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border border-white/20"></div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent History</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Weekend Promo', date: '2h ago', status: 'SENT' },
                    { label: 'System Update', date: '1d ago', status: 'SENT' },
                    { label: 'New Club Alert', date: '3d ago', status: 'SENT' },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{item.date}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Ad Modal */}
      <AnimatePresence mode="wait">
        {isCreatingAd && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-4xl rounded-[40px] border border-white/5 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(255,45,154,0.1)]">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight leading-none uppercase">
                      Create <span className="text-primary neon-text">Ad Campaign</span>
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">Step {adStep} of 3</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsCreatingAd(false); setAdStep(1); }}
                  className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-muted-foreground hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="w-full h-1 bg-white/5 relative">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-purple-600 shadow-[0_0_15px_rgba(255,45,154,0.5)] z-10"
                  animate={{ width: `${(adStep / 3) * 100}%` }}
                  transition={{ duration: 0.5, ease: "circOut" }}
                />
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-12 scrollbar-hide">
                {adStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                    <FormSection title="Campaign Details" icon={<User className="w-4 h-4" />}>
                      <div className="space-y-8">
                        <RefinedField
                          label="Campaign Name"
                          name="name"
                          value={adFormData.name}
                          onChange={(e: any) => setAdFormData({ ...adFormData, name: e.target.value })}
                          placeholder="Enter campaign name"
                          icon={<Zap className="w-4 h-4" />}
                        />
                      </div>
                    </FormSection>

                    <FormSection title="Targeting" icon={<Shield className="w-4 h-4" />}>
                      <div className="flex items-start gap-2 mb-6 px-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-400/80 font-medium leading-relaxed">
                          City and audience targeting aren't enforced by the backend yet — every ad shows to all users everywhere until that's built. These fields are for your own campaign notes for now.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4 group/field">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Select City</label>
                          <select
                            value={adFormData.city}
                            onChange={(e) => setAdFormData({ ...adFormData, city: e.target.value })}
                            className="w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 appearance-none font-medium"
                          >
                            <option value="all">All Cities</option>
                            {(Array.isArray(cities) ? cities : []).map((city: any) => (
                              <option key={city._id || city.id} value={city.city_name}>{city.city_name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-4 group/field">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Select Audience</label>
                          <select
                            value={adFormData.audience}
                            onChange={(e) => setAdFormData({ ...adFormData, audience: e.target.value })}
                            className="w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 appearance-none font-medium"
                          >
                            <option value="all">All Users</option>
                            <option value="premium">Premium Only</option>
                            <option value="free">Free Users</option>
                          </select>
                        </div>
                      </div>
                    </FormSection>
                  </motion.div>
                )}

                {adStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                    <FormSection title="Ad Creative" icon={<Image className="w-4 h-4" />}>
                      <div className="space-y-8 text-center">
                        <label className="aspect-[16/9] w-full max-w-2xl mx-auto rounded-[40px] bg-[#09090B] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-white/[0.04] hover:border-primary/30 transition-all group relative overflow-hidden shadow-inner">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setAdImageFile(file);
                              setAdFormData((prev) => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
                            }}
                          />
                          {adFormData.imageUrl ? (
                            <img src={adFormData.imageUrl} alt="Ad Content" className="w-full h-full object-cover" />
                          ) : (
                            <>
                              <div className="w-20 h-20 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-all shadow-2xl">
                                <Upload className="w-10 h-10 text-white/20 group-hover:text-primary transition-colors" />
                              </div>
                              <div className="space-y-2">
                                <span className="text-[11px] font-black uppercase text-white/40 tracking-[0.3em] block">Upload Image</span>
                                <span className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em]">Recommended: 1920x1080 | Required</span>
                              </div>
                            </>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </label>
                      </div>
                    </FormSection>

                    <FormSection title="Video Ad (Optional)" icon={<Video className="w-4 h-4" />}>
                      <div className="space-y-4 text-center">
                        <label className="w-full max-w-2xl mx-auto rounded-[32px] bg-[#09090B] border-2 border-dashed border-white/5 flex items-center justify-center gap-4 px-8 py-6 cursor-pointer hover:bg-white/[0.04] hover:border-primary/30 transition-all group relative overflow-hidden">
                          <input
                            type="file"
                            accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setAdVideoFile(file);
                              setAdFormData((prev) => ({ ...prev, videoUrl: URL.createObjectURL(file) }));
                            }}
                          />
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-all shrink-0">
                            <Video className="w-6 h-6 text-white/20 group-hover:text-primary transition-colors" />
                          </div>
                          <div className="text-left">
                            <span className="text-[11px] font-black uppercase text-white/40 tracking-[0.2em] block">
                              {adVideoFile ? adVideoFile.name : 'Upload video (mp4, mov, webm)'}
                            </span>
                            <span className="text-[8px] font-bold text-white/10 uppercase tracking-[0.2em]">Shown instead of / alongside the image where supported</span>
                          </div>
                        </label>
                        {adVideoFile && (
                          <button
                            type="button"
                            onClick={() => { setAdVideoFile(null); setAdFormData((prev) => ({ ...prev, videoUrl: '' })); }}
                            className="text-[10px] font-bold text-red-400 uppercase tracking-widest hover:text-red-300"
                          >
                            Remove video
                          </button>
                        )}
                      </div>
                    </FormSection>
                  </motion.div>
                )}

                {adStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                    <FormSection title="Destination" icon={<LinkIcon className="w-4 h-4" />}>
                      <RefinedField
                        label="Link URL (optional)"
                        name="linkUrl"
                        type="url"
                        value={adFormData.linkUrl}
                        onChange={(e: any) => setAdFormData({ ...adFormData, linkUrl: e.target.value })}
                        placeholder="https://example.com/promo"
                        icon={<LinkIcon className="w-4 h-4" />}
                      />
                      <p className="text-[10px] text-white/30 font-medium mt-2 ml-1">Tapping the ad opens this link. Leave blank for a non-clickable ad.</p>
                    </FormSection>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <FormSection title="Schedule" icon={<Clock className="w-4 h-4" />}>
                        <div className="space-y-8">
                          <RefinedField
                            label="Start Date"
                            name="startDate"
                            type="date"
                            value={adFormData.startDate}
                            onChange={(e: any) => setAdFormData({ ...adFormData, startDate: e.target.value })}
                            icon={<Calendar className="w-4 h-4" />}
                          />

                          <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Campaign Duration</label>
                              <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                <div className="text-[9px] font-black text-white/20 uppercase tracking-widest group-hover/toggle:text-primary transition-colors">Run Until Paused</div>
                                <div className="relative w-10 h-5 bg-white/5 rounded-full border border-white/10 group-hover/toggle:border-primary/30 transition-all">
                                  <motion.div
                                    className={cn("absolute top-1 w-3 h-3 rounded-full transition-all", adFormData.untilPaused ? "right-1 bg-primary shadow-[0_0_10px_rgba(255,45,154,0.5)]" : "left-1 bg-white/20")}
                                    animate={{ left: adFormData.untilPaused ? 24 : 4 }}
                                  />
                                  <input
                                    type="checkbox"
                                    className="sr-only"
                                    checked={adFormData.untilPaused}
                                    onChange={(e) => setAdFormData({ ...adFormData, untilPaused: e.target.checked })}
                                  />
                                </div>
                              </label>
                            </div>

                            <AnimatePresence mode="wait">
                              {!adFormData.untilPaused && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  <RefinedField
                                    label="End Date"
                                    name="endDate"
                                    type="date"
                                    value={adFormData.endDate}
                                    onChange={(e: any) => setAdFormData({ ...adFormData, endDate: e.target.value })}
                                    icon={<Calendar className="w-4 h-4" />}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </FormSection>

                      <FormSection title="Visual Validation" icon={<Eye className="w-4 h-4" />}>
                        <div className="space-y-8 flex flex-col items-center">
                          <div className="aspect-[9/16] w-full max-w-[200px] bg-[#0B0B0F] rounded-[48px] border-[8px] border-white/10 p-4 shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative group/phone">
                            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4 z-10">
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-full aspect-[3/4] bg-primary/10 rounded-3xl border border-primary/30 flex items-center justify-center relative overflow-hidden group-hover/phone:shadow-[0_0_30px_rgba(255,45,154,0.2)] transition-all"
                              >
                                {adFormData.imageUrl ? (
                                  <img src={adFormData.imageUrl} className="w-full h-full object-cover" />
                                ) : (
                                  <p className="text-[8px] text-primary/40 font-black uppercase tracking-widest">Ad Canvas</p>
                                )}
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/60 border border-white/10 flex items-center justify-center">
                                  <X className="w-3 h-3 text-white/50" />
                                </div>
                              </motion.div>
                            </div>
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border border-white/10"></div>
                          </div>
                          <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] text-center">Live System Preview</p>
                        </div>
                      </FormSection>
                    </div>
                  </motion.div>
                )}
              </div>

              {adSubmitError && (
                <div className="px-10 pt-4 flex items-center gap-2 text-red-400 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {adSubmitError}
                </div>
              )}

              <div className="p-10 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                <button
                  onClick={() => {
                    if (adStep > 1) {
                      setAdStep(adStep - 1);
                    } else {
                      setIsCreatingAd(false);
                      setAdStep(1);
                      setAdFormData({ name: '', city: 'all', audience: 'all', startDate: '', endDate: '', untilPaused: false, imageUrl: '', videoUrl: '', linkUrl: '' });
                      setAdImageFile(null);
                      setAdVideoFile(null);
                      setAdSubmitError('');
                    }
                  }}
                  className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {adStep > 1 ? 'Go Back' : 'Cancel'}
                </button>

                <button
                  onClick={() => {
                    setAdSubmitError('');
                    if (adStep < 3) {
                      setAdStep(adStep + 1);
                    } else {
                      createAdMutation.mutate();
                    }
                  }}
                  disabled={createAdMutation.isPending}
                  className="px-12 py-5 rounded-[24px] bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,45,154,0.3)] hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 group disabled:opacity-50 disabled:hover:scale-100"
                >
                  {createAdMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                  ) : (
                    <>{adStep < 3 ? 'Next Step' : 'Create Campaign'} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <FeatureEventModal
        isOpen={isFeaturingEvent}
        onClose={() => setIsFeaturingEvent(false)}
        cities={cities || []}
        events={events || []}
        onConfirm={async (data) => {
          await featureEventMutation.mutateAsync(data);
        }}
      />
    </div>
  );
}
CLAUDE_EOF
echo "  wrote src/pages/AdsBroadcast.tsx"

mkdir -p "src/pages"
cat > "src/pages/Recommendations.tsx" << 'CLAUDE_EOF'
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Plus,
  Search,
  Calendar,
  Building2,
  MapPin,
  X,
  Loader2,
  Eye,
  LayoutList,
  Check,
  ChevronDown,
  Phone,
  AlertTriangle,
  Trash2,
  Lock,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { FormSection, RefinedField } from '../components/RefinedForm';
import { FilterDropdown } from '../components/FilterDropdown';
import RecommendationCard from '../components/RecommendationCard';

import { API_BASE } from '../lib/apiConfig';
// ─── Types ────────────────────────────────────────────────────────────────────

interface RecForm {
  type: 'event' | 'club';
  resource_id: string;
  resource_label: string;
  title: string;
  priority: number;
  target_city: string;
  target_gender: string;
  target_crowd_type: string;
  active: boolean;
  starts_at: string;
  ends_at: string;
}

const emptyForm = (): RecForm => ({
  type: 'event',
  resource_id: '',
  resource_label: '',
  title: '',
  priority: 0,
  target_city: '',
  target_gender: '',
  target_crowd_type: '',
  active: true,
  starts_at: '',
  ends_at: '',
});

const CROWD_TYPES = [
  'College Crowd', 'Corporate', 'Mixed', 'Party Animals', 'Sophisticated', 'Young Adults',
];

const GENDERS = ['All', 'Male', 'Female', 'Non-Binary'];

// Format an ISO date string for a <input type="datetime-local"> value
const toLocalInput = (iso: string | null | undefined) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ─── Phone Preview Card ───────────────────────────────────────────────────────

function PhonePreviewCard({ rec }: { rec: any }) {
  const resource = rec.resource_id || {};
  const name = rec.type === 'event' ? resource.title : resource.name;
  const city = resource.city || '';
  const poster = rec.type === 'event' ? resource.poster_url : resource.portrait_url;
  const displayTitle = rec.title || name || 'Untitled';

  return (
    <div className="rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10 flex flex-col">
      <div className="h-32 bg-gradient-to-br from-primary/20 to-purple-600/20 relative overflow-hidden">
        {poster ? (
          <img src={poster} alt={displayTitle} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {rec.type === 'event' ? (
              <Calendar className="w-8 h-8 text-white/20" />
            ) : (
              <Building2 className="w-8 h-8 text-white/20" />
            )}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span
          className={cn(
            'absolute top-2 left-2 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full',
            rec.type === 'event'
              ? 'bg-purple-500/80 text-white'
              : 'bg-amber-500/80 text-white'
          )}
        >
          {rec.type}
        </span>
      </div>
      <div className="p-3">
        <p className="text-[11px] font-black text-white truncate">{displayTitle}</p>
        {city && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-[9px] text-muted-foreground">{city}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Delete Confirm Dialog ──────────────────────────────────────────────────

function DeleteConfirmDialog({ rec, onConfirm, onCancel, isDeleting }: { rec: any; onConfirm: () => void; onCancel: () => void; isDeleting: boolean }) {
  const resource = rec.resource_id || {};
  const name = rec.type === 'event' ? resource.title : resource.name;
  const label = rec.title || name || 'this recommendation';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="glass-card w-full max-w-md rounded-3xl border border-red-500/20 overflow-hidden shadow-2xl p-8 space-y-6"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tight">Delete Recommendation</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-white/60 leading-relaxed">
          Are you sure you want to delete <span className="text-white font-bold">"{label}"</span>? It will be removed from the app feed immediately.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-3.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Recommendations() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'active' | 'add' | 'preview'>('active');
  const [form, setForm] = useState<RecForm>(emptyForm());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['recommendations', filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType) params.set('type', filterType);
      const res = await fetch(`${API_BASE}/recommendations?${params}`, {
        headers: { Authorization: `Bearer ${token}`},
      });
      return res.json();
    },
  });

  const { data: preview, isLoading: isPreviewLoading } = useQuery({
    queryKey: ['recommendations-preview'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/recommendations/preview`, {
        headers: { Authorization: `Bearer ${token}`},
      });
      return res.json();
    },
    enabled: activeTab === 'preview',
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/cities`, { headers: { Authorization: `Bearer ${token}`} });
      return res.json();
    },
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE}/recommendations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to create recommendation');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations-preview'] });
      setForm(emptyForm());
      setEditingId(null);
      setFormError('');
      setActiveTab('active');
    },
    onError: (err: any) => setFormError(err.message || 'Failed to create recommendation'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`${API_BASE}/recommendations/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error || 'Failed to update recommendation');
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations-preview'] });
      // Only reset/close the form if this update came from the edit form
      // (not from a quick inline toggle-active click on the Active tab).
      if (editingId && variables.id === editingId) {
        setForm(emptyForm());
        setEditingId(null);
        setFormError('');
        setActiveTab('active');
      }
    },
    onError: (err: any) => setFormError(err.message || 'Failed to update recommendation'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/recommendations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`},
      });
      if (!res.ok) throw new Error('Failed to delete recommendation');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['recommendations-preview'] });
      setDeleteTarget(null);
    },
  });

  // ── Resource search ────────────────────────────────────────────────────────
  // Fetched once per content-type and cached; the dropdown then just filters
  // that list in memory, so opening the field (even with an empty query)
  // can show every available event/club instead of requiring 2+ typed chars.

  const [allResources, setAllResources] = useState<any[]>([]);
  const [resourcesLoadedFor, setResourcesLoadedFor] = useState<'event' | 'club' | null>(null);
  const [isResourceDropdownOpen, setIsResourceDropdownOpen] = useState(false);
  const resourceDropdownRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resourceDropdownRef.current && !resourceDropdownRef.current.contains(e.target as Node)) {
        setIsResourceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadResourcesForType = async (type: 'event' | 'club') => {
    setIsSearching(true);
    try {
      const endpoint = type === 'event' ? `${API_BASE}/events/list` : `${API_BASE}/vendor/get_all_vendors`;
      const res = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}`} });
      const data = await res.json();
      setAllResources(Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []));
      setResourcesLoadedFor(type);
    } catch {
      setAllResources([]);
    } finally {
      setIsSearching(false);
    }
  };

  const filterResources = (q: string) => {
    const label = (item: any) => (form.type === 'event' ? item.title : item.name);
    // Some documents (e.g. inserted directly into MongoDB, bypassing schema
    // validation) may be missing a title/name. Exclude them from the picker
    // rather than rendering an unlabeled, effectively unusable row.
    const withLabel = allResources.filter((item: any) => !!label(item)?.trim());
    const list = q
      ? withLabel.filter((item: any) => label(item)!.toLowerCase().includes(q.toLowerCase()))
      : withLabel;
    setSearchResults(list.slice(0, 20));
  };

  const handleResourceFocus = async () => {
    setIsResourceDropdownOpen(true);
    if (resourcesLoadedFor !== form.type) {
      await loadResourcesForType(form.type);
    }
    filterResources(searchQuery);
  };

  const handleResourceSearch = (q: string) => {
    setSearchQuery(q);
    if (resourcesLoadedFor !== form.type) return; // still loading, filter runs after load completes
    filterResources(q);
  };

  const selectResource = (item: any) => {
    const label = form.type === 'event' ? item.title : item.name;
    setForm((f) => ({ ...f, resource_id: item._id, resource_label: label }));
    setSearchQuery(label);
    setSearchResults([]);
    setIsResourceDropdownOpen(false);
  };

  // Re-filter (and re-fetch if the type changed) whenever the query or type updates
  React.useEffect(() => {
    if (resourcesLoadedFor === form.type) {
      filterResources(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, form.type, allResources]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.resource_id) return;

    if (editingId) {
      // PATCH only accepts these fields — type/resource_id can't be changed once created.
      const payload = {
        title: form.title,
        priority: Number.isFinite(Number(form.priority)) ? Number(form.priority) : 0,
        target_city: form.target_city || null,
        target_gender: form.target_gender || null,
        target_crowd_type: form.target_crowd_type || null,
        active: form.active,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      const payload = {
        type: form.type,
        resource_id: form.resource_id,
        title: form.title,
        priority: Number.isFinite(Number(form.priority)) ? Number(form.priority) : 0,
        target_city: form.target_city || null,
        target_gender: form.target_gender || null,
        target_crowd_type: form.target_crowd_type || null,
        active: form.active,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      };
      createMutation.mutate(payload);
    }
  };

  const openAdd = () => {
    setForm(emptyForm());
    setEditingId(null);
    setSearchQuery('');
    setSearchResults([]);
    setFormError('');
    setActiveTab('add');
  };

  const openEdit = (rec: any) => {
    const resource = rec.resource_id || {};
    const label = rec.type === 'event' ? resource.title : resource.name;
    setForm({
      type: rec.type,
      resource_id: resource._id || (typeof rec.resource_id === 'string' ? rec.resource_id : ''),
      resource_label: label || '',
      title: rec.title || '',
      priority: rec.priority ?? 0,
      target_city: rec.target_city || '',
      target_gender: rec.target_gender || '',
      target_crowd_type: rec.target_crowd_type || '',
      active: rec.active ?? true,
      starts_at: toLocalInput(rec.starts_at),
      ends_at: toLocalInput(rec.ends_at),
    });
    setEditingId(rec._id);
    setSearchQuery(label || '');
    setSearchResults([]);
    setFormError('');
    setActiveTab('add');
  };

  const cancelForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setFormError('');
    setActiveTab('active');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
    } catch {
      // error state could be surfaced here if desired; dialog stays open on failure
    } finally {
      setIsDeleting(false);
    }
  };

  const recList = Array.isArray(recommendations) ? recommendations : [];
  const previewList = Array.isArray(preview) ? preview : [];
  const cityOptions = Array.isArray(cities)
    ? cities.map((c: any) => ({ label: c.name, value: c.name }))
    : [];

  const tabs = [
    { id: 'active', label: 'Active', icon: LayoutList },
    { id: 'add',    label: isSuperAdmin ? (editingId ? 'Edit' : 'Add New') : 'Details', icon: Plus },
    { id: 'preview', label: 'Preview', icon: Eye },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
            Recommendations
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
            <Sparkles className="w-3 h-3" />
            Curate and push content to app users
          </div>
        </div>
        {isSuperAdmin && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary/80 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Add Recommendation
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => {
              if (id === 'active' || id === 'preview') {
                // leaving the edit form without saving — reset it
                if (activeTab === 'add') { setEditingId(null); setForm(emptyForm()); setFormError(''); }
              }
              setActiveTab(id);
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
              activeTab === id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'text-muted-foreground hover:text-white'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: Active ──────────────────────────────────────────────────────── */}
      {/* AnimatePresence mode="wait" needs to see a single child swap, not three
          sibling `{cond && <motion.div key=.../>}` blocks in its children array.
          With the old structure the exit animation for the outgoing tab could
          get stuck (no WAAPI support in some environments, or the diff not
          resolving) and the incoming tab's content never mounted — the page
          just went blank after clicking "Add Recommendation". A single
          ternary guarantees AnimatePresence always tracks exactly one child. */}
      <AnimatePresence mode="wait">
        {activeTab === 'active' ? (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <FilterDropdown
                label="Type"
                value={filterType}
                options={[
                  { label: 'All Types', value: '' },
                  { label: 'Events', value: 'event' },
                  { label: 'Clubs', value: 'club' },
                ]}
                onChange={setFilterType}
              />
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {recList.length} recommendation{recList.length !== 1 ? 's' : ''}
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : recList.length === 0 ? (
              <div className="text-center py-20">
                <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-black text-white uppercase tracking-widest">
                  No recommendations yet
                </p>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">
                  {isSuperAdmin ? 'Click "Add Recommendation" to get started' : 'No items to display'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recList.map((rec: any) => (
                  <RecommendationCard
                    key={rec._id}
                    rec={rec}
                    isSuperAdmin={isSuperAdmin}
                    onToggleActive={(id, active) => updateMutation.mutate({ id, data: { active } })}
                    onDelete={() => setDeleteTarget(rec)}
                    onEdit={openEdit}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ) : activeTab === 'add' ? (
          <motion.div
            key="add"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {!isSuperAdmin ? (
              <div className="text-center py-20">
                <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-black text-white uppercase tracking-widest">
                  Read-only access
                </p>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">
                  Only Super Admins can add or edit recommendations
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
                <FormSection
                  title="Content Type"
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  {editingId ? (
                    <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-white/[0.02] text-white/60">
                      <Lock className="w-4 h-4 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        Type and linked {form.type} can't be changed after creation. Delete and re-add to point at a different {form.type}.
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      {(['event', 'club'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({ ...f, type: t, resource_id: '', resource_label: '' }));
                            setSearchQuery('');
                            setSearchResults([]);
                          }}
                          className={cn(
                            'flex items-center gap-3 p-4 rounded-2xl border transition-all',
                            form.type === t
                              ? 'border-primary/50 bg-primary/10 text-white'
                              : 'border-white/10 bg-white/[0.02] text-muted-foreground hover:text-white'
                          )}
                        >
                          {t === 'event' ? (
                            <Calendar className="w-5 h-5" />
                          ) : (
                            <Building2 className="w-5 h-5" />
                          )}
                          <span className="text-[11px] font-black uppercase tracking-widest capitalize">
                            {t}
                          </span>
                          {form.type === t && <Check className="w-3.5 h-3.5 ml-auto text-primary" />}
                        </button>
                      ))}
                    </div>
                  )}
                </FormSection>

                <FormSection
                  title="Select Resource"
                  icon={<Search className="w-4 h-4" />}
                >
                  {editingId ? (
                    <div className="flex items-center gap-3 px-6 py-5 bg-[#09090B] border border-white/5 rounded-[24px] text-white/70">
                      {form.type === 'event' ? (
                        <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                      ) : (
                        <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="text-sm font-bold truncate">{form.resource_label || 'Unknown resource'}</span>
                    </div>
                  ) : (
                    <div className="relative" ref={resourceDropdownRef}>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-6 top-1/2 -translate-y-1/2 text-white/20" />
                        <input
                          type="text"
                          placeholder={`Search ${form.type}s… or click to browse all`}
                          value={searchQuery}
                          onFocus={handleResourceFocus}
                          onChange={(e) => handleResourceSearch(e.target.value)}
                          className="w-full bg-[#09090B] border border-white/5 rounded-[24px] py-6 pl-14 pr-8 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 placeholder:text-white/10"
                        />
                        {isSearching && (
                          <Loader2 className="w-4 h-4 animate-spin absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        )}
                      </div>
                      <AnimatePresence>
                        {isResourceDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            className="absolute top-full mt-2 w-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto custom-scrollbar"
                          >
                            {isSearching ? (
                              <div className="px-4 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading {form.type}s…
                              </div>
                            ) : searchResults.length === 0 ? (
                              <div className="px-4 py-6 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {searchQuery ? `No ${form.type}s match "${searchQuery}"` : `No ${form.type}s found`}
                              </div>
                            ) : (
                              searchResults.map((item: any) => {
                                const label = form.type === 'event' ? item.title : item.name;
                                return (
                                  <button
                                    key={item._id}
                                    type="button"
                                    onClick={() => selectResource(item)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                                      {form.type === 'event' ? (
                                        <Calendar className="w-3.5 h-3.5 text-purple-400" />
                                      ) : (
                                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-white truncate">{label}</p>
                                      {item.city && (
                                        <p className="text-[9px] text-muted-foreground">{item.city}</p>
                                      )}
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                  {!editingId && form.resource_id && (
                    <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                      <Check className="w-3 h-3" /> Selected: {form.resource_label}
                    </div>
                  )}
                </FormSection>

                <FormSection
                  title="Display Options"
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  <div className="space-y-6">
                    <RefinedField
                      label="Title Override (optional)"
                      name="title"
                      placeholder="Leave blank to use resource name"
                      value={form.title}
                      onChange={(e: any) => setForm((f) => ({ ...f, title: e.target.value }))}
                    />
                    <RefinedField
                      label="Priority (lower = higher rank)"
                      name="priority"
                      type="number"
                      placeholder="0"
                      value={form.priority}
                      onChange={(e: any) => {
                        const v = e.target.value;
                        setForm((f) => ({ ...f, priority: v === '' ? 0 : Number(v) }));
                      }}
                    />
                    {/* Active toggle */}
                    <div className="flex items-center justify-between px-8 py-6 bg-[#09090B] border border-white/5 rounded-[24px]">
                      <span className="text-sm text-white/60 font-bold uppercase tracking-widest text-[10px]">
                        Active
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={form.active}
                        onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                        className={cn(
                          'w-12 h-7 rounded-full flex items-center transition-all',
                          form.active ? 'bg-emerald-500 justify-end' : 'bg-white/10 justify-start'
                        )}
                      >
                        <div className="w-5 h-5 rounded-full bg-white shadow-md mx-1" />
                      </button>
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Audience Targeting"
                  icon={<MapPin className="w-4 h-4" />}
                >
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                        Target City
                      </label>
                      <FilterDropdown
                        label="Any City"
                        value={form.target_city}
                        options={[
                          { label: 'Any City', value: '' },
                          ...cityOptions,
                        ]}
                        onChange={(v: string) => setForm((f) => ({ ...f, target_city: v }))}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                        Target Gender
                      </label>
                      <FilterDropdown
                        label="Any Gender"
                        value={form.target_gender}
                        options={[
                          { label: 'Any Gender', value: '' },
                          ...GENDERS.map((g) => ({ label: g, value: g })),
                        ]}
                        onChange={(v: string) => setForm((f) => ({ ...f, target_gender: v }))}
                      />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                        Crowd Type
                      </label>
                      <FilterDropdown
                        label="Any Crowd"
                        value={form.target_crowd_type}
                        options={[
                          { label: 'Any Crowd', value: '' },
                          ...CROWD_TYPES.map((c) => ({ label: c, value: c })),
                        ]}
                        onChange={(v: string) => setForm((f) => ({ ...f, target_crowd_type: v }))}
                      />
                    </div>
                  </div>
                </FormSection>

                <FormSection
                  title="Schedule Window"
                  icon={<Calendar className="w-4 h-4" />}
                >
                  <div className="grid grid-cols-2 gap-6">
                    <RefinedField
                      label="Starts At"
                      name="starts_at"
                      type="datetime-local"
                      value={form.starts_at}
                      onChange={(e: any) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
                    />
                    <RefinedField
                      label="Ends At"
                      name="ends_at"
                      type="datetime-local"
                      value={form.ends_at}
                      onChange={(e: any) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
                    />
                  </div>
                </FormSection>

                {formError && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
                  </div>
                )}

                <div className="flex items-center gap-4 pb-8">
                  <button
                    type="submit"
                    disabled={!form.resource_id || createMutation.isPending || updateMutation.isPending}
                    className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary/80 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {editingId ? 'Save Changes' : 'Add Recommendation'}
                  </button>
                  <button
                    type="button"
                    onClick={cancelForm}
                    className="px-6 py-4 rounded-2xl border border-white/10 text-muted-foreground text-[11px] font-black uppercase tracking-widest hover:text-white hover:border-white/20 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        ) : activeTab === 'preview' ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
              <Eye className="w-3 h-3" />
              Simulated mobile app feed — active & scheduled recommendations only
            </div>

            {isPreviewLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="flex gap-8 items-start justify-center">
                {/* Phone shell */}
                <div className="w-[360px] shrink-0">
                  <div className="relative bg-[#0a0a0a] rounded-[3rem] border-4 border-white/10 shadow-2xl overflow-hidden">
                    {/* Status bar */}
                    <div className="h-10 bg-black/50 flex items-center justify-between px-6">
                      <span className="text-[9px] font-bold text-white/50">9:41</span>
                      <div className="w-20 h-4 bg-black rounded-full mx-auto" />
                      <div className="flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5 text-white/50" />
                        <span className="text-[9px] font-bold text-white/50">100%</span>
                      </div>
                    </div>

                    {/* App header */}
                    <div className="px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-white uppercase tracking-widest">For You</p>
                        <p className="text-[9px] text-muted-foreground">Recommended picks</p>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                    </div>

                    {/* Feed */}
                    <div className="px-4 pb-6 space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar">
                      {previewList.length === 0 ? (
                        <div className="text-center py-12">
                          <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            No active recommendations
                          </p>
                        </div>
                      ) : (
                        previewList.map((rec: any) => (
                          <PhonePreviewCard key={rec._id} rec={rec} />
                        ))
                      )}
                    </div>

                    {/* Home indicator */}
                    <div className="h-6 flex items-center justify-center">
                      <div className="w-24 h-1 bg-white/20 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="space-y-4 pt-4">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                    {previewList.length} item{previewList.length !== 1 ? 's' : ''} showing
                  </p>
                  {previewList.map((rec: any, i: number) => {
                    const resource = rec.resource_id || {};
                    const name = rec.type === 'event' ? resource.title : resource.name;
                    return (
                      <div key={rec._id} className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-[10px] font-bold text-white">{rec.title || name}</p>
                          <p className="text-[9px] text-muted-foreground uppercase">
                            {rec.type} · priority {rec.priority}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmDialog
            rec={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
CLAUDE_EOF
echo "  wrote src/pages/Recommendations.tsx"

mkdir -p "src/pages"
cat > "src/pages/ManageFilters.tsx" << 'CLAUDE_EOF'
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Loader2, MapPin, Music, Calendar, Building2, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';
import { FilterDropdown } from '../components/FilterDropdown';

import { API_BASE } from '../lib/apiConfig';

// ─────────────────────────────────────────────────────────────────────────
// This page previously POSTed to made-up endpoints like `${API_BASE}/cities`,
// `${API_BASE}/genres`, `${API_BASE}/eventTypes`, `${API_BASE}/venueTypes` —
// none of which exist on the backend, so "+ Add" always silently 404'd.
// The real endpoints/fields per tab are:
//   Cities      → GET  /city/get_all_cities   POST /city/create_city
//                 (multipart: city_name, state_id, latitude, longitude)
//   Music Genre → GET  /genre/get_all_genres  POST /genre/add_genre
//                 (multipart: name, optional description/image)
//   Event Types → GET  /category/get_category POST /category/add_category
//                 (json: category_name, category_type: 1)
//   Venue Types → same /category endpoints, category_type: 2
// Categories share one endpoint for both Event/Venue types, filtered by
// category_type (1 = Event, 2 = Venue) client-side.
// ─────────────────────────────────────────────────────────────────────────

type TabId = 'cities' | 'genres' | 'eventTypes' | 'venueTypes';

const TAB_CONFIG: Record<TabId, {
  listUrl: string;
  createUrl: string;
  deleteUrl: (id: string) => string;
  nameField: string;
  categoryType?: number;
}> = {
  cities: {
    listUrl: `${API_BASE}/city/get_all_cities`,
    createUrl: `${API_BASE}/city/create_city`,
    deleteUrl: (id) => `${API_BASE}/city/delete_city/${id}`,
    nameField: 'city_name',
  },
  genres: {
    listUrl: `${API_BASE}/genre/get_all_genres`,
    createUrl: `${API_BASE}/genre/add_genre`,
    deleteUrl: (id) => `${API_BASE}/genre/delete_genre/${id}`,
    nameField: 'name',
  },
  eventTypes: {
    listUrl: `${API_BASE}/category/get_category`,
    createUrl: `${API_BASE}/category/add_category`,
    deleteUrl: (id) => `${API_BASE}/category/delete_category/${id}`,
    nameField: 'category_name',
    categoryType: 1,
  },
  venueTypes: {
    listUrl: `${API_BASE}/category/get_category`,
    createUrl: `${API_BASE}/category/add_category`,
    deleteUrl: (id) => `${API_BASE}/category/delete_category/${id}`,
    nameField: 'category_name',
    categoryType: 2,
  },
};

export default function ManageFilters() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('cities');
  const [newItemName, setNewItemName] = useState('');
  const [newItemState, setNewItemState] = useState('');
  const [newItemLat, setNewItemLat] = useState('');
  const [newItemLng, setNewItemLng] = useState('');
  const [formError, setFormError] = useState('');

  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: 'cities', label: 'Cities', icon: MapPin },
    { id: 'genres', label: 'Music Genres', icon: Music },
    { id: 'eventTypes', label: 'Event Types', icon: Calendar },
    { id: 'venueTypes', label: 'Venue Types', icon: Building2 },
  ];

  const config = TAB_CONFIG[activeTab];

  const { data: items, isLoading } = useQuery({
    queryKey: ['manage-filters', activeTab],
    queryFn: async () => {
      const res = await fetch(config.listUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      const list = Array.isArray(json?.data) ? json.data : [];
      // Categories power both Event Types and Venue Types tabs from the
      // same list — split by category_type client-side.
      if (activeTab === 'eventTypes' || activeTab === 'venueTypes') {
        return list.filter((c: any) => c.category_type === config.categoryType);
      }
      return list;
    },
  });

  // Cities need a State to belong to — fetch the list for the dropdown.
  // Only needed while the Cities tab is open.
  const { data: states } = useQuery({
    queryKey: ['states-for-manage-filters'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/state/get_all_states`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return Array.isArray(json?.data) ? json.data : [];
    },
    enabled: activeTab === 'cities',
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      const name = newItemName.trim();
      let res: Response;

      if (activeTab === 'cities') {
        if (!newItemState) throw new Error('Select a state first');
        const body = new FormData();
        body.append('city_name', name);
        body.append('state_id', newItemState);
        body.append('latitude', newItemLat || '0');
        body.append('longitude', newItemLng || '0');
        res = await fetch(config.createUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body,
        });
      } else if (activeTab === 'genres') {
        const body = new FormData();
        body.append('name', name);
        res = await fetch(config.createUrl, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body,
        });
      } else {
        // eventTypes / venueTypes → Category
        res = await fetch(config.createUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ category_name: name, category_type: config.categoryType }),
        });
      }

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message?.[0] || json?.message || 'Failed to add item');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-filters', activeTab] });
      setNewItemName('');
      setNewItemState('');
      setNewItemLat('');
      setNewItemLng('');
      setFormError('');
    },
    onError: (err: any) => setFormError(err.message || 'Failed to add item'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(config.deleteUrl(id), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete item');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manage-filters', activeTab] });
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (newItemName.trim()) {
      addItemMutation.mutate();
    }
  };

  const stateOptions = (Array.isArray(states) ? states : []).map((s: any) => ({
    label: s.state_name,
    value: s._id,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-black text-white tracking-tight uppercase">Manage <span className="text-primary neon-text">Filters</span></h2>
      </div>

      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-white/5 hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setFormError(''); }}
              className={cn(
                "flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative whitespace-nowrap",
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-white"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_10px_rgba(255,45,154,0.5)]" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder={`Add new ${tabs.find(t => t.id === activeTab)?.label.slice(0, -1).toLowerCase()}...`}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
              />

              {activeTab === 'cities' && (
                <div className="w-full sm:w-48">
                  <FilterDropdown
                    value={newItemState}
                    onChange={setNewItemState}
                    options={stateOptions}
                    placeholder="Select state..."
                    buttonClassName="py-3 px-4 rounded-xl text-sm h-full"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={!newItemName.trim() || addItemMutation.isPending || (activeTab === 'cities' && !newItemState)}
                className="px-6 py-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addItemMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>

            {activeTab === 'cities' && (
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  type="number"
                  step="any"
                  value={newItemLat}
                  onChange={(e) => setNewItemLat(e.target.value)}
                  placeholder="Latitude (optional)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
                />
                <input
                  type="number"
                  step="any"
                  value={newItemLng}
                  onChange={(e) => setNewItemLng(e.target.value)}
                  placeholder="Longitude (optional)"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
                />
              </div>
            )}

            {formError && (
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {formError}
              </div>
            )}
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {isLoading ? (
              <div className="col-span-full py-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : !items || items.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground text-[10px] font-black uppercase tracking-widest leading-none">
                No items found. Add one above.
              </div>
            ) : (
              items.map((item: any) => (
                <div key={item._id || item.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 group hover:bg-white/10 transition-colors">
                  <span className="text-sm font-bold text-white">{item[config.nameField]}</span>
                  <button
                    onClick={() => deleteItemMutation.mutate(item._id || item.id)}
                    disabled={deleteItemMutation.isPending}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
CLAUDE_EOF
echo "  wrote src/pages/ManageFilters.tsx"

mkdir -p "src/pages"
cat > "src/pages/Dashboard.tsx" << 'CLAUDE_EOF'
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Calendar,
  Building2,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Ticket,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { cn, groupByDate, countBy } from '../lib/utils';
import { motion } from 'motion/react';
import { GlowCard } from '../components/ui/spotlight-card';
import NormalAdminProfile from '../components/NormalAdminProfile';

import { API_BASE } from '../lib/apiConfig';
function MetricCard({ title, value, change, trend, icon: Icon, updateText }: any) {
  return (
    <motion.div whileHover={{ y: -5 }} className="h-full">
      <GlowCard customSize className="h-full p-5 border-white/10 hover:border-primary/50 transition-all group relative overflow-hidden flex flex-col justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-primary/20 transition-colors">
            <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          {/* Only render a trend badge when we actually have a real comparison value to show */}
          {change != null && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
              trend === 'up' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
            )}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {change}%
            </div>
          )}
        </div>
        <div className="space-y-1 relative z-10">
          <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
            {title}
            {(title === 'Active Users' || title === 'People Online') && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            )}
          </h3>
          <div className="text-2xl font-black text-white tracking-tight">{value}</div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
          <span className="text-[10px] text-muted-foreground">{updateText}</span>
        </div>
      </GlowCard>
    </motion.div>
  );
}

export default function Dashboard() {
  const { token, user } = useAuth();

  // ── Real queries, already backed by actual endpoints ─────────────────────────
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/events/list`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  // TODO: userRoute.js is disabled on the backend (userController.js missing exports:
  // getAllUsers, getUserById, updateUserStatus, getDeletedUsers, getUserDetails,
  // imageUpload, getUserBookings, getUserReports, updateUserReportStatus).
  // Re-enable this query once those routes are restored on the backend.
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/user/getAllUsers`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: false, // flip to `user?.role === 'SUPER_ADMIN'` once backend is ready
  });

  // ── Scaffolded queries — disabled until real endpoints are wired in ──────────
  // TODO: replace `${API_BASE}/TODO_CLUB_OPS` with the real endpoint(s) for staff count,
  // daily entries, guestlists, and VIP bookings. Shape assumed below is a guess —
  // adjust the field names once the response shape is known.
  const { data: clubOps } = useQuery({
    queryKey: ['clubOps'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/TODO_CLUB_OPS`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: false, // flip to `user?.role === 'CLUB_ADMIN'` once the endpoint exists
  });

  // TODO: replace `${API_BASE}/TODO_CONVERSION_RATE` with the real conversion-rate endpoint.
  const { data: conversion } = useQuery({
    queryKey: ['conversionRate'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/TODO_CONVERSION_RATE`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: false, // flip on once the endpoint exists
  });

  const eventList = Array.isArray(events) ? events : [];
  const clubList  = Array.isArray(clubs)  ? clubs  : [];
  const userList  = Array.isArray(users)  ? users  : [];

  const activeEvents = eventList.filter((e: any) => e.status === 'LIVE' || e.status === 'UPCOMING').length;
  const pastEvents   = eventList.filter((e: any) => e.status === 'COMPLETED').length;
  const totalUsers   = userList.length;
  // "active" = has a real last_active/isActive flag. No more 30%-of-total guess.
  const activeUsers  = userList.filter((u: any) => u.last_active || u.isActive).length;

  // ── Growth chart data, built entirely from real createdAt timestamps on
  // the users/events/clubs already fetched above. No random/mock values.
  const userGrowth  = groupByDate(userList,  (u: any) => u.createdAt, 14, 'day');
  const eventGrowth = groupByDate(eventList, (e: any) => e.createdAt, 14, 'day');
  const clubGrowth  = groupByDate(clubList,  (c: any) => c.createdAt, 14, 'day');
  const growthChartData = userGrowth.map((bucket, i) => ({
    date: bucket.label,
    Users: bucket.count,
    Events: eventGrowth[i]?.count ?? 0,
    Clubs: clubGrowth[i]?.count ?? 0,
  }));

  // ── Breakdown chart data, also built from the same real events/clubs.
  const eventStatusData = countBy(eventList, (e: any) => e.status);
  const clubStatusData  = countBy(clubList,  (c: any) => c.is_active ? 'Active' : 'Inactive');
  const PIE_COLORS = ['#3B82F6', '#A855F7', '#F59E0B', '#10B981', '#EF4444', '#6366F1'];

  // ── Early return for NORMAL_ADMIN ────────────────────────────────────────────
  if (user?.role === 'NORMAL_ADMIN') return <NormalAdminProfile />;

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Dashboard Overview</h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
            <Activity className="w-3 h-3" />
            Real-time activity and user statistics
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            System Live
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {user?.role === 'SUPER_ADMIN' && (
          <>
            <MetricCard title="Total Users"  value={totalUsers || 0}  icon={Users}    updateText="From /api/users" />
            <MetricCard title="Active Users" value={activeUsers || 0} icon={Activity} updateText="Has last_active or isActive flag" />
          </>
        )}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'EVENT_ADMIN') && (
          <>
            <MetricCard title="Active Events" value={activeEvents} icon={Calendar} updateText="From /api/events" />
            <MetricCard title="Past Events"   value={pastEvents}   icon={Calendar} updateText="From /api/events" />
          </>
        )}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'CLUB_ADMIN') && (
          <>
            <MetricCard title="Total Clubs" value={clubList.length} icon={Building2} updateText="From /api/clubs" />
            {user?.role === 'CLUB_ADMIN' && (
              <>
                <MetricCard title="Club Staff"   value={clubOps?.staffCount   ?? '—'} icon={Users}    updateText="Awaiting endpoint" />
                <MetricCard title="Daily Entry"  value={clubOps?.dailyEntries ?? '—'} icon={Activity} updateText="Awaiting endpoint" />
                <MetricCard title="Guestlists"   value={clubOps?.guestlists   ?? '—'} icon={Users}    updateText="Awaiting endpoint" />
                <MetricCard title="VIP Bookings" value={clubOps?.vipBookings  ?? '—'} icon={Ticket}   updateText="Awaiting endpoint" />
              </>
            )}
          </>
        )}
        <MetricCard
          title="Conversion Rate"
          value={conversion?.rate != null ? `${conversion.rate}%` : '—'}
          icon={TrendingUp}
          updateText="Awaiting endpoint"
        />
      </div>

      {/* Growth Chart — real data only, built from the users/events/clubs
          already fetched above (grouped by their actual createdAt dates). */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Growth Overview</h3>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">
                New users, events &amp; clubs — last 14 days
              </p>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={growthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#12121A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em' }} />
                <Area type="monotone" dataKey="Users"  stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="Events" stroke="#A855F7" strokeWidth={2} fillOpacity={1} fill="url(#colorEvents)" />
                <Area type="monotone" dataKey="Clubs"  stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorClubs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Breakdown charts — also real data, no placeholders */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Events by Status</h3>
              <Info
                className="w-3 h-3 text-muted-foreground/60 cursor-help"
                title="Shows how your event pipeline is split across its lifecycle stages — Upcoming, Live, Completed, Cancelled — so you can see at a glance how much is still active vs. wrapped up. If every slice is one color, it just means all loaded events currently share that one status."
              />
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Breakdown by lifecycle stage — Upcoming, Live, Completed, Cancelled</p>
            <div className="h-[240px]">
              {eventStatusData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No events yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie data={eventStatusData} dataKey="count" nameKey="label" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {eventStatusData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#12121A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-1.5 mb-1">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Clubs by Status</h3>
              <Info
                className="w-3 h-3 text-muted-foreground/60 cursor-help"
                title="Shows what share of your clubs/venues are Active (visible and bookable in the app) vs. Inactive (hidden from users, e.g. temporarily closed or deactivated by an admin)."
              />
            </div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Active (visible to users) vs. Inactive (hidden)</p>
            <div className="h-[240px]">
              {clubStatusData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No clubs yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie data={clubStatusData} dataKey="count" nameKey="label" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {clubStatusData.map((entry, i) => (
                        <Cell key={i} fill={entry.label === 'Active' ? '#10B981' : '#EF4444'} />
                      ))}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.1em' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#12121A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
CLAUDE_EOF
echo "  wrote src/pages/Dashboard.tsx"

mkdir -p "src/pages"
cat > "src/pages/ClubOnboarding.tsx" << 'CLAUDE_EOF'
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FormSection, RefinedField } from '../components/RefinedForm';
import {
  Building2,
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  Info,
  Check,
  MapPin,
  ArrowLeft,
  SearchIcon,
  Phone,
  Mail,
  Zap,
  X,
  Upload,
  User,
  Shield,
  Camera,
  Layers,
  Sparkles,
  Loader2,
  Users,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { FilterDropdown } from '../components/FilterDropdown';
import { useQuery } from '@tanstack/react-query';

import { API_BASE } from '../lib/apiConfig';
// ── Image upload helper ───────────────────────────────────────────────────────
// Sends a file to /api/upload (multer endpoint) and returns the server-side URL.
// Using base64 strings directly would make the payload enormous and break image
// rendering everywhere downstream.
async function uploadImage(file: File, token: string): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
  const data = await res.json();
  return data.url as string; // e.g. "/uploads/1234567890-portrait.jpg"
}

const initialForm = {
  name: '',
  type: '',
  email: '',
  capacity: '',
  contactName: '',
  phone: '',
  description: '',
  city: '',
  address: '',
  // Arrays of server-side URL strings — NOT base64
  landscape_urls: [] as string[],
  portraits: [] as string[],
  portrait_url: '',
};

export default function ClubOnboarding() {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'options' | 'register' | 'claim'>('options');
  const [registerStep, setRegisterStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  // Tracks which images are currently uploading so we can show per-image spinners
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [uploadingLandscape, setUploadingLandscape] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  React.useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 150);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: cities, isLoading: loadingCities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      // NOTE: was hitting `${API_BASE}/cities` (bare alias root, no handler → 404).
      const res = await fetch(`${API_BASE}/city/get_all_cities`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const { data: venueTypes, isLoading: loadingVenueTypes } = useQuery({
    queryKey: ['venueTypes'],
    queryFn: async () => {
      // NOTE: `${API_BASE}/venueTypes` doesn't exist on the backend either —
      // "venue types" are just Categories with category_type: 2 (1 = Event, 2 = Venue).
      const res = await fetch(`${API_BASE}/category/get_category`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      return list.filter((c: any) => c.category_type === 2);
    },
  });

  const { data: claimableClubs, isLoading: isLoadingClubs } = useQuery({
    queryKey: ['claimable-clubs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load clubs');
      const json = await res.json();
      // Backend returns { success, message, data: [...] } — was reading the
      // raw response as the array itself, so this list was always empty.
      return Array.isArray(json.data) ? json.data : [];
    },
    enabled: Boolean(token) && step === 'claim',
  });

  const cityOptions = Array.isArray(cities)
    ? cities.map((c: any) => ({ label: c.city_name, value: c._id }))
    : [];

  const venueTypeOptions = Array.isArray(venueTypes)
    ? venueTypes.map((t: any) => ({ label: t.category_name, value: t.category_name }))
    : [];

  // ── Registration form ──────────────────────────────────────────────────────

  const [venueFormData, setVenueFormData] = useState({
    ...initialForm,
    email: user?.email || '',
    contactName: user?.name || '',
  });

  const [workingHours, setWorkingHours] = useState([
    { day: 'Monday',    time: '10:00 PM - 04:00 AM', active: true },
    { day: 'Tuesday',   time: '10:00 PM - 04:00 AM', active: true },
    { day: 'Wednesday', time: '10:00 PM - 04:00 AM', active: true },
    { day: 'Thursday',  time: '10:00 PM - 04:00 AM', active: true },
    { day: 'Friday',    time: '10:00 PM - 04:00 AM', active: true },
    { day: 'Saturday',  time: '10:00 PM - 04:00 AM', active: true },
    { day: 'Sunday',    time: '10:00 PM - 04:00 AM', active: true },
  ]);
  const [lastUsedTime, setLastUsedTime] = useState('10:00 PM - 04:00 AM');

  const toggleDay = (index: number) => {
    const updated = [...workingHours];
    const nowActive = !updated[index].active;
    updated[index].active = nowActive;
    if (nowActive) updated[index].time = lastUsedTime;
    setWorkingHours(updated);
  };

  const updateDayTime = (index: number, time: string) => {
    const updated = [...workingHours];
    updated[index].time = time;
    setLastUsedTime(time);
    setWorkingHours(updated);
  };

  // ── Image upload handlers ──────────────────────────────────────────────────

  const handlePortraitUpload = async (file: File) => {
    setUploadError(null);
    setUploadingPortrait(true);
    try {
      const url = await uploadImage(file, token!);
      setVenueFormData((f) => ({
        ...f,
        portraits: [...f.portraits, url],
        portrait_url: f.portraits.length === 0 ? url : f.portrait_url,
      }));
    } catch (err: any) {
      setUploadError(err.message || 'Portrait upload failed.');
    } finally {
      setUploadingPortrait(false);
    }
  };

  const handleLandscapeUpload = async (file: File) => {
    setUploadError(null);
    setUploadingLandscape(true);
    try {
      const url = await uploadImage(file, token!);
      setVenueFormData((f) => ({ ...f, landscape_urls: [...f.landscape_urls, url] }));
    } catch (err: any) {
      setUploadError(err.message || 'Gallery upload failed.');
    } finally {
      setUploadingLandscape(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleRegister = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const selectedCity = (Array.isArray(cities) ? cities : []).find((c: any) => c._id === venueFormData.city);
      if (!selectedCity) {
        throw new Error('Select a city before submitting.');
      }
      if (!venueFormData.email || !venueFormData.phone) {
        throw new Error('Email and phone number are required.');
      }

      // FIXED (Phase 2): the real `/vendor/add_vendor` route requires
      // multipart/form-data (not JSON) with name, email, phone_number, city,
      // state, address, password, and vendor_type — none of which this form
      // was actually sending (no password/state field existed at all, so
      // every submission failed backend validation with "All fields are
      // required including vendor type"). This club-claim flow creates an
      // "owner" vendor and auto-generates a password, which the backend
      // emails to the registrant as part of its existing welcome email.
      // `state` is resolved from the selected city's `state_id` since the
      // form only collects a city.
      const generatedPassword = `Hii-${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 100)}!`;

      const body = new FormData();
      body.append('name', venueFormData.name);
      body.append('email', venueFormData.email);
      body.append('phone_number', venueFormData.phone);
      body.append('city', venueFormData.city);
      body.append('state', selectedCity.state_id);
      body.append('address', venueFormData.address || 'Not provided');
      body.append('password', generatedPassword);
      body.append('vendor_type', 'owner');

      const res = await fetch(`${API_BASE}/vendor/add_vendor`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      if (!res.ok) {
        const body2 = await res.json().catch(() => null);
        throw new Error(body2?.message?.[0] || body2?.message || `Registration failed with status ${res.status}`);
      }

      // New signups now require Super Admin approval before they can log in
      // — see the "Organiser Requests" review page. This isn't a failure,
      // just sets expectations correctly instead of implying the account is
      // immediately usable.
      updateUser({ organisation: venueFormData.name });
      setIsSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaim = (club: any) => {
    navigate(`/claim-club/${club.id}`);
  };

  // ── Claim search ───────────────────────────────────────────────────────────

  const [claimSearch, setClaimSearch] = useState('');
  const filteredClaimableClubs = (Array.isArray(claimableClubs) ? claimableClubs : []).filter(
    (club: any) => {
      const q = claimSearch.trim().toLowerCase();
      return !q || club.name?.toLowerCase().includes(q) || club.city?.toLowerCase().includes(q);
    }
  );

  // ── Success screen ─────────────────────────────────────────────────────────

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center p-6 text-center space-y-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 space-y-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-32 h-32 rounded-[48px] bg-primary/20 border-2 border-primary/40 flex items-center justify-center shadow-[0_0_60px_rgba(255,45,154,0.3)] mx-auto relative"
          >
            <div className="absolute inset-2 rounded-[38px] bg-primary/10 animate-ping" />
            <Check className="w-16 h-16 text-white stroke-[3px]" />
          </motion.div>
          <div className="space-y-6">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase mb-2">
                Request <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Submitted</span>
              </h1>
              <div className="h-1.5 w-24 bg-primary mx-auto rounded-full shadow-[0_0_20px_rgba(255,45,154,0.5)]" />
            </motion.div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/40 max-w-lg mx-auto text-sm md:text-base font-medium leading-relaxed tracking-wide"
            >
              Your venue has been submitted for review. A Super Admin will approve your account shortly — check your email for login details and a heads-up once you're approved.
            </motion.p>
          </div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="pt-4">
            <button
              onClick={() => navigate('/')}
              className="px-12 py-5 rounded-[24px] bg-primary text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 flex items-center gap-4 mx-auto group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10">Go to Dashboard</span>
              <Zap className="w-5 h-5 fill-current relative z-10 group-hover:scale-110 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Options screen ─────────────────────────────────────────────────────────

  if (step === 'options') {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="w-full max-w-4xl space-y-12 relative z-10">
          <div className="text-center space-y-4">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-black text-primary uppercase tracking-widest">
              <Zap className="w-3 h-3" /> Club Setup Process
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase">
              Register Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Club</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-muted-foreground max-w-xl mx-auto text-lg">
              Let's get your club set up. Choose how you want to proceed.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setStep('register')}
              className="glass-card group p-8 rounded-3xl border border-white/5 hover:border-primary/50 transition-all cursor-pointer bg-gradient-to-b from-white/[0.02] to-transparent"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase">Register New Club</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-medium">
                Start fresh and list your venue on Hii App. We'll guide you through setting up your profile, location, and photos.
              </p>
              <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                Get Started <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setStep('claim')}
              className="glass-card group p-8 rounded-3xl border border-white/5 hover:border-purple-500/50 transition-all cursor-pointer bg-gradient-to-b from-white/[0.02] to-transparent"
            >
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase">Claim Existing Club</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-medium">
                If your club was already pre-registered by our team, find it and link it to your account in just a few clicks.
              </p>
              <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-widest">
                Search & Claim <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ── Claim screen ───────────────────────────────────────────────────────────

  if (step === 'claim') {
    return (
      <div className="min-h-screen bg-[#0B0B0F] p-6 lg:p-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <button onClick={() => setStep('options')} className="group flex items-center gap-2 text-muted-foreground hover:text-white transition-all font-bold text-xs uppercase tracking-widest">
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white group-hover:bg-white/5 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to options
          </button>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white uppercase">Find Your Club</h1>
            <p className="text-muted-foreground font-medium">Search for your club by name or city.</p>
          </div>
          <div className="relative">
            <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={claimSearch}
              onChange={(e) => setClaimSearch(e.target.value)}
              placeholder="Search by club name or city..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-primary transition-all text-lg font-medium"
            />
          </div>
          <div className="grid gap-4">
            {isLoadingClubs && (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
            {!isLoadingClubs && filteredClaimableClubs.map((club: any) => (
              <motion.div
                key={club.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-white border border-white/10">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase">{club.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 font-bold uppercase tracking-wider">
                      <MapPin className="w-3 h-3" />
                      {club.city} — {club.address}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleClaim(club)}
                  disabled={submittingId !== null}
                  className="w-full md:w-auto px-10 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg hover:scale-105 disabled:opacity-50"
                >
                  {submittingId === club.id ? 'Claiming...' : 'Claim This Club'}
                </button>
              </motion.div>
            ))}
            {!isLoadingClubs && filteredClaimableClubs.length === 0 && (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-muted-foreground">
                  <SearchIcon className="w-8 h-8" />
                </div>
                <p className="text-muted-foreground">
                  {claimSearch ? `No clubs found matching "${claimSearch}"` : 'No clubs are available to claim.'}
                </p>
                <button onClick={() => setStep('register')} className="text-primary font-bold hover:underline">
                  Register a new club instead
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Registration flow ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0B0B0F] p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <button onClick={() => setStep('options')} className="group flex items-center gap-2 text-muted-foreground hover:text-white transition-all font-bold text-xs uppercase tracking-widest">
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white group-hover:bg-white/5 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to options
        </button>

        <div className="glass-card rounded-[32px] border border-white/10 shadow-2xl flex flex-col min-h-[80vh] relative">
          <AnimatePresence>
            {isSticky && (
              <motion.button
                initial={{ opacity: 0, x: 50, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.8 }}
                onClick={() => setRegisterStep(1)}
                className="fixed top-6 right-6 z-[100] px-8 py-4 rounded-[20px] shadow-2xl bg-white text-black hover:bg-primary hover:text-white flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                <Building2 className="w-4 h-4" />
                <span>Edit Details</span>
              </motion.button>
            )}
          </AnimatePresence>

          <div className="p-8 lg:p-12 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tight uppercase underline decoration-primary/30 underline-offset-8">
                {registerStep === 1 ? 'Club Details' : registerStep === 2 ? 'Club Profile' : 'Photos & Media'}
              </h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-2">Step {registerStep} of 3</p>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className={cn("w-12 h-1.5 rounded-full transition-all duration-500", registerStep >= s ? "bg-primary shadow-[0_0_10px_rgba(255,45,154,0.5)]" : "bg-white/10")} />
              ))}
            </div>
          </div>

          <div className="flex-1 p-10 lg:p-14 overflow-y-auto scrollbar-hide">
            <AnimatePresence mode="wait">

              {registerStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                  <FormSection title="Basic Information" icon={<Building2 className="w-4 h-4" />}>
                    <div className="space-y-10">
                      <RefinedField
                        label="Club Name"
                        name="name"
                        value={venueFormData.name}
                        onChange={(e: any) => setVenueFormData({ ...venueFormData, name: e.target.value })}
                        placeholder="Enter club name"
                        icon={<Sparkles className="w-4 h-4" />}
                      />
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-8">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Select City</label>
                            {loadingCities ? (
                              <div className="flex items-center gap-2 text-muted-foreground text-xs py-6 px-10">
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading cities…
                              </div>
                            ) : cityOptions.length === 0 ? (
                              <p className="text-[10px] text-amber-400 px-2">No cities available — check that /api/cities is reachable.</p>
                            ) : (
                              <FilterDropdown
                                value={venueFormData.city}
                                onChange={(val) => setVenueFormData({ ...venueFormData, city: val })}
                                options={cityOptions}
                                placeholder="Select city"
                                buttonClassName="py-6 px-10 rounded-[28px] text-sm bg-[#09090B] border border-white/5 hover:border-white/10 transition-all text-white font-medium"
                              />
                            )}
                          </div>
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 text-primary">Full Address</label>
                            <textarea
                              rows={3}
                              value={venueFormData.address}
                              onChange={(e) => setVenueFormData({ ...venueFormData, address: e.target.value })}
                              placeholder="Enter local address"
                              className="w-full bg-[#09090B] border border-white/5 rounded-[32px] px-10 py-7 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 resize-none font-medium placeholder:text-white/10"
                            />
                          </div>
                        </div>
                        <div className="relative rounded-[40px] overflow-hidden border border-white/5 group min-h-[300px] shadow-inner bg-[#09090B]">
                          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80')] bg-cover bg-center grayscale opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
                            <div className="w-16 h-16 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                              <MapPin className="w-8 h-8 text-primary fill-primary" />
                            </div>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Address Verified</span>
                          </div>
                          <div className="absolute top-6 right-6 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified Account
                          </div>
                        </div>
                      </div>
                    </div>
                  </FormSection>

                  <FormSection title="Contact Information" icon={<Mail className="w-4 h-4" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="col-span-1 md:col-span-2">
                        <RefinedField label="Email Address" name="email" type="email" value={venueFormData.email} onChange={(e: any) => setVenueFormData({ ...venueFormData, email: e.target.value })} placeholder="club@example.com" icon={<Mail className="w-4 h-4" />} />
                      </div>
                      <RefinedField label="Phone Number" name="phone" value={venueFormData.phone} onChange={(e: any) => setVenueFormData({ ...venueFormData, phone: e.target.value })} placeholder="+91 00000 00000" icon={<Phone className="w-4 h-4" />} />
                      <RefinedField label="Contact Person" name="contactName" value={venueFormData.contactName} onChange={(e: any) => setVenueFormData({ ...venueFormData, contactName: e.target.value })} placeholder="Full Name" icon={<User className="w-4 h-4" />} />
                    </div>
                  </FormSection>
                </motion.div>
              )}

              {registerStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                  <FormSection title="Business Profile" icon={<Shield className="w-4 h-4" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Club Category</label>
                        {loadingVenueTypes ? (
                          <div className="flex items-center gap-2 text-muted-foreground text-xs py-6 px-10">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading types…
                          </div>
                        ) : venueTypeOptions.length === 0 ? (
                          <p className="text-[10px] text-amber-400 px-2">No venue types available.</p>
                        ) : (
                          <FilterDropdown
                            value={venueFormData.type}
                            onChange={(val) => setVenueFormData({ ...venueFormData, type: val })}
                            options={venueTypeOptions}
                            placeholder="Select classification"
                            buttonClassName="py-6 px-10 rounded-[28px] text-sm bg-[#09090B] border border-white/5 hover:border-white/10 transition-all text-white font-medium"
                          />
                        )}
                      </div>
                      <RefinedField label="Max Capacity" name="capacity" type="number" value={venueFormData.capacity} onChange={(e: any) => setVenueFormData({ ...venueFormData, capacity: e.target.value })} placeholder="Max capacity" icon={<Users className="w-4 h-4" />} />
                      <div className="col-span-1 md:col-span-2 space-y-4">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">About the Club</label>
                        <textarea
                          rows={6}
                          value={venueFormData.description}
                          onChange={(e) => setVenueFormData({ ...venueFormData, description: e.target.value })}
                          placeholder="Tell us about your venue..."
                          className="w-full bg-[#09090B] border border-white/5 rounded-[40px] px-10 py-8 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 resize-none font-medium placeholder:text-white/10"
                        />
                      </div>
                    </div>
                  </FormSection>
                </motion.div>
              )}

              {registerStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-14">
                  {uploadError && (
                    <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{uploadError}</div>
                  )}
                  <FormSection title="Profile Photos" icon={<Camera className="w-4 h-4" />}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {venueFormData.portraits.map((url: string, idx: number) => (
                        <motion.div
                          layout
                          key={url}
                          className={cn(
                            "relative aspect-[3/4] rounded-[32px] overflow-hidden border-2 transition-all duration-500 group/image",
                            venueFormData.portrait_url === url
                              ? "border-primary shadow-[0_15px_40px_rgba(255,45,154,0.3)] scale-[1.02]"
                              : "border-white/5 hover:border-white/20"
                          )}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover/image:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                          {venueFormData.portrait_url !== url && (
                            <button
                              onClick={() => setVenueFormData({ ...venueFormData, portrait_url: url })}
                              className="absolute inset-0 bg-primary/20 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-md"
                            >
                              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] bg-primary/40 px-5 py-2.5 rounded-full border border-white/10 shadow-2xl">Set as Main</span>
                            </button>
                          )}
                          {venueFormData.portrait_url === url && (
                            <div className="absolute top-4 left-4 bg-primary rounded-full p-2 shadow-[0_0_20px_rgba(255,45,154,0.8)] border border-white/20">
                              <Check className="w-4 h-4 text-white stroke-[4px]" />
                            </div>
                          )}
                          <button
                            onClick={() => {
                              const next = venueFormData.portraits.filter((_: any, i: number) => i !== idx);
                              setVenueFormData({
                                ...venueFormData,
                                portraits: next,
                                portrait_url: venueFormData.portrait_url === url ? (next[0] || '') : venueFormData.portrait_url,
                              });
                            }}
                            className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 opacity-0 group-hover/image:opacity-100 transition-all hover:border-red-500/50 hover:bg-red-500/10 active:scale-90"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </motion.div>
                      ))}

                      <label className="relative aspect-[3/4] rounded-[32px] border-2 border-dashed border-white/5 bg-[#09090B] hover:bg-white/[0.04] hover:border-primary/40 transition-all duration-500 flex flex-col items-center justify-center cursor-pointer group shadow-inner">
                        {uploadingPortrait ? (
                          <Loader2 className="w-7 h-7 text-primary animate-spin" />
                        ) : (
                          <>
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all group-hover:bg-primary/20">
                              <Plus className="w-7 h-7 text-white/20 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="mt-4 text-center">
                              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] block group-hover:text-primary transition-colors mb-1">Add Photo</span>
                              <span className="text-[8px] font-bold text-white/5 uppercase tracking-widest">Portrait</span>
                            </div>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingPortrait}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePortraitUpload(f); }}
                        />
                      </label>
                    </div>
                  </FormSection>

                  <FormSection title="Gallery Photos" icon={<Layers className="w-4 h-4" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                      {venueFormData.landscape_urls.map((url: string, idx: number) => (
                        <div key={url} className="relative aspect-video rounded-[40px] overflow-hidden border border-white/5 bg-[#09090B] group/landscape shadow-2xl">
                          <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-[2s] group-hover/landscape:scale-[1.15]" />
                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/landscape:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-md">
                            <button
                              onClick={() => setVenueFormData({ ...venueFormData, landscape_urls: venueFormData.landscape_urls.filter((_: any, i: number) => i !== idx) })}
                              className="w-14 h-14 bg-red-500/10 rounded-[24px] text-red-500 hover:scale-110 transition-all flex items-center justify-center border border-red-500/20 active:scale-95"
                            >
                              <Trash2 className="w-6 h-6" />
                            </button>
                          </div>
                        </div>
                      ))}

                      <label className="relative aspect-video rounded-[40px] border-2 border-dashed border-white/5 bg-[#09090B] hover:bg-white/[0.04] hover:border-blue-400/40 transition-all duration-500 flex flex-col items-center justify-center cursor-pointer group overflow-hidden shadow-inner">
                        {uploadingLandscape ? (
                          <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
                        ) : (
                          <>
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-all group-hover:bg-blue-400/20">
                              <Upload className="w-7 h-7 text-white/20 group-hover:text-blue-400 transition-all" />
                            </div>
                            <span className="text-[10px] font-black text-white/20 group-hover:text-blue-400 uppercase tracking-[0.3em] mt-4 transition-colors">Add Media</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingLandscape}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLandscapeUpload(f); }}
                        />
                      </label>
                    </div>
                  </FormSection>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-10 lg:p-14 border-t border-white/5 bg-white/[0.02] flex flex-col gap-4 relative z-10">
            {submitError && (
              <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{submitError}</div>
            )}
            <div className="flex items-center justify-between">
              <button
                onClick={() => registerStep === 1 ? setStep('options') : setRegisterStep((s) => s - 1)}
                className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-4 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                {registerStep === 1 ? 'Back' : 'Go Back'}
              </button>
              {registerStep < 3 ? (
                <button
                  onClick={() => setRegisterStep((s) => s + 1)}
                  className="px-14 py-5 rounded-[24px] bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4 group"
                >
                  Next Step <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={isSubmitting || uploadingPortrait || uploadingLandscape}
                  className="px-16 py-5 rounded-[24px] bg-gradient-to-br from-primary to-purple-600 text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_10px_50px_rgba(255,45,154,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50 group"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                  {isSubmitting ? 'Saving…' : 'Complete Setup'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
CLAUDE_EOF
echo "  wrote src/pages/ClubOnboarding.tsx"

mkdir -p "src/pages"
cat > "src/pages/Events.tsx" << 'CLAUDE_EOF'
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  MoreHorizontal,
  Zap,
  User,
  ChevronRight,
  ChevronLeft,
  X,
  Shield,
  Activity,
  ArrowRight,
  Database,
  Loader2,
  Check,
  Info,
  Image,
  Star,
  MapPin,
  Building2,
  Ticket,
  Calendar,
  Clock,
  Users,
  XCircle,
  BarChart2,
  CheckCircle2,
  Download,
  Upload,
  Link as LinkIcon,
  Trash2,
  Edit2,
  Eye,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { cn } from '../lib/utils';
import { FilterDropdown } from '../components/FilterDropdown';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { FilterPanel } from '../components/FilterPanel';
import { motion, AnimatePresence } from 'motion/react';
import { FormSection, RefinedField } from '../components/RefinedForm';
import { FeatureEventModal } from '../components/FeatureEventModal';
import EventProfilePreview from '../components/EventProfilePreview';
import { Layout as LayoutIcon } from 'lucide-react';

import { API_BASE } from '../lib/apiConfig';
const statusColors: any = {
  ACTIVE:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PAST:      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
  UPCOMING:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  LIVE:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const eventId   = (e: any) => e?._id || e?.id || '';
const statusLabel = (e: any) => {
  if (e.status === 'LIVE' || e.status === 'UPCOMING') return 'ACTIVE';
  if (e.status === 'COMPLETED') return 'PAST';
  return e.status || 'ACTIVE';
};

// TODO: BROKEN - there is no `/upload` route on the real backend (that endpoint
// only existed in an old, unused Mongoose codebase). The real backend's
// eventRoute.js expects multipart form-data directly on create/update
// (`upload.fields([{ name: "venue_image" }, { name: "artist_images" }, ...])`),
// not a separate upload step that returns a URL. This function will always
// fail until image upload is rewired to attach files directly to the
// create/update FormData instead of pre-uploading.
async function uploadFile(file: File, token: string): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url ?? data.path ?? data.secure_url;
}

// ─── ImageUploadZone ──────────────────────────────────────────────────────────
function ImageUploadZone({
  label, hint, value, onChange, aspect, token,
}: { label: string; hint: string; value: string; onChange: (url: string) => void; aspect: string; token: string }) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');

  const handleFile = async (file: File) => {
    setError(''); setUploading(true);
    try   { onChange(await uploadFile(file, token)); }
    catch { setError('Upload failed. Try again.'); }
    finally { setUploading(false); }
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 block">{label}</label>
      <div
        className={cn(aspect, 'w-full rounded-[40px] bg-[#09090B] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/[0.04] hover:border-primary/30 transition-all group relative overflow-hidden')}
        onClick={() => !uploading && inputRef.current?.click()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onDragOver={(e) => e.preventDefault()}
      >
        {value && !uploading && (
          <>
            <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-[11px] font-black uppercase text-white tracking-[0.2em]">Change Image</span>
            </div>
          </>
        )}
        {uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-[11px] font-black uppercase text-white/60 tracking-[0.2em]">Uploading…</span>
          </div>
        )}
        {!value && !uploading && (
          <>
            <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-primary/20 transition-all relative z-10 shadow-2xl">
              <Upload className="w-8 h-8 text-white/20 group-hover:text-primary transition-colors" />
            </div>
            <div className="space-y-2 text-center relative z-10">
              <span className="text-[11px] font-black uppercase text-white/40 tracking-[0.2em] block">Upload Image</span>
              <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">{hint}</span>
            </div>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      {error && <p className="text-[10px] text-red-400 font-bold ml-2">{error}</p>}
    </div>
  );
}

// ─── GalleryUploadZone ────────────────────────────────────────────────────────
function GalleryUploadZone({ urls, onChange, token }: { urls: string[]; onChange: (u: string[]) => void; token: string }) {
  const handleFile = async (index: number, file: File) => {
    try {
      const url  = await uploadFile(file, token);
      const next = [...urls]; next[index] = url; onChange(next);
    } catch {}
  };
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 block">Gallery Preview</label>
      <div className="grid grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => {
          const ref = React.createRef<HTMLInputElement>();
          return (
            <div key={i} className="aspect-square rounded-3xl bg-[#09090B] border border-white/5 flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer group relative overflow-hidden" onClick={() => ref.current?.click()}>
              {urls[i] ? (
                <>
                  <img src={urls[i]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                </>
              ) : (
                <Plus className="w-6 h-6 text-white/10 group-hover:text-primary transition-colors" />
              )}
              <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(i, f); }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────
function DeleteConfirmDialog({ event, onConfirm, onCancel, isDeleting }: { event: any; onConfirm: () => void; onCancel: () => void; isDeleting: boolean }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card w-full max-w-md rounded-3xl border border-red-500/20 overflow-hidden shadow-2xl p-8 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-white uppercase tracking-tight">Delete Event</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">This action cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-white/60 leading-relaxed">
          Are you sure you want to delete <span className="text-white font-bold">"{event.title}"</span>? This will permanently remove it from the database.
        </p>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isDeleting} className="flex-1 py-3.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {isDeleting ? 'Deleting…' : 'Delete Event'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Row Actions Menu ─────────────────────────────────────────────────────────
function RowActionsMenu({ event, onEdit, onDelete, onPreview, onAnalytics, showAnalyticsBtn }: {
  event: any; onEdit: () => void; onDelete: () => void;
  onPreview: () => void; onAnalytics: () => void; showAnalyticsBtn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-full mt-1 w-44 bg-[#09090B] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden py-1"
          >
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); onPreview(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all text-left">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all text-left">
              <Edit2 className="w-3.5 h-3.5" /> Edit
            </button>
            {showAnalyticsBtn && (
              <button onClick={(e) => { e.stopPropagation(); setOpen(false); onAnalytics(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all text-left">
                <BarChart2 className="w-3.5 h-3.5" /> Analytics
              </button>
            )}
            <div className="h-px bg-white/5 my-1" />
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-[11px] font-bold text-red-400 hover:bg-red-500/10 transition-all text-left">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Events() {
  const { token, user } = useAuth();
  const queryClient = useQueryClient();

  const [viewMode,       setViewMode]       = useState<'grid' | 'table'>('table');
  const [searchTerm,     setSearchTerm]     = useState('');
  const [filterStatus,   setFilterStatus]   = useState('ALL');
  const [filterCity,     setFilterCity]     = useState('ALL');
  const [sortField,      setSortField]      = useState('date');
  const [sortOrder,      setSortOrder]      = useState<'asc' | 'desc'>('desc');
  const [selectedEvent,  setSelectedEvent]  = useState<any>(null);
  const [isCreatingEvent,setIsCreatingEvent]= useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [showAnalytics,  setShowAnalytics]  = useState<any>(null);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [submitError,    setSubmitError]    = useState('');
  const [isPreviewing,   setIsPreviewing]   = useState(false);
  const [isFeaturing,    setIsFeaturing]    = useState(false);
  const [deleteTarget,   setDeleteTarget]   = useState<any>(null);
  const [isDeleting,     setIsDeleting]     = useState(false);
  const [creationStep,   setCreationStep]   = useState(1);
  const [modalKey,       setModalKey]       = useState(0); // increment to force modal remount

  // Scroll modal body to top whenever step changes
  React.useEffect(() => {
    const el = document.getElementById('modal-scroll-body');
    if (el) el.scrollTop = 0;
  }, [creationStep, isCreatingEvent]);

  const blankForm = {
    title: '', city: '', venue_id: '', vendor_id: '',
    genre: [] as string[], event_type: [] as string[],
    date: '', start_time: '', end_time: '', description: '',
    poster_url: '', landscape_url: '',
    gallery_urls: ['', '', '', ''] as string[],
    ticketing_link: '',
  };
  const [eventFormData, setEventFormData] = useState<any>(blankForm);

  // ── Queries (FIXED: correct paths + response unwrapping) ─────────────────────
  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/events/list`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/city/get_all_cities`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/genre/get_all_genres`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  // TODO: no eventTypeRoute.js exists on the backend yet - disabled until a
  // real endpoint is added. Dropdown will show no options until then.
  const { data: eventTypes } = useQuery({
    queryKey: ['eventTypes'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/eventTypes`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: false,
  });

  const { data: vendors } = useQuery({
    queryKey: ['mongo-vendors'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const vendorList   = Array.isArray(vendors) ? vendors : [];
  const getVendorId  = (e: any) => { if (!e) return ''; if (typeof e.vendor_id === 'object') return e.vendor_id?._id || e.vendor_id?.id || ''; return e.vendor_id || e.venue_id || ''; };
  const getVendorName = (id: string) => vendorList.find((v: any) => (v._id || v.id) === id)?.name || '';

  // ── Mutations ──────────────────────────────────────────────────────────────
  // TODO: BROKEN - real backend path is POST /events/create_event and it
  // expects multipart form-data (fields: venue_image, artist_images,
  // gallery_images, event_layout_images), not JSON at POST /events. This
  // mutation needs a rewrite to build FormData before it will actually work.
  const createEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`${API_BASE}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to create event'); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['events'] }); setIsCreatingEvent(false); setEventFormData(blankForm); setCreationStep(1); },
  });

  // TODO: BROKEN - real backend path is PUT /events/update_event/:id and it
  // expects multipart form-data, not JSON at PUT /events/:id. Needs a rewrite
  // to build FormData before it will actually work.
  const updateEventMutation = useMutation({
    mutationFn: async (data: any) => {
      const id = data._id || data.id;
      const { _id, id: _removed, ...body } = data;
      const res = await fetch(`${API_BASE}/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.message || 'Failed to update event'); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsCreatingEvent(false); setIsEditingEvent(false);
      setSelectedEvent(null); setEventFormData(blankForm); setCreationStep(1);
    },
  });

  // FIXED: real backend path is DELETE /events/delete_event/:id (this one
  // doesn't require multipart, so it's a straightforward URL fix).
  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/events/delete_event/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete event');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setDeleteTarget(null);
    },
  });

  // TODO: BROKEN - there is no `/events/feature` route on the real backend.
  // Featuring events is not yet implemented server-side.
  const featureEventMutation = useMutation({
    mutationFn: async (data: { city: string; eventId: string; duration: number }) => {
      const res = await fetch(`${API_BASE}/events/feature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });

  // ── Derived stats ──────────────────────────────────────────────────────────
  const eventList        = Array.isArray(events) ? events : [];
  const liveCount        = eventList.filter((e: any) => e.status === 'LIVE' || e.status === 'UPCOMING').length;
  const cancelledCount   = eventList.filter((e: any) => e.status === 'CANCELLED').length;
  const totalAttendance  = eventList.reduce((s: number, e: any) => s + (Number(e.attendance)   || 0), 0);
  const totalTicketsSold = eventList.reduce((s: number, e: any) => s + (Number(e.tickets_sold) || 0), 0);

  const filteredEvents = eventList.filter((e: any) => {
    const matchesSearch  = e.title?.toLowerCase().includes(searchTerm.toLowerCase()) || e.city?.toLowerCase().includes(searchTerm.toLowerCase());
    let   matchesStatus  = true;
    if      (filterStatus === 'ACTIVE')    matchesStatus = e.status === 'LIVE' || e.status === 'UPCOMING';
    else if (filterStatus === 'PAST')      matchesStatus = e.status === 'COMPLETED';
    else if (filterStatus !== 'ALL')       matchesStatus = e.status === filterStatus;
    const matchesCity = filterCity === 'ALL' || e.city === filterCity;
    return matchesSearch && matchesStatus && matchesCity;
  }).sort((a: any, b: any) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === 'date') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    } else {
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field
      ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)
      : <ArrowUpDown className="w-3 h-3 opacity-50" />;

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const exportData = () => {
    const headers = ['Title', 'City', 'Date', 'Status', 'Attendance', 'Genre'];
    const rows = filteredEvents.map((e: any) => [
      `"${e.title || ''}"`, `"${e.city || ''}"`, `"${e.date || ''}"`,
      `"${e.status || ''}"`, `"${e.attendance || 0}"`,
      `"${Array.isArray(e.genre) ? e.genre.join(', ') : (e.genre || '')}"`,
    ]);
    const csv  = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `events-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitError(''); setIsSubmitting(true);
    try {
      const vendor_id = eventFormData.vendor_id || eventFormData.venue_id;
      const missing: string[] = [];
      if (!eventFormData.title)       missing.push('Event Title');
      if (!vendor_id)                 missing.push('Venue');
      if (!eventFormData.date)        missing.push('Event Date');
      if (!eventFormData.start_time)  missing.push('Start Time');
      if (!eventFormData.end_time)    missing.push('End Time');
      if (!eventFormData.description) missing.push('Description');
      if (!eventFormData.city)        missing.push('City');
      if (missing.length) { setSubmitError(`Please fill in: ${missing.join(', ')}`); return; }

      const payload = {
        title:          eventFormData.title,
        description:    eventFormData.description,
        date:           eventFormData.date,
        start_time:     eventFormData.start_time,
        end_time:       eventFormData.end_time,
        city_id:        eventFormData.city,
        venue_id:       vendor_id,
        genre:          eventFormData.genre,
        event_type:     eventFormData.event_type,
        poster_url:     eventFormData.poster_url,
        landscape_urls: [eventFormData.landscape_url, ...eventFormData.gallery_urls].filter(Boolean),
        ticketing_link: eventFormData.ticketing_link,
        // pass the stored id so updateEventMutation can build the correct URL
        ...(isEditingEvent && eventFormData.id ? { id: eventFormData.id, _id: eventFormData.id } : {}),
      };

      if (isEditingEvent && eventFormData.id) {
        await updateEventMutation.mutateAsync(payload);
      } else {
        await createEventMutation.mutateAsync(payload);
      }
    } catch (e: any) {
      setSubmitError(e.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Open Edit ──────────────────────────────────────────────────────────────
  const openEdit = (event: any) => {
    // Build the pre-filled form FIRST before opening the modal
    const filled = {
      id:            eventId(event),
      title:         event.title        || '',
      city:          event.city         || '',
      venue_id:      getVendorId(event),
      vendor_id:     getVendorId(event),
      genre:         Array.isArray(event.genre)      ? event.genre      : (event.genre      ? [event.genre]      : []),
      event_type:    Array.isArray(event.event_type) ? event.event_type : (event.event_type ? [event.event_type] : []),
      date:          event.date         ? event.date.slice(0, 10) : '',
      start_time:    event.start_time   || '',
      end_time:      event.end_time     || '',
      description:   event.description  || '',
      poster_url:    event.poster_url   || '',
      landscape_url: event.landscape_url
        || (Array.isArray(event.landscape_urls) ? event.landscape_urls[0] : '')
        || '',
      gallery_urls:  Array.isArray(event.landscape_urls)
        ? [...event.landscape_urls.slice(1), '', '', '', ''].slice(0, 4)
        : ['', '', '', ''],
      ticketing_link: event.ticketing_link || '',
    };

    // Set form data BEFORE opening modal so it renders with data already in place
    setEventFormData(filled);
    setIsEditingEvent(true);
    setCreationStep(1);
    setSubmitError('');
    setIsPreviewing(false);
    setSelectedEvent(null);
    // Increment key to force the modal div to remount fresh (clears scroll position)
    setModalKey(k => k + 1);
    // Open modal last
    setIsCreatingEvent(true);
  };

  // ── Delete handler ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try { await deleteEventMutation.mutateAsync(eventId(deleteTarget)); }
    catch { /* error handled by mutation */ }
    finally { setIsDeleting(false); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
            Event <span className="text-primary neon-text">Management</span>
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
            <Calendar className="w-3 h-3" />
            Manage and organize all your upcoming and past events
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ Export CSV — works with real _id */}
          <button onClick={exportData} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          {/* ✅ Featured — only for non-EVENT_ADMIN */}
          {user?.role !== 'EVENT_ADMIN' && (
            <button onClick={() => setIsFeaturing(true)} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
              <Star className="w-3.5 h-3.5" /> Featured
            </button>
          )}
          {/* ✅ Create Event */}
          <button
            onClick={() => { setEventFormData(blankForm); setIsEditingEvent(false); setIsCreatingEvent(true); setCreationStep(1); setSubmitError(''); setModalKey(k => k + 1); }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Event
          </button>
        </div>
      </div>

      {/* Stats — all from real data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {[
          { label: 'Total Events',    value: eventList.length,                                                                                                           icon: Calendar,  color: 'text-blue-400',    bg: 'bg-blue-400/10'    },
          { label: 'Live & Upcoming', value: liveCount,                                                                                                                  icon: Zap,       color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Total Attendance',value: totalAttendance.toLocaleString(),                                                                                           icon: Users,     color: 'text-purple-400',  bg: 'bg-purple-400/10'  },
          { label: 'Tickets Sold',    value: totalTicketsSold.toLocaleString(),                                                                                          icon: Ticket,    color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
          { label: 'Cities',          value: [...new Set(eventList.map((e: any) => e.city).filter(Boolean))].length,                                                     icon: MapPin,    color: 'text-pink-400',    bg: 'bg-pink-400/10'    },
          { label: 'Genres',          value: [...new Set(eventList.flatMap((e: any) => Array.isArray(e.genre) ? e.genre : [e.genre]).filter(Boolean))].length,           icon: Activity,  color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
          { label: 'Venues',          value: [...new Set(eventList.map((e: any) => getVendorId(e)).filter(Boolean))].length,                                             icon: Building2, color: 'text-cyan-400',    bg: 'bg-cyan-400/10'    },
          { label: 'Cancelled',       value: cancelledCount,                                                                                                             icon: XCircle,   color: 'text-red-400',     bg: 'bg-red-400/10'     },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 rounded-[2rem] border border-white/10 flex flex-col gap-3 hover:border-white/20 transition-all group">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110', stat.bg)}>
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-xl font-black text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Event List */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Event List</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search events…" className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20" />
            </div>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button onClick={() => setViewMode('grid')}  className={cn('p-2 rounded-lg transition-all', viewMode === 'grid'  ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white')}><LayoutIcon className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('table')} className={cn('p-2 rounded-lg transition-all', viewMode === 'table' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white')}><Database className="w-4 h-4" /></button>
            </div>
            {viewMode === 'grid' && (
              <FilterDropdown
                value={sortField}
                onChange={handleSort}
                options={[
                  { label: 'Sort: Date', value: 'date' },
                  { label: 'Sort: Name', value: 'title' },
                  { label: 'Sort: City', value: 'city' },
                  { label: 'Sort: Status', value: 'status' },
                ]}
              />
            )}
            <FilterPanel>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</label>
                <FilterDropdown value={filterCity} onChange={setFilterCity} options={[{ label: 'All Cities', value: 'ALL' }, ...(cities?.map((c: any) => ({ label: c.city_name, value: c.city_name })) || [])]} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</label>
                <FilterDropdown value={filterStatus} onChange={setFilterStatus} options={[{ label: 'All Status', value: 'ALL' }, { label: 'Active', value: 'ACTIVE' }, { label: 'Past', value: 'PAST' }, { label: 'Cancelled', value: 'CANCELLED' }]} />
              </div>
            </FilterPanel>
          </div>
        </div>

        {/* Grid view */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">Loading events…</div>
            ) : filteredEvents.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">No events found.</div>
            ) : filteredEvents.map((event: any) => (
              <motion.div
                key={eventId(event)} whileHover={{ y: -5 }}
                className="glass-card rounded-2xl border border-white/10 overflow-hidden group cursor-pointer"
                onClick={() => { setSelectedEvent(event); setIsPreviewing(true); }}
              >
                <div className="aspect-video relative overflow-hidden">
                  {event.landscape_urls?.[0] || event.poster_url ? (
                    <img src={event.landscape_urls?.[0] || event.poster_url} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center"><Calendar className="w-12 h-12 text-white/15" /></div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold border backdrop-blur-md', statusColors[statusLabel(event)] || statusColors.ACTIVE)}>
                      {statusLabel(event)}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h4 className="text-lg font-bold text-white truncate group-hover:text-primary transition-colors">{event.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                      <Building2 className="w-3 h-3" />
                      {event.vendor_id?.name || getVendorName(getVendorId(event)) || event.city || '—'}
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-bold text-white">{new Date(event.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-bold text-white">{event.attendance || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex gap-2">
                      <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[100px]">
                        {Array.isArray(event.genre) ? event.genre[0] : (event.genre || '—')}
                      </span>
                      <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-muted-foreground uppercase">{event.city || '—'}</span>
                    </div>
                    {/* ✅ Grid action buttons — edit + delete, both wired */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(event)} className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-all" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteTarget(event)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Table view */
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('title')}>
                      <div className="flex items-center gap-1.5">Event Name <SortIcon field="title" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('city')}>
                      <div className="flex items-center gap-1.5">Venue / City <SortIcon field="city" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('date')}>
                      <div className="flex items-center gap-1.5">Date & Time <SortIcon field="date" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1.5">Status <SortIcon field="status" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading events…</td></tr>
                  ) : filteredEvents.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">No events found.</td></tr>
                  ) : filteredEvents.map((event: any) => (
                    <tr
                      key={eventId(event)}
                      className="group hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => { setSelectedEvent(event); setIsPreviewing(true); }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-white/5 flex items-center justify-center">
                            {event.poster_url
                              ? <img src={event.poster_url} alt="" className="w-full h-full object-cover" />
                              : <Calendar className="w-4 h-4 text-white/20" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{event.title}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {Array.isArray(event.genre) ? event.genre.join(', ') : (event.genre || '—')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{event.vendor_id?.name || getVendorName(getVendorId(event)) || '—'}</p>
                        <p className="text-[10px] text-muted-foreground">{event.city || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{new Date(event.date || Date.now()).toLocaleDateString()}</p>
                        <p className="text-[10px] text-muted-foreground">{event.start_time || '—'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold border', statusColors[statusLabel(event)] || statusColors.ACTIVE)}>
                          {statusLabel(event)}
                        </span>
                      </td>
                      {/* ✅ Table actions — dropdown with preview / edit / analytics / delete */}
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <RowActionsMenu
                          event={event}
                          onPreview={() => { setSelectedEvent(event); setIsPreviewing(true); }}
                          onEdit={() => openEdit(event)}
                          onDelete={() => setDeleteTarget(event)}
                          onAnalytics={() => setShowAnalytics(event)}
                          showAnalyticsBtn={user?.role === 'EVENT_ADMIN' || user?.role === 'SUPER_ADMIN'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* back button removed — close X is built into the preview card */}

      {/* ── Event Preview ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedEvent && isPreviewing && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { setSelectedEvent(null); setIsPreviewing(false); }}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110]"
            />

            {/* Main preview card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4 lg:pr-[440px] pointer-events-none"
            >
              <div className="w-full max-w-2xl pointer-events-auto flex flex-col gap-0 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.8)]">

                {/* ── Hero image ── */}
                <div className="relative" style={{ aspectRatio: '16/8' }}>
                  {selectedEvent.landscape_urls?.[0] || selectedEvent.poster_url ? (
                    <img
                      src={selectedEvent.landscape_urls?.[0] || selectedEvent.poster_url}
                      alt={selectedEvent.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #0d0d1a 50%, #1a0a10 100%)' }}
                    >
                      <div className="text-center space-y-3 opacity-30">
                        <Calendar className="w-16 h-16 mx-auto text-primary" />
                        <p className="text-xs font-black uppercase tracking-widest text-white">No Image</p>
                      </div>
                    </div>
                  )}
                  {/* Gradient overlay */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 40%, rgba(9,9,11,0.98) 100%)' }} />

                  {/* Top bar: status + close */}
                  <div className="absolute top-5 left-6 right-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn('px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md', statusColors[statusLabel(selectedEvent)] || statusColors.ACTIVE)}>
                        {statusLabel(selectedEvent)}
                      </span>
                      {selectedEvent.city && (
                        <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-md bg-black/30 text-white/70 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3" />{selectedEvent.city}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => { setSelectedEvent(null); setIsPreviewing(false); }}
                      className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:bg-black/70 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bottom overlay: title + description */}
                  <div className="absolute bottom-0 left-0 right-0 p-7">
                    {/* Genre pills */}
                    {Array.isArray(selectedEvent.genre) && selectedEvent.genre.length > 0 && (
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {selectedEvent.genre.slice(0, 3).map((g: string) => (
                          <span key={g} className="px-2.5 py-1 rounded-lg bg-primary/20 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-none">
                      {selectedEvent.title}
                    </h2>
                    {selectedEvent.description && (
                      <p className="text-sm text-white/50 mt-2 leading-relaxed line-clamp-2">
                        {selectedEvent.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* ── Info bar ── */}
                <div className="bg-[#0d0d12] border-t border-white/5 px-7 py-5 grid grid-cols-3 gap-4">
                  {[
                    {
                      icon: Calendar,
                      color: '#FF2D9A',
                      label: 'Date',
                      value: selectedEvent.date
                        ? new Date(selectedEvent.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                        : 'Date not set',
                    },
                    {
                      icon: Clock,
                      color: '#2D9AFF',
                      label: 'Time',
                      value: selectedEvent.start_time
                        ? `${selectedEvent.start_time}${selectedEvent.end_time ? ` – ${selectedEvent.end_time}` : ''}`
                        : 'Time not set',
                    },
                    {
                      icon: Building2,
                      color: '#2DFF9A',
                      label: 'Venue',
                      value: selectedEvent.venue_name || getVendorName(getVendorId(selectedEvent)) || selectedEvent.city || '—',
                    },
                  ].map(({ icon: Icon, color, label, value }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{label}</p>
                        <p className="text-xs font-bold text-white truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Attendance + actions ── */}
                <div className="bg-[#0a0a0f] px-7 py-5 flex items-center justify-between gap-4 border-t border-white/5">
                  {/* Attendance chip */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10">
                      <Users className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-[9px] text-white/30 font-black uppercase tracking-widest">RSVPs</p>
                        <p className="text-base font-black text-white leading-none">{selectedEvent.attendance ?? 0}</p>
                      </div>
                    </div>
                    {selectedEvent.ticketing_link && (
                      <a
                        href={selectedEvent.ticketing_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <Ticket className="w-4 h-4" /> Tickets
                      </a>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setShowAnalytics(selectedEvent); }}
                      className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <BarChart2 className="w-3.5 h-3.5" /> Stats
                    </button>
                    <button
                      onClick={() => { setIsPreviewing(false); openEdit(selectedEvent); }}
                      className="px-6 py-2.5 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Event
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right sidebar preview */}
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-[#08080c] z-[130] shadow-[0_0_100px_rgba(0,0,0,0.8)] border-l border-white/5 overflow-hidden"
            >
              <EventProfilePreview
                eventData={selectedEvent}
                onClose={() => { setSelectedEvent(null); setIsPreviewing(false); }}
                hideCloseButton
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ✅ Feature Modal */}
      <FeatureEventModal
        isOpen={isFeaturing}
        onClose={() => setIsFeaturing(false)}
        cities={cities || []}
        events={events || []}
        onConfirm={async (data) => { await featureEventMutation.mutateAsync(data); setIsFeaturing(false); }}
        initialEventId={selectedEvent ? eventId(selectedEvent) : undefined}
        initialCity={selectedEvent?.city || 'ALL'}
      />

      {/* ✅ Analytics Modal — real data from event, no hardcoded values */}
      <AnimatePresence>
        {showAnalytics && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card w-full max-w-2xl rounded-3xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight uppercase">{showAnalytics.title}</h3>
                  <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mt-1">Event Performance</p>
                </div>
                {/* ✅ Close analytics */}
                <button onClick={() => setShowAnalytics(null)} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 scrollbar-hide space-y-8">
                {/* Real stats from event document */}
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: 'Tickets Sold', value: showAnalytics.tickets_sold ?? '—' },
                    { label: 'Attendance',   value: showAnalytics.attendance   ?? 0   },
                    { label: 'Capacity %',   value: showAnalytics.capacity
                        ? `${Math.round((showAnalytics.attendance / showAnalytics.capacity) * 100)}%`
                        : '—' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">{s.label}</p>
                      <p className="text-xl font-bold text-white">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* Genre breakdown from real event.genre[] */}
                {Array.isArray(showAnalytics.genre) && showAnalytics.genre.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Genres</h4>
                    <div className="flex flex-wrap gap-2">
                      {showAnalytics.genre.map((g: string) => (
                        <span key={g} className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest">{g}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event type breakdown */}
                {Array.isArray(showAnalytics.event_type) && showAnalytics.event_type.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Event Types</h4>
                    <div className="flex flex-wrap gap-2">
                      {showAnalytics.event_type.map((t: string) => (
                        <span key={t} className="px-3 py-1.5 rounded-xl bg-white/5 text-white/60 border border-white/10 text-[10px] font-black uppercase tracking-widest">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Artists if present */}
                {Array.isArray(showAnalytics.artists) && showAnalytics.artists.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Artists / Lineup</h4>
                    <div className="space-y-3">
                      {showAnalytics.artists.map((a: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm">
                            {a.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{a.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{a.title} {a.subtitle ? `• ${a.subtitle}` : ''}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event details summary */}
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Event Details</h4>
                  {[
                    { label: 'Date',     value: showAnalytics.date        ? new Date(showAnalytics.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
                    { label: 'Time',     value: showAnalytics.start_time  ? `${showAnalytics.start_time}${showAnalytics.end_time ? ` – ${showAnalytics.end_time}` : ''}` : '—' },
                    { label: 'City',     value: showAnalytics.city        || '—' },
                    { label: 'Venue',    value: showAnalytics.venue_name  || getVendorName(getVendorId(showAnalytics)) || '—' },
                    { label: 'Ticketing',value: showAnalytics.ticketing_link || 'No link provided' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-[11px]">
                      <span className="text-white/30 uppercase font-black tracking-widest">{label}</span>
                      <span className="text-white/70 font-medium truncate max-w-[200px]">{value}</span>
                    </div>
                  ))}
                </div>

                {showAnalytics.attendance == null && showAnalytics.tickets_sold == null && (
                  <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-4">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                    <p className="text-[11px] text-amber-400/80 font-medium">Attendance and ticket data will appear here once the event has been updated with tracking information.</p>
                  </div>
                )}
              </div>
              <div className="p-8 bg-white/[0.02] border-t border-white/5 flex justify-between items-center">
                {/* ✅ Edit from analytics */}
                <button onClick={() => { setShowAnalytics(null); openEdit(showAnalytics); }} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2">
                  <Edit2 className="w-4 h-4" /> Edit Event
                </button>
                <button onClick={() => setShowAnalytics(null)} className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all text-white/90">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ✅ Delete Confirmation Dialog */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirmDialog
            event={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            isDeleting={isDeleting}
          />
        )}
      </AnimatePresence>

      {/* ── Create / Edit Modal ──────────────────────────────────────────────── */}
      {isCreatingEvent && (
        <div key={modalKey} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card w-full max-w-3xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight leading-none uppercase">{isEditingEvent ? 'Edit Event' : 'Create New Event'}</h3>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">Step {creationStep} of 3</p>
                </div>
              </div>
              {/* ✅ Close modal */}
              <button onClick={() => { setIsCreatingEvent(false); setIsEditingEvent(false); setSubmitError(''); }} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-muted-foreground hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8" id="modal-scroll-body">
              {/* Stepper */}
              <div className="flex items-center justify-between relative px-20">
                <div className="absolute left-20 right-20 top-6 h-1 bg-white/5 z-0 rounded-full" />
                <div className="absolute left-20 top-6 h-1 bg-gradient-to-r from-primary to-purple-600 z-0 transition-all duration-700 rounded-full shadow-[0_0_15px_rgba(255,45,154,0.3)]" style={{ width: `calc(${((creationStep - 1) / 2) * 100}%)` }} />
                {[1, 2, 3].map((step) => (
                  <div key={step} className="relative z-10 flex flex-col items-center gap-4">
                    <div className={cn('w-12 h-12 rounded-[20px] flex items-center justify-center text-sm font-black border-2 transition-all duration-500', creationStep >= step ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(255,45,154,0.4)] scale-110' : 'bg-[#0A0A0F] border-white/10 text-white/20')}>
                      {creationStep > step ? <Check className="w-6 h-6" /> : step}
                    </div>
                    <span className={cn('text-[10px] uppercase font-black tracking-widest absolute -bottom-8 w-32 text-center transition-all duration-300', creationStep >= step ? 'text-primary neon-text' : 'text-white/20')}>
                      {step === 1 ? 'Details' : step === 2 ? 'Images' : 'Tickets'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-16">
                {/* Step 1 */}
                {creationStep === 1 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                    <FormSection title="Event Details" icon={<User className="w-4 h-4" />}>
                      <div className="space-y-8">
                        <RefinedField label="Event Title" name="title" value={eventFormData.title} onChange={(e: any) => setEventFormData({ ...eventFormData, title: e.target.value })} placeholder="Enter event title" icon={<Zap className="w-4 h-4" />} />
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Event Description</label>
                          <textarea rows={4} value={eventFormData.description} onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })} placeholder="Describe the aesthetic and soundscape…" className="w-full bg-[#09090B] border border-white/5 rounded-[32px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 resize-none placeholder:text-white/10" />
                        </div>
                      </div>
                    </FormSection>
                    <FormSection title="Location & Genres" icon={<MapPin className="w-4 h-4" />}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">City</label>
                          <FilterDropdown value={eventFormData.city} onChange={(val) => setEventFormData({ ...eventFormData, city: val })} options={cities?.map((c: any) => ({ label: c.city_name, value: c._id })) || []} placeholder="Select city" buttonClassName="py-4 px-8 rounded-2xl text-sm bg-[#09090B] border-white/5 hover:border-white/10 text-white/60" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Venue</label>
                          <div className="relative">
                            <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 w-4 h-4 z-10" />
                            <FilterDropdown value={eventFormData.vendor_id || eventFormData.venue_id} onChange={(vendorId) => setEventFormData({ ...eventFormData, vendor_id: vendorId, venue_id: vendorId })} options={vendorList.map((v: any) => ({ label: v.name, value: v._id || v.id }))} placeholder="Select venue" buttonClassName="py-4 pl-14 pr-8 rounded-2xl text-sm bg-[#09090B] border-white/5 hover:border-white/10 text-white/60" />
                          </div>
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Genres</label>
                          <MultiSelectDropdown options={genres?.map((g: any) => ({ label: g.name, value: g.name })) || []} value={eventFormData.genre} onChange={(val) => setEventFormData({ ...eventFormData, genre: val })} placeholder="Select genres" />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Categories</label>
                          <MultiSelectDropdown options={eventTypes?.map((t: any) => ({ label: t.name, value: t.name })) || []} value={eventFormData.event_type} onChange={(val) => setEventFormData({ ...eventFormData, event_type: val })} placeholder="Select categories" />
                        </div>
                      </div>
                    </FormSection>
                    <FormSection title="Schedule" icon={<Clock className="w-4 h-4" />}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <RefinedField label="Event Date"  name="date"       type="date" value={eventFormData.date}       onChange={(e: any) => setEventFormData({ ...eventFormData, date:       e.target.value })} icon={<Calendar className="w-4 h-4" />} />
                        <RefinedField label="Start Time"  name="start_time" type="time" value={eventFormData.start_time} onChange={(e: any) => setEventFormData({ ...eventFormData, start_time: e.target.value })} icon={<Clock className="w-4 h-4" />} />
                        <RefinedField label="End Time"    name="end_time"   type="time" value={eventFormData.end_time}   onChange={(e: any) => setEventFormData({ ...eventFormData, end_time:   e.target.value })} icon={<Clock className="w-4 h-4" />} />
                      </div>
                    </FormSection>
                  </motion.div>
                )}

                {/* Step 2 */}
                {creationStep === 2 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                    <FormSection title="Event Media" icon={<Image className="w-4 h-4" />}>
                      <div className="space-y-10">
                        <ImageUploadZone label="Main Banner (Landscape)" hint="Recommended: 1920×820 JPG/PNG" value={eventFormData.landscape_url} onChange={(url) => setEventFormData({ ...eventFormData, landscape_url: url })} aspect="aspect-[21/9]" token={token} />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                          <ImageUploadZone label="Main Poster (Portrait)" hint="Recommended: 1080×1350" value={eventFormData.poster_url} onChange={(url) => setEventFormData({ ...eventFormData, poster_url: url })} aspect="aspect-[4/5]" token={token} />
                          <GalleryUploadZone urls={eventFormData.gallery_urls} onChange={(urls) => setEventFormData({ ...eventFormData, gallery_urls: urls })} token={token} />
                        </div>
                      </div>
                    </FormSection>
                  </motion.div>
                )}

                {/* Step 3 */}
                {creationStep === 3 && (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                    <FormSection title="Tickets & Access" icon={<Shield className="w-4 h-4" />}>
                      <div className="space-y-8">
                        <RefinedField label="Ticket Link" name="ticketing_link" value={eventFormData.ticketing_link} onChange={(e: any) => setEventFormData({ ...eventFormData, ticketing_link: e.target.value })} placeholder="https://insider.in/events/your-event" icon={<LinkIcon className="w-4 h-4" />} />
                        <div className="p-10 rounded-[40px] bg-primary/[0.03] border border-primary/20 space-y-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-black text-white tracking-tight uppercase">Smart Ticketing</h4>
                              <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Native Checkout</p>
                            </div>
                            <div className="px-5 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-[9px] font-black uppercase tracking-widest">Coming Soon</div>
                          </div>
                          <p className="text-white/40 text-xs font-medium leading-relaxed max-w-lg">Enable native checkout to allow users to purchase tickets directly in-app.</p>
                        </div>
                      </div>
                    </FormSection>
                    <FormSection title="Final Verification" icon={<CheckCircle2 className="w-4 h-4" />}>
                      <div className="flex items-start gap-4 p-8 rounded-[32px] bg-white/[0.02] border border-white/5">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                          <Info className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Review your listing details carefully.</p>
                          <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mt-1">Once published, some details may require moderator approval to change.</p>
                          <div className="mt-4 space-y-1 text-[11px] text-white/50">
                            <p><span className="text-white/30">Title:</span> {eventFormData.title || '—'}</p>
                            <p><span className="text-white/30">Venue:</span> {getVendorName(eventFormData.vendor_id) || '—'}</p>
                            <p><span className="text-white/30">City:</span>  {eventFormData.city  || '—'}</p>
                            <p><span className="text-white/30">Date:</span>  {eventFormData.date  || '—'}</p>
                            <p><span className="text-white/30">Genres:</span> {eventFormData.genre?.join(', ') || '—'}</p>
                            <p><span className="text-white/30">Poster:</span>  {eventFormData.poster_url   ? '✓ Uploaded' : '✗ Missing'}</p>
                            <p><span className="text-white/30">Banner:</span>  {eventFormData.landscape_url ? '✓ Uploaded' : '✗ Missing'}</p>
                          </div>
                        </div>
                      </div>
                    </FormSection>
                    {submitError && (
                      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center gap-3">
                        <AlertTriangle className="w-4 h-4 shrink-0" /> {submitError}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-10 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
              <button
                onClick={() => creationStep > 1 ? setCreationStep(creationStep - 1) : (setIsCreatingEvent(false), setIsEditingEvent(false))}
                className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3"
              >
                <ChevronLeft className="w-4 h-4" />
                {creationStep === 1 ? 'Cancel' : 'Previous'}
              </button>
              <button
                disabled={isSubmitting}
                onClick={() => creationStep < 3 ? setCreationStep(creationStep + 1) : handleSubmit()}
                className="px-12 py-5 rounded-[24px] bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,45,154,0.3)] hover:bg-primary/90 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                ) : creationStep === 3 ? (
                  <>{isEditingEvent ? 'Save Changes' : 'Publish Event'}<ChevronRight className="w-4 h-4" /></>
                ) : (
                  <>Next Step <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
CLAUDE_EOF
echo "  wrote src/pages/Events.tsx"

mkdir -p "src/pages"
cat > "src/pages/Clubs.tsx" << 'CLAUDE_EOF'
import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Mail,
  Bell,
  MessageSquare,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  BarChart2,
  Trophy,
  Zap,
  MessageCircle,
  FileText,
  User,
  ChevronRight,
  Shield,
  Activity,
  ArrowRight,
  Database,
  Lock,
  Eye,
  Settings,
  UserPlus,
  Layout as LayoutIcon,
  MousePointer2,
  Loader2,
  Check,
  Info,
  Image,
  Star,
  MapPin,
  Building2,
  Phone,
  Globe,
  Fingerprint,
  Instagram,
  Download,
  Heart,
  Share2,
  ChevronLeft,
  ArrowLeft,
  X,
  Share,
  Wallet,
  Edit2,
  Trash2,
  BarChart3,
  Ticket,
  UserCheck,
  Upload,
  Layers,
  Sparkles,
  Camera,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { FilterDropdown } from '../components/FilterDropdown';
import { FilterPanel } from '../components/FilterPanel';
import { FormSection, RefinedField } from '../components/RefinedForm';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { motion, AnimatePresence } from 'motion/react';
import ClubProfilePreview from '../components/ClubProfilePreview';
import EventProfilePreview from '../components/EventProfilePreview';

import { API_BASE } from '../lib/apiConfig';
const statusColors: any = {
  'ACTIVE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'PENDING': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'INACTIVE': 'bg-red-500/10 text-red-400 border-red-500/20',
  'SUSPENDED': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

// ─── Upload helper ────────────────────────────────────────────────────────────
// TODO: BROKEN - there is no `/upload` route on the real backend (that endpoint
// only existed in an old, unused Mongoose codebase). The real backend's
// vendorRoute.js / eventRoute.js expect multipart form-data directly on the
// create/update calls (e.g. `upload.single("business_image")`,
// `upload.fields([{ name: "venue_image" }, ...])`), not a separate upload step
// that returns a URL. This function will always fail until the submit handlers
// below are rewritten to build FormData with the exact field names the backend
// controllers expect (see vendorController.js / eventController.js).
async function uploadFile(file: File, token: string): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url as string;
}

export default function Clubs() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { setIsClubProfileOpen } = useOutletContext<{ setIsClubProfileOpen: (open: boolean) => void }>();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCity, setFilterCity] = useState('ALL');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  const [isViewingVenue, setIsViewingVenue] = useState(false);

  const [venueStep, setVenueStep] = useState(1);
  const [venueFormData, setVenueFormData] = useState<any>({
    name: '', type: '', email: '', capacity: '', contactName: '',
    phone: '', description: '', city: '', address: '',
    landscape_urls: [''], portrait_url: '',
  });
  const [workingHours, setWorkingHours] = useState<any[]>([
    { day: 'Monday',    time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Tuesday',   time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Wednesday', time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Thursday',  time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Friday',    time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Saturday',  time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Sunday',    time: '10:00 PM - 04:00 AM', active: false },
  ]);
  const [lastUsedTime, setLastUsedTime] = useState('10:00 PM - 04:00 AM');

  const [venueLandscapePreviews, setVenueLandscapePreviews] = useState<string[]>(['']);
  const [venueLandscapeFiles, setVenueLandscapeFiles]       = useState<(File | null)[]>([null]);
  const [venuePortraitPreview, setVenuePortraitPreview]     = useState('');
  const [venuePortraitFile, setVenuePortraitFile]           = useState<File | null>(null);
  const venuePortraitRef = useRef<HTMLInputElement>(null);

  const [activeEventsTab, setActiveEventsTab] = useState<'Upcoming' | 'Past' | 'Active'>('Upcoming');
  const [selectedEvent, setSelectedEvent]     = useState<any>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isEditingEvent, setIsEditingEvent]   = useState(false);
  const [isPreviewing, setIsPreviewing]       = useState(false);
  const [creationStep, setCreationStep]       = useState(1);
  const [isSubmitting, setIsSubmitting]       = useState(false);

  const [eventFormData, setEventFormData] = useState<any>({
    title: '', city: '', venue_id: '', genre: [], event_type: [],
    date: '', start_time: '', end_time: '', description: '',
    poster_url: '', landscape_urls: [''], ticketing_link: '',
  });

  const [posterFile, setPosterFile]           = useState<File | null>(null);
  const [posterPreview, setPosterPreview]     = useState('');
  const [bannerFile, setBannerFile]           = useState<File | null>(null);
  const [bannerPreview, setBannerPreview]     = useState('');
  const posterInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleVenueLandscapeChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newFiles    = [...venueLandscapeFiles];
    const newPreviews = [...venueLandscapePreviews];
    newFiles[index]    = file;
    newPreviews[index] = URL.createObjectURL(file);
    setVenueLandscapeFiles(newFiles);
    setVenueLandscapePreviews(newPreviews);
  };

  const handleVenuePortraitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVenuePortraitFile(file);
    setVenuePortraitPreview(URL.createObjectURL(file));
  };

  const addVenueLandscapeSlot = () => {
    setVenueLandscapeFiles(f    => [...f, null]);
    setVenueLandscapePreviews(p => [...p, '']);
    setVenueFormData((d: any)  => ({ ...d, landscape_urls: [...d.landscape_urls, ''] }));
  };

  const removeVenueLandscapeSlot = (index: number) => {
    setVenueLandscapeFiles(f    => f.filter((_, i) => i !== index));
    setVenueLandscapePreviews(p => p.filter((_, i) => i !== index));
    setVenueFormData((d: any)  => ({
      ...d,
      landscape_urls: d.landscape_urls.filter((_: any, i: number) => i !== index),
    }));
  };

  const resetEventForm = () => {
    setEventFormData({
      title: '', city: '', venue_id: '', genre: [], event_type: [],
      date: '', start_time: '', end_time: '', description: '',
      poster_url: '', landscape_urls: [''], ticketing_link: '',
    });
    setPosterFile(null); setPosterPreview('');
    setBannerFile(null); setBannerPreview('');
    setCreationStep(1);
    setIsEditingEvent(false);
  };

  const resetVenueForm = () => {
    setVenueFormData({
      name: '', type: '', email: '', capacity: '', contactName: '',
      phone: '', description: '', city: '', address: '',
      landscape_urls: [''], portrait_url: '',
    });
    setVenueLandscapeFiles([null]); setVenueLandscapePreviews(['']);
    setVenuePortraitFile(null); setVenuePortraitPreview('');
    setVenueStep(1);
  };

  const handleEditEvent = (event: any) => {
    setEventFormData({
      title:          event.title || '',
      city:           event.city  || clubData?.city || '',
      venue_id:       event.venue_id || clubData?.id || '',
      genre:          Array.isArray(event.genre) ? event.genre : (event.category ? [event.category] : []),
      event_type:     Array.isArray(event.event_type) ? event.event_type : [],
      date:           event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      start_time:     event.start_time || '22:00',
      end_time:       event.end_time   || '04:00',
      description:    event.description || '',
      poster_url:     event.poster_url  || event.imageUrl || '',
      landscape_urls: event.landscape_urls || [event.imageUrl || ''],
      ticketing_link: event.ticketing_link || '',
    });
    setPosterPreview(event.poster_url || event.imageUrl || '');
    setBannerPreview((event.landscape_urls?.[0]) || event.imageUrl || '');
    setPosterFile(null); setBannerFile(null);
    setIsEditingEvent(true);
    setIsCreatingEvent(true);
    setCreationStep(1);
    setSelectedEvent(null);
  };

  // TODO: BROKEN - see uploadFile() note above and eventRoute.js. The real
  // backend expects POST /events/create_event (multipart, fields: venue_image,
  // artist_images, gallery_images, event_layout_images) and
  // PUT /events/update_event/:id, not POST/PUT /events or /events/:id with a
  // JSON body of pre-uploaded URLs. This handler needs a rewrite to build
  // FormData directly from posterFile/bannerFile before it will work.
  const handleSubmitEvent = async () => {
    try {
      setIsSubmitting(true);
      let poster_url     = eventFormData.poster_url;
      let landscape_urls = [...eventFormData.landscape_urls];

      if (posterFile) {
        poster_url = await uploadFile(posterFile, token!);
      }
      if (bannerFile) {
        landscape_urls[0] = await uploadFile(bannerFile, token!);
      }

      const payload = {
        ...eventFormData,
        poster_url,
        landscape_urls,
        venue_id: eventFormData.venue_id || clubData?.id,
        city:     eventFormData.city     || clubData?.city,
      };

      // TODO: real paths are `${API_BASE}/events/create_event` (POST) and
      // `${API_BASE}/events/update_event/${selectedEvent?.id}` (PUT), and they
      // expect multipart form-data, not JSON.
      const url    = isEditingEvent ? `${API_BASE}/events/${selectedEvent?.id}` : `${API_BASE}/events`;
      const method = isEditingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save event');

      queryClient.invalidateQueries({ queryKey: ['events-admin'] });
      setIsCreatingEvent(false);
      resetEventForm();
    } catch (err) {
      console.error(err);
      alert('Failed to save event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // TODO: BROKEN - see uploadFile() note above and vendorRoute.js. The real
  // backend expects POST /vendor/add_vendor (multipart, field: business_image)
  // and PUT /vendor/update_vendor/:id, not POST/PUT /mongo/vendors with a JSON
  // body of pre-uploaded URLs. This handler needs a rewrite to build FormData
  // directly from venuePortraitFile/venueLandscapeFiles before it will work.
  const handleSubmitVenue = async () => {
    try {
      setIsSubmitting(true);

      const landscape_urls = await Promise.all(
        venueLandscapeFiles.map(async (file, i) => {
          if (file) return uploadFile(file, token!);
          return venueFormData.landscape_urls[i] || '';
        })
      );

      let portrait_url = venueFormData.portrait_url;
      if (venuePortraitFile) {
        portrait_url = await uploadFile(venuePortraitFile, token!);
      }

      const payload = {
        ...venueFormData,
        landscape_urls,
        portrait_url,
        working_hours: workingHours.filter(h => h.active),
      };

      // TODO: real paths are `${API_BASE}/vendor/add_vendor` (POST) and
      // `${API_BASE}/vendor/update_vendor/${selectedClub._id}` (PUT), and they
      // expect multipart form-data, not JSON.
      const url    = selectedClub ? `${API_BASE}/mongo/vendors/${selectedClub._id}` : `${API_BASE}/mongo/vendors`;
      const method = selectedClub ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save venue');

      queryClient.invalidateQueries({ queryKey: ['clubs'] });
      setIsCreatingClub(false);
      resetVenueForm();
    } catch (err) {
      console.error(err);
      alert('Failed to save venue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── queries (FIXED: correct paths + response unwrapping) ─────────────────────
  const { data: clubs, isLoading } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const clubData = Array.isArray(clubs) ? clubs.find((c: any) => c.name === user?.organisation) : null;

  const { data: events } = useQuery({
    queryKey: ['events-admin'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/events/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load events');
      const data = await res.json();
      return Array.isArray(data.data) ? data.data : [];
    },
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/city/get_all_cities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/genre/get_all_genres`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  // TODO: no eventTypeRoute.js exists on the backend yet - disabled until a
  // real endpoint is added. Dropdown will show no options until then.
  const { data: eventTypes } = useQuery({
    queryKey: ['eventTypes'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/eventTypes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: false,
  });

  // TODO: no venueTypeRoute.js exists on the backend yet - disabled until a
  // real endpoint is added. Dropdown will show no options until then.
  const { data: venueTypes } = useQuery({
    queryKey: ['venueTypes'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/venueTypes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
    enabled: false,
  });

  const clubEvents = Array.isArray(events)
    ? events.filter((e: any) => e.club_id === clubData?.id || e.club_id === clubData?._id || e.venue === clubData?.name)
    : [];

  const filteredClubEvents = clubEvents.filter((e: any) => {
    const now       = new Date();
    const eventDate = new Date(e.date);
    if (activeEventsTab === 'Upcoming') return eventDate >= now;
    if (activeEventsTab === 'Past')     return eventDate < now;
    if (activeEventsTab === 'Active')   return e.status === 'ACTIVE';
    return true;
  });

  const filteredClubs = (Array.isArray(clubs) ? clubs : []).filter((c: any) => {
    const matchesSearch  = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus  = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesCity    = filterCity   === 'ALL' || c.city === filterCity;
    return matchesSearch && matchesStatus && matchesCity;
  }).sort((a: any, b: any) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field
      ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)
      : <ArrowUpDown className="w-3 h-3 opacity-50" />;

  const toggleDay = (index: number) => {
    const newHours  = [...workingHours];
    const isActive  = !newHours[index].active;
    newHours[index].active = isActive;
    if (isActive) newHours[index].time = lastUsedTime;
    setWorkingHours(newHours);
  };

  const updateDayTime = (index: number, time: string) => {
    const newHours         = [...workingHours];
    newHours[index].time   = time;
    setLastUsedTime(time);
    setWorkingHours(newHours);
  };

  const exportData = () => console.log('Exporting data...', filteredClubs);

  if (user?.role === 'CLUB_ADMIN') {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
              Venue <span className="text-primary neon-text">Management</span>
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
              <Calendar className="w-3 h-3" />
              Manage and monitor your venues
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/club-profile')}
              className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <Eye className="w-4 h-4" /> View Profile
            </button>
            <button
              onClick={() => {
                resetEventForm();
                setEventFormData((d: any) => ({ ...d, venue_id: clubData?.id || clubData?._id || '', city: clubData?.city || '' }));
                setIsCreatingEvent(true);
              }}
              className="px-6 py-3 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create Event
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Upcoming Events', value: clubEvents.filter((e: any) => new Date(e.date) >= new Date()).length, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: 'Follower Growth', value: '+15.2%', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Profile Views',   value: '1.2k',  icon: Eye,   color: 'text-purple-400', bg: 'bg-purple-400/10' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center mb-4', stat.bg)}>
                <stat.icon className={cn('w-6 h-6', stat.color)} />
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-white mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="glass-card rounded-[32px] border border-white/5 overflow-hidden">
          <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white tracking-widest uppercase">Event Management</h3>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Manage all your events</p>
            </div>
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
              {(['Upcoming', 'Active', 'Past'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveEventsTab(tab)}
                  className={cn(
                    'px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest',
                    activeEventsTab === tab ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white',
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2">
            <div className="grid gap-2">
              {filteredClubEvents.length > 0 ? filteredClubEvents.map((event: any) => (
                <div
                  key={event._id || event.id}
                  onClick={() => { setSelectedEvent(event); setIsPreviewing(true); }}
                  className="p-4 rounded-2xl hover:bg-white/[0.03] transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-white/5 flex items-center justify-center">
                      {event.poster_url || event.imageUrl ? (
                        <img src={event.poster_url || event.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Image className="w-5 h-5 text-white/20" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white group-hover:text-primary transition-colors">{event.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                          <Calendar className="w-3 h-3 text-primary" />
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                          <Users className="w-3 h-3 text-secondary" />
                          {event.attendees || 0} RSVPs
                        </span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase border border-primary/20">{event.category}</span>
                        <span className={cn('px-2 py-0.5 rounded text-[8px] font-black uppercase border', statusColors[event.status] || 'bg-white/5 border-white/10 text-white/50')}>{event.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {activeEventsTab === 'Past' ? (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent({ ...event, showAnalytics: true }); }}
                          className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-bold uppercase border border-primary/20 hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                        >
                          <BarChart3 className="w-3 h-3" /> Analytics
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); setIsPreviewing(true); }}
                          className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all border border-white/5"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditEvent(event); }}
                          className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm('Delete this event?')) return;
                            await fetch(`${API_BASE}/events/delete_event/${event._id || event.id}`, {
                              method: 'DELETE',
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            queryClient.invalidateQueries({ queryKey: ['events-admin'] });
                          }}
                          className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                    <Calendar className="w-8 h-8 text-muted-foreground opacity-20" />
                  </div>
                  <p className="text-muted-foreground font-black uppercase text-[10px] tracking-widest leading-none">
                    No {activeEventsTab.toLowerCase()} events found
                  </p>
                  <button
                    onClick={() => {
                      resetEventForm();
                      setEventFormData((d: any) => ({ ...d, venue_id: clubData?.id || clubData?._id || '', city: clubData?.city || '' }));
                      setIsCreatingEvent(true);
                    }}
                    className="text-primary font-black text-xs hover:underline uppercase tracking-widest leading-none"
                  >
                    Create an event now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isCreatingEvent && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card w-full max-w-3xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(255,45,154,0.1)]">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">
                        {isEditingEvent ? 'Edit' : 'Create'} <span className="text-primary neon-text">Event</span>
                      </h3>
                      <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Step {creationStep} of 3</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setIsCreatingEvent(false); resetEventForm(); }}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-10 lg:p-12 scrollbar-hide">
                  <div className="flex items-center justify-between mb-16 relative px-4">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full z-0" />
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-700 shadow-[0_0_15px_rgba(255,45,154,0.5)]"
                      style={{ width: `${((creationStep - 1) / 2) * 100}%` }}
                    />
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="relative z-10 flex flex-col items-center gap-4">
                        <div className={cn(
                          'w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black border-2 transition-all duration-500',
                          creationStep >= step
                            ? 'bg-primary border-primary text-white shadow-[0_0_30px_rgba(255,45,154,0.3)] scale-110'
                            : 'bg-[#09090B] border-white/5 text-white/20',
                        )}>
                          {creationStep > step ? <Check className="w-6 h-6 stroke-[3px]" /> : step}
                        </div>
                        <span className={cn(
                          'text-[10px] uppercase font-black tracking-[0.2em] absolute -bottom-10 w-32 text-center transition-colors duration-500',
                          creationStep >= step ? 'text-primary' : 'text-white/20',
                        )}>
                          {step === 1 ? 'Details' : step === 2 ? 'Visuals' : 'Tickets'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <AnimatePresence mode="wait">
                      {creationStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                          <FormSection title="Event Details" icon={<Sparkles className="w-4 h-4" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="col-span-1 md:col-span-2">
                                <RefinedField
                                  label="Event Name" name="title" value={eventFormData.title}
                                  onChange={(e: any) => setEventFormData({ ...eventFormData, title: e.target.value })}
                                  placeholder="e.g. Midnight Eclipse" icon={<Zap className="w-4 h-4" />}
                                />
                              </div>
                              <div className="space-y-4 group/field">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Music Genre</label>
                                <MultiSelectDropdown
                                  options={genres?.map((g: any) => ({ label: g.name, value: g.name })) || []}
                                  value={eventFormData.genre}
                                  onChange={(v) => setEventFormData({ ...eventFormData, genre: v })}
                                  placeholder="Select genres"
                                />
                              </div>
                              <div className="space-y-4 group/field">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Event Type</label>
                                <MultiSelectDropdown
                                  options={eventTypes?.map((t: any) => ({ label: t.name, value: t.name })) || []}
                                  value={eventFormData.event_type}
                                  onChange={(v) => setEventFormData({ ...eventFormData, event_type: v })}
                                  placeholder="Select event types"
                                />
                              </div>
                              <RefinedField
                                label="Event Date" name="date" type="date" value={eventFormData.date}
                                onChange={(e: any) => setEventFormData({ ...eventFormData, date: e.target.value })}
                                icon={<Calendar className="w-4 h-4" />}
                              />
                              <RefinedField
                                label="Start Time" name="start_time" type="time" value={eventFormData.start_time}
                                onChange={(e: any) => setEventFormData({ ...eventFormData, start_time: e.target.value })}
                                icon={<Clock className="w-4 h-4" />}
                              />
                            </div>
                          </FormSection>
                          <FormSection title="Description" icon={<FileText className="w-4 h-4" />}>
                            <div className="space-y-4 group/field">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">About the Event</label>
                              <textarea
                                rows={5} value={eventFormData.description}
                                onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                                className="w-full bg-[#09090B] border border-white/5 rounded-[32px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 resize-none font-medium placeholder:text-white/10"
                                placeholder="Describe the atmosphere..."
                              />
                            </div>
                          </FormSection>
                        </motion.div>
                      )}

                      {creationStep === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                          <FormSection title="Event Images" icon={<Camera className="w-4 h-4" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                              <div className="space-y-4">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Event Poster (4:5)</label>
                                <label className="aspect-[4/5] rounded-[32px] bg-[#09090B] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/[0.04] hover:border-primary/40 cursor-pointer group shadow-inner overflow-hidden relative block">
                                  <input
                                    ref={posterInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePosterChange}
                                  />
                                  {posterPreview ? (
                                    <>
                                      <img src={posterPreview} alt="Poster" className="absolute inset-0 w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Change Photo</span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover:text-primary group-hover:scale-110 group-hover:rotate-6 transition-all">
                                        <Upload className="w-7 h-7" />
                                      </div>
                                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] group-hover:text-primary transition-colors">Upload Poster</span>
                                    </>
                                  )}
                                </label>
                              </div>

                              <div className="space-y-4">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Header Image (16:9)</label>
                                <label className="aspect-video rounded-[32px] bg-[#09090B] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/[0.04] hover:border-blue-400/40 cursor-pointer group shadow-inner overflow-hidden relative block">
                                  <input
                                    ref={bannerInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleBannerChange}
                                  />
                                  {bannerPreview ? (
                                    <>
                                      <img src={bannerPreview} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Change Photo</span>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover:text-blue-400 group-hover:scale-110 group-hover:-rotate-6 transition-all">
                                        <Upload className="w-7 h-7" />
                                      </div>
                                      <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] group-hover:text-blue-400 transition-colors">Upload Banner</span>
                                    </>
                                  )}
                                </label>
                              </div>
                            </div>
                          </FormSection>
                        </motion.div>
                      )}

                      {creationStep === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                          <FormSection title="Tickets" icon={<Shield className="w-4 h-4" />}>
                            <div className="p-8 rounded-[40px] bg-primary/5 border border-primary/10 space-y-8 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent pointer-events-none" />
                              <div className="flex items-center justify-between relative z-10">
                                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Ticket Link</h4>
                                <button
                                  type="button"
                                  onClick={() => setEventFormData({ ...eventFormData, ticketing_link: '' })}
                                  className="text-[9px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors"
                                >
                                  Skip for now
                                </button>
                              </div>
                              <div className="space-y-6 relative z-10">
                                <RefinedField
                                  label="Ticket URL" name="ticketing_link" value={eventFormData.ticketing_link}
                                  onChange={(e: any) => setEventFormData({ ...eventFormData, ticketing_link: e.target.value })}
                                  placeholder="https://ticket-link.com/..."
                                  icon={<Globe className="w-4 h-4" />}
                                />
                              </div>
                            </div>
                          </FormSection>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="p-10 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <button
                    onClick={() => setCreationStep((p) => Math.max(1, p - 1))}
                    disabled={creationStep === 1}
                    className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-4 disabled:opacity-30 active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button
                    disabled={isSubmitting}
                    onClick={() => {
                      if (creationStep < 3) {
                        setCreationStep((p) => p + 1);
                      } else {
                        handleSubmitEvent();
                      }
                    }}
                    className="px-14 py-5 rounded-[24px] bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4 group disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : creationStep === 3 ? (
                      isEditingEvent ? 'Save Changes' : 'Create Event'
                    ) : (
                      <>Next <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedEvent && !isCreatingEvent && isPreviewing && !selectedEvent.showAnalytics && (
            <motion.button
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              onClick={() => { setSelectedEvent(null); setIsPreviewing(false); }}
              className="fixed top-8 left-8 z-[200] w-14 h-14 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 hover:border-primary/50 transition-all group active:scale-95 shadow-2xl"
            >
              <ChevronLeft className="w-7 h-7 group-hover:-translate-x-1 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedEvent && !isCreatingEvent && isPreviewing && !selectedEvent.showAnalytics && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => { setSelectedEvent(null); setIsPreviewing(false); }}
                className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110]"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="fixed inset-0 z-[120] flex items-center justify-center p-4 lg:pr-[420px] pointer-events-none"
              >
                <motion.div className="w-full max-w-4xl bg-[#0F0F12] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl flex flex-col pointer-events-auto">
                  <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Event Details</h3>
                  </div>
                  <div className="p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div className="space-y-8 text-left">
                        <div className="aspect-[16/10] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                          <img src={selectedEvent.imageUrl || `https://picsum.photos/seed/${selectedEvent.id}/800/600`} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="space-y-4">
                          <h2 className="text-4xl font-black text-white tracking-tight leading-none">{selectedEvent.title}</h2>
                          <div className="flex gap-3">
                            <span className="px-4 py-1.5 rounded-full bg-[#FF2D9A]/10 text-[#FF2D9A] text-[10px] font-black uppercase border border-[#FF2D9A]/20 tracking-widest whitespace-nowrap">{selectedEvent.category || 'Techno'}</span>
                            <span className="px-4 py-1.5 rounded-full bg-white/5 text-white/50 text-[10px] font-black uppercase border border-white/10 tracking-widest whitespace-nowrap">{selectedEvent.city || clubData?.city || 'Mumbai'}</span>
                          </div>
                          <p className="text-sm text-white/40 leading-relaxed font-medium">{selectedEvent.description || 'Get ready for a night of bass heavy beats and neon lights.'}</p>
                        </div>
                        <div className="flex gap-4 pt-4">
                          {activeEventsTab === 'Past' ? (
                            <button onClick={() => setSelectedEvent({ ...selectedEvent, showAnalytics: true })} className="flex-1 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/[0.08] transition-all text-xs flex items-center justify-center gap-2">
                              <BarChart3 className="w-4 h-4" /> View Analytics
                            </button>
                          ) : (
                            <button onClick={() => handleEditEvent(selectedEvent)} className="flex-1 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/[0.08] transition-all text-xs">
                              Edit Event
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        {[
                          { label: 'Date', icon: Calendar, color: '#FF2D9A', value: new Date(selectedEvent.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                          { label: 'Time', icon: Clock, color: '#2D9AFF', value: `${selectedEvent.start_time || 'TBA'}${selectedEvent.end_time ? ` – ${selectedEvent.end_time}` : ''}` },
                          { label: 'Venue', icon: MapPin, color: '#2DFF9A', value: selectedEvent.venue || clubData?.name || 'TBA' },
                        ].map(({ label, icon: Icon, color, value }) => (
                          <div key={label} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${color}1A` }}>
                              <Icon className="w-7 h-7" style={{ color }} />
                            </div>
                            <div>
                              <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">{label}</p>
                              <p className="text-lg font-bold text-white leading-none truncate max-w-[200px]">{value}</p>
                            </div>
                          </div>
                        ))}
                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#2D0A1A] to-[#1A0A2D] border border-white/5 mt-6 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF2D9A]/10 blur-[80px] -mr-16 -mt-16" />
                          <div className="flex items-center justify-between relative z-10">
                            <div className="space-y-4">
                              <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Attendance</p>
                              <span className="text-4xl font-black text-white leading-none">{selectedEvent.attendees || 0}</span>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                              <Users className="w-8 h-8" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[130] shadow-[0_0_100px_rgba(0,0,0,0.8)] border-l border-white/5 overflow-hidden"
              >
                <EventProfilePreview eventData={selectedEvent} onClose={() => { setSelectedEvent(null); setIsPreviewing(false); }} hideCloseButton />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
            Clubs & <span className="text-primary neon-text">Venues</span>
          </h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
            <Building2 className="w-3 h-3" /> Manage all club partners across cities
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportData} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            <Download className="w-3.5 h-3.5" /> Export Data
          </button>
          <button
            onClick={() => { setSelectedClub(null); resetVenueForm(); setIsCreatingClub(true); }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add New Club
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {[
          { label: 'Total Clubs',    value: Array.isArray(clubs) ? clubs.length : 0, icon: Building2, color: 'text-blue-400',    bg: 'bg-blue-400/10' },
          { label: 'Active Clubs',   value: (Array.isArray(clubs) ? clubs : []).filter((c: any) => c.status === 'ACTIVE').length, icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Avg Rating',     value: '4.8/5',  icon: Star,     color: 'text-amber-400',  bg: 'bg-amber-400/10' },
          { label: 'New Users',      value: '+1.2k',  icon: Users,    color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'Total Followers',value: '24.5k',  icon: Database, color: 'text-cyan-400',   bg: 'bg-cyan-400/10' },
          { label: 'Club Staff',     value: '480',    icon: Shield,   color: 'text-zinc-400',   bg: 'bg-zinc-400/10' },
          { label: 'Total Revenue',  value: '$128k',  icon: Wallet,   color: 'text-pink-400',   bg: 'bg-pink-400/10' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 rounded-[2rem] border border-white/10 flex flex-col gap-3 hover:border-white/20 transition-all group">
            <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110', stat.bg)}>
              <stat.icon className={cn('w-5 h-5', stat.color)} />
            </div>
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-xl font-black text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Club List</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search clubs..."
                className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button onClick={() => setViewMode('grid')} className={cn('p-2 rounded-lg transition-all', viewMode === 'grid' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white')}>
                <LayoutIcon className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('table')} className={cn('p-2 rounded-lg transition-all', viewMode === 'table' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white')}>
                <Database className="w-4 h-4" />
              </button>
            </div>
            {viewMode === 'grid' && (
              <FilterDropdown
                value={sortField}
                onChange={handleSort}
                options={[
                  { label: 'Sort: Name', value: 'name' },
                  { label: 'Sort: City', value: 'city' },
                  { label: 'Sort: Status', value: 'status' },
                ]}
              />
            )}
            <FilterPanel>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</label>
                <FilterDropdown value={filterCity} onChange={setFilterCity} options={[
                  { label: 'All Cities', value: 'ALL' },
                  // Was a hardcoded 4-city list (Mumbai/Delhi/Bangalore/Goa)
                  // instead of the real cities already fetched above — venues
                  // in any other active city couldn't be filtered at all.
                  ...((Array.isArray(cities) ? cities : []).map((c: any) => ({ label: c.city_name, value: c.city_name }))),
                ]} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</label>
                <FilterDropdown value={filterStatus} onChange={setFilterStatus} options={[
                  { label: 'All Status', value: 'ALL' },
                  { label: 'Active',     value: 'ACTIVE' },
                  { label: 'Inactive',   value: 'INACTIVE' },
                  { label: 'Pending',    value: 'PENDING' },
                  { label: 'Banned',     value: 'BANNED' },
                ]} />
              </div>
            </FilterPanel>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">Loading clubs...</div>
            ) : filteredClubs.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">No clubs found.</div>
            ) : filteredClubs.map((club: any) => (
              <motion.div
                key={club._id || club.id} whileHover={{ y: -5 }}
                className="glass-card rounded-2xl border border-white/10 overflow-hidden group cursor-pointer"
                onClick={() => { setSelectedClub(club); setIsViewingVenue(true); }}
              >
                <div className="aspect-video relative overflow-hidden">
                  {club.landscape_urls?.[0] ? (
                    <img src={club.landscape_urls[0]} alt={club.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <Building2 className="w-12 h-12 text-white/15" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-4 right-4">
                    <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold border backdrop-blur-md', statusColors[club.status] || statusColors.ACTIVE)}>
                      {club.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h4 className="text-lg font-bold text-white truncate group-hover:text-primary transition-colors">{club.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" /> {club.address || (typeof club.city === 'object' ? club.city?.city_name : club.city) || 'Location not set'}
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span className="text-xs font-bold">—</span>
                      <span className="text-[10px] text-muted-foreground font-medium">No ratings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs font-bold text-white">—</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-muted-foreground uppercase">{club.type || club.venue_type || 'Type not set'}</span>
                    <button className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('name')}>
                      <div className="flex items-center gap-1.5">Club / Category <SortIcon field="name" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('city')}>
                      <div className="flex items-center gap-1.5">Location <SortIcon field="city" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Stats</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('status')}>
                      <div className="flex items-center gap-1.5">Status <SortIcon field="status" /></div>
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading clubs...</td></tr>
                  ) : filteredClubs.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">No clubs found.</td></tr>
                  ) : filteredClubs.map((club: any) => (
                    <tr key={club._id || club.id} className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { setSelectedClub(club); setIsViewingVenue(true); }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center">
                            {club.portrait_url
                              ? <img src={club.portrait_url} alt="" className="w-full h-full object-cover" />
                              : <Building2 className="w-4 h-4 text-white/20" />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{club.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{club.type || club.venue_type || 'Type not set'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{(typeof club.city === 'object' ? club.city?.city_name : club.city) || '—'}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{club.address || 'Address not set'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Rating</p>
                            <p className="text-xs font-bold text-white">—</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Followers</p>
                            <p className="text-xs font-bold text-white">—</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn('text-[10px] px-2 py-1 rounded-full font-bold border', statusColors[club.status] || statusColors.ACTIVE)}>
                          {club.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isViewingVenue && selectedClub && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsViewingVenue(false)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]" />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 h-full w-full max-w-[420px] bg-black z-[111] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border-l border-white/5"
            >
              <ClubProfilePreview onClose={() => setIsViewingVenue(false)} club={selectedClub} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCreatingClub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card w-full max-w-3xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(255,45,154,0.1)]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">
                      {selectedClub ? 'Edit' : 'Add New'} <span className="text-primary neon-text">Club</span>
                    </h3>
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Step {venueStep}/3</p>
                  </div>
                </div>
                <button onClick={() => { setIsCreatingClub(false); resetVenueForm(); }} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 lg:p-12 scrollbar-hide">
                <div className="flex items-center justify-between mb-16 relative px-4">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full z-0" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-700 shadow-[0_0_15px_rgba(255,45,154,0.5)]" style={{ width: `${((venueStep - 1) / 2) * 100}%` }} />
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="relative z-10 flex flex-col items-center gap-4">
                      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black border-2 transition-all duration-500', venueStep >= step ? 'bg-primary border-primary text-white shadow-[0_0_30px_rgba(255,45,154,0.3)] scale-110' : 'bg-[#09090B] border-white/5 text-white/20')}>
                        {venueStep > step ? <Check className="w-6 h-6 stroke-[3px]" /> : step}
                      </div>
                      <span className={cn('text-[10px] uppercase font-black tracking-[0.2em] absolute -bottom-10 w-32 text-center transition-colors duration-500', venueStep >= step ? 'text-primary' : 'text-white/20')}>
                        {step === 1 ? 'Details' : step === 2 ? 'Visuals' : 'Logistics'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <AnimatePresence mode="wait">
                    {venueStep === 1 && (
                      <motion.div key="venueStep1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                        <FormSection title="Basic Information" icon={<Fingerprint className="w-4 h-4" />}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="col-span-1 md:col-span-2">
                              <RefinedField label="Club Name" name="name" value={venueFormData.name} onChange={(e: any) => setVenueFormData({ ...venueFormData, name: e.target.value })} placeholder="e.g. The Quantum Vault" icon={<Building2 className="w-4 h-4" />} />
                            </div>
                            <div className="space-y-4 group/field">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Category</label>
                              <select value={venueFormData.type} onChange={(e) => setVenueFormData({ ...venueFormData, type: e.target.value })} className="w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 appearance-none font-medium">
                                <option value="">Select Category...</option>
                                {venueTypes?.map((type: any) => <option key={type._id || type.id} value={type.name}>{type.name}</option>)}
                              </select>
                            </div>
                            <RefinedField label="Contact Email" name="email" type="email" value={venueFormData.email} onChange={(e: any) => setVenueFormData({ ...venueFormData, email: e.target.value })} placeholder="ops@venue.com" icon={<Mail className="w-4 h-4" />} />
                            <RefinedField label="Capacity" name="capacity" type="number" value={venueFormData.capacity} onChange={(e: any) => setVenueFormData({ ...venueFormData, capacity: e.target.value })} placeholder="3500" icon={<Users className="w-4 h-4" />} />
                            <RefinedField label="Contact Number" name="phone" value={venueFormData.phone} onChange={(e: any) => setVenueFormData({ ...venueFormData, phone: e.target.value })} placeholder="+91 00000 00000" icon={<Phone className="w-4 h-4" />} />
                          </div>
                        </FormSection>
                        <FormSection title="Club Description" icon={<FileText className="w-4 h-4" />}>
                          <div className="space-y-4 group/field">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">About Club</label>
                            <textarea rows={4} value={venueFormData.description} onChange={(e) => setVenueFormData({ ...venueFormData, description: e.target.value })} placeholder="Describe the aesthetic and soundscape..." className="w-full bg-[#09090B] border border-white/5 rounded-[32px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 resize-none font-medium placeholder:text-white/10" />
                          </div>
                        </FormSection>
                      </motion.div>
                    )}

                    {venueStep === 2 && (
                      <motion.div key="venueStep2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                        <FormSection title="Location Details" icon={<MapPin className="w-4 h-4" />}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4 group/field">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">City</label>
                              <select value={venueFormData.city} onChange={(e) => setVenueFormData({ ...venueFormData, city: e.target.value })} className="w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 appearance-none font-medium">
                                <option value="">Select City...</option>
                                {(Array.isArray(cities) ? cities : []).map((city: any) => <option key={city._id || city.id} value={city.city_name}>{city.city_name}</option>)}
                              </select>
                            </div>
                            <div className="col-span-1 md:col-span-2">
                              <RefinedField label="Full Address" name="address" value={venueFormData.address} onChange={(e: any) => setVenueFormData({ ...venueFormData, address: e.target.value })} placeholder="The Underground, District 7..." icon={<MapPin className="w-4 h-4" />} />
                            </div>
                          </div>
                        </FormSection>

                        <FormSection title="Club Media" icon={<Layers className="w-4 h-4" />}>
                          <div className="grid grid-cols-1 gap-12">
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Cover Images</label>
                                <button type="button" onClick={addVenueLandscapeSlot} className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white transition-all">
                                  <Plus className="w-4 h-4" /> Add Image
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {venueLandscapePreviews.map((preview, index) => (
                                  <label key={index} className="group relative aspect-video rounded-[32px] bg-[#09090B] border border-white/5 overflow-hidden shadow-2xl transition-all hover:border-primary/40 cursor-pointer block">
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleVenueLandscapeChange(e, index)} />
                                    {preview ? (
                                      <>
                                        <img src={preview} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                          <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Change</span>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/10 group-hover:text-primary transition-colors">
                                        <Upload className="w-10 h-10" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Slot {index + 1}</span>
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeVenueLandscapeSlot(index); }}
                                      className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                    </button>
                                  </label>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-6">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Profile Photo</label>
                              <label className="aspect-[9/16] max-w-[240px] mx-auto rounded-[32px] bg-[#09090B] border border-white/5 overflow-hidden shadow-2xl group relative cursor-pointer hover:border-blue-400/40 transition-all block">
                                <input ref={venuePortraitRef} type="file" accept="image/*" className="hidden" onChange={handleVenuePortraitChange} />
                                {venuePortraitPreview ? (
                                  <>
                                    <img src={venuePortraitPreview} alt="" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                      <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Change</span>
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/10 group-hover:text-blue-400 transition-colors">
                                    <Upload className="w-10 h-10 group-hover:scale-110 transition-all" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Select Photo</span>
                                  </div>
                                )}
                              </label>
                            </div>
                          </div>
                        </FormSection>
                      </motion.div>
                    )}

                    {venueStep === 3 && (
                      <motion.div key="venueStep3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-10">
                        <FormSection title="Opening Hours" icon={<Clock className="w-4 h-4" />}>
                          <div className="space-y-6">
                            {workingHours.map((item, index) => (
                              <div key={item.day} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 group p-4 rounded-[28px] hover:bg-white/[0.02] transition-all">
                                <button type="button" onClick={() => toggleDay(index)} className={cn('min-w-[140px] px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all border', item.active ? 'bg-primary text-white border-primary shadow-[0_0_20px_rgba(255,45,154,0.3)] scale-105 active:scale-95' : 'bg-[#09090B] border-white/5 text-white/20 hover:text-white/60')}>
                                  {item.day}
                                </button>
                                <AnimatePresence>
                                  {item.active && (
                                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 w-full">
                                      <RefinedField label="Open Hours" name={`hours-${index}`} value={item.time} onChange={(e: any) => updateDayTime(index, e.target.value)} placeholder="22:00 - 04:00" icon={<Clock className="w-4 h-4" />} />
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))}
                          </div>
                          <div className="mt-8 p-10 rounded-[40px] bg-blue-500/5 border border-blue-500/10 flex items-start gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
                              <Info className="w-6 h-6" />
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-xs font-black text-white uppercase tracking-widest">Note</h4>
                              <p className="text-[13px] text-white/40 leading-relaxed font-medium">Activating a day will automatically use the same hours as the previously selected day.</p>
                            </div>
                          </div>
                        </FormSection>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="p-10 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-4">
                  {venueStep > 1 && (
                    <button onClick={() => setVenueStep((v) => v - 1)} className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-4 active:scale-95">
                      <ChevronLeft className="w-4 h-4" /> Back
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => { setIsCreatingClub(false); resetVenueForm(); }} className="px-8 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all">
                    Cancel
                  </button>
                  {venueStep < 3 ? (
                    <button onClick={() => setVenueStep((v) => v + 1)} className="px-14 py-5 rounded-[24px] bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group">
                      Next Step <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <button
                      disabled={isSubmitting}
                      onClick={handleSubmitVenue}
                      className="px-16 py-5 rounded-[24px] bg-gradient-to-br from-primary to-purple-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-3"
                    >
                      {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : selectedClub ? 'Save Changes' : 'Add Club'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
CLAUDE_EOF
echo "  wrote src/pages/Clubs.tsx"

mkdir -p "src/pages"
cat > "src/pages/SupportActivity.tsx" << 'CLAUDE_EOF'
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquarePlus,
  Flag,
  RefreshCw,
  Reply,
  Trash2,
  Download,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { API_BASE } from '../lib/apiConfig';
const priorityColors: any = {
  'HIGH': 'bg-red-500/10 text-red-400 border-red-500/20',
  'MEDIUM': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'LOW': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const statusColors: any = {
  'OPEN': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'PENDING': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'RESOLVED': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'CLOSED': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

export default function SupportActivity() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const queryClient = useQueryClient();

  // Maps this page's UI-level status labels (used for the Close/Resolve
  // buttons and the color-coded badges) to each backend model's own status
  // enum, since ReportProblem and UserReport don't share one.
  const uiToBackendStatus = (type: 'requests' | 'complaints', uiStatus: string) => {
    if (type === 'requests') {
      // ReportProblem: Pending | Inprogress | Resolve | Closed
      if (uiStatus === 'RESOLVED') return 'Resolve';
      if (uiStatus === 'CLOSED') return 'Closed';
      return 'Pending';
    }
    // UserReport: Pending | Reviewed | Resolved | Rejected
    if (uiStatus === 'RESOLVED') return 'Resolved';
    if (uiStatus === 'CLOSED') return 'Rejected';
    return 'Pending';
  };

  const backendToUiStatus = (type: 'requests' | 'complaints', backendStatus: string) => {
    if (type === 'requests') {
      const map: Record<string, string> = { Pending: 'PENDING', Inprogress: 'OPEN', Resolve: 'RESOLVED', Closed: 'CLOSED' };
      return map[backendStatus] || 'PENDING';
    }
    const map: Record<string, string> = { Pending: 'PENDING', Reviewed: 'OPEN', Resolved: 'RESOLVED', Rejected: 'CLOSED' };
    return map[backendStatus] || 'PENDING';
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, type, status }: { id: string, type: 'requests' | 'complaints', status: string }) => {
      const backendStatus = uiToBackendStatus(type, status);

      // NOTE: was PATCHing `${API_BASE}/${type}/${id}` — a route that never
      // existed on the backend for either type. Each type has its own real
      // endpoint and payload shape.
      const res = type === 'requests'
        ? await fetch(`${API_BASE}/support-requests/update_status/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: backendStatus, admin_reply: responseMessage }),
          })
        : await fetch(`${API_BASE}/users/update_report_status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ report_id: id, status: backendStatus, admin_note: responseMessage }),
          });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message?.[0] || json?.message || 'Failed to update status');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      setSelectedItem(null);
      setResponseMessage('');
    }
  });

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      // NOTE: was hitting the bare `${API_BASE}/requests` — no matching
      // backend route existed, so this tab always showed nothing even
      // though users had real "Report a Problem" tickets sitting in the
      // database. Real endpoint is `/support-requests/get_all`, and the raw
      // ReportProblem documents are normalized here into the shape this
      // page's UI expects (it has no native "subject"/"priority" fields).
      const res = await fetch(`${API_BASE}/support-requests/get_all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      const list = json.data?.requests ?? [];
      return list.map((r: any) => ({
        id: r._id,
        username: r.user_id?.name || r.user_id?.email || 'Unknown user',
        subject: r.description ? (r.description.length > 60 ? `${r.description.slice(0, 60)}…` : r.description) : 'Reported problem',
        message: r.description || '',
        priority: 'MEDIUM',
        status: backendToUiStatus('requests', r.status),
        created_at: r.createdAt,
        admin_reply: r.admin_reply || '',
      }));
    }
  });

  const { data: complaints, isLoading: complaintsLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: async () => {
      // NOTE: was hitting the bare `${API_BASE}/complaints` — same issue.
      // "Complaints" are user-reports-user records, which already have a
      // real admin endpoint (built for the Users page fix) at
      // `/users/get_all_user_reports`.
      const res = await fetch(`${API_BASE}/users/get_all_user_reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      const list = json.data?.reports ?? [];
      return list.map((r: any) => ({
        id: r._id,
        username: r.reported_by?.name || r.reported_by?.email || 'Unknown user',
        subject: `Reported user: ${r.reported_user?.name || r.reported_user?.email || 'Unknown'}${r.reason ? ` — ${r.reason}` : ''}`,
        message: r.description || r.reason || '',
        priority: 'MEDIUM',
        status: backendToUiStatus('complaints', r.status),
        created_at: r.createdAt,
        admin_reply: r.admin_note || '',
      }));
    }
  });

  const currentData = activeTab === 'requests' ? requests : complaints;
  const isLoading = activeTab === 'requests' ? requestsLoading : complaintsLoading;

  const filteredData = (Array.isArray(currentData) ? currentData : [])?.filter((item: any) => {
    return item.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.message?.toLowerCase().includes(searchTerm.toLowerCase());
  }).sort((a: any, b: any) => {
    let aValue = a[sortField];
    let bValue = b[sortField];

    if (sortField === 'created_at') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    } else {
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field
      ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />)
      : <ArrowUpDown className="w-3 h-3 opacity-50" />;

  const exportData = () => {
    const headers = ['User', 'Subject', 'Priority', 'Status', 'Date'];
    const rows = filteredData.map((item: any) => [
      `"${item.username || ''}"`, `"${item.subject || ''}"`, `"${item.priority || 'MEDIUM'}"`,
      `"${item.status || 'OPEN'}"`, `"${item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}"`,
    ]);
    const csv  = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Support & Requests</h2>
        <div className="flex items-center gap-3">
          <button onClick={exportData} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setActiveTab('requests')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider",
                activeTab === 'requests' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
              )}
            >
              Requests
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider",
                activeTab === 'complaints' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
              )}
            >
              Complaints
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {(activeTab === 'requests' || activeTab === 'complaints') && (
          <motion.div
            key="support"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Open Requests', value: requests?.length || '0', icon: MessageSquarePlus, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                { label: 'Pending Complaints', value: complaints?.length || '0', icon: Flag, color: 'text-red-400', bg: 'bg-red-400/10' },
                { label: 'Avg. Response Time', value: '2.4h', icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                { label: 'Resolution Rate', value: '94%', icon: CheckCircle2, color: 'text-purple-400', bg: 'bg-purple-400/10' },
              ].map((stat) => (
                <div key={stat.label} className="glass-card p-6 rounded-2xl border border-white/10 flex items-center gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {activeTab === 'requests' ? 'User Requests' : 'User Complaints'}
                </h3>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search..."
                      className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>
                  <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/5">
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('username')}>
                        <div className="flex items-center gap-1.5">User <SortIcon field="username" /></div>
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subject</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('priority')}>
                        <div className="flex items-center gap-1.5">Priority <SortIcon field="priority" /></div>
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('status')}>
                        <div className="flex items-center gap-1.5">Status <SortIcon field="status" /></div>
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest cursor-pointer select-none hover:text-white transition-colors" onClick={() => handleSort('created_at')}>
                        <div className="flex items-center gap-1.5">Date <SortIcon field="created_at" /></div>
                      </th>
                      <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading data...</td>
                      </tr>
                    ) : filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-xs text-muted-foreground">No data found.</td>
                      </tr>
                    ) : filteredData.map((item: any) => (
                      <tr key={item.id} className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedItem(item)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary font-bold text-xs">
                              {item.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{item.username}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-white font-medium truncate max-w-[200px]">{item.subject}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("text-[10px] px-2 py-1 rounded-lg font-bold border", priorityColors[item.priority] || priorityColors.MEDIUM)}>
                            {item.priority || 'MEDIUM'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn("text-[10px] px-2 py-1 rounded-lg font-bold border", statusColors[item.status] || statusColors.OPEN)}>
                            {item.status || 'OPEN'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      {selectedItem && (activeTab === 'requests' || activeTab === 'complaints') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {activeTab === 'requests' ? 'Request Details' : 'Complaint Details'}
              </h3>
              <button onClick={() => setSelectedItem(null)} className="p-2 rounded-lg hover:bg-white/5 transition-all">
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-primary font-bold text-lg">
                    {selectedItem.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">{selectedItem.username}</h4>
                    <p className="text-xs text-muted-foreground">User ID: {selectedItem.user_id}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={cn("text-[10px] px-2 py-1 rounded-lg font-bold border", priorityColors[selectedItem.priority] || priorityColors.MEDIUM)}>
                    {selectedItem.priority || 'MEDIUM'} Priority
                  </span>
                  <span className={cn("text-[10px] px-2 py-1 rounded-lg font-bold border", statusColors[selectedItem.status] || statusColors.OPEN)}>
                    {selectedItem.status || 'OPEN'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Subject</p>
                  <p className="text-sm text-white font-bold">{selectedItem.subject}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Message</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedItem.message}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Internal Response</h5>
                <textarea
                  rows={4}
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Type your response to the user..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => updateStatusMutation.mutate({ id: selectedItem.id, type: activeTab as any, status: 'CLOSED' })}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  Close
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate({ id: selectedItem.id, type: activeTab as any, status: 'RESOLVED' })}
                  disabled={updateStatusMutation.isPending || !responseMessage}
                  className="flex-[2] py-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updateStatusMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Reply className="w-4 h-4" />}
                  {updateStatusMutation.isPending ? 'Processing...' : 'Send Response & Resolve'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
CLAUDE_EOF
echo "  wrote src/pages/SupportActivity.tsx"

mkdir -p "src/pages"
cat > "src/pages/ActivityLogs.tsx" << 'CLAUDE_EOF'
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Download,
  Clock,
  Activity,
  Plus,
  Edit3,
  Trash2,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

import { API_BASE } from '../lib/apiConfig';
const actionColors: any = {
  'CREATE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'UPDATE': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'DELETE': 'bg-red-500/10 text-red-400 border-red-500/20',
  'LOGIN': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'LOGOUT': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
};

const actionIcons: any = {
  'CREATE': Plus,
  'UPDATE': Edit3,
  'DELETE': Trash2,
  'LOGIN': ShieldCheck,
  'LOGOUT': ShieldAlert,
};

export default function ActivityLogs() {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: logs, isLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      // NOTE: was hitting `${API_BASE}/activity-logs` with no sub-path — the
      // backend had no model, controller, or route for activity logs at all
      // until now. Real endpoint is `/activity-logs/get_all`.
      const res = await fetch(`${API_BASE}/activity-logs/get_all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      return json.data?.logs ?? [];
    }
  });

  const filteredData = (Array.isArray(logs) ? logs : [])?.filter((item: any) => {
    return item.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           item.resource?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const exportData = () => {
    const headers = ['Admin', 'Action', 'Resource', 'Date'];
    const rows = filteredData.map((item: any) => [
      `"${item.admin_name || ''}"`, `"${item.action || ''}"`, `"${item.resource || ''}"`,
      `"${item.created_at ? new Date(item.created_at).toLocaleString() : ''}"`,
    ]);
    const csv  = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-black text-white tracking-tight uppercase underline decoration-primary/30 underline-offset-8">Activity Logs</h2>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">System History</h3>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
              <button onClick={exportData} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export Logs
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Admin Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Action</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Resource</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Details</th>
                  <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading logs...</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">No logs found.</td>
                  </tr>
                ) : filteredData.map((log: any) => {
                  const ActionIcon = actionIcons[log.action] || Activity;
                  return (
                    <tr key={log._id || log.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-primary font-bold text-xs">
                            {log.admin_name?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{log.admin_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border", actionColors[log.action] || actionColors.UPDATE)}>
                            <ActionIcon className="w-3 h-3" />
                          </div>
                          <span className={cn("text-[10px] font-bold uppercase tracking-wider", actionColors[log.action]?.split(' ')[1] || 'text-white')}>
                            {log.action}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-white uppercase tracking-wider bg-white/5 px-2 py-1 rounded-md border border-white/10">
                          {log.resource}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-muted-foreground max-w-xs truncate">{log.details}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
CLAUDE_EOF
echo "  wrote src/pages/ActivityLogs.tsx"

mkdir -p "src/pages"
cat > "src/pages/OrganiserRequests.tsx" << 'CLAUDE_EOF'
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  UserPlus,
  Check,
  X,
  Loader2,
  Building2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { API_BASE } from '../lib/apiConfig';

// This page answers "where do we review Club and Event Organiser Admin
// requests and activities" — previously there was no such view anywhere:
// vendor signups (from ClubOnboarding.tsx) were auto-approved on the
// backend (`is_verified: default: true`) with no review step at all.
//
// Now new signups land here with `is_verified: false` and can't log in to
// the vendor portal until a Super Admin approves them. Rejecting a request
// soft-deletes the vendor record (consistent with how deletion works
// elsewhere in this app) and records a reason.

export default function OrganiserRequests() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'owner' | 'event_organizer'>('ALL');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: pending, isLoading } = useQuery({
    queryKey: ['organiser-requests'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors?is_verified=false`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
  });

  // Scoped to whichever organiser is currently expanded — shows what that
  // account has actually done (currently: signup, approve/reject events —
  // full activity coverage across every vendor action is still being
  // rolled out, see CHANGES.md).
  const { data: activity } = useQuery({
    queryKey: ['organiser-activity', expandedId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/activity-logs/get_all?search=${expandedId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      return json.data?.logs ?? [];
    },
    enabled: Boolean(expandedId),
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/vendor/approve_vendor/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to approve');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organiser-requests'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await fetch(`${API_BASE}/vendor/reject_vendor/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error('Failed to reject');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organiser-requests'] });
      setRejectingId(null);
      setRejectReason('');
    },
  });

  const filtered = (Array.isArray(pending) ? pending : []).filter((v: any) =>
    typeFilter === 'ALL' || v.vendor_type === typeFilter
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight uppercase">Organiser <span className="text-primary neon-text">Requests</span></h2>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">
            New club & event organiser signups, pending your approval
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
          {(['ALL', 'owner', 'event_organizer'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all',
                typeFilter === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-white'
              )}
            >
              {t === 'ALL' ? 'All' : t === 'owner' ? 'Clubs' : 'Event Organisers'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="glass-card rounded-2xl p-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center space-y-3">
          <UserPlus className="w-10 h-10 text-white/10 mx-auto" />
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">No pending requests</p>
          <p className="text-xs text-white/30">New club or event organiser signups will show up here for approval.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((v: any) => {
            const isExpanded = expandedId === v._id;
            return (
              <div key={v._id} className="glass-card rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {v.vendor_type === 'owner' ? <Building2 className="w-5 h-5 text-purple-400" /> : <Calendar className="w-5 h-5 text-blue-400" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-white">{v.name}</p>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold uppercase tracking-widest">Pending</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-white/40 font-medium">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {v.email}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {v.phone_number}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {v.city?.city_name || 'Not set'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : v._id)}
                      className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
                    >
                      <History className="w-3.5 h-3.5" /> Activity
                    </button>
                    <button
                      onClick={() => setRejectingId(rejectingId === v._id ? null : v._id)}
                      className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      onClick={() => approveMutation.mutate(v._id)}
                      disabled={approveMutation.isPending}
                      className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {approveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {rejectingId === v._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 overflow-hidden"
                    >
                      <div className="p-6 space-y-3 bg-red-500/[0.03]">
                        <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" /> Rejecting removes this signup — they'll need to re-register to try again.
                        </div>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason (optional, helps them understand why)"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 placeholder:text-white/20"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-all">
                            Cancel
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate({ id: v._id, reason: rejectReason })}
                            disabled={rejectMutation.isPending}
                            className="px-4 py-2 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                          >
                            {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 overflow-hidden"
                    >
                      <div className="p-6 space-y-2">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Activity</p>
                        {!activity || activity.length === 0 ? (
                          <p className="text-xs text-white/30">No logged activity yet for this account.</p>
                        ) : (
                          activity.map((log: any) => (
                            <div key={log._id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                              <span className="text-xs text-white/70">{log.details || log.action}</span>
                              <span className="text-[10px] text-white/30">{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
CLAUDE_EOF
echo "  wrote src/pages/OrganiserRequests.tsx"

mkdir -p "src/components"
cat > "src/components/FeatureEventModal.tsx" << 'CLAUDE_EOF'
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, ChevronUp, ChevronDown, Star, Loader2, Calendar, MapPin, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { FilterDropdown } from './FilterDropdown';

interface Event {
  id: string;
  title: string;
  city: string;
  date?: string;
  poster_url?: string;
  status?: string;
}

interface City {
  id?: string;
  _id?: string;
  name?: string;
  city_name?: string;
}

interface FeatureEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  cities: City[];
  events: Event[];
  onConfirm: (data: { city: string; eventId: string; duration: number }) => Promise<void>;
  initialEventId?: string;
  initialCity?: string;
}

export function FeatureEventModal({ 
  isOpen, 
  onClose, 
  cities, 
  events, 
  onConfirm,
  initialEventId = '',
  initialCity = 'ALL'
}: FeatureEventModalProps) {
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [duration, setDuration] = useState(7);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedCity(initialCity);
      setSelectedEventId(initialEventId);
      setDuration(7);
      setSearchTerm('');
      
      // If initialEventId is provided, find the event to set search term or just keep it
      if (initialEventId) {
        const event = events.find(e => e.id === initialEventId);
        if (event) setSearchTerm(event.title);
      }
    }
  }, [isOpen, initialCity, initialEventId, events]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

const filteredEvents = useMemo(() => {
  if (!Array.isArray(events)) return [];
  return events.filter(event => {
    if (!event) return false;
    const matchesCity = selectedCity === 'ALL' || (event.city ?? '') === selectedCity;
    const matchesSearch = (event.title ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCity && matchesSearch;
  });
}, [events, selectedCity, searchTerm]);

const selectedEvent = useMemo(() => {
  if (!Array.isArray(events)) return undefined;
  return events.find(e => (e._id || e.id) === selectedEventId);
}, [events, selectedEventId]);

  const handleConfirm = async () => {
    if (!selectedEventId || duration < 1) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm({
        city: selectedCity,
        eventId: selectedEventId,
        duration
      });
      onClose();
    } catch (error) {
      console.error('Failed to feature event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const incrementDuration = () => setDuration(prev => Math.min(30, prev + 1));
  const decrementDuration = () => setDuration(prev => Math.max(1, prev - 1));

  const cityOptions = useMemo(() => [
    { label: 'All Cities', value: 'ALL' },
    ...(cities?.map((c: any) => ({ label: c.city_name ?? c.name, value: c.city_name ?? c.name })) || [])
  ], [cities]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="glass-card w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Feature Event</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all text-muted-foreground hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* City Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select City</label>
            <FilterDropdown
              value={selectedCity}
              onChange={(val) => {
                setSelectedCity(val);
                setSelectedEventId('');
                setSearchTerm('');
              }}
              options={cityOptions}
              buttonClassName="py-3 px-4 rounded-xl text-sm"
            />
          </div>

          {/* Event Selection */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Event</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchFocused(true);
                  if (selectedEventId) setSelectedEventId('');
                }}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search event..."
                className={cn(
                  "w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:bg-white/[0.07]",
                  selectedEventId && "border-primary/50 bg-primary/5"
                )}
              />
              {selectedEventId && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>

            {/* Event Dropdown Results */}
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full mt-2 bg-[#1A1A24] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto scrollbar-hide"
                >
                  {filteredEvents.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <Search className="w-8 h-8 text-muted-foreground/20 mx-auto" />
                      <p className="text-xs text-muted-foreground">No events found in {selectedCity === 'ALL' ? 'any city' : selectedCity}</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {!searchTerm && (
                        <div className="px-4 py-2 mb-1 border-b border-white/5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Events</p>
                        </div>
                      )}
                      {filteredEvents.map((event) => (
                        <button
                          key={event.id}
onClick={() => {
  setSelectedEventId(event._id || event.id);  // ← was just event.id
  setSearchTerm(event.title);
  setIsSearchFocused(false);
}}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left",
                            selectedEventId === event.id && "bg-primary/5"
                          )}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                            <img 
                              src={event.poster_url || `https://picsum.photos/seed/${event.id}/100/100`} 
                              alt="" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-bold truncate",
                              selectedEventId === event.id ? "text-primary" : "text-white"
                            )}>
                              {event.title}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold">
                              <MapPin className="w-3 h-3" />
                              {event.city}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Duration Stepper */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Duration (Days)</label>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Max 30 Days</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="number"
                  value={duration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setDuration(Math.min(30, Math.max(1, val)));
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:bg-white/[0.07]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <button 
                  onClick={incrementDuration}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-primary transition-all"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button 
                  onClick={decrementDuration}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-primary transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Select how long the event should stay featured</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/5 flex items-center gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!selectedEventId || isSubmitting}
            className={cn(
              "flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,45,154,0.3)]",
              (!selectedEventId || isSubmitting) ? "opacity-50 cursor-not-allowed shadow-none" : "hover:scale-[1.02] hover:shadow-primary/40 active:scale-[0.98]"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Star className="w-4 h-4" />
            )}
            Feature Event
          </button>
        </div>
      </motion.div>
    </div>
  );
}
CLAUDE_EOF
echo "  wrote src/components/FeatureEventModal.tsx"

mkdir -p "src/components"
cat > "src/components/ClubProfilePreview.tsx" << 'CLAUDE_EOF'
import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import EventProfilePreview from './EventProfilePreview';
import { 
  Heart, 
  MapPin, 
  Calendar as CalendarIcon, 
  Clock, 
  X,
  ChevronLeft as ChevronLeftIcon,
  Users,
  Activity,
  CalendarDays,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';

interface ClubProfilePreviewProps {
  club: any;
  onClose?: () => void;
}

export default function ClubProfilePreview({ club, onClose }: ClubProfilePreviewProps) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const data = React.useMemo(() => {
    const base = club || {};
    // `city` (and `state`) come back from the vendor list API as populated
    // objects — { _id, city_name } — not plain strings. Rendering that
    // object directly as a React child throws "Objects are not valid as a
    // React child" and crashes the whole preview, which is why clicking a
    // venue turned the screen black (the dark backdrop renders, then the
    // crash wipes out everything behind it). Unwrap it the same way the
    // Clubs grid card already does defensively.
    const cityName = typeof base.city === 'object' && base.city !== null
      ? (base.city.city_name || '')
      : (base.city || '');

    return {
      name: base.name || 'Unnamed club',
      portrait_url: base.portrait_url || base.poster_url || base.business_image || '',
      tags: Array.isArray(base.tags) ? base.tags : [],
      date: base.date || 'Schedule not set',
      time: base.time || 'Hours not set',
      location: cityName || base.location || 'Location not set',
      venue: base.venue || base.name || 'Venue not set',
      followers: String(base.likes || 0),
      capacity: base.capacity || 'Not set',
      about: base.about || base.description || 'No description available.',
      gallery: Array.isArray(base.gallery) ? base.gallery : (Array.isArray(base.landscape_urls) ? base.landscape_urls.filter(Boolean) : []),
      pastEvents: Array.isArray(base.pastEvents) ? base.pastEvents : (Array.isArray(base.lineup) ? base.lineup : [])
    };
  }, [club]);

  return (
    <div className="flex flex-col h-full bg-black text-white relative select-none font-sans overflow-hidden">
      {/* Top Header Bar */}
      <div className="absolute top-0 inset-x-0 h-20 z-50 flex items-center justify-between px-6 pointer-events-none">
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-2xl flex items-center justify-center pointer-events-auto border border-white/5 hover:bg-black/60 transition-all active:scale-95 group"
        >
          <ChevronLeftIcon className="w-6 h-6 text-white group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <button 
          onClick={onClose}
          className="w-12 h-12 bg-black/40 backdrop-blur-xl rounded-2xl flex items-center justify-center pointer-events-auto border border-white/5 hover:bg-black/60 transition-all active:scale-95"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Cover Image Section */}
        <div className="relative h-[480px] shrink-0 overflow-hidden">
          {data.portrait_url ? (
            <img src={data.portrait_url} alt={data.name} className="w-full h-full object-cover scale-105" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center">
              <MapPin className="w-16 h-16 text-white/15" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          {/* Featured Badge */}
          <div className="absolute bottom-12 left-6 right-6 flex items-end justify-between">
            <div className="space-y-4">
              <div className="flex gap-2">
                {data.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-[0.2em] border border-white/10">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white leading-[1.1] max-w-[280px]">
                {data.name}
              </h1>
            </div>
            
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="w-14 h-14 rounded-full bg-[#FF2D9A]/20 backdrop-blur-xl border border-[#FF2D9A]/30 flex items-center justify-center shadow-xl group cursor-pointer active:scale-90 transition-transform">
                <Heart className="w-6 h-6 text-[#FF2D9A] fill-[#FF2D9A]" />
              </div>
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{data.followers}</span>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="px-6 py-8 space-y-10">
          
          {/* Vital Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <CalendarIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Timing</p>
                <p className="text-[11px] font-black text-white truncate">{data.date}</p>
                <p className="text-[9px] font-bold text-white/50">{data.time}</p>
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 flex flex-col gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                <MapPin className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Location</p>
                <p className="text-[11px] font-black text-white truncate">{data.venue}</p>
                <p className="text-[9px] font-bold text-white/50 truncate">{data.location}</p>
              </div>
            </div>
          </div>

          {/* Immersive Details Bar */}
          <div className="flex items-center justify-between py-4 px-6 rounded-[2rem] bg-gradient-to-r from-[#FF2D9A]/10 to-transparent border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <div>
                <p className="text-[9px] font-black text-white uppercase tracking-widest">Status: Open</p>
                <p className="text-[7px] font-bold text-white/30 uppercase tracking-[0.15em]">Verified Club</p>
              </div>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-white/20" />
              <div>
                <p className="text-[9px] font-black text-white uppercase tracking-widest">{data.capacity}</p>
                <p className="text-[7px] font-bold text-white/30 uppercase tracking-[0.15em]">Capacity</p>
              </div>
            </div>
          </div>

          {/* Gallery Section */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-[#FF2D9A] uppercase tracking-[0.3em]">Gallery</h3>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <Activity className="w-3 h-3 text-white/40" />
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">Experience</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {data.gallery.map((img: string, i: number) => (
                <div key={i} className={cn(
                  "rounded-3xl overflow-hidden bg-white/5 border border-white/10 shadow-lg",
                  (i === 0 || i === 3) ? "aspect-square" : "aspect-[4/5]"
                )}>
                  <img src={img} alt="" className="w-full h-full object-cover hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
          </div>

          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-[#FF2D9A] uppercase tracking-[0.3em]">About</h3>
            <p className="text-[13px] text-white/50 leading-relaxed font-medium">
              "{data.about}"
            </p>
          </div>

          {/* Past Events Section */}
          <div className="space-y-5 pb-12">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-[#FF2D9A] uppercase tracking-[0.3em]">Past Events</h3>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                <CalendarDays className="w-3 h-3 text-white/40" />
                <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">History</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {data.pastEvents.map((event: any, i: number) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedEvent(event)}
                  className="flex items-center justify-between p-3 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                      {event.image ? (
                        <img src={event.image} alt={event.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                      ) : (
                        <CalendarDays className="w-5 h-5 text-white/20 m-auto mt-4" />
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-white uppercase tracking-tight">{event.name}</p>
                      <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">{event.role}</p>
                    </div>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-white/10 group-hover:text-primary transition-colors mr-2" />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Event Details Drawer Overlay */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[111] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden border-l border-white/5"
            >
              <EventProfilePreview 
                eventData={selectedEvent}
                onClose={() => setSelectedEvent(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
CLAUDE_EOF
echo "  wrote src/components/ClubProfilePreview.tsx"

echo "Done."
