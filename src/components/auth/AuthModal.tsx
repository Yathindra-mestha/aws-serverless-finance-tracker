import React, { useState } from 'react';
import { Cloud, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, isLoading } = useAuth();

  if (!isOpen) return null;

  const inputClass =
    'w-full bg-slate-900/60 border border-slate-800/80 focus:border-indigo-500/70 focus:ring-2 focus:ring-indigo-500/15 rounded-xl py-2.5 text-[14px] text-slate-100 placeholder-slate-600 outline-none transition-all';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(10px)' }}
    >
      <div className="w-full max-w-[400px] animate-scale-in">
        <div className="bg-[#0b1120] border border-white/[0.08] rounded-2xl overflow-hidden shadow-card-lg">

          {/* Top stripe */}
          <div className="header-stripe" />

          {/* Hero section */}
          <div className="relative px-7 pt-8 pb-6 text-center">

            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-indigo mb-4">
              <Cloud className="w-7 h-7 text-white" strokeWidth={2} />
            </div>

            <h1
              className="text-[20px] font-extrabold text-white"
              style={{ letterSpacing: '-0.03em' }}
            >
              Welcome to FinTrack Cloud
            </h1>
            <p className="text-[13px] text-slate-400 mt-1.5 font-medium">
              Powered by AWS Serverless Architecture
            </p>

            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-[#FF9900]/10 border border-[#FF9900]/20 rounded-full">
              <span className="live-dot w-1.5 h-1.5" />
              <span className="text-[10px] font-bold text-[#FF9900] font-mono tracking-[0.06em]">
                Cognito · API Gateway · Lambda · DynamoDB
              </span>
            </div>
          </div>



          {/* Form */}
          <div className="px-6 pb-7 space-y-3.5">
            <button
              onClick={() => login()} disabled={isLoading}
              className="w-full py-2.5 rounded-xl text-[14px] font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo transition-all active:scale-[0.98] disabled:opacity-60"
              style={{ letterSpacing: '-0.01em' }}
            >
              {isLoading ? 'Authenticating…' : 'Sign In with AWS Cognito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
