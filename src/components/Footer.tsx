import React, { useState, useEffect } from 'react';
import { 
  Star, Mail, Phone, MapPin, Sparkles, CheckCircle2, 
  AlertCircle, Users,
  Facebook, Twitter, Linkedin, ExternalLink, Share2, MessageSquare,
  Lock
} from 'lucide-react';
import { 
  NavTab, AboutSubTab, ProgramsSubTab, DebateSubTab, 
  StemSubTab, ResultsSubTab, GallerySubTab, InvolvedSubTab 
} from '../types';
import { YocLogo } from './YocLogo';
import { useToast } from '../context/ToastContext';
import { SubscriberItem } from '../types';
import { 
  subscribeToSubscribersList, 
  subscribeToNewsletter 
} from '../lib/subscriberService';
import { AnimatedCheckmark } from './AnimatedCheckmark';

interface FooterProps {
  setTab: (tab: NavTab) => void;
  setAboutSub: (sub: AboutSubTab) => void;
  setProgramsSub: (sub: ProgramsSubTab) => void;
  setDebateSub: (sub: DebateSubTab) => void;
  setStemSub: (sub: StemSubTab) => void;
  setResultsSub: (sub: ResultsSubTab) => void;
  setGallerySub: (sub: GallerySubTab) => void;
  setInvolvedSub: (sub: InvolvedSubTab) => void;
  setAlumniSub?: (sub: any) => void;
}

