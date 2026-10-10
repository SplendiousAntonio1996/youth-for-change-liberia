import React, { useState } from 'react';
import { 
  Trophy, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  Users, 
  Building2, 
  Flame, 
  Eye, 
  X, 
  Save, 
  Layers, 
  BookOpen, 
  Download,
  Copy,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
  Database,
  Archive
} from 'lucide-react';
import { DebateEdition } from '../types';
import { useDebateEditions } from '../hooks/useDebateEditions';
import { 
  createDebateEdition, 
  updateDebateEdition, 
  deleteDebateEdition, 
  seedDefaultDebateEditions,
  normalizeEditionKey
} from '../lib/debateService';
import { SafeImage } from './SafeImage';
import { ImageUploadField } from './ImageUploadField';
import { useToast } from '../context/ToastContext';
import { EditionDataPullOutModal } from './EditionDataPullOutModal';

interface AdminDebateEditionsManagerProps {
  userEmail?: string | null;
}

const LIBERIA_COUNTIES = [
  'Montserrado', 'Margibi', 'Nimba', 'Bong', 'Grand Bassa', 
  'Lofa', 'Maryland', 'Sinoe', 'Grand Cape Mount', 'Bomi', 
  'Grand Gedeh', 'River Gee', 'Rivercess', 'Grand Kru', 'Gbarpolu'
];

const PRESET_EDITION_IMAGES = [
  {
    label: 'Official Debate Championship (National)',
    url: '/debate.jpeg'
  },
  {
    label: 'Official Delegation & Group Photo',
    url: '/group.jpg'
  },
  {
    label: 'Mission & Vision Action Visual',
    url: '/MISSION.jpeg'
  },
  {
    label: 'Championship Stage & Podium',
    url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Debaters at Microphone',
    url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    label: 'Trophy Presentation & Celebration',
    url: 'https://images.unsplash.com/photo-1544531585-9847b68c8c86?auto=format&fit=crop&w=1200&q=80'
  }
];

