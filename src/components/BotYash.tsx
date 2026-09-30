import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquareCode, 
  Send, 
  Sparkles, 
  X, 
  Minimize2, 
  Maximize2, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  Bot, 
  User, 
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { ChatMessage } from '../types';

interface BotYashProps {
  isOpen: boolean;
  onClose: () => void;
  userContext: any;
}

const DEFAULT_QUESTIONS = [
  'Will a 710 credit score get me approved for a home loan at prime rates?',
  'How can I lower my FOIR ratio from 55% to below 40%?',
  'Should I prepay my home loan early or invest in high-growth mutual funds?',
  'What is the difference between Flat vs Reducing interest rates?',
  'Can I add a co-applicant to increase my loan eligibility?'
];

export const BotYash: React.FC<BotYashProps> = ({
  isOpen,
  onClose,
  userContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'yash',
      text: `Hello! I'm **Yash**, your dedicated BFSI (Banking & Financial Services) Advisor. 

I can help you evaluate bank underwriting rules, calculate your exact loan capacity, explain CIBIL & credit dynamics, or formulate aggressive debt-freedom strategies. 

How can I assist your financial journey today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: messages.map(m => ({ sender: m.sender, text: m.text })),
          currentContext: userContext,
        }),
      });

      const data = await res.json();
      const botReply = data.reply || "I've reviewed your query from a BFSI underwriting perspective. Maintaining credit discipline and optimizing FOIR under 50% are your strongest levers.";

      const botMsg: ChatMessage = {
        id: `msg-y-${Date.now()}`,
        sender: 'yash',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);

      // Optional text-to-speech
      if (speechEnabled && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(botReply.replace(/[*#]/g, ''));
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.error('Yash chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'yash',
          text: "I encountered a minor network blip while consulting the BFSI intelligence service. In institutional banking, maintaining a sub-40% FOIR and 750+ credit score remains the benchmark for prime rate approvals.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setMessages([
      {
        id: 'msg-welcome-reset',
        sender: 'yash',
        text: `Fresh slate! I'm **Yash**, ready for your next question on loan eligibility, FOIR, credit repair, or bank negotiations.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 flex flex-col ${
        isExpanded
          ? 'inset-2 sm:inset-6 md:inset-10'
          : 'bottom-4 right-4 sm:bottom-6 sm:right-6 w-[94vw] sm:w-[440px] h-[600px] max-h-[85vh]'
      }`}
    >
      {/* Container Box with Dark Glassmorphism */}
      <div className="w-full h-full rounded-3xl bg-slate-950/95 border border-cyan-500/40 backdrop-blur-2xl shadow-2xl shadow-cyan-950/60 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 p-[1.5px]">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm text-white">Bot Yash</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-semibold">
                  BFSI Specialist
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Institutional Underwriter & Advisor</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSpeechEnabled(!speechEnabled)}
              className={`p-1.5 rounded-lg text-xs transition ${
                speechEnabled ? 'text-cyan-400 bg-cyan-950/80' : 'text-slate-400 hover:text-slate-200'
              }`}
              title={speechEnabled ? 'Mute voice read aloud' : 'Enable voice read aloud'}
            >
              {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition hidden sm:block"
              title={isExpanded ? 'Minimize view' : 'Expand full window'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 transition"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Active Context Bar (shows Yash is aware of active profile) */}
        {userContext && userContext.monthlyIncome && (
          <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Active Context:</span>
              <strong className="text-white font-mono">{userContext.applicantName || 'Applicant'}</strong>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-emerald-400">{userContext.monthlyIncome} Inc</span>
              {userContext.creditScore && <span className="text-cyan-400">{userContext.creditScore} Score</span>}
            </div>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((m) => {
            const isYash = m.sender === 'yash';
            return (
              <div 
                key={m.id} 
                className={`flex gap-3 text-xs leading-relaxed ${isYash ? 'justify-start' : 'justify-end'}`}
              >
                {isYash && (
                  <div className="w-7 h-7 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center flex-shrink-0 text-cyan-400 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div 
                  className={`group relative max-w-[85%] rounded-2xl p-3.5 ${
                    isYash 
                      ? 'bg-slate-900/90 border border-slate-800 text-slate-200 shadow-md' 
                      : 'bg-gradient-to-r from-cyan-600 to-emerald-600 text-white shadow-md'
                  }`}
                >
                  {/* Message Text with Simple Markdown Bold Handling */}
                  <div className="whitespace-pre-line space-y-1">
                    {m.text.split('\n').map((line, idx) => {
                      if (line.startsWith('**') && line.endsWith('**')) {
                        return <p key={idx} className="font-bold text-cyan-300">{line.replace(/\*\*/g, '')}</p>;
                      }
                      if (line.startsWith('• ') || line.startsWith('- ')) {
                        return (
                          <div key={idx} className="flex items-start gap-1.5 ml-1">
                            <span className="text-cyan-400 font-bold">•</span>
                            <span>{line.substring(2)}</span>
                          </div>
                        );
                      }
                      return <p key={idx}>{line}</p>;
                    })}
                  </div>

                  <div className={`mt-1.5 flex items-center justify-between text-[9px] ${isYash ? 'text-slate-500' : 'text-cyan-100'}`}>
                    <span>{m.timestamp}</span>
                    {isYash && (
                      <button
                        onClick={() => handleCopy(m.id, m.text)}
                        className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-cyan-300 ml-2"
                        title="Copy answer"
                      >
                        {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                </div>

                {!isYash && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0 text-slate-300 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 text-xs leading-relaxed justify-start">
              <div className="w-7 h-7 rounded-xl bg-cyan-950 border border-cyan-800 flex items-center justify-center flex-shrink-0 text-cyan-400">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-slate-400 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>Yash is evaluating BFSI data...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Chips */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 overflow-x-auto scrollbar-none flex gap-2">
          {DEFAULT_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="text-[11px] whitespace-nowrap px-3 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-300 border border-slate-700 transition flex items-center gap-1.5 flex-shrink-0"
            >
              <span>{q}</span>
              <ArrowRight className="w-3 h-3 text-cyan-400" />
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Yash about loans, CIBIL, FOIR, prepayments..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white disabled:opacity-40 transition shadow-md shadow-cyan-600/30"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
