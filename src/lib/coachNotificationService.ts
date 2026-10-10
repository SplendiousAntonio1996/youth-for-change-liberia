import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  updateDoc 
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  TournamentFixture, 
  CoachRegistration, 
  CoachNotificationLog,
  ZonedSchool 
} from '../types/tournament';
import { ACCREDITED_BASE_SCHOOLS } from '../data/tournamentZoningData';
import { InvolvementApplication } from '../types';

export interface CoachContactInfo {
  schoolName: string;
  coachName: string;
  email: string;
  phone: string;
  county: string;
  source: 'database' | 'registration' | 'application';
}

/**
 * Resolves coach contact details for a specific school name across:
 * 1. Live coach registrations (Firestore)
 * 2. School applications (Firestore)
 * 3. Accredited base school roster
 */
export function resolveCoachForSchool(
  schoolInput: string | { schoolName: string; county?: string },
  liveRegistrations: CoachRegistration[] = [],
  schoolApplications: InvolvementApplication[] = []
): CoachContactInfo {
  const targetSchoolName = typeof schoolInput === 'string' 
    ? schoolInput 
    : (schoolInput?.schoolName || '');
  const cleanName = targetSchoolName.trim().toLowerCase();

  // 1. Check live coach registrations
  const liveMatch = liveRegistrations.find(r => 
    r.schoolName.toLowerCase().trim() === cleanName ||
    r.schoolName.toLowerCase().includes(cleanName) ||
    cleanName.includes(r.schoolName.toLowerCase())
  );
  if (liveMatch && liveMatch.email) {
    return {
      schoolName: liveMatch.schoolName,
      coachName: liveMatch.coachName,
      email: liveMatch.email,
      phone: liveMatch.phone || '+231 777 000 000',
      county: liveMatch.county,
      source: 'registration'
    };
  }

  // 2. Check school applications
  const appMatch = schoolApplications.find(a => 
    (a.type === 'school' || a.schoolOrOrg) && (
      (a.schoolOrOrg && a.schoolOrOrg.toLowerCase().trim() === cleanName) ||
      (a.schoolOrOrg && a.schoolOrOrg.toLowerCase().includes(cleanName)) ||
      a.name.toLowerCase().trim() === cleanName ||
      a.name.toLowerCase().includes(cleanName)
    )
  );
  if (appMatch && appMatch.email) {
    return {
      schoolName: appMatch.schoolOrOrg || appMatch.name,
      coachName: appMatch.principalOrHead || appMatch.name,
      email: appMatch.email,
      phone: appMatch.phone || '+231 777 000 000',
      county: appMatch.county,
      source: 'application'
    };
  }

  // 3. Fallback to accredited base schools roster
  const baseMatch = ACCREDITED_BASE_SCHOOLS.find(s => 
    s.name.toLowerCase().trim() === cleanName ||
    s.name.toLowerCase().includes(cleanName) ||
    cleanName.includes(s.name.toLowerCase())
  );
  if (baseMatch) {
    return {
      schoolName: baseMatch.name,
      coachName: baseMatch.contactPerson || 'Lead Forensics Advisor',
      email: baseMatch.contactEmail || `coach.${baseMatch.id}@youthforchange.org.lr`,
      phone: baseMatch.contactPhone || '+231 777 000 000',
      county: baseMatch.county,
      source: 'database'
    };
  }

  // Default synthetic fallback
  const slug = cleanName.replace(/[^a-z0-9]/g, '').slice(0, 15) || 'school';
  return {
    schoolName: targetSchoolName,
    coachName: `${targetSchoolName} Coach`,
    email: `coach.${slug}@youthforchange.org.lr`,
    phone: '+231 777 000 000',
    county: 'Montserrado',
    source: 'database'
  };
}

/**
 * Register a coach for real-time fixture updates in Firestore
 */
export async function registerCoachForAlerts(registration: Omit<CoachRegistration, 'id'>): Promise<string> {
  const colRef = collection(db, 'coachRegistrations');
  const coachDoc = doc(colRef);
  const data: CoachRegistration = {
    ...registration,
    id: coachDoc.id,
    registeredAt: registration.registeredAt || new Date().toISOString(),
    status: registration.status || 'active'
  };
  await setDoc(coachDoc, data);
  return coachDoc.id;
}

/**
 * Subscribe to live coach registrations
 */
