import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { 
  Award, Download, Printer, X, Star, CheckCircle2, 
  Sparkles, ShieldCheck, User, Building2, MapPin, Calendar, RefreshCw
} from 'lucide-react';
import { LIBERIA_COUNTIES } from '../data/schoolData';
import { YocLogo } from './YocLogo';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialYear?: string;
  initialSchool?: string;
  initialCounty?: string;
}

const CHAMPIONSHIP_YEARS = [
  { year: '2024/2025', edition: '10th Flagship Decade Jubilee Edition', theme: 'AI, Governance, & Sustainable Development' },
  { year: '2023', edition: '9th National Championship', theme: 'Resource Stewardship & Youth Civic Agency' },
  { year: '2022', edition: '8th National Championship', theme: 'Post-Pandemic Economic Recovery & Education' },
  { year: '2021', edition: '7th National Championship', theme: 'Academic Renaissance & Regional Unity' },
  { year: '2020', edition: '6th National Championship', theme: 'Youth Resilience & Democratic Fortitude' },
  { year: '2019', edition: '5th National Championship', theme: 'Ten Counties National Summit & Digital Literacy' },
  { year: '2018', edition: '4th National Championship', theme: 'STEM Integration & Educational Equity' },
  { year: '2017', edition: '3rd National Championship', theme: 'Democratic Transition & Peaceful Civic Discourse' },
  { year: '2016', edition: '2nd National Championship', theme: 'Regional Expansion & High School Forensics' },
  { year: '2015', edition: '1st Inaugural Championship', theme: 'Inaugural High School Debate Tournament' },
];

