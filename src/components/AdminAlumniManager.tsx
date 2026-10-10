import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, Users, Plus, Search, Filter, ShieldCheck, 
  Trash2, Edit3, CheckCircle2, Play, Film, Clock, Eye, 
  Mail, MapPin, Award, Briefcase, Sparkles, MessageSquareQuote, 
  X, Check, AlertCircle, RefreshCw, AlertTriangle
} from 'lucide-react';
import { AlumniProfile, AlumniTestimonial } from '../types';
import { 
  subscribeToAlumni, 
  subscribeToTestimonials, 
  createAlumni, 
  updateAlumni, 
  deleteAlumni,
  deleteTestimonial,
  updateTestimonial,
  createTestimonial
} from '../lib/alumniService';
import { SafeImage } from './SafeImage';
import { ImageUploadField } from './ImageUploadField';
import { VideoUploadField } from './VideoUploadField';
import { MediaVideoPlayer } from './MediaVideoPlayer';
import { AlumniProfileModal } from './AlumniProfileModal';
import { useToast } from '../context/ToastContext';

export const AdminAlumniManager: React.FC = () => {
  const toast = useToast();
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [testimonials, setTestimonials] = useState<AlumniTestimonial[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Preview & Vivid View Modal
  const [viewingProfile, setViewingProfile] = useState<AlumniProfile | null>(null);
  const [justAddedProfile, setJustAddedProfile] = useState<AlumniProfile | null>(null);

  // Search & Filters
  const [activeTab, setActiveTab] = useState<'roster' | 'testimonials'>('roster');
  const [search, setSearch] = useState('');
  const [countyFilter, setCountyFilter] = useState('all');
  const [fieldFilter, setFieldFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Video playback modal
  const [activeVideoSrc, setActiveVideoSrc] = useState<{ url: string; poster?: string; title: string } | null>(null);

  // Add / Edit Alumni Modal (Only Picture & Bio for media)
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAlum, setEditingAlum] = useState<AlumniProfile | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Add / Edit Testimonial & Video Story Modal
  const [showTestimModal, setShowTestimModal] = useState(false);
  const [editingTestim, setEditingTestim] = useState<AlumniTestimonial | null>(null);
  const [testimSubmitting, setTestimSubmitting] = useState(false);

  const [form, setForm] = useState<{
    name: string;
    highSchool: string;
    county: string;
    graduationYear: string;
    tournamentYear: string;
    role: AlumniProfile['role'];
    currentTitle: string;
    organizationOrUniversity: string;
    fieldOfWork: AlumniProfile['fieldOfWork'];
    bio: string;
    location: string;
    contactEmail: string;
    photo: string;
    linkedIn: string;
    isMentorAvailable: boolean;
    adviceForDebaters: string;
    approved: boolean;
  }>({
    name: '',
    highSchool: '',
    county: 'Montserrado',
    graduationYear: '2023',
    tournamentYear: '2022 (Debater)',
    role: 'Champion Debater',
    currentTitle: '',
    organizationOrUniversity: '',
    fieldOfWork: 'Law & Governance',
    bio: '',
    location: 'Monrovia, Liberia',
    contactEmail: '',
    photo: '',
    linkedIn: '',
    isMentorAvailable: true,
    adviceForDebaters: '',
    approved: true
  });

  const [testimForm, setTestimForm] = useState({
    name: '',
    highSchool: '',
    county: 'Montserrado',
    graduationYear: '2023',
    tournamentYear: '2022 (Debater)',
    role: 'Champion Debater',
    currentTitle: '',
    organizationOrUniversity: '',
    fieldOfWork: 'Law & Governance' as AlumniProfile['fieldOfWork'],
    impactArea: 'Civic Leadership',
    headline: '',
    keyQuote: '',
    story: '',
    photo: '',
    videoUrl: '',
    videoDuration: '',
    videoDurationSeconds: 0,
    videoPoster: '',
    verified: true,
    adviceSnippet: ''
  });

  useEffect(() => {
    const unsubAlumni = subscribeToAlumni((data) => {
      setAlumni(data);
      setLoading(false);
    });
    const unsubTestim = subscribeToTestimonials((data) => {
      setTestimonials(data);
    });
    return () => {
      unsubAlumni();
      unsubTestim();
    };
  }, []);

  const pendingAlumniCount = alumni.filter(a => a.approved === false).length;
  const pendingTestimonialsCount = testimonials.filter(t => t.verified === false).length;

  const handleOpenAdd = () => {
    setEditingAlum(null);
    setForm({
      name: '',
      highSchool: '',
      county: 'Montserrado',
      graduationYear: '2023',
      tournamentYear: '2022 (Debater)',
      role: 'Champion Debater',
      currentTitle: '',
      organizationOrUniversity: '',
      fieldOfWork: 'Law & Governance',
      bio: '',
      location: 'Monrovia, Liberia',
      contactEmail: '',
      photo: '',
      linkedIn: '',
      isMentorAvailable: true,
      adviceForDebaters: '',
      approved: true
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (alum: AlumniProfile) => {
    setEditingAlum(alum);
    setForm({
      name: alum.name,
      highSchool: alum.highSchool,
      county: alum.county,
      graduationYear: alum.graduationYear || '2023',
      tournamentYear: alum.tournamentYear || '2022 (Debater)',
      role: alum.role || 'Champion Debater',
      currentTitle: alum.currentTitle || '',
      organizationOrUniversity: alum.organizationOrUniversity || '',
      fieldOfWork: alum.fieldOfWork || 'Law & Governance',
      bio: alum.bio || '',
      location: alum.location || `${alum.county}, Liberia`,
      contactEmail: alum.contactEmail || '',
      photo: alum.photo || '',
      linkedIn: alum.linkedIn || '',
      isMentorAvailable: alum.isMentorAvailable ?? true,
      adviceForDebaters: alum.adviceForDebaters || '',
      approved: alum.approved !== false
    });
    setShowAddModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.highSchool.trim()) {
      toast.warning('Name and High School are required fields.', 'Missing Information');
      return;
    }

    setSubmitting(true);
    try {
      if (editingAlum) {
        await updateAlumni(editingAlum.id, {
          ...form,
          status: form.approved ? 'active' : 'pending'
        });
        toast.success(`Alumni profile for ${form.name} updated successfully!`, 'Profile Saved');
        setViewingProfile({
          ...editingAlum,
          ...form,
          status: form.approved ? 'active' : 'pending'
        });
      } else {
        const created = await createAlumni({
          ...form,
          status: form.approved ? 'active' : 'pending'
        });
        toast.success(`Alumni profile for ${form.name} created!`, 'Alumnus Added');
        setJustAddedProfile(created);
        setViewingProfile(created);
      }
      setShowAddModal(false);
    } catch (err: any) {
      console.error('Error saving alumni:', err);
      toast.error('Failed to save profile. Please try again.', 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAddTestimonial = () => {
    setEditingTestim(null);
    setTestimForm({
      name: '',
      highSchool: '',
      county: 'Montserrado',
      graduationYear: '2023',
      tournamentYear: '2022 (Debater)',
      role: 'Champion Debater',
      currentTitle: '',
      organizationOrUniversity: '',
      fieldOfWork: 'Law & Governance',
      impactArea: 'Civic Leadership',
      headline: '',
      keyQuote: '',
      story: '',
      photo: '',
      videoUrl: '',
      videoDuration: '',
      videoDurationSeconds: 0,
      videoPoster: '',
      verified: true,
      adviceSnippet: ''
    });
    setShowTestimModal(true);
  };

  const handleOpenEditTestimonial = (testim: AlumniTestimonial) => {
    setEditingTestim(testim);
    setTestimForm({
      name: testim.name,
      highSchool: testim.highSchool || '',
      county: testim.county || 'Montserrado',
      graduationYear: testim.graduationYear || '2023',
      tournamentYear: testim.tournamentYear || '2022 (Debater)',
      role: testim.role || 'Champion Debater',
      currentTitle: testim.currentTitle || '',
      organizationOrUniversity: testim.organizationOrUniversity || '',
      fieldOfWork: (testim.fieldOfWork as AlumniProfile['fieldOfWork']) || 'Law & Governance',
      impactArea: testim.impactArea || 'Civic Leadership',
      headline: testim.headline || '',
      keyQuote: testim.keyQuote || '',
      story: testim.story || '',
      photo: testim.photo || '',
      videoUrl: testim.videoUrl || '',
      videoDuration: testim.videoDuration || '',
      videoDurationSeconds: testim.videoDurationSeconds || 0,
      videoPoster: testim.videoPoster || '',
      verified: testim.verified ?? true,
      adviceSnippet: testim.adviceSnippet || ''
    });
    setShowTestimModal(true);
  };

  const handleSaveTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testimForm.name.trim() || !testimForm.keyQuote.trim() || !testimForm.story.trim()) {
      toast.warning('Please enter Name, Key Quote, and Story.', 'Missing Information');
      return;
    }

    setTestimSubmitting(true);
    try {
      if (editingTestim) {
        await updateTestimonial(editingTestim.id, {
          ...testimForm,
          headline: testimForm.headline || `Reflections on Growth & Forensics`
        });
        toast.success(`Testimonial & video story for ${testimForm.name} updated!`, 'Story Saved');
      } else {
        await createTestimonial({
          ...testimForm,
          headline: testimForm.headline || `Reflections on Growth & Forensics`,
          rating: 5,
          featured: false,
          likesCount: 0,
          liked: false
        });
        toast.success(`Testimonial & video story for ${testimForm.name} added successfully!`, 'Story Created');
      }
      setShowTestimModal(false);
    } catch (err: any) {
      console.error('Error saving testimonial:', err);
      toast.error('Failed to save testimonial. Please try again.', 'Error');
    } finally {
      setTestimSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove the alumni profile for "${name}"?`)) return;
    try {
      await deleteAlumni(id);
      toast.success(`Removed alumni record for ${name}.`, 'Deleted');
    } catch (err) {
      toast.error('Failed to delete profile.', 'Error');
    }
  };

  const handleDeleteTestimonial = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the testimonial from "${name}"?`)) return;
    try {
      await deleteTestimonial(id);
      toast.success(`Testimonial from ${name} deleted.`, 'Deleted');
    } catch (err) {
      toast.error('Failed to delete testimonial.', 'Error');
    }
  };

  const handleToggleApprove = async (alum: AlumniProfile) => {
    try {
      const nextApproved = !alum.approved;
      await updateAlumni(alum.id, {
        approved: nextApproved,
        status: nextApproved ? 'active' : 'pending'
      });
      toast.success(
        nextApproved 
          ? `Alumnus "${alum.name}" has been approved and published to the live directory!` 
          : `Alumnus "${alum.name}" moved back to pending status.`, 
        nextApproved ? 'Alumnus Approved' : 'Status Updated'
      );
    } catch (err) {
      toast.error('Failed to update approval status.', 'Error');
    }
  };

  const handleToggleVerifyTestimonial = async (testim: AlumniTestimonial) => {
    try {
      const nextVerified = !testim.verified;
      await updateTestimonial(testim.id, {
        verified: nextVerified
      });
      toast.success(
        nextVerified 
          ? `Testimonial from "${testim.name}" verified and published on live site!` 
          : `Testimonial from "${testim.name}" marked as unverified (hidden from public).`,
        nextVerified ? 'Testimonial Verified' : 'Status Updated'
      );
    } catch (err) {
      toast.error('Failed to update testimonial status.', 'Error');
    }
  };

  const filteredAlumni = alumni.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = a.name.toLowerCase().includes(q) || 
      a.highSchool.toLowerCase().includes(q) || 
      (a.currentTitle && a.currentTitle.toLowerCase().includes(q));
    const matchCounty = countyFilter === 'all' || (a.county && a.county.toLowerCase() === countyFilter.toLowerCase());
    const matchField = fieldFilter === 'all' || a.fieldOfWork === fieldFilter;
    const matchStatus = statusFilter === 'all' || 
      (statusFilter === 'approved' && a.approved === true) ||
      (statusFilter === 'pending' && a.approved === false);
    return matchSearch && matchCounty && matchField && matchStatus;
  });

  const [testimFilter, setTestimFilter] = useState<'all' | 'verified' | 'pending' | 'with-video'>('all');

  const filteredTestimonials = testimonials.filter(t => {
    if (testimFilter === 'verified') return t.verified === true;
    if (testimFilter === 'pending') return t.verified === false;
    if (testimFilter === 'with-video') return Boolean(t.videoUrl);
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 sm:p-8 rounded-3xl border border-emerald-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400 text-emerald-950 rounded-full text-xs font-bold uppercase">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Alumni & Testimonials Directorate</span>
          </div>
          <h2 className="text-2xl font-black text-white">Alumni Directory & Testimonials Moderation</h2>
          <p className="text-xs sm:text-sm text-emerald-100">
            Manage alumni directory profiles (picture & bio) and moderate 10-minute video stories in Testimonials.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'roster' ? (
            <button
              onClick={handleOpenAdd}
              className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Alumnus to Directory
            </button>
          ) : (
            <button
              onClick={handleOpenAddTestimonial}
              className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Testimonial & Video Story
            </button>
          )}
        </div>
      </div>

      {/* Just Added Alumnus Notification Banner */}
      {justAddedProfile && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-950 mb-0.5">
                New Alumnus Successfully Added
              </div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                {justAddedProfile.name} ({justAddedProfile.highSchool})
              </h4>
              <p className="text-xs text-slate-600">
                Profile is now recorded. Click View Profile to inspect their full bio, accolades, and vivid headshot.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setViewingProfile(justAddedProfile)}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Eye className="w-4 h-4 text-yellow-300" />
              <span>View Profile & Vivid Photo</span>
            </button>
            <button
              onClick={() => setJustAddedProfile(null)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl cursor-pointer"
              title="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Pending Reviews Alert Bar */}
      {(pendingAlumniCount > 0 || pendingTestimonialsCount > 0) && (
        <div className="bg-amber-500/10 border border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-sm">
                Administrative Approvals Required
              </h4>
              <p className="text-xs text-amber-800">
                {pendingAlumniCount > 0 && `${pendingAlumniCount} alumni registration(s) pending approval. `}
                {pendingTestimonialsCount > 0 && `${pendingTestimonialsCount} testimonial story/video(s) awaiting verification.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pendingAlumniCount > 0 && (
              <button
                onClick={() => {
                  setActiveTab('roster');
                  setStatusFilter('pending');
                }}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Review Pending Alumni ({pendingAlumniCount})</span>
              </button>
            )}
            {pendingTestimonialsCount > 0 && (
              <button
                onClick={() => {
                  setActiveTab('testimonials');
                  setTestimFilter('pending');
                }}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>Review Testimonials ({pendingTestimonialsCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'roster' 
              ? 'bg-emerald-800 text-white shadow-xs' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Alumni Directory Roster ({alumni.length})</span>
          {pendingAlumniCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black">
              {pendingAlumniCount} pending
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('testimonials')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'testimonials' 
              ? 'bg-emerald-800 text-white shadow-xs' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <MessageSquareQuote className="w-3.5 h-3.5" />
          <span>Testimonials & Video Stories ({testimonials.length})</span>
          {pendingTestimonialsCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-400 text-amber-950 rounded-full text-[10px] font-black">
              {pendingTestimonialsCount} pending
            </span>
          )}
        </button>
      </div>

      {/* Roster View */}
      {activeTab === 'roster' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search alumni by name, high school..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="all">All Statuses ({alumni.length})</option>
                <option value="pending">⚠️ Pending Approval ({pendingAlumniCount})</option>
                <option value="approved">✓ Approved / Live ({alumni.filter(a => a.approved === true).length})</option>
              </select>

              <select
                value={countyFilter}
                onChange={(e) => setCountyFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="all">All Counties</option>
                <option value="Montserrado">Montserrado</option>
                <option value="Margibi">Margibi</option>
                <option value="Bong">Bong</option>
                <option value="Nimba">Nimba</option>
                <option value="Grand Bassa">Grand Bassa</option>
                <option value="Lofa">Lofa</option>
                <option value="Maryland">Maryland</option>
              </select>

              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="all">All Disciplines</option>
                <option value="Law & Governance">Law & Governance</option>
                <option value="Engineering & Tech">Engineering & Tech</option>
                <option value="Medicine & Health">Medicine & Health</option>
                <option value="Public Policy">Public Policy</option>
                <option value="Business & Finance">Business & Finance</option>
                <option value="Education & Media">Education & Media</option>
              </select>
            </div>
          </div>

          {/* Table / Cards */}
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading alumni database...</div>
          ) : filteredAlumni.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-base">No alumni records found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No alumni profiles matching your filter. Use "Add Alumnus to Directory" or review public registrations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAlumni.map(alum => {
                const isApproved = alum.approved === true;
                return (
                  <div 
                    key={alum.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all ${
                      !isApproved 
                        ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-400/30' 
                        : 'border-slate-200 hover:border-emerald-600'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Status Banner on Card */}
                      <div className="flex items-center justify-between">
                        {!isApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                            <span>Awaiting Admin Review</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Live on Public Directory</span>
                          </span>
                        )}
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                          {alum.fieldOfWork}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Vivid Headshot Frame with Click to View */}
                          <div 
                            onClick={() => setViewingProfile(alum)}
                            className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 border-2 border-yellow-400 shrink-0 cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all shadow-xs relative group/avatar"
                            title="Click to view full profile & vivid photo"
                          >
                            <SafeImage
                              src={alum.photo}
                              alt={alum.name}
                              fallbackCategory="leadership"
                              fallbackTitle={alum.name}
                              className="w-full h-full object-cover object-top group-hover/avatar:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-4 h-4 text-yellow-300 drop-shadow" />
                            </div>
                          </div>
                          <div>
                            <h4 
                              onClick={() => setViewingProfile(alum)}
                              className="font-bold text-slate-900 text-sm leading-snug hover:text-emerald-700 cursor-pointer transition-colors"
                              title="Click to view alumni profile"
                            >
                              {alum.name}
                            </h4>
                            <p className="text-xs text-emerald-800 font-semibold">{alum.currentTitle || alum.role}</p>
                            <p className="text-[10px] text-slate-500">{alum.organizationOrUniversity || alum.highSchool}</p>
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      {alum.bio ? (
                        <p className="text-xs text-slate-600 line-clamp-3 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          "{alum.bio}"
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          No biography provided yet.
                        </p>
                      )}

                      <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-700">School:</span>
                          <span>{alum.highSchool} ({alum.graduationYear})</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-semibold text-slate-700">County:</span>
                          <span>{alum.county}</span>
                        </div>
                        {alum.adviceForDebaters && (
                          <div className="pt-1 text-[11px] text-emerald-800 font-medium line-clamp-1">
                            💡 Advice: {alum.adviceForDebaters}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      {/* View Profile & Vivid Photo Primary Button */}
                      <button
                        onClick={() => setViewingProfile(alum)}
                        className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200/90 rounded-xl font-bold flex items-center justify-center gap-2 shadow-2xs cursor-pointer active:scale-95 transition-all text-xs"
                      >
                        <Eye className="w-4 h-4 text-emerald-700" />
                        <span>View Profile & Headshot</span>
                      </button>

                      {/* One-Click Review / Approval Controls */}
                      {!isApproved ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleApprove(alum)}
                            className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-95 transition-all"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve & Publish</span>
                          </button>
                          <button
                            onClick={() => handleDelete(alum.id, alum.name)}
                            className="p-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl cursor-pointer"
                            title="Reject & Delete Registration"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => handleToggleApprove(alum)}
                            className="px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="Move back to pending/unapproved"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Unpublish</span>
                          </button>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(alum)}
                              className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="Edit Profile"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(alum.id, alum.name)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Delete Profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Testimonials View */}
      {activeTab === 'testimonials' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 mr-1">
                Filter ({filteredTestimonials.length} of {testimonials.length}):
              </span>
              <button
                onClick={() => setTestimFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                  testimFilter === 'all' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({testimonials.length})
              </button>
              <button
                onClick={() => setTestimFilter('pending')}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 ${
                  testimFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Pending Review ({pendingTestimonialsCount})</span>
              </button>
              <button
                onClick={() => setTestimFilter('verified')}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer ${
                  testimFilter === 'verified' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Verified Only ({testimonials.filter(t => t.verified === true).length})
              </button>
              <button
                onClick={() => setTestimFilter('with-video')}
                className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1 ${
                  testimFilter === 'with-video' ? 'bg-yellow-400 text-emerald-950 shadow-xs font-black' : 'bg-yellow-50 text-yellow-900 hover:bg-yellow-100 border border-yellow-200'
                }`}
              >
                <Film className="w-3 h-3 text-yellow-700" />
                <span>Video Stories ({testimonials.filter(t => Boolean(t.videoUrl)).length})</span>
              </button>
            </div>

            <button
              onClick={handleOpenAddTestimonial}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Testimonial & Video Story</span>
            </button>
          </div>

          {filteredTestimonials.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 space-y-3">
              <MessageSquareQuote className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-800 text-base">No alumni testimonials found</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {testimFilter === 'pending' 
                  ? 'There are no pending testimonials awaiting review.' 
                  : 'Testimonials and video stories submitted via the public directory or created by admin will appear here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTestimonials.map(testim => {
                const isVerified = testim.verified === true;
                return (
                  <div 
                    key={testim.id}
                    className={`bg-white rounded-2xl border p-5 shadow-xs space-y-3 flex flex-col justify-between ${
                      !isVerified 
                        ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-400/30' 
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        {!isVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-700 animate-pulse" />
                            <span>Pending Admin Verification</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Verified & Live</span>
                          </span>
                        )}

                        {testim.videoUrl && (
                          <button
                            onClick={() => setActiveVideoSrc({
                              url: testim.videoUrl!,
                              poster: testim.videoPoster || testim.photo,
                              title: testim.headline
                            })}
                            className="px-2.5 py-1 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Watch ({testim.videoDuration || '10m max'})</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0">
                            <SafeImage src={testim.photo} alt={testim.name} fallbackCategory="leadership" className="w-full h-full object-cover object-top" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{testim.name}</h4>
                            <p className="text-xs text-emerald-800">{testim.currentTitle} • {testim.highSchool}</p>
                          </div>
                        </div>
                      </div>

                      <h5 className="font-bold text-slate-900 text-xs">"{testim.headline}"</h5>
                      <blockquote className="italic text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border-l-2 border-emerald-700">
                        "{testim.keyQuote}"
                      </blockquote>
                      <p className="text-[11px] text-slate-500 line-clamp-3">{testim.story}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <span>{testim.county} County • {testim.fieldOfWork}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleVerifyTestimonial(testim)}
                          className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 cursor-pointer ${
                            isVerified 
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' 
                              : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{isVerified ? 'Unverify' : 'Verify & Publish'}</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditTestimonial(testim)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="Edit Testimonial & Video Story"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTestimonial(testim.id, testim.name)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="Delete Testimonial"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingAlum ? `Edit Alumni Profile: ${editingAlum.name}` : 'Add New Alumnus to Directory'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure details and set approval status for publication on the public directory.
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">High School *</label>
                  <input
                    type="text"
                    required
                    value={form.highSchool}
                    onChange={(e) => setForm({ ...form, highSchool: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">County</label>
                  <select
                    value={form.county}
                    onChange={(e) => setForm({ ...form, county: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Montserrado">Montserrado</option>
                    <option value="Margibi">Margibi</option>
                    <option value="Bong">Bong</option>
                    <option value="Nimba">Nimba</option>
                    <option value="Grand Bassa">Grand Bassa</option>
                    <option value="Lofa">Lofa</option>
                    <option value="Maryland">Maryland</option>
                    <option value="Grand Gedeh">Grand Gedeh</option>
                    <option value="Sinoe">Sinoe</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Graduation Year</label>
                  <input
                    type="text"
                    value={form.graduationYear}
                    onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tournament Role</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Champion Debater">Champion Debater</option>
                    <option value="Best Speaker">Best Speaker</option>
                    <option value="STEM Finalist">STEM Finalist</option>
                    <option value="Team Captain">Team Captain</option>
                    <option value="Adjudicator Alum">Adjudicator Alum</option>
                    <option value="Debate Coach">Debate Coach</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Current Position / Profession</label>
                  <input
                    type="text"
                    value={form.currentTitle}
                    onChange={(e) => setForm({ ...form, currentTitle: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Organization / University</label>
                  <input
                    type="text"
                    value={form.organizationOrUniversity}
                    onChange={(e) => setForm({ ...form, organizationOrUniversity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>

              {/* Approval Status Selector */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Admin Approval Status</div>
                  <div className="text-[11px] text-slate-500">
                    {form.approved ? 'Profile will be publicly visible on the live Alumni Directory.' : 'Profile will be kept pending and hidden until approved.'}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.approved} 
                    onChange={(e) => setForm({ ...form, approved: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                </label>
              </div>

              {/* Photo Upload (Picture) */}
              <ImageUploadField
                label="Profile Picture / Headshot"
                value={form.photo}
                onChange={(url) => setForm({ ...form, photo: url })}
                aspectRatio="square"
                helperText="Upload official alumni photo directly from your computer."
              />

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Short Bio</label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Share a concise summary of your debate journey, achievements, and current professional endeavors..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Advice for Debaters</label>
                <input
                  type="text"
                  value={form.adviceForDebaters}
                  onChange={(e) => setForm({ ...form, adviceForDebaters: e.target.value })}
                  placeholder="e.g. Speak with substance, listen attentively, and study the motions deeply."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (!form.name.trim()) {
                      toast.warning('Please enter a name first to preview profile.', 'Missing Name');
                      return;
                    }
                    setViewingProfile({
                      id: editingAlum?.id || 'preview-temp',
                      ...form,
                      achievements: ['Registered YFC Alumnus'],
                      status: form.approved ? 'active' : 'pending'
                    });
                  }}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/90 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
                  title="Preview full profile and see picture vividly before saving"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Preview Profile Vividly</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{editingAlum ? 'Update Profile' : 'Save & View Profile'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Testimonial & Video Story Modal */}
      {showTestimModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingTestim ? `Edit Testimonial: ${editingTestim.name}` : 'Add Testimonial & Video Story'}
                </h3>
                <p className="text-xs text-slate-500">
                  Manage written reflections, pullquotes, and 10-minute video recordings.
                </p>
              </div>
              <button
                onClick={() => setShowTestimModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTestimonial} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={testimForm.name}
                    onChange={(e) => setTestimForm({ ...testimForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">High School *</label>
                  <input
                    type="text"
                    required
                    value={testimForm.highSchool}
                    onChange={(e) => setTestimForm({ ...testimForm, highSchool: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">County</label>
                  <select
                    value={testimForm.county}
                    onChange={(e) => setTestimForm({ ...testimForm, county: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Montserrado">Montserrado</option>
                    <option value="Margibi">Margibi</option>
                    <option value="Bong">Bong</option>
                    <option value="Nimba">Nimba</option>
                    <option value="Grand Bassa">Grand Bassa</option>
                    <option value="Lofa">Lofa</option>
                    <option value="Maryland">Maryland</option>
                    <option value="Grand Gedeh">Grand Gedeh</option>
                    <option value="Sinoe">Sinoe</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Current Title / Role</label>
                  <input
                    type="text"
                    value={testimForm.currentTitle}
                    onChange={(e) => setTestimForm({ ...testimForm, currentTitle: e.target.value })}
                    placeholder="e.g. Associate Legal Counsel"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Organization / University</label>
                  <input
                    type="text"
                    value={testimForm.organizationOrUniversity}
                    onChange={(e) => setTestimForm({ ...testimForm, organizationOrUniversity: e.target.value })}
                    placeholder="e.g. University of Liberia"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Discipline / Field</label>
                  <select
                    value={testimForm.fieldOfWork}
                    onChange={(e) => setTestimForm({ ...testimForm, fieldOfWork: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Law & Governance">Law & Governance</option>
                    <option value="Engineering & Tech">Engineering & Tech</option>
                    <option value="Medicine & Health">Medicine & Health</option>
                    <option value="Public Policy">Public Policy</option>
                    <option value="Business & Finance">Business & Finance</option>
                    <option value="Education & Media">Education & Media</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Impact Area</label>
                  <input
                    type="text"
                    value={testimForm.impactArea}
                    onChange={(e) => setTestimForm({ ...testimForm, impactArea: e.target.value })}
                    placeholder="e.g. Human Rights Advocacy"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Testimonial Headline *</label>
                <input
                  type="text"
                  required
                  value={testimForm.headline}
                  onChange={(e) => setTestimForm({ ...testimForm, headline: e.target.value })}
                  placeholder="e.g. Debate gave me the analytical rigor to champion public health reform."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Key Quote / Pullquote *</label>
                <input
                  type="text"
                  required
                  value={testimForm.keyQuote}
                  onChange={(e) => setTestimForm({ ...testimForm, keyQuote: e.target.value })}
                  placeholder="e.g. The podium taught me that truth articulated with clarity can move a nation."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Testimonial Story *</label>
                <textarea
                  rows={3}
                  required
                  value={testimForm.story}
                  onChange={(e) => setTestimForm({ ...testimForm, story: e.target.value })}
                  placeholder="Narrative about how Youth For Change shaped your character, forensic skills, and career..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700 resize-none"
                />
              </div>

              {/* Photo Upload */}
              <ImageUploadField
                label="Profile Picture / Headshot"
                value={testimForm.photo}
                onChange={(url) => setTestimForm({ ...testimForm, photo: url })}
                aspectRatio="square"
                helperText="Upload official alumni photo for this testimonial."
              />

              {/* Video Story Upload (Max 10 Minutes) */}
              <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                  <Film className="w-4 h-4 text-amber-700" />
                  <span>Video Testimonial Story (Max 10 Minutes)</span>
                </div>
                <VideoUploadField
                  value={testimForm.videoUrl}
                  onChange={(url) => setTestimForm({ ...testimForm, videoUrl: url })}
                  onDurationExtracted={(dur, secs) => {
                    setTestimForm(prev => ({
                      ...prev,
                      videoDuration: dur,
                      videoDurationSeconds: secs || 0
                    }));
                  }}
                  onAutoPosterExtracted={(poster) => {
                    setTestimForm(prev => ({ ...prev, videoPoster: poster }));
                  }}
                  maxDurationSeconds={600}
                  label="Upload Video Story (Max 10 Mins)"
                  helperText="Upload or record MP4/WebM video of up to 10 minutes."
                />
              </div>

              {/* Verification Toggle */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">Publish & Verification Status</div>
                  <div className="text-[11px] text-slate-500">
                    {testimForm.verified ? 'Story & video will be publicly visible on the live site.' : 'Story will be saved as pending review.'}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={testimForm.verified} 
                    onChange={(e) => setTestimForm({ ...testimForm, verified: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-700"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTestimModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testimSubmitting}
                  className="px-6 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {testimSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Story...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingTestim ? 'Update Story' : 'Save Story & Video'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {activeVideoSrc && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 text-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-white/10 space-y-4 my-8">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">{activeVideoSrc.title}</h3>
              <button
                onClick={() => setActiveVideoSrc(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black aspect-video">
              <MediaVideoPlayer
                src={activeVideoSrc.url}
                poster={activeVideoSrc.poster}
                title={activeVideoSrc.title}
                autoPlay={true}
              />
            </div>
          </div>
        </div>
      )}
      {/* Alumni Profile Viewer Modal (Vivid Headshot & Profile Details) */}
      <AlumniProfileModal
        profile={viewingProfile}
        isOpen={Boolean(viewingProfile)}
        onClose={() => setViewingProfile(null)}
        isAdmin={true}
        onEdit={handleOpenEdit}
        onToggleApprove={handleToggleApprove}
        onPlayVideo={(url, title) => setActiveVideoSrc({ url, title })}
      />
    </div>
  );
};
