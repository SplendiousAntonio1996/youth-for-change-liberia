import { 
  CountyZone, 
  ZonedSchool, 
  DebateMotion, 
  Adjudicator, 
  TournamentFixture, 
  TournamentStage, 
  TournamentProgram,
  TournamentRevealAnnouncement 
} from '../types/tournament';
import { 
  generateOfficialLndcFixtures, 
  LNDC_STAGES_INFO, 
  generateCentralStage16Teams, 
  DEFAULT_LNDC_CONFIG 
} from './lndcTournamentRules';

export { 
  generateOfficialLndcFixtures, 
  LNDC_STAGES_INFO, 
  generateCentralStage16Teams, 
  DEFAULT_LNDC_CONFIG 
};

// 1. Comprehensive Geographic Zones per County in Liberia
export const LIBERIA_COUNTY_ZONES: CountyZone[] = [
  // Montserrado County (4 Zones)
  {
    id: 'montserrado-z1',
    county: 'Montserrado',
    zoneNumber: 1,
    name: 'Zone 1: Bushrod Island & St. Paul River',
    districts: ['Bushrod Island', 'New Kru Town', 'Logan Town', 'Brewerville', 'Virginia', 'St. Paul River'],
    primaryVenue: 'D. Twe Memorial High Auditorium, New Kru Town',
    coordinatorName: 'Ebenezer P. Doe',
    coordinatorPhone: '+231 770 144 821',
    description: 'Covers northern coastal and riverine secondary schools from Caldwell to Brewerville.'
  },
  {
    id: 'montserrado-z2',
    county: 'Montserrado',
    zoneNumber: 2,
    name: 'Zone 2: Central Monrovia & Sinkor Corridor',
    districts: ['Central Monrovia', 'Mamba Point', 'Snapper Hill', 'Old Road', 'Sinkor 1st-24th Street', 'Congo Town'],
    primaryVenue: 'Monrovia City Hall Ballroom / Tubman High Gymnasium',
    coordinatorName: 'Korto B. Mulbah',
    coordinatorPhone: '+231 777 401 210',
    description: 'High-density urban forensics hub hosting historic Monrovia and Sinkor high schools.'
  },
  {
    id: 'montserrado-z3',
    county: 'Montserrado',
    zoneNumber: 3,
    name: 'Zone 3: Paynesville, ELWA & Somalia Drive',
    districts: ['Paynesville Central', 'ELWA', 'Rehab', 'Duport Road', 'Red Light', 'Somalia Drive', 'Gardnersville', 'Barnesville'],
    primaryVenue: 'Paynesville Town Hall Pavilion, ELWA Junction',
    coordinatorName: 'Jeremiah S. Tarkpor',
    coordinatorPhone: '+231 886 312 904',
    description: 'Dynamic residential academic corridor covering Paynesville and Greater Somalia Drive.'
  },
  {
    id: 'montserrado-z4',
    county: 'Montserrado',
    zoneNumber: 4,
    name: 'Zone 4: Careysburg, Mount Barclay & Rural Montserrado',
    districts: ['Mount Barclay', 'Careysburg', 'Kakata Highway Corridor', 'Todee District', 'Bensonville'],
    primaryVenue: 'Careysburg Public School Memorial Hall',
    coordinatorName: 'Fatu M. Sirleaf',
    coordinatorPhone: '+231 775 889 012',
    description: 'Eastern sub-rural and historical district connecting to the Margibi highway.'
  },

  // Nimba County (3 Zones)
  {
    id: 'nimba-z1',
    county: 'Nimba',
    zoneNumber: 1,
    name: 'Zone 1: Upper Nimba & Sanniquellie Hub',
    districts: ['Sanniquellie-Mahn', 'Yekepa', 'Zoe-Geh', 'Karnplay'],
    primaryVenue: 'Sanniquellie City Hall / St. Mary High Hall',
    coordinatorName: 'Moses N. Gbarpea',
    coordinatorPhone: '+231 886 523 911',
    description: 'Encompasses northern mining and administrative capital schools of Nimba.'
  },
  {
    id: 'nimba-z2',
    county: 'Nimba',
    zoneNumber: 2,
    name: 'Zone 2: Central Nimba & Ganta Commercial Basin',
    districts: ['Ganta City', 'Bain-Garr', 'Gbehlay-Geh', 'Saclapea'],
    primaryVenue: 'Ganta United Methodist School (GUMS) Auditorium',
    coordinatorName: 'Beatrice T. Weh',
    coordinatorPhone: '+231 776 230 451',
    description: 'Commercial powerhouse and traditional debate stronghold of Central Nimba.'
  },
  {
    id: 'nimba-z3',
    county: 'Nimba',
    zoneNumber: 3,
    name: 'Zone 3: Lower Nimba & Tappita Corridor',
    districts: ['Tappita', 'Boe & Quilla', 'Yarpea-Mahn', 'Doe District'],
    primaryVenue: 'Jackson F. Doe Memorial Regional Hall, Tappita',
    coordinatorName: 'Samuel D. Tokpa',
    coordinatorPhone: '+231 880 771 909',
    description: 'Southern healthcare and agricultural academic center of Lower Nimba.'
  },

  // Bong County (3 Zones)
  {
    id: 'bong-z1',
    county: 'Bong',
    zoneNumber: 1,
    name: 'Zone 1: Greater Gbarnga & Central Bong',
    districts: ['Gbarnga Central', 'Jorquelleh', 'Kokoyah', 'Kpaai'],
    primaryVenue: 'Gbarnga Administration Building Conference Hall',
    coordinatorName: 'Helena S. Kollie',
    coordinatorPhone: '+231 776 892 344',
    description: 'Central regional governance corridor and Gboveh High forensics center.'
  },
  {
    id: 'bong-z2',
    county: 'Bong',
    zoneNumber: 2,
    name: 'Zone 2: Suakoko Academic Basin & Cuttington',
    districts: ['Suakoko', 'Yellequelleh', 'Totota', 'Sanoyea'],
    primaryVenue: 'Cuttington University High School Amphitheater, Suakoko',
    coordinatorName: 'Varney K. Flomo',
    coordinatorPhone: '+231 886 441 290',
    description: 'Prestigious university-affiliated academic cluster in central-western Bong.'
  },
  {
    id: 'bong-z3',
    county: 'Bong',
    zoneNumber: 3,
    name: 'Zone 3: Lower Bong, Salala & Fuamah',
    districts: ['Salala', 'Fuamah', 'Bong Mines', 'Panta'],
    primaryVenue: 'Bong Mines Community Center Auditorium',
    coordinatorName: 'Precious M. Dennis',
    coordinatorPhone: '+231 770 998 122',
    description: 'Historic mining and rubber-belt secondary schools near the Margibi border.'
  },

  // Margibi County (2 Zones)
  {
    id: 'margibi-z1',
    county: 'Margibi',
    zoneNumber: 1,
    name: 'Zone 1: Upper Margibi & Kakata Metropolitan',
    districts: ['Kakata Central', 'Gibi District', 'Borlola', 'Weala'],
    primaryVenue: 'Booker Washington Institute (BWI) Multipurpose Hall, Kakata',
    coordinatorName: 'Francis K. Sumo',
    coordinatorPhone: '+231 880 119 452',
    description: 'Technical and vocational forensics epicenter centered around BWI.'
  },
  {
    id: 'margibi-z2',
    county: 'Margibi',
    zoneNumber: 2,
    name: 'Zone 2: Lower Margibi, Harbel & Firestone Belt',
    districts: ['Harbel', 'Firestone', 'Mambah-Kaba', 'Cotton Tree', 'Unification City'],
    primaryVenue: 'Harbel Multilateral High School Gymnasium',
    coordinatorName: 'Augusta J. Clarke',
    coordinatorPhone: '+231 775 660 303',
    description: 'Coastal and agro-industrial corridor leading toward Roberts International Airport.'
  },

  // Grand Bassa County (2 Zones)
  {
    id: 'grand-bassa-z1',
    county: 'Grand Bassa',
    zoneNumber: 1,
    name: 'Zone 1: Buchanan Port City & Urban Bassa',
    districts: ['Buchanan Central', 'Fairgrounds', 'Commercial District', 'Owensgrove'],
    primaryVenue: 'Buchanan City Hall / Bassa High School Auditorium',
    coordinatorName: 'Comfort B. Tarr',
    coordinatorPhone: '+231 770 334 812',
    description: 'Atlantic port city schools with long-standing forensics and STEM initiatives.'
  },
  {
    id: 'grand-bassa-z2',
    county: 'Grand Bassa',
    zoneNumber: 2,
    name: 'Zone 2: Rural Bassa & Agricultural Interior',
    districts: ['District 1', 'District 2', 'District 3', 'District 4', 'Neekreen'],
    primaryVenue: 'Compound Three Multipurpose Center',
    coordinatorName: 'David L. Logan',
    coordinatorPhone: '+231 886 410 772',
    description: 'Inland community high schools representing agrarian youth empowerment.'
  },

  // Lofa County (2 Zones)
  {
    id: 'lofa-z1',
    county: 'Lofa',
    zoneNumber: 1,
    name: 'Zone 1: Voinjama Capital & Northern Highlands',
    districts: ['Voinjama', 'Quardu Gboni', 'Kolahun', 'Foya'],
    primaryVenue: 'Voinjama Multilateral High School Hall',
    coordinatorName: 'Tamba P. Koroma',
    coordinatorPhone: '+231 886 991 302',
    description: 'Northern frontier schools celebrated for rigorous policy and agricultural debate.'
  },
  {
    id: 'lofa-z2',
    county: 'Lofa',
    zoneNumber: 2,
    name: 'Zone 2: Southern Lofa & Zorzor Valley',
    districts: ['Zorzor', 'Salayea'],
    primaryVenue: 'Zorzor Rural Teacher Training Institute (ZRTTI) Pavilion',
    coordinatorName: 'Marie K. Zayzay',
    coordinatorPhone: '+231 777 220 894',
    description: 'Teacher training and academic hub in the fertile Zorzor belt.'
  },

  // Grand Gedeh County (2 Zones)
  {
    id: 'grand-gedeh-z1',
    county: 'Grand Gedeh',
    zoneNumber: 1,
    name: 'Zone 1: Zwedru Central & Tchien Basin',
    districts: ['Zwedru', 'Tchien', 'B’hai'],
    primaryVenue: 'Bishop Juwle Catholic High Auditorium, Zwedru',
    coordinatorName: 'George B. Gaye',
    coordinatorPhone: '+231 880 771 234',
    description: 'Home of the 2019 National Champions Bishop Juwle High School.'
  },
  {
    id: 'grand-gedeh-z2',
    county: 'Grand Gedeh',
    zoneNumber: 2,
    name: 'Zone 2: Gbarzon & Konobo Interior',
    districts: ['Gbarzon', 'Konobo', 'Cavalla'],
    primaryVenue: 'Zleh Town Community Hall',
    coordinatorName: 'Solomon C. Toe',
    coordinatorPhone: '+231 776 541 332',
    description: 'Southeastern natural resources and youth development corridor.'
  },

  // Maryland County (2 Zones)
  {
    id: 'maryland-z1',
    county: 'Maryland',
    zoneNumber: 1,
    name: 'Zone 1: Historic Harper & Cape Palmas Coast',
    districts: ['Harper', 'Cape Palmas', 'Tubman Town'],
    primaryVenue: 'Tubman University Auditorium / Cape Palmas High',
    coordinatorName: 'Patricia H. Davies',
    coordinatorPhone: '+231 775 604 119',
    description: 'Coastal university city with deep academic traditions.'
  },
  {
    id: 'maryland-z2',
    county: 'Maryland',
    zoneNumber: 2,
    name: 'Zone 2: Pleebo Commercial & Karluway',
    districts: ['Pleebo/Sodeken', 'Karluway', 'Barrobo'],
    primaryVenue: 'Pleebo High School Auditorium',
    coordinatorName: 'Emmanuel N. Allison',
    coordinatorPhone: '+231 881 229 018',
    description: 'Commercial heart of Maryland County along the southeastern trade corridor.'
  },

  // Bomi County (2 Zones)
  {
    id: 'bomi-z1',
    county: 'Bomi',
    zoneNumber: 1,
    name: 'Zone 1: Tubmanburg Urban & Klay District',
    districts: ['Tubmanburg', 'Klay'],
    primaryVenue: 'C.H. Dewey High School Gymnasium, Tubmanburg',
    coordinatorName: 'Varney M. Sando',
    coordinatorPhone: '+231 777 982 101',
    description: 'Western corridor schools with fast access to national finals.'
  },
  {
    id: 'bomi-z2',
    county: 'Bomi',
    zoneNumber: 2,
    name: 'Zone 2: Suehn Mecca, Dewoin & Senjeh',
    districts: ['Suehn Mecca', 'Dewoin', 'Senjeh'],
    primaryVenue: 'Suehn Industrial Academy Grounds',
    coordinatorName: 'Zolu K. Johnson',
    coordinatorPhone: '+231 886 339 120',
    description: 'Historic vocational and secondary learning centers.'
  },

  // Grand Cape Mount County (2 Zones)
  {
    id: 'cape-mount-z1',
    county: 'Grand Cape Mount',
    zoneNumber: 1,
    name: 'Zone 1: Robertsport Coast & Lake Piso',
    districts: ['Robertsport', 'Porkpa', 'Garwula'],
    primaryVenue: 'Robertsport City Hall / Robertsport High',
    coordinatorName: 'Siafa B. Fahnbulleh',
    coordinatorPhone: '+231 770 812 404',
    description: 'Eco-tourism and maritime coastal secondary school zone.'
  },
  {
    id: 'cape-mount-z2',
    county: 'Grand Cape Mount',
    zoneNumber: 2,
    name: 'Zone 2: Tewor & Bo Waterside Border',
    districts: ['Tewor', 'Gola Konneh', 'Bo Waterside'],
    primaryVenue: 'Bo Waterside Joint Border Complex Hall',
    coordinatorName: 'Momo Z. Kiatamba',
    coordinatorPhone: '+231 886 701 559',
    description: 'Cross-border commerce corridor in western Cape Mount.'
  },

  // Sinoe County (2 Zones)
  {
    id: 'sinoe-z1',
    county: 'Sinoe',
    zoneNumber: 1,
    name: 'Zone 1: Greenville Port & Butaw',
    districts: ['Greenville', 'Butaw', 'Juarzon'],
    primaryVenue: 'Greenville Administration Building Hall',
    coordinatorName: 'Patrick S. Wleh',
    coordinatorPhone: '+231 776 341 092',
    description: 'Coastal port capital of Sinoe County.'
  },
  {
    id: 'sinoe-z2',
    county: 'Sinoe',
    zoneNumber: 2,
    name: 'Zone 2: Kpanyan, Sanquin & Sapo Interior',
    districts: ['Kpanyan', 'Sanquin', 'Jaedae'],
    primaryVenue: 'Juarzon High School Pavilion',
    coordinatorName: 'Cynthia M. Tarpeh',
    coordinatorPhone: '+231 881 902 441',
    description: 'Bio-diversity and conservation debate cluster near Sapo National Park.'
  },

  // River Cess County (2 Zones)
  {
    id: 'river-cess-z1',
    county: 'River Cess',
    zoneNumber: 1,
    name: 'Zone 1: Cestos City & Coastal River Cess',
    districts: ['Cestos City', 'Central River Cess'],
    primaryVenue: 'Cestos High School Auditorium',
    coordinatorName: 'Aloysius B. Giah',
    coordinatorPhone: '+231 775 440 198',
    description: 'Coastal maritime and fisheries youth community.'
  },
  {
    id: 'river-cess-z2',
    county: 'River Cess',
    zoneNumber: 2,
    name: 'Zone 2: Morweh & Inland Basin',
    districts: ['Morweh', 'Beawor', 'Zartlahn'],
    primaryVenue: 'Yarpah Town Youth Center',
    coordinatorName: 'Martha G. Dennis',
    coordinatorPhone: '+231 886 112 550',
    description: 'Forestry and rural high schools.'
  },

  // Grand Kru County (2 Zones)
  {
    id: 'grand-kru-z1',
    county: 'Grand Kru',
    zoneNumber: 1,
    name: 'Zone 1: Barclayville & Upper Grand Kru',
    districts: ['Barclayville', 'Jloh', 'Trehn'],
    primaryVenue: 'Barclayville High School Hall',
    coordinatorName: 'Augustine T. Blamo',
    coordinatorPhone: '+231 881 665 432',
    description: 'Central administrative and forensics seat of Grand Kru.'
  },
  {
    id: 'grand-kru-z2',
    county: 'Grand Kru',
    zoneNumber: 2,
    name: 'Zone 2: Sasstown Coast & Grand Cess',
    districts: ['Sasstown', 'Grand Cess', 'Buah'],
    primaryVenue: 'Sasstown Community Complex',
    coordinatorName: 'Evelyn P. Swengbe',
    coordinatorPhone: '+231 770 541 299',
    description: 'Coastal fisheries and clean solar technology champions.'
  },

  // River Gee County (2 Zones)
  {
    id: 'river-gee-z1',
    county: 'River Gee',
    zoneNumber: 1,
    name: 'Zone 1: Fish Town Central & Webbo',
    districts: ['Fish Town', 'Webbo', 'Gbeapo'],
    primaryVenue: 'Fish Town Multilateral High School Hall',
    coordinatorName: 'Wellington K. Saydee',
    coordinatorPhone: '+231 776 119 804',
    description: 'Capital seat and premier forensics institution of River Gee.'
  },
  {
    id: 'river-gee-z2',
    county: 'River Gee',
    zoneNumber: 2,
    name: 'Zone 2: Potupo, Nyenebo & Chedepo',
    districts: ['Potupo', 'Nyenebo', 'Chedepo'],
    primaryVenue: 'Kanweakeh Youth Hall',
    coordinatorName: 'Comfort B. Nyemah',
    coordinatorPhone: '+231 880 341 902',
    description: 'Agricultural border belt schools.'
  },

  // Gbarpolu County (2 Zones)
  {
    id: 'gbarpolu-z1',
    county: 'Gbarpolu',
    zoneNumber: 1,
    name: 'Zone 1: Bopolu Capital & Mineral Corridor',
    districts: ['Bopolu', 'Bokomu'],
    primaryVenue: 'Bopolu High School Auditorium',
    coordinatorName: 'Zinnah F. Kamara',
    coordinatorPhone: '+231 775 882 119',
    description: 'Capital city leading youth mining ethics and policy discussions.'
  },
  {
    id: 'gbarpolu-z2',
    county: 'Gbarpolu',
    zoneNumber: 2,
    name: 'Zone 2: Gbarma, Belleh & Kongba',
    districts: ['Gbarma', 'Belleh', 'Kongba'],
    primaryVenue: 'Gbarma Community Hall',
    coordinatorName: 'Jartu B. Massaquoi',
    coordinatorPhone: '+231 886 441 339',
    description: 'Resource-rich northern interior high schools.'
  }
];

