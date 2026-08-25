# FinTrack Cloud — AWS Serverless Personal Finance Tracker (Frontend)

A modern, production-grade **Personal Finance Tracker** web application designed with a SaaS-tier UI and architected specifically to integrate with an **AWS Serverless backend** (Amazon Cognito, API Gateway, AWS Lambda, Amazon DynamoDB, and Amazon SNS).

Built to showcase full-stack cloud engineering skills for portfolios, resumes, and technical interviews.

---

## 🚀 Key Highlights & Features

### 1. 💼 Financial Overview & KPI Metrics
- **Current Balance, Total Income, and Total Expenses** with net savings rate indicators.
- **Monthly Budget Tracking**: Visual progress bar indicating percentage used, remaining allowance, and color-coded status badges (`Healthy`, `Approaching Limit`, `Budget Exceeded`).
- **Default Portfolio Scenario Loaded**:
  - **Income**: ₹30,000
  - **Expenses**: ₹18,500
  - **Balance**: ₹11,500
  - **Monthly Budget**: ₹25,000
  - **Budget Used**: 74%

### 2. 📊 Interactive Visual Analytics
- **Income vs. Expenses Trend Chart**: 6-month historical cash flow comparison with switchable Area and Bar views.
- **Category Expense Breakdown**: Interactive Donut chart with category percentage breakdown, hover tooltips, and ranked legends.

### 3. 💳 Complete Transaction Management
- **Manual Income & Expense Recording**: Fast modal with quick-amount chips, category grid with custom icons, date pickers, payment methods, and notes.
- **Search & Multi-Filter Engine**: Filter transactions in real-time by search query, type (Income / Expense), category, date range (This Month, Last Month, All Time), and sorting.
- **Data Export**: One-click **CSV** and **JSON** ledger exports for offline records.
- **CRUD Operations**: Add, View, Edit, and Delete transactions with safety confirmation dialogs.

### 4. 🎯 Monthly Budget Planning & Envelopes
- Overall monthly target setting.
- Granular category-wise budget envelopes (Rent, Food, Bills, Shopping, Travel, Entertainment, etc.) with real-time percentage consumption tracking.

### 5. ☁️ AWS Cloud Architecture Showcase & SNS Simulator
- **Inspect Cloud Architecture Modal**: Interactive blueprint explaining DynamoDB Single-Table schemas, API Gateway REST routes, Cognito JWT verification, and EventBridge cron jobs.
- **Amazon SNS Email Notification Simulator**: Configure notification email, budget overrun threshold alerts, and simulate Lambda triggering `sns.publish()` with a real-time email preview.

---

## 🏛️ AWS Serverless Architecture Design

```
[ Frontend: React + TS + Tailwind (S3 + CloudFront) ]
                          │
       ┌──────────────────┴──────────────────┐
       ▼                                     ▼
[ Amazon Cognito User Pools ]     [ Amazon API Gateway (REST API) ]
  • JWT Auth (ID / Access / Refresh)        │ (Cognito Authorizer)
  • User Profiles & Password Resets         ▼
                                  [ AWS Lambda Microservices ]
                                  • /transactions (CRUD)
                                  • /budget (Read / Write)
                                  • /reports (Aggregations)
                                            │
                                            ▼
                                  [ Amazon DynamoDB ]
                                  • Single-Table Design
                                  • PK: USER#<id> | SK: TX#<date>#<id>
                                            ▲
                                            │
[ Amazon EventBridge (Monthly Cron) ] ──────┘
  └──> [ AWS Lambda Summary Worker ] ──> [ Amazon SNS Topic ] ──> [ User Email Inbox ]
```

---

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom fintech color palette and responsive layouts
- **Charts & Data Viz**: Recharts
- **Icons**: Lucide React
- **Architecture**: Modular Adapter / Service Layer Pattern (`src/services/apiService.ts`, `src/services/authService.ts`) ready for immediate AWS SDK plug-in.

---

## 💻 Running the Application Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev

# 3. Build for production
npm run build
```

Open your browser at `http://localhost:3000` to interact with the application.
