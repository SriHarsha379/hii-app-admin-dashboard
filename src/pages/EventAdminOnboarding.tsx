import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  MapPin, 
  Mail, 
  Phone, 
  Lock,
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
import { useQuery } from '@tanstack/react-query';
import { API_BASE } from '../lib/apiConfig';

const INITIAL_DATA = {
  fullName: '',
  email: '',
  phone: '',
  companyName: '',
  companyType: '',
  description: '',
  yearEstablished: '',
  city: '',
  website: '',
  address: '',
  categories: [] as string[],
  socialLinks: {
    instagram: '',
    linkedin: '',
    facebook: '',
    youtube: ''
  },
  registrationNumber: '',
  taxId: '',
  password: '',
  confirmPassword: '',
  termsAccepted: false,
  privacyAccepted: false
};

export default function EventAdminOnboarding() {
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();
  // FIXED: was defaulting to false (read-only) — reasonable for a page
  // reviewing *existing* data before editing it, but this is a brand-new
  // registration form with nothing pre-filled yet. Starting read-only
  // meant every field silently rejected input until someone happened to
  // find and click "Edit Details" first.
  const [isEditing, setIsEditing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const profileImageInputRef = React.useRef<HTMLInputElement>(null);


  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const { data: cities } = useQuery({
    queryKey: ['cities-event-onboarding'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/city/get_all_cities`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  // Live "claim this instead" check — matches against real event_organizer
  // vendor names as the company name is typed, so someone doesn't
  // accidentally create a duplicate account for a company Super Admin has
  // already listed. Same pattern already used on Club registration.
  const { data: claimableOrganisers } = useQuery({
    queryKey: ['claimable-organisers'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      return list.filter((v: any) => v.vendor_type === 'event_organizer');
    },
  });

  const [formData, setFormData] = useState(() => ({
    ...INITIAL_DATA,
    // FIXED: was pre-filling fullName/email/companyName from the logged-in
    // admin's own login identity — same issue fixed on the Club
    // registration wizard. This account was very likely created by Super
    // Admin with a placeholder identity, not the real organiser's actual
    // details, so pre-filling with it is actively misleading.
  }));

  // ── Email OTP verification ────────────────────────────────────────────────
  // NEW: was entirely missing on this form — anyone could register without
  // ever proving they control the email address they entered. Reuses the
  // same real, role-agnostic vendor OTP endpoints already built and
  // working on Club registration.
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');

  const handleSendOtp = async () => {
    setOtpError(null);
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      setOtpError('Enter a valid email address first.');
      return;
    }
    setIsSendingOtp(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/send_registration_otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: formData.email, name: formData.fullName || formData.companyName }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message?.[0] || json?.message || 'Failed to send OTP');
      }
      setOtpSent(true);
      setEmailVerified(false);
      setOtpCode('');
    } catch (err: any) {
      setOtpError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError(null);
    if (!otpCode || otpCode.length < 4) {
      setOtpError('Enter the 4-digit code from your email.');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/verify_registration_otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: formData.email, otp: otpCode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message?.[0] || json?.message || 'Incorrect OTP');
      }
      setEmailVerified(true);
      setVerifiedEmail(formData.email);
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // If they change the email after verifying, the old verification no
  // longer applies to the new address — re-require sending a fresh OTP.
  const emailChangedSinceVerify = emailVerified && formData.email !== verifiedEmail;

  const nameMatchedOrganiser = React.useMemo(() => {
    const q = formData.companyName.trim().toLowerCase();
    if (q.length < 3 || !Array.isArray(claimableOrganisers)) return null;
    return claimableOrganisers.find((v: any) => v.name?.toLowerCase() === q) || null;
  }, [formData.companyName, claimableOrganisers]);

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

  // FIXED: was completely fake — didn't touch the backend at all, just set
  // `organisation` locally and showed a "Setup Complete" screen. No Vendor
  // account was ever created, no data was ever saved, and — since the
  // approval gate only ever checked CLUB_ADMIN — this let an Event Admin
  // straight into the full dashboard with a made-up organisation name and
  // zero verification of any kind.
  const handleSubmit = async () => {
    setSubmitError(null);
    if (!formData.companyName || !formData.email || !formData.phone) {
      setSubmitError('Company name, email, and phone number are required.');
      return;
    }
    if (!emailVerified || emailChangedSinceVerify) {
      setSubmitError('Please verify your email before submitting.');
      return;
    }
    if (!formData.city) {
      setSubmitError('Select a city.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setSubmitError('Choose a password of at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setSubmitError('Passwords do not match.');
      return;
    }
    if (!formData.termsAccepted || !formData.privacyAccepted) {
      setSubmitError('Please accept the terms and privacy policy to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCity = (Array.isArray(cities) ? cities : []).find((c: any) => c._id === formData.city);
      if (!selectedCity) throw new Error('Select a valid city.');
      const stateId = typeof selectedCity.state_id === 'object' ? selectedCity.state_id?._id : selectedCity.state_id;
      if (!stateId) throw new Error('This city has no linked state on record. Please choose a different city.');

      const body = new FormData();
      body.append('name', formData.companyName);
      body.append('email', formData.email);
      body.append('phone_number', formData.phone);
      body.append('city', formData.city);
      body.append('state', stateId);
      body.append('address', formData.address || 'Not provided');
      body.append('password', formData.password);
      body.append('vendor_type', 'event_organizer');
      body.append('contact_person', formData.fullName || '');
      body.append('description', formData.description || '');
      body.append('registration_number', formData.registrationNumber || '');
      body.append('tax_id', formData.taxId || '');
      // FIXED: was never sending the selected file at all — the backend
      // accepts it as "business_image" (a single-file field, same as
      // Club registration's photo).
      if (profileImageFile) body.append('business_image', profileImageFile);

      const res = await fetch(`${API_BASE}/vendor/add_vendor`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json?.message?.[0] || json?.message || `Registration failed with status ${res.status}`);
      }

      // New signups require Super Admin approval before they get full
      // access — see the "Organiser Requests" review page.
      updateUser({ organisation: formData.companyName });
      setIsSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
              onClick={() => navigate('/pending-approval')}
              className="px-12 py-5 rounded-[24px] bg-primary text-white text-[12px] font-black uppercase tracking-[0.3em] hover:bg-primary/90 transition-all shadow-[0_20px_50px_rgba(255,45,154,0.4)] flex items-center gap-4 mx-auto group active:scale-95"
            >
              View Status
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
                {/* FIXED: was a purely decorative div — no file input, no
                    click handler, no way to actually select or upload
                    anything. Now genuinely wired to a real file input. */}
                <input
                  ref={profileImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageSelect}
                />
                <div
                  onClick={() => profileImageInputRef.current?.click()}
                  className="aspect-square w-full rounded-[48px] bg-white/[0.02] border-2 border-dashed border-white/5 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-white/[0.05] hover:border-primary/30 transition-all group/upload relative overflow-hidden"
                >
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Profile preview" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover/upload:bg-primary/20 transition-all">
                        <Upload className="w-6 h-6 text-white/10 group-hover/upload:text-primary transition-colors" />
                      </div>
                      <span className="text-[8px] font-black uppercase text-white/10 tracking-[0.2em] group-hover/upload:text-primary transition-colors">Upload Photo</span>
                    </>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </div>
              </div>

              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-10">
                <RefinedField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} readOnly={!isEditing} icon={<User className="w-4 h-4" />} />
                <RefinedField label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} readOnly={!isEditing} icon={<Phone className="w-4 h-4" />} />
                <div className="md:col-span-2">
                  <RefinedField label="Email Address" name="email" value={formData.email} onChange={(e: any) => { handleChange(e); setOtpSent(false); setEmailVerified(false); }} readOnly={!isEditing} icon={<Mail className="w-4 h-4" />} />

                  {/* Email OTP verification — required before this admin
                      can complete registration. Reuses the same real
                      email-sending infrastructure already used on Club
                      registration. */}
                  <div className="md:col-span-2 p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                    {emailVerified && !emailChangedSinceVerify ? (
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Email verified
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                            {otpSent && !emailChangedSinceVerify ? 'Enter the code sent to your email' : 'Verify your email to continue'}
                          </p>
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isSendingOtp || !isEditing}
                            className="px-4 py-2 rounded-xl bg-primary/20 border border-primary/30 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/30 transition-all disabled:opacity-50"
                          >
                            {isSendingOtp ? 'Sending…' : (otpSent ? 'Resend OTP' : 'Send OTP')}
                          </button>
                        </div>
                        {otpSent && !emailChangedSinceVerify && (
                          <div className="flex items-center gap-3">
                            <input
                              type="text"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                              placeholder="4-digit code"
                              maxLength={4}
                              className="flex-1 bg-[#09090B] border border-white/10 rounded-xl px-4 py-3 text-sm text-white tracking-[0.3em] text-center focus:outline-none focus:ring-1 focus:ring-primary/50"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={isVerifyingOtp}
                              className="px-5 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 shrink-0"
                            >
                              {isVerifyingOtp ? 'Verifying…' : 'Verify'}
                            </button>
                          </div>
                        )}
                        {otpError && <p className="text-[10px] text-red-400 font-bold">{otpError}</p>}
                      </>
                    )}
                  </div>
                </div>
                <RefinedField label="Choose a Password" name="password" type="password" value={formData.password} onChange={handleChange} readOnly={!isEditing} placeholder="At least 6 characters" icon={<Lock className="w-4 h-4" />} />
                <RefinedField label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} readOnly={!isEditing} placeholder="Re-enter password" icon={<Lock className="w-4 h-4" />} />
              </div>
            </div>
          </FormSection>

          <FormSection title="Business Information" icon={<Building2 className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <RefinedField label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} readOnly={!isEditing} icon={<Building2 className="w-4 h-4" />} />
              {/* Inline "claim this instead" — mirrors the same feature on
                  Club registration, so someone doesn't accidentally
                  create a duplicate account for a company Super Admin has
                  already listed. */}
              {nameMatchedOrganiser && (
                <div className="md:col-span-2 p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-200/90">
                      <span className="font-bold text-amber-300">"{nameMatchedOrganiser.name}"</span> already exists in our system. Is this your company?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/claim-organiser/${nameMatchedOrganiser._id}`)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest text-amber-300 hover:bg-amber-500/30 transition-all shrink-0"
                  >
                    Claim It Instead
                  </button>
                </div>
              )}
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
                {/* FIXED: was a free-text input — city needs to be a real
                    City reference (ObjectId), not a typed string, same
                    fix already applied everywhere else in this app. */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] ml-1">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-8 top-1/2 -translate-y-1/2 text-white/10 w-5 h-5 z-10" />
                    <select
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={!isEditing}
                      className={cn(
                        "w-full bg-transparent border rounded-[24px] pl-16 pr-8 py-6 text-white focus:outline-none transition-all appearance-none",
                        !isEditing ? "border-white/5 text-white/20 cursor-not-allowed" : "border-white/10 hover:border-white/20 focus:border-primary/50"
                      )}
                    >
                      <option value="">Select city...</option>
                      {(Array.isArray(cities) ? cities : []).slice().sort((a: any, b: any) => (a.city_name || '').localeCompare(b.city_name || '')).map((c: any) => (
                        <option key={c._id} value={c._id}>{c.city_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
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
              {/* FIXED: this "Cover Photo" upload and the duplicate
                  "Profile Picture" upload further down were both purely
                  decorative — no file input, no click handler, and even if
                  wired up, the backend has no field to receive either of
                  them (only a single business_image upload exists, which
                  is now wired to the real Profile Photo field above). Left
                  as an honest "not available yet" note rather than
                  building something that looks functional but has nowhere
                  to actually save. */}
              <div className="p-8 rounded-[32px] border border-white/5 bg-white/[0.01] flex items-center gap-4">
                <Upload className="w-5 h-5 text-white/20 shrink-0" />
                <p className="text-xs text-white/30 font-medium">
                  Cover photo uploads aren't available yet — use the Profile Photo field above for now. This will be added in a future update.
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-16 items-end">
                <div className="xl:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                  <RefinedField label="Instagram" name="socialLinks.instagram" value={formData.socialLinks.instagram} onChange={handleChange} readOnly={!isEditing} icon={<Instagram className="w-4 h-4" />} />
                  <RefinedField label="LinkedIn" name="socialLinks.linkedin" value={formData.socialLinks.linkedin} onChange={handleChange} readOnly={!isEditing} icon={<Linkedin className="w-4 h-4" />} />
                  <RefinedField label="Facebook" name="socialLinks.facebook" value={formData.socialLinks.facebook} onChange={handleChange} readOnly={!isEditing} icon={<Facebook className="w-4 h-4" />} />
                  <RefinedField label="YouTube" name="socialLinks.youtube" value={formData.socialLinks.youtube} onChange={handleChange} readOnly={!isEditing} icon={<Youtube className="w-4 h-4" />} />
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="Verification" icon={<ShieldCheck className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <RefinedField label="Registration Number" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} readOnly={!isEditing} icon={<FileText className="w-4 h-4" />} />
              <RefinedField label="Tax/VAT ID" name="taxId" value={formData.taxId} onChange={handleChange} readOnly={!isEditing} icon={<CheckSquare className="w-4 h-4" />} />
              <div className="md:col-span-2 p-8 rounded-[32px] border border-white/5 bg-white/[0.01] flex items-center gap-4">
                <Upload className="w-5 h-5 text-white/20 shrink-0" />
                <p className="text-xs text-white/30 font-medium">
                  Document upload isn't available yet. This will be added in a future update — for now, Registration Number and Tax ID above are saved with your account.
                </p>
              </div>
            </div>
          </FormSection>

          <footer className="space-y-12">
            <div className="flex flex-col gap-5 p-10 rounded-[32px] bg-white/[0.02] border border-white/5">
              {/* FIXED: these looked like interactive checkboxes (cursor-
                  pointer, hover styling) but had no onClick handler at
                  all — clicking them did nothing, so termsAccepted/
                  privacyAccepted could never become true, which
                  handleSubmit requires. Nobody could have completed this
                  form. */}
              <label
                onClick={() => setFormData(prev => ({ ...prev, termsAccepted: !prev.termsAccepted }))}
                className="flex items-center gap-5 group cursor-pointer"
              >
                <div className={cn(
                  "w-6 h-6 rounded-[8px] border flex items-center justify-center transition-all",
                  formData.termsAccepted ? "bg-primary border-primary" : "border-white/10 bg-white/5"
                )}>
                  {formData.termsAccepted && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">I accept the Terms and Conditions</span>
              </label>
              <label
                onClick={() => setFormData(prev => ({ ...prev, privacyAccepted: !prev.privacyAccepted }))}
                className="flex items-center gap-5 group cursor-pointer"
              >
                <div className={cn(
                  "w-6 h-6 rounded-[8px] border flex items-center justify-center transition-all",
                  formData.privacyAccepted ? "bg-primary border-primary" : "border-white/10 bg-white/5"
                )}>
                  {formData.privacyAccepted && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">I accept the Privacy Policy</span>
              </label>
            </div>

            {submitError && (
              <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-300 text-sm font-bold">{submitError}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !emailVerified || emailChangedSinceVerify}
              title={!emailVerified || emailChangedSinceVerify ? 'Verify your email to continue' : undefined}
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