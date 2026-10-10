import { jsPDF } from 'jspdf';
import { SchoolRank, CountyPerformance } from '../types';
import { HALL_OF_FAME_WINNERS } from '../data/schoolData';
import { DEBATE_EDITIONS } from '../data/debateData';

export interface ExportSchoolsOptions {
  countyFilter?: string;
  searchQuery?: string;
  sortField?: 'points' | 'titles';
  notes?: string;
  generatedBy?: string;
}

export interface ExportCountiesOptions {
  notes?: string;
  generatedBy?: string;
}

export interface ExportHallOfFameOptions {
  notes?: string;
  generatedBy?: string;
}

export interface ExportChampionshipOptions {
  notes?: string;
  generatedBy?: string;
}

// Format helpers
const formatDate = (date: Date = new Date()): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatShortDate = (date: Date = new Date()): string => {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Draws the official standardized YOUTH FOR CHANGE .INC header banner across the top of an A4 page
 */
function drawHeaderBanner(
  doc: jsPDF, 
  title: string, 
  subtitle: string, 
  scopeText: string,
  pageWidth: number
): number {
  // Top Forest Green Header Bar
  doc.setFillColor(6, 78, 59); // #064e3b deep emerald
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Gold accent divider stripe
  doc.setFillColor(217, 119, 6); // #d97706 gold
  doc.rect(0, 26, pageWidth, 1.8, 'F');

  // Sub-stripe Liberian Crimson Red
  doc.setFillColor(153, 0, 31); // #99001f red
  doc.rect(0, 27.8, pageWidth, 0.8, 'F');

  // National Republic Motto / Category
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(253, 224, 71); // yellow-300
  doc.text('REPUBLIC OF LIBERIA • OFFICIAL YOUTH FORENSICS & STEM ARCHIVE', 14, 8);

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text(title, 14, 15);

  // Subtitle / Organization branding
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 250, 229); // emerald-100
  doc.text(subtitle, 14, 21);

  // Right-side Verification & Date Stamp in header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('ACCREDITED OFFICIAL RECORD', pageWidth - 14, 8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(209, 250, 229);
  doc.text(`Generated: ${formatShortDate()}`, pageWidth - 14, 14, { align: 'right' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(253, 224, 71);
  doc.text('Valid for Offline Viewing & Forensics Audit', pageWidth - 14, 20, { align: 'right' });

  // Secondary Metadata Ribbon
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(0, 28.6, pageWidth, 8, 'F');
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.line(0, 36.6, pageWidth, 36.6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(`OFFICIAL SCOPE: ${scopeText.toUpperCase()}`, 14, 33.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Official Secretariat Registry: YFC-LEAD-${new Date().getFullYear()}`, pageWidth - 14, 33.5, { align: 'right' });

  return 42; // Returns next available Y coordinate
}

/**
 * Draws standard page footer with page numbers, secretariat contact, and authenticity stamp
 */
function drawPageFooter(
  doc: jsPDF, 
  pageNum: number, 
  totalPages: number, 
  pageWidth: number, 
  pageHeight: number,
  verificationCode: string
): void {
  const footerY = pageHeight - 12;

  // Thin separator line
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.line(14, footerY - 2, pageWidth - 14, footerY - 2);

  // Left: Organization signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(6, 78, 59); // emerald-900
  doc.text('YOUTH FOR CHANGE .INC LIBERIA', 14, footerY + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('12th Street Sinkor, Monrovia, Liberia • +231 777 401 210 • secretariat@youthforchange.org.lr • youthforchange.org.lr', 14, footerY + 6);

  // Center: Security Code
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(153, 0, 31);
  doc.text(`Security Verification Hash: ${verificationCode}`, pageWidth / 2, footerY + 3, { align: 'center' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.setTextColor(148, 163, 184);
  doc.text('Official offline document generated from live national standings database.', pageWidth / 2, footerY + 7, { align: 'center' });

  // Right: Page count
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 14, footerY + 4, { align: 'right' });
}

/**
 * Draws four executive summary KPI cards at the top of the leaderboard document
 */
function drawKpiCards(
  doc: jsPDF, 
  cards: { label: string; value: string; subtext: string; color?: [number, number, number] }[],
  startY: number,
  pageWidth: number
): number {
  const margin = 14;
  const cardGap = 4;
  const totalGap = cardGap * (cards.length - 1);
  const cardWidth = (pageWidth - (margin * 2) - totalGap) / cards.length;
  const cardHeight = 15;

  cards.forEach((card, index) => {
    const cardX = margin + (index * (cardWidth + cardGap));

    // Card background
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(cardX, startY, cardWidth, cardHeight, 1.5, 1.5, 'F');

    // Card border
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, startY, cardWidth, cardHeight, 1.5, 1.5, 'D');

    // Top accent bar
    const barColor = card.color || [6, 78, 59];
    doc.setFillColor(barColor[0], barColor[1], barColor[2]);
    doc.roundedRect(cardX, startY, cardWidth, 1.2, 0.6, 0.6, 'F');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(card.label.toUpperCase(), cardX + 3, startY + 4.5);

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42); // slate-900
    const valueText = doc.splitTextToSize(card.value, cardWidth - 6);
    doc.text(valueText[0] || card.value, cardX + 3, startY + 9.5);

    // Subtext
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(card.subtext, cardX + 3, startY + 13.2);
  });

  return startY + cardHeight + 5;
}

/**
 * EXPORT 1: National High Schools Leaderboard (Current View or Filtered)
 */
export function exportSchoolsLeaderboardPdf(
  schools: SchoolRank[], 
  options: ExportSchoolsOptions = {}
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const verificationCode = `YFC-SCH-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 8999 + 1000)}`;

  const countyFilter = options.countyFilter || 'All';
  const searchQuery = options.searchQuery || '';
  const sortField = options.sortField || 'points';

  const scopeDetails = [
    countyFilter !== 'All' ? `County: ${countyFilter}` : 'Counties: All 15',
    searchQuery ? `Search: "${searchQuery}"` : null,
    sortField === 'points' ? 'Sorted by: Total Points' : 'Sorted by: National Trophies',
    `Total Records: ${schools.length}`
  ].filter(Boolean).join(' • ');

  // 1. Header Banner
  let currentY = drawHeaderBanner(
    doc,
    'NATIONAL HIGH SCHOOLS FORENSICS & STEM LEADERBOARD',
    'Official Cumulative Academic League Standings • Youth For Change .INC Liberia',
    scopeDetails,
    pageWidth
  );

  // 2. Compute KPI Metrics
  const totalPoints = schools.reduce((acc, s) => acc + s.totalPoints, 0);
  const totalDebateTitles = schools.reduce((acc, s) => acc + s.debateTitles, 0);
  const totalStemTitles = schools.reduce((acc, s) => acc + s.stemTitles, 0);
  const topSchool = schools[0];

  const kpis = [
    {
      label: 'Rank #1 Leader',
      value: topSchool ? topSchool.name.substring(0, 26) : 'N/A',
      subtext: topSchool ? `${topSchool.totalPoints} League Pts • ${topSchool.county}` : 'No records found',
      color: [217, 119, 6] as [number, number, number] // Gold
    },
    {
      label: 'Accredited Schools',
      value: `${schools.length} High Schools`,
      subtext: countyFilter !== 'All' ? `${countyFilter} County Delegation` : 'Active across Liberia',
      color: [6, 78, 59] as [number, number, number] // Emerald
    },
    {
      label: 'Cumulative League Points',
      value: `${totalPoints.toLocaleString()} Points`,
      subtext: 'Calculated across 10 competitive seasons',
      color: [2, 132, 199] as [number, number, number] // Sky
    },
    {
      label: 'Trophies Represented',
      value: `${totalDebateTitles} Debate • ${totalStemTitles} STEM`,
      subtext: `${totalDebateTitles + totalStemTitles} National Championship Titles`,
      color: [147, 51, 234] as [number, number, number] // Purple
    }
  ];

  currentY = drawKpiCards(doc, kpis, currentY, pageWidth);

  // 3. Optional Custom Notes Banner
  if (options.notes) {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.roundedRect(14, currentY, pageWidth - 28, 8, 1, 1, 'F');
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, currentY, pageWidth - 28, 8, 1, 1, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(146, 64, 14);
    doc.text('OFFICIAL NOTE: ', 17, currentY + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(180, 83, 9);
    doc.text(options.notes.substring(0, 180), 38, currentY + 5.2);

    currentY += 11;
  }

  // 4. Table Header
  const tableMargin = 14;
  const colWidths = {
    rank: 14,
    name: 86,
    countyCity: 42,
    debateTitles: 25,
    stemTitles: 25,
    finals: 22,
    points: 30,
    motto: 25
  };

  const drawTableHeader = (y: number) => {
    doc.setFillColor(6, 78, 59); // Deep emerald header
    doc.rect(tableMargin, y, pageWidth - (tableMargin * 2), 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let x = tableMargin + 2;
    doc.text('RANK', x + 2, y + 5.2);
    x += colWidths.rank;

    doc.text('HIGH SCHOOL NAME & ACCREDITATION', x, y + 5.2);
    x += colWidths.name;

    doc.text('COUNTY / CITY', x, y + 5.2);
    x += colWidths.countyCity;

    doc.text('DEBATE TITLES', x + 2, y + 5.2);
    x += colWidths.debateTitles;

    doc.text('STEM TITLES', x + 2, y + 5.2);
    x += colWidths.stemTitles;

    doc.text('FINALS', x + 2, y + 5.2);
    x += colWidths.finals;

    doc.text('LEAGUE POINTS', x + colWidths.points - 4, y + 5.2, { align: 'right' });
  };

  drawTableHeader(currentY);
  currentY += 8;

  // 5. Table Rows
  const rowHeight = 7.5;
  let pageNum = 1;
  const estimatedRowsPerPage = 14;
  const totalPagesEstimate = Math.max(1, Math.ceil(schools.length / estimatedRowsPerPage));

  schools.forEach((school, index) => {
    // Check if new page is needed
    if (currentY + rowHeight > pageHeight - 20) {
      drawPageFooter(doc, pageNum, totalPagesEstimate, pageWidth, pageHeight, verificationCode);
      doc.addPage();
      pageNum++;

      currentY = drawHeaderBanner(
        doc,
        'NATIONAL HIGH SCHOOLS FORENSICS & STEM LEADERBOARD (CONT.)',
        'Official Cumulative Academic League Standings • Youth For Change .INC Liberia',
        scopeDetails,
        pageWidth
      );
      drawTableHeader(currentY);
      currentY += 8;
    }

    // Zebra striping
    const isEven = index % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(tableMargin, currentY, pageWidth - (tableMargin * 2), rowHeight, 'F');

    // Row border bottom
    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(tableMargin, currentY + rowHeight, pageWidth - tableMargin, currentY + rowHeight);

    let x = tableMargin + 2;

    // Rank Badge
    if (index === 0) {
      doc.setFillColor(253, 224, 71); // Gold badge
      doc.roundedRect(x, currentY + 1.2, 9, 5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(69, 26, 3);
      doc.text('#1', x + 4.5, currentY + 4.8, { align: 'center' });
    } else if (index === 1) {
      doc.setFillColor(226, 232, 240); // Silver badge
      doc.roundedRect(x, currentY + 1.2, 9, 5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text('#2', x + 4.5, currentY + 4.8, { align: 'center' });
    } else if (index === 2) {
      doc.setFillColor(254, 215, 170); // Bronze badge
      doc.roundedRect(x, currentY + 1.2, 9, 5, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(124, 45, 18);
      doc.text('#3', x + 4.5, currentY + 4.8, { align: 'center' });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(String(index + 1), x + 4.5, currentY + 4.8, { align: 'center' });
    }
    x += colWidths.rank;

    // School Name & Motto
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(school.name.substring(0, 48), x, currentY + 3.8);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(school.motto ? `"${school.motto.substring(0, 45)}"` : 'Accredited Member High School', x, currentY + 6.6);
    x += colWidths.name;

    // County & City
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text(`${school.county} County`, x, currentY + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(school.city, x, currentY + 6.6);
    x += colWidths.countyCity;

    // Debate Titles
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    if (school.debateTitles > 0) {
      doc.setTextColor(180, 83, 9); // amber-700
      doc.text(`[Trophy] ${school.debateTitles} Wins`, x + 2, currentY + 4.8);
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('-', x + 8, currentY + 4.8);
    }
    x += colWidths.debateTitles;

    // STEM Titles
    if (school.stemTitles > 0) {
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text(`[STEM] ${school.stemTitles} Wins`, x + 2, currentY + 4.8);
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('-', x + 8, currentY + 4.8);
    }
    x += colWidths.stemTitles;

    // Finals
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(school.finalAppearances > 0 ? `${school.finalAppearances} Final${school.finalAppearances > 1 ? 's' : ''}` : '-', x + 2, currentY + 4.8);
    x += colWidths.finals;

    // Points
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(6, 78, 59); // deep emerald
    doc.text(`${school.totalPoints.toLocaleString()} pts`, x + colWidths.points - 4, currentY + 4.8, { align: 'right' });

    currentY += rowHeight;
  });

  // 6. Draw footer on final page
  drawPageFooter(doc, pageNum, pageNum, pageWidth, pageHeight, verificationCode);

  // 7. Save document
  const safeCounty = countyFilter !== 'All' ? `_${countyFilter.replace(/\s+/g, '_')}` : '';
  const filename = `YFC_Liberia_Schools_Leaderboard${safeCounty}_${new Date().getFullYear()}.pdf`;
  doc.save(filename);
}

/**
 * EXPORT 2: 15 Counties Performance Matrix & Regional Standings PDF
 */
export function exportCountiesStandingsPdf(
  counties: CountyPerformance[], 
  options: ExportCountiesOptions = {}
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const verificationCode = `YFC-CTY-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 8999 + 1000)}`;

  const totalSchools = counties.reduce((acc, c) => acc + c.activeSchools, 0);
  const totalDebaters = counties.reduce((acc, c) => acc + c.totalDebaters, 0);
  const totalDebateTitles = counties.reduce((acc, c) => acc + c.debateTitles, 0);
  const totalStemTitles = counties.reduce((acc, c) => acc + c.stemTitles, 0);

  let currentY = drawHeaderBanner(
    doc,
    'LIBERIA 15 COUNTIES CIVIC & FORENSICS PERFORMANCE MATRIX',
    'Regional Youth Empowerment, High School Inclusivity & Championship Trophy Distribution',
    `Decentralized Reach: 15/15 Counties • ${totalSchools} Active Schools • ${totalDebaters.toLocaleString()} Youth Reached`,
    pageWidth
  );

  // KPI Metrics Row
  const kpis = [
    {
      label: 'National Coverage',
      value: '15 / 15 Counties (100%)',
      subtext: 'Full decentralization across all political sub-divisions',
      color: [6, 78, 59] as [number, number, number]
    },
    {
      label: 'Active High Schools',
      value: `${totalSchools} High Schools`,
      subtext: 'Registered & competing forensic delegations',
      color: [2, 132, 199] as [number, number, number]
    },
    {
      label: 'Debaters & STEM Innovators',
      value: `${totalDebaters.toLocaleString()}+ Youth`,
      subtext: 'Trained in argumentation, logic, and STEM design',
      color: [147, 51, 234] as [number, number, number]
    },
    {
      label: 'Decade Titles Distributed',
      value: `${totalDebateTitles} Debate • ${totalStemTitles} STEM`,
      subtext: 'Decade of Champions (2015–2025)',
      color: [217, 119, 6] as [number, number, number]
    }
  ];

  currentY = drawKpiCards(doc, kpis, currentY, pageWidth);

  // Table Column Headers
  const tableMargin = 14;
  const colWidths = {
    rank: 12,
    county: 42,
    capital: 36,
    schools: 24,
    debate: 22,
    stem: 22,
    debaters: 25,
    coordinator: 45,
    contact: 41
  };

  const drawTableHeader = (y: number) => {
    doc.setFillColor(6, 78, 59);
    doc.rect(tableMargin, y, pageWidth - (tableMargin * 2), 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let x = tableMargin + 2;
    doc.text('#', x + 2, y + 5.2);
    x += colWidths.rank;

    doc.text('COUNTY', x, y + 5.2);
    x += colWidths.county;

    doc.text('CAPITAL SEAT', x, y + 5.2);
    x += colWidths.capital;

    doc.text('SCHOOLS', x + 2, y + 5.2);
    x += colWidths.schools;

    doc.text('DEBATE 🏆', x + 2, y + 5.2);
    x += colWidths.debate;

    doc.text('STEM 🔬', x + 2, y + 5.2);
    x += colWidths.stem;

    doc.text('STUDENTS', x + 2, y + 5.2);
    x += colWidths.debaters;

    doc.text('COUNTY COORDINATOR', x, y + 5.2);
    x += colWidths.coordinator;

    doc.text('OFFICIAL CONTACT', x, y + 5.2);
  };

  drawTableHeader(currentY);
  currentY += 8;

  const rowHeight = 7.2;
  let pageNum = 1;

  // Sort counties by impact (activeSchools + totalDebaters)
  const sortedCounties = [...counties].sort((a, b) => b.activeSchools - a.activeSchools);

  sortedCounties.forEach((county, idx) => {
    if (currentY + rowHeight > pageHeight - 20) {
      drawPageFooter(doc, pageNum, 2, pageWidth, pageHeight, verificationCode);
      doc.addPage();
      pageNum++;
      currentY = drawHeaderBanner(
        doc,
        'LIBERIA 15 COUNTIES CIVIC & FORENSICS PERFORMANCE MATRIX (CONT.)',
        'Regional Youth Empowerment, High School Inclusivity & Championship Trophy Distribution',
        `Decentralized Reach: 15/15 Counties • Page ${pageNum}`,
        pageWidth
      );
      drawTableHeader(currentY);
      currentY += 8;
    }

    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(tableMargin, currentY, pageWidth - (tableMargin * 2), rowHeight, 'F');

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(tableMargin, currentY + rowHeight, pageWidth - tableMargin, currentY + rowHeight);

    let x = tableMargin + 2;

    // Rank Number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(String(idx + 1), x + 2, currentY + 4.8);
    x += colWidths.rank;

    // County Name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`${county.county} County`, x, currentY + 4.8);
    x += colWidths.county;

    // Capital
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);
    doc.text(county.capital, x, currentY + 4.8);
    x += colWidths.capital;

    // Schools
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.text(`${county.activeSchools} schools`, x + 2, currentY + 4.8);
    x += colWidths.schools;

    // Debate Titles
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(county.debateTitles > 0 ? 180 : 148, county.debateTitles > 0 ? 83 : 163, county.debateTitles > 0 ? 9 : 184);
    doc.text(county.debateTitles > 0 ? `${county.debateTitles} Titles` : '-', x + 2, currentY + 4.8);
    x += colWidths.debate;

    // STEM Titles
    doc.setTextColor(county.stemTitles > 0 ? 5 : 148, county.stemTitles > 0 ? 150 : 163, county.stemTitles > 0 ? 105 : 184);
    doc.text(county.stemTitles > 0 ? `${county.stemTitles} Titles` : '-', x + 2, currentY + 4.8);
    x += colWidths.stem;

    // Debaters
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`${county.totalDebaters} youth`, x + 2, currentY + 4.8);
    x += colWidths.debaters;

    // Coordinator
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    doc.text(county.coordinator, x, currentY + 4.8);
    x += colWidths.coordinator;

    // Contact
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(county.coordinatorContact, x, currentY + 4.8);

    currentY += rowHeight;
  });

  drawPageFooter(doc, pageNum, pageNum, pageWidth, pageHeight, verificationCode);
  doc.save(`YFC_Liberia_15_Counties_Performance_Matrix_${new Date().getFullYear()}.pdf`);
}

/**
 * EXPORT 3: Decade Hall of Fame Champions (2015 - 2025) PDF
 */
export function exportHallOfFamePdf(
  winners: typeof HALL_OF_FAME_WINNERS = HALL_OF_FAME_WINNERS, 
  options: ExportHallOfFameOptions = {}
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const verificationCode = `YFC-HOF-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 8999 + 1000)}`;

  let currentY = drawHeaderBanner(
    doc,
    'DECADE OF CHAMPIONS: HALL OF FAME ROLL OF HONOR (2015–2025)',
    'Official Roll of High School Forensics Champions, Tournament MVPs & STEM Laureates',
    'National Tournament Records Archive • Youth For Change .INC Liberia',
    pageWidth
  );

  const kpis = [
    {
      label: 'Championship Editions',
      value: '10 Flagship Editions',
      subtext: 'From 2015 inaugural to 2025 Jubilee',
      color: [217, 119, 6] as [number, number, number]
    },
    {
      label: 'Debate Champions Crowned',
      value: '10 High Schools',
      subtext: 'Accredited national title holders',
      color: [6, 78, 59] as [number, number, number]
    },
    {
      label: 'STEM Laureates',
      value: '6 Innovation Champions',
      subtext: 'Awarded since STEM launch in 2018',
      color: [5, 150, 105] as [number, number, number]
    },
    {
      label: 'National Orator MVPs',
      value: '10 Best Speakers',
      subtext: 'Awarded highest individual speaker points',
      color: [147, 51, 234] as [number, number, number]
    }
  ];

  currentY = drawKpiCards(doc, kpis, currentY, pageWidth);

  const tableMargin = 14;
  const colWidths = {
    year: 24,
    debateChamp: 65,
    runnerUp: 55,
    mvp: 55,
    stemChamp: 45,
    score: 25
  };

  const drawTableHeader = (y: number) => {
    doc.setFillColor(6, 78, 59);
    doc.rect(tableMargin, y, pageWidth - (tableMargin * 2), 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let x = tableMargin + 2;
    doc.text('YEAR / EDITION', x, y + 5.2);
    x += colWidths.year;

    doc.text('DEBATE CHAMPION (AFFIRMATIVE)', x, y + 5.2);
    x += colWidths.debateChamp;

    doc.text('RUNNER-UP (OPPOSITION)', x, y + 5.2);
    x += colWidths.runnerUp;

    doc.text('TOURNAMENT MVP / BEST SPEAKER', x, y + 5.2);
    x += colWidths.mvp;

    doc.text('STEM CHAMPION', x, y + 5.2);
  };

  drawTableHeader(currentY);
  currentY += 8;

  const rowHeight = 11;
  let pageNum = 1;

  winners.forEach((w, idx) => {
    if (currentY + rowHeight > pageHeight - 20) {
      drawPageFooter(doc, pageNum, 2, pageWidth, pageHeight, verificationCode);
      doc.addPage();
      pageNum++;
      currentY = drawHeaderBanner(
        doc,
        'DECADE OF CHAMPIONS: HALL OF FAME ROLL OF HONOR (CONT.)',
        'Official Roll of High School Forensics Champions, Tournament MVPs & STEM Laureates',
        `Hall of Fame Archive • Page ${pageNum}`,
        pageWidth
      );
      drawTableHeader(currentY);
      currentY += 8;
    }

    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(tableMargin, currentY, pageWidth - (tableMargin * 2), rowHeight, 'F');

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(tableMargin, currentY + rowHeight, pageWidth - tableMargin, currentY + rowHeight);

    let x = tableMargin + 2;

    // Year
    doc.setFillColor(254, 243, 199);
    doc.roundedRect(x, currentY + 2, 20, 5.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14);
    doc.text(w.year, x + 10, currentY + 5.8, { align: 'center' });
    x += colWidths.year;

    // Champion
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.text(w.debateChampion, x, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${w.debateCounty} County • Grand Champion`, x, currentY + 8.5);
    x += colWidths.debateChamp;

    // Runner Up
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(w.runnerUp || 'N/A', x, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(w.runnerUpCounty ? `${w.runnerUpCounty} County` : '', x, currentY + 8.5);
    x += colWidths.runnerUp;

    // Best Speaker MVP
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9);
    doc.text(w.bestSpeaker, x, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Tournament MVP Orator', x, currentY + 8.5);
    x += colWidths.mvp;

    // STEM Champion
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(w.stemChampion !== 'N/A' ? 5 : 148, w.stemChampion !== 'N/A' ? 150 : 163, w.stemChampion !== 'N/A' ? 105 : 184);
    doc.text(w.stemChampion !== 'N/A' ? w.stemChampion : 'Inaugurated 2018', x, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(w.stemCounty !== 'N/A' ? `${w.stemCounty} County` : 'STEM Challenge', x, currentY + 8.5);

    currentY += rowHeight;
  });

  drawPageFooter(doc, pageNum, pageNum, pageWidth, pageHeight, verificationCode);
  doc.save(`YFC_Liberia_Hall_of_Fame_Champions_2015_2025.pdf`);
}

