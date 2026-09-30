import React, { useState, useMemo } from 'react';
import { 
  GitCompare, 
  Sparkles, 
  TrendingDown, 
  TrendingUp, 
  Save, 
  MessageSquareCode, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  DollarSign, 
  Percent, 
  Clock, 
  HelpCircle,
  Scale,
  Award,
  Layers,
  LineChart as LineChartIcon,
  BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Currency } from '../types';
import { formatCurrency, calculateEmi } from '../utils/formatters';

interface LoanOption {
  label: string;
  principal: number;
  rate: number;
  tenureYears: number;
  processingFeePercent: number;
  feeFlat: number;
}

interface LoanComparisonProps {
  currency: Currency;
  borrowerIncome?: number;
  onSaveToSheet: (result: any) => void;
  onOpenYashChatWithContext: (context: any) => void;
}

interface AmortizationComparisonPoint {
  year: number;
  label: string;
  balanceA: number;
  balanceB: number;
  cumulativeInterestA: number;
  cumulativeInterestB: number;
  annualPaidA: number;
  annualPaidB: number;
}

function computeSideBySideAmortization(
  loanA: LoanOption,
  loanB: LoanOption
): AmortizationComparisonPoint[] {
  const maxYears = Math.max(loanA.tenureYears, loanB.tenureYears);
  const data: AmortizationComparisonPoint[] = [];

  const totalMonthsA = loanA.tenureYears * 12;
  const rateA = (loanA.rate / 100) / 12;
  const emiA = calculateEmi(loanA.principal, loanA.rate, totalMonthsA);

  const totalMonthsB = loanB.tenureYears * 12;
  const rateB = (loanB.rate / 100) / 12;
  const emiB = calculateEmi(loanB.principal, loanB.rate, totalMonthsB);

  let balA = loanA.principal;
  let cumIntA = 0;

  let balB = loanB.principal;
  let cumIntB = 0;

  // Year 0 starting point
  data.push({
    year: 0,
    label: 'Start',
    balanceA: loanA.principal,
    balanceB: loanB.principal,
    cumulativeInterestA: 0,
    cumulativeInterestB: 0,
    annualPaidA: 0,
    annualPaidB: 0,
  });

  for (let y = 1; y <= maxYears; y++) {
    let yearPaidA = 0;
    for (let m = 1; m <= 12; m++) {
      if (balA > 0) {
        const intPart = balA * rateA;
        const princPart = Math.min(balA, emiA - intPart);
        balA = Math.max(0, balA - princPart);
        cumIntA += intPart;
        yearPaidA += princPart + intPart;
      }
    }

    let yearPaidB = 0;
    for (let m = 1; m <= 12; m++) {
      if (balB > 0) {
        const intPart = balB * rateB;
        const princPart = Math.min(balB, emiB - intPart);
        balB = Math.max(0, balB - princPart);
        cumIntB += intPart;
        yearPaidB += princPart + intPart;
      }
    }

    data.push({
      year: y,
      label: `Yr ${y}`,
      balanceA: Math.round(balA),
      balanceB: Math.round(balB),
      cumulativeInterestA: Math.round(cumIntA),
      cumulativeInterestB: Math.round(cumIntB),
      annualPaidA: Math.round(yearPaidA),
      annualPaidB: Math.round(yearPaidB),
    });
  }

  return data;
}

const COMPARISON_PRESETS = [
  {
    name: '15-Year vs. 30-Year Home Loan',
    icon: '🏡',
    desc: 'Compare rapid equity building vs. lower monthly payments',
    loanA: { label: 'Option A: 15-Year Fixed', principal: 300000, rate: 6.75, tenureYears: 15, processingFeePercent: 0.5, feeFlat: 0 },
    loanB: { label: 'Option B: 30-Year Fixed', principal: 300000, rate: 7.25, tenureYears: 30, processingFeePercent: 0.5, feeFlat: 0 },
  },
  {
    name: 'Low APR (High Fee) vs. High APR (Zero Fee)',
    icon: '⚖️',
    desc: 'Evaluate if a 1.5% upfront fee is worth a 0.7% rate discount',
    loanA: { label: 'Option A: 7.5% APR + 1.5% Fee', principal: 150000, rate: 7.5, tenureYears: 10, processingFeePercent: 1.5, feeFlat: 0 },
    loanB: { label: 'Option B: 8.2% APR + Zero Fee', principal: 150000, rate: 8.2, tenureYears: 10, processingFeePercent: 0, feeFlat: 0 },
  },
  {
    name: '3-Year vs. 5-Year Auto Loan',
    icon: '🚗',
    desc: 'Inspect the true total price of driving away with a longer car loan',
    loanA: { label: 'Option A: 3-Year Rapid Payoff', principal: 38000, rate: 7.9, tenureYears: 3, processingFeePercent: 0, feeFlat: 250 },
    loanB: { label: 'Option B: 5-Year Extended Term', principal: 38000, rate: 8.8, tenureYears: 5, processingFeePercent: 0, feeFlat: 250 },
  },
  {
    name: 'Tier-1 Bank vs. Private NBFC',
    icon: '🏦',
    desc: 'Public prime lender (stricter) vs. Private NBFC (fast disbursal)',
    loanA: { label: 'Option A: Tier-1 Institutional Bank', principal: 80000, rate: 8.9, tenureYears: 7, processingFeePercent: 0.8, feeFlat: 0 },
    loanB: { label: 'Option B: Fast-Track Private NBFC', principal: 80000, rate: 10.75, tenureYears: 7, processingFeePercent: 1.8, feeFlat: 0 },
  },
];

