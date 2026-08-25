import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAuth as useOidcAuth } from 'react-oidc-context';
import {
  User, Mail, Key, Shield, Clock, RefreshCw, Copy, CheckCheck,
  Activity, Lock, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Reusable Row ─────────────────────────────────────────────
const InfoRow: React.FC<{ label: string; value: string; mono?: boolean; copyable?: boolean }> = ({
  label, value, mono, copyable,
}) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-white/[0.05] last:border-0">
      <span className="text-xs text-slate-400 font-semibold shrink-0 w-36">{label}</span>
      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
        <span className={`text-xs text-slate-200 text-right break-all ${mono ? 'font-mono' : 'font-medium'}`}>
          {value}
        </span>
        {copyable && (
          <button onClick={copy} className="shrink-0 text-slate-500 hover:text-indigo-400 transition-colors">
            {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Section Card ─────────────────────────────────────────────
const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; accentClass?: string }> = ({
  title, icon, children, accentClass = 'from-indigo-900/50 to-transparent',
}) => (
  <div className="bg-[#0b1120] border border-white/[0.07] rounded-2xl overflow-hidden">
    <div className={`flex items-center gap-2.5 px-5 py-3.5 bg-gradient-to-r ${accentClass} border-b border-white/[0.06]`}>
      <div className="text-white/70">{icon}</div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
    </div>
    <div className="px-5">{children}</div>
  </div>
);

// ── Main Component ────────────────────────────────────────────
export const ProfileView: React.FC = () => {
  const { user, logout } = useAuth();
  const oidc = useOidcAuth();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [showRawClaims, setShowRawClaims] = useState(false);
  const [decodedClaims, setDecodedClaims] = useState<Record<string, any> | null>(null);

  const isRealAuth = oidc.isAuthenticated;
  const profile = oidc.user?.profile;
  const idToken = oidc.user?.id_token;
  const expiresAt = oidc.user?.expires_at;

  // Decode JWT claims
  useEffect(() => {
    if (idToken) {
      try {
        const parts = idToken.split('.');
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        setDecodedClaims(payload);
      } catch { /* ignore */ }
    }
  }, [idToken]);

  // Live countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = expiresAt * 1000 - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await oidc.signinSilent(); } catch { /* silent fail */ }
    finally { setRefreshing(false); }
  };

  const authTime = decodedClaims?.auth_time
    ? new Date(decodedClaims.auth_time * 1000).toLocaleString()
    : null;
  const tokenExpiry = expiresAt
    ? new Date(expiresAt * 1000).toLocaleString()
    : null;
  const emailVerified = (profile as any)?.email_verified;

  return (
    <div className="max-w-2xl mx-auto space-y-5 py-2">

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-transparent border border-indigo-500/20 p-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-2xl font-black text-white shadow-lg flex-shrink-0 overflow-hidden ring-2 ring-indigo-500/30">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-extrabold text-white truncate" style={{ letterSpacing: '-0.03em' }}>
              {user?.name || 'Cognito User'}
            </h2>
            <p className="text-sm text-slate-400 truncate mt-0.5">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              {isRealAuth ? (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                  <Shield className="w-3 h-3" /> AWS Cognito · Verified
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  <Activity className="w-3 h-3" /> Demo Mode
                </span>
              )}
              {emailVerified !== undefined && (
                <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${emailVerified ? 'text-sky-300 bg-sky-500/10 border-sky-500/20' : 'text-rose-300 bg-rose-500/10 border-rose-500/20'}`}>
                  <Mail className="w-3 h-3" /> Email {emailVerified ? 'Verified ✓' : 'Unverified'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Account Details ─────────────────────────────────── */}
      <Section title="Account Details" icon={<User className="w-4 h-4" />} accentClass="from-indigo-900/50 to-transparent">
        <InfoRow label="Display Name" value={user?.name || '—'} />
        <InfoRow label="Email Address" value={user?.email || '—'} copyable />
        <InfoRow label="Auth Provider" value={isRealAuth ? 'Amazon Cognito User Pool' : 'Demo / Local'} />
        <InfoRow label="Region" value="ap-south-1 (Mumbai)" mono />
        <InfoRow label="Signed In At" value={authTime || '—'} />
      </Section>

      {/* ── Cognito Identity ─────────────────────────────────── */}
      {isRealAuth && (
        <Section title="Cognito Identity" icon={<Key className="w-4 h-4" />} accentClass="from-amber-900/40 to-transparent">
          <InfoRow label="Subject (sub)" value={(profile as any)?.sub || user?.cognitoSub || '—'} mono copyable />
          <InfoRow label="User Pool ID" value="ap-south-1_B1MTK1D8V" mono copyable />
          <InfoRow label="App Client ID" value="7m94kecke7n9h6g4216e4cgg0o" mono copyable />
          <InfoRow label="Token Issuer" value={decodedClaims?.iss || '—'} mono />
          <InfoRow label="Token Use" value={decodedClaims?.token_use || 'id'} mono />
        </Section>
      )}

      {/* ── Session Countdown ────────────────────────────────── */}
      <Section title="Session & Token" icon={<Clock className="w-4 h-4" />} accentClass="from-emerald-900/40 to-transparent">
        <div className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.05]">
          <div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mb-1">Session Expires In</p>
            <p className={`text-3xl font-black font-mono tracking-tight ${timeLeft === 'Expired' ? 'text-rose-400' : 'text-emerald-300'}`}>
              {timeLeft || (isRealAuth ? 'Calculating…' : '—')}
            </p>
            {tokenExpiry && (
              <p className="text-[11px] text-slate-500 mt-0.5">Expires at {tokenExpiry}</p>
            )}
          </div>
          {isRealAuth && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 hover:border-emerald-400/50 text-emerald-300 text-xs font-bold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing…' : 'Refresh Session'}
            </button>
          )}
        </div>
        <InfoRow label="Token Type" value="Bearer ID Token (JWT)" mono />
        <InfoRow label="OAuth Scopes" value="email openid phone" mono />
        <InfoRow label="Grant Type" value="Authorization Code + PKCE" />
      </Section>

      {/* ── Raw JWT Claims ───────────────────────────────────── */}
      {isRealAuth && decodedClaims && (
        <div className="bg-[#0b1120] border border-white/[0.07] rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowRawClaims(!showRawClaims)}
            className="w-full flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-bold text-white">Raw JWT Claims</span>
              <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full font-mono">Decoded Payload</span>
            </div>
            {showRawClaims ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
          {showRawClaims && (
            <pre className="p-4 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
              {JSON.stringify(decodedClaims, null, 2)}
            </pre>
          )}
        </div>
      )}

      {/* ── Danger Zone ─────────────────────────────────────── */}
      <div className="bg-[#0b1120] border border-rose-500/15 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-rose-300 mb-1">Sign Out</h3>
        <p className="text-xs text-slate-500 mb-3">Ends your current session and returns to the login screen.</p>
        <button
          onClick={logout}
          className="px-5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-bold transition-all"
        >
          Sign Out of FinTrack Cloud
        </button>
      </div>

    </div>
  );
};
