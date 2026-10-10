import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  LndcStage, 
  TournamentFixture, 
  ZonedSchool,
  DebateMotion 
} from '../types/tournament';
import { 
  generateOfficialLndcFixtures,
  generateCentralStage16Teams,
  DEFAULT_LNDC_CONFIG,
  ALL_15_LIBERIAN_COUNTIES 
} from '../data/lndcTournamentRules';
import { drawRandomMotionFromBank } from './motionBankService';
import { 
  generateAntiBiasCryptographicHash,
  ACCREDITED_ADJUDICATORS 
} from '../data/tournamentZoningData';
import { OFFICIAL_TIME_SLOTS } from './tournamentProgressionEngine';

export interface TournamentStageProgressionState {
  currentStage: LndcStage; // 'county_prelims' | 'central_stage' | 'grand_final_third_place'
  stage1Locked: boolean;
  stage2Locked: boolean;
  stage3Locked: boolean;
  registrationDeadline: string; // e.g. "October 30, 2025"
  registrationDeadlineDate: string; // "2025-10-30"
  isRegistrationOpen: boolean;
  stage1CompletedAt?: string;
  stage2CompletedAt?: string;
  stage3CompletedAt?: string;
  countyChampions?: Record<string, { schoolId: string; schoolName: string; county: string }>;
  final4Teams?: {
    grandFinalTeamA: { schoolId: string; displayName: string; county: string };
    grandFinalTeamB: { schoolId: string; displayName: string; county: string };
    thirdPlaceTeamA: { schoolId: string; displayName: string; county: string };
    thirdPlaceTeamB: { schoolId: string; displayName: string; county: string };
  };
  lastUpdated?: string;
  updatedBy?: string;
}

export const DEFAULT_STAGE_PROGRESSION: TournamentStageProgressionState = {
  currentStage: 'county_prelims',
  stage1Locked: false, // Stage 1 is open only
  stage2Locked: true,  // Stage 2 locked until all county matches play
  stage3Locked: true,  // Stage 3 locked until Central Stage final 4 are decided
  registrationDeadline: 'October 30, 2025',
  registrationDeadlineDate: '2025-10-30',
  isRegistrationOpen: true
};

const STAGE_PROGRESSION_CACHE_KEY = 'yfc_tournament_stage_progression_cache';

/**
 * Checks whether a registration deadline string or ISO date has expired
 */
export function isDeadlineExpired(deadlineStr?: string, deadlineDateIso?: string): boolean {
  if (deadlineDateIso) {
    const deadline = new Date(`${deadlineDateIso}T23:59:59Z`);
    if (!isNaN(deadline.getTime())) {
      return Date.now() > deadline.getTime();
    }
  }

  if (deadlineStr) {
    const parsed = new Date(deadlineStr);
    if (!isNaN(parsed.getTime())) {
      return Date.now() > parsed.getTime();
    }
  }

  return false;
}

/**
 * Computes remaining days until registration deadline
 */
export function getDaysRemainingUntilDeadline(deadlineDateIso?: string, deadlineStr?: string): number | null {
  let targetDate: Date | null = null;

  if (deadlineDateIso) {
    const d = new Date(`${deadlineDateIso}T23:59:59`);
    if (!isNaN(d.getTime())) targetDate = d;
  }

  if (!targetDate && deadlineStr) {
    const d = new Date(deadlineStr);
    if (!isNaN(d.getTime())) targetDate = d;
  }

  if (!targetDate) return null;

  const diffMs = targetDate.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Subscribes to real-time tournament stage progression in Firestore
 */
export function subscribeToTournamentStage(
  callback: (state: TournamentStageProgressionState) => void
): () => void {
  // 1. Initial cached state
  try {
    const cached = localStorage.getItem(STAGE_PROGRESSION_CACHE_KEY);
    if (cached) {
      callback(JSON.parse(cached));
    } else {
      callback(DEFAULT_STAGE_PROGRESSION);
    }
  } catch (e) {
    callback(DEFAULT_STAGE_PROGRESSION);
  }

  // 2. Firestore listener
  try {
    const docRef = doc(db, 'tournamentSettings', 'stageProgression');
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as TournamentStageProgressionState;
        const merged: TournamentStageProgressionState = {
          ...DEFAULT_STAGE_PROGRESSION,
          ...data
        };
        try {
          localStorage.setItem(STAGE_PROGRESSION_CACHE_KEY, JSON.stringify(merged));
        } catch (e) {
          // ignore cache quota error
        }
        callback(merged);
      } else {
        // Document does not exist yet; initialize it
        setDoc(docRef, DEFAULT_STAGE_PROGRESSION).catch(err => {
          console.warn('Init stage progression doc note:', err);
        });
        callback(DEFAULT_STAGE_PROGRESSION);
      }
    }, (err) => {
      console.warn('Firestore stage progression subscription note:', err);
    });

    return () => unsubscribe();
  } catch (err) {
    console.warn('Firestore subscription failed:', err);
    return () => {};
  }
}

