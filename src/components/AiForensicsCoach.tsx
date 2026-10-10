import React, { useState } from 'react';
import { 
  Bot, Sparkles, X, Send, Lightbulb, Flame, 
  Cpu, BookOpen, CheckCircle2, RotateCcw, MessageSquare, ChevronRight 
} from 'lucide-react';

export const AiForensicsCoach: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [selectedMode, setSelectedMode] = useState<'motion' | 'rebuttal' | 'stem' | 'poi'>('motion');
  const [isLoading, setIsLoading] = useState(false);
  const [chatLog, setChatLog] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your Youth For Change AI Forensics & STEM Coach. How can I help your high school team prepare for the National Debate Championship or STEM Challenge today?'
    }
  ]);

  const presetQueries = [
    { label: '🔥 Analyze 2024 Final Motion', query: 'Analyze the motion: This House would mandate that 20% of mineral export royalties directly fund secondary STEM laboratories.', mode: 'motion' as const },
    { label: '🛡️ Generate Rebuttal Points', query: 'Give me 3 strong rebuttal arguments against government subsidies for renewable energy in rural Liberia.', mode: 'rebuttal' as const },
    { label: '⚡ Point of Information (POI)', query: 'Craft 2 sharp 15-second POIs to destabilize the affirmative claim on digital voting systems.', mode: 'poi' as const },
    { label: '🔬 STEM Prototype Feasibility', query: 'How can a high school student team build a solar cassava drying machine using locally sourced parts in Bong County?', mode: 'stem' as const }
  ];

  const handleSend = async (customPrompt?: string, modeOverride?: 'motion' | 'rebuttal' | 'stem' | 'poi') => {
    const promptText = customPrompt || inputQuery;
    const currentMode = modeOverride || selectedMode;
    if (!promptText.trim()) return;

    const userMessage = { sender: 'user' as const, text: promptText };
    setChatLog(prev => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          mode: currentMode
        })
      });

      if (!response.ok) {
        throw new Error('API response failed');
      }

      const data = await response.json();
      setChatLog(prev => [...prev, { sender: 'ai', text: data.reply }]);
    } catch (err) {
      setChatLog(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `[Coach Advice]:\n1. Framing & Definition: Always identify the immediate problem in Liberia (e.g. access, funding, equity across 15 counties).\n2. Constructive Pillars: Present two substantive arguments focused on socioeconomic dividends and constitutional fairness.\n3. Impact Metric: Ground every point in how it uplifts students in rural high schools.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        id="ai-coach-launcher-btn"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-900 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl hover:shadow-emerald-900/30 hover:scale-105 transition-all flex items-center gap-2.5 border-2 border-yellow-400 group cursor-pointer"
      >
        <div className="relative">
          <Bot className="w-5 h-5 text-yellow-300" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping"></span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full"></span>
        </div>
        <span className="hidden sm:inline text-xs font-black tracking-wider uppercase">
          AI Forensics Coach
        </span>
      </button>

      {/* Slide-over / Modal Coach Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full sm:max-w-2xl h-[90vh] sm:h-[680px] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400 text-slate-950 flex items-center justify-center font-bold shadow-md">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm sm:text-base text-white">
                      AI Forensics & STEM Coach
                    </h3>
                    <span className="text-[9px] bg-yellow-400 text-slate-950 font-black px-1.5 py-0.2 rounded uppercase">
                      Gemini 2.5 Flash
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    High school forensics strategist & STEM prototype advisor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Selectors */}
            <div className="bg-slate-100 p-2 border-b border-slate-200 flex gap-1 overflow-x-auto text-xs font-bold text-slate-700">
              {[
                { key: 'motion', label: 'Motion Breakdown', icon: Flame },
                { key: 'rebuttal', label: 'Rebuttal Engine', icon: ShieldCheckIcon },
                { key: 'poi', label: 'POI Generator', icon: Sparkles },
                { key: 'stem', label: 'STEM Advisor', icon: Cpu }
              ].map(m => {
                const Icon = m.icon;
                const active = selectedMode === m.key;
                return (
                  <button
                    key={m.key}
                    onClick={() => setSelectedMode(m.key as any)}
                    className={`px-3 py-1 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                      active ? 'bg-emerald-800 text-white shadow-xs' : 'hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Chat Conversation Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
              {chatLog.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-emerald-800 text-white rounded-br-xs shadow-md'
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200 shadow-xs'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-slate-500 rounded-2xl p-4 flex items-center gap-2 border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]"></span>
                    <span className="text-xs font-semibold">Coach is drafting strategic arguments...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Quick Practice Prompts:
              </span>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {presetQueries.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSelectedMode(preset.mode);
                      handleSend(preset.query, preset.mode);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-[11px] font-medium whitespace-nowrap hover:border-emerald-700 hover:text-emerald-800 transition-colors shrink-0 cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-slate-200 bg-white flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  selectedMode === 'motion' ? 'Enter debate motion to analyze...' :
                  selectedMode === 'rebuttal' ? 'Enter opponent argument to refute...' :
                  selectedMode === 'poi' ? 'Enter topic for quick POI question...' :
                  'Ask about your STEM invention or science prototype...'
                }
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSend();
                }}
                className="flex-1 bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !inputQuery.trim()}
                className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ask Coach</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function ShieldCheckIcon(props: any) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
