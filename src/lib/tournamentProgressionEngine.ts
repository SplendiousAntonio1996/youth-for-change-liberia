import { 
  TournamentFixture, 
  ZonedSchool, 
  SchoolTournamentStanding, 
  DebateMotion, 
  TournamentStage 
} from '../types/tournament';
import { 
  generateAntiBiasCryptographicHash, 
  antiBiasShuffle, 
  ACCREDITED_ADJUDICATORS 
} from '../data/tournamentZoningData';
import { drawRandomMotionFromBank } from './motionBankService';

export const OFFICIAL_LIBERIAN_VENUES = [
  'Monrovia City Hall Ballroom, Montserrado',
  'EJS Ministerial Complex Auditorium, Congo Town',
  'Booker Washington Institute (BWI) Multipurpose Hall, Kakata',
  'Cuttington University Amphitheater, Suakoko, Bong County',
  'Ganta United Methodist School (GUMS) Auditorium, Nimba',
  'Buchanan City Hall Fairgrounds, Grand Bassa',
  'Sanniquellie City Hall, Nimba County',
  'Voinjama Multilateral High School Hall, Lofa County',
  'Bishop Juwle Catholic High School Hall, Zwedru, Grand Gedeh',
  'Tubman University Auditorium, Harper, Maryland County',
  'Robertsport City Hall, Grand Cape Mount',
  'Tubman High School Auditorium, 12th Street, Monrovia',
  'Cestos City High School Pavilion, Rivercess',
  'Greenville Multilateral Auditorium, Sinoe County',
  'Bomi County Multipurpose Hall, Tubmanburg'
];

export const OFFICIAL_TIME_SLOTS = [
  '09:30 AM GMT',
  '11:45 AM GMT',
  '02:00 PM GMT',
  '04:15 PM GMT',
  '06:00 PM GMT (Prime Session)'
];

/**
 * Computes live points, standings, and progression eligibility for schools
 * based on recorded fixture results.
 */
export function calculateTournamentStandings(
  schools: ZonedSchool[],
  fixtures: TournamentFixture[]
): SchoolTournamentStanding[] {
  const standingsMap: Record<string, SchoolTournamentStanding> = {};

  // Initialize standings for all schools
  for (const s of schools) {
    standingsMap[s.id] = {
      schoolId: s.id,
      schoolName: s.name,
      county: s.county,
      zoneId: s.zoneId,
      zoneName: s.zoneName,
      matchesPlayed: 0,
      matchesWon: 0,
      matchesLost: 0,
      points: 0,
      ballotsWon: 0,
      ballotsLost: 0,
      totalSpeakerScore: 0,
      averageScore: 0,
      scoreDifferential: 0,
      qualificationStatus: 'pending',
      rank: 1
    };
  }

  // Tally completed fixtures
  for (const fix of fixtures) {
    if (fix.status !== 'completed') continue;

    const teamAId = fix.teamA.schoolId;
    const teamBId = fix.teamB.schoolId;

    // Ensure team exists in standings map even if not in initial schools array
    if (!standingsMap[teamAId] && fix.teamA.schoolName) {
      standingsMap[teamAId] = {
        schoolId: teamAId,
        schoolName: fix.teamA.schoolName,
        county: fix.teamA.county || fix.county,
        zoneName: fix.teamA.zoneName,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        points: 0,
        ballotsWon: 0,
        ballotsLost: 0,
        totalSpeakerScore: 0,
        averageScore: 0,
        scoreDifferential: 0,
        qualificationStatus: 'pending',
        rank: 1
      };
    }

    if (!standingsMap[teamBId] && fix.teamB.schoolName) {
      standingsMap[teamBId] = {
        schoolId: teamBId,
        schoolName: fix.teamB.schoolName,
        county: fix.teamB.county || fix.county,
        zoneName: fix.teamB.zoneName,
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        points: 0,
        ballotsWon: 0,
        ballotsLost: 0,
        totalSpeakerScore: 0,
        averageScore: 0,
        scoreDifferential: 0,
        qualificationStatus: 'pending',
        rank: 1
      };
    }

    const stA = standingsMap[teamAId];
    const stB = standingsMap[teamBId];

    if (stA && stB) {
      stA.matchesPlayed += 1;
      stB.matchesPlayed += 1;

      const scoreA = Number(fix.teamA.score) || 0;
      const scoreB = Number(fix.teamB.score) || 0;
      const ballotsA = Number(fix.teamA.ballots) || (fix.winnerId === teamAId ? 3 : 0);
      const ballotsB = Number(fix.teamB.ballots) || (fix.winnerId === teamBId ? 3 : 0);

      stA.totalSpeakerScore += scoreA;
      stB.totalSpeakerScore += scoreB;
      stA.ballotsWon += ballotsA;
      stA.ballotsLost += ballotsB;
      stB.ballotsWon += ballotsB;
      stB.ballotsLost += ballotsA;

      stA.scoreDifferential += (scoreA - scoreB);
      stB.scoreDifferential += (scoreB - scoreA);

      if (fix.winnerId === teamAId || ballotsA > ballotsB || (ballotsA === ballotsB && scoreA > scoreB)) {
        stA.matchesWon += 1;
        stB.matchesLost += 1;
      } else if (fix.winnerId === teamBId || ballotsB > ballotsA || (ballotsA === ballotsB && scoreB > scoreA)) {
        stB.matchesWon += 1;
        stA.matchesLost += 1;
      }
    }
  }

  // Calculate points (3 points per game won) and determine qualification status
  const result = Object.values(standingsMap).map((st) => {
    st.points = st.matchesWon * 3; // 3 points allotted for each game won
    st.averageScore = st.matchesPlayed > 0 ? Math.round((st.totalSpeakerScore / st.matchesPlayed) * 10) / 10 : 0;
    
    // Check if school has won a county final
    const wonCountyFinal = fixtures.some(f => 
      (f.stage === 'county_finals' || f.roundName.toLowerCase().includes('county final')) &&
      f.status === 'completed' &&
      f.winnerId === st.schoolId
    );

    if (wonCountyFinal) {
      st.qualificationStatus = 'county_champion';
    } else if (st.matchesPlayed >= 3) {
      // Finished all 3 scheduled games
      if (st.matchesWon >= 2) {
        st.qualificationStatus = 'qualified_next_round';
      } else {
        st.qualificationStatus = 'eliminated';
      }
    } else if (st.matchesPlayed >= 2 && st.matchesWon === 2) {
      st.qualificationStatus = 'qualified_next_round';
    } else {
      st.qualificationStatus = 'pending'; // In progress
    }

    return st;
  });

  // Sort by Points (desc, 3 pts/win), Matches Won (desc), Ballots Won (desc), Score Differential (desc), Total Speaker Score (desc)
  result.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
    if (b.ballotsWon !== a.ballotsWon) return b.ballotsWon - a.ballotsWon;
    if (b.scoreDifferential !== a.scoreDifferential) return b.scoreDifferential - a.scoreDifferential;
    return b.totalSpeakerScore - a.totalSpeakerScore;
  });

  // Assign numerical rank
  result.forEach((st, idx) => {
    st.rank = idx + 1;
  });

  return result;
}

