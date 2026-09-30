import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  Sparkles, 
  TrendingDown, 
  Clock, 
  CheckCircle2, 
  Save, 
  MessageSquareCode, 
  ArrowRight, 
  DollarSign, 
  Percent, 
  HelpCircle,
  Calendar,
  Layers,
  Award,
  TrendingUp,
  ShieldCheck,
  Scale
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Currency } from '../types';
import { formatCurrency, calculateEmi } from '../utils/formatters';

interface LoanRepaymentCalculatorProps {
  currency: Currency;
  initialBalance?: number;
  initialRate?: number;
  initialTenureYears?: number;
  initialSurplus?: number;
  onSaveToSheet: (result: any) => void;
  onOpenYashChatWithContext: (context: any) => void;
}

type AllocationMode = 'full' | 'balanced' | 'split' | 'custom';

export const LoanRepaymentCalculator: React.FC<LoanRepaymentCalculatorProps> = ({
  currency,
  initialBalance = 200000,
  initialRate = 7.5,
  initialTenureYears = 20,
  initialSurplus = 800,
  onSaveToSheet,
  onOpenYashChatWithContext,
}) => {
  const [balance, setBalance] = useState<number>(initialBalance);
  const [rate, setRate] = useState<number>(initialRate);
  const [tenureYears, setTenureYears] = useState<number>(initialTenureYears);
  const [monthlySurplus, setMonthlySurplus] = useState<number>(initialSurplus);
  const [allocationMode, setAllocationMode] = useState<AllocationMode>('full');
  const [customPrepayment, setCustomPrepayment] = useState<number>(Math.round(initialSurplus * 0.7));
  const [annualLumpSum, setAnnualLumpSum] = useState<number>(0);

  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiAdvice, setAiAdvice] = useState<any | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Compute effective extra monthly payment based on allocation mode
  const effectiveMonthlyPrepayment = useMemo(() => {
    if (allocationMode === 'full') return monthlySurplus;
    if (allocationMode === 'balanced') return Math.round(monthlySurplus * 0.75);
    if (allocationMode === 'split') return Math.round(monthlySurplus * 0.50);
    return Math.min(monthlySurplus, customPrepayment);
  }, [allocationMode, monthlySurplus, customPrepayment]);

  const allocatedToInvestment = Math.max(0, monthlySurplus - effectiveMonthlyPrepayment);

  // Baseline standard EMI and tenure
  const totalMonths = tenureYears * 12;
  const baseMonthlyEmi = calculateEmi(balance, rate, totalMonths);
  const standardTotalInterest = (baseMonthlyEmi * totalMonths) - balance;

  // Month-by-month acceleration simulation
  const simulation = useMemo(() => {
    const monthlyRate = (rate / 100) / 12;
    let acceleratedBal = balance;
    let standardBal = balance;
    let accTotalInterest = 0;
    let stdTotalInterest = 0;
    let accMonths = 0;
    let stdMonths = 0;

    const yearlyData: { 
      year: number; 
      label: string; 
      standardBalance: number; 
      acceleratedBalance: number; 
      cumulativeInterestSaved: number;
    }[] = [
      { 
        year: 0, 
        label: 'Start', 
        standardBalance: balance, 
        acceleratedBalance: balance, 
        cumulativeInterestSaved: 0 
      }
    ];

    const maxMonths = totalMonths;

    for (let m = 1; m <= maxMonths; m++) {
      // Standard loan step
      if (standardBal > 0) {
        const intPart = standardBal * monthlyRate;
        const princPart = Math.min(standardBal, baseMonthlyEmi - intPart);
        standardBal = Math.max(0, standardBal - princPart);
        stdTotalInterest += intPart;
        stdMonths++;
      }

      // Accelerated loan step with monthly prepayment + optional annual lump sum
      if (acceleratedBal > 0) {
        const isAnnualMonth = m % 12 === 0;
        const lumpSumThisMonth = isAnnualMonth ? annualLumpSum : 0;
        const intPart = acceleratedBal * monthlyRate;
        const totalPaymentThisMonth = baseMonthlyEmi + effectiveMonthlyPrepayment + lumpSumThisMonth;
        const princPart = Math.min(acceleratedBal, totalPaymentThisMonth - intPart);
        acceleratedBal = Math.max(0, acceleratedBal - princPart);
        accTotalInterest += intPart;
        accMonths++;
      }

      // Record yearly checkpoints
      if (m % 12 === 0 || m === maxMonths) {
        const y = Math.ceil(m / 12);
        yearlyData.push({
          year: y,
          label: `Yr ${y}`,
          standardBalance: Math.round(standardBal),
          acceleratedBalance: Math.round(acceleratedBal),
          cumulativeInterestSaved: Math.round(Math.max(0, stdTotalInterest - accTotalInterest)),
        });
      }
    }

    const monthsSaved = Math.max(0, stdMonths - accMonths);
    const interestSaved = Math.max(0, Math.round(stdTotalInterest - accTotalInterest));
    const totalExtraCapitalPaid = (effectiveMonthlyPrepayment * accMonths) + (annualLumpSum * Math.floor(accMonths / 12));
    const efficiencyRatio = totalExtraCapitalPaid > 0 ? (interestSaved / totalExtraCapitalPaid).toFixed(2) : '0';

    return {
      standardMonths: stdMonths,
      acceleratedMonths: accMonths,
      monthsSaved,
      yearsSaved: (monthsSaved / 12).toFixed(1),
      accTotalInterest: Math.round(accTotalInterest),
      stdTotalInterest: Math.round(stdTotalInterest),
      interestSaved,
      totalExtraCapitalPaid,
      efficiencyRatio,
      yearlyData,
    };
  }, [balance, rate, totalMonths, baseMonthlyEmi, effectiveMonthlyPrepayment, annualLumpSum]);

  // Projected Debt-Free Target Dates
  const standardPayoffDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + simulation.standardMonths);
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }, [simulation.standardMonths]);

  const acceleratedPayoffDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + simulation.acceleratedMonths);
    return d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  }, [simulation.acceleratedMonths]);

  // Run Gemini Underwriter Analysis
  const handleRunAiRepaymentPlan = async () => {
    setLoadingAi(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/ai/repayment-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outstandingBalance: balance,
          interestRate: rate,
          currentEmi: baseMonthlyEmi,
          remainingMonths: totalMonths,
          monthlySurplus,
          prepaymentAmount: effectiveMonthlyPrepayment,
          annualLumpSum,
          monthsSaved: simulation.monthsSaved,
          interestSaved: simulation.interestSaved,
        }),
      });
      const data = await res.json();
      if (data.success && data.advice) {
        setAiAdvice(data.advice);
      }
    } catch (err) {
      console.error('Error fetching repayment plan:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSaveToSheet = () => {
    const record = {
      id: `rec-repay-${Date.now()}`,
      applicantName: 'Applicant (Repayment Acceleration)',
      type: 'financial_plan',
      category: 'Loan Repayment & Surplus Accelerator',
      monthlyIncome: Math.round(monthlySurplus * 3.5),
      existingEmis: baseMonthlyEmi,
      creditScore: 750,
      requestedAmount: balance,
      eligibleAmount: balance,
      riskRating: 'Prime',
      approvalProbability: 98,
      estimatedInterestRate: rate,
      monthlyEmi: baseMonthlyEmi + effectiveMonthlyPrepayment,
      keyInsights: [
        `Base EMI: ${formatCurrency(baseMonthlyEmi, currency)}`,
        `Prepayment: +${formatCurrency(effectiveMonthlyPrepayment, currency)}/mo`,
        `Timeline Reduced: ${simulation.yearsSaved} Years earlier`,
        `Interest Saved: ${formatCurrency(simulation.interestSaved, currency)}`
      ],
      aiReasoning: aiAdvice?.executiveSummary || `Accelerated loan amortization: redirecting ${formatCurrency(effectiveMonthlyPrepayment, currency)}/month eliminates ${simulation.yearsSaved} years of repayment and saves ${formatCurrency(simulation.interestSaved, currency)} in compound interest.`,
    };

    onSaveToSheet(record);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/40 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
              <Zap className="w-4 h-4 text-emerald-400" />
              Surplus Optimization & Compound Interest Elimination
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Loan Repayment Calculator & Accelerator
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl mt-1 leading-relaxed">
              Input your monthly surplus and model how allocating extra capital directly to principal reduction collapses your loan tenure and saves thousands in compound interest.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveToSheet}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>{saveSuccess ? 'Saved to Persistence Log!' : 'Save Repayment Plan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Parameters vs Acceleration KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Loan Parameters & Surplus Configuration */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                1. Current Loan Parameters
              </h3>
              <span className="text-xs font-mono font-bold text-slate-400">
                Scheduled EMI: {formatCurrency(baseMonthlyEmi, currency)}/mo
              </span>
            </div>

            {/* Principal Balance Slider */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Remaining Loan Principal</label>
                <span className="text-xs font-mono font-bold text-cyan-400">{formatCurrency(balance, currency)}</span>
              </div>
              <input
                type="range"
                min="10000"
                max="800000"
                step="5000"
                value={balance}
                onChange={(e) => setBalance(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>{formatCurrency(10000, currency, true)}</span>
                <span>{formatCurrency(250000, currency, true)}</span>
                <span>{formatCurrency(500000, currency, true)}</span>
                <span>{formatCurrency(800000, currency, true)}</span>
              </div>
            </div>

            {/* Interest Rate & Tenure Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Interest Rate (% APR)</label>
                  <span className="text-xs font-mono font-bold text-emerald-400">{rate.toFixed(2)}%</span>
                </div>
                <input
                  type="range"
                  min="4.0"
                  max="20.0"
                  step="0.1"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Remaining Tenure</label>
                  <span className="text-xs font-mono font-bold text-slate-200">{tenureYears} Years ({totalMonths} mo)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>

            {/* Monthly Surplus Input Section */}
            <div className="pt-4 border-t border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>2. Monthly Surplus Capital</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">Total unallocated cash surplus left after all living expenses & debts</p>
                </div>
                <span className="text-lg font-mono font-bold text-emerald-400">
                  {formatCurrency(monthlySurplus, currency)}/mo
                </span>
              </div>

              <input
                type="range"
                min="100"
                max="5000"
                step="50"
                value={monthlySurplus}
                onChange={(e) => setMonthlySurplus(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />

              {/* Allocation Strategy Tabs */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Select Prepayment Surplus Allocation Strategy:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setAllocationMode('full')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      allocationMode === 'full'
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 shadow-md shadow-emerald-900/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs">100% Full Prepay</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Maximum speed</div>
                  </button>

                  <button
                    onClick={() => setAllocationMode('balanced')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      allocationMode === 'balanced'
                        ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200 shadow-md shadow-cyan-900/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs">75% Prepay</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">25% invest/save</div>
                  </button>

                  <button
                    onClick={() => setAllocationMode('split')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      allocationMode === 'split'
                        ? 'bg-purple-950/60 border-purple-500/60 text-purple-200 shadow-md shadow-purple-900/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs">50 / 50 Dual</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Equal balance</div>
                  </button>

                  <button
                    onClick={() => setAllocationMode('custom')}
                    className={`p-3 rounded-2xl border text-left transition ${
                      allocationMode === 'custom'
                        ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-200 shadow-md shadow-indigo-900/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold text-xs">Custom Slider</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Exact amount</div>
                  </button>
                </div>

                {allocationMode === 'custom' && (
                  <div className="mt-3 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 animate-in fade-in duration-150">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">Custom Monthly Prepayment:</span>
                      <span className="font-mono font-bold text-emerald-400">{formatCurrency(effectiveMonthlyPrepayment, currency)}</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max={monthlySurplus}
                      step="25"
                      value={customPrepayment}
                      onChange={(e) => setCustomPrepayment(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-300">Allocated to Loan Amortization:</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatCurrency(effectiveMonthlyPrepayment, currency)}/mo
                  </span>
                </div>

                {allocatedToInvestment > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                      <span className="text-slate-300">Remaining for Emergency / Index SIP:</span>
                    </div>
                    <span className="font-mono font-bold text-indigo-400">
                      {formatCurrency(allocatedToInvestment, currency)}/mo
                    </span>
                  </div>
                )}
              </div>

              {/* Optional Annual Lump Sum Input */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <label className="text-xs font-semibold text-slate-300">
                      Annual Lump Sum Bonus / Tax Refund
                    </label>
                  </div>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    +{formatCurrency(annualLumpSum, currency)}/year
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20000"
                  step="500"
                  value={annualLumpSum}
                  onChange={(e) => setAnnualLumpSum(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

            </div>

            {/* Run AI Analysis CTA */}
            <button
              onClick={handleRunAiRepaymentPlan}
              disabled={loadingAi}
              className="w-full py-3.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 active:scale-[0.99] transition shadow-xl shadow-emerald-800/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${loadingAi ? 'animate-spin' : 'text-emerald-200'}`} />
              <span>{loadingAi ? 'Formulating Prepayment Strategy with Gemini...' : 'Analyze Repayment Efficiency & ROI'}</span>
            </button>

          </div>
        </div>

        {/* Right Column: Mathematical Acceleration Results */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Headline Impact Card */}
          <div className="rounded-3xl bg-slate-900/70 border border-emerald-500/40 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Acceleration Outcome
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {simulation.yearsSaved} Years Faster
              </span>
            </div>

            {/* Total Interest Saved Highlight */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-emerald-950/30 border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Total Compound Interest Eliminated</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 font-mono my-1">
                {formatCurrency(simulation.interestSaved, currency)}
              </div>
              <p className="text-[11px] text-emerald-300/90 font-medium">
                100% guaranteed, tax-free financial return equivalent to {rate}% APR
              </p>
            </div>

            {/* Payoff Milestones Timeline */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 block mb-0.5">Original Payoff Date</span>
                <div className="text-base font-bold font-mono text-slate-300">{standardPayoffDate}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{totalMonths} monthly payments</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-emerald-800/40">
                <span className="text-[10px] text-emerald-400 block mb-0.5">New Debt-Free Date</span>
                <div className="text-base font-bold font-mono text-emerald-300">{acceleratedPayoffDate}</div>
                <div className="text-[10px] text-emerald-400/80 mt-0.5">{simulation.acceleratedMonths} monthly payments</div>
              </div>
            </div>

            {/* Multiplier Efficiency Metric */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Prepayment ROI Multiplier</span>
                <span className="font-mono font-bold text-cyan-400">
                  {simulation.efficiencyRatio}x Return
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                For every <strong className="text-white">$1</strong> of extra surplus prepaid into the loan, you wipe out approximately <strong className="text-emerald-400">${simulation.efficiencyRatio}</strong> in future interest penalties.
              </p>
            </div>

            {/* Quick Ask Yash Trigger */}
            <button
              onClick={() => onOpenYashChatWithContext({
                balance,
                rate,
                monthlySurplus,
                prepayment: effectiveMonthlyPrepayment,
                interestSaved: formatCurrency(simulation.interestSaved, currency),
                yearsSaved: simulation.yearsSaved,
              })}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/70 hover:bg-emerald-900/70 border border-emerald-800/60 transition flex items-center justify-center gap-2"
            >
              <MessageSquareCode className="w-4 h-4 text-emerald-400" />
              <span>Ask Yash: "Should I prepay or invest in stocks?"</span>
            </button>

          </div>

        </div>

      </div>

      {/* Comparative Amortization Curves: Recharts Visualizer */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-5">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              <span>Amortization Trajectory Comparison</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Standard Loan Payoff vs. Accelerated Curve
            </h3>
            <p className="text-xs text-slate-400">
              Watch the accelerated curve (in Emerald) reach $0 debt years before the standard schedule (in Slate).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              Standard ({tenureYears} Yrs)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              Accelerated ({(simulation.acceleratedMonths / 12).toFixed(1)} Yrs)
            </span>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="w-full h-80 sm:h-96 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={simulation.yearlyData} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorAccelerated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.25} />
              <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, currency, true)} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const stdVal = payload.find(p => p.dataKey === 'standardBalance')?.value ?? 0;
                    const accVal = payload.find(p => p.dataKey === 'acceleratedBalance')?.value ?? 0;
                    const diff = Math.max(0, Number(stdVal) - Number(accVal));
                    return (
                      <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-xl text-xs space-y-2">
                        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                          <span>{label === 'Start' ? 'Initial Principal' : `Timeline: Year ${String(label || '').replace('Yr ', '')}`}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Loan Balance</span>
                        </div>
                        <div className="space-y-1 font-mono">
                          <div className="flex items-center justify-between gap-4 text-slate-400">
                            <span className="flex items-center gap-1.5 font-sans">
                              <span className="w-2 h-2 rounded-full bg-slate-500" />
                              Standard Balance:
                            </span>
                            <span className="font-bold">{formatCurrency(Number(stdVal), currency)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-emerald-400">
                            <span className="flex items-center gap-1.5 font-sans">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              Accelerated Balance:
                            </span>
                            <span className="font-bold">{formatCurrency(Number(accVal), currency)}</span>
                          </div>
                        </div>
                        <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-300 flex items-center justify-between gap-3 font-sans">
                          <span>Principal Debt Eradicated:</span>
                          <span className="font-mono font-bold text-cyan-400">{formatCurrency(diff, currency)}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
                formatter={(value) => (value === 'standardBalance' ? 'Standard Repayment' : 'Accelerated Repayment')}
              />
              <Area
                type="monotone"
                dataKey="standardBalance"
                stroke="#64748b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorStandard)"
                name="standardBalance"
              />
              <Area
                type="monotone"
                dataKey="acceleratedBalance"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorAccelerated)"
                name="acceleratedBalance"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* AI Repayment Strategy Advisory Card */}
      {aiAdvice && (
        <div className="rounded-3xl bg-slate-900/80 border border-emerald-500/40 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Gemini 3.8 Flash Advisory</span>
                <h2 className="text-xl font-bold text-white">Underwriting Surplus Acceleration Strategy</h2>
              </div>
            </div>

            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
              Guaranteed Yield: {rate}% Compound APR
            </span>
          </div>

          {/* Executive Summary */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Executive Strategic Assessment
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {aiAdvice.executiveSummary}
            </p>
          </div>

          {/* Prepayment vs Investment Arbitrage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-1">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Effective Prepayment ROI</span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{aiAdvice.effectiveReturnOnInvestment}</p>
            </div>

            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 space-y-1">
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">Arbitrage: Debt vs. Equities</span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{aiAdvice.arbitrageVerdict}</p>
            </div>
          </div>

          {/* Practical Tactics & Caution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Underwriter Best Practices</span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {aiAdvice.prepaymentTactics?.map((t: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Liquidity & Policy Caution</span>
              <p className="text-xs text-slate-300 leading-relaxed">{aiAdvice.cautionaryNote}</p>
            </div>
          </div>

          {/* Yash Takeaway */}
          {aiAdvice.yashTakeaway && (
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Advisor Yash's Takeaway:</span>
                </div>
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  "{aiAdvice.yashTakeaway}"
                </p>
              </div>

              <button
                onClick={() => onOpenYashChatWithContext({
                  balance,
                  rate,
                  monthlySurplus,
                  prepayment: effectiveMonthlyPrepayment,
                  interestSaved: formatCurrency(simulation.interestSaved, currency),
                  yearsSaved: simulation.yearsSaved,
                })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/60 transition whitespace-nowrap"
              >
                <MessageSquareCode className="w-4 h-4" />
                <span>Discuss With Yash</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
