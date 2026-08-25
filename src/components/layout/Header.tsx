import React, { useState } from 'react';
import { Cloud, Plus, Minus, Calendar, Layers, LayoutDashboard, ListOrdered, Target, Menu, X, Zap, LogOut, ChevronDown, ShieldCheck, UserCircle, RefreshCw, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useAuth as useOidcAuth } from 'react-oidc-context';
import { formatMonth } from '../../utils/formatters';
import { TransactionType } from '../../types';

interface HeaderProps {
  onOpenAwsModal: () => void;
  onOpenAddTxModal: (type: TransactionType) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = [
  { id: 'dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ListOrdered },
  { id: 'budget',       label: 'Budget',       icon: Target },
];

const MONTHS = ['2026-08','2026-07','2026-06','2026-05','2026-04','2026-03'];

export const Header: React.FC<HeaderProps> = ({
  onOpenAwsModal, onOpenAddTxModal, activeTab, setActiveTab,
}) => {
  const { user, logout } = useAuth();
  const oidc = useOidcAuth();
  const { activeMonthYear, setActiveMonthYear } = useFinance();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  // Live master 30-day session countdown
  React.useEffect(() => {
    if (!oidc.user) return;
    const authTimeSec = (oidc.user.profile as any)?.auth_time || (oidc.user.expires_at ? oidc.user.expires_at - 3600 : Math.floor(Date.now() / 1000));
    const masterExpiresAtMs = (authTimeSec + 30 * 24 * 3600) * 1000;

    const update = () => {
      const diff = masterExpiresAtMs - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
      const d = Math.floor(diff / (24 * 3600 * 1000));
      const h = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
      const m = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`);
    };
    update();
    const id = setInterval(update, 10000);
    return () => clearInterval(id);
  }, [oidc.user]);

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Top gradient stripe */}
      <div className="header-stripe" />

      <div
        className="border-b border-white/[0.055]"
        style={{ background: 'rgba(6,10,20,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-[60px] items-center justify-between gap-4">

            {/* ── Logo ─────────────────────────────────────────── */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 group shrink-0 select-none"
            >
              {/* Icon mark */}
              <div className="relative w-8 h-8 rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-indigo flex-shrink-0 transition-transform group-hover:scale-105">
                <Cloud className="w-4 h-4 text-white" strokeWidth={2.5} />
                {/* Live dot */}
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-2 border-[#060a14] rounded-full" />
              </div>

              <div className="hidden sm:block leading-none">
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-[15px] font-extrabold tracking-tight text-white"
                    style={{ letterSpacing: '-0.025em' }}
                  >
                    FinTrack
                  </span>
                  <span className="text-[13px] font-bold text-gradient-aws" style={{ letterSpacing: '-0.01em' }}>
                    Cloud
                  </span>
                </div>
                <p className="text-[10px] font-medium text-slate-500 tracking-[0.08em] uppercase mt-0.5 font-mono">
                  AWS Serverless
                </p>
              </div>
            </button>

            {/* ── Nav Tabs ────────────────────────────────────── */}
            <nav className="hidden md:flex items-center gap-0.5 bg-white/[0.035] border border-white/[0.06] rounded-[14px] p-1">
              {TABS.map(({ id, label, icon: Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-[10px] text-[13px] font-semibold transition-all duration-200 ${
                      active
                        ? 'bg-indigo-600 text-white shadow-indigo'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.05]'
                    }`}
                    style={{ letterSpacing: '-0.01em' }}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={active ? 2.5 : 2} />
                    {label}
                  </button>
                );
              })}
            </nav>

            {/* ── Right Actions ────────────────────────────────── */}
            <div className="flex items-center gap-2">