/**
 * Updates stage progression in Firestore
 */
export async function updateTournamentStageProgression(
  updates: Partial<TournamentStageProgressionState>,
  adminEmail?: string
): Promise<TournamentStageProgressionState> {
  const docRef = doc(db, 'tournamentSettings', 'stageProgression');
  let current = DEFAULT_STAGE_PROGRESSION;

  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      current = { ...DEFAULT_STAGE_PROGRESSION, ...(snap.data() as TournamentStageProgressionState) };
    }
  } catch (e) {
    console.warn('Get stage progression note:', e);
  }

  const newState: TournamentStageProgressionState = {
    ...current,
    ...updates,
    lastUpdated: new Date().toISOString(),
    ...(adminEmail && { updatedBy: adminEmail })
  };

  try {
    await setDoc(docRef, newState);
    localStorage.setItem(STAGE_PROGRESSION_CACHE_KEY, JSON.stringify(newState));
  } catch (err) {
    console.warn('Firestore save stage progression note:', err);
    localStorage.setItem(STAGE_PROGRESSION_CACHE_KEY, JSON.stringify(newState));
  }

  return newState;
}

/**
 * Stage 1 Completion Guard:
 * Before moving to Central Round (Stage 2), all schools must have played each other in the counties.
 */
export function checkStage1Status(fixtures: TournamentFixture[]) {
  const stage1Fixtures = fixtures.filter(f => 
    f.stage === 'county_prelims' || f.stage === 'zonal_prelims'
  );

  const totalMatches = stage1Fixtures.length;
  const completedMatches = stage1Fixtures.filter(f => f.status === 'completed').length;
  const pendingMatches = totalMatches - completedMatches;

  // Track pending by county
  const pendingCountiesSet = new Set<string>();
  const completedCountiesSet = new Set<string>();

  stage1Fixtures.forEach(f => {
    if (f.status !== 'completed') {
      pendingCountiesSet.add(f.county);
    } else {
      completedCountiesSet.add(f.county);
    }
  });

  // Calculate county winners from completed matches
  const countyWinsMap: Record<string, Record<string, { schoolId: string; schoolName: string; wins: number; score: number }>> = {};

  stage1Fixtures.forEach(fix => {
    if (fix.status === 'completed' && fix.winnerId) {
      const county = fix.county || fix.teamA.county || 'Montserrado';
      if (!countyWinsMap[county]) countyWinsMap[county] = {};

      const winnerId = fix.winnerId;
      const winnerName = fix.winnerName || (winnerId === fix.teamA.schoolId ? fix.teamA.schoolName : fix.teamB.schoolName);
      const winnerScore = winnerId === fix.teamA.schoolId ? (fix.teamA.score || 0) : (fix.teamB.score || 0);

      if (!countyWinsMap[county][winnerId]) {
        countyWinsMap[county][winnerId] = {
          schoolId: winnerId,
          schoolName: winnerName,
          wins: 0,
          score: 0
        };
      }
      countyWinsMap[county][winnerId].wins += 1;
      countyWinsMap[county][winnerId].score += winnerScore;
    }
  });

  const countyChampions: Record<string, { schoolId: string; schoolName: string; county: string }> = {};
  Object.keys(countyWinsMap).forEach(county => {
    const contenders = Object.values(countyWinsMap[county]);
    contenders.sort((a, b) => b.wins !== a.wins ? b.wins - a.wins : b.score - a.score);
    if (contenders.length > 0) {
      countyChampions[county] = {
        schoolId: contenders[0].schoolId,
        schoolName: contenders[0].schoolName,
        county
      };
    }
  });

  const isComplete = totalMatches > 0 && pendingMatches === 0;

  return {
    isComplete,
    totalMatches,
    completedMatches,
    pendingMatches,
    pendingCounties: Array.from(pendingCountiesSet),
    completedCounties: Array.from(completedCountiesSet),
    countyChampions
  };
}

