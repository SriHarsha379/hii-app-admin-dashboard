import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Calendar,
  Zap,
  Building2,
  Clock,
  Activity,
  Star,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Users2,
  Image as ImageIcon,
  Heart,
  Edit2,
  Plus,
  TrendingUp,
  Ticket
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn, groupByDate } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { GlowCard } from './ui/spotlight-card';
import ClubProfilePreview from './ClubProfilePreview';
import EventProfilePreview from './EventProfilePreview';

import { API_BASE } from '../lib/apiConfig';
export default function ClubAdminProfile() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'PAST' | 'LIVE'>('UPCOMING');

  const { data: clubs } = useQuery({
    queryKey: ['clubs-admin'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const clubData = (Array.isArray(clubs) ? clubs : []).find(c => c.name === user?.organisation) || (Array.isArray(clubs) ? clubs[0] : null);

  const { data: events } = useQuery({
    queryKey: ['events-club-admin'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/events/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  // Overview stat cards (Upcoming/Past/Featured Events, Followers, Live
  // Tickets, Tickets Sold) — was a row of entirely fake hardcoded numbers
  // ("24.8k Profile Followers", "152k Monthly Traffic", "4.8 Global
  // Score"), now backed by a real endpoint. "Profile Views" has no
  // backing anywhere in this app (no view-tracking model exists at all)
  // so it's shown honestly as "—", not invented. Live Tickets / Tickets
  // Sold show "Coming Soon" per explicit instruction, since ticketing
  // isn't live yet — not because the data can't be computed (it can, the
  // backend already supports it), just not surfaced here yet.
  const { data: overviewStats } = useQuery({
    queryKey: ['club-overview-stats', clubData?._id],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/analytics/club-overview?vendor_id=${clubData._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      return json.data ?? null;
    },
    enabled: Boolean(clubData?._id),
  });

  const eventList = Array.isArray(events) ? events : [];
  const clubEvents = eventList.filter(e => e.club_id === clubData?.id || e.venue === clubData?.name);

  const liveEvents = clubEvents.filter(e => e.status === 'LIVE' || e.status === 'ACTIVE');
  const upcomingEvents = clubEvents.filter(e => {
    const now = new Date();
    const eventDate = new Date(e.date);
    return eventDate >= now && e.status !== 'LIVE';
  });
  const pastEvents = clubEvents.filter(e => {
    const now = new Date();
    const eventDate = new Date(e.date);
    return eventDate < now;
  });

  // Growth chart data — built from this venue's own events only, grouped
  // by real createdAt dates over the last 14 days.
  const eventGrowthBuckets = groupByDate(clubEvents, (e: any) => e.createdAt, 14, 'day');
  const eventGrowthChartData = eventGrowthBuckets.map((bucket) => ({ date: bucket.label, Events: bucket.count }));

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Club Profile Header */}
      <GlowCard customSize className="p-8 border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-1000 grayscale">
          <Building2 className="w-80 h-80" />
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
          <div className="relative shrink-0">
            <div className="w-48 h-64 rounded-[40px] overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all duration-700 shadow-2xl bg-black/40">
              <img
                src={clubData?.portrait_url || clubData?.logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${clubData?.name || 'Club'}`}
                alt={clubData?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-3 -right-3 p-3 rounded-2xl bg-primary text-white shadow-xl border border-white/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
          </div>

          <div className="space-y-6 flex-1 text-left">
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">{clubData?.name || 'Venue Name'}</h1>
                <div className="flex gap-2">
                  {/* Was hardcoded "Verified Venue" + "Top Rated" regardless
                      of actual status — now reflects the real is_verified
                      flag; "Top Rated" removed since there's no rating
                      system anywhere in this backend to back that claim. */}
                  <span className={cn(
                    'px-3 py-1 rounded-full border text-[9px] font-black tracking-widest uppercase',
                    clubData?.is_verified ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/20 text-amber-400 border-amber-500/20'
                  )}>
                    {clubData?.is_verified ? 'Verified Venue' : 'Pending Verification'}
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-2xl">
                {clubData?.about || clubData?.description || 'No description added yet.'}
              </p>

              <div className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center gap-2.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <MapPin className="w-4 h-4 text-primary" />
                  {(typeof clubData?.city === 'object' ? clubData?.city?.city_name : clubData?.city) || 'City not set'}
                </div>
                <div className="flex items-center gap-2.5 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <Clock className="w-4 h-4 text-amber-400" />
                  {clubData?.start_time && clubData?.end_time ? `${clubData.start_time} - ${clubData.end_time}` : 'Hours not set'}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5">
              <StatBlock label="Upcoming Events" value={String(overviewStats?.upcomingEvents ?? '—')} />
              <StatBlock label="Past Events" value={String(pastEvents.length)} />
              <StatBlock label="Featured Events" value={String(overviewStats?.featuredEvents ?? '—')} />
              <StatBlock label="Followers" value={String(overviewStats?.followers ?? '—')} />
              <StatBlock label="Profile Views" value="—" />
              <StatBlock label="Live Tickets" value="Coming Soon" />
              <StatBlock label="Tickets Sold" value="Coming Soon" />
            </div>
          </div>
        </div>
      </GlowCard>

      {/* Growth Overview — was missing entirely. Built from the same real
          events data already fetched above, grouped by actual createdAt
          dates over the last 14 days, same pattern used on the Super
          Admin dashboard. */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Growth Overview</h3>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">
              New events — last 14 days
            </p>
          </div>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <AreaChart data={eventGrowthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorClubEvents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#12121A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="Events" stroke="#A855F7" strokeWidth={2} fillOpacity={1} fill="url(#colorClubEvents)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Gallery & About */}
        <div className="lg:col-span-1 space-y-12">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <h2 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3 text-left">
                <ImageIcon className="w-4 h-4 text-primary" />
                Venue Gallery
              </h2>
              {/* FIXED: standalone button, no parent bubbling to save it —
                  had no onClick at all. Wired to the real Profile page
                  where the gallery is actually managed. */}
              <button
                onClick={() => navigate('/account-settings')}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline"
              >
                View All
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(clubData?.landscape_urls || clubData?.gallery || []).slice(0, 4).map((url: string, index: number) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className={cn(
                    "rounded-3xl overflow-hidden border border-white/10 group relative cursor-pointer bg-white/5",
                    index === 0 ? "col-span-2 aspect-video" : "aspect-square"
                  )}
                >
                  <img src={url} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="space-y-6 p-8 rounded-[40px] bg-white/[0.02] border border-white/5 text-left">
             <h2 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
              <Star className="w-4 h-4 text-amber-400" />
              About the Club
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              {clubData?.description || 'Establishment of architectural excellence, providing an immersive nightlife experience. Equipped with the latest Function-One sound system and intelligent kinetic lighting arrays.'}
            </p>
            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                <span className="text-white/40">Food & Beverage</span>
                <span className="text-emerald-400">Premium Cuisine</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                <span className="text-white/40">Dress Code</span>
                <span className="text-amber-400">Strictly Elegant</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                <span className="text-white/40">Music Policy</span>
                <span className="text-primary">Multi-Genre</span>
              </div>
            </div>
          </div>
        </div>

        {/* Event Insights */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
            <div className="space-y-2 text-left">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                <Zap className="w-4 h-4 text-primary fill-primary" />
                Performance Dashboard
              </h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Manage your active, scheduled, and historic events</p>
            </div>

            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
              {(['UPCOMING', 'LIVE', 'PAST'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === tab
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-white/40 hover:text-white"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {activeTab === 'LIVE' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {liveEvents.length > 0 ? liveEvents.map(event => (
                    <motion.div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="group relative bg-[#121218] rounded-[40px] border border-white/5 overflow-hidden hover:border-primary/50 transition-all cursor-pointer p-8 flex flex-col gap-8 text-left"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live Now</span>
                          </div>
                          <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors uppercase tracking-tighter leading-none">{event.title}</h3>
                        </div>
                        <ArrowUpRight className="w-6 h-6 text-white/20 group-hover:text-primary transition-all" />
                      </div>

                      <div className="grid grid-cols-3 gap-6">
                        <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center gap-2">
                          <Users2 className="w-4 h-4 text-primary" />
                          <div className="text-center">
                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">RSVPs</span>
                            <span className="text-lg font-black text-white">{event.attendees || '452'}</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center gap-2">
                          <Activity className="w-4 h-4 text-emerald-400" />
                          <div className="text-center">
                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">Growth</span>
                            <span className="text-lg font-black text-white">+12%</span>
                          </div>
                        </div>
                        <div className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center gap-2">
                          <Star className="w-4 h-4 text-amber-400" />
                          <div className="text-center">
                            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block">Rating</span>
                            <span className="text-lg font-black text-white">4.9</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                         <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                              <Calendar className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Daily Performance</span>
                         </div>
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-[#121218] overflow-hidden">
                              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${event.id}${i}`} alt="" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )) : (
                    <div className="col-span-full py-24 text-center bg-white/[0.02] rounded-[40px] border border-dashed border-white/10">
                      <Zap className="w-12 h-12 text-muted-foreground/10 mx-auto mb-4" />
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No active events found</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'UPCOMING' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {upcomingEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="group bg-white/[0.02] border border-white/5 rounded-[40px] p-6 hover:border-primary/30 transition-all cursor-pointer space-y-6 text-left"
                    >
                      <div className="aspect-[4/3] rounded-[32px] overflow-hidden border border-white/10 relative">
                        <img src={event.poster_url || `https://picsum.photos/seed/${event.id}up/800/600`} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="" />
                        <div className="absolute top-4 right-4 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                          {new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                           <div className="flex items-center gap-3">
                              <button className="px-5 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest">View Details</button>
                              <button className="p-2 rounded-xl bg-white/10 text-white"><TrendingUp className="w-4 h-4"/></button>
                           </div>
                        </div>
                      </div>
                      <div className="px-2 space-y-1">
                        <h4 className="text-xl font-black text-white uppercase tracking-tight truncate">{event.title}</h4>
                        <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                           <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" /> {event.start_time || '10 PM'}</span>
                           <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> {Math.floor(Math.random() * 100) + 20}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {upcomingEvents.length === 0 && (
                    <div className="col-span-full py-24 text-center bg-white/[0.02] rounded-[40px] border border-dashed border-white/10">
                      <Calendar className="w-12 h-12 text-muted-foreground/10 mx-auto mb-4" />
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Release schedule is currently locked</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'PAST' && (
                <div className="space-y-4">
                  {pastEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-6 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40 uppercase text-center p-2 leading-tight">
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                        </div>
                        <div className="text-left">
                          <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{event.title}</h4>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Success: Record Verified
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="text-right hidden sm:block">
                          <span className="text-xl font-black text-white tracking-tighter">{event.attendees || '1.1k'}</span>
                          <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">Attendees</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black text-emerald-400 tracking-tighter">4.9/5</span>
                          <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">Satisfaction</p>
                        </div>
                        <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all text-white">
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Global Preview Overlays */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-black z-[101] shadow-2xl overflow-hidden border-l border-white/5"
            >
              <EventProfilePreview
                eventData={selectedEvent}
                onClose={() => setSelectedEvent(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBlock({ label, value }: { label: string, value: string }) {
  return (
    <div className="px-6 py-4 rounded-[2rem] bg-white/[0.03] border border-white/5 flex flex-col items-center hover:border-primary/20 transition-all group cursor-default">
      <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">{label}</span>
      <span className="text-3xl font-black text-white mt-1.5 tracking-tighter">{value}</span>
    </div>
  );
}