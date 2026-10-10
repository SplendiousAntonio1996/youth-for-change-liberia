export type NavTab = 
  | 'home' 
  | 'about' 
  | 'programs' 
  | 'debate' 
  | 'stem' 
  | 'results' 
  | 'fixtures'
  | 'gallery' 
  | 'news' 
  | 'alumni'
  | 'documents'
  | 'involved' 
  | 'volunteer-dashboard'
  | 'admin'
  | 'contact';

export type AboutSubTab = 'story' | 'mission' | 'leadership' | 'partners';
export type ProgramsSubTab = 'debate-prog' | 'stem-prog' | 'mentorship' | 'academic' | 'leadership-prog';
export type DebateSubTab = '2015' | '2016' | '2017' | '2018' | '2019' | '2020' | '2021' | '2022' | '2023' | '2024-25' | 'future' | string;
export type StemSubTab = 'current' | 'projects' | 'winners' | 'previous';
export type ResultsSubTab = 'winners' | 'schools' | 'counties' | 'championships';
export type GallerySubTab = 'photos' | 'videos' | 'events';
export type InvolvedSubTab = 'schools' | 'students' | 'volunteers' | 'sponsors' | 'partners' | 'donate';
export type AlumniSubTab = 'directory' | 'testimonials' | 'feed' | 'mentorship' | 'register' | 'hall-of-orators';
export type DocumentSubTab = 'all' | 'rules' | 'motions' | 'forms' | 'reports' | 'stem-guides';

export interface AlumniTestimonial {
  id: string;
  name: string;
  highSchool: string;
  county: string;
  graduationYear: string;
  tournamentYear: string;
  role: string;
  currentTitle: string;
  organizationOrUniversity: string;
  fieldOfWork: 'Law & Governance' | 'Engineering & Tech' | 'Medicine & Health' | 'Public Policy' | 'Business & Finance' | 'Education & Media' | string;
  headline: string;
  story: string;
  keyQuote: string;
  impactArea: string;
  photo: string;
  verified: boolean;
  rating: number;
  featured?: boolean;
  adviceSnippet: string;
  videoUrl?: string; // Video testimonial URL (direct upload, server URL, or external link)
  videoDuration?: string; // Formatted duration e.g. "04:32"
  videoDurationSeconds?: number; // Duration in seconds (max 10 min = 600s)
  videoPoster?: string; // Video thumbnail poster
  authorUid?: string;
  createdAt: string;
  updatedAt?: string;
  likesCount: number;
  liked?: boolean;
}

export interface DonationRecord {
  id: string;
  donorName: string;
  donorEmail: string;
  donorPhone?: string;
  amount: number;
  currency: 'USD' | 'LRD';
  program: string;
  frequency: 'one-time' | 'monthly' | 'annual';
  paymentMethod: string;
  message?: string;
  isAnonymous: boolean;
  countyOrLocation?: string;
  status: 'confirmed' | 'pending' | 'verified';
  transactionReference: string;
  authorUid?: string;
  createdAt: string;
}

