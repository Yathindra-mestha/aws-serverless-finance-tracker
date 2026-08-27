import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  amount: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    label: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'default';
  subtext?: string;
  onClick?: () => void;
  onEditAction?: () => void;
  editTooltip?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  amount,
  icon: Icon,
  trend,
  variant = 'default',
  subtext,
  onClick,
  onEditAction,
  editTooltip = "Edit"
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          border: 'border-indigo-500/30 hover:border-indigo-500/60',
          iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
          glow: 'hover:shadow-glow-primary',
          highlight: 'text-indigo-400',
        };
      case 'success':
        return {
          border: 'border-emerald-500/30 hover:border-emerald-500/60',
          iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
          glow: 'hover:shadow-glow-success',
          highlight: 'text-emerald-400',
        };
      case 'warning':
        return {
          border: 'border-amber-500/30 hover:border-amber-500/60',
          iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
          glow: 'hover:shadow-glow-warning',
          highlight: 'text-amber-400',
        };
      case 'danger':
        return {
          border: 'border-rose-500/30 hover:border-rose-500/60',
          iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
          glow: 'hover:shadow-glow-danger',
          highlight: 'text-rose-400',
        };
      default:
        return {
          border: 'border-slate-800 hover:border-slate-700',
          iconBg: 'bg-slate-800 text-slate-400 border border-slate-700',
          glow: 'hover:shadow-card-hover',
          highlight: 'text-slate-100',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-slate-900/90 p-5 border backdrop-blur-sm transition-all duration-300 ${
        styles.border
      } ${styles.glow} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
            {onEditAction && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEditAction(); }}
                className="p-1 -ml-1 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                title={editTooltip}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </button>
            )}
          </div>
          <h3 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-mono">
            {amount}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${styles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 font-semibold px-1.5 py-0.5 rounded-md ${
              trend.isNeutral
                ? 'bg-slate-800 text-slate-300'
                : trend.isPositive
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            {trend.isNeutral ? (
              <Minus className="w-3 h-3" />
            ) : trend.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.value}
          </span>
          <span className="text-slate-400">{trend.label}</span>
        </div>
      )}

      {subtext && !trend && (
        <p className="mt-3 text-xs text-slate-400 leading-normal">{subtext}</p>
      )}
    </div>
  );
};
