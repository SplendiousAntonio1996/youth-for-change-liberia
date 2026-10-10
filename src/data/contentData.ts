import { GalleryItem, LeaderMember, NewsArticle, PartnerOrg } from '../types';

export const ABOUT_STORY = {
  title: 'About YOUTH for Change .INC Liberia',
  foundedYear: '2015',
  founder: 'YOUTH for Change .INC',
  location: 'Liberia (Serving all 15 Counties)',
  narrative: [
    'YOUTH for Change .INC is a youth empowerment organization committed to creating opportunities for young people to learn, develop their talents, find their voices, and become active contributors to their communities and country.',
    'It represents the belief that young people already possess talent, ideas, and leadership potential. What they often need is access to the right platforms, mentorship, education, encouragement, and opportunities to develop those abilities. The organization\'s work demonstrates that investing in young people can strengthen not only individual lives but also communities and the future of Liberia.',
    'Founded in 2015, YOUTH for Change .INC began as a grassroots initiative in Monrovia by a cohort of passionate Liberian educators, debaters, and civic advocates. Confronted with post-war educational resource disparities and a lack of structured extracurricular enrichment, the founders established the National High School Debate Championship to provide students with a rigorous intellectual arena.',
    'What started with 16 high schools in Montserrado County has grown into a vibrant nationwide movement spanning all 15 counties of Liberia. Over the past decade, YOUTH for Change .INC expanded its flagship programs to include the National STEM Challenge, the National Forensics League, Civic Leadership Fellowships, and County Youth Dialogues—empowering over 25,000 students and nurturing Liberia\'s next generation of thinkers, innovators, and patriotic leaders.'
  ]
};

export const MISSION_VISION = {
  mission: 'To empower young people through education, mentorship, leadership development, critical thinking, and meaningful opportunities that enable them to find their voices, develop their potential, and contribute positively to society.',
  vision: 'A Liberia where every young person has the opportunity to develop their talents, express their ideas, participate meaningfully in society, and grow into a confident, responsible, and ethical leader who contributes to positive change.',
  coreValues: [
    {
      title: 'Education & Learning',
      description: 'Providing platforms and educational pathways for youth to sharpen their critical thinking and intellect.'
    },
    {
      title: 'Mentorship & Leadership',
      description: 'Guiding young minds through active mentorship and developing responsible, ethical future leaders.'
    },
    {
      title: 'Talent & Voice Development',
      description: 'Empowering young people to find their authentic voices, express their ideas, and realize their full potential.'
    },
    {
      title: 'Meaningful Opportunity',
      description: 'Creating accessible platforms, encouragement, and real-world opportunities across all communities.'
    },
    {
      title: 'Community & National Impact',
      description: 'Strengthening individual lives, local communities, and building a prosperous future for Liberia.'
    }
  ]
};

export const LEADERSHIP_ROLES = [
  'Founder & Executive Director',
  'Program Manager',
  'Program Associate',
  'Finance Manager',
  'Accountant',
  'Communication Lead',
  'Media Associate',
  'HR',
  'Procurement Manager',
  'Training and Development officer'
] as const;

export type LeadershipRole = typeof LEADERSHIP_ROLES[number];

