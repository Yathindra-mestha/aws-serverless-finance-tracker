import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Flame,
  Award,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatPercentage, formatMonth, formatDate } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

export const ReportsView: React.FC = () => {
  const { user } = useAuth();
  const { summary, transactions, activeMonthYear } = useFinance();

  const currencyCode = user?.currency || 'INR';
  const currencySymbol = user?.currencySymbol || '₹';

  // Current month transactions
  const monthTransactions = transactions.filter((t) => t.date.startsWith(activeMonthYear));
  const monthExpenses = monthTransactions.filter((t) => t.type === 'expense');

  // Top 5 largest expenses this month
  const topExpenses = [...monthExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

  // Daily average calculation for active month
  const daysInMonth = 30; // standard approx
  const avgDailySpend = summary.totalExpenses > 0 ? summary.totalExpenses / daysInMonth : 0;
  const avgDailyIncome = summary.totalIncome > 0 ? summary.totalIncome / daysInMonth : 0;

  // JSON Export Handler
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(transactions, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `FinTrack_Ledger_Export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method', 'Notes'];
    const rows = transactions.map((t) => [
      t.id,
      t.date,
      t.type.toUpperCase(),
      `"${t.category}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amount,
      `"${t.paymentMethod || 'N/A'}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinTrack_All_Transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Financial Summary & Analytics
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              {formatMonth(activeMonthYear)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Detailed performance breakdown, burn rates, savings velocity, and ledger exports.
          </p>
        </div>

        {/* Export Data buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Metrics Row: Savings Rate, Daily Burn Rate, Net Savings */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Net Savings Rate
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white font-mono mt-2">
            {formatPercentage(summary.savingsRate)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Saved {formatCurrency(summary.currentBalance, currencyCode, currencySymbol)} from income
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Daily Average Burn
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white font-mono mt-2">
            {formatCurrency(avgDailySpend, currencyCode, currencySymbol)}
            <span className="text-xs font-normal text-slate-400">/day</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Avg. daily income: {formatCurrency(avgDailyIncome, currencyCode, currencySymbol)}/day
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Budget Efficiency
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white font-mono mt-2">
            {formatPercentage(100 - summary.budgetUsedPercentage)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Unused budget cushion remaining
          </p>
        </div>
      </div>

      {/* Top 5 Spending Drivers & Category Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Expense Transactions */}
        <div className="lg:col-span-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-card">
          <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800 flex items-center justify-between">
            <span>Largest Expenses ({formatMonth(activeMonthYear)})</span>
            <span className="text-xs text-slate-400 font-normal">Ranked by amount</span>
          </h3>

          {topExpenses.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No expenses recorded for this month.</p>
          ) : (
            <div className="divide-y divide-slate-800/60 mt-2">
              {topExpenses.map((tx, idx) => (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <CategoryIcon categoryName={tx.category} size={14} className="p-1 rounded-md" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200 truncate">{tx.description}</p>
                      <p className="text-[10px] text-slate-400">{formatDate(tx.date)}</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-xs text-rose-400">
                    -{formatCurrency(tx.amount, currencyCode, currencySymbol)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 6-Month Historical Summary Table */}
        <div className="lg:col-span-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-card">
          <h3 className="text-sm font-bold text-white pb-3 border-b border-slate-800 flex items-center justify-between">
            <span>Historical 6-Month Ledger</span>
            <span className="text-xs text-slate-400 font-normal">Income vs Expenses</span>
          </h3>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="pb-2">Month</th>
                  <th className="pb-2 text-right">Income</th>
                  <th className="pb-2 text-right">Expenses</th>
                  <th className="pb-2 text-right">Net Savings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {summary.monthlyTrends.map((trend) => (
                  <tr key={trend.rawMonth} className="hover:bg-slate-800/30">
                    <td className="py-2.5 font-sans font-medium text-slate-300">{trend.month}</td>
                    <td className="py-2.5 text-right text-emerald-400">
                      +{formatCurrency(trend.income, currencyCode, currencySymbol)}
                    </td>
                    <td className="py-2.5 text-right text-rose-400">
                      -{formatCurrency(trend.expenses, currencyCode, currencySymbol)}
                    </td>
                    <td
                      className={`py-2.5 text-right font-bold ${
                        trend.savings >= 0 ? 'text-indigo-300' : 'text-rose-400'
                      }`}
                    >
                      {formatCurrency(trend.savings, currencyCode, currencySymbol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
