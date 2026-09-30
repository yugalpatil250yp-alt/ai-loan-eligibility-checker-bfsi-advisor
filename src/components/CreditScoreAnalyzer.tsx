import React, { useState } from 'react';
import { 
  Gauge, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  HelpCircle, 
  ArrowUpRight, 
  ShieldAlert, 
  Save, 
  MessageSquareCode,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Currency, CreditAnalysisResult } from '../types';
import { formatCurrency } from '../utils/formatters';

interface CreditScoreAnalyzerProps {
  currency: Currency;
  initialScore?: number;
  onSaveToSheet: (result: any) => void;
  onOpenYashChatWithContext: (context: any) => void;
}

export const CreditScoreAnalyzer: React.FC<CreditScoreAnalyzerProps> = ({
  currency,
  initialScore = 720,
  onSaveToSheet,
  onOpenYashChatWithContext,
}) => {
  const [score, setScore] = useState<number>(initialScore);
  const [utilization, setUtilization] = useState<number>(34);
  const [paymentHistory, setPaymentHistory] = useState<number>(98);
  const [oldestAccountYears, setOldestAccountYears] = useState<number>(6);
  const [totalAccounts, setTotalAccounts] = useState<number>(5);
  const [recentInquiries, setRecentInquiries] = useState<number>(2);

  // Simulator scenario toggles
  const [simPayoffCard, setSimPayoffCard] = useState<boolean>(false);
  const [simLimitIncrease, setSimLimitIncrease] = useState<boolean>(false);
  const [simNewLoanInquiry, setSimNewLoanInquiry] = useState<boolean>(false);
  const [simLatePayment, setSimLatePayment] = useState<boolean>(false);

  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<CreditAnalysisResult | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Calculate simulated score adjustment
  let simulatedAdjustment = 0;
  if (simPayoffCard) simulatedAdjustment += 38;
  if (simLimitIncrease) simulatedAdjustment += 18;
  if (simNewLoanInquiry) simulatedAdjustment -= 12;
  if (simLatePayment) simulatedAdjustment -= 65;

  const simulatedScore = Math.max(300, Math.min(900, score + simulatedAdjustment));

  // Determine tier
  const getTier = (s: number) => {
    if (s >= 790) return { label: 'Exceptional (Tier 1)', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', desc: 'Lowest bank lending margins, instantaneous approvals, zero collateral requirements on personal lines.' };
    if (s >= 740) return { label: 'Very Good (Prime)', color: 'text-teal-400', bg: 'bg-teal-500/20', border: 'border-teal-500/40', desc: 'Preferred interest rates across major institutional banks. FOIR up to 55% readily approved.' };
    if (s >= 670) return { label: 'Good (Standard)', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/40', desc: 'Standard lending terms. Benchmark interest rates apply. Clean bank statement verification needed.' };
    if (s >= 580) return { label: 'Fair (Sub-Prime)', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/40', desc: 'Higher risk premium (+150 to +300 bps APR). Co-applicants or collateral often requested.' };
    return { label: 'Poor / High Risk', color: 'text-rose-400', bg: 'bg-rose-500/20', border: 'border-rose-500/40', desc: 'High probability of underwriting rejection. Requires active credit rebuilding protocol.' };
  };

  const currentTier = getTier(score);
  const simTier = getTier(simulatedScore);

  const handleRunAiDiagnosis = async () => {
    setLoadingAi(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/ai/credit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditScore: score,
          onTimePaymentPercent: paymentHistory,
          creditCardUtilization: utilization,
          oldestAccountYears,
          totalActiveAccounts: totalAccounts,
          hardInquiriesLast6Months: recentInquiries,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiReport(data);
      }
    } catch (err) {
      console.error('Credit score analysis error:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSaveToSheet = () => {
    const record = {
      id: `rec-credit-${Date.now()}`,
      applicantName: 'Applicant (Credit Health)',
      type: 'credit_analysis',
      category: 'Credit & CIBIL Health Check',
      monthlyIncome: 6000,
      existingEmis: 800,
      creditScore: score,
      riskRating: score >= 750 ? 'Prime' : score >= 680 ? 'Near-Prime' : 'Sub-Prime',
      approvalProbability: score >= 750 ? 92 : score >= 680 ? 76 : 50,
      keyInsights: [
        `Credit Score: ${score} (${currentTier.label})`,
        `Revolving Utilization: ${utilization}%`,
        `Payment Track Record: ${paymentHistory}% on-time`
      ],
      aiReasoning: aiReport?.executiveSummary || `Credit health scored at ${score}. Prime lending opportunities available with interest rate optimization.`,
    };

    onSaveToSheet(record);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Radial gauge angle calculation (300 to 900 -> 0 to 180 degrees)
  const angleFraction = (score - 300) / 600;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/30 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
              <Gauge className="w-4 h-4 text-emerald-400" />
              CIBIL / Experian / FICO Analytics & What-If Simulation
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Credit Score Analyzer & Roadmap
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl mt-1 leading-relaxed">
              Explore the 5 core pillars governing your credit score, simulate the immediate impact of financial maneuvers, and receive an AI-powered 30-day and 90-day score enhancement blueprint.
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
              <span>{saveSuccess ? 'Saved to Sheet Log!' : 'Save Credit Audit'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Visual Gauge + 5 Pillars & Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Speedometer Gauge & Tier Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 sm:p-7 backdrop-blur-xl shadow-xl flex flex-col items-center text-center">
            
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Credit Reputation Index
            </div>

            {/* Custom SVG Half-Circle Gauge */}
            <div className="relative w-64 h-36 my-3 flex items-end justify-center">
              <svg viewBox="0 0 200 110" className="w-full h-full overflow-visible">
                {/* Background Arc */}
                <path
                  d="M 20 100 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                {/* Colored Tier Segments */}
                {/* 300 - 580 Poor */}
                <path
                  d="M 20 100 A 80 80 0 0 1 55 45"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="16"
                  strokeOpacity="0.4"
                />
                {/* 580 - 670 Fair */}
                <path
                  d="M 55 45 A 80 80 0 0 1 100 20"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="16"
                  strokeOpacity="0.4"
                />
                {/* 670 - 740 Good */}
                <path
                  d="M 100 20 A 80 80 0 0 1 145 45"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="16"
                  strokeOpacity="0.4"
                />
                {/* 740 - 900 Prime */}
                <path
                  d="M 145 45 A 80 80 0 0 1 180 100"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="16"
                  strokeOpacity="0.4"
                />

                {/* Needle Indicator */}
                {(() => {
                  const rad = Math.PI - (angleFraction * Math.PI);
                  const x = 100 + 65 * Math.cos(rad);
                  const y = 100 - 65 * Math.sin(rad);
                  return (
                    <line
                      x1="100"
                      y1="100"
                      x2={x}
                      y2={y}
                      stroke="#38bdf8"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                  );
                })()}
                <circle cx="100" cy="100" r="7" fill="#38bdf8" />
              </svg>

              {/* Central Score Digits */}
              <div className="absolute bottom-0 flex flex-col items-center">
                <span className="text-4xl font-extrabold text-white font-mono tracking-tight drop-shadow-md">
                  {score}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">Range: 300 - 900</span>
              </div>
            </div>

            {/* Score Slider */}
            <div className="w-full mt-4 space-y-1">
              <input
                type="range"
                min="300"
                max="900"
                step="5"
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>300 (Subprime)</span>
                <span>650</span>
                <span>750</span>
                <span>900 (Exceptional)</span>
              </div>
            </div>

            {/* Current Tier Badge & Explanation */}
            <div className={`mt-5 w-full p-4 rounded-2xl border ${currentTier.bg} ${currentTier.border} text-left space-y-1.5`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${currentTier.color}`}>
                  {currentTier.label}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Underwriter Tier</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentTier.desc}
              </p>
            </div>

            {/* Run AI Diagnosis Trigger */}
            <button
              onClick={handleRunAiDiagnosis}
              disabled={loadingAi}
              className="w-full mt-5 py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 active:scale-[0.99] transition shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${loadingAi ? 'animate-spin' : 'text-emerald-200'}`} />
              <span>{loadingAi ? 'Generating AI Credit Health Report...' : 'Analyze Health & Roadmap with Gemini'}</span>
            </button>

          </div>
        </div>

        {/* Right: The 5 Scoring Pillars & What-If Simulator */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* What-If Simulator Card */}
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Predictive Modeling</span>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>"What-If" Credit Simulator</span>
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400">Simulated Score:</span>
                <div className="flex items-center gap-1.5 justify-end">
                  <span className={`text-lg font-mono font-bold ${
                    simulatedAdjustment > 0 ? 'text-emerald-400' :
                    simulatedAdjustment < 0 ? 'text-rose-400' : 'text-slate-300'
                  }`}>
                    {simulatedScore}
                  </span>
                  {simulatedAdjustment !== 0 && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      simulatedAdjustment > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {simulatedAdjustment > 0 ? `+${simulatedAdjustment}` : simulatedAdjustment}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Toggle real-world actions below to see immediate impact on institutional score calculation:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option 1 */}
              <button
                onClick={() => setSimPayoffCard(!simPayoffCard)}
                className={`p-3 rounded-2xl border text-left transition flex items-start justify-between ${
                  simPayoffCard
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Pay down card balances &lt; 20%</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Dramatically cuts revolving utilization</div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400">+38 pts</span>
              </button>

              {/* Option 2 */}
              <button
                onClick={() => setSimLimitIncrease(!simLimitIncrease)}
                className={`p-3 rounded-2xl border text-left transition flex items-start justify-between ${
                  simLimitIncrease
                    ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Request credit limit hike</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Expands credit denominator</div>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-400">+18 pts</span>
              </button>

              {/* Option 3 */}
              <button
                onClick={() => setSimNewLoanInquiry(!simNewLoanInquiry)}
                className={`p-3 rounded-2xl border text-left transition flex items-start justify-between ${
                  simNewLoanInquiry
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Apply for 3 new credit cards</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Creates hard credit bureau inquiries</div>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">-12 pts</span>
              </button>

              {/* Option 4 */}
              <button
                onClick={() => setSimLatePayment(!simLatePayment)}
                className={`p-3 rounded-2xl border text-left transition flex items-start justify-between ${
                  simLatePayment
                    ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
                    : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">Miss an EMI payment by 30+ days</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">30-day DPD flag logged to CIBIL</div>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">-65 pts</span>
              </button>

            </div>
          </div>

          {/* The 5 Pillars of Credit Health */}
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              The 5 Quantitative Pillars of Underwriting
            </h3>

            <div className="space-y-3.5">
              
              {/* Pillar 1: Payment History */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">1. Payment History</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">Weight: 35%</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400">{paymentHistory}% On-Time</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="100"
                  value={paymentHistory}
                  onChange={(e) => setPaymentHistory(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <p className="text-[10px] text-slate-500">
                  Consistently paying on time is the single largest factor determining approval rates.
                </p>
              </div>

              {/* Pillar 2: Credit Utilization */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">2. Credit Utilization Ratio</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">Weight: 30%</span>
                  </div>
                  <span className={`font-mono font-bold ${utilization <= 30 ? 'text-emerald-400' : utilization <= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {utilization}% Used
                  </span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={utilization}
                  onChange={(e) => setUtilization(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <p className="text-[10px] text-slate-500">
                  Ideal threshold: Keep balances under 30% of total card limit.
                </p>
              </div>

              {/* Pillar 3: Credit Vintage / Age */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">3. Credit Age & Vintage</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400">Weight: 15%</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400">{oldestAccountYears} Years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={oldestAccountYears}
                  onChange={(e) => setOldestAccountYears(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Pillar 4 & 5 Compact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Active Accounts (10%)</div>
                  <div className="text-base font-bold font-mono text-slate-200">{totalAccounts} Accounts</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Healthy mix of term & revolving</div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Recent Inquiries (10%)</div>
                  <div className="text-base font-bold font-mono text-slate-200">{recentInquiries} Hard Pulls</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">In last 6 months</div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* AI Credit Analysis Detailed Report */}
      {aiReport && (
        <div className="rounded-3xl bg-slate-900/80 border border-emerald-500/30 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Gemini 3.8 Flash Synthesis</div>
                <h2 className="text-xl font-bold text-white">Institutional Credit Health Audit</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Potential Gain: +{aiReport.potentialScoreGain} pts
              </span>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Executive Underwriter Summary
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed">
              {aiReport.executiveSummary}
            </p>
          </div>

          {/* 30-Day and 90-Day Improvement Roadmaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 30 Days */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-cyan-400">
                <Calendar className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">30-Day Fast-Track Protocol</h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {aiReport.roadmap30Days?.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 90 Days */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">90-Day Prime Score Milestone</h4>
              </div>
              <ul className="space-y-2 text-xs text-slate-300">
                {aiReport.roadmap90Days?.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Ask Yash Consultation Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
            <p className="text-xs text-slate-400">
              Have disputed entries or want a personalized settlement letter reviewed?
            </p>
            <button
              onClick={() => onOpenYashChatWithContext({
                creditScore: score,
                utilization,
                executiveSummary: aiReport.executiveSummary,
              })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800/60 transition"
            >
              <MessageSquareCode className="w-4 h-4" />
              <span>Ask Advisor Yash About Repairing Credit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
