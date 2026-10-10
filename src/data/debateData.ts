import { DebateEdition } from '../types';
import { LNDC_OFFICIAL_WINNING_HISTORY } from './lndcWinningHistoryData';

export { LNDC_OFFICIAL_WINNING_HISTORY };

export const DEBATE_EDITIONS: Record<string, DebateEdition> = {
  '2015': {
    year: '2015',
    title: 'Inaugural National Debate Championship',
    tagline: 'Igniting the Flame of Critical Inquiry in Post-Ebola Liberia',
    theme: 'National Healing, Civic Consciousness, and Youth Agency',
    championSchool: 'Len Miller High School',
    championCounty: 'Montserrado',
    runnerUpSchool: 'St. Teresa Convent',
    runnerUpCounty: 'Montserrado',
    bestSpeaker: 'Len Miller Lead Debater',
    bestSpeakerSchool: 'Len Miller High School',
    totalSchools: 16,
    totalCounties: 3,
    finalMotion: 'This House believes that civic education should be made mandatory across all Liberian high schools.',
    finalScore: '5 - 2 (Split Panel Decision)',
    keyHighlights: [
      'Teams that made it to the Grand Final: Len Miller and St. Teresa Convent',
      'Champion: Len Miller (Len Miller High School)',
      '1st Runner-Up: St. Teresa Convent',
      'Inaugural National High School Debate Championship organized by Youth For Change Liberia'
    ],
    summary: 'In the 2015 Grand Final, Len Miller and St. Teresa Convent competed for the inaugural title, with Len Miller winning to become the first Champion of the Liberia National Debate Championship.',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80',
    semiFinalists: ['B.W. Harris Episcopal High', 'College of West Africa (CWA)'],
    notableMotions: [
      'THW prioritize technical vocational training over university arts degrees for national reconstruction.',
      'THB foreign aid has hindered economic self-sufficiency in Sub-Saharan Africa.',
      'THW ban single-use plastics to protect Liberia coastal ecosystems.'
    ]
  },
  '2016': {
    year: '2016',
    title: '2016 National Debate Championship',
    tagline: 'Expanding Regional Horizons & Broadening Public Discourse',
    theme: 'Democracy, Natural Resources, and Youth Civic Participation',
    championSchool: 'Bethesda Mission High School',
    championCounty: 'Montserrado',
    runnerUpSchool: 'Isaac A. Davis Memorial Academy',
    runnerUpCounty: 'Montserrado',
    bestSpeaker: 'Bethesda Lead Speaker',
    bestSpeakerSchool: 'Bethesda Mission High School',
    totalSchools: 24,
    totalCounties: 5,
    finalMotion: 'This House would renegotiate natural resource concession agreements to guarantee local community equity.',
    finalScore: '6 - 1 (Clear Majority)',
    keyHighlights: [
      'Teams that made it to the Grand Final: Bethesda Mission School vs. Isaac A. Davis Memorial Academy',
      'Champion: Bethesda Mission High School won',
      '1st Runner-Up: Isaac A. Davis Memorial Academy',
      'High-stakes clash between two of Montserrado County top academic institutions'
    ],
    summary: 'The 2016 Grand Final featured Bethesda Mission School vs. Isaac A. Davis Memorial Academy, with Bethesda Mission High School winning the championship title.',
    image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    semiFinalists: ["St. Patrick's High School", 'Bassa High School'],
    notableMotions: [
      'THW introduce quotas for youth and women in the National Legislature.',
      'THB decentralization is the single most urgent reform for Liberia post-war governance.',
      'THW restrict public officials from seeking medical care abroad.'
    ]
  },
  '2017': {
    year: '2017',
    title: '2017 National Debate Championship',
    tagline: 'The Central Liberia Surge & Electoral Literacy',
    theme: 'Democratic Transitions and Peaceful Elections in Africa',
    championSchool: 'Isaac A. Davis Memorial High School',
    championCounty: 'Montserrado',
    runnerUpSchool: 'Sammy Dukuly High School',
    runnerUpCounty: 'Montserrado',
    bestSpeaker: 'Isaac A. Davis Lead Orator',
    bestSpeakerSchool: 'Isaac A. Davis Memorial High School',
    totalSchools: 32,
    totalCounties: 7,
    finalMotion: 'This House believes that a peaceful democratic handover of power is the ultimate litmus test for Liberian stability.',
    finalScore: '4 - 3 (Thrilling Split Decision)',
    keyHighlights: [
      'Grand Final: Isaac A. Davis vs. Sammy Dukuly High School',
      'Champion: Isaac A. Davis Memorial High School won',
      '1st Runner-Up: Sammy Dukuly High School',
      'Isaac A. Davis clinched the national trophy following their 2016 runner-up performance'
    ],
    summary: 'The 2017 Grand Final saw Isaac A. Davis face Sammy Dukuly High School, with Isaac A. Davis Memorial High School winning to claim the national championship.',
    image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    semiFinalists: ['Gboveh High School (Bong)', 'J.J. Roberts United Methodist School'],
    notableMotions: [
      'THW establish an independent anti-corruption tribunal with prosecutorial authority.',
      'THW mandate that national budget allocations prioritize agriculture over mining.',
      'THB dual citizenship promotes diaspora investment and national development.'
    ]
  },
  '2018': {
    year: '2018',
    title: '2018 National Debate Championship',
    tagline: 'The Decade of Education & Technological Literacy',
    theme: 'Digital Innovation, Quality Education, and Rural Empowerment',
    championSchool: 'Paynesville Seventh-day Adventist (SDA)',
    championCounty: 'Montserrado',
    runnerUpSchool: 'J.J Roberts United Methodist',
    runnerUpCounty: 'Montserrado',
    bestSpeaker: 'Martin M. Forkpah (MVP) & Lisa B. Lomax (MES)',
    bestSpeakerSchool: 'Firestone Liberia High School / J.J. Roberts',
    totalSchools: 40,
    totalCounties: 9,
    finalMotion: 'This House would implement a national digital curriculum and solar-powered tablet program for all rural schools.',
    finalScore: '5 - 2',
    keyHighlights: [
      'Teams that made it to the Grand Finals: Paynesville Seventh-day Adventist (SDA) vs. J.J Roberts United Methodist',
      'Champion: Paynesville Seventh-day Adventist (SDA) won',
      'Tournament MVP: Martin M. Forkpah (Representing Firestone Liberia High School)',
      'Most Eloquent Speaker (MES): Lisa B. Lomax (Representing J.J. Roberts)'
    ],
    summary: 'In the 2018 Grand Finals, Paynesville Seventh-day Adventist (SDA) faced J.J Roberts United Methodist, with Paynesville Seventh-day Adventist (SDA) winning. Tournament MVP was Martin M. Forkpah (representing Firestone Liberia High School) and Most Eloquent Speaker (MES) was Lisa B. Lomax (representing J.J. Roberts).',
    image: 'https://images.unsplash.com/photo-1544531585-9847b68c8c86?auto=format&fit=crop&w=1200&q=80',
    semiFinalists: ['Firestone Liberia High School', 'Booker Washington Institute (BWI)'],
    notableMotions: [
      'THW subsidize domestic manufacturing to eliminate rice import dependency.',
      'THB social media does more harm than good to adolescent civic engagement.',
      'THW establish toll systems on major national highways to fund road maintenance.'
    ]
  },
  '2019': {
    year: '2019',
    title: '2019 National Debate Championship',
    tagline: 'Ten Counties, One Voice: The Grand National Expansion',
    theme: 'Fiscal Responsibility, Youth Employment, and Sustainable Forestry',
    championSchool: 'Bishop Juwle Catholic High School',
    championCounty: 'Grand Gedeh',
    runnerUpSchool: 'Paynesville SDA High School',
    runnerUpCounty: 'Montserrado',
    bestSpeaker: 'Bishop Juwle Lead Orator',
    bestSpeakerSchool: 'Bishop Juwle Catholic High School',
    totalSchools: 48,
    totalCounties: 10,
    finalMotion: 'This House would heavily tax raw timber exports and mandate 100% domestic wood processing.',
    finalScore: '6 - 1',
    keyHighlights: [
      'Team that made it to the Final: Grand Gedeh County (Represented by Bishop Juwle Catholic High School) vs. Paynesville SDA High School',
      'Champion: Bishop Juwle Catholic High School from Grand Gedeh Won',
      '1st Runner-Up: Paynesville SDA High School',
      'Historic first national championship trophy won by a school from Grand Gedeh County'
    ],
    summary: 'In the 2019 Final, Grand Gedeh County (represented by Bishop Juwle Catholic High School) took on Paynesville SDA High School, with Bishop Juwle Catholic High School from Grand Gedeh winning the national title.',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=80',
    semiFinalists: ['Cathedral Catholic High', 'Gboveh High (Bong)'],
    notableMotions: [
      'THW abolish all tuition fees at public universities across Liberia.',
      'THB climate change mitigation policies should take precedence over industrial mining expansion.',
      'THW introduce a sovereign wealth fund funded by maritime royalties.'
    ]
  },
  '2020': {
    year: '2020',
    title: '2020 National Debate Championship',
    tagline: 'The Resilience & County Forensics Edition',
    theme: 'Global Health Crises, Remote Learning, and Youth Innovation',
    championSchool: 'Ganta Methodist High School',
    championCounty: 'Nimba',
    runnerUpSchool: 'M. Nixon Garlo',
    runnerUpCounty: 'Grand Gedeh',
    bestSpeaker: 'Ganta Methodist Lead Speaker',
    bestSpeakerSchool: 'Ganta Methodist High School',
    totalSchools: 36,
    totalCounties: 8,
    finalMotion: 'This House believes that developing nations must invest in domestic pharmaceutical capacity over foreign vaccine reliance.',
    finalScore: '5 - 2',
    keyHighlights: [
      'Team that made it to the Grand Final: Nimba County (represented by Ganta Methodist High School) vs. Grand Gedeh County (Represented by M. Nixon Garlo)',
      'Champion: Ganta Methodist High School won',
      '1st Runner-Up: Grand Gedeh County (Represented by M. Nixon Garlo)',
      'Nimba County lifted their first historic National Debate Championship trophy'
    ],
    summary: 'In the 2020 Grand Final, Nimba County (represented by Ganta Methodist High School) faced Grand Gedeh County (represented by M. Nixon Garlo), with Ganta Methodist High School winning.',
    image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1200&q=80',
    semiFinalists: ['Monrovia College', 'Harbel High School (Margibi)'],
    notableMotions: [
      'THW waive patent protections on life-saving pandemic vaccines for developing economies.',
      'THB public health lockdowns should be subject to legislative emergency review.',
      'THW introduce radio-based STEM curricula across all 15 counties.'
    ]
  },
  '2021': {
    year: '2021',
    title: '2021 National Debate Championship',
    tagline: 'The Great Renaissance: Reigniting the Academic Spirit',
    theme: 'Economic Recovery, Green Energy Transition, and Climate Justice',
    championSchool: 'Cutting University High School',
    championCounty: 'Bong',
    runnerUpSchool: 'Ganta Methodist High School',
    runnerUpCounty: 'Nimba',
    bestSpeaker: 'Cutting University Lead Speaker',
    bestSpeakerSchool: 'Cutting University High School',
    totalSchools: 52,
    totalCounties: 12,
    finalMotion: 'This House would prioritize solar and mini-hydro grid investments over expanding fossil-fuel power plants in rural counties.',
    finalScore: '5 - 2',
    keyHighlights: [
      'Team that made it to the Finals: Nimba County (Represented by Ganta Methodist High School) vs. Bong County (Represented by Cutting University High School)',
      'Champion: Cutting University High School (Represented by Bong County), Won',
      '1st Runner-Up: Nimba County (Represented by Ganta Methodist High School)',
      'Bong County secured its first national debate title behind Cutting University High School'
    ],
    summary: 'In the 2021 Finals, Nimba County (represented by Ganta Methodist High School) competed against Bong County (represented by Cutting University High School), with Cutting University High School (represented by Bong County) winning.',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    semiFinalists: ['Booker Washington Institute (BWI)', 'Tubman High School'],
    notableMotions: [
      'THW mandate that commercial concessions allocate 15% of net profit to county development funds.',
      'THB ecotourism in Sapo National Park can out-earn industrial logging.',
      'THW establish a national youth apprenticeship scheme for green construction.'
    ]
  },
  '2022': {
    year: '2022',
    title: '2022 National Debate Championship',
    tagline: 'The Bicentennial National Debate Summit',
    theme: '200 Years of Nationhood: Legacy, Governance, and Future Trajectories',
    championSchool: 'Ganta United Methodist School (GUMS)',
    championCounty: 'Nimba',
    runnerUpSchool: 'College of West Africa-CWA',
    runnerUpCounty: 'Montserrado',
    bestSpeaker: 'GUMS Lead Debater',
    bestSpeakerSchool: 'Ganta United Methodist School (GUMS)',
    totalSchools: 64,
    totalCounties: 14,
    finalMotion: 'This House believes that constitutional amendments establishing single-term presidencies would accelerate African governance reforms.',
    finalScore: '4 - 3',
    keyHighlights: [
      'Team that made it to the final: Nimba County (Represented by Ganta United Methodist School GUMS) vs. Montserrado County (Represented by College of West Africa-CWA)',
      'Champion: Ganta United Methodist School (GUMS) won',
      '1st Runner-Up: Montserrado County (Represented by College of West Africa-CWA)',
      'GUMS secured their second national debate title in three years for Nimba County'
    ],
    summary: 'In the 2022 Final, Nimba County (represented by Ganta United Methodist School GUMS) went up against Montserrado County (represented by College of West Africa-CWA), with Ganta United Methodist School (GUMS) winning.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    semiFinalists: ['B.W. Harris Episcopal', 'Pleebo High School (Maryland)'],
    notableMotions: [
      'THW establish a War and Economic Crimes Court in Liberia.',
      'THB rapid urbanization threatens national food security unless agriculture is subsidized.',
      'THW peg the Liberian Dollar entirely to a basket of mineral commodities.'
    ]
  },
  '2023': {
    year: '2023',
    title: '2023 National Debate Championship',
    tagline: 'Decade of Impact: Championing Inclusivity & Youth Leadership',
    theme: 'AI, Global Trade, and Sustainable African Industrialization',
    championSchool: 'United Dawah Ummah High School',
    championCounty: 'Montserrado',
    runnerUpSchool: 'Ganta United Methodist High School',
    runnerUpCounty: 'Nimba',
    bestSpeaker: 'United Dawah Lead Orator',
    bestSpeakerSchool: 'United Dawah Ummah High School',
    totalSchools: 72,
    totalCounties: 15,
    finalMotion: 'This House would establish a sovereign artificial intelligence research and digital computing center for West African secondary education.',
    finalScore: '6 - 1',
    keyHighlights: [
      'Team that made it to the final: Montserrado County (Represented by United Dawah Ummah High School) vs. Ganta United Methodist High School',
      'Champion: United Dawah Ummah High School won',
      '1st Runner-Up: Ganta United Methodist High School',
      'Ganta United Methodist High School achieved a record fourth consecutive Grand Final appearance (2020-2023)'
    ],
    summary: 'In the 2023 Final, Montserrado County (represented by United Dawah Ummah High School) met Ganta United Methodist High School, with United Dawah Ummah High School winning the national championship.',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    semiFinalists: ['Gboveh High (Bong)', 'J.J. Roberts United Methodist School'],
    notableMotions: [
      'THW ban unregulated artisanal gold mining in forest reserves.',
      'THB the African Continental Free Trade Area (AfCFTA) will benefit smallholder farmers more than large corporations.',
      'THW mandate gender parity on all public board appointments.'
    ]
  },
  '2024-25': {
    year: '2024/25',
    title: '2024/25 National Debate Championship (Current Flagship)',
    tagline: 'The Grand National Jubilee: 15 Counties, 80 Schools, One Crown',
    theme: 'Climate Resilience, Economic Sovereignty, and AI in Developing Nations',
    championSchool: 'B.W. Harris Episcopal High School',
    championCounty: 'Montserrado',
    runnerUpSchool: 'Booker Washington Institute (BWI)',
    runnerUpCounty: 'Margibi',
    bestSpeaker: 'Keziah M. Freeman',
    bestSpeakerSchool: 'B.W. Harris Episcopal High School',
    totalSchools: 80,
    totalCounties: 15,
    finalMotion: 'This House believes that developing nations should leverage carbon credit sovereign bonds to finance public infrastructure rather than traditional concession loans.',
    finalScore: '5 - 2',
    keyHighlights: [
      'Largest tournament in West African high school debate history with 80 registered schools',
      'National Finals broadcast live across 5 major television & radio networks',
      'Introduced the AI-Assisted Research and Fact-Checking Adjudication Dashboard',
      'Full scholarship awards granted to all 6 Grand Finalists by corporate and diaspora sponsors'
    ],
    summary: 'The 2024/25 Championship witnessed breathtaking eloquence, sharp rebuttals, and deep policy insights as B.W. Harris captured their second national title in an exhilarating clash with BWI.',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
    semiFinalists: ['Carroll High School (Nimba)', 'Cuttington Campus High School (Bong)'],
    notableMotions: [
      'THW make public asset declaration legally enforceable with criminal forfeiture for non-compliance.',
      'THB regional integration of West African energy grids will accelerate renewable transition faster than national programs.',
      'THW allocate 20% of mining revenues directly into county youth technology and incubation funds.'
    ]
  },
  'future': {
    year: 'Future',
    title: '2026 & Beyond: The Vision for Pan-African Debate Excellence',
    tagline: 'Expanding to the Mano River Union and All-African High School Debates',
    theme: 'Youth-Led Continental Renaissance, Climate Action, and Tech Empowerment',
    championSchool: 'Future Champions League',
    championCounty: 'All 15 Counties + Mano River Union',
    runnerUpSchool: 'Incoming Contenders',
    runnerUpCounty: 'Regional Hubs',
    bestSpeaker: 'Next Generation Leader',
    bestSpeakerSchool: 'Liberian High School Network',
    totalSchools: 120,
    totalCounties: 15,
    finalMotion: 'This House would establish a Mano River Union Free Movement & Unified Academic Accreditation Protocol.',
    finalScore: 'Projected Expansion',
    keyHighlights: [
      'Expanding to invite high schools from Sierra Leone, Guinea, and Côte d’Ivoire for the Mano River Youth Debate Cup',
      'Construction of the Permanent Youth For Change Liberia Leadership & Debate Academy in Monrovia',
      'Establishment of county debate resource centers equipped with high-speed internet and research libraries',
      'Annual $50,000 university scholarship endowment fund for top debaters and STEM innovators'
    ],
    summary: 'Youth For Change Liberia is mapping an ambitious 5-year strategic blueprint to make debate and STEM competitions accessible in every single secondary school district across Liberia.',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    semiFinalists: ['15 County Regional Qualifiers', 'Mano River Union Invitationals'],
    notableMotions: [
      'THW create an ECOWAS common youth passport to stimulate intra-regional student entrepreneurship.',
      'THB digital literacy is as fundamental a human right as clean water.',
      'THW create dedicated parliamentary youth seats for high school alumni leaders.'
    ]
  }
};

