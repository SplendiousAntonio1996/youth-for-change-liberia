import { 
  LndcStage, 
  LndcTournamentConfig, 
  LndcCentralTeam, 
  TournamentFixture 
} from '../types/tournament';

// 1. Official Liberia National Debate Championship (LNDC) Tournament Configuration
export const DEFAULT_LNDC_CONFIG: LndcTournamentConfig = {
  defendingChampionSchool: 'United Dawah Ummah High School', // 2023 National Champion (Montserrado)
  defendingChampionCounty: 'Montserrado',
  year: '2024/2025',
  centralStageTeamsCount: 16,
  thirdPlaceVenue: 'The Central Debate Camp (Youth For Change Forensics Academy, Careysburg)',
  grandFinalVenue: 'Official Grand Venue: E.J.S. Ministerial Complex Auditorium, Congo Town'
};

export const ALL_15_LIBERIAN_COUNTIES = [
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

// 2. Official 3-Stage Definition and Pedagogical Architecture
export interface LndcStageExplainer {
  stage: LndcStage;
  stageNumber: number;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  keyRule: string;
  venueType: string;
  participantCount: string;
}

export const LNDC_STAGES_INFO: Record<LndcStage, LndcStageExplainer> = {
  county_prelims: {
    stage: 'county_prelims',
    stageNumber: 1,
    name: 'County Preliminary Stage',
    shortName: 'County Preliminaries',
    tagline: 'Grassroots County Championship Justifications',
    description: 'Secondary schools within each of Liberia\'s 15 counties compete in local zonal rounds and county justifications to be crowned their official County Champion.',
    keyRule: 'DEFENDING CHAMPION EXEMPTION: The reigning National Champion school does NOT participate in preliminary county justifications. They receive an automatic bye directly into the Central Stage. Their home county stages its preliminaries to crown a second school as the County Champion. Logically, the defending champion\'s county always produces TWO teams at the Central Stage.',
    venueType: 'Designated County High School Auditoriums & City Halls across the 15 counties',
    participantCount: 'All registered accredited high schools across 15 counties'
  },
  central_stage: {
    stage: 'central_stage',
    stageNumber: 2,
    name: 'Central Stage (16-Team National Tournament)',
    shortName: 'Central Stage',
    tagline: '16 Elite County Delegations Competing for National Honor',
    description: 'The premier national tournament featuring exactly 16 teams: 15 County Champions representing their counties, plus the reigning Defending Champion school.',
    keyRule: 'COUNTY NAME IDENTIFICATION RULE: At the Central Tournament, teams are officially identified by County Names, NOT by individual school names. They represent the pride and forensic prowess of their counties on the national stage. Progresses through Round of 16 (8 fixtures), Quarterfinals (4 fixtures), and Semifinals (2 fixtures).',
    venueType: 'Central Forensics Arenas & National Tournament Halls',
    participantCount: 'Exactly 16 Teams (15 County Champions + 1 Defending Champion)'
  },
  grand_final_third_place: {
    stage: 'grand_final_third_place',
    stageNumber: 3,
    name: 'Grand Final & Third Place Stage',
    shortName: 'Grand Final & 3rd Place',
    tagline: 'The Climax: Camp Clash for Bronze & Grand Venue for the National Crown',
    description: 'The tournament zenith featuring four elite schools: two semifinal runners-up battling for third place, and the two semifinal winners clashing in the Championship Grand Final.',
    keyRule: 'DISTINCT VENUE ARCHITECTURE: The Third Place Match is traditionally played on the Camp (Central Debate Camp/Forensics Bootcamp), while the Grand Final is staged at an Official Grand Venue (e.g., E.J.S. Ministerial Complex Auditorium or Monrovia City Hall Ballroom) in front of national dignitaries, corporate sponsors, and broadcast media.',
    venueType: 'Camp (3rd Place) vs. Official Grand Hall (Grand Final)',
    participantCount: '4 Elite Schools (2 Grand Finalists + 2 Third-Place Contenders)'
  }
};

// 3. Generator for the 16 Central Stage Teams
export function generateCentralStage16Teams(
  defendingSchool: string = DEFAULT_LNDC_CONFIG.defendingChampionSchool,
  defendingCounty: string = DEFAULT_LNDC_CONFIG.defendingChampionCounty
): LndcCentralTeam[] {
  const teams: LndcCentralTeam[] = [];

  // Team 1: The Defending Champion School (Automatic Bye from defending county)
  teams.push({
    id: `central-defending-${defendingCounty.toLowerCase()}`,
    county: defendingCounty,
    displayName: `${defendingCounty} (Defending Champions)`,
    schoolName: defendingSchool,
    schoolId: 'sch-defending-champ',
    isDefendingChampion: true,
    qualifierType: 'defending_champion_bye',
    seed: 1
  });

  // Team 2: The Newly Crowned County Champion from the defending county
  teams.push({
    id: `central-champ-${defendingCounty.toLowerCase()}`,
    county: defendingCounty,
    displayName: `${defendingCounty} (County Champions)`,
    schoolName: `${defendingCounty} County Champion School`,
    schoolId: `sch-${defendingCounty.toLowerCase()}-champ`,
    isDefendingChampion: false,
    qualifierType: 'county_champion',
    seed: 2
  });

  // Teams 3-16: The 14 other County Champions from the remaining 14 counties
  let seedCounter = 3;
  for (const county of ALL_15_LIBERIAN_COUNTIES) {
    if (county.toLowerCase() === defendingCounty.toLowerCase()) continue;

    // Real notable school references for county champions
    const representativeSchool = getCountyRepresentativeSchool(county);

    teams.push({
      id: `central-champ-${county.toLowerCase()}`,
      county,
      displayName: county, // Officially identified by County Name!
      schoolName: representativeSchool,
      schoolId: `sch-${county.toLowerCase()}-champ`,
      isDefendingChampion: false,
      qualifierType: 'county_champion',
      seed: seedCounter++
    });
  }

  return teams;
}

// Fallback lookup of representative champion schools per county
function getCountyRepresentativeSchool(county: string): string {
  switch (county.toLowerCase()) {
    case 'nimba': return 'Ganta United Methodist School (GUMS)';
    case 'bong': return 'Cuttington University Campus High School';
    case 'margibi': return 'Booker Washington Institute (BWI)';
    case 'grand bassa': return 'Bassa High School';
    case 'lofa': return 'Voinjama Multilateral High School';
    case 'grand gedeh': return 'Bishop Juwle Catholic High School';
    case 'maryland': return 'Cape Palmas High School';
    case 'bomi': return 'C.H. Dewey High School';
    case 'grand cape mount': return 'Robertsport High School';
    case 'sinoe': return 'Sinoe Multilateral High School';
    case 'river cess': return 'Cestos High School';
    case 'grand kru': return 'Barclayville Central High School';
    case 'river gee': return 'Fish Town Multilateral High School';
    case 'gbarpolu': return 'Bopolu High School';
    default: return `${county} High School`;
  }
}

// 4. Generator for Official LNDC Fixtures across All 3 Stages
export function generateOfficialLndcFixtures(
  config: LndcTournamentConfig = DEFAULT_LNDC_CONFIG
): TournamentFixture[] {
  const centralTeams = generateCentralStage16Teams(
    config.defendingChampionSchool,
    config.defendingChampionCounty
  );

  const fixtures: TournamentFixture[] = [];

  // ==========================================
  // STAGE 1: COUNTY PRELIMINARIES
  // ==========================================
  // Montserrado County Preliminaries (demonstrating Defending Champion exemption)
  fixtures.push({
    id: 'lndc-s1-fix-mon-01',
    program: 'debate',
    stage: 'county_prelims',
    roundName: 'Stage 1: Montserrado County Preliminary Championship • Match #1',
    county: 'Montserrado',
    zoneName: 'Central Monrovia & Sinkor Hub',
    matchNumber: 1,
    teamA: {
      schoolId: 'sch-mon-bw-harris',
      schoolName: 'B.W. Harris Episcopal High School',
      county: 'Montserrado',
      zoneName: 'Sinkor Zone',
      role: 'Affirmative (Proposition)',
      score: 285,
      ballots: 3
    },
    teamB: {
      schoolId: 'sch-mon-cwa',
      schoolName: 'College of West Africa (CWA)',
      county: 'Montserrado',
      zoneName: 'Central Monrovia Zone',
      role: 'Negative (Opposition)',
      score: 278,
      ballots: 0
    },
    motion: 'This House Would Mandate That 50% of County Social Development Funds (CSDF) Be Exclusively Ring-Fenced for High School Science Laboratories and Digital Forensics Infrastructure.',
    motionInfoSlide: 'NOTE: Defending National Champion United Dawah Ummah High School does not compete in this preliminary stage, having received an automatic qualification bye to the Central Stage.',
    motionDomain: 'Economics & Resource Rights',
    venue: 'Monrovia City Hall Ballroom, Tubman Blvd',
    matchDate: '2025-09-22',
    matchTime: '10:00 AM GMT',
    adjudicators: [
      { id: 'adj-01', name: 'Atty. James K. Flomo', role: 'Chief Adjudicator', countyOfOrigin: 'Margibi', institution: 'Louis Arthur Grimes School of Law', certifiedWSDC: true },
      { id: 'adj-03', name: 'Eng. Martin M. Forkpah', role: 'Panelist', countyOfOrigin: 'Bong', institution: 'BWI Engineering Faculty', certifiedWSDC: true },
      { id: 'adj-04', name: 'Dr. Comfort A. Toe', role: 'Panelist', countyOfOrigin: 'Maryland', institution: 'Tubman University Faculty of Education', certifiedWSDC: true }
    ],
    status: 'completed',
    winnerId: 'sch-mon-bw-harris',
    winnerName: 'B.W. Harris Episcopal High School',
    winnerRole: 'teamA',
    scoreDifferential: '3-0 Unanimous Decision',
    adjudicatorNotes: 'Affirmative demonstrated exceptional policy modeling regarding local government accountability.',
    antiBiasHash: 'LNDC-FAIR-S1-MON-01',
    drawSeed: 'lndc-stage1-montserrado',
    isPublished: true,
    createdAt: '2025-09-01T08:00:00.000Z'
  });

  // Nimba County Preliminaries
  fixtures.push({
    id: 'lndc-s1-fix-nim-01',
    program: 'debate',
    stage: 'county_prelims',
    roundName: 'Stage 1: Nimba County Preliminary Championship • Match #1',
    county: 'Nimba',
    zoneName: 'Central Nimba & Ganta Commercial Basin',
    matchNumber: 2,
    teamA: {
      schoolId: 'sch-nim-gums',
      schoolName: 'Ganta United Methodist School (GUMS)',
      county: 'Nimba',
      zoneName: 'Ganta Basin',
      role: 'Affirmative (Proposition)',
      score: 288,
      ballots: 3
    },
    teamB: {
      schoolId: 'sch-nim-sanniquellie',
      schoolName: 'Sanniquellie Central High School',
      county: 'Nimba',
      zoneName: 'Upper Nimba',
      role: 'Negative (Opposition)',
      score: 280,
      ballots: 0
    },
    motion: 'This House Would Legislate a 30% Mandatory Gender Quota on All Candidate Listings for Parliamentary and Legislative Elections.',
    motionInfoSlide: 'Article 8 of the Liberian Constitution and the New Elections Law debate female political representation benchmarks.',
    motionDomain: 'Governance & Constitution',
    venue: 'Ganta United Methodist School Auditorium',
    matchDate: '2025-09-24',
    matchTime: '11:00 AM GMT',
    adjudicators: [
      { id: 'adj-05', name: 'Cllr. Gabriel B. Weah', role: 'Chief Adjudicator', countyOfOrigin: 'Grand Gedeh', institution: 'Liberian Bar Association', certifiedWSDC: true },
      { id: 'adj-06', name: 'Precious S. Dennis', role: 'Panelist', countyOfOrigin: 'Lofa', institution: 'Youth For Change Senior Adjudication Council', certifiedWSDC: true },
      { id: 'adj-08', name: 'Finda B. Kanneh', role: 'Panelist', countyOfOrigin: 'Grand Bassa', institution: 'Grand Bassa Collegiate Debate Guild', certifiedWSDC: true }
    ],
    status: 'completed',
    winnerId: 'sch-nim-gums',
    winnerName: 'Ganta United Methodist School (GUMS)',
    winnerRole: 'teamA',
    scoreDifferential: '3-0 Decision',
    adjudicatorNotes: 'GUMS proved decisive on structural barriers to female representation.',
    antiBiasHash: 'LNDC-FAIR-S1-NIM-01',
    drawSeed: 'lndc-stage1-nimba',
    isPublished: true,
    createdAt: '2025-09-01T08:00:00.000Z'
  });

  // Bong County Preliminaries
  fixtures.push({
    id: 'lndc-s1-fix-bong-01',
    program: 'debate',
    stage: 'county_prelims',
    roundName: 'Stage 1: Bong County Preliminary Championship • Match #1',
    county: 'Bong',
    zoneName: 'Greater Gbarnga & Suakoko',
    matchNumber: 3,
    teamA: {
      schoolId: 'sch-bong-cuttington',
      schoolName: 'Cuttington University Campus High School',
      county: 'Bong',
      zoneName: 'Suakoko Basin',
      role: 'Affirmative (Proposition)'
    },
    teamB: {
      schoolId: 'sch-bong-gboveh',
      schoolName: 'Gboveh High School',
      county: 'Bong',
      zoneName: 'Central Gbarnga',
      role: 'Negative (Opposition)'
    },
    motion: 'This House Believes That West African States Should Establish an Integrated Digital Single Currency Backed by Critical Green Energy Mineral Reserves.',
    motionInfoSlide: 'Regional currency models balance trade friction reduction against national macroeconomic flexibility.',
    motionDomain: 'Economics & Resource Rights',
    venue: 'Cuttington University Amphitheater, Suakoko',
    matchDate: '2025-09-26',
    matchTime: '01:30 PM GMT',
    adjudicators: [
      { id: 'adj-01', name: 'Atty. James K. Flomo', role: 'Chief Adjudicator', countyOfOrigin: 'Margibi', institution: 'Louis Arthur Grimes School of Law', certifiedWSDC: true },
      { id: 'adj-02', name: 'Keziah M. Freeman', role: 'Deputy Chief', countyOfOrigin: 'Montserrado', institution: 'University of Liberia Forensics Society', certifiedWSDC: true },
      { id: 'adj-07', name: 'Amos N. Wonlea', role: 'Panelist', countyOfOrigin: 'Nimba', institution: 'Nimba Forensics League', certifiedWSDC: true }
    ],
    status: 'scheduled',
    antiBiasHash: 'LNDC-FAIR-S1-BONG-01',
    drawSeed: 'lndc-stage1-bong',
    isPublished: true,
    createdAt: '2025-09-01T08:00:00.000Z'
  });

  // ==========================================
  // STAGE 2: CENTRAL STAGE (16 Teams - County Names)
  // ==========================================
  // In Stage 2, teams are officially identified by County Names!
  // Round of 16 Matchups (8 matches pairing the 16 teams)
  const roundOf16Pairings = [
    { a: centralTeams[0], b: centralTeams[15], matchNo: 1, time: '09:00 AM GMT' }, // Montserrado (Defending) vs Gbarpolu
    { a: centralTeams[1], b: centralTeams[14], matchNo: 2, time: '10:30 AM GMT' }, // Montserrado (County Champ) vs River Gee
    { a: centralTeams[2], b: centralTeams[13], matchNo: 3, time: '12:00 PM GMT' }, // Nimba vs Grand Kru
    { a: centralTeams[3], b: centralTeams[12], matchNo: 4, time: '01:30 PM GMT' }, // Bong vs River Cess
    { a: centralTeams[4], b: centralTeams[11], matchNo: 5, time: '03:00 PM GMT' }, // Margibi vs Sinoe
    { a: centralTeams[5], b: centralTeams[10], matchNo: 6, time: '04:30 PM GMT' }, // Grand Bassa vs Grand Cape Mount
    { a: centralTeams[6], b: centralTeams[9],  matchNo: 7, time: '06:00 PM GMT' }, // Lofa vs Bomi
    { a: centralTeams[7], b: centralTeams[8],  matchNo: 8, time: '07:30 PM GMT' }  // Grand Gedeh vs Maryland
  ];

  const centralMotions = [
    'This House, as the Ministry of Education, Would Replace Standardized WAEC/WASSCE Rote Examinations with Longitudinal Continuous Project-Based STEM & Forensics Assessments.',
    'This House Would Ban the Export of Raw Timber and Mineral Ores to Enforce Domestic Value Addition Across ECOWAS.',
    'This House Believes That Post-Conflict African Nations Should Grant Sovereign Digital Land Titles Managed by Decentralized Community Registries.',
    'This House Would Prohibit Public Officials and Immediate Families From Accessing Private Medical Care Funded by Public Appropriations.',
    'This House Would Mandate Compulsory Artificial Intelligence and Ethics Literacy Across Secondary Curricula.',
    'This House Believes That Developing Nations Should Refuse Carbon Offset Pledges That Do Not Provide Direct Infrastructure Equity to Forest Communities.',
    'This House Would Grant Autonomous Fiscal Spending Authority Directly to Municipal County Councils.',
    'This House Believes That Universal High-Speed Satellite Internet Is a Non-Negotiable Human Right for Rural Secondary Schools.'
  ];

  roundOf16Pairings.forEach((pair, idx) => {
    fixtures.push({
      id: `lndc-s2-r16-fix-0${pair.matchNo}`,
      program: 'debate',
      stage: 'central_stage',
      roundName: `Stage 2: Central Stage • Round of 16 • Match #${pair.matchNo}`,
      county: `${pair.a.county} vs ${pair.b.county}`,
      zoneName: 'Central National Tournament Bracket',
      matchNumber: pair.matchNo,
      teamA: {
        schoolId: pair.a.schoolId,
        // Crucial: Display Name uses County Name as instructed!
        schoolName: pair.a.displayName,
        county: pair.a.county,
        zoneName: pair.a.isDefendingChampion 
          ? `Defending Champion (${pair.a.schoolName})` 
          : `${pair.a.county} County Champion`,
        role: 'Affirmative (Proposition)'
      },
      teamB: {
        schoolId: pair.b.schoolId,
        schoolName: pair.b.displayName,
        county: pair.b.county,
        zoneName: pair.b.isDefendingChampion 
          ? `Defending Champion (${pair.b.schoolName})` 
          : `${pair.b.county} County Champion`,
        role: 'Negative (Opposition)'
      },
      motion: centralMotions[idx % centralMotions.length],
      motionInfoSlide: 'Teams are officially identified by County Names on the Central Stage. Individual school affiliations are recorded for institutional archival records.',
      motionDomain: 'Governance & Constitution',
      venue: 'Centenary Forensics Hall / Central Tournament Stage',
      matchDate: '2025-10-10',
      matchTime: pair.time,
      adjudicators: [
        { id: 'adj-01', name: 'Atty. James K. Flomo', role: 'Chief Adjudicator', countyOfOrigin: 'Margibi', institution: 'Louis Arthur Grimes School of Law', certifiedWSDC: true },
        { id: 'adj-05', name: 'Cllr. Gabriel B. Weah', role: 'Deputy Chief', countyOfOrigin: 'Grand Gedeh', institution: 'Liberian Bar Association', certifiedWSDC: true },
        { id: 'adj-04', name: 'Dr. Comfort A. Toe', role: 'Panelist', countyOfOrigin: 'Maryland', institution: 'Tubman University Faculty of Education', certifiedWSDC: true }
      ],
      status: 'scheduled',
      antiBiasHash: `LNDC-CENTRAL-R16-M${pair.matchNo}`,
      drawSeed: 'central-stage-16teams-draw',
      isPublished: true,
      createdAt: '2025-09-01T08:00:00.000Z'
    });
  });

  // ==========================================
  // STAGE 3: GRAND FINAL AND THIRD PLACE
  // ==========================================
  // Match 1: THIRD PLACE MATCH (Played on the Camp!)
  fixtures.push({
    id: 'lndc-s3-third-place',
    program: 'debate',
    stage: 'grand_final_third_place',
    roundName: 'Stage 3: National Third-Place Playoff • Bronze Medal Clash (Played on the Camp)',
    county: 'National Camp Decider',
    zoneName: 'Central Debate Camp Arena',
    matchNumber: 1,
    teamA: {
      schoolId: 'sch-nim-gums',
      schoolName: 'Nimba County Delegation (GUMS)',
      county: 'Nimba',
      zoneName: 'Semifinal Runner-Up 1',
      role: 'Affirmative (Proposition)',
      score: 286,
      ballots: 2
    },
    teamB: {
      schoolId: 'sch-bong-cuttington',
      schoolName: 'Bong County Delegation (Cuttington Campus High)',
      county: 'Bong',
      zoneName: 'Semifinal Runner-Up 2',
      role: 'Negative (Opposition)',
      score: 284,
      ballots: 1
    },
    motion: 'This House Would Require All Commercial Banks in Developing Countries to Maintain a Dedicated Micro-Credit Facility Exclusively for Youth-Led Agricultural and Tech Cooperatives.',
    motionInfoSlide: 'TRADITIONAL CAMP STAGING: The Third-Place encounter is proudly staged directly on the Central Forensics Camp grounds before the entire national cohort of debaters and coaches.',
    motionDomain: 'Economics & Resource Rights',
    venue: config.thirdPlaceVenue,
    matchDate: '2025-10-24',
    matchTime: '03:30 PM GMT',
    adjudicators: [
      { id: 'adj-06', name: 'Precious S. Dennis', role: 'Chief Adjudicator', countyOfOrigin: 'Lofa', institution: 'Youth For Change Senior Adjudication Council', certifiedWSDC: true },
      { id: 'adj-02', name: 'Keziah M. Freeman', role: 'Panelist', countyOfOrigin: 'Montserrado', institution: 'University of Liberia Forensics Society', certifiedWSDC: true },
      { id: 'adj-08', name: 'Finda B. Kanneh', role: 'Panelist', countyOfOrigin: 'Grand Bassa', institution: 'Grand Bassa Collegiate Debate Guild', certifiedWSDC: true }
    ],
    status: 'scheduled',
    antiBiasHash: 'LNDC-STAGE3-CAMP-THIRD-PLACE',
    drawSeed: 'lndc-stage3-third-place-camp',
    isPublished: true,
    createdAt: '2025-09-01T08:00:00.000Z'
  });

  // Match 2: GRAND FINAL (Played at an Official Grand Venue!)
  fixtures.push({
    id: 'lndc-s3-grand-final',
    program: 'debate',
    stage: 'grand_final_third_place',
    roundName: 'Stage 3: National Championship Grand Final • Title Decider (Official Grand Venue)',
    county: 'All 15 Counties of Liberia',
    zoneName: 'National Grand Final Arena',
    matchNumber: 2,
    teamA: {
      schoolId: 'sch-defending-champ',
      schoolName: `Montserrado Delegation (Defending Champions: ${config.defendingChampionSchool})`,
      county: 'Montserrado',
      zoneName: 'Defending National Champion',
      role: 'Affirmative (Proposition)'
    },
    teamB: {
      schoolId: 'sch-mar-bwi',
      schoolName: 'Margibi County Delegation (Booker Washington Institute)',
      county: 'Margibi',
      zoneName: 'Margibi County Champion',
      role: 'Negative (Opposition)'
    },
    motion: 'This House Believes That Sub-Saharan African Nations Should Prioritize Sovereign Green Industrialization and Local Mineral Value Chains Over Immediate Fiscal Austerity Demanded by Multilateral Lenders.',
    motionInfoSlide: 'OFFICIAL GRAND VENUE SHOWCASE: The Grand Final is contested at an official grand venue before national leaders, educational authorities, the diplomatic corps, and thousands of live spectators.',
    motionDomain: 'Economics & Resource Rights',
    venue: config.grandFinalVenue,
    matchDate: '2025-10-25',
    matchTime: '02:00 PM GMT',
    adjudicators: [
      { id: 'adj-01', name: 'Atty. James K. Flomo', role: 'Chief Adjudicator', countyOfOrigin: 'Grand Bassa', institution: 'Louis Arthur Grimes School of Law', certifiedWSDC: true },
      { id: 'adj-05', name: 'Cllr. Gabriel B. Weah', role: 'Deputy Chief', countyOfOrigin: 'Grand Gedeh', institution: 'Liberian Bar Association', certifiedWSDC: true },
      { id: 'adj-04', name: 'Dr. Comfort A. Toe', role: 'Panelist', countyOfOrigin: 'Maryland', institution: 'Tubman University Faculty of Education', certifiedWSDC: true }
    ],
    status: 'scheduled',
    antiBiasHash: 'LNDC-STAGE3-GRAND-FINAL-EJS',
    drawSeed: 'lndc-stage3-grand-final-national',
    isPublished: true,
    createdAt: '2025-09-01T08:00:00.000Z'
  });

  return fixtures;
}
