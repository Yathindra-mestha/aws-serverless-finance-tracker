import React from 'react';
import { Target, AlertCircle, CheckCircle2, Sliders, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface BudgetCardProps {
  onOpenBudgetModal: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ onOpenBudgetModal }) => {
  const { user } = useAuth();
  const { summary } = useFinance();

  const currencyCode = user?.currency || 'INR';
  const currencySymbol = user?.currencySymbol || '₹';

  const {
    monthlyBudget,
    budgetUsedAmount,
    remainingBudget,
    budgetUsedPercentage,
  } = summary;

  // Compute status badge and color based on percentage
  const getStatus = () => {
    if (budgetUsedPercentage >= 100) {
      return {
        label: 'Budget Exceeded',
        icon: AlertCircle,
        badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        barColor: 'from-rose-500 to-red-600',
        shadow: 'shadow-glow-danger',
        message: `Exceeded by ${formatCurrency(Math.abs(remainingBudget), currencyCode, currencySymbol)}!`,
      };
    }
    if (budgetUsedPercentage >= 80) {
      return {
        label: 'Approaching Limit',
        icon: AlertCircle,
        badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        barColor: 'from-amber-400 to-orange-500',
        shadow: 'shadow-glow-warning',
        message: `${formatPercentage(100 - budgetUsedPercentage)} buffer remaining before limit.`,
      };
    }
    return {
      label: 'On Track',
      icon: ShieldCheck,
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      barColor: 'from-emerald-400 to-indigo-500',
      shadow: 'shadow-glow-success',
      message: `${formatCurrency(remainingBudget, currencyCode, currencySymbol)} safe spending left this month.`,
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;
  const clampedProgress = Math.min(budgetUsedPercentage, 100);

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 p-6 shadow-card hover:border-slate-700 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Monthly Budget Progress</h3>
            <p className="text-xs text-slate-400">Total expense tracking against monthly limit</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${status.badgeBg}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label} ({budgetUsedPercentage}%)
          </span>

          <button
            onClick={onOpenBudgetModal}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Adjust Budget</span>
          </button>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="mt-5 space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400 font-medium">
            Spent: <span className="text-white font-mono font-bold">{formatCurrency(budgetUsedAmount, currencyCode, currencySymbol)}</span>
          </span>
          <span className="text-slate-400 font-medium">
            Monthly Target: <span className="text-indigo-300 font-mono font-bold">{formatCurrency(monthlyBudget, currencyCode, currencySymbol)}</span>
          </span>
        </div>

        <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60 relative">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${status.barColor} transition-all duration-700 ease-out`}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{status.message}</span>
          </p>
          <p className="text-xs font-mono font-bold text-slate-300">
            {remainingBudget >= 0 ? 'Remaining: ' : 'Overspent: '}
            <span className={remainingBudget >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {formatCurrency(Math.abs(remainingBudget), currencyCode, currencySymbol)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
