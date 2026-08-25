import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Transaction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen, onClose, transaction,
}) => {
  const { user } = useAuth();
  const { deleteTransaction } = useFinance();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !transaction) return null;

  const code = user?.currency || 'INR';
  const sym = user?.currencySymbol || '₹';

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTransaction(transaction.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm bg-[#0a101f] border border-white/[0.08] rounded-2xl shadow-card-lg animate-scale-in overflow-hidden">
        <div className="h-[2px] bg-gradient-to-r from-rose-600 to-pink-500" />

        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <Trash2 className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">Delete Transaction</h2>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">Lambda DELETE /transactions/{transaction.id.slice(0,8)}…</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:text-white hover:bg-white/[0.07] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/8 border border-rose-500/20">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="text-xs text-rose-300 leading-relaxed">
              This will permanently remove this transaction from DynamoDB and recalculate your balance.
            </p>
          </div>

          <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5 space-y-2 text-xs">
            {[
              ['Description', transaction.description],
              ['Category', transaction.category],
              ['Date', formatDate(transaction.date)],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-200">{val}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-white/[0.07] pt-2">
              <span className="text-slate-500">Amount</span>
              <span className={`font-mono font-bold ${transaction.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, code, sym)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-rose transition-all active:scale-[0.98] disabled:opacity-60"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};
