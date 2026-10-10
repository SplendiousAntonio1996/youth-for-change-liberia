import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  GraduationCap, Users, MessageSquare, Search, Filter, 
  MapPin, Award, BookOpen, Send, Heart, Share2, 
  ExternalLink, Mail, PlusCircle, CheckCircle2, Sparkles, 
  Briefcase, Star, ChevronRight, UserPlus, ThumbsUp, ShieldCheck,
  MessageSquareQuote, Play, Film, Clock, X, Video, Eye
} from 'lucide-react';
import { AlumniSubTab, AlumniProfile, AlumniPost, NavTab } from '../types';
import { INITIAL_ALUMNI_POSTS, HALL_OF_ORATORS } from '../data/alumniData';
import { useAlumni } from '../hooks/useAlumni';
import { createAlumni } from '../lib/alumniService';
import { SafeImage } from './SafeImage';
import { ImageUploadField } from './ImageUploadField';
import { VideoUploadField } from './VideoUploadField';
import { MediaVideoPlayer } from './MediaVideoPlayer';
import { AlumniTestimonialsSection } from './AlumniTestimonialsSection';
import { AlumniProfileModal } from './AlumniProfileModal';
import { useToast } from '../context/ToastContext';

interface AlumniViewProps {
  alumniSub: AlumniSubTab;
  setAlumniSub: (sub: AlumniSubTab) => void;
  setTab: (tab: NavTab) => void;
}

