import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  User, 
  ChevronLeft,
  CheckCircle2,
  Zap,
  Globe,
  Calendar,
  ShieldCheck,
  Instagram,
  Linkedin,
  Facebook,
  Youtube,
  Upload,
  CheckSquare,
  FileText,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Clock,
  Layers,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { FormSection, RefinedField } from '../components/RefinedForm';

const INITIAL_DATA = {
  fullName: 'Alex Rivera',
  email: 'alex@eventpro.com',
  phone: '+91 98765 43210',
  companyName: 'Elite Event Solutions',
  companyType: 'Artist Management',
  description: 'Specializing in high-end nightlife events and international artist touring.',
  yearEstablished: '2018',
  city: 'Mumbai',
  website: 'www.eliteevents.pro',
  address: 'Mumbai, Maharashtra, India',
  categories: ['Nightlife', 'Concerts', 'Festivals'],
  socialLinks: {
    instagram: '@elite_events',
    linkedin: 'elite-events-pro',
    facebook: 'EliteEventsPro',
    youtube: 'EliteEventsTV'
  },
  registrationNumber: 'REG-2018-9921',
  taxId: 'GST-IN-22-ELITE',
  termsAccepted: true,
  privacyAccepted: true
};

export default function EventAdminOnboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState(INITIAL_DATA);
  const [isSticky, setIsSticky] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!isEditing) return;
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent as keyof typeof prev] as object, [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name as keyof typeof prev]: value }));
    }
  };

  const handleCategoryToggle = (cat: string) => {
    if (!isEditing) return;
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    updateUser({ organisation: formData.companyName });
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center space-y-16 relative overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 space-y-12">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="w-32 h-32 rounded-[48px] bg-primary/20 border-2 border-primary/40 flex items-center justify-center shadow-[0_0_80px_rgba(255,45,154,0.4)] mx-auto relative group"
          >
            <div className="absolute inset-0 bg-primary animate-ping opacity-20 rounded-[48px]" />
            <CheckCircle2 className="w-16 h-16 text-white relative z-10" />
          </motion.div>
          
          <div className="space-y-6">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-6xl font-black text-white tracking-tighter uppercase leading-none"
            >
              Setup <span className="text-primary neon-text">Complete</span>
            </motion.h1>
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/40 max-w-xl mx-auto text-lg font-medium leading-relaxed tracking-wide"
            >
              Your details have been submitted. Our team will review your application and verify your details shortly.
            </motion.p>
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <button 
              onClick={() => navigate('/')}
              className="px-12 py-5 rounded-[24px] bg-primary text-white text-[12px] font-black uppercase tracking-[0.3em] hover:bg-primary/90 transition-all shadow-[0_20px_50px_rgba(255,45,154,0.4)] flex items-center gap-4 mx-auto group active:scale-95"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-16 pb-48 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-5xl mx-auto space-y-20 relative z-10">
        <AnimatePresence>
          {isSticky && (
            <motion.button
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              onClick={() => {
                setIsEditing(!isEditing);
                if (!isEditing) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className={cn(
                "fixed bottom-8 right-8 z-[100] px-8 py-4 rounded-[20px] shadow-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                isEditing 
                  ? "bg-primary text-white shadow-primary/30" 
                  : "bg-white text-black hover:bg-primary hover:text-white"
              )}
            >
              <Zap className={cn("w-4 h-4 transition-all", isEditing && "fill-current")} />
              <span>{isEditing ? 'Editing Mode' : 'Edit Details'}</span>
            </motion.button>
          )}
        </AnimatePresence>
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 text-primary">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Account Setup</span>
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">
              Welcome <span className="text-primary neon-text">Setup</span>
            </h1>
            <p className="text-white/40 font-medium text-xl max-w-xl">
              Complete your profile to start managing your events.
            </p>
          </div>
          
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "group relative px-8 py-4 rounded-[20px] overflow-hidden transition-all active:scale-95",
              isEditing 
                ? "bg-primary text-white shadow-[0_10px_30px_rgba(255,45,154,0.3)]" 
                : "bg-white/[0.03] border border-white/10 text-white/40 hover:text-white hover:bg-white/10"
            )}
          >
            <div className="relative flex items-center gap-3 text-[10px] font-black uppercase tracking-widest leading-none">
              <Zap className={cn("w-4 h-4 transition-all duration-500", isEditing && "fill-current scale-110")} />
              <span>{isEditing ? 'Editing Profile' : 'Edit Profile'}</span>
            </div>
          </button>
        </header>

        <div className="space-y-16">
          <FormSection title="Personal Details" icon={<User className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 items-start">
              <div className="md:col-span-1 space-y-4">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Profile Photo</label>
                <div className="aspect-square w-full rounded-[48px] bg-white/[0.02] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/[0.05] hover:border-primary/30 transition-all group/upload relative overflow-hidden">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/upload:bg-primary/20 transition-all">
                    <Upload className="w-6 h-6 text-white/10 group-hover/upload:text-primary transition-colors" />
                  </div>
                  <span className="text-[8px] font-black uppercase text-white/10 tracking-[0.2em] group-hover/upload:text-primary transition-colors">Upload Photo</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-10">
                <RefinedField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} readOnly={!isEditing} icon={<User className="w-4 h-4" />} />
                <RefinedField label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} readOnly={!isEditing} icon={<Phone className="w-4 h-4" />} />
                <div className="md:col-span-2">
                  <RefinedField label="Email Address" name="email" value={formData.email} onChange={handleChange} readOnly={!isEditing} icon={<Mail className="w-4 h-4" />} />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Business Information" icon={<Building2 className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <RefinedField label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} readOnly={!isEditing} icon={<Building2 className="w-4 h-4" />} />
              <RefinedField label="Business Type" name="companyType" value={formData.companyType} onChange={handleChange} readOnly={!isEditing} icon={<Layers className="w-4 h-4" />} />
              
              <div className="md:col-span-2 space-y-4">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Company Description</label>
                <textarea 
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  rows={4}
                  className={cn(
                    "w-full bg-[#09090B] border rounded-[32px] px-8 py-6 text-white focus:outline-none transition-all text-sm font-medium leading-relaxed resize-none",
                    !isEditing ? "border-white/5 text-white/20" : "border-white/10 hover:border-white/20 focus:border-primary"
                  )}
                />
              </div>
              <RefinedField label="Year Established" name="yearEstablished" value={formData.yearEstablished} onChange={handleChange} readOnly={!isEditing} icon={<Clock className="w-4 h-4" />} />
              <RefinedField label="Website" name="website" value={formData.website} onChange={handleChange} readOnly={!isEditing} icon={<Globe className="w-4 h-4" />} />
            </div>
          </FormSection>

          <FormSection title="Location" icon={<MapPin className="w-4 h-4" />}>
            <div className="flex flex-col lg:flex-row gap-12">
              <div className="flex-1 space-y-10">
                <RefinedField label="City" name="city" value={formData.city} onChange={handleChange} readOnly={!isEditing} icon={<MapPin className="w-4 h-4" />} />
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Full Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-8 top-8 text-white/10 w-5 h-5" />
                    <textarea 
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      readOnly={!isEditing}
                      rows={6}
                      className={cn(
                        "w-full bg-[#09090B] border rounded-[40px] pl-16 pr-8 py-8 text-white focus:outline-none transition-all text-sm font-medium leading-relaxed resize-none",
                        !isEditing ? "border-white/5 text-white/20" : "border-white/10 hover:border-white/20 focus:border-primary"
                      )}
                    />
                  </div>
                </div>
              </div>
              <div className="lg:w-[450px] flex flex-col space-y-4">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Map View</label>
                <div className="flex-1 min-h-[350px] rounded-[48px] overflow-hidden border border-white/5 bg-[#09090B]/50 relative group/map p-2">
                  <div className="w-full h-full rounded-[40px] overflow-hidden relative">
                    <iframe
                      width="100%"
                      height="100%"
                      frameBorder="0"
                      style={{ border: 0, filter: 'grayscale(1) invert(1) contrast(1.2) opacity(0.2)' }}
                      src={`https://www.google.com/maps?q=${encodeURIComponent(formData.address)}&output=embed`}
                      allowFullScreen
                      title="Map"
                    ></iframe>
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Event Categories" icon={<Zap className="w-4 h-4" />}>
            <div className="flex flex-wrap gap-5">
              {formData.categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryToggle(cat)}
                  disabled={!isEditing}
                  className="px-8 py-4 rounded-[20px] text-[11px] font-black uppercase tracking-widest transition-all border bg-primary text-white border-primary shadow-[0_10px_30px_rgba(255,45,154,0.3)] active:scale-95"
                >
                  {cat}
                </button>
              ))}
              {['Nightlife', 'Concerts', 'Festivals', 'Corporate Events', 'Weddings', 'Exhibitions', 'Artist Management']
                .filter(c => !formData.categories.includes(c))
                .map(cat => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryToggle(cat)}
                    disabled={!isEditing}
                    className="px-8 py-4 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all border border-white/5 bg-white/[0.02] text-white/20 hover:text-white/60 hover:bg-white/[0.05] hover:border-white/20 active:scale-95"
                  >
                    {cat}
                  </button>
                ))
              }
              {isEditing && (
                <div className="flex items-center">
                  <NicheInput 
                    isEditingMode={isEditing}
                    onAdd={(newNiches) => {
                      setFormData(prev => ({
                        ...prev,
                        categories: Array.from(new Set([...prev.categories, ...newNiches]))
                      }));
                    }} 
                  />
                </div>
              )}
            </div>
          </FormSection>

          <FormSection title="Social Media & Photos" icon={<Upload className="w-4 h-4" />}>
            <div className="space-y-16">
              <div className="space-y-6">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Cover Photo</label>
                <div className="aspect-[24/10] w-full rounded-[48px] bg-white/[0.02] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-white/[0.05] hover:border-primary/30 transition-all group/banner relative overflow-hidden">
                  <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/banner:bg-primary/20 transition-all relative z-10">
                    <Upload className="w-8 h-8 text-white/10 group-hover/banner:text-primary transition-colors" />
                  </div>
                  <div className="space-y-2 text-center relative z-10 px-6">
                    <span className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] block group-hover/banner:text-primary transition-colors">Upload Cover Photo</span>
                    <span className="text-[8px] font-medium text-white/10 uppercase tracking-widest block">Recommended: 1920x820 | Max 5MB</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 items-end">
                <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-10">
                  <RefinedField label="Instagram" name="socialLinks.instagram" value={formData.socialLinks.instagram} onChange={handleChange} readOnly={!isEditing} icon={<Instagram className="w-4 h-4" />} />
                  <RefinedField label="LinkedIn" name="socialLinks.linkedin" value={formData.socialLinks.linkedin} onChange={handleChange} readOnly={!isEditing} icon={<Linkedin className="w-4 h-4" />} />
                  <RefinedField label="Facebook" name="socialLinks.facebook" value={formData.socialLinks.facebook} onChange={handleChange} readOnly={!isEditing} icon={<Facebook className="w-4 h-4" />} />
                  <RefinedField label="YouTube" name="socialLinks.youtube" value={formData.socialLinks.youtube} onChange={handleChange} readOnly={!isEditing} icon={<Youtube className="w-4 h-4" />} />
                </div>

                <div className="xl:col-span-5 space-y-6">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">Profile Picture</label>
                  <div className="aspect-square w-full rounded-[48px] bg-white/[0.02] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-white/[0.05] hover:border-primary/30 transition-all group/portrait relative overflow-hidden">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/portrait:bg-primary/20 transition-all relative z-10">
                      <User className="w-8 h-8 text-white/10 group-hover/portrait:text-primary transition-colors" />
                    </div>
                    <div className="space-y-2 text-center relative z-10 px-6">
                      <span className="text-[10px] font-black uppercase text-white/20 tracking-[0.3em] block group-hover/portrait:text-primary transition-colors">Upload Picture</span>
                      <span className="text-[8px] font-medium text-white/10 uppercase tracking-widest block">Recommended: 800x800</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-bl from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Verification" icon={<ShieldCheck className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <RefinedField label="Registration Number" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} readOnly={!isEditing} icon={<FileText className="w-4 h-4" />} />
              <RefinedField label="Tax/VAT ID" name="taxId" value={formData.taxId} onChange={handleChange} readOnly={!isEditing} icon={<CheckSquare className="w-4 h-4" />} />
              <div className="md:col-span-2">
                <div className="p-12 rounded-[48px] border-2 border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center gap-6 group cursor-pointer hover:bg-white/[0.04] hover:border-primary/30 transition-all">
                  <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-primary/20 transition-all">
                    <Upload className="w-6 h-6 text-white/10 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-[12px] font-black uppercase tracking-[0.2em] text-white/40 group-hover:text-white transition-colors">Upload Documents</p>
                    <p className="text-[9px] text-white/10 font-bold uppercase tracking-tighter">PDF | Vector | Raster (5MB Limit)</p>
                  </div>
                </div>
              </div>
            </div>
          </FormSection>

          <footer className="space-y-12">
            <div className="flex flex-col gap-5 p-10 rounded-[32px] bg-white/[0.02] border border-white/5">
              <label className="flex items-center gap-5 group cursor-pointer">
                <div className={cn(
                  "w-6 h-6 rounded-[8px] border flex items-center justify-center transition-all",
                  formData.termsAccepted ? "bg-primary border-primary" : "border-white/10 bg-white/5"
                )}>
                  {formData.termsAccepted && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">I accept the Terms and Conditions</span>
              </label>
              <label className="flex items-center gap-5 group cursor-pointer">
                <div className={cn(
                  "w-6 h-6 rounded-[8px] border flex items-center justify-center transition-all",
                  formData.privacyAccepted ? "bg-primary border-primary" : "border-white/10 bg-white/5"
                )}>
                  {formData.privacyAccepted && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">I accept the Privacy Policy</span>
              </label>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-24 rounded-[32px] bg-primary text-white text-md font-black uppercase tracking-[0.4em] transition-all shadow-[0_20px_60px_rgba(255,45,154,0.4)] flex items-center justify-center gap-4 relative overflow-hidden group active:scale-95 disabled:grayscale"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Zap className="w-6 h-6 fill-current group-hover:scale-110 transition-transform" />
                  Complete Setup
                </>
              )}
            </button>
          </footer>
        </div>
      </div>
    </div>
  );
}

function NicheInput({ onAdd, isEditingMode }: { onAdd: (niches: string[]) => void, isEditingMode: boolean }) {
  const [isAdding, setIsAdding] = useState(false);
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (!isEditingMode) return;
    if (value.trim()) {
      const newNiches = value.split(',').map(s => s.trim()).filter(Boolean);
      onAdd(newNiches);
      setValue('');
    }
    setIsAdding(false);
  };

  if (isAdding && isEditingMode) {
    return (
      <div className="flex items-center">
        <input 
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') setIsAdding(false);
          }}
          onBlur={handleSubmit}
          placeholder="New Category..."
          className="px-8 py-4 rounded-[20px] bg-white/10 border border-primary/50 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none min-w-[200px]"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => isEditingMode && setIsAdding(true)}
      disabled={!isEditingMode}
      className={cn(
        "w-14 h-14 rounded-[20px] bg-white/[0.02] border border-dashed flex items-center justify-center transition-all text-2xl font-light",
        isEditingMode 
          ? "border-white/10 text-white/20 hover:text-white hover:border-primary hover:bg-primary/5" 
          : "border-white/5 text-white/5 cursor-not-allowed opacity-50"
      )}
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}