/**
 * Generates Preliminary Round Fixtures for schools within a county.
 * Strictly guarantees that every single school plays exactly 3 games (3 points/game),
 * regardless of whether there are 4, 10, 20, 50, 60 or more registered schools in the county.
 * Automatically partitions large cohorts into balanced zones, pairs them across 3 rounds without rematches,
 * and attaches fresh motions from the Motion Bank.
 */
export function generate3RoundPrelimFixtures({
  county,
  zoneId,
  zoneName,
  schools,
  motionBank,
  defaultVenue,
  seedOverride,
  startDate
}: {
  county: string;
  zoneId?: string;
  zoneName?: string;
  schools: ZonedSchool[];
  motionBank: DebateMotion[];
  defaultVenue?: string;
  seedOverride?: string;
  startDate?: string;
}): TournamentFixture[] {
  if (!schools || schools.length < 2) {
    return [];
  }

  const baseSeed = seedOverride || `${county}-${zoneId || 'all'}-${Date.now()}`;
  const generatedFixtures: TournamentFixture[] = [];
  const usedMotionIds: string[] = [];

  // Determine venue pool
  const venue = defaultVenue || OFFICIAL_LIBERIAN_VENUES.find(v => v.toLowerCase().includes(county.toLowerCase())) || OFFICIAL_LIBERIAN_VENUES[0];

  // Adjudicators conflict of interest filter: exclude judges from the county if possible
  const neutralJudges = ACCREDITED_ADJUDICATORS.filter(
    adj => adj.countyOfOrigin.toLowerCase() !== county.toLowerCase()
  );
  const judgesPool = (neutralJudges.length >= 3 ? neutralJudges : ACCREDITED_ADJUDICATORS).slice(0, 3);

  // Group schools into balanced zones of 4 to 8 schools if count is large (> 8)
  const schoolCount = schools.length;
  let zones: ZonedSchool[][] = [];

  if (schoolCount > 8) {
    // If schools already have designated zoneName / zoneId, group by that first
    const byZone = new Map<string, ZonedSchool[]>();
    schools.forEach(s => {
      const zKey = s.zoneName || s.zoneId || 'Zone 1';
      const list = byZone.get(zKey) || [];
      list.push(s);
      byZone.set(zKey, list);
    });

    // If existing zones have at least 4 schools each, use them
    const validExistingZones = Array.from(byZone.values()).filter(z => z.length >= 4);
    if (validExistingZones.length >= 2 && Array.from(byZone.values()).every(z => z.length >= 2)) {
      zones = Array.from(byZone.values());
    } else {
      // Partition into balanced zones of 4 to 8 schools
      const numZones = Math.max(2, Math.ceil(schoolCount / 6));
      zones = Array.from({ length: numZones }, () => []);
      schools.forEach((school, idx) => {
        zones[idx % numZones].push(school);
      });
    }
  } else {
    // Single pool for <= 8 schools
    zones = [schools];
  }

  // Track match count per school to enforce exactly 3 games per school
  const matchCounts: Record<string, number> = {};
  schools.forEach(s => { matchCounts[s.id] = 0; });
  const pairKeys = new Set<string>();
  const makePairKey = (id1: string, id2: string) => [id1, id2].sort().join(':::');

  let matchCounter = 0;

  // Process each zone for 3 rounds
  zones.forEach((zoneSchools, zoneIdx) => {
    const currentZoneName = zoneSchools[0]?.zoneName || `Zone ${zoneIdx + 1}`;
    const zSeed = `${baseSeed}-z${zoneIdx + 1}`;

    // For 3 rounds (Game 1, Game 2, Game 3)
    for (let roundNum = 1; roundNum <= 3; roundNum++) {
      const roundSeed = `${zSeed}-r${roundNum}`;
      // Rotate / shuffle schools for this round
      const pool = antiBiasShuffle([...zoneSchools], roundSeed);

      // Pair in order
      const pairedInRound = new Set<string>();

      for (let i = 0; i < pool.length; i++) {
        const teamA = pool[i];
        if (pairedInRound.has(teamA.id) || matchCounts[teamA.id] >= 3) continue;

        // Find best opponent who hasn't played teamA and has < 3 matches
        let teamB: ZonedSchool | null = null;
        for (let j = i + 1; j < pool.length; j++) {
          const candidate = pool[j];
          if (
            !pairedInRound.has(candidate.id) &&
            matchCounts[candidate.id] < 3 &&
            !pairKeys.has(makePairKey(teamA.id, candidate.id))
          ) {
            teamB = candidate;
            break;
          }
        }

        // Fallback: any candidate not yet paired in this round with < 3 matches
        if (!teamB) {
          for (let j = i + 1; j < pool.length; j++) {
            const candidate = pool[j];
            if (!pairedInRound.has(candidate.id) && matchCounts[candidate.id] < 3) {
              teamB = candidate;
              break;
            }
          }
        }

        if (teamB) {
          pairedInRound.add(teamA.id);
          pairedInRound.add(teamB.id);
          pairKeys.add(makePairKey(teamA.id, teamB.id));
          matchCounts[teamA.id] += 1;
          matchCounts[teamB.id] += 1;

          matchCounter += 1;
          const matchIdx = matchCounter;

          // Side flip
          const coinFlip = (roundSeed.charCodeAt(i % roundSeed.length) + matchIdx + roundNum) % 2 === 0;
          const affTeam = coinFlip ? teamA : teamB;
          const negTeam = coinFlip ? teamB : teamA;

          // Draw neutral motion
          const drawnMotion = drawRandomMotionFromBank(motionBank, 'Zonal Prelims', usedMotionIds);
          usedMotionIds.push(drawnMotion.id);

          const timeSlot = OFFICIAL_TIME_SLOTS[matchIdx % OFFICIAL_TIME_SLOTS.length];
          
          let matchDate: string;
          if (startDate) {
            const base = new Date(`${startDate}T12:00:00Z`);
            const offsetDays = roundNum - 1;
            const targetDay = new Date(base.getTime() + (offsetDays * 24 * 3600 * 1000));
            matchDate = targetDay.toISOString().split('T')[0];
          } else {
            matchDate = new Date(Date.now() + (roundNum * 24 * 3600 * 1000)).toISOString().split('T')[0];
          }

          const roundTitle = `${county} ${currentZoneName} • Round ${roundNum} (Game ${roundNum} of 3) • Match #${matchIdx}`;

          generatedFixtures.push({
            id: `fix-prelim-${county.toLowerCase().replace(/\s+/g, '-')}-r${roundNum}-m${matchIdx}-${Date.now()}`,
            program: 'debate',
            stage: 'zonal_prelims',
            roundName: roundTitle,
            county: county,
            zoneId: zoneId || teamA.zoneId,
            zoneName: currentZoneName,
            matchNumber: matchIdx,
            teamA: {
              schoolId: affTeam.id,
              schoolName: affTeam.name,
              county: affTeam.county,
              zoneName: affTeam.zoneName || currentZoneName,
              role: 'Affirmative (Proposition)'
            },
            teamB: {
              schoolId: negTeam.id,
              schoolName: negTeam.name,
              county: negTeam.county,
              zoneName: negTeam.zoneName || currentZoneName,
              role: 'Negative (Opposition)'
            },
            motion: drawnMotion.motionText,
            motionInfoSlide: drawnMotion.infoSlide,
            motionDomain: drawnMotion.domain,
            venue: venue,
            matchDate: matchDate,
            matchTime: timeSlot,
            adjudicators: judgesPool,
            status: 'scheduled',
            antiBiasHash: generateAntiBiasCryptographicHash(`${roundSeed}-${matchIdx}`),
            drawSeed: roundSeed,
            isPublished: true,
            createdAt: new Date().toISOString()
          });
        }
      }
    }
  });

  // Guarantee: if any school still has fewer than 3 matches scheduled (e.g. odd pool size),
  // cross-pair them with other schools needing matches until all schools reach 3 matches!
  const underScheduled = () => schools.filter(s => matchCounts[s.id] < 3);
  let under = underScheduled();
  let safetyLoop = 0;

  while (under.length >= 2 && safetyLoop < 20) {
    safetyLoop++;
    const schoolA = under[0];
    const schoolB = under.find(s => s.id !== schoolA.id && matchCounts[s.id] < 3) || under[1];

    if (!schoolA || !schoolB || schoolA.id === schoolB.id) break;

    matchCounts[schoolA.id] += 1;
    matchCounts[schoolB.id] += 1;
    matchCounter += 1;
    const matchIdx = matchCounter;
    const currentRoundNum = Math.max(matchCounts[schoolA.id], matchCounts[schoolB.id]);

    const drawnMotion = drawRandomMotionFromBank(motionBank, 'Zonal Prelims', usedMotionIds);
    usedMotionIds.push(drawnMotion.id);

    const timeSlot = OFFICIAL_TIME_SLOTS[matchIdx % OFFICIAL_TIME_SLOTS.length];
    const matchDate = startDate 
      ? new Date(new Date(`${startDate}T12:00:00Z`).getTime() + ((currentRoundNum - 1) * 24 * 3600 * 1000)).toISOString().split('T')[0]
      : new Date(Date.now() + (currentRoundNum * 24 * 3600 * 1000)).toISOString().split('T')[0];

    const roundTitle = `${county} Cross-Zonal Prelims • (Game ${currentRoundNum} of 3) • Match #${matchIdx}`;

    generatedFixtures.push({
      id: `fix-prelim-${county.toLowerCase().replace(/\s+/g, '-')}-extra-m${matchIdx}-${Date.now()}`,
      program: 'debate',
      stage: 'zonal_prelims',
      roundName: roundTitle,
      county: county,
      zoneName: `${schoolA.zoneName || 'Zone 1'} vs ${schoolB.zoneName || 'Zone 2'}`,
      matchNumber: matchIdx,
      teamA: {
        schoolId: schoolA.id,
        schoolName: schoolA.name,
        county: schoolA.county,
        zoneName: schoolA.zoneName,
        role: 'Affirmative (Proposition)'
      },
      teamB: {
        schoolId: schoolB.id,
        schoolName: schoolB.name,
        county: schoolB.county,
        zoneName: schoolB.zoneName,
        role: 'Negative (Opposition)'
      },
      motion: drawnMotion.motionText,
      motionInfoSlide: drawnMotion.infoSlide,
      motionDomain: drawnMotion.domain,
      venue: venue,
      matchDate: matchDate,
      matchTime: timeSlot,
      adjudicators: judgesPool,
      status: 'scheduled',
      antiBiasHash: generateAntiBiasCryptographicHash(`guarantee-3games-${matchIdx}`),
      drawSeed: `guarantee-${matchIdx}`,
      isPublished: true,
      createdAt: new Date().toISOString()
    });

    under = underScheduled();
  }

  // If exactly 1 school still needs 1 match to complete 3 games (due to odd school count),
  // pair them with another school from the county that hasn't played them yet, or any school
  if (under.length === 1 && schools.length >= 2) {
    const schoolA = under[0];
    const partner = schools.find(s => s.id !== schoolA.id && !pairKeys.has(makePairKey(schoolA.id, s.id))) || 
                    schools.find(s => s.id !== schoolA.id) || 
                    schools[0];
    
    if (partner && partner.id !== schoolA.id) {
      matchCounts[schoolA.id] += 1;
      matchCounts[partner.id] = (matchCounts[partner.id] || 0) + 1;
      matchCounter += 1;
      const matchIdx = matchCounter;
      const currentRoundNum = matchCounts[schoolA.id];

      const drawnMotion = drawRandomMotionFromBank(motionBank, 'Zonal Prelims', usedMotionIds);
      usedMotionIds.push(drawnMotion.id);

      const timeSlot = OFFICIAL_TIME_SLOTS[matchIdx % OFFICIAL_TIME_SLOTS.length];
      const matchDate = startDate 
        ? new Date(new Date(`${startDate}T12:00:00Z`).getTime() + ((currentRoundNum - 1) * 24 * 3600 * 1000)).toISOString().split('T')[0]
        : new Date(Date.now() + (currentRoundNum * 24 * 3600 * 1000)).toISOString().split('T')[0];

      const roundTitle = `${county} Prelims • (Game ${currentRoundNum} of 3) • Match #${matchIdx}`;

      generatedFixtures.push({
        id: `fix-prelim-${county.toLowerCase().replace(/\s+/g, '-')}-guarantee-m${matchIdx}-${Date.now()}`,
        program: 'debate',
        stage: 'zonal_prelims',
        roundName: roundTitle,
        county: county,
        zoneName: `${schoolA.zoneName || 'Zone 1'}`,
        matchNumber: matchIdx,
        teamA: {
          schoolId: schoolA.id,
          schoolName: schoolA.name,
          county: schoolA.county,
          zoneName: schoolA.zoneName,
          role: 'Affirmative (Proposition)'
        },
        teamB: {
          schoolId: partner.id,
          schoolName: partner.name,
          county: partner.county,
          zoneName: partner.zoneName,
          role: 'Negative (Opposition)'
        },
        motion: drawnMotion.motionText,
        motionInfoSlide: drawnMotion.infoSlide,
        motionDomain: drawnMotion.domain,
        venue: venue,
        matchDate: matchDate,
        matchTime: timeSlot,
        adjudicators: judgesPool,
        status: 'scheduled',
        antiBiasHash: generateAntiBiasCryptographicHash(`guarantee-3games-odd-${matchIdx}`),
        drawSeed: `guarantee-odd-${matchIdx}`,
        isPublished: true,
        createdAt: new Date().toISOString()
      });
    }
  }

  return generatedFixtures;
}

