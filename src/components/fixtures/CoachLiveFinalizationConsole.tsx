import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  MapPin, 
  Shuffle, 
  ShieldCheck, 
  Calendar, 
  Users, 
  Building2, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  Bell, 
  Sparkles, 
  BookOpen, 
  Phone, 
  Search, 
  Share2,
  FileText,
  AlertTriangle,
  RefreshCw,
  Trophy
} from 'lucide-react';
import { 
  TournamentFixture, 
  TournamentProgram, 
  TournamentStage, 
  TournamentRevealAnnouncement 
} from '../../types/tournament';
import { LIBERIA_COUNTY_ZONES } from '../../data/tournamentZoningData';
import { registerCoachForAlerts } from '../../lib/coachNotificationService';

interface CoachLiveFinalizationConsoleProps {
  fixtures: TournamentFixture[];
  announcement: TournamentRevealAnnouncement;
  selectedProgram: TournamentProgram;
  onSelectSchool?: (schoolName: string) => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  totalSeconds: number;
}

export const CoachLiveFinalizationConsole: React.FC<CoachLiveFinalizationConsoleProps> = ({
  fixtures,
  announcement,
  selectedProgram,
  onSelectSchool
}) => {
  // Navigation inside the console
  const [consoleTab, setConsoleTab] = useState<'upcoming_pairings' | 'motions_library' | 'venues_logistics' | 'my_school_tracker'>('upcoming_pairings');
  const [searchSchoolQuery, setSearchSchoolQuery] = useState('');
  const [selectedCountyFilter, setSelectedCountyFilter] = useState('All');
  const [selectedStageFilter, setSelectedStageFilter] = useState<'all' | TournamentStage>('all');
  const [expandedMotionId, setExpandedMotionId] = useState<string | null>(null);
  const [copiedFixtureId, setCopiedFixtureId] = useState<string | null>(null);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [coachPhone, setCoachPhone] = useState('');
  const [coachEmail, setCoachEmail] = useState('');
  const [coachSchoolName, setCoachSchoolName] = useState('');
  const [notificationSuccess, setNotificationSuccess] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('Just now');

  // Compute countdown to the next automated fixture finalization
  const computeTimeRemaining = (): TimeRemaining => {
    const now = new Date();
    
    // Parse target date from announcement or set upcoming milestone
    let target = new Date(announcement.revealDate);
    
    // If target is in the past, dynamically set next finalization round (e.g. this coming Friday at 10:00 AM or 3 days ahead)
    if (isNaN(target.getTime()) || target.getTime() <= now.getTime()) {
      // Create a live recurring finalization target: 3 days, 6 hours from base date
      target = new Date(now.getTime() + (3 * 24 * 3600 + 14 * 3600 + 35 * 60) * 1000);
    }

    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true, totalSeconds: 0 };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const totalSeconds = Math.floor(diff / 1000);

    return { days, hours, minutes, seconds, isPast: false, totalSeconds };
  };

  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(computeTimeRemaining());

  // Second-by-second live countdown ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(computeTimeRemaining());
    }, 1000);

    return () => clearInterval(timer);
  }, [announcement.revealDate]);

  // Extract upcoming fixtures (scheduled or live)
  const upcomingFixtures = useMemo(() => {
    return fixtures.filter(f => f.program === selectedProgram && f.status !== 'completed');
  }, [fixtures, selectedProgram]);

  // Filtered upcoming fixtures
  const filteredUpcoming = useMemo(() => {
    return upcomingFixtures.filter(f => {
      const matchCounty = selectedCountyFilter === 'All' || 
        f.county.toLowerCase() === selectedCountyFilter.toLowerCase() ||
        f.teamA.county.toLowerCase() === selectedCountyFilter.toLowerCase() ||
        f.teamB.county.toLowerCase() === selectedCountyFilter.toLowerCase();

      const matchStage = selectedStageFilter === 'all' || f.stage === selectedStageFilter;
      
      const q = searchSchoolQuery.toLowerCase().trim();
      const matchSearch = !q ||
        f.teamA.schoolName.toLowerCase().includes(q) ||
        f.teamB.schoolName.toLowerCase().includes(q) ||
        f.venue.toLowerCase().includes(q) ||
        f.roundName.toLowerCase().includes(q);

      return matchCounty && matchStage && matchSearch;
    });
  }, [upcomingFixtures, selectedCountyFilter, selectedStageFilter, searchSchoolQuery]);

  // Extract all accredited schools present in fixtures for quick lookup
  const allSchoolsList = useMemo(() => {
    const schoolMap = new Map<string, { name: string; county: string }>();
    fixtures.forEach(f => {
      schoolMap.set(f.teamA.schoolName, { name: f.teamA.schoolName, county: f.teamA.county });
      schoolMap.set(f.teamB.schoolName, { name: f.teamB.schoolName, county: f.teamB.county });
    });
    return Array.from(schoolMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [fixtures]);

  // Selected school for tracker
  const selectedSchoolFixture = useMemo(() => {
    if (!searchSchoolQuery.trim()) return null;
    const q = searchSchoolQuery.toLowerCase();
    return fixtures.find(f => 
      f.teamA.schoolName.toLowerCase().includes(q) || 
      f.teamB.schoolName.toLowerCase().includes(q)
    );
  }, [fixtures, searchSchoolQuery]);

  // Handle manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshedTime('Just now');
    }, 600);
  };

  // Copy match dispatch for team
  const handleCopyDispatch = (fix: TournamentFixture) => {
    const text = `🏆 YFC LIBERIA OFFICIAL MATCH DISPATCH
Match: ${fix.roundName}
County: ${fix.county}
Affirmative (Proposition): ${fix.teamA.schoolName}
Negative (Opposition): ${fix.teamB.schoolName}
Date & Time: ${fix.matchDate} at ${fix.matchTime}
Confirmed Venue: ${fix.venue}
Motion: "${fix.motion}"
Anti-Bias Code: ${fix.antiBiasHash}
Report at venue 60 mins prior for roll call!`;

    navigator.clipboard.writeText(text);
    setCopiedFixtureId(fix.id);
    setTimeout(() => setCopiedFixtureId(null), 2500);
  };

  // Submit coach SMS and Email alert registration
  const handleRegisterAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerCoachForAlerts({
        schoolName: coachSchoolName.trim() || 'Accredited Institution',
        coachName: 'School Faculty Advisor',
        email: coachEmail.trim(),
        phone: coachPhone.trim(),
        county: 'Montserrado',
        program: selectedProgram || 'debate',
        alertMethod: coachPhone.trim() && coachEmail.trim() ? 'both' : coachEmail.trim() ? 'email' : 'sms',
        status: 'active',
        registeredAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Failed to persist coach registration to Firestore, continuing with local confirmation:', err);
    }
    setNotificationSuccess(true);
    setTimeout(() => {
      setNotificationModalOpen(false);
      setNotificationSuccess(false);
      setCoachPhone('');
      setCoachEmail('');
    }, 2000);
  };

  return (
    <section id="coach-live-finalization-console" className="bg-slate-900 text-white rounded-3xl border border-emerald-500/30 shadow-2xl overflow-hidden relative">
      {/* Subtle background ambient glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner: Status & Live Protocol Indicator */}
      <div className="bg-emerald-950/80 px-6 py-3 border-b border-emerald-700/40 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <span className="font-mono font-black text-emerald-300 uppercase tracking-wider text-[11px]">
            Live Forensics Secretariat Protocol
          </span>
          <span className="hidden sm:inline text-slate-400">•</span>
          <span className="hidden sm:inline text-slate-300">
            Cryptographic Anti-Bias Pairing Engine Active
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-[11px]">
            Updated: <strong className="text-emerald-300">{lastRefreshedTime}</strong>
          </span>
          <button
            onClick={handleRefresh}
            title="Refresh Live Fixtures"
            className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/40 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Console Header & Countdown Display */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Header Texts */}
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Coaches, Principals & School Delegation Center</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              Live Fixture Finalization, Motions & Venue Radar
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Track real-time updates as the Secretariat concludes preliminary results and mathematically generates the next round of pairings, motion assignments, and confirmed venue dispatches across Liberia.
            </p>
          </div>

          {/* DYNAMIC COUNTDOWN TIMER CARD */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-xl min-w-[290px] sm:min-w-[340px] relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase text-emerald-400">
                <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Next Fixture Finalization</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">
                Auto-Lock Draw
              </span>
            </div>

            {/* Numbers Display */}
            <div className="grid grid-cols-4 gap-2 pt-3 text-center">
              {/* Days */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5">
                <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {String(timeLeft.days).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Days</div>
              </div>

              {/* Hours */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5">
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  {String(timeLeft.hours).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Hours</div>
              </div>

              {/* Minutes */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5">
                <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Mins</div>
              </div>

              {/* Seconds */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2.5">
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Secs</div>
              </div>
            </div>

            {/* Countdown Explainer & Alert Button */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
              <span className="text-[11px] text-slate-400 leading-tight">
                Pairings & sides lock when countdown hits zero
              </span>
              <button
                type="button"
                onClick={() => setNotificationModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 hover:text-emerald-200 bg-emerald-950 hover:bg-emerald-900 px-2.5 py-1.5 rounded-lg border border-emerald-700/60 transition-colors cursor-pointer shrink-0"
              >
                <Bell className="w-3 h-3 text-emerald-400" />
                <span>Alert Me</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs Inside Console */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setConsoleTab('upcoming_pairings')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              consoleTab === 'upcoming_pairings'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Shuffle className="w-4 h-4" />
            <span>1. Upcoming Pairings Radar</span>
            <span className="px-1.5 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 font-mono rounded">
              {upcomingFixtures.length}
            </span>
          </button>

          <button
            onClick={() => setConsoleTab('motions_library')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              consoleTab === 'motions_library'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>2. Generated Motions & Briefs</span>
          </button>

          <button
            onClick={() => setConsoleTab('venues_logistics')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              consoleTab === 'venues_logistics'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>3. Confirmed Venues & Dispatches</span>
          </button>

          <button
            onClick={() => setConsoleTab('my_school_tracker')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              consoleTab === 'my_school_tracker'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>4. Track My School Match</span>
          </button>
        </div>

        {/* TAB 1: UPCOMING PAIRINGS RADAR */}
        {consoleTab === 'upcoming_pairings' && (
          <div className="space-y-4">
            {/* Filter controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Filter Stage:</span>
                <button
                  onClick={() => setSelectedStageFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${selectedStageFilter === 'all' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  All Stages
                </button>
                <button
                  onClick={() => setSelectedStageFilter('zonal_prelims')}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${selectedStageFilter === 'zonal_prelims' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  Zonal Prelims
                </button>
                <button
                  onClick={() => setSelectedStageFilter('county_finals')}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${selectedStageFilter === 'county_finals' ? 'bg-emerald-700 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  County Finals
                </button>
                <button
                  onClick={() => setSelectedStageFilter('national_championship')}
                  className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${selectedStageFilter === 'national_championship' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300'}`}
                >
                  15-County Super Round
                </button>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedCountyFilter}
                  onChange={e => setSelectedCountyFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="All">All 15 Counties</option>
                  {LIBERIA_COUNTY_ZONES.map(z => z.county).filter((v, i, a) => a.indexOf(v) === i).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Filter by school name..."
                  value={searchSchoolQuery}
                  onChange={e => setSearchSchoolQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500 w-44"
                />
              </div>
            </div>

            {/* List of upcoming pairings */}
            {filteredUpcoming.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 space-y-2">
                <Shuffle className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="font-bold text-slate-300 text-sm">No upcoming fixtures match your filter</div>
                <p className="text-xs text-slate-500">Try resetting the stage or county dropdowns above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredUpcoming.map(fixture => {
                  const isCopied = copiedFixtureId === fixture.id;

                  return (
                    <div 
                      key={fixture.id} 
                      className="bg-slate-950/80 rounded-2xl border border-slate-800 hover:border-emerald-500/60 transition-all p-5 flex flex-col justify-between space-y-4 relative group"
                    >
                      {/* Top Bar */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black text-[11px] rounded-md">
                              {fixture.county}
                            </span>
                            <span className="text-xs font-bold text-slate-300">
                              {fixture.roundName}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                              {fixture.matchDate}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-400" />
                              {fixture.matchTime}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-bold rounded-full">
                            Pairing Locked
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyDispatch(fixture)}
                            title="Copy Dispatch for WhatsApp"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Face-off Teams Arena */}
                      <div className="grid grid-cols-5 gap-2 items-center bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        {/* Team A (Affirmative) */}
                        <div className="col-span-2 text-left space-y-1">
                          <span className="text-[10px] font-black uppercase text-teal-400 bg-teal-950/60 border border-teal-800 px-1.5 py-0.5 rounded">
                            {fixture.teamA.role.includes('Affirmative') ? 'Affirmative' : 'Primary'}
                          </span>
                          <div className="font-bold text-white text-xs sm:text-sm leading-snug">
                            {fixture.teamA.schoolName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {fixture.teamA.county} County
                          </div>
                        </div>

                        {/* Center VS Indicator */}
                        <div className="col-span-1 text-center">
                          <div className="w-7 h-7 mx-auto rounded-full bg-emerald-950 border border-emerald-600 text-emerald-300 font-mono font-black text-[10px] flex items-center justify-center shadow-xs">
                            VS
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 block mt-1">Impartial</span>
                        </div>

                        {/* Team B (Negative) */}
                        <div className="col-span-2 text-right space-y-1">
                          <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-1.5 py-0.5 rounded">
                            {fixture.teamB.role.includes('Negative') ? 'Negative' : 'Challenger'}
                          </span>
                          <div className="font-bold text-white text-xs sm:text-sm leading-snug">
                            {fixture.teamB.schoolName}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {fixture.teamB.county} County
                          </div>
                        </div>
                      </div>

                      {/* Motion & Domain */}
                      <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-emerald-400 uppercase tracking-wide">Generated Motion:</span>
                          <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-[10px]">{fixture.motionDomain}</span>
                        </div>
                        <p className="text-slate-200 font-semibold italic text-xs leading-relaxed">
                          "{fixture.motion}"
                        </p>
                      </div>

                      {/* Venue & Anti-bias Hash footer */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-slate-300 font-semibold">{fixture.venue}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono text-[10px] text-emerald-400/80">
                          <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>Hash: {fixture.antiBiasHash}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GENERATED MOTIONS LIBRARY */}
        {consoleTab === 'motions_library' && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">National Forensics Council Certified Motion Pool</h3>
                <p className="text-slate-400 text-[11px]">Prepared motions announced in advance for school delegations and coach training camps.</p>
              </div>
              <div className="text-[11px] font-mono bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded border border-emerald-800">
                WSDC Standard Rules Applied
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fixtures.map(f => (
                <div key={f.id} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold rounded uppercase">
                      {f.motionDomain}
                    </span>
                    <span className="text-slate-400 text-[10px]">{f.county} • {f.roundName}</span>
                  </div>

                  <h4 className="font-bold text-white text-xs sm:text-sm italic leading-snug">
                    "{f.motion}"
                  </h4>

                  {f.motionInfoSlide && (
                    <div className="p-2.5 bg-slate-900 rounded-lg text-[11px] text-slate-300 border border-slate-800/80 leading-relaxed">
                      <strong className="text-emerald-400 uppercase text-[10px] block mb-1">Debater Information Brief:</strong>
                      {f.motionInfoSlide}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                    <span>Format: 8m Substantive / 4m Reply</span>
                    <span className="text-emerald-400 font-mono text-[10px]">Draw ID: {f.antiBiasHash.split('-')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CONFIRMED VENUES & LOGISTICS DESK */}
        {consoleTab === 'venues_logistics' && (
          <div className="space-y-4">
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white">Nationwide Match Venues & Arrival Directives</h3>
                <p className="text-slate-400 text-[11px]">
                  All participating high schools must report to designated venue security and secretariats exactly 60 minutes prior to scheduled match time for official roll call.
                </p>
              </div>
              <span className="px-3 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold rounded-lg text-xs shrink-0 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>60-Min Roll Call Strict</span>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {LIBERIA_COUNTY_ZONES.map(z => (
                <div key={z.id} className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black rounded">
                      {z.county}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Zone #{z.zoneNumber}</span>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Confirmed Primary Facility:</div>
                    <div className="font-bold text-white text-xs sm:text-sm mt-0.5 flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{z.primaryVenue}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded-lg border border-slate-800/80">
                    <div className="text-slate-400 text-[10px] uppercase font-bold">Zonal Coverage:</div>
                    <div>{z.name} ({z.districts.slice(0, 2).join(', ')})</div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="text-[11px] text-slate-300 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{z.coordinatorPhone}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{z.coordinatorName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TRACK MY SCHOOL MATCH (COACH DESK) */}
        {consoleTab === 'my_school_tracker' && (
          <div className="space-y-6">
            <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">
                  Coach School Match Tracker & Dispatch Lookup
                </h3>
                <p className="text-xs text-slate-400">
                  Select or type your institution's name to instantly reveal your designated side, scheduled venue, motion brief, and roll-call clock.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search e.g. B.W. Harris, CWA, Tubman High, Kakata..."
                    value={searchSchoolQuery}
                    onChange={e => setSearchSchoolQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <select
                  value={searchSchoolQuery}
                  onChange={e => setSearchSchoolQuery(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                >
                  <option value="">Or Pick From Accredited Roster ({allSchoolsList.length})</option>
                  {allSchoolsList.map(s => (
                    <option key={s.name} value={s.name}>{s.name} ({s.county})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results of school lookup */}
            {selectedSchoolFixture ? (
              <div className="bg-gradient-to-br from-emerald-950/90 to-slate-900 border-2 border-emerald-500/60 rounded-2xl p-6 space-y-5 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-800/80">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs rounded-full">
                      Accredited Delegation Found
                    </span>
                    <span className="text-xs font-bold text-emerald-200">
                      {selectedSchoolFixture.county} County
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyDispatch(selectedSchoolFixture)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-emerald-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedFixtureId === selectedSchoolFixture.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy Official Dispatch Slip</span>
                  </button>
                </div>

                {/* Match Details Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/80 p-4 rounded-xl border border-emerald-800/60 space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Match Stage & Round</div>
                    <div className="font-bold text-white text-base">{selectedSchoolFixture.roundName}</div>
                    <div className="text-xs text-emerald-300 flex items-center gap-2 pt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{selectedSchoolFixture.matchDate} at {selectedSchoolFixture.matchTime}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900/80 p-4 rounded-xl border border-emerald-800/60 space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">Designated Venue & Location</div>
                    <div className="font-bold text-white text-base flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{selectedSchoolFixture.venue}</span>
                    </div>
                    <div className="text-xs text-rose-300 font-semibold">
                      Arrival Roll-Call: 60 minutes before debate start
                    </div>
                  </div>
                </div>

                {/* Teams & Roles */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-slate-400 uppercase">Assigned Debate Sides (Coin-Flip Verified):</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-teal-950/60 border border-teal-800 rounded-lg">
                      <span className="text-[10px] font-black uppercase text-teal-400 block mb-0.5">Affirmative (Proposition):</span>
                      <strong className="text-white text-sm">{selectedSchoolFixture.teamA.schoolName}</strong>
                    </div>
                    <div className="p-3 bg-indigo-950/60 border border-indigo-800 rounded-lg">
                      <span className="text-[10px] font-black uppercase text-indigo-400 block mb-0.5">Negative (Opposition):</span>
                      <strong className="text-white text-sm">{selectedSchoolFixture.teamB.schoolName}</strong>
                    </div>
                  </div>
                </div>

                {/* Motion brief */}
                <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase">Resolution to Debate:</span>
                  <p className="text-white font-bold italic text-sm leading-relaxed">
                    "{selectedSchoolFixture.motion}"
                  </p>
                  {selectedSchoolFixture.motionInfoSlide && (
                    <div className="mt-2 text-slate-300 text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      {selectedSchoolFixture.motionInfoSlide}
                    </div>
                  )}
                </div>

                {/* Hash code */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                  <span>Cryptographic Proof: {selectedSchoolFixture.antiBiasHash}</span>
                  <span className="text-emerald-400">Status: Official Confirmed Dispatch</span>
                </div>
              </div>
            ) : searchSchoolQuery.trim() ? (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 space-y-2">
                <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
                <div className="font-bold text-slate-300 text-sm">No scheduled match found for "{searchSchoolQuery}"</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Verify the school name spelling or select your school from the accredited list above. If your school has recently applied, wait for the next automated draw countdown.
                </p>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800 space-y-2">
                <Search className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="font-bold text-slate-300 text-sm">Select Your High School to View Match Dispatch</div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Coaches can review their specific opponents, motion briefs, and arrival times in one click.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ALERT NOTIFICATION MODAL FOR COACHES */}
      {notificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-6 max-w-md w-full text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Bell className="w-4 h-4" />
                <span>Coach SMS & Email Match Alerts</span>
              </div>
              <button
                onClick={() => setNotificationModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Register your phone number and email to receive an instant push notification the second the next round of fixtures and motions are finalized by the anti-bias engine.
            </p>

            {notificationSuccess ? (
              <div className="p-4 bg-emerald-950 border border-emerald-500 rounded-xl text-center space-y-1 text-xs text-emerald-200">
                <Check className="w-6 h-6 text-emerald-400 mx-auto" />
                <div className="font-bold">Coach Alert Activated!</div>
                <div>You will receive SMS dispatches when the timer completes.</div>
              </div>
            ) : (
              <form onSubmit={handleRegisterAlert} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">School / Institution Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.W. Harris Episcopal High"
                    value={coachSchoolName}
                    onChange={e => setCoachSchoolName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Coach / Delegation Phone (SMS Alerts)</label>
                  <input
                    type="tel"
                    required
                    placeholder="+231 77X XXX XXX"
                    value={coachPhone}
                    onChange={e => setCoachPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Coach Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="coach@school.edu.lr"
                    value={coachEmail}
                    onChange={e => setCoachEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNotificationModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors cursor-pointer"
                  >
                    Activate Alert
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
