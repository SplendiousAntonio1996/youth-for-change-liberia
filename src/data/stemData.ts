import { StemProject, StemChallengeConfig } from '../types';

export const CURRENT_STEM_CHALLENGE: StemChallengeConfig = {
  edition: '2025/2026 National High School STEM Challenge',
  theme: 'Sustainable Innovations for Liberian Communities: Clean Water, Agro-tech & Renewable Energy',
  tagline: 'Empowering High School Scholars to Engineer Low-Cost, Off-Grid Prototypes for Liberia\'s Agriculture, Water (WASH), and Energy Sectors',
  deadline: 'October 30, 2025',
  grandExpoDate: 'December 12-14, 2025',
  location: 'EJS Ministerial Complex & YFC Innovation Pavilion, Monrovia',
  participatingSchools: 48,
  countiesRepresented: 15,
  prizes: {
    firstPlace: '$5,000 Laboratory Overhaul Grant + Full 4-Year University Engineering Scholarships + Laptops for each student',
    secondPlace: '$3,000 School STEM Equipment Grant + Advanced Electronics & Solar Fabrication Toolkits',
    thirdPlace: '$1,500 Prototype Deployment Seed Fund for Village Implementation',
    specialCategory: 'Best Female-Led Innovation Award ($1,000 Cash Grant) + Women in STEM Mentorship'
  },
  tracks: [
    {
      name: 'Agri-Tech & Post-Harvest Preservation (Liberia Agriculture Sector)',
      description: 'Designing affordable solar dehydrators, pedal-powered cassava graters & de-waterers (gari & fufu processing), oil palm kernel crackers, and moisture-sealed grain cribs to eliminate the 35–45% rainy-season post-harvest losses experienced by smallholder farmers in Nimba, Bong, Lofa, and Bomi counties.'
    },
    {
      name: 'Clean Water & Community Sanitation (Liberia WASH Sector)',
      description: 'Constructing low-cost multi-stage bio-sand filtration units with local quarry sand and Moringa oleifera coagulants, solar UV purifiers (SODIS), and rooftop rainwater harvesting catchments with first-flush diverters for rural clinics, public schools, and coastal settlements lacking LWSC pipe-borne water.'
    },
    {
      name: 'Renewable Clean Energy & Rural Electrification (Liberia Energy Sector)',
      description: 'Engineering off-grid solar study stations using repurposed lithium cells to replace hazardous kerosene lamps for WASSCE students, biomass briquettes made from cassava peels and timber sawmill sawdust to halt mangrove deforestation, and low-head micro-hydro creek waterwheels for fast-flowing streams in rural townships.'
    },
    {
      name: 'Civic Health & Environmental Resilience (Liberia Community Infrastructure)',
      description: 'Developing evaporative cooling vaccine storage boxes for off-grid Ministry of Health (MOH) rural clinics, SMS-based emergency flood alarms for Atlantic coastal communities (West Point, New Kru Town, Buchanan), and localized plastic waste-to-paver construction innovations.'
    }
  ],
  eligibilityRules: [
    'Accredited Liberian High Schools: Open to all registered public, private, and mission senior high schools across all 15 counties of Liberia (Montserrado, Nimba, Bong, Lofa, Margibi, Grand Bassa, Bomi, Grand Cape Mount, Gbarpolu, Sinoe, River Cess, Grand Gedeh, River Gee, Grand Kru, and Maryland).',
    'Student Innovation Squad: Teams must comprise 3 to 5 active students currently enrolled in Grades 9 through 12 (senior high division).',
    'Gender Equity Prioritization: Teams with at least 40% female student representation receive bonus points in evaluation and qualify for the prestigious Best Female-Led Innovation Award ($1,000).',
    'Accredited Faculty Mentor: Each team must be guided by a certified high school science teacher (Physics, Chemistry, Biology, Mathematics) or a verified local engineering technician.',
    'Tangible Working Prototype Mandatory: Teams must demonstrate an operational physical prototype—purely theoretical essays without functioning hardware models are not admissible.',
    'Strict Local Fabrication Budget: All physical prototypes must be constructed within a $50 to $350 USD (or equivalent LRD) budget limit to guarantee rural village affordability and replicability.'
  ],
  howToAccomplishOverview: 'The National STEM Challenge invites secondary school teams across all 15 Liberian counties to transform urgent grassroots bottlenecks in agriculture, clean water (WASH), and off-grid renewable energy into functional, low-cost scientific prototypes. Aligned directly with Liberia\'s national development priorities (the ARREST Agenda and the Ministry of Education STEM curriculum), this competition challenges students to replace theoretical memorization with hands-on engineering craft. Student squads solve real Liberian challenges—such as post-harvest cassava spoilage during heavy rains, river turbidity in off-grid clinic water sources, and kerosene fume hazards during nighttime study—by building working models from locally sourced scrap, timber offcuts, discarded bicycle components, and recycled solar parts for under $350 USD.',
  accomplishmentRoadmap: [
    {
      stepNumber: 1,
      title: 'Grassroots Community Inquiry in Your County',
      subtitle: 'Field Investigation Across Liberian Farming & Rural Settlements',
      details: [
        'Conduct direct field interviews with local cassava and vegetable farmers, market women in county hubs (e.g., Red Light, Gbarnga, Ganta, Buchanan, Kakata), township water committees, or rural clinic officers.',
        'Pinpoint a quantifiable Liberian sector bottleneck: for instance, 40% cassava rotting during tropical downpours; creek turbidity and waterborne disease risks during heavy rains; or high schoolers studying by toxic kerosene lamps due to lack of LEC grid electricity.',
        'Formulate an actionable problem statement detailing the target community, baseline daily losses, and the measurable engineering performance your prototype must achieve.'
      ]
    },
    {
      stepNumber: 2,
      title: 'Team Formation & Science Teacher Mentorship',
      subtitle: 'Assemble 3–5 High School Scholars + 1 Science Instructor',
      details: [
        'Assemble a squad of 3 to 5 senior high students (Grades 9–12) with distinct roles: Project Captain, Mechanical/Electrical Fabricator, Research & Trial Data Analyst, and Oral Defense Presenter.',
        'Ensure at least 40% female participation to champion Liberian young women in engineering and qualify for the $1,000 Best Female-Led Innovation Grant.',
        'Partner with an accredited science teacher (Physics, Chemistry, Biology, or ICT instructor) or local TVET technician to supervise workshop safety, technical calculations, and experimental procedures.'
      ]
    },
    {
      stepNumber: 3,
      title: 'Appropriate Technology Sourcing in Liberia',
      subtitle: 'Zero-Waste Architecture & Local Sourcing ($50 – $350 USD)',
      details: [
        'Source components locally from Liberian scrap yards, bicycle repair shops, scrap auto batteries, PVC conduits, scrap zinc sheet metal, local timber offcuts, and natural materials (Moringa seeds, charcoal, river sand).',
        'Design strictly for off-grid Liberian realities: no dependence on continuous LEC grid power or expensive commercial fuel generators ($5/gal diesel).',
        'Keep overall construction budget between $50 and $350 USD (or equivalent Liberian Dollars LRD) to prove village affordability, rural replicability, and local repairability by county artisans.',
        'Draft schematic blueprints, electrical circuit diagrams, and an itemized Bill of Materials (BOM) detailing local vendor prices.'
      ]
    },
    {
      stepNumber: 4,
      title: 'Prototype Construction & Field Calibration Trials',
      subtitle: 'Hands-On Workshop Fabrication & Quantitative Data Logging',
      details: [
        'Construct a physical, operational bench prototype under faculty safety supervision (using eye protection, insulated tools, and safe battery handling).',
        'Execute multiple calibration trials and record quantitative empirical data (e.g., liters of water purified per hour, percentage reduction in cassava moisture, solar battery charging runtime in hours).',
        'Document test trials through high-resolution photos and a 2–3 minute video demonstration of the prototype operating in real time in a Liberian community or school workshop.',
        'Gather structured testimonials and performance feedback from local farmers, clinic staff, or township residents who tested the working model.'
      ]
    },
    {
      stepNumber: 5,
      title: 'Proposal Submission & Grand Innovation Expo Defense',
      subtitle: 'National Portal Submission & Live Exhibition in Monrovia',
      details: [
        'Complete and submit the official Student Project Proposal via the YFC web portal before the October 30 deadline, attaching your methodology and BOM budget.',
        'County-level qualifying teams receive technical coaching and travel logistics support from Youth For Change Liberia.',
        'Present and demonstrate the physical working prototype live before a grand jury of Liberian engineers, university professors, and international partners at the EJS Ministerial Complex in Monrovia.'
      ]
    }
  ],
  submissionGuidelines: [
    'Official Liberian High School Enrollment: All student participants must be actively enrolled in Grades 9–12 at an accredited Liberian secondary school, verified with a principal endorsement letter.',
    'Physical Working Mechanism Mandatory: Proposals must demonstrate a physical device, electrical circuit, or chemical filtration mechanism solving an agriculture, WASH, or energy challenge. Pure theoretical literature without working hardware will be disqualified.',
    'Off-Grid & Appropriate Tech Constraint: Solutions must operate reliably without continuous LEC utility power or costly imported fuels, utilizing locally serviceable parts.',
    'Laboratory & Fabrication Safety Protocols: Student fabrication must be supervised by science faculty. Prohibited: hazardous industrial explosives, toxic unsealed chemicals, or open high-voltage currents (>50V AC) without circuit breakers.',
    'Affordable Fabrication Budget ($50 - $350 USD): Total material cost must remain within $50 to $350 USD (or equivalent LRD) to demonstrate viable rural adoption across Liberian villages.',
    'Original Student Work: Students must execute the fabrication, assembly, and wiring. Commercial machine-shop turnkey contracting is strictly disqualified.',
    'Advisor & School Contact: Submissions must include reachable mobile contact numbers (Orange Liberia or Lonestar MTN) and email for the teacher advisor and school administration.',
    '15 Counties Equitable Access: Teams from all 15 counties are judged with equal criteria, with dedicated logistics support provided for finalists traveling to Monrovia.'
  ],
  requiredDeliverables: [
    '1. Project Title & Liberian County Context (e.g., Solar-Assisted Cassava Root Dehydrator for Rural Bong County)',
    '2. Quantifiable Community Problem Statement (Target Liberian sector: Agro-tech, Clean Water WASH, or Rural Energy with local population impact)',
    '3. Scientific & Engineering Methodology (Step-by-step mechanical design, electrical circuitry, or chemical filtration principles)',
    '4. Itemized Bill of Materials (BOM) & Local Sourcing Budget (List of local scrap/recycled parts in USD or LRD with total cost within $50–$350)',
    '5. Empirical Testing Data & Performance Metrics (Measured operational throughput, filtration rate, drying time, or battery watt-hours generated)',
    '6. Prototype Visual Documentation (Clear photos of student fabrication and link to 1–3 min working demonstration video)',
    '7. Faculty Mentor & School Principal Endorsement (Official sign-off from accredited science teacher or school principal)'
  ],
  evaluationRubric: [
    {
      criterion: 'Relevance to Liberian Community Bottlenecks',
      weight: '25%',
      description: 'Direct practical impact solving an urgent challenge in Liberian agro-processing, clean water access, or off-grid renewable energy with measurable community benefits.'
    },
    {
      criterion: 'Scientific Rigor & Engineering Quality',
      weight: '25%',
      description: 'Sound application of STEM principles, robust structural fabrication, electrical safety, and inventive mechanical or chemical design.'
    },
    {
      criterion: 'Local Material Sourcing & Rural Affordability',
      weight: '20%',
      description: 'Ingenious reuse of local Liberian scrap, recyclable materials, and off-grid durability keeping total prototype construction cost under $350 USD.'
    },
    {
      criterion: 'Functional Performance & Empirical Trial Data',
      weight: '20%',
      description: 'Physical prototype operates live as demonstrated with documented trial data (filtration clarity, processing speed, drying efficiency, or wattage).'
    },
    {
      criterion: 'Student Team Ownership, Defense & Gender Inclusivity',
      weight: '10%',
      description: 'Student members articulate engineering choices with depth and confidence during oral defense, showcasing team collaboration and female leadership.'
    }
  ]
};