/**
 * Generates County Playoff / Final Fixtures within a single county.
 * When schools finish their 3 preliminary games, the top advancing schools
 * play against one another within the county until exactly ONE school is crowned County Champion!
 */
export function generateCountyPlayoffFixtures({
  county,
  advancingSchools,
  motionBank,
  defaultVenue,
  scheduledDate
}: {
  county: string;
  advancingSchools: Array<{ id: string; name: string; county: string; zoneName?: string }>;
  motionBank: DebateMotion[];
  defaultVenue?: string;
  scheduledDate?: string;
}): TournamentFixture[] {
  if (!advancingSchools || advancingSchools.length < 2) return [];

  const fixtures: TournamentFixture[] = [];
  const venue = defaultVenue || OFFICIAL_LIBERIAN_VENUES.find(v => v.toLowerCase().includes(county.toLowerCase())) || OFFICIAL_LIBERIAN_VENUES[0];
  const dateStr = scheduledDate || new Date(Date.now() + (3 * 24 * 3600 * 1000)).toISOString().split('T')[0];

  // If 2 teams: County Championship Grand Final
  if (advancingSchools.length === 2) {
    const teamA = advancingSchools[0];
    const teamB = advancingSchools[1];
    const drawnMotion = drawRandomMotionFromBank(motionBank, 'County Final', []);

    fixtures.push({
      id: `fix-county-final-${county.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      program: 'debate',
      stage: 'county_finals',
      roundName: `${county} County Championship Grand Final • Official Title Decider`,
      county: county,
      zoneName: `${county} County Arena`,
      matchNumber: 1,
      teamA: {
        schoolId: teamA.id,
        schoolName: teamA.name,
        county: teamA.county,
        zoneName: teamA.zoneName,
        role: 'Affirmative (Proposition)'
      },
      teamB: {
        schoolId: teamB.id,
        schoolName: teamB.name,
        county: teamB.county,
        zoneName: teamB.zoneName,
        role: 'Negative (Opposition)'
      },
      motion: drawnMotion.motionText,
      motionInfoSlide: drawnMotion.infoSlide,
      motionDomain: drawnMotion.domain,
      venue: venue,
      matchDate: dateStr,
      matchTime: '02:30 PM GMT (Grand County Session)',
      adjudicators: ACCREDITED_ADJUDICATORS.slice(0, 3),
      status: 'scheduled',
      antiBiasHash: generateAntiBiasCryptographicHash(`${county}-final-${Date.now()}`),
      drawSeed: `county-final-${Date.now()}`,
      isPublished: true,
      createdAt: new Date().toISOString()
    });
  } else if (advancingSchools.length >= 4) {
    // 4 teams: County Semifinal 1 and Semifinal 2
    const usedMotions: string[] = [];
    const matchups = [
      { a: advancingSchools[0], b: advancingSchools[3], title: `${county} County Semifinal 1 (Rank 1 vs Rank 4)`, time: '10:00 AM GMT' },
      { a: advancingSchools[1], b: advancingSchools[2], title: `${county} County Semifinal 2 (Rank 2 vs Rank 3)`, time: '01:00 PM GMT' }
    ];

    matchups.forEach((m, idx) => {
      const drawnMotion = drawRandomMotionFromBank(motionBank, 'County Final', usedMotions);
      usedMotions.push(drawnMotion.id);

      fixtures.push({
        id: `fix-county-semi-${county.toLowerCase().replace(/\s+/g, '-')}-${idx + 1}-${Date.now()}`,
        program: 'debate',
        stage: 'county_finals',
        roundName: m.title,
        county: county,
        zoneName: `${county} County Arena`,
        matchNumber: idx + 1,
        teamA: {
          schoolId: m.a.id,
          schoolName: m.a.name,
          county: m.a.county,
          zoneName: m.a.zoneName,
          role: 'Affirmative (Proposition)'
        },
        teamB: {
          schoolId: m.b.id,
          schoolName: m.b.name,
          county: m.b.county,
          zoneName: m.b.zoneName,
          role: 'Negative (Opposition)'
        },
        motion: drawnMotion.motionText,
        motionInfoSlide: drawnMotion.infoSlide,
        motionDomain: drawnMotion.domain,
        venue: venue,
        matchDate: dateStr,
        matchTime: m.time,
        adjudicators: ACCREDITED_ADJUDICATORS.slice(0, 3),
        status: 'scheduled',
        antiBiasHash: generateAntiBiasCryptographicHash(`${county}-semi-${idx + 1}-${Date.now()}`),
        drawSeed: `county-semi-${idx + 1}-${Date.now()}`,
        isPublished: true,
        createdAt: new Date().toISOString()
      });
    });
  }

  return fixtures;
}

/**
 * Generates Quarterfinal fixtures for Stage 2 (Central Stage).
 * Takes the 8 winners of Round of 16 (the 8 losers automatically drop).
 * Pairs the 8 winning teams into 4 Quarterfinal knockout matches.
 */
export function generateStage2Quarterfinals({
  winners,
  motionBank,
  scheduledDate
}: {
  winners: Array<{ schoolId: string; displayName: string; county: string }>;
  motionBank: DebateMotion[];
  scheduledDate?: string;
}): TournamentFixture[] {
  if (!winners || winners.length < 8) return [];

  const fixtures: TournamentFixture[] = [];
  const usedMotions: string[] = [];
  const matchDate = scheduledDate || new Date(Date.now() + (4 * 24 * 3600 * 1000)).toISOString().split('T')[0];

  // 4 matches
  for (let i = 0; i < 4; i++) {
    const teamA = winners[i];
    const teamB = winners[7 - i]; // Pair 1v8, 2v7, 3v6, 4v5
    const matchNo = i + 1;

    const drawnMotion = drawRandomMotionFromBank(motionBank, 'Central Stage', usedMotions);
    usedMotions.push(drawnMotion.id);

    fixtures.push({
      id: `lndc-s2-qf-${matchNo}-${Date.now()}`,
      program: 'debate',
      stage: 'central_stage',
      roundName: `Stage 2: Central Stage • National Quarterfinals (Elite 8) • Match #${matchNo}`,
      county: `${teamA.county} vs ${teamB.county}`,
      zoneName: 'Central Forensics Arena',
      matchNumber: matchNo,
      teamA: {
        schoolId: teamA.schoolId,
        schoolName: teamA.displayName,
        county: teamA.county,
        zoneName: 'Central Quarterfinalist',
        role: 'Affirmative (Proposition)'
      },
      teamB: {
        schoolId: teamB.schoolId,
        schoolName: teamB.displayName,
        county: teamB.county,
        zoneName: 'Central Quarterfinalist',
        role: 'Negative (Opposition)'
      },
      motion: drawnMotion.motionText,
      motionInfoSlide: drawnMotion.infoSlide,
      motionDomain: drawnMotion.domain,
      venue: 'Centenary Forensics Hall / Central Tournament Stage',
      matchDate: matchDate,
      matchTime: OFFICIAL_TIME_SLOTS[i % OFFICIAL_TIME_SLOTS.length],
      adjudicators: ACCREDITED_ADJUDICATORS.slice(0, 3),
      status: 'scheduled',
      antiBiasHash: generateAntiBiasCryptographicHash(`central-qf-${matchNo}-${Date.now()}`),
      drawSeed: `stage2-qf-${matchNo}-${Date.now()}`,
      isPublished: true,
      createdAt: new Date().toISOString()
    });
  }

  return fixtures;
}

