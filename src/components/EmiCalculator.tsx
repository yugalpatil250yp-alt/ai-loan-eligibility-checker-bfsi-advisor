import React, { useState } from 'react';
import { 
  Calculator, 
  TrendingDown, 
  Clock, 
  Percent, 
  DollarSign, 
  Download, 
  Save, 
  HelpCircle, 
  CheckCircle2, 
  Zap,
  ChevronDown,
  ChevronUp,
  MessageSquareCode,
  ArrowRight
} from 'lucide-react';
import { Currency } from '../types';
import { formatCurrency, calculateEmi, generateAmortizationSchedule } from '../utils/formatters';

interface EmiCalculatorProps {
  currency: Currency;
  initialPrincipal?: number;
  initialRate?: number;
  initialTenureYears?: number;
  onSaveToSheet: (result: any) => void;
  onOpenYashChatWithContext: (context: any) => void;
}

export const EmiCalculator: React.FC<EmiCalculatorProps> = ({
  currency,
  initialPrincipal = 150000,
  initialRate = 8.5,
  initialTenureYears = 15,
  onSaveToSheet,
  onOpenYashChatWithContext,
}) => {
  const [principal, setPrincipal] = useState<number>(initialPrincipal);
  const [rate, setRate] = useState<number>(initialRate);
  const [tenureYears, setTenureYears] = useState<number>(initialTenureYears);
  const [tenureUnit, setTenureUnit] = useState<'years' | 'months'>('years');
  const [tenureMonthsValue, setTenureMonthsValue] = useState<number>(initialTenureYears * 12);

  // Prepayment Simulator
  const [extraMonthlyPayment, setExtraMonthlyPayment] = useState<number>(0);
  const [showAmortization, setShowAmortization] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Effective months for calculation
  const totalMonths = tenureUnit === 'years' ? tenureYears * 12 : tenureMonthsValue;
  const effectiveTenureYears = totalMonths / 12;

  // Compute Base EMI & Schedule
  const baseMonthlyEmi = calculateEmi(principal, rate, totalMonths);
  const { 
    schedule, 
    totalInterest, 
    totalPayment, 
    monthsSaved, 
    interestSaved 
  } = generateAmortizationSchedule(principal, rate, effectiveTenureYears, extraMonthlyPayment);

  // Principal vs Interest percentage for visual ring/bar
  const principalPercent = totalPayment > 0 ? Math.round((principal / totalPayment) * 100) : 50;
  const interestPercent = 100 - principalPercent;

  const handleDownloadCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Year,Opening Balance,Annual EMI Paid,Principal Paid,Interest Paid,Closing Balance\n';
    schedule.forEach(row => {
      csvContent += `${row.year},${row.openingBalance},${row.emiPaid},${row.principalPaid},${row.interestPaid},${row.closingBalance}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Amortization_Schedule_${principal}_${rate}pct.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveToSheet = () => {
    const record = {
      id: `rec-emi-${Date.now()}`,
      applicantName: 'Applicant (EMI Modeling)',
      type: 'emi_calc',
      category: 'Loan EMI & Amortization Plan',
      monthlyIncome: 6500,
      existingEmis: baseMonthlyEmi,
      creditScore: 740,
      requestedAmount: principal,
      eligibleAmount: principal,
      riskRating: 'Prime',
      approvalProbability: 95,
      estimatedInterestRate: rate,
      monthlyEmi: baseMonthlyEmi,
      keyInsights: [
        `Monthly EMI: ${formatCurrency(baseMonthlyEmi, currency)}`,
        `Total Interest: ${formatCurrency(totalInterest, currency)}`,
        extraMonthlyPayment > 0 ? `Prepayment Saves: ${formatCurrency(interestSaved, currency)}` : 'Zero prepayment modeled'
      ],
      aiReasoning: `Structured loan amortization: ${formatCurrency(principal, currency)} at ${rate}% APR over ${totalMonths} months results in total repayment of ${formatCurrency(totalPayment, currency)}.`,
    };

    onSaveToSheet(record);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/40 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-3">
              <Calculator className="w-4 h-4 text-indigo-400" />
              Interactive EMI Calculator & Prepayment Impact Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              EMI Calculator & Amortization
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl mt-1 leading-relaxed">
              Calculate exact monthly obligations, visualize principal vs interest ratios, and simulate how modest prepayments can slice years off your repayment schedule.
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
              <Save className="w-4 h-4 text-indigo-400" />
              <span>{saveSuccess ? 'Saved to Persistence Log!' : 'Save Calculation'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs vs Visual Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Sliders and Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 sm:p-7 backdrop-blur-xl shadow-xl space-y-6">
            
            {/* Principal Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Loan Principal Amount
                </label>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {formatCurrency(principal, currency)}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="10000"
                max="1000000"
                step="5000"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>{formatCurrency(10000, currency, true)}</span>
                <span>{formatCurrency(250000, currency, true)}</span>
                <span>{formatCurrency(500000, currency, true)}</span>
                <span>{formatCurrency(1000000, currency, true)}</span>
              </div>
              <input
                type="number"
                value={principal}
                onChange={(e) => setPrincipal(Number(e.target.value))}
                className="mt-2 w-full px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200 text-xs font-mono focus:border-cyan-500"
              />
            </div>

            {/* Interest Rate Slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Annual Interest Rate (% APR)
                </label>
                <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs font-mono font-bold text-emerald-400">{rate.toFixed(2)}%</span>
                </div>
              </div>
              <input
                type="range"
                min="4.0"
                max="24.0"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>4.0% (Subsidized)</span>
                <span>8.5% (Prime Home)</span>
                <span>12.5% (Personal)</span>
                <span>24.0%</span>
              </div>
              <input
                type="number"
                step="0.1"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="mt-2 w-full px-3 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-200 text-xs font-mono focus:border-emerald-500"
              />
            </div>

            {/* Tenure Slider with Unit Toggle */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Loan Repayment Tenure
                </label>
                <div className="flex items-center gap-2">
                  <div className="p-0.5 rounded-lg bg-slate-950 border border-slate-800 flex text-[10px]">
                    <button
                      onClick={() => setTenureUnit('years')}
                      className={`px-2 py-0.5 rounded-md font-bold transition ${
                        tenureUnit === 'years' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                      }`}
                    >
                      Years
                    </button>
                    <button
                      onClick={() => setTenureUnit('months')}
                      className={`px-2 py-0.5 rounded-md font-bold transition ${
                        tenureUnit === 'months' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                      }`}
                    >
                      Months
                    </button>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {tenureUnit === 'years' ? `${tenureYears} Years (${tenureYears * 12} mo)` : `${tenureMonthsValue} Months`}
                  </span>
                </div>
              </div>

              {tenureUnit === 'years' ? (
                <>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={tenureYears}
                    onChange={(e) => {
                      const y = Number(e.target.value);
                      setTenureYears(y);
                      setTenureMonthsValue(y * 12);
                    }}
                    className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>1 Year</span>
                    <span>10 Yrs</span>
                    <span>20 Yrs</span>
                    <span>30 Years</span>
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="range"
                    min="12"
                    max="360"
                    step="6"
                    value={tenureMonthsValue}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setTenureMonthsValue(m);
                      setTenureYears(Math.round(m / 12));
                    }}
                    className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>12 mo</span>
                    <span>120 mo</span>
                    <span>240 mo</span>
                    <span>360 mo</span>
                  </div>
                </>
              )}
            </div>

            {/* Prepayment Reduction Simulator Sub-Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/30 to-slate-950 border border-indigo-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span>Prepayment Acceleration Simulator</span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-300">
                  +{formatCurrency(extraMonthlyPayment, currency)}/mo extra
                </span>
              </div>

              <p className="text-[11px] text-slate-400">
                Simulate how much interest and tenure you eliminate by adding an extra voluntary payment on top of your baseline EMI:
              </p>

              <input
                type="range"
                min="0"
                max="2000"
                step="50"
                value={extraMonthlyPayment}
                onChange={(e) => setExtraMonthlyPayment(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />

              {extraMonthlyPayment > 0 && (
                <div className="p-3 rounded-xl bg-indigo-950/60 border border-indigo-700/40 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400">Compound Interest Saved</span>
                    <div className="text-base font-bold font-mono text-emerald-400">
                      {formatCurrency(interestSaved, currency)}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Tenure Eliminated</span>
                    <div className="text-base font-bold font-mono text-cyan-300">
                      {Math.floor(monthsSaved / 12)} yrs {monthsSaved % 12} mo early!
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Right Column: Calculations & Amortization Summary */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* EMI Output Card */}
          <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 backdrop-blur-xl shadow-xl space-y-5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Monthly Repayment Breakdown
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-indigo-950/30 border border-slate-800 text-center">
              <span className="text-xs text-slate-400">Monthly Equated Installment (EMI)</span>
              <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-emerald-400 font-mono my-1">
                {formatCurrency(baseMonthlyEmi + extraMonthlyPayment, currency)}
              </div>
              {extraMonthlyPayment > 0 && (
                <div className="text-[11px] text-indigo-300">
                  Includes {formatCurrency(baseMonthlyEmi, currency)} standard EMI + {formatCurrency(extraMonthlyPayment, currency)} prepayment
                </div>
              )}
            </div>

            {/* Total Interest & Total Payment */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-0.5">Total Interest</div>
                <div className="text-lg font-bold font-mono text-amber-400">
                  {formatCurrency(totalInterest, currency)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{interestPercent}% of total loan</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-[11px] text-slate-400 mb-0.5">Total Amount Payable</div>
                <div className="text-lg font-bold font-mono text-white">
                  {formatCurrency(totalPayment, currency)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Principal + Interest</div>
              </div>
            </div>

            {/* Principal vs Interest Visual Segmented Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-cyan-400 font-semibold">Principal ({principalPercent}%)</span>
                <span className="text-amber-400 font-semibold">Interest ({interestPercent}%)</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 flex overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${principalPercent}%` }}
                />
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                  style={{ width: `${interestPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{formatCurrency(principal, currency)}</span>
                <span>{formatCurrency(totalInterest, currency)}</span>
              </div>
            </div>

            {/* Consultation trigger */}
            <button
              onClick={() => onOpenYashChatWithContext({
                requestedAmount: principal,
                rate,
                tenureYears: effectiveTenureYears,
                monthlyEmi: baseMonthlyEmi,
                totalInterest,
              })}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-950/70 hover:bg-indigo-900/70 border border-indigo-800/60 transition flex items-center justify-center gap-2"
            >
              <MessageSquareCode className="w-4 h-4 text-indigo-400" />
              <span>Ask Yash: "Is it better to prepay or invest elsewhere?"</span>
            </button>

          </div>

        </div>

      </div>

      {/* Amortization Schedule Table */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 backdrop-blur-xl shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Institutional Ledger</span>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Yearly Loan Amortization Schedule</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                {schedule.length} Years Total
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              title="Download schedule as CSV"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setShowAmortization(!showAmortization)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800"
            >
              {showAmortization ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showAmortization ? 'Collapse' : 'Expand'}</span>
            </button>
          </div>
        </div>

        {showAmortization && (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Opening Balance</th>
                  <th className="py-3 px-4">Total Paid (EMI)</th>
                  <th className="py-3 px-4 text-cyan-400">Principal Paid</th>
                  <th className="py-3 px-4 text-amber-400">Interest Paid</th>
                  <th className="py-3 px-4">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {schedule.map((row) => (
                  <tr key={row.year} className="hover:bg-slate-800/30 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-300">Year {row.year}</td>
                    <td className="py-2.5 px-4 text-slate-400">{formatCurrency(row.openingBalance, currency)}</td>
                    <td className="py-2.5 px-4 text-slate-200 font-semibold">{formatCurrency(row.emiPaid, currency)}</td>
                    <td className="py-2.5 px-4 text-cyan-300">{formatCurrency(row.principalPaid, currency)}</td>
                    <td className="py-2.5 px-4 text-amber-300">{formatCurrency(row.interestPaid, currency)}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-200">{formatCurrency(row.closingBalance, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