/**
 * Stage 2 Completion Guard:
 * Central Stage 2 is knockout:
 * 16 teams (Round of 16) -> 8 drop -> 8 play Quarterfinals -> 4 drop -> 4 play Semifinals -> 2 to Grand Final, 2 to 3rd place.
 */
export function checkStage2Status(fixtures: TournamentFixture[]) {
  const stage2Fixtures = fixtures.filter(f => f.stage === 'central_stage');

  // Categorize by round
  const r16Fixtures = stage2Fixtures.filter(f => 
    f.roundName.toLowerCase().includes('round of 16') || f.roundName.toLowerCase().includes('r16') || f.roundName.toLowerCase().includes('super 16')
  );
  const qfFixtures = stage2Fixtures.filter(f => 
    f.roundName.toLowerCase().includes('quarterfinal') || f.roundName.toLowerCase().includes('elite 8')
  );
  const sfFixtures = stage2Fixtures.filter(f => 
    f.roundName.toLowerCase().includes('semifinal') || f.roundName.toLowerCase().includes('final 4')
  );

  const r16Complete = r16Fixtures.length === 8 && r16Fixtures.every(f => f.status === 'completed' && f.winnerId);
  const qfComplete = qfFixtures.length === 4 && qfFixtures.every(f => f.status === 'completed' && f.winnerId);
  const sfComplete = sfFixtures.length === 2 && sfFixtures.every(f => f.status === 'completed' && f.winnerId);

  // R16 Winners (8 teams)
  const r16Winners = r16Complete ? r16Fixtures.map(f => {
    const isTeamA = f.winnerId === f.teamA.schoolId;
    return {
      schoolId: f.winnerId!,
      displayName: f.winnerName || (isTeamA ? f.teamA.schoolName : f.teamB.schoolName),
      county: isTeamA ? f.teamA.county : f.teamB.county
    };
  }) : [];

  // QF Winners (4 teams)
  const qfWinners = qfComplete ? qfFixtures.map(f => {
    const isTeamA = f.winnerId === f.teamA.schoolId;
    return {
      schoolId: f.winnerId!,
      displayName: f.winnerName || (isTeamA ? f.teamA.schoolName : f.teamB.schoolName),
      county: isTeamA ? f.teamA.county : f.teamB.county
    };
  }) : [];

  // SF Winners (2 teams for Grand Final) and Losers (2 teams for 3rd place)
  const grandFinalists: Array<{ schoolId: string; displayName: string; county: string }> = [];
  const thirdPlaceContenders: Array<{ schoolId: string; displayName: string; county: string }> = [];

  if (sfComplete) {
    sfFixtures.forEach(f => {
      const isTeamA = f.winnerId === f.teamA.schoolId;
      const winner = {
        schoolId: f.winnerId!,
        displayName: f.winnerName || (isTeamA ? f.teamA.schoolName : f.teamB.schoolName),
        county: isTeamA ? f.teamA.county : f.teamB.county
      };
      const loser = {
        schoolId: isTeamA ? f.teamB.schoolId : f.teamA.schoolId,
        displayName: isTeamA ? f.teamB.schoolName : f.teamA.schoolName,
        county: isTeamA ? f.teamB.county : f.teamA.county
      };
      grandFinalists.push(winner);
      thirdPlaceContenders.push(loser);
    });
  }

  const isComplete = sfComplete && grandFinalists.length === 2 && thirdPlaceContenders.length === 2;

  return {
    isComplete,
    r16Complete,
    qfComplete,
    sfComplete,
    r16Fixtures,
    qfFixtures,
    sfFixtures,
    r16Winners,
    qfWinners,
    grandFinalists,
    thirdPlaceContenders,
    totalMatches: stage2Fixtures.length,
    completedMatches: stage2Fixtures.filter(f => f.status === 'completed').length,
    pendingMatches: stage2Fixtures.filter(f => f.status !== 'completed').length
  };
}