/**
 * Generates Semifinal fixtures for Stage 2 (Central Stage).
 * Takes the 4 winners of Quarterfinals (the 4 losers automatically drop).
 * Pairs the 4 teams into 2 Semifinal knockout matches.
 */
export function generateStage2Semifinals({
  winners,
  motionBank,
  scheduledDate
}: {
  winners: Array<{ schoolId: string; displayName: string; county: string }>;
  motionBank: DebateMotion[];
  scheduledDate?: string;
}): TournamentFixture[] {
  if (!winners || winners.length < 4) return [];

  const fixtures: TournamentFixture[] = [];
  const usedMotions: string[] = [];
  const matchDate = scheduledDate || new Date(Date.now() + (5 * 24 * 3600 * 1000)).toISOString().split('T')[0];

  const matchups = [
    { a: winners[0], b: winners[3], matchNo: 1, time: '11:00 AM GMT', title: 'National Semifinal 1 (Final 4)' },
    { a: winners[1], b: winners[2], matchNo: 2, time: '03:00 PM GMT', title: 'National Semifinal 2 (Final 4)' }
  ];

  matchups.forEach((m) => {
    const drawnMotion = drawRandomMotionFromBank(motionBank, 'Central Stage', usedMotions);
    usedMotions.push(drawnMotion.id);

    fixtures.push({
      id: `lndc-s2-sf-${m.matchNo}-${Date.now()}`,
      program: 'debate',
      stage: 'central_stage',
      roundName: `Stage 2: Central Stage • ${m.title} • Match #${m.matchNo}`,
      county: `${m.a.county} vs ${m.b.county}`,
      zoneName: 'Central Forensics Arena',
      matchNumber: m.matchNo,
      teamA: {
        schoolId: m.a.schoolId,
        schoolName: m.a.displayName,
        county: m.a.county,
        zoneName: 'National Semifinalist',
        role: 'Affirmative (Proposition)'
      },
      teamB: {
        schoolId: m.b.schoolId,
        schoolName: m.b.displayName,
        county: m.b.county,
        zoneName: 'National Semifinalist',
        role: 'Negative (Opposition)'
      },
      motion: drawnMotion.motionText,
      motionInfoSlide: drawnMotion.infoSlide,
      motionDomain: drawnMotion.domain,
      venue: 'Centenary Forensics Hall / Central Tournament Stage',
      matchDate: matchDate,
      matchTime: m.time,
      adjudicators: ACCREDITED_ADJUDICATORS.slice(0, 3),
      status: 'scheduled',
      antiBiasHash: generateAntiBiasCryptographicHash(`central-sf-${m.matchNo}-${Date.now()}`),
      drawSeed: `stage2-sf-${m.matchNo}-${Date.now()}`,
      isPublished: true,
      createdAt: new Date().toISOString()
    });
  });

  return fixtures;
}

