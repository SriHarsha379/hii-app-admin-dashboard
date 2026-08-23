import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Users2,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { GlowCard } from './ui/spotlight-card';
import EventProfilePreview from './EventProfilePreview';
import ClubProfilePreview from './ClubProfilePreview';

import { API_BASE } from '../lib/apiConfig';
export default function EventAdminProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'LIVE' | 'UPCOMING' | 'PAST'>('LIVE');

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/events/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const { data: clubs } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const eventList = Array.isArray(events) ? events.filter((e: any) => e && typeof e === 'object') : [];
  const liveEvents = eventList.filter(e => e.status === 'LIVE');
  // Was capped at .slice(0, 4) — but this is a dedicated full-page tab
  // (same as the LIVE and PAST tabs, neither of which have any cap), not a
  // small preview widget, so silently hiding anything past the 4th
  // upcoming event was inconsistent and easy to mistake for "that's all
  // there is." Still sorted so the soonest events show first.
  const upcomingEvents = eventList
    .filter(e => e.status === 'UPCOMING')
    .sort((a: any, b: any) => new Date(a.date || a.createdAt || 0).getTime() - new Date(b.date || b.createdAt || 0).getTime());
  const pastEvents = eventList.filter(e => e.status === 'COMPLETED');

  const associatedClubs = (Array.isArray(clubs) ? clubs : []).slice(0, 4);

  // The event organiser's own vendor record — same lookup pattern as
  // ClubAdminProfile — used to show real verification status instead of
  // assuming the admin is already approved just because they have a
  // dashboard session.
  const ownVendorData = (Array.isArray(clubs) ? clubs : []).find((c: any) => c.name === user?.organisation) || null;

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Company Profile Header */}
      <GlowCard customSize className="p-8 border-white/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
          <Layers className="w-80 h-80" />
        </div>

        <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
          <div className="relative">
            <div className="w-40 h-40 rounded-[40px] overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-all duration-700 shadow-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-16 h-16 text-primary/60" />
            </div>
            <div className="absolute -bottom-3 -right-3 p-3 rounded-2xl bg-primary text-white shadow-xl border border-white/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                  {user?.organisation || user?.name || 'Event Admin'}
                </h1>
                <span className={cn(
                  'px-3 py-1 rounded-full border text-[9px] font-black tracking-widest uppercase',
                  ownVendorData?.is_verified ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/20 text-amber-400 border-amber-500/20'
                )}>
                  {ownVendorData?.is_verified ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
              <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-xl">
                Event management profile
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  {user?.email}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <StatBlock label="Successful Events" value={String(pastEvents.length)} />
              <StatBlock label="Clubs Available" value={String(associatedClubs.length)} />
            </div>
          </div>
        </div>
      </GlowCard>

      {/* Shown only while the vendor record behind this profile hasn't
          been verified yet — same messaging as the old dedicated
          Pending Approval page, now surfaced right on the profile
          itself since that's where onboarding now lands the admin. */}
      {ownVendorData && !ownVendorData?.is_verified && (
        <div className="flex items-start gap-4 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-amber-300 text-xs font-black uppercase tracking-widest mb-1">Pending Verification</p>
            <p className="text-amber-200/70 text-sm leading-relaxed">
              Your details have been submitted for review. A Super Admin needs to approve your account before some features unlock — you'll be notified once that happens.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-12">
        {/* Events Section with Tabs */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-2">
            <div className="space-y-2">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                <Zap className="w-4 h-4 text-primary fill-primary" />
                Event Analytics
              </h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Manage your active, upcoming, and past events</p>
            </div>

            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
              {(['LIVE', 'UPCOMING', 'PAST'] as const).map((tab) => (
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
            >
              {activeTab === 'LIVE' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {liveEvents.length > 0 ? liveEvents.map(event => (
                    <motion.div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="group relative bg-[#121218] rounded-[40px] border border-white/5 overflow-hidden hover:border-primary/50 transition-all cursor-pointer p-8 flex flex-col gap-8"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Live Now</span>
                          </div>
                          <h3 className="text-3xl font-black text-white group-hover:text-primary transition-colors uppercase tracking-tighter leading-none">{event.title}</h3>
                        </div>
                        <ArrowUpRight className="w-6 h-6 text-white/20 group-hover:text-primary transition-all" />
                      </div>

                      <div className="grid grid-cols-3 gap-6">
                        <LiveMetric icon={<Users2 className="w-4 h-4" />} label="Attendees" value={String(event.attendees || 0)} />
                        <LiveMetric icon={<Activity className="w-4 h-4 text-emerald-400" />} label="Engagement" value="—" />
                        <LiveMetric icon={<Star className="w-4 h-4 text-amber-400" />} label="Scans" value="—" />
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.venue_name || event.venue || 'Venue not set'}
                        </p>
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
                    <div className="col-span-full py-20 text-center glass-card rounded-[40px] border border-dashed border-white/10">
                      <Zap className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No active live events detected</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'UPCOMING' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {upcomingEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="group bg-white/[0.02] border border-white/5 rounded-[40px] p-6 hover:border-primary/30 transition-all cursor-pointer space-y-6"
                    >
                      <div className="aspect-[4/5] rounded-[32px] overflow-hidden border border-white/10 relative">
                        <img src={event.poster_url || `https://picsum.photos/seed/${event.id}up/600/800`} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" alt="" />
                        <div className="absolute top-4 right-4 px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black text-white uppercase tracking-widest">
                          {event.date ? new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'TBD'}
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <div className="px-2">
                        <h4 className="text-xl font-black text-white uppercase tracking-tight truncate">{event.title}</h4>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">{typeof event.city === 'object' ? event.city?.city_name : event.city}</p>
                      </div>
                    </motion.div>
                  ))}
                  {upcomingEvents.length === 0 && (
                    <div className="col-span-full py-20 text-center glass-card rounded-[40px] border border-dashed border-white/10">
                      <Calendar className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Your release schedule is clear</p>
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
                      className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-white/40 uppercase text-center p-2 leading-tight">
                          {event.date ? new Date(event.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : 'TBD'}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{event.title}</h4>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Completed
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div className="text-right">
                          <span className="text-xl font-black text-white tracking-tighter">{event.attendees}</span>
                          <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">Participants</p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-black text-emerald-400 tracking-tighter">—</span>
                          <p className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">Growth</p>
                        </div>
                        <button className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition-all">
                          <ArrowUpRight className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {/* Removed Discovery Archival Deep Dive button as requested */}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Top Clubs Showcase */}
        <div className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="space-y-2">
              <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                <Building2 className="w-4 h-4 text-primary" />
                Top Partner Clubs
              </h2>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Elite venues associated with your success</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {associatedClubs.map((club: any, index: number) => (
              <motion.div
                key={club.id}
                onClick={() => setSelectedClub(club)}
                whileHover={{ y: -10 }}
                className="group relative bg-gradient-to-br from-[#121218] to-[#0B0B0F] rounded-[40px] border border-white/5 p-8 flex flex-col items-center justify-center text-center gap-6 cursor-pointer hover:border-primary/50 transition-all overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                   <Trophy className="w-24 h-24 text-primary" />
                </div>

                <div className="relative">
                  <div className="w-28 h-28 rounded-[32px] overflow-hidden border-2 border-white/10 group-hover:border-primary/50 transition-all duration-500 shadow-2xl">
                    <img
                      src={club.logo || `https://api.dicebear.com/7.x/initials/svg?seed=${club.name}`}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                      alt=""
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl scale-0 group-hover:scale-100 transition-transform duration-500">
                    <Star className="w-5 h-5 fill-current" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-black text-white uppercase tracking-tight truncate max-w-[200px]">{club.name}</h4>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{(typeof club.city === 'object' ? club.city?.city_name : club.city) || '—'}</p>
                </div>

                <div className="w-full pt-6 border-t border-white/5 flex items-center justify-center gap-6">
                  <div className="text-center">
                    <span className="text-xs font-black text-white">—</span>
                    <p className="text-[8px] text-muted-foreground uppercase font-black tracking-tighter">Events Done</p>
                  </div>
                  <div className="w-[1px] h-6 bg-white/10" />
                  <div className="text-center">
                    <span className="text-xs font-black text-emerald-400">—</span>
                    <p className="text-[8px] text-muted-foreground uppercase font-black tracking-tighter">Avg Score</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* Global Back Button for Event Detail */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setSelectedEvent(null)}
            className="fixed top-8 left-8 z-[200] w-14 h-14 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 hover:border-primary/50 transition-all group active:scale-95 shadow-2xl"
          >
            <ChevronRight className="w-7 h-7 group-hover:-translate-x-1 transition-transform rotate-180" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Event Details Combined View */}
      <AnimatePresence>
        {selectedEvent && (
          <div key="event-detail-portal">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110]"
            />

            {/* Popup Modal (Calculated Metrics) */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4 lg:pr-[420px] pointer-events-none"
            >
              <div className="w-full max-w-4xl bg-[#0F0F12] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl flex flex-col pointer-events-auto">
                {/* Header */}
                <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Analytics & Operations</h3>
                  {/* Was missing entirely — the only way to close this card
                      was clicking the dark backdrop, which isn't
                      discoverable, so users had no visible way out short of
                      the browser back button. */}
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-muted-foreground hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-10">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Left Column */}
                    <div className="space-y-8 text-left">
                      <div className="aspect-[16/10] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                        <img
                          src={selectedEvent.poster_url || `https://picsum.photos/seed/${selectedEvent.id}/800/600`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-4">
                        <h2 className="text-4xl font-black text-white tracking-tight leading-none uppercase">{selectedEvent.title}</h2>
                        <div className="flex gap-3">
                          <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase border border-primary/20 tracking-widest">
                            {selectedEvent.status || 'Active'}
                          </span>
                          <span className="px-4 py-1.5 rounded-full bg-white/5 text-white/50 text-[10px] font-black uppercase border border-white/10 tracking-widest">
                            {selectedEvent.city || 'Mumbai, India'}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                          <p className="text-[8px] text-white/30 uppercase font-bold tracking-widest mb-1">Peak Attendance</p>
                          <p className="text-lg font-black text-white">4.2k</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                          <p className="text-[8px] text-white/30 uppercase font-bold tracking-widest mb-1">Scan Velocity</p>
                          <p className="text-lg font-black text-emerald-400">12/min</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                          <p className="text-[8px] text-white/30 uppercase font-bold tracking-widest mb-1">Engagement</p>
                          <p className="text-lg font-black text-blue-400">88%</p>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Attendance Card */}
                      <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16" />
                        <div className="relative z-10">
                          <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Live Attendance</p>
                          <div className="flex items-center justify-between mt-4">
                            <span className="text-6xl font-black text-white">{selectedEvent.attendees || '2.4k'}</span>
                            <Users2 className="w-12 h-12 text-white/20" />
                          </div>
                          <div className="mt-6 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '75%' }}
                              className="h-full bg-primary shadow-[0_0_15px_rgba(255,45,154,0.5)]"
                            />
                          </div>
                          <div className="flex justify-between items-center mt-2 group">
                             <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest group-hover:text-primary transition-colors">75% Capacity Reached</span>
                             <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Target: 3.2k</span>
                          </div>
                        </div>
                      </div>

                      {/* Control Panel Card */}
                      <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Operational Controls</h4>
                        <div className="grid grid-cols-1 gap-3">
                           {/* FIXED: neither of these had an onClick, and
                               unlike the event-card buttons above, there's
                               no parent click handler to bubble up to —
                               these were genuinely dead. "Update Live
                               Metrics" now triggers a real refetch of the
                               event/club data on this page. "Emergency
                               Broadcast" routes to the real broadcast
                               feature (Ads & Broadcast) rather than
                               fabricating a separate, undefined system for
                               it — no spec exists for what a distinct
                               "emergency" flow should actually do. */}
                           <button
                             onClick={() => {
                               queryClient.invalidateQueries({ queryKey: ['events'] });
                               queryClient.invalidateQueries({ queryKey: ['clubs'] });
                             }}
                             className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                           >
                             Update Live Metrics
                           </button>
                           <button
                             onClick={() => navigate('/ads-broadcast')}
                             className="w-full py-4 rounded-2xl bg-primary text-white text-[10px] font-black font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                           >
                             Emergency Broadcast
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Side Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[130] shadow-[0_0_100px_rgba(0,0,0,0.8)] border-l border-white/5 overflow-hidden"
            >
              <EventProfilePreview
                eventData={selectedEvent}
                onClose={() => setSelectedEvent(null)}
                hideCloseButton
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Club Details Drawer */}
      <AnimatePresence>
        {selectedClub && (
          <div key="club-drawer-portal">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClub(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              key={`club-drawer-${selectedClub.id}`}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[111] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden border-l border-white/5"
            >
              <ClubProfilePreview
                club={selectedClub}
                onClose={() => setSelectedClub(null)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatBlock({ label, value }: { label: string, value: string }) {
  return (
    <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center hover:border-primary/20 transition-colors group">
      <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest group-hover:text-primary transition-colors">{label}</span>
      <span className="text-2xl font-black text-white mt-1">{value}</span>
    </div>
  );
}

function LiveMetric({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/5">
      <div className="text-white/40">{icon}</div>
      <div className="text-center">
        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest block leading-none">{label}</span>
        <span className="text-xs font-black text-white mt-1 block">{value}</span>
      </div>
    </div>
  );
}