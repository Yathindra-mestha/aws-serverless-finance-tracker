import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAuth as useOidcAuth } from 'react-oidc-context';
import { 
  Shield, 
  User, 
  Mail, 
  Key, 
  Activity,
  LogOut,
  Lock,
  Copy,
  Check
} from 'lucide-react';
import { SnsNotificationConfig } from '../aws/SnsNotificationConfig';
import { useToast } from '../../context/ToastContext';

// Simple InfoRow component
const InfoRow = ({ label, value, mono, copyable }: { label: string, value: string, mono?: boolean, copyable?: boolean }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-white/[0.04] last:border-0 gap-2">
      <span className="text-[12px] font-bold text-slate-400">{label}</span>
      <div className="flex items-center gap-2 max-w-full">
        <span className={`text-[13px] text-slate-200 truncate ${mono ? 'font-mono text-[12px] text-indigo-300' : ''}`}>
          {value}
        </span>
        {copyable && (
          <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-white/[0.05] text-slate-500 hover:text-slate-300 transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};

export const ProfileView: React.FC = () => {
  const { user, logout, login } = useAuth();
  const auth = useOidcAuth();
  const { showToast } = useToast();
  
  const isRealAuth = !!auth.user;
  const emailVerified = auth.user?.profile?.email_verified;
  const cognitoSub = auth.user?.profile?.sub || user?.cognitoSub || 'Unknown';

  const handleChangePassword = async () => {
    showToast('info', 'Change Password', 'You will be signed out. Please use the "Forgot your password?" link on the sign-in page to reset your password.');
    setTimeout(() => {
      logout();
      // Optional: automatically trigger login screen after a slight delay
      // setTimeout(() => login(), 500); 
    }, 2500);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto animate-fade-up">
      
      {/* Header Profile Card */}
      <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-indigo-500/30 flex items-center justify-center text-xl font-bold text-indigo-400 overflow-hidden shadow-xl shrink-0">
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
                  <Shield className="w-3 h-3" /> AWS Cognito Authenticated
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  <Activity className="w-3 h-3" /> Demo Mode
                </span>
              )}
              {emailVerified !== undefined && (
                <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${emailVerified ? 'text-sky-300 bg-sky-500/10 border-sky-500/20' : 'text-rose-300 bg-rose-500/10 border-rose-500/20'}`}>
                  <Mail className="w-3 h-3" /> Email {emailVerified ? 'Verified' : 'Unverified'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Details */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06] bg-white/[0.01]">
          <User className="w-4 h-4 text-indigo-400" />
          <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Account Information</h3>
        </div>
        <div className="px-5">
          <InfoRow label="Display Name" value={user?.name || 'N/A'} />
          <InfoRow label="Email Address" value={user?.email || 'N/A'} copyable />
          {isRealAuth && (
            <InfoRow label="Cognito User Identity (sub)" value={cognitoSub} mono copyable />
          )}
          <InfoRow label="Account Status" value={isRealAuth ? 'Active' : 'Local Sandbox'} />
        </div>
      </div>

      {/* Notification Preferences */}
      <SnsNotificationConfig />

      {/* Security Actions */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.04]">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-white/[0.06] bg-white/[0.01]">
          <Lock className="w-4 h-4 text-indigo-400" />
          <h3 className="text-[13px] font-bold text-white uppercase tracking-wider">Security</h3>
        </div>
        
        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <div>
              <h4 className="text-[13px] font-bold text-white">Change Password</h4>
              <p className="text-[12px] text-slate-400 mt-0.5">Use the secure AWS Cognito password reset flow.</p>
            </div>
            <button
              onClick={handleChangePassword}
              className="px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 text-indigo-300 text-xs font-bold transition-all shrink-0 whitespace-nowrap"
            >
              Change Password
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
            <div>
              <h4 className="text-[13px] font-bold text-rose-300">Sign Out</h4>
              <p className="text-[12px] text-slate-400 mt-0.5">End your current session securely.</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