export const LoanComparison: React.FC<LoanComparisonProps> = ({
  currency,
  borrowerIncome = 7500,
  onSaveToSheet,
  onOpenYashChatWithContext,
}) => {
  const [loanA, setLoanA] = useState<LoanOption>({
    label: 'Loan Option A',
    principal: 250000,
    rate: 7.2,
    tenureYears: 15,
    processingFeePercent: 0.5,
    feeFlat: 0,
  });

  const [loanB, setLoanB] = useState<LoanOption>({
    label: 'Loan Option B',
    principal: 250000,
    rate: 7.8,
    tenureYears: 25,
    processingFeePercent: 0.5,
    feeFlat: 0,
  });

  const [loadingAi, setLoadingAi] = useState(false);
  const [aiReport, setAiReport] = useState<any | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [chartMetric, setChartMetric] = useState<'balance' | 'cumulativeInterest' | 'annualOutflow'>('balance');

  // Compute side-by-side yearly amortization schedule data
  const amortizationData = useMemo(() => {
    return computeSideBySideAmortization(loanA, loanB);
  }, [loanA, loanB]);

  // Live Math calculation for Option A
  const emiA = calculateEmi(loanA.principal, loanA.rate, loanA.tenureYears * 12);
  const totalPaymentA = emiA * (loanA.tenureYears * 12);
  const totalInterestA = totalPaymentA - loanA.principal;
  const feesA = Math.round((loanA.principal * (loanA.processingFeePercent / 100)) + loanA.feeFlat);
  const netLifetimeA = totalPaymentA + feesA;

  // Live Math calculation for Option B
  const emiB = calculateEmi(loanB.principal, loanB.rate, loanB.tenureYears * 12);
  const totalPaymentB = emiB * (loanB.tenureYears * 12);
  const totalInterestB = totalPaymentB - loanB.principal;
  const feesB = Math.round((loanB.principal * (loanB.processingFeePercent / 100)) + loanB.feeFlat);
  const netLifetimeB = totalPaymentB + feesB;

  // Deltas
  const monthlyDiff = Math.abs(emiA - emiB);
  const interestDiff = Math.abs(totalInterestA - totalInterestB);
  const lifetimeDiff = Math.abs(netLifetimeA - netLifetimeB);

  const cheaperMonthly = emiA < emiB ? 'A' : 'B';
  const cheaperLifetime = netLifetimeA < netLifetimeB ? 'A' : 'B';

  const handleApplyPreset = (preset: typeof COMPARISON_PRESETS[0]) => {
    setLoanA(preset.loanA);
    setLoanB(preset.loanB);
    setAiReport(null);
  };

  const handleRunAiComparison = async () => {
    setLoadingAi(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/ai/compare-loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loanA,
          loanB,
          borrowerIncome,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiReport(data);
      }
    } catch (err) {
      console.error('Failed to run loan comparison:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSaveToSheet = () => {
    const record = {
      id: `rec-comp-${Date.now()}`,
      applicantName: 'Applicant (Scenario Comparison)',
      type: 'loan_check',
      category: `Compare: ${loanA.label} vs. ${loanB.label}`,
      monthlyIncome: borrowerIncome,
      existingEmis: Math.min(emiA, emiB),
      creditScore: 740,
      requestedAmount: loanA.principal,
      eligibleAmount: loanA.principal,
      riskRating: 'Prime',
      approvalProbability: 92,
      estimatedInterestRate: Math.min(loanA.rate, loanB.rate),
      monthlyEmi: Math.min(emiA, emiB),
      keyInsights: [
        `Option A: ${formatCurrency(emiA, currency)}/mo (${loanA.tenureYears} yrs)`,
        `Option B: ${formatCurrency(emiB, currency)}/mo (${loanB.tenureYears} yrs)`,
        `Lifetime Difference: ${formatCurrency(lifetimeDiff, currency)} (${cheaperLifetime === 'A' ? loanA.label : loanB.label} saves more)`
      ],
      aiReasoning: aiReport?.analysis?.headline || `Scenario A saves ${formatCurrency(interestDiff, currency)} in lifetime interest versus Scenario B, with a monthly cash flow variance of ${formatCurrency(monthlyDiff, currency)}/month.`,
    };

    onSaveToSheet(record);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-purple-950/40 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
              <Scale className="w-4 h-4 text-purple-400" />
              Side-by-Side BFSI Scenario Underwriting Matrix
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Side-by-Side Loan Comparison
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl mt-1 leading-relaxed">
              Compare two different loan structures side-by-side. Uncover the real compounding cost of extended tenures, evaluate interest discounts against upfront fees, and receive a Gemini AI verdict.
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
              <Save className="w-4 h-4 text-purple-400" />
              <span>{saveSuccess ? 'Saved Comparison to Sheet!' : 'Save Comparison'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Comparison Presets */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800/80 p-5 backdrop-blur-xl space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Layers className="w-4 h-4 text-purple-400" />
          <span>Popular Lending Comparison Scenarios</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {COMPARISON_PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(p)}
              className="p-3.5 rounded-2xl bg-slate-950/70 hover:bg-purple-950/30 border border-slate-800 hover:border-purple-600/40 text-left transition flex items-start gap-2.5 group"
            >
              <span className="text-xl p-1.5 rounded-xl bg-slate-900 group-hover:scale-110 transition">{p.icon}</span>
              <div>
                <div className="text-xs font-bold text-slate-200 group-hover:text-purple-300">{p.name}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{p.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Side-by-Side Dual Column Input Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Loan Option A Card */}
        <div className="rounded-3xl bg-slate-900/70 border border-cyan-500/40 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-xs">A</span>
              <input
                type="text"
                value={loanA.label}
                onChange={(e) => setLoanA(prev => ({ ...prev, label: e.target.value }))}
                className="bg-transparent font-bold text-white text-sm focus:outline-none border-b border-transparent focus:border-cyan-400"
              />
            </div>
            {cheaperLifetime === 'A' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Lowest Lifetime Cost
              </span>
            )}
          </div>

          {/* Principal Slider A */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Principal Amount</label>
              <span className="text-xs font-mono font-bold text-cyan-400">{formatCurrency(loanA.principal, currency)}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="1000000"
              step="5000"
              value={loanA.principal}
              onChange={(e) => setLoanA(prev => ({ ...prev, principal: Number(e.target.value) }))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Rate Slider A */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Interest Rate (% APR)</label>
              <span className="text-xs font-mono font-bold text-emerald-400">{loanA.rate.toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min="4.0"
              max="24.0"
              step="0.1"
              value={loanA.rate}
              onChange={(e) => setLoanA(prev => ({ ...prev, rate: Number(e.target.value) }))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Tenure Slider A */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Tenure (Years)</label>
              <span className="text-xs font-mono font-bold text-slate-200">{loanA.tenureYears} Years ({loanA.tenureYears * 12} mo)</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={loanA.tenureYears}
              onChange={(e) => setLoanA(prev => ({ ...prev, tenureYears: Number(e.target.value) }))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Fee Input A */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="text-[11px] text-slate-400">Processing Fee %</label>
              <input
                type="number"
                step="0.1"
                value={loanA.processingFeePercent}
                onChange={(e) => setLoanA(prev => ({ ...prev, processingFeePercent: Number(e.target.value) }))}
                className="mt-1 w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">Total Upfront Fee</label>
              <div className="mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-amber-400">
                {formatCurrency(feesA, currency)}
              </div>
            </div>
          </div>

          {/* Quick Metrics A */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] text-slate-400">Monthly EMI</span>
              <div className="text-base font-bold font-mono text-cyan-400">{formatCurrency(emiA, currency)}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Total Interest</span>
              <div className="text-base font-bold font-mono text-amber-400">{formatCurrency(totalInterestA, currency)}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Total Outflow</span>
              <div className="text-base font-bold font-mono text-white">{formatCurrency(netLifetimeA, currency)}</div>
            </div>
          </div>

        </div>

        {/* Loan Option B Card */}
        <div className="rounded-3xl bg-slate-900/70 border border-purple-500/40 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center text-xs">B</span>
              <input
                type="text"
                value={loanB.label}
                onChange={(e) => setLoanB(prev => ({ ...prev, label: e.target.value }))}
                className="bg-transparent font-bold text-white text-sm focus:outline-none border-b border-transparent focus:border-purple-400"
              />
            </div>
            {cheaperLifetime === 'B' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Lowest Lifetime Cost
              </span>
            )}
          </div>

          {/* Principal Slider B */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Principal Amount</label>
              <span className="text-xs font-mono font-bold text-purple-400">{formatCurrency(loanB.principal, currency)}</span>
            </div>
            <input
              type="range"
              min="10000"
              max="1000000"
              step="5000"
              value={loanB.principal}
              onChange={(e) => setLoanB(prev => ({ ...prev, principal: Number(e.target.value) }))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Rate Slider B */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Interest Rate (% APR)</label>
              <span className="text-xs font-mono font-bold text-emerald-400">{loanB.rate.toFixed(2)}%</span>
            </div>
            <input
              type="range"
              min="4.0"
              max="24.0"
              step="0.1"
              value={loanB.rate}
              onChange={(e) => setLoanB(prev => ({ ...prev, rate: Number(e.target.value) }))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Tenure Slider B */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-300">Tenure (Years)</label>
              <span className="text-xs font-mono font-bold text-slate-200">{loanB.tenureYears} Years ({loanB.tenureYears * 12} mo)</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              step="1"
              value={loanB.tenureYears}
              onChange={(e) => setLoanB(prev => ({ ...prev, tenureYears: Number(e.target.value) }))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
          </div>

          {/* Fee Input B */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="text-[11px] text-slate-400">Processing Fee %</label>
              <input
                type="number"
                step="0.1"
                value={loanB.processingFeePercent}
                onChange={(e) => setLoanB(prev => ({ ...prev, processingFeePercent: Number(e.target.value) }))}
                className="mt-1 w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400">Total Upfront Fee</label>
              <div className="mt-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-amber-400">
                {formatCurrency(feesB, currency)}
              </div>
            </div>
          </div>

          {/* Quick Metrics B */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] text-slate-400">Monthly EMI</span>
              <div className="text-base font-bold font-mono text-purple-400">{formatCurrency(emiB, currency)}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Total Interest</span>
              <div className="text-base font-bold font-mono text-amber-400">{formatCurrency(totalInterestB, currency)}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Total Outflow</span>
              <div className="text-base font-bold font-mono text-white">{formatCurrency(netLifetimeB, currency)}</div>
            </div>
          </div>

        </div>

      </div>

      {/* Recharts Amortization Schedule Side-by-Side Visualizer */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-5">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>Interactive Recharts Financial Modeling</span>
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">
              Side-by-Side Amortization Curve Comparison
            </h3>
            <p className="text-xs text-slate-400">
              Visualize loan balance reductions, compound interest accumulation, and annual cash outlays across tenures.
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="p-1 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap gap-1 text-xs">
            <button
              onClick={() => setChartMetric('balance')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                chartMetric === 'balance'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Remaining Balance</span>
            </button>

            <button
              onClick={() => setChartMetric('cumulativeInterest')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                chartMetric === 'cumulativeInterest'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Cumulative Interest</span>
            </button>

            <button
              onClick={() => setChartMetric('annualOutflow')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                chartMetric === 'annualOutflow'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Annual Outflow</span>
            </button>
          </div>
        </div>

        {/* Dynamic Key Takeaway Header Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <div>
              <span className="text-slate-400 text-[10px] block">{loanA.label} Payoff</span>
              <span className="font-bold font-mono text-cyan-300">{loanA.tenureYears} Years ({loanA.tenureYears * 12} mo)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
            <div>
              <span className="text-slate-400 text-[10px] block">{loanB.label} Payoff</span>
              <span className="font-bold font-mono text-purple-300">{loanB.tenureYears} Years ({loanB.tenureYears * 12} mo)</span>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-right">
            <div>
              <span className="text-slate-400 text-[10px] block">Interest Gap</span>
              <span className="font-bold font-mono text-emerald-400">
                {formatCurrency(interestDiff, currency)} {cheaperLifetime === 'A' ? `saved by ${loanA.label}` : `saved by ${loanB.label}`}
              </span>
            </div>
          </div>
        </div>

        {/* Recharts Render Area */}
        <div className="w-full h-80 sm:h-96 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartMetric === 'annualOutflow' ? (
              <BarChart data={amortizationData.filter(d => d.year > 0)} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, currency, true)} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const aVal = payload.find(p => p.dataKey === 'annualPaidA')?.value ?? 0;
                      const bVal = payload.find(p => p.dataKey === 'annualPaidB')?.value ?? 0;
                      return (
                        <div className="p-3 rounded-2xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-xl text-xs space-y-1.5">
                          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">
                            Year {String(label || '').replace('Yr ', '')} Total Annual Payments
                          </div>
                          <div className="text-cyan-400 font-mono flex items-center justify-between gap-4">
                            <span>{loanA.label}:</span>
                            <span className="font-bold">{formatCurrency(Number(aVal), currency)}</span>
                          </div>
                          <div className="text-purple-400 font-mono flex items-center justify-between gap-4">
                            <span>{loanB.label}:</span>
                            <span className="font-bold">{formatCurrency(Number(bVal), currency)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
                  formatter={(value) => (value === 'annualPaidA' ? loanA.label : loanB.label)}
                />
                <Bar dataKey="annualPaidA" fill="#06b6d4" radius={[4, 4, 0, 0]} name="annualPaidA" />
                <Bar dataKey="annualPaidB" fill="#a855f7" radius={[4, 4, 0, 0]} name="annualPaidB" />
              </BarChart>
            ) : (
              <AreaChart data={amortizationData} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorIntA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorIntB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#334155" strokeDasharray="3 3" opacity={0.25} />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v, currency, true)} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const metricKeyA = chartMetric === 'balance' ? 'balanceA' : 'cumulativeInterestA';
                      const metricKeyB = chartMetric === 'balance' ? 'balanceB' : 'cumulativeInterestB';
                      const valA = payload.find(p => p.dataKey === metricKeyA)?.value ?? 0;
                      const valB = payload.find(p => p.dataKey === metricKeyB)?.value ?? 0;
                      const diff = Math.abs(Number(valA) - Number(valB));
                      return (
                        <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-xl text-xs space-y-2">
                          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1 flex items-center justify-between gap-4">
                            <span>{label === 'Start' ? 'Initial Disbursement' : `Timeline: Year ${String(label || '').replace('Yr ', '')}`}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {chartMetric === 'balance' ? 'Principal Remaining' : 'Accrued Interest'}
                            </span>
                          </div>
                          <div className="space-y-1 font-mono">
                            <div className="flex items-center justify-between gap-4 text-cyan-400">
                              <span className="flex items-center gap-1.5 font-sans">
                                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                {loanA.label}:
                              </span>
                              <span className="font-bold">{formatCurrency(Number(valA), currency)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-4 text-purple-400">
                              <span className="flex items-center gap-1.5 font-sans">
                                <span className="w-2 h-2 rounded-full bg-purple-400" />
                                {loanB.label}:
                              </span>
                              <span className="font-bold">{formatCurrency(Number(valB), currency)}</span>
                            </div>
                          </div>
                          <div className="pt-1.5 border-t border-slate-800 text-[11px] text-slate-300 flex items-center justify-between gap-3 font-sans">
                            <span>Difference / Variance:</span>
                            <span className="font-mono font-bold text-emerald-400">{formatCurrency(diff, currency)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
                  formatter={(value) => (value.includes('A') ? loanA.label : loanB.label)}
                />
                {chartMetric === 'balance' ? (
                  <>
                    <Area
                      type="monotone"
                      dataKey="balanceA"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorA)"
                      name="balanceA"
                    />
                    <Area
                      type="monotone"
                      dataKey="balanceB"
                      stroke="#a855f7"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorB)"
                      name="balanceB"
                    />
                  </>
                ) : (
                  <>
                    <Area
                      type="monotone"
                      dataKey="cumulativeInterestA"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorIntA)"
                      name="cumulativeInterestA"
                    />
                    <Area
                      type="monotone"
                      dataKey="cumulativeInterestB"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorIntB)"
                      name="cumulativeInterestB"
                    />
                  </>
                )}
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

      </div>

      {/* Direct Variance / Delta Comparison Card */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 backdrop-blur-xl shadow-xl space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Variance & Bottom-Line Financial Delta
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Monthly Payment Difference</span>
            <div className="text-2xl font-bold font-mono text-cyan-300">
              {formatCurrency(monthlyDiff, currency)}/mo
            </div>
            <p className="text-[11px] text-slate-400">
              {cheaperMonthly === 'A' ? loanA.label : loanB.label} saves {formatCurrency(monthlyDiff, currency)} each month.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Lifetime Interest Savings Delta</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {formatCurrency(interestDiff, currency)}
            </div>
            <p className="text-[11px] text-slate-400">
              {totalInterestA < totalInterestB ? loanA.label : loanB.label} accumulates {formatCurrency(interestDiff, currency)} less interest.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
            <span className="text-[11px] text-slate-400">Net Lifetime Cost Variance</span>
            <div className="text-2xl font-bold font-mono text-purple-300">
              {formatCurrency(lifetimeDiff, currency)}
            </div>
            <p className="text-[11px] text-slate-400">
              Accounts for principal, interest, and processing charges.
            </p>
          </div>

        </div>

        {/* Action button to run AI Comparison */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={handleRunAiComparison}
            disabled={loadingAi}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 active:scale-[0.99] transition shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${loadingAi ? 'animate-spin' : 'text-purple-200'}`} />
            <span>{loadingAi ? 'Evaluating Scenarios with Gemini Underwriter...' : 'Synthesize AI Underwriter Comparison'}</span>
          </button>
        </div>

      </div>

      {/* AI Comparison Analysis Report */}
      {aiReport && (
        <div className="rounded-3xl bg-slate-900/80 border border-purple-500/40 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
                <Scale className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Gemini 3.8 Flash Analysis</span>
                <h2 className="text-xl font-bold text-white">Underwriting Scenario Verdict</h2>
              </div>
            </div>

            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-950 text-purple-300 border border-purple-800">
              Verdict: {aiReport.analysis?.winner === 'loanA' ? loanA.label : aiReport.analysis?.winner === 'loanB' ? loanB.label : 'Conditional on Monthly Cash Flow'}
            </span>
          </div>

          {/* Headline */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
              Executive Comparative Summary
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed font-sans">
              {aiReport.analysis?.headline}
            </p>
          </div>

          {/* Pros & Cons Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Option A Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">{loanA.label} Profile</span>
                <span className="text-[10px] text-slate-400 font-mono">{formatCurrency(emiA, currency)}/mo</span>
              </div>
              
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Advantages</span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {aiReport.analysis?.prosA?.map((p: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-slate-900">
                <span className="text-[10px] font-bold text-rose-400 uppercase">Trade-offs</span>
                <ul className="space-y-1 text-xs text-slate-400">
                  {aiReport.analysis?.consA?.map((c: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">✕</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Option B Breakdown */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">{loanB.label} Profile</span>
                <span className="text-[10px] text-slate-400 font-mono">{formatCurrency(emiB, currency)}/mo</span>
              </div>
              
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Advantages</span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {aiReport.analysis?.prosB?.map((p: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5 pt-1 border-t border-slate-900">
                <span className="text-[10px] font-bold text-rose-400 uppercase">Trade-offs</span>
                <ul className="space-y-1 text-xs text-slate-400">
                  {aiReport.analysis?.consB?.map((c: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-rose-400 font-bold">✕</span>
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          {/* Persona Advice: Cash Flow vs Wealth Maximizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 space-y-1">
              <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">For Cash-Flow / Flexibility Seekers</span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{aiReport.analysis?.cashFlowAdvice}</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 space-y-1">
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">For Total Interest / Wealth Maximizers</span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{aiReport.analysis?.wealthMaximizerAdvice}</p>
            </div>
          </div>

          {/* Yash Takeaway Footer */}
          {aiReport.analysis?.yashTakeaway && (
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-purple-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Advisor Yash's Direct Verdict:</span>
                </div>
                <p className="text-xs text-slate-200 italic leading-relaxed">
                  "{aiReport.analysis.yashTakeaway}"
                </p>
              </div>

              <button
                onClick={() => onOpenYashChatWithContext({
                  loanA: `${loanA.label} (${loanA.rate}%, ${loanA.tenureYears} yrs, $${emiA}/mo)`,
                  loanB: `${loanB.label} (${loanB.rate}%, ${loanB.tenureYears} yrs, $${emiB}/mo)`,
                  interestDiff: formatCurrency(interestDiff, currency),
                  monthlyDiff: formatCurrency(monthlyDiff, currency),
                })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-purple-300 bg-purple-950 hover:bg-purple-900 border border-purple-700/60 transition whitespace-nowrap"
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
