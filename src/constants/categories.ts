import { CategoryInfo } from '../types';

export const DEFAULT_CATEGORIES: CategoryInfo[] = [
  {
    id: 'salary',
    name: 'Salary',
    type: 'income',
    icon: 'Briefcase',
    color: '#10B981', // Emerald
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
  },
  {
    id: 'investment',
    name: 'Investment',
    type: 'income',
    icon: 'TrendingUp',
    color: '#06B6D4', // Cyan
    bgColor: 'bg-cyan-500/10',
    textColor: 'text-cyan-400',
  },
  {
    id: 'rent',
    name: 'Rent',
    type: 'expense',
    icon: 'Home',
    color: '#6366F1', // Indigo
    bgColor: 'bg-indigo-500/10',
    textColor: 'text-indigo-400',
  },
  {
    id: 'food',
    name: 'Food',
    type: 'expense',
    icon: 'Utensils',
    color: '#F59E0B', // Amber
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-400',
  },
  {
    id: 'travel',
    name: 'Travel',
    type: 'expense',
    icon: 'Plane',
    color: '#3B82F6', // Blue
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#EC4899', // Pink
    bgColor: 'bg-pink-500/10',
    textColor: 'text-pink-400',
  },
  {
    id: 'bills',
    name: 'Bills',
    type: 'expense',
    icon: 'Zap',
    color: '#8B5CF6', // Purple
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    type: 'expense',
    icon: 'Film',
    color: '#F43F5E', // Rose
    bgColor: 'bg-rose-500/10',
    textColor: 'text-rose-400',
  },
  {
    id: 'health',
    name: 'Health',
    type: 'expense',
    icon: 'HeartPulse',
    color: '#14B8A6', // Teal
    bgColor: 'bg-teal-500/10',
    textColor: 'text-teal-400',
  },
  {
    id: 'other',
    name: 'Other',
    type: 'both',
    icon: 'MoreHorizontal',
    color: '#94A3B8', // Slate
    bgColor: 'bg-slate-500/10',
    textColor: 'text-slate-400',
  },
];

export const PAYMENT_METHODS = [
  'UPI / Net Banking',
  'Credit Card',
  'Debit Card',
  'Cash',
  'Bank Transfer',
  'Wallet',
  'Other',
];

export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
];
