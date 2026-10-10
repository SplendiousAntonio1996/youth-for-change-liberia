export interface VolunteerOpportunity {
  id: string;
  title: string;
  category: 'Debate Adjudication' | 'STEM Evaluation' | 'Event Operations' | 'Youth Mentorship' | 'County Logistics' | 'Media & Photography';
  editionYear: string;
  date: string;
  time: string;
  location: string;
  county: string;
  venue: string;
  description: string;
  requiredSkills: string[];
  slotsTotal: number;
  slotsFilled: number;
  status: 'Open' | 'Filling Fast' | 'Urgent' | 'Completed';
  leadCoordinator: string;
  contactEmail: string;
  badgeColor: string;
}

export interface VolunteerRegistration {
  id: string;
  eventId: string;
  eventTitle: string;
  volunteerName: string;
  email: string;
  phone: string;
  roleAssigned: string;
  county: string;
  registeredAt: string;
  status: 'Confirmed' | 'Pending Review' | 'Completed';
  attendanceMode: 'In-Person' | 'Virtual / Hybrid';
  notes?: string;
}

export const INITIAL_VOLUNTEER_EVENTS: VolunteerOpportunity[] = [
  {
    id: 'vol-ev-01',
    title: 'Grand National Finals: Chief Adjudication & Round Timers',
    category: 'Debate Adjudication',
    editionYear: '2024/2025 (10th Jubilee)',
    date: 'March 28, 2025',
    time: '8:30 AM - 4:30 PM GMT',
    location: 'Monrovia, Montserrado County',
    county: 'Montserrado',
    venue: 'Monrovia City Hall Ballroom',
    description: 'Officiate high-stakes championship rounds between top secondary school finalists. Score forensics clarity, refutation, and evidence fidelity.',
    requiredSkills: ['Parliamentary debate familiarity', 'Active listening', 'Formal scoring rubrics'],
    slotsTotal: 16,
    slotsFilled: 11,
    status: 'Filling Fast',
    leadCoordinator: 'Cllr. T. Jerry Moore (Chief Adjudicator)',
    contactEmail: 'adjudication@youthforchangeliberia.org',
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-200'
  },
  {
    id: 'vol-ev-02',
    title: 'National STEM Challenge: Prototype Jury & Demo Day Mentors',
    category: 'STEM Evaluation',
    editionYear: '2024/2025',
    date: 'April 12, 2025',
    time: '9:00 AM - 3:00 PM GMT',
    location: 'Kakata, Margibi County',
    county: 'Margibi',
    venue: 'Booker Washington Institute Science Complex',
    description: 'Evaluate high school hardware prototypes, renewable solar micro-grids, and clean water filtration systems presented by student teams.',
    requiredSkills: ['STEM background', 'Engineering / Tech literacy', 'Constructive student critique'],
    slotsTotal: 12,
    slotsFilled: 7,
    status: 'Open',
    leadCoordinator: 'Dr. Massa Washington',
    contactEmail: 'stem@youthforchangeliberia.org',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200'
  },
  {
    id: 'vol-ev-03',
    title: 'Central Counties Regional Forensics Tournament (Bong, Nimba, Lofa)',
    category: 'County Logistics',
    editionYear: '2024/2025',
    date: 'May 3, 2025',
    time: '8:00 AM - 5:00 PM GMT',
    location: 'Gbarnga, Bong County',
    county: 'Bong',
    venue: 'Cuttington University Multipurpose Hall',
    description: 'Coordinate student team check-ins, room logistics, debate prompt disbursements, and hospitality for over 28 visiting high schools.',
    requiredSkills: ['Hospitality & organization', 'Time management', 'Youth facilitation'],
    slotsTotal: 20,
    slotsFilled: 14,
    status: 'Open',
    leadCoordinator: 'Emmanuel B. Cole (Central Region Lead)',
    contactEmail: 'regional.bong@youthforchangeliberia.org',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200'
  },
  {
    id: 'vol-ev-04',
    title: 'High School Debate Bootcamp & Public Speaking Clinic',
    category: 'Youth Mentorship',
    editionYear: '2024/2025',
    date: 'May 17, 2025',
    time: '10:00 AM - 2:00 PM GMT',
    location: 'Buchanan, Grand Bassa County',
    county: 'Grand Bassa',
    venue: 'Bassa High School Auditorium',
    description: 'Conduct interactive speaking drills, rebuttal structuring sessions, and stage confidence workshops for emerging junior high debaters.',
    requiredSkills: ['Public speaking coaching', 'Youth engagement', 'Empathy & mentorship'],
    slotsTotal: 10,
    slotsFilled: 9,
    status: 'Urgent',
    leadCoordinator: 'Helena S. Davies',
    contactEmail: 'mentorship@youthforchangeliberia.org',
    badgeColor: 'bg-purple-100 text-purple-900 border-purple-200'
  },
  {
    id: 'vol-ev-05',
    title: 'Southeastern Counties Championship & Digital Livestream Crew',
    category: 'Media & Photography',
    editionYear: '2024/2025',
    date: 'June 7, 2025',
    time: '9:00 AM - 6:00 PM GMT',
    location: 'Harper, Maryland County',
    county: 'Maryland',
    venue: 'Tubman University Auditorium',
    description: 'Capture broadcast video, photojournalism, live social updates, and manage multi-camera feeds for the Southeast championship finals.',
    requiredSkills: ['Photography / Video camera handling', 'Social media reporting', 'Audio mixing'],
    slotsTotal: 8,
    slotsFilled: 4,
    status: 'Open',
    leadCoordinator: 'Koffa J. Weah',
    contactEmail: 'media@youthforchangeliberia.org',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-200'
  },
  {
    id: 'vol-ev-06',
    title: '10th Jubilee Youth Gala & Forensics Alumni Reunion',
    category: 'Event Operations',
    editionYear: '2024/2025',
    date: 'July 19, 2025',
    time: '5:30 PM - 10:00 PM GMT',
    location: 'Monrovia, Montserrado County',
    county: 'Montserrado',
    venue: 'EJS Ministerial Complex Auditorium',
    description: 'Support registration desks, dignitary protocols, awards distribution, and alumni networking logistics for our decade anniversary celebration.',
    requiredSkills: ['Guest reception', 'Protocol assistance', 'Event decorum'],
    slotsTotal: 25,
    slotsFilled: 18,
    status: 'Open',
    leadCoordinator: 'Alex F. Devine (Executive Director)',
    contactEmail: 'jubilee@youthforchangeliberia.org',
    badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200'
  }
];

