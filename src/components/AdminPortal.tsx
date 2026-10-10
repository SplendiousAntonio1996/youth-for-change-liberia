import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  setDoc,
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { 
  ShieldCheck, 
  Lock, 
  LogOut, 
  Plus, 
  FileText, 
  Newspaper, 
  UploadCloud, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Sparkles, 
  Layers, 
  Calendar, 
  Eye, 
  EyeOff,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  ShieldAlert,
  Key,
  Copy,
  Check,
  Building2,
  Info,
  Heart,
  DollarSign,
  Download,
  Cpu,
  Lightbulb,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  Search,
  Filter,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Camera,
  X,
  Bell,
  FileUp,
  Send,
  Users,
  UserCheck,
  Building,
  HeartHandshake,
  CheckSquare,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Briefcase,
  Globe,
  Trophy,
  Save,
  Server,
  Shuffle,
  SlidersHorizontal,
  BarChart3
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  NewsArticle, 
  DocumentItem, 
  DocumentSection, 
  NavTab, 
  DonationRecord, 
  StemChallengeConfig, 
  StemProposal, 
  StemTrack,
  InvolvementApplication
} from '../types';
import { CURRENT_STEM_CHALLENGE } from '../data/stemData';
import { YocLogo } from './YocLogo';
import { AdminMediaManager } from './AdminMediaManager';
import { AdminDebateEditionsManager } from './AdminDebateEditionsManager';
import { AdminLeadershipManager } from './AdminLeadershipManager';
import { AdminAlumniManager } from './AdminAlumniManager';
import { AdminSubscribersManager } from './AdminSubscribersManager';
import { SchoolZoningUtility } from './admin/SchoolZoningUtility';
import { AdminProgramStatusManager } from './admin/AdminProgramStatusManager';
import { subscribeToSubscribersList } from '../lib/subscriberService';
import { ImageUploadField } from './ImageUploadField';
import { compressDataUrlForPermanentStorage } from '../lib/imageUtils';
import { useToast } from '../context/ToastContext';
import { normalizeToPartnerOrg, getCategoryBadgeStyles, generateLogoText } from '../lib/partnersService';
import { YearlyReportEngine } from './YearlyReportEngine';

export const LIBERIA_COUNTIES = [
  'Bomi', 'Bong', 'Gbarpolu', 'Grand Bassa', 'Grand Cape Mount',
  'Grand Gedeh', 'Grand Kru', 'Lofa', 'Margibi', 'Maryland',
  'Montserrado', 'Nimba', 'River Cess', 'River Gee', 'Sinoe'
];

// Official Youth For Change Liberia Credentials & Secretariat Profiles
export const OFFICIAL_YFC_CREDENTIALS = [
  {
    role: 'National Secretariat Executive',
    email: 'admin@youthforchange.org.lr',
    secret: 'YFC-Liberia-2025!',
    department: 'National Executive Secretariat & General Desk',
    badge: 'Master Admin'
  },
  {
    role: 'Press & Media Director',
    email: 'editorial@youthforchange.org.lr',
    secret: 'Liberia-Press2025!',
    department: 'National Press & Communications Office',
    badge: 'Media Hub'
  },
  {
    role: 'Chief Forensics Adjudicator',
    email: 'forensics@youthforchange.org.lr',
    secret: 'Debate-Liberia2025!',
    department: 'Academic Council & National Debate Directorate',
    badge: 'Adjudication'
  }
];

