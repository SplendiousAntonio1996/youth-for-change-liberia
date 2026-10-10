import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  TournamentEditionArchive, 
  TournamentFixture, 
  SchoolTournamentStanding, 
  ZonedSchool,
  TournamentRevealAnnouncement
} from '../types/tournament';
import { DebateEdition } from '../types';
import { normalizeEditionKey } from './debateService';

const ARCHIVES_COLLECTION = 'tournamentArchives';
const FIXTURES_COLLECTION = 'tournamentFixtures';
const EDITIONS_COLLECTION = 'debateEditions';
const SETTINGS_COLLECTION = 'tournamentSettings';
const PROGRAM_STATUS_COLLECTION = 'programStatuses';

// Baseline fallback archives for past editions (2024-25, 2023, 2022)
export const DEFAULT_HISTORICAL_ARCHIVES: TournamentEditionArchive[] = [
  {
    id: 'archive_2024-25',
    editionKey: '2024-25',
    editionYear: '2024/2025',
    editionTitle: '2024/2025 National Debate Championship',
    tagline: '10th Anniversary Jubilee Edition — The Historic 15-County Convergence',
    theme: 'Decade of Discourse: Youth Agency, Democratic Governance, and National Renewal',
    championSchool: 'United Dawah Ummah High School',
    championCounty: 'Montserrado',
    runnerUpSchool: "St. Teresa's Convent High School",
    runnerUpCounty: 'Montserrado',
    bestSpeaker: 'Khadija Sheriff',
    bestSpeakerSchool: 'United Dawah Ummah High School',
    totalSchools: 48,
    totalCounties: 15,
    finalMotion: 'This House would establish a sovereign wealth fund financed by concession royalties to guarantee free public tertiary education.',
    finalScore: '5 - 2 (Split Panel Decision)',
    keyHighlights: [
      'Historic 10th Anniversary jubilee with 48 high schools across all 15 counties.',
      'Live nationwide radio and Facebook broadcast reaching 250,000+ citizens.',
      'Split 5-2 adjudication in the Grand Final between United Dawah Ummah and St. Teresa Convent.',
      'Khadija Sheriff crowned National Best Speaker with an average score of 88.4 points.'
    ],
    summary: 'The 10th Jubilee Edition concluded with an electrifying Grand Final at the Ministerial Complex in Congo Town. United Dawah Ummah emerged as National Champions after an intense policy debate on sovereign natural resource wealth management.',
    fixturesCount: 24,
    fixtures: [],
    standingsCount: 16,
    standings: [
      {
        schoolId: 'udu-hs',
        schoolName: 'United Dawah Ummah High School',
        county: 'Montserrado',
        zoneName: 'Zone 1 - Central Monrovia',
        matchesPlayed: 3,
        matchesWon: 3,
        matchesLost: 0,
        points: 9,
        ballotsWon: 9,
        ballotsLost: 0,
        totalSpeakerScore: 846,
        averageScore: 282,
        scoreDifferential: 42,
        qualificationStatus: 'county_champion',
        rank: 1
      },
      {
        schoolId: 'stc-hs',
        schoolName: "St. Teresa's Convent High School",
        county: 'Montserrado',
        zoneName: 'Zone 2 - Sinkor',
        matchesPlayed: 3,
        matchesWon: 3,
        matchesLost: 0,
        points: 9,
        ballotsWon: 8,
        ballotsLost: 1,
        totalSpeakerScore: 837,
        averageScore: 279,
        scoreDifferential: 38,
        qualificationStatus: 'qualified_next_round',
        rank: 2
      },
      {
        schoolId: 'bwi-hs',
        schoolName: 'Booker Washington Institute (BWI)',
        county: 'Margibi',
        zoneName: 'Kakata Zone 1',
        matchesPlayed: 3,
        matchesWon: 2,
        matchesLost: 1,
        points: 6,
        ballotsWon: 7,
        ballotsLost: 2,
        totalSpeakerScore: 820,
        averageScore: 273.3,
        scoreDifferential: 25,
        qualificationStatus: 'qualified_next_round',
        rank: 3
      },
      {
        schoolId: 'ganta-united',
        schoolName: 'Ganta United Methodist School',
        county: 'Nimba',
        zoneName: 'Ganta Zone 1',
        matchesPlayed: 3,
        matchesWon: 2,
        matchesLost: 1,
        points: 6,
        ballotsWon: 6,
        ballotsLost: 3,
        totalSpeakerScore: 815,
        averageScore: 271.7,
        scoreDifferential: 20,
        qualificationStatus: 'qualified_next_round',
        rank: 4
      }
    ],
    schoolsCount: 48,
    archivedAt: '2025-06-15T18:00:00.000Z',
    archivedBy: 'admin@youthforchangeliberia.org',
    status: 'Completed',
    backupFileSizeEstimate: '42.5 KB'
  },
  {
    id: 'archive_2023',
    editionKey: '2023',
    editionYear: '2023',
    editionTitle: '2023 National Debate Championship',
    tagline: 'Defending Electoral Integrity, Civic Literacy & Democratic Cohesion',
    theme: 'Electoral Literacy, Peaceful Democratic Transitions, and Peace Architecture',
    championSchool: 'Monrovia College',
    championCounty: 'Montserrado',
    runnerUpSchool: "St. Patrick's High School",
    runnerUpCounty: 'Montserrado',
    bestSpeaker: 'Jeremiah K. Flomo',
    bestSpeakerSchool: 'Monrovia College',
    totalSchools: 40,
    totalCounties: 15,
    finalMotion: 'This House believes that post-conflict stability requires constitutional term limits to be absolute and unalterable.',
    finalScore: '4 - 3 (Decided in Reply Speeches)',
    keyHighlights: [
      '40 high schools competed across all 15 counties during an election year.',
      'Youth civic pledges signed by all 200 student debaters prior to prelims.',
      'Monrovia College defeated St. Patrick High in a dramatic 4-3 split decision.'
    ],
    summary: 'Focused on election-year discourse, the 2023 Championship fostered constructive policy debates on governance, economic sovereignty, and civic literacy.',
    fixturesCount: 20,
    fixtures: [],
    standingsCount: 12,
    standings: [],
    schoolsCount: 40,
    archivedAt: '2023-11-20T16:00:00.000Z',
    archivedBy: 'secretariat@youthforchangeliberia.org',
    status: 'Completed',
    backupFileSizeEstimate: '38.2 KB'
  }
];