/**
 * EXPORT 4: Championship Finals Historical Scorecards PDF
 */
export function exportChampionshipResultsPdf(
  editions: any[] | Record<string, any> = Object.values(DEBATE_EDITIONS), 
  options: ExportChampionshipOptions = {}
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const rawEditionsList: any[] = Array.isArray(editions) ? editions : Object.values(editions);
  const pageWidth = 297;
  const pageHeight = 210;
  const verificationCode = `YFC-FIN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 8999 + 1000)}`;

  let currentY = drawHeaderBanner(
    doc,
    'CHAMPIONSHIP FINALS HISTORICAL SCORECARDS & MOTIONS ARCHIVE',
    'Grand Finals Panels Decisions, Affirmative vs. Opposition Verdicts & Championship Motions',
    'Accredited Forensics Adjudication Ledger • Youth For Change .INC Liberia',
    pageWidth
  );

  const completedEditions = rawEditionsList.filter(e => e.year !== 'Future' && e.championSchool);

  const kpis = [
    {
      label: 'Accredited Final Matches',
      value: `${completedEditions.length} Grand Finals`,
      subtext: 'Audited by Chief Adjudication Panels',
      color: [6, 78, 59] as [number, number, number]
    },
    {
      label: 'National Championship Debates',
      value: '10 Flagship Debates',
      subtext: 'Oxford-style parliamentary debates',
      color: [2, 132, 199] as [number, number, number]
    },
    {
      label: 'Participating High Schools',
      value: '182 High Schools',
      subtext: 'Across preliminary & knockout rounds',
      color: [147, 51, 234] as [number, number, number]
    },
    {
      label: 'National Coverage',
      value: '15 / 15 Counties',
      subtext: 'Decentralized county champions represented',
      color: [217, 119, 6] as [number, number, number]
    }
  ];

  currentY = drawKpiCards(doc, kpis, currentY, pageWidth);

  const tableMargin = 14;
  const colWidths = {
    edition: 28,
    champ: 60,
    runner: 55,
    score: 24,
    motion: 102
  };

  const drawTableHeader = (y: number) => {
    doc.setFillColor(6, 78, 59);
    doc.rect(tableMargin, y, pageWidth - (tableMargin * 2), 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);

    let x = tableMargin + 2;
    doc.text('EDITION / YEAR', x, y + 5.2);
    x += colWidths.edition;

    doc.text('CHAMPION (AFFIRMATIVE)', x, y + 5.2);
    x += colWidths.champ;

    doc.text('RUNNER-UP (OPPOSITION)', x, y + 5.2);
    x += colWidths.runner;

    doc.text('FINAL VERDICT', x, y + 5.2);
    x += colWidths.score;

    doc.text('GRAND FINAL POLICY MOTION', x, y + 5.2);
  };

  drawTableHeader(currentY);
  currentY += 8;

  const rowHeight = 11.5;
  let pageNum = 1;

  completedEditions.forEach((ed, idx) => {
    if (currentY + rowHeight > pageHeight - 20) {
      drawPageFooter(doc, pageNum, 2, pageWidth, pageHeight, verificationCode);
      doc.addPage();
      pageNum++;
      currentY = drawHeaderBanner(
        doc,
        'CHAMPIONSHIP FINALS HISTORICAL SCORECARDS (CONT.)',
        'Grand Finals Panels Decisions, Affirmative vs. Opposition Verdicts & Championship Motions',
        `Championship Scorecards • Page ${pageNum}`,
        pageWidth
      );
      drawTableHeader(currentY);
      currentY += 8;
    }

    const isEven = idx % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(tableMargin, currentY, pageWidth - (tableMargin * 2), rowHeight, 'F');

    doc.setDrawColor(241, 245, 249);
    doc.setLineWidth(0.2);
    doc.line(tableMargin, currentY + rowHeight, pageWidth - tableMargin, currentY + rowHeight);

    let x = tableMargin + 2;

    // Edition
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`${ed.year} Final`, x, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(ed.title ? ed.title.substring(0, 18) : 'Championship', x, currentY + 8.5);
    x += colWidths.edition;

    // Champion
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.text(ed.championSchool || 'N/A', x, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${ed.championCounty || 'Liberia'} County • Winner`, x, currentY + 8.5);
    x += colWidths.champ;

    // Runner-Up
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text(ed.runnerUpSchool || 'N/A', x, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`${ed.runnerUpCounty || 'Liberia'} County • Finalist`, x, currentY + 8.5);
    x += colWidths.runner;

    // Final Decision
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(180, 83, 9);
    doc.text(ed.finalScore || 'Decided', x, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text('Panel Verdict', x, currentY + 8.5);
    x += colWidths.score;

    // Final Motion
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(51, 65, 85);
    const motionLines = doc.splitTextToSize(`"${ed.finalMotion || 'Motion on file'}"`, colWidths.motion - 4);
    doc.text(motionLines.slice(0, 2), x, currentY + 4.5);

    currentY += rowHeight;
  });

  drawPageFooter(doc, pageNum, pageNum, pageWidth, pageHeight, verificationCode);
  doc.save(`YFC_Liberia_Championship_Scorecards_Archive_${new Date().getFullYear()}.pdf`);
}
