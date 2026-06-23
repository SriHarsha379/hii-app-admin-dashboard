import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  BarChart2,
  Zap,
  Activity,
  Building2,
  Download,
  Wallet,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Analytics() {
  const { token, user } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');

  // ── Real queries, already backed by actual endpoints ─────────────────────────
  // (Same source-of-truth as Dashboard.tsx — /api/stats was previously flagged as
  // broken, so totals are derived from these instead of calling it directly.)
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

  // ── Scaffolded query — disabled until a real endpoint exists ─────────────────
  // TODO: replace '/api/TODO_ANALYTICS_STATS' with the real source for revenue,
  // earnings, bookings, engagement rate, and avg session time. Field names below
  // (revenue/earnings/bookings/engagementRate/avgSessionTime) are guesses —
  // adjust once the real response shape is known. If these actually live on
  // separate endpoints rather than one, this should split into separate queries.
  const { data: extendedStats } = useQuery({
    queryKey: ['analytics-extended', timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/TODO_ANALYTICS_STATS?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    },
    enabled: false, // flip on once the endpoint exists
  });

  const eventList = Array.isArray(events) ? events : [];
  const clubList  = Array.isArray(clubs)  ? clubs  : [];
  const userList  = Array.isArray(users)  ? users  : [];

  const totalUsers  = userList.length;
  const totalEvents = eventList.length;
  const totalClubs  = clubList.length;

  const kpiCards = [
    { label: 'Total Revenue',      value: extendedStats?.revenue != null ? extendedStats.revenue.toLocaleString() : '—', icon: Activity,   color: 'text-emerald-400', bg: 'bg-emerald-400/10', roles: ['SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_ADMIN'] },
    { label: 'Total Users',        value: totalUsers || 0,                                                              icon: Users,       color: 'text-blue-400',    bg: 'bg-blue-400/10',    roles: ['SUPER_ADMIN'] },
    { label: 'Total Events',       value: totalEvents || 0,                                                             icon: Calendar,    color: 'text-purple-400',  bg: 'bg-purple-400/10',  roles: ['SUPER_ADMIN', 'EVENT_ADMIN'] },
    { label: 'Total Clubs',        value: totalClubs || 0,                                                              icon: Building2,   color: 'text-amber-400',   bg: 'bg-amber-400/10',   roles: ['SUPER_ADMIN', 'CLUB_ADMIN'] },
    { label: 'Earnings',           value: extendedStats?.earnings ?? '—',                                               icon: Wallet,      color: 'text-pink-400',    bg: 'bg-pink-400/10',    roles: ['CLUB_ADMIN'] },
    { label: 'Bookings',           value: extendedStats?.bookings ?? '—',                                               icon: Zap,         color: 'text-orange-400',  bg: 'bg-orange-400/10',  roles: ['CLUB_ADMIN'] },
    { label: 'Engagement Rate',    value: extendedStats?.engagementRate != null ? `${extendedStats.engagementRate}%` : '—', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-400/10', roles: ['SUPER_ADMIN', 'EVENT_ADMIN', 'CLUB_ADMIN'] },
    { label: 'Avg Session Time',   value: extendedStats?.avgSessionTime ?? '—',                                         icon: Clock,       color: 'text-rose-400',    bg: 'bg-rose-400/10',    roles: ['SUPER_ADMIN', 'EVENT_ADMIN', 'CLUB_ADMIN'] },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Analytics Dashboard</h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
            <BarChart2 className="w-3 h-3" />
            Detailed statistics and performance metrics
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            {['24h', '7d', '30d', '90d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest",
                  timeRange === range ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
                )}
              >
                {range}
              </button>
            ))}
          </div>
          <button className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-muted-foreground hover:text-white transition-all">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.filter(stat => stat.roles.includes(user?.role || '')).map((stat: any) => (
          <div key={stat.label} className="glass-card p-5 rounded-[2rem] border border-white/10 flex flex-col gap-4 hover:border-white/20 transition-all group">
            <div className="flex items-center justify-between">
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              {/* Only render a trend badge once a real comparison value exists */}
              {stat.change && (
                <div className={cn("flex items-center gap-1 text-[8px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider",
                  stat.change.startsWith('+') ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                )}>
                  {stat.change.startsWith('+') ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                  {stat.change}
                </div>
              )}
            </div>
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-xl font-black text-white leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}