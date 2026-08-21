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
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCity, setFilterCity] = useState('ALL');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [statusMenuUserId, setStatusMenuUserId] = useState<string | null>(null);
  const [banningUser, setBanningUser] = useState<any>(null);
  const [banReason, setBanReason] = useState('');

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
    queryKey: ['cities-all'],
    queryFn: async () => {
      // Users can be registered from ANY city, active or not (unlike Events/
      // Venues/Ads filters, which only show admin-curated active cities) —
      // so this specifically requests every city via include_inactive.
      const res = await fetch(`${API_BASE}/city/get_all_cities?include_inactive=true`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  // Was previously nowhere in the UI at all — the three-dot menu button
  // per row existed but had no onClick, and the profile drawer was
  // read-only. Backend endpoint (`/user/change_Status/:id`, supporting
  // ACTIVE/INACTIVE/BANNED + an optional reason) already existed, it just
  // had nothing calling it from this page.
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: string; status: string; reason?: string }) => {
      const res = await fetch(`${API_BASE}/users/change_Status/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message?.[0] || json?.message || 'Failed to update user status');
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setStatusMenuUserId(null);
      setBanningUser(null);
      setBanReason('');
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

      {/* Top Stats — was computed from the full unfiltered `users` array
          regardless of the search/status/city filters applied below, so
          the top numbers never matched the filtered table (e.g. filtering
          to "Banned" still showed the platform-wide Total Users count).
          Now computed from `filteredUsers`, so top and bottom always agree.
          "Verified Accounts" was also a hardcoded fake value ('84%') —
          now a real percentage from the User model's `is_verified` field. */}
      {(searchTerm || filterStatus !== 'ALL' || filterCity !== 'ALL') && (
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest -mb-2">
          Showing stats for the current filter ({filteredUsers.length} of {Array.isArray(users) ? users.length : 0} users)
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: filteredUsers.length, icon: UsersIcon, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Active Now', value: filteredUsers.filter((u: any) => u.status === 'ACTIVE').length, icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Banned Users', value: filteredUsers.filter((u: any) => u.status === 'BANNED').length, icon: UserX, color: 'text-red-400', bg: 'bg-red-400/10' },
          {
            label: 'Verified Accounts',
            value: filteredUsers.length > 0 ? `${Math.round((filteredUsers.filter((u: any) => u.is_verified).length / filteredUsers.length) * 100)}%` : '—',
            icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-400/10',
          },
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
                    ...((Array.isArray(cities) ? cities : []).slice().sort((a: any, b: any) => (a.city_name || '').localeCompare(b.city_name || '')).map((c: any) => ({ label: c.city_name, value: c.city_name }))),
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
                <tr key={user._id || user.id} className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedUser(user)}>
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
                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); const uid = user._id || user.id; setStatusMenuUserId(statusMenuUserId === uid ? null : uid); }}
                      className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-all"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    <AnimatePresence>
                      {statusMenuUserId === (user._id || user.id) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-8 top-10 w-52 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 glass text-left"
                        >
                          <div className="p-1">
                            {user.status !== 'ACTIVE' && (
                              <button
                                onClick={() => updateUserStatusMutation.mutate({ id: user._id || user.id, status: 'ACTIVE' })}
                                disabled={updateUserStatusMutation.isPending}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Activate
                              </button>
                            )}
                            {user.status !== 'INACTIVE' && (
                              <button
                                onClick={() => updateUserStatusMutation.mutate({ id: user._id || user.id, status: 'INACTIVE' })}
                                disabled={updateUserStatusMutation.isPending}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <UserMinus className="w-3.5 h-3.5" /> Deactivate
                              </button>
                            )}
                            {user.status !== 'BANNED' && (
                              <button
                                onClick={() => { setBanningUser(user); setStatusMenuUserId(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              >
                                <ShieldAlert className="w-3.5 h-3.5" /> Ban User
                              </button>
                            )}
                            {user.status === 'BANNED' && (
                              <button
                                onClick={() => updateUserStatusMutation.mutate({ id: user._id || user.id, status: 'ACTIVE' })}
                                disabled={updateUserStatusMutation.isPending}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors disabled:opacity-50"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Unban
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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

      <AnimatePresence>
        {banningUser && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card w-full max-w-md rounded-3xl border border-red-500/20 overflow-hidden shadow-2xl p-8 space-y-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight">Ban User</h3>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{banningUser.name || banningUser.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Reason (optional)</label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="e.g. Repeated harassment reports"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 placeholder:text-white/20"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setBanningUser(null); setBanReason(''); }}
                  className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateUserStatusMutation.mutate({ id: banningUser._id || banningUser.id, status: 'BANNED', reason: banReason })}
                  disabled={updateUserStatusMutation.isPending}
                  className="flex-1 py-3.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {updateUserStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                  {updateUserStatusMutation.isPending ? 'Banning…' : 'Ban User'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}