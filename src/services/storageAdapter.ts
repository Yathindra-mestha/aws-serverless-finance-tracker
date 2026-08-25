import { Transaction, Budget, UserProfile, NotificationPreferences, AWSServerlessConfig } from '../types';
import {
  INITIAL_USER,
  INITIAL_BUDGET,
  INITIAL_NOTIFICATION_PREFS,
  INITIAL_TRANSACTIONS,
  ORIGINAL_SAMPLE_USER,
  ORIGINAL_SAMPLE_BUDGET,
  ORIGINAL_SAMPLE_TRANSACTIONS,
} from './mockData';

const STORAGE_KEYS = {
  USER: 'fintrack_user_profile_v5',
  TRANSACTIONS: 'fintrack_transactions_v5',
  BUDGETS: 'fintrack_budgets_v5',
  NOTIFICATIONS: 'fintrack_notifications_v5',
  AWS_CONFIG: 'fintrack_aws_config_v5',
  INITIALIZED: 'fintrack_zero_initialized_v5',
};

const DEFAULT_AWS_CONFIG: AWSServerlessConfig = {
  awsRegion: 'ap-south-1',
  cognitoUserPoolId: 'ap-south-1_xK91a0Bdf',
  cognitoClientId: '3n098kjl345a90sd8f7a8sdf',
  apiGatewayEndpoint: 'https://api.fintrack.aws.yourdomain.com/v1',
  dynamoDbTableName: 'FinTrack_Transactions_Prod',
  snsTopicArn: 'arn:aws:sns:ap-south-1:123456789012:FinanceMonthlySummaryTopic',
  mockMode: true,
};

export class StorageAdapter {
  private static async delay(ms: number = 50): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --- USER PROFILE ---
  static async getUser(): Promise<UserProfile> {
    await this.delay();
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(INITIAL_USER));
      return INITIAL_USER;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_USER;
    }
  }

  static async saveUser(user: UserProfile): Promise<UserProfile> {
    await this.delay();
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return user;
  }

  // --- TRANSACTIONS ---
  static async getTransactions(): Promise<Transaction[]> {
    await this.delay();
    const stored = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      return [];
    }
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  static async saveTransactions(transactions: Transaction[]): Promise<void> {
    await this.delay();
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  static async addTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    await this.delay();
    const current = await this.getTransactions();
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newTx, ...current];
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updated));
    return newTx;
  }

  static async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    await this.delay();
    const current = await this.getTransactions();
    const index = current.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Transaction with id ${id} not found.`);
    }
    const updatedTx: Transaction = {
      ...current[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    current[index] = updatedTx;
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(current));
    return updatedTx;
  }

  static async deleteTransaction(id: string): Promise<boolean> {
    await this.delay();
    const current = await this.getTransactions();
    const filtered = current.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filtered));
    return true;
  }

  // --- BUDGETS ---
  static async getBudget(monthYear: string): Promise<Budget> {
    await this.delay();
    const stored = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    let budgets: Record<string, Budget> = {};
    if (stored) {
      try {
        budgets = JSON.parse(stored);
      } catch {
        budgets = {};
      }
    }

    if (budgets[monthYear]) {
      return budgets[monthYear];
    }

    const newBudget: Budget = {
      id: `bgt_${monthYear}`,
      userId: 'usr_aws_demo_01',
      monthYear,
      totalBudget: 0,
      categoryBudgets: {},
      alertThreshold: 80,
      updatedAt: new Date().toISOString(),
    };
    budgets[monthYear] = newBudget;
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    return newBudget;
  }

  static async saveBudget(budget: Budget): Promise<Budget> {
    await this.delay();
    const stored = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    let budgets: Record<string, Budget> = {};
    if (stored) {
      try {
        budgets = JSON.parse(stored);
      } catch {
        budgets = {};
      }
    }
    budget.updatedAt = new Date().toISOString();
    budgets[budget.monthYear] = budget;
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    return budget;
  }

  // --- NOTIFICATIONS & SNS ---
  static async getNotificationPreferences(): Promise<NotificationPreferences> {
    await this.delay();
    const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATION_PREFS));
      return INITIAL_NOTIFICATION_PREFS;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return INITIAL_NOTIFICATION_PREFS;
    }
  }

  static async saveNotificationPreferences(prefs: NotificationPreferences): Promise<NotificationPreferences> {
    await this.delay();
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(prefs));
    return prefs;
  }

  // --- AWS CONFIGURATION ---
  static getAwsConfig(): AWSServerlessConfig {
    const stored = localStorage.getItem(STORAGE_KEYS.AWS_CONFIG);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.AWS_CONFIG, JSON.stringify(DEFAULT_AWS_CONFIG));
      return DEFAULT_AWS_CONFIG;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_AWS_CONFIG;
    }
  }

  static saveAwsConfig(config: AWSServerlessConfig): AWSServerlessConfig {
    localStorage.setItem(STORAGE_KEYS.AWS_CONFIG, JSON.stringify(config));
    return config;
  }

  // --- ZERO RESET UTILITY (Clean Slate) ---
  static clearToZero(): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(INITIAL_USER));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify({
      '2026-08': {
        id: 'bgt_aug_2026',
        userId: 'usr_aws_demo_01',
        monthYear: '2026-08',
        totalBudget: 0,
        categoryBudgets: {},
        alertThreshold: 80,
        updatedAt: new Date().toISOString(),
      }
    }));
    // Clear previous keys if any exist
    localStorage.removeItem('fintrack_transactions');
    localStorage.removeItem('fintrack_budgets');
  }

  // --- REVERT UTILITY (Restore Sample ₹30k Portfolio Data) ---
  static revertToSampleData(): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(ORIGINAL_SAMPLE_USER));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(ORIGINAL_SAMPLE_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify({ '2026-08': ORIGINAL_SAMPLE_BUDGET }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATION_PREFS));
    localStorage.setItem(STORAGE_KEYS.AWS_CONFIG, JSON.stringify(DEFAULT_AWS_CONFIG));
  }

  static resetToSampleData(): void {
    this.revertToSampleData();
  }
}
