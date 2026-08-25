import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { Transaction, TransactionType } from '../../types';

import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { getTodayDateString } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: TransactionType;
  editingTransaction?: Transaction | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen, onClose, initialType = 'expense', editingTransaction = null,
}) => {
  const { user } = useAuth();
  const { addTransaction, updateTransaction, budget } = useFinance();
  const sym = user?.currencySymbol || '₹';

  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamically calculate available categories based on budget limits (for expenses) or past transactions (for income)
  const availableCategories = React.useMemo(() => {
    if (type === 'income') {
      // Find unique income categories used previously
      // If there are none, we just return empty array and user has to type it
      return []; // Return empty for now so we completely remove predefined categories, the user can just type it in!
    }
    
    // For expenses, ONLY show categories that the user has added to their budget
    const budgetCats = Object.keys(budget?.categoryBudgets || {});
    return budgetCats.map(catName => ({
      id: catName.toLowerCase(),
      name: catName,
      type: 'expense' as const,
    }));
  }, [type, budget]);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setDate(editingTransaction.date);
    } else {
      setType(initialType);
      setAmount('');
      setCategory(initialType === 'income' ? 'Salary' : (availableCategories[0]?.name || ''));
      setDescription('');
      setDate(getTodayDateString());
    }
    setErrors({});
  }, [editingTransaction, initialType, isOpen, availableCategories]);

  const validate = () => {
    const errs: Record<string, string> = {};
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) errs.amount = 'Enter a valid amount';
    if (!description.trim()) errs.description = 'Enter a short description';
    if (!category) errs.category = 'Select a category';
    if (!date) errs.date = 'Select a date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const numAmount = parseFloat(amount);
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, { type, amount: numAmount, category, description: description.trim(), date });
      } else {
        await addTransaction({ userId: user?.id || 'usr_demo', type, amount: numAmount, category, description: description.trim(), date, paymentMethod: 'Manual Entry', tags: [category, type] });
      }
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isIncome = type === 'income';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(10px)' }}
    >
      <div className="w-full sm:max-w-[440px] bg-[#0b1120] border border-white/[0.08] rounded-t-3xl sm:rounded-2xl shadow-card-lg animate-scale-in flex flex-col max-h-[92vh] overflow-hidden">

        {/* Stripe */}
        <div className={`h-[2px] ${isIncome ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-600 to-pink-500'}`} />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isIncome ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
              {isIncome
                ? <Plus className="w-4 h-4 text-emerald-400" strokeWidth={2.5} />
                : <Minus className="w-4 h-4 text-rose-400" strokeWidth={2.5} />}
            </div>
            <div>
              <h2
                className="text-[16px] font-extrabold text-white"
                style={{ letterSpacing: '-0.025em' }}
              >
                {editingTransaction ? 'Edit Transaction' : isIncome ? 'Record Income' : 'Log Expense'}
              </h2>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Lambda {editingTransaction ? 'PUT' : 'POST'} /transactions
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.07] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Type toggle */}
          <div className="flex gap-1.5 bg-white/[0.04] border border-white/[0.06] rounded-[14px] p-1">
            <button
              type="button"
              onClick={() => { setType('expense'); if (category === 'Salary') setCategory('Food'); }}
              className={`flex-1 py-2 rounded-xl text-[13px] font-bold transition-all ${
                type === 'expense' ? 'bg-rose-600 text-white shadow-rose' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              − Expense
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); if (category === 'Food') setCategory('Salary'); }}
              className={`flex-1 py-2 rounded-xl text-[13px] font-bold transition-all ${
                type === 'income' ? 'bg-emerald-600 text-white shadow-emerald' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              + Income
            </button>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.07em]">
              Amount <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {sym}
              </span>
              <input
                type="number" step="any" min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                autoFocus
                className={`w-full bg-slate-900/60 border rounded-xl pl-10 pr-4 py-3.5 text-[28px] font-extrabold text-white outline-none transition-all ${
                  errors.amount
                    ? 'border-rose-500 focus:border-rose-400'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15'
                }`}
                style={{ fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em' }}
              />
            </div>
            {errors.amount && <p className="text-[11px] text-rose-400 font-medium">{errors.amount}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.07em]">
              Description <span className="text-rose-400">*</span>
            </label>
            <input
              type="text" value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isIncome ? 'e.g. Monthly salary, Freelance payment' : 'e.g. Groceries, EMI, Dinner'}
              className={`w-full bg-slate-900/60 border rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-slate-600 outline-none transition-all ${
                errors.description ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15'
              }`}
              style={{ letterSpacing: '-0.01em' }}
            />
            {errors.description && <p className="text-[11px] text-rose-400 font-medium">{errors.description}</p>}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.07em]">
              Category <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Salary, Rent, Food"
              className={`w-full bg-slate-900/60 border rounded-xl px-4 py-2.5 text-[14px] text-white placeholder-slate-600 outline-none transition-all ${
                errors.category ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15'
              }`}
              style={{ letterSpacing: '-0.01em' }}
            />
            {errors.category && <p className="text-[11px] text-rose-400 font-medium">{errors.category}</p>}
            
            {/* Quick Suggestions */}
            {availableCategories.length > 0 && (
              <div className="pt-2">
                <p className="text-[10px] font-semibold text-slate-500 mb-2 uppercase tracking-[0.05em]">
                  {type === 'expense' ? 'Budget Categories' : 'Recent Categories'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableCategories.map((cat) => {
                    const selected = category.toLowerCase() === cat.name.toLowerCase();
                    return (
                      <button
                        key={cat.name} type="button" onClick={() => setCategory(cat.name)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all duration-150 ${
                          selected
                            ? 'border-indigo-500/50 bg-indigo-500/12 text-white'
                            : 'border-white/[0.06] bg-white/[0.02] text-slate-400 hover:bg-white/[0.05] hover:border-white/[0.12] hover:text-slate-200'
                        }`}
                      >
                        <CategoryIcon categoryName={cat.name} className="w-4 h-4 flex-shrink-0" />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.07em]">Date</label>
            <input
              type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 rounded-xl px-4 py-2.5 text-[14px] text-white outline-none transition-all"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
          <button
            type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[14px] font-semibold text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e as any)}
            disabled={isSubmitting}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60 ${
              isIncome
                ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose'
            }`}
            style={{ letterSpacing: '-0.01em' }}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Saving to DynamoDB…' : editingTransaction ? 'Save Changes' : 'Save Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
};
