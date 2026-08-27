import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Calendar, AlertCircle, Edit3 } from 'lucide-react';
import { RecurringTransaction } from '../../types';
import { getRecurringTransactions, addRecurringTransaction, deleteRecurringTransaction, updateRecurringTransaction } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { AddRecurringModal } from './AddRecurringModal';
import { EditRecurringModal } from './EditRecurringModal';
import { formatCurrency } from '../../utils/formatters';

export const RecurringView: React.FC = () => {
  const { user } = useAuth();
  const [recurringTxs, setRecurringTxs] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringTransaction | null>(null);
  
  const sym = user?.currencySymbol ?? '₹';
  const code = user?.currency ?? 'INR';

  const fetchRecurring = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRecurringTransactions();
      setRecurringTxs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load recurring transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurring();
  }, []);

  const handleAdd = async (data: any) => {
    await addRecurringTransaction(data);
    await fetchRecurring();
  };

  const handleEdit = async (recurringId: string, data: Record<string, any>) => {
    await updateRecurringTransaction(recurringId, data);
    await fetchRecurring();
  };

  const handleDelete = async (recurringId: string) => {
    try {
      await deleteRecurringTransaction(recurringId);
      await fetchRecurring();
    } catch (err: any) {
      setError(err.message || 'Failed to delete recurring transaction');
    }
  };

  return (
    <div className="space-y-4 animate-fade-up">
      <div className="glass-card rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-[22px] font-extrabold text-white" style={{ letterSpacing: '-0.03em' }}>
              Recurring Transactions
            </h2>
            <p className="text-[12px] text-slate-500 font-mono mt-0.5">
              Automated monthly rules
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2.5} /> New Rule
          </button>
        </div>

        <div className="bg-white/[0.02] border border-indigo-500/10 rounded-xl p-4 mb-6 flex items-start gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <RefreshCw className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-slate-200">How it works</p>
            <p className="text-[12px] text-slate-400 mt-1">
              For example, create a {sym}15,000 monthly Rent rule and FinTrack will automatically create the transaction when it is due.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="text-[13px] text-rose-400 font-medium">
              {error}
            </div>
          </div>
        )}

        {/* List */}
        <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.04]">
          {isLoading ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin mx-auto mb-4" />
              <p className="text-[14px] font-bold text-slate-300">Loading rules...</p>
            </div>
          ) : recurringTxs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/50 border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-[14px] font-bold text-slate-300">No recurring transactions yet.</p>
              <p className="text-[12px] text-slate-600 mt-1">Click New Rule to set one up.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {recurringTxs.map(tx => (
                <div key={tx.recurringId} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div>
                    <p className="text-[14px] font-bold text-slate-200">{tx.description || tx.category}</p>
                    <p className="text-[12px] text-slate-500">
                      Monthly on the {tx.dayOfMonth} • Starts {tx.startDate}
                      {!tx.active && <span className="ml-2 text-amber-400 font-bold">⏸ Paused</span>}
                    </p>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <div>
                      <p className={`text-[14px] font-bold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {tx.type === 'income' ? '+' : '−'}
                        {formatCurrency(tx.amount, code, sym)}
                      </p>
                      <p className="text-[11px] text-slate-500 uppercase tracking-wider">{tx.type}</p>
                    </div>
                    <button
                      onClick={() => setEditingRule(tx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                      title="Edit Rule"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(tx.recurringId)}
                      className="text-[11px] font-bold text-slate-500 hover:text-rose-400 px-2 py-1 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isAddModalOpen && (
        <AddRecurringModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAdd}
          currencyCode={code}
          currencySymbol={sym}
        />
      )}

      {editingRule && (
        <EditRecurringModal
          rule={editingRule}
          onClose={() => setEditingRule(null)}
          onSave={handleEdit}
          currencyCode={code}
          currencySymbol={sym}
        />
      )}
    </div>
  );
};