export const Footer: React.FC<FooterProps> = ({
  setTab,
  setAboutSub,
  setProgramsSub,
  setDebateSub,
  setStemSub,
  setResultsSub,
  setGallerySub,
  setInvolvedSub
}) => {
  const { success: toastSuccess, warning: toastWarning, error: toastError } = useToast();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Dispatches');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ email: string; category: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchronized subscriber state
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);

  useEffect(() => {
    const unsub = subscribeToSubscribersList((list) => {
      setSubscribers(list);
    });
    return () => unsub();
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const emailTrimmed = newsletterEmail.trim().toLowerCase();

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await subscribeToNewsletter({
        email: emailTrimmed,
        category: selectedCategory,
        source: 'Footer Newsletter',
        notes: 'Subscribed from footer dispatch form'
      });

      if (res.isNew) {
        setSuccessInfo({ email: emailTrimmed, category: selectedCategory });
        setNewsletterEmail('');
        toastSuccess(res.message, 'Subscription Active');
      } else {
        toastWarning(res.message, 'Already Registered');
        setSuccessInfo({ email: emailTrimmed, category: selectedCategory });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not complete subscription.');
      toastError(err.message || 'Subscription failed', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navTo = (tab: NavTab, sub?: () => void) => {
    setTab(tab);
    if (sub) sub();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-900 text-slate-300 border-t-4 border-emerald-800 pt-12 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter & Impact Banner */}
        <div className="bg-emerald-900 rounded-3xl p-6 sm:p-8 mb-12 text-white relative overflow-hidden shadow-xl border border-emerald-700">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-6 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-yellow-400 text-emerald-950 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Stay Connected With YOUTH for Change .INC
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Official Championship Dispatch & Tournament Results
              </h3>
              <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
                Subscribe to receive live debate fixtures, STEM challenge prototypes, scholarship opportunities, and 15-county qualifier updates.
              </p>
              <div className="flex items-center gap-3 pt-1 text-xs text-emerald-200">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-700/60 font-semibold shadow-inner">
                  <Users className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-emerald-100">
                    <strong className="text-white font-black text-sm">{subscribers.length}</strong> active subscribers across 15 counties
                  </span>
                </span>
              </div>
            </div>

            <div className="lg:col-span-6">
              {successInfo ? (
                <div className="bg-white/10 border border-emerald-300/40 rounded-2xl p-4 space-y-2 text-emerald-100 text-xs backdrop-blur-xs animate-in fade-in duration-300">
                  <div className="flex items-center gap-2.5 font-bold text-sm text-emerald-200">
                    <AnimatedCheckmark size={24} color="yellow" showHalo={true} />
                    <span>Successfully Subscribed to YFC Liberia Dispatch!</span>
                  </div>
                  <p className="text-slate-100">
                    <strong>{successInfo.email}</strong> has been registered for <strong>{successInfo.category}</strong> dispatches.
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSuccessInfo(null)}
                      className="bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      Subscribe Another Email
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 text-emerald-300 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="footer-newsletter-input"
                        type="email"
                        required
                        placeholder="Enter your email address..."
                        value={newsletterEmail}
                        onChange={(e) => {
                          setNewsletterEmail(e.target.value);
                          if (errorMessage) setErrorMessage(null);
                        }}
                        className="w-full bg-emerald-950/80 border border-emerald-600 text-white placeholder-emerald-300/70 pl-9 pr-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                    </div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-emerald-950/80 border border-emerald-600 text-white text-xs sm:text-sm px-3 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
                      title="Select dispatch preference"
                    >
                      <option value="All Dispatches">All Dispatches</option>
                      <option value="National Debate Championship">Debate Championship</option>
                      <option value="STEM & Innovation">STEM & Innovation</option>
                      <option value="Scholarships & Grants">Scholarships & Grants</option>
                    </select>
                    <button
                      id="footer-newsletter-submit-btn"
                      type="submit"
                      className="bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shrink-0 cursor-pointer"
                    >
                      Subscribe
                    </button>
                  </div>

                  {errorMessage && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-300 bg-rose-950/60 border border-rose-800/80 px-3 py-1.5 rounded-md">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                  <p className="text-[11px] text-emerald-200">
                    We respect your privacy. Subscriptions are stored securely and you can unsubscribe at any time.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Social Media & Community Connection Section */}
        <div className="bg-slate-950/70 border border-emerald-800/60 rounded-3xl p-6 sm:p-8 mb-12 shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-700 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-2">
                <Share2 className="w-3.5 h-3.5" /> Connect Our Community
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Join the Youth For Change Liberia Digital Network
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
                Follow our official social media channels for real-time championship round results, live stream links, debate motion announcements, student spotlights, and partner highlights across Liberia.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800">
                Active Community: 45K+ Engaged Youth
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Facebook */}
            <a
              id="footer-social-facebook"
              href="https://facebook.com/youthforchangeliberia"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-slate-900/90 hover:bg-[#1877F2]/10 border border-slate-800 hover:border-[#1877F2]/60 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between space-y-4 hover:shadow-lg cursor-pointer"
              aria-label="Visit Youth For Change Liberia on Facebook"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#1877F2]/20 border border-[#1877F2]/40 text-[#1877F2] flex items-center justify-center group-hover:bg-[#1877F2] group-hover:text-white transition-colors shadow-xs">
                    <Facebook className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-yellow-300 transition-colors flex items-center gap-1.5">
                      Facebook
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">@youthforchangeliberia</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-[#1877F2] transition-colors shrink-0" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Watch tournament livestreams, cheer for school delegations, and join town hall debates with 28k+ Liberian followers.
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Daily Photo Albums & Updates</span>
                <span className="text-[#1877F2] font-bold group-hover:underline flex items-center gap-1">
                  Follow Page →
                </span>
              </div>
            </a>

            {/* X (formerly Twitter) */}
            <a
              id="footer-social-twitter"
              href="https://x.com/yfcliberia"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-600 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between space-y-4 hover:shadow-lg cursor-pointer"
              aria-label="Visit Youth For Change Liberia on X (formerly Twitter)"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center group-hover:bg-white group-hover:text-slate-950 transition-colors shadow-xs">
                    <Twitter className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-yellow-300 transition-colors flex items-center gap-1.5">
                      X (formerly Twitter)
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">@yfcliberia</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Get real-time motion announcements, round-by-round adjudication scorecards, and live hashtag commentary.
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Fast Tournament Dispatches</span>
                <span className="text-white font-bold group-hover:underline flex items-center gap-1">
                  Follow @yfcliberia →
                </span>
              </div>
            </a>

            {/* LinkedIn */}
            <a
              id="footer-social-linkedin"
              href="https://linkedin.com/company/youth-for-change-liberia"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-slate-900/90 hover:bg-[#0A66C2]/10 border border-slate-800 hover:border-[#0A66C2]/60 rounded-2xl p-5 transition-all duration-300 flex flex-col justify-between space-y-4 hover:shadow-lg cursor-pointer"
              aria-label="Visit Youth For Change Liberia on LinkedIn"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#0A66C2]/20 border border-[#0A66C2]/40 text-[#0A66C2] flex items-center justify-center group-hover:bg-[#0A66C2] group-hover:text-white transition-colors shadow-xs">
                    <Linkedin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-yellow-300 transition-colors flex items-center gap-1.5">
                      LinkedIn
                    </h4>
                    <span className="text-[11px] text-slate-400 font-mono">Youth For Change Liberia</span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-[#0A66C2] transition-colors shrink-0" />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Connect with our alumni network, institutional development partners, scholarship sponsors, and executive leadership.
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Corporate & Academic Network</span>
                <span className="text-[#0A66C2] font-bold group-hover:underline flex items-center gap-1">
                  Connect on LinkedIn →
                </span>
              </div>
            </a>
          </div>
        </div>

        {/* 10-Branch Site Architecture Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-12 text-xs">
          {/* Col 1: About */}
          <div>
            <h4 className="text-yellow-400 font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              About Us
            </h4>
            <ul className="space-y-2">
              <li><button onClick={() => navTo('about', () => setAboutSub('story'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Our Story</button></li>
              <li><button onClick={() => navTo('about', () => setAboutSub('mission'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Mission & Vision</button></li>
              <li><button onClick={() => navTo('about', () => setAboutSub('leadership'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Leadership</button></li>
              <li><button onClick={() => navTo('about', () => setAboutSub('partners'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Partners</button></li>
            </ul>
          </div>

          {/* Col 2: Programs */}
          <div>
            <h4 className="text-yellow-400 font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              Programs
            </h4>
            <ul className="space-y-2">
              <li><button onClick={() => navTo('programs', () => setProgramsSub('debate-prog'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">National Debate</button></li>
              <li><button onClick={() => navTo('programs', () => setProgramsSub('stem-prog'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">STEM Challenge</button></li>
              <li><button onClick={() => navTo('programs', () => setProgramsSub('mentorship'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Mentorship</button></li>
              <li><button onClick={() => navTo('programs', () => setProgramsSub('academic'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Academic Empowerment</button></li>
              <li><button onClick={() => navTo('programs', () => setProgramsSub('leadership-prog'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Youth Leadership</button></li>
            </ul>
          </div>

          {/* Col 3: Debate Championship */}
          <div>
            <h4 className="text-yellow-400 font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              Debate Editions
            </h4>
            <ul className="space-y-1.5">
              <li><button onClick={() => navTo('fixtures')} className="hover:text-white text-yellow-300 font-black transition-colors cursor-pointer text-left flex items-center gap-1"><span>⚡ Fixtures & Motion Draw</span></button></li>
              <li><button onClick={() => navTo('debate', () => setDebateSub('2024-25'))} className="hover:text-white text-yellow-300 font-bold transition-colors cursor-pointer text-left">2024/25 Flagship</button></li>
              <li><button onClick={() => navTo('debate', () => setDebateSub('2023'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">2023 Edition</button></li>
              <li><button onClick={() => navTo('debate', () => setDebateSub('2022'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">2022 Edition</button></li>
              <li><button onClick={() => navTo('debate', () => setDebateSub('2021'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">2021 Edition</button></li>
              <li><button onClick={() => navTo('debate', () => setDebateSub('2020'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">2020 Edition</button></li>
              <li><button onClick={() => navTo('debate', () => setDebateSub('2015'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">2015 Inaugural</button></li>
              <li><button onClick={() => navTo('debate', () => setDebateSub('future'))} className="hover:text-yellow-300 text-blue-300 transition-colors cursor-pointer text-left">Future Vision</button></li>
            </ul>
          </div>

          {/* Col 4: STEM & Results */}
          <div>
            <h4 className="text-yellow-400 font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              STEM & Results
            </h4>
            <ul className="space-y-2">
              <li><button onClick={() => navTo('stem', () => setStemSub('current'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Current Challenge</button></li>
              <li><button onClick={() => navTo('stem', () => setStemSub('projects'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Student Projects</button></li>
              <li><button onClick={() => navTo('results', () => setResultsSub('winners'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Winners Hall of Fame</button></li>
              <li><button onClick={() => navTo('results', () => setResultsSub('schools'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Schools Leaderboard</button></li>
              <li><button onClick={() => navTo('results', () => setResultsSub('counties'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">15 Counties Standings</button></li>
            </ul>
          </div>

          {/* Col 5: Gallery & Media */}
          <div>
            <h4 className="text-yellow-400 font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              Media & Press
            </h4>
            <ul className="space-y-2">
              <li><button onClick={() => navTo('gallery', () => setGallerySub('photos'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Photo Albums</button></li>
              <li><button onClick={() => navTo('gallery', () => setGallerySub('videos'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Championship Videos</button></li>
              <li><button onClick={() => navTo('gallery', () => setGallerySub('events'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Key Events</button></li>
              <li><button onClick={() => navTo('news')} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">News & Press Releases</button></li>
              <li><button onClick={() => navTo('documents')} className="hover:text-yellow-300 text-emerald-400 font-semibold transition-colors cursor-pointer text-left">Documents & PDF Portal</button></li>
            </ul>
          </div>

          {/* Col 6: Get Involved & Donate */}
          <div>
            <h4 className="text-yellow-400 font-bold mb-3 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              Get Involved & Donate
            </h4>
            <ul className="space-y-2">
              <li><button onClick={() => navTo('involved', () => setInvolvedSub('donate'))} className="hover:text-white text-yellow-300 font-bold transition-colors cursor-pointer text-left flex items-center gap-1"><span>Donate & Support</span></button></li>
              <li><button onClick={() => navTo('involved', () => setInvolvedSub('schools'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Register School</button></li>
              <li><button onClick={() => navTo('involved', () => setInvolvedSub('students'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Student Applications</button></li>
              <li><button onClick={() => navTo('involved', () => setInvolvedSub('sponsors'))} className="hover:text-yellow-300 transition-colors cursor-pointer text-left">Sponsorships & Partners</button></li>
              <li><button onClick={() => navTo('volunteer-dashboard')} className="hover:text-yellow-300 text-emerald-400 font-semibold transition-colors cursor-pointer text-left flex items-center gap-1"><span>Volunteer Hub & Ops</span></button></li>
              <li><button onClick={() => navTo('admin')} className="hover:text-white text-yellow-300 font-bold transition-colors cursor-pointer text-left flex items-center gap-1.5 pt-1 border-t border-slate-800"><Lock className="w-3 h-3 text-yellow-400" /><span>Admin Portal</span></button></li>
            </ul>
          </div>
        </div>

        {/* 15 Counties Strip */}
        <div className="border-t border-slate-800 pt-6 pb-6 mb-6">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 text-center sm:text-left">
            Active in all 15 Political Subdivisions of the Republic of Liberia
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
            {[
              'Montserrado', 'Nimba', 'Bong', 'Margibi', 'Grand Bassa', 'Lofa', 
              'Maryland', 'Sinoe', 'Grand Cape Mount', 'Grand Gedeh', 'River Gee', 
              'Rivercess', 'Bomi', 'Grand Kru', 'Gbarpolu'
            ].map(c => (
              <span key={c} className="text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-0.5 rounded border border-slate-700/60 transition-colors">
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom Copyright and Organization Details */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white p-0.5 flex items-center justify-center border border-slate-700 shadow-xs overflow-hidden shrink-0">
              <YocLogo size="sm" />
            </div>
            <div>
              <p className="font-semibold text-slate-200">YOUTH for Change .INC (YFC Liberia)</p>
              <p className="text-[11px]">Registered Non-Governmental Organization • Monrovia, Republic of Liberia</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-400" /> Sinkor / Paynesville, Monrovia
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-emerald-400" /> +231 777 401 210
            </span>
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
              <a
                href="https://facebook.com/youthforchangeliberia"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-[#1877F2] text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-xs"
              >
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://x.com/yfcliberia"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (formerly Twitter)"
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-xs"
              >
                <Twitter className="w-3.5 h-3.5" />
              </a>
              <a
                href="https://linkedin.com/company/youth-for-change-liberia"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-[#0A66C2] text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-xs"
              >
                <Linkedin className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="text-slate-500 text-[11px]">
            © 2015–{new Date().getFullYear()} YOUTH for Change .INC. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

