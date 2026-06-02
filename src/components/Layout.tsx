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
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ClubProfilePreview from './ClubProfilePreview';
import EventProfilePreview from './EventProfilePreview';

import RightClubProfile from './RightClubProfile';

function RightSidebar({ isOpen, toggle, currentPage }: { isOpen: boolean, toggle: () => void, currentPage: string }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  
  const notifications = [
    { id: 1, icon: UserPlus, text: 'New user registered.', time: 'Just now', color: 'text-purple-400' },
    { id: 2, icon: Calendar, text: 'Event "Neon Nights" created.', time: '59 minutes ago', color: 'text-blue-400' },
    { id: 3, icon: Bug, text: 'Bug fixed in payment gateway.', time: '12 hours ago', color: 'text-emerald-400' },
  ];

  const team = [
    { name: 'Natali Craig', role: 'SUPER ADMIN', color: 'bg-purple-500/20 text-purple-400', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop' },
    { name: 'Drew Cano', role: 'EVENT ADMIN', color: 'bg-blue-500/20 text-blue-400', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop' },
    { name: 'Andi Lane', role: 'CITY ADMIN', color: 'bg-emerald-500/20 text-emerald-400', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop' },
    { name: 'Koray Okumus', role: 'CLUB ADMIN', color: 'bg-orange-500/20 text-orange-400', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
  ];

  const { data: clubs } = useQuery({
    queryKey: ['clubs-sidebar'],
    queryFn: async () => {
      const res = await fetch('/api/clubs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
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

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery) return null;
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Search failed');
      return res.json();
    },
    enabled: searchQuery.length > 0,
  });

  const [isClubProfileOpen, setIsClubProfileOpen] = useState(false);
  const [isEventProfileOpen, setIsEventProfileOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const { data: clubs } = useQuery({
    queryKey: ['clubs-header'],
    queryFn: async () => {
      const res = await fetch('/api/clubs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    },
    enabled: !!token && user?.role === 'CLUB_ADMIN',
  });

  const clubData = Array.isArray(clubs) ? clubs.find((c: any) => c.name === user?.organisation) : null;

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        {/* Top Logo Section (Minimal) */}
        <div className={cn("p-6 flex items-center shrink-0 overflow-hidden", isLeftSidebarOpen ? "gap-3" : "justify-center")}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Zap className="w-5 h-5 text-white fill-white" />
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
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'EVENT_ADMIN' || user?.role === 'NORMAL_ADMIN') && (
              <NavLink to="/events" icon={Calendar}>Events</NavLink>
            )}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'CLUB_ADMIN' || user?.role === 'NORMAL_ADMIN') && (
              <NavLink to="/clubs" icon={user?.role === 'CLUB_ADMIN' ? Calendar : Building2}>
                {user?.role === 'CLUB_ADMIN' ? 'Event Listings' : 'Clubs & Venues'}
              </NavLink>
            )}
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'NORMAL_ADMIN') && <NavLink to="/polls-contests" icon={Vote}>Polls & Contests</NavLink>}
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

        {/* Profile Section with Dropdown at bottom */}
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
                {/* Role-based options */}
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
        
        {/* Toggle Button */}
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
          <div className="flex-1 hidden sm:flex justify-start"></div>
          
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
              
              {/* Search Results Dropdown */}
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
          
          <div className="flex-none sm:flex-1 flex items-center justify-end gap-2 sm:gap-4">
            <button className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <button className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-all relative">
              <Bell className="w-4 h-4" />
              <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-primary rounded-full border border-background"></div>
            </button>

            <div className="w-px h-4 bg-border mx-1"></div>
            
            <div 
              onClick={() => {
                if (user?.role === 'CLUB_ADMIN') {
                  navigate('/club-profile');
                } else if (user?.role === 'EVENT_ADMIN') {
                  navigate('/event-profile');
                }
              }}
              className="flex items-center gap-3 pl-2 group cursor-pointer shrink-0"
            >
              <div className="flex flex-col items-end hidden sm:flex whitespace-nowrap">
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsClubProfileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[111] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden border-l border-white/5"
            >
              <ClubProfilePreview 
                club={clubData} 
                onClose={() => setIsClubProfileOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Event Profile Panel */}
      <AnimatePresence>
        {isEventProfileOpen && user?.role === 'EVENT_ADMIN' && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEventProfileOpen(false)}
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
                onClose={() => setIsEventProfileOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
