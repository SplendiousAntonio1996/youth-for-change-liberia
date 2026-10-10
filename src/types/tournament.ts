export type TournamentProgram = 'debate' | 'stem' | 'dual';

// Liberia National Debate Championship (LNDC) Official Three-Stage Structure
export type LndcStage = 'county_prelims' | 'central_stage' | 'grand_final_third_place';

export type TournamentStage = 
  | 'county_prelims' 
  | 'central_stage' 
  | 'grand_final_third_place' 
  | 'zonal_prelims' 
  | 'county_finals' 
  | 'national_championship';

export interface LndcTournamentConfig {
  defendingChampionSchool: string; // e.g. "United Dawah Ummah High School"
  defendingChampionCounty: string; // e.g. "Montserrado"
  year: string; // e.g. "2024/2025"
  centralStageTeamsCount: 16;
  thirdPlaceVenue: string; // "The Central Debate Camp / Forensics Bootcamp Academy"
  grandFinalVenue: string; // "Official Grand Venue: E.J.S. Ministerial Complex Auditorium"
}

export interface LndcCentralTeam {
  id: string;
  county: string;
  displayName: string; // Official identity at Central Stage: County Name (e.g. "Montserrado (Defending Champion)", "Nimba", "Bong")
  schoolName: string; // Behind-the-scenes school representation
  schoolId: string;
  isDefendingChampion: boolean;
  qualifierType: 'defending_champion_bye' | 'county_champion';
  seed: number;
}

export interface CountyZone {
  id: string; // e.g. "montserrado-zone-1"
  county: string; // e.g. "Montserrado"
  zoneNumber: number; // 1, 2, 3, 4
  name: string; // e.g. "Zone 1 - Bushrod & Brewerville"
  districts: string[]; // e.g. ["Bushrod Island", "Brewerville", "St. Paul River"]
  primaryVenue: string; // e.g. "Tubman High Auditorium"
  coordinatorName: string;
  coordinatorPhone: string;
  description: string;
}

export interface ZonedSchool {
  id: string;
  name: string;
  county: string;
  zoneId: string;
  zoneName: string;
  cityOrDistrict: string;
  program: TournamentProgram;
  registrationSource: 'application' | 'database' | 'manual';
  status: 'registered' | 'verified' | 'active';
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  principalName?: string;
  delegationSize: number;
  seedRating?: number; // 1-100 based on past performances
  pastTitles?: number;
  isCountyChampion?: boolean; // Set if crowned county champion
  applicationId?: string;
  registeredAt: string;
}

export interface Adjudicator {
  id: string;
  name: string;
  role: 'Chief Adjudicator' | 'Deputy Chief' | 'Panelist' | 'Timekeeper';
  countyOfOrigin: string; // Used to prevent human bias / conflict of interest
  institution: string;
  certifiedWSDC: boolean;
}

export interface DebateMotion {
  id: string;
  motionText: string;
  domain: 'Governance & Constitution' | 'Economics & Resource Rights' | 'STEM & Climate' | 'Education & Gender' | 'International Relations' | string;
  infoSlide?: string;
  preparationType: 'Prepared Motion (Announced in Advance)' | 'Impromptu Motion (1-Hour Release)' | string;
  roundDesignation?: 'Zonal Prelims' | 'County Final' | 'National Championship' | 'Next Round Knockout' | string;
  addedBy?: string;
  createdAt?: string;
}

export interface SchoolTournamentStanding {
  schoolId: string;
  schoolName: string;
  county: string;
  zoneId?: string;
  zoneName?: string;
  matchesPlayed: number; // Max 3 in county prelims
  matchesWon: number;
  matchesLost: number;
  points: number; // 3 points per win
  ballotsWon: number;
  ballotsLost: number;
  totalSpeakerScore: number;
  averageScore: number;
  scoreDifferential: number; // Net score margin
  qualificationStatus: 'pending' | 'qualified_next_round' | 'eliminated' | 'county_champion';
  rank: number;
}

