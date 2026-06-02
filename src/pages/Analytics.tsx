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
  ArrowRight,
  MousePointer2,
  Check,
  Info,
  Star,
  MapPin,
  Building2,
  Ticket,
  PieChart as PieChartIcon,
  Filter,
  Download,
  Calendar as CalendarIcon,
  ChevronDown,
  Wallet,
  Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
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
  PieChart,
  Pie,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

const data = [
  { name: 'Jan', value: 4000, engagement: 2400 },
  { name: 'Feb', value: 3000, engagement: 1398 },
  { name: 'Mar', value: 2000, engagement: 9800 },
  { name: 'Apr', value: 2780, engagement: 3908 },
  { name: 'May', value: 1890, engagement: 4800 },
  { name: 'Jun', value: 2390, engagement: 3800 },
  { name: 'Jul', value: 3490, engagement: 4300 },
];

const engagementData = [
  { name: 'Ticket Sales', value: 45, color: '#4F46E5' },
  { name: 'Reserve Bookings', value: 25, color: '#9333EA' },
  { name: 'Event Views', value: 20, color: '#EC4899' },
  { name: 'Social Shares', value: 10, color: '#F59E0B' },
];

const radarData = [
  { subject: 'Music', A: 120, B: 110, fullMark: 150 },
  { subject: 'Nightlife', A: 98, B: 130, fullMark: 150 },
  { subject: 'Dining', A: 86, B: 130, fullMark: 150 },
  { subject: 'Comedy', A: 99, B: 100, fullMark: 150 },
  { subject: 'Workshops', A: 85, B: 90, fullMark: 150 },
  { subject: 'Tech', A: 65, B: 85, fullMark: 150 },
];

const peakHoursData = [
  { hour: '12 AM', value: 120 },
  { hour: '3 AM', value: 40 },
  { hour: '6 AM', value: 10 },
  { hour: '9 AM', value: 80 },
  { hour: '12 PM', value: 300 },
  { hour: '3 PM', value: 450 },
  { hour: '6 PM', value: 800 },
  { hour: '9 PM', value: 1200 },
  { hour: '11 PM', value: 950 },
];

