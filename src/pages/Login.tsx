import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Zap, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API_BASE } from '../lib/apiConfig';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // NEW: handles the 2FA challenge step — if the account has 2FA enabled,
  // /auth/login returns a pending token instead of a real session, and
  // this second step submits the authenticator code to /auth/verify-2fa.
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [twoFaCode, setTwoFaCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

const result = await res.json();

if (!res.ok || !result.success) {
  throw new Error(result.message || 'Login failed');
}

if (result.data?.requires_2fa) {
  setPendingToken(result.data.pending_token);
  setIsLoading(false);
  return;
}

const { token, ...user } = result.data;
login(token, user);
navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTwoFa = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pending_token: pendingToken, code: twoFaCode }),
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Invalid code');
      }
      const { token, ...user } = result.data;
      login(token, user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Cinematic Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none animate-pulse delay-700" />
      {/* FIXED: was loading a noise texture from an external third-party
          CDN (grainy-gradients.vercel.app) that's now returning 404 —
          entirely outside our control if that service changes or goes
          down. Replaced with a self-contained inline SVG (a standard
          fractal-noise filter) — same subtle grain effect, no external
          dependency that can ever break again. */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%2F%3E%3C%2Fsvg%3E')] opacity-[0.03] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[440px] relative z-10"
      >
        <div className="glass-card rounded-[40px] border border-white/5 p-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-purple-600/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

          <div className="text-center mb-12 relative z-10">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto mb-6 shadow-[0_0_30px_rgba(255,45,154,0.2)]"
            >
              <Zap className="w-8 h-8 fill-primary" />
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-3">
              Hii <span className="text-primary neon-text">Admin Dashboard</span>
            </h1>
            <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.3em]">Management Portal</p>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-bold p-4 rounded-2xl mb-8 flex items-center gap-3 uppercase tracking-wider"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {pendingToken ? (
            <form onSubmit={handleVerifyTwoFa} className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Authenticator Code</label>
                <div className="relative group/field">
                  <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/field:text-primary transition-all" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={twoFaCode}
                    onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full bg-[#0A0A0F] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-lg text-white text-center tracking-[0.4em] font-mono focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
                    placeholder="000000"
                    required
                  />
                </div>
                <p className="text-[10px] text-white/20 ml-1">Enter the 6-digit code from your authenticator app.</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || twoFaCode.length !== 6}
                className={cn(
                  "w-full h-16 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:shadow-[0_15px_50px_rgba(255,45,154,0.4)] disabled:opacity-50",
                  isLoading && "bg-primary/80"
                )}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Sign In'}
              </motion.button>

              <button
                type="button"
                onClick={() => { setPendingToken(null); setTwoFaCode(''); setError(''); }}
                className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-white/20 hover:text-white/50 transition-colors"
              >
                Back to login
              </button>
            </form>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Username / Email</label>
              <div className="relative group/field">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/field:text-primary transition-all" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0A0A0F] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10 font-medium"
                  placeholder="admin@hiiapp.com"
                  required
                />
              </div>
            </div>

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

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={cn(
                "w-full h-16 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:shadow-[0_15px_50px_rgba(255,45,154,0.4)] disabled:opacity-50",
                isLoading && "bg-primary/80"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>
          )}

          <div className="mt-10 text-center relative z-10">
            <span className="text-[11px] text-white/30 font-medium">New club or event organiser? </span>
            <Link to="/signup" className="text-[11px] font-black text-primary hover:underline uppercase tracking-wider">Register Here</Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-2 text-white/20 relative z-10">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Encrypted Session</span>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[10px] text-white/20 font-medium uppercase tracking-[0.3em]">
            &copy; 2024 Hii App Production • All Rights Reserved
          </p>
        </div>
      </motion.div>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');