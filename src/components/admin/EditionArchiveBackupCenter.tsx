import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  Download, 
  FileText, 
  RotateCcw, 
  Plus, 
  Trophy, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Users, 
  MapPin, 
  Flame, 
  Eye, 
  Sparkles, 
  Layers, 
  RefreshCw, 
  HelpCircle,
  FileSpreadsheet,
  Check,
  ChevronRight,
  Database,
  Lock,
  Unlock,
  Award
} from 'lucide-react';
import { 
  TournamentEditionArchive, 
  TournamentFixture, 
  SchoolTournamentStanding, 
  ZonedSchool 
} from '../../types/tournament';
import { DebateEdition } from '../../types';
import { 
  subscribeToEditionArchives, 
  archiveCurrentEdition, 
  initializeFreshEdition, 
  exportEditionArchiveJson, 
  exportEditionArchiveCsv,
  restoreEditionBackupToLive 
} from '../../lib/editionArchiveService';
import { useToast } from '../../context/ToastContext';

interface EditionArchiveBackupCenterProps {
  adminEmail?: string | null;
  activeFixtures?: TournamentFixture[];
  activeStandings?: SchoolTournamentStanding[];
  activeSchools?: ZonedSchool[];
  currentEditionYear?: string;
  onRefreshLiveFixtures?: () => void;
}