export const AlumniView: React.FC<AlumniViewProps> = ({
  alumniSub,
  setAlumniSub,
  setTab
}) => {
  const toast = useToast();
  const { activeProfiles, loading } = useAlumni();

  // Active Profile Modal for vivid viewing & reading
  const [viewingProfile, setViewingProfile] = useState<AlumniProfile | null>(null);
  const [submittedProfile, setSubmittedProfile] = useState<AlumniProfile | null>(null);

  // State for Directory Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('All');
  const [selectedCounty, setSelectedCounty] = useState('All');
  const [mentorOnly, setMentorOnly] = useState(false);

  // Active Video Modal for Alumni
  const [activeVideoAlum, setActiveVideoAlum] = useState<AlumniProfile | null>(null);

  // State for Community Feed & Interactions
  const [posts, setPosts] = useState<AlumniPost[]>(INITIAL_ALUMNI_POSTS);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'Mentorship' | 'Job & Opportunity' | 'Debate Tactics' | 'Announcement' | 'Reunion & Memories'>('Mentorship');
  const [feedFilter, setFeedFilter] = useState('All');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  // State for Mentor Connection Modal
  const [selectedMentor, setSelectedMentor] = useState<AlumniProfile | null>(null);
  const [mentorshipSent, setMentorshipSent] = useState(false);
  const [mentorshipFormData, setMentorshipFormData] = useState({
    studentName: '',
    school: '',
    county: '',
    email: '',
    interest: 'Debate Coaching & Forensics',
    message: ''
  });

  // State for Alumni Registration Form
  const [registrationSubmitted, setRegistrationSubmitted] = useState(false);
  const [submittingReg, setSubmittingReg] = useState(false);
  const [regForm, setRegForm] = useState({
    name: '',
    highSchool: '',
    county: 'Montserrado',
    graduationYear: '2023',
    tournamentYear: '2022 (Debater)',
    role: 'Champion Debater' as AlumniProfile['role'],
    currentTitle: '',
    organizationOrUniversity: '',
    fieldOfWork: 'Law & Governance' as AlumniProfile['fieldOfWork'],
    bio: '',
    location: 'Monrovia, Liberia',
    contactEmail: '',
    photo: '',
    linkedIn: '',
    isMentorAvailable: true,
    adviceForDebaters: ''
  });

  // Handle Like post
  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const isLiked = post.likedByMe;
        return {
          ...post,
          likes: isLiked ? post.likes - 1 : post.likes + 1,
          likedByMe: !isLiked
        };
      }
      return post;
    }));
  };

  // Handle Submit Comment
  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [
            ...post.comments,
            {
              id: `comm-${Date.now()}`,
              authorName: 'Guest Alum / Debater',
              authorSchool: 'YFC National League',
              text: text,
              timestamp: 'Just now'
            }
          ]
        };
      }
      return post;
    }));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  // Handle Submit New Post
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const newPost: AlumniPost = {
      id: `post-${Date.now()}`,
      authorId: 'user-guest',
      authorName: 'Alumni Member',
      authorSchool: 'Liberian High School Alumni',
      authorYear: 'Alumni Network',
      authorRole: 'Active Debater & Alum',
      authorPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      authorCounty: 'Liberia',
      timestamp: 'Just now',
      category: newPostCategory,
      content: newPostContent,
      likes: 1,
      likedByMe: true,
      comments: []
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    toast.success('Discussion topic posted to the Alumni Lounge!', 'Post Shared');
  };

  // Handle Alumni Registration Submit (Requires Admin Approval)
  const handleRegisterAlumni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.name.trim() || !regForm.highSchool.trim()) {
      toast.warning('Please enter your full name and high school represented.', 'Missing Information');
      return;
    }

    setSubmittingReg(true);
    try {
      const created = await createAlumni({
        name: regForm.name.trim(),
        highSchool: regForm.highSchool.trim(),
        county: regForm.county,
        graduationYear: regForm.graduationYear,
        tournamentYear: regForm.tournamentYear,
        role: regForm.role,
        currentTitle: regForm.currentTitle.trim() || 'Young Professional / Scholar',
        organizationOrUniversity: regForm.organizationOrUniversity.trim() || 'Independent',
        fieldOfWork: regForm.fieldOfWork,
        bio: regForm.bio.trim() || 'Proud alumnus of the Youth For Change Liberia National Championship.',
        photo: regForm.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
        location: regForm.location || `${regForm.county}, Liberia`,
        contactEmail: regForm.contactEmail.trim(),
        linkedIn: regForm.linkedIn.trim(),
        isMentorAvailable: regForm.isMentorAvailable,
        achievements: ['Registered YFC Alumnus'],
        adviceForDebaters: regForm.adviceForDebaters.trim() || 'Stay relentless, study the motions deeply, and uphold the integrity of truth.',
        approved: false, // Requires admin review and approval
        status: 'pending'
      });

      setSubmittedProfile(created);
      setRegistrationSubmitted(true);
      toast.success(
        `Thank you ${regForm.name}! Your alumni profile has been submitted for review. Click View Profile to see your preview.`,
        'Registration Submitted',
        5000
      );
    } catch (err: any) {
      console.error('Alumni registration failed:', err);
      toast.error('Could not submit registration. Please try again.', 'Registration Error');
    } finally {
      setSubmittingReg(false);
    }
  };

  // Handle Send Mentorship Request
  const handleSendMentorship = (e: React.FormEvent) => {
    e.preventDefault();
    setMentorshipSent(true);
    toast.success(`Mentorship request dispatched to ${selectedMentor?.name || 'mentor'}!`, 'Request Sent');
    setTimeout(() => {
      setSelectedMentor(null);
      setMentorshipSent(false);
      setMentorshipFormData({
        studentName: '',
        school: '',
        county: '',
        email: '',
        interest: 'Debate Coaching & Forensics',
        message: ''
      });
    }, 2500);
  };

  // Filtered Alumni Profiles
  const filteredProfiles = activeProfiles.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.highSchool.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.organizationOrUniversity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.currentTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesField = selectedField === 'All' || p.fieldOfWork === selectedField;
    const matchesCounty = selectedCounty === 'All' || p.county.toLowerCase() === selectedCounty.toLowerCase();
    const matchesMentor = !mentorOnly || p.isMentorAvailable;

    return matchesSearch && matchesField && matchesCounty && matchesMentor;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white p-8 sm:p-12 shadow-2xl border border-emerald-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400 text-emerald-950 rounded-full text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Official Youth For Change Alumni Portal</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Liberia’s Intellectual Alumni & Mentors
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 leading-relaxed max-w-2xl">
            Celebrating past debaters and STEM innovators who have stepped from high school podiums into supreme courts, surgical theaters, engineering hubs, and national leadership.
          </p>

          <div className="flex flex-wrap gap-3 pt-3">
            <button
              id="alumni-hero-register-btn"
              onClick={() => setAlumniSub('register')}
              className="px-6 py-3 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" /> Register Your Alumni Profile
            </button>
            <button
              id="alumni-hero-testimonials-btn"
              onClick={() => setAlumniSub('testimonials')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <MessageSquareQuote className="w-4 h-4 text-yellow-400" /> Watch & Read Testimonials
            </button>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { key: 'directory', label: 'Alumni Directory', icon: Users },
            { key: 'testimonials', label: 'Alumni Testimonials & Videos', icon: MessageSquareQuote },
            { key: 'mentorship', label: 'Mentorship & Coaching Hub', icon: Briefcase },
            { key: 'feed', label: 'Interactive Discussion Lounge', icon: MessageSquare },
            { key: 'hall-of-orators', label: 'Hall of Legendary Orators', icon: Award },
            { key: 'register', label: 'Register as an Alumnus', icon: PlusCircle }
          ].map(tab => {
            const Icon = tab.icon;
            const active = alumniSub === tab.key;
            return (
              <button
                key={tab.key}
                id={`alumni-subtab-${tab.key}`}
                onClick={() => setAlumniSub(tab.key as AlumniSubTab)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
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
      </div>

      {/* Navigation Subtabs Content */}
      <AnimatePresence mode="wait">
        {/* Subtab: Alumni Testimonials (Embedded directly inside Alumni Portal) */}
        {alumniSub === 'testimonials' && (
          <motion.div
            key="testimonials"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <AlumniTestimonialsSection
              onExploreDirectory={() => setAlumniSub('directory')}
              onExploreMentorship={() => setAlumniSub('mentorship')}
            />
          </motion.div>
        )}

        {/* Subtab 1: Alumni Directory */}
        {alumniSub === 'directory' && (
          <motion.div 
            key="directory"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="space-y-8"
          >
            {/* Search and Filters Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, high school, university, or profession..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-all"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <select
                    value={selectedField}
                    onChange={(e) => setSelectedField(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  >
                    <option value="All">All Disciplines</option>
                    <option value="Law & Governance">Law & Governance</option>
                    <option value="Engineering & Tech">Engineering & Tech</option>
                    <option value="Medicine & Health">Medicine & Health</option>
                    <option value="Public Policy">Public Policy</option>
                    <option value="Business & Finance">Business & Finance</option>
                    <option value="Education & Media">Education & Media</option>
                  </select>

                  <select
                    value={selectedCounty}
                    onChange={(e) => setSelectedCounty(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  >
                    <option value="All">All 15 Counties</option>
                    <option value="Montserrado">Montserrado</option>
                    <option value="Margibi">Margibi</option>
                    <option value="Bong">Bong</option>
                    <option value="Nimba">Nimba</option>
                    <option value="Grand Bassa">Grand Bassa</option>
                    <option value="Lofa">Lofa</option>
                    <option value="Maryland">Maryland</option>
                    <option value="Sinoe">Sinoe</option>
                    <option value="Grand Cape Mount">Grand Cape Mount</option>
                    <option value="Bomi">Bomi</option>
                    <option value="Grand Gedeh">Grand Gedeh</option>
                    <option value="River Gee">River Gee</option>
                    <option value="Rivercess">Rivercess</option>
                    <option value="Gbarpolu">Gbarpolu</option>
                    <option value="Grand Kru">Grand Kru</option>
                  </select>

                  <button
                    onClick={() => setMentorOnly(!mentorOnly)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      mentorOnly 
                        ? 'bg-emerald-800 text-white shadow-xs' 
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Mentors Only</span>
                  </button>

                  <button
                    onClick={() => setAlumniSub('testimonials')}
                    className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300"
                    title="Watch video stories in Testimonials"
                  >
                    <Film className="w-3.5 h-3.5 text-amber-700" />
                    <span>Video Stories</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>Showing <strong>{filteredProfiles.length}</strong> active alumni profiles (auto-approved roster)</span>
                <span className="text-emerald-800 font-semibold">Live Firestore Database</span>
              </div>
            </div>

            {/* Loading state */}
            {loading && (
              <div className="p-16 text-center text-slate-400 space-y-3">
                <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold text-slate-600">Loading live Alumni Directory...</p>
              </div>
            )}

            {/* Empty State */}
            {!loading && filteredProfiles.length === 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 sm:p-16 text-center max-w-2xl mx-auto space-y-5 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-100 shadow-xs">
                  <GraduationCap className="w-8 h-8 text-emerald-700" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">Alumni Directory Roster</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
                    No alumni profiles matching the current search criteria. When alumni register, they are automatically approved and instantly listed right here!
                  </p>
                </div>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => setAlumniSub('register')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Register New Alumnus</span>
                  </button>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedField('All');
                      setSelectedCounty('All');
                      setMentorOnly(false);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}

            {/* Alumni Grid */}
            {!loading && filteredProfiles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfiles.map(alum => (
                  <div
                    key={alum.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header with Photo */}
                      <div className="bg-gradient-to-r from-emerald-950 to-slate-900 p-6 text-white relative">
                        <div className="flex items-start gap-4">
                          {/* Vivid Photo Frame with Click Action */}
                          <div 
                            onClick={() => setViewingProfile(alum)}
                            className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-yellow-400 shrink-0 bg-slate-800 shadow-md cursor-pointer hover:ring-2 hover:ring-yellow-400 transition-all relative group/photo"
                            title="Click to view full profile & vivid photo"
                          >
                            <SafeImage
                              src={alum.photo}
                              alt={alum.name}
                              fallbackCategory="leadership"
                              fallbackTitle={alum.name}
                              className="w-full h-full object-cover object-top group-hover/photo:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-5 h-5 text-yellow-300 drop-shadow" />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-block bg-yellow-400 text-emerald-950 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                                {alum.role}
                              </span>
                              {alum.approved !== false && (
                                <span className="inline-flex items-center gap-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-400/30">
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> Verified
                                </span>
                              )}
                            </div>
                            <h3 
                              onClick={() => setViewingProfile(alum)}
                              className="font-bold text-base text-white leading-tight hover:text-yellow-300 cursor-pointer transition-colors"
                              title="Click to read alumni profile"
                            >
                              {alum.name}
                            </h3>
                            <p className="text-xs text-emerald-200 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-yellow-400" /> {alum.location || `${alum.county}, Liberia`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-6 space-y-4">
                        {/* Academic & High School Credentials */}
                        <div className="space-y-1.5 pb-3 border-b border-slate-100">
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4 text-emerald-700" />
                            <span>{alum.highSchool} ({alum.graduationYear})</span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-yellow-600" />
                            <span>Tournament: {alum.tournamentYear}</span>
                          </div>
                        </div>

                        {/* Current Career Role */}
                        <div className="space-y-1">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Position</div>
                          <div className="text-xs font-bold text-emerald-900 leading-snug">
                            {alum.currentTitle}
                          </div>
                          <div className="text-xs text-slate-600">
                            {alum.organizationOrUniversity}
                          </div>
                        </div>

                        {/* Bio */}
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {alum.bio}
                        </p>

                        {/* Notable Advice */}
                        {alum.adviceForDebaters && (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3 h-3" /> Words for Rising Debaters:
                            </span>
                            <p className="text-xs italic text-slate-700 leading-normal">
                              "{alum.adviceForDebaters}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                      {/* View Profile Button */}
                      <button
                        onClick={() => setViewingProfile(alum)}
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200/90 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0 active:scale-95"
                        title="View full profile & vivid photo"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-700" />
                        <span>View Profile</span>
                      </button>

                      {alum.isMentorAvailable ? (
                        <button
                          onClick={() => setSelectedMentor(alum)}
                          className="flex-1 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-yellow-300" /> Request Mentorship
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium py-2 flex-1 text-center">
                          Mentorship roster full
                        </span>
                      )}

                      {alum.contactEmail && (
                        <a
                          href={`mailto:${alum.contactEmail}`}
                          title={`Email ${alum.name}`}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors shrink-0"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Subtab 2: Community Feed */}
        {alumniSub === 'feed' && (
          <motion.div 
            key="feed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="space-y-8"
          >
            {/* Create Post Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-700" />
                <span>Share with the Alumni & Mentor Network</span>
              </h3>
              
              <form onSubmit={handleCreatePost} className="space-y-3">
                <textarea
                  rows={3}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share a scholarship opening, job lead, coaching technique, or tournament reflection..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none"
                />

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Topic:</span>
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value as any)}
                      className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                    >
                      <option value="Mentorship">Mentorship & Guidance</option>
                      <option value="Job & Opportunity">Job & Scholarship Opportunity</option>
                      <option value="Debate Tactics">Debate Tactics & Motions</option>
                      <option value="Reunion & Memories">Reunion & Memories</option>
                      <option value="Announcement">Official Announcement</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> Post Discussion
                  </button>
                </div>
              </form>
            </div>

            {/* Feed Posts */}
            <div className="space-y-6">
              {posts.map(post => (
                <div key={post.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 shrink-0">
                        <SafeImage src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover object-top" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{post.authorName}</h4>
                        <p className="text-xs text-emerald-800 font-semibold">{post.authorRole} • {post.authorSchool}</p>
                        <p className="text-[10px] text-slate-400">{post.timestamp} • {post.authorCounty}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                      {post.category}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>

                  <div className="flex items-center gap-4 pt-3 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center gap-1.5 font-bold transition-colors cursor-pointer ${
                        post.likedByMe ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${post.likedByMe ? 'fill-current' : ''}`} />
                      <span>{post.likes} Likes</span>
                    </button>

                    <button
                      onClick={() => setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id)}
                      className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments.length} Comments</span>
                    </button>
                  </div>

                  {/* Comment Thread */}
                  {activeCommentPostId === post.id && (
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <div className="space-y-2">
                        {post.comments.map(comm => (
                          <div key={comm.id} className="bg-slate-50 p-3 rounded-2xl space-y-1 text-xs">
                            <div className="flex items-center justify-between text-slate-700">
                              <span className="font-bold text-slate-900">{comm.authorName} <span className="text-[10px] text-slate-400 font-normal">({comm.authorSchool})</span></span>
                              <span className="text-[10px] text-slate-400">{comm.timestamp}</span>
                            </div>
                            <p className="text-slate-600">{comm.text}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a response..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                          className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Subtab 3: Mentorship Hub */}
        {alumniSub === 'mentorship' && (
          <motion.div 
            key="mentorship"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="space-y-8"
          >
            <div className="bg-gradient-to-r from-emerald-950 to-slate-900 rounded-3xl p-8 text-white space-y-4">
              <span className="px-3 py-1 bg-yellow-400 text-emerald-950 rounded-full text-xs font-bold uppercase">
                1-on-1 Virtual & In-Person Forensics Coaching
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Request Free High School Debate & STEM Mentorship
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                Our registered alumni volunteer their time to guide Liberian high school debate clubs, offer constructive feedback on tournament briefs, and assist with scholarship applications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProfiles.filter(p => p.isMentorAvailable).map(mentor => (
                <div key={mentor.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-emerald-700 shrink-0">
                        <SafeImage src={mentor.photo} alt={mentor.name} className="w-full h-full object-cover object-top" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{mentor.name}</h4>
                        <p className="text-xs text-emerald-800 font-semibold">{mentor.currentTitle}</p>
                        <p className="text-[10px] text-slate-500">{mentor.organizationOrUniversity}</p>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl space-y-1">
                      <div className="font-bold text-slate-700">Championship Pedigree:</div>
                      <p>{mentor.highSchool} ({mentor.graduationYear}) • {mentor.role}</p>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3">
                      "{mentor.adviceForDebaters || mentor.bio}"
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedMentor(mentor)}
                    className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5 text-yellow-300" /> Connect for Mentorship
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Subtab 4: Hall of Legendary Orators */}
        {alumniSub === 'hall-of-orators' && (
          <motion.div 
            key="hall-of-orators"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="space-y-8"
          >
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400 text-emerald-950 rounded-full text-xs font-bold uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" /> Hall of Orators
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                10 Years of Legendary National Forensics Champions
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Commemorating the standout orators, team captains, and Grand Final MVP debaters who set the benchmark for forensic excellence in Liberia.
              </p>
            </div>

            {HALL_OF_ORATORS.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-3 shadow-xs">
                <Award className="w-12 h-12 text-yellow-500 mx-auto" />
                <h3 className="font-bold text-slate-900 text-lg">Hall of Orators Archive</h3>
                <p className="text-xs text-slate-500">
                  Debate champions and national best speakers will be inducted and displayed here as tournaments conclude.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {HALL_OF_ORATORS.map(orator => (
                  <div key={orator.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all group">
                    <div className="relative aspect-4/5 overflow-hidden bg-slate-900">
                      <SafeImage src={orator.photo} alt={orator.name} className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-5 text-white">
                        <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">{orator.seasonYear}</span>
                        <h4 className="font-extrabold text-base text-white">{orator.name}</h4>
                        <p className="text-xs text-emerald-300 font-semibold">{orator.titleAward}</p>
                      </div>
                    </div>
                    <div className="p-5 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>{orator.highSchool}</span>
                        <span className="font-bold text-emerald-800">{orator.county}</span>
                      </div>
                      <p className="text-slate-600 italic">"{orator.legendaryMotion}"</p>
                      <div className="pt-2 border-t border-slate-100 text-[11px] font-semibold text-slate-700">
                        Now: {orator.currentEndeavor}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Subtab 5: Register as an Alumnus Form */}
        {alumniSub === 'register' && (
          <motion.div 
            key="register"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6"
          >
            <div className="space-y-2 border-b border-slate-100 pb-4">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <UserPlus className="w-3.5 h-3.5" /> Official Alumni Registration & Review
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">
                Register as a Past Debater or STEM Innovator
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Join Liberia's premier intellectual alumni directory, connect with peers across 15 counties, share your video story (up to 10 minutes), and mentor the next generation. To ensure high community standards, registrations are reviewed and approved by administrators before appearing publicly.
              </p>
            </div>

            {registrationSubmitted ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-amber-950">Registration Submitted for Review</h3>
                <p className="text-xs sm:text-sm text-amber-800 max-w-md mx-auto leading-relaxed">
                  Thank you for submitting your alumni profile! Your registration has been placed in the moderation queue and will be reviewed and approved by our administrative team before going live on the directory.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  {submittedProfile && (
                    <button
                      onClick={() => setViewingProfile(submittedProfile)}
                      className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold rounded-xl text-xs cursor-pointer flex items-center gap-2 shadow-md active:scale-95 transition-all"
                    >
                      <Eye className="w-4 h-4 text-emerald-950" />
                      <span>View Profile & Picture Vividly</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setRegistrationSubmitted(false);
                      setAlumniSub('directory');
                    }}
                    className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    View Alumni Directory
                  </button>
                  <button
                    onClick={() => {
                      setRegistrationSubmitted(false);
                      setSubmittedProfile(null);
                      setRegForm({
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
                        photo: '',
                        location: 'Monrovia, Liberia',
                        contactEmail: '',
                        linkedIn: '',
                        isMentorAvailable: true,
                        adviceForDebaters: '',
                        videoUrl: '',
                        videoDuration: '',
                        videoDurationSeconds: 0,
                        videoPoster: '',
                        shareTestimonial: true,
                        testimonialHeadline: '',
                        testimonialQuote: '',
                        testimonialStory: ''
                      });
                    }}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Submit Another Profile
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterAlumni} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cllr. Emmanuel S. Freeman"
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">High School Represented *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. B.W. Harris Episcopal High School"
                      value={regForm.highSchool}
                      onChange={(e) => setRegForm({ ...regForm, highSchool: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">County</label>
                    <select
                      value={regForm.county}
                      onChange={(e) => setRegForm({ ...regForm, county: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    >
                      <option value="Montserrado">Montserrado</option>
                      <option value="Margibi">Margibi</option>
                      <option value="Bong">Bong</option>
                      <option value="Nimba">Nimba</option>
                      <option value="Grand Bassa">Grand Bassa</option>
                      <option value="Lofa">Lofa</option>
                      <option value="Maryland">Maryland</option>
                      <option value="Sinoe">Sinoe</option>
                      <option value="Grand Cape Mount">Grand Cape Mount</option>
                      <option value="Bomi">Bomi</option>
                      <option value="Grand Gedeh">Grand Gedeh</option>
                      <option value="River Gee">River Gee</option>
                      <option value="Rivercess">Rivercess</option>
                      <option value="Gbarpolu">Gbarpolu</option>
                      <option value="Grand Kru">Grand Kru</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Graduation Year</label>
                    <input
                      type="text"
                      placeholder="e.g. 2021"
                      value={regForm.graduationYear}
                      onChange={(e) => setRegForm({ ...regForm, graduationYear: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Tournament Role</label>
                    <select
                      value={regForm.role}
                      onChange={(e) => setRegForm({ ...regForm, role: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Current Job Title / Profession</label>
                    <input
                      type="text"
                      placeholder="e.g. Associate Attorney / Software Engineer"
                      value={regForm.currentTitle}
                      onChange={(e) => setRegForm({ ...regForm, currentTitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Organization or University</label>
                    <input
                      type="text"
                      placeholder="e.g. University of Liberia / Heritage Partners"
                      value={regForm.organizationOrUniversity}
                      onChange={(e) => setRegForm({ ...regForm, organizationOrUniversity: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Career Sector</label>
                    <select
                      value={regForm.fieldOfWork}
                      onChange={(e) => setRegForm({ ...regForm, fieldOfWork: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
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
                    <label className="text-xs font-bold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. name@domain.com"
                      value={regForm.contactEmail}
                      onChange={(e) => setRegForm({ ...regForm, contactEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                    />
                  </div>
                </div>

                {/* Profile Photo Upload Direct From Computer */}
                <div>
                  <ImageUploadField
                    label="Your Profile Headshot / Portrait Picture"
                    value={regForm.photo}
                    onChange={(val) => setRegForm({ ...regForm, photo: val })}
                    aspectRatio="square"
                    helperText="Upload your headshot photo directly from your computer or provide a URL."
                  />
                </div>

                {/* Note directing video stories to Testimonials & Video Stories */}
                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 flex items-start gap-3">
                  <Film className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-amber-950">Looking to Share a Video Story?</p>
                    <p className="text-amber-800 leading-relaxed">
                      The Alumni Directory Roster stores your profile picture and biography. If you would like to upload a 10-minute video reflection, please submit it in our <strong>Testimonials & Video Stories</strong> section!
                    </p>
                    <button
                      type="button"
                      onClick={() => setAlumniSub('testimonials')}
                      className="text-emerald-800 hover:text-emerald-950 font-bold underline cursor-pointer inline-flex items-center gap-1 pt-0.5"
                    >
                      <span>Go to Testimonials & Video Stories</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Short Bio & Reflections</label>
                  <textarea
                    rows={2}
                    placeholder="Share a brief overview of your journey since high school debate..."
                    value={regForm.bio}
                    onChange={(e) => setRegForm({ ...regForm, bio: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Advice for Current High School Debaters</label>
                  <input
                    type="text"
                    placeholder="e.g. Always study the counter-arguments deeper than your own case."
                    value={regForm.adviceForDebaters}
                    onChange={(e) => setRegForm({ ...regForm, adviceForDebaters: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="mentor-avail"
                    checked={regForm.isMentorAvailable}
                    onChange={(e) => setRegForm({ ...regForm, isMentorAvailable: e.target.checked })}
                    className="w-4 h-4 text-emerald-800 rounded focus:ring-emerald-700"
                  />
                  <label htmlFor="mentor-avail" className="text-xs text-slate-700 font-semibold cursor-pointer">
                    I am willing to offer voluntary debate / STEM coaching to high school students
                  </label>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReg}
                    className="px-8 py-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingReg ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Registering & Auto-Approving...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>Submit Alumni Registration (Auto-Approved)</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Playback Modal for Alumni Profile */}
      <AnimatePresence>
        {activeVideoAlum && (
          <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 text-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl border border-white/10 space-y-4 my-8"
            >
              <div className="flex items-start justify-between border-b border-white/10 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-yellow-400 text-emerald-950 rounded text-[10px] font-bold uppercase">
                      Alumni Video Story
                    </span>
                    <span className="text-xs text-slate-400">{activeVideoAlum.videoDuration || 'Up to 10 min'}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{activeVideoAlum.name}</h3>
                  <p className="text-xs text-emerald-400">{activeVideoAlum.currentTitle} • {activeVideoAlum.highSchool} ({activeVideoAlum.graduationYear})</p>
                </div>
                <button
                  onClick={() => setActiveVideoAlum(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player */}
              <div className="rounded-2xl overflow-hidden bg-black aspect-video">
                <MediaVideoPlayer
                  src={activeVideoAlum.videoUrl}
                  poster={activeVideoAlum.videoPoster || activeVideoAlum.photo}
                  title={`${activeVideoAlum.name} - Testimonial`}
                  autoPlay={true}
                />
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2 text-xs">
                <p className="italic text-slate-300">"{activeVideoAlum.adviceForDebaters || activeVideoAlum.bio}"</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mentorship Request Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-emerald-700">
                  <SafeImage src={selectedMentor.photo} alt={selectedMentor.name} className="w-full h-full object-cover object-top" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Request Mentorship from {selectedMentor.name}</h3>
                  <p className="text-xs text-slate-500">{selectedMentor.currentTitle} • {selectedMentor.highSchool}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedMentor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {mentorshipSent ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-800 mx-auto" />
                <h4 className="font-bold text-emerald-950 text-base">Mentorship Request Dispatched!</h4>
                <p className="text-xs text-emerald-800">
                  {selectedMentor.name} has been notified via the alumni portal. You will receive an email confirmation with meeting coordinates.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendMentorship} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sando K. Morris"
                    value={mentorshipFormData.studentName}
                    onChange={(e) => setMentorshipFormData({ ...mentorshipFormData, studentName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">High School / Club *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gboveh High School"
                      value={mentorshipFormData.school}
                      onChange={(e) => setMentorshipFormData({ ...mentorshipFormData, school: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="debater@gmail.com"
                      value={mentorshipFormData.email}
                      onChange={(e) => setMentorshipFormData({ ...mentorshipFormData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Focus Area</label>
                  <select
                    value={mentorshipFormData.interest}
                    onChange={(e) => setMentorshipFormData({ ...mentorshipFormData, interest: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Debate Coaching & Forensics">Debate Coaching & Cross-Examination</option>
                    <option value="STEM Project Feedback">STEM Project Prototyping & Feedback</option>
                    <option value="University Application & Scholarships">University Application & Scholarship Guidance</option>
                    <option value="Career Mentorship">Career Mentorship & Networking</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">What specific motion or challenge do you need help with?</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Describe your debate motion or question for the mentor..."
                    value={mentorshipFormData.message}
                    onChange={(e) => setMentorshipFormData({ ...mentorshipFormData, message: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700 resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMentor(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Mentorship Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* Vivid Alumni Profile Viewer Modal */}
      <AlumniProfileModal
        profile={viewingProfile}
        isOpen={Boolean(viewingProfile)}
        onClose={() => setViewingProfile(null)}
        isAdmin={false}
        onRequestMentorship={(p) => {
          setSelectedMentor(p);
          setAlumniSub('mentorship');
        }}
        onPlayVideo={(url, title) => setActiveVideoAlum({ id: 'video-modal', name: title, videoUrl: url } as any)}
      />
    </div>
  );
};
