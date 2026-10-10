import { collection, onSnapshot, query, where, getDocs, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { PartnerOrg, InvolvementApplication } from '../types';
import { PARTNERS_LIST as DEFAULT_BASELINE_PARTNERS } from '../data/contentData';

// Helper to generate elegant badge colors based on category/name
export function getCategoryBadgeStyles(category?: string): { accentColor: string; badgeBg: string } {
  switch (category?.toLowerCase()) {
    case 'government':
      return {
        accentColor: 'border-emerald-500 text-emerald-800 bg-emerald-50/80',
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300'
      };
    case 'international agency':
    case 'international':
      return {
        accentColor: 'border-blue-500 text-blue-800 bg-blue-50/80',
        badgeBg: 'bg-blue-100 text-blue-900 border-blue-300'
      };
    case 'corporate':
    case 'telecommunications':
      return {
        accentColor: 'border-orange-500 text-orange-800 bg-orange-50/80',
        badgeBg: 'bg-orange-100 text-orange-900 border-orange-300'
      };
    case 'academic':
    case 'university':
      return {
        accentColor: 'border-purple-500 text-purple-800 bg-purple-50/80',
        badgeBg: 'bg-purple-100 text-purple-900 border-purple-300'
      };
    case 'ngo':
    case 'civil society':
      return {
        accentColor: 'border-amber-500 text-amber-800 bg-amber-50/80',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300'
      };
    default:
      return {
        accentColor: 'border-teal-500 text-teal-800 bg-teal-50/80',
        badgeBg: 'bg-teal-100 text-teal-900 border-teal-300'
      };
  }
}

// Generate high-impact acronym or monogram
export function generateLogoText(name: string): string {
  if (!name) return 'YFC PARTNER';
  const clean = name.replace(/,/g, '').trim();
  const words = clean.split(/\s+/).filter(w => !['and', 'of', 'for', 'the', '&'].includes(w.toLowerCase()));
  if (words.length === 1) {
    return clean.slice(0, 12).toUpperCase();
  }
  if (words.length <= 4) {
    return words.map(w => w[0]).join('').toUpperCase() + ' LIBERIA';
  }
  return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
}

/**
 * Normalizes an approved involvement application or custom partner doc into a PartnerOrg
 */
export function normalizeToPartnerOrg(data: any, id: string): PartnerOrg {
  const name = data.schoolOrOrg || data.name || 'Accredited Partner';
  const category = (data.category || data.partnerType || 'Institutional Partner')
    .replace('International NGO / Development Agency', 'International Agency')
    .replace('Government Ministry / Public Agency', 'Government')
    .replace('Corporate / Private Sector Sponsor', 'Corporate')
    .replace('Academic Institution / University', 'Academic')
    .replace('Community Foundation / Civil Society', 'NGO');

  const { accentColor } = getCategoryBadgeStyles(category);
  const logoText = data.logoText || generateLogoText(name);
  const logoUrl = data.logoUrl || data.logo || undefined;
  const coverImage = data.coverImage || data.coverImageUrl || data.bannerUrl || data.image || undefined;
  const websiteUrl = data.websiteUrl || data.website || undefined;
  const description = data.description || data.message || `Official accredited partner supporting youth forensic development and STEM education in ${data.county || 'Liberia'}.`;

  return {
    id,
    name,
    category: category as any,
    description,
    logoText,
    logoUrl,
    coverImage,
    websiteUrl,
    accentColor: data.accentColor || accentColor,
    county: data.county,
    contactEmail: data.email || data.contactEmail,
    contactPerson: data.name,
    isLive: true,
    status: 'approved',
    applicationId: data.applicationId || id,
    approvedAt: data.reviewedAt || data.approvedAt || data.submittedAt || new Date().toISOString()
  };
}

/**
 * Realtime hook / subscription for all approved partners
 */
export function subscribeToApprovedPartners(callback: (partners: PartnerOrg[]) => void): () => void {
  let customPartners: PartnerOrg[] = [];
  let approvedApps: PartnerOrg[] = [];

  const mergeAndEmit = () => {
    const combinedMap = new Map<string, PartnerOrg>();

    // 1. Add default baseline partners
    DEFAULT_BASELINE_PARTNERS.forEach(p => {
      combinedMap.set(p.name.toLowerCase().trim(), { ...p, isLive: false });
    });

    // 2. Add approved applications (Dynamic live additions)
    approvedApps.forEach(p => {
      combinedMap.set(p.name.toLowerCase().trim(), p);
    });

    // 3. Add explicit partners collection docs
    customPartners.forEach(p => {
      combinedMap.set(p.name.toLowerCase().trim(), p);
    });

    const finalPartners = Array.from(combinedMap.values());
    callback(finalPartners);
  };

  // Immediate initial callback with baseline
  mergeAndEmit();

  let unsubPartners = () => {};
  let unsubApps = () => {};

  try {
    // Listen to dedicated 'partners' collection
    unsubPartners = onSnapshot(collection(db, 'partners'), (snapshot) => {
      customPartners = snapshot.docs.map(doc => normalizeToPartnerOrg(doc.data(), doc.id));
      mergeAndEmit();
    }, (err) => {
      console.warn('Partners collection subscription error:', err);
    });

    // Listen to 'involvementApplications' where status == 'approved' and type in ['partner', 'sponsor']
    unsubApps = onSnapshot(collection(db, 'involvementApplications'), (snapshot) => {
      approvedApps = snapshot.docs
        .map(doc => ({ data: doc.data(), id: doc.id }))
        .filter(({ data }) => (data.type === 'partner' || data.type === 'sponsor') && data.status === 'approved')
        .map(({ data, id }) => normalizeToPartnerOrg(data, id));
      mergeAndEmit();
    }, (err) => {
      console.warn('Involvement applications partner subscription error:', err);
    });
  } catch (e) {
    console.warn('Could not establish partner listener', e);
  }

  return () => {
    unsubPartners();
    unsubApps();
  };
}
