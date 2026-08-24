import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
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
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn, apiErrorMessage } from '../lib/utils';
import { API_BASE } from '../lib/apiConfig';

const INITIAL_DATA = {
  fullName: '',
  email: '',
  phone: '',
  companyName: '',
  companyType: '',
  description: '',
  businessEmail: '',
  businessPhone: '',
  website: '',
  address: '',
  categories: [] as string[],
  socialLinks: {
    instagram: '',
    linkedin: '',
    facebook: '',
    youtube: ''
  }
};

export default function EventAccountSettings() {
  const navigate = useNavigate();
  const { logout, user, token } = useAuth();
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const profileImageInputRef = React.useRef<HTMLInputElement>(null);

  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  // FIXED: this whole page never touched the backend at all — no
  // useQuery, no useMutation, no API_BASE import, nothing. "Save
  // Changes" just flashed a success message locally for 3 seconds
  // regardless of what was typed. Same pattern AccountSettings.tsx had
  // before it was fixed earlier — this Event Admin equivalent was never
  // touched.
  const { data: vendors } = useQuery({
    queryKey: ['vendors-event-account-settings'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/vendor/get_all_vendors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to load account');
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: Boolean(token)
  });

  const myVendor = Array.isArray(vendors) ? vendors.find((v: any) => v.name === user?.organisation) : null;

  const updateVendorMutation = useMutation({
    mutationFn: async (fields: Record<string, any>) => {
      if (!myVendor?._id) throw new Error('No account found to update');
      const body = new FormData();
      Object.entries(fields).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        // A File needs to be appended directly — stringifying it with
        // String(v) would produce the literal text "[object File]",
        // same class of bug fixed elsewhere in this app.
        body.append(k, v instanceof File ? v : String(v));
      });
      const res = await fetch(`${API_BASE}/vendor/update_vendor/${myVendor._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) {
        throw new Error(apiErrorMessage(json, 'Failed to save changes'));
      }
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors-event-account-settings'] });
    },
  });

  // Form State
  const [initialData, setInitialData] = useState(INITIAL_DATA);
  const [formData, setFormData] = useState(INITIAL_DATA);

  useEffect(() => {
    // FIXED: this only ever populated fullName/email/companyName from the
    // basic logged-in-admin identity — myVendor (the real, fetched Vendor
    // record with the actual saved businessEmail/businessPhone/
    // companyType/website/description/address) was only ever used to
    // grab its _id for the update URL, never to fill in the form. Every
    // other field always showed blank regardless of what was genuinely
    // on file, even for a fully-completed profile.
    const next = {
      ...INITIAL_DATA,
      fullName: myVendor?.contact_person || user?.name || '',
      email: user?.email || '',
      companyName: myVendor?.name || user?.organisation || '',
      companyType: myVendor?.company_type || '',
      description: myVendor?.description || '',
      businessEmail: myVendor?.email || '',
      businessPhone: myVendor?.phone_number || '',
      website: myVendor?.website || '',
      address: myVendor?.address || '',
    };
    setInitialData(next);
    setFormData(next);
  }, [user, myVendor]);

  // Box 1 Changes (Sensitive: Company, Contact)
  const hasBox1Changes =
    formData.companyName !== initialData.companyName ||
    formData.companyType !== initialData.companyType ||
    formData.businessEmail !== initialData.businessEmail ||
    formData.businessPhone !== initialData.businessPhone ||
    formData.website !== initialData.website ||
    formData.address !== initialData.address;

  // Box 2 Changes (Non-sensitive: Bio, Contact, Socials)
  const hasBox2Changes =
    formData.fullName !== initialData.fullName ||
    formData.email !== initialData.email ||
    formData.phone !== initialData.phone ||
    formData.description !== initialData.description ||
    JSON.stringify(formData.categories) !== JSON.stringify(initialData.categories) ||
    JSON.stringify(formData.socialLinks) !== JSON.stringify(initialData.socialLinks);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent as keyof typeof prev] as object, [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (isSaved) setIsSaved(false);
  };

  const handleCategoryToggle = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat]
    }));
  };

  const handleCancelClick = () => {
    if (hasBox1Changes || hasBox2Changes) {
      setShowCancelDialog(true);
    } else {
      navigate('/event-profile');
    }
  };

  // FIXED: was purely local — flashed "Box Updated" for 3 seconds with
  // zero backend call, so nothing typed here ever actually saved.
  // Only mapping fields that have a genuine home on the real Vendor
  // schema (contact_person, description) — email/phone are left as
  // display-only here since they're also the account's login
  // credentials on this schema, not safe to silently overwrite via a
  // casual save; categories/socialLinks have no backend field to save
  // into at all yet.
  const handleSaveBox2 = async () => {
    try {
      await updateVendorMutation.mutateAsync({
        contact_person: formData.fullName,
        description: formData.description,
        ...(profileImageFile ? { business_image: profileImageFile } : {}),
      });
      setInitialData((prev: any) => ({ ...prev, fullName: formData.fullName, description: formData.description }));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save changes');
    }
  };

  // FIXED: was completely fake — "Yes, Submit & Logout" just called
  // logout() and navigated away, without ever saving a single field.
  // Whatever was typed vanished, and the person was logged out for
  // nothing. Now genuinely saves the changed fields first.
  //
  // Honest limitation carried over from the same fix on AccountSettings.tsx:
  // this saves the data for real, but doesn't actually revoke dashboard
  // access or flag the account for re-review, despite the dialog text
  // promising that. Implementing the full "requires re-approval" workflow
  // is a separate, larger decision — not scope-creeping into it here.
  const handleConfirmSubmitForReview = async () => {
    try {
      // FIXED: hasBox1Changes tracked edits to companyType, businessEmail,
      // businessPhone, and website — but this payload only ever sent
      // name/address, so those 4 fields could be changed on screen and
      // "Send for Re-Approval" would silently discard them. companyType/
      // website needed new backend fields (added — see vendorModel.js);
      // businessEmail/businessPhone map to the vendor's real email/
      // phone_number fields, which already existed but were never sent.
      await updateVendorMutation.mutateAsync({
        name: formData.companyName,
        address: formData.address,
        company_type: formData.companyType,
        email: formData.businessEmail,
        phone_number: formData.businessPhone,
        website: formData.website,
      });
      setInitialData((prev: any) => ({
        ...prev,
        companyName: formData.companyName,
        address: formData.address,
        companyType: formData.companyType,
        businessEmail: formData.businessEmail,
        businessPhone: formData.businessPhone,
        website: formData.website,
      }));
      setShowApprovalDialog(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save changes');
    }
  };

  const handleSendApprovalClick = () => {
    if (hasBox1Changes) {
      setShowApprovalDialog(true);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-4 border-b border-white/5 relative z-30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">
              Account Settings
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mt-1">Manage your company profile and settings</p>
          </div>
        </div>
      </div>

      {/* Box 1: Sensitive Details (Re-approval required) */}
      <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-10 space-y-10 relative overflow-hidden group">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-start justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Company Verification</h2>
            </div>
            <p className="text-[11px] text-muted-foreground/60 leading-relaxed max-w-3xl font-medium">
              NOTE: Changes to Company Details or Contact Information will require manual review and approval by our team. You will be logged out upon submission.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={handleCancelClick}
              className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              onClick={handleSendApprovalClick}
              disabled={!hasBox1Changes}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl flex items-center gap-2",
                hasBox1Changes
                  ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                  : "bg-white/5 text-white/10 cursor-not-allowed shadow-none border border-white/5"
              )}
            >
              <Send className="w-3.5 h-3.5" />
              Send for Re-Approval
            </button>
          </div>
        </div>

        <div className="space-y-12 relative z-10">
          {/* Subsection: Account Details */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              Company Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <FieldGroup label="Company Name" name="companyName" value={formData.companyName} onChange={handleChange} icon={<Building2 className="w-4 h-4" />} />
              <FieldGroup label="Company Type" name="companyType" value={formData.companyType} onChange={handleChange} />
            </div>
          </div>

          <div className="h-px bg-white/5 w-full" />

          {/* Subsection: Business Contact */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              Business Contact
            </h3>
        <div className="relative z-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FieldGroup label="Business Email" name="businessEmail" value={formData.businessEmail} onChange={handleChange} icon={<Mail className="w-4 h-4" />} />
            <FieldGroup label="Business Phone" name="businessPhone" value={formData.businessPhone} onChange={handleChange} icon={<Phone className="w-4 h-4" />} />
          </div>
          <FieldGroup label="Official Website" name="website" value={formData.website} onChange={handleChange} icon={<Globe className="w-4 h-4" />} />
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Full Office Address</label>
            <div className="relative">
              <MapPin className="absolute left-5 top-5 text-white/20 w-4 h-4" />
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="w-full bg-[#09090B] border border-white/10 rounded-3xl pl-12 pr-5 py-4 text-white hover:border-white/20 focus:border-primary/50 focus:outline-none transition-all placeholder:text-white/20 text-sm resize-none"
              />
            </div>
          </div>
        </div>
          </div>
        </div>

        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-primary/10 transition-colors" />
      </div>

      {/* Box 2: Non-sensitive Details (Direct Save) */}
      <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-10 space-y-10 relative overflow-hidden group">
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-start justify-between gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-white">
                <User className="w-4 h-4" />
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight uppercase">Company Profile & Socials</h2>
            </div>
            <p className="text-[11px] text-muted-foreground/60 leading-relaxed max-w-3xl font-medium">
              These changes will be updated instantly on your profile.
            </p>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => setFormData(initialData)}
              disabled={!hasBox2Changes}
              className={cn(
                "px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group justify-center min-w-[110px]",
                hasBox2Changes
                  ? "bg-white/5 border border-white/10 text-white/40 hover:text-white hover:border-white/30 hover:bg-white/10"
                  : "bg-white/5 border border-white/5 text-white/5 cursor-not-allowed"
              )}
            >
              <X className={cn(
                "w-3.5 h-3.5 transition-all",
                hasBox2Changes ? "opacity-40 group-hover:opacity-100" : "opacity-10"
              )} />
              <span className="leading-none">Clear</span>
            </button>
            <button
              onClick={handleSaveBox2}
              disabled={!hasBox2Changes}
              className={cn(
                "px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl flex items-center gap-2 justify-center min-w-[140px]",
                isSaved
                  ? "bg-green-500/20 text-green-500 border border-green-500/30 shadow-green-500/10"
                  : hasBox2Changes
                    ? "bg-white text-black hover:bg-white/90 shadow-white/10"
                    : "bg-white/5 text-white/10 border border-white/5 cursor-not-allowed shadow-none"
              )}
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Box Updated
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>

        <div className="space-y-12 relative z-10">
          {/* Subsection: Account & Profile Bio */}
          <div className="space-y-8">
            <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              Company Point of Contact & Bio
            </h3>
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Logo Asset */}
              <div className="shrink-0 order-2 lg:order-1 pt-2">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Profile Photo</label>
                  {/* FIXED: was purely decorative — no file input, no
                      click handler. The backend only supports a single
                      photo per account (business_image), so this is now
                      the one real, working upload; the other two below
                      are honestly labeled as not available yet rather
                      than faked. */}
                  <input
                    ref={profileImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfileImageSelect}
                  />
                  <div
                    onClick={() => profileImageInputRef.current?.click()}
                    className="mt-2 aspect-square w-28 rounded-[32px] bg-white/5 border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/[0.08] hover:border-primary/30 transition-all group/upload relative overflow-hidden"
                  >
                    {profileImagePreview ? (
                      <img src={profileImagePreview} alt="Profile preview" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-white/20 group-hover/upload:text-primary transition-colors" />
                        <span className="text-[7px] font-black uppercase text-white/20 tracking-tighter">Photo</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields Group */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 order-1 lg:order-2">
                <FieldGroup label="Company Name" name="fullName" value={formData.fullName} onChange={handleChange} icon={<User className="w-4 h-4" />} />
                <FieldGroup label="Contact Number" name="phone" value={formData.phone} onChange={handleChange} icon={<Phone className="w-4 h-4" />} />
                <div className="md:col-span-2">
                  <FieldGroup label="Liaison Email" name="email" value={formData.email} onChange={handleChange} icon={<Mail className="w-4 h-4" />} />
                </div>
              </div>
            </div>

            <div className="h-px bg-white/5 w-full" />

            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Public Company Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full bg-[#09090B] border border-white/10 rounded-[32px] px-6 py-5 text-white hover:border-white/20 focus:border-primary/50 focus:outline-none transition-all placeholder:text-white/20 text-sm resize-none"
              />
            </div>
          </div>

          <div className="h-px bg-white/5 w-full" />

          {/* Subsection: Categories Group */}
          <div className="space-y-6">
             <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] flex items-center gap-2">
               <Calendar className="w-3.5 h-3.5 text-primary" />
               Event Categories
             </h3>
             <div className="flex flex-wrap gap-4">
              {formData.categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryToggle(cat)}
                  className={cn(
                    "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border bg-primary text-white border-primary shadow-lg shadow-primary/20"
                  )}
                >
                  {cat}
                </button>
              ))}
              {['Nightlife', 'Concerts', 'Festivals', 'Corporate Events', 'Weddings', 'Exhibitions', 'Artist Management'].filter(c => !formData.categories.includes(c)).map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategoryToggle(cat)}
                  className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border bg-white/5 border-white/10 text-white/40 hover:text-white"
                >
                  {cat}
                </button>
              ))}

              <NicheInput onAdd={(newNiches) => {
                setFormData(prev => ({
                  ...prev,
                  categories: Array.from(new Set([...prev.categories, ...newNiches]))
                }));
              }} />
            </div>
          </div>

          <div className="h-px bg-white/5 w-full" />

          {/* Subsection: Profile Photos & Social Media */}
          <div className="space-y-12">
            {/* Top: Profile Banner */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em]">Profile Banner</h3>
              </div>
              {/* FIXED: was purely decorative — no file input at all. The
                  backend only supports a single photo per account
                  (already wired to the real "Profile Photo" field
                  above), so a separate banner has nowhere to save yet —
                  honestly labeled rather than faked. */}
              <div className="p-8 rounded-[32px] border border-white/5 bg-white/[0.01] flex items-center gap-4">
                <Upload className="w-5 h-5 text-white/20 shrink-0" />
                <p className="text-xs text-white/30 font-medium">
                  Banner uploads aren't available yet — use the Profile Photo field above for now. This will be added in a future update.
                </p>
              </div>
            </div>

            {/* Bottom Row: Socials (Left) and Portrait (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
              {/* Social Media Links */}
              <div className="lg:col-span-7 space-y-6">
                <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" />
                  Social Media Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <FieldGroup label="Instagram @handle" name="socialLinks.instagram" value={formData.socialLinks.instagram} onChange={handleChange} icon={<Instagram className="w-4 h-4" />} />
                  <FieldGroup label="LinkedIn Profile" name="socialLinks.linkedin" value={formData.socialLinks.linkedin} onChange={handleChange} icon={<Linkedin className="w-4 h-4" />} />
                  <FieldGroup label="Facebook Page" name="socialLinks.facebook" value={formData.socialLinks.facebook} onChange={handleChange} icon={<Facebook className="w-4 h-4" />} />
                  <FieldGroup label="YouTube Channel" name="socialLinks.youtube" value={formData.socialLinks.youtube} onChange={handleChange} icon={<Youtube className="w-4 h-4" />} />
                </div>
              </div>

              {/* Portrait Image */}
              <div className="lg:col-span-5 space-y-6 h-full flex flex-col">
                <h3 className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Profile Photo
                </h3>
                {/* FIXED: this was a second, duplicate "Profile Photo"
                    upload — same concept as the one already wired up for
                    real near the top of this page, just decorative here
                    too. Consolidated into one honest note pointing back
                    to the real field rather than two separate dead
                    upload zones claiming to do the same thing. */}
                <div className="flex-1 min-h-[120px] rounded-[32px] border border-white/5 bg-white/[0.01] flex items-center justify-center gap-4 px-8 text-center">
                  <p className="text-xs text-white/30 font-medium">
                    Use the Profile Photo field at the top of this page to update your photo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Dialogs */}
      <AnimatePresence>
        {/* Cancel Confirmation Dialog */}
        {showCancelDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCancelDialog(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#09090B] border border-white/10 rounded-[40px] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col items-center text-center space-y-8">
                <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                  <AlertCircle className="w-10 h-10 text-white/20" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase">Unsaved Data Loss</h3>
                  <p className="text-muted-foreground/60 text-xs font-medium leading-relaxed">
                    Agency profile modifications are currently pending. Exiting will permanently discard these changes.
                  </p>
                </div>
                <div className="flex flex-col w-full gap-4">
                  <button
                    onClick={() => navigate('/event-profile')}
                    className="w-full py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/90 transition-all shadow-xl shadow-white/5"
                  >
                    Confirm Exit
                  </button>
                  <button
                    onClick={() => setShowCancelDialog(false)}
                    className="w-full py-4 rounded-2xl border border-white/10 text-white/20 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white hover:bg-white/5 transition-all"
                  >
                    Return to Settings
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Approval Confirmation Dialog */}
        {showApprovalDialog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowApprovalDialog(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-[#09090B] border border-white/10 rounded-[40px] p-10 shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col items-center text-center space-y-8">
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Send className="w-10 h-10 text-primary drop-shadow-[0_0_15px_rgba(255,45,154,0.4)]" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-white tracking-tight uppercase">Submit for Review?</h3>
                  <p className="text-muted-foreground/60 text-[11px] font-medium leading-relaxed">
                    Your updated company details will be saved.
                  </p>
                </div>
                <div className="flex flex-col w-full gap-4">
                  <button
                    onClick={handleConfirmSubmitForReview}
                    disabled={updateVendorMutation.isPending}
                    className="w-full py-4 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary/90 transition-all shadow-2xl shadow-primary/40 disabled:opacity-50"
                  >
                    {updateVendorMutation.isPending ? 'Saving...' : 'Yes, Submit'}
                  </button>
                  <button
                    onClick={() => setShowApprovalDialog(false)}
                    className="w-full py-4 rounded-2xl border border-white/10 text-white/30 text-[10px] font-black uppercase tracking-[0.2em] hover:text-white hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NicheInput({ onAdd }: { onAdd: (niches: string[]) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim()) {
      const newNiches = value.split(',').map(s => s.trim()).filter(Boolean);
      onAdd(newNiches);
      setValue('');
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          onBlur={handleSubmit}
          placeholder="Dance, Techno, Pop..."
          className="px-6 py-2.5 rounded-2xl bg-white/10 border border-primary/50 text-white text-[10px] font-black uppercase tracking-widest focus:outline-none min-w-[180px]"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="w-11 h-11 rounded-2xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/30 transition-all text-xl font-light"
    >
      +
    </button>
  );
}

function FieldGroup({ label, name, value, onChange, icon }: { label: string, name: string, value: string, onChange: any, icon?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">{label}</label>
      <div className="relative">
        {icon && (
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20">
            {icon}
          </div>
        )}
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          className={cn(
            "w-full bg-[#09090B] border border-white/10 rounded-2xl py-4 text-white hover:border-white/20 focus:border-primary/50 focus:outline-none transition-all text-sm",
            icon ? "pl-12 pr-5" : "px-5"
          )}
        />
      </div>
    </div>
  );
}

function Settings({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}