import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Zap, ArrowRight, Loader2, Building2, Layers, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { API_BASE } from '../lib/apiConfig';

// Public self-serve sign-up for a brand-new Club or Event organiser who
// doesn't have an account yet at all — distinct from the existing
// Super-Admin-only "Admins" page, which still works exactly as before
// for anyone who'd rather pre-provision accounts by invite. This page
// just creates the bare login (name/email/password/role); once that
// succeeds we log the person straight in, and the existing
// ProtectedRoute logic in App.tsx automatically routes a freshly
// created, organisation-less CLUB_ADMIN/EVENT_ADMIN into
// /club-onboarding or /event-onboarding to finish setup — no changes
// needed to either of those onboarding forms.
export default function Signup() {
  const [role, setRole] = useState<'CLUB_ADMIN' | 'EVENT_ADMIN'>('CLUB_ADMIN');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register-organiser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        // Backend error messages come in two shapes: a plain string
        // (e.g. "An account with this email already exists", thrown
        // directly by a controller) or an array of strings (Joi
        // validation errors, one per invalid field). Indexing a string
        // with [0] "succeeds" too (just returns its first character),
        // so a naive `.message?.[0] || .message` silently truncates
        // any string message down to one letter instead of falling
        // back to the full text — check the actual shape instead.
        const msg = Array.isArray(result.message) ? result.message[0] : result.message;
        throw new Error(msg || 'Sign up failed');
      }

      const { token, ...user } = result.data;
      login(token, user);
      // ProtectedRoute picks up from here — no organisation yet means
      // it redirects straight into the matching onboarding form.
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse delay-700" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-[480px] relative z-10"
      >
        <div className="glass-card rounded-[40px] border border-white/5 p-12 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-10 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-6 shadow-[0_0_30px_rgba(255,45,154,0.2)]">
              <Zap className="w-8 h-8 fill-primary" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-3">
              Register Your <span className="text-primary neon-text">Organisation</span>
            </h1>
            <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.3em]">Club or Event Organiser Sign Up</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold p-4 rounded-2xl mb-8 flex items-center gap-3 uppercase tracking-wider">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-7 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">I am registering as</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('CLUB_ADMIN')}
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${
                    role === 'CLUB_ADMIN'
                      ? 'bg-primary/20 border-primary text-white'
                      : 'bg-[#0A0A0F] border-white/5 text-white/40 hover:border-white/20'
                  }`}
                >
                  <Building2 className="w-4 h-4" /> Club
                </button>
                <button
                  type="button"
                  onClick={() => setRole('EVENT_ADMIN')}
                  className={`flex items-center justify-center gap-2 py-4 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all ${
                    role === 'EVENT_ADMIN'
                      ? 'bg-primary/20 border-primary text-white'
                      : 'bg-[#0A0A0F] border-white/5 text-white/40 hover:border-white/20'
                  }`}
                >
                  <Layers className="w-4 h-4" /> Event Organiser
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Your Name</label>
              <div className="relative group/field">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/field:text-primary transition-all" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10 font-medium"
                  placeholder="Jane Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Email</label>
              <div className="relative group/field">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/field:text-primary transition-all" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10 font-medium"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Password</label>
                <div className="relative group/field">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/field:text-primary transition-all" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0A0A0F] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Confirm</label>
                <div className="relative group/field">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/field:text-primary transition-all" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0A0A0F] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full h-16 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:shadow-[0_15px_50px_rgba(255,45,154,0.4)] disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-10 text-center relative z-10">
            <span className="text-[11px] text-white/30 font-medium">Already have an account? </span>
            <Link to="/login" className="text-[11px] font-black text-primary hover:underline uppercase tracking-wider">Sign In</Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-white/20 relative z-10">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">You'll verify your venue/company details next</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}