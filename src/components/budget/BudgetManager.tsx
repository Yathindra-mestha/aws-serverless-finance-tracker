import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, PiggyBank, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

interface BudgetManagerProps {
  onClose: () => void;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({ onClose }) => {
  const { user } = useAuth();
  const { budget, updateFullBudget, deleteCategoryBudget } = useFinance();
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

  // Inputs for adding a new item (start completely blank - no prewritten values)
  const [categoryName, setCategoryName] = useState('');
  const [amountInput, setAmountInput] = useState('');

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
      // On AWS success, remove from local form state
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full sm:max-w-md bg-[#0a101f] border border-white/[0.08] rounded-t-3xl sm:rounded-2xl shadow-card-lg animate-scale-in flex flex-col max-h-[90vh] overflow-hidden">

        {/* Top Gradient Stripe */}
        <div className="h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <PiggyBank className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Monthly Budget</h2>
              <p className="text-[11px] text-slate-500 font-mono">DynamoDB · PK=USER#demo | SK=BUDGET#</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.07] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">



          {/* 2. ADD BUDGET ITEM FORM (COMES BELOW) */}
          <form onSubmit={handleAddOrUpdate} className="space-y-3.5 p-4 bg-white/[0.025] border border-white/[0.06] rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              + Add New Item
            </span>

            {/* Category / Name Input */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">
                Category or Item Name
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Enter category name..."
                className="w-full bg-slate-900/80 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none transition-all font-medium"
              />
            </div>

            {/* Amount Input */}
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-medium">
                Budget Limit ({sym})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">
                  {sym}
                </span>
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

            {/* Add Button */}
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
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
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

        {/* Footer */}
        <div className="p-5 border-t border-white/[0.06] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-indigo transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4" />
            Save Budget ({formatCurrency(totalCalculatedBudget, code, sym)})
          </button>
        </div>
      </div>
    </div>
  );
};
