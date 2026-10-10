import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';
import { ProgramStatus } from '../types';

const PROGRAM_STATUS_CACHE_KEY = 'yfc_program_statuses_cache';

export const DEFAULT_PROGRAM_STATUSES: Record<string, ProgramStatus> = {
  'debate-prog': {
    id: 'debate-prog',
    programId: 'debate-prog',
    title: 'National Debate Championship',
    subtitle: 'Liberia’s Premier High School Forensics & Oratory League',
    isOpen: true,
    statusLabel: 'Open Now, Register',
    openNotice: 'Official school registration for the 2024/25 National Debate Championship is OPEN across all 15 Liberian counties. Submit school accreditation and speaker delegations now.',
    closedNotice: 'Registration for the National Debate Championship is currently closed by the Secretariat.',
    registrationDeadline: 'October 30, 2025',
    registrationDeadlineDate: '2025-10-30',
    seasonYear: '2024/2025',
    targetAudience: 'Accredited Senior High Schools & Forensics Teams'
  },
  'stem-prog': {
    id: 'stem-prog',
    programId: 'stem-prog',
    title: 'National STEM Challenge',
    subtitle: 'Grassroots Scientific Engineering & Clean-Tech Expo',
    isOpen: false,
    statusLabel: 'Closed - Not Open Yet',
    openNotice: 'National STEM Challenge submissions are open! Submit student engineering prototypes and project proposals.',
    closedNotice: 'The National STEM Challenge registration is currently closed. Regional competition dates and project tracks are being finalized by the Secretariat. Check back soon.',
    registrationDeadline: 'TBD (Announced Soon)',
    seasonYear: '2024/2025',
    targetAudience: 'High School STEM Teams & Student Innovators'
  },
  'mentorship': {
    id: 'mentorship',
    programId: 'mentorship',
    title: 'Youth Mentorship & Diaspora Scholars Exchange',
    subtitle: 'Connecting Aspiring High Schoolers with Global Leaders',
    isOpen: false,
    statusLabel: 'Closed - Not Open Yet',
    openNotice: 'Applications are open for the Youth Mentorship & Diaspora Scholars Exchange fellowship.',
    closedNotice: 'Youth Mentorship cohort applications are currently closed. The Secretariat will open the next scholar matching round in the upcoming months.',
    registrationDeadline: 'TBD',
    seasonYear: '2024/2025',
    targetAudience: 'High School Seniors, Alumni & Student Scholars'
  },
  'academic': {
    id: 'academic',
    programId: 'academic',
    title: 'Academic Empowerment & High School Quizzing',
    subtitle: 'Library Drives, Reading Clinics & WASSCE Prep Clinics',
    isOpen: false,
    statusLabel: 'Closed - Not Open Yet',
    openNotice: 'School registration for Academic Quizzing & WASSCE clinics is now open.',
    closedNotice: 'Academic Quizzing and Reading Clinic registration is currently closed. Follow official Secretariat dispatches for upcoming dates.',
    registrationDeadline: 'TBD',
    seasonYear: '2024/2025',
    targetAudience: 'Junior & Senior High Schools Across Liberia'
  },
  'leadership-prog': {
    id: 'leadership-prog',
    programId: 'leadership-prog',
    title: 'Youth Leadership & Civic Action Academy',
    subtitle: 'Building Ethical Public Servants & Community Organizers',
    isOpen: false,
    statusLabel: 'Closed - Not Open Yet',
    openNotice: 'Civic Leadership Fellowship applications are currently active.',
    closedNotice: 'Youth Leadership Academy registration is currently closed. The current cohort is underway.',
    registrationDeadline: 'TBD',
    seasonYear: '2024/2025',
    targetAudience: 'Emerging Youth Leaders & Student Council Executives'
  }
};

