import React, { useState } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionList } from './components/transactions/TransactionList';
import { BudgetManager } from './components/budget/BudgetManager';
import { BudgetView } from './components/budget/BudgetView';
import { RecurringView } from './components/recurring/RecurringView';
import { TransactionModal } from './components/transactions/TransactionModal';
import { DeleteConfirmModal } from './components/transactions/DeleteConfirmModal';
import { AwsArchitectureModal } from './components/aws/AwsArchitectureModal';
import { AwsLiveConsoleDrawer } from './components/aws/AwsLiveConsoleDrawer';
import { AuthModal } from './components/auth/AuthModal';
import { ProfileView } from './components/profile/ProfileView';
import { Transaction, TransactionType } from './types';
import { Layers, RotateCcw, Shield, Cloud, ListOrdered, Target, RefreshCw } from 'lucide-react';

// ── Toast ────────────────────────────────────────────────────
const Toast: React.FC = () => {
  return null; // handled by ToastContext internally
};

// ── Main App Shell ──────────────────────────────────────────
const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { clearToZero, revertToSampleData } = useFinance();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddTxModalOpen, setIsAddTxModalOpen] = useState(false);
  const [addTxType, setAddTxType] = useState<TransactionType>('expense');
  const [isEditTxModalOpen, setIsEditTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [isAwsModalOpen, setIsAwsModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const handleOpenAddTxModal = (type: TransactionType) => {
    setAddTxType(type);
    setIsAddTxModalOpen(true);
  };
  const handleEditTx = (tx: Transaction) => { setEditingTx(tx); setIsEditTxModalOpen(true); };
  const handleDeleteTx = (tx: Transaction) => { setDeletingTx(tx); setIsDeleteModalOpen(true); };

  // Automatically keep modal closed when user is authenticated, open if not authenticated and not loading
  React.useEffect(() => {
    if (!isLoading) {
      setIsAuthModalOpen(!isAuthenticated);
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-white px-4">
        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-indigo animate-pulse mb-4">
          <Cloud className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
        <p className="text-base font-bold text-slate-200">Authenticating with AWS Cognito...</p>
        <p className="text-xs text-slate-500 mt-1.5 font-mono">Securing session · ap-south-1</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-500/30 selection:text-white pb-[calc(76px+env(safe-area-inset-bottom))] md:pb-0">

      {/* Header */}
      <Header
        onOpenAwsModal={() => setIsAwsModalOpen(true)}
        onOpenAddTxModal={handleOpenAddTxModal}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onOpenAddTxModal={handleOpenAddTxModal}
            onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
            onOpenAwsModal={() => setIsAwsModalOpen(true)}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onEditTransaction={handleEditTx}
            onDeleteTransaction={handleDeleteTx}
          />
        )}
        {activeTab === 'transactions' && (
          <TransactionList
            onOpenAddModal={handleOpenAddTxModal}
            onEditTransaction={handleEditTx}
            onDeleteTransaction={handleDeleteTx}
          />
        )}
        {activeTab === 'budget' && (
          <BudgetView />
        )}
        {activeTab === 'recurring' && (
          <RecurringView />
        )}
        {activeTab === 'profile' && (
          <ProfileView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] bg-[#080C14]/80 backdrop-blur-sm py-4 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400 font-semibold">FinTrack Cloud</span>
            <span className="text-slate-700">•</span>
            <span>AWS Serverless Portfolio · ap-south-1</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => setIsAwsModalOpen(true)}
              className="text-[#FF9900]/80 hover:text-[#FF9900] font-semibold flex items-center gap-1 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" /> AWS Blueprint
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={clearToZero}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
              title="Reset all numbers and transactions to ₹0"
            >
              <RotateCcw className="w-3 h-3" /> Clear to Zero (₹0)
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={revertToSampleData}
              className="text-indigo-400/90 hover:text-indigo-300 flex items-center gap-1 transition-colors font-medium"
              title="Revert back to ₹30,000 / ₹18,500 sample portfolio"
            >
              <RotateCcw className="w-3 h-3 text-indigo-400" /> Revert to Sample Data
            </button>
          </div>
        </div>
      </footer>

      {/* ── Bottom Navigation (Mobile Only) ──────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080C14]/90 backdrop-blur-xl border-t border-white/[0.08] px-2 pb-[env(safe-area-inset-bottom)] animate-fade-up" style={{ animationDuration: '0.4s' }}>
        <div className="flex items-center justify-around h-16">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`group relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 active:scale-90 ${activeTab === 'transactions' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`relative flex items-center justify-center transition-all duration-300 ease-bounce ${activeTab === 'transactions' ? '-translate-y-1 scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'scale-100'}`}>
              <ListOrdered className="w-5 h-5" strokeWidth={activeTab === 'transactions' ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-semibold tracking-wide transition-all duration-300 ${activeTab === 'transactions' ? 'opacity-100 font-bold' : 'opacity-80'}`}>Transactions</span>
            
            {/* Active indicator dot */}
            <div className={`absolute bottom-1 w-1 h-1 rounded-full bg-indigo-400 transition-all duration-300 ${activeTab === 'transactions' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
          </button>
          
          <button
            onClick={() => setActiveTab('budget')}
            className={`group relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 active:scale-90 ${activeTab === 'budget' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`relative flex items-center justify-center transition-all duration-300 ease-bounce ${activeTab === 'budget' ? '-translate-y-1 scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'scale-100'}`}>
              <Target className="w-5 h-5" strokeWidth={activeTab === 'budget' ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-semibold tracking-wide transition-all duration-300 ${activeTab === 'budget' ? 'opacity-100 font-bold' : 'opacity-80'}`}>Budget</span>
            
            {/* Active indicator dot */}
            <div className={`absolute bottom-1 w-1 h-1 rounded-full bg-indigo-400 transition-all duration-300 ${activeTab === 'budget' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
          </button>
          
          <button
            onClick={() => setActiveTab('recurring')}
            className={`group relative flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 active:scale-90 ${activeTab === 'recurring' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`relative flex items-center justify-center transition-all duration-300 ease-bounce ${activeTab === 'recurring' ? '-translate-y-1 scale-110 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'scale-100'}`}>
              <RefreshCw className="w-5 h-5" strokeWidth={activeTab === 'recurring' ? 2.5 : 2} />
            </div>
            <span className={`text-[10px] font-semibold tracking-wide transition-all duration-300 ${activeTab === 'recurring' ? 'opacity-100 font-bold' : 'opacity-80'}`}>Recurring</span>
            
            {/* Active indicator dot */}
            <div className={`absolute bottom-1 w-1 h-1 rounded-full bg-indigo-400 transition-all duration-300 ${activeTab === 'recurring' ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`} />
          </button>
        </div>
      </nav>

      {/* ── All Modals ─────────────────────────────────────────── */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      <TransactionModal
        isOpen={isAddTxModalOpen}
        onClose={() => setIsAddTxModalOpen(false)}
        initialType={addTxType}
      />
      <TransactionModal
        isOpen={isEditTxModalOpen}
        onClose={() => { setIsEditTxModalOpen(false); setEditingTx(null); }}
        editingTransaction={editingTx}
      />
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeletingTx(null); }}
        transaction={deletingTx}
      />
      <AwsArchitectureModal isOpen={isAwsModalOpen} onClose={() => setIsAwsModalOpen(false)} />
      {isBudgetModalOpen && <BudgetManager onClose={() => setIsBudgetModalOpen(false)} />}

      {/* Live Console Drawer */}
      <AwsLiveConsoleDrawer />
    </div>
  );
};

// ── Root ─────────────────────────────────────────────────────
import { AuthProvider as OidcProvider } from 'react-oidc-context';
import { WebStorageStateStore } from 'oidc-client-ts';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const redirectUri = isLocal ? 'http://localhost:3000/' : 'https://fintrack-yathindra.vercel.app/';

const oidcConfig = {
  authority: "https://cognito-idp.ap-south-1.amazonaws.com/ap-south-1_B1MTK1D8V",
  client_id: "7m94kecke7n9h6g4216e4cgg0o",
  redirect_uri: redirectUri,
  response_type: "code",
  scope: "email openid phone",
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  automaticSilentRenew: true,
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

const AppWithProviders: React.FC = () => {
  return (
    <OidcProvider {...oidcConfig}>
      <ToastProvider>
        <AuthProvider>
          <FinanceProvider>
            <MainLayout />
          </FinanceProvider>
        </AuthProvider>
      </ToastProvider>
    </OidcProvider>
  );
};

export { AppWithProviders as App };
export default AppWithProviders;
