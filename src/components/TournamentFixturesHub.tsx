import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Calendar, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Shuffle, 
  Search, 
  Filter, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Radio, 
  FileText, 
  Award, 
  Phone, 
  Building2, 
  Download,
  AlertCircle,
  ExternalLink,
  X,
  Lock,
  Unlock
} from 'lucide-react';
import { 
  TournamentFixture, 
  TournamentStage, 
  TournamentProgram,
  TournamentRevealAnnouncement,
  LndcStage
} from '../types/tournament';
import { 
  INITIAL_SEASON_FIXTURES, 
  DEFAULT_TOURNAMENT_ANNOUNCEMENT,
  LIBERIA_COUNTY_ZONES 
} from '../data/tournamentZoningData';
import { CoachLiveFinalizationConsole } from './fixtures/CoachLiveFinalizationConsole';
import { LndcTournamentArchitecture } from './LndcTournamentArchitecture';
import { LndcWinningHistory } from './LndcWinningHistory';
import { FixtureDateCalendarFilter } from './fixtures/FixtureDateCalendarFilter';
import { CalicoTabEngine } from './fixtures/CalicoTabEngine';
import { PageHeroBanner } from './PageHeroBanner';
import { DebateSubTab } from '../types';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTournamentStage } from '../hooks/useTournamentStage';

interface TournamentFixturesHubProps {
  onNavigateToInvolved?: () => void;
  onNavigateToDebate?: (editionKey?: DebateSubTab) => void;
}

const LIBERIAN_COUNTIES = [
  'All Counties',
  'Montserrado',
  'Nimba',
  'Bong',
  'Margibi',
  'Grand Bassa',
  'Lofa',
  'Grand Gedeh',
  'Maryland',
  'Bomi',
  'Grand Cape Mount',
  'Sinoe',
  'River Cess',
  'Grand Kru',
  'River Gee',
  'Gbarpolu'
];