function getLocalProgramStatusCache(): Record<string, ProgramStatus> {
  try {
    const raw = localStorage.getItem(PROGRAM_STATUS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...DEFAULT_PROGRAM_STATUSES, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Error reading program status local cache', e);
  }
  return { ...DEFAULT_PROGRAM_STATUSES };
}

function setLocalProgramStatusCache(map: Record<string, ProgramStatus>) {
  try {
    localStorage.setItem(PROGRAM_STATUS_CACHE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Error saving program status local cache', e);
  }
}

/**
 * Subscribe to real-time program status updates from Firestore.
 * Overlays Firestore docs onto defaults, and syncs to localStorage.
 */
export function subscribeToProgramStatuses(
  callback: (statusesMap: Record<string, ProgramStatus>, statusesList: ProgramStatus[]) => void
) {
  // Start with local cache or defaults immediately
  const initialMap = getLocalProgramStatusCache();
  const initialList = Object.values(initialMap);
  callback(initialMap, initialList);

  try {
    if (!db) {
      return () => {};
    }

    const colRef = collection(db, 'programStatuses');
    return onSnapshot(colRef, (snapshot) => {
      const mergedMap: Record<string, ProgramStatus> = { ...DEFAULT_PROGRAM_STATUSES };

      if (!snapshot.empty) {
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const programId = docSnap.id;
          const baseline = DEFAULT_PROGRAM_STATUSES[programId] || {
            id: programId,
            programId: programId,
            title: data.title || programId,
            isOpen: false
          };

          mergedMap[programId] = {
            ...baseline,
            ...data,
            id: programId,
            programId: programId,
            isOpen: typeof data.isOpen === 'boolean' ? data.isOpen : baseline.isOpen
          };
        });
      }

      setLocalProgramStatusCache(mergedMap);
      const list = Object.values(mergedMap);
      callback(mergedMap, list);
    }, (error) => {
      console.warn('Error subscribing to programStatuses:', error);
      // Keep local cache if error
      const fallbackMap = getLocalProgramStatusCache();
      callback(fallbackMap, Object.values(fallbackMap));
    });
  } catch (err) {
    console.warn('[programStatusService] Could not establish Firestore listener:', err);
    return () => {};
  }
}

/**
 * Update a specific program status in Firestore
 */
export async function updateProgramStatus(
  programId: string,
  updates: Partial<ProgramStatus>,
  adminEmail?: string
): Promise<void> {
  const docRef = doc(db, 'programStatuses', programId);
  const existing = DEFAULT_PROGRAM_STATUSES[programId];
  
  const payload = {
    ...updates,
    programId,
    id: programId,
    title: updates.title || existing?.title || programId,
    updatedAt: new Date().toISOString(),
    updatedBy: adminEmail || 'Admin Secretariat'
  };

  await setDoc(docRef, payload, { merge: true });

  // Optimistically update local cache
  const local = getLocalProgramStatusCache();
  local[programId] = {
    ...(local[programId] || existing || { id: programId, programId, title: programId, isOpen: false }),
    ...payload
  };
  setLocalProgramStatusCache(local);
}

/**
 * Batch toggle all programs (e.g. close all, or open debate only)
 */
export async function batchSetAllProgramStatuses(
  statusUpdates: Record<string, boolean>,
  adminEmail?: string
): Promise<void> {
  const batch = writeBatch(db);
  const now = new Date().toISOString();
  const local = getLocalProgramStatusCache();

  for (const [programId, isOpen] of Object.entries(statusUpdates)) {
    const docRef = doc(db, 'programStatuses', programId);
    const existing = local[programId] || DEFAULT_PROGRAM_STATUSES[programId];
    const statusLabel = isOpen ? 'Open Now, Register' : 'Closed - Not Open Yet';

    const data = {
      programId,
      isOpen,
      statusLabel,
      updatedAt: now,
      updatedBy: adminEmail || 'Admin Secretariat'
    };

    batch.set(docRef, data, { merge: true });

    if (local[programId]) {
      local[programId].isOpen = isOpen;
      local[programId].statusLabel = statusLabel;
    }
  }

  await batch.commit();
  setLocalProgramStatusCache(local);
}

/**
 * Helper to check if a program is open
 */
export function isProgramOpen(programId: string, statusesMap: Record<string, ProgramStatus>): boolean {
  if (statusesMap[programId]) {
    return statusesMap[programId].isOpen;
  }
  return DEFAULT_PROGRAM_STATUSES[programId]?.isOpen ?? false;
}

/**
 * Helper to get program status with fallback
 */
export function getProgramStatus(programId: string, statusesMap: Record<string, ProgramStatus>): ProgramStatus {
  return statusesMap[programId] || DEFAULT_PROGRAM_STATUSES[programId] || {
    id: programId,
    programId: programId,
    title: programId,
    isOpen: false,
    statusLabel: 'Closed - Not Open Yet',
    closedNotice: 'Registration for this program is currently closed by the Secretariat.'
  };
}
