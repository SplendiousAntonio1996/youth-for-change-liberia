import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Shuffle, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Award, 
  Filter, 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  HelpCircle, 
  ChevronRight, 
  ArrowRight, 
  Trophy, 
  Sparkles, 
  Radio, 
  AlertCircle,
  ExternalLink,
  Edit3,
  Trash2,
  Share2,
  RefreshCw,
  FileSpreadsheet,
  Mail,
  Check,
  Send,
  Lock,
  Unlock,
  Database,
  Sliders,
  Flame,
  Zap,
  Play,
  Archive
} from 'lucide-react';
import { CoachNotificationManager } from './CoachNotificationManager';
import { MotionBankManager } from './MotionBankManager';
import { EditionArchiveBackupCenter } from './EditionArchiveBackupCenter';
import { useProgramStatus } from '../../hooks/useProgramStatus';
import { useMotionBank } from '../../hooks/useMotionBank';
import { useTournamentStage } from '../../hooks/useTournamentStage';
import { 
  checkStage1Status, 
  checkStage2Status, 
  advanceTournamentToStage2, 
  advanceCentralStageToQuarterfinals,
  advanceCentralStageToSemifinals,
  advanceTournamentToStage3 
} from '../../lib/tournamentStageService';
import { 
  calculateTournamentStandings, 
  generate3RoundPrelimFixtures, 
  generateNextRoundPairings, 
  simulateFixturesResults,
  OFFICIAL_LIBERIAN_VENUES,
  OFFICIAL_TIME_SLOTS
} from '../../lib/tournamentProgressionEngine';
import { 
  CountyZone, 
  ZonedSchool, 
  TournamentFixture, 
  TournamentStage, 
  TournamentProgram,
  TournamentRevealAnnouncement,
  Adjudicator,
  SchoolTournamentStanding
} from '../../types/tournament';
import { 
  LIBERIA_COUNTY_ZONES, 
  ACCREDITED_BASE_SCHOOLS, 
  ACCREDITED_DEBATE_MOTIONS,
  STEM_CHALLENGE_FACE_OFF_THEMES,
  ACCREDITED_ADJUDICATORS,
  mapSchoolToCountyZone, 
  generateAntiBiasFixtures,
  generateNationalChampionshipPairings,
  detectTournamentHumanBias,
  BiasAuditResult,
  generateAntiBiasCryptographicHash,
  DEFAULT_TOURNAMENT_ANNOUNCEMENT,
  INITIAL_SEASON_FIXTURES
} from '../../data/tournamentZoningData';
import { InvolvementApplication } from '../../types';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface SchoolZoningUtilityProps {
  applicationsList: InvolvementApplication[];
  userEmail?: string;
  initialTab?: 'zoning_dashboard' | 'antibias_engine' | 'coach_notifications' | 'results_advancement' | 'national_championship' | 'bias_audit' | 'reveal_settings' | 'motion_bank' | 'edition_archive';
}

