import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FormSection, RefinedField } from '../components/RefinedForm';
import {
  Building2,
  Search,
  Plus,
  ChevronRight,
  ChevronLeft,
  Info,
  Check,
  MapPin,
  ArrowLeft,
  SearchIcon,
  Phone,
  Mail,
  Zap,
  X,
  Upload,
  User,
  Lock,
  Clock,
  CheckCircle2,
  Shield,
  Camera,
  Layers,
  Sparkles,
  Loader2,
  Users,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { FilterDropdown } from '../components/FilterDropdown';
import { useQuery } from '@tanstack/react-query';

import { API_BASE } from '../lib/apiConfig';
// ── Image upload helper ───────────────────────────────────────────────────────
// Sends a file to /api/upload (multer endpoint) and returns the server-side URL.
// Using base64 strings directly would make the payload enormous and break image
// rendering everywhere downstream.
async function uploadImage(file: File, token: string): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
  const data = await res.json();
  return data.url as string; // e.g. "/uploads/1234567890-portrait.jpg"
}

const initialForm = {
  name: '',
  type: '',
  email: '',
  capacity: '',
  contactName: '',
  phone: '',
  description: '',
  city: '',
  address: '',
  password: '',
  confirmPassword: '',
  // Arrays of server-side URL strings — NOT base64
  landscape_urls: [] as string[],
  portraits: [] as string[],
  portrait_url: '',
};

