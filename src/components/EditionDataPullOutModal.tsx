import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileSpreadsheet, 
  Archive, 
  Trophy, 
  Award, 
  Calendar, 
  Users, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  Database,
  Eye,
  FileText,
  ChevronRight,
  Filter
} from 'lucide-react';
import { TournamentEditionArchive } from '../types/tournament';
import { DebateEdition } from '../types';
import { 
  subscribeToEditionArchives, 
  exportEditionArchiveJson, 
  exportEditionArchiveCsv,
  DEFAULT_HISTORICAL_ARCHIVES 
} from '../lib/editionArchiveService';
import { normalizeEditionKey } from '../lib/debateService';
import { useToast } from '../context/ToastContext';

interface EditionDataPullOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEditionYear?: string;
  allEditions?: DebateEdition[];
}

export const EditionDataPullOutModal: React.FC<EditionDataPullOutModalProps> = ({
  isOpen,
  onClose,
  initialEditionYear,
  allEditions = []
}) => {
  const toast = useToast();
  const [archives, setArchives] = useState<TournamentEditionArchive[]>(DEFAULT_HISTORICAL_ARCHIVES);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'standings'>('overview');

  useEffect(() => {
    if (!isOpen) return;

    const unsub = subscribeToEditionArchives((list) => {
      setArchives(list);
      if (!selectedKey && list.length > 0) {
        if (initialEditionYear) {
          const matched = list.find(a => 
            a.editionYear.includes(initialEditionYear) || 
            normalizeEditionKey(a.editionYear) === normalizeEditionKey(initialEditionYear)
          );
          setSelectedKey(matched ? matched.editionKey : list[0].editionKey);
        } else {
          setSelectedKey(list[0].editionKey);
        }
      }
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [isOpen, initialEditionYear]);

  if (!isOpen) return null;

  const currentArchive = archives.find(a => a.editionKey === selectedKey) || archives[0];

  const handleDownloadJson = () => {
    if (!currentArchive) return;
    exportEditionArchiveJson(currentArchive);
    toast.success(`Full cryptographic dataset for ${currentArchive.editionYear} downloaded!`, 'Data Pulled Out');
  };

  const handleDownloadCsv = () => {
    if (!currentArchive) return;
    exportEditionArchiveCsv(currentArchive);
    toast.success(`Match ledger spreadsheet for ${currentArchive.editionYear} exported!`, 'Data Pulled Out');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-700" />
                Historical Records & Data Pull-Out Vault
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              National Debate Championship Archives
            </h2>
            <p className="text-xs text-slate-500">
              Select any tournament edition below to inspect official ballots, pull full backup JSON data, or export match ledger spreadsheets.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl font-bold p-1 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Edition Selector Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <span className="text-xs font-bold text-slate-500 uppercase shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" /> Edition:
          </span>
          {archives.map((arch) => (
            <button
              key={arch.editionKey}
              onClick={() => {
                setSelectedKey(arch.editionKey);
                setActiveTab('overview');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedKey === arch.editionKey
                  ? 'bg-emerald-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {arch.editionYear}
            </button>
          ))}
        </div>

        {currentArchive ? (
          <div className="flex-1 overflow-y-auto space-y-6 pr-1">
            {/* Banner card */}
            <div className="bg-gradient-to-r from-slate-900 to-emerald-950 text-white p-5 rounded-2xl border border-slate-700 shadow-md space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">
                    Official Preserved Edition
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                    {currentArchive.editionTitle}
                  </h3>
                  {currentArchive.theme && (
                    <p className="text-xs text-emerald-200 italic mt-0.5">
                      "{currentArchive.theme}"
                    </p>
                  )}
                </div>

                {/* Direct Pull Out Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadJson}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border border-emerald-400/30"
                    title="Download complete JSON backup with all match data"
                  >
                    <Download className="w-4 h-4" />
                    <span>Pull Out Data (JSON)</span>
                  </button>

                  <button
                    onClick={handleDownloadCsv}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer border border-slate-600"
                    title="Export matches to CSV spreadsheet"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Champion</span>
                  <span className="text-white font-black truncate block">{currentArchive.championSchool}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">County</span>
                  <span className="text-emerald-300 font-black">{currentArchive.championCounty}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Best Speaker</span>
                  <span className="text-white font-black truncate block">{currentArchive.bestSpeaker}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Archived Date</span>
                  <span className="text-slate-300 font-medium">
                    {new Date(currentArchive.archivedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-tab pills */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Overview & Honors
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'matches'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Match Ledger ({currentArchive.fixtures?.length || currentArchive.fixturesCount || 0})
              </button>
              <button
                onClick={() => setActiveTab('standings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'standings'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Team Standings Matrix ({currentArchive.standings?.length || currentArchive.standingsCount || 0})
              </button>
            </div>

            {/* TAB CONTENT 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200/80 space-y-1">
                    <span className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-amber-600" />
                      National Grand Champion
                    </span>
                    <h4 className="text-base font-black text-slate-900">
                      {currentArchive.championSchool}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {currentArchive.championCounty} County • Score: {currentArchive.finalScore}
                    </p>
                  </div>

                  <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200/80 space-y-1">
                    <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-emerald-600" />
                      National Best Speaker (MVP)
                    </span>
                    <h4 className="text-base font-black text-slate-900">
                      {currentArchive.bestSpeaker}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {currentArchive.bestSpeakerSchool || currentArchive.championSchool}
                    </p>
                  </div>
                </div>

                {currentArchive.finalMotion && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400">Grand Final Motion</span>
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 italic">
                      "{currentArchive.finalMotion}"
                    </p>
                  </div>
                )}

                {currentArchive.summary && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1 text-xs text-slate-700">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Championship Summary</span>
                    <p className="leading-relaxed">{currentArchive.summary}</p>
                  </div>
                )}

                {currentArchive.keyHighlights && currentArchive.keyHighlights.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Key Milestones & Highlights</span>
                    <div className="space-y-1.5">
                      {currentArchive.keyHighlights.map((hl, i) => (
                        <div key={i} className="flex items-start gap-2 text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: MATCHES */}
            {activeTab === 'matches' && (
              <div className="space-y-3">
                {(!currentArchive.fixtures || currentArchive.fixtures.length === 0) ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                    <Layers className="w-8 h-8 text-slate-400 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-800">Complete Historical Scorecard Recorded</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Individual preliminary match logs are archived in the cloud repository. Click "Pull Out Data (JSON)" to access the full uncompressed record.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentArchive.fixtures.map((f, i) => (
                      <div key={f.id || i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            {f.roundName || `Match #${i+1}`} • {f.county}
                          </span>
                          <div className="font-bold text-slate-900">
                            <span className={f.winnerId === f.teamA?.schoolId ? 'text-emerald-700 font-black' : ''}>
                              {f.teamA?.schoolName}
                            </span>
                            <span className="text-slate-400 mx-2">vs</span>
                            <span className={f.winnerId === f.teamB?.schoolId ? 'text-emerald-700 font-black' : ''}>
                              {f.teamB?.schoolName}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 italic truncate max-w-lg">"{f.motion}"</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-slate-900 block">{f.winnerName ? `Won by ${f.winnerName}` : 'Completed'}</span>
                          <span className="text-[10px] text-slate-400">{f.venue || 'County Hall'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: STANDINGS */}
            {activeTab === 'standings' && (
              <div className="space-y-3">
                {(!currentArchive.standings || currentArchive.standings.length === 0) ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6 space-y-2">
                    <Trophy className="w-8 h-8 text-slate-400 mx-auto" />
                    <h4 className="text-xs font-bold text-slate-800">Final Podium Recorded</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Champion: {currentArchive.championSchool} ({currentArchive.championCounty}) • Runner-Up: {currentArchive.runnerUpSchool}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-3">Rank</th>
                          <th className="p-3">School Name</th>
                          <th className="p-3">County</th>
                          <th className="p-3 text-center">Played</th>
                          <th className="p-3 text-center">Won</th>
                          <th className="p-3 text-center">Ballots</th>
                          <th className="p-3 text-right">Speaker Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                        {currentArchive.standings.map((s, idx) => (
                          <tr key={s.schoolId || idx} className="hover:bg-slate-50">
                            <td className="p-3 font-bold">#{s.rank || idx + 1}</td>
                            <td className="p-3 font-bold text-slate-900">{s.schoolName}</td>
                            <td className="p-3 text-slate-600">{s.county}</td>
                            <td className="p-3 text-center">{s.matchesPlayed}</td>
                            <td className="p-3 text-center font-bold text-emerald-700">{s.matchesWon}</td>
                            <td className="p-3 text-center">{s.ballotsWon}-{s.ballotsLost}</td>
                            <td className="p-3 text-right font-black text-slate-900">{s.totalSpeakerScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs">
            Select an edition above to inspect historical data.
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Accredited by Youth For Change National Forensics Secretariat
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
          >
            Close Vault
          </button>
        </div>
      </div>
    </div>
  );
};