export const TournamentFixturesHub: React.FC<TournamentFixturesHubProps> = ({ 
  onNavigateToInvolved,
  onNavigateToDebate 
}) => {
  // Filters & State
  const [fixtures, setFixtures] = useState<TournamentFixture[]>(INITIAL_SEASON_FIXTURES);
  const [announcement, setAnnouncement] = useState<TournamentRevealAnnouncement>(DEFAULT_TOURNAMENT_ANNOUNCEMENT);
  const [selectedProgram, setSelectedProgram] = useState<TournamentProgram>('debate');
  const [selectedStage, setSelectedStage] = useState<TournamentStage | 'all'>('all');
  const [selectedCounty, setSelectedCounty] = useState<string>('All Counties');
  const [selectedZone, setSelectedZone] = useState<string>('All Zones');
  const [selectedSchool, setSelectedSchool] = useState<string>('All Schools');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dateStatusFilter, setDateStatusFilter] = useState<'all' | 'completed_only' | 'scheduled_only'>('all');
  const [showCalendarFilter, setShowCalendarFilter] = useState<boolean>(true);
  const [expandedMotionId, setExpandedMotionId] = useState<string | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'fixtures' | 'coach_live_updates' | 'coach_guide' | 'zones_map' | 'winning_history' | 'tabulation'>('fixtures');
  const [selectedTabFixtureId, setSelectedTabFixtureId] = useState<string | undefined>(undefined);
  const [showLiveConsoleInFixtures, setShowLiveConsoleInFixtures] = useState<boolean>(false);
  const [showLndcGuide, setShowLndcGuide] = useState<boolean>(true);

  // Tournament stage progression & locking hook
  const { 
    stageState, 
    isDeadlinePassed, 
    daysRemaining, 
    isStageLocked, 
    isStageActive 
  } = useTournamentStage();

  // Stage fixtures and completion counters
  const stage1Fixtures = useMemo(() => fixtures.filter(f => f.stage === 'county_prelims' || f.stage === 'zonal_prelims'), [fixtures]);
  const stage1CompletedCount = useMemo(() => stage1Fixtures.filter(f => f.status === 'completed').length, [stage1Fixtures]);

  const stage2Fixtures = useMemo(() => fixtures.filter(f => f.stage === 'central_stage' || f.stage === 'county_finals'), [fixtures]);
  const stage2CompletedCount = useMemo(() => stage2Fixtures.filter(f => f.status === 'completed').length, [stage2Fixtures]);

  const stage3Fixtures = useMemo(() => fixtures.filter(f => f.stage === 'grand_final_third_place' || f.stage === 'national_championship'), [fixtures]);
  const stage3CompletedCount = useMemo(() => stage3Fixtures.filter(f => f.status === 'completed').length, [stage3Fixtures]);

  // Dynamic available zones for current county filter
  const availableZones = useMemo(() => {
    const zonesSet = new Set<string>();
    if (selectedCounty !== 'All Counties') {
      LIBERIA_COUNTY_ZONES
        .filter(z => z.county.toLowerCase() === selectedCounty.toLowerCase())
        .forEach(z => zonesSet.add(z.name));
      fixtures
        .filter(f => f.county.toLowerCase() === selectedCounty.toLowerCase())
        .forEach(f => {
          if (f.teamA.zoneName) zonesSet.add(f.teamA.zoneName);
          if (f.teamB.zoneName) zonesSet.add(f.teamB.zoneName);
        });
    } else {
      fixtures.forEach(f => {
        if (f.teamA.zoneName) zonesSet.add(f.teamA.zoneName);
        if (f.teamB.zoneName) zonesSet.add(f.teamB.zoneName);
      });
      LIBERIA_COUNTY_ZONES.forEach(z => zonesSet.add(z.name));
    }
    return Array.from(zonesSet).sort();
  }, [fixtures, selectedCounty]);

  // Dynamic available participating schools for current county & zone filter
  const availableSchools = useMemo(() => {
    const schoolsSet = new Set<string>();
    fixtures.forEach(f => {
      const matchCounty = selectedCounty === 'All Counties' || f.county.toLowerCase() === selectedCounty.toLowerCase();
      const matchZone = selectedZone === 'All Zones' || 
        f.teamA.zoneName === selectedZone || 
        f.teamB.zoneName === selectedZone;

      if (matchCounty && matchZone) {
        if (f.teamA.schoolName) schoolsSet.add(f.teamA.schoolName);
        if (f.teamB.schoolName) schoolsSet.add(f.teamB.schoolName);
      }
    });
    return Array.from(schoolsSet).sort();
  }, [fixtures, selectedCounty, selectedZone]);

  // Reset zone when county changes if not valid anymore
  useEffect(() => {
    if (selectedZone !== 'All Zones' && !availableZones.includes(selectedZone)) {
      setSelectedZone('All Zones');
    }
  }, [selectedCounty, availableZones, selectedZone]);

  // Reset school when county or zone changes if not valid anymore
  useEffect(() => {
    if (selectedSchool !== 'All Schools' && !availableSchools.includes(selectedSchool)) {
      setSelectedSchool('All Schools');
    }
  }, [selectedCounty, selectedZone, availableSchools, selectedSchool]);

  // Load live fixtures & announcement from Firestore
  useEffect(() => {
    try {
      if (!db) return;
      const fixturesRef = collection(db, 'tournamentFixtures');
      const unsubscribe = onSnapshot(fixturesRef, (snapshot) => {
        if (!snapshot.empty) {
          const list: TournamentFixture[] = [];
          snapshot.forEach((d) => {
            list.push({ id: d.id, ...d.data() } as TournamentFixture);
          });
          list.sort((a, b) => (a.matchDate > b.matchDate ? 1 : -1));
          setFixtures(list);
        }
      }, (err) => {
        console.warn('Firestore fixtures sync note:', err);
      });

      // Load announcement settings
      const settingsRef = doc(db, 'tournamentSettings', 'publicReveal');
      getDoc(settingsRef).then((snap) => {
        if (snap.exists()) {
          setAnnouncement(snap.data() as TournamentRevealAnnouncement);
        }
      }).catch(err => {
        console.warn('Firestore announcement fetch note:', err);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore setup note:', e);
    }
  }, []);

  // Filtered fixtures with school, zone, stage, county, and keyword filters
  const filteredFixtures = useMemo(() => {
    return fixtures.filter((f) => {
      const matchesProgram = f.program === selectedProgram;
      const matchesStage = selectedStage === 'all' || 
        f.stage === selectedStage ||
        (selectedStage === 'county_prelims' && (f.stage === 'county_prelims' || f.stage === 'zonal_prelims')) ||
        (selectedStage === 'central_stage' && (f.stage === 'central_stage' || f.stage === 'county_finals')) ||
        (selectedStage === 'grand_final_third_place' && (f.stage === 'grand_final_third_place' || f.stage === 'national_championship'));

      const matchesCounty = selectedCounty === 'All Counties' || 
        f.county.toLowerCase() === selectedCounty.toLowerCase() ||
        f.teamA.county.toLowerCase() === selectedCounty.toLowerCase() ||
        f.teamB.county.toLowerCase() === selectedCounty.toLowerCase();

      const matchesZone = selectedZone === 'All Zones' ||
        f.teamA.zoneName === selectedZone ||
        f.teamB.zoneName === selectedZone ||
        (f.teamA.zoneName && selectedZone.toLowerCase().includes(f.teamA.zoneName.toLowerCase())) ||
        (f.teamB.zoneName && selectedZone.toLowerCase().includes(f.teamB.zoneName.toLowerCase()));

      const matchesSchool = selectedSchool === 'All Schools' ||
        f.teamA.schoolName === selectedSchool ||
        f.teamB.schoolName === selectedSchool;

      const matchesDate = !selectedDate || f.matchDate === selectedDate;

      const matchesDateStatus = 
        dateStatusFilter === 'all' ||
        (dateStatusFilter === 'completed_only' && f.status === 'completed') ||
        (dateStatusFilter === 'scheduled_only' && f.status !== 'completed');
      
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        f.teamA.schoolName.toLowerCase().includes(q) ||
        f.teamB.schoolName.toLowerCase().includes(q) ||
        (f.teamA.zoneName && f.teamA.zoneName.toLowerCase().includes(q)) ||
        (f.teamB.zoneName && f.teamB.zoneName.toLowerCase().includes(q)) ||
        f.roundName.toLowerCase().includes(q) ||
        f.motion.toLowerCase().includes(q) ||
        f.venue.toLowerCase().includes(q) ||
        f.antiBiasHash.toLowerCase().includes(q);

      return matchesProgram && matchesStage && matchesCounty && matchesZone && matchesSchool && matchesSearch && matchesDate && matchesDateStatus;
    });
  }, [fixtures, selectedProgram, selectedStage, selectedCounty, selectedZone, selectedSchool, searchQuery, selectedDate, dateStatusFilter]);

  // Total summary numbers
  const summary = useMemo(() => {
    const totalMatches = fixtures.length;
    const completedMatches = fixtures.filter(f => f.status === 'completed').length;
    const upcomingMatches = totalMatches - completedMatches;
    const uniqueSchools = new Set([
      ...fixtures.map(f => f.teamA.schoolName),
      ...fixtures.map(f => f.teamB.schoolName)
    ]).size;

    return { totalMatches, completedMatches, upcomingMatches, uniqueSchools };
  }, [fixtures]);

  const toggleExpandMotion = (id: string) => {
    setExpandedMotionId(prev => prev === id ? null : id);
  };

  const handlePrintSchedule = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20">
      {/* 1. HERO & OFFICIAL ANNOUNCEMENT BANNER */}
      <PageHeroBanner
        category="WHO, WHERE AND WHEN"
        badge={announcement.currentEdition || '10TH JUBILEE EDITION'}
        title="FIXTURES & ZONING: WHO, WHERE AND WHEN"
        subtitle="Explore upcoming matchups, venues, dates and county schedules for the National Debate & STEM Championship."
        bgImage="/group.jpg"
        stats={[
          { label: 'High Schools Paired', value: `${summary.uniqueSchools}` },
          { label: 'Official Fixtures', value: `${summary.totalMatches}` },
          { label: 'Counties Represented', value: '15' },
          { label: 'Anti-Bias Certified', value: '100%' }
        ]}
      >
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setActiveViewMode('winning_history')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black rounded-full transition-colors cursor-pointer text-xs shadow-xs"
          >
            <Trophy className="w-3.5 h-3.5 fill-emerald-950 text-emerald-950" />
            <span>Winning History (2015–23)</span>
          </button>
          <button
            onClick={handlePrintSchedule}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/20 transition-colors cursor-pointer text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Print Official Match Sheet</span>
          </button>
        </div>
      </PageHeroBanner>

      {/* 2. SUB-VIEW SWITCHER & CONTROLS */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-2 sm:p-3 rounded-2xl border border-slate-200 shadow-xs">
          {/* View Mode Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveViewMode('fixtures')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeViewMode === 'fixtures'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              <span>Fixtures & Matchups</span>
            </button>

            <button
              onClick={() => setActiveViewMode('winning_history')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeViewMode === 'winning_history'
                  ? 'bg-yellow-400 text-emerald-950 font-black shadow-sm'
                  : 'text-slate-700 hover:text-slate-950 hover:bg-amber-50/80 border border-amber-200/80'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Winning History (2015–23)</span>
            </button>

            <button
              onClick={() => setActiveViewMode('coach_live_updates')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 relative ${
                activeViewMode === 'coach_live_updates'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-emerald-50/70 border border-emerald-200/60'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Coaches & Schools Live Desk</span>
              <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded font-black">
                Finalization Radar
              </span>
            </button>

            <button
              onClick={() => setActiveViewMode('coach_guide')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeViewMode === 'coach_guide'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Coach & School Rules</span>
            </button>

            <button
              onClick={() => setActiveViewMode('zones_map')}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeViewMode === 'zones_map'
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>15 Counties Zoning Directory</span>
            </button>

            <button
              onClick={() => {
                setSelectedTabFixtureId(undefined);
                setActiveViewMode('tabulation');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeViewMode === 'tabulation'
                  ? 'bg-indigo-700 text-white shadow-sm ring-2 ring-indigo-400'
                  : 'text-indigo-800 hover:text-indigo-950 hover:bg-indigo-100/70 border border-indigo-200/80 bg-indigo-50/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>YOC DESK ENGINE</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-indigo-200 text-indigo-900 rounded font-black tracking-wide">
                e-Ballots & Tab
              </span>
            </button>
          </div>

          {/* Program Switcher (Debate vs STEM) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedProgram('debate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                selectedProgram === 'debate'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Debate Championship
            </button>
            <button
              onClick={() => setSelectedProgram('stem')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                selectedProgram === 'stem'
                  ? 'bg-white text-cyan-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              STEM Challenge
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT: FIXTURES EXPLORER */}
      {activeViewMode === 'fixtures' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
          {/* DEDICATED SECTION: COACHES & PARTICIPATING SCHOOLS LIVE FINALIZATION CONSOLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Coaches & Schools Live Finalization Desk
                </h2>
                <span className="hidden sm:inline-flex text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Live Pairings • Generated Motions • Confirmed Venues
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLiveConsoleInFixtures(prev => !prev)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
                >
                  <span>{showLiveConsoleInFixtures ? 'Hide Finalization Console' : 'Show Finalization Console'}</span>
                  {showLiveConsoleInFixtures ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {showLiveConsoleInFixtures && (
              <CoachLiveFinalizationConsole
                fixtures={fixtures}
                announcement={announcement}
                selectedProgram={selectedProgram}
                onSelectSchool={(school) => {
                  setSelectedSchool(school);
                  setSearchQuery('');
                }}
              />
            )}
          </div>

          {/* LNDC OFFICIAL 3-STAGE TOURNAMENT ARCHITECTURE & FORMAT VISUALIZER */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  LNDC Official 3-Stage Tournament Architecture
                </h2>
                <span className="hidden md:inline-flex text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Preliminaries • Central Stage (County Names) • Camp & Grand Venues
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowLndcGuide(prev => !prev)}
                className="text-xs font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1.5 cursor-pointer bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs"
              >
                <span>{showLndcGuide ? 'Collapse Architecture Guide' : 'View LNDC Architecture Guide'}</span>
                {showLndcGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showLndcGuide && (
              <LndcTournamentArchitecture
                onFilterFixturesStage={(stage) => {
                  setSelectedStage(stage as any);
                  const el = document.getElementById('fixtures-match-cards-container');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            )}
          </div>

          {/* LNDC Official Winning History & Grand Finals Ledger Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-300/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                <Trophy className="w-5 h-5 fill-slate-950" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-slate-900 text-sm sm:text-base">Official LNDC Winning History & Grand Finals Ledger (2015–2023)</span>
                  <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Championship Archive</span>
                </div>
                <div className="text-slate-600 text-xs mt-0.5">
                  Explore official champions, grand finalists, MVPs and MES from Len Miller (2015) to United Dawah Ummah (2023).
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveViewMode('winning_history')}
              className="px-4 py-2 bg-emerald-900 hover:bg-emerald-950 text-yellow-300 font-black rounded-xl text-xs transition-colors shrink-0 cursor-pointer flex items-center gap-2 shadow-xs"
            >
              <span>Explore Winning History</span>
              <Trophy className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
            </button>
          </div>

          {/* 3-Stage Progression & Locking Section Header */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-700 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider border border-emerald-400/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Championship Progression & Sequential Stage Locking</span>
                </div>
                <h2 className="text-lg font-black text-white mt-1">
                  Official Tournament Stages & Live Fixture Draws
                </h2>
                <p className="text-xs text-slate-300">
                  Strict progression rules require all high schools to play each other within their counties before advancing to Central Stage 2 (County vs County). Once Stage 2 begins, Stage 1 locks to preserve certified results.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStage('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedStage === 'all'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  View All Stages ({fixtures.length})
                </button>
              </div>
            </div>

            {/* The 3 Sequential Stage Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* Stage 1 Box */}
              <button
                type="button"
                onClick={() => setSelectedStage('county_prelims')}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                  selectedStage === 'county_prelims' || selectedStage === 'zonal_prelims'
                    ? 'bg-slate-800 border-emerald-400 ring-2 ring-emerald-500/50 shadow-lg'
                    : 'bg-slate-950/70 border-slate-700 hover:border-slate-600 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Stage 01
                  </span>
                  {stageState.stage1Locked ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 font-black text-[10px] uppercase flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked • Results Archive
                    </span>
                  ) : stageState.currentStage === 'county_prelims' ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-black text-[10px] uppercase flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Open Only & Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-slate-700 text-slate-300 font-bold text-[10px]">
                      County Prelims
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-white">Stage 1: County Preliminaries</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                  Schools play each other within their counties. All within-county matches must conclude before advancing.
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    {stage1CompletedCount} / {stage1Fixtures.length} Matches Played
                  </span>
                  <span className="text-emerald-400 font-bold">
                    {stageState.stage1Locked ? 'Previous Results' : 'Active Prelims'}
                  </span>
                </div>
              </button>

              {/* Stage 2 Box */}
              <button
                type="button"
                onClick={() => setSelectedStage('central_stage')}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                  selectedStage === 'central_stage' || selectedStage === 'county_finals'
                    ? 'bg-slate-800 border-blue-400 ring-2 ring-blue-500/50 shadow-lg'
                    : 'bg-slate-950/70 border-slate-700 hover:border-slate-600 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Stage 02
                  </span>
                  {stageState.stage2Locked && stageState.currentStage === 'county_prelims' ? (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 font-bold text-[10px] uppercase flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-slate-500" /> Locked (Awaiting Stage 1)
                    </span>
                  ) : stageState.currentStage === 'central_stage' ? (
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-200 border border-blue-400/40 font-black text-[10px] uppercase flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Ongoing (County vs County)
                    </span>
                  ) : stageState.stage2Locked ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30 font-black text-[10px] uppercase flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Locked • Results Archive
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold text-[10px]">
                      16 Teams
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-white">Stage 2: Central Round (County vs County)</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                  16 Elite Delegations (15 County Champions + Defending Champion). Stage 2 is ongoing until 4 teams are finalized.
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    {stage2CompletedCount} / {stage2Fixtures.length} Matches Played
                  </span>
                  <span className="text-blue-400 font-bold">
                    {stageState.stage2Locked && stageState.currentStage === 'county_prelims'
                      ? 'Locked Until County Matches End'
                      : stageState.stage2Locked
                      ? 'Previous Results'
                      : 'County vs County'}
                  </span>
                </div>
              </button>

              {/* Stage 3 Box */}
              <button
                type="button"
                onClick={() => setSelectedStage('grand_final_third_place')}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                  selectedStage === 'grand_final_third_place' || selectedStage === 'national_championship'
                    ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-500/50 shadow-lg'
                    : 'bg-slate-950/70 border-slate-700 hover:border-slate-600 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    Stage 03
                  </span>
                  {stageState.stage3Locked ? (
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 font-bold text-[10px] uppercase flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-slate-500" /> Locked (Awaiting Final 4)
                    </span>
                  ) : stageState.currentStage === 'grand_final_third_place' ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/30 text-amber-200 border border-amber-400/40 font-black text-[10px] uppercase flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Open & Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                      4 Finalists
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-sm text-white">Stage 3: Grand Final & Third Place</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed line-clamp-2">
                  3rd Place Bronze Clash on the Camp & National Grand Final at the E.J.S. Ministerial Complex.
                </p>

                <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    {stage3CompletedCount} / {stage3Fixtures.length} Matches Played
                  </span>
                  <span className="text-amber-400 font-bold">
                    {stageState.stage3Locked ? 'Locked Awaiting Central Round' : 'Championship Climax'}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Interactive Match Date Calendar & Results Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-2xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>Tournament Game Day Calendar & Results Filter</span>
                    {selectedDate && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Date Active: {selectedDate}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select any date on the calendar to see all games played on that day and inspect certified results.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCalendarFilter(prev => !prev)}
                className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>{showCalendarFilter ? 'Hide Calendar' : 'Open Calendar View'}</span>
                {selectedDate && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                )}
              </button>
            </div>

            {showCalendarFilter && (
              <FixtureDateCalendarFilter
                fixtures={fixtures}
                selectedDate={selectedDate}
                onSelectDate={(date) => setSelectedDate(date)}
                gameStatusFilter={dateStatusFilter}
                onChangeGameStatusFilter={(status) => setDateStatusFilter(status)}
              />
            )}
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Stage Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mr-1">Stage:</span>
                <button
                  onClick={() => setSelectedStage('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedStage === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All Stages
                </button>
                <button
                  onClick={() => setSelectedStage('county_prelims')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedStage === 'county_prelims' || selectedStage === 'zonal_prelims'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Stage 1: County Prelims
                </button>
                <button
                  onClick={() => setSelectedStage('central_stage')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedStage === 'central_stage' || selectedStage === 'county_finals'
                      ? 'bg-blue-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Stage 2: Central Stage (16 Teams)
                </button>
                <button
                  onClick={() => setSelectedStage('grand_final_third_place')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedStage === 'grand_final_third_place' || selectedStage === 'national_championship'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Stage 3: Grand Final & 3rd Place
                </button>
              </div>

              {/* County, Zone, School Dropdowns & Search */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Date Quick Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="date"
                    value={selectedDate || ''}
                    onChange={(e) => setSelectedDate(e.target.value || null)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                    title="Filter by Match Date"
                  />
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(null);
                        setDateStatusFilter('all');
                      }}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer ml-0.5"
                      title="Clear date"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* County Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={selectedCounty}
                    onChange={(e) => setSelectedCounty(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
                    title="Filter by County"
                  >
                    {LIBERIAN_COUNTIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Zone Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1">
                  <Shuffle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={selectedZone}
                    onChange={(e) => setSelectedZone(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer max-w-[150px] sm:max-w-[200px] truncate"
                    title="Filter by County Zone"
                  >
                    <option value="All Zones">All Zones ({availableZones.length})</option>
                    {availableZones.map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                {/* School Filter */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <select
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer max-w-[150px] sm:max-w-[200px] truncate"
                    title="Filter by School"
                  >
                    <option value="All Schools">All Schools ({availableSchools.length})</option>
                    {availableSchools.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Search input */}
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search school, zone, motion..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Active Filter Chips & Quick Reset */}
            {(selectedCounty !== 'All Counties' || selectedZone !== 'All Zones' || selectedSchool !== 'All Schools' || searchQuery || selectedStage !== 'all' || selectedDate) && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-400 font-bold text-[11px] uppercase tracking-wider">Active Filters:</span>
                
                {selectedDate && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[11px]">
                    <Calendar className="w-3 h-3 text-emerald-700" />
                    Game Date: {selectedDate}
                    {dateStatusFilter === 'completed_only' ? ' (Results Only)' : dateStatusFilter === 'scheduled_only' ? ' (Scheduled Only)' : ''}
                    <button 
                      type="button"
                      onClick={() => {
                        setSelectedDate(null);
                        setDateStatusFilter('all');
                      }}
                      className="hover:text-emerald-950 cursor-pointer ml-1"
                      title="Remove date filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedCounty !== 'All Counties' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                    County: {selectedCounty}
                    <button 
                      type="button"
                      onClick={() => setSelectedCounty('All Counties')}
                      className="hover:text-emerald-950 cursor-pointer"
                      title="Remove county filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedZone !== 'All Zones' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold text-[11px]">
                    Zone: {selectedZone}
                    <button 
                      type="button"
                      onClick={() => setSelectedZone('All Zones')}
                      className="hover:text-teal-950 cursor-pointer"
                      title="Remove zone filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedSchool !== 'All Schools' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold text-[11px]">
                    School: {selectedSchool}
                    <button 
                      type="button"
                      onClick={() => setSelectedSchool('All Schools')}
                      className="hover:text-indigo-950 cursor-pointer"
                      title="Remove school filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedStage !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-300 font-bold text-[11px]">
                    Stage: {
                      selectedStage === 'county_prelims' || selectedStage === 'zonal_prelims'
                        ? 'Stage 1: County Preliminaries'
                        : selectedStage === 'central_stage' || selectedStage === 'county_finals'
                        ? 'Stage 2: Central Stage (16 Teams - County Names)'
                        : 'Stage 3: Grand Final & 3rd Place'
                    }
                    <button 
                      type="button"
                      onClick={() => setSelectedStage('all')}
                      className="hover:text-slate-950 cursor-pointer"
                      title="Remove stage filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-[11px]">
                    Query: "{searchQuery}"
                    <button 
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-amber-950 cursor-pointer"
                      title="Remove search query"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedCounty('All Counties');
                    setSelectedZone('All Zones');
                    setSelectedSchool('All Schools');
                    setSelectedStage('all');
                    setSelectedDate(null);
                    setDateStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-slate-500 hover:text-rose-600 font-bold text-[11px] underline ml-auto cursor-pointer transition-colors"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* Stage Status & Progression Informational Banners */}
          {(selectedStage === 'county_prelims' || selectedStage === 'zonal_prelims') && stageState.stage1Locked && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-200 text-amber-900 rounded-xl shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wide text-amber-900">
                    Stage 1: County Preliminaries is Concluded & Locked
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    All schools have finished playing each other in their counties. County Champions have advanced to Central Stage 2 (County vs County). You can review all previous preliminary scores and ballots below.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStage('central_stage')}
                className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer shadow-xs transition-colors"
              >
                Go to Ongoing Stage 2
              </button>
            </div>
          )}

          {(selectedStage === 'central_stage' || selectedStage === 'county_finals') && stageState.stage2Locked && stageState.currentStage === 'county_prelims' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 text-white space-y-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 text-amber-400 rounded-xl border border-slate-700">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Stage 2: Central Round (County vs County) is Currently Locked
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Before moving to the Central Round, all schools must have played each other in their counties. Currently, Stage 1 has <strong>{stage1CompletedCount}</strong> of <strong>{stage1Fixtures.length}</strong> matches completed ({stage1Fixtures.length - stage1CompletedCount} matches still pending in counties).
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedStage('county_prelims')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Switch to Open Stage 1 (County Prelims)</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  Winners from each county will automatically seed into Stage 2 once Stage 1 concludes.
                </span>
              </div>
            </div>
          )}

          {(selectedStage === 'grand_final_third_place' || selectedStage === 'national_championship') && stageState.stage3Locked && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-700 text-white space-y-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 text-amber-400 rounded-xl border border-slate-700">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">
                    Stage 3: Grand Final & Third Place is Currently Locked
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Stage 1 and Stage 3 are locked while Stage 2 Central Round is ongoing, until it finalizes and determines the 4 teams that will compete for the Grand Final and Bronze 3rd-Place match. Central Stage 2 currently has <strong>{stage2CompletedCount}</strong> of <strong>{stage2Fixtures.length}</strong> matches completed.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedStage('central_stage')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Switch to Ongoing Stage 2 (Central Round)</span>
                </button>
                <span className="text-[11px] text-slate-400">
                  The 4 semifinalists will advance directly to the Camp Bronze Clash & Ministerial Complex Grand Final.
                </span>
              </div>
            </div>
          )}

          {/* Fixtures Match Cards Grid */}
          <div id="fixtures-match-cards-container" className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing <strong className="text-slate-800">{filteredFixtures.length}</strong> official fixtures
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Anti-Bias Cryptographic Draw ID verified for every matchup</span>
              </div>
            </div>

            {filteredFixtures.length === 0 ? (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-2xl border border-slate-200 p-10 sm:p-12 text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Calendar className="w-6 h-6" />
                </div>

                <h3 className="text-base font-bold text-slate-800">
                  {selectedDate ? `No games found on ${selectedDate}` : 'No matching fixtures found'}
                </h3>
                
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {selectedDate 
                    ? 'No matches match your current stage, county, or search filter on this date. You can select another day from the calendar or clear date filters to view all scheduled game days.' 
                    : 'Try adjusting your stage, school, zone, or county filter above, or search for another accredited school.'}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {selectedDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDate(null);
                        setDateStatusFilter('all');
                      }}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
                    >
                      Clear Date Filter (View All Game Days)
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCounty('All Counties');
                      setSelectedZone('All Zones');
                      setSelectedSchool('All Schools');
                      setSelectedStage('all');
                      setSelectedDate(null);
                      setDateStatusFilter('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div layout className="grid grid-cols-1 gap-5">
                <AnimatePresence mode="popLayout">
                  {filteredFixtures.map((fix) => {
                    const isExpanded = expandedMotionId === fix.id;

                    return (
                      <motion.div 
                        layout
                        key={fix.id}
                        initial={{ opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                        transition={{
                          layout: { type: 'spring', damping: 28, stiffness: 240 },
                          opacity: { duration: 0.22 }
                        }}
                        className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400/80 transition-colors overflow-hidden"
                      >
                        {/* Match Header Ribbon */}
                        <div className="bg-slate-50/90 px-6 py-3.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedCounty(fix.county)}
                              className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 font-black text-xs rounded-md transition-colors cursor-pointer"
                              title={`Filter by ${fix.county} County`}
                            >
                              {fix.county}
                            </button>
                            <span className="text-xs font-extrabold text-slate-800">
                              {fix.roundName}
                            </span>
                            {/* LNDC Stage Badges */}
                            {fix.stage === 'county_prelims' && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold text-[10px] rounded-full uppercase">
                                Stage 1 • County Prelim
                              </span>
                            )}
                            {fix.stage === 'central_stage' && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-900 font-bold text-[10px] rounded-full uppercase">
                                Stage 2 • Central Stage (County Reps)
                              </span>
                            )}
                            {fix.stage === 'grand_final_third_place' && (
                              <span className={`px-2 py-0.5 font-bold text-[10px] rounded-full uppercase ${
                                fix.roundName.includes('Third-Place') || fix.venue.toLowerCase().includes('camp')
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-yellow-400 text-yellow-950 font-black shadow-xs'
                              }`}>
                                {fix.roundName.includes('Third-Place') || fix.venue.toLowerCase().includes('camp')
                                  ? 'Stage 3 • ⛺ Played on Camp'
                                  : 'Stage 3 • 🏛️ Official Grand Venue'}
                              </span>
                            )}
                            {fix.stage === 'national_championship' && (
                              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 font-bold text-[10px] rounded-full uppercase">
                                15-County Super Round
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1 font-semibold text-slate-700">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {fix.matchDate}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {fix.matchTime}
                            </span>
                            <span>•</span>
                            {fix.status === 'completed' ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-full">
                                Completed
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[11px] rounded-full">
                                Confirmed
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Main Matchup Arena */}
                        <div className="p-6 space-y-6">
                          {/* School vs School Arena */}
                          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                            {/* Team A (Affirmative / Proposition) */}
                            <div className="md:col-span-3 bg-teal-50/40 p-4 rounded-xl border border-teal-100 space-y-1.5 relative">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-teal-800 px-2 py-0.5 bg-teal-100 rounded-md">
                                  {fix.teamA.role}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">{fix.teamA.county}</span>
                              </div>

                              <h3 
                                onClick={() => setSelectedSchool(fix.teamA.schoolName)}
                                className="text-base sm:text-lg font-black text-slate-900 leading-snug cursor-pointer hover:text-emerald-700 transition-colors"
                                title={`Filter fixtures for ${fix.teamA.schoolName}`}
                              >
                                {fix.teamA.schoolName}
                              </h3>

                              {fix.teamA.zoneName && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedZone(fix.teamA.zoneName || 'All Zones')}
                                  className="text-[11px] text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer text-left"
                                  title={`Filter fixtures for ${fix.teamA.zoneName}`}
                                >
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{fix.teamA.zoneName}</span>
                                </button>
                              )}

                              {fix.status === 'completed' && fix.teamA.score && (
                                <div className="pt-2 border-t border-teal-200/50 flex items-center justify-between text-xs font-bold text-slate-800">
                                  <span>Speaker Points: {fix.teamA.score}</span>
                                  <span>Ballots: {fix.teamA.ballots}/3</span>
                                </div>
                              )}

                              {fix.winnerRole === 'teamA' && (
                                <div className="absolute -top-3 -right-2 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black shadow-md flex items-center gap-1">
                                  <Trophy className="w-3 h-3" />
                                  <span>MATCH WINNER</span>
                                </div>
                              )}
                            </div>

                            {/* VS Center Pillar */}
                            <div className="md:col-span-1 text-center py-2 md:py-0">
                              <div className="inline-flex md:flex flex-col items-center justify-center w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-black text-xs mx-auto">
                                VS
                              </div>
                            </div>

                            {/* Team B (Negative / Opposition) */}
                            <div className="md:col-span-3 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 space-y-1.5 relative">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800 px-2 py-0.5 bg-indigo-100 rounded-md">
                                  {fix.teamB.role}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">{fix.teamB.county}</span>
                              </div>

                              <h3 
                                onClick={() => setSelectedSchool(fix.teamB.schoolName)}
                                className="text-base sm:text-lg font-black text-slate-900 leading-snug cursor-pointer hover:text-emerald-700 transition-colors"
                                title={`Filter fixtures for ${fix.teamB.schoolName}`}
                              >
                                {fix.teamB.schoolName}
                              </h3>

                              {fix.teamB.zoneName && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedZone(fix.teamB.zoneName || 'All Zones')}
                                  className="text-[11px] text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer text-left"
                                  title={`Filter fixtures for ${fix.teamB.zoneName}`}
                                >
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{fix.teamB.zoneName}</span>
                                </button>
                              )}

                              {fix.status === 'completed' && fix.teamB.score && (
                                <div className="pt-2 border-t border-indigo-200/50 flex items-center justify-between text-xs font-bold text-slate-800">
                                  <span>Speaker Points: {fix.teamB.score}</span>
                                  <span>Ballots: {fix.teamB.ballots}/3</span>
                                </div>
                              )}

                              {fix.winnerRole === 'teamB' && (
                                <div className="absolute -top-3 -right-2 bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px] font-black shadow-md flex items-center gap-1">
                                  <Trophy className="w-3 h-3" />
                                  <span>MATCH WINNER</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Motion / Challenge Statement Box */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black uppercase tracking-wide text-emerald-800">
                                  {fix.program === 'debate' ? 'Confirmed Debate Motion' : 'STEM Face-off Theme'}:
                                </span>
                                <span className="text-[11px] px-2 py-0.5 bg-slate-200 text-slate-700 font-semibold rounded-md">
                                  {fix.motionDomain}
                                </span>
                              </div>

                              <button
                                onClick={() => toggleExpandMotion(fix.id)}
                                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                              >
                                <span>{isExpanded ? 'Hide Brief' : 'View Debate Brief'}</span>
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            <p className="text-sm sm:text-base font-bold text-slate-900 italic leading-relaxed">
                              "{fix.motion}"
                            </p>

                            {isExpanded && fix.motionInfoSlide && (
                              <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600 space-y-1 animate-in fade-in">
                                <div className="font-bold text-slate-700 uppercase text-[10px]">Background & Information Slide:</div>
                                <p className="leading-relaxed">{fix.motionInfoSlide}</p>
                                <div className="text-[11px] text-slate-400 italic pt-1">
                                  WSDC Format: 3 speakers per side (8-min substantive speeches, 4-min reply speech). Points of Information (POIs) permitted between minutes 1 and 7.
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Venue, Adjudicators & Anti-Bias Verification Footer */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                            {/* Venue */}
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-semibold text-slate-500 text-[10px] uppercase">Official Venue:</div>
                                <div className="font-bold text-slate-800">{fix.venue}</div>
                              </div>
                            </div>

                            {/* Conflict-Free Panel */}
                            <div className="flex items-start gap-2">
                              <Users className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="font-semibold text-slate-500 text-[10px] uppercase">Certified Adjudication Panel:</div>
                                <div className="text-slate-800 font-medium">
                                  {fix.adjudicators.map(a => `${a.name} (${a.countyOfOrigin})`).join(', ')}
                                </div>
                              </div>
                            </div>

                            {/* Anti-Bias Audit Code & YOC Desk Action */}
                            <div className="flex items-center justify-between gap-2 sm:col-span-2 lg:col-span-1">
                              <div className="flex items-start gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-semibold text-slate-500 text-[10px] uppercase">Anti-Bias Audit Code:</div>
                                  <div className="font-mono text-xs font-bold text-emerald-800">{fix.antiBiasHash}</div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTabFixtureId(fix.id);
                                  setActiveViewMode('tabulation');
                                }}
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border border-indigo-200/80 rounded-lg text-[11px] font-bold inline-flex items-center gap-1.5 transition cursor-pointer shrink-0"
                                title="Open YOC Desk e-Ballot for this matchup"
                              >
                                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                <span>e-Ballot</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* 3b. DEDICATED VIEW: COACHES & PARTICIPATING SCHOOLS LIVE FINALIZATION DESK */}
      {activeViewMode === 'coach_live_updates' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
          <CoachLiveFinalizationConsole
            fixtures={fixtures}
            announcement={announcement}
            selectedProgram={selectedProgram}
            onSelectSchool={(school) => {
              setSearchQuery(school);
              setActiveViewMode('fixtures');
            }}
          />
        </div>
      )}

      {/* 4. SUB-VIEW: COACH & SCHOOL RULES */}
      {activeViewMode === 'coach_guide' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-full">
                <FileText className="w-3.5 h-3.5" />
                <span>Forensics & STEM Delegation Roster Guide</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                Official Coach & School Match-Day Protocol
              </h2>
              <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
                Mandatory directives for secondary school principals, debate coaches, STEM mentors, and accredited student scholars participating in the 2024–2025 National Championship.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              {/* Item 1 */}
              <div className="space-y-2">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>1. Arrival & Roll Call Timing</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Delegations must arrive at their assigned county venue at least 60 minutes prior to scheduled debate commencement. Failure to present 3 substantive debaters and 1 alternate at roll call incurs an automatic 5-point deduction.
                </p>
              </div>

              {/* Item 2 */}
              <div className="space-y-2">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>2. Anti-Bias Cryptographic Draw Guarantees</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  All matchups, side designations (Affirmative/Negative), and motions are executed mathematically via pseudo-random seeding to ensure absolute impartiality. Adjudicators originating from the competing schools’ counties are strictly disqualified from sitting on that panel.
                </p>
              </div>

              {/* Item 3 */}
              <div className="space-y-2">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>3. World Schools Debate Format (WSDC)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Substantive speeches are 8 minutes in duration. Reply speeches are 4 minutes delivered by either the 1st or 2nd speaker. POIs may be offered only between the 1st and 7th minute. Electronic communication devices are prohibited during live rounds.
                </p>
              </div>

              {/* Item 4 */}
              <div className="space-y-2">
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                  <span>4. Advancement & County Representation</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Winners of each zonal preliminary advance to their County Championship. The single victorious school from each of Liberia’s 15 counties automatically secures an accredited seat at the National Debate Championship Super Round in Monrovia.
                </p>
              </div>
            </div>

            {/* Helpline Callout */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="font-bold text-emerald-900">Need Immediate Secretariat Clarification?</div>
                <div className="text-emerald-700">Call the National Forensics Helpline: +231 777 401 210 or email info@youthforchange.org.lr</div>
              </div>
              {onNavigateToInvolved && (
                <button
                  onClick={onNavigateToInvolved}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg shrink-0 transition-colors cursor-pointer"
                >
                  Accreditation Roster
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-VIEW: 15 COUNTIES ZONING DIRECTORY */}
      {activeViewMode === 'zones_map' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-full">
                <Building2 className="w-3.5 h-3.5" />
                <span>Nationwide Geographic Distribution</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                All 15 Counties Geographic Forensics Zones
              </h2>
              <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
                Review the accredited zonal demarcations, administrative districts, designated regional auditoriums, and county coordinators established to bring competitive forensics to every corner of Liberia.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              {LIBERIA_COUNTY_ZONES.map((z) => (
                <div key={z.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-black text-xs rounded-md">
                      {z.county}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Zone #{z.zoneNumber}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{z.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{z.description}</p>

                  <div className="pt-2 border-t border-slate-200 text-xs space-y-1">
                    <div>
                      <strong className="text-slate-700">Primary Venue:</strong> {z.primaryVenue}
                    </div>
                    <div className="text-slate-500">
                      <strong>Coordinator:</strong> {z.coordinatorName} ({z.coordinatorPhone})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. SUB-VIEW: LNDC OFFICIAL WINNING HISTORY & GRAND FINALS LEDGER (2015–2023) */}
      {activeViewMode === 'winning_history' && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
          <LndcWinningHistory 
            onSelectEdition={(editionKey) => {
              if (onNavigateToDebate) {
                onNavigateToDebate(editionKey);
              }
            }} 
          />
        </div>
      )}

      {/* 7. SUB-VIEW: YOC DESK ENGINE FORENSICS TABULATION */}
      {activeViewMode === 'tabulation' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <CalicoTabEngine
            initialFixtureId={selectedTabFixtureId}
            onClose={() => {
              setSelectedTabFixtureId(undefined);
              setActiveViewMode('fixtures');
            }}
          />
        </div>
      )}
    </div>
  );
};
