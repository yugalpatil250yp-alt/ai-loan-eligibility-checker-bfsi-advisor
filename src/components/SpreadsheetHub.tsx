import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Trash2, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { Currency, FinancialRecord } from '../types';
import { formatCurrency } from '../utils/formatters';

interface SpreadsheetHubProps {
  currency: Currency;
  records: FinancialRecord[];
  onDeleteRecord: (id: string) => void;
  onRefreshRecords: () => void;
}

export const SpreadsheetHub: React.FC<SpreadsheetHubProps> = ({
  currency,
  records,
  onDeleteRecord,
  onRefreshRecords,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [activeModalRecord, setActiveModalRecord] = useState<FinancialRecord | null>(null);

  // Filtered list
  const filteredRecords = records.filter(r => {
    const matchesSearch = 
      r.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.riskRating.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = selectedType === 'all' || r.type === selectedType;
    const matchesRisk = selectedRisk === 'all' || r.riskRating === selectedRisk;

    return matchesSearch && matchesType && matchesRisk;
  });

  // Calculate Summary KPIs
  const totalVolume = records.reduce((acc, r) => acc + (r.requestedAmount || r.eligibleAmount || 0), 0);
  const avgApproval = records.length > 0 
    ? Math.round(records.reduce((acc, r) => acc + (r.approvalProbability || 50), 0) / records.length)
    : 0;
  const primeCount = records.filter(r => r.riskRating === 'Prime').length;
  const primeRatio = records.length > 0 ? Math.round((primeCount / records.length) * 100) : 0;

  const handleExportCsv = () => {
    if (records.length === 0) return;
    let csv = 'data:text/csv;charset=utf-8,';
    csv += 'Record ID,Timestamp,Applicant Name,Category,Monthly Income,Existing EMIs,Credit Score,Requested Loan,Max Eligible,FOIR %,DTI %,Risk Rating,Approval Prob %,AI Reasoning\n';

    records.forEach(r => {
      const cleanReasoning = (r.aiReasoning || '').replace(/,/g, ';').replace(/\n/g, ' ');
      csv += `${r.id},${r.timestamp},"${r.applicantName}","${r.category}",${r.monthlyIncome},${r.existingEmis},${r.creditScore},${r.requestedAmount || 0},${r.eligibleAmount || 0},${r.foirPercent || 0},${r.dtiPercent || 0},${r.riskRating},${r.approvalProbability || 0},"${cleanReasoning}"\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinYash_Loan_Records_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-emerald-950/40 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              Persistent Financial Ledger & Audit Trail
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Persistence Hub & Spreadsheet Log
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl mt-1 leading-relaxed">
              Every loan eligibility determination, credit health assessment, and EMI simulation is preserved transparently across sessions with instant CSV export capabilities.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onRefreshRecords}
              className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              title="Refresh ledger records"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
            </button>
            <button
              onClick={handleExportCsv}
              disabled={records.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition shadow-lg shadow-emerald-700/30 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV (Google Sheets)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-[11px] text-slate-400 mb-1">Evaluated Loan Capital</div>
          <div className="text-2xl font-bold font-mono text-cyan-400">
            {formatCurrency(totalVolume, currency, true)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Across all historical entries</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-[11px] text-slate-400 mb-1">Average Approval Score</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {avgApproval}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Underwriter probability mean</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-[11px] text-slate-400 mb-1">Prime Applicant Ratio</div>
          <div className="text-2xl font-bold font-mono text-indigo-400">
            {primeRatio}%
          </div>
          <div className="text-[10px] text-slate-500 mt-1">{primeCount} prime borrowers logged</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-xl">
          <div className="text-[11px] text-slate-400 mb-1">Persistent Entries</div>
          <div className="text-2xl font-bold font-mono text-white">
            {records.length} Records
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Stored across user sessions</div>
        </div>

      </div>

      {/* Table & Controls Container */}
      <div className="rounded-3xl bg-slate-900/70 border border-slate-800/80 p-6 backdrop-blur-xl shadow-xl space-y-5">
        
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by applicant name, loan category, risk rating..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Modules</option>
              <option value="loan_check">Loan Check</option>
              <option value="credit_analysis">Credit Check</option>
              <option value="emi_calc">EMI Simulation</option>
              <option value="financial_plan">Financial Plan</option>
            </select>

            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Risk Tiers</option>
              <option value="Prime">Prime</option>
              <option value="Near-Prime">Near-Prime</option>
              <option value="Sub-Prime">Sub-Prime</option>
              <option value="High Risk">High Risk</option>
            </select>
          </div>

        </div>

        {/* The Spreadsheet-Like Data Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/50">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Monthly Income</th>
                <th className="py-3 px-4">Credit Score</th>
                <th className="py-3 px-4">Loan Amount</th>
                <th className="py-3 px-4">Risk Rating</th>
                <th className="py-3 px-4">Approval Prob</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans">
                    No matching persistence records found. Run a Loan Eligibility or Credit Check to generate rows.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const dateStr = new Date(r.timestamp).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{dateStr}</td>
                      <td className="py-3 px-4 font-bold text-slate-200 font-sans">{r.applicantName}</td>
                      <td className="py-3 px-4 text-slate-300 font-sans">
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px]">
                          {r.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-400">{formatCurrency(r.monthlyIncome, currency)}</td>
                      <td className="py-3 px-4 font-bold text-cyan-400">{r.creditScore}</td>
                      <td className="py-3 px-4 text-slate-200">
                        {r.requestedAmount ? formatCurrency(r.requestedAmount, currency) : 'N/A'}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          r.riskRating === 'Prime' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          r.riskRating === 'Near-Prime' ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {r.riskRating}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200">
                        {r.approvalProbability ? `${r.approvalProbability}%` : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 font-sans">
                          <button
                            onClick={() => setActiveModalRecord(r)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                            title="Inspect AI Underwriting Report"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord(r.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Delete this record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Record Inspection Modal */}
      {activeModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Persistence Record Inspection</span>
                <h3 className="text-base font-bold text-white">{activeModalRecord.applicantName} - {activeModalRecord.category}</h3>
              </div>
              <button
                onClick={() => setActiveModalRecord(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">Income</span>
                <div className="font-bold font-mono text-emerald-400">{formatCurrency(activeModalRecord.monthlyIncome, currency)}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">Score</span>
                <div className="font-bold font-mono text-cyan-400">{activeModalRecord.creditScore}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">Risk Tier</span>
                <div className="font-bold text-slate-200">{activeModalRecord.riskRating}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-500">Approval %</span>
                <div className="font-bold font-mono text-indigo-400">{activeModalRecord.approvalProbability}%</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">AI Reasoning & Synthesis</span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {activeModalRecord.aiReasoning}
              </p>
            </div>

            {activeModalRecord.keyInsights && activeModalRecord.keyInsights.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Audit Flags</span>
                <ul className="space-y-1 text-xs text-slate-300">
                  {activeModalRecord.keyInsights.map((flag, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveModalRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                Close Audit View
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
