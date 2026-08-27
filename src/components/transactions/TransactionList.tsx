import React, { useState } from 'react';
import { Search, Plus, Minus, Edit3, Trash2, FileSpreadsheet, Filter } from 'lucide-react';
import { Transaction } from '../../types';

import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

interface TransactionListProps {
  onOpenAddModal: (type: 'income' | 'expense') => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  onOpenAddModal, onEditTransaction, onDeleteTransaction,
}) => {
  const { user } = useAuth();
  const { transactions } = useFinance();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all');
  const [month, setMonth] = useState('all');
  const sym = user?.currencySymbol ?? '₹';
  const code = user?.currency ?? 'INR';

  const availableMonths = Array.from(new Set(transactions.map(t => t.date.substring(0, 7)))).sort().reverse();

  const filtered = transactions.filter((t) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!t.description.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) return false;
    }
    if (category !== 'all' && t.category.toLowerCase() !== category.toLowerCase()) return false;
    if (type !== 'all' && t.type !== type) return false;
    if (month !== 'all' && !t.date.startsWith(month)) return false;
    return true;
  });

  const handleClearFilters = () => {
    setSearch('');
    setCategory('all');
    setType('all');
    setMonth('all');
  };

  const totIncome  = filtered.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
  const totExpense = filtered.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const rows = filtered.map((t) => [t.date, t.type.toUpperCase(), `"${t.category}"`, `"${t.description.replace(/"/g,'""')}"`, t.amount].join(','));
    const csv = 'data:text/csv;charset=utf-8,' + encodeURIComponent(['Date,Type,Category,Description,Amount', ...rows].join('\n'));
    const a = document.createElement('a');
    a.href = csv;
    a.download = `FinTrack_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4 animate-fade-up">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div>
            <h2
              className="text-[22px] font-extrabold text-white"
              style={{ letterSpacing: '-0.03em' }}
            >
              Transaction History
            </h2>
            <p className="text-[12px] text-slate-500 font-mono mt-0.5">
              <span className="text-indigo-400 font-bold">{filtered.length}</span> records · Lambda → DynamoDB Query
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenAddModal('income')}
              className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/18 text-emerald-300 border border-emerald-500/25 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all hover:shadow-emerald"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> Add Income
            </button>
            <button
              onClick={() => onOpenAddModal('expense')}
              className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/18 text-rose-300 border border-rose-500/25 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all hover:shadow-rose"
            >
              <Minus className="w-3.5 h-3.5" strokeWidth={2.5} /> Add Expense
            </button>
            <button
              onClick={handleExportCSV}
              disabled={!filtered.length}
              className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.07] text-slate-300 border border-white/[0.07] px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors disabled:opacity-40"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
            </button>
          </div>
        </div>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Showing', val: filtered.length.toString(), cls: 'text-white' },
            { label: 'Total In', val: `+${formatCurrency(totIncome, code, sym)}`, cls: 'text-emerald-400' },
            { label: 'Total Out', val: `−${formatCurrency(totExpense, code, sym)}`, cls: 'text-rose-400' },
          ].map(({ label, val, cls }) => (
            <div key={label} className="bg-white/[0.025] border border-white/[0.06] rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.07em] mb-1">{label}</p>
              <p className={`text-[13px] font-extrabold amount ${cls}`} style={{ letterSpacing: '-0.02em' }}>{val}</p>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by description or category…"
              className="w-full bg-white/[0.03] border border-white/[0.07] focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-slate-200 placeholder-slate-600 outline-none transition-all"
              style={{ letterSpacing: '-0.01em' }}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Type toggle */}
            <div className="flex items-center gap-0.5 bg-white/[0.04] border border-white/[0.07] rounded-xl p-1">
              {(['all','income','expense'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-3 py-1 rounded-[10px] text-[12px] font-bold transition-all ${
                    type === t
                      ? t === 'income'  ? 'bg-emerald-600 text-white'
                        : t === 'expense' ? 'bg-rose-600 text-white'
                        : 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'income' ? '+ In' : '− Out'}
                </button>
              ))}
            </div>

            {/* Category select */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.07] text-slate-300 text-[12px] rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="all" className="bg-[#0b1120]">All Categories</option>
              {Array.from(new Set(transactions.map(t => t.category))).sort().map((catName) => (
                <option key={catName} value={catName} className="bg-[#0b1120]">{catName}</option>
              ))}
            </select>

            {/* Month select */}
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.07] text-slate-300 text-[12px] rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="all" className="bg-[#0b1120]">All Months</option>
              {availableMonths.map((m) => {
                const dateObj = new Date(`${m}-01T00:00:00`);
                const monthName = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
                return <option key={m} value={m} className="bg-[#0b1120]">{monthName}</option>;
              })}
            </select>

            {/* Clear Filters */}
            {(search || category !== 'all' || type !== 'all' || month !== 'all') && (
              <button
                onClick={handleClearFilters}
                className="text-slate-400 hover:text-rose-400 text-[12px] font-bold px-2 py-2 transition-colors whitespace-nowrap"
                title="Clear Filters"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── List ───────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <Filter className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-[14px] font-bold text-slate-300">No transactions found</p>
            <p className="text-[12px] text-slate-600 mt-1">Adjust your search or filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  className="group flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.025] transition-colors"
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
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border tracking-wide ${
                            isIncome
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}
                        >
                          {isIncome ? '↑ Income' : '↓ Expense'}
                        </span>
                        <span className="text-[11px] text-slate-500">{tx.category}</span>
                        <span className="text-slate-700 text-[10px]">·</span>
                        <span className="text-[11px] text-slate-500 font-mono">{formatDate(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`amount text-[14px] font-bold ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {isIncome ? '+' : '−'}{formatCurrency(tx.amount, code, sym)}
                    </span>
                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-200 hover:bg-white/[0.08] transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(tx)}
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
  );
};