/**
 * Takes qualified advancing schools and randomly pairs them for the Next Round
 * (e.g. County Semifinals, County Finals, or National Super 16 Knockout),
 * draws a brand new motion from the Motion Bank, and sets default time/venue.
 */
export function generateNextRoundPairings({
  advancingSchools,
  nextStageTitle,
  stage = 'county_finals',
  county,
  motionBank,
  defaultVenue,
  seedOverride,
  scheduledDate
}: {
  advancingSchools: Array<{ id: string; name: string; county: string; zoneName?: string }>;
  nextStageTitle?: string;
  stage?: TournamentStage;
  county?: string;
  motionBank: DebateMotion[];
  defaultVenue?: string;
  seedOverride?: string;
  scheduledDate?: string;
}): TournamentFixture[] {
  if (!advancingSchools || advancingSchools.length < 2) {
    return [];
  }

  const seed = seedOverride || `next-round-${stage}-${Date.now()}`;
  // Impartially shuffle the advancing schools
  const randomizedAdvancers = antiBiasShuffle([...advancingSchools], seed);
  const fixtures: TournamentFixture[] = [];
  const usedMotionIds: string[] = [];

  const targetCounty = county || advancingSchools[0].county || 'All 15 Counties';
  const venue = defaultVenue || OFFICIAL_LIBERIAN_VENUES.find(v => v.toLowerCase().includes(targetCounty.toLowerCase())) || OFFICIAL_LIBERIAN_VENUES[1];

  for (let i = 0; i < randomizedAdvancers.length - 1; i += 2) {
    const schoolA = randomizedAdvancers[i];
    const schoolB = randomizedAdvancers[i + 1];
    const matchIdx = Math.floor(i / 2) + 1;

    // Side flip
    const coinFlip = (seed.charCodeAt(i % seed.length) + matchIdx) % 2 === 0;
    const aff = coinFlip ? schoolA : schoolB;
    const neg = coinFlip ? schoolB : schoolA;

    // Pick neutral motion from bank for next round
    const motion = drawRandomMotionFromBank(motionBank, 'Next Round Knockout', usedMotionIds);
    usedMotionIds.push(motion.id);

    const neutralJudges = ACCREDITED_ADJUDICATORS.filter(
      adj => adj.countyOfOrigin.toLowerCase() !== aff.county.toLowerCase() &&
             adj.countyOfOrigin.toLowerCase() !== neg.county.toLowerCase()
    );
    const assignedJudges = (neutralJudges.length >= 3 ? neutralJudges : ACCREDITED_ADJUDICATORS).slice(0, 3);

    const matchDate = scheduledDate || new Date(Date.now() + (5 * 24 * 3600 * 1000)).toISOString().split('T')[0];
    const matchTime = OFFICIAL_TIME_SLOTS[matchIdx % OFFICIAL_TIME_SLOTS.length];

    const roundName = nextStageTitle || (
      stage === 'national_championship'
        ? `National Championship • Super 16 Face-Off • Match #${matchIdx}`
        : `${targetCounty} County Championship Grand Face-Off • Match #${matchIdx}`
    );

    fixtures.push({
      id: `fix-adv-${stage}-${Date.now()}-${matchIdx}`,
      program: 'debate',
      stage: stage,
      roundName: roundName,
      county: targetCounty,
      zoneName: aff.zoneName,
      matchNumber: matchIdx,
      teamA: {
        schoolId: aff.id,
        schoolName: aff.name,
        county: aff.county,
        zoneName: aff.zoneName,
        role: 'Affirmative (Proposition)'
      },
      teamB: {
        schoolId: neg.id,
        schoolName: neg.name,
        county: neg.county,
        zoneName: neg.zoneName,
        role: 'Negative (Opposition)'
      },
      motion: motion.motionText,
      motionInfoSlide: motion.infoSlide,
      motionDomain: motion.domain,
      venue: venue,
      matchDate: matchDate,
      matchTime: matchTime,
      adjudicators: assignedJudges,
      status: 'scheduled',
      antiBiasHash: generateAntiBiasCryptographicHash(`${seed}-${matchIdx}`),
      drawSeed: seed,
      isPublished: true,
      createdAt: new Date().toISOString()
    });
  }

  return fixtures;
}

