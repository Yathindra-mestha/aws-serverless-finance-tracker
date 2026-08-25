import React, { useState } from 'react';
import { Cloud, Mail, Lock, User, Sparkles, Eye, EyeOff, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, signUp, loginDemo, isLoading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('alex.cloud.dev@example.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!email.trim() || !email.includes('@')) errs.email = 'Valid email is required';
    if (!password || password.length < 6) errs.password = 'At least 6 characters';
    if (mode === 'signup' && !name.trim()) errs.name = 'Full name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (mode === 'signin') await login(email, password);
      else await signUp(name, email, password);
      onClose();
    } catch (err) { console.error(err); }
  };

  const handleDemo = async () => {
    await loginDemo();
    onClose();
  };

  const inputClass =
    'w-full bg-slate-900/60 border border-slate-800/80 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15 rounded-xl py-2.5 text-[14px] text-slate-100 placeholder-slate-600 outline-none transition-all';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)' }}
    >
      <div className="w-full max-w-[400px] animate-scale-in">
        <div className="bg-[#0b1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-card-lg">

          {/* Top stripe */}
          <div className="header-stripe" />

          {/* Hero section */}
          <div className="relative px-7 pt-8 pb-6 text-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.07] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-indigo mb-4">
              <Cloud className="w-7 h-7 text-white" strokeWidth={2} />
            </div>

            <h1
              className="text-[20px] font-extrabold text-white"
              style={{ letterSpacing: '-0.03em' }}
            >
              Welcome to FinTrack Cloud
            </h1>
            <p className="text-[13px] text-slate-400 mt-1.5 font-medium">
              Powered by AWS Serverless Architecture
            </p>

            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-[#FF9900]/10 border border-[#FF9900]/20 rounded-full">
              <span className="live-dot w-1.5 h-1.5" />
              <span className="text-[10px] font-bold text-[#FF9900] font-mono tracking-[0.06em]">
                Cognito · API Gateway · Lambda · DynamoDB
              </span>
            </div>
          </div>

          {/* Mode tabs */}
          <div className="mx-6 mb-5 flex bg-white/[0.04] border border-white/[0.06] rounded-[14px] p-1">
            {(['signin', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 rounded-xl text-[13px] font-bold transition-all ${
                  mode === m ? 'bg-indigo-600 text-white shadow-indigo' : 'text-slate-400 hover:text-slate-200'
                }`}
                style={{ letterSpacing: '-0.01em' }}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-4 space-y-3.5">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.07em]">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Developer"
                    className={`${inputClass} pl-10 pr-4`}
                  />
                </div>
                {errors.name && <p className="text-[11px] text-rose-400">{errors.name}</p>}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.07em]">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`${inputClass} pl-10 pr-4`}
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-400">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.07em]">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`${inputClass} pl-10 pr-10`}
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-rose-400">{errors.password}</p>}
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full py-2.5 rounded-xl text-[14px] font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ letterSpacing: '-0.01em' }}
            >
              {isLoading ? 'Authenticating…' : mode === 'signin' ? 'Sign In with Cognito' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="px-6 flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] text-slate-600 font-bold">OR</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Demo */}
          <div className="px-6 pb-7">
            <button
              onClick={handleDemo} disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-bold text-[#FF9900] bg-[#FF9900]/10 hover:bg-[#FF9900]/18 border border-[#FF9900]/25 hover:border-[#FF9900]/45 transition-all hover:shadow-aws-orange active:scale-[0.98]"
              style={{ letterSpacing: '-0.01em' }}
            >
              <Sparkles className="w-4 h-4" />
              Quick Demo — No Login Required
            </button>
            <p className="text-center text-[11px] text-slate-600 mt-2 font-medium">
              Loads sample ₹30,000 income · ₹18,500 expenses
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
