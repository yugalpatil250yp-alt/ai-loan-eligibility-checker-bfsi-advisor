import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  FileSpreadsheet, 
  Calculator, 
  Gauge, 
  Lightbulb, 
  MessageSquareCode, 
  ChevronDown,
  Layers,
  CheckCircle2, 
  DollarSign,
  Scale,
  Zap
} from 'lucide-react';
import { Currency, ApplicantProfile } from '../types';
import { CURRENCIES, PRESET_PROFILES } from '../utils/formatters';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  onSelectPreset: (profile: ApplicantProfile) => void;
  onOpenYashChat: () => void;
  storedRecordsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currency,
  setCurrency,
  onSelectPreset,
  onOpenYashChat,
  storedRecordsCount,
}) => {
  const [showPresets, setShowPresets] = useState(false);
  const [showCurrencies, setShowCurrencies] = useState(false);

  const navItems = [
    { id: 'eligibility', label: 'Loan Eligibility', icon: ShieldCheck },
    { id: 'repayment', label: 'Repayment Accelerator', icon: Zap },
    { id: 'compare', label: 'Loan Comparison', icon: Scale },
    { id: 'credit', label: 'Credit Analyzer', icon: Gauge },
    { id: 'emi', label: 'EMI Calculator', icon: Calculator },
    { id: 'tips', label: 'AI Financial Tips', icon: Lightbulb },
    { 
      id: 'sheet', 
      label: 'Persistence Hub', 
      icon: FileSpreadsheet,
      badge: storedRecordsCount > 0 ? storedRecordsCount : undefined 
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('eligibility')}>
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-cyan-600 via-emerald-600 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent tracking-tight">
                  FinYash <span className="text-cyan-400 font-extrabold">BFSI</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Gemini AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block tracking-wide">
                AI Loan Eligibility & Credit Intelligence
              </p>
            </div>
          </div>

          {/* Desktop Tab Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 relative ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Actions & Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Profile Preset Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowPresets(!showPresets);
                  setShowCurrencies(false);
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 transition shadow-sm"
                title="Load sample applicant profile"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Demo Profiles</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showPresets && (
                <div 
                  className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-slate-900/95 border border-slate-700/80 backdrop-blur-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setShowPresets(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800/80">
                    <p className="text-xs font-semibold text-slate-200">Preloaded Applicant Profiles</p>
                    <p className="text-[11px] text-slate-400">Click to instantly populate financial parameters</p>
                  </div>
                  <div className="py-1 space-y-1">
                    {PRESET_PROFILES.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          onSelectPreset(p.data);
                          setShowPresets(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-cyan-950/40 hover:border-cyan-800/40 border border-transparent transition flex items-start gap-2.5 group"
                      >
                        <span className="text-base p-1 rounded-lg bg-slate-800/80">{p.icon}</span>
                        <div>
                          <div className="font-semibold text-slate-200 group-hover:text-cyan-300">
                            {p.label}
                          </div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{p.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Currency Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowCurrencies(!showCurrencies);
                  setShowPresets(false);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 transition"
              >
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currency}</span>
              </button>

              {showCurrencies && (
                <div 
                  className="absolute right-0 mt-2 w-36 rounded-xl bg-slate-900/95 border border-slate-700 backdrop-blur-xl shadow-xl p-1 z-50"
                  onMouseLeave={() => setShowCurrencies(false)}
                >
                  {Object.values(CURRENCIES).map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setCurrency(c.code);
                        setShowCurrencies(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                        currency === c.code ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{c.label}</span>
                      {currency === c.code && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Yash AI Advisor Button */}
            <button
              onClick={onOpenYashChat}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-600 via-emerald-600 to-teal-500 hover:from-cyan-500 hover:to-emerald-400 shadow-md shadow-cyan-600/30 hover:shadow-cyan-500/40 transition active:scale-95"
            >
              <div className="relative">
                <MessageSquareCode className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="hidden sm:inline">Bot Yash</span>
              <span className="sm:hidden">Yash</span>
            </button>

          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-slate-800/60 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-medium transition ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.1 rounded-full text-[9px] font-bold bg-emerald-500/30 text-emerald-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