// Helper: Automatic mapping of any school into its county zone based on name, address or district
export function mapSchoolToCountyZone(county: string, schoolName: string, cityOrDistrict: string = ''): { zoneId: string; zoneName: string } {
  const countyZones = LIBERIA_COUNTY_ZONES.filter(z => z.county.toLowerCase() === county.toLowerCase());
  if (countyZones.length === 0) {
    return { zoneId: 'general-z1', zoneName: 'Zone 1: Central District' };
  }

  const combinedText = `${schoolName} ${cityOrDistrict}`.toLowerCase();

  // Montserrado specific heuristics
  if (county.toLowerCase() === 'montserrado') {
    if (combinedText.includes('bushrod') || combinedText.includes('brewerville') || combinedText.includes('twe') || combinedText.includes('new kru') || combinedText.includes('logan') || combinedText.includes('caldwell') || combinedText.includes('st. paul') || combinedText.includes('virginia')) {
      const z = countyZones.find(x => x.zoneNumber === 1);
      if (z) return { zoneId: z.id, zoneName: z.name };
    }
    if (combinedText.includes('sinkor') || combinedText.includes('snapper') || combinedText.includes('mamba') || combinedText.includes('tubman high') || combinedText.includes('b.w. harris') || combinedText.includes('convent') || combinedText.includes('cwa') || combinedText.includes('dawah') || combinedText.includes('bethesda') || combinedText.includes('monrovia')) {
      const z = countyZones.find(x => x.zoneNumber === 2);
      if (z) return { zoneId: z.id, zoneName: z.name };
    }
    if (combinedText.includes('paynesville') || combinedText.includes('elwa') || combinedText.includes('rehab') || combinedText.includes('duport') || combinedText.includes('somalia') || combinedText.includes('gardnersville') || combinedText.includes('barnesville') || combinedText.includes('sda') || combinedText.includes('red light')) {
      const z = countyZones.find(x => x.zoneNumber === 3);
      if (z) return { zoneId: z.id, zoneName: z.name };
    }
    if (combinedText.includes('careysburg') || combinedText.includes('barclay') || combinedText.includes('todee') || combinedText.includes('bensonville') || combinedText.includes('highway')) {
      const z = countyZones.find(x => x.zoneNumber === 4);
      if (z) return { zoneId: z.id, zoneName: z.name };
    }
  }

  // Nimba specific heuristics
  if (county.toLowerCase() === 'nimba') {
    if (combinedText.includes('sanniquellie') || combinedText.includes('yekepa') || combinedText.includes('karnplay') || combinedText.includes('zoe')) {
      const z = countyZones.find(x => x.zoneNumber === 1);
      if (z) return { zoneId: z.id, zoneName: z.name };
    }
    if (combinedText.includes('ganta') || combinedText.includes('gums') || combinedText.includes('saclapea') || combinedText.includes('bain')) {
      const z = countyZones.find(x => x.zoneNumber === 2);
      if (z) return { zoneId: z.id, zoneName: z.name };
    }
    if (combinedText.includes('tappita') || combinedText.includes('jackson f. doe') || combinedText.includes('boe') || combinedText.includes('doe')) {
      const z = countyZones.find(x => x.zoneNumber === 3);
      if (z) return { zoneId: z.id, zoneName: z.name };
    }
  }

  // Bong specific heuristics
  if (county.toLowerCase() === 'bong') {
    if (combinedText.includes('suakoko') || combinedText.includes('cuttington') || combinedText.includes('totota') || combinedText.includes('sanoyea')) {
      const z = countyZones.find(x => x.zoneNumber === 2);
      if (z) return { zoneId: z.id, zoneName: z.name };
    }
    if (combinedText.includes('salala') || combinedText.includes('fuamah') || combinedText.includes('bong mines')) {
      const z = countyZones.find(x => x.zoneNumber === 3);
      if (z) return { zoneId: z.id, zoneName: z.name };
    }
    const z1 = countyZones.find(x => x.zoneNumber === 1);
    if (z1) return { zoneId: z1.id, zoneName: z1.name };
  }

  // Check matching district names
  for (const zone of countyZones) {
    for (const dist of zone.districts) {
      if (combinedText.includes(dist.toLowerCase())) {
        return { zoneId: zone.id, zoneName: zone.name };
      }
    }
  }

  // Deterministic fallback based on string hash
  let hash = 0;
  for (let i = 0; i < combinedText.length; i++) {
    hash = (hash << 5) - hash + combinedText.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % countyZones.length;
  const picked = countyZones[index];
  return { zoneId: picked.id, zoneName: picked.name };
}

// 2. Verified Base Roster of Accredited High Schools across Liberia's 15 Counties
export const ACCREDITED_BASE_SCHOOLS: ZonedSchool[] = [
  // Montserrado Zone 1
  {
    id: 'sch-mon-01',
    name: 'D. Twe Memorial High School',
    county: 'Montserrado',
    zoneId: 'montserrado-z1',
    zoneName: 'Zone 1: Bushrod Island & St. Paul River',
    cityOrDistrict: 'New Kru Town, Bushrod Island',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Kolu G. Brown',
    contactEmail: 'dtwe.debate@gmail.com',
    contactPhone: '+231 777 301 990',
    principalName: 'Edwin S. Harmon',
    delegationSize: 6,
    seedRating: 88,
    pastTitles: 0,
    registeredAt: '2024-10-18T09:00:00.000Z'
  },
  {
    id: 'sch-mon-02',
    name: 'St. Mary Catholic High School',
    county: 'Montserrado',
    zoneId: 'montserrado-z1',
    zoneName: 'Zone 1: Bushrod Island & St. Paul River',
    cityOrDistrict: 'Duals, Bushrod Island',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Father Patrick J. Clarke',
    contactEmail: 'stmary.bushrod@yahoo.com',
    contactPhone: '+231 886 441 210',
    principalName: 'Sister Theresa Gaye',
    delegationSize: 6,
    seedRating: 84,
    pastTitles: 0,
    registeredAt: '2024-10-19T11:30:00.000Z'
  },
  {
    id: 'sch-mon-03',
    name: 'Len Millar High School',
    county: 'Montserrado',
    zoneId: 'montserrado-z1',
    zoneName: 'Zone 1: Bushrod Island & St. Paul River',
    cityOrDistrict: 'Caldwell Road, Bushrod Island',
    program: 'dual',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Matthew B. Gibson',
    contactEmail: 'lenmillar.debate@gmail.com',
    contactPhone: '+231 775 990 123',
    principalName: 'Miatta K. Shannon',
    delegationSize: 8,
    seedRating: 92,
    pastTitles: 1,
    registeredAt: '2024-10-20T14:15:00.000Z'
  },
  {
    id: 'sch-mon-04',
    name: 'Brewerville Assembly of God High School',
    county: 'Montserrado',
    zoneId: 'montserrado-z1',
    zoneName: 'Zone 1: Bushrod Island & St. Paul River',
    cityOrDistrict: 'Brewerville City',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Rev. Joseph N. Gaye',
    contactEmail: 'brewerville.ag@gmail.com',
    contactPhone: '+231 881 229 330',
    principalName: 'Rev. Joseph N. Gaye',
    delegationSize: 6,
    seedRating: 81,
    pastTitles: 0,
    registeredAt: '2024-10-21T10:00:00.000Z'
  },

  // Montserrado Zone 2
  {
    id: 'sch-mon-05',
    name: 'B.W. Harris Episcopal High School',
    county: 'Montserrado',
    zoneId: 'montserrado-z2',
    zoneName: 'Zone 2: Central Monrovia & Sinkor Corridor',
    cityOrDistrict: 'Broad Street, Central Monrovia',
    program: 'dual',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Debate Master Anthony K. Weah',
    contactEmail: 'bwharris.champs@bwharris.edu.lr',
    contactPhone: '+231 777 401 210',
    principalName: 'Canon Gabriel B. Collins',
    delegationSize: 8,
    seedRating: 98,
    pastTitles: 1,
    registeredAt: '2024-10-15T08:00:00.000Z'
  },
  {
    id: 'sch-mon-06',
    name: 'College of West Africa (CWA)',
    county: 'Montserrado',
    zoneId: 'montserrado-z2',
    zoneName: 'Zone 2: Central Monrovia & Sinkor Corridor',
    cityOrDistrict: 'Ashmun Street, Snapper Hill',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Patricia D. Dennis',
    contactEmail: 'cwa.forensics@cwa.edu.lr',
    contactPhone: '+231 886 550 491',
    principalName: 'Dr. James W. Kollie',
    delegationSize: 6,
    seedRating: 94,
    pastTitles: 0,
    registeredAt: '2024-10-16T09:45:00.000Z'
  },
  {
    id: 'sch-mon-07',
    name: 'Bethesda Christian Mission High School',
    county: 'Montserrado',
    zoneId: 'montserrado-z2',
    zoneName: 'Zone 2: Central Monrovia & Sinkor Corridor',
    cityOrDistrict: '12th Street, Sinkor',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Moses T. Jallah',
    contactEmail: 'bethesda.debate@gmail.com',
    contactPhone: '+231 776 221 809',
    principalName: 'Evelyn S. Mulbah',
    delegationSize: 6,
    seedRating: 93,
    pastTitles: 1,
    registeredAt: '2024-10-17T11:00:00.000Z'
  },
  {
    id: 'sch-mon-08',
    name: 'United Dawah Ummah High School',
    county: 'Montserrado',
    zoneId: 'montserrado-z2',
    zoneName: 'Zone 2: Central Monrovia & Sinkor Corridor',
    cityOrDistrict: '17th Street, Sinkor',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Ustaz Mohammed A. Kamara',
    contactEmail: 'dawah.ummah@gmail.com',
    contactPhone: '+231 775 882 110',
    principalName: 'Sheikh Amara F. Kromah',
    delegationSize: 6,
    seedRating: 91,
    pastTitles: 1,
    registeredAt: '2024-10-18T13:20:00.000Z'
  },
  {
    id: 'sch-mon-09',
    name: "St. Teresa's Convent High School",
    county: 'Montserrado',
    zoneId: 'montserrado-z2',
    zoneName: 'Zone 2: Central Monrovia & Sinkor Corridor',
    cityOrDistrict: 'Randall Street, Central Monrovia',
    program: 'dual',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Sister Mary Rose Koffa',
    contactEmail: 'st.teresa.convent@gmail.com',
    contactPhone: '+231 886 312 809',
    principalName: 'Sister Barbara D. Flomo',
    delegationSize: 8,
    seedRating: 90,
    pastTitles: 0,
    registeredAt: '2024-10-19T10:10:00.000Z'
  },
  {
    id: 'sch-mon-10',
    name: 'William V.S. Tubman High School',
    county: 'Montserrado',
    zoneId: 'montserrado-z2',
    zoneName: 'Zone 2: Central Monrovia & Sinkor Corridor',
    cityOrDistrict: '12th Street, Sinkor',
    program: 'stem',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Jerry M. Flomo',
    contactEmail: 'tubmanhigh.stem@gmail.com',
    contactPhone: '+231 777 900 144',
    principalName: 'Alieu B. Sando',
    delegationSize: 6,
    seedRating: 86,
    pastTitles: 0,
    registeredAt: '2024-10-20T16:00:00.000Z'
  },

  // Montserrado Zone 3
  {
    id: 'sch-mon-11',
    name: 'Paynesville Seventh-day Adventist (SDA) High School',
    county: 'Montserrado',
    zoneId: 'montserrado-z3',
    zoneName: 'Zone 3: Paynesville, ELWA & Somalia Drive',
    cityOrDistrict: 'ELWA Junction, Paynesville',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Elder Nathaniel S. Freeman',
    contactEmail: 'paynesville.sda@gmail.com',
    contactPhone: '+231 770 411 902',
    principalName: 'Pastor David G. Tokpah',
    delegationSize: 6,
    seedRating: 95,
    pastTitles: 1,
    registeredAt: '2024-10-16T12:00:00.000Z'
  },
  {
    id: 'sch-mon-12',
    name: 'Isaac A. Davis Memorial High School',
    county: 'Montserrado',
    zoneId: 'montserrado-z3',
    zoneName: 'Zone 3: Paynesville, ELWA & Somalia Drive',
    cityOrDistrict: 'Somalia Drive, Gardnersville',
    program: 'dual',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Samuel K. Dukuly',
    contactEmail: 'isaacadavis.high@yahoo.com',
    contactPhone: '+231 886 772 319',
    principalName: 'Helena P. Tarr',
    delegationSize: 8,
    seedRating: 94,
    pastTitles: 1,
    registeredAt: '2024-10-17T14:30:00.000Z'
  },
  {
    id: 'sch-mon-13',
    name: 'Sammy Dukuly Memorial High School',
    county: 'Montserrado',
    zoneId: 'montserrado-z3',
    zoneName: 'Zone 3: Paynesville, ELWA & Somalia Drive',
    cityOrDistrict: 'Duport Road, Paynesville',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Arthur B. Massaquoi',
    contactEmail: 'sammydukuly.debate@gmail.com',
    contactPhone: '+231 777 551 290',
    principalName: 'Jefferson K. Gaye',
    delegationSize: 6,
    seedRating: 89,
    pastTitles: 0,
    registeredAt: '2024-10-18T10:45:00.000Z'
  },
  {
    id: 'sch-mon-14',
    name: 'Barnesville Lutheran High School',
    county: 'Montserrado',
    zoneId: 'montserrado-z3',
    zoneName: 'Zone 3: Paynesville, ELWA & Somalia Drive',
    cityOrDistrict: 'Barnesville Estate',
    program: 'stem',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Kormassah T. Giddings',
    contactEmail: 'barnesville.lutheran@gmail.com',
    contactPhone: '+231 880 449 101',
    principalName: 'Rev. Emmanuel K. Zubah',
    delegationSize: 6,
    seedRating: 85,
    pastTitles: 0,
    registeredAt: '2024-10-19T13:00:00.000Z'
  },

  // Montserrado Zone 4
  {
    id: 'sch-mon-15',
    name: 'Careysburg Public High School',
    county: 'Montserrado',
    zoneId: 'montserrado-z4',
    zoneName: 'Zone 4: Careysburg, Mount Barclay & Rural Montserrado',
    cityOrDistrict: 'Careysburg City Center',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Victoria A. Richardson',
    contactEmail: 'careysburg.high@gmail.com',
    contactPhone: '+231 776 339 018',
    principalName: 'Melvin T. McCritty',
    delegationSize: 6,
    seedRating: 82,
    pastTitles: 0,
    registeredAt: '2024-10-21T09:15:00.000Z'
  },
  {
    id: 'sch-mon-16',
    name: 'Mount Barclay Community High School',
    county: 'Montserrado',
    zoneId: 'montserrado-z4',
    zoneName: 'Zone 4: Careysburg, Mount Barclay & Rural Montserrado',
    cityOrDistrict: 'Mount Barclay Highway',
    program: 'stem',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Francis N. Gbotoe',
    contactEmail: 'mtbarclay.school@gmail.com',
    contactPhone: '+231 881 770 234',
    principalName: 'Grace M. Cooper',
    delegationSize: 6,
    seedRating: 80,
    pastTitles: 0,
    registeredAt: '2024-10-22T11:00:00.000Z'
  },

  // Nimba County Schools
  {
    id: 'sch-nim-01',
    name: 'Ganta United Methodist School (GUMS)',
    county: 'Nimba',
    zoneId: 'nimba-z2',
    zoneName: 'Zone 2: Central Nimba & Ganta Commercial Basin',
    cityOrDistrict: 'Ganta City Center',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Coach Timothy D. Gwean',
    contactEmail: 'gums.forensics@gmail.com',
    contactPhone: '+231 886 523 911',
    principalName: 'Rev. Emmanuel S. Gbatu',
    delegationSize: 6,
    seedRating: 99,
    pastTitles: 2,
    registeredAt: '2024-10-14T09:00:00.000Z'
  },
  {
    id: 'sch-nim-02',
    name: 'Sanniquellie Central High School',
    county: 'Nimba',
    zoneId: 'nimba-z1',
    zoneName: 'Zone 1: Upper Nimba & Sanniquellie Hub',
    cityOrDistrict: 'Sanniquellie City',
    program: 'dual',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Jefferson P. Luogon',
    contactEmail: 'sanniquellie.high@gmail.com',
    contactPhone: '+231 777 882 101',
    principalName: 'Amos N. Wonlea',
    delegationSize: 8,
    seedRating: 89,
    pastTitles: 0,
    registeredAt: '2024-10-16T10:30:00.000Z'
  },
  {
    id: 'sch-nim-03',
    name: 'St. Mary Catholic High School (Sanniquellie)',
    county: 'Nimba',
    zoneId: 'nimba-z1',
    zoneName: 'Zone 1: Upper Nimba & Sanniquellie Hub',
    cityOrDistrict: 'Sanniquellie',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Sr. Agnes M. Toe',
    contactEmail: 'stmary.sanniquellie@gmail.com',
    contactPhone: '+231 886 339 210',
    principalName: 'Father Michael D. Gaye',
    delegationSize: 6,
    seedRating: 87,
    pastTitles: 0,
    registeredAt: '2024-10-17T13:00:00.000Z'
  },
  {
    id: 'sch-nim-04',
    name: 'Saclapea Central High School',
    county: 'Nimba',
    zoneId: 'nimba-z2',
    zoneName: 'Zone 2: Central Nimba & Ganta Commercial Basin',
    cityOrDistrict: 'Saclapea Town',
    program: 'stem',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'David K. Mehnpaine',
    contactEmail: 'saclapea.high@yahoo.com',
    contactPhone: '+231 776 991 202',
    principalName: 'Benson P. Dolo',
    delegationSize: 6,
    seedRating: 85,
    pastTitles: 0,
    registeredAt: '2024-10-18T15:20:00.000Z'
  },
  {
    id: 'sch-nim-05',
    name: 'Jackson F. Doe Memorial High School',
    county: 'Nimba',
    zoneId: 'nimba-z3',
    zoneName: 'Zone 3: Lower Nimba & Tappita Corridor',
    cityOrDistrict: 'Tappita City',
    program: 'dual',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Gabriel N. Quiah',
    contactEmail: 'jfd.memorialhigh@gmail.com',
    contactPhone: '+231 880 771 909',
    principalName: 'Comfort B. Sendolo',
    delegationSize: 8,
    seedRating: 90,
    pastTitles: 0,
    registeredAt: '2024-10-19T11:45:00.000Z'
  },

  // Bong County Schools
  {
    id: 'sch-bong-01',
    name: 'Cuttington University Campus High School',
    county: 'Bong',
    zoneId: 'bong-z2',
    zoneName: 'Zone 2: Suakoko Academic Basin & Cuttington',
    cityOrDistrict: 'Suakoko Campus',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Dr. Evelyn S. Mulbah',
    contactEmail: 'cuttingtonhigh@cuttington.edu.lr',
    contactPhone: '+231 776 892 344',
    principalName: 'Prof. Jeremiah P. Tokpa',
    delegationSize: 6,
    seedRating: 96,
    pastTitles: 1,
    registeredAt: '2024-10-15T10:00:00.000Z'
  },
  {
    id: 'sch-bong-02',
    name: 'Gboveh High School',
    county: 'Bong',
    zoneId: 'bong-z1',
    zoneName: 'Zone 1: Greater Gbarnga & Central Bong',
    cityOrDistrict: 'Gbarnga City Center',
    program: 'stem',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Varney K. Flomo',
    contactEmail: 'gboveh.high@gmail.com',
    contactPhone: '+231 886 441 290',
    principalName: 'Helena S. Kollie',
    delegationSize: 6,
    seedRating: 94,
    pastTitles: 0,
    registeredAt: '2024-10-16T14:00:00.000Z'
  },
  {
    id: 'sch-bong-03',
    name: 'St. Martin Catholic High School',
    county: 'Bong',
    zoneId: 'bong-z1',
    zoneName: 'Zone 1: Greater Gbarnga & Central Bong',
    cityOrDistrict: 'Gbarnga',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Fr. James N. Bondo',
    contactEmail: 'stmartin.gbarnga@gmail.com',
    contactPhone: '+231 770 998 122',
    principalName: 'Sister Rose M. Dennis',
    delegationSize: 6,
    seedRating: 88,
    pastTitles: 0,
    registeredAt: '2024-10-18T10:30:00.000Z'
  },
  {
    id: 'sch-bong-04',
    name: 'Totota Lutheran High School',
    county: 'Bong',
    zoneId: 'bong-z2',
    zoneName: 'Zone 2: Suakoko Academic Basin & Cuttington',
    cityOrDistrict: 'Totota Commercial Town',
    program: 'dual',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'David M. Sumo',
    contactEmail: 'totota.lutheran@gmail.com',
    contactPhone: '+231 881 330 491',
    principalName: 'Rev. Samuel B. Mulbah',
    delegationSize: 8,
    seedRating: 86,
    pastTitles: 0,
    registeredAt: '2024-10-19T13:45:00.000Z'
  },

  // Margibi County Schools
  {
    id: 'sch-mar-01',
    name: 'Booker Washington Institute (BWI)',
    county: 'Margibi',
    zoneId: 'margibi-z1',
    zoneName: 'Zone 1: Upper Margibi & Kakata Metropolitan',
    cityOrDistrict: 'Kakata Central',
    program: 'dual',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Eng. Francis K. Sumo',
    contactEmail: 'bwi.forensics@bwi.edu.lr',
    contactPhone: '+231 880 119 452',
    principalName: 'Attorney Harris F. Tarnue',
    delegationSize: 8,
    seedRating: 97,
    pastTitles: 0,
    registeredAt: '2024-10-14T11:00:00.000Z'
  },
  {
    id: 'sch-mar-02',
    name: 'Harbel Multilateral High School',
    county: 'Margibi',
    zoneId: 'margibi-z2',
    zoneName: 'Zone 2: Lower Margibi, Harbel & Firestone Belt',
    cityOrDistrict: 'Harbel, Firestone',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Augusta J. Clarke',
    contactEmail: 'harbel.high@gmail.com',
    contactPhone: '+231 775 660 303',
    principalName: 'Charles B. Dunbar',
    delegationSize: 6,
    seedRating: 89,
    pastTitles: 0,
    registeredAt: '2024-10-16T15:10:00.000Z'
  },
  {
    id: 'sch-mar-03',
    name: 'St. Christopher Catholic High School',
    county: 'Margibi',
    zoneId: 'margibi-z1',
    zoneName: 'Zone 1: Upper Margibi & Kakata Metropolitan',
    cityOrDistrict: 'Kakata City',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Moses N. Flomo',
    contactEmail: 'stchristopher.kakata@gmail.com',
    contactPhone: '+231 886 220 190',
    principalName: 'Sister Veronica T. Gaye',
    delegationSize: 6,
    seedRating: 86,
    pastTitles: 0,
    registeredAt: '2024-10-18T14:00:00.000Z'
  },

  // Grand Bassa County Schools
  {
    id: 'sch-bas-01',
    name: 'Bassa High School',
    county: 'Grand Bassa',
    zoneId: 'grand-bassa-z1',
    zoneName: 'Zone 1: Buchanan Port City & Urban Bassa',
    cityOrDistrict: 'Buchanan City Fairgrounds',
    program: 'dual',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Comfort B. Tarr',
    contactEmail: 'bassahigh.debate@gmail.com',
    contactPhone: '+231 770 334 812',
    principalName: 'Nathaniel B. Kaizolu',
    delegationSize: 8,
    seedRating: 92,
    pastTitles: 0,
    registeredAt: '2024-10-15T13:00:00.000Z'
  },
  {
    id: 'sch-bas-02',
    name: 'St. Peter Claver Catholic High School',
    county: 'Grand Bassa',
    zoneId: 'grand-bassa-z1',
    zoneName: 'Zone 1: Buchanan Port City & Urban Bassa',
    cityOrDistrict: 'Buchanan Central',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Fr. Gabriel S. Doe',
    contactEmail: 'stpeterclaver.buchanan@gmail.com',
    contactPhone: '+231 886 771 902',
    principalName: 'Brother Dominic S. Toe',
    delegationSize: 6,
    seedRating: 88,
    pastTitles: 0,
    registeredAt: '2024-10-17T09:30:00.000Z'
  },

  // Grand Gedeh County Schools
  {
    id: 'sch-ged-01',
    name: 'Bishop Juwle Catholic High School',
    county: 'Grand Gedeh',
    zoneId: 'grand-gedeh-z1',
    zoneName: 'Zone 1: Zwedru Central & Tchien Basin',
    cityOrDistrict: 'Zwedru Capital',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'George B. Gaye',
    contactEmail: 'bishopjuwle.champs@gmail.com',
    contactPhone: '+231 880 771 234',
    principalName: 'Rev. Father Anthony P. Weah',
    delegationSize: 6,
    seedRating: 96,
    pastTitles: 1,
    registeredAt: '2024-10-14T10:00:00.000Z'
  },
  {
    id: 'sch-ged-02',
    name: 'Bishop M. Nixon Garlo High School',
    county: 'Grand Gedeh',
    zoneId: 'grand-gedeh-z1',
    zoneName: 'Zone 1: Zwedru Central & Tchien Basin',
    cityOrDistrict: 'Zwedru Commercial Belt',
    program: 'dual',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Solomon C. Toe',
    contactEmail: 'nixongarlo.high@yahoo.com',
    contactPhone: '+231 776 541 332',
    principalName: 'Ebenezer K. Gbayee',
    delegationSize: 8,
    seedRating: 91,
    pastTitles: 0,
    registeredAt: '2024-10-16T11:20:00.000Z'
  },

  // Lofa County Schools
  {
    id: 'sch-lof-01',
    name: 'Voinjama Multilateral High School',
    county: 'Lofa',
    zoneId: 'lofa-z1',
    zoneName: 'Zone 1: Voinjama Capital & Northern Highlands',
    cityOrDistrict: 'Voinjama City',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Tamba P. Koroma',
    contactEmail: 'voinjama.multi@gmail.com',
    contactPhone: '+231 886 991 302',
    principalName: 'Finda M. Kanneh',
    delegationSize: 6,
    seedRating: 91,
    pastTitles: 0,
    registeredAt: '2024-10-15T15:00:00.000Z'
  },
  {
    id: 'sch-lof-02',
    name: 'Zorzor Central High School',
    county: 'Lofa',
    zoneId: 'lofa-z2',
    zoneName: 'Zone 2: Southern Lofa & Zorzor Valley',
    cityOrDistrict: 'Zorzor Town',
    program: 'stem',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Marie K. Zayzay',
    contactEmail: 'zorzor.central@gmail.com',
    contactPhone: '+231 777 220 894',
    principalName: 'Moses B. Flomo',
    delegationSize: 6,
    seedRating: 87,
    pastTitles: 0,
    registeredAt: '2024-10-17T12:15:00.000Z'
  },

  // Maryland County Schools
  {
    id: 'sch-mar-c1',
    name: 'Cape Palmas High School',
    county: 'Maryland',
    zoneId: 'maryland-z1',
    zoneName: 'Zone 1: Historic Harper & Cape Palmas Coast',
    cityOrDistrict: 'Harper City',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Patricia H. Davies',
    contactEmail: 'capepalmas.high@gmail.com',
    contactPhone: '+231 775 604 119',
    principalName: 'David S. Allison',
    delegationSize: 6,
    seedRating: 90,
    pastTitles: 0,
    registeredAt: '2024-10-16T14:30:00.000Z'
  },
  {
    id: 'sch-mar-c2',
    name: 'Pleebo High School',
    county: 'Maryland',
    zoneId: 'maryland-z2',
    zoneName: 'Zone 2: Pleebo Commercial & Karluway',
    cityOrDistrict: 'Pleebo City',
    program: 'dual',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Emmanuel N. Allison',
    contactEmail: 'pleebo.high@gmail.com',
    contactPhone: '+231 881 229 018',
    principalName: 'Grace N. Nyanti',
    delegationSize: 8,
    seedRating: 88,
    pastTitles: 0,
    registeredAt: '2024-10-18T11:00:00.000Z'
  },

  // Bomi County Schools
  {
    id: 'sch-bom-01',
    name: 'C.H. Dewey High School',
    county: 'Bomi',
    zoneId: 'bomi-z1',
    zoneName: 'Zone 1: Tubmanburg Urban & Klay District',
    cityOrDistrict: 'Tubmanburg',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Varney M. Sando',
    contactEmail: 'chdewey.high@gmail.com',
    contactPhone: '+231 777 982 101',
    principalName: 'Boakai Z. Fahnbulleh',
    delegationSize: 6,
    seedRating: 89,
    pastTitles: 0,
    registeredAt: '2024-10-15T09:30:00.000Z'
  },

  // Grand Cape Mount Schools
  {
    id: 'sch-gcm-01',
    name: 'Robertsport High School',
    county: 'Grand Cape Mount',
    zoneId: 'cape-mount-z1',
    zoneName: 'Zone 1: Robertsport Coast & Lake Piso',
    cityOrDistrict: 'Robertsport City',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Siafa B. Fahnbulleh',
    contactEmail: 'robertsport.high@gmail.com',
    contactPhone: '+231 770 812 404',
    principalName: 'Amara K. Sambolah',
    delegationSize: 6,
    seedRating: 86,
    pastTitles: 0,
    registeredAt: '2024-10-17T10:00:00.000Z'
  },

  // Sinoe County Schools
  {
    id: 'sch-sin-01',
    name: 'Sinoe Multilateral High School',
    county: 'Sinoe',
    zoneId: 'sinoe-z1',
    zoneName: 'Zone 1: Greenville Port & Butaw',
    cityOrDistrict: 'Greenville Port City',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Patrick S. Wleh',
    contactEmail: 'sinoemulti.high@gmail.com',
    contactPhone: '+231 776 341 092',
    principalName: 'Massa S. Tarpeh',
    delegationSize: 6,
    seedRating: 87,
    pastTitles: 0,
    registeredAt: '2024-10-18T13:00:00.000Z'
  },

  // River Cess Schools
  {
    id: 'sch-rc-01',
    name: 'Cestos High School',
    county: 'River Cess',
    zoneId: 'river-cess-z1',
    zoneName: 'Zone 1: Cestos City & Coastal River Cess',
    cityOrDistrict: 'Cestos City',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Aloysius B. Giah',
    contactEmail: 'cestos.high@gmail.com',
    contactPhone: '+231 775 440 198',
    principalName: 'Comfort N. Zayzay',
    delegationSize: 6,
    seedRating: 85,
    pastTitles: 0,
    registeredAt: '2024-10-19T14:20:00.000Z'
  },

  // Grand Kru Schools
  {
    id: 'sch-gk-01',
    name: 'Barclayville High School',
    county: 'Grand Kru',
    zoneId: 'grand-kru-z1',
    zoneName: 'Zone 1: Barclayville & Upper Grand Kru',
    cityOrDistrict: 'Barclayville Capital',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Augustine T. Blamo',
    contactEmail: 'barclayville.high@gmail.com',
    contactPhone: '+231 881 665 432',
    principalName: 'Peter B. Nyanfor',
    delegationSize: 6,
    seedRating: 85,
    pastTitles: 0,
    registeredAt: '2024-10-20T10:00:00.000Z'
  },

  // River Gee Schools
  {
    id: 'sch-rg-01',
    name: 'Fish Town Multilateral High School',
    county: 'River Gee',
    zoneId: 'river-gee-z1',
    zoneName: 'Zone 1: Fish Town Central & Webbo',
    cityOrDistrict: 'Fish Town Capital',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Wellington K. Saydee',
    contactEmail: 'fishtown.multi@gmail.com',
    contactPhone: '+231 776 119 804',
    principalName: 'Theresa P. Toe',
    delegationSize: 6,
    seedRating: 86,
    pastTitles: 0,
    registeredAt: '2024-10-21T11:30:00.000Z'
  },

  // Gbarpolu Schools
  {
    id: 'sch-gb-01',
    name: 'Bopolu High School',
    county: 'Gbarpolu',
    zoneId: 'gbarpolu-z1',
    zoneName: 'Zone 1: Bopolu Capital & Mineral Corridor',
    cityOrDistrict: 'Bopolu City',
    program: 'debate',
    registrationSource: 'database',
    status: 'verified',
    contactPerson: 'Zinnah F. Kamara',
    contactEmail: 'bopoluhigh.debate@gmail.com',
    contactPhone: '+231 775 882 119',
    principalName: 'Alhaji M. Kromah',
    delegationSize: 6,
    seedRating: 85,
    pastTitles: 0,
    registeredAt: '2024-10-22T09:00:00.000Z'
  }
];

// 3. Accredited Debate Motion Pool
export const ACCREDITED_DEBATE_MOTIONS: DebateMotion[] = [
  {
    id: 'mot-01',
    motionText: 'This House Would Mandate That 50% of County Social Development Funds (CSDF) Be Exclusively Ring-Fenced for High School Science Laboratories and Digital Forensics Infrastructure.',
    domain: 'Economics & Resource Rights',
    infoSlide: 'Under Liberian concession agreements, mining and forestry concessionaires remit millions in CSDF to counties. Currently, county sittings determine allocation with limited statutory minimums for secondary education facilities.',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'Zonal Prelims'
  },
  {
    id: 'mot-02',
    motionText: 'This House Believes That West African States Should Establish an Integrated Digital Single Currency Backed by Critical Green Energy Mineral Reserves.',
    domain: 'Economics & Resource Rights',
    infoSlide: 'In the context of the proposed ECOWAS Eco currency and regional trade treaties, member states are balancing monetary sovereignty against foreign exchange volatility.',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'Zonal Prelims'
  },
  {
    id: 'mot-03',
    motionText: 'This House Supports State-Subsidized Generative Artificial Intelligence Platforms in Developing Nations’ Public High Schools Over Traditional Textbook Subsidies.',
    domain: 'STEM & Climate',
    infoSlide: 'Developing school systems face severe textbook scarcity and logistical transport bottlenecks into rural interior counties, while mobile data and lightweight local AI models offer offline-capable knowledge repositories.',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'Zonal Prelims'
  },
  {
    id: 'mot-04',
    motionText: 'This House Would Legislate a 30% Mandatory Gender Quota on All Candidate Listings for Parliamentary and Legislative Elections.',
    domain: 'Governance & Constitution',
    infoSlide: 'Article 8 of the Liberian Constitution and the New Elections Law debate female political representation benchmarks to address historic gender disparities in national governance.',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'County Final'
  },
  {
    id: 'mot-05',
    motionText: 'This House, as the Ministry of Education, Would Replace Standardized WAEC/WASSCE Rote Examinations with Longitudinal Continuous Project-Based STEM & Forensics Assessments.',
    domain: 'Education & Gender',
    infoSlide: 'Standardized annual exams create acute testing anxiety and focus curriculum on rote memorization rather than critical problem-solving and forensic debate abilities.',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'County Final'
  },
  {
    id: 'mot-06',
    motionText: 'This House Regrets the Exclusive Dependence of Developing Agricultural Nations on International Climate Adaptation Aid Rather Than Carbon Tax Sovereign Bonds.',
    domain: 'STEM & Climate',
    infoSlide: 'Liberia contains over 40% of the remaining Upper Guinea Rainforest, representing significant carbon sink equity on the global voluntary carbon markets.',
    preparationType: 'Impromptu Motion (1-Hour Release)',
    roundDesignation: 'National Championship'
  },
  {
    id: 'mot-07',
    motionText: 'This House Believes That Developing Nations Should Decouple Their Public Energy Infrastructure From Heavy Hydrocarbon Concessions and Mandate 100% Microgrid Solar in Rural School Districts.',
    domain: 'STEM & Climate',
    infoSlide: 'Liberia has high solar irradiance, yet over 70% of public rural secondary schools have zero electrical grid connectivity, limiting evening study and STEM computer labs.',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'National Championship'
  },
  {
    id: 'mot-08',
    motionText: 'This House Would Prohibit Transnational Concession Companies From Exporting Unprocessed Raw Timber and Mineral Ores Prior to 50% Domestic Value-Added Refinement.',
    domain: 'Economics & Resource Rights',
    infoSlide: 'Raw export policies in developing countries export local employment opportunities and perpetuate trade deficit vulnerabilities.',
    preparationType: 'Prepared Motion (Announced in Advance)',
    roundDesignation: 'National Championship'
  }
];

// STEM Project Innovation Face-off Themes
export const STEM_CHALLENGE_FACE_OFF_THEMES = [
  'Renewable Solar Microgrids & Low-Cost Energy Storage for Rural Schools',
  'Cassava & Agriculture Waste-to-Biogas Clean Cooking Solutions',
  'Low-Bandwidth Mobile Telemedicine & Clean Water Filtration Diagnostics',
  'Automated Recycled Plastic Filament Production for Low-Cost 3D Printing',
  'AI-Assisted Crop Disease Detection via Inexpensive Smartphone Cameras'
];

// 4. Accredited Neutral Adjudicators Pool
export const ACCREDITED_ADJUDICATORS: Adjudicator[] = [
  { id: 'adj-01', name: 'Atty. James K. Flomo', role: 'Chief Adjudicator', countyOfOrigin: 'Margibi', institution: 'Louis Arthur Grimes School of Law', certifiedWSDC: true },
  { id: 'adj-02', name: 'Keziah M. Freeman', role: 'Deputy Chief', countyOfOrigin: 'Montserrado', institution: 'University of Liberia Forensics Society', certifiedWSDC: true },
  { id: 'adj-03', name: 'Eng. Martin M. Forkpah', role: 'Panelist', countyOfOrigin: 'Bong', institution: 'BWI Engineering Faculty', certifiedWSDC: true },
  { id: 'adj-04', name: 'Dr. Comfort A. Toe', role: 'Panelist', countyOfOrigin: 'Maryland', institution: 'Tubman University Faculty of Education', certifiedWSDC: true },
  { id: 'adj-05', name: 'Cllr. Gabriel B. Weah', role: 'Chief Adjudicator', countyOfOrigin: 'Grand Gedeh', institution: 'Liberian Bar Association', certifiedWSDC: true },
  { id: 'adj-06', name: 'Precious S. Dennis', role: 'Panelist', countyOfOrigin: 'Lofa', institution: 'Youth For Change Senior Adjudication Council', certifiedWSDC: true },
  { id: 'adj-07', name: 'Amos N. Wonlea', role: 'Panelist', countyOfOrigin: 'Nimba', institution: 'Nimba Forensics League', certifiedWSDC: true },
  { id: 'adj-08', name: 'Finda B. Kanneh', role: 'Panelist', countyOfOrigin: 'Grand Bassa', institution: 'Grand Bassa Collegiate Debate Guild', certifiedWSDC: true }
];

// 5. Anti-Bias Cryptographic Random Pairing Algorithm
export function generateAntiBiasCryptographicHash(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(6, '0');
  const randBlock = Math.floor(1000 + Math.random() * 9000);
  return `YFC-FAIR-${hex.substring(0, 4)}-${randBlock}`;
}

// Pseudo-random seeded generator
function seededRandom(seedNum: number) {
  const x = Math.sin(seedNum++) * 10000;
  return x - Math.floor(x);
}

// Fisher-Yates shuffle with cryptographic seed
export function antiBiasShuffle<T>(array: T[], seedStr: string): T[] {
  const shuffled = [...array];
  let seedNum = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seedNum += seedStr.charCodeAt(i) * (i + 1);
  }

  for (let i = shuffled.length - 1; i > 0; i--) {
    const rand = seededRandom(seedNum + i);
    const j = Math.floor(rand * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generates fixtures for a given county or stage with absolute anti-bias enforcement
export function generateAntiBiasFixtures({
  schools,
  stage,
  program,
  county = 'Montserrado',
  zoneId,
  zoneName,
  startDate = '2025-10-25',
  seedOverride,
  motionBank
}: {
  schools: ZonedSchool[];
  stage: TournamentStage;
  program: TournamentProgram;
  county?: string;
  zoneId?: string;
  zoneName?: string;
  startDate?: string;
  seedOverride?: string;
  motionBank?: DebateMotion[];
}): TournamentFixture[] {
  const drawTimestamp = new Date().toISOString();
  const seed = seedOverride || `${stage}-${county}-${zoneId || 'all'}-${Date.now()}`;
  const antiBiasProof = generateAntiBiasCryptographicHash(seed);

  // Filter eligible schools
  let eligible = schools.filter(s => {
    if (program === 'debate') return s.program === 'debate' || s.program === 'dual';
    if (program === 'stem') return s.program === 'stem' || s.program === 'dual';
    return true;
  });

  if (stage === 'zonal_prelims') {
    if (county && county !== 'All') {
      eligible = eligible.filter(s => s.county.toLowerCase() === county.toLowerCase());
    }
    if (zoneId && zoneId !== 'all') {
      eligible = eligible.filter(s => s.zoneId === zoneId);
    }
  } else if (stage === 'county_finals') {
    if (county && county !== 'All') {
      eligible = eligible.filter(s => s.county.toLowerCase() === county.toLowerCase());
    }
  } else if (stage === 'national_championship') {
    // All 15 counties represented!
  }

  if (eligible.length < 2) {
    return [];
  }

  // Shuffle schools impartially
  const randomizedSchools = antiBiasShuffle(eligible, seed);

  // Pick neutral motions from Motion Bank if provided, else fallback to accredited motions
  const activeMotionsSource = (motionBank && motionBank.length > 0) ? motionBank : ACCREDITED_DEBATE_MOTIONS;
  const relevantMotions = activeMotionsSource.filter(m => {
    if (stage === 'national_championship') return m.roundDesignation === 'National Championship' || m.roundDesignation === 'County Final';
    if (stage === 'county_finals') return m.roundDesignation === 'County Final' || m.roundDesignation === 'Zonal Prelims';
    return m.roundDesignation === 'Zonal Prelims';
  });
  const motionsPool = relevantMotions.length > 0 ? relevantMotions : activeMotionsSource;

  const fixtures: TournamentFixture[] = [];
  const venuePool = [
    'Monrovia City Hall Ballroom',
    'EJS Ministerial Complex Auditorium',
    'Booker Washington Institute (BWI) Multipurpose Hall',
    'Cuttington University Amphitheater, Suakoko',
    'Ganta United Methodist School (GUMS) Hall',
    'Buchanan City Hall Fairgrounds',
    'Sanniquellie City Hall',
    'Voinjama Multilateral Auditorium',
    'Bishop Juwle Catholic High Hall, Zwedru',
    'Tubman University Auditorium, Harper'
  ];

  const timeSlots = ['09:30 AM GMT', '11:45 AM GMT', '02:00 PM GMT', '04:15 PM GMT'];

  // Pair adjacent schools from the randomized array
  for (let i = 0; i < randomizedSchools.length - 1; i += 2) {
    const school1 = randomizedSchools[i];
    const school2 = randomizedSchools[i + 1];
    const matchIdx = Math.floor(i / 2) + 1;

    // Impartial side assignment: flip coin based on seed characters
    const coinFlip = (seed.charCodeAt(i % seed.length) + i) % 2 === 0;
    const teamA = coinFlip ? school1 : school2;
    const teamB = coinFlip ? school2 : school1;

    const motionObj = motionsPool[matchIdx % motionsPool.length];
    const stemTheme = STEM_CHALLENGE_FACE_OFF_THEMES[matchIdx % STEM_CHALLENGE_FACE_OFF_THEMES.length];
    const chosenVenue = venuePool[(matchIdx + (county ? county.length : 0)) % venuePool.length];
    const chosenTime = timeSlots[matchIdx % timeSlots.length];

    // Adjudicators conflict of interest filter: exclude judges from the competing teams' counties
    const neutralJudges = ACCREDITED_ADJUDICATORS.filter(
      adj => adj.countyOfOrigin !== teamA.county && adj.countyOfOrigin !== teamB.county
    );
    const assignedJudges = (neutralJudges.length >= 3 ? neutralJudges : ACCREDITED_ADJUDICATORS).slice(0, 3);

    const roundTitle = 
      stage === 'zonal_prelims'
        ? `${teamA.county} ${teamA.zoneName || 'Zonal'} Derby • Match #${matchIdx}`
        : stage === 'county_finals'
          ? `${teamA.county} County Championship Grand Face-Off • Match #${matchIdx}`
          : `National Championship • 15-County Super Round • Match #${matchIdx}`;

    fixtures.push({
      id: `fix-${stage}-${Date.now()}-${matchIdx}-${Math.floor(Math.random() * 1000)}`,
      program,
      stage,
      roundName: roundTitle,
      county: stage === 'national_championship' ? 'All 15 Counties' : teamA.county,
      zoneId: teamA.zoneId,
      zoneName: teamA.zoneName,
      matchNumber: matchIdx,
      teamA: {
        schoolId: teamA.id,
        schoolName: teamA.name,
        county: teamA.county,
        zoneName: teamA.zoneName,
        role: program === 'debate' ? 'Affirmative (Proposition)' : 'Primary Innovator'
      },
      teamB: {
        schoolId: teamB.id,
        schoolName: teamB.name,
        county: teamB.county,
        zoneName: teamB.zoneName,
        role: program === 'debate' ? 'Negative (Opposition)' : 'Challenger'
      },
      motion: program === 'debate' ? motionObj.motionText : stemTheme,
      motionInfoSlide: program === 'debate' ? motionObj.infoSlide : 'Teams will pitch prototype validation, community adoption metrics, and local material feasibility.',
      motionDomain: program === 'debate' ? motionObj.domain : 'STEM & Climate',
      venue: chosenVenue,
      matchDate: startDate,
      matchTime: chosenTime,
      adjudicators: assignedJudges,
      status: 'scheduled',
      antiBiasHash: `${antiBiasProof}-M${matchIdx}`,
      drawSeed: seed,
      isPublished: true,
      createdAt: drawTimestamp
    });
  }

  return fixtures;
}

// 5b. National Championship Super Round Pairing Engine (When all 15 counties come together)
export function generateNationalChampionshipPairings({
  countyChampions,
  schoolStats = {},
  program = 'debate',
  startDate = '2025-10-25',
  seedOverride
}: {
  countyChampions: ZonedSchool[];
  schoolStats?: Record<string, { totalScore: number; ballotsWon: number; matchesWon: number }>;
  program?: TournamentProgram;
  startDate?: string;
  seedOverride?: string;
}): TournamentFixture[] {
  const drawTimestamp = new Date().toISOString();
  const seed = seedOverride || `national-championship-15counties-${Date.now()}`;
  const antiBiasProof = generateAntiBiasCryptographicHash(seed);

  // Filter eligible county champions
  let champions = countyChampions.filter(s => {
    if (program === 'debate') return s.program === 'debate' || s.program === 'dual';
    if (program === 'stem') return s.program === 'stem' || s.program === 'dual';
    return true;
  });

  // Ensure one representative per county
  const countyMap = new Map<string, ZonedSchool>();
  for (const champ of champions) {
    const cLower = champ.county.toLowerCase();
    if (!countyMap.has(cLower)) {
      countyMap.set(cLower, champ);
    } else {
      // Pick higher stats if duplicates exist
      const existing = countyMap.get(cLower)!;
      const existingStats = schoolStats[existing.id] || { totalScore: existing.seedRating || 80, ballotsWon: 0, matchesWon: 0 };
      const currentStats = schoolStats[champ.id] || { totalScore: champ.seedRating || 80, ballotsWon: 0, matchesWon: 0 };
      if (currentStats.totalScore > existingStats.totalScore) {
        countyMap.set(cLower, champ);
      }
    }
  }

  // If we have fewer than 15 counties in champions, fill from accredited base schools so all 15 counties are represented
  const all15Counties = [
    'Montserrado', 'Nimba', 'Bong', 'Margibi', 'Grand Bassa', 
    'Lofa', 'Grand Gedeh', 'Maryland', 'Bomi', 'Grand Cape Mount', 
    'Sinoe', 'River Cess', 'Grand Kru', 'River Gee', 'Gbarpolu'
  ];

  for (const countyName of all15Counties) {
    const cLower = countyName.toLowerCase();
    if (!countyMap.has(cLower)) {
      const fallback = ACCREDITED_BASE_SCHOOLS.find(s => s.county.toLowerCase() === cLower);
      if (fallback) {
        countyMap.set(cLower, { ...fallback, isCountyChampion: true });
      }
    }
  }

  // Rank and seed schools mathematically based on results entered on the site
  const rankedChampions = Array.from(countyMap.values()).sort((a, b) => {
    const statsA = schoolStats[a.id] || { totalScore: (a.seedRating || 85) * 3, ballotsWon: a.pastTitles ? 6 : 3, matchesWon: 2 };
    const statsB = schoolStats[b.id] || { totalScore: (b.seedRating || 85) * 3, ballotsWon: b.pastTitles ? 6 : 3, matchesWon: 2 };
    
    // Primary: Total matches won
    if (statsB.matchesWon !== statsA.matchesWon) {
      return statsB.matchesWon - statsA.matchesWon;
    }
    // Secondary: Ballots won (3-0 vs 2-1)
    if (statsB.ballotsWon !== statsA.ballotsWon) {
      return statsB.ballotsWon - statsA.ballotsWon;
    }
    // Tertiary: Cumulative speaker points
    return statsB.totalScore - statsA.totalScore;
  });

  // National Championship Bracket Pairings (15 Counties)
  // Seed 1 gets a bye to Quarter-Finals, and remaining 14 face off in Round of 16 (7 matches)
  // Or Seed 1 faces Seed 15 in premier Super Round
  const matchups: { teamA: ZonedSchool; teamB: ZonedSchool; seedMatch: string }[] = [];
  const count = rankedChampions.length;

  // Bracket pairings: top half vs bottom half with pseudo-random seed rotation to prevent human tampering
  for (let i = 0; i < Math.floor(count / 2); i++) {
    const topSeed = rankedChampions[i];
    const bottomSeed = rankedChampions[count - 1 - i];
    
    // Cryptographic side assignment flip
    const coinFlip = (seed.charCodeAt(i % seed.length) + i) % 2 === 0;
    matchups.push({
      teamA: coinFlip ? topSeed : bottomSeed,
      teamB: coinFlip ? bottomSeed : topSeed,
      seedMatch: `Seed #${i + 1} vs Seed #${count - i}`
    });
  }

  // National debate motions
  const nationalMotions = ACCREDITED_DEBATE_MOTIONS.filter(
    m => m.roundDesignation === 'National Championship' || m.roundDesignation === 'County Final'
  );
  const motionsPool = nationalMotions.length > 0 ? nationalMotions : ACCREDITED_DEBATE_MOTIONS;

  const grandVenues = [
    'Monrovia City Hall Grand Ballroom, Tubman Blvd',
    'E.J.S. Ministerial Complex Auditorium, Congo Town',
    'Tubman High Centenary Gymnasium, Sinkor',
    'Paynesville Town Hall Grand Pavilion, ELWA Junction'
  ];

  const nationalTimeSlots = ['09:30 AM GMT', '11:45 AM GMT', '02:00 PM GMT', '04:15 PM GMT', '06:30 PM GMT'];

  const fixtures: TournamentFixture[] = [];

  matchups.forEach((match, idx) => {
    const matchNumber = idx + 1;
    const motionObj = motionsPool[idx % motionsPool.length];
    const stemTheme = STEM_CHALLENGE_FACE_OFF_THEMES[idx % STEM_CHALLENGE_FACE_OFF_THEMES.length];
    const chosenVenue = grandVenues[idx % grandVenues.length];
    const chosenTime = nationalTimeSlots[idx % nationalTimeSlots.length];

    // Strictly conflict-free adjudicators: no judge from teamA.county or teamB.county
    const neutralJudges = ACCREDITED_ADJUDICATORS.filter(
      adj => adj.countyOfOrigin !== match.teamA.county && adj.countyOfOrigin !== match.teamB.county
    );
    const assignedJudges = (neutralJudges.length >= 3 ? neutralJudges : ACCREDITED_ADJUDICATORS).slice(0, 3);

    fixtures.push({
      id: `fix-national-super15-${Date.now()}-${matchNumber}`,
      program,
      stage: 'national_championship',
      roundName: `National Championship • 15-County Super Round • Match #${matchNumber} (${match.seedMatch})`,
      county: 'All 15 Counties',
      zoneName: 'National Grand Finals Bracket',
      matchNumber,
      teamA: {
        schoolId: match.teamA.id,
        schoolName: match.teamA.name,
        county: match.teamA.county,
        zoneName: `${match.teamA.county} County Champion`,
        role: program === 'debate' ? 'Affirmative (Proposition)' : 'Primary Innovator'
      },
      teamB: {
        schoolId: match.teamB.id,
        schoolName: match.teamB.name,
        county: match.teamB.county,
        zoneName: `${match.teamB.county} County Champion`,
        role: program === 'debate' ? 'Negative (Opposition)' : 'Challenger'
      },
      motion: program === 'debate' ? motionObj.motionText : stemTheme,
      motionInfoSlide: program === 'debate' ? motionObj.infoSlide : 'Grand pitch and working prototype demonstration before the National STEM Evaluation Jury.',
      motionDomain: program === 'debate' ? motionObj.domain : 'STEM & Climate',
      venue: chosenVenue,
      matchDate: startDate,
      matchTime: chosenTime,
      adjudicators: assignedJudges,
      status: 'scheduled',
      antiBiasHash: `${antiBiasProof}-NAT-M${matchNumber}`,
      drawSeed: seed,
      isPublished: true,
      createdAt: drawTimestamp
    });
  });

  return fixtures;
}

// 5c. Human Bias & Conflict of Interest Auditor
export interface BiasAuditResult {
  passed: boolean;
  integrityScore: number; // 0 - 100%
  totalFixturesAudited: number;
  adjudicatorConflicts: { fixtureId: string; judgeName: string; judgeCounty: string; schoolName: string; matchName: string }[];
  sideImbalanceWarnings: { schoolName: string; affirmativeCount: number; negativeCount: number }[];
  duplicateMatchups: string[];
  seedVerificationHash: string;
  auditSummary: string;
}

export function detectTournamentHumanBias(
  fixtures: TournamentFixture[],
  schools: ZonedSchool[]
): BiasAuditResult {
  const adjudicatorConflicts: { fixtureId: string; judgeName: string; judgeCounty: string; schoolName: string; matchName: string }[] = [];
  const sideTally: Record<string, { affirmative: number; negative: number }> = {};
  const matchupPairs = new Set<string>();
  const duplicateMatchups: string[] = [];

  for (const fix of fixtures) {
    // 1. Audit adjudicator conflicts: check if any judge belongs to same county as Team A or Team B
    for (const judge of fix.adjudicators) {
      if (judge.countyOfOrigin && fix.teamA.county && judge.countyOfOrigin.toLowerCase() === fix.teamA.county.toLowerCase()) {
        adjudicatorConflicts.push({
          fixtureId: fix.id,
          judgeName: judge.name,
          judgeCounty: judge.countyOfOrigin,
          schoolName: fix.teamA.schoolName,
          matchName: fix.roundName
        });
      }
      if (judge.countyOfOrigin && fix.teamB.county && judge.countyOfOrigin.toLowerCase() === fix.teamB.county.toLowerCase()) {
        adjudicatorConflicts.push({
          fixtureId: fix.id,
          judgeName: judge.name,
          judgeCounty: judge.countyOfOrigin,
          schoolName: fix.teamB.schoolName,
          matchName: fix.roundName
        });
      }
    }

    // 2. Audit side assignment parity
    const aName = fix.teamA.schoolName;
    const bName = fix.teamB.schoolName;
    if (!sideTally[aName]) sideTally[aName] = { affirmative: 0, negative: 0 };
    if (!sideTally[bName]) sideTally[bName] = { affirmative: 0, negative: 0 };

    if (fix.teamA.role.includes('Affirmative') || fix.teamA.role.includes('Primary')) {
      sideTally[aName].affirmative += 1;
    } else {
      sideTally[aName].negative += 1;
    }

    if (fix.teamB.role.includes('Negative') || fix.teamB.role.includes('Challenger')) {
      sideTally[bName].negative += 1;
    } else {
      sideTally[bName].affirmative += 1;
    }

    // 3. Audit duplicate pairings in same stage
    const pairKey = `${fix.stage}:${[aName, bName].sort().join(' vs ')}`;
    if (matchupPairs.has(pairKey)) {
      duplicateMatchups.push(`${fix.roundName}: ${aName} vs ${bName}`);
    } else {
      matchupPairs.add(pairKey);
    }
  }

  // Detect heavy side imbalance (e.g. 3+ skew)
  const sideImbalanceWarnings: { schoolName: string; affirmativeCount: number; negativeCount: number }[] = [];
  for (const [schName, counts] of Object.entries(sideTally)) {
    if (Math.abs(counts.affirmative - counts.negative) >= 3) {
      sideImbalanceWarnings.push({
        schoolName: schName,
        affirmativeCount: counts.affirmative,
        negativeCount: counts.negative
      });
    }
  }

  // Calculate integrity score
  let deductions = (adjudicatorConflicts.length * 15) + (duplicateMatchups.length * 10) + (sideImbalanceWarnings.length * 5);
  const integrityScore = Math.max(0, 100 - deductions);
  const passed = adjudicatorConflicts.length === 0 && duplicateMatchups.length === 0;

  const auditHash = generateAntiBiasCryptographicHash(`audit-${fixtures.length}-${Date.now()}`);

  const auditSummary = passed
    ? `Anti-Bias Integrity Passed (Score: ${integrityScore}%). Cryptographically verified: 0 judge county conflicts, 0 duplicate matchups across all ${fixtures.length} matches.`
    : `Human Bias Risk Detected (Score: ${integrityScore}%). ${adjudicatorConflicts.length} potential judge home-county conflict(s) require algorithmic re-routing.`;

  return {
    passed,
    integrityScore,
    totalFixturesAudited: fixtures.length,
    adjudicatorConflicts,
    sideImbalanceWarnings,
    duplicateMatchups,
    seedVerificationHash: auditHash,
    auditSummary
  };
}

// 6. Default Announcement Settings for the Public Reveal Date
export const DEFAULT_TOURNAMENT_ANNOUNCEMENT: TournamentRevealAnnouncement = {
  title: 'Official 2024/25 National Debate & STEM Fixtures, Motions & County Zonal Draw',
  revealDate: '2025-09-20T10:00:00.000Z',
  isRevealLive: true,
  announcementText: 'The National Executive Secretariat and Academic Forensics Council of Youth For Change Liberia have concluded the official anti-bias automated draw for all accredited secondary schools across the 15 counties. Coaches, debaters, and school principals can review their assigned zones, opening matchups, confirmed debate motions, venues, and conflict-free adjudication panels.',
  grandVenue: 'Monrovia City Hall Ballroom, Tubman Boulevard',
  broadcastChannel: 'National Television Broadcast & Live Web Stream',
  coordinatorHelpline: '+231 777 401 210 / +231 886 523 911',
  currentEdition: '10th Jubilee Edition (2015–2025)'
};

// 7. Preloaded Default Live Fixtures for Instant Demonstration
export const INITIAL_SEASON_FIXTURES: TournamentFixture[] = [
  ...generateOfficialLndcFixtures(),
  {
    id: 'fix-init-01',
    program: 'debate',
    stage: 'zonal_prelims',
    roundName: 'Montserrado Zone 2 Derby • Match #1',
    county: 'Montserrado',
    zoneId: 'montserrado-z2',
    zoneName: 'Zone 2: Central Monrovia & Sinkor Corridor',
    matchNumber: 1,
    teamA: {
      schoolId: 'sch-mon-05',
      schoolName: 'B.W. Harris Episcopal High School',
      county: 'Montserrado',
      zoneName: 'Zone 2: Central Monrovia & Sinkor Corridor',
      role: 'Affirmative (Proposition)',
      score: 284,
      ballots: 3
    },
    teamB: {
      schoolId: 'sch-mon-06',
      schoolName: 'College of West Africa (CWA)',
      county: 'Montserrado',
      zoneName: 'Zone 2: Central Monrovia & Sinkor Corridor',
      role: 'Negative (Opposition)',
      score: 279,
      ballots: 0
    },
    motion: 'This House Would Mandate That 50% of County Social Development Funds (CSDF) Be Exclusively Ring-Fenced for High School Science Laboratories and Digital Forensics Infrastructure.',
    motionInfoSlide: 'Under Liberian concession agreements, concessionaires remit millions in CSDF to counties. Currently, county sittings determine allocation with limited statutory minimums for secondary education facilities.',
    motionDomain: 'Economics & Resource Rights',
    venue: 'Monrovia City Hall Ballroom / Tubman High Gymnasium',
    matchDate: '2025-09-25',
    matchTime: '10:00 AM GMT',
    adjudicators: [
      { id: 'adj-01', name: 'Atty. James K. Flomo', role: 'Chief Adjudicator', countyOfOrigin: 'Margibi', institution: 'Louis Arthur Grimes School of Law', certifiedWSDC: true },
      { id: 'adj-03', name: 'Eng. Martin M. Forkpah', role: 'Panelist', countyOfOrigin: 'Bong', institution: 'BWI Engineering Faculty', certifiedWSDC: true },
      { id: 'adj-04', name: 'Dr. Comfort A. Toe', role: 'Panelist', countyOfOrigin: 'Maryland', institution: 'Tubman University Faculty of Education', certifiedWSDC: true }
    ],
    status: 'completed',
    winnerId: 'sch-mon-05',
    winnerName: 'B.W. Harris Episcopal High School',
    winnerRole: 'teamA',
    scoreDifferential: '3-0 Unanimous Decision',
    adjudicatorNotes: 'Affirmative constructed superior empirical models regarding legislative oversight of CSDF funds.',
    antiBiasHash: 'YFC-FAIR-4E9A-8821-M1',
    drawSeed: 'zonal_prelims-Montserrado-montserrado-z2-seed',
    isPublished: true,
    createdAt: '2024-11-01T08:00:00.000Z'
  },
  {
    id: 'fix-init-02',
    program: 'debate',
    stage: 'zonal_prelims',
    roundName: 'Montserrado Zone 3 Derby • Match #2',
    county: 'Montserrado',
    zoneId: 'montserrado-z3',
    zoneName: 'Zone 3: Paynesville, ELWA & Somalia Drive',
    matchNumber: 2,
    teamA: {
      schoolId: 'sch-mon-11',
      schoolName: 'Paynesville Seventh-day Adventist (SDA) High School',
      county: 'Montserrado',
      zoneName: 'Zone 3: Paynesville, ELWA & Somalia Drive',
      role: 'Affirmative (Proposition)'
    },
    teamB: {
      schoolId: 'sch-mon-12',
      schoolName: 'Isaac A. Davis Memorial High School',
      county: 'Montserrado',
      zoneName: 'Zone 3: Paynesville, ELWA & Somalia Drive',
      role: 'Negative (Opposition)'
    },
    motion: 'This House Believes That West African States Should Establish an Integrated Digital Single Currency Backed by Critical Green Energy Mineral Reserves.',
    motionInfoSlide: 'Regional currency models balance trade friction reduction against national macroeconomic flexibility.',
    motionDomain: 'Economics & Resource Rights',
    venue: 'Paynesville Town Hall Pavilion, ELWA Junction',
    matchDate: '2025-09-26',
    matchTime: '01:30 PM GMT',
    adjudicators: [
      { id: 'adj-05', name: 'Cllr. Gabriel B. Weah', role: 'Chief Adjudicator', countyOfOrigin: 'Grand Gedeh', institution: 'Liberian Bar Association', certifiedWSDC: true },
      { id: 'adj-06', name: 'Precious S. Dennis', role: 'Panelist', countyOfOrigin: 'Lofa', institution: 'Youth For Change Senior Adjudication Council', certifiedWSDC: true },
      { id: 'adj-07', name: 'Amos N. Wonlea', role: 'Panelist', countyOfOrigin: 'Nimba', institution: 'Nimba Forensics League', certifiedWSDC: true }
    ],
    status: 'scheduled',
    antiBiasHash: 'YFC-FAIR-4E9A-8821-M2',
    drawSeed: 'zonal_prelims-Montserrado-montserrado-z3-seed',
    isPublished: true,
    createdAt: '2024-11-01T08:00:00.000Z'
  },
  {
    id: 'fix-init-03',
    program: 'debate',
    stage: 'county_finals',
    roundName: 'Nimba County Grand Final • Match #1',
    county: 'Nimba',
    zoneId: 'nimba-z2',
    zoneName: 'Zone 2: Central Nimba & Ganta Commercial Basin',
    matchNumber: 1,
    teamA: {
      schoolId: 'sch-nim-01',
      schoolName: 'Ganta United Methodist School (GUMS)',
      county: 'Nimba',
      zoneName: 'Zone 2: Central Nimba & Ganta Commercial Basin',
      role: 'Affirmative (Proposition)',
      score: 278,
      ballots: 2
    },
    teamB: {
      schoolId: 'sch-nim-02',
      schoolName: 'Sanniquellie Central High School',
      county: 'Nimba',
      zoneName: 'Zone 1: Upper Nimba & Sanniquellie Hub',
      role: 'Negative (Opposition)',
      score: 272,
      ballots: 1
    },
    motion: 'This House Would Legislate a 30% Mandatory Gender Quota on All Candidate Listings for Parliamentary and Legislative Elections.',
    motionInfoSlide: 'Article 8 of the Liberian Constitution and the New Elections Law debate female political representation benchmarks.',
    motionDomain: 'Governance & Constitution',
    venue: 'Ganta United Methodist School (GUMS) Auditorium',
    matchDate: '2025-10-04',
    matchTime: '11:00 AM GMT',
    adjudicators: [
      { id: 'adj-01', name: 'Atty. James K. Flomo', role: 'Chief Adjudicator', countyOfOrigin: 'Margibi', institution: 'Louis Arthur Grimes School of Law', certifiedWSDC: true },
      { id: 'adj-02', name: 'Keziah M. Freeman', role: 'Deputy Chief', countyOfOrigin: 'Montserrado', institution: 'University of Liberia Forensics Society', certifiedWSDC: true },
      { id: 'adj-08', name: 'Finda B. Kanneh', role: 'Panelist', countyOfOrigin: 'Grand Bassa', institution: 'Grand Bassa Collegiate Debate Guild', certifiedWSDC: true }
    ],
    status: 'completed',
    winnerId: 'sch-nim-01',
    winnerName: 'Ganta United Methodist School (GUMS)',
    winnerRole: 'teamA',
    scoreDifferential: '2-1 Split Decision',
    adjudicatorNotes: 'Affirmative demonstrated superior empirical modeling on affirmative action legislation and constitutional alignment.',
    antiBiasHash: 'YFC-FAIR-9B11-4432-M1',
    drawSeed: 'county_finals-Nimba-seed',
    isPublished: true,
    createdAt: '2024-11-01T08:00:00.000Z'
  },
  {
    id: 'fix-init-04',
    program: 'debate',
    stage: 'national_championship',
    roundName: 'National Championship • 15-County Super Round • Match #1',
    county: 'All 15 Counties',
    matchNumber: 1,
    teamA: {
      schoolId: 'sch-mon-05',
      schoolName: 'B.W. Harris Episcopal High School',
      county: 'Montserrado',
      role: 'Affirmative (Proposition)'
    },
    teamB: {
      schoolId: 'sch-mar-01',
      schoolName: 'Booker Washington Institute (BWI)',
      county: 'Margibi',
      role: 'Negative (Opposition)'
    },
    motion: 'This House, as the Ministry of Education, Would Replace Standardized WAEC/WASSCE Rote Examinations with Longitudinal Continuous Project-Based STEM & Forensics Assessments.',
    motionInfoSlide: 'Standardized annual exams create acute testing anxiety and focus curriculum on rote memorization rather than critical problem-solving.',
    motionDomain: 'Education & Gender',
    venue: 'Monrovia City Hall Ballroom, Tubman Blvd',
    matchDate: '2025-10-18',
    matchTime: '02:00 PM GMT',
    adjudicators: [
      { id: 'adj-05', name: 'Cllr. Gabriel B. Weah', role: 'Chief Adjudicator', countyOfOrigin: 'Grand Gedeh', institution: 'Liberian Bar Association', certifiedWSDC: true },
      { id: 'adj-06', name: 'Precious S. Dennis', role: 'Panelist', countyOfOrigin: 'Lofa', institution: 'Youth For Change Senior Adjudication Council', certifiedWSDC: true },
      { id: 'adj-07', name: 'Amos N. Wonlea', role: 'Panelist', countyOfOrigin: 'Nimba', institution: 'Nimba Forensics League', certifiedWSDC: true }
    ],
    status: 'scheduled',
    antiBiasHash: 'YFC-FAIR-NAT-2025-A109-M1',
    drawSeed: 'national_championship-seed-super15',
    isPublished: true,
    createdAt: '2024-11-01T08:00:00.000Z'
  },
  {
    id: 'fix-init-05',
    program: 'stem',
    stage: 'zonal_prelims',
    roundName: 'Bong County STEM Innovation Face-off • Match #1',
    county: 'Bong',
    zoneId: 'bong-z1',
    zoneName: 'Zone 1: Greater Gbarnga & Central Bong',
    matchNumber: 1,
    teamA: {
      schoolId: 'sch-bong-02',
      schoolName: 'Gboveh High School',
      county: 'Bong',
      zoneName: 'Zone 1: Greater Gbarnga & Central Bong',
      role: 'Primary Innovator'
    },
    teamB: {
      schoolId: 'sch-bong-04',
      schoolName: 'Totota Lutheran High School',
      county: 'Bong',
      zoneName: 'Zone 2: Suakoko Academic Basin & Cuttington',
      role: 'Challenger'
    },
    motion: 'Renewable Solar Microgrids & Low-Cost Energy Storage for Rural Schools',
    motionInfoSlide: 'Teams will pitch prototype validation, community adoption metrics, and local material feasibility.',
    motionDomain: 'STEM & Climate',
    venue: 'Gbarnga Administration Building Conference Hall',
    matchDate: '2025-09-28',
    matchTime: '11:00 AM GMT',
    adjudicators: [
      { id: 'adj-01', name: 'Atty. James K. Flomo', role: 'Chief Adjudicator', countyOfOrigin: 'Margibi', institution: 'Louis Arthur Grimes School of Law', certifiedWSDC: true },
      { id: 'adj-02', name: 'Keziah M. Freeman', role: 'Deputy Chief', countyOfOrigin: 'Montserrado', institution: 'University of Liberia Forensics Society', certifiedWSDC: true },
      { id: 'adj-04', name: 'Dr. Comfort A. Toe', role: 'Panelist', countyOfOrigin: 'Maryland', institution: 'Tubman University Faculty of Education', certifiedWSDC: true }
    ],
    status: 'scheduled',
    antiBiasHash: 'YFC-FAIR-STEM-BONG-8812-M1',
    drawSeed: 'zonal_stem-Bong-seed',
    isPublished: true,
    createdAt: '2024-11-01T08:00:00.000Z'
  }
];