export default function Analytics() {
  const { token, user } = useAuth();
  const [timeRange, setTimeRange] = useState('7d');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['analytics-stats', timeRange],
    queryFn: async () => {
      const res = await fetch(`/api/stats?range=${timeRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

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
        {[
          { label: 'Total Revenue', value: `${(stats?.revenue || 0).toLocaleString()}`, change: '+12.5%', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10', roles: ['SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_ADMIN'] },
          { label: 'Total Users', value: stats?.totalUsers || '0', change: '+8.2%', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', roles: ['SUPER_ADMIN'] },
          { label: 'Total Events', value: stats?.totalEvents || '0', change: '+4.1%', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-400/10', roles: ['SUPER_ADMIN', 'EVENT_ADMIN'] },
          { label: 'Total Clubs', value: stats?.totalClubs || '0', change: '+2.4%', icon: Building2, color: 'text-amber-400', bg: 'bg-amber-400/10', roles: ['SUPER_ADMIN', 'CLUB_ADMIN'] },
          { label: 'Earnings', value: '$45.2k', change: '+15.4%', icon: Wallet, color: 'text-pink-400', bg: 'bg-pink-400/10', roles: ['CLUB_ADMIN'] },
          { label: 'Bookings', value: '1,284', change: '+8.9%', icon: Zap, color: 'text-orange-400', bg: 'bg-orange-400/10', roles: ['CLUB_ADMIN'] },
          { label: 'Engagement Rate', value: '72.4%', change: '+3.2%', icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-400/10', roles: ['SUPER_ADMIN', 'EVENT_ADMIN', 'CLUB_ADMIN'] },
          { label: 'Avg Session Time', value: '18m 42s', change: '+5.1%', icon: Clock, color: 'text-rose-400', bg: 'bg-rose-400/10', roles: ['SUPER_ADMIN', 'EVENT_ADMIN', 'CLUB_ADMIN'] },
        ].filter(stat => stat.roles.includes(user?.role || '')).map((stat) => (
          <div key={stat.label} className="glass-card p-5 rounded-[2rem] border border-white/10 flex flex-col gap-4 hover:border-white/20 transition-all group">
            <div className="flex items-center justify-between">
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div className={cn("flex items-center gap-1 text-[8px] font-black px-2 py-1 rounded-lg border uppercase tracking-wider", 
                stat.change.startsWith('+') ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
              )}>
                {stat.change.startsWith('+') ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                {stat.change}
              </div>
            </div>
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-xl font-black text-white leading-none">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Traffic Overview</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Current Period</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-white/20"></div>
                <span className="text-[10px] text-muted-foreground font-bold uppercase">Previous Period</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Engagement Distribution */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
          <h3 className="text-sm font-black text-white uppercase tracking-wider">Engagement Source</h3>
          <div className="h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={engagementData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {engagementData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-2xl font-bold text-white">100%</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Total</p>
            </div>
          </div>
          <div className="space-y-3">
            {engagementData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-xs text-muted-foreground font-medium">{item.name}</span>
                </div>
                <span className="text-xs font-bold text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Engagement Hours */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Peak Usage Hours</h3>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] text-amber-400 font-bold uppercase">Busy Hours</span>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={peakHoursData}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Performance Radar */}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'EVENT_ADMIN' || user?.role === 'CLUB_ADMIN') && (
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Category Performance</h3>
            <div className="h-[250px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#ffffff10" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                  <PolarRadiusAxis axisLine={false} tick={false} />
                  <Radar
                    name="Engagement"
                    dataKey="A"
                    stroke="#9333EA"
                    fill="#9333EA"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Growth"
                    dataKey="B"
                    stroke="#4F46E5"
                    fill="#4F46E5"
                    fillOpacity={0.5}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Venues */}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'CLUB_ADMIN') && (
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                {user?.role === 'CLUB_ADMIN' ? 'Performance by Day' : 'Top Performing Clubs'}
              </h3>
              <button className="text-[10px] font-black text-primary uppercase hover:underline tracking-widest">View All</button>
            </div>
            <div className="p-0">
              {user?.role === 'CLUB_ADMIN' ? (
                [
                  { name: 'Saturday', city: 'Weekend Peak', engagement: '12.8k', trend: '+18%', metric: '$6.2k' },
                  { name: 'Friday', city: 'Late Night', engagement: '10.2k', trend: '+14%', metric: '$4.8k' },
                  { name: 'Sunday', city: 'Brunch/Eve', engagement: '8.5k', trend: '+5%', metric: '$3.1k' },
                  { name: 'Wednesday', city: 'Mid-week', engagement: '4.4k', trend: '-2%', metric: '$1.2k' },
                ].map((item, i) => (
                  <div key={item.name} className={cn("p-4 flex items-center justify-between hover:bg-white/5 transition-colors", i !== 3 && "border-b border-white/5")}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary font-bold">
                        {item.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{item.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{item.metric}</p>
                      <p className={cn("text-[10px] font-bold", item.trend.startsWith('+') ? "text-emerald-400" : "text-red-400")}>
                        {item.trend}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                [
                  { name: 'The Vault', city: 'Mumbai', engagement: '42.8k', rating: 4.9, trend: '+12%' },
                  { name: 'Sky Lounge', city: 'Delhi', engagement: '38.2k', rating: 4.8, trend: '+8%' },
                  { name: 'Neon Room', city: 'Mumbai', engagement: '31.5k', rating: 4.7, trend: '+15%' },
                  { name: 'Oasis Club', city: 'Bangalore', engagement: '28.4k', rating: 4.6, trend: '-2%' },
                ].map((venue, i) => (
                  <div key={venue.name} className={cn("p-4 flex items-center justify-between hover:bg-white/5 transition-colors", i !== 3 && "border-b border-white/5")}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-primary font-bold">
                        {venue.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{venue.name}</p>
                        <p className="text-[10px] text-muted-foreground font-medium">{venue.city}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{venue.engagement}</p>
                      <p className={cn("text-[10px] font-bold", venue.trend.startsWith('+') ? "text-emerald-400" : "text-red-400")}>
                        {venue.trend}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* User Growth Chart */}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'EVENT_ADMIN') && (
          <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">User Growth</h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#111118', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="engagement" fill="#9333EA" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
