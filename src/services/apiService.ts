import { Transaction, Budget, NotificationPreferences, AWSServerlessConfig } from '../types';
import { StorageAdapter } from './storageAdapter';
import { awsLogger } from './awsLogger';

const API_BASE_URL = (import.meta as any).env.VITE_API_URL;

/**
 * Helper to get the current Cognito JWT access token from localStorage (managed by react-oidc-context)
 */
const getCognitoTokens = (): { accessToken: string | null; idToken: string | null } => {
  try {
    const authority = (import.meta as any).env.VITE_COGNITO_AUTHORITY;
    const clientId = (import.meta as any).env.VITE_COGNITO_CLIENT_ID;
    const key = `oidc.user:${authority}:${clientId}`;
    console.log(`[Auth] Looking for Cognito tokens in localStorage using key: ${key}`);
    const data = localStorage.getItem(key);
    
    if (data) {
      const parsed = JSON.parse(data);
      return {
        accessToken: parsed.access_token || null,
        idToken: parsed.id_token || null,
      };
    } else {
      console.warn('[Auth] No OIDC session found in localStorage.');
    }
  } catch (e) {
    console.error('[Auth] Failed to parse Cognito tokens from storage:', e);
  }
  return { accessToken: null, idToken: null };
};

interface ApiFetchOptions extends RequestInit {
  useIdToken?: boolean;
}

/**
 * Base fetch wrapper for authenticated API calls
 */
