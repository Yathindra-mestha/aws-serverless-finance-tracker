import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';

export const CategoryPieChart: React.FC = () => {
  const { user } = useAuth();
  const { summary } = useFinance();

  const currencyCode = user?.currency || 'INR';
  const currencySymbol = user?.currencySymbol || '₹';

  const categoryData = summary.categoryBreakdown;
  const hasExpenses = categoryData.length > 0 && summary.totalExpenses > 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-xl bg-slate-900/95 border border-slate-700 p-3 shadow-2xl backdrop-blur-md text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
            <span>{data.category}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-4 font-mono">
            <span className="text-slate-400">Total Spent:</span>
            <span className="font-bold text-white">{formatCurrency(data.amount, currencyCode, currencySymbol)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 font-mono text-indigo-300">
            <span>Share of Expenses:</span>
            <span className="font-bold">{formatPercentage(data.percentage)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-card hover:border-slate-700 transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Expense Categories</h3>
          <p className="text-xs text-slate-400 mt-0.5">Where your money went this month</p>
        </div>
        <div className="p-2 rounded-xl bg-slate-800 text-slate-400 border border-slate-700">
          <PieIcon className="w-4 h-4" />
        </div>
      </div>

      {!hasExpenses ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-500 text-xs text-center p-4">
          <p className="font-medium">No expenses logged for this period yet.</p>
          <p className="mt-1 text-slate-600">Add an expense transaction to see the breakdown.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mt-2">
          {/* Donut Chart */}
          <div className="md:col-span-6 h-52 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={categoryData}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  stroke="#0f172a"
                  strokeWidth={2}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Total</span>
              <span className="text-sm font-bold font-mono text-white">
                {formatCurrency(summary.totalExpenses, currencyCode, currencySymbol)}
              </span>
            </div>
          </div>

          {/* Category Legend List */}
          <div className="md:col-span-6 space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
            {categoryData.map((cat) => (
              <div
                key={cat.category}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <CategoryIcon categoryName={cat.category} size={14} className="p-1 rounded-md" />
                  <span className="font-medium text-slate-300 truncate">{cat.category}</span>
                </div>
                <div className="flex items-center gap-2 font-mono shrink-0">
                  <span className="text-slate-400">{formatPercentage(cat.percentage)}</span>
                  <span className="font-bold text-slate-200">
                    {formatCurrency(cat.amount, currencyCode, currencySymbol)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
