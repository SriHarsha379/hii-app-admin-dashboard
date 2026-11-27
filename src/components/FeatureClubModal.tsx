
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
  const clubCity    = (c: Club) => {
    if (typeof c.city === 'object' && c.city) return (c.city as any).city_name || '';
    if (typeof (c as any).city_id === 'object' && (c as any).city_id) return (c as any).city_id.city_name || '';
    return (c.city as string) || '';
  };
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
      const matchCity   = selectedCity === 'ALL' || clubCity(c).toLowerCase() === selectedCity.toLowerCase();
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
                  <div className="h-full bg-primary rounded-full transition-all shadow-[0_0_8px_rgba(255,45,154,0.5)]" style={{ width: `${(duration / 30) * 100}%` }} />
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
