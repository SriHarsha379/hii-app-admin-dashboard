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
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
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

import { API_BASE } from '../lib/apiConfig';
export default function Analytics() {
  const { token, user } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');

  // ── Real queries, already backed by actual endpoints ─────────────────────────
  // (Same source-of-truth as Dashboard.tsx — /api/stats was previously flagged as
  // broken, so totals are derived from these instead of calling it directly.)
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      // FIXED: was returning the raw { success, message, data } envelope
      // instead of unwrapping .data. eventList below does
      // `Array.isArray(events) ? events : []`, which was always false for
      // an object — so Events by Status, Clubs/Events on the growth chart,
      // and Total Events all silently showed empty/zero regardless of how
      // much real data existed.
      const res = await fetch(`${API_BASE}/events/list`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
  });

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      // FIXED: same bug as the events query above — was returning the raw
      // envelope instead of the array, so Top Cities by Clubs and Total
      // Clubs always showed empty/zero.
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return Array.isArray(json.data) ? json.data : [];
    },
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // NOTE: was hitting the bare `${API_BASE}/users` (404, no unwrap) —
      // same fix already applied on the Users and Dashboard pages.
      const res = await fetch(`${API_BASE}/users/get_all_user`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data?.users ?? [];
    },
    enabled: user?.role === 'SUPER_ADMIN',
  });

  // Resolves "my own organisation's" vendor record for CLUB_ADMIN/EVENT_ADMIN,
  // same pattern used on Events.tsx and Clubs.tsx.
  const ownVendorForAnalytics = Array.isArray(clubs) ? clubs.find((c: any) => c.name === user?.organisation) : null;

  // FIXED: was hitting a literal placeholder URL (`/TODO_ANALYTICS_STATS`)
  // that never existed — every Revenue/Earnings/Bookings/Engagement Rate
  // card permanently showed "—". Real endpoint computes these from actual
  // Earning/Booking records. Scoped to the admin's own vendor for
  // CLUB_ADMIN/EVENT_ADMIN; platform-wide (no vendor_id) for Super/Normal
  // Admin. There's deliberately no "avg session time" — nothing in this
  // backend tracks real user sessions, so that card is removed below
  // rather than showing a made-up number.
  const { data: extendedStats } = useQuery({
    queryKey: ['analytics-extended', timeRange, ownVendorForAnalytics?._id],
    queryFn: async () => {
      const rangeParam = timeRange === '24h' ? '7d' : timeRange; // backend supports 7d/30d/90d/all
      const params = new URLSearchParams({ range: rangeParam });
      if (ownVendorForAnalytics?._id) params.set('vendor_id', ownVendorForAnalytics._id);
      const res = await fetch(`${API_BASE}/analytics/extended?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      return json.data ?? null;
    },
    enabled: user?.role !== 'CLUB_ADMIN' && user?.role !== 'EVENT_ADMIN' ? true : Boolean(ownVendorForAnalytics),
  });

  const eventList = Array.isArray(events) ? events : [];
  const clubList  = Array.isArray(clubs)  ? clubs  : [];
  const userList  = Array.isArray(users)  ? users  : [];

  const totalUsers  = userList.length;
  const totalEvents = eventList.length;
  const totalClubs  = clubList.length;

  // ── Growth chart data, bucketed according to the selected timeRange and
  // built entirely from real createdAt timestamps on the users/events/clubs
  // already fetched above. No random/mock values.
  const { periods, unit } = timeRange === '24h' ? { periods: 24, unit: 'hour' as const }
    : timeRange === '7d'  ? { periods: 7,  unit: 'day' as const }
    : timeRange === '30d' ? { periods: 30, unit: 'day' as const }
    : { periods: 90, unit: 'day' as const };

  const userGrowth  = groupByDate(userList,  (u: any) => u.createdAt, periods, unit);
  const eventGrowth = groupByDate(eventList, (e: any) => e.createdAt, periods, unit);
  const clubGrowth  = groupByDate(clubList,  (c: any) => c.createdAt, periods, unit);
  const growthChartData = userGrowth.map((bucket, i) => ({
    date: bucket.label,
    Users: bucket.count,
    Events: eventGrowth[i]?.count ?? 0,
    Clubs: clubGrowth[i]?.count ?? 0,
  }));

  // ── Two more real breakdown charts, from the same already-fetched data.
  const eventStatusData = countBy(eventList, (e: any) => e.status);
  const PIE_COLORS = ['#3B82F6', '#A855F7', '#F59E0B', '#10B981', '#EF4444', '#6366F1'];

  const clubCityCounts = countBy(clubList, (c: any) => c.city?.city_name || c.city);
  const topCities = [...clubCityCounts].sort((a, b) => b.count - a.count).slice(0, 6);
  const clubsByCityData = topCities.map(c => ({ city: c.label, Clubs: c.count }));

  const kpiCards = [
    { label: 'Total Revenue',      value: extendedStats?.revenue != null ? `₹${extendedStats.revenue.toLocaleString()}` : '—', icon: Activity,   color: 'text-emerald-400', bg: 'bg-emerald-400/10', roles: ['SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_ADMIN'] },
    { label: 'Total Users',        value: totalUsers || 0,                                                              icon: Users,       color: 'text-blue-400',    bg: 'bg-blue-400/10',    roles: ['SUPER_ADMIN'] },
    { label: 'Total Events',       value: totalEvents || 0,                                                             icon: Calendar,    color: 'text-purple-400',  bg: 'bg-purple-400/10',  roles: ['SUPER_ADMIN', 'EVENT_ADMIN'] },
    { label: 'Total Clubs',        value: totalClubs || 0,                                                              icon: Building2,   color: 'text-amber-400',   bg: 'bg-amber-400/10',   roles: ['SUPER_ADMIN', 'CLUB_ADMIN'] },
    { label: 'Your Earnings',      value: extendedStats?.earnings != null ? `₹${extendedStats.earnings.toLocaleString()}` : '—', icon: Wallet, color: 'text-pink-400',    bg: 'bg-pink-400/10',    roles: ['CLUB_ADMIN', 'EVENT_ADMIN'] },
    { label: 'Bookings',           value: extendedStats?.bookings ?? '—',                                               icon: Zap,         color: 'text-orange-400',  bg: 'bg-orange-400/10',  roles: ['CLUB_ADMIN', 'EVENT_ADMIN'] },
    { label: 'Engagement Rate',    value: extendedStats?.engagementRate != null ? `${extendedStats.engagementRate}%` : '—', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-400/10', roles: ['SUPER_ADMIN', 'EVENT_ADMIN', 'CLUB_ADMIN'] },
    // "Avg Session Time" removed — nothing in this backend tracks real user
    // sessions, so it was always a fake placeholder. Showing an honestly
    // real, slightly smaller set of KPIs beats padding the row with a made-up
    // number.
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

      {/* Growth Chart — real data only, bucketed to match the timeRange
          toggle above and built from the users/events/clubs already
          fetched (grouped by their actual createdAt dates). */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Growth Trend</h3>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">
                New users, events &amp; clubs — {timeRange === '24h' ? 'last 24 hours' : `last ${timeRange}`}
              </p>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={growthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsersA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorEventsA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClubsA" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="Users"  stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsersA)" />
                <Area type="monotone" dataKey="Events" stroke="#A855F7" strokeWidth={2} fillOpacity={1} fill="url(#colorEventsA)" />
                <Area type="monotone" dataKey="Clubs"  stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorClubsA)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Two more real breakdown charts, from the same already-fetched data */}
      {user?.role === 'SUPER_ADMIN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">Events by Status</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">From the events already loaded</p>
            <div className="h-[260px]">
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
            <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">Top Cities by Clubs</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">From the clubs already loaded</p>
            <div className="h-[260px]">
              {clubsByCityData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No clubs yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={clubsByCityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="city" stroke="rgba(255,255,255,0.2)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#12121A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#fff' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                    <Bar dataKey="Clubs" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}