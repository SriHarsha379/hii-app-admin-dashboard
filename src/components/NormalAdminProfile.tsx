import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Shield,
  MapPin,
  Calendar,
  Zap,
  Building2,
  Trophy,
  ChevronRight,
  TrendingUp,
  Clock,
  Activity,
  Star,
  Users,
  BarChart3,
  Ticket
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { GlowCard } from './ui/spotlight-card';
import EventProfilePreview from './EventProfilePreview';
import ClubProfilePreview from './ClubProfilePreview';

import { API_BASE } from '../lib/apiConfig';
export default function NormalAdminProfile() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedClub, setSelectedClub]   = useState<any>(null);

  // ── Data queries (FIXED: correct paths + response unwrapping) ────────────────
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

  // TODO: no pollRoute.js exists on the backend yet - disabled until a real
  // endpoint is added. "Polls & Contests" section will show its empty state
  // until then.
  const { data: polls } = useQuery({
    queryKey: ['polls'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/polls`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: false,
  });

  // TODO: no contestRoute.js exists on the backend yet - disabled until a
  // real endpoint is added.
  const { data: contests } = useQuery({
    queryKey: ['contests'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/contests`, { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    },
    enabled: false,
  });

  // ── Derived values (all from real data, no hardcoding) ─────────────────────
  const eventList   = Array.isArray(events)   ? events   : [];
  const clubList    = Array.isArray(clubs)    ? clubs    : [];
  const pollList    = Array.isArray(polls)    ? polls    : [];
  const contestList = Array.isArray(contests) ? contests : [];

  // "Latest Events" was just the first 3 items in whatever order the API
  // happened to return (usually insertion order), not actually sorted by
  // recency — so the label didn't match reality. Now genuinely sorted by
  // date, soonest/most-recent first.
  const recentEvents    = eventList
    .slice()
    .sort((a: any, b: any) => new Date(b.date || b.createdAt || 0).getTime() - new Date(a.date || a.createdAt || 0).getTime())
    .slice(0, 3);
  const accessibleClubs = clubList.slice(0, 4);

  const recentItems = [
    ...pollList.map((p: any)   => ({ ...p, type: 'POLL' })),
    ...contestList.map((c: any) => ({ ...c, type: 'CONTEST' })),
  ]
    .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 3);

  // Real stats
  const totalEvents    = eventList.length;
  const activeContests = contestList.filter((c: any) => c.status === 'ACTIVE').length;
  const totalPolls     = pollList.length;
  const upcomingEvents = eventList.filter((e: any) => {
    if (!e.date) return false;
    return new Date(e.date) >= new Date();
  }).length;

  // Progress value for polls/contests bar: ratio of active items to total
  const totalItems  = pollList.length + contestList.length;
  const activeItems = pollList.filter((p: any) => p.status === 'ACTIVE').length
                    + contestList.filter((c: any) => c.status === 'ACTIVE').length;
  const activeRatio = totalItems > 0 ? Math.round((activeItems / totalItems) * 100) : 0;

  // ── Avatar initials fallback (no external service needed) ──────────────────
  const getInitials = (name?: string) => {
    if (!name) return 'A';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const ClubAvatar = ({ club }: { club: any }) => {
    if (club.portrait_url) {
      return <img src={club.portrait_url} className="w-full h-full object-cover" alt={club.name} />;
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-lg font-black">
        {getInitials(club.name)}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">

      {/* ── Profile Header ─────────────────────────────────────────────────── */}
      <GlowCard customSize className="p-8 border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <User className="w-64 h-64" />
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-2 border-primary/20 group-hover:border-primary/50 transition-all duration-500 shadow-2xl bg-primary/10 flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-primary">{getInitials(user?.name)}</span>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-primary text-white shadow-lg border border-white/20">
              <Shield className="w-4 h-4" />
            </div>
          </div>

          {/* Info */}
          <div className="space-y-4 flex-1 min-w-0">
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight uppercase truncate">
                {user?.name || 'Admin User'}
              </h1>
              <div className="flex flex-wrap gap-4 mt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  {user?.role?.replace(/_/g, ' ')}
                </div>
                {user?.email && (
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest border-l border-white/10 pl-4">
                    <Mail className="w-3.5 h-3.5 text-primary" />
                    {user.email}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest border-l border-white/10 pl-4">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  Global Access
                </div>
              </div>
            </div>

            {/* Real stat pills */}
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center min-w-[80px]">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Total Events</span>
                <span className="text-xl font-bold text-white">{totalEvents}</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center min-w-[80px]">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Upcoming</span>
                <span className="text-xl font-bold text-white">{upcomingEvents}</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center min-w-[80px]">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Active Contests</span>
                <span className="text-xl font-bold text-white">{activeContests}</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center min-w-[80px]">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-tighter">Total Clubs</span>
                <span className="text-xl font-bold text-white">{clubList.length}</span>
              </div>
            </div>
          </div>

          {/* Upcoming badge — real count */}
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col justify-center items-center gap-2 shrink-0">
            <Calendar className="w-8 h-8 text-primary" />
            <div className="text-center">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest">Upcoming</p>
              <p className="text-xl font-black text-white">{upcomingEvents} Events</p>
            </div>
          </div>
        </div>
      </GlowCard>

      {/* ── Main Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Recent Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Calendar className="w-4 h-4 text-primary" />
                Latest Events
                {/* Makes the connection to the "Total Events" count above
                    explicit — was previously just an unlabeled "latest 3",
                    with no visible link to the total shown up top. */}
                <span className="text-[10px] font-bold text-white/30 normal-case tracking-normal">({recentEvents.length} of {totalEvents})</span>
              </h2>
              {/* ✅ View All wired to /events route */}
              <button
                onClick={() => navigate('/events')}
                className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1 group"
              >
                View All <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentEvents.length > 0 ? recentEvents.map((event: any, index: number) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={event._id || event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="group relative bg-[#121218] rounded-[24px] border border-white/5 overflow-hidden hover:border-primary/50 transition-all shadow-xl cursor-pointer"
                >
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img
                      src={
                        event.landscape_urls?.[0] ||
                        event.poster_url ||
                        `https://picsum.photos/seed/${event._id || event.id}/800/450`
                      }
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      alt={event.title}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121218] via-transparent to-transparent" />
                    <div className="absolute top-4 left-4">
                      <div className={cn(
                        'px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md',
                        event.status === 'LIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                          : 'bg-primary/20 text-primary border-primary/20'
                      )}>
                        {event.status || 'UPCOMING'}
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors truncate">
                        {event.title}
                      </h3>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 font-bold uppercase tracking-widest">
                        <MapPin className="w-3 h-3" />
                        {event.city || event.venue_name || '—'}
                        {event.date && ` • ${new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                          {event.attendees ?? 0} RSVPs
                        </span>
                      </div>
                      {/* Genre tags */}
                      {Array.isArray(event.genre) && event.genre.length > 0 && (
                        <div className="flex gap-1">
                          {event.genre.slice(0, 2).map((g: string) => (
                            <span key={g} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase border border-primary/20">
                              {g}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full py-20 text-center glass-card rounded-3xl border border-dashed border-white/10">
                  <Clock className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                    No events yet
                  </p>
                  <button
                    onClick={() => navigate('/events')}
                    className="text-primary text-xs font-black uppercase tracking-widest hover:underline"
                  >
                    Go to Events
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Accessible Clubs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Building2 className="w-4 h-4 text-primary" />
                Clubs & Venues
                <span className="text-[10px] font-bold text-white/30 normal-case tracking-normal">({accessibleClubs.length} of {clubList.length})</span>
              </h2>
              {/* ✅ View All wired to /clubs route */}
              <button
                onClick={() => navigate('/clubs')}
                className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1 group"
              >
                View All <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {accessibleClubs.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {accessibleClubs.map((club: any, index: number) => (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    key={club._id || club.id}
                    onClick={() => setSelectedClub(club)}
                    className="group relative aspect-square bg-[#121218] rounded-[32px] border border-white/5 overflow-hidden hover:border-primary/50 transition-all flex flex-col items-center justify-center gap-4 text-center p-4 cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 group-hover:border-primary/50 transition-colors shadow-2xl">
                      <ClubAvatar club={club} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[100px]">
                        {club.name}
                      </h4>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter mt-1">
                        {(typeof club.city === 'object' ? club.city?.city_name : club.city) || '—'}
                      </p>
                      {club.type && (
                        <p className="text-[8px] font-bold text-primary/70 uppercase tracking-tighter mt-0.5">
                          {club.type}
                        </p>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-[0.03] transition-opacity" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center glass-card rounded-3xl border border-dashed border-white/10">
                <Building2 className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                  No clubs found
                </p>
                <button
                  onClick={() => navigate('/clubs')}
                  className="text-primary text-xs font-black uppercase tracking-widest hover:underline"
                >
                  Go to Clubs
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">

          {/* Polls & Contests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                <Trophy className="w-4 h-4 text-primary" />
                Polls & Contests
              </h2>
              {/* ✅ View All wired to /polls-contests route */}
              <button
                onClick={() => navigate('/polls-contests')}
                className="text-[10px] font-bold text-primary uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1 group"
              >
                View All <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="space-y-4">
              {recentItems.length > 0 ? recentItems.map((item: any) => {
                const total    = item.votes ?? item.participants ?? 0;
                const maxGuess = 200; // for progress bar scale
                const barWidth = Math.min(100, Math.round((total / maxGuess) * 100));

                return (
                  <div
                    key={item._id || item.id}
                    className="glass-card p-5 rounded-3xl border border-white/5 hover:border-primary/30 transition-all space-y-4 relative overflow-hidden group cursor-pointer"
                    onClick={() => navigate('/polls-contests')}
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                      <Zap className="w-16 h-16 text-primary" />
                    </div>
                    <div className="flex justify-between items-start relative z-10">
                      <div className="min-w-0 pr-4">
                        <span className={cn(
                          'text-[9px] font-black uppercase tracking-[0.2em]',
                          item.type === 'POLL' ? 'text-primary' : 'text-amber-400'
                        )}>
                          {item.type}
                        </span>
                        <h3 className="text-sm font-bold text-white mt-1 leading-tight truncate">{item.title}</h3>
                      </div>
                      <span className={cn(
                        'text-[9px] px-2 py-0.5 rounded-full font-black uppercase border shrink-0',
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-white/5 text-white/30 border-white/10'
                      )}>
                        {item.status || 'PENDING'}
                      </span>
                    </div>
                    <div className="space-y-2 relative z-10">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-muted-foreground uppercase tracking-widest">
                          {item.type === 'POLL' ? 'Votes' : 'Participants'}
                        </span>
                        <span className="text-white">{total}</span>
                      </div>
                      {/* ✅ Bar width based on real data, not hardcoded 65% */}
                      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-700"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-12 text-center glass-card rounded-3xl border border-dashed border-white/10">
                  <Zap className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                    No active polls or contests
                  </p>
                  <button
                    onClick={() => navigate('/polls-contests')}
                    className="text-primary text-xs font-black uppercase tracking-widest hover:underline"
                  >
                    Create one
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats — all from real data */}
          <div className="glass-card p-6 rounded-3xl border border-white/5 space-y-6">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              Quick Stats
            </h3>

            <div className="space-y-3">
              {[
                {
                  label: 'Total Events',
                  value: totalEvents,
                  color: 'text-primary',
                  icon: Calendar,
                  onClick: () => navigate('/events'),
                },
                {
                  label: 'Active Polls',
                  value: pollList.filter((p: any) => p.status === 'ACTIVE').length,
                  color: 'text-emerald-400',
                  icon: Activity,
                  onClick: () => navigate('/polls-contests'),
                },
                {
                  label: 'Total Clubs',
                  value: clubList.length,
                  color: 'text-blue-400',
                  icon: Building2,
                  onClick: () => navigate('/clubs'),
                },
                {
                  label: 'Active Contests',
                  value: activeContests,
                  color: 'text-amber-400',
                  icon: Trophy,
                  onClick: () => navigate('/polls-contests'),
                },
              ].map(stat => (
                <button
                  key={stat.label}
                  onClick={stat.onClick}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/[0.08] transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <stat.icon className={cn('w-3.5 h-3.5', stat.color)} />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest group-hover:text-white transition-colors">
                      {stat.label}
                    </span>
                  </div>
                  <span className={cn('text-xs font-black', stat.color)}>{stat.value}</span>
                </button>
              ))}
            </div>

            {/* Active items ratio — real */}
            {totalItems > 0 && (
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Rate</span>
                  <span className="text-[10px] font-black text-primary">{activeRatio}%</span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-700"
                    style={{ width: `${activeRatio}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {activeItems} of {totalItems} polls & contests currently active
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Event Preview Panel ────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[111] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden border-l border-white/5"
            >
              <EventProfilePreview
                eventData={selectedEvent}
                onClose={() => setSelectedEvent(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Club Preview Panel ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedClub && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedClub(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[111] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden border-l border-white/5"
            >
              <ClubProfilePreview
                club={selectedClub}
                onClose={() => setSelectedClub(null)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}