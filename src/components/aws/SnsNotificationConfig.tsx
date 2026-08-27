import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency, formatMonth } from '../../utils/formatters';

export const SnsNotificationConfig: React.FC = () => {
  const { user } = useAuth();
  const {
    notificationPrefs,
    updateNotificationPrefs,
    sendSnsMonthlyDigest,
    activeMonthYear,
    summary,
  } = useFinance();

  const [email, setEmail] = useState<string>(user?.email || 'alex.cloud.dev@example.com');
  const [monthlyDigest, setMonthlyDigest] = useState<boolean>(true);
  const [budgetAlerts, setBudgetAlerts] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(80);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [simulatedEmailPreview, setSimulatedEmailPreview] = useState<string | null>(null);

  const currencyCode = user?.currency || 'INR';
  const currencySymbol = user?.currencySymbol || '₹';

  useEffect(() => {
    if (notificationPrefs) {
      setEmail(notificationPrefs.email);
      setMonthlyDigest(notificationPrefs.monthlyEmailDigest);
      setBudgetAlerts(notificationPrefs.budgetAlerts);
      setThreshold(notificationPrefs.budgetAlertThreshold || 80);
    }
  }, [notificationPrefs]);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateNotificationPrefs({
      email,
      snsTopicArn: notificationPrefs?.snsTopicArn || 'arn:aws:sns:ap-south-1:765959262630:FinTrackMonthlySummary',
      snsSubscriptionStatus: 'Subscribed',
      monthlyEmailDigest: monthlyDigest,
      budgetAlerts,
      budgetAlertThreshold: threshold,
      lastDigestSent: notificationPrefs?.lastDigestSent,
    });
  };

  const handleTriggerSnsSimulation = async () => {
    setIsSending(true);
    try {
      await sendSnsMonthlyDigest(email);

      // Generate visual email preview
      const preview = `
[AWS SNS Notification: FinTrackMonthlySummary]
From: no-reply@sns.amazonaws.com
To: ${email}
Subject: 📊 Your Monthly Financial Digest for ${formatMonth(activeMonthYear)}

Hi ${user?.name || 'User'},

Here is your automated monthly personal finance summary powered by AWS Serverless:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 FINANCIAL SUMMARY (${formatMonth(activeMonthYear)})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Total Income:       ${formatCurrency(summary.totalIncome, currencyCode, currencySymbol)}
• Total Expenses:     ${formatCurrency(summary.totalExpenses, currencyCode, currencySymbol)}
• Current Balance:    ${formatCurrency(summary.currentBalance, currencyCode, currencySymbol)}
• Monthly Budget:     ${formatCurrency(summary.monthlyBudget, currencyCode, currencySymbol)}
• Budget Consumed:    ${summary.budgetUsedPercentage}% (${summary.remainingBudget >= 0 ? `${formatCurrency(summary.remainingBudget, currencyCode, currencySymbol)} remaining` : `Exceeded by ${formatCurrency(Math.abs(summary.remainingBudget), currencyCode, currencySymbol)}`})
• Net Savings Rate:   ${summary.savingsRate}%

📊 TOP EXPENSE CATEGORIES:
${summary.categoryBreakdown.slice(0, 4).map((c) => `  - ${c.category}: ${formatCurrency(c.amount, currencyCode, currencySymbol)} (${c.percentage}%)`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Dispatched automatically by AWS EventBridge -> AWS Lambda -> Amazon SNS.
To manage your alerts, visit your FinTrack Cloud Dashboard.
      `.trim();

      setSimulatedEmailPreview(preview);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-2xl p-5 shadow-card">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Amazon SNS Email Notifications
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-mono">
              AWS SNS Topic
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Configure automated monthly finance summaries and budget alert thresholds delivered to your email inbox.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>SNS Topic Active</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-card space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Email Subscription Settings</h3>
            <p className="text-xs text-slate-400">SNS Topic: arn:aws:sns:ap-south-1:765959262630:FinTrackMonthlySummary</p>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Notification Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={monthlyDigest}
                  onChange={(e) => setMonthlyDigest(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200">
                    Monthly Finance Summary Email
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Receive a full breakdown of monthly income, expenses, and savings on the 1st of every month.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={budgetAlerts}
                  onChange={(e) => setBudgetAlerts(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200">
                    Real-time Budget Threshold Warning
                  </span>
                  <p className="text-[11px] text-slate-400">
                    Trigger instant alert when your expenses exceed the specified percentage of your monthly budget.
                  </p>
                </div>
              </label>
            </div>

            {/* Alert Threshold Slider */}
            {budgetAlerts && (
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-semibold">Alert Trigger Threshold:</span>
                  <span className="font-mono font-bold text-amber-400">{threshold}% of budget</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  step="5"
                  value={threshold}
                  onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-colors"
            >
              Save Notification Preferences
            </button>
          </form>
        </div>

        {/* Live SNS Trigger Simulator */}
        <div className="lg:col-span-6 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 shadow-card space-y-4">
          <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">SNS Test Dispatcher</h3>
              <p className="text-xs text-slate-400">Simulate AWS EventBridge / Lambda invocation</p>
            </div>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Preview the format of the monthly digest that AWS EventBridge and Lambda will dispatch to you via <code className="text-amber-300 font-mono">sns.publish()</code>.
          </p>

          <button
            onClick={handleTriggerSnsSimulation}
            disabled={isSending}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-extrabold text-xs shadow-lg transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSending ? 'Generating UI Preview...' : 'View Simulated Email Preview'}</span>
          </button>

          {/* Email Preview Box */}
          {simulatedEmailPreview && (
            <div className="mt-4 rounded-xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400 pb-1 border-b border-slate-800">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Simulated Email Delivered to Inbox
                </span>
                <span className="font-mono text-slate-500">HTTP 200 OK</span>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto custom-scrollbar">
                {simulatedEmailPreview}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