export const INITIAL_USER_REGISTRATIONS: VolunteerRegistration[] = [
  {
    id: 'reg-001',
    eventId: 'vol-ev-01',
    eventTitle: 'Grand National Finals: Chief Adjudication & Round Timers',
    volunteerName: 'Abraham K. Mensah',
    email: 'abraham.mensah@gmail.com',
    phone: '+231 77 555 8921',
    roleAssigned: 'Lead Forensics Adjudicator (Panel 2)',
    county: 'Montserrado',
    registeredAt: '2025-01-14T10:30:00Z',
    status: 'Confirmed',
    attendanceMode: 'In-Person',
    notes: 'Experienced parliamentary debater; previously judged 2023 county rounds.'
  },
  {
    id: 'reg-002',
    eventId: 'vol-ev-02',
    eventTitle: 'National STEM Challenge: Prototype Jury & Demo Day Mentors',
    volunteerName: 'Abraham K. Mensah',
    email: 'abraham.mensah@gmail.com',
    phone: '+231 77 555 8921',
    roleAssigned: 'Clean Energy & Water Projects Jury',
    county: 'Margibi',
    registeredAt: '2025-01-20T14:15:00Z',
    status: 'Confirmed',
    attendanceMode: 'In-Person',
    notes: 'Providing evaluation for solar micro-grid installations.'
  }
];