export const STEM_PROJECTS: StemProject[] = [
  {
    id: 'stem-01',
    title: 'Solar-Powered Cassava Peeler & Rotary Flash Dryer',
    school: 'Gboveh High School',
    county: 'Bong',
    category: 'Agriculture & Food Security',
    year: '2024/25',
    award: 'National Grand Champion (1st Place)',
    summary: 'A mechanized, solar-battery hybrid machine that peels, grates, and flash-dries cassava into high-grade gari in under 45 minutes, saving rural farmers 80% manual labor time.',
    problemStatement: 'In Bong and Nimba counties, post-harvest losses of raw cassava exceed 35% due to labor-intensive manual peeling and slow open-air drying during the 6-month rainy season.',
    solution: 'Engineered a dual-rotor drum powered by a 250W solar array and 12V recycled motor. The system features a heat-exchange convection chamber fueled by cassava peels and solar heat.',
    studentTeam: ['Korto B. Mulbah (Team Lead)', 'Emmanuel Z. Kollie', 'Hawa D. Flomo'],
    mentor: 'Eng. Patrick K. Tokpah (Cuttington University)',
    status: 'Award Winner',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'stem-02',
    title: 'Multi-Stage Moringa-Sand Rural Water Purification Unit',
    school: 'Carroll High School',
    county: 'Nimba',
    category: 'Clean Water & Sanitation',
    year: '2024/25',
    award: '1st Runner-Up (2nd Place)',
    summary: 'A zero-chemical water filtration station combining crushed Moringa Oleifera seeds (natural coagulant), activated coconut charcoal, and silica sand to purify creek water to WHO standards.',
    problemStatement: 'Over 60% of rural high school students in Nimba lack access to clean drinking water during school hours, leading to high absenteeism from water-borne illnesses.',
    solution: 'Designed an inverted gravity-fed column that coagulates suspended turbidity using Moringa seed powder, filters micro-particles through graded silica sand, and removes pathogens with UV-reflective solar disinfection tubes.',
    studentTeam: ['Alphonso T. Gaye', 'Blessing S. Wonbenny', 'Jeremiah K. Dahn'],
    mentor: 'Mr. Moses N. Gbarpea (Nimba County STEM Coordinator)',
    status: 'Field Tested',
    image: 'https://images.unsplash.com/photo-1574482620826-40685ca5ebd2?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'stem-03',
    title: 'SMS Early Flood Warning & Drainage Monitor for Coastal Slums',
    school: 'Monrovia College',
    county: 'Montserrado',
    category: 'Climate & Waste Management',
    year: '2024/25',
    award: 'Best Community Impact Award',
    summary: 'An ultrasonic water-level sensor array placed in vulnerable drainage canals (West Point, Clara Town) that sends automated early SMS warnings to community chairpersons before flash floods occur.',
    problemStatement: 'Unplanned urban settlements in Monrovia suffer catastrophic loss of property and cholera outbreaks every rainy season due to sudden unmonitored canal overflows.',
    solution: 'Built waterproof Arduino sensor nodes with GSM modules that monitor tidal rise and canal blockage levels in real-time, dispatching bulk SMS warnings when water exceeds 80% threshold.',
    studentTeam: ['Faith K. Johnson', 'Varney B. Taylor', 'Samuel O. Mensah'],
    mentor: 'Mrs. Cynthia Doe (Liberia Telecommunications Authority Mentor)',
    status: 'Active Implementation',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'stem-04',
    title: 'Palm-Kernel Shell Activated Carbon Biomass Briquettes',
    school: 'Booker Washington Institute (BWI)',
    county: 'Margibi',
    category: 'Renewable Energy',
    year: '2023',
    award: 'National STEM Champion 2023',
    summary: 'Smokeless, high-efficiency cooking briquettes manufactured from discarded palm-kernel husks and sawdust bound with cassava starch, providing an eco-friendly alternative to wood charcoal.',
    problemStatement: 'Charcoal production is the leading driver of deforestation in Margibi and Grand Bassa counties, while indoor smoke causes chronic respiratory illness for women and children.',
    solution: 'Constructed an airtight carbonization retort kiln that converts agricultural waste into dense, high-calorific briquettes that burn 40% longer and emit 85% less carbon monoxide.',
    studentTeam: ['Abraham S. Dukuly', 'Mariama C. Barry', 'Josephus F. Tarr'],
    mentor: 'Eng. Gabriel Harris (BWI Mechanical Dept)',
    status: 'Active Implementation',
    image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'stem-05',
    title: 'Solar Classroom-in-a-Box with Offline Digital Library',
    school: 'B.W. Harris Episcopal High School',
    county: 'Montserrado',
    category: 'Smart Education',
    year: '2023',
    award: 'Best Technology Innovation Award',
    summary: 'A portable, ruggedized Raspberry Pi micro-server powered by a 50W foldable solar panel that broadcasts a local Wi-Fi hotspot with over 10,000 STEM textbooks, video lectures, and Wikipedia offline.',
    problemStatement: 'Over 80% of secondary schools outside Monrovia have no internet connection or updated science textbooks, crippling students preparing for WASSCE exams.',
    solution: 'Configured an offline Rachel/Kiwix local education server capable of connecting up to 35 low-cost smartphones and tablets simultaneously without consuming cellular data or grid power.',
    studentTeam: ['Precious M. Dennis', 'George K. Cooper', 'Ruth V. Freeman'],
    mentor: 'Dr. Joseph G. Sneh (YFC Tech Advisor)',
    status: 'Prototype Validated',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'stem-06',
    title: 'Recycled Plastic Paver Tiles & Road Interlocks',
    school: 'Bassa High School',
    county: 'Grand Bassa',
    category: 'Climate & Waste Management',
    year: '2022',
    award: 'Grand Champion 2022',
    summary: 'Durable construction paving stones made by melting discarded plastic water sachets and blending them with beach sand in a 1:2 ratio, creating water-impermeable pavement.',
    problemStatement: 'Millions of single-use polyethylene water sachets litter Buchanan beaches and streets, blocking water channels and causing environmental degradation.',
    solution: 'Designed an enclosed low-emission melting chamber that turns single-use plastic into molten binder, mixed with sand and compacted into high-tensile strength interlocking pavement blocks.',
    studentTeam: ['T. Solomon Reeves', 'Grace E. Wisseh', 'David K. Bull'],
    mentor: 'Mr. Emmanuel B. Logan',
    status: 'Active Implementation',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=800&q=80'
  }
];