export interface TournamentFixture {
  id: string;
  program: TournamentProgram;
  stage: TournamentStage;
  roundName: string; // e.g. "Montserrado Zone 1 - Round 1", "Nimba County Grand Final", "National Round of 16"
  county: string;
  zoneId?: string;
  zoneName?: string;
  matchNumber: number;
  // Team A (Affirmative / Proposition / Lead Innovator)
  teamA: {
    schoolId: string;
    schoolName: string;
    county: string;
    zoneName?: string;
    role: 'Affirmative (Proposition)' | 'Primary Innovator';
    score?: number; // Total speaker points
    ballots?: number; // Out of 3 judges
  };
  // Team B (Negative / Opposition / Challenger)
  teamB: {
    schoolId: string;
    schoolName: string;
    county: string;
    zoneName?: string;
    role: 'Negative (Opposition)' | 'Challenger';
    score?: number;
    ballots?: number;
  };
  motion: string;
  motionInfoSlide?: string;
  motionDomain: string;
  venue: string;
  matchDate: string; // YYYY-MM-DD
  matchTime: string; // e.g. "10:30 AM GMT"
  adjudicators: Adjudicator[];
  status: 'scheduled' | 'live' | 'completed';
  winnerId?: string;
  winnerName?: string;
  winnerRole?: 'teamA' | 'teamB';
  scoreDifferential?: string; // e.g. "3-0 Unanimous Decision"
  adjudicatorNotes?: string;
  antiBiasHash: string; // Cryptographic verification code e.g. "YFC-FAIR-2025-A8F2"
  drawSeed: string; // Algorithmic seed key
  isPublished: boolean;
  isConfirmed?: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  coachesNotifiedCount?: number;
  lastNotificationDispatchedAt?: string;
  notificationStatus?: 'not_sent' | 'queued' | 'sent' | 'failed';
  createdAt: string;
  updatedAt?: string;
}

export interface CoachRegistration {
  id?: string;
  schoolName: string;
  coachName: string;
  email: string;
  phone?: string;
  county: string;
  program?: TournamentProgram | 'all';
  alertMethod?: 'email' | 'sms' | 'both';
  status?: 'active' | 'pending';
  registeredAt: string;
  notes?: string;
}

export interface CoachNotificationLog {
  id?: string;
  fixtureId: string;
  roundName: string;
  county: string;
  stage?: TournamentStage;
  schoolName: string;
  coachName: string;
  recipientEmail: string;
  recipientPhone?: string;
  sideAssigned?: string;
  matchDetails: string;
  subject: string;
  dispatchedAt: string;
  status: 'sent' | 'queued' | 'failed' | 'simulated';
  adminEmail?: string;
  deliveryMode: 'smtp' | 'dispatch_service';
  error?: string;
}

export interface TournamentRevealAnnouncement {
  title: string;
  revealDate: string; // ISO format
  isRevealLive: boolean;
  announcementText: string;
  grandVenue: string;
  broadcastChannel: string;
  coordinatorHelpline: string;
  currentEdition: string;
}

export interface TournamentEditionArchive {
  id: string; // e.g. "archive_2024-25" or "archive_2024-25_1725900000"
  editionKey: string; // e.g. "2024-25"
  editionYear: string; // e.g. "2024/2025" or "2024-25"
  editionTitle: string; // e.g. "2024-25 National Debate Championship"
  tagline?: string;
  theme?: string;
  championSchool: string;
  championCounty: string;
  runnerUpSchool: string;
  runnerUpCounty: string;
  bestSpeaker: string;
  bestSpeakerSchool: string;
  totalSchools: number;
  totalCounties: number;
  finalMotion: string;
  finalScore: string;
  keyHighlights: string[];
  summary: string;
  fixturesCount: number;
  fixtures: TournamentFixture[];
  standingsCount: number;
  standings: SchoolTournamentStanding[];
  schoolsCount: number;
  schools?: ZonedSchool[];
  archivedAt: string; // ISO string
  archivedBy?: string; // Admin email
  status: 'Archived' | 'Completed';
  backupFileSizeEstimate?: string;
}

