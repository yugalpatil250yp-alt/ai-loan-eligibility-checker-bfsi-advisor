import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { LoanEligibilityChecker } from './components/LoanEligibilityChecker';
import { LoanRepaymentCalculator } from './components/LoanRepaymentCalculator';
import { LoanComparison } from './components/LoanComparison';
import { CreditScoreAnalyzer } from './components/CreditScoreAnalyzer';
import { EmiCalculator } from './components/EmiCalculator';
import { FinancialTips } from './components/FinancialTips';
import { SpreadsheetHub } from './components/SpreadsheetHub';
import { BotYash } from './components/BotYash';
import { Currency, ApplicantProfile, FinancialRecord, LoanEligibilityResult } from './types';
import { PRESET_PROFILES, formatCurrency } from './utils/formatters';
import { 
  Bot, 
  MessageSquareCode, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('eligibility');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [activeProfile, setActiveProfile] = useState<ApplicantProfile>(PRESET_PROFILES[0].data);
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [isYashOpen, setIsYashOpen] = useState<boolean>(false);
  const [yashContext, setYashContext] = useState<any>({
    applicantName: PRESET_PROFILES[0].data.name,
    monthlyIncome: `$${PRESET_PROFILES[0].data.monthlyIncome}`,
    existingEmis: `$${PRESET_PROFILES[0].data.existingEmis}`,
    creditScore: PRESET_PROFILES[0].data.creditScore,
    loanType: PRESET_PROFILES[0].data.loanType,
    requestedAmount: `$${PRESET_PROFILES[0].data.requestedAmount}`,
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load persistent records from server on mount
  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/records');
      const data = await res.json();
      if (data.success && Array.isArray(data.records)) {
        setRecords(data.records);
      }
    } catch (err) {
      console.warn('Failed to load server records:', err);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Save new record to server persistence
  const handleSaveRecord = async (recordData: any) => {
    try {
      const newRecordPayload: FinancialRecord = {
        id: recordData.id || `rec-${Date.now()}`,
        timestamp: recordData.timestamp || new Date().toISOString(),
        applicantName: recordData.applicantName || activeProfile.name,
        type: recordData.type || 'loan_check',
        category: recordData.loanType || recordData.category || 'Loan Determination',
        monthlyIncome: recordData.monthlyIncome || activeProfile.monthlyIncome,
        existingEmis: recordData.existingEmis || activeProfile.existingEmis,
        creditScore: recordData.creditScore || activeProfile.creditScore,
        requestedAmount: recordData.requestedAmount || activeProfile.requestedAmount,
        eligibleAmount: recordData.maxEligibleLoan || recordData.eligibleAmount || 0,
        foirPercent: recordData.resultingFoir || recordData.foirPercent || 0,
        dtiPercent: recordData.currentDti || recordData.dtiPercent || 0,
        approvalProbability: recordData.approvalProbability || 85,
        riskRating: recordData.riskRating || 'Prime',
        estimatedInterestRate: recordData.baseInterestRate || recordData.estimatedInterestRate,
        monthlyEmi: recordData.requestedMonthlyEmi || recordData.monthlyEmi,
        keyInsights: recordData.recommendations || recordData.keyInsights || [
          `Credit score: ${recordData.creditScore || activeProfile.creditScore}`,
          `FOIR calculation: ${recordData.resultingFoir || 42}%`
        ],
        aiReasoning: recordData.aiReasoning || 'Institutional assessment evaluated and preserved for session auditing.',
      };

      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecordPayload),
      });

      const resData = await res.json();
      if (resData.success) {
        setRecords(prev => [resData.record, ...prev.filter(r => r.id !== resData.record.id)]);
        triggerToast('Audit entry saved to Persistent Google Sheets Log');
      }
    } catch (err) {
      console.error('Failed to save record:', err);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      await fetch(`/api/records/${id}`, { method: 'DELETE' });
      setRecords(prev => prev.filter(r => r.id !== id));
      triggerToast('Record removed from persistence ledger');
    } catch (err) {
      console.error('Error deleting record:', err);
    }
  };

  const handleSelectPreset = (preset: ApplicantProfile) => {
    setActiveProfile(preset);
    setYashContext({
      applicantName: preset.name,
      monthlyIncome: formatCurrency(preset.monthlyIncome, currency),
      existingEmis: formatCurrency(preset.existingEmis, currency),
      creditScore: preset.creditScore,
      loanType: preset.loanType,
      requestedAmount: formatCurrency(preset.requestedAmount, currency),
    });
    triggerToast(`Loaded Profile: ${preset.name}`);
  };

  const handleOpenYashWithContext = (context: any) => {
    setYashContext(context);
    setIsYashOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 font-sans">
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-10 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currency={currency}
        setCurrency={setCurrency}
        onSelectPreset={handleSelectPreset}
        onOpenYashChat={() => setIsYashOpen(true)}
        storedRecordsCount={records.length}
      />

      {/* Main Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Active Tab View Rendering */}
        {activeTab === 'eligibility' && (
          <LoanEligibilityChecker
            currency={currency}
            activeProfile={activeProfile}
            setActiveProfile={setActiveProfile}
            onSaveToSheet={handleSaveRecord}
            onOpenYashChatWithContext={handleOpenYashWithContext}
          />
        )}

        {activeTab === 'repayment' && (
          <LoanRepaymentCalculator
            currency={currency}
            initialBalance={activeProfile.requestedAmount}
            initialRate={activeProfile.loanType === 'Home Loan' ? 7.2 : 8.5}
            initialTenureYears={activeProfile.tenureYears}
            initialSurplus={Math.max(400, Math.round(activeProfile.monthlyIncome * 0.25))}
            onSaveToSheet={handleSaveRecord}
            onOpenYashChatWithContext={handleOpenYashWithContext}
          />
        )}

        {activeTab === 'compare' && (
          <LoanComparison
            currency={currency}
            borrowerIncome={activeProfile.monthlyIncome}
            onSaveToSheet={handleSaveRecord}
            onOpenYashChatWithContext={handleOpenYashWithContext}
          />
        )}

        {activeTab === 'credit' && (
          <CreditScoreAnalyzer
            currency={currency}
            initialScore={activeProfile.creditScore}
            onSaveToSheet={handleSaveRecord}
            onOpenYashChatWithContext={handleOpenYashWithContext}
          />
        )}

        {activeTab === 'emi' && (
          <EmiCalculator
            currency={currency}
            initialPrincipal={activeProfile.requestedAmount}
            initialRate={activeProfile.loanType === 'Home Loan' ? 7.2 : 9.5}
            initialTenureYears={activeProfile.tenureYears}
            onSaveToSheet={handleSaveRecord}
            onOpenYashChatWithContext={handleOpenYashWithContext}
          />
        )}

        {activeTab === 'tips' && (
          <FinancialTips
            currency={currency}
            income={activeProfile.monthlyIncome}
            existingEmis={activeProfile.existingEmis}
            onSaveToSheet={handleSaveRecord}
            onOpenYashChatWithContext={handleOpenYashWithContext}
          />
        )}

        {activeTab === 'sheet' && (
          <SpreadsheetHub
            currency={currency}
            records={records}
            onDeleteRecord={handleDeleteRecord}
            onRefreshRecords={fetchRecords}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 backdrop-blur-xl py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 font-semibold">FinYash BFSI AI Platform</span>
            <span>•</span>
            <span>Intelligent Loan Underwriting & Financial Analytics</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-cyan-400 font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              Powered by Gemini 3.8 Flash
            </span>
            <span>•</span>
            <button 
              onClick={() => setActiveTab('sheet')} 
              className="hover:text-slate-300 transition flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{records.length} Persistence Records</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 border border-emerald-500/50 text-white text-xs font-semibold shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Bot Yash Launcher (when chat closed) */}
      {!isYashOpen && (
        <button
          onClick={() => setIsYashOpen(true)}
          className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-40 group flex items-center gap-2.5 p-3 sm:px-4 sm:py-3 rounded-2xl bg-gradient-to-r from-cyan-600 via-emerald-600 to-teal-500 text-white shadow-xl shadow-cyan-600/30 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all duration-200"
          title="Open Yash - AI BFSI Financial Advisor"
        >
          <div className="relative">
            <Bot className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-300 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold leading-tight flex items-center gap-1">
              <span>Ask Yash</span>
              <Sparkles className="w-3 h-3 text-cyan-200" />
            </div>
            <div className="text-[10px] text-cyan-100 font-medium">BFSI Advisor Bot</div>
          </div>
        </button>
      )}

      {/* Bot Yash Interactive AI Component */}
      <BotYash
        isOpen={isYashOpen}
        onClose={() => setIsYashOpen(false)}
        userContext={yashContext}
      />

    </div>
  );
}