              {/* Month picker */}
              <div className="hidden sm:flex items-center gap-1.5 bg-white/[0.035] border border-white/[0.06] rounded-[10px] px-2.5 py-1.5 hover:border-white/[0.12] transition-colors cursor-pointer">
                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" strokeWidth={2} />
                <select
                  value={activeMonthYear}
                  onChange={(e) => setActiveMonthYear(e.target.value)}
                  className="bg-transparent text-slate-200 text-[12px] font-semibold focus:outline-none cursor-pointer"
                  style={{ fontFamily: 'inherit', letterSpacing: '-0.01em' }}
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m} className="bg-[#0b1120] text-slate-200">
                      {formatMonth(m)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Income */}
              <button
                onClick={() => onOpenAddTxModal('income')}
                className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/18 text-emerald-300 border border-emerald-500/25 hover:border-emerald-400/50 px-3 py-1.5 rounded-[10px] text-[12px] font-bold transition-all duration-200 hover:shadow-emerald"
                style={{ letterSpacing: '-0.01em' }}
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span className="hidden sm:inline">Income</span>
              </button>

              {/* Add Expense */}
              <button
                onClick={() => onOpenAddTxModal('expense')}
                className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/18 text-rose-300 border border-rose-500/25 hover:border-rose-400/50 px-3 py-1.5 rounded-[10px] text-[12px] font-bold transition-all duration-200 hover:shadow-rose"
                style={{ letterSpacing: '-0.01em' }}
              >
                <Minus className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span className="hidden sm:inline">Expense</span>
              </button>

              {/* AWS Blueprint */}
              <button
                onClick={onOpenAwsModal}
                className="hidden lg:flex items-center gap-1.5 bg-[#FF9900]/10 hover:bg-[#FF9900]/18 text-[#FF9900] border border-[#FF9900]/25 hover:border-[#FF9900]/50 px-3 py-1.5 rounded-[10px] text-[12px] font-bold transition-all hover:shadow-aws-orange"
                style={{ letterSpacing: '-0.01em' }}
              >
                <Layers className="w-3.5 h-3.5" strokeWidth={2} />
                AWS Blueprint
              </button>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-[10px] bg-white/[0.035] border border-white/[0.06] hover:border-indigo-500/40 hover:bg-white/[0.06] transition-all cursor-pointer flex-shrink-0 group"
                >
                  <div className="w-7 h-7 rounded-[8px] overflow-hidden ring-1 ring-white/10 flex-shrink-0 bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-[11px] font-bold">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user?.name || 'User'}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()
                    )}
                  </div>
                  <span className="hidden sm:inline text-[12px] font-semibold text-slate-200 group-hover:text-white transition-colors max-w-[120px] truncate">
                    {user?.name || user?.email?.split('@')[0] || 'Account'}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition-transform" />
                </button>

                {profileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#0b1120] border border-white/[0.08] shadow-2xl p-3 z-50 animate-scale-in">

                      {/* User info */}
                      <div className="flex items-center gap-3 pb-3 mb-2 border-b border-white/[0.06]">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                          {user?.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{user?.name || 'Authenticated User'}</p>
                          <p className="text-[11px] text-slate-400 truncate">{user?.email || 'Cognito User Pool'}</p>
                        </div>
                      </div>

                      {/* Cognito badge */}
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 mb-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-300">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>AWS Cognito · Authenticated</span>
                      </div>

                      {/* Master 30-Day Session countdown */}
                      {oidc.isAuthenticated && timeLeft && (
                        <div className="flex items-center justify-between px-2.5 py-2 mb-2 rounded-lg bg-slate-800/60 border border-white/[0.05]">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            <span>Master Logout in</span>
                          </div>
                          <span className={`text-[11px] font-bold font-mono ${timeLeft === 'Expired' ? 'text-rose-400' : 'text-emerald-300'}`}>
                            {timeLeft}
                          </span>
                        </div>
                      )}

                      {/* View Profile button */}
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setActiveTab('profile');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 mb-1.5 rounded-lg hover:bg-white/[0.05] text-slate-300 hover:text-white text-xs font-semibold transition-all text-left"
                      >
                        <UserCircle className="w-3.5 h-3.5 text-indigo-400" />
                        View Profile & Account Details
                      </button>

                      {/* Sign out */}
                      <button
                        onClick={() => {
                          setProfileMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition-all active:scale-[0.98]"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile menu */}
              <button
                className="md:hidden p-2 rounded-[10px] text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* ── Mobile dropdown ───────────────────────────────── */}
          {mobileOpen && (
            <div className="md:hidden pb-3 pt-2 border-t border-white/[0.06] animate-fade-up space-y-2.5">
              {/* Tab buttons */}
              <div className="flex gap-1.5">
                {TABS.map(({ id, label, icon: Icon }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => { setActiveTab(id); setMobileOpen(false); }}
                      className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-bold transition-all ${
                        active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/[0.06]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
                <button
                  onClick={() => { onOpenAwsModal(); setMobileOpen(false); }}
                  className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[11px] font-bold text-[#FF9900] bg-[#FF9900]/10 border border-[#FF9900]/25"
                >
                  <Layers className="w-4 h-4" />
                  AWS
                </button>
              </div>

              {/* Month picker */}
              <div className="flex items-center gap-2 bg-white/[0.035] border border-white/[0.07] rounded-xl px-3 py-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <select
                  value={activeMonthYear}
                  onChange={(e) => setActiveMonthYear(e.target.value)}
                  className="bg-transparent text-slate-200 text-[12px] font-semibold w-full focus:outline-none"
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m} className="bg-[#0b1120]">{formatMonth(m)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