const ROLES = [
  'Championship Debater / Delegate',
  'STEM Innovation Challenge Finalist',
  'Lead High School Forensics Speaker',
  'Team Captain & School Representative',
  'Adjudication Panelist / Volunteer Coach',
  'Distinguished Delegate of Recognition'
];

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  initialYear = '2024/2025',
  initialSchool = "St. Teresa's Convent High School",
  initialCounty = 'Montserrado'
}) => {
  const [recipientName, setRecipientName] = useState('Kollie J. Mensah');
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [schoolName, setSchoolName] = useState(initialSchool);
  const [county, setCounty] = useState(initialCounty);
  const [role, setRole] = useState(ROLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const currentYearData = CHAMPIONSHIP_YEARS.find(y => y.year === selectedYear) || CHAMPIONSHIP_YEARS[0];
  const certId = `YFC-LIB-${selectedYear.replace('/', '-')}-${Math.abs((recipientName + schoolName + selectedYear).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0) % 90000 + 10000)}`;

  const generatePDF = () => {
    setIsGenerating(true);
    setDownloadSuccess(false);

    try {
      // Landscape A4 orientation (297 x 210 mm)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 297;
      const pageHeight = 210;

      // 1. Background Fill (Soft Ivory / Crisp Canvas)
      doc.setFillColor(254, 254, 252);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // 2. Outer Border (Deep Navy Blue #002868)
      doc.setDrawColor(0, 40, 104);
      doc.setLineWidth(4);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

      // 3. Inner Gold Accent Border (#d97706)
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(1.2);
      doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

      // Thin Inner Navy Guide
      doc.setDrawColor(0, 40, 104);
      doc.setLineWidth(0.4);
      doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

      // Corner Ornaments (Gold Triangles/Stars)
      const drawCornerOrnament = (x: number, y: number) => {
        doc.setFillColor(217, 119, 6);
        doc.circle(x, y, 2.5, 'F');
      };
      drawCornerOrnament(15, 15);
      drawCornerOrnament(pageWidth - 15, 15);
      drawCornerOrnament(15, pageHeight - 15);
      drawCornerOrnament(pageWidth - 15, pageHeight - 15);

      // 4. Header Badge / Republic of Liberia
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(153, 0, 31); // Crimson Red
      doc.text('REPUBLIC OF LIBERIA • NATIONAL YOUTH FORENSICS ACCREDITATION', pageWidth / 2, 26, { align: 'center' });

      // Organization Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(0, 40, 104); // Deep Navy
      doc.text('YOUTH FOR CHANGE LIBERIA', pageWidth / 2, 35, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text('National High School Debate & STEM Innovation Championship Series', pageWidth / 2, 41, { align: 'center' });

      // Gold Divider Line with Center Star
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.8);
      doc.line(70, 45, 138, 45);
      doc.line(158, 45, 227, 45);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(217, 119, 6);
      doc.text('★', pageWidth / 2, 46.2, { align: 'center' });

      // Certificate Title
      doc.setFont('times', 'bolditalic');
      doc.setFontSize(22);
      doc.setTextColor(0, 40, 104);
      doc.text('Certificate of Official Participation', pageWidth / 2, 57, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text('This is officially conferred and awarded to', pageWidth / 2, 65, { align: 'center' });

      // Recipient Name in Large Prominent Text
      doc.setFont('times', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(15, 23, 42); // Dark Slate
      doc.text(recipientName || 'Championship Delegate', pageWidth / 2, 78, { align: 'center' });

      // Underline under recipient name
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      const nameWidth = doc.getTextWidth(recipientName || 'Championship Delegate');
      doc.line((pageWidth / 2) - (nameWidth / 2) - 10, 81, (pageWidth / 2) + (nameWidth / 2) + 10, 81);

      // Recognition Statement
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(180, 83, 9); // Amber 700
      doc.text(`As ${role}`, pageWidth / 2, 89, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text(
        `Representing ${schoolName || 'High School Delegation'} (${county} County)`,
        pageWidth / 2,
        97,
        { align: 'center' }
      );

      // Championship Description & Citation
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(71, 85, 105);
      const citationText = `In formal recognition of commendable forensics rigor, critical thinking, and disciplined civic discourse demonstrated during the ${selectedYear} National Championship (${currentYearData.edition}) under the theme "${currentYearData.theme}".`;
      
      const splitCitation = doc.splitTextToSize(citationText, 210);
      doc.text(splitCitation, pageWidth / 2, 106, { align: 'center' });

      // Center Seal / Accreditation Emblem
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.8);
      doc.circle(pageWidth / 2, 140, 15, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(0, 40, 104);
      doc.text('OFFICIAL SEAL', pageWidth / 2, 137, { align: 'center' });
      doc.setFontSize(14);
      doc.setTextColor(217, 119, 6);
      doc.text('★', pageWidth / 2, 143, { align: 'center' });
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`${selectedYear} ACCREDITED`, pageWidth / 2, 148, { align: 'center' });

      // Left Signature: Executive Director
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.5);
      doc.line(35, 172, 95, 172);

      doc.setFont('times', 'italic');
      doc.setFontSize(13);
      doc.setTextColor(0, 40, 104);
      doc.text('Alex F. Devine', 65, 168, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Alex F. Devine', 65, 177, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Executive Director & Founder', 65, 182, { align: 'center' });
      doc.text('Youth For Change Liberia', 65, 186, { align: 'center' });

      // Right Signature: Chief Adjudicator
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.5);
      doc.line(202, 172, 262, 172);

      doc.setFont('times', 'italic');
      doc.setFontSize(13);
      doc.setTextColor(0, 40, 104);
      doc.text('Cllr. T. Jerry Moore', 232, 168, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Cllr. T. Jerry Moore', 232, 177, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Chief Adjudication Officer', 232, 182, { align: 'center' });
      doc.text('National Forensics Panel', 232, 186, { align: 'center' });

      // Certificate Verification Serial & Footer Note
      doc.setFont('courier', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`VERIFICATION ID: ${certId}`, 18, pageHeight - 18);
      doc.text(`DOCUMENT ISSUED: MONROVIA, REPUBLIC OF LIBERIA`, pageWidth - 18, pageHeight - 18, { align: 'right' });

      // Save PDF directly to user's device
      const sanitizedName = (recipientName || 'Delegate').replace(/[^a-zA-Z0-9]/g, '_');
      const sanitizedYear = selectedYear.replace('/', '_');
      doc.save(`YFC_Liberia_Participation_Certificate_${sanitizedYear}_${sanitizedName}.pdf`);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate certificate PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="bg-emerald-900 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-yellow-400 text-emerald-950 flex items-center justify-center shadow-xs">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Championship Participation Certificate Generator
              </h2>
              <p className="text-xs text-emerald-200">
                Official high-resolution printable PDF for past championship years (2015–2025)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Controls & Live Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left Column: Form Controls */}
          <div className="lg:col-span-4 p-5 bg-slate-50 border-r border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Certificate Details
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono font-semibold">
                PDF Ready
              </span>
            </div>

            {/* Recipient Full Name */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" /> Participant / Delegate Name
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                placeholder="Enter student or delegate name..."
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* Championship Year */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Championship Year Edition
              </label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
              >
                {CHAMPIONSHIP_YEARS.map(y => (
                  <option key={y.year} value={y.year}>
                    {y.year} - {y.edition}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 italic pt-0.5">
                Theme: "{currentYearData.theme}"
              </p>
            </div>

            {/* School Name */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-500" /> High School Delegation
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
                placeholder="e.g. St. Teresa's Convent High School"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {/* County */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> County Subdivision
              </label>
              <select
                value={county}
                onChange={e => setCounty(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
              >
                {LIBERIA_COUNTIES.map(c => (
                  <option key={c.county} value={c.county}>
                    {c.county} County
                  </option>
                ))}
              </select>
            </div>

            {/* Role Track */}
            <div className="space-y-1">
              <label className="block font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> Recognition Category
              </label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
              >
                {ROLES.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <button
                id="generate-pdf-download-btn"
                type="button"
                onClick={generatePDF}
                disabled={isGenerating}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendering PDF Document...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-yellow-400" />
                    <span>Download Official PDF</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="w-full bg-white hover:bg-slate-100 text-slate-800 font-semibold py-2 px-4 rounded-xl border border-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print Certificate Document</span>
              </button>

              {downloadSuccess && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-3 py-2 rounded-lg flex items-center gap-2 text-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Certificate PDF downloaded successfully to your computer!</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live High-Fidelity Visual Certificate Preview */}
          <div className="lg:col-span-8 p-5 bg-slate-200/60 flex flex-col justify-center items-center overflow-x-auto">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6 sm:p-8 border-4 border-emerald-900 relative text-center space-y-4 my-auto select-none print:m-0 print:shadow-none">
              {/* Inner Decorative Gold Border */}
              <div className="absolute inset-1.5 border border-amber-600 pointer-events-none rounded-sm"></div>
              <div className="absolute inset-2.5 border border-emerald-900/40 pointer-events-none rounded-sm"></div>

              {/* Corner Star Accents */}
              <div className="absolute top-3 left-3 text-amber-600 text-xs font-serif">★</div>
              <div className="absolute top-3 right-3 text-amber-600 text-xs font-serif">★</div>
              <div className="absolute bottom-3 left-3 text-amber-600 text-xs font-serif">★</div>
              <div className="absolute bottom-3 right-3 text-amber-600 text-xs font-serif">★</div>

              {/* Certificate Header Banner */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 p-0.5 bg-white shadow-xs flex items-center justify-center">
                    <YocLogo size="sm" />
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-800">
                  <span>Republic of Liberia</span>
                  <span>•</span>
                  <span>National Forensics Accreditation</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-emerald-900 tracking-tight uppercase">
                  Youth For Change Liberia
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  National High School Debate & STEM Innovation Championship Series
                </p>
              </div>

              {/* Gold Divider Line */}
              <div className="flex items-center justify-center gap-3">
                <div className="h-0.5 w-16 bg-amber-500"></div>
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <div className="h-0.5 w-16 bg-amber-500"></div>
              </div>

              {/* Title */}
              <div className="space-y-0.5">
                <div className="text-lg sm:text-xl font-serif italic font-bold text-emerald-950">
                  Certificate of Official Participation
                </div>
                <p className="text-[11px] text-slate-500">
                  This official credential of excellence is conferred to
                </p>
              </div>

              {/* Recipient Highlight */}
              <div className="py-1">
                <div className="text-xl sm:text-2xl font-serif font-black text-slate-900 border-b-2 border-slate-300 inline-block px-6 pb-1">
                  {recipientName || 'Delegate Name'}
                </div>
                <div className="text-xs font-bold text-amber-700 mt-1">
                  {role}
                </div>
                <div className="text-xs text-slate-600">
                  Representing <strong>{schoolName || 'High School'}</strong> ({county} County)
                </div>
              </div>

              {/* Citation Body */}
              <p className="text-[11px] text-slate-600 max-w-lg mx-auto leading-relaxed italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                In recognition of forensics rigor, analytical reasoning, and exemplary civic sportsmanship in the{' '}
                <strong>{selectedYear} National Championship</strong> ({currentYearData.edition}) focusing on{' '}
                <em>"{currentYearData.theme}"</em>.
              </p>

              {/* Signatures & Seal Section */}
              <div className="grid grid-cols-3 items-end pt-3 text-[10px] text-slate-600">
                {/* Left: Executive Director */}
                <div className="space-y-0.5">
                  <div className="font-serif italic text-emerald-900 font-bold text-xs">Alex F. Devine</div>
                  <div className="border-t border-slate-400 pt-0.5">
                    <div className="font-bold text-slate-800">Alex F. Devine</div>
                    <div className="text-[9px] text-slate-500">Executive Director, YFC</div>
                  </div>
                </div>

                {/* Center: Official Seal Badge */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-amber-600 bg-amber-50 flex flex-col items-center justify-center shadow-xs">
                    <Star className="w-4 h-4 text-amber-600 fill-amber-600" />
                    <span className="text-[8px] font-black text-emerald-900 uppercase">YFC SEAL</span>
                  </div>
                  <span className="text-[8px] text-slate-400 font-mono mt-0.5">{selectedYear}</span>
                </div>

                {/* Right: Chief Adjudicator */}
                <div className="space-y-0.5">
                  <div className="font-serif italic text-emerald-900 font-bold text-xs">Cllr. T. Jerry Moore</div>
                  <div className="border-t border-slate-400 pt-0.5">
                    <div className="font-bold text-slate-800">Cllr. T. Jerry Moore</div>
                    <div className="text-[9px] text-slate-500">Chief Adjudication Officer</div>
                  </div>
                </div>
              </div>

              {/* Bottom Micro Serial */}
              <div className="flex justify-between items-center pt-2 text-[9px] font-mono text-slate-400 border-t border-slate-100">
                <span>SERIAL: {certId}</span>
                <span>MONROVIA, REPUBLIC OF LIBERIA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Digital PDF credential certified under Youth For Change Liberia governance protocols.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
