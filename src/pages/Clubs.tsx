import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  TrendingUp, 
  TrendingDown,
  Mail,
  Bell,
  MessageSquare,
  Send,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Calendar,
  BarChart2,
  Trophy,
  Zap,
  MessageCircle,
  FileText,
  User,
  ChevronRight,
  Shield,
  Activity,
  ArrowRight,
  Database,
  Lock,
  Eye,
  Settings,
  UserPlus,
  Layout as LayoutIcon,
  MousePointer2,
  Loader2,
  Check,
  Info,
  Image,
  Star,
  MapPin,
  Building2,
  Phone,
  Globe,
  Fingerprint,
  Instagram,
  Download,
  Heart,
  Share2,
  ChevronLeft,
  ArrowLeft,
  X,
  Share,
  Wallet,
  Edit2,
  Trash2,
  BarChart3,
  Ticket,
  UserCheck,
  Upload,
  Layers,
  Sparkles,
  Camera
} from 'lucide-react';
import { cn } from '../lib/utils';
import { FilterDropdown } from '../components/FilterDropdown';
import { FilterPanel } from '../components/FilterPanel';
import { FormSection, RefinedField } from '../components/RefinedForm';
import { MultiSelectDropdown } from '../components/MultiSelectDropdown';
import { motion, AnimatePresence } from 'motion/react';
import ClubProfilePreview from '../components/ClubProfilePreview';
import EventProfilePreview from '../components/EventProfilePreview';