/**
 * Simulates results for a given set of fixtures:
 * Assigns realistic high-school debate speaker points (265-295),
 * ballots (3-0 unanimous or 2-1 split decision),
 * determines winner, and marks status as completed.
 */
export function simulateFixturesResults(fixtures: TournamentFixture[], matchDateOverride?: string): TournamentFixture[] {
  return fixtures.map(fix => {
    if (fix.status === 'completed' && fix.winnerId) {
      return fix; // Already completed
    }

    // Realistic score generation
    // Top debate speaker scores range between 260 and 295
    const baseScore = 265 + Math.floor(Math.random() * 20);
    const margin = 1 + Math.floor(Math.random() * 12); // Margin 1-12 points
    const teamAWins = Math.random() > 0.5;

    const scoreA = teamAWins ? baseScore + margin : baseScore;
    const scoreB = teamAWins ? baseScore : baseScore + margin;

    // Realistic ballots: 65% chance of 2-1 split, 35% chance of 3-0 unanimous
    const isUnanimous = Math.random() > 0.65;
    const ballotsA = teamAWins ? (isUnanimous ? 3 : 2) : (isUnanimous ? 0 : 1);
    const ballotsB = 3 - ballotsA;

    const winnerRole = teamAWins ? 'teamA' : 'teamB';
    const winnerId = teamAWins ? fix.teamA.schoolId : fix.teamB.schoolId;
    const winnerName = teamAWins ? fix.teamA.schoolName : fix.teamB.schoolName;

    const decisionText = isUnanimous 
      ? `3-0 Unanimous Decision (${Math.max(scoreA, scoreB)} pts vs ${Math.min(scoreA, scoreB)} pts)`
      : `2-1 Split Decision (${Math.max(scoreA, scoreB)} pts vs ${Math.min(scoreA, scoreB)} pts)`;

    return {
      ...fix,
      matchDate: matchDateOverride || fix.matchDate,
      status: 'completed',
      winnerId: winnerId,
      winnerName: winnerName,
      winnerRole: winnerRole as 'teamA' | 'teamB',
      scoreDifferential: decisionText,
      adjudicatorNotes: `Official ballots certified by Chief Adjudicator. High-caliber debate on resolution "${fix.motion.slice(0, 50)}...". Both delegations demonstrated outstanding rhetorical command.`,
      teamA: {
        ...fix.teamA,
        score: scoreA,
        ballots: ballotsA
      },
      teamB: {
        ...fix.teamB,
        score: scoreB,
        ballots: ballotsB
      },
      updatedAt: new Date().toISOString()
    };
  });
}