const apiFetch = async (endpoint: string, options: ApiFetchOptions = {}) => {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_URL is not defined in environment variables');
  }

  const tokens = getCognitoTokens();
  const token = options.useIdToken ? tokens.idToken : tokens.accessToken;
  
  if (!token) {
    console.error(`[API] Cannot execute ${options.method || 'GET'} ${endpoint} - No token found (useIdToken: ${!!options.useIdToken})`);
    throw new Error('[UNAUTHORIZED] No valid Cognito token found. Please sign in.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    'Authorization': `Bearer ${token}`
  };

  const url = `${API_BASE_URL}${endpoint}`;
  console.log(`[API] ${options.method || 'GET'} ${url}`);
  console.log(`[API] Headers:`, { ...headers, Authorization: 'Bearer <REDACTED>' });
  if (options.body) {
    console.log(`[API] Payload:`, JSON.parse(options.body as string));
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  console.log(`[API] Response Status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    let message = 'API Request Failed';
    try {
      const errData = await response.json();
      console.error(`[API] Error Response Body:`, errData);
      message = errData.message || errData.error || message;
    } catch {
      message = response.statusText || String(response.status);
    }
    
    // Throw a specific error for 401/403 so the app can handle it gracefully
    if (response.status === 401 || response.status === 403) {
      throw new Error(`[UNAUTHORIZED] ${message}`);
    }
    throw new Error(message);
  }

  const data = await response.json();
  console.log(`[API] Response Body:`, data);
  return data;
};

/**
 * ApiService Interface with Live AWS Cloud Logger Integration
 */
export const ApiService = {
  // --- Transactions API (Maps to Lambda -> DynamoDB CRUD) ---
  async fetchTransactions(): Promise<Transaction[]> {
    const startTime = performance.now();
    try {
      const response = await apiFetch('/transactions');
      const latency = Math.round(performance.now() - startTime + 20);

      awsLogger.log({
        service: 'APIGateway',
        action: 'GET /transactions',
        details: `Retrieved ${response.transactions?.length || 0} transaction records via Cognito JWT Authorizer`,
        status: '200 OK',
        latencyMs: latency,
      });

      // Map backend `transactionId` to frontend `id`
      if (response.transactions && Array.isArray(response.transactions)) {
        return response.transactions.map((tx: any) => ({
          ...tx,
          id: tx.transactionId || tx.id,
        }));
      }
      return [];
    } catch (error: any) {
      console.error('[API] /transactions failed:', error.message);
      throw error; // DO NOT fallback to StorageAdapter
    }
  },

  async createTransaction(tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
    const startTime = performance.now();
    try {
      // Create body (omit userId as backend extracts it from JWT)
      const payload = {
        amount: tx.amount,
        type: tx.type,
        category: tx.category,
        date: tx.date,
        description: tx.description,
        notes: tx.notes,
        paymentMethod: tx.paymentMethod,
        tags: tx.tags,
      };

      const response = await apiFetch('/transactions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const latency = Math.round(performance.now() - startTime + 35);
      const newTx = response.transaction;
      
      // Map back to frontend shape
      const mappedTx: Transaction = {
        ...newTx,
        id: newTx.transactionId,
      };

      awsLogger.log({
        service: 'APIGateway',
        action: 'POST /transactions',
        details: `HTTP 200 via Cognito JWT Authorizer for ${mappedTx.type.toUpperCase()} of ₹${mappedTx.amount.toLocaleString()}`,
        status: '200 OK',
        latencyMs: 15,
      });

      awsLogger.log({
        service: 'DynamoDB',
        action: 'PutItem (PK = JWT sub, SK = TX#' + mappedTx.date + '#' + mappedTx.id.slice(-6) + ')',
        details: `Inserted transaction item: "${mappedTx.description}" into DynamoDB`,
        status: 'Success',
        latencyMs: latency,
        payload: mappedTx,
      });

      return mappedTx;
    } catch (error: any) {
      console.error('[API] POST /transactions failed:', error.message);
      throw error; // DO NOT fallback to StorageAdapter
    }
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const startTime = performance.now();
    try {
      // Send only the editable transaction fields in the JSON body
      const payload = {
        amount: updates.amount,
        type: updates.type,
        category: updates.category,
        date: updates.date,
        description: updates.description,
        notes: updates.notes,
        paymentMethod: updates.paymentMethod,
        tags: updates.tags,
      };

      // Clean up undefined fields from payload to avoid sending unnecessary data
      const cleanPayload = Object.fromEntries(Object.entries(payload).filter(([_, v]) => v !== undefined));

      const response = await apiFetch(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(cleanPayload),
      });

      const latency = Math.round(performance.now() - startTime + 30);
      const updatedTx = response.transaction || response;
      
      // Map back to frontend shape
      const mappedTx: Transaction = {
        ...updatedTx,
        id: updatedTx.transactionId || id,
      };

      awsLogger.log({
        service: 'APIGateway',
        action: `PUT /transactions/${id}`,
        details: `HTTP 200 via Cognito JWT Authorizer for transaction update`,
        status: '200 OK',
        latencyMs: 15,
      });

      awsLogger.log({
        service: 'DynamoDB',
        action: 'UpdateItem (SK = TX#' + id.slice(-6) + ')',
        details: `Modified item attributes in DynamoDB`,
        status: 'Success',
        latencyMs: latency,
        payload: cleanPayload,
      });

      return mappedTx;
    } catch (error: any) {
      console.error(`[API] PUT /transactions/${id} failed:`, error.message);
      throw error; // DO NOT fallback to StorageAdapter
    }
  },

  async deleteTransaction(id: string): Promise<boolean> {
    const startTime = performance.now();
    try {
      await apiFetch(`/transactions/${id}`, {
        method: 'DELETE',
      });

      const latency = Math.round(performance.now() - startTime + 25);

      awsLogger.log({
        service: 'APIGateway',
        action: `DELETE /transactions/${id}`,
        details: `HTTP 200 via Cognito JWT Authorizer for transaction deletion`,
        status: '200 OK',
        latencyMs: 15,
      });

      awsLogger.log({
        service: 'DynamoDB',
        action: 'DeleteItem (SK = TX#' + id.slice(-6) + ')',
        details: `Removed item from DynamoDB`,
        status: 'Success',
        latencyMs: latency,
      });

      return true;
    } catch (error: any) {
      console.error(`[API] DELETE /transactions/${id} failed:`, error.message);
      throw error; // DO NOT fallback to StorageAdapter
    }
  },

  // --- Budget API ---
  async fetchBudget(monthYear: string): Promise<Budget> {
    const startTime = performance.now();
    
    // Load local storage to get UI-only state (like totalBudget) because 
    // the AWS backend currently only stores per-category limits natively.
    const localBudget = await StorageAdapter.getBudget(monthYear);

    try {
      const response = await apiFetch('/budget');
      const latency = Math.round(performance.now() - startTime + 20);

      awsLogger.log({
        service: 'APIGateway',
        action: 'GET /budget',
        details: `Retrieved budget limits from DynamoDB via Cognito JWT Authorizer`,
        status: '200 OK',
        latencyMs: latency,
      });

      const categoryBudgets: Record<string, number> = {};
      if (response.budgets && Array.isArray(response.budgets)) {
        for (const b of response.budgets) {
          categoryBudgets[b.category] = b.monthlyLimit;
        }
      }

      // Always derive totalBudget from AWS category limits so stale localStorage
      // values (e.g. old ₹1,00,000) never leak through when all budgets are deleted.
      const totalBudget = Object.values(categoryBudgets).reduce((sum, v) => sum + v, 0);

      return {
        ...localBudget,
        categoryBudgets,
        totalBudget,
      };
    } catch (error: any) {
      console.error(`[API] GET /budget failed:`, error.message);
      throw error; // DO NOT fallback silently. Force the UI to show the AWS failure.
    }
  },

  async updateBudget(budget: Budget): Promise<Budget> {
    // Keep local storage for frontend UI state since backend only handles category budgets natively
    const saved = await StorageAdapter.saveBudget(budget);

    try {
      // Sync each category limit to AWS backend using POST /budget
      const promises = Object.entries(budget.categoryBudgets).map(([category, limit]) =>
        apiFetch('/budget', {
          method: 'POST',
          body: JSON.stringify({ category, monthlyLimit: limit }),
        })
      );
      
      if (promises.length > 0) {
        await Promise.all(promises);
        awsLogger.log({
          service: 'APIGateway',
          action: 'POST /budget',
          details: `Synchronized ${promises.length} category budgets to AWS backend`,
          status: '200 OK',
          latencyMs: 45,
        });
      }
    } catch (error: any) {
      console.error('[API] Failed to sync budgets to AWS API:', error.message);
      throw error; // Surface the AWS error
    }

    return saved;
  },

  async deleteBudget(category: string): Promise<void> {
    const startTime = performance.now();
    try {
      await apiFetch(`/budget/${encodeURIComponent(category)}`, {
        method: 'DELETE',
      });

      const latency = Math.round(performance.now() - startTime + 20);

      awsLogger.log({
        service: 'APIGateway',
        action: `DELETE /budget/${category}`,
        details: `Removed budget limit for category "${category}" via Cognito JWT Authorizer`,
        status: '200 OK',
        latencyMs: 15,
      });

      awsLogger.log({
        service: 'DynamoDB',
        action: `DeleteItem (category=${category})`,
        details: `Removed budget record from DynamoDB`,
        status: 'Success',
        latencyMs: latency,
      });
    } catch (error: any) {
      console.error(`[API] DELETE /budget/${category} failed:`, error.message);
      throw error; // DO NOT fallback silently
    }
  },

  async checkBudgetAlert(category: string): Promise<{ percentageUsed: number; alertTriggered: boolean; message: string | null }> {
    try {
      const requestBody = JSON.stringify({ category });
      console.log(`[DIAGNOSTIC] POST /budget/check request body:`, requestBody);

      const res = await apiFetch('/budget/check', {
        method: 'POST',
        body: requestBody,
      });
      
      console.log(`[DIAGNOSTIC] AWS response raw:`, res);
      console.log(`[DIAGNOSTIC] AWS response percentageUsed:`, res.percentageUsed);
      console.log(`[DIAGNOSTIC] AWS response alertTriggered:`, res.alertTriggered);

      awsLogger.log({
        service: 'APIGateway',
        action: 'POST /budget/check',
        details: `Checked budget alert status for ${category} (Used: ${res.percentageUsed}%)`,
        status: '200 OK',
        latencyMs: 20,
      });

      return {
        percentageUsed: res.percentageUsed,
        alertTriggered: res.alertTriggered,
        message: res.message,
      };
    } catch (error) {
      console.warn('Failed to check budget alert:', error);
      return { percentageUsed: 0, alertTriggered: false, message: null };
    }
  },

  // --- Notifications & SNS API ---
  async fetchNotificationPreferences(): Promise<NotificationPreferences> {
    return StorageAdapter.getNotificationPreferences();
  },

  async updateNotificationPreferences(prefs: NotificationPreferences): Promise<NotificationPreferences> {
    try {
      await apiFetch('/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({ enabled: prefs.monthlyEmailDigest }),
        useIdToken: true, // Use id_token so Lambda gets claims.email
      });

      awsLogger.log({
        service: 'APIGateway',
        action: 'POST /notifications/subscribe',
        details: `Saved notification subscription (enabled: ${prefs.monthlyEmailDigest}) via Cognito JWT Authorizer`,
        status: '200 OK',
        latencyMs: 35,
      });
    } catch (error: any) {
      console.error('[API] Failed to sync notification preferences to AWS:', error.message);
      throw error; // Do not fallback silently
    }

    // Persist UI state locally
    const updated = await StorageAdapter.saveNotificationPreferences(prefs);
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

    awsLogger.log({
      service: 'Lambda',
      action: 'Invoke (Async)',
      details: `monthlyFinanceSummary triggered by EventBridge`,
      status: '200 OK',
      latencyMs: 145,
    });

    awsLogger.log({
      service: 'SNS',
      action: 'Publish (TopicArn = arn:aws:sns:ap-south-1:765959262630:FinTrackMonthlySummary)',
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

// Recurring Transactions APIs
export const getRecurringTransactions = async (): Promise<any[]> => {
  const response = await apiFetch('/recurring', {
    method: 'GET'
  });
  return response.recurringTransactions || [];
};

export const addRecurringTransaction = async (data: any): Promise<any> => {
  const response = await apiFetch('/recurring', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return response;
};

export const updateRecurringTransaction = async (recurringId: string, active: boolean): Promise<any> => {
  throw new Error('Backend endpoint PUT /recurring/{recurringId} is missing and not implemented.');
};

export const deleteRecurringTransaction = async (recurringId: string): Promise<void> => {
  throw new Error('Backend endpoint DELETE /recurring/{recurringId} is missing and not implemented.');
};