/**
 * Advances Stage 2 from Round of 16 to Quarterfinals (Elite 8).
 * 8 winners play against one another; the 8 losing teams automatically drop!
 */
export async function advanceCentralStageToQuarterfinals({
  fixtures,
  motionBank,
  adminScheduledDate,
  adminEmail
}: {
  fixtures: TournamentFixture[];
  motionBank: DebateMotion[];
  adminScheduledDate?: string;
  adminEmail?: string;
}): Promise<{
  success: boolean;
  message: string;
  newFixtures?: TournamentFixture[];
}> {
  const status = checkStage2Status(fixtures);

  if (!status.r16Complete || status.r16Winners.length < 8) {
    return {
      success: false,
      message: `Cannot advance to Quarterfinals: All 8 matches of the Central Round of 16 must be completed first! Currently ${status.r16Fixtures.filter(f => f.status !== 'completed').length} Round of 16 matches pending.`
    };
  }

  const dateStr = adminScheduledDate || new Date(Date.now() + (3 * 24 * 3600 * 1000)).toISOString().split('T')[0];
  const winners = status.r16Winners;
  const newQfFixtures: TournamentFixture[] = [];
  const usedMotions: string[] = [];

  // 4 Quarterfinal matches: 1v8, 2v7, 3v6, 4v5
  const pairings = [
    { a: winners[0], b: winners[7], matchNo: 1, time: '10:00 AM GMT' },
    { a: winners[1], b: winners[6], matchNo: 2, time: '12:30 PM GMT' },
    { a: winners[2], b: winners[5], matchNo: 3, time: '03:00 PM GMT' },
    { a: winners[3], b: winners[4], matchNo: 4, time: '05:30 PM GMT' }
  ];

  for (const pair of pairings) {
    const drawnMotion = drawRandomMotionFromBank(motionBank, 'Central Stage', usedMotions);
    usedMotions.push(drawnMotion.id);

    const neutralJudges = ACCREDITED_ADJUDICATORS.filter(
      adj => adj.countyOfOrigin.toLowerCase() !== pair.a.county.toLowerCase() &&
             adj.countyOfOrigin.toLowerCase() !== pair.b.county.toLowerCase()
    ).slice(0, 3);

    newQfFixtures.push({
      id: `lndc-s2-qf-${pair.matchNo}-${Date.now()}`,
      program: 'debate',
      stage: 'central_stage',
      roundName: `Stage 2: Central Stage • National Quarterfinals (Elite 8) • Match #${pair.matchNo}`,
      county: `${pair.a.county} vs ${pair.b.county}`,
      zoneName: 'Central Forensics Arena',
      matchNumber: pair.matchNo,
      teamA: {
        schoolId: pair.a.schoolId,
        schoolName: pair.a.displayName,
        county: pair.a.county,
        zoneName: 'Central Quarterfinalist',
        role: 'Affirmative (Proposition)'
      },
      teamB: {
        schoolId: pair.b.schoolId,
        schoolName: pair.b.displayName,
        county: pair.b.county,
        zoneName: 'Central Quarterfinalist',
        role: 'Negative (Opposition)'
      },
      motion: drawnMotion.motionText,
      motionInfoSlide: drawnMotion.infoSlide,
      motionDomain: drawnMotion.domain,
      venue: 'Centenary Forensics Hall / Central Tournament Stage',
      matchDate: dateStr,
      matchTime: pair.time,
      adjudicators: neutralJudges.length >= 3 ? neutralJudges : ACCREDITED_ADJUDICATORS.slice(0, 3),
      status: 'scheduled',
      antiBiasHash: generateAntiBiasCryptographicHash(`central-qf-${pair.matchNo}-${Date.now()}`),
      drawSeed: `stage2-qf-${pair.matchNo}-${Date.now()}`,
      isPublished: true,
      createdAt: new Date().toISOString()
    });
  }

  // Save Quarterfinals to Firestore
  for (const fix of newQfFixtures) {
    try {
      await setDoc(doc(db, 'tournamentFixtures', fix.id), fix);
    } catch (e) {
      console.warn('Error saving Quarterfinal fixture:', e);
    }
  }

  return {
    success: true,
    message: `Successfully advanced to Quarterfinals (Elite 8)! 8 winners advance and 8 teams have dropped. 4 Quarterfinal matches have been generated.`,
    newFixtures: newQfFixtures
  };
}

