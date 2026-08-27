export type TransactionType = 'income' | 'expense';

export type StandardCategory =
  | 'Food'
  | 'Travel'
  | 'Shopping'
  | 'Rent'
  | 'Bills'
  | 'Entertainment'
  | 'Salary'
  | 'Investment'
  | 'Health'
  | 'Other';

export interface CategoryInfo {
  id: string;
  name: string;
  type: TransactionType | 'both';
  icon: string;
  color: string;
  bgColor: string;
  textColor: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  paymentMethod?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  monthYear: string; // YYYY-MM
  totalBudget: number;
  categoryBudgets: Record<string, number>;
  alertThreshold: number; // e.g. 80 for 80%
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  currency: string;
  currencySymbol: string;
  monthlyBudget: number;
  createdAt: string;
  cognitoSub?: string;
}

export interface NotificationPreferences {
  email: string;
  snsTopicArn?: string;
  snsSubscriptionStatus: 'Subscribed' | 'PendingConfirmation' | 'Unsubscribed';
  monthlyEmailDigest: boolean;
  budgetAlerts: boolean;
  budgetAlertThreshold: number;
  lastDigestSent?: string;
}

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
  color: string;
  count: number;
}

export interface MonthlyTrendPoint {
  month: string;
  rawMonth: string; // YYYY-MM
  income: number;
  expenses: number;
  savings: number;
  budget: number;
}

export interface DashboardSummary {
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  monthlyBudget: number;
  remainingBudget: number;
  budgetUsedAmount: number;
  budgetUsedPercentage: number;
  savingsRate: number;
  transactionCount: number;
  categoryBreakdown: CategoryExpense[];
  monthlyTrends: MonthlyTrendPoint[];
}

export interface TransactionFilter {
  search: string;
  type: 'all' | 'income' | 'expense';
  category: string;
  dateRange: 'all' | 'this-month' | 'last-month' | 'last-90-days' | 'custom';
  startDate?: string;
  endDate?: string;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
}

export interface AWSServerlessConfig {
  awsRegion: string;
  cognitoUserPoolId: string;
  cognitoClientId: string;
  apiGatewayEndpoint: string;
  dynamoDbTableName: string;
  snsTopicArn: string;
  mockMode: boolean;
}
export interface RecurringTransaction {
  recurringId: string;
  userId: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  frequency: 'monthly';
  dayOfMonth: number;
  startDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastProcessedMonth?: string;
}
