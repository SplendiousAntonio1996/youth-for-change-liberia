import React, { useState, useEffect } from 'react';
import { 
  Trophy, Award, Search, Filter, Star, MapPin, 
  ChevronRight, CheckCircle2, Flame, Cpu, ArrowUpDown, 
  Download, FileText, Printer, Sparkles, ShieldCheck, RefreshCw,
  Archive, Database
} from 'lucide-react';
import { ResultsSubTab, NavTab, DebateSubTab } from '../types';
import { SCHOOL_LEADERBOARD, LIBERIA_COUNTIES, HALL_OF_FAME_WINNERS } from '../data/schoolData';
import { DEBATE_EDITIONS } from '../data/debateData';
import { useDebateEditions } from '../hooks/useDebateEditions';
import { CertificateModal } from './CertificateModal';
import { ExportLeaderboardModal } from './ExportLeaderboardModal';
import { EditionDataPullOutModal } from './EditionDataPullOutModal';
import { PageHeroBanner } from './PageHeroBanner';
import { 
  exportSchoolsLeaderboardPdf, 
  exportCountiesStandingsPdf, 
  exportHallOfFamePdf, 
  exportChampionshipResultsPdf 
} from '../utils/leaderboardPdfGenerator';
import { useToast } from '../context/ToastContext';
import { 
  ResultsWinnersSkeleton, 
  ResultsSchoolsSkeleton, 
  ResultsCountiesSkeleton, 
  ResultsChampionshipsSkeleton 
} from './SkeletonLoaders';

