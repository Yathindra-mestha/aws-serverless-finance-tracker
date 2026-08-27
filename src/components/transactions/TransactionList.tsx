import React, { useState, useMemo } from 'react';
import { Search, Plus, Minus, Edit3, Trash2, FileSpreadsheet, Filter, X, ChevronDown, ChevronUp, DollarSign, Calendar } from 'lucide-react';
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

  // ── Filter state ──────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState<'all' | 'income' | 'expense'>('all');
  const [month, setMonth] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const sym = user?.currencySymbol ?? '₹';
  const code = user?.currency ?? 'INR';

  const availableMonths = useMemo(
    () => Array.from(new Set(transactions.map(t => t.date.substring(0, 7)))).sort().reverse(),
    [transactions]
  );

  const uniqueCategories = useMemo(
    () => Array.from(new Set(transactions.map(t => t.category))).sort(),
    [transactions]
  );

  // ── Filtering logic ───────────────────────────────────────
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // Search filter: description + category (case-insensitive)
      if (search.trim()) {
        const q = search.toLowerCase();
        if (
          !t.description.toLowerCase().includes(q) &&
          !t.category.toLowerCase().includes(q)
        ) return false;
      }

      // Type filter
      if (type !== 'all' && t.type !== type) return false;

      // Category filter
      if (category !== 'all' && t.category.toLowerCase() !== category.toLowerCase()) return false;

      // Month filter
      if (month !== 'all' && !t.date.startsWith(month)) return false;

      // Custom date range: From
      if (dateFrom && t.date < dateFrom) return false;

      // Custom date range: To
      if (dateTo && t.date > dateTo) return false;

      // Amount range: Min
      if (amountMin !== '') {
        const min = parseFloat(amountMin);
        if (!isNaN(min) && t.amount < min) return false;
      }

      // Amount range: Max
      if (amountMax !== '') {
        const max = parseFloat(amountMax);
        if (!isNaN(max) && t.amount > max) return false;
      }

      return true;
    });
  }, [transactions, search, type, category, month, dateFrom, dateTo, amountMin, amountMax]);

  // ── Is any filter active? ─────────────────────────────────
  const isFiltered =
    search !== '' ||
    category !== 'all' ||
    type !== 'all' ||
    month !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '' ||
    amountMin !== '' ||
    amountMax !== '';

  const activeFilterCount = [
    search !== '',
    category !== 'all',
    type !== 'all',
    month !== 'all',
    dateFrom !== '' || dateTo !== '',
    amountMin !== '' || amountMax !== '',
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setSearch('');
    setCategory('all');
    setType('all');
    setMonth('all');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
  };

  // ── Summaries ─────────────────────────────────────────────
  const totIncome  = filtered.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
  const totExpense = filtered.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);

  // ── CSV Export ─────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!filtered.length) {
      alert("No transactions to export.");
      return;
    }

    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description'];
    const rows = filtered.map(t => {
      const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
      return [
        t.date,
        t.type.toUpperCase(),
        escapeCsv(t.category),
        t.amount,
        escapeCsv(t.description)
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `fintrack-transactions-${yearMonth}.csv`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  // ── Shared input classes ──────────────────────────────────
  const inputCls = "bg-white/[0.03] border border-white/[0.07] focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/15 rounded-xl text-[13px] text-slate-200 placeholder-slate-600 outline-none transition-all";

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
              className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.07] text-slate-300 border border-white/[0.07] px-3 py-1.5 rounded-xl text-[12px] font-semibold transition-colors"
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

        {/* ── Primary filter bar ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by description or category…"
              className={`w-full pl-10 pr-9 py-2.5 ${inputCls}`}
              style={{ letterSpacing: '-0.01em' }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
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
              {uniqueCategories.map((catName) => (
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

            {/* Advanced filters toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl text-[12px] font-bold transition-all border ${
                showAdvanced || dateFrom || dateTo || amountMin || amountMax
                  ? 'bg-indigo-600/15 text-indigo-300 border-indigo-500/30'
                  : 'bg-white/[0.04] text-slate-400 border-white/[0.07] hover:text-slate-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              More
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {(dateFrom || dateTo || amountMin || amountMax) && !showAdvanced && (
                <span className="ml-0.5 w-4 h-4 flex items-center justify-center bg-indigo-500 text-white text-[10px] font-bold rounded-full">
                  {[dateFrom || dateTo ? 1 : 0, amountMin || amountMax ? 1 : 0].reduce((a,b) => a+b, 0)}
                </span>
              )}
            </button>

            {/* Clear Filters */}
            {isFiltered && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 text-rose-400 hover:text-rose-300 text-[12px] font-bold px-2 py-2 transition-colors whitespace-nowrap"
                title="Clear All Filters"
              >
                <X className="w-3 h-3" />
                Clear{activeFilterCount > 1 ? ` (${activeFilterCount})` : ''}
              </button>
            )}
          </div>
        </div>

        {/* ── Advanced filters (collapsible) ────────────────── */}
        {showAdvanced && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-up">
            {/* Date Range */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.07em]">
                <Calendar className="w-3 h-3 text-indigo-400" />
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`flex-1 px-3 py-2 ${inputCls} [color-scheme:dark]`}
                  placeholder="From"
                />
                <span className="text-slate-600 text-[11px]">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`flex-1 px-3 py-2 ${inputCls} [color-scheme:dark]`}
                  placeholder="To"
                />
              </div>
            </div>

            {/* Amount Range */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-[0.07em]">
                <DollarSign className="w-3 h-3 text-indigo-400" />
                Amount Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  className={`flex-1 px-3 py-2 ${inputCls}`}
                  placeholder="Min"
                  min="0"
                  step="any"
                />
                <span className="text-slate-600 text-[11px]">to</span>
                <input
                  type="number"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  className={`flex-1 px-3 py-2 ${inputCls}`}
                  placeholder="Max"
                  min="0"
                  step="any"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Results status bar ────────────────────────────────── */}
      {isFiltered && (
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-indigo-500/8 border border-indigo-500/15 text-[12px]">
          <span className="text-slate-400">
            <span className="text-white font-bold">{filtered.length}</span>
            {filtered.length === 1 ? ' transaction found' : ' transactions found'}
            {filtered.length === 0 && (
              <span className="text-slate-500 ml-1">— try adjusting your filters</span>
            )}
          </span>
          <button
            onClick={handleClearFilters}
            className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

      {/* ── List ───────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <Filter className="w-6 h-6 text-slate-600" />
            </div>
            <p className="text-[14px] font-bold text-slate-300">
              {isFiltered ? 'No transactions match your filters.' : 'No transactions found'}
            </p>
            <p className="text-[12px] text-slate-600 mt-1">
              {isFiltered
                ? 'Try broadening your search or clearing filters.'
                : 'Add your first income or expense to get started.'}
            </p>
            {isFiltered && (
              <button
                onClick={handleClearFilters}
                className="mt-3 inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-[12px] font-bold transition-colors"
              >
                <X className="w-3 h-3" /> Clear All Filters
              </button>
            )}
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
                    <div className="flex items-center gap-1 transition-opacity">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.08] transition-colors"
                        title="Edit Transaction"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Transaction"
                      >
                        <Trash2 className="w-4 h-4" />
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
