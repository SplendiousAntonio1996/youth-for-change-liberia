import React, { useState } from 'react';
import { 
  X, Download, FileText, CheckCircle2, ShieldCheck, 
  Sparkles, Filter, Trophy, Star, MapPin, Award, ArrowDownToLine
} from 'lucide-react';
import { ResultsSubTab, SchoolRank, CountyPerformance } from '../types';
import { 
  exportSchoolsLeaderboardPdf, 
  exportCountiesStandingsPdf, 
  exportHallOfFamePdf, 
  exportChampionshipResultsPdf 
} from '../utils/leaderboardPdfGenerator';
import { HALL_OF_FAME_WINNERS } from '../data/schoolData';
import { DEBATE_EDITIONS } from '../data/debateData';

interface ExportLeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSubTab: ResultsSubTab;
  schools: SchoolRank[];
  counties: CountyPerformance[];
  countyFilter: string;
  searchQuery: string;
  sortField: 'points' | 'titles';
  onSuccessToast?: (msg: string) => void;
}

export const ExportLeaderboardModal: React.FC<ExportLeaderboardModalProps> = ({
  isOpen,
  onClose,
  activeSubTab,
  schools,
  counties,
  countyFilter,
  searchQuery,
  sortField,
  onSuccessToast
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ResultsSubTab>(activeSubTab);
  const [customNotes, setCustomNotes] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  // Sync format with active subtab whenever modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedFormat(activeSubTab);
      setExportComplete(false);
    }
  }, [isOpen, activeSubTab]);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    setExportComplete(false);

    try {
      setTimeout(() => {
        if (selectedFormat === 'schools') {
          exportSchoolsLeaderboardPdf(schools, {
            countyFilter,
            searchQuery,
            sortField,
            notes: customNotes.trim() || undefined
          });
        } else if (selectedFormat === 'counties') {
          exportCountiesStandingsPdf(counties, {
            notes: customNotes.trim() || undefined
          });
        } else if (selectedFormat === 'winners') {
          exportHallOfFamePdf(HALL_OF_FAME_WINNERS, {
            notes: customNotes.trim() || undefined
          });
        } else if (selectedFormat === 'championships') {
          exportChampionshipResultsPdf(Object.values(DEBATE_EDITIONS), {
            notes: customNotes.trim() || undefined
          });
        }

        setIsExporting(false);
        setExportComplete(true);

        if (onSuccessToast) {
          const names: Record<ResultsSubTab, string> = {
            schools: 'Schools Leaderboard PDF',
            counties: '15 Counties Performance Matrix PDF',
            winners: 'Hall of Fame Champions PDF',
            championships: 'Championship Historical Scorecards PDF'
          };
          onSuccessToast(`${names[selectedFormat]} generated and downloaded for offline viewing!`);
        }
      }, 400);
    } catch (err) {
      console.error('Failed to generate leaderboard PDF:', err);
      setIsExporting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white p-6 border-b border-emerald-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-yellow-400 text-emerald-950 flex items-center justify-center font-black shadow-md shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 px-2.5 py-0.5 rounded-full border border-yellow-400/20">
                  Accredited Offline Document
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Export Leaderboard as PDF
              </h2>
              <p className="text-xs text-emerald-200 mt-0.5">
                Download verified standings & tournament records for offline inspection and printing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close export dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          {/* Target Dataset Selection */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 text-xs flex items-center justify-between">
              <span>Select Leaderboard Document to Export</span>
              <span className="text-[10px] font-normal text-slate-400">Official A4 Landscape Layout</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { 
                  key: 'schools' as ResultsSubTab, 
                  label: 'Schools Leaderboard', 
                  desc: `${schools.length} Schools • Cumulative League Pts`, 
                  icon: Star 
                },
                { 
                  key: 'counties' as ResultsSubTab, 
                  label: '15 Counties Standings', 
                  desc: 'All 15 Counties Performance Matrix', 
                  icon: MapPin 
                },
                { 
                  key: 'winners' as ResultsSubTab, 
                  label: 'Hall of Fame (2015-2025)', 
                  desc: 'Decade of Champions Roll of Honor', 
                  icon: Trophy 
                },
                { 
                  key: 'championships' as ResultsSubTab, 
                  label: 'Championship Scorecards', 
                  desc: 'Grand Finals Decisions & Motions', 
                  icon: Award 
                }
              ].map(opt => {
                const Icon = opt.icon;
                const isSelected = selectedFormat === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      setSelectedFormat(opt.key);
                      setExportComplete(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/70 ring-2 ring-emerald-600/30'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                        <span className={`font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                          {opt.label}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />}
                    </div>
                    <span className="text-[11px] text-slate-500 leading-tight">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Active Filters Summary (If exporting schools) */}
          {selectedFormat === 'schools' && (
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-emerald-700" />
                  Preserved Current Table State:
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  {schools.length} Schools Included
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-400 block text-[10px]">County Scope:</span>
                  <strong className="text-slate-800">{countyFilter === 'All' ? 'All 15 Counties' : `${countyFilter} County`}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Sorting:</span>
                  <strong className="text-slate-800">{sortField === 'points' ? 'Total League Points' : 'National Trophies'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Search Filter:</span>
                  <strong className="text-slate-800">{searchQuery ? `"${searchQuery}"` : 'None (Full List)'}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Optional Accreditation / Distribution Note */}
          <div className="space-y-1.5">
            <label htmlFor="pdf-custom-note" className="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>Add Distribution / Authorization Note (Optional)</span>
              <span className="text-[10px] font-normal text-slate-400">Printed on official PDF header</span>
            </label>
            <input
              id="pdf-custom-note"
              type="text"
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
              placeholder="e.g. Official copy for National Accreditation Board, High School Principals & Coaches"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              maxLength={160}
            />
          </div>

          {/* Security & Verification Guarantee Box */}
          <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-200/80 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-800 shrink-0" />
            <div className="text-[11px] text-emerald-950 space-y-0.5">
              <span className="font-bold block">Offline Audit Ready & Print Optimized</span>
              <span className="text-emerald-800 text-[10px] block">
                Features official verification hashes, Republic of Liberia headers, secretariat contact details, and formatted KPI badges.
              </span>
            </div>
          </div>

          {/* Export Success Notification */}
          {exportComplete && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between text-xs text-green-900 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>PDF Document successfully generated and downloaded!</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            id="modal-trigger-pdf-download-btn"
            onClick={handleExport}
            disabled={isExporting}
            className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating A4 PDF...</span>
              </>
            ) : (
              <>
                <ArrowDownToLine className="w-4 h-4 text-yellow-400" />
                <span>Download PDF Document</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
