import React, { useState } from 'react';
import { 
  X, GraduationCap, MapPin, Award, Briefcase, Mail, 
  ExternalLink, Sparkles, ShieldCheck, Clock, CheckCircle2, 
  Maximize2, ZoomIn, ZoomOut, RotateCcw, Edit3, Check, 
  Heart, MessageSquareQuote, Film, Play, UserCheck, AlertCircle
} from 'lucide-react';
import { AlumniProfile } from '../types';
import { SafeImage } from './SafeImage';

interface AlumniProfileModalProps {
  profile: AlumniProfile | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  onEdit?: (profile: AlumniProfile) => void;
  onToggleApprove?: (profile: AlumniProfile) => void;
  onRequestMentorship?: (profile: AlumniProfile) => void;
  onPlayVideo?: (videoUrl: string, title: string) => void;
}

export const AlumniProfileModal: React.FC<AlumniProfileModalProps> = ({
  profile,
  isOpen,
  onClose,
  isAdmin = false,
  onEdit,
  onToggleApprove,
  onRequestMentorship,
  onPlayVideo
}) => {
  const [showVividLightbox, setShowVividLightbox] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!isOpen || !profile) return null;

  const isApproved = profile.approved !== false;
  const hasVideo = Boolean(profile.videoUrl || profile.videoTestimonialUrl);
  const videoSrc = profile.videoUrl || profile.videoTestimonialUrl;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.3, 0.7));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <>
      {/* Main Profile Modal */}
      <div 
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alumni-profile-title"
      >
        <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200/80 my-auto flex flex-col max-h-[92vh]">
          
          {/* Top Header Banner with Cover Art */}
          <div className="relative bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 sm:p-8 shrink-0 overflow-hidden">
            {/* Background Decorative Accents */}
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-32 bottom-0 w-48 h-48 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white transition-all cursor-pointer z-10"
              title="Close Profile (Esc)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-yellow-400 text-emerald-950 shadow-sm">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{profile.role || 'Champion Debater'}</span>
              </span>

              {isApproved ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Verified Live Alumnus</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span>Pending Admin Review</span>
                </span>
              )}

              {profile.fieldOfWork && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/90 border border-white/15">
                  {profile.fieldOfWork}
                </span>
              )}
            </div>

            {/* Vivid Headshot & Name Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
              
              {/* Vivid Picture Frame with Lightbox Action */}
              <div className="relative group shrink-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-slate-900 border-4 border-yellow-400 shadow-2xl ring-4 ring-emerald-500/30">
                  <SafeImage
                    src={profile.photo}
                    alt={profile.name}
                    fallbackCategory="leadership"
                    fallbackTitle={profile.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                {/* Vivid Enlarge Button */}
                <button
                  onClick={() => setShowVividLightbox(true)}
                  className="absolute bottom-2 right-2 p-1.5 bg-slate-950/80 hover:bg-yellow-400 text-white hover:text-emerald-950 rounded-lg shadow-md backdrop-blur-xs transition-all cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                  title="View Profile Picture Vividly (Full Resolution Lightbox)"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Vivid HD</span>
                </button>
              </div>

              {/* Title & Organization Details */}
              <div className="space-y-1.5 text-center sm:text-left">
                <h2 id="alumni-profile-title" className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {profile.name}
                </h2>
                
                <p className="text-sm sm:text-base font-bold text-yellow-300">
                  {profile.currentTitle || profile.role}
                </p>

                <p className="text-xs sm:text-sm text-emerald-100 flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{profile.organizationOrUniversity || 'Independent Professional'}</span>
                  <span className="text-white/40">•</span>
                  <MapPin className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{profile.location || `${profile.county}, Liberia`}</span>
                </p>

                {profile.isMentorAvailable ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Open to Mentoring High School Debaters</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-300">
                    <span>Mentorship Roster Full</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Body - Scrollable Content to Read the Profile */}
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            
            {/* Forensic & Academic Provenance Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-700" /> High School
                </span>
                <p className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                  {profile.highSchool}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Class of {profile.graduationYear || 'Alumnus'}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-yellow-600" /> Tournament League
                </span>
                <p className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                  {profile.tournamentYear || 'National Championship'}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Role: {profile.role}
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" /> County Represented
                </span>
                <p className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                  {profile.county} County
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Republic of Liberia
                </p>
              </div>
            </div>

            {/* Full Biography Section: "Read what their profile is" */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> Full Biography & Background
              </h3>
              {profile.bio ? (
                <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-5 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-xs">
                  {profile.bio}
                </div>
              ) : (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-5 text-slate-400 text-xs italic text-center">
                  No extended biography written yet. The debater is registered with verified credentials from {profile.highSchool}.
                </div>
              )}
            </div>

            {/* Advice for Rising Debaters */}
            {profile.adviceForDebaters && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50/50 border border-amber-200/80 rounded-2xl p-5 space-y-2 shadow-xs">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquareQuote className="w-4 h-4 text-amber-700" />
                  <span>Advice for Aspiring Liberian Debaters & Students</span>
                </span>
                <blockquote className="text-xs sm:text-sm text-slate-800 italic font-medium leading-relaxed">
                  "{profile.adviceForDebaters}"
                </blockquote>
              </div>
            )}

            {/* Video Testimonial Story (if available) */}
            {hasVideo && (
              <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-3 text-center sm:text-left">
                  <div className="w-12 h-12 rounded-xl bg-yellow-400 text-emerald-950 flex items-center justify-center shrink-0 shadow-md">
                    <Film className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Watch Alumni Video Story</h4>
                    <p className="text-xs text-slate-300">
                      {profile.videoDuration ? `Runtime: ${profile.videoDuration}` : 'Full high-definition video testimonial'}
                    </p>
                  </div>
                </div>

                {onPlayVideo && videoSrc && (
                  <button
                    onClick={() => onPlayVideo(videoSrc, `Video Story: ${profile.name}`)}
                    className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md active:scale-95 transition-all shrink-0"
                  >
                    <Play className="w-4 h-4 fill-emerald-950" />
                    <span>Play Video</span>
                  </button>
                )}
              </div>
            )}

            {/* Contact & Professional Connections */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {profile.contactEmail && (
                  <a
                    href={`mailto:${profile.contactEmail}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    <span>{profile.contactEmail}</span>
                  </a>
                )}

                {profile.linkedIn && (
                  <a
                    href={profile.linkedIn.startsWith('http') ? profile.linkedIn : `https://${profile.linkedIn}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold rounded-xl text-xs transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-600" />
                    <span>LinkedIn Profile</span>
                  </a>
                )}
              </div>

              {/* Photo Vividness Badge Indicator */}
              <button
                onClick={() => setShowVividLightbox(true)}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-800 hover:text-emerald-900 font-bold cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>View Headshot in High-Res Lightbox</span>
              </button>
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {/* Status Information */}
            <div className="text-xs text-slate-500 text-center sm:text-left">
              {isAdmin ? (
                <span>
                  Admin Moderation Mode • Status: <strong>{isApproved ? 'Approved & Public' : 'Pending Review'}</strong>
                </span>
              ) : (
                <span>Youth For Change National Forensic Alumni Network</span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {isAdmin && onToggleApprove && (
                <button
                  onClick={() => onToggleApprove(profile)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all ${
                    isApproved 
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-900' 
                      : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {isApproved ? (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Unpublish</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Publish</span>
                    </>
                  )}
                </button>
              )}

              {isAdmin && onEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onEdit(profile);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              )}

              {!isAdmin && profile.isMentorAvailable && onRequestMentorship && (
                <button
                  onClick={() => {
                    onClose();
                    onRequestMentorship(profile);
                  }}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Request Mentorship</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vivid Picture Lightbox Modal (Ultra High Definition Picture Viewer) */}
      {showVividLightbox && (
        <div 
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-lg flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowVividLightbox(false);
          }}
        >
          {/* Lightbox Header Bar */}
          <div className="w-full max-w-4xl flex items-center justify-between text-white py-2 z-10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse" />
              <div>
                <h4 className="font-bold text-sm sm:text-base text-white">{profile.name}</h4>
                <p className="text-xs text-slate-400">
                  High-Definition Alumni Profile Picture ({profile.highSchool}, {profile.county})
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomIn}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowVividLightbox(false)}
                className="p-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold cursor-pointer ml-2"
                title="Close Photo Lightbox"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vivid Image Display Container */}
          <div className="flex-1 w-full max-w-3xl flex items-center justify-center overflow-hidden p-2 sm:p-6">
            <div 
              className="relative max-h-[75vh] max-w-full rounded-2xl overflow-hidden shadow-2xl border-4 border-yellow-400/80 ring-4 ring-emerald-500/40 transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <SafeImage
                src={profile.photo}
                alt={profile.name}
                fallbackCategory="leadership"
                fallbackTitle={profile.name}
                className="max-h-[75vh] w-auto object-contain bg-slate-950"
              />
            </div>
          </div>

          {/* Lightbox Footer Bar */}
          <div className="w-full max-w-md text-center text-xs text-slate-400 py-2">
            <span>Click and drag or use zoom controls to inspect image vividly • Press ESC or click outside to exit</span>
          </div>
        </div>
      )}
    </>
  );
};
