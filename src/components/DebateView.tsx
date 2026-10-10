import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Trophy, Flame, Award, Calendar, Users, MapPin, 
  Sparkles, CheckCircle2, Play, Pause, RotateCcw, 
  BookOpen, ChevronRight, Star, Volume2, ShieldCheck,
  Download, Database
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DebateSubTab, NavTab, InvolvedSubTab } from '../types';
import { DEBATE_EDITIONS, SAMPLE_MOTIONS_BY_CATEGORY, DEBATE_RULES } from '../data/debateData';
import { useDebateEditions } from '../hooks/useDebateEditions';
import { normalizeEditionKey } from '../lib/debateService';
import { SafeImage } from './SafeImage';
import { DebateSeasonCalendar } from './DebateSeasonCalendar';
import { StaticArchiveOfflineBadge } from './OfflineIndicator';
import { LndcTournamentArchitecture } from './LndcTournamentArchitecture';
import { LndcWinningHistory } from './LndcWinningHistory';
import { EditionDataPullOutModal } from './EditionDataPullOutModal';
import { PageHeroBanner } from './PageHeroBanner';

interface DebateViewProps {
  debateSub: DebateSubTab;
  setDebateSub: (sub: DebateSubTab) => void;
  setTab: (tab: NavTab) => void;
  setInvolvedSub: (sub: InvolvedSubTab) => void;
}