export const EditionArchiveBackupCenter: React.FC<EditionArchiveBackupCenterProps> = ({
  adminEmail,
  activeFixtures = [],
  activeStandings = [],
  activeSchools = [],
  currentEditionYear = '2024/2025',
  onRefreshLiveFixtures
}) => {
  const toast = useToast();

  const [archives, setArchives] = useState<TournamentEditionArchive[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showNewEditionModal, setShowNewEditionModal] = useState(false);
  const [inspectingArchive, setInspectingArchive] = useState<TournamentEditionArchive | null>(null);
  const [inspectTab, setInspectTab] = useState<'matches' | 'standings' | 'overview'>('overview');

  // Archive Form State
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveForm, setArchiveForm] = useState({
    editionYear: currentEditionYear,
    editionTitle: `${currentEditionYear} National Debate Championship`,
    tagline: 'Empowering 15-County Forensics, Critical Discourse & Civic Leadership',
    theme: 'Decade of Discourse: Youth Agency, Democratic Governance, and National Renewal',
    championSchool: '',
    championCounty: 'Montserrado',
    runnerUpSchool: '',
    runnerUpCounty: 'Montserrado',
    bestSpeaker: '',
    bestSpeakerSchool: '',
    finalScore: '5 - 2 (Split Panel Decision)',
    finalMotion: '',
    keyHighlights: `Historic 15-county tournament convergence.\nNationwide live broadcast.\nRecord number of female student debaters.`,
    summary: `The ${currentEditionYear} National Debate Championship successfully convened student leaders from all 15 Liberian counties in a celebration of rigorous forensics and civic leadership.`
  });

  // New Edition Form State
  const [isCreatingFresh, setIsCreatingFresh] = useState(false);
  const [newEditionForm, setNewEditionForm] = useState({
    year: '2025/2026',
    title: '2025/2026 National Debate Championship',
    theme: 'Technological Sovereignty, Climate Resilience & Democratic Renewal',
    tagline: 'The Next Decade of County Forensics & Youth Agency',
    grandVenue: 'Official Grand Venue: E.J.S. Ministerial Complex Auditorium, Congo Town',
    openRegistrationImmediately: true
  });

  // Restore State
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Subscribe to archives
  useEffect(() => {
    setLoading(true);
    const unsub = subscribeToEditionArchives((data) => {
      setArchives(data);
      setLoading(false);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  // Pre-fill archive form from active standings if available
  useEffect(() => {
    if (activeStandings.length > 0) {
      const sorted = [...activeStandings].sort((a, b) => {
        if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon;
        return b.totalSpeakerScore - a.totalSpeakerScore;
      });

      const top1 = sorted[0];
      const top2 = sorted[1];

      setArchiveForm(prev => ({
        ...prev,
        championSchool: prev.championSchool || top1?.schoolName || 'United Dawah Ummah High School',
        championCounty: prev.championCounty || top1?.county || 'Montserrado',
        runnerUpSchool: prev.runnerUpSchool || top2?.schoolName || "St. Teresa's Convent High School",
        runnerUpCounty: prev.runnerUpCounty || top2?.county || 'Montserrado'
      }));
    }
  }, [activeStandings]);

  // Handle End & Archive current edition
  const handleConfirmArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveForm.editionYear.trim() || !archiveForm.championSchool.trim()) {
      toast.error('Please specify the tournament edition year and Champion School.', 'Missing Fields');
      return;
    }

    setIsArchiving(true);
    try {
      const highlights = archiveForm.keyHighlights
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const createdArchive = await archiveCurrentEdition({
        editionYear: archiveForm.editionYear,
        editionTitle: archiveForm.editionTitle,
        tagline: archiveForm.tagline,
        theme: archiveForm.theme,
        championSchool: archiveForm.championSchool,
        championCounty: archiveForm.championCounty,
        runnerUpSchool: archiveForm.runnerUpSchool,
        runnerUpCounty: archiveForm.runnerUpCounty,
        bestSpeaker: archiveForm.bestSpeaker,
        bestSpeakerSchool: archiveForm.bestSpeakerSchool,
        finalScore: archiveForm.finalScore,
        finalMotion: archiveForm.finalMotion,
        keyHighlights: highlights,
        summary: archiveForm.summary,
        fixtures: activeFixtures,
        standings: activeStandings,
        schools: activeSchools,
        adminEmail: adminEmail || undefined
      });

      // Automatically trigger 1-click JSON backup download
      exportEditionArchiveJson(createdArchive);

      toast.success(
        `Edition "${archiveForm.editionYear}" successfully archived! Live fixtures removed from active board, backup safely recorded in cloud, and offline backup JSON downloaded.`,
        'Edition Archived & Backed Up'
      );

      setShowArchiveModal(false);
      if (onRefreshLiveFixtures) onRefreshLiveFixtures();
    } catch (err: any) {
      console.error('Error archiving edition:', err);
      toast.error(`Failed to archive edition: ${err.message || 'Unknown error'}`, 'Archive Failed');
    } finally {
      setIsArchiving(false);
    }
  };

  // Handle Initialize Fresh New Edition
  const handleConfirmFreshEdition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEditionForm.year.trim() || !newEditionForm.title.trim()) {
      toast.error('Please provide a season year and title for the new edition.', 'Missing Fields');
      return;
    }

    setIsCreatingFresh(true);
    try {
      await initializeFreshEdition({
        year: newEditionForm.year,
        title: newEditionForm.title,
        theme: newEditionForm.theme,
        tagline: newEditionForm.tagline,
        grandVenue: newEditionForm.grandVenue,
        adminEmail: adminEmail || undefined,
        openRegistrationImmediately: newEditionForm.openRegistrationImmediately
      });

      toast.success(
        `Fresh edition "${newEditionForm.title}" initialized! Live fixtures board is cleared and school registration is now active across all 15 counties.`,
        'New Edition Started Fresh'
      );

      setShowNewEditionModal(false);
      if (onRefreshLiveFixtures) onRefreshLiveFixtures();
    } catch (err: any) {
      console.error('Error starting new edition:', err);
      toast.error(`Failed to initialize new edition: ${err.message || 'Unknown error'}`, 'Initialization Failed');
    } finally {
      setIsCreatingFresh(false);
    }
  };

  // Handle Restore Archive to live
  const handleRestoreToLive = async (archive: TournamentEditionArchive) => {
    if (!window.confirm(`Are you sure you want to restore all ${archive.fixturesCount} matches of "${archive.editionTitle}" back into the live active tournament board? This will replace the active fixtures.`)) {
      return;
    }

    setRestoringId(archive.id);
    try {
      const count = await restoreEditionBackupToLive(archive);
      toast.success(`Successfully restored ${count} fixtures into active live view!`, 'Archive Restored');
      if (onRefreshLiveFixtures) onRefreshLiveFixtures();
    } catch (err: any) {
      console.error('Error restoring archive:', err);
      toast.error(`Failed to restore: ${err.message || 'Unknown error'}`, 'Restore Error');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Master Control & Lifecycle Overview */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-2xl p-6 shadow-xl border border-slate-700 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Database className="w-3 h-3" />
                Tournament Lifecycle & Backup Vault
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Active Season: {currentEditionYear}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Championship Edition Archive & Data Export Center
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Conclude finished editions with permanent cryptographic snapshots, pull historical match ledgers anytime, and start brand-new tournament editions with clean boards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowArchiveModal(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-xl shadow-lg hover:shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer border border-amber-400/30"
            >
              <Archive className="w-4 h-4" />
              <span>End & Archive Current Edition</span>
            </button>

            <button
              onClick={() => setShowNewEditionModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg hover:shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer border border-emerald-400/30"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Edition from Fresh</span>
            </button>
          </div>
        </div>

        {/* Live Active Status Summary Strip */}
        <div className="mt-6 pt-5 border-t border-slate-700/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Active Fixtures on Site</span>
            <span className="text-white font-black text-sm sm:text-base">
              {activeFixtures.length > 0 ? `${activeFixtures.length} Matches` : '0 (Board Clean)'}
            </span>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Ranked Schools</span>
            <span className="text-white font-black text-sm sm:text-base">{activeStandings.length} Delegations</span>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Archived Editions</span>
            <span className="text-emerald-400 font-black text-sm sm:text-base">{archives.length} Editions Preserved</span>
          </div>
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">Site Display Mode</span>
            <span className="text-amber-300 font-black text-sm sm:text-base">
              {activeFixtures.length > 0 ? 'Live Tournament Season' : 'Records & Waiting Draw'}
            </span>
          </div>
        </div>
      </div>

      {/* Archives Roster & Pull Out Center */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <span>Preserved Edition Archives & Pull-Out Data Vault</span>
            </h3>
            <p className="text-xs text-slate-500">
              Select any tournament edition to inspect all match ballots, download the full JSON backup, or export the match spreadsheet.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full w-fit">
            {archives.length} Completed Records
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Loading preserved editions from cloud vault...</span>
          </div>
        ) : archives.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 space-y-2">
            <Archive className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No Historical Archives Saved Yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When a tournament edition concludes, use the "End & Archive Current Edition" button above to preserve its complete records.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {archives.map((archive) => (
              <div 
                key={archive.id}
                className="bg-slate-50 hover:bg-slate-100/80 transition-all rounded-xl p-5 border border-slate-200/80 space-y-4 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                        {archive.editionYear}
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-slate-900 mt-1">
                        {archive.editionTitle}
                      </h4>
                      {archive.theme && (
                        <p className="text-xs text-slate-500 italic mt-0.5">
                          "{archive.theme}"
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Archived
                    </span>
                  </div>

                  {/* Highlights Summary */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200/60">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Champion School</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1 truncate">
                        <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {archive.championSchool || 'TBD'}
                      </span>
                      <span className="text-[10px] text-slate-500">{archive.championCounty}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">National Best Speaker</span>
                      <span className="font-bold text-slate-900 flex items-center gap-1 truncate">
                        <Award className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        {archive.bestSpeaker || 'TBD'}
                      </span>
                      <span className="text-[10px] text-slate-500">{archive.bestSpeakerSchool || archive.runnerUpSchool}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Archived: {new Date(archive.archivedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {archive.fixturesCount || archive.fixtures?.length || 0} Matches
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {archive.totalSchools || archive.schoolsCount || 32} Schools
                    </span>
                  </div>
                </div>

                {/* Actions: Pull out data buttons */}
                <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setInspectingArchive(archive);
                      setInspectTab('overview');
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg border border-slate-300 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                    <span>Inspect Records</span>
                  </button>

                  <button
                    onClick={() => {
                      exportEditionArchiveJson(archive);
                      toast.success(`Full JSON archive for ${archive.editionYear} downloaded!`, 'Data Pulled Out');
                    }}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Download complete JSON dataset"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Pull Data (JSON)</span>
                  </button>

                  <button
                    onClick={() => {
                      exportEditionArchiveCsv(archive);
                      toast.success(`Match ledger CSV for ${archive.editionYear} downloaded!`, 'Data Pulled Out');
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Download match ledger CSV"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  {archive.fixtures && archive.fixtures.length > 0 && (
                    <button
                      onClick={() => handleRestoreToLive(archive)}
                      disabled={restoringId === archive.id}
                      className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 font-bold text-[11px] rounded-lg ml-auto flex items-center gap-1 cursor-pointer"
                      title="Mount back into active fixtures"
                    >
                      <RotateCcw className={`w-3 h-3 ${restoringId === archive.id ? 'animate-spin' : ''}`} />
                      <span>{restoringId === archive.id ? 'Restoring...' : 'Restore to Live'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: End & Archive Current Edition */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    End & Archive Current Edition ({archiveForm.editionYear})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Creates an immutable cloud snapshot, downloads offline JSON backup, and removes live active fixtures from the site.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowArchiveModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmArchive} className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
                <span className="font-black flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  What happens when you archive:
                </span>
                <p className="text-amber-800">
                  1. All {activeFixtures.length} live matches, {activeStandings.length} team standings, ballots, and scores are stored permanently in the Cloud Archive.
                </p>
                <p className="text-amber-800">
                  2. A full <code>.json</code> backup is downloaded directly to your device so you can pull out this data at any point in the future.
                </p>
                <p className="text-amber-800">
                  3. The live tournament board is cleaned so only historical records remain on the site until a new edition starts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Edition Year:</label>
                  <input
                    type="text"
                    required
                    value={archiveForm.editionYear}
                    onChange={(e) => setArchiveForm({ ...archiveForm, editionYear: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Official Edition Title:</label>
                  <input
                    type="text"
                    required
                    value={archiveForm.editionTitle}
                    onChange={(e) => setArchiveForm({ ...archiveForm, editionTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Champion School:</label>
                  <input
                    type="text"
                    required
                    value={archiveForm.championSchool}
                    onChange={(e) => setArchiveForm({ ...archiveForm, championSchool: e.target.value })}
                    placeholder="e.g. United Dawah Ummah High School"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Champion County:</label>
                  <input
                    type="text"
                    value={archiveForm.championCounty}
                    onChange={(e) => setArchiveForm({ ...archiveForm, championCounty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Runner-Up School:</label>
                  <input
                    type="text"
                    value={archiveForm.runnerUpSchool}
                    onChange={(e) => setArchiveForm({ ...archiveForm, runnerUpSchool: e.target.value })}
                    placeholder="e.g. St. Teresa's Convent High School"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Final Decision / Score:</label>
                  <input
                    type="text"
                    value={archiveForm.finalScore}
                    onChange={(e) => setArchiveForm({ ...archiveForm, finalScore: e.target.value })}
                    placeholder="e.g. 5 - 2 (Split Panel Decision)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">National Best Speaker:</label>
                  <input
                    type="text"
                    value={archiveForm.bestSpeaker}
                    onChange={(e) => setArchiveForm({ ...archiveForm, bestSpeaker: e.target.value })}
                    placeholder="e.g. Khadija Sheriff"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Best Speaker School:</label>
                  <input
                    type="text"
                    value={archiveForm.bestSpeakerSchool}
                    onChange={(e) => setArchiveForm({ ...archiveForm, bestSpeakerSchool: e.target.value })}
                    placeholder="e.g. United Dawah Ummah High School"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Grand Final Debate Motion:</label>
                <textarea
                  rows={2}
                  value={archiveForm.finalMotion}
                  onChange={(e) => setArchiveForm({ ...archiveForm, finalMotion: e.target.value })}
                  placeholder="Enter the official grand final motion..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowArchiveModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isArchiving}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-black text-xs rounded-lg shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Archive className="w-4 h-4" />
                  <span>{isArchiving ? 'Archiving & Backing Up...' : 'Archive Edition & Download Backup'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Initialize Fresh New Edition */}
      {showNewEditionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Create New Edition from Fresh
                  </h3>
                  <p className="text-xs text-slate-500">
                    Starts a clean competitive slate, resets live fixtures, and opens 15-county registration.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewEditionModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmFreshEdition} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 space-y-1">
                <span className="font-black flex items-center gap-1">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  Fresh Start Workflow:
                </span>
                <p className="text-emerald-800">
                  • Past edition data has been preserved in the Historical Records.
                </p>
                <p className="text-emerald-800">
                  • As the new edition starts, it begins real-time updates as schools register, the draw is generated, and matches are scored.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">New Season Year:</label>
                  <input
                    type="text"
                    required
                    value={newEditionForm.year}
                    onChange={(e) => setNewEditionForm({ ...newEditionForm, year: e.target.value })}
                    placeholder="e.g. 2025/2026 or 2026/2027"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase">Official Title:</label>
                  <input
                    type="text"
                    required
                    value={newEditionForm.title}
                    onChange={(e) => setNewEditionForm({ ...newEditionForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Season Theme:</label>
                <input
                  type="text"
                  value={newEditionForm.theme}
                  onChange={(e) => setNewEditionForm({ ...newEditionForm, theme: e.target.value })}
                  placeholder="e.g. Technological Sovereignty, Climate Resilience & Democratic Renewal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Grand Final Venue:</label>
                <input
                  type="text"
                  value={newEditionForm.grandVenue}
                  onChange={(e) => setNewEditionForm({ ...newEditionForm, grandVenue: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-800 font-medium"
                />
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">Open 15-County Public Registration</span>
                  <span className="text-[11px] text-slate-500">Allow schools across Liberia to begin submitting team rosters immediately</span>
                </div>
                <input
                  type="checkbox"
                  checked={newEditionForm.openRegistrationImmediately}
                  onChange={(e) => setNewEditionForm({ ...newEditionForm, openRegistrationImmediately: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewEditionModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFresh}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs rounded-lg shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isCreatingFresh ? 'Starting Fresh...' : 'Launch Fresh New Edition'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Inspect Archive Details Drawer/Modal */}
      {inspectingArchive && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  {inspectingArchive.editionYear} Preserved Records
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                  {inspectingArchive.editionTitle}
                </h3>
                <p className="text-xs text-slate-500">
                  Archived on {new Date(inspectingArchive.archivedAt).toLocaleString()} by {inspectingArchive.archivedBy}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportEditionArchiveJson(inspectingArchive)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Pull JSON</span>
                </button>
                <button
                  onClick={() => setInspectingArchive(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Sub-tab navigation inside inspect modal */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setInspectTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  inspectTab === 'overview' 
                    ? 'bg-emerald-800 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Overview & Honors
              </button>
              <button
                onClick={() => setInspectTab('matches')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  inspectTab === 'matches' 
                    ? 'bg-emerald-800 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Match Ledger ({inspectingArchive.fixtures?.length || inspectingArchive.fixturesCount || 0})
              </button>
              <button
                onClick={() => setInspectTab('standings')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  inspectTab === 'standings' 
                    ? 'bg-emerald-800 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Standings Matrix ({inspectingArchive.standings?.length || inspectingArchive.standingsCount || 0})
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {/* TAB 1: OVERVIEW */}
              {inspectTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/80 space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-amber-800 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-600" />
                        National Champion
                      </span>
                      <h4 className="text-base font-black text-slate-900">
                        {inspectingArchive.championSchool || 'TBD'}
                      </h4>
                      <p className="text-xs text-slate-600">{inspectingArchive.championCounty} County</p>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200/80 space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-indigo-800 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-indigo-600" />
                        National Best Speaker
                      </span>
                      <h4 className="text-base font-black text-slate-900">
                        {inspectingArchive.bestSpeaker || 'TBD'}
                      </h4>
                      <p className="text-xs text-slate-600">{inspectingArchive.bestSpeakerSchool || inspectingArchive.championSchool}</p>
                    </div>
                  </div>

                  {inspectingArchive.finalMotion && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400">Grand Final Motion</span>
                      <p className="text-xs font-semibold text-slate-800 italic">
                        "{inspectingArchive.finalMotion}"
                      </p>
                      <span className="text-[11px] font-bold text-emerald-700 block mt-1">
                        Decision: {inspectingArchive.finalScore || '5-2 Split Panel'}
                      </span>
                    </div>
                  )}

                  {inspectingArchive.summary && (
                    <div className="space-y-1 text-xs text-slate-700">
                      <span className="font-bold text-slate-900 uppercase text-[11px]">Championship Summary:</span>
                      <p className="leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                        {inspectingArchive.summary}
                      </p>
                    </div>
                  )}

                  {inspectingArchive.keyHighlights && inspectingArchive.keyHighlights.length > 0 && (
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-slate-900 uppercase text-[11px]">Key Highlights:</span>
                      <ul className="list-disc list-inside space-y-1 text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                        {inspectingArchive.keyHighlights.map((hl, i) => (
                          <li key={i}>{hl}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: MATCHES */}
              {inspectTab === 'matches' && (
                <div className="space-y-3">
                  {(!inspectingArchive.fixtures || inspectingArchive.fixtures.length === 0) ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No individual match records saved inside this snapshot.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {inspectingArchive.fixtures.map((f, i) => (
                        <div key={f.id || i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                              {f.roundName || `Match #${i+1}`}
                            </span>
                            <div className="font-bold text-slate-900">
                              <span className={f.winnerId === f.teamA?.schoolId ? 'text-emerald-700 underline' : ''}>
                                {f.teamA?.schoolName}
                              </span>
                              <span className="text-slate-400 mx-2">vs</span>
                              <span className={f.winnerId === f.teamB?.schoolId ? 'text-emerald-700 underline' : ''}>
                                {f.teamB?.schoolName}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 italic">"{f.motion}"</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-black text-slate-800 block">{f.winnerName ? `Won by ${f.winnerName}` : 'Completed'}</span>
                            <span className="text-[10px] text-slate-400">{f.venue || 'County Hall'} • {f.matchDate || 'Official Date'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: STANDINGS */}
              {inspectTab === 'standings' && (
                <div className="space-y-3">
                  {(!inspectingArchive.standings || inspectingArchive.standings.length === 0) ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No detailed standings table captured inside this snapshot.
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5">Rank</th>
                            <th className="p-2.5">School Name</th>
                            <th className="p-2.5">County</th>
                            <th className="p-2.5 text-center">Played</th>
                            <th className="p-2.5 text-center">Won</th>
                            <th className="p-2.5 text-center">Ballots</th>
                            <th className="p-2.5 text-right">Speaker Points</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                          {inspectingArchive.standings.map((s, idx) => (
                            <tr key={s.schoolId || idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold">#{s.rank || idx + 1}</td>
                              <td className="p-2.5 font-bold text-slate-900">{s.schoolName}</td>
                              <td className="p-2.5 text-slate-600">{s.county}</td>
                              <td className="p-2.5 text-center">{s.matchesPlayed}</td>
                              <td className="p-2.5 text-center font-bold text-emerald-700">{s.matchesWon}</td>
                              <td className="p-2.5 text-center">{s.ballotsWon}-{s.ballotsLost}</td>
                              <td className="p-2.5 text-right font-black text-slate-900">{s.totalSpeakerScore}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
