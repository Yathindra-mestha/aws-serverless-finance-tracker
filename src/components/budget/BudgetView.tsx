import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Save, Sparkles, PiggyBank } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

/** Clean, user-driven Budget tab where items list comes first */
export const BudgetView: React.FC = () => {
  const { user } = useAuth();
  const { budget, updateFullBudget, summary, deleteCategoryBudget } = useFinance();
  const { showToast } = useToast();
  const sym = user?.currencySymbol ?? '₹';
  const code = user?.currency ?? 'INR';

  // Strictly filter only positive numbers
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, number>>(() => {
    const existing = budget?.categoryBudgets ?? {};
    const valid: Record<string, number> = {};
    for (const [k, v] of Object.entries(existing)) {
      if (typeof v === 'number' && v > 0 && !isNaN(v)) {
        valid[k] = v;
      }
    }
    return valid;
  });

  const [categoryName, setCategoryName] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [saved, setSaved] = useState(false);

  const { totalExpenses } = summary;

  const handleAddOrUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const name = categoryName.trim();
    const val = parseFloat(amountInput);

    if (!name) {
      showToast('warning', 'Missing Name', 'Please enter a category or item name (e.g. Rent).');
      return;
    }
    if (isNaN(val) || val <= 0) {
      showToast('warning', 'Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    setCategoryBudgets((prev) => ({
      ...prev,
      [name]: val,
    }));

    setCategoryName('');
    setAmountInput('');
  };

  const handleRemove = async (name: string) => {
    try {
      await deleteCategoryBudget(name);
      // On AWS success, also remove from the local form state
      setCategoryBudgets((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    } catch {
      // Error toast already shown by deleteCategoryBudget in context
    }
  };

  const validItems = Object.entries(categoryBudgets).filter(
    ([, val]) => typeof val === 'number' && val > 0 && !isNaN(val)
  );
  const totalCalculatedBudget = validItems.reduce((acc, [, val]) => acc + val, 0);

  const handleSave = async () => {
    const cleanBudgets: Record<string, number> = {};
    for (const [k, v] of validItems) {
      cleanBudgets[k] = v;
    }

    await updateFullBudget(totalCalculatedBudget, cleanBudgets);
    showToast('success', 'Budget Saved', `Monthly budget set to ${formatCurrency(totalCalculatedBudget, code, sym)}.`);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const usedPercent = totalCalculatedBudget > 0 ? Math.min(Math.round((totalExpenses / totalCalculatedBudget) * 100), 100) : 0;
  const remaining = totalCalculatedBudget - totalExpenses;

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl mx-auto">

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Monthly Budget Planner</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">DynamoDB · PK=USER#demo | SK=BUDGET#</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97] w-full sm:w-auto ${
            saved ? 'bg-emerald-600 shadow-emerald' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo'
          }`}
        >
          {saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved to Cloud!' : 'Save Budget'}
        </button>
      </div>

      {/* Summary KPI Box */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Budget</p>
            <p className="text-base font-extrabold font-mono text-white">{formatCurrency(totalCalculatedBudget, code, sym)}</p>
          </div>
          <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3.5 text-center">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Spent</p>
            <p className="text-base font-extrabold font-mono text-rose-400">{formatCurrency(totalExpenses, code, sym)}</p>
          </div>
          <div className={`rounded-xl p-3.5 text-center border ${totalCalculatedBudget === 0 ? 'bg-white/[0.02] border-white/[0.06]' : remaining >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">{remaining >= 0 ? 'Remaining' : 'Over by'}</p>
            <p className={`text-base font-extrabold font-mono ${totalCalculatedBudget === 0 ? 'text-slate-400' : remaining >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(Math.abs(remaining), code, sym)}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {totalCalculatedBudget > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Budget Consumption</span>
              <span className={`font-bold ${remaining < 0 ? 'text-rose-400' : usedPercent >= 80 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {usedPercent}% used
              </span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  remaining < 0 ? 'bg-gradient-to-r from-rose-600 to-red-500' :
                  usedPercent >= 80 ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                                      'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Budget Container */}
      <div className="glass-card rounded-2xl p-5 space-y-5">



        {/* 2. ADD ITEM FORM (COMES BELOW) */}
        <form onSubmit={handleAddOrUpdate} className="space-y-3.5 p-4 bg-white/[0.025] border border-white/[0.06] rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            + Add New Item
          </span>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium">
              Category or Item Name
            </label>
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Enter category name..."
              className="w-full bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-medium">
              Budget Limit ({sym})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">{sym}</span>
              <input
                type="number"
                step="any"
                min="0"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="0"
                className="w-full bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl pl-9 pr-4 py-2.5 text-base font-mono font-bold text-white placeholder-slate-600 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 rounded-xl shadow-indigo transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            Add to Budget
          </button>
        </form>

        {/* 3. ADDED BUDGET ITEMS (COMES BELOW FORM) */}
        {validItems.length > 0 && (
          <div className="space-y-2">
            {validItems.map(([name, limit]) => (
              <div
                key={name}
                className="flex items-center justify-between p-3.5 bg-white/[0.025] border border-white/[0.06] rounded-xl hover:border-white/[0.12] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CategoryIcon categoryName={name} className="w-8 h-8 shrink-0" />
                  <span className="text-[13px] font-semibold text-slate-200 truncate">{name}</span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono font-bold text-sm text-white">
                    {formatCurrency(limit, code, sym)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(name)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