/**
 * Advances Stage 2 from Quarterfinals to Semifinals (Final 4).
 * 4 winners play against one another; the 4 losing teams automatically drop!
 */
export async function advanceCentralStageToSemifinals({
  fixtures,
  motionBank,
  adminScheduledDate,
  adminEmail
}: {
  fixtures: TournamentFixture[];
  motionBank: DebateMotion[];
  adminScheduledDate?: string;
  adminEmail?: string;
}): Promise<{
  success: boolean;
  message: string;
  newFixtures?: TournamentFixture[];
}> {
  const status = checkStage2Status(fixtures);

  if (!status.qfComplete || status.qfWinners.length < 4) {
    return {
      success: false,
      message: `Cannot advance to Semifinals: All 4 Quarterfinal matches must be completed first! Currently ${status.qfFixtures.filter(f => f.status !== 'completed').length} Quarterfinal matches pending.`
    };
  }

  const dateStr = adminScheduledDate || new Date(Date.now() + (4 * 24 * 3600 * 1000)).toISOString().split('T')[0];
  const winners = status.qfWinners;
  const newSfFixtures: TournamentFixture[] = [];
  const usedMotions: string[] = [];

  // 2 Semifinal matches: 1v4, 2v3
  const pairings = [
    { a: winners[0], b: winners[3], matchNo: 1, time: '11:00 AM GMT', title: 'National Semifinal 1 (Final 4)' },
    { a: winners[1], b: winners[2], matchNo: 2, time: '03:30 PM GMT', title: 'National Semifinal 2 (Final 4)' }
  ];

  for (const pair of pairings) {
    const drawnMotion = drawRandomMotionFromBank(motionBank, 'Central Stage', usedMotions);
    usedMotions.push(drawnMotion.id);

    const neutralJudges = ACCREDITED_ADJUDICATORS.filter(
      adj => adj.countyOfOrigin.toLowerCase() !== pair.a.county.toLowerCase() &&
             adj.countyOfOrigin.toLowerCase() !== pair.b.county.toLowerCase()
    ).slice(0, 3);

    newSfFixtures.push({
      id: `lndc-s2-sf-${pair.matchNo}-${Date.now()}`,
      program: 'debate',
      stage: 'central_stage',
      roundName: `Stage 2: Central Stage • ${pair.title} • Match #${pair.matchNo}`,
      county: `${pair.a.county} vs ${pair.b.county}`,
      zoneName: 'Central Forensics Arena',
      matchNumber: pair.matchNo,
      teamA: {
        schoolId: pair.a.schoolId,
        schoolName: pair.a.displayName,
        county: pair.a.county,
        zoneName: 'National Semifinalist',
        role: 'Affirmative (Proposition)'
      },
      teamB: {
        schoolId: pair.b.schoolId,
        schoolName: pair.b.displayName,
        county: pair.b.county,
        zoneName: 'National Semifinalist',
        role: 'Negative (Opposition)'
      },
      motion: drawnMotion.motionText,
      motionInfoSlide: drawnMotion.infoSlide,
      motionDomain: drawnMotion.domain,
      venue: 'Centenary Forensics Hall / Central Tournament Stage',
      matchDate: dateStr,
      matchTime: pair.time,
      adjudicators: neutralJudges.length >= 3 ? neutralJudges : ACCREDITED_ADJUDICATORS.slice(0, 3),
      status: 'scheduled',
      antiBiasHash: generateAntiBiasCryptographicHash(`central-sf-${pair.matchNo}-${Date.now()}`),
      drawSeed: `stage2-sf-${pair.matchNo}-${Date.now()}`,
      isPublished: true,
      createdAt: new Date().toISOString()
    });
  }

  // Save Semifinals to Firestore
  for (const fix of newSfFixtures) {
    try {
      await setDoc(doc(db, 'tournamentFixtures', fix.id), fix);
    } catch (e) {
      console.warn('Error saving Semifinal fixture:', e);
    }
  }

  return {
    success: true,
    message: `Successfully advanced to Semifinals (Final 4)! 4 winners advance and 4 teams have dropped. 2 National Semifinal matches have been generated.`,
    newFixtures: newSfFixtures
  };
}

