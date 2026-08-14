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