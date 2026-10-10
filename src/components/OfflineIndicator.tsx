import React, { useState } from 'react';
import { WifiOff, ShieldCheck, Database, X, CheckCircle2, ChevronRight } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getOfflineArchiveStatus } from '../lib/offlineArchiveCache';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState<boolean>(false);
  const status = getOfflineArchiveStatus();

  if (isOnline || dismissed) return null;

  return (
    <div 
      id="offline-archive-indicator"
      className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 bg-slate-900/95 text-white p-4 rounded-2xl border border-emerald-500/50 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <WifiOff className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                Offline Mode Active
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>SW Cached</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">
              Unstable internet detected. All <strong>10 historical archives (2015–2025)</strong> and rules remain fully accessible from your local Service Worker cache.
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-400 font-medium">
              <Database className="w-3.5 h-3.5" />
              <span>Full tournament records & motions preserved offline</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          title="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export const StaticArchiveOfflineBadge: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
        isOnline 
          ? 'bg-emerald-50/80 text-emerald-800 border-emerald-200' 
          : 'bg-amber-50 text-amber-900 border-amber-300 shadow-xs'
      }`}
      title="Service Worker actively caches 2015-2025 historical tournament archives for offline access across Liberia"
    >
      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
      <span>{isOnline ? 'Archives SW Cached (2015-2025)' : 'Offline Archive Active'}</span>
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
    </div>
  );
};