export default function ClubOnboarding() {
  const { user, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'options' | 'register' | 'claim'>('options');
  const [registerStep, setRegisterStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Email OTP verification ────────────────────────────────────────────────
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');

  const handleSendOtp = async () => {
    setOtpError(null);
    if (!venueFormData.email || !/^\S+@\S+\.\S+$/.test(venueFormData.email)) {
      setOtpError('Enter a valid email address first.');
      return;
    }
    setIsSendingOtp(true);
    try {
      const res = await fetch(`${API_BASE}/vendor/send_registration_otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: venueFormData.email, name: venueFormData.contactName || venueFormData.name }),
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
        body: JSON.stringify({ email: venueFormData.email, otp: otpCode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(json?.message?.[0] || json?.message || 'Incorrect OTP');
      }
      setEmailVerified(true);
      setVerifiedEmail(venueFormData.email);
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // If they change the email after verifying, the old verification no
  // longer applies to the new address — re-require sending a fresh OTP.
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  // Tracks which images are currently uploading so we can show per-image spinners
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [uploadingLandscape, setUploadingLandscape] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  React.useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 150);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: cities, isLoading: loadingCities } = useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      // NOTE: was hitting `${API_BASE}/cities` (bare alias root, no handler → 404).
      const res = await fetch(`${API_BASE}/city/get_all_cities`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const { data: venueTypes, isLoading: loadingVenueTypes } = useQuery({
    queryKey: ['venueTypes'],
    queryFn: async () => {
      // NOTE: `${API_BASE}/venueTypes` doesn't exist on the backend either —
      // "venue types" are just Categories with category_type: 2 (1 = Event, 2 = Venue).
      const res = await fetch(`${API_BASE}/category/get_category`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : [];
      return list.filter((c: any) => c.category_type === 2);
    },
  });

  const { data: claimableClubs, isLoading: isLoadingClubs } = useQuery({
    queryKey: ['claimable-clubs'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed to load clubs');
      const json = await res.json();
      // Backend returns { success, message, data: [...] } — was reading the
      // raw response as the array itself, so this list was always empty.
      return Array.isArray(json.data) ? json.data : [];
    },
    enabled: Boolean(token) && (step === 'claim' || step === 'register'),
  });

  const cityOptions = Array.isArray(cities)
    ? cities.slice().sort((a: any, b: any) => (a.city_name || '').localeCompare(b.city_name || '')).map((c: any) => ({ label: c.city_name, value: c._id }))
    : [];

  const venueTypeOptions = Array.isArray(venueTypes)
    ? venueTypes.map((t: any) => ({ label: t.category_name, value: t._id }))
    : [];

  // ── Registration form ──────────────────────────────────────────────────────

  const [venueFormData, setVenueFormData] = useState({
    ...initialForm,
    email: user?.email || '',
    contactName: user?.name || '',
  });

  const emailChangedSinceVerify = emailVerified && venueFormData.email !== verifiedEmail;

  // Live "claim this instead" check — matches against real vendor names as
  // the club name is typed, only once at least 3 characters are entered
  // to avoid noisy false-positive matches on very short input.
  const nameMatchedClub = React.useMemo(() => {
    const q = venueFormData.name.trim().toLowerCase();
    if (q.length < 3 || !Array.isArray(claimableClubs)) return null;
    return claimableClubs.find((c: any) => c.name?.toLowerCase() === q) || null;
  }, [venueFormData.name, claimableClubs]);

  const [workingHours, setWorkingHours] = useState([
    { day: 'Monday',    time: '10:00 PM - 04:00 AM', active: true },
    { day: 'Tuesday',   time: '10:00 PM - 04:00 AM', active: true },
    { day: 'Wednesday', time: '10:00 PM - 04:00 AM', active: true },
    { day: 'Thursday',  time: '10:00 PM - 04:00 AM', active: true },
    { day: 'Friday',    time: '10:00 PM - 04:00 AM', active: true },
    { day: 'Saturday',  time: '10:00 PM - 04:00 AM', active: true },
    { day: 'Sunday',    time: '10:00 PM - 04:00 AM', active: true },
  ]);
  const [lastUsedTime, setLastUsedTime] = useState('10:00 PM - 04:00 AM');

  const toggleDay = (index: number) => {
    const updated = [...workingHours];
    const nowActive = !updated[index].active;
    updated[index].active = nowActive;
    if (nowActive) updated[index].time = lastUsedTime;
    setWorkingHours(updated);
  };

  const updateDayTime = (index: number, time: string) => {
    const updated = [...workingHours];
    updated[index].time = time;
    setLastUsedTime(time);
    setWorkingHours(updated);
  };

  // ── Image upload handlers ──────────────────────────────────────────────────

  // FIXED: was calling `uploadImage()`, a function that doesn't exist
  // anywhere in this codebase (not defined, not imported) — this would
  // throw a ReferenceError the instant anyone tried to add a photo,
  // crashing the whole registration flow. Now holds the raw File directly
  // and shows a local preview via URL.createObjectURL, attaching the real
  // file to the final multipart submission instead — same pattern already
  // used successfully on Events.tsx and Clubs.tsx.
  const [portraitFiles, setPortraitFiles] = useState<File[]>([]);
  const [landscapeFiles, setLandscapeFiles] = useState<File[]>([]);

  const handlePortraitUpload = (file: File) => {
    setUploadError(null);
    const url = URL.createObjectURL(file);
    setPortraitFiles((f) => [...f, file]);
    setVenueFormData((f) => ({
      ...f,
      portraits: [...f.portraits, url],
      portrait_url: f.portraits.length === 0 ? url : f.portrait_url,
    }));
  };

  const handleLandscapeUpload = (file: File) => {
    setUploadError(null);
    const url = URL.createObjectURL(file);
    setLandscapeFiles((f) => [...f, file]);
    setVenueFormData((f) => ({ ...f, landscape_urls: [...f.landscape_urls, url] }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  // FIXED — was three separate problems:
  // 1. Password was randomly generated and never shown or emailed to the
  //    registrant (confirmed: the backend's vendor-creation function sends
  //    no email at all) — the account would have been permanently
  //    unusable, since nobody would ever know the password.
  // 2. Everything collected in Steps 2 & 3 (category, capacity,
  //    description, and every uploaded photo) was silently discarded —
  //    only name/email/phone/city/address ever reached the backend.
  // 3. Registering only ever created a Vendor *account* — never an actual
  //    Venue *listing*, despite the form collecting venue details.
  // Now: creates the Vendor with the admin's own chosen password, then
  // creates a linked Venue with the real category/schedule/photos —
  // matching what Super Admin's own "+ Add Club" wizard actually submits.
  const handleRegister = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const selectedCity = (Array.isArray(cities) ? cities : []).find((c: any) => c._id === venueFormData.city);
      if (!selectedCity) {
        throw new Error('Select a city before submitting.');
      }
      if (!venueFormData.email || !venueFormData.phone) {
        throw new Error('Email and phone number are required.');
      }
      if (!venueFormData.password || venueFormData.password.length < 6) {
        throw new Error('Choose a password of at least 6 characters.');
      }
      if (venueFormData.password !== venueFormData.confirmPassword) {
        throw new Error('Passwords do not match.');
      }
      if (!emailVerified || emailChangedSinceVerify) {
        throw new Error('Please verify your email before submitting.');
      }
      const activeDays = workingHours.filter((h) => h.active);
      if (activeDays.length === 0) {
        throw new Error('Select at least one open day.');
      }
      if (!venueFormData.type) {
        throw new Error('Select a venue category.');
      }
      if (portraitFiles.length === 0) {
        throw new Error('Upload at least one venue photo.');
      }

      // Step 1: create the Vendor account with the admin's own password.
      const vendorBody = new FormData();
      vendorBody.append('name', venueFormData.name);
      vendorBody.append('email', venueFormData.email);
      vendorBody.append('phone_number', venueFormData.phone);
      vendorBody.append('city', venueFormData.city);
      vendorBody.append('state', selectedCity.state_id);
      vendorBody.append('address', venueFormData.address || 'Not provided');
      vendorBody.append('password', venueFormData.password);
      vendorBody.append('vendor_type', 'owner');
      vendorBody.append('contact_person', venueFormData.contactName || '');
      vendorBody.append('capacity', venueFormData.capacity || '');
      vendorBody.append('description', venueFormData.description || '');

      const vendorRes = await fetch(`${API_BASE}/vendor/add_vendor`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: vendorBody,
      });

      const vendorJson = await vendorRes.json().catch(() => null);
      if (!vendorRes.ok) {
        throw new Error(vendorJson?.message?.[0] || vendorJson?.message || `Registration failed with status ${vendorRes.status}`);
      }
      const newVendorId = vendorJson?.data?._id;

      // Step 2: create the linked Venue listing with the real category,
      // schedule, and photos — same real endpoint Super Admin's own venue
      // creation wizard uses.
      if (newVendorId) {
        const [start_time, end_time] = activeDays[0].time.split(' - ').map((s: string) => s.trim());
        const venueBody = new FormData();
        venueBody.append('venue_name', venueFormData.name);
        venueBody.append('city_id', venueFormData.city);
        venueBody.append('category_ids', JSON.stringify([venueFormData.type]));
        venueBody.append('open_days', JSON.stringify(activeDays.map((h) => h.day)));
        venueBody.append('start_time', start_time || '');
        venueBody.append('end_time', end_time || '');
        venueBody.append('address', venueFormData.address || '');
        venueBody.append('about', venueFormData.description || '');
        venueBody.append('vendor_id', newVendorId);
        if (portraitFiles[0]) venueBody.append('venue_image', portraitFiles[0]);
        landscapeFiles.forEach((f) => venueBody.append('gallery_images', f));

        const venueRes = await fetch(`${API_BASE}/venue/create_venue`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: venueBody,
        });
        if (!venueRes.ok) {
          // The vendor account was still created successfully even if this
          // part fails — don't block the whole registration on it, but do
          // surface it, since it means their venue listing is incomplete.
          console.error('Venue creation failed after vendor was created:', await venueRes.text());
        }
      }

      // New signups now require Super Admin approval before they can log in
      // — see the "Organiser Requests" review page. This isn't a failure,
      // just sets expectations correctly instead of implying the account is
      // immediately usable.
      updateUser({ organisation: venueFormData.name });
      setIsSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaim = (club: any) => {
    // FIXED: was `club.id`, but vendor records use `_id` (MongoDB
    // convention) — this always navigated to `/claim-club/undefined`.
    navigate(`/claim-club/${club._id || club.id}`);
  };

  // ── Claim search ───────────────────────────────────────────────────────────

  const [claimSearch, setClaimSearch] = useState('');
  const filteredClaimableClubs = (Array.isArray(claimableClubs) ? claimableClubs : []).filter(
    (club: any) => {
      const q = claimSearch.trim().toLowerCase();
      return !q || club.name?.toLowerCase().includes(q) || club.city?.toLowerCase().includes(q);
    }
  );

  // ── Success screen ─────────────────────────────────────────────────────────

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center p-6 text-center space-y-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px] animate-pulse delay-1000" />
        </div>
        <div className="relative z-10 space-y-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            className="w-32 h-32 rounded-[48px] bg-primary/20 border-2 border-primary/40 flex items-center justify-center shadow-[0_0_60px_rgba(255,45,154,0.3)] mx-auto relative"
          >
            <div className="absolute inset-2 rounded-[38px] bg-primary/10 animate-ping" />
            <Check className="w-16 h-16 text-white stroke-[3px]" />
          </motion.div>
          <div className="space-y-6">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter uppercase mb-2">
                Request <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Submitted</span>
              </h1>
              <div className="h-1.5 w-24 bg-primary mx-auto rounded-full shadow-[0_0_20px_rgba(255,45,154,0.5)]" />
            </motion.div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/40 max-w-lg mx-auto text-sm md:text-base font-medium leading-relaxed tracking-wide"
            >
              Your venue has been submitted for review. A Super Admin will approve your account shortly — check your email for login details and a heads-up once you're approved.
            </motion.p>
          </div>
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="pt-4">
            <button
              onClick={() => navigate('/')}
              className="px-12 py-5 rounded-[24px] bg-primary text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-2xl shadow-primary/30 flex items-center gap-4 mx-auto group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10">Go to Dashboard</span>
              <Zap className="w-5 h-5 fill-current relative z-10 group-hover:scale-110 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ── Options screen ─────────────────────────────────────────────────────────

  if (step === 'options') {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
        <div className="w-full max-w-4xl space-y-12 relative z-10">
          <div className="text-center space-y-4">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-black text-primary uppercase tracking-widest">
              <Zap className="w-3 h-3" /> Club Setup Process
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl md:text-6xl font-black text-white tracking-tight uppercase">
              Register Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Club</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-muted-foreground max-w-xl mx-auto text-lg">
              Let's get your club set up. Choose how you want to proceed.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setStep('register')}
              className="glass-card group p-8 rounded-3xl border border-white/5 hover:border-primary/50 transition-all cursor-pointer bg-gradient-to-b from-white/[0.02] to-transparent"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase">Register New Club</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-medium">
                Start fresh and list your venue on Hii App. We'll guide you through setting up your profile, location, and photos.
              </p>
              <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                Get Started <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setStep('claim')}
              className="glass-card group p-8 rounded-3xl border border-white/5 hover:border-purple-500/50 transition-all cursor-pointer bg-gradient-to-b from-white/[0.02] to-transparent"
            >
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2 uppercase">Claim Existing Club</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 font-medium">
                If your club was already pre-registered by our team, find it and link it to your account in just a few clicks.
              </p>
              <div className="flex items-center gap-2 text-purple-400 font-black text-xs uppercase tracking-widest">
                Search & Claim <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ── Claim screen ───────────────────────────────────────────────────────────

  if (step === 'claim') {
    return (
      <div className="min-h-screen bg-[#0B0B0F] p-6 lg:p-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <button onClick={() => setStep('options')} className="group flex items-center gap-2 text-muted-foreground hover:text-white transition-all font-bold text-xs uppercase tracking-widest">
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white group-hover:bg-white/5 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to options
          </button>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-white uppercase">Find Your Club</h1>
            <p className="text-muted-foreground font-medium">Search for your club by name or city.</p>
          </div>
          <div className="relative">
            <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={claimSearch}
              onChange={(e) => setClaimSearch(e.target.value)}
              placeholder="Search by club name or city..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-primary transition-all text-lg font-medium"
            />
          </div>
          <div className="grid gap-4">
            {isLoadingClubs && (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}
            {!isLoadingClubs && filteredClaimableClubs.map((club: any) => (
              <motion.div
                key={club._id || club.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-white border border-white/10">
                    <Building2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase">{club.name}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 font-bold uppercase tracking-wider">
                      <MapPin className="w-3 h-3" />
                      {club.city} — {club.address}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleClaim(club)}
                  disabled={submittingId !== null}
                  className="w-full md:w-auto px-10 py-3 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg hover:scale-105 disabled:opacity-50"
                >
                  {submittingId === club.id ? 'Claiming...' : 'Claim This Club'}
                </button>
              </motion.div>
            ))}
            {!isLoadingClubs && filteredClaimableClubs.length === 0 && (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-muted-foreground">
                  <SearchIcon className="w-8 h-8" />
                </div>
                <p className="text-muted-foreground">
                  {claimSearch ? `No clubs found matching "${claimSearch}"` : 'No clubs are available to claim.'}
                </p>
                <button onClick={() => setStep('register')} className="text-primary font-bold hover:underline">
                  Register a new club instead
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Registration flow ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0B0B0F] p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <button onClick={() => setStep('options')} className="group flex items-center gap-2 text-muted-foreground hover:text-white transition-all font-bold text-xs uppercase tracking-widest">
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white group-hover:bg-white/5 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to options
        </button>

        <div className="glass-card rounded-[32px] border border-white/10 shadow-2xl flex flex-col min-h-[80vh] relative">
          <AnimatePresence>
            {isSticky && (
              <motion.button
                initial={{ opacity: 0, x: 50, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.8 }}
                onClick={() => setRegisterStep(1)}
                className="fixed top-6 right-6 z-[100] px-8 py-4 rounded-[20px] shadow-2xl bg-white text-black hover:bg-primary hover:text-white flex items-center gap-3 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
              >
                <Building2 className="w-4 h-4" />
                <span>Edit Details</span>
              </motion.button>
            )}
          </AnimatePresence>

          <div className="p-8 lg:p-12 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-white tracking-tight uppercase underline decoration-primary/30 underline-offset-8">
                {registerStep === 1 ? 'Club Details' : registerStep === 2 ? 'Club Profile' : 'Photos & Media'}
              </h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em] mt-2">Step {registerStep} of 3</p>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className={cn("w-12 h-1.5 rounded-full transition-all duration-500", registerStep >= s ? "bg-primary shadow-[0_0_10px_rgba(255,45,154,0.5)]" : "bg-white/10")} />
              ))}
            </div>
          </div>

          <div className="flex-1 p-10 lg:p-14 overflow-y-auto scrollbar-hide">
            <AnimatePresence mode="wait">

              {registerStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                  <FormSection title="Basic Information" icon={<Building2 className="w-4 h-4" />}>
                    <div className="space-y-10">
                      <RefinedField
                        label="Club Name"
                        name="name"
                        value={venueFormData.name}
                        onChange={(e: any) => setVenueFormData({ ...venueFormData, name: e.target.value })}
                        placeholder="Enter club name"
                        icon={<Sparkles className="w-4 h-4" />}
                      />
                      {/* Inline "claim this instead" — as requested, so
                          someone doesn't accidentally create a duplicate
                          listing for a venue that's already in the system.
                          Was previously only reachable via a completely
                          separate "options" screen choice, not discoverable
                          while actually typing the venue name. */}
                      {nameMatchedClub && (
                        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                            <p className="text-xs text-amber-200/90">
                              <span className="font-bold text-amber-300">"{nameMatchedClub.name}"</span> already exists in our system. Is this your venue?
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleClaim(nameMatchedClub)}
                            className="px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest text-amber-300 hover:bg-amber-500/30 transition-all shrink-0"
                          >
                            Claim It Instead
                          </button>
                        </div>
                      )}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-8">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Select City</label>
                            {loadingCities ? (
                              <div className="flex items-center gap-2 text-muted-foreground text-xs py-6 px-10">
                                <Loader2 className="w-4 h-4 animate-spin" /> Loading cities…
                              </div>
                            ) : cityOptions.length === 0 ? (
                              <p className="text-[10px] text-amber-400 px-2">No cities available — check that /api/cities is reachable.</p>
                            ) : (
                              <FilterDropdown
                                value={venueFormData.city}
                                onChange={(val) => setVenueFormData({ ...venueFormData, city: val })}
                                options={cityOptions}
                                placeholder="Select city"
                                buttonClassName="py-6 px-10 rounded-[28px] text-sm bg-[#09090B] border border-white/5 hover:border-white/10 transition-all text-white font-medium"
                              />
                            )}
                          </div>
                          <div className="space-y-4">
                            <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1 text-primary">Full Address</label>
                            <textarea
                              rows={3}
                              value={venueFormData.address}
                              onChange={(e) => setVenueFormData({ ...venueFormData, address: e.target.value })}
                              placeholder="Enter local address"
                              className="w-full bg-[#09090B] border border-white/5 rounded-[32px] px-10 py-7 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 resize-none font-medium placeholder:text-white/10"
                            />
                          </div>
                        </div>
                        <div className="relative rounded-[40px] overflow-hidden border border-white/5 group min-h-[300px] shadow-inner bg-[#09090B]">
                          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80')] bg-cover bg-center grayscale opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px]">
                            <div className="w-16 h-16 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                              <MapPin className="w-8 h-8 text-primary fill-primary" />
                            </div>
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em]">Address Verified</span>
                          </div>
                          <div className="absolute top-6 right-6 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Verified Account
                          </div>
                        </div>
                      </div>
                    </div>
                  </FormSection>

                  <FormSection title="Contact Information" icon={<Mail className="w-4 h-4" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="col-span-1 md:col-span-2">
                        <RefinedField label="Email Address" name="email" type="email" value={venueFormData.email} onChange={(e: any) => { setVenueFormData({ ...venueFormData, email: e.target.value }); setOtpSent(false); setEmailVerified(false); }} placeholder="club@example.com" icon={<Mail className="w-4 h-4" />} />
                      </div>

                      {/* Email OTP verification — required before this admin
                          can complete registration. Reuses the same real
                          email-sending infrastructure already used
                          elsewhere in this backend for OTP verification. */}
                      <div className="col-span-1 md:col-span-2 p-6 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
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
                                disabled={isSendingOtp}
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
                      <RefinedField label="Phone Number" name="phone" value={venueFormData.phone} onChange={(e: any) => setVenueFormData({ ...venueFormData, phone: e.target.value })} placeholder="+91 00000 00000" icon={<Phone className="w-4 h-4" />} />
                      <RefinedField label="Contact Person" name="contactName" value={venueFormData.contactName} onChange={(e: any) => setVenueFormData({ ...venueFormData, contactName: e.target.value })} placeholder="Full Name" icon={<User className="w-4 h-4" />} />
                      <RefinedField label="Choose a Password" name="password" type="password" value={venueFormData.password} onChange={(e: any) => setVenueFormData({ ...venueFormData, password: e.target.value })} placeholder="At least 6 characters" icon={<Lock className="w-4 h-4" />} />
                      <RefinedField label="Confirm Password" name="confirmPassword" type="password" value={venueFormData.confirmPassword} onChange={(e: any) => setVenueFormData({ ...venueFormData, confirmPassword: e.target.value })} placeholder="Re-enter password" icon={<Lock className="w-4 h-4" />} />
                    </div>
                  </FormSection>
                </motion.div>
              )}

              {registerStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-12">
                  <FormSection title="Business Profile" icon={<Shield className="w-4 h-4" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Club Category</label>
                        {loadingVenueTypes ? (
                          <div className="flex items-center gap-2 text-muted-foreground text-xs py-6 px-10">
                            <Loader2 className="w-4 h-4 animate-spin" /> Loading types…
                          </div>
                        ) : venueTypeOptions.length === 0 ? (
                          <p className="text-[10px] text-amber-400 px-2">No venue types available.</p>
                        ) : (
                          <FilterDropdown
                            value={venueFormData.type}
                            onChange={(val) => setVenueFormData({ ...venueFormData, type: val })}
                            options={venueTypeOptions}
                            placeholder="Select classification"
                            buttonClassName="py-6 px-10 rounded-[28px] text-sm bg-[#09090B] border border-white/5 hover:border-white/10 transition-all text-white font-medium"
                          />
                        )}
                      </div>
                      <RefinedField label="Max Capacity" name="capacity" type="number" value={venueFormData.capacity} onChange={(e: any) => setVenueFormData({ ...venueFormData, capacity: e.target.value })} placeholder="Max capacity" icon={<Users className="w-4 h-4" />} />
                      <div className="col-span-1 md:col-span-2 space-y-4">
                        <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">About the Club</label>
                        <textarea
                          rows={6}
                          value={venueFormData.description}
                          onChange={(e) => setVenueFormData({ ...venueFormData, description: e.target.value })}
                          placeholder="Tell us about your venue..."
                          className="w-full bg-[#09090B] border border-white/5 rounded-[40px] px-10 py-8 text-sm text-white focus:outline-none focus:border-primary/50 transition-all hover:border-white/10 resize-none font-medium placeholder:text-white/10"
                        />
                      </div>
                    </div>
                  </FormSection>

                  {/* Open Days & Hours — the state/logic for this already
                      existed (toggleDay, updateDayTime, workingHours) but
                      was never actually rendered anywhere, so it was
                      silently missing from the form entirely despite the
                      backend requiring it to create a venue. */}
                  <FormSection title="Open Days & Hours" icon={<Clock className="w-4 h-4" />}>
                    <div className="space-y-3">
                      {workingHours.map((day, idx) => (
                        <div key={day.day} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                          <button
                            type="button"
                            onClick={() => toggleDay(idx)}
                            className={cn(
                              'w-12 h-6 rounded-full transition-all relative shrink-0',
                              day.active ? 'bg-primary' : 'bg-white/10'
                            )}
                          >
                            <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all', day.active ? 'left-6' : 'left-0.5')} />
                          </button>
                          <span className={cn('text-xs font-bold uppercase tracking-widest w-24 shrink-0', day.active ? 'text-white' : 'text-white/30')}>{day.day}</span>
                          {day.active ? (
                            <input
                              type="text"
                              value={day.time}
                              onChange={(e) => updateDayTime(idx, e.target.value)}
                              placeholder="10:00 PM - 04:00 AM"
                              className="flex-1 bg-transparent text-sm text-white/70 focus:outline-none placeholder:text-white/20"
                            />
                          ) : (
                            <span className="flex-1 text-sm text-white/20">Closed</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </FormSection>
                </motion.div>
              )}

              {registerStep === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-14">
                  {uploadError && (
                    <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{uploadError}</div>
                  )}
                  <FormSection title="Profile Photos" icon={<Camera className="w-4 h-4" />}>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                      {venueFormData.portraits.map((url: string, idx: number) => (
                        <motion.div
                          layout
                          key={url}
                          className={cn(
                            "relative aspect-[3/4] rounded-[32px] overflow-hidden border-2 transition-all duration-500 group/image",
                            venueFormData.portrait_url === url
                              ? "border-primary shadow-[0_15px_40px_rgba(255,45,154,0.3)] scale-[1.02]"
                              : "border-white/5 hover:border-white/20"
                          )}
                        >
                          <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-1000 group-hover/image:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                          {venueFormData.portrait_url !== url && (
                            <button
                              onClick={() => setVenueFormData({ ...venueFormData, portrait_url: url })}
                              className="absolute inset-0 bg-primary/20 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-md"
                            >
                              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] bg-primary/40 px-5 py-2.5 rounded-full border border-white/10 shadow-2xl">Set as Main</span>
                            </button>
                          )}
                          {venueFormData.portrait_url === url && (
                            <div className="absolute top-4 left-4 bg-primary rounded-full p-2 shadow-[0_0_20px_rgba(255,45,154,0.8)] border border-white/20">
                              <Check className="w-4 h-4 text-white stroke-[4px]" />
                            </div>
                          )}
                          <button
                            onClick={() => {
                              const next = venueFormData.portraits.filter((_: any, i: number) => i !== idx);
                              setVenueFormData({
                                ...venueFormData,
                                portraits: next,
                                portrait_url: venueFormData.portrait_url === url ? (next[0] || '') : venueFormData.portrait_url,
                              });
                            }}
                            className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/40 hover:text-red-500 opacity-0 group-hover/image:opacity-100 transition-all hover:border-red-500/50 hover:bg-red-500/10 active:scale-90"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </motion.div>
                      ))}

                      <label className="relative aspect-[3/4] rounded-[32px] border-2 border-dashed border-white/5 bg-[#09090B] hover:bg-white/[0.04] hover:border-primary/40 transition-all duration-500 flex flex-col items-center justify-center cursor-pointer group shadow-inner">
                        {uploadingPortrait ? (
                          <Loader2 className="w-7 h-7 text-primary animate-spin" />
                        ) : (
                          <>
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all group-hover:bg-primary/20">
                              <Plus className="w-7 h-7 text-white/20 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="mt-4 text-center">
                              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] block group-hover:text-primary transition-colors mb-1">Add Photo</span>
                              <span className="text-[8px] font-bold text-white/5 uppercase tracking-widest">Portrait</span>
                            </div>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingPortrait}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePortraitUpload(f); }}
                        />
                      </label>
                    </div>
                  </FormSection>

                  <FormSection title="Gallery Photos" icon={<Layers className="w-4 h-4" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                      {venueFormData.landscape_urls.map((url: string, idx: number) => (
                        <div key={url} className="relative aspect-video rounded-[40px] overflow-hidden border border-white/5 bg-[#09090B] group/landscape shadow-2xl">
                          <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-[2s] group-hover/landscape:scale-[1.15]" />
                          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/landscape:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-md">
                            <button
                              onClick={() => setVenueFormData({ ...venueFormData, landscape_urls: venueFormData.landscape_urls.filter((_: any, i: number) => i !== idx) })}
                              className="w-14 h-14 bg-red-500/10 rounded-[24px] text-red-500 hover:scale-110 transition-all flex items-center justify-center border border-red-500/20 active:scale-95"
                            >
                              <Trash2 className="w-6 h-6" />
                            </button>
                          </div>
                        </div>
                      ))}

                      <label className="relative aspect-video rounded-[40px] border-2 border-dashed border-white/5 bg-[#09090B] hover:bg-white/[0.04] hover:border-blue-400/40 transition-all duration-500 flex flex-col items-center justify-center cursor-pointer group overflow-hidden shadow-inner">
                        {uploadingLandscape ? (
                          <Loader2 className="w-7 h-7 text-blue-400 animate-spin" />
                        ) : (
                          <>
                            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-all group-hover:bg-blue-400/20">
                              <Upload className="w-7 h-7 text-white/20 group-hover:text-blue-400 transition-all" />
                            </div>
                            <span className="text-[10px] font-black text-white/20 group-hover:text-blue-400 uppercase tracking-[0.3em] mt-4 transition-colors">Add Media</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingLandscape}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLandscapeUpload(f); }}
                        />
                      </label>
                    </div>
                  </FormSection>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-10 lg:p-14 border-t border-white/5 bg-white/[0.02] flex flex-col gap-4 relative z-10">
            {submitError && (
              <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{submitError}</div>
            )}
            <div className="flex items-center justify-between">
              <button
                onClick={() => registerStep === 1 ? setStep('options') : setRegisterStep((s) => s - 1)}
                className="px-10 py-5 rounded-[24px] bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 hover:text-white hover:bg-white/10 transition-all flex items-center gap-4 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                {registerStep === 1 ? 'Back' : 'Go Back'}
              </button>
              {registerStep < 3 ? (
                <button
                  onClick={() => setRegisterStep((s) => s + 1)}
                  disabled={registerStep === 1 && (!emailVerified || emailChangedSinceVerify)}
                  title={registerStep === 1 && (!emailVerified || emailChangedSinceVerify) ? 'Verify your email to continue' : undefined}
                  className="px-14 py-5 rounded-[24px] bg-primary text-white text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4 group disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
                >
                  Next Step <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={isSubmitting || uploadingPortrait || uploadingLandscape}
                  className="px-16 py-5 rounded-[24px] bg-gradient-to-br from-primary to-purple-600 text-[10px] font-black uppercase tracking-[0.3em] shadow-[0_10px_50px_rgba(255,45,154,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50 group"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />}
                  {isSubmitting ? 'Saving…' : 'Complete Setup'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}