export const SAMPLE_MOTIONS_BY_CATEGORY = [
  {
    category: 'Governance & Constitution',
    motions: [
      'This House would mandate public disclosure of all natural resource concession contracts prior to parliamentary ratification.',
      'This House would establish an independent youth advisory council with statutory veto power over education budgets.',
      'This House believes that term limits for legislators strengthen democratic renewal.'
    ]
  },
  {
    category: 'Economy & Natural Resources',
    motions: [
      'This House would ban the export of unrefined iron ore and rubber to stimulate domestic manufacturing.',
      'This House would establish a national sovereign wealth fund backed by gold and maritime revenue.',
      'This House would subsidize indigenous agricultural cooperatives over multinational agribusiness concessions.'
    ]
  },
  {
    category: 'Climate, Energy & Environment',
    motions: [
      'This House would impose strict moratoria on logging in virgin rainforest reserves.',
      'This House would redirect 30% of petroleum exploration taxes to solar electrification in rural secondary schools.',
      'This House believes that developing nations should demand mandatory climate reparations from industrialized countries.'
    ]
  },
  {
    category: 'Education & Technology',
    motions: [
      'This House would integrate artificial intelligence and programming into national high school curricula.',
      'This House would abolish standardized exit examinations in favor of comprehensive continuous portfolio assessments.',
      'This House would guarantee free high-speed internet in every public secondary school across Liberia.'
    ]
  }
];

