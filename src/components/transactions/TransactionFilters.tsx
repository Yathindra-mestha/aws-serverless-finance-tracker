import React from 'react';
import { Search, Filter, X, ArrowUpDown, Calendar } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';


export const TransactionFilters: React.FC = () => {
  const { filters, setFilters, resetFilters, filteredTransactions, transactions } = useFinance();

  const uniqueCategories = React.useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => cats.add(t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, search: e.target.value }));
  };

  const handleTypeChange = (type: 'all' | 'income' | 'expense') => {
    setFilters((prev) => ({ ...prev, type }));
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({ ...prev, category: e.target.value }));
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: e.target.value as any,
    }));
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: e.target.value as any,
    }));
  };

  const isFiltered =
    filters.search !== '' ||
    filters.type !== 'all' ||
    filters.category !== 'all' ||
    filters.dateRange !== 'all' ||
    filters.sortBy !== 'date-desc';

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-card space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder="Search transactions by title, note, or tag..."
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type Toggle Pills */}
        <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs">
          <button
            onClick={() => handleTypeChange('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filters.type === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Types
          </button>
          <button
            onClick={() => handleTypeChange('income')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filters.type === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Income
          </button>
          <button
            onClick={() => handleTypeChange('expense')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              filters.type === 'expense'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Expenses
          </button>
        </div>
      </div>

      {/* Secondary Row: Category Filter, Date Range, Sort, Results count */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-slate-300">
            <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={filters.category}
              onChange={handleCategoryChange}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900">
                All Categories
              </option>
              {uniqueCategories.map((catName) => (
                <option key={catName} value={catName} className="bg-slate-900">
                  {catName}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={filters.dateRange}
              onChange={handleDateRangeChange}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900">
                All Time
              </option>
              <option value="this-month" className="bg-slate-900">
                This Month Only
              </option>
              <option value="last-month" className="bg-slate-900">
                Last Month
              </option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <select
              value={filters.sortBy}
              onChange={handleSortChange}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="date-desc" className="bg-slate-900">
                Newest Date First
              </option>
              <option value="date-asc" className="bg-slate-900">
                Oldest Date First
              </option>
              <option value="amount-desc" className="bg-slate-900">
                Highest Amount First
              </option>
              <option value="amount-asc" className="bg-slate-900">
                Lowest Amount First
              </option>
            </select>
          </div>

          {/* Reset Filters button */}
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="text-slate-400 font-mono text-[11px]">
          Showing <span className="text-white font-bold">{filteredTransactions.length}</span> records
        </div>
      </div>
    </div>
  );
};
