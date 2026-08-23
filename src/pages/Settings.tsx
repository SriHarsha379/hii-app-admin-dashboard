import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Lock,
  Bell,
  Shield,
  Globe,
  Smartphone,
  Mail,
  Save,
  CheckCircle2,
  MapPin,
  Plus,
  Trash2,
  Settings as SettingsIcon,
  Sparkles,
  ShieldCheck,
  Camera,
  Upload,
  Layers,
  ChevronRight,
  ChevronDown,
  Phone
} from 'lucide-react';
import { cn } from '../lib/utils';
import { FormSection, RefinedField } from '../components/RefinedForm';
import { API_BASE } from '../lib/apiConfig';

const UPLOADS_BASE = API_BASE.replace(/\/api\/v1\/admin\/?$/, '/uploads');
const avatarUrl = (filename?: string | null) => {
  if (!filename) return '';
  if (/^https?:\/\//i.test(filename)) return filename;
  return `${UPLOADS_BASE}/${filename}`;
};

export default function Settings() {
  const { user, token, updateUser } = useAuth();
  const avatarInputRef = React.useRef<HTMLInputElement>(null);

  // FIXED: "Change Photo" had no file input and no backend support at
  // all — the Admin schema had a profile_image field but nothing to
  // actually update it. Added a real endpoint for an admin to update
  // their own avatar.
  const updateAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append('profile_image', file);
      const res = await fetch(`${API_BASE}/admins/me/avatar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || 'Failed to update photo');
      return json;
    },
    onSuccess: (json) => {
      const filename = json?.data?.profile_image;
      if (filename) updateUser({ avatar: avatarUrl(filename) });
    },
    onError: (err: any) => alert(err.message || 'Failed to update photo'),
  });

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) updateAvatarMutation.mutate(file);
  };

  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cities, setCities] = useState(['Mumbai', 'Delhi', 'Bangalore', 'Goa']);

  // FIXED: these toggles used `defaultChecked` (uncontrolled) with no
  // onChange at all — they'd visually flip on click but nothing was ever
  // read or saved anywhere. There's no backend support for per-admin
  // notification preferences yet, so rather than fake a save that does
  // nothing, this genuinely persists locally (survives refresh/reopen)
  // without needing new backend infrastructure for something this
  // lightweight.
  const [notificationPrefs, setNotificationPrefs] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('hii_admin_notification_prefs');
      return saved ? JSON.parse(saved) : {
        'Email Notifications': true,
        'Push Notifications': true,
        'Security Alerts': true,
        'App Updates': false,
      };
    } catch {
      return { 'Email Notifications': true, 'Push Notifications': true, 'Security Alerts': true, 'App Updates': false };
    }
  });

  const toggleNotificationPref = (title: string) => {
    setNotificationPrefs(prev => {
      const next = { ...prev, [title]: !prev[title] };
      localStorage.setItem('hii_admin_notification_prefs', JSON.stringify(next));
      return next;
    });
  };
  const [newCity, setNewCity] = useState('');

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    role: user?.role || ''
  });

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'IST',
    currency: 'INR',
    theme: 'dark'
  });

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, desc: 'Personal Info' },
    { id: 'security', label: 'Security', icon: Lock, desc: 'Password & 2FA' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email & Mobile' },
    { id: 'preferences', label: 'App Settings', icon: Globe, desc: 'Theme & Language' },
    { id: 'cities', label: 'Cities', icon: MapPin, desc: 'Manage Locations' },
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-1000 max-w-6xl mx-auto pb-40">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <SettingsIcon className="w-5 h-5 animate-spin-slow" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">System Settings</span>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">
            App <span className="text-primary neon-text">Settings</span>
          </h1>
          <p className="text-white/40 font-medium text-lg max-w-xl">
            Manage your personal profile, security, and application preferences.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "group relative px-10 py-5 rounded-[24px] overflow-hidden transition-all active:scale-95 disabled:opacity-50 disabled:hover:scale-100",
            showSuccess ? "bg-emerald-500 shadow-[0_10px_30px_rgba(16,185,129,0.3)]" : "bg-primary shadow-[0_10px_40px_rgba(255,45,154,0.3)]"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <div className="relative flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-white">
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : showSuccess ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Saving...' : showSuccess ? 'Saved' : 'Save Changes'}
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
        {/* Navigation Sidebar */}
        <div className="xl:col-span-1 space-y-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-5 px-6 py-5 rounded-[24px] text-sm transition-all duration-500 relative group overflow-hidden border",
                activeTab === tab.id
                  ? "bg-primary/10 border-primary/30 text-white shadow-xl shadow-primary/5"
                  : "bg-white/[0.02] border-white/5 text-white/30 hover:bg-white/[0.05] hover:border-white/10 hover:text-white/60"
              )}
            >
              {activeTab === tab.id && (
                <motion.div layoutId="active-tab" className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
              )}
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500",
                activeTab === tab.id ? "bg-primary/20 text-primary scale-110 shadow-lg" : "bg-white/5 text-white/20"
              )}>
                <tab.icon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-black uppercase tracking-widest text-[10px] leading-none mb-1">{tab.label}</p>
                <p className="text-[9px] font-medium opacity-50 uppercase tracking-tighter">{tab.desc}</p>
              </div>
              <ChevronRight className={cn(
                "w-4 h-4 ml-auto transition-all transition-transform duration-500",
                activeTab === tab.id ? "text-primary translate-x-0" : "text-white/10 -translate-x-4 opacity-0 group-hover:opacity-100"
              )} />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="xl:col-span-3">
          <div className="glass-card p-10 lg:p-16 rounded-[48px] border border-white/5 min-h-[600px] relative overflow-hidden shadow-3xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] -ml-32 -mb-32 pointer-events-none" />

            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-16 relative z-10"
                >
                  <div className="flex flex-col md:flex-row items-center gap-12 pb-12 border-b border-white/5">
                    <div className="relative group profile-avatar">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-[20px] scale-0 group-hover:scale-100 transition-transform duration-700" />
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarSelect}
                      />
                      <div className="w-32 h-32 rounded-full bg-[#09090B] border-2 border-white/5 p-1 relative overflow-hidden group">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                        ) : (
                          <div className="w-full h-full rounded-full flex items-center justify-center bg-white/5">
                            <User className="w-12 h-12 text-white/10" />
                          </div>
                        )}
                        <div
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center cursor-pointer"
                        >
                          {updateAvatarMutation.isPending ? (
                            <span className="text-[8px] font-black uppercase tracking-widest text-white">Uploading...</span>
                          ) : (
                            <>
                              <Camera className="w-6 h-6 text-white mb-2" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-white">Change Photo</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-[#09090B] border border-white/10 flex items-center justify-center shadow-2xl">
                        <Upload className="w-4 h-4 text-primary" />
                      </div>
                    </div>

                    <div className="space-y-4 text-center md:text-left">
                      <div className="space-y-1">
                        <h3 className="text-3xl font-black text-white uppercase tracking-tight">{profile.name || 'User Profile'}</h3>
                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.3em]">{profile.role || 'Admin'}</p>
                      </div>
                      <p className="text-sm text-white/40 max-w-md font-medium">Update your personal information and contact details.</p>
                    </div>
                  </div>

                  <FormSection title="Profile Details" icon={<User className="w-4 h-4" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <RefinedField
                        label="Full Name"
                        name="name"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        icon={<User className="w-4 h-4" />}
                        placeholder="Full Name"
                      />
                      <RefinedField
                        label="Email Address"
                        name="email"
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        icon={<Mail className="w-4 h-4" />}
                        placeholder="email@example.com"
                      />
                      <RefinedField
                        label="Role"
                        name="role"
                        value={profile.role}
                        readOnly
                        icon={<ShieldCheck className="w-4 h-4" />}
                        placeholder="Admin"
                      />
                      <RefinedField
                        label="Phone Number"
                        name="phone"
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        icon={<Phone className="w-4 h-4" />}
                        placeholder="+91..."
                      />
                    </div>
                  </FormSection>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-16 relative z-10"
                >
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-red-500">
                      <Lock className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]">Security Settings</span>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Password & <span className="text-red-500">Security</span></h3>
                  </div>

                  <div className="p-10 rounded-[40px] bg-red-500/5 border border-red-500/10 space-y-12">
                    <FormSection title="Update Password" icon={<Lock className="w-4 h-4" />}>
                      <div className="grid grid-cols-1 gap-10 max-w-xl">
                        <RefinedField
                          label="Current Password"
                          name="currentPassword"
                          type="password"
                          value={security.currentPassword}
                          onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                        <RefinedField
                          label="New Password"
                          name="newPassword"
                          type="password"
                          value={security.newPassword}
                          onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                        <RefinedField
                          label="Confirm New Password"
                          name="confirmPassword"
                          type="password"
                          value={security.confirmPassword}
                          onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                    </FormSection>
                  </div>

                  <div className="glass-card p-10 rounded-[40px] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 group">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-emerald-500">
                        <ShieldCheck className="w-5 h-5" />
                        <h4 className="text-lg font-black text-white uppercase tracking-tight">Multi-Factor Authentication</h4>
                      </div>
                      <p className="text-xs text-white/40 font-medium max-w-md">Add an extra layer of security to your account.</p>
                    </div>
                    <button className="px-8 py-4 rounded-[20px] bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-emerald-500/20 active:scale-95">
                      Activate 2FA
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-16 relative z-10"
                >
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-blue-400">
                      <Bell className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]">Notification Settings</span>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-none">App <span className="text-blue-400 font-black">Notifications</span></h3>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {[
                      { title: 'Email Notifications', desc: 'Get important updates and reports via email.', icon: Mail, defaultChecked: true },
                      { title: 'Push Notifications', desc: 'Get real-time alerts on your phone.', icon: Smartphone, defaultChecked: true },
                      { title: 'Security Alerts', desc: 'Get notified about security events.', icon: Shield, defaultChecked: true },
                      { title: 'App Updates', desc: 'Stay informed about new features.', icon: Globe, defaultChecked: false },
                    ].map((item, i) => (
                      <div key={i} className="group p-8 rounded-[32px] bg-white/[0.02] border border-white/5 flex items-center gap-8 transition-all hover:bg-white/[0.04] hover:border-white/10 shadow-lg">
                        <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover:text-white group-hover:scale-110 transition-all duration-500">
                          <item.icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="text-[12px] font-black text-white uppercase tracking-widest">{item.title}</h4>
                          <p className="text-xs text-white/30 font-medium leading-relaxed">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={notificationPrefs[item.title] ?? item.defaultChecked}
                            onChange={() => toggleNotificationPref(item.title)}
                          />
                          <div className="w-14 h-7 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white/20 after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-primary peer-checked:after:bg-white peer-checked:shadow-[0_0_20px_rgba(255,45,154,0.3)]"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'preferences' && (
                <motion.div
                  key="preferences"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-16 relative z-10"
                >
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-purple-400">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]">Interface Settings</span>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-none">App <span className="text-purple-400">Preferences</span></h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4 group/field">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Language</label>
                      <div className="relative">
                        <select
                          value={preferences.language}
                          onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                          className="w-full bg-[#09090B] border border-white/10 rounded-[28px] px-8 py-5 text-sm text-white focus:outline-none focus:border-purple-400 appearance-none font-medium"
                        >
                          <option value="en">English (Global)</option>
                          <option value="hi">Hindi (Local)</option>
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none group-focus-within/field:rotate-180 transition-transform" />
                      </div>
                    </div>
                    <div className="space-y-4 group/field">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Timezone</label>
                      <div className="relative">
                        <select
                          value={preferences.timezone}
                          onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                          className="w-full bg-[#09090B] border border-white/10 rounded-[28px] px-8 py-5 text-sm text-white focus:outline-none focus:border-purple-400 appearance-none font-medium"
                        >
                          <option value="IST">Standard Time (IST)</option>
                          <option value="UTC">Universal Time (UTC)</option>
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none group-focus-within/field:rotate-180 transition-transform" />
                      </div>
                    </div>
                    <div className="space-y-4 group/field col-span-full">
                      <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Theme</label>
                      <div className="relative">
                        <select
                          value={preferences.theme}
                          onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                          className="w-full bg-[#09090B] border border-white/10 rounded-[28px] px-8 py-5 text-sm text-white focus:outline-none focus:border-purple-400 appearance-none font-medium"
                        >
                          <option value="dark">Dark Theme (OLED)</option>
                          <option value="light">Light Theme</option>
                          <option value="system">System Default</option>
                        </select>
                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none group-focus-within/field:rotate-180 transition-transform" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'cities' && (
                <motion.div
                  key="cities"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-16 relative z-10"
                >
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 text-orange-400">
                      <MapPin className="w-5 h-5 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]">City Management</span>
                    </div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Manage <span className="text-orange-400 font-black">Cities</span></h3>
                  </div>

                  <div className="space-y-10 max-w-xl">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 relative group">
                        <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-orange-400 transition-colors" />
                        <input
                          type="text"
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          placeholder="Enter city name..."
                          className="w-full bg-[#09090B] border border-white/5 rounded-[28px] pl-14 pr-8 py-5 text-sm text-white focus:outline-none focus:border-orange-400 transition-all placeholder:text-white/10 font-medium"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newCity.trim()) {
                              setCities([...cities, newCity.trim()]);
                              setNewCity('');
                            }
                          }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (newCity.trim()) {
                            setCities([...cities, newCity.trim()]);
                            setNewCity('');
                          }
                        }}
                        className="w-16 h-16 rounded-[28px] bg-orange-400/10 text-orange-400 border border-orange-400/20 hover:bg-orange-400 transition-all hover:text-white flex items-center justify-center shadow-xl active:scale-95"
                      >
                        <Plus className="w-7 h-7" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {cities.map((city, index) => (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          key={index}
                          className="group flex items-center justify-between p-6 rounded-[32px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all shadow-md group"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 group-hover:text-orange-400 group-hover:bg-orange-400/10 transition-all duration-500">
                              <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[14px] font-black text-white uppercase tracking-widest">{city}</span>
                              <p className="text-[8px] text-white/20 font-black uppercase tracking-widest block">Active City</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setCities(cities.filter((_, i) => i !== index))}
                            className="w-10 h-10 rounded-xl hover:bg-red-500/10 text-white/10 hover:text-red-400 transition-all flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </motion.div>
                      ))}
                      {cities.length === 0 && (
                        <div className="p-16 text-center space-y-6 border-2 border-dashed border-white/5 rounded-[48px] bg-white/[0.01]">
                          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-white/10 mx-auto">
                            <Layers className="w-8 h-8 opacity-20" />
                          </div>
                          <div className="space-y-1">
                            <h5 className="text-[12px] font-black text-white/40 uppercase tracking-widest">No Cities Found</h5>
                            <p className="text-[10px] text-white/10 uppercase tracking-[0.2em] font-medium">Add a city to get started.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}