import React, { useState } from 'react';
import { Sparkles, Lock, Mail, User, ArrowRight, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: { name: string; email: string }) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onSuccess({
        name: fullName || email.split('@')[0] || 'Naren Kamal',
        email: email || 'naren@example.com'
      });
      onClose();
    }, 600);
  };

  const handleGuestLaunch = () => {
    onSuccess({
      name: 'Guest Explorer',
      email: 'guest@trajectory.internal'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0c0f1d] border border-amber-400/30 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Glow Accent */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TRAJECTORY AUTH GATEWAY</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Access Flight Telemetry' : 'Initiate Career Ascent'}
          </h2>
          <p className="text-xs text-white/60 mt-1">
            {mode === 'login' ? 'Sign in to access your flight path and saved metrics.' : 'Create an account to benchmark your technical trajectory.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-mono text-white/60 mb-1">FULL NAME</label>
              <div className="relative">
                <User className="w-4 h-4 text-white/40 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-[#141828] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:border-amber-400/50 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-mono text-white/60 mb-1">EMAIL ADDRESS</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@tier1.com"
                className="w-full bg-[#141828] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:border-amber-400/50 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-white/60 mb-1">PASSWORD</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#141828] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:border-amber-400/50 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-400/10 transition-all cursor-pointer"
          >
            <span>{loading ? 'AUTHENTICATING...' : mode === 'login' ? 'ENTER TELEMETRY HUB' : 'INITIALIZE ASCENT PROFILE'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-white/10" />
          <span className="px-3 text-[10px] font-mono text-white/40">OR</span>
          <div className="flex-1 border-t border-white/10" />
        </div>

        {/* Instant Guest Demo CTA */}
        <button
          type="button"
          onClick={handleGuestLaunch}
          className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white/90 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <span>⚡ Instant Guest Access (Skip Auth)</span>
        </button>

        {/* Mode Switcher */}
        <div className="text-center mt-4 text-xs text-white/50">
          {mode === 'login' ? "Don't have an account?" : 'Already registered?'}
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            className="ml-1.5 text-amber-400 hover:underline font-semibold cursor-pointer"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
};
