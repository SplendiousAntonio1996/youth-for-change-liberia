import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';
import { DebateMotion } from '../types/tournament';
import { ACCREDITED_DEBATE_MOTIONS } from '../data/tournamentZoningData';

const MOTION_BANK_CACHE_KEY = 'yfc_motion_bank_cache';

export const COMPREHENSIVE_OFFICIAL_MOTIONS: DebateMotion[] = [
  ...ACCREDITED_DEBATE_MOTIONS,
  {
    id: 'mot-09',
    motionText: 'This House Would Abolish All Customary Land Concessions Awarded Without 75% Prior Informed Consent by Rural Host Communities.',
    domain: 'Governance & Constitution',
    infoSlide: 'The Land Rights Act of 2018 established statutory community land ownership, yet historical agricultural and logging concessions continue to spark resource disputes in rural Liberian counties.',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'Zonal Prelims',
    addedBy: 'National Secretariat'
  },
  {
    id: 'mot-10',
    motionText: 'This House Believes That Developing Nations Should Decriminalize and Regulate Artisanal Gold & Diamond Mining Rather Than Enforcing Military Taskforce Bans.',
    domain: 'Economics & Resource Rights',
    infoSlide: 'Artisanal mining sustains tens of thousands of rural Liberian families across Nimba, Gbarpolu, and Grand Cape Mount, yet causes river sedimentation and revenue leakages.',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'Zonal Prelims',
    addedBy: 'National Secretariat'
  },
  {
    id: 'mot-11',
    motionText: 'This House Would Enact Compulsory High School Civics and Constitution Literacy Curriculum as a Mandatory Prerequisite for WASSCE Registration.',
    domain: 'Education & Gender',
    infoSlide: 'National surveys indicate youth civic disengagement and misinformation vulnerability in electoral processes, arguing for mandatory foundational constitutional literacy in secondary education.',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'Zonal Prelims',
    addedBy: 'National Secretariat'
  },
  {
    id: 'mot-12',
    motionText: 'This House Would Impose a 25% Sovereign Luxury Duty on All Imported Refined Fuel to Exclusively Subsidize Rural High School Electric Bus Transit.',
    domain: 'Economics & Resource Rights',
    infoSlide: 'Rural high school students in Rivercess, Sinoe, and Lofa walk upwards of 8-12 kilometers daily to access secondary school campuses, impeding attendance and girls retention.',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'Zonal Prelims',
    addedBy: 'National Secretariat'
  },
  {
    id: 'mot-13',
    motionText: 'This House Would Prohibit Transnational Concession Companies From Operating Private Security Units and Mandate 100% National Police Oversight.',
    domain: 'Governance & Constitution',
    infoSlide: 'Concession communities have raised concerns over human rights violations and arbitrary detentions by corporate private security forces on plantation perimeters.',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'Next Round Knockout',
    addedBy: 'National Secretariat'
  },
  {
    id: 'mot-14',
    motionText: 'This House Believes That West African Nations Should Boycott Bilateral Carbon Credit Offsets With Developed Nations Until Historic Global Emission Reparations Are Granted.',
    domain: 'STEM & Climate',
    infoSlide: 'The Global North is responsible for over 80% of historical cumulative greenhouse emissions, while West Africa bears disproportionate flooding, coastal erosion, and agricultural disruptions.',
    preparationType: 'Impromptu Motion (1-Hour Release)',
    roundDesignation: 'Next Round Knockout',
    addedBy: 'National Secretariat'
  },
  {
    id: 'mot-15',
    motionText: 'This House Would Require 50% of All State Procurement Contracts to Be Awarded Exclusively to Liberian Youth-Owned Enterprises Under Age 35.',
    domain: 'Economics & Resource Rights',
    infoSlide: 'Youth unemployment in Liberia hovers above 60% in urban and peri-urban centers, with public procurement representing the largest single market expenditure in the national budget.',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'County Final',
    addedBy: 'National Secretariat'
  },
  {
    id: 'mot-16',
    motionText: 'This House, as ECOWAS, Would Authorize Direct Multilateral Humanitarian and Military Interventions to Restore Constitutional Order Following Military Coups.',
    domain: 'International Relations',
    infoSlide: 'Recent democratic backsliding and military takeovers across the Sahel and West African sub-region have triggered intense debate over regional sovereignty versus democracy defense.',
    preparationType: 'Impromptu Motion (1-Hour Release)',
    roundDesignation: 'National Championship',
    addedBy: 'National Secretariat'
  },
  {
    id: 'mot-17',
    motionText: 'This House Supports Full Judicial Automation and AI Evidence Analysis in Resolving Historical Land Boundary Disputes Across Rural Counties.',
    domain: 'STEM & Climate',
    infoSlide: 'Over 65% of civil court backlogs in Liberia stem from overlapping tribal boundary claims and duplicate deed registries dating back several decades.',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'Next Round Knockout',
    addedBy: 'National Secretariat'
  },
  {
    id: 'mot-18',
    motionText: 'This House Believes That Developing Democracies Should Establish Dedicated Specialized Anti-Corruption Courts With Non-Jury Adjudication Panels for High-Level Public Officials.',
    domain: 'Governance & Constitution',
    infoSlide: 'Public integrity investigations often face prolonged judicial delays and alleged jury tampering in standard criminal court circuits.',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'County Final',
    addedBy: 'National Secretariat'
  }
];

