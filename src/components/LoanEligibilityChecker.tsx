import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Building2, 
  Save, 
  MessageSquareCode, 
  Users, 
  HelpCircle,
  ArrowRight,
  Info,
  BadgePercent
} from 'lucide-react';
import { Currency, LoanType, EmploymentType, ApplicantProfile, LoanEligibilityResult } from '../types';
import { formatCurrency, calculateEmi } from '../utils/formatters';

interface LoanEligibilityCheckerProps {
  currency: Currency;
  activeProfile: ApplicantProfile;
  setActiveProfile: React.Dispatch<React.SetStateAction<ApplicantProfile>>;
  onSaveToSheet: (result: LoanEligibilityResult) => void;
  onOpenYashChatWithContext: (context: any) => void;
}

const LOAN_TYPES: { id: LoanType; label: string; icon: string; avgRate: number; maxTenure: number }[] = [
  { id: 'Personal Loan', label: 'Personal Loan', icon: '👤', avgRate: 10.5, maxTenure: 7 },
  { id: 'Home Loan', label: 'Home / Mortgage', icon: '🏡', avgRate: 7.2, maxTenure: 30 },
  { id: 'Auto Loan', label: 'Auto / Car Loan', icon: '🚗', avgRate: 8.4, maxTenure: 7 },
  { id: 'Business Loan', label: 'Business / MSME', icon: '💼', avgRate: 11.2, maxTenure: 10 },
  { id: 'Education Loan', label: 'Education Loan', icon: '🎓', avgRate: 8.9, maxTenure: 15 },
];

