import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, ChevronUp, ChevronDown, Star, Loader2, MapPin, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { FilterDropdown } from './FilterDropdown';

interface Club {
  _id?: string;
  id?: string;
  venue_name?: string;
  name?: string;
  city?: any;
  venue_image?: string;
}

interface City {
  id?: string;
  _id?: string;
  name?: string;
  city_name?: string;
}

interface FeatureClubModalProps {
  isOpen: boolean;
  onClose: () => void;
  cities: City[];
  clubs: Club[];
  onConfirm: (data: { city: string; clubId: string; duration: number }) => Promise<void>;
  initialClubId?: string;
  initialCity?: string;
}

// Mirrors FeatureEventModal — same select-city / search-club / duration
// flow, adapted for venues/clubs (which previously had no way to be
// featured from admin at all).
export function FeatureClubModal({
  isOpen,
  onClose,
  cities,
  clubs,
  onConfirm,
  initialClubId = '',
  initialCity = 'ALL'
}: FeatureClubModalProps) {
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedClubId, setSelectedClubId] = useState(initialClubId);
  const [duration, setDuration] = useState(7);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const clubName = (c: Club) => c.venue_name || c.name || 'Untitled Club';
  const clubCityName = (c: Club) => typeof c.city === 'object' ? c.city?.city_name : c.city;
  const clubKey = (c: Club) => c._id || c.id || '';

  useEffect(() => {
    if (isOpen) {
      setSelectedCity(initialCity);
      setSelectedClubId(initialClubId);
      setDuration(7);
      setSearchTerm('');

      if (initialClubId) {
        const club = clubs.find(c => clubKey(c) === initialClubId);
        if (club) setSearchTerm(clubName(club));
      }
    }
  }, [isOpen, initialCity, initialClubId, clubs]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClubs = useMemo(() => {
    if (!Array.isArray(clubs)) return [];
    return clubs.filter(club => {
      if (!club) return false;
      const matchesCity = selectedCity === 'ALL' || (clubCityName(club) ?? '') === selectedCity;
      const matchesSearch = clubName(club).toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCity && matchesSearch;
    });
  }, [clubs, selectedCity, searchTerm]);

  const handleConfirm = async () => {
    if (!selectedClubId || duration < 1) return;

    setIsSubmitting(true);
    try {
      await onConfirm({
        city: selectedCity,
        clubId: selectedClubId,
        duration
      });
      onClose();
    } catch (error) {
      console.error('Failed to feature club:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const incrementDuration = () => setDuration(prev => Math.min(30, prev + 1));
  const decrementDuration = () => setDuration(prev => Math.max(1, prev - 1));

  const cityOptions = useMemo(() => [
    { label: 'All Cities', value: 'ALL' },
    ...(cities?.slice().sort((a: any, b: any) => (a.city_name ?? a.name ?? '').localeCompare(b.city_name ?? b.name ?? '')).map((c: any) => ({ label: c.city_name ?? c.name, value: c.city_name ?? c.name })) || [])
  ], [cities]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="glass-card w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Feature Club</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-all text-muted-foreground hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* City Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select City</label>
            <FilterDropdown
              value={selectedCity}
              onChange={(val) => {
                setSelectedCity(val);
                setSelectedClubId('');
                setSearchTerm('');
              }}
              options={cityOptions}
              buttonClassName="py-3 px-4 rounded-xl text-sm"
            />
          </div>

          {/* Club Selection */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Club</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchFocused(true);
                  if (selectedClubId) setSelectedClubId('');
                }}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search club..."
                className={cn(
                  "w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:bg-white/[0.07]",
                  selectedClubId && "border-primary/50 bg-primary/5"
                )}
              />
              {selectedClubId && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>

            {/* Club Dropdown Results */}
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full mt-2 bg-[#1A1A24] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto scrollbar-hide"
                >
                  {filteredClubs.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <Search className="w-8 h-8 text-muted-foreground/20 mx-auto" />
                      <p className="text-xs text-muted-foreground">No clubs found in {selectedCity === 'ALL' ? 'any city' : selectedCity}</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {!searchTerm && (
                        <div className="px-4 py-2 mb-1 border-b border-white/5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">All Clubs</p>
                        </div>
                      )}
                      {filteredClubs.map((club) => (
                        <button
                          key={clubKey(club)}
                          onClick={() => {
                            setSelectedClubId(clubKey(club));
                            setSearchTerm(clubName(club));
                            setIsSearchFocused(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left",
                            selectedClubId === clubKey(club) && "bg-primary/5"
                          )}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                            <img
                              src={club.venue_image || `https://picsum.photos/seed/${clubKey(club)}/100/100`}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-bold truncate",
                              selectedClubId === clubKey(club) ? "text-primary" : "text-white"
                            )}>
                              {clubName(club)}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold">
                              <MapPin className="w-3 h-3" />
                              {clubCityName(club) || 'Unknown city'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Duration Stepper */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Duration (Days)</label>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Max 30 Days</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setDuration(Math.min(30, Math.max(1, val)));
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:bg-white/[0.07]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={incrementDuration}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-primary transition-all"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={decrementDuration}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-primary transition-all"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Select how long the club should stay featured</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/5 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedClubId || isSubmitting}
            className={cn(
              "flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,45,154,0.3)]",
              (!selectedClubId || isSubmitting) ? "opacity-50 cursor-not-allowed shadow-none" : "hover:scale-[1.02] hover:shadow-primary/40 active:scale-[0.98]"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Star className="w-4 h-4" />
            )}
            Feature Club
          </button>
        </div>
      </motion.div>
    </div>
  );
}