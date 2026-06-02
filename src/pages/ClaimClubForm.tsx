import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  User, 
  Users2,
  ChevronLeft,
  CheckCircle2,
  Zap,
  Sparkles,
  FileText,
  Upload,
  Image,
  Trash2,
  Eye,
  Camera,
  Layers
} from 'lucide-react';
import { cn } from '../lib/utils';
import { FormSection, RefinedField } from '../components/RefinedForm';

const CLUB_DATA: Record<string, any> = {
  'dummy-2': {
    id: 'dummy-2',
    name: 'Royal Club',
    city: 'Delhi',
    address: '45 Palace Rd, Delhi',
    email: 'royal@example.com',
    phone: '+91 11 2345 6789',
    contactPerson: 'Aditya Singh',
    venueType: 'Nightclub',
    capacity: '800',
    description: 'A luxurious nightlife experience in the heart of Delhi.'
  }
};

export default function ClaimClubForm() {
  const navigate = useNavigate();
  const { clubId } = useParams();
  const club = clubId ? CLUB_DATA[clubId] : null;
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const [portraitImage, setPortraitImage] = useState<string | null>(null);
  const [landscapeImage, setLandscapeImage] = useState<string | null>(null);

  // References for hidden file inputs
  const portraitInputRef = React.useRef<HTMLInputElement>(null);
  const landscapeInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'portrait' | 'landscape') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'portrait') setPortraitImage(reader.result as string);
        else setLandscapeImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form State
  const [formData, setFormData] = useState(club || {
    name: '',
    city: '',
    address: '',
    email: '',
    phone: '',
    contactPerson: '',
    venueType: '',
    capacity: '',
    description: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!isEditing) return;
    setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleClaim = () => {
    setIsSuccess(true);
  };

  if (!club) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-white/60">Club not found.</p>
          <button onClick={() => navigate('/club-onboarding')} className="text-primary hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center p-6 text-center space-y-8 relative overflow-hidden"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="w-24 h-24 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center shadow-[0_0_30px_rgba(255,45,154,0.3)] relative z-10"
        >
          <CheckCircle2 className="w-12 h-12 text-primary" />
        </motion.div>

        <div className="space-y-4 relative z-10">
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">Claim Sent for Approval</h1>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto leading-relaxed">
            Your claim has been sent for approval. You will be notified once approved.
          </p>
        </div>

        <button 
          onClick={() => navigate('/club-onboarding')}
          className="text-primary font-black uppercase tracking-widest text-xs hover:underline pt-4 relative z-10"
        >
          Go back to login screen
        </button>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-16 pb-40 relative">
      <AnimatePresence>
        {isSticky && (
          <motion.button
            layoutId="edit-button-action"
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.8 }}
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "fixed top-6 right-6 z-[100] px-8 py-4 rounded-[20px] shadow-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
              isEditing 
                ? "bg-primary text-white shadow-primary/30" 
                : "bg-white text-black hover:bg-primary hover:text-white"
            )}
          >
            <Sparkles className={cn("w-4 h-4 transition-all", isEditing && "animate-spin-slow")} />
            <span>{isEditing ? 'Editing Mode' : 'Edit Details'}</span>
          </motion.button>
        )}
      </AnimatePresence>
      <div className="max-w-5xl mx-auto space-y-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary animate-pulse">
              <Zap className="w-5 h-5 fill-current" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Claim Your Club</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none uppercase">
              Claiming <span className="text-primary neon-text">{club.name}</span>
            </h1>
            <p className="text-white/40 font-medium text-lg max-w-xl">
              Verification required. Please validate the club details before submitting the claim for approval.
            </p>
          </div>

          <motion.button 
            layoutId="edit-button-action"
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "px-8 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-4 group active:scale-95 shadow-2xl",
              isEditing 
                ? "bg-primary text-white shadow-primary/30 scale-105" 
                : "bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10"
            )}
          >
            <Sparkles className={cn("w-4 h-4 transition-transform group-hover:scale-125", isEditing && "animate-spin-slow")} />
            {isEditing ? 'Editing Mode' : 'Edit Details'}
          </motion.button>
        </div>

        <div className="glass-card rounded-[48px] border border-white/5 p-10 lg:p-16 space-y-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] -ml-64 -mb-64 pointer-events-none" />

          <div className="relative z-10 space-y-20">
            <FormSection title="Basic Details" icon={<Building2 className="w-4 h-4" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="col-span-1 md:col-span-2">
                  <RefinedField 
                    label="Club Name" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    placeholder="Enter club name"
                    icon={<Building2 className="w-4 h-4" />}
                  />
                </div>
                
                <div className="space-y-6">
                  <RefinedField 
                    label="City" 
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    placeholder="City"
                    icon={<MapPin className="w-4 h-4" />}
                  />
                  <div className="space-y-4 group/field">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Address</label>
                    <textarea 
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      readOnly={!isEditing}
                      rows={4}
                      className={cn(
                        "w-full bg-[#09090B] border rounded-[32px] px-8 py-6 text-white focus:outline-none transition-all text-sm resize-none font-medium",
                        !isEditing ? "border-white/5 text-white/20" : "border-white/10 hover:border-white/20 focus:border-primary/50"
                      )}
                      placeholder="Physical address"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Location Map</label>
                  <div className="aspect-[16/11] bg-[#09090B] border border-white/5 rounded-[40px] relative overflow-hidden flex items-center justify-center group cursor-pointer shadow-inner">
                    <img 
                      src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000" 
                      className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale group-hover:opacity-20 transition-all duration-700 blur-[2px]"
                      alt="Map"
                    />
                    <div className="relative flex flex-col items-center gap-4 text-center p-8">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <MapPin className="w-6 h-6" />
                      </div>
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] leading-relaxed">Map Preview</p>
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection title="Contact Information" icon={<Mail className="w-4 h-4" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="col-span-1 md:col-span-2">
                  <RefinedField 
                    label="Email Address" 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    placeholder="manager@club.com"
                    icon={<Mail className="w-4 h-4" />}
                  />
                </div>
                <RefinedField 
                  label="Phone Number" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  placeholder="+91..."
                  icon={<Phone className="w-4 h-4" />}
                />
                <RefinedField 
                  label="Contact Person" 
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  placeholder="Primary contact"
                  icon={<User className="w-4 h-4" />}
                />
              </div>
            </FormSection>

            <FormSection title="Venue Details" icon={<Layers className="w-4 h-4" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <RefinedField 
                  label="Venue Type" 
                  name="venueType"
                  value={formData.venueType}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  placeholder="e.g. Nightclub, Lounge"
                  icon={<Building2 className="w-4 h-4" />}
                />
                <RefinedField 
                  label="Capacity" 
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  placeholder="Max guests"
                  icon={<Users2 className="w-4 h-4" />}
                />
                <div className="col-span-1 md:col-span-2 space-y-4 group/field">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Description</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    rows={6}
                    className={cn(
                      "w-full bg-[#09090B] border rounded-[32px] px-8 py-6 text-white focus:outline-none transition-all text-sm resize-none font-medium placeholder:text-white/10",
                      !isEditing ? "border-white/5 text-white/20" : "border-white/10 hover:border-white/20 focus:border-primary/50"
                    )}
                    placeholder="Describe your club..."
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title="Photos & Media" icon={<Camera className="w-4 h-4" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                <input type="file" ref={portraitInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'portrait')} />
                <input type="file" ref={landscapeInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'landscape')} />

                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Profile Photo</h4>
                      <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">Vertical Image (3:4)</p>
                    </div>
                    {portraitImage && (
                      <button onClick={() => setPortraitImage(null)} className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 transition-all hover:text-white group/btn">
                        <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    )}
                  </div>
                  
                  <div 
                    onClick={() => isEditing && portraitInputRef.current?.click()}
                    className={cn(
                      "aspect-[3/4] rounded-[48px] border-2 border-dashed transition-all duration-700 flex flex-col items-center justify-center gap-6 group relative overflow-hidden shadow-2xl",
                      !isEditing 
                        ? "border-white/5 bg-white/[0.01] cursor-not-allowed" 
                        : "border-primary/20 bg-primary/[0.02] cursor-pointer hover:border-primary/50 hover:bg-primary/[0.05]"
                    )}
                  >
                    {portraitImage ? (
                      <img src={portraitImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Portrait" />
                    ) : (
                      <>
                        <div className={cn(
                          "w-16 h-16 rounded-[24px] flex items-center justify-center border-2 transition-all duration-500",
                          isEditing ? "bg-primary/10 border-primary/30 group-hover:scale-110 group-hover:rotate-6" : "bg-white/5 border-white/5"
                        )}>
                          <Upload className={cn("w-7 h-7", isEditing ? "text-primary" : "text-white/10")} />
                        </div>
                        <p className={cn(
                          "text-[10px] font-black uppercase tracking-[0.4em] transition-all",
                          isEditing ? "text-primary/60 group-hover:text-primary" : "text-white/10"
                        )}>Upload Photo</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Cover Image</h4>
                      <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">Horizontal Image (16:9)</p>
                    </div>
                    {landscapeImage && (
                      <button onClick={() => setLandscapeImage(null)} className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 hover:bg-red-500 transition-all hover:text-white group/btn">
                        <Trash2 className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                      </button>
                    )}
                  </div>
                  
                  <div 
                    onClick={() => isEditing && landscapeInputRef.current?.click()}
                    className={cn(
                      "aspect-video rounded-[48px] border-2 border-dashed transition-all duration-700 flex flex-col items-center justify-center gap-6 group relative overflow-hidden shadow-2xl",
                      !isEditing 
                        ? "border-white/5 bg-white/[0.01] cursor-not-allowed" 
                        : "border-blue-500/20 bg-blue-500/[0.02] cursor-pointer hover:border-blue-500/50 hover:bg-blue-500/[0.05]"
                    )}
                  >
                    {landscapeImage ? (
                      <img src={landscapeImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Landscape" />
                    ) : (
                      <>
                        <div className={cn(
                          "w-16 h-16 rounded-[24px] flex items-center justify-center border-2 transition-all duration-500",
                          isEditing ? "bg-blue-500/10 border-blue-500/30 group-hover:scale-110 group-hover:-rotate-6" : "bg-white/5 border-white/5"
                        )}>
                          <Upload className={cn("w-7 h-7", isEditing ? "text-blue-400" : "text-white/10")} />
                        </div>
                        <p className={cn(
                          "text-[10px] font-black uppercase tracking-[0.4em] transition-all",
                          isEditing ? "text-blue-400/60 group-hover:text-blue-400" : "text-white/10"
                        )}>Upload Cover</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </FormSection>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12 border-t border-white/5">
          <button 
            onClick={() => navigate('/club-onboarding')}
            className="w-full sm:w-auto px-12 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-xl"
          >
            <ChevronLeft className="w-5 h-5" />
            Cancel
          </button>
          <button 
            onClick={handleClaim}
            className="w-full sm:w-auto px-16 py-6 rounded-[24px] bg-primary text-white text-[12px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,45,154,0.3)] flex items-center justify-center gap-4 group"
          >
            <Zap className="w-5 h-5 fill-current" />
            Submit Claim
            <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all group-hover:rotate-12" />
          </button>
        </div>
      </div>
    </div>
  );
}

