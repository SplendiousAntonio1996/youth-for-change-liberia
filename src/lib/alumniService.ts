import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { AlumniProfile, AlumniTestimonial } from '../types';

const ALUMNI_CACHE_KEY = 'yfc_alumni_profiles_cache';
const TESTIMONIALS_CACHE_KEY = 'yfc_alumni_testimonials_cache';

// Helper to load cached alumni from localStorage
function getLocalAlumniCache(): AlumniProfile[] {
  try {
    const raw = localStorage.getItem(ALUMNI_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading alumni local cache', e);
  }
  return [];
}

// Helper to persist alumni cache to localStorage
function setLocalAlumniCache(profiles: AlumniProfile[]) {
  try {
    localStorage.setItem(ALUMNI_CACHE_KEY, JSON.stringify(profiles));
  } catch (e) {
    console.warn('Error saving alumni local cache', e);
  }
}

// Helper to load cached testimonials from localStorage
function getLocalTestimonialsCache(): AlumniTestimonial[] {
  try {
    const raw = localStorage.getItem(TESTIMONIALS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error reading testimonials local cache', e);
  }
  return [];
}

// Helper to persist testimonials cache to localStorage
function setLocalTestimonialsCache(testimonials: AlumniTestimonial[]) {
  try {
    localStorage.setItem(TESTIMONIALS_CACHE_KEY, JSON.stringify(testimonials));
  } catch (e) {
    console.warn('Error saving testimonials local cache', e);
  }
}

// Normalize Firestore document or object to AlumniProfile
export function normalizeAlumniProfile(data: any, id: string): AlumniProfile {
  return {
    id,
    name: data.name || '',
    highSchool: data.highSchool || '',
    county: data.county || 'Montserrado',
    graduationYear: data.graduationYear || '',
    tournamentYear: data.tournamentYear || '',
    role: data.role || 'Champion Debater',
    currentTitle: data.currentTitle || 'Young Professional / Student',
    organizationOrUniversity: data.organizationOrUniversity || 'Independent',
    fieldOfWork: data.fieldOfWork || 'Law & Governance',
    bio: data.bio || '',
    photo: data.photo || '',
    contactEmail: data.contactEmail || '',
    linkedIn: data.linkedIn || '',
    location: data.location || 'Liberia',
    isMentorAvailable: data.isMentorAvailable ?? true,
    achievements: Array.isArray(data.achievements) ? data.achievements : ['Registered Verified YFC Alumnus'],
    adviceForDebaters: data.adviceForDebaters || '',
    approved: data.approved ?? true, // Auto-approved by default
    status: data.status || 'active',
    hasTestimonial: Boolean(data.hasTestimonial || data.testimonialStory || data.videoTestimonialUrl),
    testimonialHeadline: data.testimonialHeadline || '',
    testimonialStory: data.testimonialStory || '',
    testimonialKeyQuote: data.testimonialKeyQuote || '',
    videoTestimonialUrl: data.videoTestimonialUrl || '',
    videoDuration: data.videoDuration || '',
    videoDurationSeconds: typeof data.videoDurationSeconds === 'number' ? data.videoDurationSeconds : 0,
    videoPoster: data.videoPoster || '',
    authorUid: data.authorUid || '',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString()
  };
}

// Normalize Firestore document or object to AlumniTestimonial
export function normalizeTestimonial(data: any, id: string): AlumniTestimonial {
  return {
    id,
    name: data.name || '',
    highSchool: data.highSchool || '',
    county: data.county || 'Montserrado',
    graduationYear: data.graduationYear || '',
    tournamentYear: data.tournamentYear || '',
    role: data.role || 'Champion Debater',
    currentTitle: data.currentTitle || '',
    organizationOrUniversity: data.organizationOrUniversity || '',
    fieldOfWork: data.fieldOfWork || 'Law & Governance',
    headline: data.headline || 'My Youth For Change Journey',
    keyQuote: data.keyQuote || '',
    story: data.story || '',
    impactArea: data.impactArea || 'Civic Leadership',
    photo: data.photo || '',
    verified: data.verified ?? true,
    rating: typeof data.rating === 'number' ? data.rating : 5,
    featured: data.featured ?? false,
    adviceSnippet: data.adviceSnippet || '',
    videoUrl: data.videoUrl || data.videoTestimonialUrl || '',
    videoDuration: data.videoDuration || '',
    videoDurationSeconds: typeof data.videoDurationSeconds === 'number' ? data.videoDurationSeconds : 0,
    videoPoster: data.videoPoster || '',
    authorUid: data.authorUid || '',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    likesCount: typeof data.likesCount === 'number' ? data.likesCount : 0,
    liked: data.liked ?? false
  };
}

/**
 * Realtime subscription to Alumni Profiles
 */
export function subscribeToAlumni(callback: (profiles: AlumniProfile[]) => void): () => void {
  const initialCache = getLocalAlumniCache();
  callback(initialCache);

  let unsubFirestore = () => {};

  try {
    const alumniCol = collection(db, 'alumni');
    unsubFirestore = onSnapshot(alumniCol, (snapshot) => {
      const profiles = snapshot.docs.map(d => normalizeAlumniProfile(d.data(), d.id));
      
      // Sort newest first
      profiles.sort((a, b) => {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });

      setLocalAlumniCache(profiles);
      callback(profiles);
    }, (err) => {
      console.warn('Alumni collection subscription error:', err);
      callback(getLocalAlumniCache());
    });
  } catch (e) {
    console.warn('Could not establish alumni listener:', e);
    callback(getLocalAlumniCache());
  }

  return () => {
    unsubFirestore();
  };
}

/**
 * Realtime subscription to Alumni Testimonials
 */
export function subscribeToTestimonials(callback: (testimonials: AlumniTestimonial[]) => void): () => void {
  const initialCache = getLocalTestimonialsCache();
  callback(initialCache);

  let unsubFirestore = () => {};

  try {
    const testCol = collection(db, 'testimonials');
    unsubFirestore = onSnapshot(testCol, (snapshot) => {
      const testimonials = snapshot.docs.map(d => normalizeTestimonial(d.data(), d.id));
      
      // Sort featured first, then newest
      testimonials.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      });

      setLocalTestimonialsCache(testimonials);
      callback(testimonials);
    }, (err) => {
      console.warn('Testimonials collection subscription error:', err);
      callback(getLocalTestimonialsCache());
    });
  } catch (e) {
    console.warn('Could not establish testimonials listener:', e);
    callback(getLocalTestimonialsCache());
  }

  return () => {
    unsubFirestore();
  };
}