export const STEM_PREVIOUS_EDITIONS = [
  {
    year: '2024',
    theme: 'Clean Water & Agro-tech Solutions',
    championSchool: 'Gboveh High School (Bong County)',
    winningProject: 'Solar-Powered Cassava Peeler & Flash Dryer',
    schoolsCount: 42,
    highlights: 'Over 60 working prototypes displayed in the Monrovia City Hall pavilion, witnessed by representatives from the Ministry of Education and UN agencies.'
  },
  {
    year: '2023',
    theme: 'Renewable Energy & Biomass Innovation',
    championSchool: 'Booker Washington Institute (Margibi County)',
    winningProject: 'Palm-Kernel Activated Carbon Biomass Briquettes',
    schoolsCount: 36,
    highlights: 'Top 3 winning schools received full physics and chemistry lab overhaul kits funded by diaspora partners.'
  },
  {
    year: '2022',
    theme: 'Circular Economy & Slum Resilience',
    championSchool: 'Bassa High School (Grand Bassa County)',
    winningProject: 'Recycled Plastic Paving Interlocks',
    schoolsCount: 30,
    highlights: 'Students paved the front entrance walkway of their school using over 50,000 recycled water sachets.'
  },
  {
    year: '2021',
    theme: 'Health Tech & Post-Crisis Solutions',
    championSchool: "St. Patrick's High School (Montserrado)",
    winningProject: 'Automated Solar Foot-Pump Hand Sanitization Station',
    schoolsCount: 24,
    highlights: 'Inaugural edition of the National STEM Challenge, expanding Youth For Change Liberia from pure debate into integrated STEAM education.'
  }
];