export function subscribeToCoachRegistrations(
  onUpdate: (registrations: CoachRegistration[]) => void,
  onError?: (err: any) => void
) {
  try {
    if (!db) {
      onUpdate([]);
      return () => {};
    }
    const colRef = collection(db, 'coachRegistrations');
    const q = query(colRef, orderBy('registeredAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const list: CoachRegistration[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as CoachRegistration);
      });
      onUpdate(list);
    }, (err) => {
      console.warn('Could not subscribe to coachRegistrations:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('[coachNotificationService] Failed to establish registrations listener:', err);
    onUpdate([]);
    return () => {};
  }
}

/**
 * Subscribe to coach notification audit logs
 */
export function subscribeToCoachNotificationLogs(
  onUpdate: (logs: CoachNotificationLog[]) => void,
  onError?: (err: any) => void
) {
  try {
    if (!db) {
      onUpdate([]);
      return () => {};
    }
    const colRef = collection(db, 'coachNotificationLogs');
    const q = query(colRef, orderBy('dispatchedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const list: CoachNotificationLog[] = [];
      snap.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as CoachNotificationLog);
      });
      onUpdate(list);
    }, (err) => {
      console.warn('Could not subscribe to coachNotificationLogs:', err);
      if (onError) onError(err);
    });
  } catch (err) {
    console.warn('[coachNotificationService] Failed to establish logs listener:', err);
    onUpdate([]);
    return () => {};
  }
}

/**
 * Dispatch an official fixture confirmation alert to a specific coach
 */
export async function sendCoachFixtureAlert(params: {
  fixture: TournamentFixture;
  schoolName: string;
  opponentSchool: string;
  assignedSide: string;
  coachName: string;
  coachEmail: string;
  coachPhone?: string;
  adminEmail?: string;
  customNotes?: string;
}): Promise<{ success: boolean; mode: string; messageId?: string; error?: string }> {
  const payload = {
    fixtureId: params.fixture.id,
    roundName: params.fixture.roundName,
    county: params.fixture.county,
    stage: params.fixture.stage,
    program: params.fixture.program,
    schoolName: params.schoolName,
    coachName: params.coachName,
    coachEmail: params.coachEmail,
    coachPhone: params.coachPhone,
    opponentSchool: params.opponentSchool,
    assignedSide: params.assignedSide,
    matchDate: params.fixture.matchDate,
    matchTime: params.fixture.matchTime,
    venue: params.fixture.venue,
    motion: params.fixture.motion,
    motionInfoSlide: params.fixture.motionInfoSlide,
    motionDomain: params.fixture.motionDomain,
    antiBiasHash: params.fixture.antiBiasHash,
    adjudicators: params.fixture.adjudicators,
    customNotes: params.customNotes
  };

  try {
    const resp = await fetch('/api/notify-coach-fixture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();

    // Log the notification in Firestore
    try {
      const logCol = collection(db, 'coachNotificationLogs');
      const logDoc = doc(logCol);
      const logData: CoachNotificationLog = {
        id: logDoc.id,
        fixtureId: params.fixture.id,
        roundName: params.fixture.roundName,
        county: params.fixture.county,
        stage: params.fixture.stage,
        schoolName: params.schoolName,
        coachName: params.coachName,
        recipientEmail: params.coachEmail,
        recipientPhone: params.coachPhone,
        sideAssigned: params.assignedSide,
        matchDetails: `${params.schoolName} (${params.assignedSide}) vs. ${params.opponentSchool} • ${params.fixture.matchDate} at ${params.fixture.matchTime} • ${params.fixture.venue}`,
        subject: `🏆 Official Match Confirmation: ${params.schoolName} vs. ${params.opponentSchool} — ${params.fixture.roundName}`,
        dispatchedAt: new Date().toISOString(),
        status: data.success ? 'sent' : 'failed',
        adminEmail: params.adminEmail || 'admin@youthforchange.org.lr',
        deliveryMode: data.mode === 'smtp' ? 'smtp' : 'dispatch_service',
        error: data.error
      };
      await setDoc(logDoc, logData);
    } catch (logErr) {
      console.warn('Could not record coachNotificationLog in Firestore:', logErr);
    }

    return data;
  } catch (err: any) {
    console.error('sendCoachFixtureAlert network error:', err);
    return {
      success: false,
      mode: 'dispatch_service',
      error: err.message
    };
  }
}

/**
 * Preview Coach Fixture Alert HTML
 */
export async function previewCoachFixtureEmail(params: {
  fixture: TournamentFixture;
  schoolName: string;
  opponentSchool: string;
  assignedSide: string;
  coachName: string;
  coachEmail: string;
  coachPhone?: string;
  customNotes?: string;
}): Promise<{ success: boolean; preview?: { subject: string; html: string; text: string }; error?: string }> {
  try {
    const resp = await fetch('/api/preview-coach-fixture-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fixtureId: params.fixture.id,
        roundName: params.fixture.roundName,
        county: params.fixture.county,
        stage: params.fixture.stage,
        program: params.fixture.program,
        schoolName: params.schoolName,
        coachName: params.coachName,
        coachEmail: params.coachEmail,
        coachPhone: params.coachPhone,
        opponentSchool: params.opponentSchool,
        assignedSide: params.assignedSide,
        matchDate: params.fixture.matchDate,
        matchTime: params.fixture.matchTime,
        venue: params.fixture.venue,
        motion: params.fixture.motion,
        motionInfoSlide: params.fixture.motionInfoSlide,
        motionDomain: params.fixture.motionDomain,
        antiBiasHash: params.fixture.antiBiasHash,
        adjudicators: params.fixture.adjudicators,
        customNotes: params.customNotes
      })
    });

    return await resp.json();
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
