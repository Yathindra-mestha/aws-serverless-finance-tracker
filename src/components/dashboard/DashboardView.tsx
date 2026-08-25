import React, { useState } from 'react';
import {
  Wallet, ArrowUpRight, ArrowDownRight, PiggyBank,
  Plus, Minus, ArrowRight, Edit3, Trash2, Sparkles, Activity,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate, formatMonth } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import { Transaction } from '../../types';

interface DashboardViewProps {
  onOpenAddTxModal: (type: 'income' | 'expense') => void;
  onOpenBudgetModal: () => void;
  onOpenAwsModal: () => void;
  onNavigateToTab: (tab: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddTxModal, onOpenBudgetModal, onNavigateToTab,
  onEditTransaction, onDeleteTransaction,
}) => {
  const { user } = useAuth();
  const { summary, transactions, activeMonthYear } = useFinance();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const sym = user?.currencySymbol ?? '₹';
  const code = user?.currency ?? 'INR';

  const {
    currentBalance, totalIncome, totalExpenses, monthlyBudget,
    remainingBudget, budgetUsedPercentage, categoryBreakdown,
  } = summary;

  const monthTx = transactions.filter((t) => t.date.startsWith(activeMonthYear));
  const displayTx = activeCategory
    ? monthTx.filter((t) => t.category.toLowerCase() === activeCategory.toLowerCase())
    : monthTx.slice(0, 6);

  const clamp = Math.min(budgetUsedPercentage, 100);
  const budgetStatus =
    monthlyBudget === 0 ? 'unset' :
    budgetUsedPercentage >= 100 ? 'danger' :
    budgetUsedPercentage >= 80  ? 'warning' : 'safe';

  const celebrate = () => {
    confetti({
      particleCount: 120, spread: 75, origin: { y: 0.6 },
      colors: ['#818cf8','#6ee7b7','#fbbf24','#a78bfa','#67e8f9'],
    });
  };

  // ─── KPI Card data ───────────────────────────────────────
  const kpiCards = [
    {
      id: 'balance',
      label: 'Net Balance',
      value: formatCurrency(currentBalance, code, sym),
      prefix: '',
      hint: 'Tap to celebrate 🎉',
      icon: Wallet,
      accent: 'indigo',
      textClass: 'text-gradient-primary',
      onClick: celebrate,
    },
    {
      id: 'income',
      label: 'Total Income',
      value: formatCurrency(totalIncome, code, sym),
      prefix: '+',
      hint: 'Tap to add income',
      icon: ArrowUpRight,
      accent: 'emerald',
      textClass: 'text-gradient-success',
      onClick: () => onOpenAddTxModal('income'),
    },
    {
      id: 'expenses',
      label: 'Total Expenses',
      value: formatCurrency(totalExpenses, code, sym),
      prefix: '−',
      hint: 'Tap to log expense',
      icon: ArrowDownRight,
      accent: 'rose',
      textClass: 'text-gradient-danger',
      onClick: () => onOpenAddTxModal('expense'),
    },
    {
      id: 'budget',
      label: 'Monthly Budget',
      value: formatCurrency(monthlyBudget, code, sym),
      prefix: '',
      hint: `${budgetUsedPercentage}% used · Tap to adjust`,
      icon: PiggyBank,
      accent: 'amber',
      textClass: 'text-amber-200',
      onClick: onOpenBudgetModal,
    },
  ] as const;

  const accentMap = {
    indigo:  { icon: 'bg-indigo-500/12 border-indigo-500/20 text-indigo-400',  hover: 'group-hover:bg-indigo-500/22' },
    emerald: { icon: 'bg-emerald-500/12 border-emerald-500/20 text-emerald-400', hover: 'group-hover:bg-emerald-500/22' },
    rose:    { icon: 'bg-rose-500/12 border-rose-500/20 text-rose-400',         hover: 'group-hover:bg-rose-500/22' },
    amber:   { icon: 'bg-amber-500/12 border-amber-500/20 text-amber-400',      hover: 'group-hover:bg-amber-500/22' },
  };

  return (
    <div className="space-y-5 animate-fade-up">

      {/* ── Page header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-[26px] font-extrabold text-white"
            style={{ letterSpacing: '-0.03em' }}
          >
            Financial Overview
          </h1>
          <p className="text-[13px] text-slate-400 mt-0.5 font-medium">
            {formatMonth(activeMonthYear)} &nbsp;·&nbsp; Personal Finance Dashboard
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => onOpenAddTxModal('income')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-[13px] font-bold shadow-emerald transition-all active:scale-[0.97]"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add Income
          </button>
          <button
            onClick={() => onOpenAddTxModal('expense')}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-[13px] font-bold shadow-rose transition-all active:scale-[0.97]"
          >
            <Minus className="w-4 h-4" strokeWidth={2.5} />
            Add Expense
          </button>
        </div>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiCards.map(({ id, label, value, prefix, hint, icon: Icon, accent, textClass, onClick }, i) => {
          const a = accentMap[accent];
          return (
            <div
              key={id}
              onClick={onClick}
              className={`stat-card ${accent} glass-card glass-card-hover rounded-2xl p-5 cursor-pointer group stagger-${i+1} animate-fade-up`}
            >
              <div className="flex items-start justify-between mb-5">
                <p
                  className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.07em]"
                >
                  {label}
                </p>
                <div
                  className={`p-2 rounded-xl border transition-all ${a.icon} ${a.hover}`}
                >
                  <Icon className="w-4 h-4" strokeWidth={2} />
                </div>
              </div>

              <p
                className={`text-[22px] font-extrabold leading-none amount ${textClass}`}
                style={{ letterSpacing: '-0.03em' }}
              >
                {prefix}{value}
              </p>

              <p className="text-[11px] text-slate-500 font-medium mt-2.5">
                {hint}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Budget Status ──────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3
                className="text-[14px] font-bold text-white"
                style={{ letterSpacing: '-0.02em' }}
              >
                Monthly Budget Status
              </h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                DynamoDB · PK=USER#demo | SK=BUDGET#{activeMonthYear}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                budgetStatus === 'unset'   ? 'bg-slate-800 text-slate-400 border-slate-700' :
                budgetStatus === 'danger'  ? 'bg-rose-500/12 text-rose-400 border-rose-500/25' :
                budgetStatus === 'warning' ? 'bg-amber-500/12 text-amber-400 border-amber-500/25' :
                                            'bg-emerald-500/12 text-emerald-400 border-emerald-500/25'
              }`}
            >
              {budgetStatus === 'unset'   ? '⚪ Budget Not Set' :
               budgetStatus === 'danger'  ? '🔴 Over Budget'      :
               budgetStatus === 'warning' ? '🟡 Approaching Limit' : '🟢 On Track'} {monthlyBudget > 0 ? `· ${budgetUsedPercentage}%` : ''}
            </span>
            <button
              onClick={onOpenBudgetModal}
              className="text-[12px] font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] px-3 py-1 rounded-lg transition-all"
            >
              Adjust
            </button>
          </div>
        </div>

        {/* Progress bar row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <div className="flex justify-between items-center sm:hidden w-full mb-1">
            <span className="text-[12px] text-slate-500 font-medium shrink-0">
              Spent: <span className="font-mono font-bold text-white">{formatCurrency(totalExpenses, code, sym)}</span>
            </span>
            <span className="text-[12px] text-slate-500 font-medium shrink-0">
              Budget: <span className="font-mono font-bold text-indigo-300">{formatCurrency(monthlyBudget, code, sym)}</span>
            </span>
          </div>

          <span className="hidden sm:inline text-[12px] text-slate-500 font-medium shrink-0">
            Spent: <span className="font-mono font-bold text-white">{formatCurrency(totalExpenses, code, sym)}</span>
          </span>
          
          <div className="w-full sm:flex-1 h-2.5 bg-slate-800/70 rounded-full overflow-hidden border border-white/[0.04]">
            <div
              className={`h-full rounded-full progress-fill transition-all duration-700 ease-out ${
                budgetStatus === 'danger'  ? 'bg-gradient-to-r from-rose-600 to-red-500' :
                budgetStatus === 'warning' ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                                            'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${clamp}%` }}
            />
          </div>

          <span className="hidden sm:inline text-[12px] text-slate-500 font-medium shrink-0">
            Budget: <span className="font-mono font-bold text-indigo-300">{formatCurrency(monthlyBudget, code, sym)}</span>
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[12px] text-slate-500 font-medium">
            {remainingBudget >= 0 ? 'Remaining this month:' : 'Over budget by:'}
          </span>
          <span
            className={`amount font-bold text-[15px] ${remainingBudget >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
            style={{ letterSpacing: '-0.02em' }}
          >
            {formatCurrency(Math.abs(remainingBudget), code, sym)}
          </span>
        </div>
      </div>

      {/* ── Bottom Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Category Breakdown — 5/12 */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h3
                className="text-[14px] font-bold text-white"
                style={{ letterSpacing: '-0.02em' }}
              >
                Expense Categories
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Click a category to filter transactions
              </p>
            </div>
            {activeCategory && (
              <button
                onClick={() => setActiveCategory(null)}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-lg transition-colors"
              >
                Clear ×
              </button>
            )}
          </div>

          {categoryBreakdown.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-white/[0.06] flex items-center justify-center mb-3">
                <ArrowDownRight className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-[13px] font-semibold text-slate-400">No expenses yet</p>
              <p className="text-[11px] text-slate-600 mt-1">Add an expense to see breakdown</p>
            </div>
          ) : (
            <div className="space-y-1 flex-1">
              {categoryBreakdown.map((cat, i) => {
                const isActive = activeCategory?.toLowerCase() === cat.category.toLowerCase();
                return (
                  <div
                    key={cat.category}
                    onClick={() => setActiveCategory(isActive ? null : cat.category)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-500/10 border border-indigo-500/25'
                        : 'border border-transparent hover:bg-white/[0.035] hover:border-white/[0.07]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <CategoryIcon categoryName={cat.category} className="w-8 h-8" />
                        <span
                          className="text-[13px] font-semibold text-slate-200"
                          style={{ letterSpacing: '-0.01em' }}
                        >
                          {cat.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-mono">{cat.percentage}%</span>
                        <span
                          className="text-[13px] font-bold amount text-white"
                          style={{ letterSpacing: '-0.02em' }}
                        >
                          {formatCurrency(cat.amount, code, sym)}
                        </span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 bg-slate-800/80 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Transactions — 7/12 */}
        <div className="lg:col-span-7 glass-card rounded-2xl p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div className="flex items-center gap-2">
              <h3
                className="text-[14px] font-bold text-white"
                style={{ letterSpacing: '-0.02em' }}
              >
                {activeCategory ? `${activeCategory} Transactions` : 'Recent Transactions'}
              </h3>
              {activeCategory && (
                <span className="text-[10px] bg-indigo-500/15 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/25 tracking-wide">
                  Filtered
                </span>
              )}
            </div>
            <button
              onClick={() => onNavigateToTab('transactions')}
              className="flex items-center gap-1 text-[12px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors group"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {displayTx.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/50 border border-white/[0.06] flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-[13px] font-semibold text-slate-400">
                {activeCategory ? `No ${activeCategory} transactions` : 'No transactions yet'}
              </p>
              <p className="text-[11px] text-slate-600 mt-1">Add your first transaction to get started</p>
            </div>
          ) : (
            <div className="space-y-0.5 flex-1">
              {displayTx.map((tx, i) => {
                const isIncome = tx.type === 'income';
                return (
                  <div
                    key={tx.id}
                    className="group flex items-center justify-between px-2.5 py-2.5 rounded-xl hover:bg-white/[0.04] border border-transparent hover:border-white/[0.07] transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CategoryIcon categoryName={tx.category} className="w-9 h-9 shrink-0" />
                      <div className="min-w-0">
                        <p
                          className="text-[13px] font-semibold text-slate-200 truncate group-hover:text-white transition-colors"
                          style={{ letterSpacing: '-0.01em' }}
                        >
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-slate-500">{tx.category}</span>
                          <span className="text-slate-700 text-[10px]">·</span>
                          <span className="text-[11px] text-slate-500 font-mono">{formatDate(tx.date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`amount text-[13px] font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}
                        style={{ letterSpacing: '-0.02em' }}
                      >
                        {isIncome ? '+' : '−'}{formatCurrency(tx.amount, code, sym)}
                      </span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEditTransaction(tx); }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-200 hover:bg-white/[0.08] transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteTransaction(tx); }}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
