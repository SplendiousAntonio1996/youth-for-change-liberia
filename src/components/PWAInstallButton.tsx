import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'badge' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  className = '',
  variant = 'header'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer ${className}`}
        title="Install YFC Liberia App for offline access"
      >
        <Download className="w-3.5 h-3.5 text-yellow-300" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          id="pwa-install-ios-btn"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer ${className}`}
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
          <span>Install on iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-base font-black text-slate-900">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                  <span>Tap the <strong className="text-slate-900">Share</strong> button <Share2 className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" /> in the Safari toolbar at the bottom of your screen.</span>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                  <span>Scroll down and tap <strong className="text-slate-900">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline text-slate-700 mx-0.5" />.</span>
                </div>

                <div className="flex items-start gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                  <span>Tap <strong className="text-slate-900">Add</strong> in the top-right corner to access all 2015-2025 archives offline anytime.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