export const LEADERSHIP_TEAM: LeaderMember[] = [
  {
    id: 'leader-founder-exec-director',
    name: 'Alex F. Devine',
    role: 'Founder & Executive Director',
    department: 'Executive Directorate',
    county: 'Montserrado',
    bio: 'Founder and Executive Director of Youth For Change Liberia. Since 2015, spearheaded the growth of the National High School Debate Championship and STEM challenge across all 15 counties, mobilizing thousands of youth debaters and mentors.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    email: 'director@youthforchange.org',
    social: '@alexdevine_yfc',
    order: 1,
    featured: true,
    active: true,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'leader-program-manager',
    name: 'J. Kpadeh Mulbah',
    role: 'Program Manager',
    department: 'Programs & Operations',
    county: 'Montserrado',
    bio: 'Oversees tournament operations, curriculum guidelines, inter-school scheduling, and national debate rounds across all 15 counties. Coordinates technical adjudicators and county debate managers.',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    email: 'programs@youthforchange.org',
    social: '@kpad_programs',
    order: 2,
    featured: true,
    active: true,
    createdAt: '2025-01-02T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z'
  },
  {
    id: 'leader-program-associate',
    name: 'Garmai N. Kollie',
    role: 'Program Associate',
    department: 'Programs & Operations',
    county: 'Margibi',
    bio: 'Assists with high school team accreditation, regional tournament venue logistics, fixtures coordination, and debater registration for zonal championships.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    email: 'garmai.kollie@youthforchange.org',
    social: '@garmai_yfc',
    order: 3,
    featured: false,
    active: true,
    createdAt: '2025-01-03T00:00:00.000Z',
    updatedAt: '2025-01-03T00:00:00.000Z'
  },
  {
    id: 'leader-finance-manager',
    name: 'T. Augustine Weah',
    role: 'Finance Manager',
    department: 'Finance & Administration',
    county: 'Montserrado',
    bio: 'Directs financial governance, donor grants accounting, institutional budgeting, audit compliance, and resource allocation for national youth competitions.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    email: 'finance@youthforchange.org',
    social: '@augustine_weah_fin',
    order: 4,
    featured: false,
    active: true,
    createdAt: '2025-01-04T00:00:00.000Z',
    updatedAt: '2025-01-04T00:00:00.000Z'
  },
  {
    id: 'leader-accountant',
    name: 'Patricia S. Benson',
    role: 'Accountant',
    department: 'Finance & Administration',
    county: 'Montserrado',
    bio: 'Manages ledger accounting, coach stipend disbursements, regional logistics disbursements, and fiscal reporting with absolute precision and transparency.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80',
    email: 'accounts@youthforchange.org',
    social: '@patricia_benson_acct',
    order: 5,
    featured: false,
    active: true,
    createdAt: '2025-01-05T00:00:00.000Z',
    updatedAt: '2025-01-05T00:00:00.000Z'
  },
  {
    id: 'leader-communication-lead',
    name: 'Darius M. Sirleaf',
    role: 'Communication Lead',
    department: 'Media, Press & Communications',
    county: 'Montserrado',
    bio: 'Leads strategic communications, public diplomacy, ministry press releases, partner announcements, and institutional storytelling across national media.',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    email: 'communications@youthforchange.org',
    social: '@darius_sirleaf_comm',
    order: 6,
    featured: true,
    active: true,
    createdAt: '2025-01-06T00:00:00.000Z',
    updatedAt: '2025-01-06T00:00:00.000Z'
  },
  {
    id: 'leader-media-associate',
    name: 'Princess K. Tweh',
    role: 'Media Associate',
    department: 'Media, Press & Communications',
    county: 'Nimba',
    bio: 'Produces multimedia documentation, tournament live broadcasts, digital photography, highlight reels, and social media coverage of young Liberian innovators.',
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
    email: 'media@youthforchange.org',
    social: '@princess_media_yfc',
    order: 7,
    featured: false,
    active: true,
    createdAt: '2025-01-07T00:00:00.000Z',
    updatedAt: '2025-01-07T00:00:00.000Z'
  },
  {
    id: 'leader-hr',
    name: 'Comfort E. Clarke',
    role: 'HR',
    department: 'Human Resources & Talent',
    county: 'Montserrado',
    bio: 'Heads human resources, personnel recruitment, staff development, volunteer orientation, and code of conduct compliance for our team across Liberia.',
    image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80',
    email: 'hr@youthforchange.org',
    social: '@comfort_clarke_hr',
    order: 8,
    featured: false,
    active: true,
    createdAt: '2025-01-08T00:00:00.000Z',
    updatedAt: '2025-01-08T00:00:00.000Z'
  },
  {
    id: 'leader-procurement-manager',
    name: 'Samuel B. Fahnbulleh',
    role: 'Procurement Manager',
    department: 'Logistics & Procurement',
    county: 'Grand Bassa',
    bio: 'Directs procurement of STEM innovation kits, debate audio systems, county stage equipment, trophies, medals, and vendor contract agreements.',
    image: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=800&q=80',
    email: 'procurement@youthforchange.org',
    social: '@samuel_fahnbulleh',
    order: 9,
    featured: false,
    active: true,
    createdAt: '2025-01-09T00:00:00.000Z',
    updatedAt: '2025-01-09T00:00:00.000Z'
  },
  {
    id: 'leader-training-development-officer',
    name: 'Helena K. Sherman',
    role: 'Training and Development officer',
    department: 'Training & Capacity Building',
    county: 'Bong',
    bio: 'Coordinates training workshops for high school coaches, adjudicator certification courses, debate clinic bootcamps, and student leadership seminars.',
    image: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=800&q=80',
    email: 'training@youthforchange.org',
    social: '@helena_sherman_train',
    order: 10,
    featured: true,
    active: true,
    createdAt: '2025-01-10T00:00:00.000Z',
    updatedAt: '2025-01-10T00:00:00.000Z'
  }
];

