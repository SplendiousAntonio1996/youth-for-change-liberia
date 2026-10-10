import React, { useState } from 'react';
import { 
  Menu, X, Search, ChevronDown, Award, Cpu, Trophy, 
  Sparkles, Calendar, BookOpen, Users, Mail, Compass, Star,
  GraduationCap, FileText, Lock, ShieldCheck, Heart, Newspaper,
  MessageSquareQuote, Shuffle, BarChart3, Bell, Target, HeartHandshake
} from 'lucide-react';
import { 
  NavTab, AboutSubTab, ProgramsSubTab, DebateSubTab, 
  StemSubTab, ResultsSubTab, GallerySubTab, InvolvedSubTab,
  AlumniSubTab
} from '../types';
import { YocLogo } from './YocLogo';
import { PWAInstallButton } from './PWAInstallButton';
import { CoachAlertsModal } from './CoachAlertsModal';

interface HeaderProps {
  currentTab?: NavTab;
  activeTab?: NavTab;
  setTab?: (tab: NavTab) => void;
  setActiveTab?: (tab: NavTab) => void;
  aboutSub: AboutSubTab;
  setAboutSub: (sub: AboutSubTab) => void;
  programsSub: ProgramsSubTab;
  setProgramsSub: (sub: ProgramsSubTab) => void;
  debateSub: DebateSubTab;
  setDebateSub: (sub: DebateSubTab) => void;
  stemSub: StemSubTab;
  setStemSub: (sub: StemSubTab) => void;
  resultsSub: ResultsSubTab;
  setResultsSub: (sub: ResultsSubTab) => void;
  gallerySub: GallerySubTab;
  setGallerySub: (sub: GallerySubTab) => void;
  involvedSub: InvolvedSubTab;
  setInvolvedSub: (sub: InvolvedSubTab) => void;
  alumniSub?: AlumniSubTab;
  setAlumniSub?: (sub: AlumniSubTab) => void;
  openSearch?: () => void;
  onOpenSearch?: () => void;
  onOpenYearlyReport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  activeTab,
  setTab,
  setActiveTab,
  aboutSub,
  setAboutSub,
  programsSub,
  setProgramsSub,
  debateSub,
  setDebateSub,
  stemSub,
  setStemSub,
  resultsSub,
  setResultsSub,
  gallerySub,
  setGallerySub,
  involvedSub,
  setInvolvedSub,
  alumniSub,
  setAlumniSub,
  openSearch,
  onOpenSearch,
  onOpenYearlyReport
}) => {
  const activeCurrentTab = activeTab || currentTab || 'home';
  const triggerTabChange = (tab: NavTab) => {
    if (setActiveTab) setActiveTab(tab);
    else if (setTab) setTab(tab);
  };
  const triggerSearch = onOpenSearch || openSearch || (() => {});

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isCoachAlertsOpen, setIsCoachAlertsOpen] = useState(false);

  const handleNav = (tab: NavTab, subAction?: () => void) => {
    triggerTabChange(tab);
    if (subAction) subAction();
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems: { id: NavTab; label: string }[] = [
    { id: 'debate', label: 'Debate' },
    { id: 'stem', label: 'STEM' },
    { id: 'fixtures', label: 'Fixtures' },
    { id: 'results', label: 'Results' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'news', label: 'News' }
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 shadow-xs">
        {/* Top 3.5px Patriotic Liberian Stripe (Red, Navy Blue, Forest Green) */}
        <div className="h-1 w-full bg-gradient-to-r from-[#c81e3a] via-[#002868] to-[#00a859]"></div>

        {/* Main Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 sm:h-20">
            
            {/* 1. Left: Brand Logo & Title */}
            <div 
              onClick={() => handleNav('home')}
              className="flex items-center gap-3 cursor-pointer group select-none shrink-0"
              title="Go to Home"
            >
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-xl flex items-center justify-center p-0.5 border border-slate-200 group-hover:border-emerald-600 transition-all shrink-0 overflow-hidden shadow-2xs">
                <YocLogo size="md" />
              </div>
              <div className="flex flex-col">
                <span className="font-condensed font-black text-lg sm:text-xl text-[#063d2e] tracking-tight leading-none group-hover:text-emerald-700 transition-colors uppercase">
                  YOUTH FOR CHANGE
                </span>
                <span className="text-slate-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mt-0.5">
                  .INC &bull; LIBERIA
                </span>
              </div>
            </div>

            {/* 2. Center: Sleek Navigation Links matching Screenshot */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = activeCurrentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#063d2e] text-white font-bold shadow-xs'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/70'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}

              {/* Discreet "More" dropdown for additional portals including About Us */}
              <div 
                className="relative"
                onMouseEnter={() => setActiveDropdown('more')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className={`px-3.5 py-1.5 rounded-full text-sm font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                    ['about', 'documents', 'alumni', 'volunteer-dashboard', 'involved', 'admin', 'contact'].includes(activeCurrentTab)
                      ? 'bg-[#063d2e] text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/70'
                  }`}
                >
                  <span>More</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                </button>

                {activeDropdown === 'more' && (
                  <div className="absolute right-0 mt-1 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150 text-xs">
                    {/* About Us Sub-Section in More */}
                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                      <span>About Youth For Change</span>
                      <span className="text-emerald-700 font-extrabold text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                        Liberia
                      </span>
                    </div>

                    <button 
                      onClick={() => handleNav('about', () => setAboutSub('story'))}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 font-semibold cursor-pointer flex items-center gap-2.5 ${activeCurrentTab === 'about' && aboutSub === 'story' ? 'text-emerald-800 bg-emerald-50/50 font-bold' : 'text-slate-700'}`}
                    >
                      <BookOpen className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <div className="leading-tight font-bold">About Us &amp; Our Story</div>
                        <div className="text-[10px] text-slate-400 font-normal">Founded 2015 • 10-Year Journey</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => handleNav('about', () => setAboutSub('mission'))}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 font-semibold cursor-pointer flex items-center gap-2.5 ${activeCurrentTab === 'about' && aboutSub === 'mission' ? 'text-emerald-800 bg-emerald-50/50 font-bold' : 'text-slate-700'}`}
                    >
                      <Target className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <div className="leading-tight font-bold">Mission &amp; Vision</div>
                        <div className="text-[10px] text-slate-400 font-normal">Strategic Purpose &amp; 5 Core Values</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => handleNav('about', () => setAboutSub('leadership'))}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 font-semibold cursor-pointer flex items-center gap-2.5 ${activeCurrentTab === 'about' && aboutSub === 'leadership' ? 'text-emerald-800 bg-emerald-50/50 font-bold' : 'text-slate-700'}`}
                    >
                      <Users className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <div className="leading-tight font-bold">Leadership Team</div>
                        <div className="text-[10px] text-slate-400 font-normal">Executive Directorate &amp; Coaches</div>
                      </div>
                    </button>

                    <button 
                      onClick={() => handleNav('about', () => setAboutSub('partners'))}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 font-semibold cursor-pointer flex items-center gap-2.5 ${activeCurrentTab === 'about' && aboutSub === 'partners' ? 'text-emerald-800 bg-emerald-50/50 font-bold' : 'text-slate-700'}`}
                    >
                      <HeartHandshake className="w-4 h-4 text-emerald-700 shrink-0" />
                      <div>
                        <div className="leading-tight font-bold">Strategic Partners</div>
                        <div className="text-[10px] text-slate-400 font-normal">Ministries, Sponsors &amp; Governance</div>
                      </div>
                    </button>

                    <div className="my-1.5 border-t border-slate-100" />
                    <div className="px-3.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Additional Portals</div>
                    
                    <button 
                      onClick={() => handleNav('documents')}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 font-semibold cursor-pointer flex items-center gap-2.5 ${activeCurrentTab === 'documents' ? 'text-emerald-800 bg-emerald-50/50 font-bold' : 'text-slate-700'}`}
                    >
                      <FileText className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Official Documents &amp; Rulebooks</span>
                    </button>

                    <button 
                      onClick={() => handleNav('alumni')}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 font-semibold cursor-pointer flex items-center gap-2.5 ${activeCurrentTab === 'alumni' ? 'text-emerald-800 bg-emerald-50/50 font-bold' : 'text-slate-700'}`}
                    >
                      <GraduationCap className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Alumni Network &amp; Testimonials</span>
                    </button>

                    <button 
                      onClick={() => handleNav('volunteer-dashboard')}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 font-semibold cursor-pointer flex items-center gap-2.5 ${activeCurrentTab === 'volunteer-dashboard' ? 'text-emerald-800 bg-emerald-50/50 font-bold' : 'text-slate-700'}`}
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>Volunteer &amp; Judge Hub</span>
                    </button>

                    {onOpenYearlyReport && (
                      <button 
                        onClick={() => {
                          setActiveDropdown(null);
                          onOpenYearlyReport();
                        }}
                        className="w-full text-left px-3.5 py-2 font-bold text-emerald-900 bg-yellow-400/20 hover:bg-yellow-400/30 cursor-pointer flex items-center justify-between border-t border-slate-100 mt-1"
                      >
                        <span className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-emerald-800" />
                          <span>Yearly Partner Report</span>
                        </span>
                        <span className="text-[9px] bg-yellow-400 text-slate-950 font-black px-1.5 py-0.5 rounded">2026</span>
                      </button>
                    )}

                    <button 
                      onClick={() => handleNav('admin')}
                      className="w-full text-left px-3.5 py-2 hover:bg-slate-50 font-semibold cursor-pointer flex items-center gap-2.5 text-slate-600 border-t border-slate-100 mt-1"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Admin Desk</span>
                    </button>
                  </div>
                )}
              </div>
            </nav>

            {/* 3. Right: Sleek Red "Coach alerts" button + Quick Search */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Coach alerts CTA pill button (Exact match to screenshot) */}
              <button
                type="button"
                onClick={() => setIsCoachAlertsOpen(true)}
                className="bg-[#c81e3a] hover:bg-[#b01732] text-white font-bold px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                title="Sign up for real-time Coach Fixture Alerts"
              >
                <span>Coach alerts</span>
              </button>

              {/* Quick Search Button */}
              <button
                type="button"
                onClick={triggerSearch}
                className="p-2 sm:p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Search platform (Ctrl+K)"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Yearly Partner Report Button */}
              {onOpenYearlyReport && (
                <button
                  type="button"
                  onClick={onOpenYearlyReport}
                  className="hidden md:flex p-2 sm:p-2.5 rounded-full bg-yellow-400/20 hover:bg-yellow-400/40 text-emerald-950 transition-colors cursor-pointer"
                  title="Official Yearly Partner Accountability Report"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-900" />
                </button>
              )}

              {/* Mobile Menu Hamburger */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-t border-slate-200 px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
              {navItems.map((item) => {
                const isActive = activeCurrentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold text-center transition-all ${
                      isActive 
                        ? 'bg-[#063d2e] text-white' 
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1 text-xs pt-1">
              <button
                onClick={() => handleNav('home')}
                className="w-full text-left py-2 px-3 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Home
              </button>
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 space-y-1.5">
                <button
                  onClick={() => handleNav('about')}
                  className="w-full text-left font-bold text-slate-900 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <span>About Youth For Change</span>
                  </span>
                  <span className="text-[10px] text-emerald-800 font-extrabold uppercase bg-emerald-100 px-2 py-0.5 rounded-full">
                    Liberia
                  </span>
                </button>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => handleNav('about', () => setAboutSub('story'))}
                    className="text-left px-2 py-1.5 rounded-lg bg-white text-[11px] font-semibold text-slate-700 hover:text-emerald-800 border border-slate-200"
                  >
                    📖 Our Story
                  </button>
                  <button
                    onClick={() => handleNav('about', () => setAboutSub('mission'))}
                    className="text-left px-2 py-1.5 rounded-lg bg-white text-[11px] font-semibold text-slate-700 hover:text-emerald-800 border border-slate-200"
                  >
                    🎯 Mission & Vision
                  </button>
                  <button
                    onClick={() => handleNav('about', () => setAboutSub('leadership'))}
                    className="text-left px-2 py-1.5 rounded-lg bg-white text-[11px] font-semibold text-slate-700 hover:text-emerald-800 border border-slate-200"
                  >
                    👥 Leadership Team
                  </button>
                  <button
                    onClick={() => handleNav('about', () => setAboutSub('partners'))}
                    className="text-left px-2 py-1.5 rounded-lg bg-white text-[11px] font-semibold text-slate-700 hover:text-emerald-800 border border-slate-200"
                  >
                    🤝 Strategic Partners
                  </button>
                </div>
              </div>
              <button
                onClick={() => handleNav('documents')}
                className="w-full text-left py-2 px-3 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Official Documents & PDF Portal
              </button>
              <button
                onClick={() => handleNav('alumni')}
                className="w-full text-left py-2 px-3 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Alumni Network & Testimonials
              </button>
              <button
                onClick={() => handleNav('involved')}
                className="w-full text-left py-2 px-3 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Get Involved & Donate
              </button>
              <button
                onClick={() => handleNav('admin')}
                className="w-full text-left py-2 px-3 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Admin Desk
              </button>
              {onOpenYearlyReport && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenYearlyReport();
                  }}
                  className="w-full text-left py-2.5 px-3 rounded-xl bg-yellow-400 text-emerald-950 font-bold flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Yearly Partner Report</span>
                  </span>
                  <span className="text-[10px] bg-emerald-950 text-yellow-300 px-2 py-0.5 rounded font-black">2026</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Coach Alerts Modal */}
      <CoachAlertsModal
        isOpen={isCoachAlertsOpen}
        onClose={() => setIsCoachAlertsOpen(false)}
      />
    </>
  );
};
