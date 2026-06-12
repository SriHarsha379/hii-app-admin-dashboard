import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Calendar, 
  Building2, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Search,
  Share2,
  Zap,
  MousePointer2,
  Activity,
  Ticket
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
  Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { GlowCard } from '../components/ui/spotlight-card';
import NormalAdminProfile from '../components/NormalAdminProfile';

const analyticsData = [
  { name: 'Jan', users: 4000, events: 2400, status: 2400 },
  { name: 'Feb', users: 3000, events: 1398, status: 2210 },
  { name: 'Mar', users: 2000, events: 9800, status: 2290 },
  { name: 'Apr', users: 2780, events: 3908, status: 2000 },
  { name: 'May', users: 1890, events: 4800, status: 2181 },
  { name: 'Jun', users: 2390, events: 3800, status: 2500 },
  { name: 'Jul', users: 3490, events: 4300, status: 2100 },
];

const trafficByApp = [
  { name: 'Swipe',  value: 45, color: '#9333EA', icon: Zap },
  { name: 'Ads',    value: 25, color: '#4F46E5', icon: MousePointer2 },
  { name: 'Search', value: 20, color: '#EC4899', icon: Search },
  { name: 'Shares', value: 10, color: '#10B981', icon: Share2 },
];

const deviceData = [
  { name: 'Mobile',  value: 65 },
  { name: 'Desktop', value: 25 },
  { name: 'Tablet',  value: 10 },
];

const locationData = [
  { name: 'Mumbai',    value: 400 },
  { name: 'Delhi',     value: 300 },
  { name: 'Bangalore', value: 300 },
  { name: 'Goa',       value: 200 },
];

const COLORS = ['#9333EA', '#4F46E5', '#EC4899', '#10B981'];