export const DebateView: React.FC<DebateViewProps> = ({
  debateSub,
  setDebateSub,
  setTab,
  setInvolvedSub
}) => {
  const { editionsMap, editionsList } = useDebateEditions();
  const normalizedSub = normalizeEditionKey(debateSub);
  const currentEdition = editionsMap[debateSub] || editionsMap[normalizedSub] || editionsList[0] || DEBATE_EDITIONS['2024-25'];

  // Motion category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [randomMotion, setRandomMotion] = useState<string>('This House would mandate that 20% of mineral export royalties fund high school STEM laboratories in rural counties.');

  // Edition Data Pull-out modal
  const [isPullOutModalOpen, setIsPullOutModalOpen] = useState<boolean>(false);

  // Debate Practice Timer
  const [timerSeconds, setTimerSeconds] = useState<number>(360); // 6 minutes default
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [speechMode, setSpeechMode] = useState<'constructive' | 'reply'>('constructive');

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const handleSetSpeechMode = (mode: 'constructive' | 'reply') => {
    setSpeechMode(mode);
    setIsTimerRunning(false);
    setTimerSeconds(mode === 'constructive' ? 360 : 180); // 6 mins or 3 mins
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleRandomMotion = () => {
    const allMotions = SAMPLE_MOTIONS_BY_CATEGORY.flatMap(c => c.motions);
    const random = allMotions[Math.floor(Math.random() * allMotions.length)];
    setRandomMotion(random);
  };

  const triggerCelebrate = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const allEditionsList: { key: DebateSubTab; label: string; badge?: string; isCalendar?: boolean }[] = [
    { key: 'winning-history', label: 'Winning History (2015–23)', badge: 'Grand Finals' },
    { key: 'lndc-stages', label: '3-Stage Architecture', badge: 'LNDC Rules' },
    { key: 'calendar', label: '2024-25 Season Calendar', badge: 'New Schedule', isCalendar: true },
    ...editionsList.map((ed, idx) => ({
      key: (ed.id || normalizeEditionKey(ed.year)) as DebateSubTab,
      label: `${ed.year} Edition`,
      badge: idx === 0 ? 'Latest' : (ed.status === 'Upcoming' ? 'Upcoming' : undefined)
    })),
    { key: 'future', label: 'Future Editions', badge: 'Vision' }
  ].filter((item, index, self) => index === self.findIndex(t => t.key === item.key));

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 space-y-10">
      {/* 1. Sleek Forest Green Hero Banner matching screenshot */}
      <PageHeroBanner
        category="2024-2025 EDITION • 15 COUNTIES • 173 SCHOOLS"
        badge="10TH JUBILEE EDITION"
        title="NATIONAL HIGH SCHOOL DEBATE CHAMPIONSHIP"
        subtitle="Liberia's premier forensics and parliamentary debate league empowering high school youth through critical thought, civil discourse and academic leadership."
        bgImage="/debate.jpg"
        stats={[
          { label: 'Participating Schools', value: '173' },
          { label: 'Liberian Counties', value: '15' },
          { label: 'Annual Debaters', value: '4,500+' },
          { label: 'Forensics Standard', value: 'WSDC / LNDC' }
        ]}
      >
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setTab('fixtures')}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black rounded-full text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5 fill-emerald-950 text-emerald-950" />
            <span>Explore Season Fixtures</span>
          </button>
          <button
            onClick={() => setDebateSub('winning-history')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/20 text-xs transition-colors cursor-pointer"
          >
            <span>Winning History (2015–23)</span>
          </button>
          <button
            onClick={() => setDebateSub('lndc-stages')}
            className="px-4 py-2 bg-emerald-900/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-500/30 rounded-full text-xs font-bold transition-colors cursor-pointer"
          >
            <span>3-Stage Format</span>
          </button>
        </div>
      </PageHeroBanner>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* 2. Sleek 4-Stages Progression Bar matching Screenshot */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-700">Tournament Timeline</span>
              <h2 className="font-condensed font-black text-2xl sm:text-3xl uppercase tracking-tight text-slate-900 mt-0.5">
                Official 4-Stage Championship Architecture
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Annual Academic Calendar (August – April)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/70 hover:border-emerald-500/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Stage 1</span>
                <span className="text-xs font-bold text-slate-400">Aug – Sep</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-2">Team Sign-up</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Teams of up to four students choose a challenge category and register with coach endorsement.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/70 hover:border-emerald-500/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">Stage 2</span>
                <span className="text-xs font-bold text-slate-400">Oct – Nov</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-2">County Qualifiers</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Intense preliminary rounds across 15 Liberian counties to crown zonal champions.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/70 hover:border-emerald-500/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800">Stage 3</span>
                <span className="text-xs font-bold text-slate-400">Jan – Feb</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-2">Regional Playoffs</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Central Stage 16-team tournament where top schools duel for Grand Final berths.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4.5 border border-slate-200/70 hover:border-emerald-500/50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-100 text-amber-900">Stage 4</span>
                <span className="text-xs font-bold text-slate-400">Mar – Apr</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mt-2">National Finals</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                The grand stage in Monrovia, national TV broadcast, awards ceremony & debate camp.
              </p>
            </div>
          </div>
        </div>

        {/* Edition Switcher & Subtabs Bar */}
        <div className="flex flex-col items-center space-y-3">
          <div className="flex flex-wrap justify-center p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 gap-1 max-w-4xl mx-auto shadow-2xs">
            {allEditionsList.map(ed => {
              const active = debateSub === ed.key;
              return (
                <button
                  key={ed.key}
                  id={`debate-nav-btn-${ed.key}`}
                  onClick={() => {
                    setDebateSub(ed.key);
                    if (ed.key === '2024-25' || ed.key === '2023') triggerCelebrate();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    active 
                      ? 'bg-emerald-800 text-white shadow-xs' 
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{ed.label}</span>
                  {ed.badge && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                      active ? 'bg-yellow-400 text-emerald-950' : 'bg-yellow-100 text-amber-900'
                    }`}>
                      {ed.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex justify-center pt-1">
            <StaticArchiveOfflineBadge />
          </div>
        </div>

      {/* LNDC 3-Stage Tournament Format or Edition Showcase */}
      {debateSub === 'lndc-stages' ? (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-emerald-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-800/90 text-yellow-300 px-3 py-1 rounded-full border border-emerald-700">
                Official Forensics Regulatory Structure
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Liberia National Debate Championship (LNDC)</h2>
              <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
                The official 3-stage progression regulating County Preliminaries, the 16-Team Central Stage with county name identification and defending champion exemptions, through to the Grand Final and Camp-based 3rd Place Match.
              </p>
            </div>
            <button
              onClick={() => setTab('fixtures')}
              className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black rounded-xl text-xs transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-2"
            >
              <span>Explore Official Fixtures & Matchups</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <LndcTournamentArchitecture
            onFilterFixturesStage={() => {
              setTab('fixtures');
            }}
          />
        </div>
      ) : (
        <>
          {/* Quick LNDC 3-Stage Architecture & Archive Info Banner */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-800 text-yellow-300 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                LNDC
              </div>
              <div>
                <div className="font-extrabold text-slate-900">Championship Tournament Format & Historical Archive</div>
                <div className="text-slate-600 text-[11px]">
                  Official 2015–2023 Winning History • 3-Stage Tournament Architecture • Grand Final Scorecards
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setDebateSub('winning-history')}
                className="px-3.5 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Trophy className="w-3.5 h-3.5 fill-emerald-950" />
                <span>Winning History (2015–23)</span>
              </button>
              <button
                onClick={() => setDebateSub('lndc-stages')}
                className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
              >
                <span>3-Stage Guide</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {debateSub === 'winning-history' ? (
            <LndcWinningHistory onSelectEdition={(key) => setDebateSub(key)} />
          ) : (
            <>
              {/* Selected Edition Showcase Card with Motion */}
              <AnimatePresence mode="wait">
        <motion.div 
          key={currentEdition.year}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
        >
          {/* Banner Top */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-emerald-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-yellow-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Trophy className="w-3.5 h-3.5 fill-yellow-300" />
                <span>Official Tournament Record • {currentEdition.year}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">{currentEdition.title}</h2>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 italic font-medium">"{currentEdition.tagline}"</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right shrink-0">
              <span className="text-[11px] text-yellow-300 block uppercase font-bold">Participation Scale</span>
              <div className="text-xl font-black text-white">{currentEdition.totalSchools} Schools</div>
              <div className="text-xs text-emerald-200">{currentEdition.totalCounties} Counties Represented</div>
              {currentEdition.year.includes('2024') && (
                <button
                  id="btn-banner-jump-calendar"
                  onClick={() => {
                    const el = document.getElementById('debate-season-calendar');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="mt-2.5 w-full px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Season Calendar</span>
                </button>
              )}

              <button
                id="btn-pull-out-edition-data"
                onClick={() => setIsPullOutModalOpen(true)}
                className="mt-2 w-full px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer border border-white/30"
                title="Pull out and download full dataset of this tournament edition"
              >
                <Download className="w-3.5 h-3.5 text-yellow-300" />
                <span>Pull Out Data (JSON/CSV)</span>
              </button>
            </div>
          </div>

          {/* Core Details Grid */}
          <div className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Winners & Final Motion */}
            <div className="lg:col-span-7 space-y-6">
              {/* Grand Champion Card */}
              <div className="bg-gradient-to-r from-amber-50 to-emerald-50 rounded-2xl p-5 border border-emerald-200 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-400 text-emerald-950 flex items-center justify-center font-black shrink-0 shadow-md">
                  <Trophy className="w-6 h-6 fill-emerald-950" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                    National Grand Champion
                  </span>
                  <h3 className="text-xl font-black text-slate-900">{currentEdition.championSchool}</h3>
                  <p className="text-xs text-slate-600">
                    County of Origin: <strong className="text-slate-800">{currentEdition.championCounty}</strong> • Final Margin: {currentEdition.finalScore}
                  </p>
                </div>
              </div>

              {/* Runner-up & MVP Duo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">1st Runner-Up Finalist</span>
                  <h4 className="font-bold text-slate-900 text-sm">{currentEdition.runnerUpSchool}</h4>
                  <p className="text-xs text-slate-500">{currentEdition.runnerUpCounty} County</p>
                </div>

                <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Tournament MVP (Best Speaker)</span>
                  <h4 className="font-bold text-emerald-900 text-sm">{currentEdition.bestSpeaker}</h4>
                  <p className="text-xs text-slate-600">{currentEdition.bestSpeakerSchool}</p>
                </div>
              </div>

              {/* Grand Final Motion Debated */}
              <div className="bg-emerald-950 text-white rounded-2xl p-6 space-y-2 border border-emerald-800 shadow-md">
                <div className="flex items-center gap-2 text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  <Flame className="w-4 h-4" /> Championship Grand Final Motion:
                </div>
                <p className="text-sm sm:text-base text-slate-100 font-serif italic leading-relaxed">
                  "{currentEdition.finalMotion}"
                </p>
                <div className="text-[11px] text-emerald-200 pt-1">
                  Tournament Theme: {currentEdition.theme}
                </div>
              </div>

              {/* Tournament Highlights */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Key Edition Highlights & Milestones:
                </h4>
                <div className="space-y-2">
                  {currentEdition.keyHighlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Visual, Semifinalists & Notable Motions */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-slate-950 flex flex-col justify-between">
                <div className="relative w-full min-h-[220px] max-h-[360px] bg-slate-950 flex items-center justify-center overflow-hidden">
                  <SafeImage
                    src={currentEdition.image}
                    alt={currentEdition.title}
                    fallbackCategory="debate"
                    fallbackTitle={currentEdition.title}
                    priority
                    className="w-full h-full max-h-[360px] object-cover object-top sm:object-contain bg-slate-950"
                  />
                </div>
                <div className="px-4 py-2.5 bg-slate-900 border-t border-slate-800 text-white flex items-center justify-between text-xs">
                  <span className="font-bold text-yellow-400 truncate pr-2">
                    {currentEdition.title}
                  </span>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold shrink-0">
                    Official Edition Media
                  </span>
                </div>
              </div>

              {/* Semifinalists */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Semi-Finalist Delegations</span>
                <div className="flex flex-wrap gap-2">
                  {currentEdition.semiFinalists.map((semi, i) => (
                    <span key={i} className="bg-white text-slate-700 px-3 py-1 rounded-lg text-xs font-semibold border border-slate-200">
                      {semi}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notable Motions from This Edition */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Other Motions Debated:</span>
                <div className="space-y-2">
                  {currentEdition.notableMotions.map((m, idx) => (
                    <div key={idx} className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 italic font-serif">
                      "{m}"
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Official Winning History of the Liberia National Debate Championship */}
      <LndcWinningHistory onSelectEdition={(key) => setDebateSub(key)} />
      </>
      )}
      </>
      )}

      {/* Visual Calendar Component: 2024-25 Season Milestones & Schedule */}
      <DebateSeasonCalendar 
        onRegisterInterest={() => {
          setTab('involved');
          setInvolvedSub('schools');
        }}
      />

      {/* Interactive Tool 1: Live Debate Practice & Speech Timer */}
      <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 border border-emerald-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-yellow-400">
              Interactive Training Tool
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
              High School Speech Timer & Motion Generator
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 mt-1">
              Used by coaches and debaters across Liberia to practice 6-minute constructive and 3-minute reply speeches.
            </p>
          </div>

          <div className="flex gap-2 bg-white/10 p-1 rounded-xl">
            <button
              onClick={() => handleSetSpeechMode('constructive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                speechMode === 'constructive' ? 'bg-yellow-400 text-emerald-950 shadow-xs' : 'text-white hover:bg-white/10'
              }`}
            >
              Constructive (6 min)
            </button>
            <button
              onClick={() => handleSetSpeechMode('reply')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                speechMode === 'reply' ? 'bg-yellow-400 text-emerald-950 shadow-xs' : 'text-white hover:bg-white/10'
              }`}
            >
              Reply Speech (3 min)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Digital Timer Display */}
          <div className="lg:col-span-5 text-center space-y-4 bg-emerald-950/80 p-6 rounded-3xl border border-emerald-700">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">
              {speechMode === 'constructive' ? 'Constructive Speech' : 'Reply Speech'}
            </span>
            <div className="text-6xl sm:text-7xl font-mono font-black text-yellow-400 tracking-wider">
              {formatTime(timerSeconds)}
            </div>

            {/* POI Status Indicator */}
            {speechMode === 'constructive' && (
              <div className="text-xs">
                {timerSeconds > 300 ? (
                  <span className="text-slate-300 bg-slate-800/90 px-3 py-1 rounded-full">Protected First Minute (No POIs)</span>
                ) : timerSeconds > 60 ? (
                  <span className="text-emerald-300 bg-emerald-900/90 border border-emerald-400/40 px-3 py-1 rounded-full animate-pulse font-bold">
                    ⚡ Points of Information (POI) Open
                  </span>
                ) : (
                  <span className="text-rose-300 bg-rose-950/90 border border-rose-500/40 px-3 py-1 rounded-full font-bold">
                    🔔 Final Protected Minute (Conclude Arguments)
                  </span>
                )}
              </div>
            )}

            {/* Timer Controls */}
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  isTimerRunning ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-950' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{isTimerRunning ? 'Pause Timer' : 'Start Speech'}</span>
              </button>

              <button
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimerSeconds(speechMode === 'constructive' ? 360 : 180);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Random Motion Practice Card */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white/10 p-6 rounded-2xl border border-white/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">Practice Motion Prompt:</span>
                <button
                  onClick={handleRandomMotion}
                  className="text-xs bg-yellow-400 hover:bg-yellow-300 text-emerald-950 px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" /> New Random Motion
                </button>
              </div>
              <p className="text-base sm:text-lg font-serif italic text-white leading-relaxed">
                "{randomMotion}"
              </p>
              <div className="text-[11px] text-emerald-200 flex items-center gap-2 pt-2 border-t border-white/10">
                <span>Rule: Affirmative side prepares 1st speaker definition; Opposition prepares rebuttal frame.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Debate Rules & Adjudication Rubric */}
      <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">Code of Competition</span>
          <h3 className="text-2xl font-black text-slate-900">Official Championship Rules & Scoring</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DEBATE_RULES.map((r, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs">
                0{i + 1}
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{r.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Records & Data Pull-Out Modal */}
      <EditionDataPullOutModal
        isOpen={isPullOutModalOpen}
        onClose={() => setIsPullOutModalOpen(false)}
        initialEditionYear={currentEdition.year}
        allEditions={editionsList}
      />
      </div>
    </div>
  );
};