/**
 * Real-time subscription to all archived tournament editions.
 */
export function subscribeToEditionArchives(
  callback: (archives: TournamentEditionArchive[]) => void
) {
  try {
    const colRef = collection(db, ARCHIVES_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      const list: TournamentEditionArchive[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as TournamentEditionArchive);
      });

      // Merge with default historical archives if list is empty
      if (list.length === 0) {
        callback(DEFAULT_HISTORICAL_ARCHIVES);
      } else {
        // Deduplicate and sort descending by archive date or year
        const merged = [...list];
        DEFAULT_HISTORICAL_ARCHIVES.forEach(def => {
          if (!merged.some(m => m.editionKey === def.editionKey)) {
            merged.push(def);
          }
        });

        merged.sort((a, b) => (b.editionYear > a.editionYear ? 1 : -1));
        callback(merged);
      }
    }, (err) => {
      console.warn('Firestore archives sync note, using static backups:', err);
      callback(DEFAULT_HISTORICAL_ARCHIVES);
    });
  } catch (err) {
    console.warn('Error subscribing to edition archives:', err);
    callback(DEFAULT_HISTORICAL_ARCHIVES);
    return () => {};
  }
}

/**
 * Fetch all archived editions once.
 */
export async function getAllEditionArchives(): Promise<TournamentEditionArchive[]> {
  try {
    const colRef = collection(db, ARCHIVES_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      return DEFAULT_HISTORICAL_ARCHIVES;
    }
    const list: TournamentEditionArchive[] = [];
    snap.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as TournamentEditionArchive);
    });
    return list;
  } catch (err) {
    console.warn('Error fetching archives, fallback to default:', err);
    return DEFAULT_HISTORICAL_ARCHIVES;
  }
}

