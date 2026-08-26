import React from 'react';
import { Target, AlertCircle, Sliders, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

interface BudgetCardProps {
  onOpenBudgetModal: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({ onOpenBudgetModal }) => {
  const { user } = useAuth();
  const { summary, budget } = useFinance();

  const currencyCode = user?.currency || 'INR';
  const sym = user?.currencySymbol || 'Rs';

  const {
    monthlyBudget,
    budgetUsedAmount,
    remainingBudget,
    budgetUsedPercentage,
    categoryBreakdown,
  } = summary;

  const rawCategoryBudgets = budget?.categoryBudgets ?? {};
  const categoryRows = Object.entries(rawCategoryBudgets)
    .filter(([, limit]) => typeof limit === 'number' && (limit as number) > 0)
    .map(([cat, limit]) => {
      const numLimit = limit as number;
      const spent = categoryBreakdown.find(
        (c) => c.category.toLowerCase() === cat.toLowerCase()
      )?.amount ?? 0;
      const pct = numLimit > 0 ? Math.min(Math.round((spent / numLimit) * 100), 100) : 0;
      return { cat, limit: numLimit, spent, pct, remaining: numLimit - spent };
    })
    .sort((a, b) => b.pct - a.pct);

  const noCategoryBudgets = categoryRows.length === 0;

  const getStatus = () => {
    if (budgetUsedPercentage >= 100)
      return { label: 'Budget Exceeded', icon: AlertCircle, badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
    if (budgetUsedPercentage >= 80)
      return { label: 'Approaching Limit', icon: AlertCircle, badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    return { label: 'On Track', icon: ShieldCheck, badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  const barGradient = (pct: number) => {
    if (pct >= 100) return 'from-rose-500 to-red-600';
    if (pct >= 80) return 'from-amber-400 to-orange-500';
    return 'from-emerald-400 to-indigo-500';
  };

  return (
    <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-indigo-950/40 border border-slate-800 p-6 shadow-card hover:border-slate-700 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Monthly Budget Status</h3>
            <p className="text-xs text-slate-400">Per-category limits vs. actual spending</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${status.badge}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {status.label} - {budgetUsedPercentage}%
          </span>
          <button
            onClick={onOpenBudgetModal}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-400" />
            <span>Adjust</span>
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-5">
        {noCategoryBudgets ? (
          <div className="text-center py-8 space-y-1">
            <p className="text-slate-400 text-sm font-medium">No category budgets set yet.</p>
            <p className="text-slate-500 text-xs">Click Adjust to add category limits.</p>
          </div>
        ) : (
          categoryRows.map(({ cat, limit, spent, pct, remaining }) => (
            <div key={cat} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">{cat}</span>
                <span className="font-mono text-slate-400">
                  <span className={pct >= 100 ? 'text-rose-400 font-bold' : pct >= 80 ? 'text-amber-400 font-bold' : 'text-white font-bold'}>
                    {formatCurrency(spent, currencyCode, sym)}
                  </span>
                  <span className="text-slate-600 mx-1">/</span>
                  <span className="text-indigo-300">{formatCurrency(limit, currencyCode, sym)}</span>
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/60">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${barGradient(pct)} transition-all duration-700 ease-out`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{pct}% used</span>
                <span className={remaining >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                  {remaining >= 0
                    ? `${formatCurrency(remaining, currencyCode, sym)} left`
                    : `${formatCurrency(Math.abs(remaining), currencyCode, sym)} over`}
                </span>
              </div>
            </div>
          ))
        )}

        {!noCategoryBudgets && (
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-slate-400">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Total Spent: <span className="text-white font-mono font-bold ml-1">{formatCurrency(budgetUsedAmount, currencyCode, sym)}</span>
            </span>
            <span className="text-slate-400">
              Budget: <span className="text-indigo-300 font-mono font-bold">{formatCurrency(monthlyBudget, currencyCode, sym)}</span>
              {' - '}
              <span className={remainingBudget >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {remainingBudget >= 0
                  ? `${formatCurrency(remainingBudget, currencyCode, sym)} remaining`
                  : `${formatCurrency(Math.abs(remainingBudget), currencyCode, sym)} over`}
              </span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
