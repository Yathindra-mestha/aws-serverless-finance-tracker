import React, { useState } from 'react';
import {
  Layers,
  Globe,
  Key,
  Server,
  Cpu,
  Database,
  Bell,
  Send,
  CheckCircle2,
  Code,
  ArrowRight,
  Sparkles,
  XCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { useAuth as useOidcAuth } from 'react-oidc-context';
import { awsLogger } from '../../services/awsLogger';
import { formatCurrency } from '../../utils/formatters';

interface AwsArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AwsServiceKey = 's3' | 'cognito' | 'apigateway' | 'lambda' | 'dynamodb' | 'sns';

export const AwsArchitectureModal: React.FC<AwsArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedService, setSelectedService] = useState<AwsServiceKey>('dynamodb');
  const { summary, transactions, sendSnsMonthlyDigest, activeMonthYear } = useFinance();
  const { user } = useAuth();
  const oidc = useOidcAuth();
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  // Real token data from Cognito OIDC session
  const isRealAuth = oidc.isAuthenticated;
  const idToken = oidc.user?.id_token;
  const accessToken = oidc.user?.access_token;
  const tokenExpiry = oidc.user?.expires_at
    ? new Date(oidc.user.expires_at * 1000).toLocaleTimeString()
    : null;
  const profile = oidc.user?.profile;

  const servicesData: Record<
    AwsServiceKey,
    {
      title: string;
      category: string;
      icon: any;
      color: string;
      bgGlow: string;
      description: string;
      codeSnippet: string;
      liveStats: { label: string; value: string }[];
    }
  > = {
    s3: {
      title: 'Amazon S3 & CloudFront CDN',
      category: 'Frontend Hosting & Global Edge Distribution',
      icon: Globe,
      color: 'text-indigo-400',
      bgGlow: 'border-indigo-500 bg-indigo-500/10',
      description:
        'Hosts the production Single Page React & TypeScript static build. Distributed across global edge locations via Amazon CloudFront CDN with low latency HTTPS and Route 53 DNS.',
      codeSnippet: `// AWS S3 + CloudFront Deployment Script
aws s3 sync ./dist s3://fintrack-cloud-frontend-prod --delete
aws cloudfront create-invalidation --distribution-id E3XXXX --paths "/*"`,
      liveStats: [
        { label: 'CDN Status', value: 'Edge Active' },
        { label: 'Bundle Size', value: '~150 KB (gzipped)' },
        { label: 'Response Time', value: '< 15ms' },
      ],
    },
    cognito: {
      title: 'Amazon Cognito User Pools',
      category: 'Authentication & Access Control',
      icon: Key,
      color: 'text-amber-400',
      bgGlow: 'border-amber-500 bg-amber-500/10',
      description:
        'Manages user sign-up, sign-in, MFA, and OAuth 2.0 JWT token generation (ID, Access, Refresh tokens). API Gateway validates these tokens automatically on every request.',
      codeSnippet: `// Cognito JWT Auth Flow in Frontend Service
const authSession = await fetchAuthSession();
const token = authSession.tokens.idToken.toString();
// Sent as: { headers: { Authorization: \`Bearer \${token}\` } }`,
      liveStats: [
        { label: 'Auth Status', value: isRealAuth ? '✅ Verified (JWT Active)' : '⚠️ Demo Mode' },
        { label: 'Current User', value: user?.email || (profile as any)?.email || 'Not authenticated' },
        { label: 'Token Expires', value: tokenExpiry ? `Today at ${tokenExpiry}` : 'Bearer ID Token' },
      ],
    },
    apigateway: {
      title: 'Amazon API Gateway (REST API)',
      category: 'API Routing & Security Throttling',
      icon: Server,
      color: 'text-pink-400',
      bgGlow: 'border-pink-500 bg-pink-500/10',
      description:
        'Secure HTTP/REST API endpoints with CORS enabled and Amazon Cognito Authorizer. Routes incoming frontend requests to corresponding AWS Lambda microservices.',
      codeSnippet: `// API Gateway Routes:
GET    /v1/transactions        -> Lambda: getTransactionsHandler
POST   /v1/transactions        -> Lambda: createTransactionHandler
PUT    /v1/budget/:month       -> Lambda: updateBudgetHandler
POST   /v1/sns/trigger-digest  -> Lambda: publishSnsDigestHandler`,
      liveStats: [
        { label: 'Endpoints', value: '6 REST Routes' },
        { label: 'Authorizer', value: 'Cognito JWT' },
        { label: 'Avg Gateway Latency', value: '14ms' },
      ],
    },
    lambda: {
      title: 'AWS Lambda (Serverless Compute)',
      category: 'Event-driven Microservice Handlers',
      icon: Cpu,
      color: 'text-orange-400',
      bgGlow: 'border-orange-500 bg-orange-500/10',
      description:
        'Serverless microservices written in Node.js / Python. Executes business logic, computes monthly finance summaries, calculates budget overrun warnings, and communicates with DynamoDB & SNS.',
      codeSnippet: `// Lambda Handler (Node.js 20.x runtime)
export const handler = async (event) => {
  const userId = event.requestContext.authorizer.jwt.claims.sub;
  const { amount, type, category, description } = JSON.parse(event.body);
  
  await dynamoDb.send(new PutItemCommand({
    TableName: process.env.TABLE_NAME,
    Item: marshall({ PK: \`USER#\${userId}\`, SK: \`TX#\${Date.now()}\`, amount, category })
  }));
  return { statusCode: 201, body: JSON.stringify({ success: true }) };
};`,
      liveStats: [
        { label: 'Runtime', value: 'Node.js 20.x' },
        { label: 'Execution Mode', value: 'On-Demand (0 idle cost)' },
        { label: 'Avg Duration', value: '32ms' },
      ],
    },
    dynamodb: {
      title: 'Amazon DynamoDB (NoSQL Database)',
      category: 'Single-Table Scalable Storage',
      icon: Database,
      color: 'text-cyan-400',
      bgGlow: 'border-cyan-500 bg-cyan-500/10',
      description:
        'High-performance NoSQL database designed using Single-Table Design patterns. Fast sub-10ms queries for retrieving all transactions for a user in a specific date range.',
      codeSnippet: `// DynamoDB Single-Table Design
// PK: USER#<userId> | SK: TX#<date>#<id>      -> Transaction Records
// PK: USER#<userId> | SK: BUDGET#<YYYY-MM>   -> Monthly Budget Limits
// PK: USER#<userId> | SK: NOTIFICATIONS      -> SNS Topic Settings`,
      liveStats: [
        { label: 'Total Records', value: `${transactions.length} items in table` },
        { label: 'Partition Key (PK)', value: 'USER#usr_demo' },
        { label: 'Billing Mode', value: 'Pay-per-request (On-Demand)' },
      ],
    },
    sns: {
      title: 'Amazon SNS & EventBridge',
      category: 'Automated Monthly Email Dispatcher',
      icon: Bell,
      color: 'text-rose-400',
      bgGlow: 'border-rose-500 bg-rose-500/10',
      description:
        'Amazon EventBridge runs a monthly cron schedule (on 1st of every month) to trigger Lambda, which aggregates income/expenses and calls Amazon SNS to send a formatted finance summary email.',
      codeSnippet: `// Amazon SNS Publish Call from Lambda
await snsClient.send(new PublishCommand({
  TopicArn: process.env.SNS_TOPIC_ARN,
  Subject: "📊 Your Monthly FinTrack Financial Summary",
  Message: \`Total Income: ₹\${summary.totalIncome} | Expenses: ₹\${summary.totalExpenses}\`
}));`,
      liveStats: [
        { label: 'Topic Status', value: 'Active' },
        { label: 'Schedule', value: 'Cron: 1st of every month' },
        { label: 'Protocol', value: 'Email Notification' },
      ],
    },
  };

  const current = servicesData[selectedService];
  const ServiceIcon = current.icon;

  const handleRunSimulation = async () => {
    if (selectedService === 'sns') {
      const res = await sendSnsMonthlyDigest(user?.email || 'alex.cloud.dev@example.com');
      setSimulationResult(JSON.stringify(res, null, 2));
    } else if (selectedService === 'cognito') {
      // Real Cognito JWT decode and session inspection
      if (isRealAuth && profile && idToken) {
        // Decode the JWT payload (it's base64 encoded - public claims only)
        const tokenParts = idToken.split('.');
        let decodedPayload: Record<string, any> = {};
        try {
          decodedPayload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
        } catch {
          decodedPayload = { error: 'Could not decode token payload' };
        }
        awsLogger.log({ service: 'Cognito', action: 'JWT Token Inspection', details: `Real token decoded for ${user?.email}`, status: '200 OK', latencyMs: 4 });
        setSimulationResult(JSON.stringify({
          status: '200 OK',
          authMode: 'AWS Cognito (Real Session)',
          user: {
            sub: profile.sub,
            email: profile.email,
            name: user?.name,
          },
          tokenType: 'Bearer ID Token (JWT)',
          tokenExpiry: tokenExpiry ? `Today at ${tokenExpiry}` : 'Unknown',
          jwtClaims: {
            iss: decodedPayload.iss,
            token_use: decodedPayload.token_use,
            scope: decodedPayload.scope,
            auth_time: decodedPayload.auth_time ? new Date(decodedPayload.auth_time * 1000).toISOString() : undefined,
            exp: decodedPayload.exp ? new Date(decodedPayload.exp * 1000).toISOString() : undefined,
          },
          requestId: `amzn-req-${Math.random().toString(36).substring(2, 9)}`,
          timestamp: new Date().toISOString(),
        }, null, 2));
      } else {
        setSimulationResult(JSON.stringify({
          status: '200 OK (Demo Mode)',
          authMode: 'Local Demo — Not Connected to Cognito',
          message: 'Sign in with AWS Cognito to see real JWT token data.',
          timestamp: new Date().toISOString(),
        }, null, 2));
      }
    } else {
      awsLogger.log({
        service:
          selectedService === 'dynamodb'
            ? 'DynamoDB'
            : selectedService === 'apigateway'
            ? 'APIGateway'
            : 'Lambda',
        action: `Interactive Test: ${current.title}`,
        details: `Simulated live execution of ${selectedService.toUpperCase()} service`,
        status: '200 OK',
        latencyMs: Math.floor(Math.random() * 30) + 15,
      });
      setSimulationResult(
        JSON.stringify(
          {
            status: '200 OK',
            awsService: current.title,
            timestamp: new Date().toISOString(),
            requestId: `amzn-req-${Math.random().toString(36).substring(2, 9)}`,
            data: current.liveStats,
          },
          null,
          2
        )
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AWS Serverless Architecture Playground"
      subtitle="Click on any AWS service below to inspect its live data, Lambda code, and simulate execution"
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* Interactive Architecture Service Nodes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
          {(Object.keys(servicesData) as AwsServiceKey[]).map((key) => {
            const svc = servicesData[key];
            const Icon = svc.icon;
            const isSelected = selectedService === key;

            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedService(key);
                  setSimulationResult(null);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? `${svc.bgGlow} shadow-lg ring-1`
                    : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-2 rounded-xl bg-slate-800/80 ${svc.color} mb-1.5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-white truncate w-full">
                  {key === 's3'
                    ? 'S3 / CDN'
                    : key === 'cognito'
                    ? 'Cognito'
                    : key === 'apigateway'
                    ? 'API Gateway'
                    : key === 'lambda'
                    ? 'Lambda'
                    : key === 'dynamodb'
                    ? 'DynamoDB'
                    : 'SNS & Cron'}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-mono">
                  {key === 'dynamodb' ? 'NoSQL' : key === 'lambda' ? 'Compute' : 'AWS'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Service Detail Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-slate-800 ${current.color}`}>
                <ServiceIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{current.title}</h3>
                <p className="text-xs text-slate-400">{current.category}</p>
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-amber-500 hover:from-indigo-500 hover:to-amber-400 text-white font-bold text-xs shadow-md transition-all shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simulate {current.title.split(' ')[1] || 'Service'} Test</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{current.description}</p>

          {/* Live Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {current.liveStats.map((stat, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">{stat.label}</span>
                <p className="text-xs font-bold text-white font-mono mt-0.5">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Microservice Code Snippet */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-indigo-400" /> Microservice Implementation
              </span>
              <span>AWS SDK v3</span>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
              {current.codeSnippet}
            </pre>
          </div>

          {/* Simulation Output */}
          {simulationResult && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs font-mono text-emerald-300 space-y-1 animate-fade-in">
              <div className="flex items-center gap-1 font-bold text-emerald-400 pb-1 border-b border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Simulated AWS Response Output:
              </div>
              <pre className="text-[11px] whitespace-pre-wrap overflow-x-auto">{simulationResult}</pre>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