export const PARTNERS_LIST: PartnerOrg[] = [
  {
    name: 'Ministry of Education, Republic of Liberia',
    category: 'Government',
    description: 'Official endorsing ministry supporting national curriculum alignment, venue access, and school participation accreditation.',
    logoText: 'MOE LIBERIA',
    coverImage: '/group.jpg',
    websiteUrl: 'http://moe.gov.lr',
    county: 'Montserrado',
    accentColor: 'border-blue-500 text-blue-700 bg-blue-50'
  },
  {
    name: 'Ministry of Youth & Sports, Liberia',
    category: 'Government',
    description: 'Partner for national youth leadership development, civic education summits, and county coordination facilities.',
    logoText: 'MYS LIBERIA',
    coverImage: '/YOUTH.jpeg',
    websiteUrl: 'https://moys.gov.lr',
    county: 'Montserrado',
    accentColor: 'border-red-500 text-red-700 bg-red-50'
  },
  {
    name: 'USAID Liberia Mission',
    category: 'International Agency',
    description: 'Grantor and supporter of reading clinics, youth civic literacy drives, and rural STEM equipment seed funds.',
    logoText: 'USAID LIBERIA',
    coverImage: '/group1.jpg',
    websiteUrl: 'https://www.usaid.gov/liberia',
    county: 'National',
    accentColor: 'border-blue-600 text-blue-800 bg-slate-50'
  },
  {
    name: 'Orange Liberia Foundation',
    category: 'Corporate',
    description: 'Telecommunications partner providing connectivity, digital tablets, and tech sponsorship for the National Finals.',
    logoText: 'ORANGE FOUNDATION',
    coverImage: '/STEM.jpeg',
    websiteUrl: 'https://www.orange.com.lr',
    county: 'National',
    accentColor: 'border-orange-500 text-orange-700 bg-orange-50'
  }
];

