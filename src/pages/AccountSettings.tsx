import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { 
  X, 
  Send, 
  MapPin, 
  Mail, 
  Phone, 
  User, 
  Building2, 
  Users2,
  ChevronDown,
  AlertCircle,
  LogOut,
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  Settings2,
  FileText,
  Clock,
  Eye,
  Lock,
  Layers,
  Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { FormSection, RefinedField } from '../components/RefinedForm';

const EMPTY_FORM_DATA = {
  venueName: '',
  city: '',
  address: '',
  email: '',
  phone: '',
  contactPerson: '',
  venueType: '',
  capacity: '',
  description: ''
};

export default function AccountSettings() {
  const navigate = useNavigate();
  const { logout, token, user } = useAuth();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Form State
  const [initialFormData, setInitialFormData] = useState(EMPTY_FORM_DATA);
  const [formData, setFormData] = useState(EMPTY_FORM_DATA);

  const { data: clubs } = useQuery({
    queryKey: ['clubs-account-settings'],
    queryFn: async () => {
      const res = await fetch('/api/clubs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load club');
      return res.json();
    },
    enabled: Boolean(token)
  });

  useEffect(() => {
    const club = Array.isArray(clubs) ? clubs.find((item: any) => item.name === user?.organisation) : null;
    if (!club) return;
    let contactInfo: any = {};
    try {
      contactInfo = typeof club.contact_info === 'string' ? JSON.parse(club.contact_info) : club.contact_info || {};
    } catch {
      contactInfo = {};
    }
    const next = {
      venueName: club.name || '',
      city: club.city || '',
      address: club.address || '',
      email: contactInfo.email || user?.email || '',
      phone: contactInfo.phone || '',
      contactPerson: contactInfo.contactName || user?.name || '',
      venueType: club.type || club.venue_type || '',
      capacity: club.capacity ? String(club.capacity) : '',
      description: club.description || ''
    };
    setInitialFormData(next);
    setFormData(next);
  }, [clubs, user]);

  const { data: venueTypes } = useQuery({
    queryKey: ['venueTypes'],
    queryFn: async () => {
      const res = await fetch('/api/venueTypes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.json();
    }
  });

  // Check for changes in Box 1 (Venue Details)
  const hasBox1Changes = 
    formData.venueName !== initialFormData.venueName ||
    formData.venueType !== initialFormData.venueType ||
    formData.phone !== initialFormData.phone ||
    formData.email !== initialFormData.email ||
    formData.city !== initialFormData.city ||
    formData.address !== initialFormData.address;

  // Check for changes in Box 2 (Specifications)
  const hasBox2Changes = 
    formData.contactPerson !== initialFormData.contactPerson ||
    formData.capacity !== initialFormData.capacity ||
    formData.description !== initialFormData.description;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (isSaved) setIsSaved(false);
  };

  const handleCancelClick = () => {
    if (hasBox1Changes) {
      setShowCancelDialog(true);
    } else {
      navigate('/');
    }
  };

  const handleDiscardBox2 = () => {
    if (hasBox2Changes) {
      setShowCancelDialog(true);
    }
  };

  const handleSaveBox2 = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSendApprovalClick = () => {
    if (hasBox1Changes) {
      setShowApprovalDialog(true);
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-32">
      {/* Header Enhancement */}
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-8">
        <div className="space-y-4 relative z-10">
          <div className="flex items-center gap-3 text-primary">
            <Settings2 className="w-5 h-5 animate-spin-slow" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Venue Settings</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
            Account <span className="text-primary neon-text">Settings</span>
          </h1>
          <p className="text-white/40 font-medium text-lg max-w-2xl leading-relaxed">
            Update your venue details and public information. Some changes may require admin approval.
          </p>
        </div>
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
      </div>

      {/* Main Grid Layout for Boxes */}
      <div className="space-y-12">
        {/* Box 1: Account Details */}
        <div className="glass-card rounded-[48px] border border-white/5 p-10 lg:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none opacity-50" />
          
          <div className="relative z-10 space-y-16">
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8 border-b border-white/5 pb-10">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Business Details</h2>
                </div>
                <p className="text-sm text-white/40 leading-relaxed font-medium">
                  <strong className="text-primary/60 uppercase tracking-widest text-[10px] block mb-1">Needs Verification:</strong>
                  Some details need verification. Changes to these fields will be reviewed by our team.
                </p>
              </div>
              
              <div className="flex items-center gap-4 shrink-0">
                <button 
                  onClick={handleCancelClick}
                  className="px-8 py-4 rounded-[20px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-3 active:scale-95"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button 
                  onClick={handleSendApprovalClick}
                  disabled={!hasBox1Changes}
                  className={cn(
                    "px-10 py-5 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center gap-3 active:scale-95",
                    hasBox1Changes 
                      ? "bg-primary text-white hover:bg-primary/90 shadow-primary/30" 
                      : "bg-white/5 text-white/10 cursor-not-allowed border border-white/5"
                  )}
                >
                  <Zap className={cn("w-4 h-4 fill-current", hasBox1Changes && "animate-pulse")} />
                  Submit for Review
                </button>
              </div>
            </div>

            <div className="space-y-16">
              <FormSection title="Location & Appearance" icon={<Layers className="w-4 h-4" />}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-10">
                    <RefinedField 
                      label="Venue Name" 
                      name="venueName"
                      value={formData.venueName}
                      onChange={handleChange}
                      placeholder="Venue Name"
                      icon={<Building2 className="w-4 h-4" />}
                    />
                    
                    <div className="space-y-4 group/field">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Venue Type</label>
                      <div className="relative">
                        <select 
                          name="venueType"
                          value={formData.venueType}
                          onChange={handleChange}
                          className="w-full bg-[#09090B] border border-white/10 rounded-[24px] px-8 py-5 text-white hover:border-white/20 focus:border-primary/50 focus:outline-none transition-all appearance-none text-sm font-medium"
                        >
                          <option value="">Select venue type...</option>
                          {venueTypes?.map((type: any) => (
                            <option key={type.id} value={type.name}>{type.name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none group-focus-within/field:rotate-180 transition-transform" />
                      </div>
                    </div>

                    <RefinedField 
                      label="City" 
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City Name"
                      icon={<MapPin className="w-4 h-4" />}
                    />
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 text-center block">Exact Location</label>
                    <div className="aspect-video bg-[#09090B] border border-white/5 rounded-[40px] relative overflow-hidden flex items-center justify-center group cursor-pointer shadow-inner">
                      <img 
                        src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=2000" 
                        className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale group-hover:opacity-20 transition-all duration-1000 group-hover:scale-110"
                        alt="Map"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="relative flex flex-col items-center gap-6 text-center px-10">
                        <div className="w-16 h-16 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:animate-pulse">
                          <MapPin className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-black text-white uppercase tracking-[0.3em]">Exact Location</p>
                          <p className="text-[9px] text-primary/40 font-black tracking-widest uppercase">Set Map Location</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FormSection>

              <FormSection title="Contact Details" icon={<Clock className="w-4 h-4" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                  <div className="col-span-1 md:col-span-2 lg:col-span-1">
                    <RefinedField 
                      label="Phone Number" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91..."
                      icon={<Phone className="w-4 h-4" />}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <RefinedField 
                      label="Email Address" 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      icon={<Mail className="w-4 h-4" />}
                    />
                  </div>
                  <div className="col-span-1 md:col-span-3">
                    <div className="space-y-4 group/field">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Full Address</label>
                      <textarea 
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        rows={4}
                        className="w-full bg-[#09090B] border border-white/5 rounded-[32px] px-8 py-6 text-white hover:border-white/10 focus:border-primary/50 focus:outline-none transition-all placeholder:text-white/10 resize-none text-sm font-medium"
                        placeholder="Physical Location..."
                      />
                    </div>
                  </div>
                </div>
              </FormSection>
            </div>
          </div>
        </div>

        {/* Box 2: Public Profile */}
        <div className="glass-card rounded-[48px] border border-white/5 p-10 lg:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -mr-48 -mt-48 pointer-events-none opacity-50" />
          
          <div className="relative z-10 space-y-16">
            <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8 border-b border-white/5 pb-10">
              <div className="space-y-4 max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                    <Eye className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">Display Details</h2>
                </div>
                <p className="text-sm text-white/40 leading-relaxed font-medium">
                  <strong className="text-blue-400/60 uppercase tracking-widest text-[10px] block mb-1">Live Profile:</strong>
                  Changes here will update instantly on your public profile.
                </p>
              </div>
              
              <div className="flex items-center gap-4 shrink-0">
                <button 
                  onClick={handleDiscardBox2}
                  disabled={!hasBox2Changes}
                  className={cn(
                    "px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 active:scale-95",
                    hasBox2Changes
                      ? "bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                      : "bg-white/5 border border-white/5 text-white/10 cursor-not-allowed"
                  )}
                >
                  <X className="w-4 h-4" />
                  Discard Changes
                </button>
                <button 
                  onClick={handleSaveBox2}
                  disabled={!hasBox2Changes}
                  className={cn(
                    "px-10 py-5 rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center gap-3 min-w-[150px] justify-center active:scale-95",
                    isSaved 
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-emerald-500/10" 
                      : hasBox2Changes
                        ? "bg-white text-black hover:bg-white/90 shadow-white/10"
                        : "bg-white/5 text-white/10 border border-white/5 cursor-not-allowed shadow-none"
                  )}
                >
                  {isSaved ? (
                    <>
                      <Check className="w-4 h-4 animate-bounce" />
                      Published
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Update Profile
                    </>
                  )}
                </button>
              </div>
            </div>

            <FormSection title="Business Information" icon={<Lock className="w-4 h-4" />}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-10">
                  <RefinedField 
                    label="Manager Name" 
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    placeholder="Primary Contact"
                    icon={<User className="w-4 h-4" />}
                  />
                  <RefinedField 
                    label="Guest Capacity" 
                    name="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={handleChange}
                    placeholder="e.g. 500"
                    icon={<Users2 className="w-4 h-4" />}
                  />
                </div>
                
                <div className="space-y-4 group/field">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Venue Description</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={8}
                    className="w-full bg-[#09090B] border border-white/5 rounded-[32px] px-8 py-6 text-white hover:border-white/10 focus:border-primary/50 focus:outline-none transition-all placeholder:text-white/10 resize-none text-sm font-medium leading-relaxed"
                    placeholder="Tell us about your venue..."
                  />
                </div>
              </div>
            </FormSection>
          </div>
        </div>
      </div>

      {/* Dialogs - Modular UI */}
      <AnimatePresence>
        {/* Discard Confirmation Overlay */}
        {showCancelDialog && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelDialog(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-lg glass-card border border-white/10 rounded-[48px] p-12 shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <div className="flex flex-col items-center text-center space-y-10 relative z-10">
                <div className="w-24 h-24 rounded-[32px] bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                  <AlertCircle className="w-12 h-12 text-white/20 animate-pulse" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight">Discard Changes?</h3>
                  <p className="text-white/40 text-base leading-relaxed max-w-sm mx-auto font-medium">
                    Are you sure you want to discard your changes? This action cannot be undone.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row w-full gap-4">
                  <button 
                    onClick={() => navigate('/')}
                    className="flex-1 py-5 rounded-[24px] bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={() => setShowCancelDialog(false)}
                    className="flex-1 py-5 rounded-[24px] border border-white/10 text-white/40 text-[11px] font-black uppercase tracking-[0.2em] hover:text-white hover:bg-white/5 transition-all"
                  >
                    Keep Editing
                  </button>
                </div>
              </div>
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-white/5 rounded-full blur-[80px] pointer-events-none" />
            </motion.div>
          </div>
        )}

        {/* Review Confirmation Overlay */}
        {showApprovalDialog && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-12">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowApprovalDialog(false)}
              className="absolute inset-0 bg-[#050505]/95 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-2xl glass-card border border-primary/20 rounded-[56px] p-16 shadow-[0_50px_150px_rgba(255,45,154,0.2)] overflow-hidden"
            >
              <div className="flex flex-col items-center text-center space-y-12 relative z-10">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-[40px] animate-pulse" />
                  <div className="w-28 h-28 rounded-[40px] bg-primary/10 border-2 border-primary/40 flex items-center justify-center relative shadow-3xl">
                    <Send className="w-14 h-14 text-primary neon-text" />
                  </div>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-4xl font-black text-white uppercase tracking-tighter shadow-primary/20 leading-none">
                    Submit for <span className="text-primary">Manual Check</span>
                  </h3>
                  <div className="p-8 rounded-[32px] bg-primary/5 border border-primary/10 space-y-4">
                    <p className="text-white/60 text-lg leading-relaxed font-medium">
                      Account Review
                    </p>
                    <div className="flex items-center justify-center gap-3 text-red-500/80 animate-pulse">
                      <Lock className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Requires Approval</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row w-full gap-6">
                  <button 
                    onClick={() => {
                      logout();
                      navigate('/login');
                    }}
                    className="flex-[2] py-6 rounded-[28px] bg-primary text-white text-[12px] font-black uppercase tracking-[0.3em] hover:scale-[1.03] active:scale-95 transition-all shadow-[0_20px_60px_rgba(255,45,154,0.4)] flex items-center justify-center gap-4 group"
                  >
                    Submit for Review
                    <LogOut className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => setShowApprovalDialog(false)}
                    className="flex-1 py-6 rounded-[28px] border border-white/10 text-white/30 text-[12px] font-black uppercase tracking-[0.2em] hover:text-white hover:bg-white/10 transition-all font-mono"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
