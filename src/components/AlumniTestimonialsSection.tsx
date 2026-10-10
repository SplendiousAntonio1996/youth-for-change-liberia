import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Quote, Star, Award, MapPin, Briefcase, GraduationCap, 
  Search, Heart, Share2, PlusCircle, CheckCircle2, 
  Sparkles, Filter, Building2, MessageSquareQuote, Check,
  Play, Film, Clock, Video, X
} from 'lucide-react';
import { AlumniTestimonial } from '../types';
import { useTestimonials } from '../hooks/useAlumni';
import { createTestimonial, likeTestimonial } from '../lib/alumniService';
import { SafeImage } from './SafeImage';
import { ImageUploadField } from './ImageUploadField';
import { VideoUploadField } from './VideoUploadField';
import { MediaVideoPlayer } from './MediaVideoPlayer';
import { useToast } from '../context/ToastContext';

interface AlumniTestimonialsSectionProps {
  onExploreDirectory?: () => void;
  onExploreMentorship?: () => void;
}

export const AlumniTestimonialsSection: React.FC<AlumniTestimonialsSectionProps> = ({
  onExploreDirectory,
  onExploreMentorship
}) => {
  const toast = useToast();
  const { verifiedTestimonials, loading } = useTestimonials();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState('All');
  const [selectedCounty, setSelectedCounty] = useState('All');
  const [filterVideoOnly, setFilterVideoOnly] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Video Modal State
  const [activeVideoModal, setActiveVideoModal] = useState<AlumniTestimonial | null>(null);

  // Submit Modal State
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    name: '',
    highSchool: '',
    county: 'Montserrado',
    graduationYear: '2023',
    tournamentYear: '2022 (Debater)',
    role: 'Champion Debater',
    currentTitle: '',
    organizationOrUniversity: '',
    fieldOfWork: 'Law & Governance',
    headline: '',
    keyQuote: '',
    story: '',
    photo: '',
    adviceSnippet: '',
    impactArea: 'Civic Leadership & Policy',
    videoUrl: '',
    videoDuration: '',
    videoDurationSeconds: 0,
    videoPoster: ''
  });

  // Handle Likes
  const handleLike = async (id: string) => {
    try {
      await likeTestimonial(id);
      toast.success('Thank you for your feedback!', 'Testimonial Liked', 2000);
    } catch (e) {
      console.warn('Like failed:', e);
    }
  };

  // Handle Share / Copy Quote
  const handleShareQuote = (item: AlumniTestimonial) => {
    const textToCopy = `"${item.keyQuote}" — ${item.name} (${item.highSchool}, ${item.currentTitle}) | Youth For Change Liberia Alumni`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedId(item.id);
      toast.success('Quote copied to clipboard!', 'Share Testimonial', 2500);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Handle Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.keyQuote.trim() || !formState.story.trim()) {
      toast.warning('Please fill in your name, key quote, and full testimonial story.', 'Missing Required Fields');
      return;
    }

    setSubmitting(true);
    try {
      await createTestimonial({
        name: formState.name,
        highSchool: formState.highSchool || 'Liberian High School',
        county: formState.county,
        graduationYear: formState.graduationYear,
        tournamentYear: formState.tournamentYear,
        role: formState.role,
        currentTitle: formState.currentTitle || 'Young Professional / Scholar',
        organizationOrUniversity: formState.organizationOrUniversity || 'Independent',
        fieldOfWork: formState.fieldOfWork,
        headline: formState.headline || `How Youth For Change Transformed My Career Path`,
        keyQuote: formState.keyQuote,
        story: formState.story,
        impactArea: formState.impactArea || 'Civic Leadership',
        photo: formState.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        verified: false, // Requires admin review and approval
        rating: 5,
        featured: false,
        adviceSnippet: formState.adviceSnippet || 'Trust your preparation, master the facts, and never be afraid to speak up.',
        videoUrl: formState.videoUrl || undefined,
        videoDuration: formState.videoDuration || undefined,
        videoDurationSeconds: formState.videoDurationSeconds || undefined,
        videoPoster: formState.videoPoster || formState.photo || undefined,
        likesCount: 0,
        liked: false
      });

      setSubmissionSuccess(true);
      toast.success(
        'Your testimonial has been submitted for review and will be published after admin approval!',
        'Submitted for Review'
      );

      setTimeout(() => {
        setShowSubmitModal(false);
        setSubmissionSuccess(false);
        setSubmitting(false);
        setFormState({
          name: '',
          highSchool: '',
          county: 'Montserrado',
          graduationYear: '2023',
          tournamentYear: '2022 (Debater)',
          role: 'Champion Debater',
          currentTitle: '',
          organizationOrUniversity: '',
          fieldOfWork: 'Law & Governance',
          headline: '',
          keyQuote: '',
          story: '',
          photo: '',
          adviceSnippet: '',
          impactArea: 'Civic Leadership & Policy',
          videoUrl: '',
          videoDuration: '',
          videoDurationSeconds: 0,
          videoPoster: ''
        });
      }, 3000);
    } catch (err: any) {
      console.error('Error creating testimonial:', err);
      toast.error('Failed to submit testimonial. Please try again.', 'Error');
      setSubmitting(false);
    }
  };

  // Filtered List from verified testimonials
  const filtered = verifiedTestimonials.filter(t => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      t.name.toLowerCase().includes(query) ||
      t.highSchool.toLowerCase().includes(query) ||
      t.currentTitle.toLowerCase().includes(query) ||
      t.organizationOrUniversity.toLowerCase().includes(query) ||
      t.headline.toLowerCase().includes(query) ||
      t.keyQuote.toLowerCase().includes(query);
    
    const matchesField = selectedField === 'All' || t.fieldOfWork === selectedField;
    const matchesCounty = selectedCounty === 'All' || t.county.toLowerCase() === selectedCounty.toLowerCase();
    const matchesVideo = !filterVideoOnly || Boolean(t.videoUrl);

    return matchesSearch && matchesField && matchesCounty && matchesVideo;
  });

  const featured = verifiedTestimonials.find(t => t.featured) || verifiedTestimonials[0];

  return (
    <div className="space-y-8">
      {/* Top Banner with Stats & CTA */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white border border-emerald-800/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400 text-emerald-950 rounded-full text-xs font-bold uppercase tracking-wider">
            <MessageSquareQuote className="w-3.5 h-3.5" />
            <span>Alumni Directory & Voices of Impact</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            How a Decade of Forensics & STEM Shaped Liberian Leaders
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
            Read and watch firsthand accounts of how competing in the National Debate Championship and STEM Challenge empowered students to excel in law, medicine, renewable engineering, public policy, and entrepreneurship.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          <button
            id="open-testimonial-modal-btn"
            onClick={() => setShowSubmitModal(true)}
            className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" /> Share Video & Story (Up to 10 Min)
          </button>
        </div>
      </div>

      {/* Featured Spotlight Card */}
      {featured && (
        <div className="bg-gradient-to-br from-white to-emerald-50/40 rounded-3xl p-6 sm:p-8 border-2 border-emerald-800/20 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: Author Profile & Video Preview */}
            <div className="lg:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left gap-4 pb-4 lg:pb-0 lg:border-r border-slate-200 lg:pr-6">
              <div className="relative w-full aspect-video sm:aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 border-2 border-emerald-700 shadow-md group">
                <SafeImage
                  src={featured.videoPoster || featured.photo}
                  alt={featured.name}
                  fallbackCategory="leadership"
                  fallbackTitle={featured.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                {featured.videoUrl ? (
                  <button
                    onClick={() => setActiveVideoModal(featured)}
                    className="absolute inset-0 bg-slate-950/40 hover:bg-slate-950/20 backdrop-blur-xs flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-white"
                  >
                    <div className="w-14 h-14 rounded-full bg-yellow-400 text-emerald-950 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 text-white rounded-full text-xs font-bold border border-white/20">
                      <Video className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Watch Testimonial {featured.videoDuration ? `(${featured.videoDuration})` : ''}</span>
                    </div>
                  </button>
                ) : (
                  <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                    <GraduationCap className="w-3 h-3 text-yellow-400" /> Verified Alum
                  </div>
                )}
              </div>

              <div className="space-y-1 w-full">
                <div className="flex items-center justify-center sm:justify-start gap-1 text-yellow-500 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                  <span className="text-[11px] font-bold text-slate-600 ml-1">5.0 Verified Alum</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">{featured.name}</h3>
                <p className="text-xs font-semibold text-emerald-800">{featured.currentTitle}</p>
                <p className="text-xs text-slate-500">{featured.organizationOrUniversity}</p>
                <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-[11px] font-medium text-slate-600">
                  <span className="bg-emerald-100/80 text-emerald-900 px-2 py-0.5 rounded-md font-semibold">
                    {featured.highSchool}
                  </span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded-md">
                    {featured.county} County
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Testimonial Narrative & Quote */}
            <div className="lg:col-span-7 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-lg text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Featured Spotlight Story</span>
              </div>
              <h4 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                "{featured.headline}"
              </h4>
              
              <blockquote className="bg-emerald-900/5 p-4 rounded-2xl border-l-4 border-emerald-700 italic text-sm text-slate-800 leading-relaxed">
                "{featured.keyQuote}"
              </blockquote>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {featured.story}
              </p>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-semibold text-slate-700">Advice:</span>
                  <span className="text-slate-600 italic">"{featured.adviceSnippet || 'Never be afraid to stand and speak truth.'}"</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleLike(featured.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      featured.liked
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${featured.liked ? 'fill-current text-rose-600' : ''}`} />
                    <span>{featured.likesCount} Inspiring</span>
                  </button>
                  <button
                    onClick={() => handleShareQuote(featured)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg cursor-pointer transition-colors"
                    title="Copy Quote"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search testimonials, alumni, or quotes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
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
            <option value="Nimba">Nimba</option>
            <option value="Bong">Bong</option>
            <option value="Grand Bassa">Grand Bassa</option>
            <option value="Lofa">Lofa</option>
            <option value="Maryland">Maryland</option>
            <option value="Grand Gedeh">Grand Gedeh</option>
            <option value="Sinoe">Sinoe</option>
            <option value="Grand Cape Mount">Grand Cape Mount</option>
            <option value="Bomi">Bomi</option>
            <option value="Rivercess">Rivercess</option>
            <option value="Grand Kru">Grand Kru</option>
            <option value="River Gee">River Gee</option>
            <option value="Gbarpolu">Gbarpolu</option>
          </select>

          <button
            onClick={() => setFilterVideoOnly(!filterVideoOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterVideoOnly 
                ? 'bg-emerald-800 text-white shadow-xs' 
                : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Video Testimonials Only</span>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-16 text-center text-slate-400 space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-600">Loading verified alumni testimonials...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 sm:p-16 text-center max-w-2xl mx-auto space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-yellow-50 text-yellow-800 flex items-center justify-center mx-auto border border-yellow-100 shadow-xs">
            <MessageSquareQuote className="w-8 h-8 text-yellow-700" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Alumni Testimonials & Stories</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Are you an alumnus of the National Debate Championship or STEM League? Share your story and upload an inspiring video testimonial (up to 10 minutes) for thousands of young Liberians.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Submit the First Video Testimonial</span>
            </button>
          </div>
        </div>
      )}

      {/* Testimonials Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-600 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header with Photo / Video Preview */}
                <div className="p-5 pb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shrink-0">
                      <SafeImage
                        src={t.photo}
                        alt={t.name}
                        fallbackCategory="leadership"
                        fallbackTitle={t.name}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-tight group-hover:text-emerald-800 transition-colors">
                        {t.name}
                      </h4>
                      <p className="text-[11px] font-semibold text-emerald-800 line-clamp-1">{t.currentTitle}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-1">{t.organizationOrUniversity}</p>
                    </div>
                  </div>

                  {t.videoUrl && (
                    <button
                      onClick={() => setActiveVideoModal(t)}
                      className="p-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-emerald-950 shrink-0 shadow-xs cursor-pointer transition-transform hover:scale-105"
                      title="Watch Video Testimonial (up to 10 min)"
                    >
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </button>
                  )}
                </div>

                {/* Video Banner if has video */}
                {t.videoUrl && (
                  <div 
                    onClick={() => setActiveVideoModal(t)}
                    className="mx-5 mb-3 relative aspect-video rounded-xl overflow-hidden bg-slate-950 cursor-pointer group/video border border-slate-800"
                  >
                    <SafeImage
                      src={t.videoPoster || t.photo}
                      alt={t.name}
                      fallbackCategory="leadership"
                      className="w-full h-full object-cover group-hover/video:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 group-hover/video:bg-slate-950/20 transition-all flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-yellow-400 text-emerald-950 flex items-center justify-center shadow-md">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 bg-slate-950/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1 border border-white/10">
                      <Clock className="w-3 h-3 text-yellow-400" />
                      <span>{t.videoDuration || 'Video Story (Max 10m)'}</span>
                    </div>
                  </div>
                )}

                {/* Narrative */}
                <div className="px-5 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold">
                    <span className="bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded-md">
                      {t.highSchool}
                    </span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {t.county}
                    </span>
                    <span className="bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md">
                      {t.fieldOfWork}
                    </span>
                  </div>

                  <h5 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                    "{t.headline}"
                  </h5>

                  <blockquote className="bg-slate-50 p-3 rounded-xl border-l-3 border-emerald-700 italic text-xs text-slate-700 leading-relaxed line-clamp-3">
                    "{t.keyQuote}"
                  </blockquote>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {t.story}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-5 pt-3 border-t border-slate-100 mt-4 flex items-center justify-between text-xs text-slate-500">
                <button
                  onClick={() => handleLike(t.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                    t.liked 
                      ? 'bg-rose-50 text-rose-700' 
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${t.liked ? 'fill-current text-rose-600' : ''}`} />
                  <span>{t.likesCount || 0}</span>
                </button>

                <button
                  onClick={() => handleShareQuote(t)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  title="Copy Quote"
                >
                  {copiedId === t.id ? (
                    <span className="text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copied
                    </span>
                  ) : (
                    <Share2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Playback Modal */}
      <AnimatePresence>
        {activeVideoModal && (
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
                    <span className="text-xs text-slate-400">{activeVideoModal.videoDuration || 'Up to 10 min'}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{activeVideoModal.headline}</h3>
                  <p className="text-xs text-emerald-400">{activeVideoModal.name} — {activeVideoModal.currentTitle} ({activeVideoModal.highSchool})</p>
                </div>
                <button
                  onClick={() => setActiveVideoModal(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player */}
              <div className="rounded-2xl overflow-hidden bg-black aspect-video">
                <MediaVideoPlayer
                  src={activeVideoModal.videoUrl}
                  poster={activeVideoModal.videoPoster || activeVideoModal.photo}
                  title={activeVideoModal.headline}
                  autoPlay={true}
                />
              </div>

              <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2 text-xs">
                <p className="italic text-slate-300">"{activeVideoModal.keyQuote}"</p>
                <p className="text-slate-400 text-[11px] leading-relaxed">{activeVideoModal.story}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Submit Testimonial Modal (With 10 Min Max Video Upload) */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-8"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-yellow-100 text-yellow-900 rounded-md text-[11px] font-bold uppercase tracking-wider mb-1">
                    <Sparkles className="w-3 h-3 text-yellow-700" />
                    <span>Alumni Voice Submission</span>
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                    Share Your Alumni Testimonial & Video
                  </h3>
                  <p className="text-xs text-slate-500">
                    Upload a video recording (maximum 10 minutes) and written reflections to inspire young Liberians.
                  </p>
                </div>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submissionSuccess ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center space-y-3">
                  <Clock className="w-12 h-12 text-amber-700 mx-auto" />
                  <h4 className="font-bold text-amber-950 text-lg">Testimonial Submitted for Review</h4>
                  <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
                    Thank you for sharing your journey! Your written reflections and video story have been submitted to our moderation queue. An administrator will review and publish your story to the live website shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Cllr. J. Patrick Weah Jr."
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">High School Represented *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. St. Patrick’s High School"
                        value={formState.highSchool}
                        onChange={(e) => setFormState({ ...formState, highSchool: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">County *</label>
                      <select
                        value={formState.county}
                        onChange={(e) => setFormState({ ...formState, county: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      >
                        <option value="Montserrado">Montserrado</option>
                        <option value="Margibi">Margibi</option>
                        <option value="Nimba">Nimba</option>
                        <option value="Bong">Bong</option>
                        <option value="Grand Bassa">Grand Bassa</option>
                        <option value="Lofa">Lofa</option>
                        <option value="Maryland">Maryland</option>
                        <option value="Grand Gedeh">Grand Gedeh</option>
                        <option value="Sinoe">Sinoe</option>
                        <option value="Grand Cape Mount">Grand Cape Mount</option>
                        <option value="Bomi">Bomi</option>
                        <option value="Rivercess">Rivercess</option>
                        <option value="Grand Kru">Grand Kru</option>
                        <option value="River Gee">River Gee</option>
                        <option value="Gbarpolu">Gbarpolu</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Current Role / Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Associate Attorney / Engineer"
                        value={formState.currentTitle}
                        onChange={(e) => setFormState({ ...formState, currentTitle: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">University / Org *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Harvard Law / Heritage Partners"
                        value={formState.organizationOrUniversity}
                        onChange={(e) => setFormState({ ...formState, organizationOrUniversity: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Discipline / Career Field</label>
                      <select
                        value={formState.fieldOfWork}
                        onChange={(e) => setFormState({ ...formState, fieldOfWork: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
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
                      <label className="text-xs font-bold text-slate-700">Headline for Your Testimonial *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. From High School Podiums to Supreme Court Litigation"
                        value={formState.headline}
                        onChange={(e) => setFormState({ ...formState, headline: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                      />
                    </div>
                  </div>

                  {/* Profile Photo */}
                  <ImageUploadField
                    label="Profile Photo of Alumnus"
                    value={formState.photo}
                    onChange={(url) => setFormState({ ...formState, photo: url })}
                    helperText="Upload a professional headshot from your computer or provide an image URL."
                  />

                  {/* Video Testimonial Upload (Max 10 Minutes) */}
                  <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <Film className="w-4 h-4 text-amber-700" />
                      <span>Video Testimonial Recording (Maximum 10 Minutes)</span>
                    </div>
                    <VideoUploadField
                      value={formState.videoUrl}
                      onChange={(url) => setFormState({ ...formState, videoUrl: url })}
                      onDurationExtracted={(dur, secs) => {
                        setFormState(prev => ({
                          ...prev,
                          videoDuration: dur,
                          videoDurationSeconds: secs || 0
                        }));
                      }}
                      onAutoPosterExtracted={(poster) => {
                        setFormState(prev => ({ ...prev, videoPoster: poster }));
                      }}
                      maxDurationSeconds={600}
                      label="Upload Video Testimonial from Computer (Max 10 Mins)"
                      helperText="Select or drag & drop an MP4, WebM, MOV recording of yourself speaking (maximum duration: 10 minutes)."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Key Punchy Quote (1-2 sentences) *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Debate taught me to deconstruct complex national legislation and stand fearlessly."
                      value={formState.keyQuote}
                      onChange={(e) => setFormState({ ...formState, keyQuote: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Full Testimonial Story & Reflections *</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Share details of your experience with Youth For Change, key matches, skills gained, and how it directly impacted your career or university achievements..."
                      value={formState.story}
                      onChange={(e) => setFormState({ ...formState, story: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">1-Sentence Advice for Aspiring Debaters</label>
                    <input
                      type="text"
                      placeholder="e.g. Never debate merely to defeat your opponent; debate to discover unassailable truth."
                      value={formState.adviceSnippet}
                      onChange={(e) => setFormState({ ...formState, adviceSnippet: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowSubmitModal(false)}
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
                          <span>Publishing...</span>
                        </>
                      ) : (
                        <>
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Publish Testimonial & Video</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