export const LoanEligibilityChecker: React.FC<LoanEligibilityCheckerProps> = ({
  currency,
  activeProfile,
  setActiveProfile,
  onSaveToSheet,
  onOpenYashChatWithContext,
}) => {
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiResult, setAiResult] = useState<LoanEligibilityResult | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Live Math calculations
  const totalIncome = activeProfile.monthlyIncome + (activeProfile.hasCoApplicant ? activeProfile.coApplicantIncome : 0);
  const totalExistingDebt = activeProfile.existingEmis + activeProfile.otherObligations;

  // Maximum allowable FOIR: 50% standard, up to 60% for high earners
  const maxFoirRatio = totalIncome >= 10000 ? 0.60 : totalIncome >= 4000 ? 0.50 : 0.40;
  const maxAllowableEmi = totalIncome * maxFoirRatio;
  const availableMonthlyCapacity = Math.max(0, maxAllowableEmi - totalExistingDebt);

  // Estimated interest rate baseline
  const activeLoanConfig = LOAN_TYPES.find(l => l.id === activeProfile.loanType) || LOAN_TYPES[0];
  let estimatedRate = activeLoanConfig.avgRate;
  if (activeProfile.creditScore >= 780) estimatedRate -= 0.6;
  else if (activeProfile.creditScore >= 740) estimatedRate -= 0.2;
  else if (activeProfile.creditScore < 640) estimatedRate += 2.5;

  // Max eligible loan amount using Present Value annuity formula
  const monthlyRate = (estimatedRate / 100) / 12;
  const totalMonths = activeProfile.tenureYears * 12;
  const maxEligibleLoan = availableMonthlyCapacity > 0
    ? Math.round(availableMonthlyCapacity * ((1 - Math.pow(1 + monthlyRate, -totalMonths)) / monthlyRate))
    : 0;

  // Requested loan EMI
  const requestedMonthlyEmi = calculateEmi(activeProfile.requestedAmount, estimatedRate, totalMonths);
  const resultingFoir = totalIncome > 0 ? Math.round(((totalExistingDebt + requestedMonthlyEmi) / totalIncome) * 1000) / 10 : 0;
  const currentDti = totalIncome > 0 ? Math.round((totalExistingDebt / totalIncome) * 1000) / 10 : 0;

  // Quick mathematical approval score
  let instantApprovalProb = 50;
  if (activeProfile.creditScore >= 750) instantApprovalProb += 25;
  else if (activeProfile.creditScore >= 700) instantApprovalProb += 15;
  else if (activeProfile.creditScore < 620) instantApprovalProb -= 25;

  if (resultingFoir <= 40) instantApprovalProb += 20;
  else if (resultingFoir <= 50) instantApprovalProb += 10;
  else if (resultingFoir > 60) instantApprovalProb -= 30;
  instantApprovalProb = Math.max(5, Math.min(97, instantApprovalProb));

  const handleRunAiUnderwriting = async () => {
    setLoadingAi(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/ai/loan-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantName: activeProfile.name,
          monthlyIncome: totalIncome,
          existingEmis: totalExistingDebt,
          requestedAmount: activeProfile.requestedAmount,
          tenureYears: activeProfile.tenureYears,
          loanType: activeProfile.loanType,
          creditScore: activeProfile.creditScore,
          employmentType: activeProfile.employmentType,
          workExperienceYears: activeProfile.workExperienceYears,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAiResult(data);
      }
    } catch (err) {
      console.error('Failed to run AI loan underwriting:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSaveResult = () => {
    const recordToSave: LoanEligibilityResult = aiResult || {
      applicantName: activeProfile.name,
      monthlyIncome: totalIncome,
      existingEmis: totalExistingDebt,
      creditScore: activeProfile.creditScore,
      requestedAmount: activeProfile.requestedAmount,
      tenureYears: activeProfile.tenureYears,
      loanType: activeProfile.loanType,
      maxEligibleLoan,
      requestedMonthlyEmi,
      availableMonthlyCapacity: Math.round(availableMonthlyCapacity),
      resultingFoir,
      currentDti,
      baseInterestRate: Number(estimatedRate.toFixed(2)),
      approvalProbability: instantApprovalProb,
      riskRating: instantApprovalProb >= 75 ? 'Prime' : instantApprovalProb >= 55 ? 'Near-Prime' : 'Sub-Prime',
      aiReasoning: `Automated assessment: FOIR calculated at ${resultingFoir}% with credit score of ${activeProfile.creditScore}. Maximum eligibility capped at ${formatCurrency(maxEligibleLoan, currency)}.`,
      recommendations: [
        'Keep overall credit card utilization below 30% to protect credit score.',
        'Review bank statements to ensure consistent salary/revenue credits.'
      ],
      bankComparison: [
        { bank: 'Tier 1 Bank', product: activeProfile.loanType, rate: `${estimatedRate.toFixed(2)}%`, maxLtv: '85%', verdict: 'Recommended' },
      ],
    };

    onSaveToSheet(recordToSave);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  // Helper for FOIR color
  const getFoirColor = (foir: number) => {
    if (foir <= 40) return { text: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', label: 'Healthy & Safe' };
    if (foir <= 50) return { text: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', label: 'Acceptable Tier' };
    if (foir <= 60) return { text: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', label: 'Elevated Risk' };
    return { text: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/40', label: 'Critical / Over-leveraged' };
  };

  const foirStatus = getFoirColor(resultingFoir);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-cyan-950/40 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Institutional BFSI Underwriting Simulation
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Loan Eligibility Checker
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl mt-1 leading-relaxed">
              Calculate debt-to-income (DTI), Fixed Obligation to Income Ratio (FOIR), maximum eligible loan amount, and get real-time underwriting analysis powered by Gemini AI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleSaveResult}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg ${
                saveSuccess
                  ? 'bg-emerald-600 text-white border border-emerald-400'
                  : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700'
              }`}
            >
              {saveSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4 text-cyan-400" />}
              <span>{saveSuccess ? 'Logged to Persistence Sheet!' : 'Log to Sheet'}</span>
            </button>

            <button
              onClick={() => onOpenYashChatWithContext({
                applicantName: activeProfile.name,
                monthlyIncome: totalIncome,
                existingEmis: totalExistingDebt,
                creditScore: activeProfile.creditScore,
                loanType: activeProfile.loanType,
                requestedAmount: activeProfile.requestedAmount,
              })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-700/60 transition shadow-sm"
            >
              <MessageSquareCode className="w-4 h-4 text-cyan-400" />
              <span>Ask Advisor Yash</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs vs Live Underwriting Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form & Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-6">
            
            {/* Loan Type Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                Select Loan Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LOAN_TYPES.map((type) => {
                  const isSelected = activeProfile.loanType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setActiveProfile(prev => ({ 
                        ...prev, 
                        loanType: type.id,
                        tenureYears: Math.min(prev.tenureYears, type.maxTenure)
                      }))}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl text-xs font-semibold transition text-left border ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-950/80 to-emerald-950/80 border-cyan-500/60 text-cyan-200 shadow-md shadow-cyan-900/20'
                          : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="text-lg">{type.icon}</span>
                      <div>
                        <div className="font-bold text-slate-200">{type.label}</div>
                        <div className="text-[10px] text-slate-400">~{type.avgRate}% APR</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Applicant Name & Employment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Applicant Name
                </label>
                <input
                  type="text"
                  value={activeProfile.name}
                  onChange={(e) => setActiveProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition"
                  placeholder="e.g. Vikram Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Employment Status
                </label>
                <select
                  value={activeProfile.employmentType}
                  onChange={(e) => setActiveProfile(prev => ({ ...prev, employmentType: e.target.value as EmploymentType }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition"
                >
                  <option value="Salaried">Salaried Employee</option>
                  <option value="Self-Employed Professional">Self-Employed Professional (Doctor/CA/Lawyer)</option>
                  <option value="Business Owner">Business Owner / MSME</option>
                  <option value="Gig / Freelancer">Gig / Freelancer / Consultant</option>
                </select>
              </div>
            </div>

            {/* Monthly In-hand Income & Existing EMIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Net Monthly Income
                  </label>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {formatCurrency(activeProfile.monthlyIncome, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="40000"
                  step="250"
                  value={activeProfile.monthlyIncome}
                  onChange={(e) => setActiveProfile(prev => ({ ...prev, monthlyIncome: Number(e.target.value) }))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <input
                  type="number"
                  value={activeProfile.monthlyIncome}
                  onChange={(e) => setActiveProfile(prev => ({ ...prev, monthlyIncome: Number(e.target.value) }))}
                  className="mt-2 w-full px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Existing Monthly EMIs & Loans
                  </label>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {formatCurrency(activeProfile.existingEmis, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15000"
                  step="100"
                  value={activeProfile.existingEmis}
                  onChange={(e) => setActiveProfile(prev => ({ ...prev, existingEmis: Number(e.target.value) }))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <input
                  type="number"
                  value={activeProfile.existingEmis}
                  onChange={(e) => setActiveProfile(prev => ({ ...prev, existingEmis: Number(e.target.value) }))}
                  className="mt-2 w-full px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Credit Score Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Credit Score (CIBIL / Experian / FICO)
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    activeProfile.creditScore >= 750 ? 'bg-emerald-500/20 text-emerald-300' :
                    activeProfile.creditScore >= 680 ? 'bg-cyan-500/20 text-cyan-300' :
                    activeProfile.creditScore >= 600 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {activeProfile.creditScore >= 750 ? 'Excellent' : activeProfile.creditScore >= 680 ? 'Good' : activeProfile.creditScore >= 600 ? 'Fair' : 'Subprime'}
                  </span>
                </div>
                <span className="text-base font-mono font-bold text-cyan-400">
                  {activeProfile.creditScore}
                </span>
              </div>
              <input
                type="range"
                min="300"
                max="900"
                step="5"
                value={activeProfile.creditScore}
                onChange={(e) => setActiveProfile(prev => ({ ...prev, creditScore: Number(e.target.value) }))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>300 (Poor)</span>
                <span>600 (Fair)</span>
                <span>720 (Good)</span>
                <span>780+ (Prime)</span>
                <span>900</span>
              </div>
            </div>

            {/* Requested Loan Amount & Tenure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Requested Loan Principal
                  </label>
                  <span className="text-xs font-mono font-bold text-white">
                    {formatCurrency(activeProfile.requestedAmount, currency)}
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="1000000"
                  step="5000"
                  value={activeProfile.requestedAmount}
                  onChange={(e) => setActiveProfile(prev => ({ ...prev, requestedAmount: Number(e.target.value) }))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <input
                  type="number"
                  value={activeProfile.requestedAmount}
                  onChange={(e) => setActiveProfile(prev => ({ ...prev, requestedAmount: Number(e.target.value) }))}
                  className="mt-2 w-full px-3 py-1.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200 text-xs font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Loan Tenure (Years)
                  </label>
                  <span className="text-xs font-mono font-bold text-white">
                    {activeProfile.tenureYears} Years ({activeProfile.tenureYears * 12} mo)
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={activeLoanConfig.maxTenure}
                  step="1"
                  value={activeProfile.tenureYears}
                  onChange={(e) => setActiveProfile(prev => ({ ...prev, tenureYears: Number(e.target.value) }))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                  <span>1 Year</span>
                  <span>Max: {activeLoanConfig.maxTenure} Yrs</span>
                </div>
              </div>
            </div>

            {/* Co-Applicant Joint Loan Toggle */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-300">Add Co-Applicant (Boosts Eligibility by ~40-60%)</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeProfile.hasCoApplicant}
                    onChange={(e) => setActiveProfile(prev => ({ ...prev, hasCoApplicant: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              {activeProfile.hasCoApplicant && (
                <div className="mt-4 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/30 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-[11px] font-semibold text-cyan-300 mb-1">
                      Co-Applicant Monthly Income
                    </label>
                    <input
                      type="number"
                      value={activeProfile.coApplicantIncome}
                      onChange={(e) => setActiveProfile(prev => ({ ...prev, coApplicantIncome: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:border-cyan-500"
                      placeholder="e.g. 4000"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-cyan-300 mb-1">
                      Co-Applicant Credit Score
                    </label>
                    <input
                      type="number"
                      value={activeProfile.coApplicantScore}
                      onChange={(e) => setActiveProfile(prev => ({ ...prev, coApplicantScore: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono focus:border-cyan-500"
                      placeholder="e.g. 750"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Run AI Analysis Action Button */}
            <button
              onClick={handleRunAiUnderwriting}
              disabled={loadingAi}
              className="w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-cyan-600 via-emerald-600 to-teal-500 hover:from-cyan-500 hover:to-emerald-400 active:scale-[0.99] transition shadow-xl shadow-cyan-600/30 flex items-center justify-center gap-2.5 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${loadingAi ? 'animate-spin' : 'text-cyan-200'}`} />
              <span>{loadingAi ? 'Synthesizing BFSI Underwriter Decision...' : 'Run Gemini Underwriting Engine'}</span>
            </button>

          </div>
        </div>

        {/* Right Column: Live Mathematical Underwriting Gauge & Cards */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Real-Time Mathematical Summary Card */}
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Live Assessment</span>
                <h3 className="text-lg font-bold text-white">Underwriting Metrics</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${foirStatus.bg} ${foirStatus.text} ${foirStatus.border}`}>
                {foirStatus.label}
              </span>
            </div>

            {/* Maximum Loan Eligibility Output */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-cyan-950/30 border border-slate-800">
              <div className="text-xs text-slate-400 mb-1">Max Eligible Loan Amount</div>
              <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-300 font-mono">
                {formatCurrency(maxEligibleLoan, currency)}
              </div>
              <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                <span>
                  Based on {maxFoirRatio * 100}% max FOIR cap and monthly EMI capacity of{' '}
                  <strong className="text-slate-200 font-mono">{formatCurrency(availableMonthlyCapacity, currency)}</strong>.
                </span>
              </div>
            </div>

            {/* Key Ratios Meter */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-0.5">Resulting FOIR</div>
                <div className={`text-xl font-bold font-mono ${foirStatus.text}`}>
                  {resultingFoir}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Bank benchmark: &lt;50%</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-0.5">Current DTI Ratio</div>
                <div className="text-xl font-bold font-mono text-cyan-400">
                  {currentDti}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Existing obligations</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-0.5">Estimated Rate</div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {estimatedRate.toFixed(2)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Risk-adjusted APR</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-0.5">Requested EMI</div>
                <div className="text-xl font-bold font-mono text-slate-200">
                  {formatCurrency(requestedMonthlyEmi, currency)}/mo
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">For {activeProfile.tenureYears} yrs</div>
              </div>
            </div>

            {/* Approval Probability Gauge */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">Approval Probability</span>
                <span className="font-mono font-bold text-cyan-400">{instantApprovalProb}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    instantApprovalProb >= 75 ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' :
                    instantApprovalProb >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-rose-500 to-red-600'
                  }`}
                  style={{ width: `${instantApprovalProb}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>High Risk (0-40%)</span>
                <span>Conditional (41-70%)</span>
                <span>Prime Approval (71-100%)</span>
              </div>
            </div>

          </div>

          {/* Quick Banking Takeaway Banner */}
          <div className="p-5 rounded-3xl bg-gradient-to-tr from-cyan-950/40 to-slate-900/80 border border-cyan-800/40 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 mt-0.5">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-cyan-200">Instant Underwriting Takeaway</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeProfile.requestedAmount <= maxEligibleLoan
                    ? `Great news! Your requested loan of ${formatCurrency(activeProfile.requestedAmount, currency)} is fully within your calculated limit of ${formatCurrency(maxEligibleLoan, currency)}.`
                    : `Attention: Requested amount exceeds current eligible limit by ${formatCurrency(activeProfile.requestedAmount - maxEligibleLoan, currency)}. Consider adding a co-applicant or extending tenure to ${activeLoanConfig.maxTenure} years.`}
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* AI Underwriter Detailed Analysis Output (when run) */}
      {aiResult && (
        <div className="rounded-3xl bg-slate-900/80 border border-cyan-500/30 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                <Sparkles className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">Institutional Underwriting Report</div>
                <h2 className="text-xl font-bold text-white">Gemini 3.8 Flash AI Risk Assessment</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                aiResult.riskRating === 'Prime' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                aiResult.riskRating === 'Near-Prime' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                Risk Rating: {aiResult.riskRating}
              </span>
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                Score: {aiResult.approvalProbability}%
              </span>
            </div>
          </div>

          {/* Underwriter Reasoning */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              Underwriter Reasoning & Synthesis
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {aiResult.aiReasoning}
            </p>
          </div>

          {/* Recommendations & Actionable Steps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Actionable Steps to Maximize Approval
              </h4>
              <ul className="space-y-2 text-xs text-slate-300">
                {aiResult.recommendations.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Bank Comparison Offers */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-cyan-400" />
                Comparative Bank Product Matches
              </h4>
              <div className="space-y-2">
                {aiResult.bankComparison?.map((bankOffer, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-200">{bankOffer.bank}</div>
                      <div className="text-[11px] text-slate-400">{bankOffer.product}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-emerald-400">{bankOffer.rate}</div>
                      <div className="text-[10px] text-cyan-400 font-medium">{bankOffer.verdict}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Ask Yash Button Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
            <p className="text-xs text-slate-400">
              Need personalized bank negotiation tips or help lowering your FOIR?
            </p>
            <button
              onClick={() => onOpenYashChatWithContext({
                applicantName: activeProfile.name,
                monthlyIncome: totalIncome,
                existingEmis: totalExistingDebt,
                creditScore: activeProfile.creditScore,
                loanType: activeProfile.loanType,
                requestedAmount: activeProfile.requestedAmount,
                aiReasoning: aiResult.aiReasoning,
              })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/60 transition"
            >
              <MessageSquareCode className="w-4 h-4" />
              <span>Discuss With Yash</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