export interface AlumniProfile {
  id: string;
  name: string;
  highSchool: string;
  county: string;
  graduationYear: string;
  tournamentYear: string;
  role: 'Champion Debater' | 'Best Speaker' | 'STEM Finalist' | 'Team Captain' | 'Adjudicator Alum' | 'Debate Coach' | string;
  currentTitle: string;
  organizationOrUniversity: string;
  fieldOfWork: 'Law & Governance' | 'Engineering & Tech' | 'Medicine & Health' | 'Public Policy' | 'Business & Finance' | 'Education & Media' | string;
  bio: string;
  photo: string;
  contactEmail?: string;
  linkedIn?: string;
  location: string;
  isMentorAvailable: boolean;
  achievements: string[];
  adviceForDebaters: string;
  approved?: boolean;
  status?: 'active' | 'pending' | 'archived';
  hasTestimonial?: boolean;
  testimonialHeadline?: string;
  testimonialStory?: string;
  testimonialKeyQuote?: string;
  videoUrl?: string; // Video testimonial URL (up to 10 min)
  videoTestimonialUrl?: string; // Video testimonial URL up to 10 min
  videoDuration?: string;
  videoDurationSeconds?: number;
  videoPoster?: string;
  authorUid?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AlumniComment {
  id: string;
  authorName: string;
  authorSchool?: string;
  text: string;
  timestamp: string;
  avatar?: string;
}

export interface AlumniPost {
  id: string;
  authorId: string;
  authorName: string;
  authorSchool: string;
  authorYear: string;
  authorRole: string;
  authorPhoto: string;
  authorCounty: string;
  timestamp: string;
  content: string;
  category: 'Mentorship' | 'Job & Opportunity' | 'Debate Tactics' | 'Announcement' | 'Reunion & Memories';
  likes: number;
  likedByMe?: boolean;
  comments: AlumniComment[];
}

export interface DocumentSection {
  title: string;
  content: string[];
}

export interface DocumentItem {
  id: string;
  title: string;
  category: 'Rulebooks & Guidelines' | 'Research Dossiers & Motions' | 'Forms & Affiliation' | 'Impact Reports & Whitepapers' | 'STEM Toolkits';
  fileType: 'pdf' | 'doc' | 'sheet';
  fileSize: string;
  publishDate: string;
  downloadCount: number;
  editionYear: string;
  authorOrDept: string;
  description: string;
  tags: string[];
  contentSections: DocumentSection[];
  fileUrl?: string;
  authorUid?: string;
  createdAt?: string;
}

export interface LeaderMember {
  id?: string;
  name: string;
  role: string;
  bio: string;
  county: string;
  image: string;
  social?: string;
  email?: string;
  phone?: string;
  department?: string;
  order?: number;
  featured?: boolean;
  active?: boolean;
  authorUid?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PartnerOrg {
  id?: string;
  name: string;
  category: 'Government' | 'International Agency' | 'Corporate' | 'Academic' | 'NGO' | 'Community' | 'Media' | string;
  description: string;
  logoText: string;
  logoUrl?: string;
  coverImage?: string;
  accentColor: string;
  websiteUrl?: string;
  county?: string;
  contactEmail?: string;
  contactPerson?: string;
  isLive?: boolean;
  status?: 'approved' | 'active' | 'pending' | 'archived';
  applicationId?: string;
  approvedAt?: string;
  createdAt?: string;
}

export interface DebateEdition {
  id?: string;
  year: string;
  title: string;
  tagline: string;
  theme: string;
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
  image: string;
  semiFinalists: string[];
  notableMotions: string[];
  status?: 'Completed' | 'Upcoming' | 'In Progress' | 'Archived';
  authorUid?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type DebateCalendarCategory = 'championship' | 'deadline' | 'qualifier' | 'workshop' | 'milestone';

export interface DebateCalendarEvent {
  id: string;
  title: string;
  date: string; // ISO format: YYYY-MM-DD
  endDate?: string; // Optional end date for multi-day events
  time: string; // e.g. "09:00 AM - 04:30 PM GMT"
  category: DebateCalendarCategory;
  phase: string;
  venue: string;
  county: string;
  description: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  tag: string;
  milestoneNumber: number;
  totalMilestones: number;
  highlights?: string[];
  contactPerson?: string;
  contactEmail?: string;
  targetAudience?: string;
  isGrandFinal?: boolean;
}

export interface StemProject {
  id: string;
  title: string;
  school: string;
  county: string;
  category: 'Renewable Energy' | 'Clean Water & Sanitation' | 'Agriculture & Food Security' | 'Healthcare Tech' | 'Climate & Waste Management' | 'Smart Education';
  year: string;
  award?: string;
  summary: string;
  problemStatement: string;
  solution: string;
  studentTeam: string[];
  mentor: string;
  status: 'Prototype Validated' | 'Field Tested' | 'Active Implementation' | 'Award Winner';
  image: string;
}

export interface SchoolRank {
  id: string;
  name: string;
  county: string;
  city: string;
  debateTitles: number;
  stemTitles: number;
  finalAppearances: number;
  totalPoints: number;
  established: string;
  motto: string;
  badgeColor: string;
}

export interface CountyPerformance {
  county: string;
  capital: string;
  flagEmblem: string;
  activeSchools: number;
  debateTitles: number;
  stemTitles: number;
  totalDebaters: number;
  coordinator: string;
  coordinatorContact: string;
  highlight: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'photos' | 'videos' | 'events';
  editionYear: string;
  county: string;
  url: string;
  description: string;
  date: string;
  tag: string;
  duration?: string;
  videoEmbedUrl?: string;
  videoUrl?: string;
  posterUrl?: string;
  venue?: string;
  eventTime?: string;
  registrationLink?: string;
  authorUid?: string;
  authorEmail?: string;
  createdAt?: string;
  updatedAt?: string;
  lastVerifiedAt?: string;
  isVerified?: boolean;
}

export interface StemTrack {
  name: string;
  description: string;
}

export interface StemRoadmapStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  details: string[];
}

export interface StemEvaluationCriterion {
  criterion: string;
  weight: string;
  description: string;
}

export interface StemChallengeConfig {
  id?: string;
  edition: string;
  theme: string;
  tagline: string;
  deadline: string;
  grandExpoDate: string;
  location: string;
  participatingSchools?: number;
  countiesRepresented?: number;
  prizes: {
    firstPlace: string;
    secondPlace: string;
    thirdPlace: string;
    specialCategory?: string;
  };
  tracks: StemTrack[];
  eligibilityRules?: string[];
  howToAccomplishOverview?: string;
  accomplishmentRoadmap?: StemRoadmapStep[];
  submissionGuidelines?: string[];
  requiredDeliverables?: string[];
  evaluationRubric?: StemEvaluationCriterion[];
  guidelinesUrl?: string;
  status?: 'active' | 'archived' | 'upcoming';
  createdAt?: string;
  updatedAt?: string;
}

export interface StemProposal {
  id: string;
  title: string;
  school: string;
  county: string;
  category: string;
  teamLead: string;
  studentTeam?: string[];
  mentor: string;
  mentorEmail?: string;
  mentorPhone?: string;
  summary: string;
  problemStatement?: string;
  solution?: string;
  materialsBudget?: string;
  prototypeStage?: 'Concept' | 'Schematic / Blueprint' | 'Working Prototype' | 'Field Tested';
  fileUrl?: string;
  status: 'Pending Review' | 'Under Evaluation' | 'Shortlisted for Expo' | 'Grant Approved' | 'Revision Requested' | 'Declined';
  reviewerNotes?: string;
  scoreTotal?: number;
  submittedAt: string;
  updatedAt?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  readTime: string;
  category: 'Tournament News' | 'STEM Innovation' | 'Policy & Education' | 'Partner Spotlight' | 'Press Release';
  source: string;
  author: string;
  image: string;
  summary: string;
  fullContent: string[];
  authorUid?: string;
  createdAt?: string;
}

export interface InvolvementApplication {
  id: string;
  type: 'school' | 'student' | 'volunteer' | 'sponsor' | 'partner';
  name: string;
  email: string;
  phone: string;
  schoolOrOrg?: string;
  county: string;
  roleOrInterest: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  // Category-specific details
  gradeLevel?: string;
  scholarshipInterest?: boolean;
  careerAspiration?: string;
  principalOrHead?: string;
  delegationSize?: number;
  sponsorshipTier?: string;
  pledgedAmount?: number;
  currency?: 'USD' | 'LRD';
  partnerType?: string;
  eventId?: string;
  eventTitle?: string;
  attendanceMode?: string;
  logoText?: string;
  logoUrl?: string;
  coverImage?: string;
  websiteUrl?: string;
  accentColor?: string;
  description?: string;
  emailNotificationSent?: boolean;
  lastEmailStatus?: string;
  lastEmailSentAt?: string;
  emailDeliveryLog?: Array<{
    timestamp: string;
    status: 'approved' | 'pending' | 'rejected' | string;
    recipient: string;
    subject: string;
    success: boolean;
    previewId?: string;
  }>;
}

export interface SubscriberItem {
  id: string;
  email: string;
  category: string;
  subscribedAt: string;
  source?: 'Footer Newsletter' | 'Welcome Pop-up Modal' | 'Admin Manual Entry' | string;
  status: 'active' | 'unsubscribed';
  county?: string;
  isMock?: boolean;
  notes?: string;
  authorUid?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgramStatus {
  id: string;
  programId: string;
  title: string;
  subtitle?: string;
  isOpen: boolean;
  statusLabel?: string;
  closedNotice?: string;
  openNotice?: string;
  registrationDeadline?: string;
  registrationDeadlineDate?: string;
  seasonYear?: string;
  targetAudience?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface LndcWinningHistoryItem {
  year: string;
  grandFinalMatchup: string;
  champion: string;
  championFull: string;
  championCounty: string;
  runnerUp: string;
  runnerUpCounty: string;
  verdict: string;
  awards?: string;
  mvp?: string;
  mvpSchool?: string;
  mes?: string;
  mesSchool?: string;
}

export type { TournamentEditionArchive } from './tournament';
export type { TournamentStageProgressionState } from '../lib/tournamentStageService';


