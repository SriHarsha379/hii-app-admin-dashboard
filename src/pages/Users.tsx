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
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // FIXED: the real backend route is /users/get_all_user (see
      // routes/admin/userRoute.js). `/users` alone 404s - it's only the mount
      // prefix, there is no handler at the router root.
      //
      // limit=1000 because this screen filters and sorts client-side; the API
      // caps limit at 100 per page, so we page through until we have them all.
      const fetchPage = async (page: number) => {
        const res = await fetch(
          `${API_BASE}/users/get_all_user?page=${page}&limit=100`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(`Failed to load users (${res.status})`);
        return res.json();
      };

      const first = await fetchPage(1);
      const totalPages = first?.data?.pagination?.total_pages ?? 1;
      let raw = first?.data?.users ?? [];

      // Guard against a runaway loop if the API ever reports a silly page count.
      for (let p = 2; p <= Math.min(totalPages, 20); p++) {
        const next = await fetchPage(p);
        raw = raw.concat(next?.data?.users ?? []);
      }

      // ── Shape adapter ──────────────────────────────────────────────────
      // This screen was written against a different backend and reads
      // `status`, `city` and `created_at`. The real API returns `is_active`,
      // a populated `city_id` object and `createdAt`. Map once here rather
      // than touching every render site.
      return raw.map((u: any) => ({
        ...u,
        id: u._id,
        status: u.is_deleted ? 'BANNED' : (u.is_active ? 'ACTIVE' : 'INACTIVE'),
        city: u.city_id?.city_name ?? '',
        created_at: u.createdAt,
        mobile: u.phone_number ?? '',
      }));
    }
  });

  // Live city list for the filter dropdown - the options below were hardcoded
  // to four cities, so users in any other city could not be filtered for.
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
                    ...((cities ?? []).map((c: any) => ({
                      label: c.city_name ?? c.name,
                      value: c.city_name ?? c.name,
                    }))),
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
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-2">
                    Joined Date
                    {sortField === 'created_at' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
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
                    <p className="text-xs text-white font-medium">{new Date(user.created_at).toLocaleDateString()}</p>
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