/**
 * Transition Action: Advance from Stage 1 to Stage 2
 * - Locks Stage 1 (read-only previous results viewable)
 * - Sets currentStage = 'central_stage' (Stage 2 ongoing)
 * - Stage 3 remains locked
 * - Pairs the 16 teams County vs County
 */
export async function advanceTournamentToStage2({
  fixtures,
  motionBank,
  adminScheduledDate,
  adminEmail
}: {
  fixtures: TournamentFixture[];
  motionBank: DebateMotion[];
  adminScheduledDate?: string;
  adminEmail?: string;
}): Promise<{
  success: boolean;
  message: string;
  newFixtures?: TournamentFixture[];
}> {
  const stage1Check = checkStage1Status(fixtures);

  if (!stage1Check.isComplete) {
    return {
      success: false,
      message: `Cannot advance to Central Round (Stage 2): All schools must have played each other in their counties first! There are still ${stage1Check.pendingMatches} pending matches in: ${stage1Check.pendingCounties.join(', ')}.`
    };
  }

  // Generate the 16 Central Stage Teams:
  // 15 County Champions + Defending Champion
  const centralTeams = generateCentralStage16Teams();

  // Create County vs County pairings for Stage 2 (Round of 16)
  const roundOf16Pairings = [
    { a: centralTeams[0], b: centralTeams[15], matchNo: 1, time: '09:00 AM GMT' },
    { a: centralTeams[1], b: centralTeams[14], matchNo: 2, time: '10:30 AM GMT' },
    { a: centralTeams[2], b: centralTeams[13], matchNo: 3, time: '12:00 PM GMT' },
    { a: centralTeams[3], b: centralTeams[12], matchNo: 4, time: '01:30 PM GMT' },
    { a: centralTeams[4], b: centralTeams[11], matchNo: 5, time: '03:00 PM GMT' },
    { a: centralTeams[5], b: centralTeams[10], matchNo: 6, time: '04:30 PM GMT' },
    { a: centralTeams[6], b: centralTeams[9],  matchNo: 7, time: '06:00 PM GMT' },
    { a: centralTeams[7], b: centralTeams[8],  matchNo: 8, time: '07:30 PM GMT' }
  ];

  const matchDate = adminScheduledDate || new Date(Date.now() + (3 * 24 * 3600 * 1000)).toISOString().split('T')[0];
  const newStage2Fixtures: TournamentFixture[] = [];
  const usedMotions: string[] = [];

  for (const pair of roundOf16Pairings) {
    const drawnMotion = drawRandomMotionFromBank(motionBank, 'Central Stage', usedMotions);
    usedMotions.push(drawnMotion.id);

    const neutralJudges = ACCREDITED_ADJUDICATORS.filter(
      adj => adj.countyOfOrigin.toLowerCase() !== pair.a.county.toLowerCase() &&
             adj.countyOfOrigin.toLowerCase() !== pair.b.county.toLowerCase()
    ).slice(0, 3);

    newStage2Fixtures.push({
      id: `lndc-s2-r16-${pair.matchNo}-${Date.now()}`,
      program: 'debate',
      stage: 'central_stage',
      roundName: `Stage 2: Central Stage • County vs County Round of 16 • Match #${pair.matchNo}`,
      county: `${pair.a.county} vs ${pair.b.county}`,
      zoneName: 'Central National Forensics Arena',
      matchNumber: pair.matchNo,
      teamA: {
        schoolId: pair.a.schoolId,
        schoolName: pair.a.displayName, // County Name representation
        county: pair.a.county,
        zoneName: pair.a.isDefendingChampion ? 'Defending Champion Bye' : `${pair.a.county} County Champion`,
        role: 'Affirmative (Proposition)'
      },
      teamB: {
        schoolId: pair.b.schoolId,
        schoolName: pair.b.displayName, // County Name representation
        county: pair.b.county,
        zoneName: pair.b.isDefendingChampion ? 'Defending Champion Bye' : `${pair.b.county} County Champion`,
        role: 'Negative (Opposition)'
      },
      motion: drawnMotion.motionText,
      motionInfoSlide: drawnMotion.infoSlide,
      motionDomain: drawnMotion.domain,
      venue: 'Centenary Forensics Hall / Central Tournament Stage',
      matchDate: matchDate,
      matchTime: pair.time,
      adjudicators: neutralJudges.length >= 3 ? neutralJudges : ACCREDITED_ADJUDICATORS.slice(0, 3),
      status: 'scheduled',
      antiBiasHash: generateAntiBiasCryptographicHash(`central-r16-${pair.matchNo}-${Date.now()}`),
      drawSeed: `stage2-central-${Date.now()}`,
      isPublished: true,
      createdAt: new Date().toISOString()
    });
  }

  // Save new Stage 2 fixtures to Firestore
  for (const fix of newStage2Fixtures) {
    try {
      await setDoc(doc(db, 'tournamentFixtures', fix.id), fix);
    } catch (e) {
      console.warn('Error saving Stage 2 fixture:', e);
    }
  }

  // Update Progression State: Stage 1 locked, Stage 2 active, Stage 3 locked
  await updateTournamentStageProgression({
    currentStage: 'central_stage',
    stage1Locked: true,
    stage2Locked: false,
    stage3Locked: true,
    stage1CompletedAt: new Date().toISOString(),
    countyChampions: stage1Check.countyChampions
  }, adminEmail);

  return {
    success: true,
    message: `Successfully advanced to Stage 2: Central Stage (County vs County)! Stage 1 is now locked (previous results viewable), and 8 County vs County matchups have been generated with neutral motions.`,
    newFixtures: newStage2Fixtures
  };
}