/**
 * Create a new Alumni profile
 * New registrations from the public portal default to approved: false and status: 'pending'
 * so they must be reviewed and approved by an administrator before appearing on the public directory.
 */
export async function createAlumni(
  profile: Omit<AlumniProfile, 'id'>, 
  authorUidOrTestimonial?: string | {
    headline?: string;
    keyQuote?: string;
    story?: string;
    videoUrl?: string;
    videoDuration?: string;
    videoDurationSeconds?: number;
    videoPoster?: string;
  }
): Promise<AlumniProfile> {
  const timestamp = new Date().toISOString();
  const authorUid = typeof authorUidOrTestimonial === 'string' ? authorUidOrTestimonial : undefined;
  const customTestimonial = typeof authorUidOrTestimonial === 'object' ? authorUidOrTestimonial : undefined;
  
  const isApproved = profile.approved === true;
  const initialStatus = profile.status || (isApproved ? 'active' : 'pending');

  const alumniData: Omit<AlumniProfile, 'id'> = {
    ...profile,
    approved: isApproved,
    status: initialStatus,
    authorUid: authorUid || '',
    createdAt: timestamp,
    updatedAt: timestamp,
    achievements: profile.achievements && profile.achievements.length > 0 
      ? profile.achievements 
      : ['Registered YFC Alumnus']
  };

  let newProfile: AlumniProfile;

  try {
    const docRef = await addDoc(collection(db, 'alumni'), alumniData);
    newProfile = {
      ...alumniData,
      id: docRef.id
    };

    // Update local alumni cache
    const current = getLocalAlumniCache();
    setLocalAlumniCache([newProfile, ...current]);
  } catch (e) {
    console.warn('Firestore addDoc for alumni failed, saving to local cache:', e);
    const localId = 'local_alum_' + Date.now();
    newProfile = {
      ...alumniData,
      id: localId
    };
    const current = getLocalAlumniCache();
    setLocalAlumniCache([newProfile, ...current]);
  }

  // If the alumnus also shared a testimonial story or video testimonial, create a testimonial entry matching approval state
  const hasTestimonial = customTestimonial || profile.testimonialStory || profile.videoTestimonialUrl || profile.videoUrl || profile.testimonialKeyQuote;
  if (hasTestimonial) {
    try {
      await createTestimonial({
        name: profile.name,
        highSchool: profile.highSchool,
        county: profile.county,
        graduationYear: profile.graduationYear,
        tournamentYear: profile.tournamentYear,
        role: profile.role,
        currentTitle: profile.currentTitle,
        organizationOrUniversity: profile.organizationOrUniversity,
        fieldOfWork: profile.fieldOfWork,
        headline: customTestimonial?.headline || profile.testimonialHeadline || `${profile.name}'s Debate & Life Journey`,
        keyQuote: customTestimonial?.keyQuote || profile.testimonialKeyQuote || profile.adviceForDebaters || 'Youth For Change transformed how I think and lead.',
        story: customTestimonial?.story || profile.testimonialStory || profile.bio,
        impactArea: profile.fieldOfWork || 'Civic Leadership',
        photo: profile.photo,
        verified: isApproved, // Verified only if the alumni is already approved by admin
        rating: 5,
        featured: false,
        adviceSnippet: profile.adviceForDebaters,
        videoUrl: customTestimonial?.videoUrl || profile.videoUrl || profile.videoTestimonialUrl,
        videoDuration: customTestimonial?.videoDuration || profile.videoDuration,
        videoDurationSeconds: customTestimonial?.videoDurationSeconds || profile.videoDurationSeconds,
        videoPoster: customTestimonial?.videoPoster || profile.videoPoster || profile.photo,
        likesCount: 0
      }, authorUid);
    } catch (err) {
      console.warn('Auto-creating testimonial from alumni registration failed:', err);
    }
  }

  return newProfile;
}

