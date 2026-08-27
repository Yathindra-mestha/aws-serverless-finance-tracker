import React, { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9'];

export const FinancialAnalytics: React.FC = () => {
  const { transactions, activeMonthYear } = useFinance();
  const { user } = useAuth();

  const code = user?.currency || 'INR';
  const sym = user?.currencySymbol || '₹';

  // 1. Monthly Income vs Expenses & Trend
  const monthlyData = useMemo(() => {
    const data: Record<string, { rawMonth: string, month: string, income: number, expense: number, balance: number }> = {};
    
    transactions.forEach(tx => {
      const monthKey = tx.date.substring(0, 7); // YYYY-MM
      if (!data[monthKey]) {
        const dateObj = new Date(tx.date);
        const monthName = dateObj.toLocaleString('default', { month: 'short' }) + ' ' + dateObj.getFullYear();
        data[monthKey] = { rawMonth: monthKey, month: monthName, income: 0, expense: 0, balance: 0 };
      }
      
      if (tx.type === 'income') data[monthKey].income += tx.amount;
      else if (tx.type === 'expense') data[monthKey].expense += tx.amount;
    });

    return Object.values(data)
      .sort((a, b) => a.rawMonth.localeCompare(b.rawMonth))
      .map(d => ({ ...d, balance: d.income - d.expense }));
  }, [transactions]);

  // 2. Spending by Category (Current Month)
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(tx => tx.type === 'expense' && tx.date.startsWith(activeMonthYear));
    const data: Record<string, number> = {};
    
    expenses.forEach(tx => {
      data[tx.category] = (data[tx.category] || 0) + tx.amount;
    });

    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, activeMonthYear]);

  if (transactions.length === 0) {
    return null;
  }

  const formatTooltipCurrency = (value: number) => {
    return formatCurrency(value, code, sym);
  };

  return (
    <div className="space-y-6 mt-6">
      <h2 className="text-lg font-bold text-white mb-4">Financial Analytics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Income vs Expenses (Monthly)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${sym}${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={formatTooltipCurrency}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending by Category Pie Chart */}
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Expenses by Category ({activeMonthYear})</h3>
          <div className="h-64 w-full flex items-center justify-center">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }}
                    formatter={formatTooltipCurrency}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No expenses recorded for this month.</p>
            )}
          </div>
        </div>
        
        {/* Net Balance / Savings Trend Line Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-4">Net Savings Trend</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${sym}${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontSize: '12px' }}
                  formatter={formatTooltipCurrency}
                />
                <Line type="monotone" dataKey="balance" name="Net Balance" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#0f172a' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