interface ResultsViewProps {
  resultsSub: ResultsSubTab;
  setResultsSub: (sub: ResultsSubTab) => void;
  setTab: (tab: NavTab) => void;
  setDebateSub: (sub: DebateSubTab) => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  resultsSub,
  setResultsSub,
  setTab,
  setDebateSub
}) => {
  const { editionsList } = useDebateEditions();
  const { success: toastSuccess, info: toastInfo } = useToast();

  // Loading skeleton state
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Search & Filter state for schools
  const [schoolSearch, setSchoolSearch] = useState('');
  const [countyFilter, setCountyFilter] = useState('All');
  const [sortField, setSortField] = useState<'points' | 'titles'>('points');

  // Export Leaderboard State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportTargetSubTab, setExportTargetSubTab] = useState<ResultsSubTab>('schools');
  const [isQuickExporting, setIsQuickExporting] = useState(false);

  // Trigger skeleton loading when switching subtabs or on initial mount
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [resultsSub]);

  const handleRefreshData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  // Certificate Modal State
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certInitialYear, setCertInitialYear] = useState('2024/2025');
  const [certInitialSchool, setCertInitialSchool] = useState("St. Teresa's Convent High School");
  const [certInitialCounty, setCertInitialCounty] = useState('Montserrado');

  // Edition Data Pull-Out Modal State
  const [isPullOutModalOpen, setIsPullOutModalOpen] = useState(false);
  const [pullOutInitialYear, setPullOutInitialYear] = useState('2024/2025');

  const openCertificateModal = (year: string = '2024/2025', school: string = "St. Teresa's Convent High School", countyName: string = 'Montserrado') => {
    setCertInitialYear(year);
    setCertInitialSchool(school);
    setCertInitialCounty(countyName);
    setIsCertModalOpen(true);
  };

  const filteredSchools = SCHOOL_LEADERBOARD.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(schoolSearch.toLowerCase()) || 
                          s.city.toLowerCase().includes(schoolSearch.toLowerCase());
    const matchesCounty = countyFilter === 'All' || s.county === countyFilter;
    return matchesSearch && matchesCounty;
  }).sort((a, b) => {
    if (sortField === 'points') return b.totalPoints - a.totalPoints;
    return (b.debateTitles + b.stemTitles) - (a.debateTitles + a.stemTitles);
  });

  // Direct 1-Click Quick Export Handler
  const handleQuickExport = (subTabToExport: ResultsSubTab = resultsSub) => {
    setIsQuickExporting(true);
    setTimeout(() => {
      try {
        if (subTabToExport === 'schools') {
          exportSchoolsLeaderboardPdf(filteredSchools, {
            countyFilter,
            searchQuery: schoolSearch,
            sortField
          });
          toastSuccess(`Schools Leaderboard PDF (${filteredSchools.length} schools) exported for offline viewing!`);
        } else if (subTabToExport === 'counties') {
          exportCountiesStandingsPdf(LIBERIA_COUNTIES);
          toastSuccess('15 Counties Performance Matrix PDF exported for offline viewing!');
        } else if (subTabToExport === 'winners') {
          exportHallOfFamePdf(HALL_OF_FAME_WINNERS);
          toastSuccess('Hall of Fame Champions PDF (2015–2025) exported for offline viewing!');
        } else if (subTabToExport === 'championships') {
          exportChampionshipResultsPdf(editionsList);
          toastSuccess('Championship Finals Scorecards PDF exported for offline viewing!');
        }
      } catch (err) {
        console.error('Failed to export leaderboard PDF:', err);
      } finally {
        setIsQuickExporting(false);
      }
    }, 250);
  };

  // Open Export Modal for customized options
  const handleOpenExportModal = (targetTab: ResultsSubTab = resultsSub) => {
    setExportTargetSubTab(targetTab);
    setIsExportModalOpen(true);
  };


  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 space-y-10">
      {/* 1. Sleek Forest Green Hero Banner */}
      <PageHeroBanner
        category="OFFICIAL TABULATION DESK • 15 COUNTIES"
        badge="ACCREDITED SCORES & STANDINGS"
        title="TOURNAMENT RESULTS & STANDINGS"
        subtitle="Live scores, county standings, knockout brackets, and speaker point rankings verified by the National Forensics Board."
        bgImage="/group.jpg"
        stats={[
          { label: 'Liberian Counties', value: '15' },
          { label: 'Accredited Schools', value: `${SCHOOL_LEADERBOARD.length}` },
          { label: 'Decennial Archive', value: '2015–2025' },
          { label: 'Certified Tabulation', value: '100%' }
        ]}
      >
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => handleQuickExport(resultsSub)}
            disabled={isQuickExporting}
            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black rounded-full text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 fill-emerald-950 text-emerald-950" />
            <span>Export Standings (PDF)</span>
          </button>
          <button
            type="button"
            onClick={() => openCertificateModal('2024/2025', "St. Teresa's Convent High School", 'Montserrado')}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/20 text-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5 text-yellow-300" />
            <span>Participation Certificates</span>
          </button>
        </div>
      </PageHeroBanner>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Official Action Banners: Leaderboard PDF Export & Certificate */}
        <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {/* Action 1: Export Current Leaderboard as PDF */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-500 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileText className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">Export Leaderboard (PDF)</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Offline Ready
                  </span>
                </div>
                <p className="text-xs text-slate-500 max-w-md">
                  Download accredited A4 landscape PDF standings with ranks, school points, and official verification.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                id="export-current-leaderboard-quick-btn"
                type="button"
                onClick={() => handleQuickExport(resultsSub)}
                disabled={isQuickExporting}
                className="flex-1 sm:flex-initial bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                title="Quick 1-click download of the currently viewed leaderboard"
              >
                <Download className="w-3.5 h-3.5 text-yellow-400" />
                <span>Export PDF</span>
              </button>
              <button
                id="export-leaderboard-custom-modal-btn"
                type="button"
                onClick={() => handleOpenExportModal(resultsSub)}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center transition-colors cursor-pointer"
                title="Customize export options, notes, and datasets"
                aria-label="Export settings"
              >
                <Printer className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Action 2: Championship Participation Certificates */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-emerald-800 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-yellow-400 text-emerald-950 flex items-center justify-center shrink-0 shadow-xs">
                <Award className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">Participation Certificates</h3>
                  <span className="bg-yellow-400 text-emerald-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    2015–2025
                  </span>
                </div>
                <p className="text-xs text-emerald-200 max-w-md">
                  Print official accredited credentials for debaters, coaches, and school delegations.
                </p>
              </div>
            </div>
            <button
              id="download-participation-cert-main-btn"
              type="button"
              onClick={() => openCertificateModal('2024/2025', "St. Teresa's Convent High School", 'Montserrado')}
              className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Get Certificate</span>
            </button>
          </div>
        </div>

        {/* Subtabs & Refresh Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <div className="inline-flex flex-wrap p-1.5 bg-slate-100 rounded-2xl border border-slate-200 gap-1">
            {[
              { key: 'winners', label: 'Winners Hall of Fame', icon: Trophy },
              { key: 'schools', label: 'Schools Leaderboard', icon: Star },
              { key: 'counties', label: '15 Counties Standings', icon: MapPin },
              { key: 'championships', label: 'Championship Results', icon: Award }
            ].map(tab => {
              const Icon = tab.icon;
              const active = resultsSub === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`results-subtab-${tab.key}`}
                  onClick={() => setResultsSub(tab.key as ResultsSubTab)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    active 
                      ? 'bg-emerald-800 text-white shadow-md' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="inline-flex items-center gap-2">
            <button
              type="button"
              id="export-active-tab-quick-pdf-btn"
              onClick={() => handleQuickExport(resultsSub)}
              disabled={isQuickExporting}
              title="Download the active tab as an accredited PDF"
              className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-2xl border border-emerald-200/80 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700" />
              <span>Export PDF</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshData}
              title="Refresh national standings database"
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-2xl border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-700' : ''}`} />
              <span className="hidden sm:inline">Sync Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Subtab 1: Winners Hall of Fame */}
      {resultsSub === 'winners' && (
        isLoading ? <ResultsWinnersSkeleton /> : (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 border border-emerald-800">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-yellow-300 text-xs font-bold uppercase tracking-wider">
                <Trophy className="w-4 h-4" /> Decade of Champions (2015 - 2025)
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Championship Roll of Honor</h2>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
                Every crowned high school and tournament MVP who made history on the national stage.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                id="export-hall-of-fame-pdf-btn"
                type="button"
                onClick={() => handleQuickExport('winners')}
                disabled={isQuickExporting}
                className="px-4 py-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                title="Download Decade of Champions Hall of Fame as an A4 PDF document for offline viewing"
              >
                <Download className="w-4 h-4 text-yellow-400" />
                <span>Export Hall of Fame PDF</span>
              </button>
              <button
                onClick={() => {
                  setTab('debate');
                  setDebateSub('2024-25');
                }}
                className="px-5 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold text-xs sm:text-sm shadow-md transition-colors shrink-0 cursor-pointer"
              >
                Explore Debate Editions Archive
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {HALL_OF_FAME_WINNERS.map((w, idx) => (
              <div
                key={w.year}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-emerald-500 transition-colors"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-yellow-400 text-emerald-950 px-2.5 py-1 rounded">
                      {w.year}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{w.eventTitle}</span>
                  </div>
                  <span className="text-yellow-500 font-bold text-sm">🏆</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Debate Champion</span>
                    <h3 className="text-lg font-black text-slate-900">{w.debateChampion}</h3>
                    <p className="text-xs text-slate-500">{w.debateCounty} County</p>
                  </div>

                  {w.runnerUp && (
                    <div className="bg-slate-50/80 p-2.5 rounded-xl flex items-center justify-between text-xs border border-slate-100">
                      <span className="text-slate-500 font-medium">Grand Final Runner-Up:</span>
                      <strong className="text-slate-800 font-semibold">{w.runnerUp} ({w.runnerUpCounty})</strong>
                    </div>
                  )}

                  <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-600">Tournament MVP / Speaker:</span>
                    <strong className="text-emerald-800 font-bold">{w.bestSpeaker}</strong>
                  </div>

                  {w.stemChampion !== 'N/A' && (
                    <div className="bg-emerald-50/70 p-3 rounded-xl flex items-center justify-between text-xs border border-emerald-100">
                      <span className="text-emerald-800 font-medium">STEM Champion:</span>
                      <strong className="text-emerald-950 font-bold">{w.stemChampion} ({w.stemCounty})</strong>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Accredited Forensics Record</span>
                  <button
                    type="button"
                    onClick={() => openCertificateModal(w.year, w.debateChampion, w.debateCounty)}
                    className="bg-slate-100 hover:bg-emerald-800 hover:text-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    title={`Generate and download printable ${w.year} participation certificate PDF`}
                  >
                    <Download className="w-3.5 h-3.5 text-yellow-500" />
                    <span>Download {w.year} Certificate PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        )
      )}

      {/* Subtab 2: Schools Leaderboard */}
      {resultsSub === 'schools' && (
        isLoading ? <ResultsSchoolsSkeleton /> : (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Filter Bar */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search high school or city..."
                value={schoolSearch}
                onChange={e => setSchoolSearch(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
              <select
                value={countyFilter}
                onChange={e => setCountyFilter(e.target.value)}
                className="bg-white border border-slate-300 text-xs font-semibold text-slate-700 px-3 py-2 rounded-xl focus:outline-none"
              >
                <option value="All">All Counties</option>
                {['Montserrado', 'Nimba', 'Bong', 'Margibi', 'Grand Bassa', 'Maryland', 'Lofa'].map(c => (
                  <option key={c} value={c}>{c} County</option>
                ))}
              </select>

              <button
                onClick={() => setSortField(sortField === 'points' ? 'titles' : 'points')}
                className="bg-white border border-slate-300 text-xs font-bold text-slate-700 px-3 py-2 rounded-xl flex items-center gap-1.5 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Sort: {sortField === 'points' ? 'Total Points' : 'Trophies'}</span>
              </button>

              <button
                id="schools-leaderboard-export-pdf-btn"
                type="button"
                onClick={() => handleQuickExport('schools')}
                disabled={isQuickExporting}
                className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                title="Download this filtered leaderboard as an A4 PDF document for offline viewing"
              >
                <Download className="w-3.5 h-3.5 text-yellow-400" />
                <span>Export PDF</span>
              </button>

              <button
                id="schools-leaderboard-options-btn"
                type="button"
                onClick={() => handleOpenExportModal('schools')}
                className="bg-white border border-slate-300 text-slate-700 p-2 rounded-xl flex items-center hover:bg-slate-100 transition-colors cursor-pointer"
                title="Customize export layout, notes, and datasets"
                aria-label="Export settings"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Table Header Bar with Active Summary and Download Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                <span>National High Schools Standings</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {filteredSchools.length} {filteredSchools.length === 1 ? 'School' : 'Schools'}
                </span>
              </h3>
              <p className="text-slate-500 text-xs">
                Official ranking based on tournament rounds won, STEM challenges, finals, and speaker scores.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {countyFilter !== 'All' ? `${countyFilter} County • ` : 'All 15 Counties • '}
                Sorted by {sortField === 'points' ? 'Total Points' : 'Trophies'}
              </span>
              <button
                id="table-top-export-pdf-btn"
                type="button"
                onClick={() => handleQuickExport('schools')}
                disabled={isQuickExporting}
                className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                title="Download current leaderboard table as PDF"
              >
                <Download className="w-3.5 h-3.5 text-yellow-400" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Rank</th>
                    <th className="py-3.5 px-4">School Name</th>
                    <th className="py-3.5 px-4">County / City</th>
                    <th className="py-3.5 px-4 text-center">Debate Titles</th>
                    <th className="py-3.5 px-4 text-center">STEM Titles</th>
                    <th className="py-3.5 px-4 text-center">Finals</th>
                    <th className="py-3.5 px-4 text-right">Total League Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredSchools.map((school, index) => (
                    <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4 font-black">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md ${
                          index === 0 ? 'bg-yellow-400 text-emerald-950' :
                          index === 1 ? 'bg-slate-200 text-slate-800' :
                          index === 2 ? 'bg-yellow-100 text-amber-900' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">{school.name}</div>
                        <div className="text-[11px] text-slate-400 italic">"{school.motto}"</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-800">{school.county}</span>
                        <span className="text-slate-400 block text-[11px]">{school.city}</span>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-yellow-700">
                        {school.debateTitles > 0 ? `🏆 ${school.debateTitles}` : '-'}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-emerald-700">
                        {school.stemTitles > 0 ? `🔬 ${school.stemTitles}` : '-'}
                      </td>
                      <td className="py-4 px-4 text-center font-semibold text-slate-700">
                        {school.finalAppearances}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-sm text-emerald-800">
                        {school.totalPoints} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )
      )}

      {/* Subtab 3: 15 Counties Standings */}
      {resultsSub === 'counties' && (
        isLoading ? <ResultsCountiesSkeleton /> : (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-5xl mx-auto border-b border-slate-200 pb-5">
            <div className="text-left space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-700"></span>
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">Regional Breakdown</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">15 Counties Performance Matrix</h2>
              <p className="text-slate-600 text-xs sm:text-sm">
                Tracking high school representation, debater cohorts, and championship trophies across all Liberian counties.
              </p>
            </div>
            <button
              id="export-counties-pdf-btn"
              type="button"
              onClick={() => handleQuickExport('counties')}
              disabled={isQuickExporting}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
              title="Download the 15 Counties Performance Matrix as a PDF document for offline viewing"
            >
              <Download className="w-3.5 h-3.5 text-yellow-400" />
              <span>Export 15 Counties PDF</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {LIBERIA_COUNTIES.map(c => (
              <div key={c.county} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-900 text-lg">{c.county} County</h3>
                    <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded">
                      {c.activeSchools} Schools
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl">
                    "{c.highlight}"
                  </p>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                      <span className="text-[10px] text-slate-400 block uppercase">Debate</span>
                      <strong className="text-yellow-800 text-sm">{c.debateTitles} 🏆</strong>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                      <span className="text-[10px] text-slate-400 block uppercase">STEM</span>
                      <strong className="text-emerald-800 text-sm">{c.stemTitles} 🔬</strong>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase">Debaters</span>
                      <strong className="text-emerald-900 text-sm">{c.totalDebaters}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span>Coordinator: <strong className="text-slate-700">{c.coordinator}</strong></span>
                  <span className="block text-slate-400 font-mono text-[11px] mt-0.5">{c.coordinatorContact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        )
      )}

      {/* Subtab 4: Championship Results */}
      {resultsSub === 'championships' && (
        isLoading ? <ResultsChampionshipsSkeleton /> : (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Championship Finals Historical Scorecards</h3>
                <p className="text-xs text-slate-500 mt-0.5">Grand final debate motions, chief adjudicator verdicts, and championship scores.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  id="export-championship-results-pdf-btn"
                  type="button"
                  onClick={() => handleQuickExport('championships')}
                  disabled={isQuickExporting}
                  className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Download all historical grand final scorecards as a PDF document for offline viewing"
                >
                  <Download className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Export Scorecards (PDF)</span>
                </button>
                <button
                  id="pull-out-championship-data-btn"
                  type="button"
                  onClick={() => {
                    setPullOutInitialYear('2024/2025');
                    setIsPullOutModalOpen(true);
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer border border-slate-700"
                  title="Pull out full database backup or match ledger CSV for any championship edition"
                >
                  <Archive className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pull Out Edition Data (JSON/CSV)</span>
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {editionsList.filter(ed => ed.year !== 'Future').map(ed => (
                <div key={ed.id || ed.year} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black bg-emerald-800 text-white px-2.5 py-0.5 rounded">
                        {ed.year} Grand Final
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{ed.title}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                      Panel Decision: {ed.finalScore}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase">Champion (Affirmative)</span>
                      <strong className="text-slate-900 block text-sm">{ed.championSchool}</strong>
                      <span className="text-slate-500">{ed.championCounty} County</span>
                    </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Runner-Up (Opposition)</span>
                    <strong className="text-slate-900 block text-sm">{ed.runnerUpSchool}</strong>
                    <span className="text-slate-500">{ed.runnerUpCounty} County</span>
                  </div>
                </div>

                <div className="text-xs text-slate-600 italic font-serif bg-slate-50 p-3 rounded-xl">
                  <strong>Final Motion:</strong> "{ed.finalMotion}"
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">Official Final Accreditation</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPullOutInitialYear(ed.year);
                        setIsPullOutModalOpen(true);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200"
                    >
                      <Archive className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Pull {ed.year} Data</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openCertificateModal(ed.year, ed.championSchool, ed.championCounty)}
                      className="bg-emerald-50 hover:bg-emerald-800 hover:text-white text-emerald-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-yellow-500" />
                      <span>Download {ed.year} Certificate (PDF)</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )
    )}

    {/* Certificate Modal */}
    <CertificateModal
      isOpen={isCertModalOpen}
      onClose={() => setIsCertModalOpen(false)}
      initialYear={certInitialYear}
      initialSchool={certInitialSchool}
      initialCounty={certInitialCounty}
    />

    {/* Export Leaderboard Modal */}
    <ExportLeaderboardModal
      isOpen={isExportModalOpen}
      onClose={() => setIsExportModalOpen(false)}
      activeSubTab={exportTargetSubTab}
      schools={filteredSchools}
      counties={LIBERIA_COUNTIES}
      countyFilter={countyFilter}
      searchQuery={schoolSearch}
      sortField={sortField}
      onSuccessToast={toastSuccess}
    />

    {/* Edition Historical Records & Data Pull-Out Vault */}
    <EditionDataPullOutModal
      isOpen={isPullOutModalOpen}
      onClose={() => setIsPullOutModalOpen(false)}
      initialEditionYear={pullOutInitialYear}
      allEditions={editionsList}
    />
  </div>
);
};
