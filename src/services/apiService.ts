import { Transaction, Budget, NotificationPreferences, AWSServerlessConfig } from '../types';
import { StorageAdapter } from './storageAdapter';
import { awsLogger } from './awsLogger';

/**
 * ApiService Interface with Live AWS Cloud Logger Integration
 */
export const ApiService = {
  // --- Transactions API (Maps to Lambda -> DynamoDB CRUD) ---
  async fetchTransactions(): Promise<Transaction[]> {
    const startTime = performance.now();
    const result = await StorageAdapter.getTransactions();
    const latency = Math.round(performance.now() - startTime + 20);

    awsLogger.log({
      service: 'DynamoDB',
      action: 'Query (PK = USER#usr_demo)',
      details: `Retrieved ${result.length} transaction records from table FinTrack_Transactions_Prod`,
      status: '200 OK',
      latencyMs: latency,
    });

    return result;
  },

  async createTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const startTime = performance.now();
    const newTx = await StorageAdapter.addTransaction(tx);
    const latency = Math.round(performance.now() - startTime + 35);

    // Log API Gateway
    awsLogger.log({
      service: 'APIGateway',
      action: 'POST /v1/transactions',
      details: `HTTP 200 via Cognito JWT Authorizer for ${newTx.type.toUpperCase()} of ₹${newTx.amount.toLocaleString()}`,
      status: '200 OK',
      latencyMs: 15,
    });

    // Log Lambda & DynamoDB PutItem
    awsLogger.log({
      service: 'DynamoDB',
      action: 'PutItem (PK = USER#usr_demo, SK = TX#' + newTx.date + '#' + newTx.id.slice(-6) + ')',
      details: `Inserted transaction item: "${newTx.description}" into DynamoDB single-table`,
      status: 'Success',
      latencyMs: latency,
      payload: newTx,
    });

    return newTx;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const updated = await StorageAdapter.updateTransaction(id, updates);

    awsLogger.log({
      service: 'DynamoDB',
      action: 'UpdateItem (SK = TX#' + id.slice(-6) + ')',
      details: `Modified item attributes in DynamoDB`,
      status: 'Success',
      latencyMs: 28,
      payload: updates,
    });

    return updated;
  },

  async deleteTransaction(id: string): Promise<boolean> {
    await StorageAdapter.deleteTransaction(id);

    awsLogger.log({
      service: 'DynamoDB',
      action: 'DeleteItem (SK = TX#' + id.slice(-6) + ')',
      details: `Removed item from table FinTrack_Transactions_Prod`,
      status: 'Success',
      latencyMs: 22,
    });

    return true;
  },

  // --- Budget API ---
  async fetchBudget(monthYear: string): Promise<Budget> {
    const budget = await StorageAdapter.getBudget(monthYear);
    return budget;
  },

  async updateBudget(budget: Budget): Promise<Budget> {
    const saved = await StorageAdapter.saveBudget(budget);

    awsLogger.log({
      service: 'DynamoDB',
      action: 'PutItem (PK = USER#usr_demo, SK = BUDGET#' + budget.monthYear + ')',
      details: `Saved monthly budget limit of ₹${budget.totalBudget.toLocaleString()} to DynamoDB`,
      status: 'Success',
      latencyMs: 25,
      payload: { totalBudget: budget.totalBudget },
    });

    return saved;
  },

  // --- Notifications & SNS API ---
  async fetchNotificationPreferences(): Promise<NotificationPreferences> {
    return StorageAdapter.getNotificationPreferences();
  },

  async updateNotificationPreferences(prefs: NotificationPreferences): Promise<NotificationPreferences> {
    const updated = await StorageAdapter.saveNotificationPreferences(prefs);

    awsLogger.log({
      service: 'SNS',
      action: 'SetSubscriptionAttributes',
      details: `Updated Amazon SNS Topic subscription for ${prefs.email}`,
      status: 'Success',
      latencyMs: 40,
    });

    return updated;
  },

  async triggerMonthlySnsEmail(email: string, monthYear: string): Promise<{ success: boolean; messageId: string; message: string }> {
    await new Promise((res) => setTimeout(res, 500));
    const messageId = `sns-msg-${Math.random().toString(36).substring(2, 8)}-${Date.now()}`;

    // Log EventBridge invocation
    awsLogger.log({
      service: 'EventBridge',
      action: 'Rule: MonthlyDigestScheduleCron',
      details: `Cron triggered monthly summary worker Lambda function`,
      status: 'Success',
      latencyMs: 12,
    });

    // Log SNS Publish
    awsLogger.log({
      service: 'SNS',
      action: 'Publish (TopicArn = arn:aws:sns:...:FinanceMonthlySummaryTopic)',
      details: `Dispatched summary email payload to ${email} (MessageId: ${messageId})`,
      status: 'Published',
      latencyMs: 65,
    });

    return {
      success: true,
      messageId,
      message: `AWS SNS monthly finance summary successfully dispatched to ${email} for ${monthYear}.`,
    };
  },

  getAwsConfig(): AWSServerlessConfig {
    return StorageAdapter.getAwsConfig();
  },

  saveAwsConfig(config: AWSServerlessConfig): AWSServerlessConfig {
    return StorageAdapter.saveAwsConfig(config);
  },

  clearToZero(): void {
    StorageAdapter.clearToZero();
    awsLogger.log({
      service: 'DynamoDB',
      action: 'DeleteTableItems (Flush to Zero)',
      details: `Cleared all active transactions and reset budget to ₹0. Clean slate mode active.`,
      status: 'Success',
      latencyMs: 35,
    });
  },

  revertToSampleData(): void {
    StorageAdapter.revertToSampleData();
    awsLogger.log({
      service: 'DynamoDB',
      action: 'BatchWriteItem (Revert)',
      details: `Restored full sample database records (₹30,000 Income, ₹18,500 Expenses, ₹25,000 Budget)`,
      status: 'Success',
      latencyMs: 45,
    });
  },

  resetAllData(): void {
    this.clearToZero();
  },
};
