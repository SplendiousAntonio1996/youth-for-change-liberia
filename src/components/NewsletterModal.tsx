import React, { useState, useEffect } from 'react';
import { Mail, Sparkles, X, CheckCircle2, ShieldCheck, Bell, ArrowRight } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { subscribeToNewsletter } from '../lib/subscriberService';
import { AnimatedCheckmark } from './AnimatedCheckmark';

interface NewsletterModalProps {
  activeTab: string;
}

export function NewsletterModal({ activeTab }: NewsletterModalProps) {
  const { success, error: toastError } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState<'all' | 'debate' | 'stem' | 'scholarships'>('all');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  useEffect(() => {
    // Only trigger for users on the landing page ('home')
    if (activeTab !== 'home') return;

    // Check if user has already dismissed or subscribed in localStorage
    try {
      const hasSeenModal = localStorage.getItem('yfc_newsletter_dismissed');
      if (hasSeenModal) return;
    } catch {
      // Storage access disabled or restricted in iframe
      return;
    }

    const timer = setTimeout(() => {
      try {
        // Re-verify that user is still on home view and has not dismissed
        const alreadyDismissed = localStorage.getItem('yfc_newsletter_dismissed');
        if (!alreadyDismissed) {
          setIsOpen(true);
        }
      } catch {
        // Ignore
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeTab]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsOpen(false);
    // Mark as dismissed for future sessions
    try {
      localStorage.setItem('yfc_newsletter_dismissed', 'true');
    } catch {
      // Ignore
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;

    setStatus('submitting');
    try {
      const categoryMap: Record<string, string> = {
        all: 'All Dispatches',
        debate: 'Debate & Oratory',
        stem: 'STEM & Robotics',
        scholarships: 'Scholarships & Grants'
      };
      const category = categoryMap[interest] || 'All Dispatches';

      const res = await subscribeToNewsletter({
        email: email.trim(),
        category,
        source: 'Welcome Pop-up Modal',
        notes: 'Subscribed from homepage welcome modal'
      });

      setStatus('success');
      success(res.message, 'Subscription Confirmed');
      try {
        localStorage.setItem('yfc_newsletter_dismissed', 'true');
      } catch {
        // Ignore
      }

      // Auto close after 2.5 seconds on success
      setTimeout(() => {
        setIsOpen(false);
      }, 2500);
    } catch (err: any) {
      setStatus('idle');
      toastError(err.message || 'Could not subscribe', 'Error');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-300"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="newsletter-modal-title"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-100 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top Decorative Banner with Brand Elements */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-6 sm:p-7 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-yellow-400 text-emerald-950 flex items-center justify-center font-bold shadow-xs">
                <Bell className="w-4 h-4" />
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-yellow-300">
                Official YFC Liberia Dispatch
              </span>
            </div>

            <button
              id="close-newsletter-modal-btn"
              onClick={handleClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 transition-colors cursor-pointer"
              aria-label="Close newsletter modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h2 id="newsletter-modal-title" className="text-xl sm:text-2xl font-black text-white mt-3 leading-snug">
            Stay Ahead with Live Tournament & STEM Updates
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 leading-relaxed">
            Get instant motion drops, tournament brackets, scholarship notices, and STEM challenge alerts delivered straight to your inbox.
          </p>

          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Modal Body / Form */}
        <div className="p-6 sm:p-7 space-y-5">
          {status === 'success' ? (
            <div className="py-6 text-center space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-center mx-auto my-2">
                <AnimatedCheckmark size="lg" color="emerald" showHalo={true} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                You're Officially Subscribed!
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                Thank you for connecting with Youth For Change Liberia. We will send you upcoming tournament motions, live scores, and empowerment news.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-2 text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
              >
                Close this window
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Primary Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="newsletter-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="e.g., student@liberiadebate.org"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Interest Focus (Optional)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
                  {[
                    { key: 'all', label: 'All Highlights' },
                    { key: 'debate', label: 'National Debate' },
                    { key: 'stem', label: 'STEM & Robotics' },
                    { key: 'scholarships', label: 'Scholarships' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setInterest(tab.key as any)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        interest === tab.key
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="newsletter-submit-btn"
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>{status === 'submitting' ? 'Subscribing...' : 'Subscribe to National Updates'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> No spam • Unsubscribe anytime
                </span>
                <button
                  type="button"
                  onClick={handleClose}
                  className="text-slate-500 hover:text-slate-700 underline cursor-pointer"
                >
                  Maybe later
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
