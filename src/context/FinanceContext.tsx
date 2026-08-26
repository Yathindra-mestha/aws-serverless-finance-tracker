import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import {
  Transaction,
  Budget,
  DashboardSummary,
  TransactionFilter,
  CategoryExpense,
  MonthlyTrendPoint,
  NotificationPreferences,
  AWSServerlessConfig,
} from '../types';
import { ApiService } from '../services/apiService';
import { DEFAULT_CATEGORIES } from '../constants/categories';
import { getCurrentMonthYear } from '../utils/formatters';
import { useToast } from './ToastContext';

interface FinanceContextType {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  activeMonthYear: string;
  budget: Budget | null;
  summary: DashboardSummary;
  filters: TransactionFilter;
  notificationPrefs: NotificationPreferences | null;
  awsConfig: AWSServerlessConfig;
  isLoading: boolean;

  // Actions
  setActiveMonthYear: (monthYear: string) => void;
  setFilters: React.Dispatch<React.SetStateAction<TransactionFilter>>;
  resetFilters: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Transaction>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<boolean>;
  updateBudgetAmount: (totalBudget: number) => Promise<void>;
  updateCategoryBudgets: (categoryBudgets: Record<string, number>) => Promise<void>;
  updateFullBudget: (totalBudget: number, categoryBudgets: Record<string, number>) => Promise<void>;
  deleteCategoryBudget: (category: string) => Promise<void>;
  updateNotificationPrefs: (prefs: NotificationPreferences) => Promise<void>;
  updateAwsConfig: (config: AWSServerlessConfig) => void;
  sendSnsMonthlyDigest: (email: string) => Promise<{ success: boolean; message: string }>;
  clearToZero: () => Promise<void>;
  revertToSampleData: () => Promise<void>;
  resetToSampleData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const DEFAULT_FILTERS: TransactionFilter = {
  search: '',
  type: 'all',
  category: 'all',
  dateRange: 'all',
  sortBy: 'date-desc',
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeMonthYear, setActiveMonthYear] = useState<string>(getCurrentMonthYear());
  const [budget, setBudget] = useState<Budget | null>(null);
  const [filters, setFilters] = useState<TransactionFilter>(DEFAULT_FILTERS);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [awsConfig, setAwsConfig] = useState<AWSServerlessConfig>(ApiService.getAwsConfig());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { showToast } = useToast();

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txs, bgt, prefs] = await Promise.all([
        ApiService.fetchTransactions(),
        ApiService.fetchBudget(activeMonthYear),
        ApiService.fetchNotificationPreferences(),
      ]);
      setTransactions(txs);
      setBudget(bgt);
      setNotificationPrefs(prefs);
    } catch (err: any) {
      if (err.message && err.message.includes('[UNAUTHORIZED]')) {
        showToast('error', 'Session Expired', 'Please sign in again to access your data.', 6000);
      } else {
        showToast('error', 'Failed to fetch data', err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeMonthYear, showToast]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Reset Filters Helper
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Compute Active Month Summary & Historical Trends
  const summary: DashboardSummary = useMemo(() => {
    // Current month transactions
    const monthTransactions = transactions.filter((t) => t.date.startsWith(activeMonthYear));

    let totalIncome = 0;
    let totalExpenses = 0;

    monthTransactions.forEach((t) => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else {
        totalExpenses += t.amount;
      }
    });

    const currentBalance = totalIncome - totalExpenses;
    const monthlyBudget = budget?.totalBudget ?? 0;
    const budgetUsedAmount = totalExpenses;
    const remainingBudget = monthlyBudget - budgetUsedAmount;
    const budgetUsedPercentage =
      monthlyBudget > 0 ? Math.round((budgetUsedAmount / monthlyBudget) * 100) : 0;
    const savingsRate =
      totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

    // Category Expense Breakdown for active month
    const categoryTotals: Record<string, { amount: number; count: number }> = {};
    monthTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (!categoryTotals[t.category]) {
          categoryTotals[t.category] = { amount: 0, count: 0 };
        }
        categoryTotals[t.category].amount += t.amount;
        categoryTotals[t.category].count += 1;
      });

    const categoryBreakdown: CategoryExpense[] = Object.entries(categoryTotals)
      .map(([catName, data]) => {
        const catInfo = DEFAULT_CATEGORIES.find(
          (c) => c.name.toLowerCase() === catName.toLowerCase()
        );
        const percentage =
          totalExpenses > 0 ? Math.round((data.amount / totalExpenses) * 100) : 0;
        return {
          category: catName,
          amount: data.amount,
          percentage,
          color: catInfo ? catInfo.color : '#94A3B8',
          count: data.count,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Compute Last 6 Months Trends for Analytics
    const monthsMap: Record<string, { income: number; expenses: number }> = {};

    // Build last 6 months keys
    const [currYearStr, currMonthStr] = activeMonthYear.split('-');
    const currYear = parseInt(currYearStr, 10);
    const currMonth = parseInt(currMonthStr, 10);

    const monthKeys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currYear, currMonth - 1 - i, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const key = `${y}-${m}`;
      monthKeys.push(key);
      monthsMap[key] = { income: 0, expenses: 0 };
    }

    transactions.forEach((t) => {
      const key = t.date.substring(0, 7);
      if (monthsMap[key]) {
        if (t.type === 'income') {
          monthsMap[key].income += t.amount;
        } else {
          monthsMap[key].expenses += t.amount;
        }
      }
    });

    const monthlyTrends: MonthlyTrendPoint[] = monthKeys.map((key) => {
      const [y, m] = key.split('-');
      const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short' });
      const inc = monthsMap[key].income;
      const exp = monthsMap[key].expenses;
      return {
        month: monthLabel,
        rawMonth: key,
        income: inc,
        expenses: exp,
        savings: inc - exp,
        budget: monthlyBudget,
      };
    });

    return {
      currentBalance,
      totalIncome,
      totalExpenses,
      monthlyBudget,
      remainingBudget,
      budgetUsedAmount,
      budgetUsedPercentage,
      savingsRate,
      transactionCount: monthTransactions.length,
      categoryBreakdown,
      monthlyTrends,
    };
  }, [transactions, activeMonthYear, budget]);

  // Compute Filtered Transactions for Table
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        // Search filter (description, notes, tags)
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase();
          const matchDesc = t.description.toLowerCase().includes(q);
          const matchCat = t.category.toLowerCase().includes(q);
          const matchNotes = t.notes ? t.notes.toLowerCase().includes(q) : false;
          const matchTags = t.tags ? t.tags.some((tag) => tag.toLowerCase().includes(q)) : false;
          if (!matchDesc && !matchCat && !matchNotes && !matchTags) return false;
        }

        // Type filter
        if (filters.type !== 'all' && t.type !== filters.type) {
          return false;
        }

        // Category filter
        if (filters.category !== 'all' && t.category.toLowerCase() !== filters.category.toLowerCase()) {
          return false;
        }

        // Date range filter
        if (filters.dateRange === 'this-month') {
          if (!t.date.startsWith(activeMonthYear)) return false;
        } else if (filters.dateRange === 'last-month') {
          const [y, m] = activeMonthYear.split('-');
          const lastMonthDate = new Date(parseInt(y, 10), parseInt(m, 10) - 2, 1);
          const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(
            lastMonthDate.getMonth() + 1
          ).padStart(2, '0')}`;
          if (!t.date.startsWith(lastMonthStr)) return false;
        } else if (filters.dateRange === 'custom') {
          if (filters.startDate && t.date < filters.startDate) return false;
          if (filters.endDate && t.date > filters.endDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'date-desc') {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (filters.sortBy === 'date-asc') {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (filters.sortBy === 'amount-desc') {
          return b.amount - a.amount;
        }
        if (filters.sortBy === 'amount-asc') {
          return a.amount - b.amount;
        }
        return 0;
      });
  }, [transactions, filters, activeMonthYear]);

  // CRUD Implementations
  const addTransaction = async (
    tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Transaction> => {
    try {
      const created = await ApiService.createTransaction(tx);
      setTransactions((prev) => [created, ...prev]);
      showToast(
        'success',
        `${tx.type === 'income' ? 'Income' : 'Expense'} Recorded`,
        `${tx.description} added successfully.`
      );

      // Call AWS API to check budget limit if it's an expense
      if (tx.type === 'expense') {
        // Run in background without blocking UI
        ApiService.checkBudgetAlert(tx.category).then((alertStatus) => {
          console.log(`[DIAGNOSTIC] Final percentage shown in the toast:`, alertStatus.percentageUsed);
          if (alertStatus.alertTriggered) {
            showToast(
              'warning',
              'Budget Alert 🚨',
              `Budget alert: ${alertStatus.percentageUsed}% of monthly limit used for category ${tx.category}.`,
              8000
            );
          }
        }).catch(() => {});
      }

      return created;
    } catch (err: any) {
      showToast('error', 'Failed to add transaction', err.message);
      throw err;
    }
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction> => {
    try {
      const updated = await ApiService.updateTransaction(id, updates);
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
      showToast('success', 'Transaction Updated', 'Changes saved successfully.');
      return updated;
    } catch (err: any) {
      showToast('error', 'Failed to update transaction', err.message);
      throw err;
    }
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      await ApiService.deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      showToast('info', 'Transaction Deleted', 'The record was removed.');
      return true;
    } catch (err: any) {
      showToast('error', 'Failed to delete transaction', err.message);
      throw err;
    }
  };

  const updateBudgetAmount = async (totalBudget: number): Promise<void> => {
    if (!budget) return;
    try {
      const updated = await ApiService.updateBudget({ ...budget, totalBudget });
      setBudget(updated);
    } catch (err: any) {
      showToast('error', 'Failed to update budget', err.message);
    }
  };

  const updateCategoryBudgets = async (categoryBudgets: Record<string, number>): Promise<void> => {
    if (!budget) return;
    try {
      const updated = await ApiService.updateBudget({ ...budget, categoryBudgets });
      setBudget(updated);
    } catch (err: any) {
      showToast('error', 'Failed to update allocations', err.message);
    }
  };

  const updateFullBudget = async (totalBudget: number, categoryBudgets: Record<string, number>): Promise<void> => {
    if (!budget) return;
    try {
      const updated = await ApiService.updateBudget({ ...budget, totalBudget, categoryBudgets });
      setBudget(updated);
    } catch (err: any) {
      showToast('error', 'Failed to update budget', err.message);
    }
  };

  const deleteCategoryBudget = async (category: string): Promise<void> => {
    if (!budget) return;
    try {
      await ApiService.deleteBudget(category);
      // Update local state: remove the deleted category from budget
      const updatedCategoryBudgets = { ...budget.categoryBudgets };
      delete updatedCategoryBudgets[category];
      const updatedTotalBudget = Object.values(updatedCategoryBudgets).reduce((sum, v) => sum + (v as number), 0);
      setBudget({
        ...budget,
        totalBudget: updatedTotalBudget,
        categoryBudgets: updatedCategoryBudgets,
      });
      showToast('info', 'Budget Removed', `Budget limit for "${category}" deleted.`);
    } catch (err: any) {
      showToast('error', 'Failed to delete budget', err.message);
      throw err;
    }
  };

  const updateNotificationPrefs = async (prefs: NotificationPreferences): Promise<void> => {
    try {
      const updated = await ApiService.updateNotificationPreferences(prefs);
      setNotificationPrefs(updated);
      showToast('success', 'Preferences Saved', 'AWS SNS notification settings updated.');
    } catch (err: any) {
      showToast('error', 'Failed to update settings', err.message);
    }
  };

  const updateAwsConfig = (config: AWSServerlessConfig): void => {
    const saved = ApiService.saveAwsConfig(config);
    setAwsConfig(saved);
    showToast('info', 'AWS Config Updated', 'Endpoint & ARN mappings updated.');
  };

  const sendSnsMonthlyDigest = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await ApiService.triggerMonthlySnsEmail(email, activeMonthYear);
      showToast('success', 'SNS Email Dispatched! ✉️', res.message, 6000);
      return res;
    } catch (err: any) {
      showToast('error', 'SNS Dispatch Failed', err.message);
      throw err;
    }
  };

  const clearToZero = async (): Promise<void> => {
    ApiService.clearToZero();
    await loadAllData();
    showToast('info', 'Values Reset to Zero', 'All stock transactions cleared. You are starting with a clean slate (₹0).');
  };

  const revertToSampleData = async (): Promise<void> => {
    ApiService.revertToSampleData();
    await loadAllData();
    showToast('success', 'Sample Data Restored', 'Reverted to the original portfolio scenario (₹30,000 Income, ₹18,500 Expenses).');
  };

  const resetToSampleData = async (): Promise<void> => {
    await revertToSampleData();
  };

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        filteredTransactions,
        activeMonthYear,
        budget,
        summary,
        filters,
        notificationPrefs,
        awsConfig,
        isLoading,
        setActiveMonthYear,
        setFilters,
        resetFilters,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateBudgetAmount,
        updateCategoryBudgets,
        updateFullBudget,
        deleteCategoryBudget,
        updateNotificationPrefs,
        updateAwsConfig,
        sendSnsMonthlyDigest,
        clearToZero,
        revertToSampleData,
        resetToSampleData,
        refreshData: loadAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