export const PROGRAMS_DETAILED = [
  {
    id: 'debate-prog',
    title: 'National Debate Championship',
    subtitle: 'Liberia’s Premier High School Forensics & Oratory League',
    badge: 'Flagship Program',
    icon: 'Flame',
    stats: '80+ High Schools • 15 Counties • 10 Editions',
    description: 'An elite national intellectual arena where high school debaters rigorously research, present, and defend policy motions on economic sovereignty, environmental justice, constitutional governance, and technology.',
    curriculum: [
      'World Schools Debate Championship (WSDC) & Parliamentary Structures',
      'Advanced Research Methodologies & Evidence Verification',
      'Strategic Points of Information (POI) & Dynamic Refutation Tactics',
      'Public Oratory, Tone Modulation, and Body Language'
    ],
    impact: 'Produced over 3,000 confident youth orators who now serve as student union presidents, legal interns, journalists, and civic activists.',
    image: '/DEBATE.jpeg'
  },
  {
    id: 'stem-prog',
    title: 'National STEM Challenge',
    subtitle: 'Grassroots Scientific Engineering & Clean-Tech Expo',
    badge: 'Innovation Hub',
    icon: 'Cpu',
    stats: '240+ Prototypes • 48 Schools • $25k+ Grants',
    description: 'A hands-on engineering contest challenging students to convert local scrap, agricultural by-products, and solar micro-electronics into working prototypes addressing community challenges in Liberia.',
    curriculum: [
      'Design Thinking & Human-Centered Engineering',
      'Circuitry, Arduino Prototyping & Renewable Solar Kits',
      'Agro-Processing & Mechanical Value-Addition',
      'Scientific Journaling, Pitch Deck Creation & Live Demos'
    ],
    impact: 'Generated 6 patent-ready prototypes in renewable energy, water filtration, and agro-processing adopted by local farming cooperatives.',
    image: '/STEM.jpeg'
  },
  {
    id: 'mentorship',
    title: 'Youth Mentorship & Diaspora Scholars Exchange',
    subtitle: 'Connecting Aspiring High Schoolers with Global Leaders',
    badge: 'Life-Long Impact',
    icon: 'Users',
    stats: '500+ Mentees • 120 Mentors Across 8 Countries',
    description: 'A 9-month structured mentorship fellowship pairing promising high school debaters and STEM inventors with Liberian professionals, university professors, and diaspora leaders around the world.',
    curriculum: [
      'Career Path Mapping (Law, Engineering, Medicine, Policy)',
      'University Application & Scholarship Essay Writing',
      'Professional Etiquette, Networking & Email Communication',
      'Civic Ethics & Emotional Intelligence Development'
    ],
    impact: '88% of mentored alumni secure admissions and scholarships into top universities across Liberia, Ghana, Rwanda, the US, and Europe.',
    image: '/group.jpg'
  },
  {
    id: 'academic',
    title: 'Academic Empowerment & High School Quizzing',
    subtitle: 'Library Drives, Reading Clinics & WASSCE Prep Clinics',
    badge: 'Foundation for All',
    icon: 'BookOpen',
    stats: '15,000+ Books Distributed • 45 Reading Clinics',
    description: 'Targeted academic support programs designed to strengthen reading comprehension, mathematical reasoning, and general science proficiency in underprivileged and rural high schools.',
    curriculum: [
      'Community High School Book Drives & Mobile Libraries',
      'Inter-County High School Academic Quizzing Leagues',
      'WASSCE Examination Masterclasses with Senior Educators',
      'Teacher Training Workshops on Active Learning'
    ],
    impact: 'Participating schools recorded a 24% increase in WASSCE pass rates and established 32 active reading clubs across 15 counties.',
    image: '/ACADEMIC.jpeg'
  },
  {
    id: 'leadership-prog',
    title: 'Youth Leadership & Civic Action Academy',
    subtitle: 'Building Ethical Public Servants & Community Organizers',
    badge: 'Nation Builders',
    icon: 'Award',
    stats: '60 Community Projects Completed • 1,200 Youth Leaders',
    description: 'An intensive civic leadership bootcamp that immerses young people in mock legislative sessions, public budget tracking, community dispute resolution, and local volunteer initiatives.',
    curriculum: [
      'Model Liberian National Legislature & Parliamentary Rules',
      'Community Needs Assessment & Grassroots Project Design',
      'Public Finance Literacy & Anti-Corruption Monitoring',
      'Conflict Resolution & Peacebuilding in Post-Conflict Settings'
    ],
    impact: 'Alumni have spearheaded 60+ grassroots community projects, including coastal clean-ups, school desk fabrication, and solar well installations.',
    image: '/YOUTH.jpeg'
  }
];

export const GALLERY_ITEMS: GalleryItem[] = [];

export const NEWS_ARTICLES: NewsArticle[] = [];
