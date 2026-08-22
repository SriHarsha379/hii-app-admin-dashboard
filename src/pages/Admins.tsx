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
  Star,
  MapPin,
  Building2,
  Phone,
  Globe,
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
  Key,
  EyeOff,
  RefreshCw,
  Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import { FilterDropdown } from '../components/FilterDropdown';
import { FilterPanel } from '../components/FilterPanel';

import UserProfilePreview from '../components/UserProfilePreview';
import { AnimatePresence, motion } from 'framer-motion';

import { API_BASE } from '../lib/apiConfig';
const roleColors: any = {
  'SUPER_ADMIN': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'ADMIN': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

const statusColors: any = {
  'ACTIVE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'INACTIVE': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  'BANNED': 'bg-red-500/10 text-red-400 border-red-500/20',
  'PENDING': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function Admins() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', role: 'NORMAL_ADMIN', password: '' });

  const { data: admins, isLoading } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const addAdminMutation = useMutation({
    mutationFn: async (admin: any) => {
      const res = await fetch(`${API_BASE}/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(admin)
      });
      if (!res.ok) throw new Error('Failed to add admin');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setIsAddModalOpen(false);
      setNewAdmin({ name: '', email: '', role: 'NORMAL_ADMIN', password: '' });
    }
  });

  const filteredAdmins = (Array.isArray(admins) ? admins : [])?.filter((a: any) => {
    const matchesSearch = a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'ALL' || a.role === filterRole;
    const matchesStatus = filterStatus === 'ALL' || a.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const exportData = () => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Created'];
    const rows = filteredAdmins.map((a: any) => [
      `"${a.name || ''}"`, `"${a.email || ''}"`, `"${a.role || 'ADMIN'}"`,
      `"${a.status || 'ACTIVE'}"`, `"${a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}"`,
    ]);
    const csv  = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a2   = document.createElement('a');
    a2.href = url; a2.download = `admins-${new Date().toISOString().slice(0, 10)}.csv`; a2.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Admin <span className="text-primary neon-text">Management</span></h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
            <Shield className="w-3 h-3" />
            Manage all dashboard administrators
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportData} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            Export Data
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add New Admin
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Admins', value: Array.isArray(admins) ? admins.length : '0', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Super Admins', value: (Array.isArray(admins) ? admins : []).filter((a: any) => a.role === 'SUPER_ADMIN').length || '0', icon: Trophy, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'Active Now', value: (Array.isArray(admins) ? admins : []).filter((a: any) => a.status === 'ACTIVE').length || '0', icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
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

      {/* Admins Table */}
      <div className="glass-card rounded-2xl border border-white/10">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Admin List</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search admins..."
                className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
              />
            </div>
            <FilterPanel>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Role</label>
                <FilterDropdown
                  value={filterRole}
                  onChange={setFilterRole}
                  options={[
                    { label: 'All Roles', value: 'ALL' },
                    { label: 'Super Admin', value: 'SUPER_ADMIN' },
                    { label: 'Admin', value: 'NORMAL_ADMIN' },
                    { label: 'Club Admin', value: 'CLUB_ADMIN' },
                    { label: 'Event Admin', value: 'EVENT_ADMIN' },
                  ]}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</label>
                <FilterDropdown
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { label: 'All Status', value: 'ALL' },
                    { label: 'Active', value: 'ACTIVE' },
                    { label: 'Inactive', value: 'INACTIVE' },
                  ]}
                />
              </div>
            </FilterPanel>
          </div>
        </div>

        <div className="overflow-x-auto rounded-b-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Admin Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date Joined</th>
                <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading admins...</td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">No admins found.</td>
                </tr>
              ) : filteredAdmins.map((admin: any) => (
                <tr
                  key={admin.id}
                  onClick={() => setSelectedAdmin(admin)}
                  className="group hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 border border-white/10 flex items-center justify-center text-primary font-bold text-sm">
                        {admin.name?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{admin.name}</p>
                        <p className="text-[10px] text-muted-foreground">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("text-[10px] px-2 py-1 rounded-lg font-bold border", roleColors[admin.role] || roleColors.ADMIN)}>
                      {admin.role || 'ADMIN'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("text-[10px] px-2 py-1 rounded-lg font-bold border", statusColors[admin.status] || statusColors.ACTIVE)}>
                      {admin.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-white font-medium">{new Date(admin.created_at).toLocaleDateString()}</p>
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

      {/* Admin Profile Side Panel */}
      <AnimatePresence>
        {selectedAdmin && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAdmin(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[111] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden border-l border-white/5"
            >
              <UserProfilePreview
                user={selectedAdmin}
                onClose={() => setSelectedAdmin(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Admin Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-card w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Add Admin</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-lg hover:bg-white/5 transition-all">
                <XCircle className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest tracking-[0.2em]">Full Name</label>
                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest tracking-[0.2em]">Email Address</label>
                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  placeholder="Enter email"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest tracking-[0.2em]">Access Level</label>
                <select
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 appearance-none"
                >
                  {/* FIXED: this dropdown only ever offered "Admin" and
                      "Super Admin" — there was no way to create a Club
                      Admin or Event Admin account through this UI at all,
                      despite both roles being fully supported by the
                      backend schema. The "Admin" option's value was also
                      "ADMIN", which doesn't match the real enum
                      (NORMAL_ADMIN) at all. */}
                  <option value="NORMAL_ADMIN">Admin</option>
                  <option value="CLUB_ADMIN">Club Admin</option>
                  <option value="EVENT_ADMIN">Event Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest tracking-[0.2em]">Set Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    placeholder="Enter password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addAdminMutation.mutate(newAdmin)}
                  disabled={addAdminMutation.isPending}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {addAdminMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {addAdminMutation.isPending ? 'Adding...' : 'Add Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}