/**
 * End the current tournament edition:
 * 1. Takes all live active fixtures, standings, schools, and final awards.
 * 2. Saves full backup snapshot to `tournamentArchives/{archiveId}` in Firestore.
 * 3. Updates `debateEditions/{editionKey}` with status 'Completed'.
 * 4. Cleans out all live active fixtures from `tournamentFixtures` collection.
 * 5. Returns the completed archive package for immediate download or viewing.
 */
export async function archiveCurrentEdition(params: {
  editionYear: string;
  editionTitle: string;
  tagline?: string;
  theme?: string;
  championSchool: string;
  championCounty: string;
  runnerUpSchool: string;
  runnerUpCounty: string;
  bestSpeaker: string;
  bestSpeakerSchool: string;
  finalScore: string;
  finalMotion: string;
  keyHighlights: string[];
  summary: string;
  fixtures: TournamentFixture[];
  standings: SchoolTournamentStanding[];
  schools: ZonedSchool[];
  adminEmail?: string;
}): Promise<TournamentEditionArchive> {
  const editionKey = normalizeEditionKey(params.editionYear) || 'current-edition';
  const archiveId = `archive_${editionKey}`;
  const nowIso = new Date().toISOString();

  const archiveRecord: TournamentEditionArchive = {
    id: archiveId,
    editionKey,
    editionYear: params.editionYear.trim(),
    editionTitle: params.editionTitle.trim(),
    tagline: params.tagline || '',
    theme: params.theme || '',
    championSchool: params.championSchool.trim() || 'TBD Champion',
    championCounty: params.championCounty || 'Montserrado',
    runnerUpSchool: params.runnerUpSchool.trim() || 'TBD Runner-Up',
    runnerUpCounty: params.runnerUpCounty || 'Montserrado',
    bestSpeaker: params.bestSpeaker.trim() || 'TBD Best Speaker',
    bestSpeakerSchool: params.bestSpeakerSchool.trim() || '',
    finalScore: params.finalScore.trim() || '5 - 2',
    finalMotion: params.finalMotion.trim() || '',
    keyHighlights: params.keyHighlights || [],
    summary: params.summary.trim() || '',
    totalSchools: params.schools.length || params.standings.length || 32,
    totalCounties: 15,
    fixturesCount: params.fixtures.length,
    fixtures: params.fixtures,
    standingsCount: params.standings.length,
    standings: params.standings,
    schoolsCount: params.schools.length,
    schools: params.schools,
    archivedAt: nowIso,
    archivedBy: params.adminEmail || 'admin@youthforchangeliberia.org',
    status: 'Completed',
    backupFileSizeEstimate: `${Math.round(JSON.stringify(params).length / 1024)} KB`
  };

  // 1. Save archive record into Firestore
  const archiveDocRef = doc(db, ARCHIVES_COLLECTION, archiveId);
  await setDoc(archiveDocRef, archiveRecord, { merge: true });

  // 2. Update Debate Edition in debateEditions collection
  const editionDocRef = doc(db, EDITIONS_COLLECTION, editionKey);
  await setDoc(editionDocRef, {
    year: params.editionYear,
    title: params.editionTitle,
    tagline: params.tagline || '',
    theme: params.theme || '',
    championSchool: params.championSchool,
    championCounty: params.championCounty,
    runnerUpSchool: params.runnerUpSchool,
    runnerUpCounty: params.runnerUpCounty,
    bestSpeaker: params.bestSpeaker,
    bestSpeakerSchool: params.bestSpeakerSchool,
    totalSchools: archiveRecord.totalSchools,
    totalCounties: 15,
    finalMotion: params.finalMotion,
    finalScore: params.finalScore,
    keyHighlights: params.keyHighlights,
    summary: params.summary,
    status: 'Completed',
    updatedAt: nowIso
  }, { merge: true });

  // 3. Remove old live active tournament fixtures from tournamentFixtures collection
  await clearActiveTournamentFixtures();

  // 4. Update tournamentSettings/publicReveal to reflect that old edition has completed
  try {
    const settingsRef = doc(db, SETTINGS_COLLECTION, 'publicReveal');
    await setDoc(settingsRef, {
      isRevealLive: false,
      announcementText: `The ${params.editionYear} National Debate Championship has officially concluded. Congratulations to ${params.championSchool} (${params.championCounty}) on being crowned National Champions! Official records are preserved in the National Hall of Records.`,
      currentEdition: params.editionYear,
      concludedAt: nowIso
    }, { merge: true });
  } catch (err) {
    console.warn('Note updating tournamentSettings:', err);
  }

  return archiveRecord;
}

