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
  Ticket
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { GlowCard } from '../components/ui/spotlight-card';
import NormalAdminProfile from '../components/NormalAdminProfile';

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
      const res = await fetch('/api/events', { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
  });

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const res = await fetch('/api/clubs', { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: user?.role === 'SUPER_ADMIN',
  });

  // ── Scaffolded queries — disabled until real endpoints are wired in ──────────
  // TODO: replace '/api/TODO_CLUB_OPS' with the real endpoint(s) for staff count,
  // daily entries, guestlists, and VIP bookings. Shape assumed below is a guess —
  // adjust the field names once the response shape is known.
  const { data: clubOps } = useQuery({
    queryKey: ['clubOps'],
    queryFn: async () => {
      const res = await fetch('/api/TODO_CLUB_OPS', { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: false, // flip to `user?.role === 'CLUB_ADMIN'` once the endpoint exists
  });

  // TODO: replace '/api/TODO_CONVERSION_RATE' with the real conversion-rate endpoint.
  const { data: conversion } = useQuery({
    queryKey: ['conversionRate'],
    queryFn: async () => {
      const res = await fetch('/api/TODO_CONVERSION_RATE', { headers: { Authorization: `Bearer ${token}` } });
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
    </div>
  );
}