const statusColors: any = {
  'ACTIVE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'PENDING': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'INACTIVE': 'bg-red-500/10 text-red-400 border-red-500/20',
  'SUSPENDED': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

export default function Clubs() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { setIsClubProfileOpen } = useOutletContext<{ setIsClubProfileOpen: (open: boolean) => void }>();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCity, setFilterCity] = useState('ALL');
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [isCreatingClub, setIsCreatingClub] = useState(false);
  const [isViewingVenue, setIsViewingVenue] = useState(false);
  const [modalCity, setModalCity] = useState('');
  const [modalVenueType, setModalVenueType] = useState('');
  const [venueStep, setVenueStep] = useState(1);
  const [venueFormData, setVenueFormData] = useState<any>({
    name: '',
    type: '',
    email: '',
    capacity: '',
    contactName: '',
    phone: '',
    description: '',
    city: '',
    address: '',
    landscape_urls: [''],
    portrait_url: '',
  });
  const [workingHours, setWorkingHours] = useState<any[]>([
    { day: 'Monday', time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Tuesday', time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Wednesday', time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Thursday', time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Friday', time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Saturday', time: '10:00 PM - 04:00 AM', active: false },
    { day: 'Sunday', time: '10:00 PM - 04:00 AM', active: false },
  ]);
  const [lastUsedTime, setLastUsedTime] = useState('10:00 PM - 04:00 AM');

  // Stats for Club Admin
  const [activeEventsTab, setActiveEventsTab] = useState<'Upcoming' | 'Past' | 'Active'>('Upcoming');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [creationStep, setCreationStep] = useState(1);
  const [eventFormData, setEventFormData] = useState<any>({
    title: '',
    city: '',
    venue_id: '',
    genre: [],
    event_type: [],
    date: '',
    start_time: '',
    end_time: '',
    description: '',
    poster_url: '',
    landscape_urls: [''],
    ticketing_link: '',
  });

  const handleEditEvent = (event: any) => {
    setEventFormData({
      title: event.title || '',
      city: event.city || clubData?.city || '',
      venue_id: event.venue_id || clubData?.id || '',
      genre: Array.isArray(event.genre) ? event.genre : (event.category ? [event.category] : []),
      event_type: Array.isArray(event.event_type) ? event.event_type : [],
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      start_time: '22:00',
      end_time: '04:00',
      description: event.description || '',
      poster_url: event.poster_url || event.imageUrl || '',
      landscape_urls: event.landscape_urls || [event.imageUrl || ''],
      ticketing_link: event.ticketing_link || '',
    });
    setIsEditingEvent(true);
    setIsCreatingEvent(true);
    setCreationStep(1);
    setSelectedEvent(null);
  };

  const { data: clubs, isLoading } = useQuery({
    queryKey: ['clubs'],
    queryFn: async () => {
      const res = await fetch('/api/clubs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  // For Club Admin: Find their own club
  const clubData = Array.isArray(clubs) ? clubs.find((c: any) => c.name === user?.organisation) : null;

  const DUMMY_EVENTS = [
    {
      id: 'dummy-1',
      title: 'Neon Nights Vol. 4',
      date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
      category: 'Techno',
      genre: ['Techno'],
      event_type: ['DJ Night'],
      status: 'ACTIVE',
      attendees: 156,
      venue_id: clubData?.id,
      venue: clubData?.name,
      imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80'
    },
    {
      id: 'dummy-2',
      title: 'Summer Solstice',
      date: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
      category: 'House',
      genre: ['House'],
      event_type: ['Sundowner'],
      status: 'ACTIVE',
      attendees: 89,
      venue_id: clubData?.id,
      venue: clubData?.name,
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80'
    },
    {
      id: 'dummy-3',
      title: 'Past Groove Night',
      date: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
      category: 'Commercial',
      genre: ['Commercial'],
      event_type: ['Theme Party'],
      status: 'PAST',
      attendees: 210,
      venue_id: clubData?.id,
      venue: clubData?.name,
      imageUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&q=80'
    }
  ];

  const { data: events } = useQuery({
    queryKey: ['events-admin'],
    queryFn: async () => {
      const res = await fetch('/api/events', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      return Array.isArray(data) ? [...data, ...DUMMY_EVENTS] : DUMMY_EVENTS;
    }
  });

  const clubEvents = Array.isArray(events) ? events.filter((e: any) => e.club_id === clubData?.id || e.venue === clubData?.name) : [];

  const filteredClubEvents = clubEvents.filter((e: any) => {
    const now = new Date();
    const eventDate = new Date(e.date);
    if (activeEventsTab === 'Upcoming') return eventDate >= now;
    if (activeEventsTab === 'Past') return eventDate < now;
    if (activeEventsTab === 'Active') return e.status === 'ACTIVE'; // Or some real-time logic
    return true;
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await fetch('/api/cities', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const { data: venueTypes } = useQuery({
    queryKey: ['venueTypes'],
    queryFn: async () => {
      const res = await fetch('/api/venueTypes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const { data: genres } = useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const res = await fetch('/api/genres', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const { data: eventTypes } = useQuery({
    queryKey: ['eventTypes'],
    queryFn: async () => {
      const res = await fetch('/api/eventTypes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  const toggleDay = (index: number) => {
    const newHours = [...workingHours];
    const isActive = !newHours[index].active;
    newHours[index].active = isActive;
    if (isActive) newHours[index].time = lastUsedTime;
    setWorkingHours(newHours);
  };

  const updateDayTime = (index: number, time: string) => {
    const newHours = [...workingHours];
    newHours[index].time = time;
    setLastUsedTime(time);
    setWorkingHours(newHours);
  };

  const filteredClubs = (Array.isArray(clubs) ? clubs : [])?.filter((c: any) => {
    const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesCity = filterCity === 'ALL' || c.city === filterCity;
    return matchesSearch && matchesStatus && matchesCity;
  });

  const exportData = () => {
    console.log('Exporting data...', filteredClubs);
  };

  if (user?.role === 'CLUB_ADMIN') {
    return (
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Venue <span className="text-primary neon-text">Management</span></h2>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
              <Calendar className="w-3 h-3" />
              Manage and monitor your venues
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
               onClick={() => navigate('/club-profile')}
               className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
             >
               <Eye className="w-4 h-4" />
               View Profile
             </button>
             <button 
               onClick={() => {
                 setEventFormData({
                   ...eventFormData,
                   venue_id: clubData?.id || '',
                   city: clubData?.city || '',
                 });
                 setIsCreatingEvent(true);
                 setIsEditingEvent(false);
                 setCreationStep(1);
               }}
               className="px-6 py-3 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
             >
               <Plus className="w-4 h-4" />
               Create Event
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 items-start">
          {/* Main Content: Stats & Events */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Upcoming Events', value: '42', icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                { label: 'Follower Growth', value: '+15.2%', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                { label: 'Profile Views', value: '1.2k', icon: Eye, color: 'text-purple-400', bg: 'bg-purple-400/10' },
              ].map((stat) => (
                <div key={stat.label} className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.02]">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black text-white mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-[32px] border border-white/5 overflow-hidden">
               <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div className="space-y-1">
                   <h3 className="text-lg font-black text-white tracking-widest uppercase">Event Management</h3>
                   <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Manage all your events</p>
                 </div>
                 <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
                   {['Upcoming', 'Live', 'Past'].map((tab: any) => (
                     <button
                       key={tab}
                       onClick={() => setActiveEventsTab(tab as any)}
                       className={cn(
                         "px-6 py-2.5 rounded-xl text-xs font-bold transition-all uppercase tracking-widest",
                         activeEventsTab === tab ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
                       )}
                     >
                       {tab}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="p-2">
                 <div className="grid gap-2">
                    {filteredClubEvents.length > 0 ? filteredClubEvents.map((event: any) => (
                      <div key={event.id} 
                        onClick={() => {
                          setSelectedEvent(event);
                          setIsPreviewing(true);
                        }}
                        className="p-4 rounded-2xl hover:bg-white/[0.03] transition-all flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0">
                            <img src={event.imageUrl || `https://picsum.photos/seed/${event.id}/300/400`} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-white group-hover:text-primary transition-colors">{event.title}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                                <Calendar className="w-3 h-3 text-primary" />
                                {new Date(event.date).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase">
                                <Users className="w-3 h-3 text-secondary" />
                                {event.attendees || 0} RSVPs
                              </span>
                            </div>
                            <div className="flex gap-2 mt-3">
                               <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-black uppercase border border-primary/20">{event.category}</span>
                               <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase border", statusColors[event.status] || 'bg-white/5 border-white/10 text-white/50')}>{event.status}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           {activeEventsTab === 'Past' ? (
                             <>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   // Analytics logic
                                   setSelectedEvent({...event, showAnalytics: true});
                                 }}
                                 className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-[10px] font-bold uppercase border border-primary/20 hover:bg-primary hover:text-white transition-all flex items-center gap-2"
                               >
                                 <BarChart3 className="w-3 h-3" />
                                 Analytics
                               </button>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setSelectedEvent(event);
                                   setIsPreviewing(true);
                                 }}
                                 className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all border border-white/5"
                               >
                                 <Eye className="w-4 h-4" />
                               </button>
                             </>
                           ) : (
                             <>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleEditEvent(event);
                                 }}
                                 className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
                               >
                                 <Edit2 className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   // Delete logic
                                 }}
                                 className="p-2 rounded-xl bg-white/5 text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-all"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </>
                           )}
                        </div>
                      </div>
                    )) : (
                      <div className="p-12 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                          <Calendar className="w-8 h-8 text-muted-foreground opacity-20" />
                        </div>
                        <p className="text-muted-foreground font-black uppercase text-[10px] tracking-widest leading-none">No {activeEventsTab.toLowerCase()} broadcast found</p>
                        <button className="text-primary font-black text-xs hover:underline uppercase tracking-widest leading-none">Create an event now</button>
                      </div>
                    )}
                 </div>
               </div>
            </div>
          </div>


        </div>

        {/* Create Event Modal for Club Admin */}
        <AnimatePresence>
          {isCreatingEvent && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card w-full max-w-3xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
              >
                <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(255,45,154,0.1)]">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">
                        {isEditingEvent ? 'Edit' : 'Create'} <span className="text-primary neon-text">Event</span>
                      </h3>
                      <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Step {creationStep} of 3</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setIsCreatingEvent(false);
                      setIsEditingEvent(false);
                    }} 
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-10 lg:p-12 scrollbar-hide">
                  {/* Stepper */}
                  <div className="flex items-center justify-between mb-16 relative px-4">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full z-0"></div>
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-700 shadow-[0_0_15px_rgba(255,45,154,0.5)]" style={{ width: `${((creationStep - 1) / 2) * 100}%` }}></div>
                    
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="relative z-10 flex flex-col items-center gap-4">
                        <div className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black border-2 transition-all duration-500",
                          creationStep >= step 
                            ? "bg-primary border-primary text-white shadow-[0_0_30px_rgba(255,45,154,0.3)] scale-110" 
                            : "bg-[#09090B] border-white/5 text-white/20"
                        )}>
                          {creationStep > step ? <Check className="w-6 h-6 stroke-[3px]" /> : step}
                        </div>
                        <span className={cn(
                          "text-[10px] uppercase font-black tracking-[0.2em] absolute -bottom-10 w-32 text-center transition-colors duration-500",
                          creationStep >= step ? "text-primary" : "text-white/20"
                        )}>
                          {step === 1 ? 'Details' : step === 2 ? 'Visuals' : 'Tickets'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8">
                    <AnimatePresence mode="wait">
                    {creationStep === 1 && (
                      <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-10"
                      >
                        <FormSection title="Event Details" icon={<Sparkles className="w-4 h-4" />}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="col-span-1 md:col-span-2">
                              <RefinedField 
                                label="Event Name" 
                                name="title"
                                value={eventFormData.title}
                                onChange={(e: any) => setEventFormData({ ...eventFormData, title: e.target.value })}
                                placeholder="e.g. Midnight Eclipse"
                                icon={<Zap className="w-4 h-4" />}
                              />
                            </div>
                            <div className="space-y-4 group/field">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Music Genre</label>
                              <MultiSelectDropdown
                                options={genres?.map((genre: any) => ({ label: genre.name, value: genre.name })) || []}
                                value={eventFormData.genre}
                                onChange={(value) => setEventFormData({ ...eventFormData, genre: value })}
                                placeholder="Select genres"
                              />
                            </div>
                            <div className="space-y-4 group/field">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Event Type</label>
                              <MultiSelectDropdown
                                options={eventTypes?.map((type: any) => ({ label: type.name, value: type.name })) || []}
                                value={eventFormData.event_type}
                                onChange={(value) => setEventFormData({ ...eventFormData, event_type: value })}
                                placeholder="Select event types"
                              />
                            </div>
                            <RefinedField 
                              label="Event Date" 
                              name="date"
                              type="date"
                              value={eventFormData.date}
                              onChange={(e: any) => setEventFormData({ ...eventFormData, date: e.target.value })}
                              icon={<Calendar className="w-4 h-4" />}
                            />
                            <RefinedField 
                              label="Start Time" 
                              name="start_time"
                              type="time"
                              value={eventFormData.start_time}
                              onChange={(e: any) => setEventFormData({ ...eventFormData, start_time: e.target.value })}
                              icon={<Clock className="w-4 h-4" />}
                            />
                          </div>
                        </FormSection>

                        <FormSection title="Description" icon={<FileText className="w-4 h-4" />}>
                          <div className="space-y-4 group/field">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">About the Event</label>
                            <textarea 
                              rows={5}
                              value={eventFormData.description}
                              onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                              className="w-full bg-[#09090B] border border-white/5 rounded-[32px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 resize-none font-medium placeholder:text-white/10"
                              placeholder="Describe the atmosphere..."
                            ></textarea>
                          </div>
                        </FormSection>
                      </motion.div>
                    )}

                    {creationStep === 2 && (
                      <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-12"
                      >
                        <FormSection title="Event Images" icon={<Camera className="w-4 h-4" />}>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Event Poster (4:5)</label>
                              <div className="aspect-[4/5] rounded-[32px] bg-[#09090B] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/[0.04] hover:border-primary/40 cursor-pointer group shadow-inner">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover:text-primary group-hover:scale-110 group-hover:rotate-6 transition-all">
                                  <Upload className="w-7 h-7" />
                                </div>
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] group-hover:text-primary transition-colors">Upload Poster</span>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Header Image (16:9)</label>
                              <div className="aspect-video rounded-[32px] bg-[#09090B] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/[0.04] hover:border-blue-400/40 cursor-pointer group shadow-inner">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover:text-blue-400 group-hover:scale-110 group-hover:-rotate-6 transition-all">
                                  <Upload className="w-7 h-7" />
                                </div>
                                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] group-hover:text-blue-400 transition-colors">Upload Banner</span>
                              </div>
                            </div>
                          </div>
                        </FormSection>
                      </motion.div>
                    )}

                    {creationStep === 3 && (
                      <motion.div 
                        key="step3"
                        initial={{ opacity: 0, x: 20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-10"
                      >
                        <FormSection title="Tickets" icon={<Shield className="w-4 h-4" />}>
                          <div className="p-8 rounded-[40px] bg-primary/5 border border-primary/10 space-y-8 relative overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] to-transparent pointer-events-none" />
                             <div className="flex items-center justify-between relative z-10">
                                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Ticket Link</h4>
                                <button className="text-[9px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors">Skip for now</button>
                             </div>
                             <div className="space-y-6 relative z-10">
                                <RefinedField 
                                  label="Ticket URL" 
                                  name="ticketing_link"
                                  value={eventFormData.ticketing_link}
                                  onChange={(e: any) => setEventFormData({ ...eventFormData, ticketing_link: e.target.value })}
                                  placeholder="https://ticket-link.com/..."
                                  icon={<Globe className="w-4 h-4" />}
                                />
                             </div>
                          </div>
                        </FormSection>
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="p-10 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
                  <button 
                    onClick={() => setCreationStep(prev => Math.max(1, prev - 1))}
                    disabled={creationStep === 1}
                    className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-4 disabled:opacity-30 active:scale-95 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                  <button 
                    onClick={() => {
                      if (creationStep < 3) {
                        setCreationStep(prev => prev + 1);
                      } else {
                        setIsCreatingEvent(false);
                        setIsEditingEvent(false);
                      }
                    }}
                    className="px-14 py-5 rounded-[24px] bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4 group"
                  >
                    {creationStep === 3 ? (isEditingEvent ? 'Save' : 'Create') : 'Next'}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Back Button for Event Detail */}
        <AnimatePresence>
          {selectedEvent && !isCreatingEvent && isPreviewing && !selectedEvent.showAnalytics && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => {
                setSelectedEvent(null);
                setIsPreviewing(false);
              }}
              className="fixed top-8 left-8 z-[200] w-14 h-14 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-black/60 hover:border-primary/50 transition-all group active:scale-95 shadow-2xl"
            >
              <ChevronLeft className="w-7 h-7 group-hover:-translate-x-1 transition-transform" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Event Combined View for Club Admin */}
        <AnimatePresence>
          {selectedEvent && !isCreatingEvent && isPreviewing && !selectedEvent.showAnalytics && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setSelectedEvent(null);
                  setIsPreviewing(false);
                }}
                className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110]"
              />

              {/* Popup Modal */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="fixed inset-0 z-[120] flex items-center justify-center p-4 lg:pr-[420px] pointer-events-none"
              >
                <motion.div className="w-full max-w-4xl bg-[#0F0F12] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl flex flex-col pointer-events-auto">
                  {/* Header */}
                  <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Event Details</h3>
                  </div>

                  <div className="p-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      {/* Left Column */}
                      <div className="space-y-8 text-left">
                        <div className="aspect-[16/10] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
                          <img 
                            src={selectedEvent.imageUrl || `https://picsum.photos/seed/${selectedEvent.id}/800/600`} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="space-y-4">
                          <h2 className="text-4xl font-black text-white tracking-tight leading-none">{selectedEvent.title}</h2>
                          <div className="flex gap-3">
                            <span className="px-4 py-1.5 rounded-full bg-[#FF2D9A]/10 text-[#FF2D9A] text-[10px] font-black uppercase border border-[#FF2D9A]/20 tracking-widest whitespace-nowrap">
                              {selectedEvent.category || 'Techno'}
                            </span>
                            <span className="px-4 py-1.5 rounded-full bg-white/5 text-white/50 text-[10px] font-black uppercase border border-white/10 tracking-widest whitespace-nowrap">
                              {selectedEvent.city || clubData?.city || 'Mumbai'}
                            </span>
                          </div>
                          <p className="text-sm text-white/40 leading-relaxed font-medium">
                            {selectedEvent.description || "Get ready for a night of bass heavy beats and neon lights. We're bringing some of the best techno and EDM DJs to the city for an unforgettable experience."}
                          </p>
                        </div>

                        <div className="flex gap-4 pt-4">
                          {activeEventsTab === 'Past' ? (
                            <>
                              <button 
                                onClick={() => setSelectedEvent({ ...selectedEvent, showAnalytics: true })}
                                className="flex-1 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/[0.08] transition-all text-xs flex items-center justify-center gap-2"
                              >
                                <BarChart3 className="w-4 h-4" />
                                View Analytics
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleEditEvent(selectedEvent)}
                                className="flex-1 py-4 rounded-2xl bg-white/[0.03] border border-white/10 text-white font-bold uppercase tracking-widest hover:bg-white/[0.08] transition-all text-xs"
                              >
                                Edit Event
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right Column */}
                      <div className="space-y-4">
                        {/* Date Card */}
                        <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-[#FF2D9A]/10 flex items-center justify-center text-[#FF2D9A]">
                            <Calendar className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Date</p>
                            <p className="text-lg font-bold text-white leading-none">
                              {new Date(selectedEvent.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        {/* Time Card */}
                        <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-[#2D9AFF]/10 flex items-center justify-center text-[#2D9AFF]">
                            <Clock className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Time</p>
                            <p className="text-lg font-bold text-white leading-none">10:00 PM – 04:00 AM</p>
                          </div>
                        </div>

                        {/* Venue Card */}
                        <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-[#2DFF9A]/10 flex items-center justify-center text-[#2DFF9A]">
                            <MapPin className="w-7 h-7" />
                          </div>
                          <div>
                            <p className="text-[10px] text-white/30 uppercase font-black tracking-widest mb-1">Venue</p>
                            <p className="text-lg font-bold text-white leading-none truncate max-w-[180px]">
                              {selectedEvent.venue || clubData?.name || 'Underground Beats'}
                            </p>
                          </div>
                        </div>

                        {/* Attendance Card */}
                        <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-[#2D0A1A] to-[#1A0A2D] border border-white/5 mt-6 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF2D9A]/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-[#FF2D9A]/20 transition-all duration-700" />
                          <div className="flex items-center justify-between relative z-10">
                            <div className="space-y-4">
                              <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Attendance</p>
                              <div className="flex flex-col">
                                <span className="text-4xl font-black text-white leading-none">0</span>
                              </div>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                              <Users className="w-8 h-8" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
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
                  onClose={() => {
                    setSelectedEvent(null);
                    setIsPreviewing(false);
                  }}
                  hideCloseButton
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight leading-none uppercase">Clubs & <span className="text-primary neon-text">Venues</span></h2>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
            <Building2 className="w-3 h-3" />
            Manage all club partners across cities
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportData} className="px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            <Download className="w-3.5 h-3.5" />
            Export Data
          </button>
          <button 
            onClick={() => { 
              setSelectedClub(null); 
              setModalCity('');
              setModalVenueType('');
              setVenueFormData({
                name: '',
                type: '',
                email: '',
                capacity: '',
                contactName: '',
                phone: '',
                description: '',
                city: '',
                address: '',
                landscape_urls: [''],
                portrait_url: '',
              });
              setVenueStep(1);
              setIsCreatingClub(true); 
            }}
            className="px-6 py-3 rounded-2xl bg-gradient-to-br from-primary to-purple-600 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New Club
          </button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {[
          { label: 'Total Clubs', value: Array.isArray(clubs) ? clubs.length : '0', icon: Building2, color: 'text-blue-400', bg: 'bg-blue-400/10' },
          { label: 'Active Clubs', value: (Array.isArray(clubs) ? clubs : []).filter((c: any) => c.status === 'ACTIVE').length || '0', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Avg Rating', value: '4.8/5', icon: Star, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'New Users', value: '+1.2k', icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
          { label: 'Total Followers', value: '24.5k', icon: Database, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
          { label: 'Club Staff', value: '480', icon: Shield, color: 'text-zinc-400', bg: 'bg-zinc-400/10' },
          { label: 'Total Revenue', value: '$128k', icon: Wallet, color: 'text-pink-400', bg: 'bg-pink-400/10' },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-5 rounded-[2rem] border border-white/10 flex flex-col gap-3 hover:border-white/20 transition-all group">
            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-xl font-black text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Clubs Grid */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Club List</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <div className="relative flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search clubs..." 
                className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'grid' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
              )}
            >
              <LayoutIcon className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-lg transition-all",
                viewMode === 'table' ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-white"
              )}
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
          <FilterPanel>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">City</label>
                <FilterDropdown
                  value={filterCity}
                  onChange={setFilterCity}
                  options={[
                    { label: 'All Cities', value: 'ALL' },
                    { label: 'Mumbai', value: 'Mumbai' },
                    { label: 'Delhi', value: 'Delhi' },
                    { label: 'Bangalore', value: 'Bangalore' },
                    { label: 'Goa', value: 'Goa' },
                  ]}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</label>
                <FilterDropdown
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={[
                    { label: 'All Status', value: 'ALL' },
                    { label: 'Active', value: 'ACTIVE' },
                    { label: 'Inactive', value: 'INACTIVE' },
                    { label: 'Pending', value: 'PENDING' },
                    { label: 'Banned', value: 'BANNED' },
                  ]}
                />
              </div>
            </FilterPanel>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">Loading clubs...</div>
            ) : filteredClubs.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-muted-foreground">No clubs found.</div>
            ) : filteredClubs.map((club: any) => (
              <motion.div 
                key={club.id}
                whileHover={{ y: -5 }}
                className="glass-card rounded-2xl border border-white/10 overflow-hidden group cursor-pointer"
                onClick={() => {
                  setSelectedClub(club);
                  setIsViewingVenue(true);
                }}
              >
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={`https://picsum.photos/seed/${club.id}/800/450`} 
                    alt={club.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute top-4 right-4">
                    <span className={cn("text-[10px] px-2 py-1 rounded-full font-bold border backdrop-blur-md", statusColors[club.status] || statusColors.ACTIVE)}>
                      {club.status || 'ACTIVE'}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h4 className="text-lg font-bold text-white truncate group-hover:text-primary transition-colors">{club.name}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {club.address || club.city || 'Mumbai, India'}
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span className="text-xs font-bold">4.8</span>
                      <span className="text-[10px] text-muted-foreground font-medium">(1.2k reviews)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Followers</p>
                        <p className="text-xs font-bold text-white">24.8k</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex gap-2">
                      <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-muted-foreground uppercase">Nightclub</span>
                      <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-muted-foreground uppercase">Lounge</span>
                    </div>
                    <button className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-all">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5 font-black">
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Club / Category</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Location</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Stats</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">Loading clubs...</td>
                    </tr>
                  ) : filteredClubs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-xs text-muted-foreground">No clubs found.</td>
                    </tr>
                  ) : filteredClubs.map((club: any) => (
                    <tr key={club.id} className="group hover:bg-white/5 transition-colors cursor-pointer" onClick={() => {
                      setSelectedClub(club);
                      setIsViewingVenue(true);
                    }}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10">
                            <img src={`https://picsum.photos/seed/${club.id}/100/100`} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-primary transition-colors">{club.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Nightclub</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-white">{club.city || 'Mumbai'}</p>
                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{club.address || 'India'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Rating</p>
                            <p className="text-xs font-bold text-white">4.8</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Followers</p>
                            <p className="text-xs font-bold text-white">24.8k</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("text-[10px] px-2 py-1 rounded-full font-bold border", statusColors[club.status] || statusColors.ACTIVE)}>
                          {club.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Venue Preview Side Panel */}
      <AnimatePresence>
        {isViewingVenue && selectedClub && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsViewingVenue(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 h-full w-full max-w-[420px] bg-black z-[111] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border-l border-white/5"
            >
              <ClubProfilePreview 
                onClose={() => setIsViewingVenue(false)}
                club={selectedClub} 
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create/Edit Club Modal */}
      {isCreatingClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card w-full max-w-3xl rounded-[40px] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
            <div className="p-8 lg:p-10 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_20px_rgba(255,45,154,0.1)]">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {selectedClub ? 'Edit' : 'Add New'} <span className="text-primary neon-text">Club</span>
                  </h3>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.2em]">Step {venueStep}/3</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreatingClub(false)} 
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all border border-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 lg:p-12 scrollbar-hide">
              {/* Stepper */}
              <div className="flex items-center justify-between mb-16 relative px-4">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 rounded-full z-0"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-700 shadow-[0_0_15px_rgba(255,45,154,0.5)]" style={{ width: `${((venueStep - 1) / 2) * 100}%` }}></div>
                
                {[1, 2, 3].map((step) => (
                  <div key={step} className="relative z-10 flex flex-col items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black border-2 transition-all duration-500",
                      venueStep >= step 
                        ? "bg-primary border-primary text-white shadow-[0_0_30px_rgba(255,45,154,0.3)] scale-110" 
                        : "bg-[#09090B] border-white/5 text-white/20"
                    )}>
                      {venueStep > step ? <Check className="w-6 h-6 stroke-[3px]" /> : step}
                    </div>
                    <span className={cn(
                      "text-[10px] uppercase font-black tracking-[0.2em] absolute -bottom-10 w-32 text-center transition-colors duration-500",
                      venueStep >= step ? "text-primary" : "text-white/20"
                    )}>
                      {step === 1 ? 'Details' : step === 2 ? 'Visuals' : 'Logistics'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <AnimatePresence mode="wait">
                {venueStep === 1 && (
                  <motion.div 
                    key="venueStep1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10"
                  >
                    <FormSection title="Basic Information" icon={<Fingerprint className="w-4 h-4" />}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="col-span-1 md:col-span-2">
                          <RefinedField 
                            label="Club Name" 
                            name="name"
                            value={venueFormData.name}
                            onChange={(e: any) => setVenueFormData({ ...venueFormData, name: e.target.value })}
                            placeholder="e.g. The Quantum Vault"
                            icon={<Building2 className="w-4 h-4" />}
                          />
                        </div>
                        <div className="space-y-4 group/field">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Category</label>
                          <select 
                            value={venueFormData.type}
                            onChange={(e) => setVenueFormData({ ...venueFormData, type: e.target.value })}
                            className="w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 appearance-none font-medium"
                          >
                             <option value="">Select Category...</option>
                             {venueTypes?.map((type: any) => (
                               <option key={type.id} value={type.name}>{type.name}</option>
                             ))}
                          </select>
                        </div>
                        <RefinedField 
                          label="Contact Email" 
                          name="email"
                          type="email"
                          value={venueFormData.email}
                          onChange={(e: any) => setVenueFormData({ ...venueFormData, email: e.target.value })}
                          placeholder="ops@venue.com"
                          icon={<Mail className="w-4 h-4" />}
                        />
                        <RefinedField 
                          label="Capacity" 
                          name="capacity"
                          type="number"
                          value={venueFormData.capacity}
                          onChange={(e: any) => setVenueFormData({ ...venueFormData, capacity: e.target.value })}
                          placeholder="3500"
                          icon={<Users className="w-4 h-4" />}
                        />
                        <RefinedField 
                          label="Contact Number" 
                          name="phone"
                          value={venueFormData.phone}
                          onChange={(e: any) => setVenueFormData({ ...venueFormData, phone: e.target.value })}
                          placeholder="+91 00000 00000"
                          icon={<Phone className="w-4 h-4" />}
                        />
                      </div>
                    </FormSection>

                    <FormSection title="Club Description" icon={<FileText className="w-4 h-4" />}>
                      <div className="space-y-4 group/field">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">About Club</label>
                        <textarea 
                          rows={4} 
                          value={venueFormData.description}
                          onChange={(e) => setVenueFormData({ ...venueFormData, description: e.target.value })}
                          placeholder="Describe the aesthetic and soundscape..." 
                          className="w-full bg-[#09090B] border border-white/5 rounded-[32px] px-8 py-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 resize-none font-medium placeholder:text-white/10"
                        ></textarea>
                      </div>
                    </FormSection>
                  </motion.div>
                )}

                {venueStep === 2 && (
                  <motion.div 
                    key="venueStep2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-12"
                  >
                    <FormSection title="Location Details" icon={<MapPin className="w-4 h-4" />}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4 group/field">
                          <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">City</label>
                          <select 
                            value={venueFormData.city}
                            onChange={(e) => setVenueFormData({ ...venueFormData, city: e.target.value })}
                            className="w-full bg-[#09090B] border border-white/5 rounded-[24px] px-8 py-5 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 appearance-none font-medium"
                          >
                             <option value="">Select City...</option>
                             {cities?.map((city: any) => (
                               <option key={city.id} value={city.name}>{city.name}</option>
                             ))}
                          </select>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <RefinedField 
                            label="Full Address" 
                            name="address"
                            value={venueFormData.address}
                            onChange={(e: any) => setVenueFormData({ ...venueFormData, address: e.target.value })}
                            placeholder="The Underground, District 7..."
                            icon={<MapPin className="w-4 h-4" />}
                          />
                        </div>
                      </div>
                    </FormSection>

                    <FormSection title="Club Media" icon={<Layers className="w-4 h-4" />}>
                      <div className="grid grid-cols-1 gap-12">
                        <div className="space-y-6">
                           <div className="flex items-center justify-between">
                             <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Cover Images</label>
                             <button 
                               onClick={() => setVenueFormData({ ...venueFormData, landscape_urls: [...venueFormData.landscape_urls, ''] })}
                               className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary hover:text-white transition-all shadow-[0_0_20px_rgba(255,45,154,0.1)]"
                             >
                               <Plus className="w-4 h-4" /> Add Image
                             </button>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             {venueFormData.landscape_urls.map((url: string, index: number) => (
                               <div key={index} className="group relative aspect-video rounded-[32px] bg-[#09090B] border border-white/5 overflow-hidden shadow-2xl transition-all hover:border-primary/40">
                                 {url ? (
                                   <img src={url} alt="" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                                 ) : (
                                   <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/10">
                                      <Image className="w-10 h-10" />
                                      <span className="text-[9px] font-black uppercase tracking-widest">Empty Slot {index + 1}</span>
                                   </div>
                                 )}
                                 <button 
                                   onClick={() => {
                                     const newUrls = [...venueFormData.landscape_urls];
                                     newUrls.splice(index, 1);
                                     setVenueFormData({ ...venueFormData, landscape_urls: newUrls });
                                   }}
                                   className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-black/80 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                                 >
                                   <Trash2 className="w-5 h-5" />
                                 </button>
                               </div>
                             ))}
                           </div>
                        </div>

                        <div className="space-y-6">
                           <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Profile Photo</label>
                           <div className="aspect-[9/16] max-w-[240px] mx-auto rounded-[32px] bg-[#09090B] border border-white/5 overflow-hidden shadow-2xl group relative cursor-pointer hover:border-blue-400/40 transition-all">
                              {venueFormData.portrait_url ? (
                                <img src={venueFormData.portrait_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/10">
                                   <Upload className="w-10 h-10 group-hover:text-blue-400 group-hover:scale-110 transition-all" />
                                   <span className="text-[9px] font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors">Select Photo</span>
                                </div>
                              )}
                           </div>
                        </div>
                      </div>
                    </FormSection>
                  </motion.div>
                )}

                {venueStep === 3 && (
                  <motion.div 
                    key="venueStep3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-10"
                  >
                    <FormSection title="Opening Hours" icon={<Clock className="w-4 h-4" />}>
                      <div className="space-y-6">
                        {workingHours.map((item, index) => (
                          <div key={item.day} className="flex flex-col sm:flex-row items-start sm:items-center gap-6 group p-4 rounded-[28px] hover:bg-white/[0.02] transition-all">
                            <button
                              type="button"
                              onClick={() => toggleDay(index)}
                              className={cn(
                                "min-w-[140px] px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all border",
                                item.active 
                                  ? "bg-primary text-white border-primary shadow-[0_0_20px_rgba(255,45,154,0.3)] scale-105 active:scale-95" 
                                  : "bg-[#09090B] border-white/5 text-white/20 hover:text-white/60"
                              )}
                            >
                              {item.day}
                            </button>
                            
                            <AnimatePresence>
                              {item.active && (
                                <motion.div
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  className="flex-1 w-full"
                                >
                                  <RefinedField 
                                    label="Open Hours" 
                                    name={`hours-${index}`}
                                    value={item.time}
                                    onChange={(e: any) => updateDayTime(index, e.target.value)}
                                    placeholder="22:00 - 04:00"
                                    icon={<Clock className="w-4 h-4" />}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 p-10 rounded-[40px] bg-blue-500/5 border border-blue-500/10 flex items-start gap-6 shadow-highlight">
                         <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
                            <Info className="w-6 h-6" />
                         </div>
                         <div className="space-y-2">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Note</h4>
                            <p className="text-[13px] text-white/40 leading-relaxed font-medium">
                              Activating a day will automatically use the same hours as the previously selected day.
                            </p>
                         </div>
                      </div>
                    </FormSection>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            </div>

            <div className="p-10 border-t border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                {venueStep > 1 && (
                  <button 
                    onClick={() => setVenueStep(v => v - 1)}
                    className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-4 active:scale-95 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsCreatingClub(false)}
                  className="px-8 py-5 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all"
                >
                  Cancel
                </button>
                {venueStep < 3 ? (
                  <button 
                    onClick={() => setVenueStep(v => v + 1)}
                    className="px-14 py-5 rounded-[24px] bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 group"
                  >
                    Next Step
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button 
                    onClick={() => setIsCreatingClub(false)}
                    className="px-16 py-5 rounded-[24px] bg-gradient-to-br from-primary to-purple-600 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:scale-105 active:scale-95 transition-all"
                  >
                    {selectedClub ? 'Save Changes' : 'Add Club'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
