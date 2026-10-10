import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Cpu, Award, Sparkles, CheckCircle2, MapPin, 
  Users, ArrowRight, Filter, Plus, X, Calendar, DollarSign, Lightbulb,
  Phone, Mail, Wrench, FileText, Check, AlertCircle, RefreshCw,
  Compass, ShieldCheck, ChevronDown, ChevronUp, Layers, ListChecks,
  BookOpen, Target, Zap, Shield, CheckSquare, Square, Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StemSubTab, NavTab, InvolvedSubTab, StemProject, StemChallengeConfig, StemTrack } from '../types';
import { CURRENT_STEM_CHALLENGE, STEM_PROJECTS, STEM_PREVIOUS_EDITIONS } from '../data/stemData';
import { SafeImage } from './SafeImage';
import { useToast } from '../context/ToastContext';
import { AnimatedCheckmark } from './AnimatedCheckmark';
import { useProgramStatus } from '../hooks/useProgramStatus';
import { PageHeroBanner } from './PageHeroBanner';

interface StemViewProps {
  stemSub: StemSubTab;
  setStemSub: (sub: StemSubTab) => void;
  setTab: (tab: NavTab) => void;
  setInvolvedSub: (sub: InvolvedSubTab) => void;
}

export const StemView: React.FC<StemViewProps> = ({
  stemSub,
  setStemSub,
  setTab,
  setInvolvedSub
}) => {
  const toast = useToast();
  const { isProgramOpen, getProgramStatus } = useProgramStatus();
  const isStemOpen = isProgramOpen('stem-prog');
  const stemStatus = getProgramStatus('stem-prog');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeProjectModal, setActiveProjectModal] = useState<StemProject | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isSubmittingProposal, setIsSubmittingProposal] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submittedProposalId, setSubmittedProposalId] = useState<string | null>(null);
  const [showModalGuidelines, setShowModalGuidelines] = useState<boolean>(false);
  const [guidelinesConfirmed, setGuidelinesConfirmed] = useState<boolean>(false);
  const [expandedRoadmapStep, setExpandedRoadmapStep] = useState<number | null>(1);

  // Live Challenge from Firestore (falls back to CURRENT_STEM_CHALLENGE)
  const [liveChallenge, setLiveChallenge] = useState<StemChallengeConfig>(CURRENT_STEM_CHALLENGE);

  useEffect(() => {
    try {
      if (!db) return;
      const q = collection(db, 'stemChallenges');
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          // Sort client-side by most recent update or creation
          const sortedDocs = [...snapshot.docs].sort((a, b) => {
            const dataA = a.data();
            const dataB = b.data();
            const timeA = new Date(dataA.updatedAt || dataA.createdAt || 0).getTime();
            const timeB = new Date(dataB.updatedAt || dataB.createdAt || 0).getTime();
            return timeB - timeA;
          });

          const activeDoc = sortedDocs[0];
          const data = activeDoc.data();
          setLiveChallenge({
            id: activeDoc.id,
            edition: data.edition || CURRENT_STEM_CHALLENGE.edition,
            theme: data.theme || CURRENT_STEM_CHALLENGE.theme,
            tagline: data.tagline || CURRENT_STEM_CHALLENGE.tagline,
            deadline: data.deadline || CURRENT_STEM_CHALLENGE.deadline,
            grandExpoDate: data.grandExpoDate || CURRENT_STEM_CHALLENGE.grandExpoDate,
            location: data.location || CURRENT_STEM_CHALLENGE.location,
            participatingSchools: data.participatingSchools ?? CURRENT_STEM_CHALLENGE.participatingSchools,
            countiesRepresented: data.countiesRepresented ?? CURRENT_STEM_CHALLENGE.countiesRepresented,
            prizes: {
              firstPlace: data.prizes?.firstPlace || CURRENT_STEM_CHALLENGE.prizes.firstPlace,
              secondPlace: data.prizes?.secondPlace || CURRENT_STEM_CHALLENGE.prizes.secondPlace,
              thirdPlace: data.prizes?.thirdPlace || CURRENT_STEM_CHALLENGE.prizes.thirdPlace,
              specialCategory: data.prizes?.specialCategory || CURRENT_STEM_CHALLENGE.prizes.specialCategory
            },
            tracks: Array.isArray(data.tracks) && data.tracks.length > 0 ? data.tracks : CURRENT_STEM_CHALLENGE.tracks,
            eligibilityRules: Array.isArray(data.eligibilityRules) && data.eligibilityRules.length > 0 ? data.eligibilityRules : CURRENT_STEM_CHALLENGE.eligibilityRules,
            howToAccomplishOverview: data.howToAccomplishOverview || CURRENT_STEM_CHALLENGE.howToAccomplishOverview,
            accomplishmentRoadmap: Array.isArray(data.accomplishmentRoadmap) && data.accomplishmentRoadmap.length > 0 ? data.accomplishmentRoadmap : CURRENT_STEM_CHALLENGE.accomplishmentRoadmap,
            submissionGuidelines: Array.isArray(data.submissionGuidelines) && data.submissionGuidelines.length > 0 ? data.submissionGuidelines : CURRENT_STEM_CHALLENGE.submissionGuidelines,
            requiredDeliverables: Array.isArray(data.requiredDeliverables) && data.requiredDeliverables.length > 0 ? data.requiredDeliverables : CURRENT_STEM_CHALLENGE.requiredDeliverables,
            evaluationRubric: Array.isArray(data.evaluationRubric) && data.evaluationRubric.length > 0 ? data.evaluationRubric : CURRENT_STEM_CHALLENGE.evaluationRubric,
            status: data.status || 'active'
          });
        }
      }, (err) => {
        console.warn('Live STEM challenge sync notice:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not establish stem challenges listener', e);
    }
  }, []);

  // Submit form state
  const [submitForm, setSubmitForm] = useState({
    title: '',
    school: '',
    county: 'Montserrado',
    category: 'Renewable Energy',
    teamLead: '',
    studentTeamNames: '',
    mentor: '',
    mentorEmail: '',
    mentorPhone: '',
    problemStatement: '',
    solution: '',
    materialsBudget: '$150 - $350 (Local / Recycled Materials)',
    prototypeStage: 'Working Prototype' as 'Concept' | 'Schematic / Blueprint' | 'Working Prototype' | 'Field Tested'
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitForm.title || !submitForm.school || !submitForm.teamLead) return;

    if (!guidelinesConfirmed) {
      setSubmissionError('Please confirm that you have read and agreed to the Official Competition Guidelines and safety protocols before submitting your proposal.');
      toast.warning('Please confirm adherence to the official competition guidelines before submitting.', 'Guidelines Acknowledgment Required');
      return;
    }

    setIsSubmittingProposal(true);
    setSubmissionError(null);

    try {
      // Split team member names
      const teamList = submitForm.studentTeamNames
        ? submitForm.studentTeamNames.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : [];

      const docRef = await addDoc(collection(db, 'stemProposals'), {
        title: submitForm.title.trim(),
        school: submitForm.school.trim(),
        county: submitForm.county,
        category: submitForm.category,
        teamLead: submitForm.teamLead.trim(),
        studentTeam: teamList,
        mentor: submitForm.mentor.trim() || 'High School STEM Coordinator',
        mentorEmail: submitForm.mentorEmail.trim() || '',
        mentorPhone: submitForm.mentorPhone.trim() || '',
        summary: `${submitForm.problemStatement.trim().slice(0, 150)}...`,
        problemStatement: submitForm.problemStatement.trim(),
        solution: submitForm.solution.trim(),
        materialsBudget: submitForm.materialsBudget.trim(),
        prototypeStage: submitForm.prototypeStage,
        status: 'Pending Review',
        reviewerNotes: '',
        submittedAt: new Date().toISOString()
      });

      setSubmittedProposalId(docRef.id);
      setSubmitSuccess(true);

      // Dispatch real-time SMTP email alert to administrator
      fetch('/api/notify-stem-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposalId: docRef.id,
          title: submitForm.title.trim(),
          school: submitForm.school.trim(),
          county: submitForm.county,
          category: submitForm.category,
          teamLead: submitForm.teamLead.trim(),
          studentTeam: teamList,
          mentor: submitForm.mentor.trim() || 'High School STEM Coordinator',
          mentorEmail: submitForm.mentorEmail.trim() || '',
          mentorPhone: submitForm.mentorPhone.trim() || '',
          problemStatement: submitForm.problemStatement.trim(),
          solution: submitForm.solution.trim(),
          materialsBudget: submitForm.materialsBudget.trim(),
          prototypeStage: submitForm.prototypeStage,
          submittedAt: new Date().toISOString()
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          console.log(`[STEM Proposal Notification] Alert successfully dispatched via ${data.mode} to ${data.recipient}`);
        } else {
          console.warn('[STEM Proposal Notification] Alert response notice:', data.error);
        }
      })
      .catch(emailErr => {
        console.warn('[STEM Proposal Notification] Non-blocking email alert error:', emailErr);
      });

      toast.success(
        `Innovation proposal "${submitForm.title.trim()}" submitted successfully! Administrator notified via email.`,
        'Student Proposal Submitted',
        6000
      );

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      console.error('Error submitting proposal to Firestore:', err);
      setSubmissionError(err.message || 'Failed to submit proposal. Please check connection and retry.');
      toast.error(err.message || 'Failed to submit proposal.', 'Submission Error');
    } finally {
      setIsSubmittingProposal(false);
    }
  };

  const handleCloseSubmitModal = () => {
    setIsSubmitModalOpen(false);
    setSubmitSuccess(false);
    setSubmittedProposalId(null);
    setSubmissionError(null);
    setGuidelinesConfirmed(false);
    setShowModalGuidelines(false);
    setSubmitForm({
      title: '',
      school: '',
      county: 'Montserrado',
      category: 'Renewable Energy',
      teamLead: '',
      studentTeamNames: '',
      mentor: '',
      mentorEmail: '',
      mentorPhone: '',
      problemStatement: '',
      solution: '',
      materialsBudget: '$150 - $350 (Local / Recycled Materials)',
      prototypeStage: 'Working Prototype'
    });
  };

  const filteredProjects = selectedCategory === 'All'
    ? STEM_PROJECTS
    : STEM_PROJECTS.filter(p => p.category === selectedCategory);

  const categoriesList = [
    'All',
    'Renewable Energy',
    'Clean Water & Sanitation',
    'Agriculture & Food Security',
    'Climate & Waste Management',
    'Smart Education'
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 space-y-10">
      {/* 1. Sleek Forest Green Hero Banner */}
      <PageHeroBanner
        category="SCIENCE, TECHNOLOGY, ENGINEERING & MATHEMATICS"
        badge="2024–2025 CHALLENGE"
        title="STEM INNOVATION CHALLENGE"
        subtitle="Inspiring Liberia's next generation of inventors, coders, scientists and environmental problem solvers across 15 counties."
        bgImage="/stem.jpg"
        stats={[
          { label: 'Liberian Counties', value: '15' },
          { label: 'Prototypes & Inventions', value: '120+' },
          { label: 'Prize Pool Value', value: '$10,000+' },
          { label: 'Challenge Tracks', value: '6' }
        ]}
      >
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black rounded-full text-xs transition-colors cursor-pointer shadow-xs flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
            <span>Submit Innovation Proposal</span>
          </button>
          <button
            onClick={() => setStemSub('projects')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-full border border-white/20 text-xs transition-colors cursor-pointer"
          >
            <span>Explore Student Inventions</span>
          </button>
          <button
            onClick={() => setShowModalGuidelines(true)}
            className="px-4 py-2.5 bg-emerald-900/60 hover:bg-emerald-900/80 text-emerald-200 border border-emerald-500/30 rounded-full text-xs font-bold transition-colors cursor-pointer"
          >
            <span>Challenge Guidelines</span>
          </button>
        </div>
      </PageHeroBanner>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Sleek Subtabs Bar */}
        <div className="flex justify-center">
          <div className="inline-flex flex-wrap p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs gap-1">
            {[
              { key: 'current', label: 'Current Challenge', icon: Sparkles },
              { key: 'projects', label: 'Student Projects', icon: Cpu },
              { key: 'winners', label: 'Winners & Awards', icon: Award },
              { key: 'previous', label: 'Previous Editions', icon: Calendar }
            ].map(tab => {
              const Icon = tab.icon;
              const active = stemSub === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`stem-subtab-${tab.key}`}
                  onClick={() => setStemSub(tab.key as StemSubTab)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    active 
                      ? 'bg-[#063d2e] text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      {/* Subtab Content with Smooth Transitions */}
      <AnimatePresence mode="wait">
        {/* Subtab 1: Current Challenge */}
        {stemSub === 'current' && (
          <motion.div 
            key="current"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="space-y-12"
          >
            {/* Hero Banner */}
            <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden space-y-6 border border-emerald-500/20">
              <div className="space-y-3 relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-400/30">
                  <Sparkles className="w-3.5 h-3.5" /> {liveChallenge.edition}
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                  {liveChallenge.theme}
                </h2>
                <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
                  {liveChallenge.tagline || 'High school teams are challenged to design, construct, and demonstrate working functional prototypes tackling food preservation, renewable solar energy, and clean water access in Liberian communities.'}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-emerald-500/20 text-xs text-emerald-100 relative z-10">
                <div className="bg-white/10 p-3.5 rounded-xl backdrop-blur-xs">
                  <span className="text-slate-300 block text-[10px] uppercase font-bold">Submission Deadline</span>
                  <strong className="text-white text-sm">{liveChallenge.deadline}</strong>
                </div>
                <div className="bg-white/10 p-3.5 rounded-xl backdrop-blur-xs">
                  <span className="text-slate-300 block text-[10px] uppercase font-bold">Grand Innovation Expo</span>
                  <strong className="text-white text-sm">{liveChallenge.grandExpoDate}</strong>
                </div>
                <div className="bg-white/10 p-3.5 rounded-xl backdrop-blur-xs">
                  <span className="text-slate-300 block text-[10px] uppercase font-bold">Venue Location</span>
                  <strong className="text-white text-sm truncate block">{liveChallenge.location}</strong>
                </div>
                <div className="bg-white/10 p-3.5 rounded-xl backdrop-blur-xs">
                  <span className="text-slate-300 block text-[10px] uppercase font-bold">Grand Prize Grant</span>
                  <strong className="text-amber-300 text-sm truncate block">{liveChallenge.prizes?.firstPlace || '$5,000 + Scholarships'}</strong>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-3 relative z-10">
                {isStemOpen ? (
                  <button
                    id="submit-stem-project-btn"
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="px-6 py-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer hover:shadow-lg"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Submit Student Project Proposal</span>
                  </button>
                ) : (
                  <button
                    id="submit-stem-project-btn"
                    disabled
                    title="Registration for the National STEM Challenge is currently closed."
                    className="px-6 py-3.5 rounded-xl bg-slate-900/90 text-slate-400 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-not-allowed border border-slate-700"
                  >
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span>Registration Closed (Not Open Yet)</span>
                  </button>
                )}
                <a
                  href="#challenge-accomplishment-roadmap"
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  <Compass className="w-4 h-4 text-emerald-300" />
                  <span>How to Accomplish & Guidelines</span>
                </a>
                <button
                  onClick={() => setStemSub('projects')}
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Browse Submitted Prototypes
                </button>
              </div>
            </div>

            {/* Closed Status Notice if STEM is not active */}
            {!isStemOpen && (
              <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3 text-xs text-amber-950 shadow-xs">
                <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <strong className="font-bold text-amber-950 block">
                    National STEM Challenge Registration is Currently Closed
                  </strong>
                  <p className="text-amber-900/90 leading-relaxed font-medium">
                    {stemStatus.closedNotice || 'Registration for the National STEM Challenge is not happening yet, so registration is closed. Please check back soon or follow official Secretariat dispatches.'}
                  </p>
                </div>
              </div>
            )}

            {/* SECTION 1: HOW TO ACCOMPLISH THE STEM CHALLENGE (5-Stage Innovation Roadmap) */}
            <div id="challenge-accomplishment-roadmap" className="scroll-mt-24 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="space-y-1 max-w-3xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                    <Target className="w-3.5 h-3.5" /> Accomplishment Blueprint & Roadmap
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                    How High School Teams Accomplish This STEM Challenge
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                    {liveChallenge.howToAccomplishOverview || CURRENT_STEM_CHALLENGE.howToAccomplishOverview}
                  </p>
                </div>
                <div className="shrink-0">
                  <a
                    href="#challenge-submission-guidelines"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Jump to Official Guidelines</span>
                  </a>
                </div>
              </div>

              {/* Step-by-Step Interactive Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(liveChallenge.accomplishmentRoadmap || CURRENT_STEM_CHALLENGE.accomplishmentRoadmap || []).map((step, idx) => {
                  const isExpanded = expandedRoadmapStep === step.stepNumber;
                  const stepIcons = [Compass, Users, Wrench, Cpu, Sparkles];
                  const StepIcon = stepIcons[idx % stepIcons.length] || Target;

                  return (
                    <div
                      key={step.stepNumber}
                      onClick={() => setExpandedRoadmapStep(isExpanded ? null : step.stepNumber)}
                      className={`rounded-2xl border transition-all cursor-pointer p-6 flex flex-col justify-between ${
                        isExpanded
                          ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-lg bg-emerald-900 text-amber-300 flex items-center justify-center font-black text-xs">
                              0{step.stepNumber}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              Stage {step.stepNumber}
                            </span>
                          </div>
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <StepIcon className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        <div>
                          <h4 className="font-black text-slate-900 text-base leading-snug">
                            {step.title}
                          </h4>
                          <p className="text-xs font-semibold text-emerald-800 mt-0.5">
                            {step.subtitle}
                          </p>
                        </div>

                        <ul className="space-y-2 pt-2 text-xs text-slate-600">
                          {step.details.map((detail, dIdx) => (
                            <li key={dIdx} className="flex items-start gap-2 leading-relaxed">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-700">
                        <span>Action Protocol Complete</span>
                        <span className="text-slate-400 font-medium text-[10px]">Tap to review</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Appropriate Technology & Feasibility Highlight */}
              <div className="bg-emerald-950 text-emerald-100 rounded-2xl p-6 border border-emerald-700/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 max-w-3xl">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-bold text-white text-sm">
                      Zero-Waste & Appropriate Technology Requirement ($50 – $350 USD)
                    </h5>
                    <p className="text-xs text-emerald-200/90 leading-relaxed">
                      All physical prototypes must be built primarily from locally accessible scrap materials (recycled bicycle gears, scrap sheet metal, discarded 12V motors, PVC pipe, Moringa seeds, or solar panels). Submissions that depend on high-cost imported components will be penalized in local replicability scoring.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow-sm"
                >
                  Submit Proposal
                </button>
              </div>
            </div>

            {/* SECTION 2: OFFICIAL GUIDELINES TO READ BEFORE SUBMITTING */}
            <div id="challenge-submission-guidelines" className="scroll-mt-24 space-y-6">
              <div className="space-y-1 max-w-3xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" /> Mandatory Submission Protocols
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                  Official Guidelines to Read Before Submitting
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Every high school team, student innovator, and faculty teacher must review each guideline below prior to completing the submission form. Proposals failing to satisfy these core rules are returned for revision.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Guidelines Rules Column (2 cols) */}
                <div className="lg:col-span-2 space-y-3">
                  {(liveChallenge.submissionGuidelines || CURRENT_STEM_CHALLENGE.submissionGuidelines || []).map((rule, idx) => {
                    const parts = rule.split(':');
                    const hasPrefix = parts.length > 1;
                    const ruleTitle = hasPrefix ? parts[0].trim() : `Rule 0${idx + 1}`;
                    const ruleBody = hasPrefix ? parts.slice(1).join(':').trim() : rule;

                    return (
                      <div key={idx} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0 font-bold text-xs">
                          {idx + 1}
                        </div>
                        <div className="space-y-0.5 text-xs">
                          <strong className="text-slate-900 font-bold text-sm block">
                            {ruleTitle}
                          </strong>
                          <p className="text-slate-600 leading-relaxed">
                            {ruleBody}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Required Deliverables & Direct CTA Card (1 col) */}
                <div className="space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-emerald-700" />
                      <h4 className="font-bold text-slate-900 text-base">Required Deliverables Checklist</h4>
                    </div>
                    <p className="text-xs text-slate-600">
                      Ensure your submission proposal includes all 6 core deliverables required by the Technical Review Board:
                    </p>
                    <ul className="space-y-2 text-xs text-slate-700">
                      {(liveChallenge.requiredDeliverables || CURRENT_STEM_CHALLENGE.requiredDeliverables || []).map((del, dIdx) => (
                        <li key={dIdx} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="font-medium">{del}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-2xl p-6 space-y-3 shadow-md">
                    <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider">Ready to Submit?</span>
                    <h5 className="font-bold text-base">Have your team lead and faculty advisor review the draft?</h5>
                    <p className="text-xs text-emerald-100 leading-relaxed">
                      Submissions undergo county-level vetting before invitation to the Grand Expo at the EJS Ministerial Complex in Monrovia.
                    </p>
                    <button
                      onClick={() => setIsSubmitModalOpen(true)}
                      className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Launch Proposal Submission Form</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: JUDGING & EVALUATION RUBRIC */}
            <div className="space-y-6">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-black uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5 text-emerald-700" /> Fair & Transparent Scoring
                </div>
                <h3 className="text-2xl font-bold text-slate-900">
                  Judges Scoring Rubric & Evaluation Weights
                </h3>
                <p className="text-xs sm:text-sm text-slate-600">
                  Every proposal and working prototype is independently evaluated across 5 transparent criteria by national engineers and educators:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {(liveChallenge.evaluationRubric || CURRENT_STEM_CHALLENGE.evaluationRubric || []).map((rub, rIdx) => (
                  <div key={rIdx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-slate-400">Weight</span>
                        <span className="text-sm font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {rub.weight}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-900 text-sm leading-snug">
                        {rub.criterion}
                      </h5>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {rub.description}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-semibold uppercase">
                      Jury Benchmark
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 4: 4 THEMATIC TRACKS */}
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">Challenge Categories</span>
                <h3 className="text-2xl font-bold text-slate-900">Competitive Innovation Tracks</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {liveChallenge.tracks.map((track, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        <Lightbulb className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{track.name}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{track.description}</p>
                    </div>
                    <div className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 pt-2">
                      Official Track • {liveChallenge.edition.slice(0, 9)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 5: PRIZE PACKAGE BREAKDOWN */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 text-center">
                Championship Awards & Seed Grants
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border-2 border-amber-400 shadow-md space-y-2 text-center">
                  <span className="text-xs font-black uppercase text-amber-800 bg-amber-100 px-3 py-1 rounded-full">1st Place Grand Prize</span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">{liveChallenge.prizes?.firstPlace || '$5,000 Lab Grant'}</div>
                  <p className="text-xs text-slate-600">Full 4-year undergraduate university scholarships + laptop computer for each team member.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-center">
                  <span className="text-xs font-black uppercase text-slate-700 bg-slate-100 px-3 py-1 rounded-full">2nd Place Runner-Up</span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">{liveChallenge.prizes?.secondPlace || '$3,000 Grant'}</div>
                  <p className="text-xs text-slate-600">High school science laboratory overhaul equipment + robotics development kits.</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-center">
                  <span className="text-xs font-black uppercase text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">3rd Place Finalist</span>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">{liveChallenge.prizes?.thirdPlace || '$1,500 Seed Fund'}</div>
                  <p className="text-xs text-slate-600">{liveChallenge.prizes?.specialCategory || 'Community prototype implementation fund to deploy working machines in rural villages.'}</p>
                </div>
              </div>
            </div>

            {/* Final Bottom Call-To-Action Banner */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl text-center sm:text-left">
                <span className="text-xs font-black text-amber-400 uppercase tracking-widest">National Call for High School Innovations</span>
                <h4 className="text-2xl font-black text-white">Have You Engineered a Community Solution?</h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Join hundreds of high school innovators representing all 15 counties of Liberia. Review the guidelines, assemble your team, and submit your proposal today.
                </p>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-xl transition-all shrink-0 cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span>Submit Student Proposal Now</span>
              </button>
            </div>
          </motion.div>
        )}

      {/* Subtab 2: Projects Showcase */}
      {stemSub === 'projects' && (
        <motion.div 
          key="projects"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="space-y-8"
        >
          {/* Category Filters */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
              <Filter className="w-4 h-4" /> Filter by Technology Field:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categoriesList.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-emerald-700 text-white shadow-xs' 
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <div
                key={project.id}
                onClick={() => setActiveProjectModal(project)}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="h-48 overflow-hidden relative">
                    <SafeImage
                      src={project.image}
                      alt={project.title}
                      fallbackCategory="stem"
                      fallbackTitle={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-3 left-3 bg-emerald-800/90 text-white text-[10px] font-black px-2.5 py-1 rounded-md backdrop-blur-xs">
                      {project.category}
                    </span>
                    {project.award && (
                      <span className="absolute bottom-3 right-3 bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                        🏆 {project.award}
                      </span>
                    )}
                  </div>
                  <div className="p-5 space-y-2">
                    <div className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-red-500" /> {project.school} ({project.county} County)
                    </div>
                    <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 text-base leading-snug">
                      {project.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {project.summary}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 font-bold">{project.status}</span>
                  <span className="text-slate-400 group-hover:text-slate-700 font-semibold flex items-center gap-1">
                    View Blueprint <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Subtab 3: Winners & Awards */}
      {stemSub === 'winners' && (
        <motion.div 
          key="winners"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="space-y-8"
        >
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">Hall of Innovation</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">National STEM Champions Archive</h2>
            <p className="text-slate-600 text-xs sm:text-sm">
              Celebrating high schools whose student inventions have earned national awards and international grants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {STEM_PREVIOUS_EDITIONS.map((ed, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-black bg-emerald-800 text-white px-2.5 py-1 rounded">
                    STEM Edition {ed.year}
                  </span>
                  <span className="text-xs font-bold text-amber-700">🏆 Grand Champion</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase">Winning School</span>
                  <h3 className="text-lg font-black text-slate-900">{ed.championSchool}</h3>
                  <div className="text-xs text-emerald-700 font-semibold mt-1">
                    Invention: {ed.winningProject}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">
                  {ed.highlights}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Subtab 4: Previous Editions */}
      {stemSub === 'previous' && (
        <motion.div 
          key="previous"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="space-y-6"
        >
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 space-y-4">
            <h3 className="text-xl font-bold text-slate-900">Historical Editions Record</h3>
            <p className="text-xs text-slate-600 max-w-2xl">
              Since 2021, the STEM challenge has reached over 48 secondary schools, producing real patents, water purifiers, and renewable energy machines.
            </p>
            <div className="space-y-3 pt-2">
              {STEM_PREVIOUS_EDITIONS.map((prev, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-xs font-black bg-emerald-800 text-white px-2 py-0.5 rounded mr-2">
                      {prev.year}
                    </span>
                    <strong className="text-sm text-slate-900">{prev.theme}</strong>
                    <div className="text-xs text-slate-500 mt-1">
                      Champion: <strong className="text-slate-800">{prev.championSchool}</strong> • Winning Machine: {prev.winningProject}
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 shrink-0">
                    {prev.schoolsCount} Schools Competed
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Project Detail Modal */}
      {activeProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-black bg-emerald-800 text-white px-2.5 py-1 rounded">
                  {activeProjectModal.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                  {activeProjectModal.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeProjectModal.school} • {activeProjectModal.county} County
                </p>
              </div>
              <button
                onClick={() => setActiveProjectModal(null)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden h-52">
              <SafeImage
                src={activeProjectModal.image}
                alt={activeProjectModal.title}
                fallbackCategory="stem"
                fallbackTitle={activeProjectModal.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="space-y-1">
                <strong className="text-slate-900 block font-bold text-xs uppercase text-red-700">Problem Addressed:</strong>
                <p className="text-slate-700 leading-relaxed bg-red-50/60 p-3 rounded-xl border border-red-100">
                  {activeProjectModal.problemStatement}
                </p>
              </div>

              <div className="space-y-1">
                <strong className="text-slate-900 block font-bold text-xs uppercase text-emerald-800">Engineered Solution:</strong>
                <p className="text-slate-700 leading-relaxed bg-emerald-50/60 p-3 rounded-xl border border-emerald-100">
                  {activeProjectModal.solution}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Student Team</span>
                  <ul className="text-xs text-slate-800 space-y-0.5 mt-0.5 font-medium">
                    {activeProjectModal.studentTeam.map((m, i) => (
                      <li key={i}>• {m}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Faculty Mentor</span>
                  <p className="text-xs text-slate-800 font-semibold mt-1">{activeProjectModal.mentor}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveProjectModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Close Blueprint View
            </button>
          </div>
        </div>
      )}

      {/* Submit Project Proposal Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Official Application
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5">
                  Submit Student Project Proposal
                </h3>
                <p className="text-xs text-slate-500">
                  {liveChallenge.edition} • Direct Secretariat Submission
                </p>
              </div>
              <button
                onClick={handleCloseSubmitModal}
                className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 sm:p-8 text-center space-y-4">
                <div className="flex items-center justify-center mx-auto py-1">
                  <AnimatedCheckmark size="lg" color="emerald" showHalo={true} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-emerald-950">Proposal Received Successfully!</h4>
                  <p className="text-xs text-emerald-800 font-medium mt-1">
                    Your school project <strong className="text-slate-900">"{submitForm.title}"</strong> has been securely logged into the National Secretariat's evaluation inbox.
                  </p>
                </div>

                {submittedProposalId && (
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-200 text-xs inline-block">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Proposal Tracking Reference</span>
                    <strong className="text-emerald-900 font-mono text-sm">{submittedProposalId}</strong>
                  </div>
                )}

                <div className="bg-emerald-100/70 border border-emerald-300/80 rounded-xl p-3 text-[11px] text-emerald-900 flex items-center justify-center gap-2 max-w-md mx-auto font-medium">
                  <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Instant email alert transmitted to the Administrator via the SMTP notification gateway.</span>
                </div>

                <div className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed pt-1">
                  The Youth For Change National STEM Technical Review Board will inspect the submission blueprint and notify the designated Faculty Advisor ({submitForm.mentor || 'Advisor'}) regarding qualification for the Grand Innovation Expo.
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleCloseSubmitModal}
                    className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    Done & Return to STEM Hub
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                {submissionError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{submissionError}</span>
                  </div>
                )}

                {/* Pre-Submission Guidelines Accordion */}
                <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                      <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                      <span>Important: Competition Rules & Guidelines</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowModalGuidelines(!showModalGuidelines)}
                      className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                    >
                      {showModalGuidelines ? 'Hide Rules' : 'Read Guidelines (7 Rules)'}
                    </button>
                  </div>

                  {showModalGuidelines ? (
                    <div className="pt-2 border-t border-amber-200/70 space-y-3 text-[11px] text-slate-700">
                      <p className="leading-relaxed font-semibold text-slate-800">
                        Please review each rule carefully before submitting your team's proposal:
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {(liveChallenge.submissionGuidelines || CURRENT_STEM_CHALLENGE.submissionGuidelines || []).map((rule, rIdx) => (
                          <div key={rIdx} className="bg-white/90 p-2.5 rounded-xl border border-amber-200/60 flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{rule}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200/60 space-y-1.5">
                        <span className="font-bold text-slate-900 block">Mandatory Deliverables in This Form:</span>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[10px] text-slate-600">
                          {(liveChallenge.requiredDeliverables || CURRENT_STEM_CHALLENGE.requiredDeliverables || []).map((del, dIdx) => (
                            <li key={dIdx} className="flex items-center gap-1.5">
                              <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>{del}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-amber-800 leading-snug">
                      Submissions must be original student-fabricated prototypes using local materials ($50–$350 budget). Click above to review the complete guidelines.
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Project / Prototype Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Solar Powered Rotary Cassava Flash Dryer"
                    value={submitForm.title}
                    onChange={e => setSubmitForm({ ...submitForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">High School Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Gboveh High School"
                      value={submitForm.school}
                      onChange={e => setSubmitForm({ ...submitForm, school: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">County of High School *</label>
                    <select
                      value={submitForm.county}
                      onChange={e => setSubmitForm({ ...submitForm, county: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    >
                      {['Montserrado', 'Nimba', 'Bong', 'Margibi', 'Grand Bassa', 'Lofa', 'Maryland', 'Sinoe', 'Grand Cape Mount', 'Grand Gedeh', 'River Gee', 'Rivercess', 'Bomi', 'Grand Kru', 'Gbarpolu'].map(c => (
                        <option key={c} value={c}>{c} County</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Innovation Category / Track *</label>
                    <select
                      value={submitForm.category}
                      onChange={e => setSubmitForm({ ...submitForm, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    >
                      <option value="Agriculture & Food Security">Agri-Tech & Food Preservation (Liberia Agriculture)</option>
                      <option value="Clean Water & Sanitation">Clean Water & Sanitation (Liberia WASH Sector)</option>
                      <option value="Renewable Energy">Renewable Clean Energy (Liberia Rural Energy Sector)</option>
                      <option value="Civic & Health Tech">Civic Health & Environmental Resilience</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Current Prototype Stage *</label>
                    <select
                      value={submitForm.prototypeStage}
                      onChange={e => setSubmitForm({ ...submitForm, prototypeStage: e.target.value as any })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                    >
                      <option value="Concept">Concept / Theoretical Blueprint</option>
                      <option value="Schematic / Blueprint">Detailed Technical Schematic</option>
                      <option value="Working Prototype">Working Operational Prototype</option>
                      <option value="Field Tested">Field Tested in Community</option>
                    </select>
                  </div>
                </div>

                {/* Team Members */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Student Team Captain / Lead *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Korto B. Mulbah"
                      value={submitForm.teamLead}
                      onChange={e => setSubmitForm({ ...submitForm, teamLead: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Other Student Team Members</label>
                    <input
                      type="text"
                      placeholder="e.g. Emmanuel Kollie, Hawa Flomo (comma-separated)"
                      value={submitForm.studentTeamNames}
                      onChange={e => setSubmitForm({ ...submitForm, studentTeamNames: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>

                {/* Faculty Mentor Details */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                  <span className="font-bold text-slate-800 text-xs block">Faculty Science Advisor / Teacher Mentor</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Advisor Name (e.g. Mr. Patrick Tokpah)"
                        value={submitForm.mentor}
                        onChange={e => setSubmitForm({ ...submitForm, mentor: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Advisor Phone (+231...)"
                        value={submitForm.mentorPhone}
                        onChange={e => setSubmitForm({ ...submitForm, mentorPhone: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                    <div>
                      <input
                        type="email"
                        placeholder="Advisor Email Address"
                        value={submitForm.mentorEmail}
                        onChange={e => setSubmitForm({ ...submitForm, mentorEmail: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Problem Statement */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Community Problem Statement *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe the specific local challenge in your county (e.g., cassava post-harvest losses, creek contamination, nighttime study power)..."
                    value={submitForm.problemStatement}
                    onChange={e => setSubmitForm({ ...submitForm, problemStatement: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* Engineered Solution */}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Engineered Solution & Working Methodology *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Explain how your prototype operates, what materials you assembled (scrap metal, solar cell, PVC, Arduino, sand), and how it works..."
                    value={submitForm.solution}
                    onChange={e => setSubmitForm({ ...submitForm, solution: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimated Prototype Materials Budget</label>
                  <input
                    type="text"
                    placeholder="e.g. $180 USD (PVC pipe, 200W solar panel, recycled motor)"
                    value={submitForm.materialsBudget}
                    onChange={e => setSubmitForm({ ...submitForm, materialsBudget: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* Guidelines confirmation checkbox */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guidelinesConfirmed}
                      onChange={e => setGuidelinesConfirmed(e.target.checked)}
                      className="w-4 h-4 mt-0.5 text-emerald-700 rounded-sm border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs text-slate-700 leading-snug font-medium select-none">
                      I confirm that our student team (3–5 scholars) and designated faculty mentor have read and agreed to the <strong className="text-slate-900 font-bold">Official Competition Guidelines</strong>, lab safety protocols, and zero-waste appropriate technology constraints.
                    </span>
                  </label>
                  {!guidelinesConfirmed && (
                    <p className="text-[10px] text-amber-700 font-medium pl-6">
                      * You must check this confirmation to submit your proposal to the National Technical Review Board.
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmittingProposal}
                    className="w-full py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingProposal ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting Proposal to Secretariat...</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="w-4 h-4" />
                        <span>Submit Official STEM Project Proposal</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