interface AdminPortalProps {
  setTab: (tab: NavTab) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ setTab }) => {
  const toast = useToast();
  const isInitialProposalsLoad = useRef<boolean>(true);
  const isInitialAppsLoad = useRef<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  // Auth Form State
  const [email, setEmail] = useState<string>('admin@youthforchange.org.lr');
  const [password, setPassword] = useState<string>('YFC-Liberia-2025!');
  const [displayName, setDisplayName] = useState<string>('YFC National Secretariat');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessNotice, setAuthSuccessNotice] = useState<string | null>(null);
  const [submittingAuth, setSubmittingAuth] = useState<boolean>(false);

  // Active Admin Tab
  const [adminSection, setAdminSection] = useState<'stories' | 'documents' | 'media' | 'donations' | 'stem' | 'applications' | 'debate-editions' | 'leadership' | 'alumni' | 'subscribers' | 'zoning-fixtures' | 'coach-alerts' | 'program-status' | 'yearly-report'>('stories');
  const [subscribersCount, setSubscribersCount] = useState<number>(0);

  useEffect(() => {
    const unsub = subscribeToSubscribersList((list) => {
      setSubscribersCount(list.length);
    });
    return () => unsub();
  }, []);

  // Involvement Applications Management State
  const [applicationsList, setApplicationsList] = useState<InvolvementApplication[]>([]);
  const [loadingApplications, setLoadingApplications] = useState<boolean>(false);
  const [appTypeFilter, setAppTypeFilter] = useState<string>('all');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('all');
  const [appCountyFilter, setAppCountyFilter] = useState<string>('all');
  const [appSearch, setAppSearch] = useState<string>('');
  const [selectedApplication, setSelectedApplication] = useState<InvolvementApplication | null>(null);
  const [appReviewerNotes, setAppReviewerNotes] = useState<string>('');
  const [savingAppUpdate, setSavingAppUpdate] = useState<boolean>(false);
  const [appUpdateSuccess, setAppUpdateSuccess] = useState<string | null>(null);

  // Partner Email Notification & Preview Modal State
  const [emailPreviewModal, setEmailPreviewModal] = useState<{
    isOpen: boolean;
    app: InvolvementApplication | null;
    status: 'approved' | 'pending' | 'rejected';
    subject: string;
    html: string;
    recipient: string;
    loading: boolean;
  }>({
    isOpen: false,
    app: null,
    status: 'approved',
    subject: '',
    html: '',
    recipient: '',
    loading: false
  });
  const [sendingNotificationEmail, setSendingNotificationEmail] = useState<boolean>(false);

  // Direct Partner / Sponsor Registration State
  const [showAddPartnerModal, setShowAddPartnerModal] = useState<boolean>(false);
  const [savingNewPartner, setSavingNewPartner] = useState<boolean>(false);
  const [newPartnerForm, setNewPartnerForm] = useState({
    name: '',
    category: 'International Agency' as 'Government' | 'Corporate' | 'International Agency' | 'Academic' | 'Media' | 'Philanthropic',
    description: '',
    logoText: '',
    logoUrl: '',
    coverImage: '',
    county: 'Montserrado',
    websiteUrl: '',
    contactEmail: '',
    contactPerson: '',
    accentColor: 'border-blue-500 text-blue-800 bg-blue-50/80',
    notifyByEmail: true
  });

  // STEM Challenge & Proposals Management State
  const [stemSubTab, setStemSubTab] = useState<'proposals' | 'challenge'>('proposals');
  const [stemProposalsList, setStemProposalsList] = useState<StemProposal[]>([]);
  const [loadingProposals, setLoadingProposals] = useState<boolean>(false);
  const [proposalSearch, setProposalSearch] = useState<string>('');
  const [proposalStatusFilter, setProposalStatusFilter] = useState<string>('all');
  const [proposalCountyFilter, setProposalCountyFilter] = useState<string>('all');
  const [selectedProposal, setSelectedProposal] = useState<StemProposal | null>(null);
  const [reviewerNoteInput, setReviewerNoteInput] = useState<string>('');
  const [savingProposalUpdate, setSavingProposalUpdate] = useState<boolean>(false);
  const [proposalUpdateSuccess, setProposalUpdateSuccess] = useState<string | null>(null);

  // STEM SMTP Email Notification Gateway State
  const [showSmtpModal, setShowSmtpModal] = useState<boolean>(false);
  const [smtpStatus, setSmtpStatus] = useState<{
    isConfigured: boolean;
    host: string | null;
    port: number;
    user: string | null;
    from: string;
    adminEmail: string;
    mode: string;
  } | null>(null);
  const [loadingSmtpStatus, setLoadingSmtpStatus] = useState<boolean>(false);
  const [testingSmtp, setTestingSmtp] = useState<boolean>(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string; timestamp: string } | null>(null);
  const [customTestEmail, setCustomTestEmail] = useState<string>('');

  // STEM Proposal Alert Email Preview Modal State
  const [proposalAlertPreviewModal, setProposalAlertPreviewModal] = useState<{
    isOpen: boolean;
    proposal: StemProposal | null;
    previewHtml: string | null;
    subject: string | null;
    loading: boolean;
    sending: boolean;
  }>({
    isOpen: false,
    proposal: null,
    previewHtml: null,
    subject: null,
    loading: false,
    sending: false
  });

  // STEM Challenge Config State
  const [activeChallengeDocId, setActiveChallengeDocId] = useState<string | null>(null);
  const [savingStemChallenge, setSavingStemChallenge] = useState<boolean>(false);
  const [stemChallengeSuccessMsg, setStemChallengeSuccessMsg] = useState<string | null>(null);
  const [stemChallengeErrorMsg, setStemChallengeErrorMsg] = useState<string | null>(null);
  const [stemChallengeSectionTab, setStemChallengeSectionTab] = useState<'basic' | 'tracks' | 'roadmap' | 'guidelines' | 'rubric'>('basic');
  const [stemChallengeForm, setStemChallengeForm] = useState({
    edition: CURRENT_STEM_CHALLENGE.edition,
    theme: CURRENT_STEM_CHALLENGE.theme,
    tagline: CURRENT_STEM_CHALLENGE.tagline,
    deadline: CURRENT_STEM_CHALLENGE.deadline,
    grandExpoDate: CURRENT_STEM_CHALLENGE.grandExpoDate,
    location: CURRENT_STEM_CHALLENGE.location,
    participatingSchools: CURRENT_STEM_CHALLENGE.participatingSchools,
    countiesRepresented: CURRENT_STEM_CHALLENGE.countiesRepresented,
    firstPlacePrize: CURRENT_STEM_CHALLENGE.prizes.firstPlace,
    secondPlacePrize: CURRENT_STEM_CHALLENGE.prizes.secondPlace,
    thirdPlacePrize: CURRENT_STEM_CHALLENGE.prizes.thirdPlace,
    specialCategory: CURRENT_STEM_CHALLENGE.prizes.specialCategory,
    tracksText: CURRENT_STEM_CHALLENGE.tracks.map(t => `${t.name} | ${t.description}`).join('\n'),
    eligibilityRulesText: CURRENT_STEM_CHALLENGE.eligibilityRules.join('\n'),
    howToAccomplishOverview: CURRENT_STEM_CHALLENGE.howToAccomplishOverview,
    roadmapText: CURRENT_STEM_CHALLENGE.accomplishmentRoadmap
      ? CURRENT_STEM_CHALLENGE.accomplishmentRoadmap.map(r => `${r.stepNumber} | ${r.title} | ${r.subtitle} | ${r.details.join('; ')}`).join('\n')
      : '',
    submissionGuidelinesText: CURRENT_STEM_CHALLENGE.submissionGuidelines
      ? CURRENT_STEM_CHALLENGE.submissionGuidelines.join('\n')
      : '',
    requiredDeliverablesText: CURRENT_STEM_CHALLENGE.requiredDeliverables
      ? CURRENT_STEM_CHALLENGE.requiredDeliverables.join('\n')
      : '',
    evaluationRubricText: CURRENT_STEM_CHALLENGE.evaluationRubric
      ? CURRENT_STEM_CHALLENGE.evaluationRubric.map(rub => `${rub.criterion} | ${rub.weight} | ${rub.description}`).join('\n')
      : ''
  });

  // Donations Management State
  const [donationsList, setDonationsList] = useState<DonationRecord[]>([]);
  const [loadingDonations, setLoadingDonations] = useState<boolean>(false);
  const [donationFilter, setDonationFilter] = useState<string>('all');
  const [donationSearch, setDonationSearch] = useState<string>('');

  // Stories Management State
  const [stories, setStories] = useState<NewsArticle[]>([]);
  const [loadingStories, setLoadingStories] = useState<boolean>(false);
  const [storyModalOpen, setStoryModalOpen] = useState<boolean>(false);
  const [savingStory, setSavingStory] = useState<boolean>(false);
  const [storySuccessMsg, setStorySuccessMsg] = useState<string | null>(null);
  const [storyErrorMsg, setStoryErrorMsg] = useState<string | null>(null);

  // Story Form State
  const [storyForm, setStoryForm] = useState({
    title: '',
    category: 'Tournament News' as NewsArticle['category'],
    author: 'Youth For Change Editorial Desk',
    source: 'Official Press Release',
    readTime: '3 min read',
    image: '',
    summary: '',
    fullContentText: ''
  });

  // Documents Management State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(false);
  const [docModalOpen, setDocModalOpen] = useState<boolean>(false);
  const [savingDoc, setSavingDoc] = useState<boolean>(false);
  const [docSuccessMsg, setDocSuccessMsg] = useState<string | null>(null);
  const [docErrorMsg, setDocErrorMsg] = useState<string | null>(null);

  // Document Form State
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'Rulebooks & Guidelines' as DocumentItem['category'],
    fileType: 'pdf' as DocumentItem['fileType'],
    authorOrDept: 'YFC Academic & Forensics Secretariat',
    editionYear: '2024/2025',
    fileSize: '1.2 MB',
    description: '',
    tags: 'Rulebook, Tournament, Liberia Debate, National Championship',
    sectionsText: '1. Overview & Purpose\nThis official document sets forth the governing framework for participants.\n\n2. Key Regulations\nAll teams must adhere to ethical debate and forensics guidelines.'
  });

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch Firestore Stories Realtime
  useEffect(() => {
    setLoadingStories(true);
    try {
      if (!db) {
        setLoadingStories(false);
        return;
      }
      const storiesRef = collection(db, 'stories');
      const q = query(storiesRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: NewsArticle[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            title: data.title || 'Untitled Article',
            date: data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            readTime: data.readTime || '3 min read',
            category: data.category || 'Tournament News',
            source: data.source || 'Official Press Release',
            author: data.author || 'Youth For Change',
            image: data.image || '',
            summary: data.summary || '',
            fullContent: data.fullContent || [],
            authorUid: data.authorUid,
            createdAt: data.createdAt
          });
        });
        setStories(fetched);
        setLoadingStories(false);
      }, (error) => {
        console.warn('Firestore stories sync error:', error);
        setLoadingStories(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not establish stories listener:', e);
      setLoadingStories(false);
    }
  }, []);

  // Fetch Firestore Documents Realtime
  useEffect(() => {
    setLoadingDocs(true);
    try {
      if (!db) {
        setLoadingDocs(false);
        return;
      }
      const docsRef = collection(db, 'documents');
      const q = query(docsRef, orderBy('createdAt', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: DocumentItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            title: data.title || 'Untitled Document',
            category: data.category || 'Rulebooks & Guidelines',
            fileType: data.fileType || 'pdf',
            fileSize: data.fileSize || '1.0 MB',
            publishDate: data.publishDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            downloadCount: data.downloadCount || 0,
            editionYear: data.editionYear || '2024/2025',
            authorOrDept: data.authorOrDept || 'YFC Secretariat',
            description: data.description || '',
            tags: data.tags || [],
            contentSections: data.contentSections || [],
            fileUrl: data.fileUrl,
            authorUid: data.authorUid,
            createdAt: data.createdAt
          });
        });
        setDocuments(fetched);
        setLoadingDocs(false);
      }, (error) => {
        console.warn('Firestore documents sync error:', error);
        setLoadingDocs(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not establish documents listener:', e);
      setLoadingDocs(false);
    }
  }, []);

  // Fetch Firestore Donations Realtime
  useEffect(() => {
    setLoadingDonations(true);
    try {
      if (!db) {
        setLoadingDonations(false);
        return;
      }
      const donationsRef = collection(db, 'donations');
      const q = query(donationsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: DonationRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            donorName: data.donorName || 'Anonymous Supporter',
            donorEmail: data.donorEmail || '',
            donorPhone: data.donorPhone,
            amount: typeof data.amount === 'number' ? data.amount : parseFloat(data.amount) || 0,
            currency: data.currency || 'USD',
            program: data.program || 'General Support',
            frequency: data.frequency || 'one-time',
            paymentMethod: data.paymentMethod || 'Mobile Money',
            message: data.message,
            isAnonymous: !!data.isAnonymous,
            countyOrLocation: data.countyOrLocation || 'Montserrado',
            status: data.status || 'confirmed',
            transactionReference: data.transactionReference || docSnap.id,
            authorUid: data.authorUid,
            createdAt: data.createdAt || new Date().toISOString()
          });
        });
        setDonationsList(fetched);
        setLoadingDonations(false);
      }, (error) => {
        console.warn('Firestore donations sync error:', error);
        setLoadingDonations(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not establish donations listener:', e);
      setLoadingDonations(false);
    }
  }, []);

  // Fetch Firestore Active STEM Challenge
  useEffect(() => {
    try {
      if (!db) return;
      const q = query(collection(db, 'stemChallenges'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();
          setActiveChallengeDocId(docSnap.id);
          
          let tracksText = '';
          if (Array.isArray(data.tracks)) {
            tracksText = data.tracks.map((t: any) => `${t.name} | ${t.description}`).join('\n');
          }
          let eligibilityText = '';
          if (Array.isArray(data.eligibilityRules)) {
            eligibilityText = data.eligibilityRules.join('\n');
          }

          setStemChallengeForm({
            edition: data.edition || '2025/2026 National High School STEM Challenge',
            theme: data.theme || '',
            tagline: data.tagline || '',
            deadline: data.deadline || '',
            grandExpoDate: data.grandExpoDate || '',
            location: data.location || '',
            participatingSchools: data.participatingSchools || 48,
            countiesRepresented: data.countiesRepresented || 15,
            firstPlacePrize: data.prizes?.firstPlace || '',
            secondPlacePrize: data.prizes?.secondPlace || '',
            thirdPlacePrize: data.prizes?.thirdPlace || '',
            specialCategory: data.prizes?.specialCategory || '',
            tracksText: tracksText || `Agri-Tech & Food Preservation | Designing low-cost solar drying, mechanical harvesting, and post-harvest preservation machines for cassava, pepper, and cocoa.\nClean Water & Sanitation (WASH) | Bio-sand filtration, solar water purification, and rainwater harvesting models for rural clinics and schools.\nRenewable Clean Energy | Mini-solar generators, biomass briquettes, and hydro-kinetic turbines built with locally sourced scrap materials.\nCivic & Health Tech | Offline SMS maternal health alerts, flood detection sensors, and digital classroom learning tools.`,
            eligibilityRulesText: eligibilityText || `High school teams must consist of 3 to 5 enrolled students (Grades 9-12).\nEach registered team must have one verified STEM faculty advisor or teacher mentor.\nInventions must solve a direct community problem using accessible or recycled materials.\nPrototypes must demonstrate working operational functionality during the County Expo.`
          });
        }
      }, (err) => {
        console.warn('Firestore stem challenge listener error:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not establish stemChallenges listener', e);
    }
  }, []);

  // Fetch Firestore Student STEM Proposals
  useEffect(() => {
    setLoadingProposals(true);
    try {
      if (!db) {
        setLoadingProposals(false);
        return;
      }
      const q = query(collection(db, 'stemProposals'), orderBy('submittedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: StemProposal[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            title: data.title || 'Untitled Proposal',
            school: data.school || 'Unknown High School',
            county: data.county || 'Montserrado',
            category: data.category || 'Renewable Energy',
            teamLead: data.teamLead || 'Student Lead',
            studentTeam: Array.isArray(data.studentTeam) ? data.studentTeam : [],
            mentor: data.mentor || 'Faculty Advisor',
            mentorEmail: data.mentorEmail || '',
            mentorPhone: data.mentorPhone || '',
            summary: data.summary || '',
            problemStatement: data.problemStatement || '',
            solution: data.solution || '',
            materialsBudget: data.materialsBudget || '',
            prototypeStage: data.prototypeStage || 'Concept',
            status: data.status || 'Pending Review',
            reviewerNotes: data.reviewerNotes || '',
            scoreTotal: data.scoreTotal,
            submittedAt: data.submittedAt || new Date().toISOString()
          });
        });

        // Trigger toast notification when a new student proposal is received
        if (isInitialProposalsLoad.current) {
          isInitialProposalsLoad.current = false;
        } else {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const newProp = change.doc.data();
              toast.success(
                `Student proposal "${newProp.title || 'Innovation Project'}" received from ${newProp.school || 'High School'} (${newProp.county || 'Liberia'} County) • Category: ${newProp.category || 'STEM Innovation'}`,
                'Student Proposal Received',
                7000
              );
            }
          });
        }

        setStemProposalsList(fetched);
        setLoadingProposals(false);
      }, (err) => {
        console.warn('Firestore stem proposals listener error:', err);
        setLoadingProposals(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not establish stemProposals listener', e);
      setLoadingProposals(false);
    }
  }, []);

  // Fetch Firestore Involvement Applications (Students, Schools, Volunteers, Sponsors, Partners)
  useEffect(() => {
    setLoadingApplications(true);
    try {
      if (!db) {
        setLoadingApplications(false);
        return;
      }
      const q = query(collection(db, 'involvementApplications'), orderBy('submittedAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: InvolvementApplication[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            type: (data.type || 'student') as InvolvementApplication['type'],
            name: data.name || 'Applicant',
            email: data.email || '',
            phone: data.phone || '',
            schoolOrOrg: data.schoolOrOrg || '',
            county: data.county || 'Montserrado',
            roleOrInterest: data.roleOrInterest || '',
            message: data.message || '',
            status: (data.status || 'pending') as InvolvementApplication['status'],
            submittedAt: data.submittedAt || new Date().toISOString(),
            reviewerNotes: data.reviewerNotes || '',
            reviewedBy: data.reviewedBy || '',
            reviewedAt: data.reviewedAt || '',
            // Student specific
            gradeLevel: data.gradeLevel,
            scholarshipInterest: data.scholarshipInterest,
            careerAspiration: data.careerAspiration,
            // School specific
            principalOrHead: data.principalOrHead,
            delegationSize: data.delegationSize,
            // Sponsor specific
            sponsorshipTier: data.sponsorshipTier,
            pledgedAmount: data.pledgedAmount,
            currency: data.currency,
            // Partner specific
            partnerType: data.partnerType,
            // Volunteer specific
            eventId: data.eventId,
            eventTitle: data.eventTitle,
            attendanceMode: data.attendanceMode
          });
        });

        // Trigger toast notification when a new application is received
        if (isInitialAppsLoad.current) {
          isInitialAppsLoad.current = false;
        } else {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const newApp = change.doc.data();
              const typeLabels: Record<string, string> = {
                student: 'Student Scholar Application',
                school: 'High School Delegation Registration',
                volunteer: 'Volunteer Adjudicator Registration',
                sponsor: 'Corporate / Philanthropic Sponsor Proposal',
                partner: 'Institutional Partnership Request'
              };
              const label = typeLabels[newApp.type] || 'New Application';
              toast.success(
                `${label} received from ${newApp.name || 'Applicant'} (${newApp.schoolOrOrg ? newApp.schoolOrOrg + ' • ' : ''}${newApp.county || 'Liberia'} County)`,
                `${label} Received`,
                7000
              );
            }
          });
        }

        setApplicationsList(fetched);
        setLoadingApplications(false);
      }, (err) => {
        console.warn('Firestore involvement applications listener error:', err);
        setLoadingApplications(false);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not establish involvementApplications listener', e);
      setLoadingApplications(false);
    }
  }, []);

  // Fetch / Sync Live STEM Challenge Specifications & Proposal Guidelines into Admin Form
  useEffect(() => {
    try {
      if (!db) return;
      const q = collection(db, 'stemChallenges');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          // Sort client-side by most recent update or creation
          const sortedDocs = [...snapshot.docs].sort((a, b) => {
            const dataA = a.data();
            const dataB = b.data();
            const timeA = new Date(dataA.updatedAt || dataA.createdAt || 0).getTime();
            const timeB = new Date(dataB.updatedAt || dataB.createdAt || 0).getTime();
            return timeB - timeA;
          });

          const activeDoc = sortedDocs[0];
          const data = activeDoc.data();
          setActiveChallengeDocId(activeDoc.id);

          // Convert tracks to text
          let tracksText = '';
          if (Array.isArray(data.tracks) && data.tracks.length > 0) {
            tracksText = data.tracks.map((t: any) => `${t.name || ''} | ${t.description || ''}`).join('\n');
          }

          // Convert rules to text
          let eligibilityText = '';
          if (Array.isArray(data.eligibilityRules) && data.eligibilityRules.length > 0) {
            eligibilityText = data.eligibilityRules.join('\n');
          }

          // Convert roadmap to text (Format: Step | Title | Subtitle | Detail 1; Detail 2...)
          let roadmapText = '';
          if (Array.isArray(data.accomplishmentRoadmap) && data.accomplishmentRoadmap.length > 0) {
            roadmapText = data.accomplishmentRoadmap.map((r: any) => {
              const details = Array.isArray(r.details) ? r.details.join('; ') : (r.description || '');
              return `${r.stepNumber || 1} | ${r.title || ''} | ${r.subtitle || ''} | ${details}`;
            }).join('\n');
          }

          // Convert guidelines to text
          let guidelinesText = '';
          if (Array.isArray(data.submissionGuidelines) && data.submissionGuidelines.length > 0) {
            guidelinesText = data.submissionGuidelines.join('\n');
          }

          // Convert deliverables to text
          let deliverablesText = '';
          if (Array.isArray(data.requiredDeliverables) && data.requiredDeliverables.length > 0) {
            deliverablesText = data.requiredDeliverables.join('\n');
          }

          // Convert rubric to text (Format: Criterion | Weight | Description)
          let rubricText = '';
          if (Array.isArray(data.evaluationRubric) && data.evaluationRubric.length > 0) {
            rubricText = data.evaluationRubric.map((rub: any) => `${rub.criterion || ''} | ${rub.weight || ''} | ${rub.description || ''}`).join('\n');
          }

          setStemChallengeForm(prev => ({
            ...prev,
            edition: data.edition || prev.edition,
            theme: data.theme || prev.theme,
            tagline: data.tagline || prev.tagline,
            deadline: data.deadline || prev.deadline,
            grandExpoDate: data.grandExpoDate || prev.grandExpoDate,
            location: data.location || prev.location,
            participatingSchools: data.participatingSchools ?? prev.participatingSchools,
            countiesRepresented: data.countiesRepresented ?? prev.countiesRepresented,
            firstPlacePrize: data.prizes?.firstPlace || prev.firstPlacePrize,
            secondPlacePrize: data.prizes?.secondPlace || prev.secondPlacePrize,
            thirdPlacePrize: data.prizes?.thirdPlace || prev.thirdPlacePrize,
            specialCategory: data.prizes?.specialCategory || prev.specialCategory,
            tracksText: tracksText || prev.tracksText,
            eligibilityRulesText: eligibilityText || prev.eligibilityRulesText,
            howToAccomplishOverview: data.howToAccomplishOverview || prev.howToAccomplishOverview,
            roadmapText: roadmapText || prev.roadmapText,
            submissionGuidelinesText: guidelinesText || prev.submissionGuidelinesText,
            requiredDeliverablesText: deliverablesText || prev.requiredDeliverablesText,
            evaluationRubricText: rubricText || prev.evaluationRubricText
          }));
        }
      }, (err) => {
        console.warn('Firestore stemChallenges sync listener notice:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not establish stemChallenges listener in AdminPortal', e);
    }
  }, []);

  // Helper: Load Official Proposal Template & Guidelines
  const handleLoadOfficialStemTemplate = () => {
    const defaultTracks = CURRENT_STEM_CHALLENGE.tracks
      ? CURRENT_STEM_CHALLENGE.tracks.map(t => `${t.name} | ${t.description}`).join('\n')
      : '';

    const defaultEligibility = CURRENT_STEM_CHALLENGE.eligibilityRules
      ? CURRENT_STEM_CHALLENGE.eligibilityRules.join('\n')
      : '';

    const defaultRoadmap = CURRENT_STEM_CHALLENGE.accomplishmentRoadmap
      ? CURRENT_STEM_CHALLENGE.accomplishmentRoadmap.map(r => `${r.stepNumber} | ${r.title} | ${r.subtitle} | ${r.details.join('; ')}`).join('\n')
      : '';

    const defaultGuidelines = CURRENT_STEM_CHALLENGE.submissionGuidelines
      ? CURRENT_STEM_CHALLENGE.submissionGuidelines.join('\n')
      : '';

    const defaultDeliverables = CURRENT_STEM_CHALLENGE.requiredDeliverables
      ? CURRENT_STEM_CHALLENGE.requiredDeliverables.join('\n')
      : '';

    const defaultRubric = CURRENT_STEM_CHALLENGE.evaluationRubric
      ? CURRENT_STEM_CHALLENGE.evaluationRubric.map(rub => `${rub.criterion} | ${rub.weight} | ${rub.description}`).join('\n')
      : '';

    setStemChallengeForm(prev => ({
      ...prev,
      edition: CURRENT_STEM_CHALLENGE.edition,
      theme: CURRENT_STEM_CHALLENGE.theme,
      tagline: CURRENT_STEM_CHALLENGE.tagline,
      deadline: CURRENT_STEM_CHALLENGE.deadline,
      grandExpoDate: CURRENT_STEM_CHALLENGE.grandExpoDate,
      location: CURRENT_STEM_CHALLENGE.location,
      firstPlacePrize: CURRENT_STEM_CHALLENGE.prizes.firstPlace,
      secondPlacePrize: CURRENT_STEM_CHALLENGE.prizes.secondPlace,
      thirdPlacePrize: CURRENT_STEM_CHALLENGE.prizes.thirdPlace,
      specialCategory: CURRENT_STEM_CHALLENGE.prizes.specialCategory,
      tracksText: defaultTracks,
      eligibilityRulesText: defaultEligibility,
      howToAccomplishOverview: CURRENT_STEM_CHALLENGE.howToAccomplishOverview,
      roadmapText: defaultRoadmap,
      submissionGuidelinesText: defaultGuidelines,
      requiredDeliverablesText: defaultDeliverables,
      evaluationRubricText: defaultRubric
    }));

    toast.info('Official STEM Challenge specifications & proposal guidelines template loaded into the editor.', 'Template Loaded', 4000);
  };

  // Handler: Save / Upload STEM Challenge
  const handleSaveStemChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSavingStemChallenge(true);
    setStemChallengeErrorMsg(null);
    setStemChallengeSuccessMsg(null);

    try {
      // 1. Parse tracks
      const parsedTracks: StemTrack[] = stemChallengeForm.tracksText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          const parts = line.split('|').map(p => p.trim());
          return {
            name: parts[0] || 'Innovation Track',
            description: parts[1] || ''
          };
        });

      // 2. Parse rules
      const parsedRules = stemChallengeForm.eligibilityRulesText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // 3. Parse Roadmap (Step | Title | Subtitle | Detail 1; Detail 2; ...)
      const parsedRoadmap = stemChallengeForm.roadmapText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map((line, idx) => {
          const parts = line.split('|').map(p => p.trim());
          const stepNum = parseInt(parts[0], 10) || (idx + 1);
          const title = parts[1] || `Phase ${stepNum}`;
          const subtitle = parts[2] || '';
          const detailsStr = parts[3] || '';
          const details = detailsStr
            ? detailsStr.split(';').map(d => d.trim()).filter(d => d.length > 0)
            : [subtitle || title];

          return {
            stepNumber: stepNum,
            title,
            subtitle,
            details: details.length > 0 ? details : ['Follow stage protocols and technical benchmarks.']
          };
        });

      // 4. Parse Submission Guidelines
      const parsedGuidelines = stemChallengeForm.submissionGuidelinesText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // 5. Parse Required Deliverables
      const parsedDeliverables = stemChallengeForm.requiredDeliverablesText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // 6. Parse Evaluation Rubric (Criterion | Weight | Description)
      const parsedRubric = stemChallengeForm.evaluationRubricText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
          const parts = line.split('|').map(p => p.trim());
          return {
            criterion: parts[0] || 'Scoring Criterion',
            weight: parts[1] || '20%',
            description: parts[2] || ''
          };
        });

      const now = new Date().toISOString();
      const payload = {
        edition: stemChallengeForm.edition.trim(),
        theme: stemChallengeForm.theme.trim(),
        tagline: stemChallengeForm.tagline.trim(),
        deadline: stemChallengeForm.deadline.trim(),
        grandExpoDate: stemChallengeForm.grandExpoDate.trim(),
        location: stemChallengeForm.location.trim(),
        participatingSchools: Number(stemChallengeForm.participatingSchools) || 48,
        countiesRepresented: Number(stemChallengeForm.countiesRepresented) || 15,
        prizes: {
          firstPlace: stemChallengeForm.firstPlacePrize.trim(),
          secondPlace: stemChallengeForm.secondPlacePrize.trim(),
          thirdPlace: stemChallengeForm.thirdPlacePrize.trim(),
          specialCategory: stemChallengeForm.specialCategory.trim()
        },
        tracks: parsedTracks,
        eligibilityRules: parsedRules,
        howToAccomplishOverview: stemChallengeForm.howToAccomplishOverview.trim(),
        accomplishmentRoadmap: parsedRoadmap,
        submissionGuidelines: parsedGuidelines,
        requiredDeliverables: parsedDeliverables,
        evaluationRubric: parsedRubric,
        status: 'active',
        authorUid: currentUser.uid,
        updatedAt: now,
        createdAt: now
      };

      if (activeChallengeDocId) {
        await updateDoc(doc(db, 'stemChallenges', activeChallengeDocId), payload);
        toast.success('National STEM Challenge specifications & proposal guidelines updated live! Changes are now visible on the public proposal page.', 'Challenge & Proposal Details Saved', 6000);
      } else {
        const docRef = await addDoc(collection(db, 'stemChallenges'), payload);
        setActiveChallengeDocId(docRef.id);
        toast.success('National STEM Challenge specifications & proposal guidelines published live! Changes are now visible on the public proposal page.', 'Challenge Published Live', 6000);
      }

      setStemChallengeSuccessMsg('National STEM Challenge specifications and proposal guidelines saved and broadcasted to the public web page successfully!');
      setTimeout(() => setStemChallengeSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Error saving stem challenge:', err);
      setStemChallengeErrorMsg(err.message || 'Failed to save STEM Challenge specifications.');
      toast.error(err.message || 'Failed to save STEM Challenge.', 'Save Error');
    } finally {
      setSavingStemChallenge(false);
    }
  };

  // Handler: Update Proposal Status
  const handleUpdateProposalStatus = async (proposalId: string, newStatus: StemProposal['status']) => {
    try {
      await updateDoc(doc(db, 'stemProposals', proposalId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      if (selectedProposal && selectedProposal.id === proposalId) {
        setSelectedProposal({ ...selectedProposal, status: newStatus });
      }
      toast.success(`Proposal status updated to "${newStatus}"`, 'Status Updated', 3500);
    } catch (err: any) {
      console.error('Error updating proposal status:', err);
      toast.error('Failed to update proposal status: ' + (err.message || 'Permission denied'), 'Error');
    }
  };

  // Handler: Save Reviewer Notes
  const handleSaveReviewerNotes = async (proposalId: string) => {
    setSavingProposalUpdate(true);
    try {
      await updateDoc(doc(db, 'stemProposals', proposalId), {
        reviewerNotes: reviewerNoteInput.trim(),
        updatedAt: new Date().toISOString()
      });
      if (selectedProposal && selectedProposal.id === proposalId) {
        setSelectedProposal({ ...selectedProposal, reviewerNotes: reviewerNoteInput.trim() });
      }
      setProposalUpdateSuccess('Reviewer notes saved successfully!');
      toast.success(`Reviewer notes saved for "${selectedProposal?.title || 'Proposal'}"`, 'Notes Saved', 3500);
      setTimeout(() => setProposalUpdateSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving reviewer notes:', err);
      toast.error('Failed to save notes: ' + (err.message || 'Permission denied'), 'Error');
    } finally {
      setSavingProposalUpdate(false);
    }
  };

  // Handler: Delete Proposal
  const handleDeleteProposal = async (proposalId: string) => {
    if (!window.confirm('Are you sure you want to delete this student proposal record? This action cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'stemProposals', proposalId));
      if (selectedProposal && selectedProposal.id === proposalId) {
        setSelectedProposal(null);
      }
      toast.info('Student proposal record removed from database.', 'Proposal Deleted');
    } catch (err: any) {
      console.error('Error deleting proposal:', err);
      toast.error('Failed to delete proposal: ' + (err.message || 'Permission denied'), 'Delete Error');
    }
  };

  // Handler: Simulate Incoming Student Proposal (Triggers Toast Alert in Realtime)
  const handleSimulateIncomingProposal = async () => {
    const simulationPool = [
      {
        title: 'Solar-Powered Cassava Peeler & Rotary Flash Dryer',
        school: 'Gboveh High School',
        county: 'Bong',
        category: 'Agriculture & Food Security',
        teamLead: 'Korto B. Mulbah',
        studentTeam: ['Emmanuel Z. Kollie', 'Hawa D. Flomo', 'Moses J. Gono'],
        mentor: 'Eng. Patrick K. Tokpah',
        mentorEmail: 'ptokpah@cuttington.edu.lr',
        mentorPhone: '+231 77 012 3456',
        summary: 'A mechanized, solar-battery hybrid machine that peels, grates, and flash-dries cassava into high-grade gari in under 45 minutes.',
        problemStatement: 'Cassava rots quickly in Bong County without prompt mechanized drying during heavy rainfall.',
        solution: 'Engineered a dual-rotor drum powered by a 250W solar array and 12V recycled motor with heat-exchange convection.',
        materialsBudget: '$420 USD',
        prototypeStage: 'Working Prototype' as const,
        status: 'Pending Review' as const,
        reviewerNotes: '',
        submittedAt: new Date().toISOString()
      },
      {
        title: 'Moringa-Sand Multi-Stage Rural Water Purifier',
        school: 'Carroll High School',
        county: 'Nimba',
        category: 'Clean Water & Sanitation',
        teamLead: 'Alphonso T. Gaye',
        studentTeam: ['Blessing S. Wonbenny', 'Jeremiah K. Dahn'],
        mentor: 'Mr. Moses N. Gbarpea',
        mentorEmail: 'mgbarpea@nimbaedu.org',
        mentorPhone: '+231 88 654 3210',
        summary: 'Zero-chemical water filtration column combining crushed Moringa Oleifera seeds, activated coconut charcoal, and silica sand.',
        problemStatement: 'Sanniquellie students lack potable drinking water during school hours.',
        solution: 'Gravity-fed filtration column with solar UV sterilization tubes.',
        materialsBudget: '$180 USD',
        prototypeStage: 'Working Prototype' as const,
        status: 'Pending Review' as const,
        reviewerNotes: '',
        submittedAt: new Date().toISOString()
      },
      {
        title: 'Community SMS Flood Sensor Grid',
        school: 'Monrovia College',
        county: 'Montserrado',
        category: 'Civic & Health Tech',
        teamLead: 'Faith K. Johnson',
        studentTeam: ['Varney B. Taylor', 'Samuel O. Mensah'],
        mentor: 'Mrs. Cynthia Doe',
        mentorEmail: 'cdoe@lta.gov.lr',
        mentorPhone: '+231 77 889 9001',
        summary: 'Ultrasonic canal-depth sensor nodes installed at West Point and Clara Town drainage outlets broadcasting evacuation SMS.',
        problemStatement: 'Unannounced flash floods flood coastal homes during monsoon months.',
        solution: 'Waterproof ultrasonic sensors with GSM SIM modems.',
        materialsBudget: '$250 USD',
        prototypeStage: 'Working Prototype' as const,
        status: 'Pending Review' as const,
        reviewerNotes: '',
        submittedAt: new Date().toISOString()
      },
      {
        title: 'Recycled Plastic Filament 3D Printer for Prosthetics',
        school: 'Booker Washington Institute (BWI)',
        county: 'Margibi',
        category: 'Renewable Energy & Engineering',
        teamLead: 'Comfort M. Johnson',
        studentTeam: ['Gabriel S. Davis', 'Eunice K. Sirleaf'],
        mentor: 'Mr. Emmanuel Cooper',
        mentorEmail: 'ecooper@bwi.edu.lr',
        mentorPhone: '+231 77 654 3210',
        summary: 'Melts discarded plastic water sachets into PET filament to 3D-print low-cost fingers and hand braces for disabled youth.',
        problemStatement: 'Monrovia streets have thousands of discarded plastic sachets causing environmental hazards.',
        solution: 'Custom thermal extruder nozzle and recycled stepper motors.',
        materialsBudget: '$320 USD',
        prototypeStage: 'Working Prototype' as const,
        status: 'Pending Review' as const,
        reviewerNotes: '',
        submittedAt: new Date().toISOString()
      }
    ];

    const sample = simulationPool[Math.floor(Math.random() * simulationPool.length)];
    try {
      const docRef = await addDoc(collection(db, 'stemProposals'), sample);
      // The realtime snapshot listener will immediately fire the alert toast!

      // Also dispatch real-time SMTP alert to administrator
      fetch('/api/notify-stem-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: docRef.id,
          ...sample
        })
      })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          toast.success(`Admin SMTP notification dispatched to ${res.recipient} (${res.mode})`, 'Email Alert Sent', 4000);
        }
      })
      .catch(e => console.warn('Simulation email notify err:', e));
    } catch (err: any) {
      console.error('Error simulating incoming proposal:', err);
      toast.error('Simulation error: ' + err.message, 'Failed');
    }
  };

  // Handler: Fetch SMTP Gateway Configuration Status
  const fetchSmtpStatus = async () => {
    setLoadingSmtpStatus(true);
    try {
      const res = await fetch('/api/smtp-status');
      const data = await res.json();
      if (data.success) {
        setSmtpStatus(data);
        if (!customTestEmail && data.adminEmail) {
          setCustomTestEmail(data.adminEmail);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch SMTP status:', err);
    } finally {
      setLoadingSmtpStatus(false);
    }
  };

  // Handler: Test SMTP Connection & Email Dispatch
  const handleTestSmtpConnection = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: customTestEmail || undefined })
      });
      const data = await res.json();
      if (data.success) {
        setSmtpTestResult({
          success: true,
          message: `Test alert successfully dispatched to ${data.recipient} via ${data.mode}. Message reference: ${data.messageId}`,
          timestamp: new Date().toLocaleTimeString()
        });
        toast.success(`Test alert transmitted to ${data.recipient}!`, 'SMTP Test Successful');
      } else {
        setSmtpTestResult({
          success: false,
          message: data.error || 'SMTP gateway reported a delivery issue. Verify credentials.',
          timestamp: new Date().toLocaleTimeString()
        });
        toast.error(data.error || 'SMTP test error', 'Delivery Notice');
      }
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err.message || 'Network error attempting to contact SMTP gateway.',
        timestamp: new Date().toLocaleTimeString()
      });
      toast.error('Network error executing test', 'Connection Error');
    } finally {
      setTestingSmtp(false);
    }
  };

  // Handler: Open Proposal Alert Email Preview
  const handleOpenProposalAlertPreview = async (proposal: StemProposal) => {
    setProposalAlertPreviewModal({
      isOpen: true,
      proposal,
      previewHtml: null,
      subject: null,
      loading: true,
      sending: false
    });

    try {
      const res = await fetch('/api/preview-stem-proposal-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proposal)
      });
      const data = await res.json();
      if (data.success && data.preview) {
        setProposalAlertPreviewModal(prev => ({
          ...prev,
          previewHtml: data.preview.html,
          subject: data.preview.subject,
          loading: false
        }));
      } else {
        setProposalAlertPreviewModal(prev => ({ ...prev, loading: false }));
      }
    } catch (e) {
      console.warn('Could not generate proposal email preview:', e);
      setProposalAlertPreviewModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Handler: Send / Resend Admin Proposal Alert
  const handleSendAdminProposalAlert = async (proposal: StemProposal, customRecipient?: string) => {
    setProposalAlertPreviewModal(prev => ({ ...prev, sending: true }));
    try {
      const res = await fetch('/api/notify-stem-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...proposal,
          adminEmailOverride: customRecipient || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Proposal notification alert dispatched to ${data.recipient} (${data.mode})!`, 'Alert Dispatched', 5000);
      } else {
        toast.error(`Dispatch notice: ${data.error}`, 'Notification Notice');
      }
    } catch (e: any) {
      toast.error(`Failed to dispatch alert: ${e.message}`, 'Dispatch Error');
    } finally {
      setProposalAlertPreviewModal(prev => ({ ...prev, sending: false }));
    }
  };

  // Handler: Seed Sample Proposals
  const handleSeedSampleProposals = async () => {
    if (!currentUser) return;
    try {
      const sampleProposals = [
        {
          title: 'Solar-Powered Cassava Peeler & Rotary Flash Dryer',
          school: 'Gboveh High School',
          county: 'Bong',
          category: 'Agriculture & Food Security',
          teamLead: 'Korto B. Mulbah',
          studentTeam: ['Emmanuel Z. Kollie', 'Hawa D. Flomo', 'Moses J. Gono'],
          mentor: 'Eng. Patrick K. Tokpah',
          mentorEmail: 'ptokpah@cuttington.edu.lr',
          mentorPhone: '+231 77 012 3456',
          summary: 'A mechanized, solar-battery hybrid machine that peels, grates, and flash-dries cassava into high-grade gari in under 45 minutes, saving rural farmers 80% manual labor time.',
          problemStatement: 'Over 35% of raw cassava rots in Bong and Nimba due to high humidity and slow manual peeling with dull kitchen knives during rainy season.',
          solution: 'Engineered a dual-rotor drum powered by a 250W solar array and 12V recycled motor with a heat-exchange convection chamber.',
          materialsBudget: '$420 USD (Solar Panel, 12V Motor, Scrap Stainless Drum)',
          prototypeStage: 'Working Prototype',
          status: 'Shortlisted for Expo',
          reviewerNotes: 'High community relevance. Recommend prioritizing for $5,000 Laboratory Grant pitching.',
          submittedAt: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          title: 'Multi-Stage Moringa-Sand Rural Water Purification Unit',
          school: 'Carroll High School',
          county: 'Nimba',
          category: 'Clean Water & Sanitation',
          teamLead: 'Alphonso T. Gaye',
          studentTeam: ['Blessing S. Wonbenny', 'Jeremiah K. Dahn'],
          mentor: 'Mr. Moses N. Gbarpea',
          mentorEmail: 'mgbarpea@nimbaedu.org',
          mentorPhone: '+231 88 654 3210',
          summary: 'A zero-chemical water filtration station combining crushed Moringa Oleifera seeds, activated coconut charcoal, and silica sand to purify creek water.',
          problemStatement: 'Rural high school students in Sanniquellie lack clean drinking water during class hours, causing severe water-borne absenteeism.',
          solution: 'Inverted gravity-fed multi-tier column that coagulates suspended turbidity with Moringa seed powder and sterilizes with UV-reflective solar tubes.',
          materialsBudget: '$180 USD (PVC Columns, Moringa Seeds, Charcoal, Graded Sand)',
          prototypeStage: 'Field Tested',
          status: 'Under Evaluation',
          reviewerNotes: 'Chemical-free and extremely low cost for rural clinics. Verified WHO turbidity reduction.',
          submittedAt: new Date(Date.now() - 86400000 * 5).toISOString()
        },
        {
          title: 'SMS Early Flood Warning & Drainage Monitor for Coastal Slums',
          school: 'Monrovia College',
          county: 'Montserrado',
          category: 'Civic & Health Tech',
          teamLead: 'Faith K. Johnson',
          studentTeam: ['Varney B. Taylor', 'Samuel O. Mensah'],
          mentor: 'Mrs. Cynthia Doe',
          mentorEmail: 'cdoe@lta.gov.lr',
          mentorPhone: '+231 77 889 9001',
          summary: 'An ultrasonic water-level sensor array placed in vulnerable drainage canals (West Point, Clara Town) that sends automated bulk SMS alerts to community chairpersons.',
          problemStatement: 'Unplanned urban slums in Monrovia suffer flash flooding every June with zero warning to evacuate vulnerable families.',
          solution: 'Waterproof Arduino sensor nodes with GSM SIM modules broadcasting warning SMS when water reaches 80% capacity.',
          materialsBudget: '$250 USD (Arduino Nano, Ultrasonic Sensors, GSM Modules, Solar Li-ion Bank)',
          prototypeStage: 'Working Prototype',
          status: 'Pending Review',
          reviewerNotes: 'Excellent hardware-software integration. Checking GSM carrier connectivity in West Point.',
          submittedAt: new Date(Date.now() - 86400000 * 1).toISOString()
        }
      ];

      for (const p of sampleProposals) {
        await addDoc(collection(db, 'stemProposals'), p);
      }
      toast.success('Sample student project proposals generated successfully!', 'Seeding Complete');
    } catch (err: any) {
      console.error('Error seeding sample proposals:', err);
      toast.error('Failed to seed proposals: ' + err.message, 'Error');
    }
  };

  // Handler: Export CSV
  const handleExportProposalsCSV = () => {
    if (stemProposalsList.length === 0) {
      toast.warning('No student proposals to export.', 'Export Empty');
      return;
    }

    const headers = ['ID', 'Title', 'School', 'County', 'Category', 'Team Lead', 'Mentor', 'Mentor Phone', 'Mentor Email', 'Stage', 'Status', 'Submitted At', 'Budget', 'Reviewer Notes'];
    const rows = stemProposalsList.map(p => [
      p.id,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      `"${(p.school || '').replace(/"/g, '""')}"`,
      p.county,
      p.category,
      `"${(p.teamLead || '').replace(/"/g, '""')}"`,
      `"${(p.mentor || '').replace(/"/g, '""')}"`,
      `"${(p.mentorPhone || '').replace(/"/g, '""')}"`,
      `"${(p.mentorEmail || '').replace(/"/g, '""')}"`,
      p.prototypeStage || '',
      p.status,
      new Date(p.submittedAt).toLocaleDateString(),
      `"${(p.materialsBudget || '').replace(/"/g, '""')}"`,
      `"${(p.reviewerNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `YFC_STEM_Proposals_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${stemProposalsList.length} student proposals to CSV!`, 'Export Successful', 4000);
  };

  // Delete a donation record
  const handleDeleteDonation = async (donationId: string) => {
    if (!window.confirm('Are you sure you want to remove this contribution ledger record?')) return;
    try {
      await deleteDoc(doc(db, 'donations', donationId));
    } catch (err: any) {
      console.error('Error deleting donation:', err);
      alert('Failed to delete donation record: ' + (err.message || 'Permission denied'));
    }
  };

  // Toggle verification status of donation
  const handleToggleVerifyDonation = async (donation: DonationRecord) => {
    const nextStatus = donation.status === 'verified' ? 'confirmed' : 'verified';
    try {
      await updateDoc(doc(db, 'donations', donation.id), {
        status: nextStatus
      });
    } catch (err: any) {
      console.error('Error updating donation status:', err);
      alert('Failed to update status: ' + (err.message || 'Permission denied'));
    }
  };

  // Update application review status (Approve / Reject / Pending) and auto-notify partner by email
  const handleUpdateApplicationStatus = async (
    appId: string, 
    newStatus: 'pending' | 'approved' | 'rejected', 
    notes?: string,
    skipEmail: boolean = false
  ) => {
    if (!currentUser) return;
    setSavingAppUpdate(true);
    try {
      const targetApp = applicationsList.find(a => a.id === appId) || selectedApplication;
      
      const updatePayload: any = {
        status: newStatus,
        reviewedBy: currentUser.displayName || currentUser.email || 'National Secretariat',
        reviewedAt: new Date().toISOString()
      };
      if (notes !== undefined) {
        updatePayload.reviewerNotes = notes;
      }
      
      // If approved and is a partner or sponsor, sync to dedicated partners collection for direct accreditation
      if (newStatus === 'approved' && targetApp && (targetApp.type === 'partner' || targetApp.type === 'sponsor')) {
        try {
          const partnerDoc = normalizeToPartnerOrg(targetApp, appId);
          await setDoc(doc(db, 'partners', appId), {
            ...partnerDoc,
            isLive: true,
            approvedAt: new Date().toISOString(),
            approvedBy: currentUser.displayName || currentUser.email || 'National Secretariat'
          }, { merge: true });
        } catch (syncErr) {
          console.warn('Partner collection sync warning:', syncErr);
        }
      }

      await updateDoc(doc(db, 'involvementApplications', appId), updatePayload);
      
      setApplicationsList(prev => prev.map(item => 
        item.id === appId ? { ...item, ...updatePayload } : item
      ));

      if (selectedApplication && selectedApplication.id === appId) {
        setSelectedApplication(prev => prev ? { ...prev, ...updatePayload } : null);
      }

      const statusLabels = {
        approved: 'Application APPROVED and certified in official Secretariat registry!',
        rejected: 'Application marked as REJECTED with feedback notice.',
        pending: 'Application reset to PENDING queue.'
      };

      toast.success(statusLabels[newStatus] || `Application updated to ${newStatus}.`, 'Review Updated');

      // Trigger automatic transactional email notification if recipient email exists
      if (!skipEmail && targetApp && targetApp.email) {
        try {
          const emailResponse = await fetch('/api/send-partner-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              partnerName: targetApp.name,
              email: targetApp.email,
              orgName: targetApp.schoolOrOrg || targetApp.name,
              status: newStatus,
              partnerType: targetApp.partnerType || (targetApp.type === 'sponsor' ? 'Corporate Sponsor' : 'Strategic Partner'),
              county: targetApp.county || 'Montserrado',
              reviewerNotes: notes !== undefined ? notes : targetApp.reviewerNotes,
              applicationId: appId
            })
          });
          const emailData = await emailResponse.json();
          if (emailData.success) {
            const emailMeta = {
              emailNotificationSent: true,
              lastEmailStatus: newStatus,
              lastEmailSentAt: new Date().toISOString(),
              emailSimulated: emailData.simulated || false
            };
            await updateDoc(doc(db, 'involvementApplications', appId), emailMeta);
            
            setApplicationsList(prev => prev.map(item => 
              item.id === appId ? { ...item, ...emailMeta } : item
            ));
            if (selectedApplication && selectedApplication.id === appId) {
              setSelectedApplication(prev => prev ? { ...prev, ...emailMeta } : null);
            }

            toast.success(
              `Official ${newStatus.toUpperCase()} notification email delivered to ${targetApp.email}!`,
              emailData.simulated ? 'Email Dispatched (Test Logged)' : 'Official Email Dispatched',
              4500
            );
          }
        } catch (emailErr: any) {
          console.warn('Notification email dispatch encountered an issue:', emailErr);
          toast.info(`Status updated. Notification email queue attempted for ${targetApp.email}.`, 'Email Notice');
        }
      }
    } catch (err: any) {
      console.error('Error updating application status:', err);
      toast.error('Failed to update status: ' + err.message, 'Update Failed');
    } finally {
      setSavingAppUpdate(false);
    }
  };

  // Open interactive Email Preview modal
  const handlePreviewPartnerEmail = async (
    app: InvolvementApplication, 
    targetStatus?: 'approved' | 'pending' | 'rejected'
  ) => {
    const status = targetStatus || app.status;
    setEmailPreviewModal({
      isOpen: true,
      app,
      status,
      subject: `[Youth For Change Liberia] Update on your Application: ${status.toUpperCase()}`,
      html: '<div style="padding: 20px; text-align: center;">Rendering official YFC email preview...</div>',
      recipient: app.email,
      loading: true
    });

    try {
      const res = await fetch('/api/preview-partner-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerName: app.name,
          email: app.email,
          orgName: app.schoolOrOrg || app.name,
          status,
          partnerType: app.partnerType || (app.type === 'sponsor' ? 'Corporate Sponsor' : 'Strategic Partner'),
          county: app.county || 'Montserrado',
          reviewerNotes: app.reviewerNotes || 'Thank you for your active collaboration with Youth For Change Liberia.',
          applicationId: app.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setEmailPreviewModal(prev => ({
          ...prev,
          subject: data.subject,
          html: data.html,
          loading: false
        }));
      } else {
        throw new Error(data.message || 'Failed to render preview');
      }
    } catch (err: any) {
      console.error('Email preview error:', err);
      setEmailPreviewModal(prev => ({
        ...prev,
        html: `<div style="color: #b91c1c; padding: 20px;">Failed to generate email preview: ${err.message}</div>`,
        loading: false
      }));
    }
  };

  // Manually send / resend notification email from modal or table
  const handleSendPartnerEmailManual = async (
    app: InvolvementApplication, 
    statusOverride?: 'approved' | 'pending' | 'rejected',
    customNotes?: string
  ) => {
    if (!app.email) {
      toast.error('This applicant does not have a valid email address on file.', 'Missing Email');
      return;
    }
    setSendingNotificationEmail(true);
    try {
      const currentStatus = statusOverride || app.status;
      const res = await fetch('/api/send-partner-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerName: app.name,
          email: app.email,
          orgName: app.schoolOrOrg || app.name,
          status: currentStatus,
          partnerType: app.partnerType || (app.type === 'sponsor' ? 'Corporate Sponsor' : 'Strategic Partner'),
          county: app.county || 'Montserrado',
          reviewerNotes: customNotes !== undefined ? customNotes : app.reviewerNotes,
          applicationId: app.id
        })
      });
      const data = await res.json();
      if (data.success) {
        const emailMeta = {
          emailNotificationSent: true,
          lastEmailStatus: currentStatus,
          lastEmailSentAt: new Date().toISOString(),
          emailSimulated: data.simulated || false
        };
        await updateDoc(doc(db, 'involvementApplications', app.id), emailMeta);
        
        setApplicationsList(prev => prev.map(item => 
          item.id === app.id ? { ...item, ...emailMeta } : item
        ));
        if (selectedApplication && selectedApplication.id === app.id) {
          setSelectedApplication(prev => prev ? { ...prev, ...emailMeta } : null);
        }

        toast.success(
          `Notification email successfully dispatched to ${app.email}!`,
          data.simulated ? 'Dispatched (Logged to Console)' : 'Official Email Dispatched',
          4500
        );
        setEmailPreviewModal(prev => ({ ...prev, isOpen: false }));
      } else {
        throw new Error(data.message || 'Email service rejected dispatch');
      }
    } catch (err: any) {
      console.error('Error dispatching notification email:', err);
      toast.error('Email dispatch failed: ' + err.message, 'Dispatch Error');
    } finally {
      setSendingNotificationEmail(false);
    }
  };

  // Directly register an Institutional Partner / Endorser
  const handleSaveDirectPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerForm.name.trim()) {
      toast.error('Please enter the partner organization name.', 'Name Required');
      return;
    }
    setSavingNewPartner(true);
    try {
      let finalCoverImage = newPartnerForm.coverImage.trim();
      let finalLogoUrl = newPartnerForm.logoUrl.trim();

      if (finalCoverImage.startsWith('data:image')) {
        try {
          finalCoverImage = await compressDataUrlForPermanentStorage(finalCoverImage, 800, 0.75);
        } catch (e) {
          console.warn('Cover image compression warning:', e);
        }
      }

      if (finalLogoUrl.startsWith('data:image')) {
        try {
          finalLogoUrl = await compressDataUrlForPermanentStorage(finalLogoUrl, 400, 0.8);
        } catch (e) {
          console.warn('Logo image compression warning:', e);
        }
      }

      const generatedLogo = newPartnerForm.logoText.trim() || generateLogoText(newPartnerForm.name);
      const partnerDocId = 'partner_' + Date.now();
      const newPartnerData = {
        id: partnerDocId,
        name: newPartnerForm.name.trim(),
        category: newPartnerForm.category,
        description: newPartnerForm.description.trim() || `Official accredited ${newPartnerForm.category.toLowerCase()} partner of Youth For Change Liberia.`,
        logoText: generatedLogo,
        logoUrl: finalLogoUrl,
        coverImage: finalCoverImage,
        county: newPartnerForm.county,
        websiteUrl: newPartnerForm.websiteUrl.trim(),
        contactEmail: newPartnerForm.contactEmail.trim(),
        contactPerson: newPartnerForm.contactPerson.trim(),
        accentColor: newPartnerForm.accentColor || getCategoryBadgeStyles(newPartnerForm.category),
        isLive: true,
        source: 'manual',
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser?.displayName || currentUser?.email || 'National Secretariat'
      };

      // Save to Firestore partners collection
      await setDoc(doc(db, 'partners', partnerDocId), newPartnerData);

      // Also create an approved application record for auditing
      await setDoc(doc(db, 'involvementApplications', partnerDocId), {
        id: partnerDocId,
        type: 'partner',
        name: newPartnerForm.name.trim(),
        email: newPartnerForm.contactEmail.trim() || 'secretariat@youthforchange.org.lr',
        phone: '',
        county: newPartnerForm.county,
        schoolOrOrg: newPartnerForm.name.trim(),
        partnerType: newPartnerForm.category,
        message: newPartnerForm.description.trim(),
        websiteUrl: newPartnerForm.websiteUrl.trim(),
        coverImage: finalCoverImage,
        logoUrl: finalLogoUrl,
        status: 'approved',
        submittedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser?.displayName || currentUser?.email || 'National Secretariat',
        reviewerNotes: 'Directly accredited by Secretariat Executive.',
        isLive: true,
        emailNotificationSent: !!newPartnerForm.contactEmail && newPartnerForm.notifyByEmail,
        lastEmailStatus: 'approved'
      });

      // Optionally dispatch welcome email if email provided and checked
      if (newPartnerForm.contactEmail.trim() && newPartnerForm.notifyByEmail) {
        try {
          await fetch('/api/send-partner-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              partnerName: newPartnerForm.contactPerson || newPartnerForm.name,
              email: newPartnerForm.contactEmail.trim(),
              orgName: newPartnerForm.name.trim(),
              status: 'approved',
              partnerType: newPartnerForm.category,
              county: newPartnerForm.county,
              reviewerNotes: 'Welcome to the Youth For Change Liberia partner coalition!',
              applicationId: partnerDocId
            })
          });
        } catch (mailErr) {
          console.warn('Direct partner email dispatch warning:', mailErr);
        }
      }

      toast.success(`${newPartnerForm.name} is now accredited and published live on the website!`, 'Partner Published Live', 5000);
      setShowAddPartnerModal(false);
      setNewPartnerForm({
        name: '',
        category: 'International Agency',
        description: '',
        logoText: '',
        logoUrl: '',
        coverImage: '',
        county: 'Montserrado',
        websiteUrl: '',
        contactEmail: '',
        contactPerson: '',
        accentColor: 'border-blue-500 text-blue-800 bg-blue-50/80',
        notifyByEmail: true
      });
    } catch (err: any) {
      console.error('Error saving direct partner:', err);
      toast.error('Failed to publish partner: ' + err.message, 'Save Error');
    } finally {
      setSavingNewPartner(false);
    }
  };

  // Save reviewer notes for application
  const handleSaveAppReviewNotes = async (appId: string) => {
    if (!currentUser) return;
    setSavingAppUpdate(true);
    try {
      await updateDoc(doc(db, 'involvementApplications', appId), {
        reviewerNotes: appReviewerNotes,
        reviewedBy: currentUser.displayName || currentUser.email || 'National Secretariat',
        reviewedAt: new Date().toISOString()
      });

      setApplicationsList(prev => prev.map(item => 
        item.id === appId ? { ...item, reviewerNotes: appReviewerNotes } : item
      ));

      if (selectedApplication && selectedApplication.id === appId) {
        setSelectedApplication(prev => prev ? { ...prev, reviewerNotes: appReviewerNotes } : null);
      }

      setAppUpdateSuccess('Reviewer notes saved successfully!');
      setTimeout(() => setAppUpdateSuccess(null), 3500);
      toast.success('Confidential reviewer notes recorded in Secretariat file.', 'Notes Saved');
    } catch (err: any) {
      console.error('Error saving application notes:', err);
      toast.error('Failed to save notes: ' + err.message, 'Error');
    } finally {
      setSavingAppUpdate(false);
    }
  };

  // Delete application record
  const handleDeleteApplication = async (appId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this application record from Secretariat database?')) return;
    try {
      await deleteDoc(doc(db, 'involvementApplications', appId));
      setApplicationsList(prev => prev.filter(item => item.id !== appId));
      if (selectedApplication && selectedApplication.id === appId) {
        setSelectedApplication(null);
      }
      toast.success('Application record removed.', 'Record Deleted');
    } catch (err: any) {
      console.error('Error deleting application:', err);
      toast.error('Failed to delete application: ' + err.message, 'Delete Error');
    }
  };

  // Simulate an incoming application
  const handleSimulateApplication = async (type: InvolvementApplication['type']) => {
    try {
      const sampleNames: Record<string, string[]> = {
        student: ['Garmai K. Flomo', 'Mannah V. Sirleaf', 'Tenneh D. Weah', 'Alphonso K. Tweh', 'Princess M. Kollie'],
        school: ['St. Teresa\'s Convent High School', 'William V.S. Tubman High School', 'Kakata Rural Teacher Training Dem. School', 'Gbarnga Central High School', 'St. Patrick\'s High School'],
        volunteer: ['Atty. Samuel K. Gbotoe', 'Eng. Bendu S. Taylor', 'Cllr. Josephine M. Collins', 'Dr. Augustine F. Nyenswah'],
        sponsor: ['Orange Liberia Telecommunications', 'CEMENCO Liberia Ltd', 'Mano Palm Oil Industries', 'Liberia Bank for Development & Investment (LBDI)'],
        partner: ['Center for Democratic Empowerment (CODEL)', 'Liberian Educational Trust', 'Federation of Liberian Youth (FLY)']
      };

      const namePool = sampleNames[type] || ['Applicant'];
      const name = namePool[Math.floor(Math.random() * namePool.length)];
      const counties = ['Montserrado', 'Nimba', 'Bong', 'Margibi', 'Grand Bassa', 'Lofa', 'Maryland', 'Grand Cape Mount'];
      const county = counties[Math.floor(Math.random() * counties.length)];

      const schoolSample = type === 'school' ? name : (type === 'student' ? 'Booker Washington Institute (BWI)' : 'Liberia Leadership Forum');

      const payload: Partial<InvolvementApplication> = {
        type,
        name,
        email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.org.lr`,
        phone: `+231 77 ${Math.floor(100000 + Math.random() * 900000)}`,
        county,
        schoolOrOrg: schoolSample,
        roleOrInterest: type === 'student' 
          ? 'Student Scholar & Debate Forensics Team' 
          : (type === 'school' 
            ? 'National High School Debate Championship Enrollment' 
            : (type === 'volunteer' 
              ? 'Senior Debate Adjudicator & Rules Judge' 
              : (type === 'sponsor' 
                ? 'County Grand Finals Title Sponsor' 
                : 'National Youth Educational Policy Reform'))),
        status: 'pending',
        submittedAt: new Date().toISOString(),
        message: type === 'student'
          ? `I am an ambitious student debater passionate about constitutional law and civic rights. I hope to represent ${county} County and qualify for a university tuition scholarship grant.`
          : (type === 'school'
            ? `Our high school administration requests official enrollment of a 6-student delegation into the National Debate Championship with faculty coach accreditation.`
            : `We are eager to support Youth For Change Liberia's mission across the educational and forensics space in ${county} County.`),
        ...(type === 'student' && {
          gradeLevel: 'Grade 11 (Junior)',
          scholarshipInterest: true,
          careerAspiration: 'Constitutional Law & Human Rights'
        }),
        ...(type === 'school' && {
          principalOrHead: 'Rev. Dr. Josiah Gaye',
          delegationSize: 6
        }),
        ...(type === 'sponsor' && {
          sponsorshipTier: 'Silver Partner ($1,500)',
          pledgedAmount: 1500,
          currency: 'USD'
        }),
        ...(type === 'partner' && {
          partnerType: 'International NGO / Development Agency'
        })
      };

      await addDoc(collection(db, 'involvementApplications'), payload);
    } catch (err: any) {
      console.error('Error simulating application:', err);
      toast.error('Simulation failed: ' + err.message, 'Simulation Error');
    }
  };

  // Seed 5 sample applications across all categories
  const handleSeedSampleApplications = async () => {
    if (!currentUser) return;
    try {
      const samples: Partial<InvolvementApplication>[] = [
        {
          type: 'student',
          name: 'Blessing K. Freeman',
          email: 'bfreeman@scholar.org.lr',
          phone: '+231 77 412 8890',
          schoolOrOrg: 'Carver Christian High School',
          county: 'Montserrado',
          roleOrInterest: 'Student Scholar & Debate Forensics Team',
          status: 'pending',
          gradeLevel: 'Grade 11 (Junior)',
          scholarshipInterest: true,
          careerAspiration: 'International Human Rights Law',
          message: 'Top speaker in Montserrado District 4 qualifiers. Seeking YFC Best Speaker College Scholarship endowment.',
          submittedAt: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          type: 'student',
          name: 'Tamba M. Kollie',
          email: 'tkollie@stem.edu.lr',
          phone: '+231 88 519 2234',
          schoolOrOrg: 'Voinjama High School',
          county: 'Lofa',
          roleOrInterest: 'National STEM Challenge Innovator',
          status: 'pending',
          gradeLevel: 'Grade 12 (Senior / WAEC Candidate)',
          scholarshipInterest: true,
          careerAspiration: 'Renewable Energy & Solar Engineering',
          message: 'Developed working prototype for bio-sand water filtration node for rural clinics in Lofa County.',
          submittedAt: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
          type: 'school',
          name: 'Mother Tegeste Stewart High School',
          principalOrHead: 'Mother Theresa K. Toe',
          delegationSize: 6,
          email: 'admin@tegaste.edu.lr',
          phone: '+231 77 009 3344',
          schoolOrOrg: 'Mother Tegeste Stewart High School',
          county: 'Grand Bassa',
          roleOrInterest: 'National High School Debate Championship Enrollment',
          status: 'pending',
          message: 'Official enrollment request for 2024/25 tournament season. 2 faculty debate coaches ready for workshop certification.',
          submittedAt: new Date(Date.now() - 3600000 * 8).toISOString()
        },
        {
          type: 'volunteer',
          name: 'Cllr. Jefferson B. Kesselley',
          email: 'jkesselley@barassociation.lr',
          phone: '+231 77 655 4433',
          schoolOrOrg: 'Liberian National Bar Association',
          county: 'Montserrado',
          roleOrInterest: 'Chief Forensics Judge & WSDC Adjudicator',
          status: 'pending',
          message: 'Senior trial attorney with 8 years of moot court and competitive debate judging experience.',
          submittedAt: new Date(Date.now() - 3600000 * 12).toISOString()
        },
        {
          type: 'sponsor',
          name: 'National Port Authority (NPA) Community Fund',
          sponsorshipTier: 'Gold Patron ($3,500 USD / L$682,500)',
          pledgedAmount: 3500,
          currency: 'USD',
          email: 'partnerships@npa.gov.lr',
          phone: '+231 77 900 1122',
          schoolOrOrg: 'National Port Authority',
          county: 'Montserrado',
          roleOrInterest: 'Rural County Bus Transit & Travel Underwriter',
          status: 'pending',
          message: 'Underwriting bus transportation and lodging for Southeast County debate delegations (Maryland, Grand Kru, Sinoe, River Gee).',
          submittedAt: new Date(Date.now() - 3600000 * 24).toISOString()
        }
      ];

      for (const item of samples) {
        await addDoc(collection(db, 'involvementApplications'), item);
      }
      toast.success('5 sample applications generated across Students, Schools, Volunteers & Sponsors!', 'Seeding Complete');
    } catch (err: any) {
      console.error('Error seeding applications:', err);
      toast.error('Failed to seed applications: ' + err.message, 'Seeding Failed');
    }
  };

  // Export applications to CSV
  const handleExportApplicationsCSV = () => {
    if (applicationsList.length === 0) {
      toast.warning('No applications to export.', 'Export Empty');
      return;
    }

    const headers = [
      'ID', 'Type', 'Full Name', 'Email', 'Phone', 'School / Entity', 'County', 
      'Role / Track', 'Status', 'Grade Level / Tier', 'Scholarship Interest', 
      'Delegation Size', 'Pledged Amount', 'Submitted At', 'Reviewer Notes'
    ];

    const rows = applicationsList.map(a => [
      a.id,
      a.type,
      `"${(a.name || '').replace(/"/g, '""')}"`,
      `"${a.email}"`,
      `"${a.phone}"`,
      `"${(a.schoolOrOrg || '').replace(/"/g, '""')}"`,
      a.county,
      `"${(a.roleOrInterest || '').replace(/"/g, '""')}"`,
      a.status,
      `"${a.gradeLevel || a.sponsorshipTier || a.partnerType || ''}"`,
      a.scholarshipInterest ? 'Yes' : 'No',
      a.delegationSize || '',
      a.pledgedAmount ? `${a.currency || 'USD'} ${a.pledgedAmount}` : '',
      new Date(a.submittedAt).toLocaleDateString(),
      `"${(a.reviewerNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `YFC_Applications_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${applicationsList.length} applications to CSV!`, 'Export Complete', 4000);
  };

  // Handle Sign In with Official Email & Secret Password
  const handleEmailAuth = async (e?: React.FormEvent, directEmail?: string, directPassword?: string, directName?: string) => {
    if (e) e.preventDefault();
    setAuthError(null);
    setAuthSuccessNotice(null);
    setSubmittingAuth(true);

    const targetEmail = (directEmail || email).trim().toLowerCase();
    const targetPassword = directPassword || password;
    const targetName = directName || displayName;

    try {
      if (authMode === 'signup') {
        const userCred = await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
        if (targetName) {
          await updateProfile(userCred.user, { displayName: targetName });
        }
        setAuthSuccessNotice('Official credentials registered and authenticated!');
      } else {
        try {
          await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
        } catch (signInErr: any) {
          // If the official credential account has not yet been registered in Firebase Auth on this project,
          // automatically provision it with the matching official name!
          const matchingOfficial = OFFICIAL_YFC_CREDENTIALS.find(c => c.email.toLowerCase() === targetEmail);
          if (matchingOfficial && (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential')) {
            const newCred = await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
            await updateProfile(newCred.user, { displayName: matchingOfficial.role });
            setAuthSuccessNotice(`Authenticated as ${matchingOfficial.role}`);
          } else {
            throw signInErr;
          }
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError('Invalid credentials. Please verify your official email and secret password, or use the quick credential selector.');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('This email is already registered. Please use Sign In with your secret password.');
      } else if (err.code === 'auth/weak-password') {
        setAuthError('Secret password must be at least 6 characters.');
      } else {
        setAuthError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setSubmittingAuth(false);
    }
  };

  // Quick Select and Fill Official Credential
  const handleSelectCredential = (cred: typeof OFFICIAL_YFC_CREDENTIALS[0], autoSubmit: boolean = false) => {
    setEmail(cred.email);
    setPassword(cred.secret);
    setDisplayName(cred.role);
    setAuthError(null);

    if (autoSubmit) {
      handleEmailAuth(undefined, cred.email, cred.secret, cred.role);
    }
  };

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Story Image Attachment Handler
  const handleStoryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      toast.warning('Image file exceeds 2.5MB. Please choose a smaller image.', 'File Size Warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const result = uploadEvent.target?.result as string;
      if (result) {
        setStoryForm(prev => ({ ...prev, image: result }));
        toast.success(`Image file "${file.name}" attached successfully!`, 'Image Attached', 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  // Publish Story to Firestore
  const handlePublishStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setStoryErrorMsg(null);
    setSavingStory(true);

    try {
      const paragraphs = storyForm.fullContentText
        .split('\n\n')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      const formattedParagraphs = paragraphs.length > 0 ? paragraphs : [storyForm.summary];

      const newStoryData = {
        title: storyForm.title.trim(),
        category: storyForm.category,
        author: storyForm.author.trim() || 'Youth For Change Desk',
        source: storyForm.source.trim() || 'Official Press Release',
        readTime: storyForm.readTime.trim() || '3 min read',
        image: storyForm.image.trim() || 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&q=80&w=1200',
        summary: storyForm.summary.trim(),
        fullContent: formattedParagraphs,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        authorUid: currentUser.uid,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'stories'), newStoryData);
      setStorySuccessMsg('Story successfully published live to the Press & Media section!');
      toast.success(
        `Press story "${storyForm.title.trim()}" published live to Press & Media section!`,
        'File Upload Successful',
        5000
      );

      setStoryForm({
        title: '',
        category: 'Tournament News',
        author: currentUser.displayName || 'Youth For Change Editorial Desk',
        source: 'Official Press Release',
        readTime: '3 min read',
        image: '',
        summary: '',
        fullContentText: ''
      });
      setTimeout(() => {
        setStoryModalOpen(false);
        setStorySuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      console.error('Error publishing story:', err);
      setStoryErrorMsg(err.message || 'Failed to publish story to database.');
      toast.error(err.message || 'Failed to publish story.', 'Upload Error');
    } finally {
      setSavingStory(false);
    }
  };

  // Delete Story from Firestore
  const handleDeleteStory = async (storyId: string) => {
    if (!window.confirm('Are you sure you want to delete this story? It will be removed from public view.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'stories', storyId));
      toast.info('Press story deleted from live database.', 'Story Deleted');
    } catch (err) {
      console.error('Error deleting story:', err);
      toast.error('Failed to delete story.', 'Error');
    }
  };

  // Document File Attachment Handler
  const handleDocFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const mappedType = ext === 'doc' || ext === 'docx' ? 'doc' : ext === 'xlsx' || ext === 'csv' || ext === 'xls' ? 'sheet' : 'pdf';

    setDocForm(prev => ({
      ...prev,
      title: prev.title || fileNameWithoutExt.replace(/[-_]/g, ' '),
      fileSize: `${sizeMb} MB`,
      fileType: mappedType as DocumentItem['fileType'],
      tags: prev.tags ? `${prev.tags}, ${ext.toUpperCase()}` : `Official, ${ext.toUpperCase()}`
    }));

    toast.success(
      `Document "${file.name}" (${sizeMb} MB) attached and parsed. Ready to upload!`,
      'File Selected',
      4000
    );
  };

  // Upload Document to Firestore
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setDocErrorMsg(null);
    setSavingDoc(true);

    try {
      // Parse sections text
      const rawBlocks = docForm.sectionsText.split('\n\n');
      const parsedSections: DocumentSection[] = [];
      
      let currentSection: DocumentSection | null = null;
      for (const block of rawBlocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length > 0) {
          if (lines[0].match(/^[0-9]+\./) || lines[0].endsWith(':')) {
            if (currentSection) parsedSections.push(currentSection);
            currentSection = {
              title: lines[0].replace(/^[0-9]+\.\s*/, ''),
              content: lines.slice(1)
            };
          } else {
            if (!currentSection) {
              currentSection = {
                title: 'Section Overview',
                content: lines
              };
            } else {
              currentSection.content.push(...lines);
            }
          }
        }
      }
      if (currentSection) parsedSections.push(currentSection);

      const parsedTags = docForm.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const newDocData = {
        title: docForm.title.trim(),
        category: docForm.category,
        fileType: docForm.fileType,
        fileSize: docForm.fileSize || '1.2 MB',
        authorOrDept: docForm.authorOrDept.trim() || 'Youth For Change Academic Secretariat',
        editionYear: docForm.editionYear || '2024/2025',
        description: docForm.description.trim(),
        tags: parsedTags.length > 0 ? parsedTags : ['Official Document', 'Liberia'],
        contentSections: parsedSections.length > 0 ? parsedSections : [
          {
            title: 'Official Executive Summary',
            content: [docForm.description.trim()]
          }
        ],
        publishDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        downloadCount: 0,
        authorUid: currentUser.uid,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, 'documents'), newDocData);
      setDocSuccessMsg('Official document uploaded and published live to the Documents Portal!');
      toast.success(
        `Document "${docForm.title.trim()}" (${docForm.fileType.toUpperCase()} • ${docForm.fileSize}) successfully uploaded and published to the Documents Repository!`,
        'File Upload Successful',
        5500
      );

      setDocForm({
        title: '',
        category: 'Rulebooks & Guidelines',
        fileType: 'pdf',
        authorOrDept: 'YFC Academic & Forensics Secretariat',
        editionYear: '2024/2025',
        fileSize: '1.2 MB',
        description: '',
        tags: 'Rulebook, Tournament, Liberia Debate',
        sectionsText: ''
      });
      setTimeout(() => {
        setDocModalOpen(false);
        setDocSuccessMsg(null);
      }, 1500);
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setDocErrorMsg(err.message || 'Failed to upload document to database.');
      toast.error(err.message || 'Failed to upload document.', 'Upload Error');
    } finally {
      setSavingDoc(false);
    }
  };

  // Delete Document from Firestore
  const handleDeleteDoc = async (docId: string) => {
    if (!window.confirm('Are you sure you want to delete this document from the official repository?')) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'documents', docId));
      toast.info('Document deleted from repository.', 'Document Deleted');
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error('Failed to delete document.', 'Error');
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-semibold">Initializing Secure Admin Portal...</p>
      </div>
    );
  }

  // If Not Authenticated, Show Official Youth For Change Credentials Login Panel
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 text-white p-6 sm:p-8 text-center space-y-3 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none" />
            <div className="w-16 h-16 mx-auto flex items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
              <YocLogo size="md" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-[11px] font-bold text-yellow-300 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Official Secretariat Desk
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-2">
                {authMode === 'signin' ? 'Administrator Login' : 'Register Official Account'}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/80 max-w-md mx-auto">
                Youth For Change Liberia • National Secretariat & Publications Directorate
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Feedback Notifications */}
            {authError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-2xl flex items-start gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium">{authError}</span>
              </div>
            )}

            {authSuccessNotice && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3.5 rounded-2xl flex items-start gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-medium">{authSuccessNotice}</span>
              </div>
            )}

            {/* Official Credentials Fast Access Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <Key className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Official Youth For Change Accounts</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Verified Roles
                </span>
              </div>

              <div className="space-y-2">
                {OFFICIAL_YFC_CREDENTIALS.map((cred, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border transition-all text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                      email === cred.email
                        ? 'bg-emerald-50/90 border-emerald-300 ring-1 ring-emerald-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{cred.role}</span>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 bg-yellow-100 text-yellow-900 rounded">
                          {cred.badge}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <span>{cred.email}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => handleCopy(cred.email, `email-${idx}`)}
                        title="Copy Official Email"
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedField === `email-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Email</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(cred.secret, `pass-${idx}`)}
                        title="Copy Secret Password"
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedField === `pass-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>Pass</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectCredential(cred, true)}
                        disabled={submittingAuth}
                        className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <Lock className="w-3 h-3 text-yellow-300" />
                        <span>1-Click Log In</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Credentials Form */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Official Staff Name & Position
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Samuel K. Johnson, Assistant Secretary General"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Official Secretariat Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="admin@youthforchange.org.lr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Secret Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? 'Hide' : 'Reveal'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingAuth}
                className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md transition-all cursor-pointer active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-yellow-300" />
                {submittingAuth 
                  ? 'Verifying Credentials...' 
                  : authMode === 'signin' 
                    ? 'Authenticate & Enter Admin Desk' 
                    : 'Register Official Staff Account'}
              </button>
            </form>

            <div className="pt-3 text-center border-t border-slate-100 space-y-2">
              {authMode === 'signin' ? (
                <p className="text-xs text-slate-500">
                  Registering a new staff member?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                    className="text-emerald-800 font-bold hover:underline cursor-pointer"
                  >
                    Create Staff Account
                  </button>
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Already have Secretariat credentials?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('signin'); setAuthError(null); }}
                    className="text-emerald-800 font-bold hover:underline cursor-pointer"
                  >
                    Sign In with Official Credentials
                  </button>
                </p>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>Monrovia, Republic of Liberia • Youth For Change National Secretariat</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Admin Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center">
            <YocLogo size="sm" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified Administrator
              </span>
              <span className="text-xs text-slate-400">• Firestore Connected</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
              Youth For Change Editorial & Document Portal
            </h1>
            <p className="text-xs text-slate-500">
              Logged in as <strong className="text-slate-800">{currentUser.displayName || currentUser.email}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setTab('news')}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" /> View Public Site
          </button>
          <button
            onClick={handleSignOut}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* Admin Module Switcher */}
      <div className="flex border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => setAdminSection('stories')}
          className={`pb-4 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            adminSection === 'stories'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Newspaper className="w-4 h-4" />
          <span>Publish & Manage Stories ({stories.length})</span>
        </button>
        <button
          onClick={() => setAdminSection('documents')}
          className={`pb-4 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            adminSection === 'documents'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Upload & Manage Documents ({documents.length})</span>
        </button>
        <button
          onClick={() => setAdminSection('media')}
          className={`pb-4 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            adminSection === 'media'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Camera className="w-4 h-4 text-emerald-700" />
          <span>Media Archive & Events</span>
        </button>
        <button
          onClick={() => setAdminSection('yearly-report')}
          className={`pb-4 px-5 text-sm font-black flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            adminSection === 'yearly-report'
              ? 'border-yellow-400 text-emerald-950 bg-yellow-400/20 rounded-t-xl'
              : 'border-transparent text-emerald-800 hover:text-emerald-950 bg-yellow-50/80 rounded-t-xl'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-900" />
          <span>Yearly Partner Report</span>
          <span className="text-[10px] bg-yellow-400 text-emerald-950 font-black px-1.5 py-0.2 rounded uppercase">
            Audit
          </span>
        </button>
        <button
          onClick={() => setAdminSection('donations')}
          className={`pb-4 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            adminSection === 'donations'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-600" />
          <span>Contributions Ledger ({donationsList.length})</span>
        </button>
        <button
          onClick={() => setAdminSection('applications')}
          className={`pb-4 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            adminSection === 'applications'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-emerald-700" />
          <span>Applications & Pipeline ({applicationsList.length})</span>
          {applicationsList.filter(a => a.status === 'pending').length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-500 text-slate-950 font-black rounded-full">
              {applicationsList.filter(a => a.status === 'pending').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setAdminSection('stem')}
          className={`pb-4 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            adminSection === 'stem'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4 text-emerald-700" />
          <span>National STEM Challenge ({stemProposalsList.length})</span>
        </button>
        <button
          id="admin-tab-debate-editions"
          onClick={() => setAdminSection('debate-editions')}
          className={`pb-4 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            adminSection === 'debate-editions'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4 text-yellow-600" />
          <span>Debate Editions Archive</span>
        </button>
        <button
          id="admin-tab-leadership"
          onClick={() => setAdminSection('leadership')}
          className={`pb-4 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            adminSection === 'leadership'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-700" />
          <span>Leadership Team Directorate</span>
        </button>
        <button
          id="admin-tab-alumni"
          onClick={() => setAdminSection('alumni')}
          className={`pb-4 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            adminSection === 'alumni'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-emerald-700" />
          <span>Alumni Directory & Testimonials</span>
        </button>
        <button
          id="admin-tab-subscribers"
          onClick={() => setAdminSection('subscribers')}
          className={`pb-4 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            adminSection === 'subscribers'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4 text-emerald-700" />
          <span>Dispatch Subscribers</span>
          {subscribersCount > 0 && (
            <span className="px-2 py-0.5 text-[11px] font-black rounded-full bg-emerald-100 text-emerald-800">
              {subscribersCount}
            </span>
          )}
        </button>
        <button
          id="admin-tab-zoning-fixtures"
          onClick={() => setAdminSection('zoning-fixtures')}
          className={`pb-4 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            adminSection === 'zoning-fixtures'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shuffle className="w-4 h-4 text-emerald-700" />
          <span>School Zoning & Anti-Bias Fixtures</span>
          <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-yellow-400 text-slate-950 uppercase">
            Fair Draw
          </span>
        </button>
        <button
          id="admin-tab-coach-alerts"
          onClick={() => setAdminSection('coach-alerts')}
          className={`pb-4 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            adminSection === 'coach-alerts'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4 text-emerald-700" />
          <span>Automated Coach Alerts</span>
          <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-800 uppercase">
            Email Alerts
          </span>
        </button>
        <button
          id="admin-tab-program-status"
          onClick={() => setAdminSection('program-status')}
          className={`pb-4 px-5 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer shrink-0 ${
            adminSection === 'program-status'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
          <span>Program Registration Status</span>
          <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-yellow-400 text-slate-950 uppercase">
            Open / Close
          </span>
        </button>
      </div>

      {/* SECTION: STORIES MANAGEMENT */}
      {adminSection === 'stories' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-900 text-white p-6 rounded-2xl shadow-md">
            <div>
              <h2 className="text-xl font-bold">News & Story Publishing Desk</h2>
              <p className="text-xs text-emerald-200 mt-1 max-w-xl">
                Post official press releases, tournament updates, county debate briefings, and STEM features. Published articles appear instantly on the public website.
              </p>
            </div>
            <button
              onClick={() => { setStoryModalOpen(true); setStoryErrorMsg(null); }}
              className="bg-yellow-400 hover:bg-yellow-300 text-emerald-950 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Post New Story
            </button>
          </div>

          {/* Stories List */}
          {loadingStories ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-semibold text-slate-500">Loading published stories...</p>
            </div>
          ) : stories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No stories published yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click "Post New Story" above to publish the first official tournament update or press release to the live site.
              </p>
              <button
                onClick={() => setStoryModalOpen(true)}
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create First Story
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stories.map((story) => (
                <div 
                  key={story.id} 
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {story.image && (
                      <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                        <img 
                          src={story.image} 
                          alt={story.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                        <span className="absolute top-3 left-3 bg-emerald-900/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {story.category}
                        </span>
                      </div>
                    )}
                    <div className="p-5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>{story.date}</span>
                        <span>{story.readTime}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                        {story.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {story.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between mt-4">
                    <span className="text-[11px] text-slate-500 font-medium">By {story.author}</span>
                    <button
                      onClick={() => handleDeleteStory(story.id)}
                      className="text-rose-600 hover:text-rose-800 p-2 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Story"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION: DOCUMENTS MANAGEMENT */}
      {adminSection === 'documents' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-900 text-white p-6 rounded-2xl shadow-md">
            <div>
              <h2 className="text-xl font-bold">Official Document & Publication Repository</h2>
              <p className="text-xs text-emerald-200 mt-1 max-w-xl">
                Upload rulebooks, research dossiers, affiliation forms, judging scorecards, and STEM guides for coaches, debaters, and schools.
              </p>
            </div>
            <button
              onClick={() => { setDocModalOpen(true); setDocErrorMsg(null); }}
              className="bg-yellow-400 hover:bg-yellow-300 text-emerald-950 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
            >
              <UploadCloud className="w-4 h-4" /> Upload Document
            </button>
          </div>

          {/* Documents Table / Grid */}
          {loadingDocs ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-semibold text-slate-500">Loading official documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No documents uploaded yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Click "Upload Document" above to upload rulebooks, guidelines, and whitepapers for student download.
              </p>
              <button
                onClick={() => setDocModalOpen(true)}
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" /> Upload First Document
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 uppercase border border-emerald-200">
                        {doc.fileType}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                            {doc.category}
                          </span>
                          <span className="text-xs text-slate-400">• {doc.editionYear} Edition</span>
                          <span className="text-xs text-slate-400">• {doc.fileSize}</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900">{doc.title}</h4>
                        <p className="text-xs text-slate-600 line-clamp-1">{doc.description}</p>
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          {doc.tags?.map((t, idx) => (
                            <span key={idx} className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <span className="text-xs text-slate-400">{doc.publishDate}</span>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-rose-600 hover:text-rose-800 p-2 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: POST NEW STORY */}
      {storyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Press Release & Editorial
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">Post New Story</h3>
              </div>
              <button 
                onClick={() => setStoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {storySuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{storySuccessMsg}</span>
              </div>
            )}

            {storyErrorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{storyErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handlePublishStory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Headline / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Grand Bassa High Claims 10th National Debate Championship in Monrovia"
                  value={storyForm.title}
                  onChange={(e) => setStoryForm({ ...storyForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={storyForm.category}
                    onChange={(e) => setStoryForm({ ...storyForm, category: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value="Tournament News">Tournament News</option>
                    <option value="STEM Innovation">STEM Innovation</option>
                    <option value="Policy & Education">Policy & Education</option>
                    <option value="Partner Spotlight">Partner Spotlight</option>
                    <option value="Press Release">Press Release</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Author / Bylines</label>
                  <input
                    type="text"
                    placeholder="e.g. YFC Communications Desk"
                    value={storyForm.author}
                    onChange={(e) => setStoryForm({ ...storyForm, author: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <ImageUploadField
                  label="Story Featured Cover Picture"
                  value={storyForm.image}
                  onChange={(val) => setStoryForm({ ...storyForm, image: val })}
                  aspectRatio="video"
                  presets={[
                    { label: 'Debate Finals', url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80' },
                    { label: 'STEM Robotics', url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80' },
                    { label: 'Youth Summit', url: 'https://images.unsplash.com/photo-1544531585-9847b68c8c86?auto=format&fit=crop&w=1200&q=80' },
                    { label: 'Championship Stage', url: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80' }
                  ]}
                  helperText="Upload any news cover photograph directly from your computer, or pick from our curated samples."
                />

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Read Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 4 min read"
                    value={storyForm.readTime}
                    onChange={(e) => setStoryForm({ ...storyForm, readTime: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Executive Summary / Lead Paragraph *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="A concise 1-2 sentence overview of the news article..."
                  value={storyForm.summary}
                  onChange={(e) => setStoryForm({ ...storyForm, summary: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Article Body (Separate paragraphs with double Enter) *</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Enter the complete text of the story or press release here..."
                  value={storyForm.fullContentText}
                  onChange={(e) => setStoryForm({ ...storyForm, fullContentText: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStory}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Newspaper className="w-3.5 h-3.5" />
                  {savingStory ? 'Publishing Live...' : 'Publish Story to Website'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: UPLOAD DOCUMENT */}
      {docModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Official Publication
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">Upload New Document</h3>
              </div>
              <button 
                onClick={() => setDocModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {docSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{docSuccessMsg}</span>
              </div>
            )}

            {docErrorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{docErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUploadDocument} className="space-y-4">
              <div className="p-3.5 border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Select File from Computer</p>
                    <p className="text-[11px] text-slate-500">Supports PDF, Word (.docx), Excel / CSV (.xlsx), or Toolkits</p>
                  </div>
                </div>
                <label className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Choose File</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                    onChange={handleDocFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., 2025 National Debate Adjudication Manual & Scorecard"
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={docForm.category}
                    onChange={(e) => setDocForm({ ...docForm, category: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value="Rulebooks & Guidelines">Rulebooks & Guidelines</option>
                    <option value="Research Dossiers & Motions">Research Dossiers & Motions</option>
                    <option value="Forms & Affiliation">Forms & Affiliation</option>
                    <option value="Impact Reports & Whitepapers">Impact Reports & Whitepapers</option>
                    <option value="STEM Toolkits">STEM Toolkits</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">File Format</label>
                  <select
                    value={docForm.fileType}
                    onChange={(e) => setDocForm({ ...docForm, fileType: e.target.value as any })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                  >
                    <option value="pdf">PDF Document</option>
                    <option value="doc">Word DOC</option>
                    <option value="sheet">Spreadsheet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Edition / Year</label>
                  <input
                    type="text"
                    placeholder="2024/2025"
                    value={docForm.editionYear}
                    onChange={(e) => setDocForm({ ...docForm, editionYear: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Author / Department</label>
                  <input
                    type="text"
                    placeholder="YFC Academic & Forensics Secretariat"
                    value={docForm.authorOrDept}
                    onChange={(e) => setDocForm({ ...docForm, authorOrDept: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tags (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Rules, Judging, 2025, Montserrado"
                    value={docForm.tags}
                    onChange={(e) => setDocForm({ ...docForm, tags: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description / Purpose *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Describe who this document is for and what it covers..."
                  value={docForm.description}
                  onChange={(e) => setDocForm({ ...docForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Document Sections & Full Text (Formatted as numbered sections)
                </label>
                <textarea
                  rows={5}
                  placeholder="1. Executive Summary&#10;Detailed notes for section 1...&#10;&#10;2. Specific Guidelines&#10;Detailed notes for section 2..."
                  value={docForm.sectionsText}
                  onChange={(e) => setDocForm({ ...docForm, sectionsText: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDocModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDoc}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  {savingDoc ? 'Uploading...' : 'Publish Document Live'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION: MEDIA & KEY EVENTS (PHOTOS, VIDEOS, EVENTS) */}
      {adminSection === 'media' && (
        <AdminMediaManager userEmail={currentUser?.email} />
      )}

      {/* SECTION: DONATIONS & PHILANTHROPY MANAGEMENT */}
      {adminSection === 'donations' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-6 rounded-2xl shadow-md border border-emerald-800">
            <div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-200">
                  Secretariat Financial Oversight
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1">
                Contributions & Philanthropic Ledger
              </h2>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Real-time Firestore audit of supporter gifts, sponsorships, and designated county program funds.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setAdminSection('yearly-report')}
                className="bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md border border-yellow-500/50"
                title="Generate complete official Youth For Change Yearly Report"
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-950" />
                <span>Annual Partner Report</span>
              </button>
              <button
                onClick={() => {
                  const csvRows = [
                    ['Date', 'Reference', 'Donor Name', 'Email', 'Amount', 'Currency', 'Program', 'Payment Method', 'Location', 'Status', 'Message'].join(','),
                    ...donationsList.map(d => [
                      `"${new Date(d.createdAt).toLocaleDateString()}"`,
                      `"${d.transactionReference}"`,
                      `"${d.donorName}"`,
                      `"${d.donorEmail}"`,
                      d.amount,
                      `"${d.currency}"`,
                      `"${d.program}"`,
                      `"${d.paymentMethod}"`,
                      `"${d.countyOrLocation || ''}"`,
                      `"${d.status}"`,
                      `"${(d.message || '').replace(/"/g, '""')}"`
                    ].join(','))
                  ];
                  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `YFC_Liberia_Donations_Export_${new Date().toISOString().slice(0,10)}.csv`;
                  a.click();
                }}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV Ledger</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-bold uppercase">Total Logged Records</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{donationsList.length} Contributions</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Across all 15 Liberian counties & Diaspora</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-bold uppercase">USD Total (Direct)</div>
              <div className="text-2xl font-black text-emerald-800 mt-1">
                ${donationsList.filter(d => d.currency === 'USD').reduce((s, d) => s + d.amount, 0).toLocaleString()} <span className="text-xs font-semibold text-slate-400">USD</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">International & Banking Channels</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-bold uppercase">LRD Total (Local Currency)</div>
              <div className="text-2xl font-black text-yellow-700 mt-1">
                L${donationsList.filter(d => d.currency === 'LRD').reduce((s, d) => s + d.amount, 0).toLocaleString()} <span className="text-xs font-semibold text-slate-400">LRD</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Orange Money & Lonestar MTN MoMo</div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search donor name, email, ref code..."
                value={donationSearch}
                onChange={(e) => setDonationSearch(e.target.value)}
                className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none w-full sm:w-64"
              />
              <select
                value={donationFilter}
                onChange={(e) => setDonationFilter(e.target.value)}
                className="px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-semibold text-slate-700"
              >
                <option value="all">All Causes & Programs</option>
                <option value="travel">Debate Travel & Logistics</option>
                <option value="stem">STEM & Robotics Kits</option>
                <option value="scholarships">College Scholarships</option>
                <option value="library">Library & Rulebooks</option>
              </select>
            </div>

            <div className="text-xs font-semibold text-slate-500">
              Showing {
                donationsList.filter(d => {
                  const matchesSearch = !donationSearch || 
                    d.donorName.toLowerCase().includes(donationSearch.toLowerCase()) ||
                    d.donorEmail.toLowerCase().includes(donationSearch.toLowerCase()) ||
                    d.transactionReference.toLowerCase().includes(donationSearch.toLowerCase());
                  const matchesFilter = donationFilter === 'all' || d.program.toLowerCase().includes(donationFilter);
                  return matchesSearch && matchesFilter;
                }).length
              } of {donationsList.length} entries
            </div>
          </div>

          {/* Donations Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingDonations ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600" />
                <p>Loading real-time contribution records from Cloud Firestore...</p>
              </div>
            ) : donationsList.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-3">
                <Heart className="w-8 h-8 mx-auto text-slate-300" />
                <div className="font-bold text-slate-700">No Contribution Records Yet</div>
                <p className="max-w-md mx-auto">
                  When supporters contribute via Orange Money, Lonestar MoMo, or Card on the public Donate page, their records will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date & Ref</th>
                      <th className="py-3 px-4">Contributor</th>
                      <th className="py-3 px-4">Amount & Frequency</th>
                      <th className="py-3 px-4">Allocated Program</th>
                      <th className="py-3 px-4">Channel & Location</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {donationsList
                      .filter(d => {
                        const matchesSearch = !donationSearch || 
                          d.donorName.toLowerCase().includes(donationSearch.toLowerCase()) ||
                          d.donorEmail.toLowerCase().includes(donationSearch.toLowerCase()) ||
                          d.transactionReference.toLowerCase().includes(donationSearch.toLowerCase());
                        const matchesFilter = donationFilter === 'all' || d.program.toLowerCase().includes(donationFilter);
                        return matchesSearch && matchesFilter;
                      })
                      .map((donation) => (
                        <tr key={donation.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{new Date(donation.createdAt).toLocaleDateString()}</div>
                            <div className="font-mono text-[10px] text-slate-400">{donation.transactionReference}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">
                              {donation.isAnonymous ? 'Anonymous Supporter' : donation.donorName}
                            </div>
                            <div className="text-[11px] text-slate-500">{donation.donorEmail}</div>
                            {donation.message && (
                              <div className="text-[10px] text-slate-600 italic mt-0.5 max-w-xs truncate">
                                "{donation.message}"
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-black text-emerald-800 text-sm">
                              {donation.currency === 'USD' ? `$${donation.amount}` : `L$${donation.amount.toLocaleString()}`}
                            </span>
                            <div className="text-[10px] text-slate-400 capitalize">{donation.frequency}</div>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="text-xs text-slate-900 font-semibold truncate">{donation.program}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="text-xs font-semibold text-slate-800">{donation.paymentMethod}</div>
                            <div className="text-[10px] text-slate-400">{donation.countyOrLocation || 'Liberia'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              donation.status === 'verified'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-yellow-100 text-yellow-900'
                            }`}>
                              {donation.status === 'verified' ? 'Verified Audit' : 'Confirmed'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleToggleVerifyDonation(donation)}
                                title={donation.status === 'verified' ? 'Mark Confirmed' : 'Mark Verified Audit'}
                                className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteDonation(donation.id)}
                                title="Delete Record"
                                className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION: INVOLVEMENT APPLICATIONS PIPELINE */}
      {adminSection === 'applications' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-emerald-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-400/30">
                <Users className="w-3.5 h-3.5" /> Secretariat Adjudication & Roster Register
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Engagement Pipeline & Scholar Applications Desk
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200 max-w-2xl leading-relaxed">
                Review and certify incoming applications for Student Scholars, High School Delegations, Volunteer Judges & Adjudicators, Corporate Sponsors, and Institutional Partners across all 15 counties.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => setShowAddPartnerModal(true)}
                className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Direct Register Partner
              </button>

              {/* Quick Simulate Buttons */}
              <div className="relative group">
                <button
                  type="button"
                  className="px-3.5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Simulate Incoming
                </button>
                <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 hidden group-hover:block z-30 space-y-1">
                  <button
                    onClick={() => handleSimulateApplication('student')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 rounded-lg font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Student Scholar
                  </button>
                  <button
                    onClick={() => handleSimulateApplication('school')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 rounded-lg font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Building className="w-3.5 h-3.5 text-indigo-600" /> School Delegation
                  </button>
                  <button
                    onClick={() => handleSimulateApplication('volunteer')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-900 rounded-lg font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-amber-600" /> Volunteer / Judge
                  </button>
                  <button
                    onClick={() => handleSimulateApplication('sponsor')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-900 rounded-lg font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-purple-600" /> Sponsor Proposal
                  </button>
                  <button
                    onClick={() => handleSimulateApplication('partner')}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-sky-50 hover:text-sky-900 rounded-lg font-semibold transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-sky-600" /> Institutional Partner
                  </button>
                </div>
              </div>

              <button
                onClick={handleExportApplicationsCSV}
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV ({applicationsList.length})
              </button>

              {applicationsList.length === 0 && (
                <button
                  onClick={handleSeedSampleApplications}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Seed Demo Applications
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-bold uppercase">Total Submissions</div>
              <div className="text-xl font-black text-slate-900 mt-1">{applicationsList.length}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">All Pipeline Categories</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-200/70 bg-amber-50/20 shadow-xs">
              <div className="text-[11px] text-amber-700 font-bold uppercase flex items-center justify-between">
                <span>Pending Review</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <div className="text-xl font-black text-amber-900 mt-1">
                {applicationsList.filter(a => a.status === 'pending').length}
              </div>
              <div className="text-[10px] text-amber-700 mt-0.5">Awaiting Certification</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-200/70 bg-emerald-50/20 shadow-xs">
              <div className="text-[11px] text-emerald-700 font-bold uppercase">Approved & Certified</div>
              <div className="text-xl font-black text-emerald-900 mt-1">
                {applicationsList.filter(a => a.status === 'approved').length}
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5">Active in Register</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-bold uppercase">Student Scholars</div>
              <div className="text-xl font-black text-emerald-700 mt-1">
                {applicationsList.filter(a => a.type === 'student').length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Debaters & Innovators</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-bold uppercase">High Schools</div>
              <div className="text-xl font-black text-indigo-700 mt-1">
                {applicationsList.filter(a => a.type === 'school').length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Delegations Enrolled</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="text-[11px] text-slate-500 font-bold uppercase">Volunteers & Judges</div>
              <div className="text-xl font-black text-amber-700 mt-1">
                {applicationsList.filter(a => a.type === 'volunteer').length}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Adjudication Staff</div>
            </div>
          </div>

          {/* Filters & Search Control Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search applicant name, school, email, phone, message..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none"
                />
              </div>

              <select
                value={appTypeFilter}
                onChange={(e) => setAppTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-semibold text-slate-700"
              >
                <option value="all">All Category Streams</option>
                <option value="student">🎓 Student Scholars</option>
                <option value="school">🏫 High School Delegations</option>
                <option value="volunteer">⚖️ Volunteer Judges / Adjudicators</option>
                <option value="sponsor">💎 Sponsors & Philanthropy</option>
                <option value="partner">🤝 Institutional Partners</option>
              </select>

              <select
                value={appStatusFilter}
                onChange={(e) => setAppStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-semibold text-slate-700"
              >
                <option value="all">All Review Statuses</option>
                <option value="pending">⏳ Pending Review</option>
                <option value="approved">✅ Approved & Certified</option>
                <option value="rejected">❌ Rejected</option>
              </select>

              <select
                value={appCountyFilter}
                onChange={(e) => setAppCountyFilter(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none font-semibold text-slate-700"
              >
                <option value="all">All 15 Counties</option>
                {LIBERIA_COUNTIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="text-xs font-semibold text-slate-500 shrink-0 self-center">
              Showing {
                applicationsList.filter(a => {
                  const matchesSearch = !appSearch || 
                    a.name.toLowerCase().includes(appSearch.toLowerCase()) ||
                    (a.schoolOrOrg && a.schoolOrOrg.toLowerCase().includes(appSearch.toLowerCase())) ||
                    a.email.toLowerCase().includes(appSearch.toLowerCase()) ||
                    (a.phone && a.phone.toLowerCase().includes(appSearch.toLowerCase())) ||
                    (a.message && a.message.toLowerCase().includes(appSearch.toLowerCase()));
                  const matchesType = appTypeFilter === 'all' || a.type === appTypeFilter;
                  const matchesStatus = appStatusFilter === 'all' || a.status === appStatusFilter;
                  const matchesCounty = appCountyFilter === 'all' || a.county === appCountyFilter;
                  return matchesSearch && matchesType && matchesStatus && matchesCounty;
                }).length
              } of {applicationsList.length} applications
            </div>
          </div>

          {/* Applications Data Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loadingApplications ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600" />
                <p>Loading real-time application roster from Cloud Firestore...</p>
              </div>
            ) : applicationsList.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 space-y-3">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <div className="font-bold text-slate-700 text-sm">No Engagement Applications Yet</div>
                <p className="max-w-md mx-auto text-slate-500">
                  When students, schools, judges, sponsors, and partners submit through the Get Involved portal or Volunteer dashboard, their profiles will appear here in real-time.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleSeedSampleApplications}
                    className="px-4 py-2 bg-emerald-800 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors cursor-pointer text-xs"
                  >
                    Seed Sample Applications (5)
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Applicant & Entity</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">County / Details</th>
                      <th className="py-3 px-4">Contact Info</th>
                      <th className="py-3 px-4">Status & Email</th>
                      <th className="py-3 px-4">Submitted</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {applicationsList
                      .filter(a => {
                        const matchesSearch = !appSearch || 
                          a.name.toLowerCase().includes(appSearch.toLowerCase()) ||
                          (a.schoolOrOrg && a.schoolOrOrg.toLowerCase().includes(appSearch.toLowerCase())) ||
                          a.email.toLowerCase().includes(appSearch.toLowerCase()) ||
                          (a.phone && a.phone.toLowerCase().includes(appSearch.toLowerCase())) ||
                          (a.message && a.message.toLowerCase().includes(appSearch.toLowerCase()));
                        const matchesType = appTypeFilter === 'all' || a.type === appTypeFilter;
                        const matchesStatus = appStatusFilter === 'all' || a.status === appStatusFilter;
                        const matchesCounty = appCountyFilter === 'all' || a.county === appCountyFilter;
                        return matchesSearch && matchesType && matchesStatus && matchesCounty;
                      })
                      .map((app) => {
                        const typeConfig = {
                          student: { label: 'Student Scholar', bg: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
                          school: { label: 'School Delegation', bg: 'bg-indigo-100 text-indigo-900 border-indigo-200' },
                          volunteer: { label: 'Volunteer Judge', bg: 'bg-amber-100 text-amber-900 border-amber-200' },
                          sponsor: { label: 'Sponsor Partner', bg: 'bg-purple-100 text-purple-900 border-purple-200' },
                          partner: { label: 'Institutional Partner', bg: 'bg-sky-100 text-sky-900 border-sky-200' }
                        }[app.type] || { label: app.type, bg: 'bg-slate-100 text-slate-800 border-slate-200' };

                        return (
                          <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                {app.name}
                                {(app.type === 'partner' || app.type === 'sponsor') && app.status === 'approved' && (
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300" title="Live on public partner section">
                                    <Globe className="w-2.5 h-2.5" /> Live on Site
                                  </span>
                                )}
                              </div>
                              {app.schoolOrOrg && (
                                <div className="text-[11px] text-slate-500 font-semibold">{app.schoolOrOrg}</div>
                              )}
                              {app.message && (
                                <div className="text-[10px] text-slate-600 italic mt-0.5 max-w-xs truncate">
                                  "{app.message}"
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeConfig.bg}`}>
                                {typeConfig.label}
                              </span>
                              {app.roleOrInterest && (
                                <div className="text-[10px] text-slate-500 mt-1 max-w-xs truncate">
                                  {app.roleOrInterest}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-800">{app.county} County</div>
                              {app.gradeLevel && (
                                <div className="text-[10px] text-emerald-700 font-semibold">{app.gradeLevel}</div>
                              )}
                              {app.delegationSize && (
                                <div className="text-[10px] text-indigo-700 font-semibold">{app.delegationSize} Delegates</div>
                              )}
                              {app.sponsorshipTier && (
                                <div className="text-[10px] text-purple-700 font-semibold">{app.sponsorshipTier}</div>
                              )}
                              {app.pledgedAmount && (
                                <div className="text-[10px] font-bold text-slate-900">
                                  {app.currency === 'LRD' ? `L$${app.pledgedAmount.toLocaleString()}` : `$${app.pledgedAmount.toLocaleString()} USD`}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <div className="text-slate-900 font-mono text-[11px]">{app.email}</div>
                              {app.phone && (
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{app.phone}</div>
                              )}
                            </td>

                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <select
                                  value={app.status}
                                  onChange={(e) => handleUpdateApplicationStatus(app.id, e.target.value as 'pending' | 'approved' | 'rejected')}
                                  className={`px-2 py-1 rounded-lg text-[11px] font-bold border outline-none cursor-pointer w-full ${
                                    app.status === 'approved'
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                      : app.status === 'rejected'
                                        ? 'bg-rose-50 text-rose-900 border-rose-300'
                                        : 'bg-amber-50 text-amber-900 border-amber-300'
                                  }`}
                                >
                                  <option value="pending">⏳ Pending</option>
                                  <option value="approved">✅ Approved</option>
                                  <option value="rejected">❌ Rejected</option>
                                </select>

                                <button
                                  type="button"
                                  onClick={() => handlePreviewPartnerEmail(app, app.status)}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
                                  title="Preview or resend notification email"
                                >
                                  <Mail className="w-2.5 h-2.5" /> Email Preview / Resend
                                </button>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{new Date(app.submittedAt).toLocaleDateString()}</div>
                              <div className="text-[10px] text-slate-400">{new Date(app.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'approved')}
                                  title="Approve, sync partner & send acceptance email"
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleUpdateApplicationStatus(app.id, 'rejected')}
                                  title="Reject Application & send status email"
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors cursor-pointer border border-rose-200"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handlePreviewPartnerEmail(app, app.status)}
                                  title="Preview official notification email"
                                  className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition-colors cursor-pointer border border-amber-200"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setAppReviewerNotes(app.reviewerNotes || '');
                                  }}
                                  title="Inspect Details & Notes"
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Inspect
                                </button>
                                <button
                                  onClick={() => handleDeleteApplication(app.id)}
                                  title="Delete Record"
                                  className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION: NATIONAL STEM CHALLENGE & STUDENT PROPOSALS */}
      {adminSection === 'stem' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-lg border border-emerald-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-400/30">
                <Cpu className="w-3.5 h-3.5" /> Innovation & Engineering Directorate
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                National STEM Challenge & Proposal Submissions Desk
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200 max-w-2xl leading-relaxed">
                Configure the annual national high school science challenge edition, publish technical tracks, and review incoming student prototype submissions from all 15 counties.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  setShowSmtpModal(true);
                  fetchSmtpStatus();
                }}
                className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shadow-sm active:scale-95"
                title="Configure and test the SMTP email alert gateway for incoming proposals"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>SMTP Alert Gateway</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>
              <button
                onClick={handleSimulateIncomingProposal}
                className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
                title="Simulate a new incoming student proposal to trigger real-time toast and email alerts"
              >
                <Sparkles className="w-3.5 h-3.5" /> Simulate Incoming Proposal
              </button>
              <button
                onClick={handleExportProposalsCSV}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV ({stemProposalsList.length})
              </button>
              {stemProposalsList.length === 0 && (
                <button
                  onClick={handleSeedSampleProposals}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Seed Demo Proposals
                </button>
              )}
            </div>
          </div>

          {/* Subtabs: Proposals Inbox vs Challenge Configuration */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setStemSubTab('proposals')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  stemSubTab === 'proposals'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Student Proposals Inbox ({stemProposalsList.length})</span>
              </button>
              <button
                onClick={() => setStemSubTab('challenge')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  stemSubTab === 'challenge'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload & Configure STEM Challenge</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium px-2">
              Edition: <strong className="text-slate-800">{stemChallengeForm.edition}</strong>
            </div>
          </div>

          {/* SUB-VIEW 1: STUDENT PROPOSALS INBOX */}
          {stemSubTab === 'proposals' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Metric Counters */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Proposals</span>
                  <div className="text-2xl font-black text-slate-900">{stemProposalsList.length}</div>
                  <span className="text-[10px] text-slate-400">All 15 Counties</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-xs space-y-1 bg-amber-50/40">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Pending Review</span>
                  <div className="text-2xl font-black text-amber-900">
                    {stemProposalsList.filter(p => p.status === 'Pending Review' || p.status === 'Under Evaluation').length}
                  </div>
                  <span className="text-[10px] text-amber-700">Awaiting Technical Scoring</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-1 bg-emerald-50/40">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Shortlisted for Expo</span>
                  <div className="text-2xl font-black text-emerald-900">
                    {stemProposalsList.filter(p => p.status === 'Shortlisted for Expo').length}
                  </div>
                  <span className="text-[10px] text-emerald-700">Invited to Ministerial Complex</span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs space-y-1 bg-blue-50/40">
                  <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Grant Approved</span>
                  <div className="text-2xl font-black text-blue-900">
                    {stemProposalsList.filter(p => p.status === 'Grant Approved').length}
                  </div>
                  <span className="text-[10px] text-blue-700">Funded Prototypes</span>
                </div>
              </div>

              {/* Filters & Search Bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search school, prototype title, team lead, mentor..."
                      value={proposalSearch}
                      onChange={(e) => setProposalSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-all"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                      <Filter className="w-3.5 h-3.5" /> Status:
                    </div>
                    <select
                      value={proposalStatusFilter}
                      onChange={(e) => setProposalStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    >
                      <option value="all">All Statuses ({stemProposalsList.length})</option>
                      <option value="Pending Review">Pending Review</option>
                      <option value="Under Evaluation">Under Evaluation</option>
                      <option value="Shortlisted for Expo">Shortlisted for Expo</option>
                      <option value="Grant Approved">Grant Approved</option>
                      <option value="Revision Requested">Revision Requested</option>
                      <option value="Declined">Declined</option>
                    </select>

                    <select
                      value={proposalCountyFilter}
                      onChange={(e) => setProposalCountyFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    >
                      <option value="all">All Counties</option>
                      {['Montserrado', 'Nimba', 'Bong', 'Margibi', 'Grand Bassa', 'Lofa', 'Maryland', 'Sinoe', 'Grand Cape Mount', 'Grand Gedeh', 'River Gee', 'Rivercess', 'Bomi', 'Grand Kru', 'Gbarpolu'].map(c => (
                        <option key={c} value={c}>{c} County</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Proposals Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {loadingProposals ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-3 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-xs font-semibold text-slate-500">Loading student proposals...</p>
                  </div>
                ) : stemProposalsList.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <Cpu className="w-12 h-12 text-slate-300 mx-auto" />
                    <h3 className="text-base font-bold text-slate-800">No student proposals received yet</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Student teams and science coordinators can submit proposals via the National STEM Challenge page. You can also seed demo proposals to preview the review workflow.
                    </p>
                    <button
                      onClick={handleSeedSampleProposals}
                      className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Seed 3 Sample Proposals
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-4">Prototype & Track</th>
                          <th className="py-3 px-4">School & County</th>
                          <th className="py-3 px-4">Team Lead & Mentor</th>
                          <th className="py-3 px-4">Stage & Date</th>
                          <th className="py-3 px-4">Review Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {stemProposalsList
                          .filter(p => {
                            const matchesSearch = !proposalSearch ||
                              p.title.toLowerCase().includes(proposalSearch.toLowerCase()) ||
                              p.school.toLowerCase().includes(proposalSearch.toLowerCase()) ||
                              p.teamLead.toLowerCase().includes(proposalSearch.toLowerCase()) ||
                              p.mentor.toLowerCase().includes(proposalSearch.toLowerCase()) ||
                              p.category.toLowerCase().includes(proposalSearch.toLowerCase());
                            const matchesStatus = proposalStatusFilter === 'all' || p.status === proposalStatusFilter;
                            const matchesCounty = proposalCountyFilter === 'all' || p.county === proposalCountyFilter;
                            return matchesSearch && matchesStatus && matchesCounty;
                          })
                          .map(proposal => {
                            const statusColor = 
                              proposal.status === 'Shortlisted for Expo' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                              proposal.status === 'Grant Approved' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              proposal.status === 'Under Evaluation' ? 'bg-amber-100 text-amber-900 border-amber-200' :
                              proposal.status === 'Declined' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                              'bg-slate-100 text-slate-800 border-slate-200';

                            return (
                              <tr key={proposal.id} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-3 px-4 max-w-xs">
                                  <div className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">{proposal.title}</div>
                                  <span className="inline-block mt-0.5 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    {proposal.category}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900">{proposal.school}</div>
                                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-red-500" /> {proposal.county} County
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-800">{proposal.teamLead} <span className="text-[10px] text-slate-400 font-normal">(Lead)</span></div>
                                  <div className="text-[11px] text-slate-500 font-medium">Advisor: {proposal.mentor}</div>
                                  {proposal.mentorPhone && (
                                    <div className="text-[10px] text-slate-400 font-mono">{proposal.mentorPhone}</div>
                                  )}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-bold text-slate-800 block text-[11px]">{proposal.prototypeStage || 'Working Prototype'}</span>
                                  <div className="text-[10px] text-slate-400">{new Date(proposal.submittedAt).toLocaleDateString()}</div>
                                </td>
                                <td className="py-3 px-4">
                                  <select
                                    value={proposal.status}
                                    onChange={(e) => handleUpdateProposalStatus(proposal.id, e.target.value as StemProposal['status'])}
                                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${statusColor}`}
                                  >
                                    <option value="Pending Review">Pending Review</option>
                                    <option value="Under Evaluation">Under Evaluation</option>
                                    <option value="Shortlisted for Expo">Shortlisted for Expo</option>
                                    <option value="Grant Approved">Grant Approved</option>
                                    <option value="Revision Requested">Revision Requested</option>
                                    <option value="Declined">Declined</option>
                                  </select>
                                </td>
                                <td className="py-3 px-4 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => handleOpenProposalAlertPreview(proposal)}
                                      title="Preview & Send Administrator SMTP Email Alert"
                                      className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 rounded-lg transition-colors cursor-pointer border border-slate-200"
                                    >
                                      <Mail className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedProposal(proposal);
                                        setReviewerNoteInput(proposal.reviewerNotes || '');
                                      }}
                                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 border border-emerald-200"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> Inspect
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProposal(proposal.id)}
                                      title="Delete Proposal"
                                      className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-VIEW 2: CONFIGURE & UPLOAD NATIONAL STEM CHALLENGE */}
          {stemSubTab === 'challenge' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
              {/* Form Column */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">National STEM Challenge & Proposal Editor</h3>
                      {activeChallengeDocId ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                          Live Synced
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          New Challenge
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure tournament edition specs, thematic tracks, and the complete step-by-step proposal execution guide seen on the public website.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleLoadOfficialStemTemplate}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="Load official YFC STEM challenge guidelines & roadmap"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Load Official Template</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setTab('stem')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      title="Open the public STEM proposal web page"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-700" />
                      <span>View Public Page</span>
                    </button>
                  </div>
                </div>

                {stemChallengeSuccessMsg && (
                  <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{stemChallengeSuccessMsg}</span>
                  </div>
                )}

                {stemChallengeErrorMsg && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{stemChallengeErrorMsg}</span>
                  </div>
                )}

                {/* Section Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setStemChallengeSectionTab('basic')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      stemChallengeSectionTab === 'basic'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1. Core Specs & Prizes
                  </button>
                  <button
                    type="button"
                    onClick={() => setStemChallengeSectionTab('tracks')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      stemChallengeSectionTab === 'tracks'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2. Tracks & Criteria
                  </button>
                  <button
                    type="button"
                    onClick={() => setStemChallengeSectionTab('roadmap')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      stemChallengeSectionTab === 'roadmap'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>3. Proposal Roadmap</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStemChallengeSectionTab('guidelines')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      stemChallengeSectionTab === 'guidelines'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>4. Guidelines to Read</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStemChallengeSectionTab('rubric')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      stemChallengeSectionTab === 'rubric'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    5. Deliverables & Rubric
                  </button>
                </div>

                <form onSubmit={handleSaveStemChallenge} className="space-y-5 text-xs sm:text-sm">
                  {/* TAB 1: CORE SPECS & PRIZES */}
                  {stemChallengeSectionTab === 'basic' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Challenge Edition Title *</label>
                          <input
                            type="text"
                            required
                            value={stemChallengeForm.edition}
                            onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, edition: e.target.value })}
                            placeholder="e.g. 2025/2026 National High School STEM Challenge"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Tagline / Sub-Heading *</label>
                          <input
                            type="text"
                            required
                            value={stemChallengeForm.tagline}
                            onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, tagline: e.target.value })}
                            placeholder="e.g. Transforming Local Challenges into Scalable Scientific Prototypes"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Official Challenge Theme *</label>
                        <textarea
                          rows={2}
                          required
                          value={stemChallengeForm.theme}
                          onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, theme: e.target.value })}
                          placeholder="e.g. Sustainable Innovations for Liberian Communities: Clean Water, Agro-tech & Renewable Energy"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Submission Deadline *</label>
                          <input
                            type="text"
                            required
                            value={stemChallengeForm.deadline}
                            onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, deadline: e.target.value })}
                            placeholder="e.g. October 30, 2025"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Grand Expo Date *</label>
                          <input
                            type="text"
                            required
                            value={stemChallengeForm.grandExpoDate}
                            onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, grandExpoDate: e.target.value })}
                            placeholder="e.g. December 12-14, 2025"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Venue Location *</label>
                          <input
                            type="text"
                            required
                            value={stemChallengeForm.location}
                            onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, location: e.target.value })}
                            placeholder="e.g. EJS Ministerial Complex, Monrovia"
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Participating Schools Target</label>
                          <input
                            type="number"
                            value={stemChallengeForm.participatingSchools}
                            onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, participatingSchools: Number(e.target.value) })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                          />
                        </div>
                        <div>
                          <label className="font-bold text-slate-700 block mb-1">Counties Represented</label>
                          <input
                            type="number"
                            value={stemChallengeForm.countiesRepresented}
                            onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, countiesRepresented: Number(e.target.value) })}
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                          />
                        </div>
                      </div>

                      {/* Prize Breakdown */}
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <span className="font-black text-slate-800 text-xs uppercase tracking-wider block">Award Grants & Scholarships</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="font-bold text-slate-700 block text-xs mb-1">1st Place Grand Prize</label>
                            <input
                              type="text"
                              value={stemChallengeForm.firstPlacePrize}
                              onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, firstPlacePrize: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block text-xs mb-1">2nd Place Prize</label>
                            <input
                              type="text"
                              value={stemChallengeForm.secondPlacePrize}
                              onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, secondPlacePrize: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block text-xs mb-1">3rd Place Prize</label>
                            <input
                              type="text"
                              value={stemChallengeForm.thirdPlacePrize}
                              onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, thirdPlacePrize: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-slate-700 block text-xs mb-1">Special Category Award</label>
                            <input
                              type="text"
                              value={stemChallengeForm.specialCategory}
                              onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, specialCategory: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: TRACKS & ELIGIBILITY */}
                  {stemChallengeSectionTab === 'tracks' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block text-xs">
                          Thematic Tracks (Format: Track Name | Description - one track per line)
                        </label>
                        <p className="text-[11px] text-slate-500">
                          These populate the competition categories on the public site and in the proposal submission form.
                        </p>
                        <textarea
                          rows={6}
                          value={stemChallengeForm.tracksText}
                          onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, tracksText: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
                          placeholder="Agri-Tech & Food Preservation | Low-cost solar drying and mechanical processing for cassava and cocoa..."
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <label className="font-bold text-slate-700 block text-xs">
                          Eligibility & Competition Criteria (One rule per line)
                        </label>
                        <textarea
                          rows={5}
                          value={stemChallengeForm.eligibilityRulesText}
                          onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, eligibilityRulesText: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
                          placeholder="High school teams must consist of 3 to 5 enrolled students (Grades 9-12)..."
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 3: HOW TO ACCOMPLISH ROADMAP (DETAIL PROPOSAL) */}
                  {stemChallengeSectionTab === 'roadmap' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="bg-emerald-50/70 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-950">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>Detail Proposal Architecture & Field Execution</span>
                        </div>
                        <p className="text-[11px] text-emerald-800 leading-relaxed">
                          This overview and step-by-step roadmap is displayed directly under the &quot;How to Accomplish the STEM Challenge&quot; section on the public web page.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block text-xs">
                          How to Accomplish Overview & Context *
                        </label>
                        <textarea
                          rows={4}
                          value={stemChallengeForm.howToAccomplishOverview}
                          onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, howToAccomplishOverview: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
                          placeholder="Describe the overarching execution methodology, grassroots problem-solving philosophy, and prototype construction principles..."
                        />
                      </div>

                      <div className="space-y-1 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-700 block text-xs">
                            Step-by-Step Accomplishment Roadmap
                          </label>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Format: Step# | Stage Title | Subtitle | Detail 1; Detail 2; Detail 3
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Separate multiple step bullet points with semicolons (;). Each line creates an interactive roadmap card on the public website.
                        </p>
                        <textarea
                          rows={8}
                          value={stemChallengeForm.roadmapText}
                          onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, roadmapText: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
                          placeholder="1 | Community Problem Identification | Field Inquiry | Conduct interviews with farmers; Pinpoint rot bottleneck; Frame problem statement"
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 4: OFFICIAL GUIDELINES TO READ BEFORE SUBMITTING */}
                  {stemChallengeSectionTab === 'guidelines' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-950 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-amber-700" />
                          <span>Mandatory Submission Guidelines (Read Before Submitting)</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          Enter the official rules and safety protocols that students, teachers, and school administrators must read before submitting their proposal on the public site.
                        </p>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block text-xs">
                          Official Submission Rules (One guideline per line)
                        </label>
                        <span className="text-[11px] text-slate-500 block">
                          Tip: You can use &quot;Title: Detailed Rule Body&quot; (e.g., &quot;Original Student Fabrication: The core assembly must be executed by students...&quot;) for highlighted rule headings.
                        </span>
                        <textarea
                          rows={10}
                          value={stemChallengeForm.submissionGuidelinesText}
                          onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, submissionGuidelinesText: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
                          placeholder="Official School Enrollment: All team members must be actively registered secondary students...&#10;Physical Prototype Mandatory: Pure theoretical essays without working models are disqualified..."
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 5: DELIVERABLES & EVALUATION RUBRIC */}
                  {stemChallengeSectionTab === 'rubric' && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block text-xs">
                          Required Submission Deliverables (One deliverable per line)
                        </label>
                        <p className="text-[11px] text-slate-500">
                          This checklist guides student applicants on what documents, blueprints, and data must be included in their submission.
                        </p>
                        <textarea
                          rows={6}
                          value={stemChallengeForm.requiredDeliverablesText}
                          onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, requiredDeliverablesText: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
                          placeholder="1. Concise Project Title & County Context&#10;2. Quantifiable Community Problem Statement&#10;3. Engineered Working Methodology..."
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-100 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-700 block text-xs">
                            Jury Evaluation Rubric
                          </label>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Format: Criterion Name | Weight% | Description
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          These criteria define the scoring rubric used by academic judges and technical adjudicators at county and national expos.
                        </p>
                        <textarea
                          rows={6}
                          value={stemChallengeForm.evaluationRubricText}
                          onChange={(e) => setStemChallengeForm({ ...stemChallengeForm, evaluationRubricText: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
                          placeholder="Local Relevance & Community Impact | 25% | Addresses an urgent Liberian bottleneck in agro-processing...&#10;Engineering Rigor & Technical Innovation | 25% | Demonstrates sound scientific principles..."
                        />
                      </div>
                    </div>
                  )}

                  {/* Submission Action Bar */}
                  <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="submit"
                      disabled={savingStemChallenge}
                      className="w-full sm:flex-1 py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {savingStemChallenge ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Saving & Broadcasting Proposal Specs...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>Save & Broadcast to Public STEM Web Page</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setTab('stem')}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview Live</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Live Preview Column */}
              <div className="space-y-4">
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Live Public Preview</span>
                    <span className="text-[10px] bg-emerald-800/80 text-white px-2 py-0.5 rounded font-bold">Active Broadcast</span>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[11px] font-black text-amber-400">{stemChallengeForm.edition}</span>
                    <h4 className="text-base font-black text-white leading-snug">{stemChallengeForm.theme || 'Theme pending'}</h4>
                    <p className="text-xs text-slate-300">{stemChallengeForm.tagline}</p>
                  </div>

                  <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
                    <div className="flex justify-between text-slate-300">
                      <span>Deadline:</span>
                      <strong className="text-white">{stemChallengeForm.deadline}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Grand Expo:</span>
                      <strong className="text-white">{stemChallengeForm.grandExpoDate}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Venue:</span>
                      <strong className="text-white truncate max-w-[150px]">{stemChallengeForm.location}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>1st Place:</span>
                      <strong className="text-amber-300 truncate max-w-[150px]">{stemChallengeForm.firstPlacePrize}</strong>
                    </div>
                  </div>

                  {/* Proposal Detail Summary in Preview */}
                  <div className="border-t border-slate-800 pt-3 space-y-2">
                    <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                      <span>Proposal Elements Ready</span>
                      <span className="text-emerald-400 text-[10px]">Auto-Synced</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700/60">
                        <span className="text-slate-400 block text-[10px]">Roadmap Stages</span>
                        <strong className="text-emerald-400 font-bold text-sm">
                          {stemChallengeForm.roadmapText.split('\n').filter(l => l.trim().length > 0).length} Stages
                        </strong>
                      </div>
                      <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700/60">
                        <span className="text-slate-400 block text-[10px]">Guidelines Rules</span>
                        <strong className="text-amber-300 font-bold text-sm">
                          {stemChallengeForm.submissionGuidelinesText.split('\n').filter(l => l.trim().length > 0).length} Rules
                        </strong>
                      </div>
                      <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700/60">
                        <span className="text-slate-400 block text-[10px]">Deliverables</span>
                        <strong className="text-sky-400 font-bold text-sm">
                          {stemChallengeForm.requiredDeliverablesText.split('\n').filter(l => l.trim().length > 0).length} Items
                        </strong>
                      </div>
                      <div className="bg-slate-800/70 p-2.5 rounded-lg border border-slate-700/60">
                        <span className="text-slate-400 block text-[10px]">Rubric Criteria</span>
                        <strong className="text-purple-300 font-bold text-sm">
                          {stemChallengeForm.evaluationRubricText.split('\n').filter(l => l.trim().length > 0).length} Criteria
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-950/80 p-3 rounded-xl border border-emerald-800/50 text-[11px] text-emerald-200">
                    💡 All specifications and proposal roadmap details saved here automatically update the public proposal page at <span className="underline font-semibold cursor-pointer" onClick={() => setTab('stem')}>youthforchange.org.lr/stem</span>.
                  </div>

                  <button
                    type="button"
                    onClick={() => setTab('stem')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Public Proposal Page</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION: DEBATE CHAMPIONSHIP EDITIONS MANAGEMENT */}
      {adminSection === 'debate-editions' && (
        <AdminDebateEditionsManager userEmail={currentUser?.email} />
      )}

      {/* SECTION: LEADERSHIP TEAM MANAGEMENT */}
      {adminSection === 'leadership' && (
        <AdminLeadershipManager userEmail={currentUser?.email} />
      )}

      {/* SECTION: ALUMNI DIRECTORY & TESTIMONIALS */}
      {adminSection === 'alumni' && (
        <AdminAlumniManager />
      )}

      {/* SECTION: DISPATCH & NEWSLETTER SUBSCRIBERS */}
      {adminSection === 'subscribers' && (
        <AdminSubscribersManager userEmail={currentUser?.email} />
      )}

      {/* SECTION: SCHOOL ZONING & ANTI-BIAS FIXTURES UTILITY */}
      {adminSection === 'zoning-fixtures' && (
        <SchoolZoningUtility 
          applicationsList={applicationsList} 
          userEmail={currentUser?.email} 
          initialTab="zoning_dashboard"
        />
      )}

      {/* SECTION: AUTOMATED COACH FIXTURE ALERTS DIRECT TAB */}
      {adminSection === 'coach-alerts' && (
        <SchoolZoningUtility 
          applicationsList={applicationsList} 
          userEmail={currentUser?.email} 
          initialTab="coach_notifications"
        />
      )}

      {/* SECTION: PROGRAM REGISTRATION STATUS & ACCESS CONTROLS */}
      {adminSection === 'program-status' && (
        <AdminProgramStatusManager adminEmail={currentUser?.email || undefined} />
      )}

      {/* SECTION: YEARLY PARTNER ACCOUNTABILITY & IMPACT REPORT ENGINE */}
      {adminSection === 'yearly-report' && (
        <YearlyReportEngine />
      )}

      {/* PROPOSAL DETAIL REVIEW MODAL */}
      {selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded bg-emerald-100 text-emerald-900">
                  {selectedProposal.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  {selectedProposal.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-red-500" /> {selectedProposal.school} • {selectedProposal.county} County
                </p>
              </div>
              <button
                onClick={() => setSelectedProposal(null)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs">
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Review Status</span>
                <span className="font-extrabold text-slate-900">{selectedProposal.status}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(['Pending Review', 'Under Evaluation', 'Shortlisted for Expo', 'Grant Approved', 'Declined'] as StemProposal['status'][]).map(st => (
                  <button
                    key={st}
                    onClick={() => handleUpdateProposalStatus(selectedProposal.id, st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedProposal.status === st
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Proposal Core Technical Content */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <strong className="text-slate-900 block font-bold text-xs uppercase text-red-800">
                  Problem Statement:
                </strong>
                <p className="text-slate-700 leading-relaxed bg-red-50/60 p-4 rounded-xl border border-red-100">
                  {selectedProposal.problemStatement || selectedProposal.summary}
                </p>
              </div>

              <div className="space-y-1">
                <strong className="text-slate-900 block font-bold text-xs uppercase text-emerald-900">
                  Engineered Solution & Working Prototype:
                </strong>
                <p className="text-slate-700 leading-relaxed bg-emerald-50/60 p-4 rounded-xl border border-emerald-100">
                  {selectedProposal.solution || selectedProposal.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Team Lead</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedProposal.teamLead}</p>
                  {selectedProposal.studentTeam && selectedProposal.studentTeam.length > 0 && (
                    <div className="mt-1 text-[11px] text-slate-600">
                      {selectedProposal.studentTeam.map((m, i) => (
                        <div key={i}>• {m}</div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Faculty Advisor</span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedProposal.mentor}</p>
                  {selectedProposal.mentorPhone && (
                    <p className="text-[11px] text-slate-600 font-mono mt-0.5">{selectedProposal.mentorPhone}</p>
                  )}
                  {selectedProposal.mentorEmail && (
                    <p className="text-[11px] text-slate-600 mt-0.5">{selectedProposal.mentorEmail}</p>
                  )}
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Prototype Stage & Budget</span>
                  <p className="text-xs font-bold text-emerald-800 mt-0.5">{selectedProposal.prototypeStage || 'Working Prototype'}</p>
                  <p className="text-[11px] text-slate-600 mt-1">{selectedProposal.materialsBudget || 'Local Materials'}</p>
                </div>
              </div>

              {/* Reviewer Notes Editor */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                    Secretariat Reviewer Notes & Adjudication Verdict
                  </label>
                  {proposalUpdateSuccess && (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {proposalUpdateSuccess}
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={reviewerNoteInput}
                  onChange={(e) => setReviewerNoteInput(e.target.value)}
                  placeholder="Enter confidential reviewer notes, feedback on feasibility, technical score, or instructions for the school..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleSaveReviewerNotes(selectedProposal.id)}
                    disabled={savingProposalUpdate}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingProposalUpdate ? 'Saving Notes...' : 'Save Reviewer Notes'}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                onClick={() => handleDeleteProposal(selectedProposal.id)}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Proposal Record
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenProposalAlertPreview(selectedProposal)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Admin Alert Email</span>
                </button>
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                >
                  Close Review Desk
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLICATION DETAIL REVIEW MODAL */}
      {selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                    selectedApplication.type === 'student' ? 'bg-emerald-100 text-emerald-900 border-emerald-200' :
                    selectedApplication.type === 'school' ? 'bg-indigo-100 text-indigo-900 border-indigo-200' :
                    selectedApplication.type === 'volunteer' ? 'bg-amber-100 text-amber-900 border-amber-200' :
                    selectedApplication.type === 'sponsor' ? 'bg-purple-100 text-purple-900 border-purple-200' :
                    'bg-sky-100 text-sky-900 border-sky-200'
                  }`}>
                    {selectedApplication.type === 'student' && '🎓 Student Scholar'}
                    {selectedApplication.type === 'school' && '🏫 High School Delegation'}
                    {selectedApplication.type === 'volunteer' && '⚖️ Volunteer Judge / Adjudicator'}
                    {selectedApplication.type === 'sponsor' && '💎 Corporate / Philanthropic Sponsor'}
                    {selectedApplication.type === 'partner' && '🤝 Institutional Partner'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold">
                    Ref: #{selectedApplication.id.slice(0, 8)}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  {selectedApplication.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {selectedApplication.schoolOrOrg ? `${selectedApplication.schoolOrOrg} • ` : ''}
                  {selectedApplication.county} County
                </p>
              </div>
              <button
                onClick={() => setSelectedApplication(null)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Control Bar */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs">
                <span className="text-slate-500 font-bold block text-[10px] uppercase">Secretariat Decision</span>
                <span className={`font-extrabold text-sm capitalize ${
                  selectedApplication.status === 'approved' ? 'text-emerald-700' :
                  selectedApplication.status === 'rejected' ? 'text-rose-700' : 'text-amber-700'
                }`}>
                  {selectedApplication.status === 'approved' && '✅ Certified & Approved'}
                  {selectedApplication.status === 'rejected' && '❌ Application Rejected'}
                  {selectedApplication.status === 'pending' && '⏳ Pending Decision'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'approved')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    selectedApplication.status === 'approved'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" /> Approve & Certify
                </button>
                <button
                  onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedApplication.status === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => handleUpdateApplicationStatus(selectedApplication.id, 'rejected')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    selectedApplication.status === 'rejected'
                      ? 'bg-rose-700 text-white shadow-xs'
                      : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-300'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            </div>

            {/* Application Specific Content */}
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Contact Block */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Email Address</span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-0.5">{selectedApplication.email}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Phone Number</span>
                  <p className="text-xs font-mono font-bold text-slate-900 mt-0.5">{selectedApplication.phone || 'Not provided'}</p>
                </div>
              </div>

              {/* Specific Details for Student Scholars */}
              {selectedApplication.type === 'student' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 block uppercase font-bold">Academic Grade</span>
                    <p className="text-xs font-bold text-emerald-950 mt-0.5">{selectedApplication.gradeLevel || 'Secondary School'}</p>
                    {selectedApplication.scholarshipInterest && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-bold rounded">
                        ★ University Scholarship Applicant
                      </span>
                    )}
                  </div>
                  <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 block uppercase font-bold">Career Aspiration</span>
                    <p className="text-xs font-bold text-emerald-950 mt-0.5">{selectedApplication.careerAspiration || 'Law / Science / Public Service'}</p>
                  </div>
                </div>
              )}

              {/* Specific Details for Schools */}
              {selectedApplication.type === 'school' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200">
                    <span className="text-[10px] text-indigo-800 block uppercase font-bold">Principal / Head of School</span>
                    <p className="text-xs font-bold text-indigo-950 mt-0.5">{selectedApplication.principalOrHead || 'Principal'}</p>
                  </div>
                  <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-200">
                    <span className="text-[10px] text-indigo-800 block uppercase font-bold">Debate Delegation Size</span>
                    <p className="text-xs font-bold text-indigo-950 mt-0.5">{selectedApplication.delegationSize || 6} Student Debaters</p>
                  </div>
                </div>
              )}

              {/* Specific Details for Sponsors */}
              {selectedApplication.type === 'sponsor' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200">
                    <span className="text-[10px] text-purple-800 block uppercase font-bold">Sponsorship Tier</span>
                    <p className="text-xs font-bold text-purple-950 mt-0.5">{selectedApplication.sponsorshipTier || 'Custom Partner'}</p>
                  </div>
                  <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-200">
                    <span className="text-[10px] text-purple-800 block uppercase font-bold">Pledged Financial Support</span>
                    <p className="text-base font-black text-purple-950 mt-0.5">
                      {selectedApplication.pledgedAmount 
                        ? (selectedApplication.currency === 'LRD' ? `L$${selectedApplication.pledgedAmount.toLocaleString()}` : `$${selectedApplication.pledgedAmount.toLocaleString()} USD`)
                        : 'In-Kind / Logistics Support'}
                    </p>
                  </div>
                </div>
              )}

              {/* Specific Details for Partners and Sponsors (Cover image, direct website link, logo) */}
              {(selectedApplication.type === 'partner' || selectedApplication.type === 'sponsor') && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-700" />
                      Partner Profile & Website Customization
                    </span>
                    {selectedApplication.websiteUrl && (
                      <a
                        href={selectedApplication.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-800 hover:text-emerald-700 hover:underline flex items-center gap-1"
                      >
                        Visit Partner Website <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-[11px]">Direct Website Link</label>
                      <input
                        type="url"
                        placeholder="https://company.com"
                        value={selectedApplication.websiteUrl || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedApplication(prev => prev ? { ...prev, websiteUrl: val } : null);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1 text-[11px]">Partner Category</label>
                      <input
                        type="text"
                        value={selectedApplication.partnerType || (selectedApplication.type === 'sponsor' ? 'Corporate Sponsor' : 'Strategic Partner')}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedApplication(prev => prev ? { ...prev, partnerType: val } : null);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900 text-xs focus:ring-2 focus:ring-emerald-700 font-semibold"
                      />
                    </div>
                  </div>

                  {/* Cover Picture & Logo upload fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <ImageUploadField
                      label="Partner Cover / Header Banner Picture"
                      value={selectedApplication.coverImage || ''}
                      onChange={(val) => {
                        setSelectedApplication(prev => prev ? { ...prev, coverImage: val } : null);
                      }}
                      aspectRatio="video"
                      helperText="Upload official cover photo directly from computer for public about us modal."
                    />
                    <ImageUploadField
                      label="Partner Logo Picture"
                      value={selectedApplication.logoUrl || ''}
                      onChange={(val) => {
                        setSelectedApplication(prev => prev ? { ...prev, logoUrl: val } : null);
                      }}
                      aspectRatio="square"
                      helperText="Upload official brand logo PNG or JPEG directly from computer."
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedApplication) return;
                        try {
                          let finalCoverImage = selectedApplication.coverImage || '';
                          let finalLogoUrl = selectedApplication.logoUrl || '';

                          if (finalCoverImage.startsWith('data:image')) {
                            try {
                              finalCoverImage = await compressDataUrlForPermanentStorage(finalCoverImage, 800, 0.75);
                            } catch (e) {
                              console.warn('Cover image compression warning:', e);
                            }
                          }

                          if (finalLogoUrl.startsWith('data:image')) {
                            try {
                              finalLogoUrl = await compressDataUrlForPermanentStorage(finalLogoUrl, 400, 0.8);
                            } catch (e) {
                              console.warn('Logo image compression warning:', e);
                            }
                          }

                          const partnerUpdatePayload = {
                            websiteUrl: selectedApplication.websiteUrl || '',
                            coverImage: finalCoverImage,
                            logoUrl: finalLogoUrl,
                            partnerType: selectedApplication.partnerType || ''
                          };
                          await updateDoc(doc(db, 'involvementApplications', selectedApplication.id), partnerUpdatePayload);
                          // If also exists in partners collection, update there as well
                          await setDoc(doc(db, 'partners', selectedApplication.id), {
                            name: selectedApplication.schoolOrOrg || selectedApplication.name,
                            category: selectedApplication.partnerType || (selectedApplication.type === 'sponsor' ? 'Corporate' : 'International Agency'),
                            description: selectedApplication.message || '',
                            websiteUrl: selectedApplication.websiteUrl || '',
                            coverImage: finalCoverImage,
                            logoUrl: finalLogoUrl,
                            county: selectedApplication.county || 'Montserrado',
                            isLive: true
                          }, { merge: true });
                          toast.success('Partner details, cover picture, and website updated live!', 'Partner Updated');
                        } catch (pErr: any) {
                          toast.error('Failed to update partner fields: ' + pErr.message, 'Update Error');
                        }
                      }}
                      className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Partner & Cover Media Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Statement / Message */}
              {selectedApplication.message && (
                <div className="space-y-1">
                  <strong className="text-slate-900 block font-bold text-xs uppercase text-slate-700">
                    Applicant Statement / Letter of Intent:
                  </strong>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
                    {selectedApplication.message}
                  </p>
                </div>
              )}

              {/* Secretariat Email Notification Status Card */}
              <div className="bg-emerald-950/90 text-white p-4 rounded-2xl border border-emerald-800/80 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                      Official Decision Email Dispatch
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedApplication.emailNotificationSent 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                  }`}>
                    {selectedApplication.emailNotificationSent 
                      ? `✉️ Dispatched (${selectedApplication.lastEmailStatus || selectedApplication.status})` 
                      : '⏳ Not Dispatched Yet'}
                  </span>
                </div>
                
                <p className="text-[11px] text-emerald-200/90 leading-relaxed">
                  When you approve, reject, or reset this application, an official branded YFC acceptance/decision letter is automatically prepared and sent to <strong>{selectedApplication.email}</strong>.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handlePreviewPartnerEmail(selectedApplication, selectedApplication.status)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview Official Email
                  </button>
                  <button
                    type="button"
                    disabled={sendingNotificationEmail}
                    onClick={() => handleSendPartnerEmailManual(selectedApplication, selectedApplication.status, appReviewerNotes)}
                    className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {sendingNotificationEmail ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" /> Resend Notification Now
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Secretariat Reviewer Notes Editor */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                    Secretariat Reviewer Notes & Credentials Log
                  </label>
                  {appUpdateSuccess && (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {appUpdateSuccess}
                    </span>
                  )}
                </div>
                <textarea
                  rows={3}
                  value={appReviewerNotes}
                  onChange={(e) => setAppReviewerNotes(e.target.value)}
                  placeholder="Enter confidential reviewer notes, verification checks, coach certification status, or scholarship award decisions..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <div className="flex justify-between items-center">
                  <div className="text-[11px] text-slate-400">
                    {selectedApplication.reviewedBy && (
                      <span>Last reviewed by <strong>{selectedApplication.reviewedBy}</strong> on {selectedApplication.reviewedAt ? new Date(selectedApplication.reviewedAt).toLocaleDateString() : ''}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleSaveAppReviewNotes(selectedApplication.id)}
                    disabled={savingAppUpdate}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {savingAppUpdate ? 'Saving Notes...' : 'Save Reviewer Notes'}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                onClick={() => handleDeleteApplication(selectedApplication.id)}
                className="text-xs font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Application Record
              </button>
              <button
                onClick={() => setSelectedApplication(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Close Application Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL PREVIEW & DISPATCH MODAL */}
      {emailPreviewModal.isOpen && emailPreviewModal.app && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                  <Mail className="w-3 h-3 text-emerald-700" /> Official Notification Email Preview
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  Transactional Decision Letter
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Recipient: <strong className="text-slate-800 font-mono">{emailPreviewModal.recipient}</strong> • Applicant: <strong>{emailPreviewModal.app.name}</strong>
                </p>
              </div>
              <button
                onClick={() => setEmailPreviewModal(prev => ({ ...prev, isOpen: false }))}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Status Switcher in Preview */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <span>Simulate Decision Template:</span>
              </div>
              <div className="flex gap-2">
                {(['approved', 'pending', 'rejected'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => {
                      if (emailPreviewModal.app) {
                        handlePreviewPartnerEmail(emailPreviewModal.app, st);
                      }
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer capitalize ${
                      emailPreviewModal.status === st
                        ? st === 'approved' ? 'bg-emerald-800 text-white shadow-xs' : st === 'rejected' ? 'bg-rose-700 text-white' : 'bg-amber-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'approved' && '✅ Accepted / Approved'}
                    {st === 'pending' && '⏳ Pending Decision'}
                    {st === 'rejected' && '❌ Declined / Rejected'}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject Line */}
            <div className="bg-slate-100/70 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Subject Line</span>
              <div className="font-semibold text-slate-900 font-mono">{emailPreviewModal.subject}</div>
            </div>

            {/* Email Body Preview Container */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner bg-slate-50">
              {emailPreviewModal.loading ? (
                <div className="p-12 text-center text-slate-500 text-xs space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-700" />
                  <p>Generating high-fidelity HTML email template...</p>
                </div>
              ) : (
                <div 
                  className="p-4 sm:p-6 bg-white overflow-x-auto max-h-[400px] overflow-y-auto text-xs"
                  dangerouslySetInnerHTML={{ __html: emailPreviewModal.html }}
                />
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEmailPreviewModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Close Preview
              </button>
              
              <button
                type="button"
                disabled={sendingNotificationEmail || emailPreviewModal.loading}
                onClick={() => {
                  if (emailPreviewModal.app) {
                    handleSendPartnerEmailManual(emailPreviewModal.app, emailPreviewModal.status);
                  }
                }}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sendingNotificationEmail ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Official Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Email to {emailPreviewModal.recipient}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT PARTNER REGISTRATION MODAL */}
      {showAddPartnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
                  <Building className="w-3 h-3 text-emerald-700" /> Direct Partner & Sponsor Accreditation
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  Add Strategic Partner / Corporate Sponsor
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Directly register an institution to display instantly on the public website partner roster.
                </p>
              </div>
              <button
                onClick={() => setShowAddPartnerModal(false)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDirectPartner} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Organization / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPartnerForm.name}
                    onChange={(e) => setNewPartnerForm({ ...newPartnerForm, name: e.target.value })}
                    placeholder="e.g. Orange Liberia / USAID / Cuttington University"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Partner Category</label>
                  <select
                    value={newPartnerForm.category}
                    onChange={(e) => setNewPartnerForm({ ...newPartnerForm, category: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-semibold"
                  >
                    <option value="International Agency">International Agency & Donor</option>
                    <option value="Government">Government / Ministry</option>
                    <option value="Corporate">Corporate & Private Sector</option>
                    <option value="Academic">Academic / University / High School</option>
                    <option value="Media">Media & Broadcast</option>
                    <option value="Philanthropic">Philanthropic Trust / Foundation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">County of Operation</label>
                  <select
                    value={newPartnerForm.county}
                    onChange={(e) => setNewPartnerForm({ ...newPartnerForm, county: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    {LIBERIA_COUNTIES.map(c => (
                      <option key={c} value={c}>{c} County</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Short Logo Text / Monogram</label>
                  <input
                    type="text"
                    value={newPartnerForm.logoText}
                    onChange={(e) => setNewPartnerForm({ ...newPartnerForm, logoText: e.target.value })}
                    placeholder="e.g. ORANGE / USAID"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Website URL (Optional)</label>
                  <input
                    type="url"
                    value={newPartnerForm.websiteUrl}
                    onChange={(e) => setNewPartnerForm({ ...newPartnerForm, websiteUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* Partner Cover Banner Picture Upload */}
              <div>
                <ImageUploadField
                  label="Partner Cover / Header Banner Picture (Upload from Computer)"
                  value={newPartnerForm.coverImage}
                  onChange={(val) => setNewPartnerForm({ ...newPartnerForm, coverImage: val })}
                  aspectRatio="video"
                  helperText="Upload a high-resolution cover photo, headquarters picture, or initiative banner directly from your computer."
                />
              </div>

              {/* Partner Logo Upload Directly From Computer */}
              <div>
                <ImageUploadField
                  label="Partner Logo Picture (Optional)"
                  value={newPartnerForm.logoUrl}
                  onChange={(val) => setNewPartnerForm({ ...newPartnerForm, logoUrl: val })}
                  aspectRatio="square"
                  helperText="Upload official brand logo PNG, SVG, or JPEG directly from your computer, or leave blank to use the text monogram."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Official Contact Email (Optional)</label>
                  <input
                    type="email"
                    value={newPartnerForm.contactEmail}
                    onChange={(e) => setNewPartnerForm({ ...newPartnerForm, contactEmail: e.target.value })}
                    placeholder="partner-relations@company.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Person / Liaison</label>
                  <input
                    type="text"
                    value={newPartnerForm.contactPerson}
                    onChange={(e) => setNewPartnerForm({ ...newPartnerForm, contactPerson: e.target.value })}
                    placeholder="e.g. Director of CSR"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Partnership Description / Contribution Focus</label>
                <textarea
                  rows={3}
                  value={newPartnerForm.description}
                  onChange={(e) => setNewPartnerForm({ ...newPartnerForm, description: e.target.value })}
                  placeholder="Describe the institutional collaboration, STEM sponsorship, prize provision, or academic partnership..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700 leading-relaxed"
                />
              </div>

              {newPartnerForm.contactEmail && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notifyPartnerEmail"
                    checked={newPartnerForm.notifyByEmail}
                    onChange={(e) => setNewPartnerForm({ ...newPartnerForm, notifyByEmail: e.target.checked })}
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <label htmlFor="notifyPartnerEmail" className="font-semibold text-slate-800 text-xs cursor-pointer">
                    Send official accreditation welcome email to <strong>{newPartnerForm.contactEmail}</strong>
                  </label>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPartnerModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNewPartner}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingNewPartner ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Accrediting Partner...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accredit & Publish to Live Site</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STEM SMTP NOTIFICATION GATEWAY MODAL */}
      {showSmtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200">
                  <Mail className="w-3.5 h-3.5 text-emerald-700" /> Automated Notification System
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  STEM Proposals SMTP Notification Gateway
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Real-time alert dispatch pipeline notifying the Secretariat administrator whenever a student innovation proposal is submitted.
                </p>
              </div>
              <button
                onClick={() => setShowSmtpModal(false)}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Gateway Status Badge */}
            <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Gateway Status:</span>
                  {smtpStatus?.isConfigured ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Live SMTP Transport Active</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Secretariat Queue Dispatcher Active</span>
                    </span>
                  )}
                </div>

                <button
                  onClick={fetchSmtpStatus}
                  disabled={loadingSmtpStatus}
                  className="text-xs font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSmtpStatus ? 'animate-spin' : ''}`} />
                  <span>Refresh Status</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">SMTP Host / Port</span>
                  <span className="font-mono font-bold text-slate-800">
                    {smtpStatus?.host ? `${smtpStatus.host}:${smtpStatus.port}` : 'Standard Node Dispatcher (Port 587)'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Sender Identity (From)</span>
                  <span className="text-slate-800 font-medium truncate block" title={smtpStatus?.from}>
                    {smtpStatus?.from || 'Youth For Change Liberia Secretariat'}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 sm:col-span-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Administrator Alert Destination</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="font-mono font-bold text-emerald-900 text-xs">
                      {smtpStatus?.adminEmail || 'admin@youthforchange.org.lr'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (Receives all incoming student proposal alerts)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Connection & Send Test Alert */}
            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-700" />
                <span className="font-black text-slate-900 text-xs uppercase tracking-wider">
                  Test SMTP Alert Dispatch
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Send an immediate diagnostic ping email through the SMTP pipeline to verify deliverability to your inbox.
              </p>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={customTestEmail}
                  onChange={(e) => setCustomTestEmail(e.target.value)}
                  placeholder="Recipient Email (defaults to Administrator address)"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
                <button
                  onClick={handleTestSmtpConnection}
                  disabled={testingSmtp}
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {testingSmtp ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting Test...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Test Alert</span>
                    </>
                  )}
                </button>
              </div>

              {smtpTestResult && (
                <div className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                  smtpTestResult.success 
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-900' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  {smtpTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <p className="font-semibold">{smtpTestResult.message}</p>
                    <span className="text-[10px] opacity-75">Checked at {smtpTestResult.timestamp}</span>
                  </div>
                </div>
              )}
            </div>

            {/* How It Works & Configuration Guide */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
                ⚡ Real-Time Proposal Alert Workflow:
              </span>
              <ul className="space-y-1.5 text-slate-600 list-disc list-inside leading-relaxed">
                <li>
                  Whenever a high school team submits an innovation proposal on the <strong>STEM Hub</strong>, the application automatically invokes the notification gateway.
                </li>
                <li>
                  An official, styled email containing the project title, county, school, problem statement, working solution, advisor contact, and budget is dispatched to the administrator.
                </li>
                <li>
                  To configure live SMTP with your organization's custom mail server (e.g., Google Workspace, Microsoft 365, SendGrid, Amazon SES), configure the following in your environment:
                  <div className="mt-1 font-mono text-[11px] bg-white p-2 rounded-lg border border-slate-200 text-slate-800 space-y-0.5">
                    <div>SMTP_HOST=smtp.your-mail-provider.com</div>
                    <div>SMTP_PORT=587</div>
                    <div>SMTP_USER=admin@youthforchange.org.lr</div>
                    <div>SMTP_PASS=your-app-password</div>
                    <div>ADMIN_ALERT_EMAIL=admin@youthforchange.org.lr</div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSmtpModal(false)}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Gateway Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEM PROPOSAL ALERT EMAIL PREVIEW & RESEND MODAL */}
      {proposalAlertPreviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-200">
                  <Mail className="w-3.5 h-3.5 text-emerald-700" /> Administrator Notification Dispatcher
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  Proposal Alert Email Preview
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Preview and dispatch the exact notification sent to the administrator for "{proposalAlertPreviewModal.proposal?.title}".
                </p>
              </div>
              <button
                onClick={() => setProposalAlertPreviewModal(prev => ({ ...prev, isOpen: false }))}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Metadata Bar */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">Email Subject</span>
                  <span className="font-bold text-slate-900">{proposalAlertPreviewModal.subject || 'New STEM Innovation Challenge Proposal Submitted'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">School & County</span>
                  <span className="font-semibold text-emerald-900">
                    {proposalAlertPreviewModal.proposal?.school} ({proposalAlertPreviewModal.proposal?.county} County)
                  </span>
                </div>
              </div>
            </div>

            {/* Rendered HTML Container */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-100">
              <div className="bg-slate-200 px-4 py-2 text-[11px] font-bold text-slate-600 flex items-center justify-between border-b border-slate-300">
                <span>HTML Email Preview (Live Render)</span>
                <span className="text-[10px] font-mono text-slate-500">Youth For Change Liberia SMTP Standard</span>
              </div>
              {proposalAlertPreviewModal.loading ? (
                <div className="p-12 text-center text-slate-500 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-700" />
                  <p className="text-xs font-semibold">Generating alert layout from proposal data...</p>
                </div>
              ) : proposalAlertPreviewModal.previewHtml ? (
                <div 
                  className="p-4 max-h-96 overflow-y-auto bg-slate-50"
                  dangerouslySetInnerHTML={{ __html: proposalAlertPreviewModal.previewHtml }}
                />
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Could not load preview.
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-wrap justify-between items-center gap-3 border-t border-slate-100">
              <button
                onClick={() => setProposalAlertPreviewModal(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Close Preview
              </button>

              <button
                onClick={() => {
                  if (proposalAlertPreviewModal.proposal) {
                    handleSendAdminProposalAlert(proposalAlertPreviewModal.proposal);
                  }
                }}
                disabled={proposalAlertPreviewModal.sending || !proposalAlertPreviewModal.proposal}
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {proposalAlertPreviewModal.sending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Alert to Administrator...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Alert Email to Administrator</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
