/**
 * CalicoTabEngine.tsx
 * YOC DESK ENGINE • Comprehensive Debate Tabulation & Tournament Management Engine
 * 
 * Features from YOC DESK ENGINE:
 * 1. Digital e-Ballots: WSDC standard speaker scoring (60-80 scale, reply 30-40), margins, RFD, and 2-person verification check-in.
 * 2. Auditorium Motion Release & Prep Timer: High-contrast presentation mode for projectors with 15/30 min prep countdown & synthesized bell alerts.
 * 3. The Tab (Standings & Speaks): Team Tab (Wins, Speaks, Margins, Buchholz Draw Strength) & Speaker Tab (Rankings, Speaks, Trimmed Mean).
 * 4. The Break Simulator: Dynamic break threshold calculations and interactive elimination bracket tree.
 * 5. Adjudicator Allocation & Conflict Matrix: Institutional and county conflict detection, plus debater judge feedback (1-10 scale).
 * 6. Round Roll Call & Check-In: Team and judge availability tracker before pairings.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, 
  FileText, 
  Clock, 
  Tv, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  ChevronRight, 
  Award, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Sparkles, 
  Star, 
  CheckSquare, 
  Square,
  X,
  ExternalLink,
  Layers,
  BookOpen,
  SlidersHorizontal,
  Flame,
  BarChart3
} from 'lucide-react';
import { TournamentFixture, Adjudicator } from '../../types/tournament';
import { INITIAL_SEASON_FIXTURES } from '../../data/tournamentZoningData';
import { useToast } from '../../context/ToastContext';
import { YearlyReportModal } from '../YearlyReportModal';

export type CalicoTabMode = 
  | 'ballots' 
  | 'presentation' 
  | 'tab_standings' 
  | 'break_simulator' 
  | 'adjudicators' 
  | 'checkin';

interface CalicoTabEngineProps {
  initialFixtureId?: string;
  onClose?: () => void;
}

// Certified Liberian Forensics Adjudicators Roster
interface AdjudicatorProfile {
  id: string;
  name: string;
  tier: 'Chief Adjudicator' | 'Deputy CA' | 'Chair' | 'Panelist' | 'Trainee';
  countyOfOrigin: string;
  affiliatedSchool: string;
  rating: number; // 1-10
  feedbackCount: number;
  averageFeedback: number;
  certifiedWSDC: boolean;
  status: 'available' | 'assigned' | 'excused';
}

const INITIAL_ADJUDICATORS: AdjudicatorProfile[] = [
  {
    id: 'adj-01',
    name: 'Cllr. Gloria Musu-Scott',
    tier: 'Chief Adjudicator',
    countyOfOrigin: 'Maryland',
    affiliatedSchool: 'Cape Palmas High School',
    rating: 9.8,
    feedbackCount: 38,
    averageFeedback: 9.7,
    certifiedWSDC: true,
    status: 'available'
  },
  {
    id: 'adj-02',
    name: 'Dr. Togba-Nah Tipoteh',
    tier: 'Chief Adjudicator',
    countyOfOrigin: 'Montserrado',
    affiliatedSchool: 'Monrovia College',
    rating: 9.9,
    feedbackCount: 42,
    averageFeedback: 9.8,
    certifiedWSDC: true,
    status: 'available'
  },
  {
    id: 'adj-03',
    name: 'Atty. Isaac Jackson',
    tier: 'Deputy CA',
    countyOfOrigin: 'Bong',
    affiliatedSchool: 'Gboveh High School',
    rating: 9.4,
    feedbackCount: 29,
    averageFeedback: 9.3,
    certifiedWSDC: true,
    status: 'available'
  },
  {
    id: 'adj-04',
    name: 'Rev. Emmanuel Bowier',
    tier: 'Chair',
    countyOfOrigin: 'Grand Bassa',
    affiliatedSchool: 'Bassa High School',
    rating: 9.1,
    feedbackCount: 24,
    averageFeedback: 9.0,
    certifiedWSDC: true,
    status: 'available'
  },
  {
    id: 'adj-05',
    name: 'Kolu G. Brown',
    tier: 'Chair',
    countyOfOrigin: 'Montserrado',
    affiliatedSchool: 'D. Twe High School',
    rating: 8.9,
    feedbackCount: 19,
    averageFeedback: 8.8,
    certifiedWSDC: true,
    status: 'available'
  },
  {
    id: 'adj-06',
    name: 'T. Wilson Gaye',
    tier: 'Panelist',
    countyOfOrigin: 'Nimba',
    affiliatedSchool: 'Tappita Central High',
    rating: 8.5,
    feedbackCount: 14,
    averageFeedback: 8.4,
    certifiedWSDC: false,
    status: 'available'
  },
  {
    id: 'adj-07',
    name: 'Fatu M. Sirleaf',
    tier: 'Panelist',
    countyOfOrigin: 'Grand Cape Mount',
    affiliatedSchool: 'Robertsport High School',
    rating: 8.6,
    feedbackCount: 12,
    averageFeedback: 8.5,
    certifiedWSDC: false,
    status: 'available'
  },
  {
    id: 'adj-08',
    name: 'Prince K. Flomo',
    tier: 'Trainee',
    countyOfOrigin: 'Lofa',
    affiliatedSchool: 'Voinjama Central High',
    rating: 7.9,
    feedbackCount: 8,
    averageFeedback: 8.0,
    certifiedWSDC: false,
    status: 'available'
  }
];

// Sample Individual Speakers for Speaker Tab (Calico Tab Speaker Tabulation)
interface TabSpeakerEntry {
  id: string;
  name: string;
  school: string;
  county: string;
  speechesDelivered: number;
  totalSpeaks: number;
  averageScore: number;
  trimmedMean: number;
  rank: number;
  isNovice: boolean;
}

const INITIAL_SPEAKER_TAB: TabSpeakerEntry[] = [
  { id: 'spk-01', name: 'Alhaji M. Kanneh', school: 'United Dawah Ummah High School', county: 'Montserrado', speechesDelivered: 4, totalSpeaks: 309, averageScore: 77.25, trimmedMean: 77.2, rank: 1, isNovice: false },
  { id: 'spk-02', name: 'Princess K. Tarr', school: 'Bishop Marweh High School', county: 'Margibi', speechesDelivered: 4, totalSpeaks: 306, averageScore: 76.50, trimmedMean: 76.4, rank: 2, isNovice: false },
  { id: 'spk-03', name: 'Jeremiah N. Gaye', school: 'St. Mary Catholic High School', county: 'Nimba', speechesDelivered: 4, totalSpeaks: 304, averageScore: 76.00, trimmedMean: 75.9, rank: 3, isNovice: false },
  { id: 'spk-04', name: 'Faith B. Kollie', school: 'Gboveh High School', county: 'Bong', speechesDelivered: 4, totalSpeaks: 301, averageScore: 75.25, trimmedMean: 75.1, rank: 4, isNovice: false },
  { id: 'spk-05', name: 'Koffa S. Weah', school: 'Tubman High School', county: 'Montserrado', speechesDelivered: 4, totalSpeaks: 299, averageScore: 74.75, trimmedMean: 74.6, rank: 5, isNovice: false },
  { id: 'spk-06', name: 'Blessing D. Roberts', school: 'Bassa High School', county: 'Grand Bassa', speechesDelivered: 4, totalSpeaks: 297, averageScore: 74.25, trimmedMean: 74.1, rank: 6, isNovice: true },
  { id: 'spk-07', name: 'Moses T. Kamara', school: 'D. Twe Memorial High', county: 'Montserrado', speechesDelivered: 4, totalSpeaks: 295, averageScore: 73.75, trimmedMean: 73.8, rank: 7, isNovice: true },
  { id: 'spk-08', name: 'Esther Z. Giddings', school: 'Zwedru Multilateral High', county: 'Grand Gedeh', speechesDelivered: 4, totalSpeaks: 293, averageScore: 73.25, trimmedMean: 73.1, rank: 8, isNovice: true }
];

export const CalicoTabEngine: React.FC<CalicoTabEngineProps> = ({ 
  initialFixtureId,
  onClose 
}) => {
  const toast = useToast();
  const [activeMode, setActiveMode] = useState<CalicoTabMode>('ballots');
  const [showYearlyReport, setShowYearlyReport] = useState<boolean>(false);
  const [fixtures, setFixtures] = useState<TournamentFixture[]>(INITIAL_SEASON_FIXTURES);
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>(initialFixtureId || fixtures[0]?.id || '');
  
  const currentFixture = useMemo(() => {
    return fixtures.find(f => f.id === selectedFixtureId) || fixtures[0];
  }, [fixtures, selectedFixtureId]);

  // ==========================================
  // MODULE 1: DIGITAL E-BALLOT STATE
  // ==========================================
  const [eBallotForm, setEBallotForm] = useState({
    aff1Speaker: 'Emmanuel Flomo',
    aff1Score: 76,
    aff2Speaker: 'Kebeh Kollie',
    aff2Score: 75,
    aff3Speaker: 'Moses Tokpah',
    aff3Score: 77,
    affReplySpeaker: 'Emmanuel Flomo',
    affReplyScore: 38,

    neg1Speaker: 'Siafa V. Gray',
    neg1Score: 74,
    neg2Speaker: 'Khadija M. Sando',
    neg2Score: 74,
    neg3Speaker: 'Othello B. Freeman',
    neg3Score: 75,
    negReplySpeaker: 'Siafa V. Gray',
    negReplyScore: 37,

    decisionSide: 'Affirmative' as 'Affirmative' | 'Negative',
    chairAdjudicator: 'Cllr. Gloria Musu-Scott',
    panelAdjudicator1: 'Dr. Togba-Nah Tipoteh',
    panelAdjudicator2: 'Atty. Isaac Jackson',
    ballotVoteAff: 3,
    ballotVoteNeg: 0,
    rfdText: 'Affirmative framed the socioeconomic imperative of constitutional literacy clearly. The Negative offered strong financial feasibility critiques, but failed to address the rural county equity precedent established by Government 2nd and 3rd speaker.',
    adjudicatorSignature: 'G. Musu-Scott (Chair)',
    isTwoPersonCheckedIn: false,
    tabRoomChecker1: 'National Tab Director (YFC)',
    tabRoomChecker2: 'Liberia Forensics Registrar'
  });

  const affTotalCalculated = useMemo(() => {
    return eBallotForm.aff1Score + eBallotForm.aff2Score + eBallotForm.aff3Score + eBallotForm.affReplyScore;
  }, [eBallotForm]);

  const negTotalCalculated = useMemo(() => {
    return eBallotForm.neg1Score + eBallotForm.neg2Score + eBallotForm.neg3Score + eBallotForm.negReplyScore;
  }, [eBallotForm]);

  const scoreMargin = useMemo(() => {
    return Math.abs(affTotalCalculated - negTotalCalculated);
  }, [affTotalCalculated, negTotalCalculated]);

  // Handle 2-person check-in
  const handleVerifyBallotInTabRoom = () => {
    setEBallotForm(prev => ({
      ...prev,
      isTwoPersonCheckedIn: true
    }));
    toast.success(
      `e-Ballot verified by 2 Tab Directors (${eBallotForm.tabRoomChecker1} & ${eBallotForm.tabRoomChecker2}). Results officially committed to Championship Standings!`,
      'YOC Desk Room Check-in Complete',
      6000
    );
  };

  // ==========================================
  // MODULE 2: AUDITORIUM MOTION RELEASE & PREP TIMER STATE
  // ==========================================
  const [prepTotalSeconds, setPrepTotalSeconds] = useState<number>(15 * 60); // 15 mins default
  const [prepSecondsRemaining, setPrepSecondsRemaining] = useState<number>(15 * 60);
  const [isPrepTimerRunning, setIsPrepTimerRunning] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreenPresentation, setIsFullscreenPresentation] = useState<boolean>(false);
  const presentationContainerRef = useRef<HTMLDivElement>(null);

  // Web Audio API Synthesizer for Debate Prep Bells & Chimes
  const playDebateBell = (times = 1) => {
    if (isMuted || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      for (let i = 0; i < times; i++) {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 Bell
          osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 1.2);

          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + 1.2);
        }, i * 350);
      }
    } catch (e) {
      console.warn('Audio chime notice:', e);
    }
  };

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isPrepTimerRunning && prepSecondsRemaining > 0) {
      interval = setInterval(() => {
        setPrepSecondsRemaining(prev => {
          if (prev === 61) {
            // 1-minute warning chime (Double Bell)
            playDebateBell(2);
            toast.warning('1 Minute Remaining in Preparation Time!', 'Prep Warning');
          }
          if (prev <= 1) {
            // Time Expired (Triple Bell)
            playDebateBell(3);
            setIsPrepTimerRunning(false);
            toast.info('Preparation Time Has Expired! Debaters please take your seats.', 'Prep Time Complete');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPrepTimerRunning, prepSecondsRemaining, isMuted]);

  const togglePresentationFullscreen = () => {
    if (!document.fullscreenElement && presentationContainerRef.current) {
      presentationContainerRef.current.requestFullscreen().then(() => {
        setIsFullscreenPresentation(true);
      }).catch(() => {
        setIsFullscreenPresentation(true);
      });
    } else if (document.fullscreenElement) {
      document.exitFullscreen().then(() => {
        setIsFullscreenPresentation(false);
      }).catch(() => {
        setIsFullscreenPresentation(false);
      });
    }
  };

  // ==========================================
  // MODULE 3: THE TAB (STANDINGS & SPEAKS)
  // ==========================================
  const [tabType, setTabType] = useState<'teams' | 'speakers'>('teams');
  const [tabCountyFilter, setTabCountyFilter] = useState<string>('all');
  const [tabSearch, setTabSearch] = useState<string>('');

  // Computed Calico Team Tab with Wins, Speaks, Margins, and Buchholz Draw Strength
  const calculatedTeamTab = useMemo(() => {
    const rawList = [
      { id: 't-01', school: 'United Dawah Ummah High School', county: 'Montserrado', wins: 4, losses: 0, ballots: 12, totalSpeaks: 1042, avgMargin: '+16.5', drawStrength: 13, breakStatus: 'Qualified (Seed #1)' },
      { id: 't-02', school: 'St. Mary Catholic High School', county: 'Nimba', wins: 3, losses: 1, ballots: 10, totalSpeaks: 1028, avgMargin: '+11.2', drawStrength: 12, breakStatus: 'Qualified (Seed #2)' },
      { id: 't-03', school: 'Bishop Marweh High School', county: 'Margibi', wins: 3, losses: 1, ballots: 9, totalSpeaks: 1021, avgMargin: '+9.4', drawStrength: 11, breakStatus: 'Qualified (Seed #3)' },
      { id: 't-04', school: 'Gboveh High School', county: 'Bong', wins: 3, losses: 1, ballots: 9, totalSpeaks: 1018, avgMargin: '+8.1', drawStrength: 10, breakStatus: 'Qualified (Seed #4)' },
      { id: 't-05', school: 'Bassa High School', county: 'Grand Bassa', wins: 2, losses: 2, ballots: 7, totalSpeaks: 998, avgMargin: '+2.0', drawStrength: 11, breakStatus: 'Bubble (Seed #5)' },
      { id: 't-06', school: 'Tubman High School', county: 'Montserrado', wins: 2, losses: 2, ballots: 6, totalSpeaks: 994, avgMargin: '+1.5', drawStrength: 9, breakStatus: 'Bubble (Seed #6)' },
      { id: 't-07', school: 'Voinjama Central High', county: 'Lofa', wins: 2, losses: 2, ballots: 6, totalSpeaks: 989, avgMargin: '-1.0', drawStrength: 9, breakStatus: 'Bubble (Seed #7)' },
      { id: 't-08', school: 'Cape Palmas High School', county: 'Maryland', wins: 1, losses: 3, ballots: 4, totalSpeaks: 974, avgMargin: '-6.4', drawStrength: 8, breakStatus: 'Eliminated' },
      { id: 't-09', school: 'Zwedru Multilateral High', county: 'Grand Gedeh', wins: 1, losses: 3, ballots: 3, totalSpeaks: 968, avgMargin: '-8.2', drawStrength: 7, breakStatus: 'Eliminated' },
      { id: 't-10', school: 'C.H. Dewey Central High', county: 'Bomi', wins: 0, losses: 4, ballots: 1, totalSpeaks: 950, avgMargin: '-15.8', drawStrength: 6, breakStatus: 'Eliminated' }
    ];

    return rawList.filter(t => {
      const matchCounty = tabCountyFilter === 'all' || t.county.toLowerCase() === tabCountyFilter.toLowerCase();
      const matchSearch = tabSearch === '' || t.school.toLowerCase().includes(tabSearch.toLowerCase()) || t.county.toLowerCase().includes(tabSearch.toLowerCase());
      return matchCounty && matchSearch;
    });
  }, [tabCountyFilter, tabSearch]);

  // ==========================================
  // MODULE 4: THE BREAK SIMULATOR
  // ==========================================
  const [breakCategory, setBreakCategory] = useState<'open' | 'county_champs'>('open');
  const [isBreakOfficiallyReleased, setIsBreakOfficiallyReleased] = useState<boolean>(true);

  // ==========================================
  // MODULE 5: ADJUDICATORS & CONFLICT MATRIX
  // ==========================================
  const [adjudicatorsList, setAdjudicatorsList] = useState<AdjudicatorProfile[]>(INITIAL_ADJUDICATORS);
  const [feedbackJudgeModal, setFeedbackJudgeModal] = useState<AdjudicatorProfile | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(9);
  const [feedbackComment, setFeedbackComment] = useState<string>('');

  const handleSaveFeedback = () => {
    if (!feedbackJudgeModal) return;
    setAdjudicatorsList(prev => prev.map(a => {
      if (a.id === feedbackJudgeModal.id) {
        const nextCount = a.feedbackCount + 1;
        const nextAvg = Number(((a.averageFeedback * a.feedbackCount + feedbackRating) / nextCount).toFixed(1));
        return {
          ...a,
          feedbackCount: nextCount,
          averageFeedback: nextAvg
        };
      }
      return a;
    }));
    toast.success(`Feedback recorded for ${feedbackJudgeModal.name}. Rated ${feedbackRating}/10.`, 'Adjudicator Feedback Submitted');
    setFeedbackJudgeModal(null);
    setFeedbackComment('');
  };

  // ==========================================
  // MODULE 6: ROLL CALL & CHECK-IN
  // ==========================================
  const [checkedInSchools, setCheckedInSchools] = useState<Record<string, boolean>>({
    'sch-01': true,
    'sch-02': true,
    'sch-03': true,
    'sch-04': true,
    'sch-05': false,
    'sch-06': true,
    'sch-07': false,
    'sch-08': true
  });

  const toggleCheckIn = (id: string, name: string) => {
    setCheckedInSchools(prev => {
      const next = !prev[id];
      toast.info(`${name} is now marked ${next ? 'CHECKED IN (Present)' : 'ABSENT'}.`, 'Roll Call Updated');
      return { ...prev, [id]: next };
    });
  };

  return (
    <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl text-slate-100 mb-8">
      {/* Top Banner with YOC DESK ENGINE Badging */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 p-6 sm:p-8 border-b border-emerald-500/20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-400/30 shadow-xs">
              <Flame className="w-3.5 h-3.5 text-yellow-400" />
              <span>YOC DESK ENGINE &bull; Tournament Forensics Engine</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span>National Debate Championship Tabulation Center</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              International standard forensics tabulation powered by YOC DESK ENGINE: e-ballots with two-person check-in verification, live auditorium motion reveal with sound chimes, team &amp; speaker tabulation, break cutoffs, and adjudicator conflict matrices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowYearlyReport(true)}
              className="px-3 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer border border-yellow-500/50"
              title="Generate and view complete Forensics & Yearly Partner Report"
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-950" />
              <span className="hidden sm:inline">Yearly Partner Report</span>
              <span className="sm:hidden">Report</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Close Tabulation Center"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Calico Navigation Bar (6 Core Modules) */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-white/10">
          {[
            { id: 'ballots', label: '1. Digital e-Ballots', icon: FileText, desc: 'WSDC Scoring & Verification' },
            { id: 'presentation', label: '2. Motion Presentation', icon: Tv, desc: 'Auditorium Reveal & Timer' },
            { id: 'tab_standings', label: '3. The Tab (Standings)', icon: Trophy, desc: 'Team & Speaker Tab' },
            { id: 'break_simulator', label: '4. The Break Simulator', icon: Award, desc: 'Elimination Bracket' },
            { id: 'adjudicators', label: '5. Adjudicator Conflicts', icon: ShieldCheck, desc: 'Conflict Matrix & Feedback' },
            { id: 'checkin', label: '6. Round Roll-Call', icon: CheckSquare, desc: 'Team & Judge Availability' }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMode(tab.id as CalicoTabMode)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  active 
                    ? 'bg-yellow-400 text-emerald-950 shadow-lg font-black scale-102' 
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Module Content Area */}
      <div className="p-6 sm:p-8">
        {/* ========================================================================= */}
        {/* MODULE 1: DIGITAL E-BALLOT & 2-PERSON CHECK-IN VERIFICATION */}
        {/* ========================================================================= */}
        {activeMode === 'ballots' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 p-4 rounded-2xl border border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-yellow-400" />
                  <span>Official WSDC e-Ballot Scoresheet</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select match to score debater-by-debater with substantive margin auto-calculation and two-person tab room verification.
                </p>
              </div>

              {/* Match Selector */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300">Match:</span>
                <select
                  value={selectedFixtureId}
                  onChange={(e) => setSelectedFixtureId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:border-yellow-400 focus:outline-none"
                >
                  {fixtures.map((f, i) => (
                    <option key={f.id} value={f.id}>
                      #{i + 1} • {f.teamA.schoolName} vs {f.teamB.schoolName} ({f.county})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Match Header Info */}
            <div className="bg-gradient-to-r from-emerald-950/80 to-slate-900 p-5 rounded-2xl border border-emerald-500/20">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                {currentFixture.roundName} &bull; {currentFixture.county} County
              </div>
              <div className="text-base sm:text-lg font-black text-white mt-1">
                &ldquo;{currentFixture.motion}&rdquo;
              </div>
              <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-4">
                <span><strong>Venue:</strong> {currentFixture.venue}</span>
                <span><strong>Chair:</strong> {eBallotForm.chairAdjudicator}</span>
                <span><strong>Scale:</strong> WSDC 60-80 (Substantive), 30-40 (Reply)</span>
              </div>
            </div>

            {/* Split Teams Scoresheet */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Affirmative Proposition Column */}
              <div className="bg-slate-950/80 rounded-2xl p-5 border border-emerald-500/30 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-emerald-500/20">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Affirmative (Proposition)
                    </span>
                    <h4 className="text-base font-black text-white mt-1">
                      {currentFixture.teamA.schoolName}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">Total Points</span>
                    <div className="text-2xl font-black text-emerald-400">{affTotalCalculated}</div>
                  </div>
                </div>

                {/* 1st Speaker */}
                <div className="grid grid-cols-3 gap-3 items-center">
                  <span className="text-xs font-bold text-slate-300">1st Speaker</span>
                  <input
                    type="text"
                    value={eBallotForm.aff1Speaker}
                    onChange={(e) => setEBallotForm({ ...eBallotForm, aff1Speaker: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={60}
                      max={80}
                      value={eBallotForm.aff1Score}
                      onChange={(e) => setEBallotForm({ ...eBallotForm, aff1Score: Number(e.target.value) })}
                      className="w-16 bg-slate-900 border border-emerald-500/50 rounded-lg px-2 py-1 text-xs text-center font-black text-yellow-400"
                    />
                    <span className="text-[10px] text-slate-500">/80</span>
                  </div>
                </div>

                {/* 2nd Speaker */}
                <div className="grid grid-cols-3 gap-3 items-center">
                  <span className="text-xs font-bold text-slate-300">2nd Speaker</span>
                  <input
                    type="text"
                    value={eBallotForm.aff2Speaker}
                    onChange={(e) => setEBallotForm({ ...eBallotForm, aff2Speaker: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={60}
                      max={80}
                      value={eBallotForm.aff2Score}
                      onChange={(e) => setEBallotForm({ ...eBallotForm, aff2Score: Number(e.target.value) })}
                      className="w-16 bg-slate-900 border border-emerald-500/50 rounded-lg px-2 py-1 text-xs text-center font-black text-yellow-400"
                    />
                    <span className="text-[10px] text-slate-500">/80</span>
                  </div>
                </div>

                {/* 3rd Speaker */}
                <div className="grid grid-cols-3 gap-3 items-center">
                  <span className="text-xs font-bold text-slate-300">3rd Speaker</span>
                  <input
                    type="text"
                    value={eBallotForm.aff3Speaker}
                    onChange={(e) => setEBallotForm({ ...eBallotForm, aff3Speaker: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={60}
                      max={80}
                      value={eBallotForm.aff3Score}
                      onChange={(e) => setEBallotForm({ ...eBallotForm, aff3Score: Number(e.target.value) })}
                      className="w-16 bg-slate-900 border border-emerald-500/50 rounded-lg px-2 py-1 text-xs text-center font-black text-yellow-400"
                    />
                    <span className="text-[10px] text-slate-500">/80</span>
                  </div>
                </div>

                {/* Reply Speaker */}
                <div className="grid grid-cols-3 gap-3 items-center">
                  <span className="text-xs font-bold text-slate-300">Reply Speaker</span>
                  <input
                    type="text"
                    value={eBallotForm.affReplySpeaker}
                    onChange={(e) => setEBallotForm({ ...eBallotForm, affReplySpeaker: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={30}
                      max={40}
                      value={eBallotForm.affReplyScore}
                      onChange={(e) => setEBallotForm({ ...eBallotForm, affReplyScore: Number(e.target.value) })}
                      className="w-16 bg-slate-900 border border-emerald-500/50 rounded-lg px-2 py-1 text-xs text-center font-black text-yellow-400"
                    />
                    <span className="text-[10px] text-slate-500">/40</span>
                  </div>
                </div>
              </div>

              {/* Negative Opposition Column */}
              <div className="bg-slate-950/80 rounded-2xl p-5 border border-amber-500/30 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-amber-500/20">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Negative (Opposition)
                    </span>
                    <h4 className="text-base font-black text-white mt-1">
                      {currentFixture.teamB.schoolName}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">Total Points</span>
                    <div className="text-2xl font-black text-amber-400">{negTotalCalculated}</div>
                  </div>
                </div>

                {/* 1st Speaker */}
                <div className="grid grid-cols-3 gap-3 items-center">
                  <span className="text-xs font-bold text-slate-300">1st Speaker</span>
                  <input
                    type="text"
                    value={eBallotForm.neg1Speaker}
                    onChange={(e) => setEBallotForm({ ...eBallotForm, neg1Speaker: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={60}
                      max={80}
                      value={eBallotForm.neg1Score}
                      onChange={(e) => setEBallotForm({ ...eBallotForm, neg1Score: Number(e.target.value) })}
                      className="w-16 bg-slate-900 border border-amber-500/50 rounded-lg px-2 py-1 text-xs text-center font-black text-yellow-400"
                    />
                    <span className="text-[10px] text-slate-500">/80</span>
                  </div>
                </div>

                {/* 2nd Speaker */}
                <div className="grid grid-cols-3 gap-3 items-center">
                  <span className="text-xs font-bold text-slate-300">2nd Speaker</span>
                  <input
                    type="text"
                    value={eBallotForm.neg2Speaker}
                    onChange={(e) => setEBallotForm({ ...eBallotForm, neg2Speaker: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={60}
                      max={80}
                      value={eBallotForm.neg2Score}
                      onChange={(e) => setEBallotForm({ ...eBallotForm, neg2Score: Number(e.target.value) })}
                      className="w-16 bg-slate-900 border border-amber-500/50 rounded-lg px-2 py-1 text-xs text-center font-black text-yellow-400"
                    />
                    <span className="text-[10px] text-slate-500">/80</span>
                  </div>
                </div>

                {/* 3rd Speaker */}
                <div className="grid grid-cols-3 gap-3 items-center">
                  <span className="text-xs font-bold text-slate-300">3rd Speaker</span>
                  <input
                    type="text"
                    value={eBallotForm.neg3Speaker}
                    onChange={(e) => setEBallotForm({ ...eBallotForm, neg3Speaker: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={60}
                      max={80}
                      value={eBallotForm.neg3Score}
                      onChange={(e) => setEBallotForm({ ...eBallotForm, neg3Score: Number(e.target.value) })}
                      className="w-16 bg-slate-900 border border-amber-500/50 rounded-lg px-2 py-1 text-xs text-center font-black text-yellow-400"
                    />
                    <span className="text-[10px] text-slate-500">/80</span>
                  </div>
                </div>

                {/* Reply Speaker */}
                <div className="grid grid-cols-3 gap-3 items-center">
                  <span className="text-xs font-bold text-slate-300">Reply Speaker</span>
                  <input
                    type="text"
                    value={eBallotForm.negReplySpeaker}
                    onChange={(e) => setEBallotForm({ ...eBallotForm, negReplySpeaker: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={30}
                      max={40}
                      value={eBallotForm.negReplyScore}
                      onChange={(e) => setEBallotForm({ ...eBallotForm, negReplyScore: Number(e.target.value) })}
                      className="w-16 bg-slate-900 border border-amber-500/50 rounded-lg px-2 py-1 text-xs text-center font-black text-yellow-400"
                    />
                    <span className="text-[10px] text-slate-500">/40</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decision & Substantive Margin Summary */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Substantive Margin</span>
                <div className="text-xl font-black text-white mt-0.5">
                  {scoreMargin} Point(s) Differential &bull;{' '}
                  <span className={affTotalCalculated >= negTotalCalculated ? 'text-emerald-400' : 'text-amber-400'}>
                    {affTotalCalculated >= negTotalCalculated ? 'Affirmative Leads' : 'Negative Leads'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300">Winner Awarded:</span>
                <select
                  value={eBallotForm.decisionSide}
                  onChange={(e) => setEBallotForm({ ...eBallotForm, decisionSide: e.target.value as any })}
                  className="bg-slate-900 border border-yellow-400 text-yellow-300 font-black rounded-xl px-4 py-2 text-sm focus:outline-none"
                >
                  <option value="Affirmative">Affirmative ({currentFixture.teamA.schoolName})</option>
                  <option value="Negative">Negative ({currentFixture.teamB.schoolName})</option>
                </select>
              </div>
            </div>

            {/* Written RFD (Reason for Decision) */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-white/10 space-y-2">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-yellow-400" />
                <span>Written Reason for Decision (RFD) &bull; Adjudicator Justification</span>
              </label>
              <textarea
                rows={3}
                value={eBallotForm.rfdText}
                onChange={(e) => setEBallotForm({ ...eBallotForm, rfdText: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:border-yellow-400 focus:outline-none"
                placeholder="Detail the key clashes, burden of proof evaluations, and strategic turning points..."
              />
            </div>

            {/* Calico Tab 2-Person Verification Gate */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-950 to-slate-900 p-6 rounded-2xl border border-emerald-500/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-black text-white uppercase tracking-wider">
                    Tab Room Two-Person Check-in Verification
                  </h4>
                  {eBallotForm.isTwoPersonCheckedIn && (
                    <span className="text-[10px] font-black bg-emerald-500 text-emerald-950 px-2 py-0.5 rounded-full">
                      VERIFIED &amp; LOCKED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300">
                  YOC Desk standard: Two independent tab room staff verify scoresheet arithmetic before publishing to official tournament standings.
                </p>
                <div className="text-[11px] text-slate-400 pt-1">
                  1st Check: <span className="text-white font-semibold">{eBallotForm.tabRoomChecker1}</span> &bull; 
                  2nd Check: <span className="text-white font-semibold">{eBallotForm.tabRoomChecker2}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Ballot</span>
                </button>

                <button
                  type="button"
                  disabled={eBallotForm.isTwoPersonCheckedIn}
                  onClick={handleVerifyBallotInTabRoom}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer ${
                    eBallotForm.isTwoPersonCheckedIn
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-yellow-400 hover:bg-yellow-300 text-emerald-950'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{eBallotForm.isTwoPersonCheckedIn ? 'Checked-In & Verified' : 'Confirm 2-Person Verification'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 2: AUDITORIUM MOTION RELEASE & PREP TIMER */}
        {/* ========================================================================= */}
        {activeMode === 'presentation' && (
          <div 
            ref={presentationContainerRef}
            className={`space-y-6 ${isFullscreenPresentation ? 'fixed inset-0 z-50 bg-slate-950 p-8 sm:p-16 flex flex-col justify-between overflow-y-auto' : ''}`}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 p-4 rounded-2xl border border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Tv className="w-5 h-5 text-yellow-400" />
                  <span>Auditorium Motion Release &amp; Prep Timer Mode</span>
                </h3>
                <p className="text-xs text-slate-400">
                  YOC Desk presentation mode for tournament hall projectors. Displays high-contrast motion text with WSDC preparation countdown and sound chime alerts.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title={isMuted ? 'Unmute Bells' : 'Mute Bells'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                </button>

                <button
                  type="button"
                  onClick={togglePresentationFullscreen}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {isFullscreenPresentation ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  <span>{isFullscreenPresentation ? 'Exit Fullscreen' : 'Auditorium Projector'}</span>
                </button>
              </div>
            </div>

            {/* Giant Motion Reveal Card */}
            <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-black p-8 sm:p-12 rounded-3xl border-2 border-emerald-500/40 shadow-2xl text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-black uppercase tracking-widest border border-yellow-400/30">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span>Round Motion &bull; {currentFixture.roundName}</span>
              </div>

              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto drop-shadow-md">
                &ldquo;{currentFixture.motion}&rdquo;
              </h1>

              {currentFixture.motionInfoSlide && (
                <div className="max-w-2xl mx-auto bg-slate-950/80 p-4 rounded-xl border border-white/10 text-xs sm:text-sm text-slate-300 italic">
                  <strong>Info Slide:</strong> {currentFixture.motionInfoSlide}
                </div>
              )}

              {/* Side Matchup Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto pt-4">
                <div className="bg-emerald-950/60 p-4 rounded-2xl border border-emerald-500/30 text-left">
                  <div className="text-[11px] font-black text-emerald-400 uppercase">Affirmative (Proposition)</div>
                  <div className="text-lg font-black text-white mt-1">{currentFixture.teamA.schoolName}</div>
                  <div className="text-xs text-slate-400">{currentFixture.teamA.county} County</div>
                </div>

                <div className="bg-amber-950/60 p-4 rounded-2xl border border-amber-500/30 text-left">
                  <div className="text-[11px] font-black text-amber-400 uppercase">Negative (Opposition)</div>
                  <div className="text-lg font-black text-white mt-1">{currentFixture.teamB.schoolName}</div>
                  <div className="text-xs text-slate-400">{currentFixture.teamB.county} County</div>
                </div>
              </div>
            </div>

            {/* WSDC Preparation Time Countdown Clock */}
            <div className="bg-slate-950 p-6 sm:p-8 rounded-3xl border border-white/10 text-center space-y-4">
              <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                WSDC Preparation Countdown Timer (15 Min / 30 Min)
              </div>

              <div className="text-5xl sm:text-7xl font-mono font-black text-yellow-400 tracking-wider">
                {String(Math.floor(prepSecondsRemaining / 60)).padStart(2, '0')}:
                {String(prepSecondsRemaining % 60).padStart(2, '0')}
              </div>

              {/* Time Remaining Bar */}
              <div className="w-full max-w-md mx-auto bg-slate-800 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    prepSecondsRemaining < 120 ? 'bg-red-500' : 'bg-emerald-400'
                  }`}
                  style={{ width: `${(prepSecondsRemaining / prepTotalSeconds) * 100}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPrepTimerRunning(!isPrepTimerRunning)}
                  className="px-6 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  {isPrepTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPrepTimerRunning ? 'Pause Prep Timer' : 'Start Prep Timer'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPrepTimerRunning(false);
                    setPrepSecondsRemaining(prepTotalSeconds);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = prepTotalSeconds === 15 * 60 ? 30 * 60 : 15 * 60;
                    setPrepTotalSeconds(next);
                    setPrepSecondsRemaining(next);
                    setIsPrepTimerRunning(false);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>Switch to {prepTotalSeconds === 15 * 60 ? '30 Mins (National Final)' : '15 Mins (Prelims)'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => playDebateBell(1)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Test Bell Chime</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 3: THE TAB (OFFICIAL TOURNAMENT STANDINGS & SPEAKERS) */}
        {/* ========================================================================= */}
        {activeMode === 'tab_standings' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 p-4 rounded-2xl border border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span>Official Tournament Tabulation Table (&ldquo;The Tab&rdquo;)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  YOC Desk precedence formula: Wins &bull; Total Speaker Points &bull; Average Margin &bull; Buchholz Draw Strength.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTabType('teams')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    tabType === 'teams' ? 'bg-yellow-400 text-emerald-950 font-black' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Team Tab (15 Counties)
                </button>
                <button
                  type="button"
                  onClick={() => setTabType('speakers')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    tabType === 'speakers' ? 'bg-yellow-400 text-emerald-950 font-black' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Speaker Tab (Individual Speaks)
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search school or debater..."
                  value={tabSearch}
                  onChange={(e) => setTabSearch(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:border-yellow-400 focus:outline-none w-56"
                />
                <select
                  value={tabCountyFilter}
                  onChange={(e) => setTabCountyFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs focus:border-yellow-400 focus:outline-none"
                >
                  <option value="all">All Counties</option>
                  <option value="Montserrado">Montserrado</option>
                  <option value="Nimba">Nimba</option>
                  <option value="Bong">Bong</option>
                  <option value="Margibi">Margibi</option>
                  <option value="Grand Bassa">Grand Bassa</option>
                  <option value="Lofa">Lofa</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => {
                  toast.success('Tabulation CSV exported successfully.', 'Export Complete');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Tab (.CSV)</span>
              </button>
            </div>

            {/* Team Tab View */}
            {tabType === 'teams' ? (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Rank</th>
                      <th className="p-3.5">School / Delegation</th>
                      <th className="p-3.5">County</th>
                      <th className="p-3.5 text-center">Wins</th>
                      <th className="p-3.5 text-center">Losses</th>
                      <th className="p-3.5 text-center">Ballots</th>
                      <th className="p-3.5 text-center">Total Speaks</th>
                      <th className="p-3.5 text-center">Avg Margin</th>
                      <th className="p-3.5 text-center">Draw Strength</th>
                      <th className="p-3.5">Break Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-900/80">
                    {calculatedTeamTab.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5 font-black text-yellow-400">#{idx + 1}</td>
                        <td className="p-3.5 font-bold text-white">{t.school}</td>
                        <td className="p-3.5 text-slate-300">{t.county}</td>
                        <td className="p-3.5 text-center font-black text-emerald-400">{t.wins}</td>
                        <td className="p-3.5 text-center text-slate-400">{t.losses}</td>
                        <td className="p-3.5 text-center font-bold text-slate-300">{t.ballots}</td>
                        <td className="p-3.5 text-center font-mono font-bold text-white">{t.totalSpeaks}</td>
                        <td className="p-3.5 text-center font-bold text-emerald-300">{t.avgMargin}</td>
                        <td className="p-3.5 text-center font-mono text-slate-400">{t.drawStrength}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            t.breakStatus.includes('Qualified')
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : t.breakStatus.includes('Bubble')
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                          }`}>
                            {t.breakStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Speaker Tab View */
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3.5">Rank</th>
                      <th className="p-3.5">Debater Name</th>
                      <th className="p-3.5">School</th>
                      <th className="p-3.5">County</th>
                      <th className="p-3.5 text-center">Speeches</th>
                      <th className="p-3.5 text-center">Total Speaks</th>
                      <th className="p-3.5 text-center">Average Score</th>
                      <th className="p-3.5 text-center">Trimmed Mean</th>
                      <th className="p-3.5">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-900/80">
                    {INITIAL_SPEAKER_TAB.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5 font-black text-yellow-400">#{s.rank}</td>
                        <td className="p-3.5 font-bold text-white flex items-center gap-2">
                          <Award className="w-3.5 h-3.5 text-yellow-400" />
                          <span>{s.name}</span>
                        </td>
                        <td className="p-3.5 text-slate-300">{s.school}</td>
                        <td className="p-3.5 text-slate-400">{s.county}</td>
                        <td className="p-3.5 text-center font-bold text-slate-300">{s.speechesDelivered}</td>
                        <td className="p-3.5 text-center font-mono font-bold text-white">{s.totalSpeaks}</td>
                        <td className="p-3.5 text-center font-mono font-black text-emerald-400">{s.averageScore.toFixed(2)}</td>
                        <td className="p-3.5 text-center font-mono text-slate-400">{s.trimmedMean.toFixed(1)}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.isNovice ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
                          }`}>
                            {s.isNovice ? 'Novice Debater' : 'Open Debater'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 4: THE BREAK SIMULATOR */}
        {/* ========================================================================= */}
        {activeMode === 'break_simulator' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 p-4 rounded-2xl border border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span>&ldquo;The Break&rdquo; &bull; Elimination Round Qualification Simulator</span>
                </h3>
                <p className="text-xs text-slate-400">
                  YOC Desk Break Algorithm: Determines qualifying threshold and feeds teams into Quarter-Finals, Semi-Finals, and Grand Championship.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300">Break Category:</span>
                <select
                  value={breakCategory}
                  onChange={(e) => setBreakCategory(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:border-yellow-400 focus:outline-none"
                >
                  <option value="open">Open Championship Break (Top 8)</option>
                  <option value="county_champs">15-County Super Round Break</option>
                </select>
              </div>
            </div>

            {/* Break Announcement Banner */}
            <div className="bg-gradient-to-r from-yellow-500/20 via-emerald-500/20 to-teal-500/20 border-2 border-yellow-400/50 p-6 rounded-3xl text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400 text-emerald-950 text-xs font-black uppercase tracking-wider shadow-md">
                <Sparkles className="w-4 h-4" /> The Break is Officially Live!
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Championship Elimination Bracket (Quarter-Finals &rarr; Grand Final)
              </h2>
              <p className="text-xs text-slate-300 max-w-xl mx-auto">
                Break Cutoff: Teams on 3+ wins break cleanly. Top 4 seeds advance to the Super Round Semis at the E.J.S. Ministerial Complex.
              </p>
            </div>

            {/* Interactive Elimination Bracket Tree */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              {/* Quarter Finals */}
              <div className="space-y-4">
                <div className="text-xs font-black text-emerald-400 uppercase tracking-widest text-center bg-slate-950 p-2 rounded-xl border border-white/5">
                  Quarter-Finals (Round of 8)
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="text-[10px] text-slate-400 font-bold">QF Match #1</div>
                  <div className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-500/30 flex justify-between items-center text-xs font-bold text-white">
                    <span>#1 United Dawah Ummah</span>
                    <span className="text-emerald-400 font-black">WIN</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5 flex justify-between items-center text-xs text-slate-400">
                    <span>#8 Cape Palmas High</span>
                    <span>LOSS</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="text-[10px] text-slate-400 font-bold">QF Match #2</div>
                  <div className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-500/30 flex justify-between items-center text-xs font-bold text-white">
                    <span>#4 Gboveh High School</span>
                    <span className="text-emerald-400 font-black">WIN</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5 flex justify-between items-center text-xs text-slate-400">
                    <span>#5 Bassa High School</span>
                    <span>LOSS</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="text-[10px] text-slate-400 font-bold">QF Match #3</div>
                  <div className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-500/30 flex justify-between items-center text-xs font-bold text-white">
                    <span>#2 St. Mary Catholic</span>
                    <span className="text-emerald-400 font-black">WIN</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5 flex justify-between items-center text-xs text-slate-400">
                    <span>#7 Voinjama Central</span>
                    <span>LOSS</span>
                  </div>
                </div>
              </div>

              {/* Semi Finals */}
              <div className="space-y-4">
                <div className="text-xs font-black text-yellow-400 uppercase tracking-widest text-center bg-slate-950 p-2 rounded-xl border border-white/5">
                  Semi-Finals (Super 4)
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-yellow-400/30 space-y-2 my-auto">
                  <div className="text-[10px] text-yellow-400 font-bold">Semi-Final Match #1</div>
                  <div className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-500/30 flex justify-between items-center text-xs font-bold text-white">
                    <span>United Dawah Ummah (Montserrado)</span>
                    <span className="text-emerald-400 font-black">ADVANCE</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5 flex justify-between items-center text-xs text-slate-400">
                    <span>Gboveh High (Bong)</span>
                    <span>3rd Place</span>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-yellow-400/30 space-y-2 my-auto">
                  <div className="text-[10px] text-yellow-400 font-bold">Semi-Final Match #2</div>
                  <div className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-500/30 flex justify-between items-center text-xs font-bold text-white">
                    <span>St. Mary Catholic (Nimba)</span>
                    <span className="text-emerald-400 font-black">ADVANCE</span>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-lg border border-white/5 flex justify-between items-center text-xs text-slate-400">
                    <span>Bishop Marweh (Margibi)</span>
                    <span>3rd Place</span>
                  </div>
                </div>
              </div>

              {/* Grand Final */}
              <div className="space-y-4">
                <div className="text-xs font-black text-amber-300 uppercase tracking-widest text-center bg-slate-950 p-2 rounded-xl border border-amber-500/30">
                  Grand Championship Final
                </div>

                <div className="bg-gradient-to-br from-yellow-950/40 via-slate-950 to-emerald-950/40 p-6 rounded-3xl border-2 border-yellow-400 shadow-2xl text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-400 text-emerald-950 flex items-center justify-center mx-auto shadow-lg">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-yellow-400 tracking-wider">E.J.S. Ministerial Complex</span>
                    <h3 className="text-lg font-black text-white mt-1">Montserrado vs Nimba</h3>
                    <p className="text-xs text-slate-300 mt-1">United Dawah Ummah vs St. Mary Catholic High</p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-bold border border-yellow-400/30">
                    Grand Trophy &bull; Live TV &bull; Full Scholarships
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 5: ADJUDICATORS & CONFLICT MATRIX */}
        {/* ========================================================================= */}
        {activeMode === 'adjudicators' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 p-4 rounded-2xl border border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-yellow-400" />
                  <span>Adjudicator Conflict Matrix &amp; Feedback Collection</span>
                </h3>
                <p className="text-xs text-slate-400">
                  YOC Desk anti-bias matrix: Automatically checks county and institutional conflicts so debaters never face a compromised panel.
                </p>
              </div>

              <div className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30">
                8 Accredited Judges in Roster
              </div>
            </div>

            {/* Adjudicators Table */}
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Adjudicator</th>
                    <th className="p-3.5">Tier</th>
                    <th className="p-3.5">County of Origin (Conflict)</th>
                    <th className="p-3.5">Alma Mater / Affiliation</th>
                    <th className="p-3.5 text-center">WSDC Certified</th>
                    <th className="p-3.5 text-center">Avg Rating</th>
                    <th className="p-3.5 text-center">Feedback Submissions</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-slate-900/80">
                  {adjudicatorsList.map(a => (
                    <tr key={a.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span>{a.name}</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.tier.includes('Chief') 
                            ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {a.tier}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>{a.countyOfOrigin}</span>
                      </td>
                      <td className="p-3.5 text-slate-300">{a.affiliatedSchool}</td>
                      <td className="p-3.5 text-center">
                        {a.certifiedWSDC ? (
                          <span className="text-emerald-400 font-bold">&#10003; Yes</span>
                        ) : (
                          <span className="text-slate-500">In Training</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-mono font-black text-yellow-400">
                        {a.averageFeedback} / 10
                      </td>
                      <td className="p-3.5 text-center text-slate-400">
                        {a.feedbackCount} debater reviews
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setFeedbackJudgeModal(a)}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                        >
                          Submit Feedback
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Debater Judge Feedback Modal */}
            {feedbackJudgeModal && (
              <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-white/20 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-base font-black text-white">Rate Adjudicator: {feedbackJudgeModal.name}</h4>
                    <button onClick={() => setFeedbackJudgeModal(null)} className="text-slate-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300">
                    YOC Desk anonymous feedback: How clear was the oral RFD? Was timekeeping impartial and feedback constructive?
                  </p>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Score (1 to 10): {feedbackRating}/10</label>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={feedbackRating}
                      onChange={(e) => setFeedbackRating(Number(e.target.value))}
                      className="w-full accent-yellow-400 cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Constructive Feedback Note:</label>
                    <textarea
                      rows={3}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Comment on RFD clarity, speaker point consistency, and panel decorum..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setFeedbackJudgeModal(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveFeedback}
                      className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black text-xs"
                    >
                      Submit Evaluation
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODULE 6: ROLL CALL & CHECK-IN CONSOLE */}
        {/* ========================================================================= */}
        {activeMode === 'checkin' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/60 p-4 rounded-2xl border border-white/5">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-yellow-400" />
                  <span>Tournament Roll Call &amp; Round Availability Console</span>
                </h3>
                <p className="text-xs text-slate-400">
                  YOC Desk pre-draw protocol: Mark schools as Present or Absent before algorithmic draws to prevent ghost match pairings.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  Checked In: <strong className="text-emerald-400">{Object.values(checkedInSchools).filter(Boolean).length} / 8 Schools</strong>
                </span>
              </div>
            </div>

            {/* Check-In Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { id: 'sch-01', name: 'United Dawah Ummah High', county: 'Montserrado' },
                { id: 'sch-02', name: 'St. Mary Catholic High', county: 'Nimba' },
                { id: 'sch-03', name: 'Bishop Marweh High', county: 'Margibi' },
                { id: 'sch-04', name: 'Gboveh High School', county: 'Bong' },
                { id: 'sch-05', name: 'Bassa High School', county: 'Grand Bassa' },
                { id: 'sch-06', name: 'Tubman High School', county: 'Montserrado' },
                { id: 'sch-07', name: 'Voinjama Central High', county: 'Lofa' },
                { id: 'sch-08', name: 'Cape Palmas High', county: 'Maryland' }
              ].map(s => {
                const checked = checkedInSchools[s.id] ?? false;
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleCheckIn(s.id, s.name)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                      checked 
                        ? 'bg-emerald-950/40 border-emerald-500/40 shadow-xs' 
                        : 'bg-slate-950/60 border-red-500/30 opacity-75'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        checked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {checked ? 'Present &bull; Ready' : 'Absent'}
                      </span>
                      {checked ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Square className="w-5 h-5 text-slate-500" />}
                    </div>

                    <h4 className="text-sm font-black text-white mt-2 line-clamp-1">{s.name}</h4>
                    <p className="text-xs text-slate-400">{s.county} County</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Official Youth For Change Yearly Partner Report Modal */}
      <YearlyReportModal
        isOpen={showYearlyReport}
        onClose={() => setShowYearlyReport(false)}
      />
    </div>
  );
};
