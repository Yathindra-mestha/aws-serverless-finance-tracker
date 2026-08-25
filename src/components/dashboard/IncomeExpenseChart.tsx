import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

export const IncomeExpenseChart: React.FC = () => {
  const { user } = useAuth();
  const { summary } = useFinance();
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const currencyCode = user?.currency || 'INR';
  const currencySymbol = user?.currencySymbol || '₹';

  const chartData = summary.monthlyTrends;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const expenses = payload.find((p: any) => p.dataKey === 'expenses')?.value || 0;
      const net = income - expenses;

      return (
        <div className="rounded-xl bg-slate-900/95 border border-slate-700 p-3.5 shadow-2xl backdrop-blur-md text-xs">
          <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1.5 mb-2">
            {label} Performance
          </p>
          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between gap-4 text-emerald-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Income:
              </span>
              <span className="font-bold">{formatCurrency(income, currencyCode, currencySymbol)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-rose-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Expenses:
              </span>
              <span className="font-bold">{formatCurrency(expenses, currencyCode, currencySymbol)}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-indigo-300 pt-1.5 border-t border-slate-800">
              <span>Net Saved:</span>
              <span className="font-bold">{formatCurrency(net, currencyCode, currencySymbol)}</span>
            </div>
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
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white tracking-tight">Income vs Expenses Trend</h3>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
              6-Month Overview
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Cash flow balance and monthly savings</p>
        </div>

        {/* Toggle Area vs Bar Chart */}
        <div className="flex items-center bg-slate-800/80 border border-slate-700/80 rounded-xl p-1 text-xs">
          <button
            onClick={() => setChartType('area')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
              chartType === 'area'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Flow</span>
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
              chartType === 'bar'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bars</span>
          </button>
        </div>
      </div>

      <div className="h-64 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#64748B"
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? `${val / 1000}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                height={30}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
              />
              <Area
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#10B981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#incomeGrad)"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#F43F5E"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#expenseGrad)"
              />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="month" stroke="#64748B" tick={{ fontSize: 11 }} />
              <YAxis
                stroke="#64748B"
                tick={{ fontSize: 10 }}
                tickFormatter={(val) => `${currencySymbol}${val >= 1000 ? `${val / 1000}k` : val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                height={30}
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
              />
              <Bar dataKey="income" name="Income" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#F43F5E" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
