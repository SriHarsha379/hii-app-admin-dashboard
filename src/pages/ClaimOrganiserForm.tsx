import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  MapPin,
  Mail,
  Phone,
  User,
  Users2,
  ChevronLeft,
  ChevronDown,
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

import { API_BASE } from '../lib/apiConfig';
export default function ClaimClubForm() {
  const navigate = useNavigate();
  const { clubId } = useParams();
  const { token, updateUser } = useAuth();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 150);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const [portraitImage, setPortraitImage] = useState<string | null>(null);
  const [landscapeImage, setLandscapeImage] = useState<string | null>(null);

  const { data: club, isLoading: isLoadingClub } = useQuery({
    queryKey: ['club', clubId],
    queryFn: async () => {
      // FIXED: was hitting `/clubs/${clubId}`, which doesn't exist anywhere
      // in the real backend — the actual endpoint is `/vendor/get_vendor_by_id/:id`.
      const res = await fetch(`${API_BASE}/vendor/get_vendor_by_id/${clubId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Organiser not found');
      const json = await res.json();
      return json.data ?? null;
    },
    enabled: Boolean(token && clubId)
  });

  // References for hidden file inputs — kept for the profile picture field
  // still further down; portrait/landscape venue image concepts don't
  // apply to an event organiser account, only Basic Details/Contact
  // Info/Business Details (registration number, tax ID, description),
  // which are all genuine Vendor fields and read correctly on their own.
  const portraitInputRef = React.useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    address: '',
    email: '',
    phone: '',
    contactPerson: '',
    description: '',
    registrationNumber: '',
    taxId: ''
  });

  useEffect(() => {
    if (!club) return;
    // FIXED: was reading `club.contact_info` (a JSON blob that doesn't
    // exist on the real Vendor schema — email/phone are direct fields)
    // and rendered `club.city` directly despite it coming back as a
    // populated {_id, city_name} object. All the fields here are genuine
    // Vendor fields — if any show blank, that's honestly reflecting this
    // organiser not having filled that in yet, not a bug in this form.
    setFormData({
      name: club.name || '',
      city: (typeof club.city === 'object' ? club.city?.city_name : club.city) || '',
      address: club.address || '',
      email: club.email || '',
      phone: club.phone_number || '',
      contactPerson: club.contact_person || '',
      description: club.description || '',
      registrationNumber: club.registration_number || '',
      taxId: club.tax_id || ''
    });
  }, [club]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!isEditing) return;
    setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // FIXED: was completely fake — called setIsSuccess(true) with zero
  // backend interaction at all. Someone could fill out this entire form,
  // click "Claim This Venue," see a success screen, and literally nothing
  // would happen — no account linkage, no data saved, nothing.
  //
  // Since the person reaching this page is already logged into an
  // existing Admin account (that's how ProtectedRoute let them get here),
  // claiming doesn't need to create anything new — it links their
  // existing account to this already-existing vendor the same way fresh
  // registration does (by matching organisation to the vendor's name),
  // then lets the existing approval gate in App.tsx decide whether they
  // land on Pending Approval or their real dashboard, based on this
  // vendor's actual verification status.
  const handleClaim = async () => {
    setClaimError(null);
    setIsClaiming(true);
    try {
      // If they edited any details while claiming, save those first.
      if (isEditing && club?._id) {
        const body = new FormData();
        body.append('name', formData.name);
        body.append('address', formData.address);
        body.append('email', formData.email);
        body.append('phone_number', formData.phone);
        body.append('contact_person', formData.contactPerson);
        body.append('description', formData.description);
        body.append('registration_number', formData.registrationNumber);
        body.append('tax_id', formData.taxId);
        const res = await fetch(`${API_BASE}/vendor/update_vendor/${club._id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body,
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json?.message?.[0] || json?.message || 'Failed to save your changes');
        }
      }

      updateUser({ organisation: club.name });
      setIsSuccess(true);
    } catch (err: any) {
      setClaimError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  if (isLoadingClub) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-white/60">Organiser not found.</p>
          <button onClick={() => navigate('/event-onboarding')} className="text-primary hover:underline">Go back</button>
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
          onClick={() => navigate('/event-onboarding')}
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
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Claim Your Organisation</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-none uppercase">
              Claiming <span className="text-primary neon-text">{club.name}</span>
            </h1>
            <p className="text-white/40 font-medium text-lg max-w-xl">
              Verification required. Please validate the company details before submitting the claim for approval.
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
                    label="Company Name"
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

            <FormSection title="Business Details" icon={<FileText className="w-4 h-4" />}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <RefinedField
                  label="Registration Number"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  placeholder="Company registration number"
                  icon={<FileText className="w-4 h-4" />}
                />
                <RefinedField
                  label="Tax ID"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  placeholder="GST / PAN / Tax ID"
                  icon={<FileText className="w-4 h-4" />}
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
                    placeholder="Describe your company..."
                  />
                </div>
              </div>
            </FormSection>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-12 border-t border-white/5">
          <button
            onClick={() => navigate('/event-onboarding')}
            className="w-full sm:w-auto px-12 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[11px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-xl"
          >
            <ChevronLeft className="w-5 h-5" />
            Cancel
          </button>
          <button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full sm:w-auto px-16 py-6 rounded-[24px] bg-primary text-white text-[12px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,45,154,0.3)] flex items-center justify-center gap-4 group disabled:opacity-50 disabled:hover:scale-100"
          >
            <Zap className="w-5 h-5 fill-current" />
            {isClaiming ? 'Submitting…' : 'Submit Claim'}
            <Sparkles className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all group-hover:rotate-12" />
          </button>
        </div>
        {claimError && (
          <p className="text-center text-[11px] text-red-400 font-bold mt-4">{claimError}</p>
        )}
      </div>
    </div>
  );
}