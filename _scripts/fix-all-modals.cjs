const fs = require('fs');

// ── 1. FeatureClubModal.tsx ──────────────────────────────────────────────────
fs.writeFileSync('src/components/FeatureClubModal.tsx', `
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, ChevronUp, ChevronDown, Star, Loader2, MapPin, Check, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Club {
  _id?: string; id?: string;
  venue_name?: string; name?: string;
  city?: any; venue_image?: string;
}
interface City {
  id?: string; _id?: string; name?: string; city_name?: string;
}
interface FeatureClubModalProps {
  isOpen: boolean; onClose: () => void;
  cities: City[]; clubs: Club[];
  onConfirm: (data: { city: string; clubId: string; duration: number }) => Promise<void>;
  initialClubId?: string; initialCity?: string;
}

export function FeatureClubModal({
  isOpen, onClose, cities, clubs, onConfirm,
  initialClubId = '', initialCity = 'ALL',
}: FeatureClubModalProps) {
  const [selectedCity, setSelectedCity]     = useState(initialCity);
  const [selectedClubId, setSelectedClubId] = useState(initialClubId);
  const [duration, setDuration]             = useState(7);
  const [searchTerm, setSearchTerm]         = useState('');
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [dropdownOpen, setDropdownOpen]     = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const clubName    = (c: Club) => c.venue_name || c.name || 'Untitled Club';
  const clubCity    = (c: Club) => typeof c.city === 'object' ? c.city?.city_name : c.city;
  const clubKey     = (c: Club) => c._id || c.id || '';

  useEffect(() => {
    if (isOpen) {
      setSelectedCity(initialCity); setSelectedClubId(initialClubId);
      setDuration(7); setSearchTerm(''); setDropdownOpen(false);
      if (initialClubId) {
        const c = clubs.find(x => clubKey(x) === initialClubId);
        if (c) setSearchTerm(clubName(c));
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredClubs = useMemo(() => {
    if (!Array.isArray(clubs)) return [];
    return clubs.filter(c => {
      if (!c) return false;
      const matchCity   = selectedCity === 'ALL' || clubCity(c) === selectedCity;
      const matchSearch = clubName(c).toLowerCase().includes(searchTerm.toLowerCase());
      return matchCity && matchSearch;
    });
  }, [clubs, selectedCity, searchTerm]);

  const cityList = useMemo(() => [
    { label: 'All Cities', value: 'ALL' },
    ...(cities || []).slice().sort((a, b) => (a.city_name || a.name || '').localeCompare(b.city_name || b.name || '')).map(c => ({ label: c.city_name || c.name || '', value: c.city_name || c.name || '' })),
  ], [cities]);

  const handleConfirm = async () => {
    if (!selectedClubId || duration < 1) return;
    setIsSubmitting(true);
    try { await onConfirm({ city: selectedCity, clubId: selectedClubId, duration }); onClose(); }
    catch (e) { console.error(e); }
    finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div initial={{ scale: 0.93, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.93, opacity: 0 }}
        className="w-full max-w-md bg-[#0d0d12] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Star className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">Feature Club</h3>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5">Boost visibility in the app</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* City filter */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Filter by City</label>
            <div className="flex flex-wrap gap-2">
              {cityList.slice(0, 6).map(c => (
                <button key={c.value} onClick={() => { setSelectedCity(c.value); setSelectedClubId(''); setSearchTerm(''); }}
                  className={cn('px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all',
                    selectedCity === c.value ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10')}>
                  {c.label}
                </button>
              ))}
              {cityList.length > 6 && (
                <select value={selectedCity} onChange={e => { setSelectedCity(e.target.value); setSelectedClubId(''); setSearchTerm(''); }}
                  className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-white/5 border-white/10 text-white/50 hover:text-white transition-all focus:outline-none focus:border-primary/50">
                  {cityList.slice(6).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Club search */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Select Club</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input type="text" value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setDropdownOpen(true); if (selectedClubId) setSelectedClubId(''); }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Search clubs..."
                className={cn('w-full bg-white/5 border rounded-2xl pl-11 pr-10 py-3 text-sm text-white focus:outline-none transition-all placeholder:text-white/20',
                  selectedClubId ? 'border-primary/40 bg-primary/5' : 'border-white/10 hover:border-white/20 focus:border-primary/40')} />
              {selectedClubId && <Check className="w-4 h-4 text-primary absolute right-4 top-1/2 -translate-y-1/2" />}
            </div>
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute z-50 w-full top-full mt-2 bg-[#131318] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-56 overflow-y-auto scrollbar-hide">
                  {filteredClubs.length === 0 ? (
                    <div className="p-6 text-center space-y-2">
                      <Building2 className="w-8 h-8 text-white/10 mx-auto" />
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">No clubs found</p>
                    </div>
                  ) : filteredClubs.map(club => (
                    <button key={clubKey(club)} onClick={() => { setSelectedClubId(clubKey(club)); setSearchTerm(clubName(club)); setDropdownOpen(false); }}
                      className={cn('w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left', selectedClubId === clubKey(club) && 'bg-primary/5')}>
                      <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center">
                        {club.venue_image ? <img src={club.venue_image} alt="" className="w-full h-full object-cover" /> : <Building2 className="w-4 h-4 text-white/20" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm font-bold truncate', selectedClubId === clubKey(club) ? 'text-primary' : 'text-white')}>{clubName(club)}</p>
                        <p className="text-[10px] text-white/30 font-bold uppercase flex items-center gap-1"><MapPin className="w-3 h-3" />{clubCity(club) || 'Unknown city'}</p>
                      </div>
                      {selectedClubId === clubKey(club) && <Check className="w-4 h-4 text-primary shrink-0" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Duration</label>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">{duration} day{duration !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setDuration(d => Math.max(1, d - 1))} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-primary transition-all text-white/50">
                <ChevronDown className="w-4 h-4" />
              </button>
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="h-2 bg-primary/20 rounded-full mx-3 my-3 relative">
                  <div className="h-full bg-primary rounded-full transition-all shadow-[0_0_8px_rgba(255,45,154,0.5)]" style={{ width: \`\${(duration / 30) * 100}%\` }} />
                </div>
                <p className="text-center text-xs font-black text-white pb-2">{duration} / 30 days</p>
              </div>
              <button onClick={() => setDuration(d => Math.min(30, d + 1))} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-primary transition-all text-white/50">
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
            <div className="flex justify-between gap-2 mt-1">
              {[3, 7, 14, 30].map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  className={cn('flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all',
                    duration === d ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/5 border-white/5 text-white/30 hover:text-white')}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={!selectedClubId || isSubmitting}
            className={cn('flex-1 py-3 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all',
              (!selectedClubId || isSubmitting) ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98] hover:shadow-primary/40')}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
            Feature Club
          </button>
        </div>
      </motion.div>
    </div>
  );
}
`, 'utf8');
console.log('✅ FeatureClubModal.tsx written');