/**
 * Remove all active tournament fixtures from the live database.
 */
export async function clearActiveTournamentFixtures(): Promise<number> {
  try {
    const colRef = collection(db, FIXTURES_COLLECTION);
    const snap = await getDocs(colRef);
    if (snap.empty) return 0;

    let count = 0;
    const batch = writeBatch(db);
    snap.forEach((docSnap) => {
      batch.delete(doc(db, FIXTURES_COLLECTION, docSnap.id));
      count++;
    });

    await batch.commit();
    return count;
  } catch (err) {
    console.warn('Error clearing active fixtures:', err);
    return 0;
  }
}

/**
 * Initialize a brand-new tournament edition from fresh:
 * 1. Creates new debateEditions doc with status 'Upcoming' or 'In Progress'.
 * 2. Clears out all old active tournament fixtures.
 * 3. Sets tournamentSettings with new edition title & year.
 * 4. Opens the public school registration window across all 15 counties.
 */
export async function initializeFreshEdition(params: {
  year: string;
  title: string;
  theme?: string;
  tagline?: string;
  grandVenue?: string;
  adminEmail?: string;
  openRegistrationImmediately?: boolean;
}): Promise<DebateEdition> {
  const cleanYear = params.year.trim();
  const editionKey = normalizeEditionKey(cleanYear) || `edition-${Date.now()}`;
  const nowIso = new Date().toISOString();

  // 1. Create or overwrite the new edition in debateEditions
  const newEditionData: DebateEdition = {
    id: editionKey,
    year: cleanYear,
    title: params.title.trim(),
    tagline: params.tagline?.trim() || 'Empowering 15-County Forensics, Critical Discourse & Civic Leadership',
    theme: params.theme?.trim() || 'Youth Leadership, Innovation & Nation-Building',
    championSchool: 'TBD (Season Starting)',
    championCounty: 'TBD',
    runnerUpSchool: 'TBD',
    runnerUpCounty: 'TBD',
    bestSpeaker: 'TBD',
    bestSpeakerSchool: 'TBD',
    totalSchools: 0,
    totalCounties: 15,
    finalMotion: 'TBD — Announced Ahead of Grand Final',
    finalScore: 'Pending',
    keyHighlights: [
      `Registration officially initiated for the ${cleanYear} season.`,
      'School delegations submitting rosters across all 15 Liberian counties.',
      'Three-stage zonal prelims, county championships, and national finals.'
    ],
    summary: `The ${cleanYear} National Debate Championship brings together high school debaters from all 15 counties to deliberate on paramount national policy, economic, and technological challenges.`,
    image: '/debate.jpeg',
    semiFinalists: [],
    notableMotions: [],
    status: 'In Progress',
    authorUid: params.adminEmail || 'admin',
    createdAt: nowIso,
    updatedAt: nowIso
  };

  const edDocRef = doc(db, EDITIONS_COLLECTION, editionKey);
  await setDoc(edDocRef, newEditionData, { merge: true });

  // 2. Clear out lingering live active fixtures so the board is clean for the new edition
  await clearActiveTournamentFixtures();

  // 3. Update tournamentSettings/publicReveal with new season configuration
  const settingsRef = doc(db, SETTINGS_COLLECTION, 'publicReveal');
  await setDoc(settingsRef, {
    title: `${newEditionData.title} — Official Pairings & Draw`,
    revealDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    isRevealLive: false,
    announcementText: `Welcome to the ${cleanYear} National Debate Championship! Public school registration is OPEN. The Secretariat is currently compiling county rosters and preparing the algorithmic anti-bias zonal draw.`,
    grandVenue: params.grandVenue || 'Official Grand Venue: E.J.S. Ministerial Complex Auditorium, Congo Town',
    broadcastChannel: 'LNTV / ELBC 99.9 FM & Youth For Change Official Facebook Live',
    coordinatorHelpline: '+231 770 123 456 / +231 886 789 012',
    currentEdition: cleanYear
  }, { merge: true });

  // 4. Open School Registration window in programStatuses/debate
  if (params.openRegistrationImmediately !== false) {
    try {
      const statusRef = doc(db, PROGRAM_STATUS_COLLECTION, 'debate');
      await setDoc(statusRef, {
        programId: 'debate',
        title: 'National High School Debate Championship',
        isOpen: true,
        statusLabel: 'Official Registration Open',
        openNotice: `Delegation registration is currently OPEN for the ${cleanYear} National Debate Championship across all 15 Liberian counties.`,
        closedNotice: 'School registration has concluded for this round.',
        seasonYear: cleanYear,
        updatedAt: nowIso,
        updatedBy: params.adminEmail || 'admin'
      }, { merge: true });
    } catch (err) {
      console.warn('Note setting program status for debate:', err);
    }
  }

  return newEditionData;
}