function getLocalMotionCache(): DebateMotion[] {
  try {
    const raw = localStorage.getItem(MOTION_BANK_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading motion bank cache', e);
  }
  return COMPREHENSIVE_OFFICIAL_MOTIONS;
}

function saveLocalMotionCache(motions: DebateMotion[]) {
  try {
    localStorage.setItem(MOTION_BANK_CACHE_KEY, JSON.stringify(motions));
  } catch (e) {
    console.warn('Error saving motion bank cache', e);
  }
}

export function subscribeToMotionBank(callback: (motions: DebateMotion[]) => void) {
  callback(getLocalMotionCache());

  try {
    const motionsRef = collection(db, 'motionBank');
    const unsubscribe = onSnapshot(motionsRef, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreMotions: DebateMotion[] = [];
        snapshot.forEach((docSnap) => {
          firestoreMotions.push({ id: docSnap.id, ...docSnap.data() } as DebateMotion);
        });

        // Merge firestore with default motions so bank is always comprehensively stocked
        const seenIds = new Set(firestoreMotions.map(m => m.id));
        const merged = [
          ...firestoreMotions,
          ...COMPREHENSIVE_OFFICIAL_MOTIONS.filter(m => !seenIds.has(m.id))
        ];
        
        saveLocalMotionCache(merged);
        callback(merged);
      } else {
        // Bank is empty in Firestore; use full seed list
        callback(COMPREHENSIVE_OFFICIAL_MOTIONS);
      }
    }, (error) => {
      console.warn('Firestore motion bank subscription note:', error);
      callback(getLocalMotionCache());
    });

    return unsubscribe;
  } catch (e) {
    console.warn('Firestore motion bank unavailable:', e);
    return () => {};
  }
}

export async function addMotionToBank(
  motion: Omit<DebateMotion, 'id'>, 
  adminEmail?: string
): Promise<DebateMotion> {
  const newId = `mot-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const fullMotion: DebateMotion = {
    ...motion,
    id: newId,
    addedBy: adminEmail || 'Tournament Administrator',
    createdAt: new Date().toISOString()
  };

  const current = getLocalMotionCache();
  const updated = [fullMotion, ...current];
  saveLocalMotionCache(updated);

  try {
    await setDoc(doc(db, 'motionBank', newId), fullMotion);
  } catch (e) {
    console.warn('Could not persist motion to Firestore, stored locally', e);
  }

  return fullMotion;
}

export async function updateMotionInBank(
  motionId: string, 
  updates: Partial<DebateMotion>
): Promise<void> {
  const current = getLocalMotionCache();
  const updated = current.map(m => m.id === motionId ? { ...m, ...updates } : m);
  saveLocalMotionCache(updated);

  try {
    await setDoc(doc(db, 'motionBank', motionId), updates, { merge: true });
  } catch (e) {
    console.warn('Firestore motion update note:', e);
  }
}

export async function deleteMotionFromBank(motionId: string): Promise<void> {
  const current = getLocalMotionCache();
  const updated = current.filter(m => m.id !== motionId);
  saveLocalMotionCache(updated);

  try {
    await deleteDoc(doc(db, 'motionBank', motionId));
  } catch (e) {
    console.warn('Firestore motion deletion note:', e);
  }
}

export async function seedMotionBankDefaults(adminEmail?: string): Promise<number> {
  try {
    const batch = writeBatch(db);
    let count = 0;
    for (const motion of COMPREHENSIVE_OFFICIAL_MOTIONS) {
      const docRef = doc(db, 'motionBank', motion.id);
      batch.set(docRef, {
        ...motion,
        addedBy: adminEmail || 'National Secretariat Seed',
        createdAt: new Date().toISOString()
      }, { merge: true });
      count++;
    }
    await batch.commit();
    saveLocalMotionCache(COMPREHENSIVE_OFFICIAL_MOTIONS);
    return count;
  } catch (e) {
    console.warn('Firestore motion batch seed note:', e);
    saveLocalMotionCache(COMPREHENSIVE_OFFICIAL_MOTIONS);
    return COMPREHENSIVE_OFFICIAL_MOTIONS.length;
  }
}

/**
 * Randomly pick a motion from the motion bank, taking into account
 * stage/round preferences and avoiding recently used motions.
 */
export function drawRandomMotionFromBank(
  bank: DebateMotion[], 
  roundStage?: string, 
  usedIds: string[] = []
): DebateMotion {
  if (!bank || bank.length === 0) {
    return COMPREHENSIVE_OFFICIAL_MOTIONS[0];
  }

  // Filter out already used motions if possible
  let pool = bank.filter(m => !usedIds.includes(m.id));
  if (pool.length === 0) {
    pool = bank; // Reset if all used
  }

  // If stage provided, prefer matching round designation
  if (roundStage) {
    const stageMatch = pool.filter(m => {
      const des = (m.roundDesignation || '').toLowerCase();
      const r = roundStage.toLowerCase();
      if (r.includes('prelim') || r.includes('zone')) {
        return des.includes('prelim') || des.includes('zonal');
      }
      if (r.includes('county final') || r.includes('final')) {
        return des.includes('county') || des.includes('final') || des.includes('knockout');
      }
      if (r.includes('national') || r.includes('super') || r.includes('central')) {
        return des.includes('national') || des.includes('championship');
      }
      return true;
    });

    if (stageMatch.length > 0) {
      pool = stageMatch;
    }
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