/**
 * Update Alumni Profile
 */
export async function updateAlumni(id: string, profile: Partial<AlumniProfile>): Promise<void> {
  const timestamp = new Date().toISOString();
  const updatePayload = {
    ...profile,
    updatedAt: timestamp
  };

  try {
    const docRef = doc(db, 'alumni', id);
    await updateDoc(docRef, updatePayload);
  } catch (e) {
    console.warn('Firestore updateDoc failed for alumni:', e);
  }

  // Update local cache
  const current = getLocalAlumniCache();
  const index = current.findIndex(p => p.id === id);
  if (index >= 0) {
    current[index] = { ...current[index], ...updatePayload };
    setLocalAlumniCache([...current]);
  }
}

/**
 * Delete Alumni Profile
 */
export async function deleteAlumni(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'alumni', id);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Firestore deleteDoc failed for alumni:', e);
  }

  const current = getLocalAlumniCache();
  setLocalAlumniCache(current.filter(p => p.id !== id));
}

/**
 * Create a new Alumni Testimonial (supports up to 10 min video!)
 */
export async function createTestimonial(
  testimonial: Omit<AlumniTestimonial, 'id' | 'createdAt'>, 
  authorUid?: string
): Promise<AlumniTestimonial> {
  const timestamp = new Date().toISOString();
  const data = {
    ...testimonial,
    verified: testimonial.verified ?? true,
    rating: testimonial.rating || 5,
    likesCount: testimonial.likesCount || 0,
    authorUid: authorUid || '',
    createdAt: timestamp,
    updatedAt: timestamp
  };

  try {
    const docRef = await addDoc(collection(db, 'testimonials'), data);
    const newTestimonial: AlumniTestimonial = {
      ...data,
      id: docRef.id
    };

    const current = getLocalTestimonialsCache();
    setLocalTestimonialsCache([newTestimonial, ...current]);
    return newTestimonial;
  } catch (e) {
    console.warn('Firestore addDoc for testimonial failed, saving locally:', e);
    const localId = 'local_testim_' + Date.now();
    const newTestimonial: AlumniTestimonial = {
      ...data,
      id: localId
    };
    const current = getLocalTestimonialsCache();
    setLocalTestimonialsCache([newTestimonial, ...current]);
    return newTestimonial;
  }
}

/**
 * Update Alumni Testimonial
 */
export async function updateTestimonial(id: string, testimonial: Partial<AlumniTestimonial>): Promise<void> {
  const timestamp = new Date().toISOString();
  const updatePayload = {
    ...testimonial,
    updatedAt: timestamp
  };

  try {
    const docRef = doc(db, 'testimonials', id);
    await updateDoc(docRef, updatePayload);
  } catch (e) {
    console.warn('Firestore updateDoc failed for testimonial:', e);
  }

  const current = getLocalTestimonialsCache();
  const index = current.findIndex(t => t.id === id);
  if (index >= 0) {
    current[index] = { ...current[index], ...updatePayload };
    setLocalTestimonialsCache([...current]);
  }
}

/**
 * Delete Alumni Testimonial
 */
export async function deleteTestimonial(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'testimonials', id);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Firestore deleteDoc failed for testimonial:', e);
  }

  const current = getLocalTestimonialsCache();
  setLocalTestimonialsCache(current.filter(t => t.id !== id));
}

/**
 * Like a testimonial
 */
export async function likeTestimonial(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'testimonials', id);
    await updateDoc(docRef, {
      likesCount: increment(1)
    });
  } catch (e) {
    console.warn('Failed to increment likes on firestore:', e);
  }

  const current = getLocalTestimonialsCache();
  const index = current.findIndex(t => t.id === id);
  if (index >= 0) {
    current[index] = { 
      ...current[index], 
      likesCount: (current[index].likesCount || 0) + 1,
      liked: true 
    };
    setLocalTestimonialsCache([...current]);
  }
}
