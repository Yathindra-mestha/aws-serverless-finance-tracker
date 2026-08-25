export interface AwsCloudLog {
  id: string;
  timestamp: string;
  service: 'Cognito' | 'APIGateway' | 'Lambda' | 'DynamoDB' | 'SNS' | 'EventBridge' | 'S3';
  action: string;
  details: string;
  status: '200 OK' | 'Success' | 'Published' | 'Authenticated';
  latencyMs: number;
  payload?: any;
}

type LogListener = (logs: AwsCloudLog[]) => void;

class AwsCloudLogger {
  private logs: AwsCloudLog[] = [
    {
      id: 'log_init_01',
      timestamp: new Date().toLocaleTimeString(),
      service: 'Cognito',
      action: 'AuthenticateUser',
      details: 'Issued JWT ID & Access Token for user alex.cloud.dev@example.com',
      status: 'Authenticated',
      latencyMs: 45,
    },
    {
      id: 'log_init_02',
      timestamp: new Date().toLocaleTimeString(),
      service: 'DynamoDB',
      action: 'Query (PK = USER#usr_demo)',
      details: 'Loaded 14 items from table FinTrack_Transactions_Prod',
      status: '200 OK',
      latencyMs: 18,
    },
  ];

  private listeners: LogListener[] = [];

  subscribe(listener: LogListener) {
    this.listeners.push(listener);
    listener(this.logs);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  log(entry: Omit<AwsCloudLog, 'id' | 'timestamp'>) {
    const newLog: AwsCloudLog = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      timestamp: new Date().toLocaleTimeString(),
    };
    this.logs = [newLog, ...this.logs.slice(0, 24)]; // keep last 25
    this.listeners.forEach((l) => l(this.logs));
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
    this.listeners.forEach((l) => l(this.logs));
  }
}

export const awsLogger = new AwsCloudLogger();