/**
 * Transition Action: Advance from Stage 2 to Stage 3
 * - Finalizes the 4 teams from Central Stage 2
 * - Locks Stage 2 (previous results viewable)
 * - Stage 1 remains locked (previous results viewable)
 * - Unlocks Stage 3 (Grand Final & Third Place)
 */
export async function advanceTournamentToStage3({
  fixtures,
  motionBank,
  adminScheduledDate,
  adminEmail
}: {
  fixtures: TournamentFixture[];
  motionBank: DebateMotion[];
  adminScheduledDate?: string;
  adminEmail?: string;
}): Promise<{
  success: boolean;
  message: string;
  newFixtures?: TournamentFixture[];
}> {
  const stage2Check = checkStage2Status(fixtures);

  if (!stage2Check.isComplete || stage2Check.grandFinalists.length < 2 || stage2Check.thirdPlaceContenders.length < 2) {
    return {
      success: false,
      message: `Cannot advance to Stage 3 yet: National Semifinals must be completed first to produce the 2 Grand Finalists and the 2 Third-Place contenders!`
    };
  }

  const [team1, team2] = stage2Check.grandFinalists;
  const [team3, team4] = stage2Check.thirdPlaceContenders;
  const matchDate = adminScheduledDate || new Date(Date.now() + (5 * 24 * 3600 * 1000)).toISOString().split('T')[0];

  const motion1 = drawRandomMotionFromBank(motionBank, 'Grand Final', []);
  const motion2 = drawRandomMotionFromBank(motionBank, 'Third Place Match', [motion1.id]);

  // Match 1: 3rd Place Match on the Camp
  const thirdPlaceFix: TournamentFixture = {
    id: `lndc-s3-third-place-${Date.now()}`,
    program: 'debate',
    stage: 'grand_final_third_place',
    roundName: 'Stage 3: National Third-Place Playoff • Bronze Medal Clash (Played on the Camp)',
    county: `${team3.county} vs ${team4.county}`,
    zoneName: 'Central Debate Camp Arena, Careysburg',
    matchNumber: 1,
    teamA: {
      schoolId: team3.schoolId,
      schoolName: team3.displayName,
      county: team3.county,
      zoneName: 'Central Semifinal Contender 1',
      role: 'Affirmative (Proposition)'
    },
    teamB: {
      schoolId: team4.schoolId,
      schoolName: team4.displayName,
      county: team4.county,
      zoneName: 'Central Semifinal Contender 2',
      role: 'Negative (Opposition)'
    },
    motion: motion2.motionText,
    motionInfoSlide: 'TRADITIONAL CAMP STAGING: The Third-Place encounter is proudly contested directly on the Central Forensics Camp grounds before the entire national cohort.',
    motionDomain: motion2.domain,
    venue: DEFAULT_LNDC_CONFIG.thirdPlaceVenue,
    matchDate: matchDate,
    matchTime: '02:00 PM GMT',
    adjudicators: ACCREDITED_ADJUDICATORS.slice(0, 3),
    status: 'scheduled',
    antiBiasHash: generateAntiBiasCryptographicHash(`stage3-third-place-${Date.now()}`),
    drawSeed: `stage3-third-place-${Date.now()}`,
    isPublished: true,
    createdAt: new Date().toISOString()
  };

  // Match 2: Grand Final at Official Grand Venue
  const grandFinalFix: TournamentFixture = {
    id: `lndc-s3-grand-final-${Date.now()}`,
    program: 'debate',
    stage: 'grand_final_third_place',
    roundName: 'Stage 3: National Championship Grand Final • Title Decider (Official Grand Venue)',
    county: `${team1.county} vs ${team2.county}`,
    zoneName: 'National Grand Final Arena',
    matchNumber: 2,
    teamA: {
      schoolId: team1.schoolId,
      schoolName: team1.displayName,
      county: team1.county,
      zoneName: 'National Grand Finalist 1',
      role: 'Affirmative (Proposition)'
    },
    teamB: {
      schoolId: team2.schoolId,
      schoolName: team2.displayName,
      county: team2.county,
      zoneName: 'National Grand Finalist 2',
      role: 'Negative (Opposition)'
    },
    motion: motion1.motionText,
    motionInfoSlide: 'OFFICIAL GRAND VENUE SHOWCASE: The Grand Final is contested at the E.J.S. Ministerial Complex Auditorium in front of national dignitaries, corporate sponsors, and media.',
    motionDomain: motion1.domain,
    venue: DEFAULT_LNDC_CONFIG.grandFinalVenue,
    matchDate: matchDate,
    matchTime: '04:30 PM GMT (Prime Session)',
    adjudicators: ACCREDITED_ADJUDICATORS.slice(0, 3),
    status: 'scheduled',
    antiBiasHash: generateAntiBiasCryptographicHash(`stage3-grand-final-${Date.now()}`),
    drawSeed: `stage3-grand-final-${Date.now()}`,
    isPublished: true,
    createdAt: new Date().toISOString()
  };

  const newStage3Fixtures = [thirdPlaceFix, grandFinalFix];

  for (const fix of newStage3Fixtures) {
    try {
      await setDoc(doc(db, 'tournamentFixtures', fix.id), fix);
    } catch (e) {
      console.warn('Error saving Stage 3 fixture:', e);
    }
  }

  // Update Progression State: Stage 1 locked, Stage 2 locked, Stage 3 open!
  await updateTournamentStageProgression({
    currentStage: 'grand_final_third_place',
    stage1Locked: true,
    stage2Locked: true,
    stage3Locked: false,
    stage2CompletedAt: new Date().toISOString(),
    final4Teams: {
      grandFinalTeamA: team1,
      grandFinalTeamB: team2,
      thirdPlaceTeamA: team3,
      thirdPlaceTeamB: team4
    }
  }, adminEmail);

  return {
    success: true,
    message: `Successfully finalized Central Stage 2 and unlocked Stage 3! The 4 teams have been paired: Third Place Match on the Camp, and the Championship Grand Final at the Official Grand Venue.`,
    newFixtures: newStage3Fixtures
  };
}
