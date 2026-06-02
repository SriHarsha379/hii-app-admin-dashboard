import React, { useState } from 'react';
import { 
  Heart, 
  MapPin, 
  Calendar, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Ticket,
  Users,
  Edit2,
  X,
  Plus,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface RightClubProfileProps {
  club: any;
  onUpdate?: (data: any) => void;
}

export default function RightClubProfile({ club: initialClub, onUpdate }: RightClubProfileProps) {
  // Use data from club or defaults based on screenshot
  const [club, setClub] = useState(initialClub || {
    name: 'Bass Drop Fridays',
    tags: ['Techno', 'Whiskey', 'EDM'],
    portrait_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    followers: '17.6K',
    date: '15th, Friday',
    time: '10 PM – 4 AM',
    venue: 'Club Neon',
    location: 'Downtown',
    distance: '2.3 km away',
    about: 'Get ready for a night of bass-heavy beats with DJ Armin. Whiskey specials till midnight. Dance till the sun comes up with the best techno and EDM DJs...',
    gallery: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80',
      'https://images.unsplash.com/photo-1574391884720-bbc37bb15932?w=600&q=80'
    ],
    lineup: [
      { name: 'DJ Armin', role: 'Opening Act', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop' },
      { name: 'Ben Böhmer', role: 'Main Act', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop' },
      { name: 'DJ Armin', role: 'Opening Act', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop' },
    ],
    ticketPrice: '100'
  });

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempData, setTempData] = useState<any>(null);

  const handleEdit = (section: string) => {
    setEditingSection(section);
    setTempData({ ...club });
  };

  const handleSave = () => {
    setClub(tempData);
    setEditingSection(null);
    onUpdate?.(tempData);
  };

  const renderEditModal = () => {
    if (!editingSection) return null;

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[999] flex items-center justify-center p-6"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-[#121217] border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl"
        >
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Edit {editingSection}</h3>
            <button onClick={() => setEditingSection(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>
          
          <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {editingSection === 'Title' && (
              <>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Event Name</label>
                  <input 
                    type="text" 
                    value={tempData.name}
                    onChange={(e) => setTempData({...tempData, name: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Tags (comma separated)</label>
                  <input 
                    type="text" 
                    value={tempData.tags.join(', ')}
                    onChange={(e) => setTempData({...tempData, tags: e.target.value.split(',').map((s: string) => s.trim())})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all font-bold"
                  />
                </div>
              </>
            )}

            {editingSection === 'Schedule' && (
              <>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Date</label>
                  <input 
                    type="text" 
                    value={tempData.date}
                    onChange={(e) => setTempData({...tempData, date: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Time</label>
                  <input 
                    type="text" 
                    value={tempData.time}
                    onChange={(e) => setTempData({...tempData, time: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all font-bold"
                  />
                </div>
              </>
            )}

            {editingSection === 'Location' && (
              <>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Venue</label>
                  <input 
                    type="text" 
                    value={tempData.venue}
                    onChange={(e) => setTempData({...tempData, venue: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Area / Location</label>
                  <input 
                    type="text" 
                    value={tempData.location}
                    onChange={(e) => setTempData({...tempData, location: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary transition-all font-bold"
                  />
                </div>
              </>
            )}

            {editingSection === 'About' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">About Event</label>
                <textarea 
                  value={tempData.about}
                  onChange={(e) => setTempData({...tempData, about: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary h-40 resize-none font-medium leading-relaxed"
                />
              </div>
            )}

            {editingSection === 'Lineup' && (
              <div className="space-y-4">
                {tempData.lineup.map((dj: any, index: number) => (
                  <div key={index} className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl border border-white/10 overflow-hidden bg-white/5 shrink-0">
                      <img src={dj.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <input 
                        type="text" 
                        value={dj.name}
                        onChange={(e) => {
                          const newLineup = [...tempData.lineup];
                          newLineup[index].name = e.target.value;
                          setTempData({...tempData, lineup: newLineup});
                        }}
                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-white focus:ring-0"
                      />
                      <input 
                        type="text" 
                        value={dj.role}
                        onChange={(e) => {
                          const newLineup = [...tempData.lineup];
                          newLineup[index].role = e.target.value;
                          setTempData({...tempData, lineup: newLineup});
                        }}
                        className="w-full bg-transparent border-none p-0 text-[10px] text-white/30 uppercase font-black tracking-[0.15em] focus:ring-0"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const newLineup = tempData.lineup.filter((_: any, i: number) => i !== index);
                        setTempData({...tempData, lineup: newLineup});
                      }}
                      className="p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const newLineup = [...tempData.lineup, { name: 'New Artist', role: 'Artist', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop' }];
                    setTempData({...tempData, lineup: newLineup});
                  }}
                  className="w-full py-4 border border-dashed border-white/10 rounded-2xl text-[10px] font-black text-white/20 uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                >
                  Add Artist
                </button>
              </div>
            )}
            
            {editingSection === 'Tickets' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Price Amount</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 font-black">₹</span>
                  <input 
                    type="number" 
                    value={tempData.ticketPrice.toString().replace('₹', '')}
                    onChange={(e) => setTempData({...tempData, ticketPrice: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-5 py-4 text-white focus:outline-none focus:border-primary transition-all font-black text-lg"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-white/5 flex gap-4">
            <button 
              onClick={() => setEditingSection(null)}
              className="flex-1 py-4 rounded-2xl bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              Save Now
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-black text-white relative select-none">
      <AnimatePresence>
        {editingSection && renderEditModal()}
      </AnimatePresence>

      {/* Hero Image */}
      <div className="relative h-64 shrink-0 overflow-hidden">
        <img 
          src={club.portrait_url} 
          alt={club.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/40 to-transparent" />
        
        {/* Change Photos trigger */}
        <button 
          onClick={() => handleEdit('Photos')}
          className="absolute bottom-4 right-4 p-2.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-black/60 transition-colors"
        >
          <ImageIcon className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-44 space-y-8 scrollbar-hide">
        {/* Header Section */}
        <div className="relative group">
          <div className="flex justify-between items-start">
            <div className="space-y-3 pr-12">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight leading-tight uppercase">{club.name}</h2>
                <button 
                  onClick={() => handleEdit('Title')}
                  className="p-1 bg-white/5 rounded-lg opacity-40 group-hover:opacity-100 hover:bg-white/10 transition-all"
                >
                  <Edit2 className="w-3 h-3 text-primary" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {club.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1.5 rounded-full border border-white/10 text-[9px] font-black text-white uppercase tracking-[0.15em] bg-white/[0.03]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-[3.5rem] h-[3.5rem] rounded-full bg-[#FF2D9A] flex items-center justify-center shadow-2xl shadow-[#FF2D9A]/40 ring-2 ring-black">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-[10px] font-black mt-2 text-white/30 tracking-[0.1em] uppercase">{club.followers}</span>
            </div>
          </div>
        </div>

        {/* Details Section */}
        <div className="space-y-5 pt-1 relative group text-white/80">
          <button 
            onClick={() => handleEdit('Schedule')}
            className="absolute -top-3 right-0 p-1.5 bg-white/5 rounded-lg opacity-40 group-hover:opacity-100 hover:bg-white/10 transition-all"
          >
            <Edit2 className="w-3 h-3 text-primary" />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-[#FF2D9A]/5 rounded-xl flex items-center justify-center ring-1 ring-white/5">
              <Calendar className="w-4.5 h-4.5 text-[#FF2D9A]" />
            </div>
            <span className="text-xs font-black tracking-wide uppercase">{club.date}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-[#FF2D9A]/5 rounded-xl flex items-center justify-center ring-1 ring-white/5">
              <Clock className="w-4.5 h-4.5 text-[#FF2D9A]" />
            </div>
            <span className="text-xs font-black tracking-wide uppercase">{club.time}</span>
          </div>
          
          <div className="flex items-start gap-4 group/loc relative">
            <button 
              onClick={() => handleEdit('Location')}
              className="absolute -top-1 -right-1 p-1 opacity-0 group-hover/loc:opacity-100 hover:bg-white/10 rounded-lg transition-all"
            >
              <Edit2 className="w-2.5 h-2.5 text-primary" />
            </button>
            <div className="w-9 h-9 bg-[#FF2D9A]/5 rounded-xl flex items-center justify-center ring-1 ring-white/5 shrink-0">
              <MapPin className="w-4.5 h-4.5 text-[#FF2D9A]" />
            </div>
            <div>
              <p className="text-xs font-black text-white tracking-wide uppercase">{club.venue}, {club.location}</p>
              <p className="text-[9px] text-white/20 mt-1 font-black uppercase tracking-[0.15em]">{club.distance}</p>
            </div>
          </div>
        </div>

        {/* Gallery Section */}
        <div className="space-y-4 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Gallery</h3>
              <button 
                onClick={() => handleEdit('Gallery')}
                className="p-1 bg-white/5 rounded-lg opacity-40 group-hover:opacity-100 hover:bg-white/10 transition-all"
              >
                <Edit2 className="w-2.5 h-2.5 text-primary" />
              </button>
            </div>
            <button className="text-[10px] font-black text-primary uppercase tracking-[0.15em]">View All</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {club.gallery.map((img: string, i: number) => (
              <div key={i} className="w-[14rem] aspect-[16/10] rounded-[2rem] overflow-hidden border border-white/5 shrink-0 shadow-2xl relative group/img">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>

        {/* About Section */}
        <div className="space-y-4 group">
          <div className="flex items-center gap-2">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">About</h3>
            <button 
              onClick={() => handleEdit('About')}
              className="p-1 bg-white/5 rounded-lg opacity-40 group-hover:opacity-100 hover:bg-white/10 transition-all"
            >
              <Edit2 className="w-2.5 h-2.5 text-primary" />
            </button>
          </div>
          <p className="text-[11px] text-white/40 leading-relaxed font-medium">
            {club.about} <span className="text-[#FF2D9A] font-black ml-1 cursor-pointer">Read More</span>
          </p>

          <div className="flex gap-3 pt-2">
             <button className="flex-1 bg-white text-black h-12 rounded-2xl font-black text-[10px] uppercase tracking-[0.15em] shadow-xl hover:bg-white/90 transition-all active:scale-95">
                Send Invite
             </button>
             <button className="flex-1 bg-[#FF2D9A] text-white h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.15em] shadow-xl shadow-[#FF2D9A]/20 active:scale-95 transition-all">
                <Heart className="w-3.5 h-3.5 fill-white" />
                Like
             </button>
          </div>
        </div>

        {/* Lineup Section */}
        <div className="space-y-5 group pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Lineup</h3>
              <button 
                onClick={() => handleEdit('Lineup')}
                className="p-1 bg-white/5 rounded-lg opacity-40 group-hover:opacity-100 hover:bg-white/10 transition-all"
              >
                <Edit2 className="w-2.5 h-2.5 text-primary" />
              </button>
            </div>
            <button className="text-[10px] font-black text-primary uppercase tracking-[0.15em]">View All</button>
          </div>
          <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
            {club.lineup.map((dj: any, i: number) => (
              <div key={i} className="flex flex-col items-center gap-3 shrink-0 group/dj">
                <div className="w-16 h-16 rounded-[1.8rem] overflow-hidden border border-white/10 bg-white/[0.03] shadow-xl transition-all duration-300 group-hover/dj:scale-105">
                  <img src={dj.image} alt={dj.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-black text-white tracking-wide uppercase">{dj.name}</p>
                  <p className="text-[8px] text-white/30 uppercase font-black tracking-[0.15em] mt-1">{dj.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Tickets Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-3 pb-8 border-t border-white/5 bg-black/90 backdrop-blur-2xl ring-1 ring-white/5 shadow-[0_-15px_40px_rgba(0,0,0,0.5)] group/foot">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Ticket className="w-3.5 h-3.5 text-white/20" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">Tickets</span>
          </div>
          <div className="flex items-center gap-1.5 font-black text-[9px] text-primary bg-primary/5 px-2.5 py-1 rounded-full ring-1 ring-primary/20">
             🔥 <span className="uppercase tracking-[0.1em]">Ends in 02:14:53</span>
          </div>
        </div>
        
        <div className="p-4 rounded-[2rem] bg-white/[0.03] border border-white/10 flex items-center justify-between shadow-2xl relative overflow-hidden group/card">
          <button 
            onClick={() => handleEdit('Tickets')}
            className="absolute top-1.5 right-1.5 p-1.5 opacity-0 group-hover/foot:opacity-100 hover:bg-white/10 rounded-lg transition-all z-10"
          >
            <Edit2 className="w-3 h-3 text-primary" />
          </button>

          <div className="space-y-1 relative z-10">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Reservations</p>
            <p className="text-lg font-black text-white tracking-tight">₹{club.ticketPrice}</p>
          </div>
          
          <button className="px-7 py-3.5 rounded-[1.4rem] bg-white text-black font-black text-[10px] uppercase tracking-[0.1em] hover:scale-105 active:scale-95 transition-all shadow-xl relative z-10">
            Book Now
          </button>
        </div>
        
        <p className="text-[8px] text-center text-white/20 mt-4 font-black uppercase tracking-[0.25em]">
          Instant confirmation • Secure spot
        </p>
      </div>
    </div>
  );
}

