import React from 'react';
import { ArrowRight, Receipt, Edit3, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Transaction } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

interface RecentTransactionsProps {
  onViewAll: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (tx: Transaction) => void;
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  onViewAll,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const { user } = useAuth();
  const { transactions, activeMonthYear } = useFinance();

  const currencyCode = user?.currency || 'INR';
  const currencySymbol = user?.currencySymbol || '₹';

  // Filter transactions for current active month or all, grab 5 most recent
  const monthTransactions = transactions
    .filter((t) => t.date.startsWith(activeMonthYear))
    .slice(0, 5);

  const displayList = monthTransactions.length > 0 ? monthTransactions : transactions.slice(0, 5);

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-card hover:border-slate-700 transition-all">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Recent Transactions</h3>
            <p className="text-xs text-slate-400">Latest recorded income & expenses</p>
          </div>
        </div>

        <button
          onClick={onViewAll}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {displayList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Receipt className="w-10 h-10 text-slate-600 mb-2" />
          <p className="text-sm font-medium text-slate-400">No transactions recorded yet</p>
          <p className="text-xs text-slate-500 mt-0.5">Add an income or expense to get started.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {displayList.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <div
                key={tx.id}
                className="group flex items-center justify-between py-3.5 hover:bg-slate-800/30 px-2 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon categoryName={tx.category} size={18} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
                      {tx.description}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="font-medium text-slate-300">{tx.category}</span>
                      <span>•</span>
                      <span>{formatDate(tx.date)}</span>
                      {tx.paymentMethod && (
                        <>
                          <span>•</span>
                          <span className="hidden sm:inline text-slate-500">{tx.paymentMethod}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p
                      className={`text-xs sm:text-sm font-mono font-bold flex items-center justify-end gap-0.5 ${
                        isIncome ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-3.5 h-3.5 inline" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 inline" />
                      )}
                      <span>
                        {isIncome ? '+' : '-'}
                        {formatCurrency(tx.amount, currencyCode, currencySymbol)}
                      </span>
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">
                      {tx.type}
                    </p>
                  </div>

                  {/* Actions - visible on mobile, or on hover on desktop */}
                  <div className="flex items-center gap-1 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditTransaction(tx); }}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
                      title="Edit Transaction"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteTransaction(tx); }}
                      className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
  );
};