const LIBERIA_15_COUNTIES = [
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

export const SchoolZoningUtility: React.FC<SchoolZoningUtilityProps> = ({ applicationsList, userEmail, initialTab }) => {
  // Navigation tabs inside the utility
  const [activeTab, setActiveTab] = useState<'zoning_dashboard' | 'antibias_engine' | 'coach_notifications' | 'results_advancement' | 'national_championship' | 'bias_audit' | 'reveal_settings' | 'motion_bank' | 'edition_archive'>(initialTab || 'zoning_dashboard');
  
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Program registration status hook (allows opening/closing school registration window across all 15 counties)
  const { isProgramOpen, updateStatus } = useProgramStatus();
  const isDebateOpen = isProgramOpen('debate-prog');
  const [isTogglingRegistration, setIsTogglingRegistration] = useState<boolean>(false);
  const [regStatusToast, setRegStatusToast] = useState<string | null>(null);

  // Tournament stage progression & locking hook
  const { 
    stageState, 
    isDeadlinePassed, 
    daysRemaining, 
    updateDeadline, 
    updateStage, 
    isStageLocked, 
    isStageActive 
  } = useTournamentStage();

  // Registration deadline editing state
  const [newDeadlineDate, setNewDeadlineDate] = useState<string>('2025-05-15');
  const [newDeadlineLabel, setNewDeadlineLabel] = useState<string>('May 15, 2025');
  const [isSavingDeadline, setIsSavingDeadline] = useState<boolean>(false);

  useEffect(() => {
    if (stageState.registrationDeadlineDate) {
      setNewDeadlineDate(stageState.registrationDeadlineDate);
    }
    if (stageState.registrationDeadline) {
      setNewDeadlineLabel(stageState.registrationDeadline);
    }
  }, [stageState.registrationDeadlineDate, stageState.registrationDeadline]);

  // Motion Bank hook for random draws and live bank management
  const { motions: motionBank, loading: motionsLoading } = useMotionBank();

  // Time and Venue scheduling modal state
  const [selectedFixtureForSchedule, setSelectedFixtureForSchedule] = useState<TournamentFixture | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('09:30 AM GMT');
  const [scheduleVenue, setScheduleVenue] = useState<string>('');
  const [scheduleMotion, setScheduleMotion] = useState<string>('');
  const [isSavingSchedule, setIsSavingSchedule] = useState<boolean>(false);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationToast, setSimulationToast] = useState<string | null>(null);
  const [simulationMatchDate, setSimulationMatchDate] = useState<string>('2025-10-25');

  // Next round advance confirmation preview
  const [advancingFixturesPreview, setAdvancingFixturesPreview] = useState<TournamentFixture[] | null>(null);
  
  // Filters
  const [selectedCounty, setSelectedCounty] = useState<string>('All Counties');
  const [selectedProgram, setSelectedProgram] = useState<'all' | 'debate' | 'stem'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fixtures State (Loaded from Firestore or preloaded defaults)
  const [fixtures, setFixtures] = useState<TournamentFixture[]>(INITIAL_SEASON_FIXTURES);
  const [isSyncingFixtures, setIsSyncingFixtures] = useState<boolean>(false);

  // Announcement / Reveal Settings State
  const [announcement, setAnnouncement] = useState<TournamentRevealAnnouncement>(DEFAULT_TOURNAMENT_ANNOUNCEMENT);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState<boolean>(false);
  const [announcementSavedToast, setAnnouncementSavedToast] = useState<boolean>(false);

  // Manual Add School Modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newSchoolName, setNewSchoolName] = useState<string>('');
  const [newSchoolCounty, setNewSchoolCounty] = useState<string>('Montserrado');
  const [newSchoolProgram, setNewSchoolProgram] = useState<TournamentProgram>('debate');
  const [newSchoolDistrict, setNewSchoolDistrict] = useState<string>('');
  const [newSchoolContact, setNewSchoolContact] = useState<string>('');
  const [newSchoolEmail, setNewSchoolEmail] = useState<string>('');
  const [newSchoolPhone, setNewSchoolPhone] = useState<string>('');
  const [newSchoolPrincipal, setNewSchoolPrincipal] = useState<string>('');

  // Anti-Bias Draw configuration state
  const [drawStage, setDrawStage] = useState<TournamentStage>('zonal_prelims');
  const [drawProgram, setDrawProgram] = useState<TournamentProgram>('debate');
  const [drawCounty, setDrawCounty] = useState<string>('Montserrado');
  const [drawStartDate, setDrawStartDate] = useState<string>('2025-10-25');
  const [customSeed, setCustomSeed] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawSuccessToast, setDrawSuccessToast] = useState<string | null>(null);

  // Match Scoring Modal / State
  const [selectedFixtureForScore, setSelectedFixtureForScore] = useState<TournamentFixture | null>(null);
  const [scoreTeamA, setScoreTeamA] = useState<number>(280);
  const [scoreTeamB, setScoreTeamB] = useState<number>(275);
  const [ballotsTeamA, setBallotsTeamA] = useState<number>(3);
  const [ballotsTeamB, setBallotsTeamB] = useState<number>(0);
  const [selectedWinner, setSelectedWinner] = useState<'teamA' | 'teamB'>('teamA');
  const [decisionType, setDecisionType] = useState<string>('3-0 Unanimous Decision');
  const [judgeNotes, setJudgeNotes] = useState<string>('');

  // 1. Listen for real-time fixtures in Firestore
  useEffect(() => {
    try {
      if (!db) return;
      const fixturesRef = collection(db, 'tournamentFixtures');
      const unsubscribe = onSnapshot(fixturesRef, (snapshot) => {
        if (!snapshot.empty) {
          const loaded: TournamentFixture[] = [];
          snapshot.forEach((docSnap) => {
            loaded.push({ id: docSnap.id, ...docSnap.data() } as TournamentFixture);
          });
          // Sort by match date and match number
          loaded.sort((a, b) => (a.matchDate > b.matchDate ? 1 : -1));
          setFixtures(loaded);
        }
      }, (err) => {
        console.warn('Firestore real-time fixtures sync note:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore subscription not available:', e);
    }
  }, []);

  // 2. Ingest school registrations from involvementApplications & merge with accredited schools
  const processedSchools = useMemo<ZonedSchool[]>(() => {
    const schoolApps = applicationsList.filter(app => app.type === 'school');
    
    // Convert school applications into ZonedSchool format using algorithmic geographic zoning
    const appSchools: ZonedSchool[] = schoolApps.map(app => {
      const county = app.county || 'Montserrado';
      const addressOrCity = [app.location, app.notes].filter(Boolean).join(' ');
      const zoneMapping = mapSchoolToCountyZone(county, app.name, addressOrCity);

      // Detect program preference from message / notes
      let detectedProgram: TournamentProgram = 'debate';
      const combinedLower = `${app.name} ${app.notes || ''}`.toLowerCase();
      if (combinedLower.includes('stem') && combinedLower.includes('debate')) {
        detectedProgram = 'dual';
      } else if (combinedLower.includes('stem') || combinedLower.includes('science') || combinedLower.includes('robot')) {
        detectedProgram = 'stem';
      }

      return {
        id: `app-sch-${app.id}`,
        name: app.name,
        county: county,
        zoneId: zoneMapping.zoneId,
        zoneName: zoneMapping.zoneName,
        cityOrDistrict: app.location || addressOrCity || 'Central District',
        program: detectedProgram,
        registrationSource: 'application',
        status: app.status === 'approved' ? 'verified' : 'registered',
        contactPerson: app.contactPerson || 'Assigned Debate Coach',
        contactEmail: app.email,
        contactPhone: app.phone,
        principalName: app.notes ? `Admin: ${app.notes.substring(0, 30)}` : undefined,
        delegationSize: 6,
        seedRating: 85,
        pastTitles: 0,
        applicationId: app.id,
        registeredAt: app.createdAt || new Date().toISOString()
      };
    });

    // Merge with ACCREDITED_BASE_SCHOOLS, ensuring no name collisions
    const combined: ZonedSchool[] = [...appSchools];
    const registeredNames = new Set(appSchools.map(s => s.name.trim().toLowerCase()));

    for (const baseSchool of ACCREDITED_BASE_SCHOOLS) {
      if (!registeredNames.has(baseSchool.name.trim().toLowerCase())) {
        combined.push(baseSchool);
      }
    }

    return combined;
  }, [applicationsList]);

  // Filtered schools for the dashboard
  const displayedSchools = useMemo(() => {
    return processedSchools.filter(school => {
      const matchesCounty = selectedCounty === 'All Counties' || school.county.toLowerCase() === selectedCounty.toLowerCase();
      const matchesProgram = selectedProgram === 'all' || school.program === selectedProgram || school.program === 'dual';
      const matchesSearch = !searchQuery || 
        school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.zoneName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        school.cityOrDistrict.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCounty && matchesProgram && matchesSearch;
    });
  }, [processedSchools, selectedCounty, selectedProgram, searchQuery]);

  // Group displayed schools by county and zone
  const groupedByZone = useMemo(() => {
    const map = new Map<string, { zone: CountyZone | undefined; schools: ZonedSchool[] }>();
    
    // Initialize with all zones for the selected county (or all counties)
    const targetZones = selectedCounty === 'All Counties' 
      ? LIBERIA_COUNTY_ZONES 
      : LIBERIA_COUNTY_ZONES.filter(z => z.county.toLowerCase() === selectedCounty.toLowerCase());

    for (const z of targetZones) {
      map.set(z.id, { zone: z, schools: [] });
    }

    // Populate schools
    for (const s of displayedSchools) {
      if (!map.has(s.zoneId)) {
        // Fallback find zone or create generic
        const found = LIBERIA_COUNTY_ZONES.find(z => z.id === s.zoneId);
        map.set(s.zoneId, { zone: found, schools: [] });
      }
      map.get(s.zoneId)!.schools.push(s);
    }

    return map;
  }, [displayedSchools, selectedCounty]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalSchools = processedSchools.length;
    const verified = processedSchools.filter(s => s.status === 'verified').length;
    const fromApps = processedSchools.filter(s => s.registrationSource === 'application').length;
    const debateCount = processedSchools.filter(s => s.program === 'debate' || s.program === 'dual').length;
    const stemCount = processedSchools.filter(s => s.program === 'stem' || s.program === 'dual').length;
    const totalCountiesRepresented = new Set(processedSchools.map(s => s.county)).size;
    const totalFixturesScheduled = fixtures.length;
    const completedFixtures = fixtures.filter(f => f.status === 'completed').length;

    // Detect crowned County Champions from completed county finals or manual flags
    const countyChampions = new Set(
      fixtures
        .filter(f => f.stage === 'county_finals' && f.status === 'completed' && f.winnerName)
        .map(f => `${f.county}: ${f.winnerName}`)
    );

    return {
      totalSchools,
      verified,
      fromApps,
      debateCount,
      stemCount,
      totalCountiesRepresented,
      totalFixturesScheduled,
      completedFixtures,
      countyChampionsCount: countyChampions.size
    };
  }, [processedSchools, fixtures]);

  // Real-time calculation of tournament standings & progression points across the selected county/zones
  const tournamentStandings = useMemo<SchoolTournamentStanding[]>(() => {
    return calculateTournamentStandings(displayedSchools, fixtures);
  }, [displayedSchools, fixtures]);

  // Qualified schools ready to advance to next round
  const qualifiedSchoolsToAdvance = useMemo(() => {
    return tournamentStandings.filter(st => st.qualificationStatus === 'qualified_next_round');
  }, [tournamentStandings]);

  // Aggregate school performance data entered on the site
  const schoolStatsMap = useMemo(() => {
    const map: Record<string, { totalScore: number; ballotsWon: number; matchesWon: number; matchesPlayed: number }> = {};
    for (const f of fixtures) {
      if (f.status === 'completed') {
        const aId = f.teamA.schoolId;
        const bId = f.teamB.schoolId;
        if (!map[aId]) map[aId] = { totalScore: 0, ballotsWon: 0, matchesWon: 0, matchesPlayed: 0 };
        if (!map[bId]) map[bId] = { totalScore: 0, ballotsWon: 0, matchesWon: 0, matchesPlayed: 0 };
        
        map[aId].matchesPlayed += 1;
        map[bId].matchesPlayed += 1;
        
        map[aId].totalScore += f.teamA.score || 0;
        map[bId].totalScore += f.teamB.score || 0;
        
        map[aId].ballotsWon += f.teamA.ballots || 0;
        map[bId].ballotsWon += f.teamB.ballots || 0;
        
        if (f.winnerRole === 'teamA') map[aId].matchesWon += 1;
        if (f.winnerRole === 'teamB') map[bId].matchesWon += 1;
      }
    }
    return map;
  }, [fixtures]);

  // 15 County Champions Roster (When all counties come together)
  const countyChampionsList = useMemo(() => {
    const all15Counties = [
      'Montserrado', 'Nimba', 'Bong', 'Margibi', 'Grand Bassa',
      'Lofa', 'Grand Gedeh', 'Maryland', 'Bomi', 'Grand Cape Mount',
      'Sinoe', 'River Cess', 'Grand Kru', 'River Gee', 'Gbarpolu'
    ];

    return all15Counties.map(countyName => {
      // Find winner of county final if completed
      const countyFinal = fixtures.find(f => 
        f.county.toLowerCase() === countyName.toLowerCase() && 
        f.stage === 'county_finals' && 
        f.status === 'completed' && 
        f.winnerName
      );

      let representative: ZonedSchool | undefined;
      let isCrowned = false;

      if (countyFinal && countyFinal.winnerId) {
        representative = processedSchools.find(s => s.id === countyFinal.winnerId || s.name === countyFinal.winnerName);
        isCrowned = true;
      }

      if (!representative) {
        // Pick highest ranked school based on site entered data or seedRating
        const countySchools = processedSchools.filter(s => s.county.toLowerCase() === countyName.toLowerCase());
        if (countySchools.length > 0) {
          representative = [...countySchools].sort((a, b) => {
            const statsA = schoolStatsMap[a.id] || { totalScore: (a.seedRating || 80) * 3, matchesWon: 0, ballotsWon: 0 };
            const statsB = schoolStatsMap[b.id] || { totalScore: (b.seedRating || 80) * 3, matchesWon: 0, ballotsWon: 0 };
            return statsB.totalScore - statsA.totalScore;
          })[0];
        }
      }

      const stats = representative 
        ? (schoolStatsMap[representative.id] || { totalScore: (representative.seedRating || 85) * 3, matchesWon: isCrowned ? 2 : 1, ballotsWon: isCrowned ? 5 : 3 }) 
        : { totalScore: 0, matchesWon: 0, ballotsWon: 0 };

      return {
        county: countyName,
        school: representative,
        isCrowned,
        stats
      };
    });
  }, [fixtures, processedSchools, schoolStatsMap]);

  // Anti-Bias Human Bias & Conflict Auditor
  const biasAuditResult: BiasAuditResult = useMemo(() => {
    return detectTournamentHumanBias(fixtures, processedSchools);
  }, [fixtures, processedSchools]);

  // Handler: Execute 15-County National Championship Anti-Bias Draw
  const handleExecute15CountyNationalDraw = async () => {
    setIsDrawing(true);
    setDrawSuccessToast(null);

    setTimeout(async () => {
      try {
        const champs = countyChampionsList
          .map(c => c.school)
          .filter((s): s is ZonedSchool => !!s);

        const nationalFixtures = generateNationalChampionshipPairings({
          countyChampions: champs,
          schoolStats: schoolStatsMap,
          program: selectedProgram === 'stem' ? 'stem' : 'debate',
          startDate: drawStartDate || '2025-10-25'
        });

        for (const fix of nationalFixtures) {
          try {
            await setDoc(doc(db, 'tournamentFixtures', fix.id), fix);
          } catch (e) {
            console.warn('Error saving national fixture to Firestore:', e);
          }
        }

        setFixtures(prev => {
          const filtered = prev.filter(f => !nationalFixtures.some(n => n.id === f.id));
          return [...nationalFixtures, ...filtered];
        });

        setDrawSuccessToast(
          `15-County National Championship Anti-Bias Draw Completed! Generated ${nationalFixtures.length} championship matches pairing all 15 counties accurately based on entered site data. Cryptographic Hash: ${nationalFixtures[0].antiBiasHash}`
        );
      } catch (err) {
        console.error('Error executing 15-county national draw:', err);
        alert('Failed to execute 15-county national draw.');
      } finally {
        setIsDrawing(false);
      }
    }, 1200);
  };

  // Handler: Add a school manually to the zoning engine
  const handleAddManualSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    const zoneInfo = mapSchoolToCountyZone(newSchoolCounty, newSchoolName, newSchoolDistrict);
    const newZoned: ZonedSchool = {
      id: `man-sch-${Date.now()}`,
      name: newSchoolName.trim(),
      county: newSchoolCounty,
      zoneId: zoneInfo.zoneId,
      zoneName: zoneInfo.zoneName,
      cityOrDistrict: newSchoolDistrict.trim() || 'Central Zone',
      program: newSchoolProgram,
      registrationSource: 'manual',
      status: 'verified',
      contactPerson: newSchoolContact.trim() || 'Debate Coach',
      contactEmail: newSchoolEmail.trim() || 'coach@school.edu.lr',
      contactPhone: newSchoolPhone.trim() || '+231 770 000 000',
      principalName: newSchoolPrincipal.trim() || undefined,
      delegationSize: 6,
      seedRating: 85,
      pastTitles: 0,
      registeredAt: new Date().toISOString()
    };

    ACCREDITED_BASE_SCHOOLS.unshift(newZoned);
    setShowAddModal(false);
    setNewSchoolName('');
    setNewSchoolDistrict('');
    setNewSchoolContact('');
    setNewSchoolEmail('');
    setNewSchoolPhone('');
    setNewSchoolPrincipal('');
    alert(`School "${newZoned.name}" successfully added and zoned into "${newZoned.zoneName}"!`);
  };

  // Handler: Run Algorithmic Anti-Bias Draw
  const handleExecuteDraw = async () => {
    setIsDrawing(true);
    setDrawSuccessToast(null);

    // Provide visual algorithmic calculation delay
    setTimeout(async () => {
      try {
        let poolOfSchools = [...processedSchools];

        // If stage is national_championship, we prioritize county winners or top seeds from each of the 15 counties!
        if (drawStage === 'national_championship') {
          // Find champions or highest rated school from each of the 15 counties
          const countyMap = new Map<string, ZonedSchool>();
          
          // First check for winners of county finals
          for (const fix of fixtures) {
            if (fix.stage === 'county_finals' && fix.status === 'completed' && fix.winnerId) {
              const winningSchool = poolOfSchools.find(s => s.id === fix.winnerId || s.name === fix.winnerName);
              if (winningSchool) {
                countyMap.set(winningSchool.county.toLowerCase(), winningSchool);
              }
            }
          }

          // For remaining counties, pick the top seed school
          for (const school of poolOfSchools) {
            const cLower = school.county.toLowerCase();
            if (!countyMap.has(cLower)) {
              countyMap.set(cLower, school);
            } else {
              const existing = countyMap.get(cLower)!;
              if ((school.seedRating || 0) > (existing.seedRating || 0)) {
                countyMap.set(cLower, school);
              }
            }
          }

          poolOfSchools = Array.from(countyMap.values());
        }

        const generated = generateAntiBiasFixtures({
          schools: poolOfSchools,
          stage: drawStage,
          program: drawProgram,
          county: drawStage === 'national_championship' ? 'All 15 Counties' : drawCounty,
          startDate: drawStartDate,
          seedOverride: customSeed.trim() || undefined
        });

        if (generated.length === 0) {
          alert('Not enough eligible schools in the selected county/zone to form fixtures (minimum 2 schools required).');
          setIsDrawing(false);
          return;
        }

        // Save generated fixtures to Firestore and local state
        for (const fix of generated) {
          try {
            await setDoc(doc(db, 'tournamentFixtures', fix.id), fix);
          } catch (e) {
            console.warn('Could not save fixture to Firestore:', e);
          }
        }

        setFixtures(prev => {
          // Merge avoiding duplicates
          const filtered = prev.filter(f => !generated.some(g => g.id === f.id));
          return [...generated, ...filtered];
        });

        setDrawSuccessToast(
          `Successfully generated ${generated.length} anti-bias fixtures for ${
            drawStage === 'national_championship' ? '15-County National Super Round' : `${drawCounty} (${drawStage})`
          }! Cryptographic Integrity Hash: ${generated[0].antiBiasHash.split('-')[0]}-${generated[0].antiBiasHash.split('-')[1]}`
        );
      } catch (err) {
        console.error('Draw generation error:', err);
        alert('An error occurred while generating fixtures. Please check inputs.');
      } finally {
        setIsDrawing(false);
      }
    }, 1200);
  };

  // Handler: Save Match Results & Automatically Advance Winner
  const handleSaveMatchResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFixtureForScore) return;

    const winnerObj = selectedWinner === 'teamA' ? selectedFixtureForScore.teamA : selectedFixtureForScore.teamB;
    const updatedFixture: TournamentFixture = {
      ...selectedFixtureForScore,
      status: 'completed',
      winnerId: winnerObj.schoolId,
      winnerName: winnerObj.schoolName,
      winnerRole: selectedWinner,
      teamA: {
        ...selectedFixtureForScore.teamA,
        score: scoreTeamA,
        ballots: ballotsTeamA
      },
      teamB: {
        ...selectedFixtureForScore.teamB,
        score: scoreTeamB,
        ballots: ballotsTeamB
      },
      scoreDifferential: decisionType,
      adjudicatorNotes: judgeNotes.trim() || undefined,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'tournamentFixtures', updatedFixture.id), updatedFixture);
    } catch (err) {
      console.warn('Firestore update note:', err);
    }

    setFixtures(prev => prev.map(f => f.id === updatedFixture.id ? updatedFixture : f));

    // Automated Advancement Alert
    let advancementNotice = `Match Result Recorded! ${winnerObj.schoolName} won with a ${decisionType}.`;
    if (selectedFixtureForScore.stage === 'zonal_prelims') {
      advancementNotice += `\n\n🎉 AUTOMATED ADVANCEMENT: ${winnerObj.schoolName} has qualified for the ${selectedFixtureForScore.county} County Championship Finals!`;
    } else if (selectedFixtureForScore.stage === 'county_finals') {
      advancementNotice += `\n\n🏆 COUNTY CHAMPION CROWNED: ${winnerObj.schoolName} is now the Official ${selectedFixtureForScore.county} Champion and automatically advances to represent ${selectedFixtureForScore.county} at the 15-County National Debate Championship!`;
    }

    alert(advancementNotice);
    setSelectedFixtureForScore(null);
  };

  // Handler: Save Public Announcement & Reveal Settings
  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAnnouncement(true);
    try {
      await setDoc(doc(db, 'tournamentSettings', 'publicReveal'), announcement);
      setAnnouncementSavedToast(true);
      setTimeout(() => setAnnouncementSavedToast(false), 3000);
    } catch (err) {
      console.warn('Error saving announcement to Firestore:', err);
      setAnnouncementSavedToast(true);
      setTimeout(() => setAnnouncementSavedToast(false), 3000);
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  // Handler: Update a single fixture in Firestore and state
  const handleUpdateFixture = async (updatedFixture: TournamentFixture) => {
    try {
      await setDoc(doc(db, 'tournamentFixtures', updatedFixture.id), updatedFixture);
    } catch (err) {
      console.warn('Could not update fixture in Firestore:', err);
    }
    setFixtures(prev => prev.map(f => f.id === updatedFixture.id ? updatedFixture : f));
  };

  // Handler: Toggle School Registration Window Open / Closed across all 15 counties
  const handleToggleRegistrationWindow = async () => {
    setIsTogglingRegistration(true);
    const nextState = !isDebateOpen;
    try {
      await updateStatus('debate-prog', {
        isOpen: nextState,
        statusLabel: nextState ? 'Open Now, Register' : 'Closed - Registration Closed by Secretariat'
      }, userEmail);

      setRegStatusToast(
        nextState 
          ? '🟢 Registration Window OPENED for all 15 Liberian Counties! Public school registration form is now accepting submissions.' 
          : '🔒 Registration Window CLOSED! Public school registration is now locked for zoning and fixture draws.'
      );
      setTimeout(() => setRegStatusToast(null), 5000);
    } catch (err) {
      console.error('Error toggling registration window:', err);
      alert('Could not update registration status. Please verify permissions.');
    } finally {
      setIsTogglingRegistration(false);
    }
  };

  // Handler: Generate 3-Round Prelim Fixtures guaranteeing maximum 3 games per school
  const handleGenerate3RoundPrelims = async () => {
    const targetCounty = drawCounty === 'All' || drawCounty === 'All Counties' ? 'Montserrado' : drawCounty;
    const pool = displayedSchools.filter(s => 
      (s.program === 'debate' || s.program === 'dual') &&
      (s.county.toLowerCase() === targetCounty.toLowerCase())
    );

    if (pool.length < 2) {
      alert(`Minimum 2 schools required in ${targetCounty} to generate preliminary fixtures. Found ${pool.length}.`);
      return;
    }

    setIsDrawing(true);
    try {
      const generated = generate3RoundPrelimFixtures({
        county: targetCounty,
        schools: pool,
        motionBank: motionBank,
        defaultVenue: OFFICIAL_LIBERIAN_VENUES.find(v => v.toLowerCase().includes(targetCounty.toLowerCase())),
        seedOverride: customSeed.trim() || undefined,
        startDate: drawStartDate
      });

      if (generated.length === 0) {
        alert('Could not generate 3-round prelim fixtures for the selected schools.');
        setIsDrawing(false);
        return;
      }

      // Save fixtures to Firestore
      for (const fix of generated) {
        try {
          await setDoc(doc(db, 'tournamentFixtures', fix.id), fix);
        } catch (e) {
          console.warn('Could not save fixture to Firestore:', e);
        }
      }

      setFixtures(prev => {
        const filtered = prev.filter(f => !generated.some(g => g.id === f.id));
        return [...generated, ...filtered];
      });

      setDrawSuccessToast(
        `Successfully generated ${generated.length} preliminary fixtures (up to 3 games per school) for ${targetCounty}! Fresh motions were pulled from the Motion Bank.`
      );
      setTimeout(() => setDrawSuccessToast(null), 6000);
    } catch (err) {
      console.error('Error generating 3-round prelims:', err);
      alert('An error occurred while generating 3-round fixtures.');
    } finally {
      setIsDrawing(false);
    }
  };

  // Handler: Open schedule editor for Time and Venue
  const handleOpenScheduleModal = (fixture: TournamentFixture) => {
    setSelectedFixtureForSchedule(fixture);
    setScheduleDate(fixture.matchDate || new Date().toISOString().split('T')[0]);
    setScheduleTime(fixture.matchTime || '09:30 AM GMT');
    setScheduleVenue(fixture.venue || OFFICIAL_LIBERIAN_VENUES[0]);
    setScheduleMotion(fixture.motion || '');
  };

  // Handler: Save scheduled Time and Venue
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFixtureForSchedule) return;

    setIsSavingSchedule(true);
    const updated: TournamentFixture = {
      ...selectedFixtureForSchedule,
      matchDate: scheduleDate,
      matchTime: scheduleTime,
      venue: scheduleVenue,
      motion: scheduleMotion || selectedFixtureForSchedule.motion,
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'tournamentFixtures', updated.id), updated);
      setFixtures(prev => prev.map(f => f.id === updated.id ? updated : f));
      setSelectedFixtureForSchedule(null);
    } catch (err) {
      console.error('Error saving schedule:', err);
      alert('Could not update match schedule in Firestore.');
    } finally {
      setIsSavingSchedule(false);
    }
  };

  // Handler: Simulate results for scheduled matches
  const handleSimulatePendingMatches = async () => {
    const pending = fixtures.filter(f => f.status === 'scheduled');
    if (pending.length === 0) {
      alert('No pending scheduled matches found to simulate.');
      return;
    }

    setIsSimulating(true);
    try {
      const simulated = simulateFixturesResults(pending);
      for (const fix of simulated) {
        try {
          await setDoc(doc(db, 'tournamentFixtures', fix.id), fix);
        } catch (e) {
          console.warn('Could not save simulated fixture to Firestore:', e);
        }
      }

      setFixtures(prev => prev.map(f => {
        const found = simulated.find(s => s.id === f.id);
        return found || f;
      }));

      setSimulationToast(`Successfully simulated ${simulated.length} match results with certified ballots & scores! Standings have been updated in real time.`);
      setTimeout(() => setSimulationToast(null), 5000);
    } catch (err) {
      console.error('Error simulating results:', err);
      alert('An error occurred during simulation.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: Advance top qualified teams to the next round, pair them with new motions from Motion Bank
  const handleAdvanceQualifiedTeams = async () => {
    const advancingPool = (qualifiedSchoolsToAdvance.length >= 2 
      ? qualifiedSchoolsToAdvance 
      : tournamentStandings.slice(0, 4)
    ).map(st => ({
      id: st.schoolId,
      name: st.schoolName,
      county: st.county,
      zoneName: st.zoneName
    }));

    if (advancingPool.length < 2) {
      alert('Need at least 2 teams in the standings to advance to the next round.');
      return;
    }

    const targetCounty = selectedCounty === 'All Counties' ? (advancingPool[0].county || 'All 15 Counties') : selectedCounty;
    const nextFixtures = generateNextRoundPairings({
      advancingSchools: advancingPool,
      stage: 'county_finals',
      county: targetCounty,
      motionBank: motionBank,
      scheduledDate: simulationMatchDate
    });

    if (nextFixtures.length === 0) {
      alert('Could not generate next round pairings for the advancing schools.');
      return;
    }

    setIsSimulating(true);
    try {
      for (const fix of nextFixtures) {
        await setDoc(doc(db, 'tournamentFixtures', fix.id), fix);
      }

      setFixtures(prev => [...nextFixtures, ...prev.filter(f => !nextFixtures.some(n => n.id === f.id))]);
      setAdvancingFixturesPreview(nextFixtures);
      setSimulationToast(`🎉 Advanced ${advancingPool.length} teams to the Next Round! Generated ${nextFixtures.length} new face-off fixtures with brand new motions from the Motion Bank.`);
      setTimeout(() => setSimulationToast(null), 6000);
    } catch (err) {
      console.error('Error advancing teams:', err);
      alert('Could not advance teams.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: Simulate full tournament (prelims -> standings -> next round advance)
  const handleSimulateFullTournament = async () => {
    setIsSimulating(true);
    try {
      // 1. Simulate all pending matches
      const pending = fixtures.filter(f => f.status === 'scheduled');
      const simulated = simulateFixturesResults(pending);
      for (const fix of simulated) {
        try {
          await setDoc(doc(db, 'tournamentFixtures', fix.id), fix);
        } catch (e) {
          console.warn('Sim save error:', e);
        }
      }

      const updatedFixtures = fixtures.map(f => simulated.find(s => s.id === f.id) || f);
      setFixtures(updatedFixtures);

      // 2. Calculate standings with the newly completed matches
      const updatedStandings = calculateTournamentStandings(displayedSchools, updatedFixtures);
      const topAdvancers = updatedStandings.slice(0, 4).map(st => ({
        id: st.schoolId,
        name: st.schoolName,
        county: st.county,
        zoneName: st.zoneName
      }));

      // 3. Generate Next Round pairings with fresh motions
      if (topAdvancers.length >= 2) {
        const nextRoundFixes = generateNextRoundPairings({
          advancingSchools: topAdvancers,
          stage: 'county_finals',
          county: selectedCounty === 'All Counties' ? topAdvancers[0].county : selectedCounty,
          motionBank: motionBank,
          scheduledDate: simulationMatchDate
        });

        for (const nFix of nextRoundFixes) {
          try {
            await setDoc(doc(db, 'tournamentFixtures', nFix.id), nFix);
          } catch (e) {
            console.warn('Next round save error:', e);
          }
        }

        setFixtures(prev => [...nextRoundFixes, ...prev.filter(f => !nextRoundFixes.some(n => n.id === f.id))]);
        setAdvancingFixturesPreview(nextRoundFixes);
      }

      setSimulationToast(`🚀 Tournament Full Simulation Complete! Prelims scored, points tallied, and Next Round Knockouts paired with fresh motions from the Motion Bank! Published live to the public site.`);
      setTimeout(() => setSimulationToast(null), 7000);
    } catch (err) {
      console.error('Full tournament simulation error:', err);
      alert('Error during full simulation.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: Save Registration Deadline and push to program status
  const handleSaveRegistrationDeadline = async () => {
    setIsSavingDeadline(true);
    try {
      const formatted = new Date(newDeadlineDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const label = newDeadlineLabel.trim() || formatted;
      await updateDeadline(label, newDeadlineDate, userEmail);
      await updateStatus('debate-prog', {
        registrationDeadline: label,
        registrationDeadlineDate: newDeadlineDate
      }, userEmail);
      setRegStatusToast(`✅ Official registration deadline updated to ${label} (${newDeadlineDate})!`);
      setTimeout(() => setRegStatusToast(null), 6000);
    } catch (e) {
      console.error('Save deadline error:', e);
      alert('Could not update deadline.');
    } finally {
      setIsSavingDeadline(false);
    }
  };

  // Handler: Pair Registered Schools by County (Stage 1 County Preliminaries)
  const handlePairAllCountiesStage1 = async () => {
    setIsSimulating(true);
    try {
      const debateSchools = processedSchools.filter(s => s.program === 'debate' || s.program === 'dual');
      
      const schoolsByCounty: Record<string, ZonedSchool[]> = {};
      LIBERIA_15_COUNTIES.filter(c => c !== 'All Counties').forEach(c => {
        schoolsByCounty[c] = [];
      });

      debateSchools.forEach(s => {
        const c = s.county || 'Montserrado';
        if (!schoolsByCounty[c]) schoolsByCounty[c] = [];
        schoolsByCounty[c].push(s);
      });

      const allGeneratedFixtures: TournamentFixture[] = [];
      let countiesPaired = 0;

      for (const [county, pool] of Object.entries(schoolsByCounty)) {
        if (pool.length < 2) continue;
        const fixturesForCounty = generate3RoundPrelimFixtures({
          county,
          schools: pool,
          motionBank: motionBank,
          defaultVenue: OFFICIAL_LIBERIAN_VENUES.find(v => v.toLowerCase().includes(county.toLowerCase())),
          seedOverride: customSeed.trim() || undefined,
          startDate: simulationMatchDate || drawStartDate
        });

        allGeneratedFixtures.push(...fixturesForCounty);
        countiesPaired += 1;
      }

      if (allGeneratedFixtures.length === 0) {
        alert('No counties had at least 2 registered schools to generate pairings. Please register schools or verify county assignments.');
        setIsSimulating(false);
        return;
      }

      for (const fix of allGeneratedFixtures) {
        try {
          await setDoc(doc(db, 'tournamentFixtures', fix.id), fix);
        } catch (e) {
          console.warn('Save fixture note:', e);
        }
      }

      setFixtures(prev => [...allGeneratedFixtures, ...prev.filter(f => !allGeneratedFixtures.some(g => g.id === f.id))]);
      
      await updateStage({
        currentStage: 'county_prelims',
        stage1Locked: false,
        stage2Locked: true,
        stage3Locked: true
      }, userEmail);

      setRegStatusToast(`✅ Paired registered schools across ${countiesPaired} counties! Generated ${allGeneratedFixtures.length} Stage 1 County Preliminary fixtures. Stage 1 is open; Stages 2 & 3 remain locked.`);
      setTimeout(() => setRegStatusToast(null), 8000);
    } catch (err) {
      console.error('Error pairing schools by county:', err);
      alert('Could not pair schools by county.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: Advance to Central Stage 2 (County vs County)
  const handleAdvanceToCentralRound = async () => {
    const stage1Check = checkStage1Status(fixtures);
    if (!stage1Check.isComplete) {
      alert(
        `⚠️ Cannot advance to Central Stage 2:\n\nAll schools must have played each other in their counties before moving to the next round (Central Round)!\n\nCurrently, there are still ${stage1Check.pendingMatches} pending matches across: ${stage1Check.pendingCounties.join(', ')}.\n\nPlease record match scores or click 'Simulate Pending County Matches' to finish Stage 1.`
      );
      return;
    }

    setIsSimulating(true);
    try {
      const res = await advanceTournamentToStage2({
        fixtures,
        motionBank,
        adminScheduledDate: simulationMatchDate,
        adminEmail: userEmail
      });

      if (res.success && res.newFixtures) {
        setFixtures(prev => [...res.newFixtures!, ...prev.filter(f => !res.newFixtures!.some(n => n.id === f.id))]);
        setAdvancingFixturesPreview(res.newFixtures);
        setSimulationToast(res.message);
        setTimeout(() => setSimulationToast(null), 8000);
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error('Error advancing to Central Stage:', err);
      alert('Could not advance to Central Stage.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: Advance R16 winners to Quarterfinals (Stage 2 Knockout Progression)
  const handleAdvanceToQuarterfinals = async () => {
    setIsSimulating(true);
    try {
      const res = await advanceCentralStageToQuarterfinals({
        fixtures,
        motionBank,
        adminScheduledDate: simulationMatchDate,
        adminEmail: userEmail
      });
      if (res.success && res.newFixtures) {
        setFixtures(prev => [...res.newFixtures!, ...prev.filter(f => !res.newFixtures!.some(n => n.id === f.id))]);
        setAdvancingFixturesPreview(res.newFixtures);
        setSimulationToast(res.message);
        setTimeout(() => setSimulationToast(null), 8000);
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error('Error advancing to Quarterfinals:', err);
      alert('Could not advance to Quarterfinals.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: Advance QF winners to Semifinals (Stage 2 Knockout Progression)
  const handleAdvanceToSemifinals = async () => {
    setIsSimulating(true);
    try {
      const res = await advanceCentralStageToSemifinals({
        fixtures,
        motionBank,
        adminScheduledDate: simulationMatchDate,
        adminEmail: userEmail
      });
      if (res.success && res.newFixtures) {
        setFixtures(prev => [...res.newFixtures!, ...prev.filter(f => !res.newFixtures!.some(n => n.id === f.id))]);
        setAdvancingFixturesPreview(res.newFixtures);
        setSimulationToast(res.message);
        setTimeout(() => setSimulationToast(null), 8000);
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error('Error advancing to Semifinals:', err);
      alert('Could not advance to Semifinals.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: Advance to Stage 3 (Grand Final and Third Place)
  const handleAdvanceToStage3Championship = async () => {
    const stage2Check = checkStage2Status(fixtures);
    if (!stage2Check.isComplete) {
      alert(
        `⚠️ Cannot advance to Stage 3:\n\nStage 2 Central Round is ongoing until it finalizes and gets the 4 teams that are going for the Grand Final and Third Place match!\n\nCurrently, there are still ${stage2Check.pendingMatches} pending matches in Central Round.\n\nPlease record match scores or simulate pending matches first.`
      );
      return;
    }

    setIsSimulating(true);
    try {
      const res = await advanceTournamentToStage3({
        fixtures,
        motionBank,
        adminScheduledDate: simulationMatchDate,
        adminEmail: userEmail
      });

      if (res.success && res.newFixtures) {
        setFixtures(prev => [...res.newFixtures!, ...prev.filter(f => !res.newFixtures!.some(n => n.id === f.id))]);
        setAdvancingFixturesPreview(res.newFixtures);
        setSimulationToast(res.message);
        setTimeout(() => setSimulationToast(null), 8000);
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error('Error advancing to Stage 3:', err);
      alert('Could not advance to Stage 3.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: Simulate pending county prelim fixtures
  const handleSimulatePendingCountyPrelims = async () => {
    setIsSimulating(true);
    try {
      const pendingCountyFixtures = fixtures.filter(
        f => (f.stage === 'county_prelims' || f.stage === 'zonal_prelims') && f.status !== 'completed'
      );

      if (pendingCountyFixtures.length === 0) {
        alert('All Stage 1 County Preliminary matches are already completed!');
        setIsSimulating(false);
        return;
      }

      const completed = simulateFixturesResults(pendingCountyFixtures, simulationMatchDate);
      for (const fix of completed) {
        try {
          await setDoc(doc(db, 'tournamentFixtures', fix.id), fix);
        } catch (e) {
          console.warn('Update fixture note:', e);
        }
      }

      setFixtures(prev => [
        ...completed,
        ...prev.filter(f => !completed.some(c => c.id === f.id))
      ]);

      setSimulationToast(`✅ Simulated ${completed.length} pending Stage 1 County Preliminary matches on ${simulationMatchDate}! Results synchronized with calendar.`);
      setTimeout(() => setSimulationToast(null), 6000);
    } catch (e) {
      console.error('Simulate prelims error:', e);
      alert('Error simulating county prelims.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: Simulate pending Central Stage fixtures
  const handleSimulatePendingCentralRound = async () => {
    setIsSimulating(true);
    try {
      const pendingCentralFixtures = fixtures.filter(
        f => (f.stage === 'central_stage' || f.stage === 'county_finals') && f.status !== 'completed'
      );

      if (pendingCentralFixtures.length === 0) {
        alert('All Central Stage matches are already completed!');
        setIsSimulating(false);
        return;
      }

      const completed = simulateFixturesResults(pendingCentralFixtures, simulationMatchDate);
      for (const fix of completed) {
        try {
          await setDoc(doc(db, 'tournamentFixtures', fix.id), fix);
        } catch (e) {
          console.warn('Update fixture note:', e);
        }
      }

      setFixtures(prev => [
        ...completed,
        ...prev.filter(f => !completed.some(c => c.id === f.id))
      ]);

      setSimulationToast(`✅ Simulated ${completed.length} pending Central Round matches on ${simulationMatchDate}! Results synchronized with calendar.`);
      setTimeout(() => setSimulationToast(null), 6000);
    } catch (e) {
      console.error('Simulate central error:', e);
      alert('Error simulating central round.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Handler: Simulate Stage 3 finals
  const handleSimulateStage3Finals = async () => {
    setIsSimulating(true);
    try {
      const pendingStage3Fixtures = fixtures.filter(
        f => (f.stage === 'grand_final_third_place' || f.stage === 'national_championship') && f.status !== 'completed'
      );

      if (pendingStage3Fixtures.length === 0) {
        alert('All Stage 3 Championship matches are already completed!');
        setIsSimulating(false);
        return;
      }

      const completed = simulateFixturesResults(pendingStage3Fixtures, simulationMatchDate);
      for (const fix of completed) {
        try {
          await setDoc(doc(db, 'tournamentFixtures', fix.id), fix);
        } catch (e) {
          console.warn('Update fixture note:', e);
        }
      }

      setFixtures(prev => [
        ...completed,
        ...prev.filter(f => !completed.some(c => c.id === f.id))
      ]);

      setSimulationToast(`🏆 Simulated Stage 3 Championship matches on ${simulationMatchDate}! Champions and 3rd Place winners crowned and synchronized with calendar.`);
      setTimeout(() => setSimulationToast(null), 8000);
    } catch (e) {
      console.error('Simulate stage 3 error:', e);
      alert('Error simulating finals.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div id="school-zoning-utility" className="space-y-6">
      {/* 0. Official School Registration Window Control Bar */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        isDebateOpen 
          ? 'bg-slate-900 text-white border-emerald-500/50 shadow-lg' 
          : 'bg-rose-950 text-white border-rose-500/50 shadow-lg'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isDebateOpen 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' 
                  : 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
              }`}>
                {isDebateOpen ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <Unlock className="w-3.5 h-3.5" />
                    <span>School Registration Window: OPEN</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <Lock className="w-3.5 h-3.5" />
                    <span>School Registration Window: CLOSED</span>
                  </>
                )}
              </span>

              {/* Deadline Status Badge */}
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isDeadlinePassed
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
              }`}>
                <Clock className="w-3 h-3" />
                {isDeadlinePassed ? (
                  <span>Deadline Expired ({stageState.registrationDeadlineDate})</span>
                ) : (
                  <span>Deadline Active: {daysRemaining} days left ({stageState.registrationDeadlineDate})</span>
                )}
              </span>

              <span className="text-xs font-semibold text-slate-300 hidden sm:inline">Active Across All 15 Counties</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl">
              {isDebateOpen ? (
                <>Schools in all 15 Liberian counties can submit delegations through the public registration form. The system tracks the deadline automatically. Once registration ends, pair schools within their counties to open Stage 1 County Preliminaries.</>
              ) : (
                <>The school registration form is currently <strong>locked</strong>. Public submissions are closed. The Secretariat can now safely organize registered schools into counties and launch Stage 1 within-county preliminary fixtures.</>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleToggleRegistrationWindow}
              disabled={isTogglingRegistration}
              className={`px-4 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                isDebateOpen
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isTogglingRegistration ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isDebateOpen ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
              <span>
                {isDebateOpen ? 'Close Registration Form' : 'Open Registration Form'}
              </span>
            </button>

            <button
              onClick={handlePairAllCountiesStage1}
              disabled={isSimulating}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              title="Pair registered schools by county, open Stage 1 County Prelims, and keep Stages 2 & 3 locked"
            >
              <Shuffle className="w-4 h-4" />
              <span>Pair Schools by County (Stage 1)</span>
            </button>
          </div>
        </div>

        {/* Deadline Manager Configurator Bar */}
        <div className="mt-4 pt-3.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span>Official Registration Deadline:</span>
            </div>
            <input 
              type="date"
              value={newDeadlineDate}
              onChange={(e) => setNewDeadlineDate(e.target.value)}
              className="px-2.5 py-1 bg-slate-950/80 border border-slate-600 rounded-lg text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              title="Select official date when school registration closes"
            />
            <input 
              type="text"
              value={newDeadlineLabel}
              onChange={(e) => setNewDeadlineLabel(e.target.value)}
              placeholder="e.g. May 15, 2025"
              className="px-2.5 py-1 bg-slate-950/80 border border-slate-600 rounded-lg text-white text-xs w-36 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              title="Display text label for deadline"
            />
            <button
              onClick={handleSaveRegistrationDeadline}
              disabled={isSavingDeadline}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSavingDeadline ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              <span>Save Deadline</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-300">
            Current Stage: <strong className="text-white uppercase font-mono">{stageState.currentStage.replace('_', ' ')}</strong> • Stage 1: {stageState.stage1Locked ? '🔒 Locked' : '🟢 Open'} • Stage 2: {stageState.stage2Locked ? '🔒 Locked' : '🟢 Open'} • Stage 3: {stageState.stage3Locked ? '🔒 Locked' : '🟢 Open'}
          </div>
        </div>

        {regStatusToast && (
          <div className="mt-3 p-3 rounded-xl bg-white/10 border border-white/20 text-xs sm:text-sm text-white font-semibold animate-in fade-in">
            {regStatusToast}
          </div>
        )}
      </div>

      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-700/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold tracking-wide uppercase">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Forensics & STEM Engine • Anti-Bias Verified</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              School Geographic Zoning & Anti-Bias Tournament Engine
            </h1>
            <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
              Processes secondary school registrations across all 15 counties of Liberia, auto-maps them into geographic zones, detects and eliminates human bias through cryptographic pseudo-random pairing, and generates balanced motions and neutral adjudication panels for zonal prelims, county finals, and the national championship.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register New School</span>
            </button>
            <button
              onClick={() => setActiveTab('antibias_engine')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 border border-white/20 transition-all cursor-pointer"
            >
              <Shuffle className="w-4 h-4 text-emerald-400" />
              <span>Launch Pairing Draw</span>
            </button>
          </div>
        </div>

        {/* Live Quick Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-emerald-800/40 text-center">
          <div className="bg-emerald-900/40 rounded-xl p-3 border border-emerald-700/30">
            <div className="text-2xl font-black text-emerald-300">{stats.totalSchools}</div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Total Schools</div>
          </div>
          <div className="bg-emerald-900/40 rounded-xl p-3 border border-emerald-700/30">
            <div className="text-2xl font-black text-white">{stats.totalCountiesRepresented}/15</div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Counties Active</div>
          </div>
          <div className="bg-emerald-900/40 rounded-xl p-3 border border-emerald-700/30">
            <div className="text-2xl font-black text-amber-300">{stats.fromApps}</div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">From Registration Apps</div>
          </div>
          <div className="bg-emerald-900/40 rounded-xl p-3 border border-emerald-700/30">
            <div className="text-2xl font-black text-teal-300">{stats.debateCount}</div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Debate Teams</div>
          </div>
          <div className="bg-emerald-900/40 rounded-xl p-3 border border-emerald-700/30">
            <div className="text-2xl font-black text-cyan-300">{stats.stemCount}</div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">STEM Teams</div>
          </div>
          <div className="bg-emerald-900/40 rounded-xl p-3 border border-emerald-700/30">
            <div className="text-2xl font-black text-yellow-300">{stats.totalFixturesScheduled}</div>
            <div className="text-xs text-slate-300 font-medium mt-0.5">Fixtures Generated</div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl shadow-xs px-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('zoning_dashboard')}
          className={`py-4 px-4 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'zoning_dashboard'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-700" />
          <span>1. County & Geographic Zones Review</span>
          <span className="px-2 py-0.5 text-xs bg-slate-100 text-slate-700 font-bold rounded-full">
            {displayedSchools.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('antibias_engine')}
          className={`py-4 px-4 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'antibias_engine'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shuffle className="w-4 h-4 text-emerald-700" />
          <span>2. Anti-Bias Pairing & Motion Draw</span>
          <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-900 font-bold rounded-full">
            {fixtures.length} Fixtures
          </span>
        </button>

        <button
          onClick={() => setActiveTab('results_advancement')}
          className={`py-4 px-4 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'results_advancement'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-600" />
          <span>3. Results & County Advancement</span>
          <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-900 font-bold rounded-full">
            {stats.completedFixtures} Decided
          </span>
        </button>

        <button
          onClick={() => setActiveTab('national_championship')}
          className={`py-4 px-4 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'national_championship'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4 text-indigo-600" />
          <span>4. 15-County National Draw</span>
          <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-900 font-bold rounded-full">
            All 15 Counties
          </span>
        </button>

        <button
          onClick={() => setActiveTab('bias_audit')}
          className={`py-4 px-4 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'bias_audit'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>5. Bias & Conflict Auditor</span>
          <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${biasAuditResult.adjudicatorConflicts.length === 0 ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
            {biasAuditResult.integrityScore}% Score
          </span>
        </button>

        <button
          onClick={() => setActiveTab('reveal_settings')}
          className={`py-4 px-4 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'reveal_settings'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Radio className="w-4 h-4 text-rose-600" />
          <span>6. Coach & School Public Reveal Date</span>
          <span className="px-2 py-0.5 text-xs bg-rose-100 text-rose-900 font-bold rounded-full">
            Public Notice
          </span>
        </button>

        <button
          onClick={() => setActiveTab('coach_notifications')}
          className={`py-4 px-4 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'coach_notifications'
              ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4 text-emerald-600" />
          <span>7. Coach Alerts</span>
          <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-900 font-black rounded-full">
            {fixtures.filter(f => f.isConfirmed).length}/{fixtures.length} Confirmed
          </span>
        </button>

        <button
          onClick={() => setActiveTab('motion_bank')}
          className={`py-4 px-4 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'motion_bank'
              ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-700" />
          <span>8. Motion Bank (Admin Box)</span>
          <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-900 font-black rounded-full">
            {motionBank.length} Motions
          </span>
        </button>

        <button
          onClick={() => setActiveTab('edition_archive')}
          className={`py-4 px-4 text-sm font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'edition_archive'
              ? 'border-amber-600 text-amber-900 bg-amber-50/50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Archive className="w-4 h-4 text-amber-600" />
          <span>9. Edition Archive & Backup</span>
          <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-900 font-black rounded-full">
            Lifecycle & Export
          </span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: COUNTY & GEOGRAPHIC ZONES REVIEW */}
      {activeTab === 'zoning_dashboard' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* County Select */}
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-600 uppercase">County:</span>
                <select
                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                >
                  {LIBERIA_15_COUNTIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Program Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 uppercase">Program:</span>
                <select
                  value={selectedProgram}
                  onChange={(e) => setSelectedProgram(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                >
                  <option value="all">All Programs</option>
                  <option value="debate">Debate Championship Only</option>
                  <option value="stem">STEM Innovation Challenge Only</option>
                </select>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search school, zone or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Zones Grid */}
          <div className="space-y-6">
            {Array.from(groupedByZone.entries()).map(([zoneId, { zone, schools }]) => {
              const zoneName = zone ? zone.name : zoneId;
              const countyName = zone ? zone.county : 'Liberia';

              return (
                <div key={zoneId} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  {/* Zone Header */}
                  <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-black text-xs rounded-md">
                          {countyName}
                        </span>
                        <h2 className="text-base font-bold text-slate-900">{zoneName}</h2>
                      </div>
                      {zone && (
                        <p className="text-xs text-slate-500">
                          <strong>Districts Covered:</strong> {zone.districts.join(', ')} • <strong>Primary Venue:</strong> {zone.primaryVenue}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {zone && (
                        <div className="text-right text-xs text-slate-500 hidden sm:block">
                          <div>Coord: <span className="font-semibold text-slate-700">{zone.coordinatorName}</span></div>
                          <div className="font-mono text-[11px] text-slate-400">{zone.coordinatorPhone}</div>
                        </div>
                      )}
                      <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800">
                        {schools.length} {schools.length === 1 ? 'School' : 'Schools'} Mapped
                      </div>
                    </div>
                  </div>

                  {/* Schools in Zone Table / Cards */}
                  {schools.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No schools currently registered in this zone. Click "Register New School" or submit an application.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-50/50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-100">
                          <tr>
                            <th className="py-3 px-6">School Name & Location</th>
                            <th className="py-3 px-4">Program Track</th>
                            <th className="py-3 px-4">Registration Source</th>
                            <th className="py-3 px-4">Coach / Delegation</th>
                            <th className="py-3 px-4">Seed Rating</th>
                            <th className="py-3 px-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {schools.map(school => (
                            <tr key={school.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-6">
                                <div className="font-bold text-slate-900">{school.name}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{school.cityOrDistrict}</span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                {school.program === 'debate' && (
                                  <span className="px-2 py-0.5 bg-teal-50 text-teal-800 border border-teal-200 font-bold text-xs rounded-full">
                                    Debate Only
                                  </span>
                                )}
                                {school.program === 'stem' && (
                                  <span className="px-2 py-0.5 bg-cyan-50 text-cyan-800 border border-cyan-200 font-bold text-xs rounded-full">
                                    STEM Only
                                  </span>
                                )}
                                {school.program === 'dual' && (
                                  <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 font-bold text-xs rounded-full">
                                    Dual (Debate + STEM)
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                {school.registrationSource === 'application' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-medium text-xs rounded-md">
                                    <Clock className="w-3 h-3" />
                                    <span>Web Registration Form</span>
                                  </span>
                                ) : school.registrationSource === 'database' ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 font-medium text-xs rounded-md">
                                    <Building2 className="w-3 h-3" />
                                    <span>Accredited Roster</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 font-medium text-xs rounded-md">
                                    <Plus className="w-3 h-3" />
                                    <span>Admin Manual Add</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="font-semibold text-slate-800">{school.contactPerson}</div>
                                <div className="text-xs text-slate-500 font-mono">{school.contactPhone}</div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1 font-bold text-slate-800">
                                  <Award className="w-3.5 h-3.5 text-amber-500" />
                                  <span>{school.seedRating || 85} pts</span>
                                </div>
                                {school.pastTitles ? (
                                  <div className="text-[10px] font-bold text-emerald-700">
                                    {school.pastTitles}x Champion
                                  </div>
                                ) : null}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 font-bold text-xs rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                  <span>Verified</span>
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ANTI-BIAS PAIRING & MOTION DRAW */}
      {activeTab === 'antibias_engine' && (
        <div className="space-y-6">
          {/* Engine Setup Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-bold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Objective Pseudo-Random Draw Algorithm</span>
                </div>
                <h2 className="text-xl font-black text-slate-900">
                  Algorithmic Anti-Bias Pairing & Motion Assignment
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm max-w-2xl">
                  Select tournament stage and county to execute the impartial draw. The engine uses a cryptographic pseudo-random seed to eliminate human favoritism, balances Affirmative and Negative sides evenly, maps relevant debate motions, and verifies adjudicator origin to prevent conflicts of interest.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-right shrink-0 hidden md:block">
                <div className="text-xs text-slate-500 font-semibold">Integrity Protocol</div>
                <div className="font-mono text-xs font-bold text-emerald-700">SHA-256 Seed Checksum</div>
                <div className="text-[11px] text-slate-400 mt-0.5">WSDC Rule 4.2 Compliant</div>
              </div>
            </div>

            {/* Config Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
              {/* Stage */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">1. Tournament Stage:</label>
                <select
                  value={drawStage}
                  onChange={(e) => setDrawStage(e.target.value as TournamentStage)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                >
                  <option value="zonal_prelims">Stage 1: County Zonal Prelims</option>
                  <option value="county_finals">Stage 2: County Championship Finals</option>
                  <option value="national_championship">Stage 3: National 15-County Championship</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  {drawStage === 'national_championship' 
                    ? 'Pairs all 15 county winners together in the national super-round.'
                    : 'Pairs schools within their county zones.'}
                </p>
              </div>

              {/* Program */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">2. Competition Track:</label>
                <select
                  value={drawProgram}
                  onChange={(e) => setDrawProgram(e.target.value as TournamentProgram)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                >
                  <option value="debate">National High School Debate</option>
                  <option value="stem">National STEM Challenge</option>
                </select>
              </div>

              {/* County (if not national) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">3. County Selection:</label>
                <select
                  disabled={drawStage === 'national_championship'}
                  value={drawCounty}
                  onChange={(e) => setDrawCounty(e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden ${
                    drawStage === 'national_championship' ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {LIBERIA_15_COUNTIES.filter(c => c !== 'All Counties').map(c => (
                    <option key={c} value={c}>{c} County</option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">4. Match Day Date:</label>
                <input
                  type="date"
                  value={drawStartDate}
                  onChange={(e) => setDrawStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Custom Seed (Optional for reproducible mathematical auditing) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 max-w-md w-full">
                <span className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Audit Seed:</span>
                <input
                  type="text"
                  placeholder="Leave empty for auto timestamp seed (e.g. YFC-SEED-2025)"
                  value={customSeed}
                  onChange={(e) => setCustomSeed(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  disabled={isDrawing}
                  onClick={handleGenerate3RoundPrelims}
                  className="px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  title="Generates 3 rounds of fixtures guaranteeing each school plays at most 3 games, with neutral motions drawn from Motion Bank"
                >
                  <Flame className="w-4 h-4 text-yellow-200" />
                  <span>Generate 3-Round Prelims (Max 3 Games)</span>
                </button>

                <button
                  disabled={isDrawing}
                  onClick={handleExecuteDraw}
                  className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-700/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDrawing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Computing Mathematical Draw...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                      <span>Run Anti-Bias Draw</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {drawSuccessToast && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs sm:text-sm flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">Pairing Verification Complete</div>
                  <div>{drawSuccessToast}</div>
                </div>
              </div>
            )}
          </div>

          {/* Generated Fixtures List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Active Scheduled Fixtures</span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  {fixtures.length} Total
                </span>
              </h3>

              <div className="text-xs text-slate-500">
                Sorted by Match Date & Anti-Bias Verification ID
              </div>
            </div>

            {fixtures.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400">
                No fixtures generated yet. Configure options above and click "Run Algorithmic Anti-Bias Draw".
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {fixtures.map((fixture) => (
                  <div 
                    key={fixture.id} 
                    className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Top Meta Bar */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-extrabold text-[11px] rounded-md">
                            {fixture.county}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {fixture.roundName}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {fixture.matchDate} at {fixture.matchTime}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {fixture.venue}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        {fixture.status === 'completed' ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black text-xs rounded-full">
                            Decided ({fixture.scoreDifferential || 'Winner Set'})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">
                            Scheduled
                          </span>
                        )}
                        {fixture.isConfirmed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold border border-emerald-300">
                            <Check className="w-3 h-3 text-emerald-700" />
                            Confirmed ({fixture.coachesNotifiedCount || 2} Alerted)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-semibold border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending Alert
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Team Matchup Card */}
                    <div className="grid grid-cols-5 gap-2 items-center bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/70">
                      {/* Team A */}
                      <div className="col-span-2 text-left space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-teal-700">
                          {fixture.teamA.role}
                        </div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                          {fixture.teamA.schoolName}
                        </div>
                        <div className="text-[11px] text-slate-500">{fixture.teamA.county}</div>
                        {fixture.status === 'completed' && fixture.teamA.score && (
                          <div className="text-xs font-bold text-slate-800">
                            {fixture.teamA.score} pts ({fixture.teamA.ballots} ballots)
                          </div>
                        )}
                      </div>

                      {/* VS Divider */}
                      <div className="col-span-1 text-center font-black text-xs text-slate-400 uppercase">
                        VS
                      </div>

                      {/* Team B */}
                      <div className="col-span-2 text-right space-y-1">
                        <div className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                          {fixture.teamB.role}
                        </div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                          {fixture.teamB.schoolName}
                        </div>
                        <div className="text-[11px] text-slate-500">{fixture.teamB.county}</div>
                        {fixture.status === 'completed' && fixture.teamB.score && (
                          <div className="text-xs font-bold text-slate-800">
                            {fixture.teamB.score} pts ({fixture.teamB.ballots} ballots)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Motion / Theme */}
                    <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-800 uppercase tracking-wide">
                          {fixture.program === 'debate' ? 'Debate Motion' : 'STEM Challenge Theme'}:
                        </span>
                        <span className="text-emerald-700 font-semibold">{fixture.motionDomain}</span>
                      </div>
                      <p className="text-slate-800 font-semibold italic">
                        "{fixture.motion}"
                      </p>
                    </div>

                    {/* Adjudicators & Anti-Bias Hash */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                      <div className="font-mono">
                        <strong className="text-slate-700">Draw ID:</strong> {fixture.antiBiasHash}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleOpenScheduleModal(fixture)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                          title="Admin: Set match time, venue, and motion"
                        >
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          <span>Time & Venue</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('coach_notifications');
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{fixture.isConfirmed ? 'View Alerts' : 'Alert Coaches'}</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedFixtureForScore(fixture);
                            setScoreTeamA(fixture.teamA.score || 282);
                            setScoreTeamB(fixture.teamB.score || 278);
                            setBallotsTeamA(fixture.teamA.ballots || 3);
                            setBallotsTeamB(fixture.teamB.ballots || 0);
                            setSelectedWinner('teamA');
                            setJudgeNotes(fixture.adjudicatorNotes || '');
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-600 hover:text-white font-bold rounded-lg text-slate-700 transition-colors cursor-pointer"
                        >
                          {fixture.status === 'completed' ? 'Edit Result' : 'Enter Scores / Winner'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: RESULTS & COUNTY ADVANCEMENT */}
      {activeTab === 'results_advancement' && (
        <div className="space-y-6">
          {/* Progression Engine & Simulation Action Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-700 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider border border-emerald-400/30">
                  <Zap className="w-3.5 h-3.5" />
                  <span>3-Game Tournament Progression & Motion Engine</span>
                </div>
                <h2 className="text-xl font-black tracking-tight text-white">
                  County Standings, Points Tracker & Next Round Pairing
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  Tracks games played (up to 3 matches per school), points, ballots won, and ranks teams in real time. Feed match results manually or simulate pending fixtures. The system automatically identifies teams that qualify for the next round and pairs them with fresh motions randomly selected from the Motion Bank.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  disabled={isSimulating}
                  onClick={handleSimulatePendingMatches}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  title="Simulate certified ballots and speaker points for all pending matches"
                >
                  <Play className="w-4 h-4" />
                  <span>Simulate Pending Results</span>
                </button>

                <button
                  disabled={isSimulating}
                  onClick={handleAdvanceQualifiedTeams}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  title="Advance top qualifying teams to next round face-off with motions from Motion Bank"
                >
                  <Trophy className="w-4 h-4" />
                  <span>Advance Qualified Teams</span>
                </button>

                <button
                  disabled={isSimulating}
                  onClick={handleSimulateFullTournament}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  title="Complete end-to-end simulation: prelims, standings, and next round matchups with motions from Motion Bank"
                >
                  <Flame className="w-4 h-4 text-yellow-300" />
                  <span>Full Tournament Simulation</span>
                </button>
              </div>
            </div>

            {/* Admin Match Date Box for Simulation Push & Calendar Sync */}
            <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-700 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-yellow-300 font-black">
                  <Calendar className="w-4 h-4 text-yellow-400" />
                  <span>Admin Scheduled Game Date:</span>
                </div>
                <input
                  id="admin-sim-match-date-input"
                  type="date"
                  value={simulationMatchDate}
                  onChange={(e) => setSimulationMatchDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-900 border border-yellow-400/50 rounded-xl text-yellow-200 font-black focus:ring-2 focus:ring-yellow-400 focus:outline-hidden"
                  title="Choose date for simulation games pushed to calendar"
                />
                <span className="text-slate-400 text-[11px] hidden sm:inline">
                  (Pushed fixtures automatically synchronize with this date on the live public calendar)
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Live Calendar Sync Active</span>
              </div>
            </div>

            {simulationToast && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-200 text-xs sm:text-sm font-semibold animate-in fade-in flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{simulationToast}</span>
              </div>
            )}

            {/* 3-Stage Sequential Progression & Locking Controller */}
            <div className="bg-slate-950/90 rounded-2xl p-4 sm:p-5 border border-slate-700/80 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="font-black text-sm text-white uppercase tracking-wider">
                      Sequential 3-Stage Progression & Automatic Stage Locking
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Progression Rule: All high schools must play each other within their counties before advancing to Central Round. Once Stage 2 begins, Stage 1 locks to preserve certified preliminary results.
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-mono">Current Active Stage</span>
                  <div className="text-xs font-black text-emerald-300 uppercase">
                    {stageState.currentStage.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              {/* 3 Stage Command Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* STAGE 1 COMMAND CARD */}
                {(() => {
                  const stage1Status = checkStage1Status(fixtures);
                  return (
                    <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                      stageState.stage1Locked
                        ? 'bg-slate-900/60 border-slate-800 opacity-90'
                        : 'bg-emerald-950/30 border-emerald-500/40 ring-1 ring-emerald-500/30'
                    }`}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                            STAGE 1
                          </span>
                          {stageState.stage1Locked ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> LOCKED ARCHIVE
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 flex items-center gap-1 animate-pulse">
                              <Unlock className="w-2.5 h-2.5" /> OPEN ONLY & ACTIVE
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-white">County Preliminaries</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          All schools play each other within their counties. Prelims must conclude across all counties before moving to Stage 2.
                        </p>

                        <div className="pt-2 text-xs space-y-1">
                          <div className="flex justify-between text-slate-300">
                            <span>County Matches:</span>
                            <strong className="text-white">{stage1Status.completedMatches} / {stage1Status.totalMatches} played</strong>
                          </div>
                          {stage1Status.pendingMatches > 0 && (
                            <div className="text-[11px] text-amber-300">
                              Pending: {stage1Status.pendingMatches} matches in {stage1Status.pendingCounties.slice(0, 3).join(', ')}{stage1Status.pendingCounties.length > 3 ? ` +${stage1Status.pendingCounties.length - 3} more` : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-800 space-y-2">
                        {!stageState.stage1Locked && (
                          <button
                            onClick={handleSimulatePendingCountyPrelims}
                            disabled={isSimulating || stage1Status.pendingMatches === 0}
                            className="w-full py-1.5 px-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            <span>Simulate Pending County Matches</span>
                          </button>
                        )}

                        <button
                          onClick={handleAdvanceToCentralRound}
                          disabled={isSimulating || stageState.stage1Locked || !stage1Status.isComplete}
                          className={`w-full py-2 px-3 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            stageState.stage1Locked
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : stage1Status.isComplete
                              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                          title={!stage1Status.isComplete ? `Must complete all within-county games (${stage1Status.pendingMatches} pending)` : 'Lock Stage 1 and advance winners to Central Stage 2'}
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>{stageState.stage1Locked ? 'Stage 1 Locked (Preserved)' : 'Lock Stage 1 & Open Stage 2'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* STAGE 2 COMMAND CARD */}
                {(() => {
                  const stage2Status = checkStage2Status(fixtures);
                  const canAdvanceToQF = stage2Status.r16Complete && stage2Status.qfFixtures.length === 0;
                  const canAdvanceToSF = stage2Status.qfComplete && stage2Status.sfFixtures.length === 0;
                  const canAdvanceToFinals = stage2Status.isComplete;
                  const currentKnockoutRound = stage2Status.sfComplete
                    ? 'Final 4 Ready (Stage 3)'
                    : stage2Status.qfFixtures.length > 0
                    ? (stage2Status.qfComplete ? 'Quarterfinals Done (Ready for SF)' : 'Quarterfinals (4 Matches)')
                    : stage2Status.r16Fixtures.length > 0
                    ? (stage2Status.r16Complete ? 'Round of 16 Done (Ready for QF)' : 'Round of 16 (8 Matches)')
                    : 'Awaiting Stage 1 Conclusion';

                  return (
                    <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                      stageState.stage2Locked
                        ? 'bg-slate-900/60 border-slate-800 opacity-90'
                        : 'bg-blue-950/30 border-blue-500/40 ring-1 ring-blue-500/30'
                    }`}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                            STAGE 2 • KNOCKOUT
                          </span>
                          {stageState.stage2Locked ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> {stageState.currentStage === 'county_prelims' ? 'LOCKED (STAGE 1 ONGOING)' : 'LOCKED (CONCLUDED)'}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 flex items-center gap-1 animate-pulse">
                              <Unlock className="w-2.5 h-2.5" /> ONGOING (16 TEAMS KNOCKOUT)
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-white">Central Stage (16 Teams Knockout)</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          16 Delegations clash in sequential knockouts: R16 (8 drop) → QF (4 drop) → SF (2 drop) → 2 to Grand Final, 2 to 3rd-Place.
                        </p>

                        {/* Round Progression Badge */}
                        <div className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Current Knockout Round:</span>
                          <span className="font-black text-blue-300 text-[11px] uppercase">
                            {currentKnockoutRound}
                          </span>
                        </div>

                        <div className="pt-2 text-xs space-y-1">
                          <div className="flex justify-between text-slate-300">
                            <span>Central Matches:</span>
                            <strong className="text-white">{stage2Status.completedMatches} / {stage2Status.totalMatches} played</strong>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {stage2Status.totalMatches === 0 
                              ? 'Fixtures generate when Stage 1 completes'
                              : canAdvanceToQF
                              ? '✅ Round of 16 complete! Ready to advance 8 winners to Quarterfinals.'
                              : canAdvanceToSF
                              ? '✅ Quarterfinals complete! Ready to advance 4 winners to Semifinals.'
                              : canAdvanceToFinals
                              ? '🏆 Semifinals complete! Final 4 determined for Stage 3.'
                              : `${stage2Status.pendingMatches} matches pending in current knockout round.`}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-800 space-y-2">
                        {!stageState.stage2Locked && stage2Status.pendingMatches > 0 && (
                          <button
                            onClick={handleSimulatePendingCentralRound}
                            disabled={isSimulating}
                            className="w-full py-1.5 px-2.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Play className="w-3 h-3" />
                            <span>Simulate Pending Central Matches ({stage2Status.pendingMatches})</span>
                          </button>
                        )}

                        {/* Step 1: Advance R16 -> Quarterfinals */}
                        {canAdvanceToQF && !stageState.stage2Locked && (
                          <button
                            onClick={handleAdvanceToQuarterfinals}
                            disabled={isSimulating}
                            className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer animate-pulse"
                          >
                            <Trophy className="w-3.5 h-3.5" />
                            <span>Advance 8 Winners to Quarterfinals (Elite 8)</span>
                          </button>
                        )}

                        {/* Step 2: Advance QF -> Semifinals */}
                        {canAdvanceToSF && !stageState.stage2Locked && (
                          <button
                            onClick={handleAdvanceToSemifinals}
                            disabled={isSimulating}
                            className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer animate-pulse"
                          >
                            <Trophy className="w-3.5 h-3.5" />
                            <span>Advance 4 Winners to Semifinals (Final 4)</span>
                          </button>
                        )}

                        {/* Step 3: Advance SF -> Stage 3 (Final & 3rd Place) */}
                        <button
                          onClick={handleAdvanceToStage3Championship}
                          disabled={isSimulating || stageState.stage2Locked || !stage2Status.isComplete}
                          className={`w-full py-2 px-3 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            stageState.stage2Locked
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : stage2Status.isComplete
                              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md animate-pulse'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                          title={!stage2Status.isComplete ? `Stage 2 knockout rounds in progress (${stage2Status.pendingMatches} matches pending)` : 'Advance 2 finalists to Grand Final and 2 to Third Place'}
                        >
                          <Trophy className="w-3.5 h-3.5" />
                          <span>{stageState.stage2Locked ? 'Stage 2 Locked' : 'Finalize Stage 2 & Open Stage 3 (Finals)'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* STAGE 3 COMMAND CARD */}
                {(() => {
                  const s3Fixes = fixtures.filter(f => f.stage === 'grand_final_third_place' || f.stage === 'national_championship');
                  const s3Pending = s3Fixes.filter(f => f.status !== 'completed').length;
                  return (
                    <div className={`p-4 rounded-xl border flex flex-col justify-between ${
                      stageState.stage3Locked
                        ? 'bg-slate-900/60 border-slate-800 opacity-90'
                        : 'bg-amber-950/30 border-amber-500/40 ring-1 ring-amber-500/30'
                    }`}>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                            STAGE 3
                          </span>
                          {stageState.stage3Locked ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" /> LOCKED (AWAITING FINAL 4)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/30 text-amber-200 flex items-center gap-1 animate-pulse">
                              <Unlock className="w-2.5 h-2.5" /> GRAND FINALS ACTIVE
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm text-white">Grand Final & Third Place</h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          3rd Place Bronze Clash on the Camp & National Grand Final at the Ministerial Complex.
                        </p>

                        <div className="pt-2 text-xs space-y-1">
                          <div className="flex justify-between text-slate-300">
                            <span>Final Matches:</span>
                            <strong className="text-white">{s3Fixes.length} matches</strong>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {s3Fixes.length === 0 
                              ? 'Locked while Stage 2 is ongoing'
                              : s3Pending === 0 
                              ? '🏆 National Championship Concluded!'
                              : `${s3Pending} championship matches pending`}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-800 space-y-2">
                        {!stageState.stage3Locked && (
                          <button
                            onClick={handleSimulateStage3Finals}
                            disabled={isSimulating || s3Pending === 0}
                            className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                          >
                            <Trophy className="w-3.5 h-3.5" />
                            <span>Simulate Stage 3 Finals</span>
                          </button>
                        )}

                        {stageState.stage3Locked && (
                          <div className="text-[11px] text-slate-500 text-center py-2">
                            Locked while Stage 2 is ongoing
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* New Round Knockout Pairings Preview Banner */}
          {advancingFixturesPreview && advancingFixturesPreview.length > 0 && (
            <div className="bg-emerald-900/30 border border-emerald-500/40 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-800 font-black text-sm uppercase tracking-wide">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Newly Generated Next-Round Pairings ({advancingFixturesPreview.length} Matches)</span>
                </div>
                <button
                  onClick={() => setAdvancingFixturesPreview(null)}
                  className="text-xs text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                >
                  Dismiss Preview
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {advancingFixturesPreview.map((fix) => (
                  <div key={fix.id} className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">{fix.roundName}</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 font-bold rounded-md text-[10px]">
                        {fix.county}
                      </span>
                    </div>
                    <div className="text-sm font-black text-slate-900 flex items-center justify-between gap-2">
                      <span className="text-emerald-800">{fix.teamA.schoolName}</span>
                      <span className="text-xs text-slate-400 font-semibold">vs</span>
                      <span className="text-indigo-800">{fix.teamB.schoolName}</span>
                    </div>
                    <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                      <strong>Motion from Bank:</strong> "{fix.motion}"
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>{fix.venue}</span>
                      <button
                        onClick={() => handleOpenScheduleModal(fix)}
                        className="text-emerald-700 font-bold hover:underline cursor-pointer"
                      >
                        Edit Time & Venue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STANDINGS & POINTS TABLE */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Official Tournament Standings & Points Table</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Ranked by Wins, Ballots, Points, and Score Differential. Maximum 3 preliminary matches per school.
                </p>
              </div>

              <div className="text-xs font-semibold text-slate-600 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  <span>Qualified</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  <span>In Progress</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                  <span>Eliminated</span>
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100/75 text-slate-600 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">Rank</th>
                    <th className="py-3 px-4">School & County</th>
                    <th className="py-3 px-3 text-center">Matches (Max 3)</th>
                    <th className="py-3 px-3 text-center">W - L</th>
                    <th className="py-3 px-3 text-center">Ballots</th>
                    <th className="py-3 px-3 text-center">Total Pts</th>
                    <th className="py-3 px-3 text-center">Avg Pts</th>
                    <th className="py-3 px-3 text-center">Diff</th>
                    <th className="py-3 px-4 text-right">Progression Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {tournamentStandings.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No schools registered in selected county. Select a different county or generate fixtures above.
                      </td>
                    </tr>
                  ) : (
                    tournamentStandings.map((standing) => (
                      <tr key={standing.schoolId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-center font-black text-slate-800">
                          {standing.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-black text-xs">
                              🥇 1
                            </span>
                          ) : standing.rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 font-black text-xs">
                              🥈 2
                            </span>
                          ) : standing.rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-800 font-black text-xs">
                              🥉 3
                            </span>
                          ) : (
                            `#${standing.rank}`
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{standing.schoolName}</div>
                          <div className="text-[11px] text-slate-500">{standing.county} • {standing.zoneName || 'Zonal League'}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-800">
                          <span className={`px-2 py-0.5 rounded-md text-xs ${standing.matchesPlayed >= 3 ? 'bg-slate-200 text-slate-800' : 'bg-blue-50 text-blue-800'}`}>
                            {standing.matchesPlayed} / 3
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-black text-slate-900">
                          {standing.matchesWon} - {standing.matchesLost}
                        </td>
                        <td className="py-3 px-3 text-center text-xs font-semibold text-slate-700">
                          {standing.ballotsWon} - {standing.ballotsLost}
                        </td>
                        <td className="py-3 px-3 text-center font-extrabold text-emerald-800 text-xs sm:text-sm">
                          {standing.totalPoints}
                        </td>
                        <td className="py-3 px-3 text-center text-xs text-slate-600">
                          {standing.averageScore}
                        </td>
                        <td className="py-3 px-3 text-center text-xs font-semibold">
                          <span className={standing.scoreDifferential >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-600'}>
                            {standing.scoreDifferential >= 0 ? `+${standing.scoreDifferential}` : standing.scoreDifferential}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {standing.qualificationStatus === 'qualified_next_round' ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-black text-xs rounded-full inline-flex items-center gap-1 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              <span>QUALIFIED NEXT ROUND</span>
                            </span>
                          ) : standing.qualificationStatus === 'eliminated' ? (
                            <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold text-xs rounded-full border border-rose-200">
                              ELIMINATED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
                              IN PROGRESS ({standing.matchesPlayed}/3)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Results Log Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>All Match Results, Times & Venues</span>
              <span className="text-xs font-normal text-slate-500">
                Click "Time & Venue" to update schedule, or "Record Score" to feed game results
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-6">Match / Round</th>
                    <th className="py-3 px-4">Affirmative (Team A)</th>
                    <th className="py-3 px-4">Negative (Team B)</th>
                    <th className="py-3 px-4">Venue & Time</th>
                    <th className="py-3 px-4">Result Decision</th>
                    <th className="py-3 px-4">Winner</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {fixtures.map(f => (
                    <tr key={f.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900">{f.roundName}</div>
                        <div className="text-xs text-slate-500">{f.county} • {f.matchDate}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className={`font-semibold ${f.winnerRole === 'teamA' ? 'text-emerald-700 font-bold' : 'text-slate-800'}`}>
                          {f.teamA.schoolName}
                        </div>
                        {f.teamA.score ? (
                          <div className="text-xs text-slate-500">{f.teamA.score} pts ({f.teamA.ballots} ballots)</div>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className={`font-semibold ${f.winnerRole === 'teamB' ? 'text-emerald-700 font-bold' : 'text-slate-800'}`}>
                          {f.teamB.schoolName}
                        </div>
                        {f.teamB.score ? (
                          <div className="text-xs text-slate-500">{f.teamB.score} pts ({f.teamB.ballots} ballots)</div>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 text-xs">{f.venue || 'TBD Venue'}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{f.matchTime || '09:30 AM GMT'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {f.status === 'completed' ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-bold text-xs">
                            {f.scoreDifferential || 'Decided'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                            Pending Match
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {f.winnerName ? (
                          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                            <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{f.winnerName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Undecided</span>
                        )}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenScheduleModal(f)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                            title="Admin: Set time and venue"
                          >
                            Time/Venue
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFixtureForScore(f);
                              setScoreTeamA(f.teamA.score || 282);
                              setScoreTeamB(f.teamB.score || 278);
                              setBallotsTeamA(f.teamA.ballots || 3);
                              setBallotsTeamB(f.teamB.ballots || 0);
                              setSelectedWinner(f.winnerRole || 'teamA');
                              setJudgeNotes(f.adjudicatorNotes || '');
                            }}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-xs"
                          >
                            {f.status === 'completed' ? 'Edit Score' : 'Record Score'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: 15-COUNTY NATIONAL CHAMPIONSHIP DRAW (WHEN ALL COUNTIES COME TOGETHER) */}
      {activeTab === 'national_championship' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-700/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wide">
                  <Award className="w-3.5 h-3.5" />
                  <span>Stage 3 Unification • 15 Counties Assemble</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  15-County National Championship Anti-Bias Bracket Engine
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
                  When all 15 counties conclude their preliminaries and county finals, each county sends one representing school to the National Championship. The system calculates seeds accurately based on real results and speaker data entered on the site, then runs a cryptographically randomized, anti-bias draw with randomized sides and neutral adjudication panels.
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={handleExecute15CountyNationalDraw}
                  disabled={isDrawing}
                  className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-black rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2.5 disabled:opacity-50"
                >
                  {isDrawing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Computing National Fixtures...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                      <span>Execute 15-County National Draw</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {drawSuccessToast && (
              <div className="mt-4 p-3.5 bg-indigo-900/60 border border-indigo-500/50 rounded-xl text-indigo-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{drawSuccessToast}</span>
              </div>
            )}
          </div>

          {/* 15 Counties Representation Board */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  15-County Championship Representatives Roster
                </h3>
                <p className="text-xs text-slate-500">
                  Ranking and seedings are determined automatically based on cumulative match scores, judge ballots, and preliminary ratings entered into the system.
                </p>
              </div>
              <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-200">
                15 of 15 Counties Represented
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4">County</th>
                    <th className="py-3 px-4">Representing School</th>
                    <th className="py-3 px-3">Qualification Status</th>
                    <th className="py-3 px-3 text-right">Speaker Pts Entered</th>
                    <th className="py-3 px-3 text-right">Ballot Record</th>
                    <th className="py-3 px-4 text-center">National Seed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {countyChampionsList.map((item, idx) => (
                    <tr key={item.county} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {item.county}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {item.school?.name || 'Accredited County Representative'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {item.school?.zoneName || 'Zonal Champion'}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {item.isCrowned ? (
                          <span className="px-2.5 py-1 bg-amber-100 text-amber-900 text-[11px] font-black rounded-full flex items-center gap-1 w-fit">
                            <Trophy className="w-3 h-3 text-amber-600" />
                            <span>Crowned County Champion</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Top Seed Qualifier</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {item.stats.totalScore > 0 ? `${item.stats.totalScore} pts` : '270 pts (est)'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {item.stats.matchesWon}W - {item.stats.ballotsWon} ballots
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono font-black text-xs rounded-md">
                          Seed #{idx + 1}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* National Championship Scheduled Fixtures */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-indigo-600" />
                <span>15-County National Championship Matchups</span>
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-900 text-xs font-bold rounded-full">
                  {fixtures.filter(f => f.stage === 'national_championship').length} Matches
                </span>
              </h3>
              <div className="text-xs text-slate-500">
                Randomized Sides (Coin-Flip) • Accredited Neutral Adjudicators
              </div>
            </div>

            {fixtures.filter(f => f.stage === 'national_championship').length === 0 ? (
              <div className="bg-white p-10 text-center rounded-xl border border-slate-200 text-slate-500 space-y-3">
                <Award className="w-8 h-8 text-indigo-400 mx-auto" />
                <div className="font-bold text-slate-800">No National Championship Matches Generated Yet</div>
                <p className="text-xs max-w-md mx-auto text-slate-500">
                  Review the 15 county champions above, then click <strong>"Execute 15-County National Draw"</strong> to have the system accurately pair them using site results.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {fixtures
                  .filter(f => f.stage === 'national_championship')
                  .map(fixture => (
                    <div 
                      key={fixture.id} 
                      className="bg-white rounded-xl border border-indigo-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4 hover:border-indigo-400 transition-all"
                    >
                      {/* Top Bar */}
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-900 font-black text-[11px] rounded-md">
                              National Championship
                            </span>
                            <span className="text-xs font-bold text-slate-700">
                              {fixture.roundName}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 pt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {fixture.matchDate} at {fixture.matchTime}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {fixture.venue}
                            </span>
                          </div>
                        </div>

                        <div>
                          {fixture.status === 'completed' ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-black text-xs rounded-full">
                              Decided
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full">
                              Official Draw Set
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Matchup Grid */}
                      <div className="grid grid-cols-5 gap-2 items-center bg-indigo-50/40 p-3.5 rounded-xl border border-indigo-100">
                        {/* Team A */}
                        <div className="col-span-2 text-left space-y-1">
                          <div className="text-[10px] font-black uppercase tracking-wider text-teal-700">
                            {fixture.teamA.role}
                          </div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                            {fixture.teamA.schoolName}
                          </div>
                          <div className="text-[11px] font-bold text-indigo-800">
                            {fixture.teamA.county} County
                          </div>
                          {fixture.status === 'completed' && fixture.teamA.score && (
                            <div className="text-xs font-bold text-slate-800">
                              {fixture.teamA.score} pts ({fixture.teamA.ballots} ballots)
                            </div>
                          )}
                        </div>

                        {/* VS */}
                        <div className="col-span-1 text-center">
                          <div className="w-7 h-7 mx-auto rounded-full bg-white border border-indigo-200 text-indigo-900 font-black text-[10px] flex items-center justify-center shadow-xs">
                            VS
                          </div>
                          <div className="text-[9px] font-mono text-slate-400 mt-1">Anti-Bias</div>
                        </div>

                        {/* Team B */}
                        <div className="col-span-2 text-right space-y-1">
                          <div className="text-[10px] font-black uppercase tracking-wider text-indigo-700">
                            {fixture.teamB.role}
                          </div>
                          <div className="font-bold text-slate-900 text-xs sm:text-sm leading-snug">
                            {fixture.teamB.schoolName}
                          </div>
                          <div className="text-[11px] font-bold text-indigo-800">
                            {fixture.teamB.county} County
                          </div>
                          {fixture.status === 'completed' && fixture.teamB.score && (
                            <div className="text-xs font-bold text-slate-800">
                              {fixture.teamB.score} pts ({fixture.teamB.ballots} ballots)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Motion / Theme */}
                      <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-slate-700">
                        <span className="font-bold text-slate-900">National Motion: </span>
                        <span className="italic">{fixture.motionTitle}</span>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-1 text-xs">
                        <span className="text-[10px] font-mono text-slate-400">
                          Hash: {fixture.antiBiasHash.split('-')[0]}-{fixture.antiBiasHash.split('-')[1]}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFixtureForScore(fixture);
                            setScoreTeamA(fixture.teamA.score || 285);
                            setScoreTeamB(fixture.teamB.score || 280);
                            setBallotsTeamA(fixture.teamA.ballots || 2);
                            setBallotsTeamB(fixture.teamB.ballots || 1);
                            setSelectedWinner(fixture.winnerRole || 'teamA');
                            setJudgeNotes(fixture.adjudicatorNotes || '');
                          }}
                          className="px-3 py-1 bg-indigo-50 hover:bg-indigo-600 hover:text-white font-bold rounded-lg text-indigo-800 text-xs transition-colors cursor-pointer"
                        >
                          {fixture.status === 'completed' ? 'Edit National Result' : 'Enter Championship Result'}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: HUMAN BIAS & CONFLICT AUDITOR */}
      {activeTab === 'bias_audit' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wide">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Fair Competition Compliance Scanner</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-2">
                  Tournament Anti-Bias & Adjudicator Conflict Auditor
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Continuously scans all active tournament fixtures, school zone assignments, judge rosters, and side distributions to verify impartial pairing and flag conflicts of interest.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-700">
                    {biasAuditResult.integrityScore}%
                  </div>
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Integrity Rating</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase">Total Fixtures Audited</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{biasAuditResult.totalFixturesAudited}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Across all 15 counties</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase">Adjudicator Conflict Flags</div>
                <div className={`text-2xl font-black mt-1 ${biasAuditResult.adjudicatorConflicts.length === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {biasAuditResult.adjudicatorConflicts.length}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Judges from competing school county</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase">Side Parity (Aff/Neg)</div>
                <div className="text-2xl font-black text-indigo-700 mt-1">
                  {biasAuditResult.sideImbalanceWarnings.length === 0 ? '100% Impartial' : `${biasAuditResult.sideImbalanceWarnings.length} Skewed`}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Seeded coin-flip allocation</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-500 uppercase">Duplicate Pairings</div>
                <div className="text-2xl font-black text-emerald-700 mt-1">{biasAuditResult.duplicateMatchups.length}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Rematches in same bracket</div>
              </div>
            </div>

            {/* Audit Summary Banner */}
            <div className={`p-4 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${
              biasAuditResult.passed 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950' 
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}>
              {biasAuditResult.passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold">Algorithmic Anti-Bias Certification Status:</div>
                <p className="text-xs leading-relaxed">{biasAuditResult.auditSummary}</p>
              </div>
            </div>

            {/* Audit Flags Breakdown */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-slate-900 text-sm">Detailed Fair Competition Audit Details:</h3>
              
              {biasAuditResult.adjudicatorConflicts.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-rose-800 uppercase">Conflict of Interest Adjudications:</div>
                  {biasAuditResult.adjudicatorConflicts.map((c, idx) => (
                    <div key={idx} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>{c.judgeName}</strong> ({c.judgeCounty} County) was assigned to match <strong>{c.matchName}</strong> involving home county school <strong>{c.schoolName}</strong>.
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {biasAuditResult.sideImbalanceWarnings.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-amber-800 uppercase">Side Allocation Discrepancies:</div>
                  {biasAuditResult.sideImbalanceWarnings.map((w, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>{w.schoolName}</strong> has been allocated {w.affirmativeCount} Affirmative vs {w.negativeCount} Negative sides.
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {biasAuditResult.duplicateMatchups.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-rose-800 uppercase">Duplicate Matchups:</div>
                  {biasAuditResult.duplicateMatchups.map((dup, idx) => (
                    <div key={idx} className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900">
                      {dup}
                    </div>
                  ))}
                </div>
              )}

              {biasAuditResult.passed && (
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Integrity Benchmarks 100% Satisfied</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                    <li><strong>No Adjudicator Conflicts:</strong> All panel judges are appointed strictly outside the counties of the competing schools.</li>
                    <li><strong>Impartial Side Allocation:</strong> Affirmative / Negative sides were determined through deterministic cryptographic hash seeds, removing human influence.</li>
                    <li><strong>No Repeat Matchups:</strong> Every pairing across preliminary zones, county finals, and national rounds is unique.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Cryptographic Proof Footer */}
            <div className="p-4 bg-slate-900 text-slate-300 rounded-xl text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verification Seed Token:</span>
                <span className="text-emerald-400 font-bold">{biasAuditResult.seedVerificationHash}</span>
              </div>
              <span className="text-[11px] text-slate-400">Liberia National Forensics League Anti-Bias Protocol V2.4</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: COACH & SCHOOL PUBLIC REVEAL DATE */}
      {activeTab === 'reveal_settings' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveAnnouncement} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-900 font-bold text-xs">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Coach & School Public Announcement Desk</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  Public Fixtures, Motions & Venue Reveal Announcement
                </h2>
                <p className="text-slate-500 text-xs sm:text-sm max-w-2xl">
                  Configure the official date, venue confirmation, and live broadcast broadcast notice for coaches, principals, debaters, and schools. When published, this displays prominently on the public Fixtures Hub and site homepage.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Reveal Active:</span>
                <input
                  type="checkbox"
                  checked={announcement.isRevealLive}
                  onChange={(e) => setAnnouncement({ ...announcement, isRevealLive: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Announcement Title:</label>
                <input
                  type="text"
                  value={announcement.title}
                  onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Official Reveal Date / Launch Time:</label>
                <input
                  type="text"
                  value={announcement.revealDate}
                  onChange={(e) => setAnnouncement({ ...announcement, revealDate: e.target.value })}
                  placeholder="e.g. 2025-09-25T10:00:00.000Z or September 25, 2025"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Grand Venue for Official Face-Offs:</label>
                <input
                  type="text"
                  value={announcement.grandVenue}
                  onChange={(e) => setAnnouncement({ ...announcement, grandVenue: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Broadcast Channel / Livestream:</label>
                <input
                  type="text"
                  value={announcement.broadcastChannel}
                  onChange={(e) => setAnnouncement({ ...announcement, broadcastChannel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Coaches & Principals Helpline:</label>
                <input
                  type="text"
                  value={announcement.coordinatorHelpline}
                  onChange={(e) => setAnnouncement({ ...announcement, coordinatorHelpline: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-mono text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase">Official Announcement Text:</label>
                <textarea
                  rows={4}
                  value={announcement.announcementText}
                  onChange={(e) => setAnnouncement({ ...announcement, announcementText: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Changes update the public coaches reveal hub instantly.
              </div>

              <button
                type="submit"
                disabled={isSavingAnnouncement}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSavingAnnouncement ? 'Saving Settings...' : 'Save & Publish Announcement'}</span>
              </button>
            </div>

            {announcementSavedToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Announcement settings successfully saved and updated on the public site!</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 7: AUTOMATED COACH FIXTURE NOTIFICATIONS */}
      {activeTab === 'coach_notifications' && (
        <CoachNotificationManager
          fixtures={fixtures}
          onUpdateFixture={handleUpdateFixture}
          applicationsList={applicationsList}
          userEmail={userEmail}
          initialSelectedCounty={selectedCounty}
        />
      )}

      {/* TAB 8: MOTION BANK (ADMIN BOX) */}
      {activeTab === 'motion_bank' && (
        <MotionBankManager adminEmail={userEmail} />
      )}

      {/* TAB 9: EDITION ARCHIVE & BACKUP CENTER */}
      {activeTab === 'edition_archive' && (
        <EditionArchiveBackupCenter
          adminEmail={userEmail}
          activeFixtures={fixtures}
          activeStandings={tournamentStandings}
          activeSchools={processedSchools}
          currentEditionYear={announcement.currentEdition || '2024/2025'}
          onRefreshLiveFixtures={() => {
            setFixtures([]);
          }}
        />
      )}

      {/* MODAL: Time & Venue Scheduling */}
      {selectedFixtureForSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Assign Match Schedule, Venue & Motion
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedFixtureForSchedule.teamA.schoolName} vs {selectedFixtureForSchedule.teamB.schoolName} • {selectedFixtureForSchedule.county}
                </p>
              </div>
              <button
                onClick={() => setSelectedFixtureForSchedule(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Match Date:</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Match Time Slot:</label>
                  <select
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
                  >
                    {OFFICIAL_TIME_SLOTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Debate Venue:</label>
                <select
                  value={scheduleVenue}
                  onChange={(e) => setScheduleVenue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
                >
                  {OFFICIAL_LIBERIAN_VENUES.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase">Assigned Motion:</label>
                  {motionBank.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const randomM = motionBank[Math.floor(Math.random() * motionBank.length)];
                        setScheduleMotion(randomM.text);
                      }}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Shuffle className="w-3 h-3" />
                      <span>Pick Random from Motion Bank</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={scheduleMotion}
                  onChange={(e) => setScheduleMotion(e.target.value)}
                  placeholder="Enter motion or choose from Motion Bank..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedFixtureForSchedule(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSchedule}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSavingSchedule ? 'Saving...' : 'Confirm Schedule & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record / Edit Match Result */}
      {selectedFixtureForScore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Record Official Match Result</h3>
                <p className="text-xs text-slate-500">{selectedFixtureForScore.roundName}</p>
              </div>
              <button
                onClick={() => setSelectedFixtureForScore(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMatchResult} className="space-y-4">
              {/* Teams & Scores */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                {/* Team A */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 text-xs">{selectedFixtureForScore.teamA.schoolName}</div>
                  <div className="text-[11px] text-teal-700 font-semibold">{selectedFixtureForScore.teamA.role}</div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Speaker Points:</label>
                    <input
                      type="number"
                      value={scoreTeamA}
                      onChange={(e) => setScoreTeamA(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Judges Ballots (out of 3):</label>
                    <input
                      type="number"
                      min={0}
                      max={3}
                      value={ballotsTeamA}
                      onChange={(e) => setBallotsTeamA(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Team B */}
                <div className="space-y-2">
                  <div className="font-bold text-slate-900 text-xs">{selectedFixtureForScore.teamB.schoolName}</div>
                  <div className="text-[11px] text-indigo-700 font-semibold">{selectedFixtureForScore.teamB.role}</div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Speaker Points:</label>
                    <input
                      type="number"
                      value={scoreTeamB}
                      onChange={(e) => setScoreTeamB(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Judges Ballots (out of 3):</label>
                    <input
                      type="number"
                      min={0}
                      max={3}
                      value={ballotsTeamB}
                      onChange={(e) => setBallotsTeamB(Number(e.target.value))}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-md text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Select Winner */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Official Match Winner:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedWinner('teamA')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer ${
                      selectedWinner === 'teamA' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    🏆 {selectedFixtureForScore.teamA.schoolName}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWinner('teamB')}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold text-left transition-all cursor-pointer ${
                      selectedWinner === 'teamB' 
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900' 
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    🏆 {selectedFixtureForScore.teamB.schoolName}
                  </button>
                </div>
              </div>

              {/* Decision Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Decision Margin:</label>
                <select
                  value={decisionType}
                  onChange={(e) => setDecisionType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="3-0 Unanimous Decision">3-0 Unanimous Decision</option>
                  <option value="2-1 Split Decision">2-1 Split Decision</option>
                  <option value="High Speaker Points Win">High Speaker Points Win</option>
                  <option value="STEM Rubric Verdict">STEM Rubric Innovation Verdict</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Chief Adjudicator Notes:</label>
                <textarea
                  rows={2}
                  placeholder="Summary of forensic justification or innovation metrics..."
                  value={judgeNotes}
                  onChange={(e) => setJudgeNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedFixtureForScore(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer"
                >
                  Confirm & Advance Winner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Register New School Manually */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Add School to County Geographic Zone</h3>
                <p className="text-xs text-slate-500">System will automatically assign geographic zone.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddManualSchool} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">School Name:</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. St. Patrick High School"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">County:</label>
                  <select
                    value={newSchoolCounty}
                    onChange={(e) => setNewSchoolCounty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    {LIBERIA_15_COUNTIES.filter(c => c !== 'All Counties').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Program Track:</label>
                  <select
                    value={newSchoolProgram}
                    onChange={(e) => setNewSchoolProgram(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="debate">Debate Championship</option>
                    <option value="stem">STEM Innovation Challenge</option>
                    <option value="dual">Dual (Debate + STEM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase">City or District:</label>
                <input
                  type="text"
                  placeholder="e.g. Sinkor 12th Street, Monrovia or Sanniquellie"
                  value={newSchoolDistrict}
                  onChange={(e) => setNewSchoolDistrict(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Coach Name:</label>
                  <input
                    type="text"
                    placeholder="Coach Name"
                    value={newSchoolContact}
                    onChange={(e) => setNewSchoolContact(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase">Coach Phone:</label>
                  <input
                    type="text"
                    placeholder="+231 ..."
                    value={newSchoolPhone}
                    onChange={(e) => setNewSchoolPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg shadow-md cursor-pointer"
                >
                  Save & Map Into Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