export const DEBATE_RULES = [
  {
    title: 'World Schools Debate Format',
    desc: 'Contested between Proposition (Government) and Opposition. Each team fields 3 active speakers (1st Speaker, 2nd Speaker, 3rd Speaker/Whip) plus registered squad alternates.'
  },
  {
    title: 'Speaking Times & Speeches',
    desc: 'Substantive Speeches: 6-8 minutes each (Prop 1, Opp 1, Prop 2, Opp 2, Prop 3, Opp 3). Points of Information (POIs): Permitted during unprotected time (between minute 1 and minute 5/7). Reply Speeches: 3-4 minutes (Opposition replies first, then Proposition).'
  },
  {
    title: 'Official WSDC Scoring Rubric',
    desc: 'Substantive speeches scored out of 100 points: Content / Matter (Evidence, Research & Logic - 40%), Style / Manner (Delivery, Persuasion & Rhetoric - 40%), Strategy / Method (Structure, Role Fulfillment & POI Handling - 20%). Reply speeches scored out of 50 points.'
  },
  {
    title: 'Code of Ethics & POI Etiquette',
    desc: 'Points of Information must be concise (under 15s) and offered with dignity. Zero tolerance for fabricated evidence, ad hominem attacks, or derogatory speech. Respect for fellow debaters, adjudicators, and audience is mandatory.'
  }
];
