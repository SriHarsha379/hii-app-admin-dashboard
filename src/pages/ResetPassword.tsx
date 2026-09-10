import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, ArrowRight, Loader2, ShieldCheck, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { API_BASE } from '../lib/apiConfig';
import { cn, apiErrorMessage } from '../lib/utils';

export default function ResetPassword() {
  // The email links to /app/admin/reset-password/:token (see
  // authController.js adminForgetPassword) — a short-lived (15 min),
  // single-use JWT that identifies the admin. It's carried as a route
  // param, not typed by the user.
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is invalid. Please request a new one.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forget_new_password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        // Covers: expired/invalid token, link already used, and
        // "new password same as old" — all surfaced by the backend
        // via result.message.
        throw new Error(apiErrorMessage(result, 'Could not reset password. Please request a new link.'));
      }

      setDone(true);
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
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%2F%3E%3C%2Fsvg%3E')] opacity-[0.03] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
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
              <Lock className="w-8 h-8" />
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-3">
              Reset <span className="text-primary neon-text">Password</span>
            </h1>
            <p className="text-[10px] text-white/30 uppercase font-black tracking-[0.3em]">
              {done ? 'All set' : 'Choose a new password'}
            </p>
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

          {done ? (
            <div className="space-y-8 relative z-10">
              <div className="bg-primary/10 border border-primary/20 text-white/70 text-[12px] leading-relaxed p-6 rounded-2xl flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>Your password has been updated. You can now sign in with your new password.</div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/login')}
                className="w-full h-16 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:shadow-[0_15px_50px_rgba(255,45,154,0.4)]"
              >
                Go to Sign In
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">New Password</label>
                <div className="relative group/field">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/field:text-primary transition-all" />
                  <input
                    type="password"
                    autoFocus
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#0A0A0F] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
                <div className="relative group/field">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within/field:text-primary transition-all" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#0A0A0F] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-white/10"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-[10px] text-white/20 ml-1">Must be at least 6 characters.</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className={cn(
                  'w-full h-16 rounded-2xl bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(255,45,154,0.3)] hover:shadow-[0_15px_50px_rgba(255,45,154,0.4)] disabled:opacity-50',
                  isLoading && 'bg-primary/80'
                )}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </motion.button>
            </form>
          )}

          <div className="mt-10 text-center relative z-10">
            <Link
              to="/login"
              className="text-[11px] font-black text-white/30 hover:text-primary transition-colors uppercase tracking-wider inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Sign In
            </Link>
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