export const AdminDebateEditionsManager: React.FC<AdminDebateEditionsManagerProps> = ({ userEmail }) => {
  const toast = useToast();
  const { editionsList, loading } = useDebateEditions();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [countyFilter, setCountyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingEdition, setDeletingEdition] = useState<DebateEdition | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cloud Sync / Seed State
  const [seeding, setSeeding] = useState(false);

  // Archive & Pull-Out Vault Modal State
  const [isPullOutModalOpen, setIsPullOutModalOpen] = useState(false);
  const [pullOutInitialYear, setPullOutInitialYear] = useState('2024/2025');

  // Form State
  const [formData, setFormData] = useState({
    year: '',
    title: '',
    tagline: '',
    theme: '',
    championSchool: '',
    championCounty: 'Montserrado',
    runnerUpSchool: '',
    runnerUpCounty: 'Montserrado',
    bestSpeaker: '',
    bestSpeakerSchool: '',
    totalSchools: 32,
    totalCounties: 15,
    finalMotion: '',
    finalScore: '5 - 2 (Split Panel Decision)',
    highlightsText: '',
    summary: '',
    image: PRESET_EDITION_IMAGES[0].url,
    semiFinalistsText: '',
    notableMotionsText: '',
    status: 'Completed' as DebateEdition['status']
  });

  // Open Create Modal
  const handleOpenCreateModal = () => {
    const nextYear = (new Date().getFullYear() + 1).toString();
    setFormData({
      year: nextYear,
      title: `${nextYear} National Debate Championship`,
      tagline: 'Empowering County Forensics, Critical Discourse & Civic Leadership',
      theme: 'Youth Agency, Democratic Governance, and National Renewal',
      championSchool: '',
      championCounty: 'Montserrado',
      runnerUpSchool: '',
      runnerUpCounty: 'Montserrado',
      bestSpeaker: '',
      bestSpeakerSchool: '',
      totalSchools: 48,
      totalCounties: 15,
      finalMotion: '',
      finalScore: '5 - 2',
      highlightsText: `Over 48 high schools competed across county qualifiers.\nGrand Final was broadcast live on national radio.\nRecord number of female team captains participated.`,
      summary: `The ${nextYear} National Debate Championship brought together the finest high school debaters from across Liberia to debate vital policy, governance, and economic questions.`,
      image: PRESET_EDITION_IMAGES[0].url,
      semiFinalistsText: `St. Patrick's High School\nMonrovia College\nB.W. Harris High\nBooker Washington Institute (BWI)`,
      notableMotionsText: `THW mandate solar power investments in all public high schools.\nTHB local government decentralization is vital for rural economic growth.\nTHW introduce mandatory civic education curricula across all high schools.`,
      status: 'Upcoming'
    });
    setIsEditing(false);
    setEditingKey(null);
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (edition: DebateEdition) => {
    setFormData({
      year: edition.year,
      title: edition.title,
      tagline: edition.tagline || '',
      theme: edition.theme || '',
      championSchool: edition.championSchool || '',
      championCounty: edition.championCounty || 'Montserrado',
      runnerUpSchool: edition.runnerUpSchool || '',
      runnerUpCounty: edition.runnerUpCounty || 'Montserrado',
      bestSpeaker: edition.bestSpeaker || '',
      bestSpeakerSchool: edition.bestSpeakerSchool || '',
      totalSchools: edition.totalSchools || 0,
      totalCounties: edition.totalCounties || 0,
      finalMotion: edition.finalMotion || '',
      finalScore: edition.finalScore || '',
      highlightsText: edition.keyHighlights?.join('\n') || '',
      summary: edition.summary || '',
      image: edition.image || PRESET_EDITION_IMAGES[0].url,
      semiFinalistsText: edition.semiFinalists?.join('\n') || '',
      notableMotionsText: edition.notableMotions?.join('\n') || '',
      status: edition.status || 'Completed'
    });
    setIsEditing(true);
    setEditingKey(edition.id || edition.year);
    setShowModal(true);
  };

  // Save Tournament Edition (Create or Update)
  const handleSaveEdition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.year.trim() || !formData.title.trim()) {
      toast.error('Please provide both the tournament year and title.', 'Missing Required Fields');
      return;
    }

    setSaving(true);
    try {
      const keyHighlights = formData.highlightsText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const semiFinalists = formData.semiFinalistsText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const notableMotions = formData.notableMotionsText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const payload: Omit<DebateEdition, 'id'> = {
        year: formData.year.trim(),
        title: formData.title.trim(),
        tagline: formData.tagline.trim(),
        theme: formData.theme.trim(),
        championSchool: formData.championSchool.trim(),
        championCounty: formData.championCounty,
        runnerUpSchool: formData.runnerUpSchool.trim(),
        runnerUpCounty: formData.runnerUpCounty,
        bestSpeaker: formData.bestSpeaker.trim(),
        bestSpeakerSchool: formData.bestSpeakerSchool.trim(),
        totalSchools: Number(formData.totalSchools) || 0,
        totalCounties: Number(formData.totalCounties) || 0,
        finalMotion: formData.finalMotion.trim(),
        finalScore: formData.finalScore.trim(),
        keyHighlights,
        summary: formData.summary.trim(),
        image: formData.image.trim(),
        semiFinalists,
        notableMotions,
        status: formData.status
      };

      if (isEditing && editingKey) {
        await updateDebateEdition(editingKey, payload);
        toast.success(`Tournament edition "${formData.title}" updated successfully!`, 'Tournament Updated');
      } else {
        await createDebateEdition(payload, userEmail || undefined);
        toast.success(`Tournament edition "${formData.title}" created successfully!`, 'Tournament Created');
      }

      setShowModal(false);
    } catch (err: any) {
      console.error('Error saving tournament edition:', err);
      toast.error(`Failed to save tournament edition: ${err.message || 'Unknown error'}`, 'Save Failed');
    } finally {
      setSaving(false);
    }
  };

  // Open Delete Confirmation Modal
  const handleOpenDeleteModal = (edition: DebateEdition) => {
    setDeletingEdition(edition);
    setShowDeleteModal(true);
  };

  // Execute Deletion
  const handleDeleteEdition = async () => {
    if (!deletingEdition) return;

    setDeleting(true);
    try {
      const key = deletingEdition.id || deletingEdition.year;
      await deleteDebateEdition(key);
      toast.success(`Edition "${deletingEdition.title}" was deleted.`, 'Tournament Deleted');
      setShowDeleteModal(false);
      setDeletingEdition(null);
    } catch (err: any) {
      console.error('Error deleting debate edition:', err);
      toast.error(`Failed to delete edition: ${err.message || 'Unknown error'}`, 'Delete Failed');
    } finally {
      setDeleting(false);
    }
  };

  // Seed / Sync All Baseline Editions to Cloud Database
  const handleSeedDefaults = async () => {
    const confirmSync = window.confirm(
      'This will populate all 10 historical National Debate Championship editions (2015-2025) into the cloud database so they can be edited or managed freely. Continue?'
    );
    if (!confirmSync) return;

    setSeeding(true);
    try {
      const count = await seedDefaultDebateEditions(userEmail || undefined);
      toast.success(`Successfully synchronized ${count} championship editions to Firestore!`, 'Sync Complete');
    } catch (err: any) {
      console.error('Error seeding debate editions:', err);
      toast.error(`Sync failed: ${err.message || 'Unknown error'}`, 'Sync Failed');
    } finally {
      setSeeding(false);
    }
  };

  // Filter editions
  const filteredEditions = editionsList.filter(ed => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      ed.year.toLowerCase().includes(query) ||
      ed.title.toLowerCase().includes(query) ||
      (ed.theme && ed.theme.toLowerCase().includes(query)) ||
      (ed.championSchool && ed.championSchool.toLowerCase().includes(query)) ||
      (ed.championCounty && ed.championCounty.toLowerCase().includes(query)) ||
      (ed.bestSpeaker && ed.bestSpeaker.toLowerCase().includes(query)) ||
      (ed.finalMotion && ed.finalMotion.toLowerCase().includes(query));

    const matchesCounty = countyFilter === 'All' || 
      ed.championCounty === countyFilter || 
      ed.runnerUpCounty === countyFilter;

    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Completed' && (!ed.status || ed.status === 'Completed')) ||
      ed.status === statusFilter;

    return matchesSearch && matchesCounty && matchesStatus;
  });

  // Calculate Metrics
  const totalEditions = editionsList.length;
  const totalParticipatingSchools = editionsList.reduce((acc, curr) => acc + (curr.totalSchools || 0), 0);
  const uniqueChampions = new Set(editionsList.map(e => e.championSchool).filter(Boolean)).size;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner & Stats Overview */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white border border-emerald-800/40 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400 text-emerald-950 rounded-full text-xs font-bold uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5" />
              <span>National Debate Championship Management Desk</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Tournament Editions & Championship Archives
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Create new tournament editions, manage historical scorecards, update champion schools, edit tournament motions, and synchronize national forensics records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              id="seed-debate-editions-btn"
              onClick={handleSeedDefaults}
              disabled={seeding}
              className="px-4 py-2.5 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/80 font-bold rounded-xl text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
              title="Populate all 10 baseline editions into Cloud Firestore"
            >
              <RefreshCw className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seeding ? 'Syncing to Cloud...' : 'Sync Default 10 Editions'}</span>
            </button>

            <button
              id="admin-pull-out-vault-btn"
              onClick={() => {
                setPullOutInitialYear('2024/2025');
                setIsPullOutModalOpen(true);
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer border border-slate-600 active:scale-95"
              title="Open the Archive Vault to pull out JSON datasets or CSV match ledgers"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Archive & Pull-Out Vault</span>
            </button>

            <button
              id="create-new-edition-btn"
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Tournament Edition</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-emerald-800/40 text-xs">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <span className="text-slate-300 block text-[11px] font-medium">Championship Editions</span>
            <span className="text-2xl sm:text-3xl font-black text-yellow-400 mt-1 block">
              {totalEditions}
            </span>
            <span className="text-[10px] text-emerald-200">2015 — Present</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <span className="text-slate-300 block text-[11px] font-medium">Unique Champion Schools</span>
            <span className="text-2xl sm:text-3xl font-black text-white mt-1 block">
              {uniqueChampions}
            </span>
            <span className="text-[10px] text-emerald-200">National Title Holders</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <span className="text-slate-300 block text-[11px] font-medium">Cumulative School Delegations</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-300 mt-1 block">
              {totalParticipatingSchools}+
            </span>
            <span className="text-[10px] text-emerald-200">Across 15 Counties</span>
          </div>

          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
            <span className="text-slate-300 block text-[11px] font-medium">Database Persistence</span>
            <span className="text-base sm:text-lg font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Cloud Live Sync
            </span>
            <span className="text-[10px] text-slate-300">Real-time Firestore</span>
          </div>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by year, title, champion school, county, or motion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
            <select
              value={countyFilter}
              onChange={(e) => setCountyFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Counties</option>
              {LIBERIA_COUNTIES.map(c => (
                <option key={c} value={c}>{c} County</option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Upcoming">Upcoming / Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Displaying <strong className="text-slate-900">{filteredEditions.length}</strong> of {totalEditions} tournament editions
          </span>
          {(searchTerm || countyFilter !== 'All' || statusFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCountyFilter('All');
                setStatusFilter('All');
              }}
              className="text-emerald-800 hover:underline font-bold cursor-pointer text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Tournament Editions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEditions.map((edition) => {
          const isUpcoming = edition.status === 'Upcoming';
          const isFuture = edition.year.toLowerCase().includes('future') || isUpcoming;

          return (
            <div 
              key={edition.id || edition.year}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Card Header & Banner Image */}
              <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-950">
                <SafeImage
                  src={edition.image}
                  alt={edition.title}
                  className="w-full h-full object-cover object-top opacity-85 hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                {/* Year Badge & Status */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="bg-yellow-400 text-emerald-950 font-black px-3 py-1 rounded-xl text-xs sm:text-sm shadow-md">
                    {edition.year} Edition
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                    isFuture 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-emerald-600 text-white'
                  }`}>
                    {edition.status || (isFuture ? 'Upcoming' : 'Completed')}
                  </span>
                </div>

                {/* Edit & Delete Action Buttons on Card */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(edition)}
                    className="p-2 bg-white/90 hover:bg-white text-slate-800 rounded-xl shadow-md transition-colors cursor-pointer"
                    title="Edit tournament edition"
                  >
                    <Edit3 className="w-4 h-4 text-emerald-800" />
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal(edition)}
                    className="p-2 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl shadow-md transition-colors cursor-pointer"
                    title="Delete tournament edition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Title & Tagline at bottom of banner */}
                <div className="absolute bottom-3 left-4 right-4 text-white space-y-0.5">
                  <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                    {edition.title}
                  </h3>
                  <p className="text-xs text-emerald-200 italic line-clamp-1">
                    "{edition.tagline || edition.theme}"
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Theme */}
                  {edition.theme && (
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                      <span className="font-bold text-slate-500 block text-[10px] uppercase tracking-wider mb-0.5">
                        Official Championship Theme:
                      </span>
                      <p className="text-slate-800 font-medium leading-relaxed">
                        {edition.theme}
                      </p>
                    </div>
                  )}

                  {/* Champion vs Runner-Up Box */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-[10px] uppercase tracking-wider">
                        <Trophy className="w-3.5 h-3.5 text-yellow-600" />
                        <span>National Champion</span>
                      </div>
                      <p className="font-extrabold text-slate-900 text-sm leading-tight">
                        {edition.championSchool || 'To be determined'}
                      </p>
                      <p className="text-[11px] text-emerald-800 font-medium">
                        {edition.championCounty ? `${edition.championCounty} County` : ''}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                        <Award className="w-3.5 h-3.5 text-slate-500" />
                        <span>Runner-Up School</span>
                      </div>
                      <p className="font-extrabold text-slate-900 text-sm leading-tight">
                        {edition.runnerUpSchool || 'To be determined'}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {edition.runnerUpCounty ? `${edition.runnerUpCounty} County` : ''}
                      </p>
                    </div>
                  </div>

                  {/* MVP Best Speaker & Panel Score */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-yellow-600 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">MVP Best Speaker</span>
                        <strong className="text-slate-800">{edition.bestSpeaker || 'Pending'}</strong>
                        {edition.bestSpeakerSchool && (
                          <span className="text-[11px] text-slate-500 ml-1">({edition.bestSpeakerSchool})</span>
                        )}
                      </div>
                    </div>

                    {edition.finalScore && (
                      <span className="px-2.5 py-1 bg-yellow-100 text-amber-900 font-bold rounded-lg text-[11px]">
                        Final: {edition.finalScore}
                      </span>
                    )}
                  </div>

                  {/* Final Motion Preview */}
                  {edition.finalMotion && (
                    <div className="text-xs space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Grand Final Motion:
                      </span>
                      <p className="text-slate-700 italic bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 line-clamp-2">
                        "{edition.finalMotion}"
                      </p>
                    </div>
                  )}

                  {/* Statistics Pill Summary */}
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {edition.totalSchools || 0} Schools
                    </span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {edition.totalCounties || 0} Counties
                    </span>
                    {edition.notableMotions && edition.notableMotions.length > 0 && (
                      <span className="bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-lg font-semibold">
                        {edition.notableMotions.length} Motions Recorded
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {edition.createdAt ? `Updated: ${new Date(edition.createdAt).toLocaleDateString()}` : 'Default Edition'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setPullOutInitialYear(edition.year);
                        setIsPullOutModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
                      title="Pull out and download full dataset of this tournament edition"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Pull Data</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(edition)}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Edition</span>
                    </button>
                    <button
                      onClick={() => handleOpenDeleteModal(edition)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      title="Delete edition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredEditions.length === 0 && (
        <div className="bg-slate-50 rounded-3xl p-12 text-center border border-slate-200 space-y-3">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">No Tournament Editions Found</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search criteria or create a brand new tournament edition using the button above.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Create Tournament Edition
          </button>
        </div>
      )}

      {/* ADD / EDIT TOURNAMENT EDITION MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-yellow-100 text-yellow-900 rounded-md text-[11px] font-bold uppercase tracking-wider mb-1">
                  <Trophy className="w-3.5 h-3.5 text-yellow-700" />
                  <span>{isEditing ? 'Edit Championship Record' : 'New Tournament Edition'}</span>
                </div>
                <h3 className="font-extrabold text-slate-900 text-lg sm:text-2xl">
                  {isEditing ? `Edit Edition: ${formData.title}` : 'Add New National Debate Championship Edition'}
                </h3>
                <p className="text-xs text-slate-500">
                  Fill in the complete tournament metadata, final match results, motions debated, and highlights.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdition} className="space-y-6">
              {/* SECTION 1: Core Edition Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <span>1. General Edition Metadata</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Edition Year *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026 or 2025/2026"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Championship Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 2026 National Debate Championship"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Tournament Tagline</label>
                    <input
                      type="text"
                      placeholder="e.g. Amplifying Youth Voices & Fostering Critical Inquiry"
                      value={formData.tagline}
                      onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Tournament Theme</label>
                    <input
                      type="text"
                      placeholder="e.g. Constitutional Democracy, Natural Resources, and Youth Leadership"
                      value={formData.theme}
                      onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    >
                      <option value="Completed">Completed</option>
                      <option value="Upcoming">Upcoming / In Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Total High Schools</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.totalSchools}
                      onChange={(e) => setFormData({ ...formData, totalSchools: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Total Counties Represented</label>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={formData.totalCounties}
                      onChange={(e) => setFormData({ ...formData, totalCounties: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Grand Finals & Champion Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Trophy className="w-4 h-4 text-yellow-600" />
                  <span>2. Grand Final Outcome & Champion School</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-emerald-950 uppercase block">
                      🏆 Champion Delegation (Affirmative)
                    </span>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Champion High School</label>
                      <input
                        type="text"
                        placeholder="e.g. St. Patrick's High School"
                        value={formData.championSchool}
                        onChange={(e) => setFormData({ ...formData, championSchool: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Champion County</label>
                      <select
                        value={formData.championCounty}
                        onChange={(e) => setFormData({ ...formData, championCounty: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs focus:outline-none"
                      >
                        {LIBERIA_COUNTIES.map(c => (
                          <option key={c} value={c}>{c} County</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-bold text-slate-800 uppercase block">
                      🥈 Runner-Up Delegation (Opposition)
                    </span>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Runner-Up High School</label>
                      <input
                        type="text"
                        placeholder="e.g. Monrovia College"
                        value={formData.runnerUpSchool}
                        onChange={(e) => setFormData({ ...formData, runnerUpSchool: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700">Runner-Up County</label>
                      <select
                        value={formData.runnerUpCounty}
                        onChange={(e) => setFormData({ ...formData, runnerUpCounty: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                      >
                        {LIBERIA_COUNTIES.map(c => (
                          <option key={c} value={c}>{c} County</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Final Panel Decision / Score</label>
                    <input
                      type="text"
                      placeholder="e.g. 5 - 2 (Split Panel Decision) or 7 - 0 Unanimous"
                      value={formData.finalScore}
                      onChange={(e) => setFormData({ ...formData, finalScore: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Grand Final Motion Debated</label>
                    <input
                      type="text"
                      placeholder="e.g. This House believes that civic education should be mandatory across all high schools."
                      value={formData.finalMotion}
                      onChange={(e) => setFormData({ ...formData, finalMotion: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: MVP Best Speaker & Semifinalists */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-600" />
                  <span>3. MVP Best Speaker & Semifinalists</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Best Speaker (MVP) Name</label>
                    <input
                      type="text"
                      placeholder="e.g. J. Emmanuel Dolo Jr."
                      value={formData.bestSpeaker}
                      onChange={(e) => setFormData({ ...formData, bestSpeaker: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Best Speaker School</label>
                    <input
                      type="text"
                      placeholder="e.g. St. Patrick's High School"
                      value={formData.bestSpeakerSchool}
                      onChange={(e) => setFormData({ ...formData, bestSpeakerSchool: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Semifinalist Schools (One school per line)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="B.W. Harris Episcopal High&#10;College of West Africa (CWA)"
                    value={formData.semiFinalistsText}
                    onChange={(e) => setFormData({ ...formData, semiFinalistsText: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none resize-none font-mono"
                  />
                </div>
              </div>

              {/* SECTION 4: Media Banner & Preset Selection */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>4. Banner Image & Media Artwork</span>
                </h4>

                <ImageUploadField
                  label="Tournament Edition Cover / Banner Picture"
                  value={formData.image}
                  onChange={(val) => setFormData({ ...formData, image: val })}
                  aspectRatio="auto"
                  defaultFit="contain"
                  presets={PRESET_EDITION_IMAGES}
                  helperText="Upload a championship photo, stage banner, or team trophy picture directly from your computer. Full resolution and framing are preserved with zero head-cropping."
                />
              </div>

              {/* SECTION 5: Motions, Highlights & Narrative Summary */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span>5. Key Highlights, Notable Motions & Narrative Summary</span>
                </h4>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Key Highlights (One point per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="First national tournament broadcast live on ELBC radio.&#10;Over 1,200 students attended the Grand Final in Monrovia City Hall.&#10;County preliminary rounds expanded to Nimba and Bong."
                    value={formData.highlightsText}
                    onChange={(e) => setFormData({ ...formData, highlightsText: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">
                    Notable Motions Debated in this Edition (One motion per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="THW prioritize technical vocational training over university arts degrees.&#10;THB foreign aid has hindered economic self-sufficiency in Sub-Saharan Africa.&#10;THW ban single-use plastics to protect coastal ecosystems."
                    value={formData.notableMotionsText}
                    onChange={(e) => setFormData({ ...formData, notableMotionsText: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none resize-none font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Full Tournament Summary Narrative</label>
                  <textarea
                    rows={3}
                    placeholder="Write a concise overview of the tournament significance, competitive dynamics, and impact..."
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{isEditing ? 'Save Changes' : 'Publish Tournament Edition'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && deletingEdition && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                Delete Tournament Edition?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete the <strong className="text-slate-900 font-bold">"{deletingEdition.title}" ({deletingEdition.year})</strong> record from the cloud database?
              </p>
            </div>

            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-800 font-medium">
              ⚠️ This will remove the edition from the public Debate Archive, historical scorecards, and MVP registries.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEdition}
                disabled={deleting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Edition</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historical Records & Data Pull-Out Vault */}
      <EditionDataPullOutModal
        isOpen={isPullOutModalOpen}
        onClose={() => setIsPullOutModalOpen(false)}
        initialEditionYear={pullOutInitialYear}
        allEditions={editionsList}
      />
    </div>
  );
};
