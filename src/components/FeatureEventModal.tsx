import React, { useState, useMemo, useRef, useEffect } from 'react';
import { X, Search, ChevronUp, ChevronDown, Star, Loader2, Calendar, MapPin, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { FilterDropdown } from './FilterDropdown';

interface Event {
  id: string;
  title: string;
  city: string;
  date?: string;
  poster_url?: string;
  status?: string;
}

interface City {
  id?: string;
  _id?: string;
  name?: string;
  city_name?: string;
}

interface FeatureEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  cities: City[];
  events: Event[];
  onConfirm: (data: { city: string; eventId: string; duration: number }) => Promise<void>;
  initialEventId?: string;
  initialCity?: string;
}

export function FeatureEventModal({ 
  isOpen, 
  onClose, 
  cities, 
  events, 
  onConfirm,
  initialEventId = '',
  initialCity = 'ALL'
}: FeatureEventModalProps) {
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [duration, setDuration] = useState(7);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedCity(initialCity);
      setSelectedEventId(initialEventId);
      setDuration(7);
      setSearchTerm('');
      
      // If initialEventId is provided, find the event to set search term or just keep it
      if (initialEventId) {
        const event = events.find(e => e.id === initialEventId);
        if (event) setSearchTerm(event.title);
      }
    }
  }, [isOpen, initialCity, initialEventId, events]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

const filteredEvents = useMemo(() => {
  if (!Array.isArray(events)) return [];
  return events.filter(event => {
    if (!event) return false;
    const matchesCity = selectedCity === 'ALL' || (event.city ?? '') === selectedCity;
    const matchesSearch = (event.title ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCity && matchesSearch;
  });
}, [events, selectedCity, searchTerm]);

const selectedEvent = useMemo(() => {
  if (!Array.isArray(events)) return undefined;
  return events.find(e => (e._id || e.id) === selectedEventId);
}, [events, selectedEventId]);

  const handleConfirm = async () => {
    if (!selectedEventId || duration < 1) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm({
        city: selectedCity,
        eventId: selectedEventId,
        duration
      });
      onClose();
    } catch (error) {
      console.error('Failed to feature event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const incrementDuration = () => setDuration(prev => Math.min(30, prev + 1));
  const decrementDuration = () => setDuration(prev => Math.max(1, prev - 1));

  const cityOptions = useMemo(() => [
    { label: 'All Cities', value: 'ALL' },
    ...(cities?.map((c: any) => ({ label: c.city_name ?? c.name, value: c.city_name ?? c.name })) || [])
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
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Feature Event</h3>
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
                setSelectedEventId('');
                setSearchTerm('');
              }}
              options={cityOptions}
              buttonClassName="py-3 px-4 rounded-xl text-sm"
            />
          </div>

          {/* Event Selection */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select Event</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsSearchFocused(true);
                  if (selectedEventId) setSelectedEventId('');
                }}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search event..."
                className={cn(
                  "w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:bg-white/[0.07]",
                  selectedEventId && "border-primary/50 bg-primary/5"
                )}
              />
              {selectedEventId && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>

            {/* Event Dropdown Results */}
            <AnimatePresence>
              {isSearchFocused && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 w-full mt-2 bg-[#1A1A24] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto scrollbar-hide"
                >
                  {filteredEvents.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <Search className="w-8 h-8 text-muted-foreground/20 mx-auto" />
                      <p className="text-xs text-muted-foreground">No events found in {selectedCity === 'ALL' ? 'any city' : selectedCity}</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {!searchTerm && (
                        <div className="px-4 py-2 mb-1 border-b border-white/5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Recent Events</p>
                        </div>
                      )}
                      {filteredEvents.map((event) => (
                        <button
                          key={event.id}
onClick={() => {
  setSelectedEventId(event._id || event.id);  // ← was just event.id
  setSearchTerm(event.title);
  setIsSearchFocused(false);
}}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left",
                            selectedEventId === event.id && "bg-primary/5"
                          )}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                            <img 
                              src={event.poster_url || `https://picsum.photos/seed/${event.id}/100/100`} 
                              alt="" 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-bold truncate",
                              selectedEventId === event.id ? "text-primary" : "text-white"
                            )}>
                              {event.title}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase font-bold">
                              <MapPin className="w-3 h-3" />
                              {event.city}
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
                <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="number"
                  value={duration}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val)) setDuration(Math.min(30, Math.max(1, val)));
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:bg-white/[0.07]"
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
            <p className="text-[10px] text-muted-foreground">Select how long the event should stay featured</p>
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
            disabled={!selectedEventId || isSubmitting}
            className={cn(
              "flex-1 py-3 rounded-xl bg-primary text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,45,154,0.3)]",
              (!selectedEventId || isSubmitting) ? "opacity-50 cursor-not-allowed shadow-none" : "hover:scale-[1.02] hover:shadow-primary/40 active:scale-[0.98]"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Star className="w-4 h-4" />
            )}
            Feature Event
          </button>
        </div>
      </motion.div>
    </div>
  );
}