/**
 * 1-Click Pull Out: Download full JSON backup file for any edition archive.
 */
export function exportEditionArchiveJson(archive: TournamentEditionArchive) {
  const jsonStr = JSON.stringify(archive, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LNDC-${archive.editionKey}-Archive-Backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 1-Click Pull Out: Download CSV match ledger for any edition archive.
 */
export function exportEditionArchiveCsv(archive: TournamentEditionArchive) {
  const headers = [
    'Match ID',
    'Round',
    'County',
    'Stage',
    'Affirmative (Team A)',
    'Negative (Team B)',
    'Winner',
    'Decision / Score',
    'Ballots Team A',
    'Ballots Team B',
    'Motion',
    'Venue',
    'Match Date',
    'Match Time',
    'Anti-Bias Hash'
  ];

  const rows = (archive.fixtures || []).map((f) => [
    `"${f.id}"`,
    `"${f.roundName || ''}"`,
    `"${f.county || ''}"`,
    `"${f.stage || ''}"`,
    `"${f.teamA?.schoolName || ''}"`,
    `"${f.teamB?.schoolName || ''}"`,
    `"${f.winnerName || 'Undecided'}"`,
    `"${f.scoreDifferential || 'Pending'}"`,
    f.teamA?.ballots || 0,
    f.teamB?.ballots || 0,
    `"${(f.motion || '').replace(/"/g, '""')}"`,
    `"${f.venue || ''}"`,
    `"${f.matchDate || ''}"`,
    `"${f.matchTime || ''}"`,
    `"${f.antiBiasHash || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LNDC-${archive.editionKey}-Matches-Ledger.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Restore an archived edition's fixtures back into the active tournament view.
 */
export async function restoreEditionBackupToLive(archive: TournamentEditionArchive): Promise<number> {
  const batch = writeBatch(db);
  let count = 0;

  for (const fix of archive.fixtures || []) {
    const docRef = doc(db, FIXTURES_COLLECTION, fix.id);
    batch.set(docRef, fix, { merge: true });
    count++;
  }

  if (count > 0) {
    await batch.commit();
  }

  // Update tournamentSettings to point to this edition
  const settingsRef = doc(db, SETTINGS_COLLECTION, 'publicReveal');
  await setDoc(settingsRef, {
    currentEdition: archive.editionYear,
    isRevealLive: true,
    announcementText: `Viewing tournament matches for ${archive.editionTitle}.`
  }, { merge: true });

  return count;
}