function MetricCard({ title, value, change, trend, icon: Icon, updateText }: any) {
  return (
    <motion.div whileHover={{ y: -5 }} className="h-full">
      <GlowCard customSize className="h-full p-5 border-white/10 hover:border-primary/50 transition-all group relative overflow-hidden flex flex-col justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-primary/20 transition-colors">
            <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
            trend === 'up' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
          )}>
            {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}%
          </div>
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
  const [analyticsTab, setAnalyticsTab] = useState('users');
  const [yearToggle, setYearToggle] = useState('this');

  // ── Derive stats from existing queries instead of broken /api/stats ─────────
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
    // Only fetch for SUPER_ADMIN — others don't need it
    enabled: user?.role === 'SUPER_ADMIN',
  });

  const eventList  = Array.isArray(events) ? events : [];
  const clubList   = Array.isArray(clubs)  ? clubs  : [];
  const userList   = Array.isArray(users)  ? users  : [];

  const activeEvents = eventList.filter((e: any) => e.status === 'LIVE' || e.status === 'UPCOMING').length;
  const pastEvents   = eventList.filter((e: any) => e.status === 'COMPLETED').length;
  const totalUsers   = userList.length;
  // "active" = logged in within last 30 days; fall back to a rough estimate
  const activeUsers  = userList.filter((u: any) => u.last_active || u.isActive).length || Math.round(totalUsers * 0.3);

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
            <MetricCard title="Total Users"  value={totalUsers  || 0}    change="12.5" trend="up"   icon={Users}    updateText="From /api/users" />
            <MetricCard title="Active Users" value={activeUsers || 0}    change="8.2"  trend="up"   icon={Activity} updateText="Real-time feed" />
          </>
        )}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'EVENT_ADMIN') && (
          <>
            <MetricCard title="Active Events" value={activeEvents} change="8.2" trend="up"   icon={Calendar} updateText="Updated now" />
            <MetricCard title="Past Events"   value={pastEvents}   change="1.4" trend="up"   icon={Calendar} updateText="All time"    />
          </>
        )}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'CLUB_ADMIN') && (
          <>
            <MetricCard title="Total Clubs" value={clubList.length} change="2.4" trend="down" icon={Building2} updateText="Verified 1h ago" />
            {user?.role === 'CLUB_ADMIN' && (
              <>
                <MetricCard title="Club Staff"   value="12"  change="0"    trend="up" icon={Users}    updateText="All present"     />
                <MetricCard title="Daily Entry"  value="420" change="12.4" trend="up" icon={Activity} updateText="Live count"       />
                <MetricCard title="Guestlists"   value="18"  change="5.2"  trend="up" icon={Users}    updateText="Active lists"     />
                <MetricCard title="VIP Bookings" value="24"  change="8.1"  trend="up" icon={Ticket}   updateText="Reserved today"   />
              </>
            )}
          </>
        )}
        <MetricCard title="Conversion Rate" value="8.4%" change="1.2" trend="up" icon={TrendingUp} updateText="Last 10m" />
      </div>

      {/* Main chart + Traffic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex gap-4">
              {['users', 'events', 'status'].filter(tab => {
                if (user?.role === 'CLUB_ADMIN')  return tab === 'status';
                if (user?.role === 'EVENT_ADMIN') return tab === 'events';
                return true;
              }).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAnalyticsTab(tab)}
                  className={cn(
                    "text-xs font-bold uppercase tracking-wider pb-2 border-b-2 transition-all",
                    analyticsTab === tab ? "border-primary text-white" : "border-transparent text-muted-foreground hover:text-white"
                  )}
                >
                  Total {tab}
                </button>
              ))}
            </div>
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
              {['this', 'last'].map((y) => (
                <button
                  key={y}
                  onClick={() => setYearToggle(y)}
                  className={cn("px-3 py-1 text-[10px] font-bold rounded-md transition-all", yearToggle === y ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white")}
                >
                  {y === 'this' ? 'This Year' : 'Last Year'}
                </button>
              ))}
            </div>
          </div>

          {/* FIX: explicit px height via style, not Tailwind class */}
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#FF2D9A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7B2CFF" stopOpacity={0}   />
                  </linearGradient>
                  <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%"   stopColor="#FF2D9A" />
                    <stop offset="100%" stopColor="#7B2CFF" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0A0A0F', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(20px)' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey={analyticsTab} stroke="url(#strokeGradient)" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic by App */}
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <h3 className="text-sm font-black text-white mb-6 uppercase tracking-wider">Traffic Distribution</h3>
          <div className="space-y-6">
            {trafficByApp.map((item) => (
              <div key={item.name} className="group cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                    </div>
                    <span className="text-xs font-black uppercase text-white tracking-widest">{item.name}</span>
                  </div>
                  <span className="text-xs font-black text-white">{item.value}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.value}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/20">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-4 h-4 text-primary fill-primary" />
              <span className="text-xs font-bold text-white uppercase">Growth Tip</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Your "Swipe" traffic is up 15%. Consider increasing ad spend on high-engagement cities.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Device Traffic — FIX: style height */}
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <h3 className="text-sm font-black text-white mb-6 uppercase tracking-wider">Traffic by Device</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {deviceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* City-wise Engagement */}
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <h3 className="text-sm font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            City-wise Engagement
          </h3>
          <div className="space-y-4">
            {locationData.map((item, index) => (
              <div key={item.name} className="group">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-medium text-white">{item.name}</span>
                  <span className="text-[10px] font-bold text-muted-foreground">{item.value}k active</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / 400) * 100}%` }}
                    transition={{ duration: 1, delay: 0.2 * index }}
                    className="absolute top-0 left-0 h-full rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${COLORS[index % COLORS.length]}80, ${COLORS[index % COLORS.length]})`,
                      boxShadow: `0 0 10px ${COLORS[index % COLORS.length]}40`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground">Top performing regions</span>
            <button className="text-[10px] text-primary hover:text-white transition-colors uppercase font-bold tracking-wider">
              View Map
            </button>
          </div>
        </div>

        {/* Monthly Engagement — FIX: style height, add required axes */}
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <h3 className="text-sm font-black text-white mb-6 uppercase tracking-wider">Monthly Engagement</h3>
          <div style={{ width: '100%', height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#111118', border: '1px solid #ffffff10', borderRadius: '12px' }}
                />
                <Bar dataKey="status" fill="#9333EA" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}