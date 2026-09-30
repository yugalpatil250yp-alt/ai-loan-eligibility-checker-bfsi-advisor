import React, { useState } from 'react';
import { 
  Lightbulb, 
  Sparkles, 
  PieChart, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Save, 
  MessageSquareCode,
  DollarSign,
  Scale
} from 'lucide-react';
import { Currency } from '../types';
import { formatCurrency } from '../utils/formatters';

interface FinancialTipsProps {
  currency: Currency;
  income: number;
  existingEmis: number;
  onSaveToSheet: (result: any) => void;
  onOpenYashChatWithContext: (context: any) => void;
}

export const FinancialTips: React.FC<FinancialTipsProps> = ({
  currency,
  income = 7000,
  existingEmis = 900,
  onSaveToSheet,
  onOpenYashChatWithContext,
}) => {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(income);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(Math.round(income * 0.55));
  const [totalDebt, setTotalDebt] = useState<number>(existingEmis * 36);
  const [payoffMethod, setPayoffMethod] = useState<'avalanche' | 'snowball'>('avalanche');
  
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [aiTips, setAiTips] = useState<any | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // 50/30/20 Budgeting Rule Calculation
  const needsBudget = Math.round(monthlyIncome * 0.50);
  const wantsBudget = Math.round(monthlyIncome * 0.30);
  const savingsDebtBudget = Math.round(monthlyIncome * 0.20);
  const netSurplus = Math.max(0, monthlyIncome - monthlyExpenses);

  // Emergency Fund benchmark: 6 months of expenses
  const emergencyFundTarget = monthlyExpenses * 6;

  const handleGenerateAiTips = async () => {
    setLoadingAi(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/ai/financial-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyIncome,
          monthlyExpenses,
          totalDebt,
          savingsTarget: emergencyFundTarget,
          primaryGoal: 'Accelerate Loan Clearance & Wealth Growth',
          riskAppetite: 'Balanced',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiTips(data);
      }
    } catch (err) {
      console.error('Failed to generate financial tips:', err);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleSaveToSheet = () => {
    const record = {
      id: `rec-plan-${Date.now()}`,
      applicantName: 'Applicant (Financial Strategy)',
      type: 'financial_plan',
      category: 'BFSI Wealth & Debt Strategy',
      monthlyIncome,
      existingEmis: Math.round(monthlyIncome * 0.15),
      creditScore: 730,
      riskRating: 'Prime',
      approvalProbability: 90,
      keyInsights: [
        `Net Monthly Surplus: ${formatCurrency(netSurplus, currency)}`,
        `50/30/20 Target Savings: ${formatCurrency(savingsDebtBudget, currency)}/mo`,
        `Recommended Payoff: ${payoffMethod === 'avalanche' ? 'Debt Avalanche' : 'Debt Snowball'}`
      ],
      aiReasoning: aiTips?.yashTakeaway || `Financial optimization plan: allocate ${formatCurrency(netSurplus * 0.6, currency)}/month towards principal acceleration to save substantial interest.`,
    };

    onSaveToSheet(record);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-teal-950/40 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-3">
              <Lightbulb className="w-4 h-4 text-teal-400" />
              BFSI Advisory & Wealth Acceleration Framework
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Financial Tips & Strategies
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl mt-1 leading-relaxed">
              Master the 50/30/20 allocation rule, compare Debt Avalanche vs Snowball techniques, calculate emergency reserve adequacy, and get personalized wealth strategies from Yash.
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
              <Save className="w-4 h-4 text-teal-400" />
              <span>{saveSuccess ? 'Saved to Sheet Log!' : 'Save Strategy Log'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Parameters vs 50/30/20 & Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Financial Profile Adjusters */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 backdrop-blur-xl shadow-xl space-y-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Your Financial Foundation
            </h3>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Monthly Net Income</label>
                <span className="text-xs font-mono font-bold text-emerald-400">{formatCurrency(monthlyIncome, currency)}</span>
              </div>
              <input
                type="range"
                min="2000"
                max="30000"
                step="500"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Total Monthly Fixed Outflows</label>
                <span className="text-xs font-mono font-bold text-cyan-400">{formatCurrency(monthlyExpenses, currency)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="20000"
                step="250"
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Total Outstanding Liabilities</label>
                <span className="text-xs font-mono font-bold text-amber-400">{formatCurrency(totalDebt, currency)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="250000"
                step="5000"
                value={totalDebt}
                onChange={(e) => setTotalDebt(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Net Monthly Cash Surplus */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 text-center">
              <span className="text-xs text-slate-400">Net Investable Monthly Surplus</span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {formatCurrency(netSurplus, currency)}/mo
              </div>
              <p className="text-[11px] text-slate-500">
                Cash available for debt prepayment, emergency reserves, and high-yield investments.
              </p>
            </div>

            {/* AI Generator CTA */}
            <button
              onClick={handleGenerateAiTips}
              disabled={loadingAi}
              className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 active:scale-[0.99] transition shadow-lg shadow-teal-700/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${loadingAi ? 'animate-spin' : 'text-teal-200'}`} />
              <span>{loadingAi ? 'Synthesizing BFSI Advisory...' : 'Generate AI Financial Gameplan'}</span>
            </button>

          </div>
        </div>

        {/* Right Column: 50/30/20 & Debt Payoff Battle */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 50/30/20 Allocation Card */}
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Golden Banking Rule</span>
                <h3 className="text-base font-bold text-white">50 / 30 / 20 Budget Allocation</h3>
              </div>
              <span className="text-xs font-mono font-bold text-slate-300">
                Gross: {formatCurrency(monthlyIncome, currency)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-400">Needs (50%)</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {formatCurrency(needsBudget, currency)}
                </div>
                <p className="text-[10px] text-slate-400">
                  Housing, utilities, groceries, healthcare, mandatory EMIs.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-400">Wants (30%)</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {formatCurrency(wantsBudget, currency)}
                </div>
                <p className="text-[10px] text-slate-400">
                  Dining, entertainment, personal leisure, lifestyle travel.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-400">Savings & Debt (20%)</span>
                </div>
                <div className="text-xl font-bold font-mono text-white">
                  {formatCurrency(savingsDebtBudget, currency)}
                </div>
                <p className="text-[10px] text-slate-400">
                  Emergency buffer, extra EMI prepayment, retirement index.
                </p>
              </div>

            </div>

            {/* Emergency Reserve Progress */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-semibold">Recommended 6-Month Liquid Emergency Reserve</span>
                <span className="font-mono font-bold text-teal-400">
                  {formatCurrency(emergencyFundTarget, currency)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Holding 6 months of expenses in a high-yield liquid account guarantees you never default on loan EMIs during unexpected health or career disruptions.
              </p>
            </div>

          </div>

          {/* Debt Avalanche vs Debt Snowball Comparison */}
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 backdrop-blur-xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Strategy Comparison</span>
                <h3 className="text-base font-bold text-white">Debt Avalanche vs. Debt Snowball</h3>
              </div>
              
              <div className="p-0.5 rounded-xl bg-slate-950 border border-slate-800 flex text-xs">
                <button
                  onClick={() => setPayoffMethod('avalanche')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    payoffMethod === 'avalanche' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
                  }`}
                >
                  Avalanche (Math)
                </button>
                <button
                  onClick={() => setPayoffMethod('snowball')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    payoffMethod === 'snowball' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  Snowball (Psychology)
                </button>
              </div>
            </div>

            {payoffMethod === 'avalanche' ? (
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Debt Avalanche: Highest APR First (Recommended by Bankers)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Direct all excess surplus toward the loan with the highest interest rate (e.g. 24% credit card debt), while paying minimums on lower-rate mortgages.
                </p>
                <div className="text-[11px] text-emerald-400 font-semibold">
                  ✓ Saves the maximum total dollar amount of compound interest over time.
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/40 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Debt Snowball: Smallest Balance First (High Psychological Momentum)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Direct excess payments toward the loan with the smallest balance (e.g. $1,200 personal line), extinguishing it rapidly for psychological wins before rolling into the next debt.
                </p>
                <div className="text-[11px] text-cyan-300 font-semibold">
                  ✓ Delivers instant emotional relief and permanently reduces the count of monthly payments.
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* AI Tips Output Card */}
      {aiTips && (
        <div className="rounded-3xl bg-slate-900/80 border border-teal-500/30 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/40">
                <Sparkles className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Gemini 3.8 Flash Advisory</span>
                <h2 className="text-xl font-bold text-white">Custom BFSI Strategic Recommendations</h2>
              </div>
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40">
              Financial Health Score: {aiTips.financialHealthScore}/100
            </span>
          </div>

          {/* Yash Takeaway Quote */}
          {aiTips.yashTakeaway && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-teal-800/40 space-y-1">
              <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                <span>Advisor Yash's Core Takeaway:</span>
              </div>
              <p className="text-xs text-slate-200 italic leading-relaxed">
                "{aiTips.yashTakeaway}"
              </p>
            </div>
          )}

          {/* Strategy Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiTips.coreStrategies?.map((strat: any, idx: number) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-800">
                    {strat.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {strat.projectedAnnualSavings}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{strat.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{strat.description}</p>
              </div>
            ))}
          </div>

          {/* CTA to Consult Yash */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/80">
            <p className="text-xs text-slate-400">
              Want Yash to calculate tax deductions or evaluate an active bank loan offer?
            </p>
            <button
              onClick={() => onOpenYashChatWithContext({
                monthlyIncome,
                monthlyExpenses,
                surplus: netSurplus,
                debtMethod: payoffMethod,
              })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-teal-300 bg-teal-950 hover:bg-teal-900 border border-teal-800/60 transition"
            >
              <MessageSquareCode className="w-4 h-4" />
              <span>Discuss Strategy With Yash</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