// ── 2. ClubProfilePreview.tsx ────────────────────────────────────────────────
fs.writeFileSync('src/components/ClubProfilePreview.tsx', `
import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import EventProfilePreview from './EventProfilePreview';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../lib/apiConfig';
import {
  Heart, MapPin, Calendar as CalendarIcon, Clock, X,
  ChevronLeft as ChevronLeftIcon, Users, Activity,
  CalendarDays, ChevronRight as ChevronRightIcon,
  Building2, Star, Phone, Globe, Shield,
} from 'lucide-react';

interface ClubProfilePreviewProps {
  club: any; onClose?: () => void; onEdit?: () => void; hideCloseButton?: boolean;
}

export default function ClubProfilePreview({ club, onClose, onEdit, hideCloseButton }: ClubProfilePreviewProps) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [activeTab, setActiveTab]         = useState<'info' | 'events' | 'gallery'>('info');

  const UPLOADS_BASE = API_BASE.replace(/\\/api\\/v1\\/admin\\/?$/, '/uploads');
  const imgUrl = (f: any) => !f ? '' : (/^https?:\\/\\//i.test(f) ? f : UPLOADS_BASE + '/' + f);

  const data = React.useMemo(() => {
    const b = club || {};
    const cityName = typeof b.city === 'object' && b.city ? (b.city.city_name || '') : (b.city || '');
    return {
      name:        b.venue_name || b.name || 'Unnamed Club',
      coverImg:    imgUrl(b.venue_image || b.business_image || b.portrait_url || b.poster_url || ''),
      tags:        Array.isArray(b.category_ids) ? b.category_ids.map((c: any) => c?.category_name || c).filter(Boolean) : [],
      openDays:    Array.isArray(b.open_days) ? b.open_days : [],
      startTime:   b.start_time || '',
      endTime:     b.end_time   || '',
      city:        cityName,
      address:     b.address || '',
      followers:   String(b.likes || 0),
      capacity:    b.capacity  || 'Not set',
      about:       b.about || b.description || 'No description available.',
      gallery:     (Array.isArray(b.gallery_images) ? b.gallery_images : (Array.isArray(b.landscape_urls) ? b.landscape_urls : [])).filter(Boolean).map(imgUrl),
      phone:       b.phone || b.phone_number || '',
      email:       b.email || '',
      website:     b.website || '',
      isVerified:  !!b.is_verified,
      isActive:    b.is_active !== false,
    };
  }, [club]);

  const { token } = useAuth();
  const vendorId = (club && typeof club.vendor_id === 'object' && club.vendor_id)
    ? (club.vendor_id._id || club.vendor_id.id)
    : (club && (club.vendor_id || club._id || club.id)) || '';

  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['club-upcoming-events', vendorId],
    enabled: Boolean(token && vendorId),
    queryFn: async () => {
      const res = await fetch(API_BASE + '/events/list', { headers: { Authorization: 'Bearer ' + token } });
      if (!res.ok) return [];
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      const vid  = (e: any) => (e && typeof e.vendor_id === 'object' && e.vendor_id) ? (e.vendor_id._id || e.vendor_id.id) : (e && e.vendor_id);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return list
        .filter((e: any) => !e.is_deleted && String(vid(e)) === String(vendorId))
        .filter((e: any) => { const d = new Date(e.end_date || e.start_date); return !isNaN(d.getTime()) && d >= today; })
        .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    },
  });

  const hours = data.startTime && data.endTime ? \`\${data.startTime} – \${data.endTime}\` : (data.startTime || 'Hours not set');
  const daysLabel = data.openDays.length ? data.openDays.join(', ') : 'Days not set';

  return (
    <div className="flex flex-col h-full bg-[#08080c] text-white relative select-none font-sans overflow-hidden">

      {/* Top bar */}
      {!hideCloseButton && (
        <div className="absolute top-0 inset-x-0 h-20 z-50 flex items-center justify-between px-5 pointer-events-none">
          <button onClick={onClose} className="w-11 h-11 bg-black/50 backdrop-blur-xl rounded-2xl flex items-center justify-center pointer-events-auto border border-white/10 hover:bg-black/70 transition-all active:scale-95">
            <ChevronLeftIcon className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2 pointer-events-auto">
            {onEdit && (
              <button onClick={onEdit} className="h-11 px-5 bg-primary rounded-2xl flex items-center gap-2 hover:bg-primary/90 transition-all active:scale-95 text-white text-[10px] font-black uppercase tracking-widest">
                Edit
              </button>
            )}
            <button onClick={onClose} className="w-11 h-11 bg-black/50 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 hover:bg-black/70 transition-all active:scale-95">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide">

        {/* Hero */}
        <div className="relative h-[380px] shrink-0 overflow-hidden">
          {data.coverImg ? (
            <img src={data.coverImg} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#1a0a2e] via-[#0d0d1a] to-[#1a0a10] flex items-center justify-center">
              <Building2 className="w-20 h-20 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-[#08080c]/60 to-transparent" />

          {/* Status badges */}
          <div className="absolute top-6 right-5 flex flex-col gap-2 items-end">
            {data.isVerified && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                <Shield className="w-3 h-3" /> Verified
              </span>
            )}
            <span className={cn('px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border', data.isActive ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400')}>
              {data.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6">
            {data.tags.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {data.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-[0.2em] border border-white/10">{tag}</span>
                ))}
              </div>
            )}
            <h1 className="text-3xl font-black tracking-tight text-white leading-tight">{data.name}</h1>
            {data.city && (
              <p className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 mt-2 uppercase tracking-widest">
                <MapPin className="w-3.5 h-3.5 text-primary" />{data.city}
              </p>
            )}
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 border-b border-white/5">
          {[
            { label: 'Followers', value: data.followers, icon: Heart },
            { label: 'Capacity',  value: data.capacity,  icon: Users },
            { label: 'Events',    value: String(upcomingEvents.length || 0), icon: CalendarIcon },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center py-5 gap-1 border-r border-white/5 last:border-r-0">
              <s.icon className="w-4 h-4 text-primary" />
              <p className="text-base font-black text-white">{s.value}</p>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 px-4 pt-2">
          {(['info', 'events', 'gallery'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 -mb-px',
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-white/30 hover:text-white/60')}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab: Info */}
        <AnimatePresence mode="wait">
          {activeTab === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-5 space-y-5">

              {/* Hours & Days */}
              <div className="grid grid-cols-1 gap-3">
                <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-blue-400" /></div>
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">Open Hours</p>
                    <p className="text-sm font-black text-white">{hours}</p>
                    <p className="text-[10px] text-white/40 mt-0.5">{daysLabel}</p>
                  </div>
                </div>
                {data.address && (
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0"><MapPin className="w-5 h-5 text-purple-400" /></div>
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">Address</p>
                      <p className="text-sm font-black text-white leading-snug">{data.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Contact */}
              {(data.phone || data.email || data.website) && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest">Contact</p>
                  {data.phone   && <div className="flex items-center gap-3 text-sm text-white/70"><Phone  className="w-4 h-4 text-white/30 shrink-0" />{data.phone}</div>}
                  {data.email   && <div className="flex items-center gap-3 text-sm text-white/70"><Activity className="w-4 h-4 text-white/30 shrink-0" />{data.email}</div>}
                  {data.website && <div className="flex items-center gap-3 text-sm text-white/70"><Globe  className="w-4 h-4 text-white/30 shrink-0" />{data.website}</div>}
                </div>
              )}

              {/* About */}
              <div className="space-y-2">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">About</p>
                <p className="text-[13px] text-white/50 leading-relaxed font-medium">{data.about}</p>
              </div>
            </motion.div>
          )}

          {/* Tab: Events */}
          {activeTab === 'events' && (
            <motion.div key="events" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-5 space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <CalendarIcon className="w-10 h-10 text-white/10 mx-auto" />
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">No upcoming events</p>
                </div>
              ) : upcomingEvents.map((event: any, i: number) => (
                <div key={event._id || i} onClick={() => setSelectedEvent(event)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all cursor-pointer group">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
                    {event.venue_image || event.poster_url ? (
                      <img src={event.venue_image || event.poster_url} alt="" className="w-full h-full object-cover" />
                    ) : <CalendarDays className="w-5 h-5 text-white/20 m-auto mt-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate group-hover:text-primary transition-colors">{event.venue_name || event.title}</p>
                    <p className="text-[10px] text-white/30 font-bold uppercase mt-0.5">
                      {event.start_date ? new Date(event.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                    </p>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-white/20 group-hover:text-primary transition-colors shrink-0" />
                </div>
              ))}
            </motion.div>
          )}

          {/* Tab: Gallery */}
          {activeTab === 'gallery' && (
            <motion.div key="gallery" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-5 pb-12">
              {data.gallery.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Building2 className="w-10 h-10 text-white/10 mx-auto" />
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">No gallery images</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {data.gallery.map((img: string, i: number) => (
                    <div key={i} className={cn('rounded-2xl overflow-hidden bg-white/5 border border-white/10', i === 0 ? 'col-span-2 aspect-video' : 'aspect-square')}>
                      <img src={img} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Event drawer */}
      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedEvent(null)} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-black z-[111] shadow-2xl overflow-hidden border-l border-white/5">
              <EventProfilePreview eventData={selectedEvent} onClose={() => setSelectedEvent(null)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
`, 'utf8');
console.log('✅ ClubProfilePreview.tsx written');

console.log('\n✅ All modal files written successfully');
