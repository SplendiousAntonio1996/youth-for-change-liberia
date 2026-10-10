import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Flame, Cpu, Users, BookOpen, Award, CheckCircle2, 
  Sparkles, ArrowRight, Star, Clock, GraduationCap, ShieldCheck,
  Lock, AlertCircle
} from 'lucide-react';
import { ProgramsSubTab, NavTab, InvolvedSubTab, DebateSubTab, StemSubTab } from '../types';
import { PROGRAMS_DETAILED } from '../data/contentData';
import { SafeImage } from './SafeImage';
import { useProgramStatus } from '../hooks/useProgramStatus';

interface ProgramsViewProps {
  programsSub: ProgramsSubTab;
  setProgramsSub: (sub: ProgramsSubTab) => void;
  setTab: (tab: NavTab) => void;
  setInvolvedSub: (sub: InvolvedSubTab) => void;
  setDebateSub: (sub: DebateSubTab) => void;
  setStemSub: (sub: StemSubTab) => void;
}

export const ProgramsView: React.FC<ProgramsViewProps> = ({
  programsSub,
  setProgramsSub,
  setTab,
  setInvolvedSub,
  setDebateSub,
  setStemSub
}) => {
  const { getProgramStatus, isProgramOpen } = useProgramStatus();
  const currentProgram = PROGRAMS_DETAILED.find(p => p.id === programsSub) || PROGRAMS_DETAILED[0];
  const currentStatus = getProgramStatus(currentProgram.id);
  const isOpen = currentStatus.isOpen;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-extrabold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
          Holistic Youth Development
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
          Our Five Core Programs
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          From forensics debate and grassroots STEM innovation to diaspora mentorship and civic leadership, explore how we build Liberia's future leaders.
        </p>

        {/* 5 Program Subtabs with Live Registration Badges */}
        <div className="inline-flex flex-wrap p-1.5 bg-slate-100 rounded-2xl border border-slate-200 gap-1 mt-4">
          {[
            { key: 'debate-prog', label: 'National Debate Championship', icon: Flame },
            { key: 'stem-prog', label: 'National STEM Challenge', icon: Cpu },
            { key: 'mentorship', label: 'Mentorship', icon: Users },
            { key: 'academic', label: 'Academic Empowerment', icon: BookOpen },
            { key: 'leadership-prog', label: 'Youth Leadership', icon: Award }
          ].map(tab => {
            const Icon = tab.icon;
            const active = programsSub === tab.key;
            const tabOpen = isProgramOpen(tab.key);
            return (
              <button
                key={tab.key}
                id={`prog-subtab-${tab.key}`}
                onClick={() => setProgramsSub(tab.key as ProgramsSubTab)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  active 
                    ? 'bg-emerald-800 text-white shadow-md' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  active
                    ? (tabOpen ? 'bg-emerald-400 text-emerald-950' : 'bg-slate-700 text-slate-200')
                    : (tabOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500')
                }`}>
                  {tabOpen ? 'Open' : 'Closed'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Program Detail Card with Motion */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={currentProgram.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left Visual & Badge */}
            <div className="lg:col-span-5 relative min-h-[320px] lg:min-h-full">
              <SafeImage
                src={currentProgram.image}
                alt={currentProgram.title}
                fallbackSrc="/group.jpg"
                fallbackCategory="program"
                fallbackTitle={currentProgram.title}
                priority
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent flex flex-col justify-end p-6 text-white">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs font-black uppercase tracking-wider bg-yellow-400 text-emerald-950 px-3 py-1 rounded-md inline-block w-fit">
                    {currentProgram.badge}
                  </span>
                  {isOpen ? (
                    <span className="text-xs font-black uppercase tracking-wider bg-emerald-500 text-white px-3 py-1 rounded-md inline-flex items-center gap-1.5 w-fit shadow-md border border-emerald-400/40">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                      {currentStatus.statusLabel || 'Open Now, Register'}
                    </span>
                  ) : (
                    <span className="text-xs font-black uppercase tracking-wider bg-slate-900/90 text-amber-300 px-3 py-1 rounded-md inline-flex items-center gap-1.5 w-fit border border-slate-700">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      {currentStatus.statusLabel || 'Closed - Not Open Yet'}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-black text-white">{currentProgram.title}</h3>
                <p className="text-xs text-slate-200 mt-1 font-semibold">{currentProgram.stats}</p>
              </div>
            </div>

            {/* Right Content */}
            <div className="lg:col-span-7 p-6 sm:p-10 space-y-6">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
                    {currentProgram.subtitle}
                  </span>
                  <span className={`text-xs font-extrabold px-3 py-0.5 rounded-full ${
                    isOpen 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}>
                    {isOpen ? '● Registration OPEN' : '🔒 Registration CLOSED'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  {currentProgram.title}
                </h2>
                <p className="text-sm sm:text-base text-slate-700 mt-3 leading-relaxed">
                  {currentProgram.description}
                </p>
              </div>

              {/* Real-time Secretariat Registration Status Banner */}
              {isOpen ? (
                <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="font-black text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>
                        Official Secretariat Status: Open for Registration
                      </strong>
                      {currentStatus.registrationDeadline && (
                        <span className="text-[10px] font-bold bg-emerald-200 text-emerald-950 px-2.5 py-0.5 rounded-full">
                          Deadline: {currentStatus.registrationDeadline}
                        </span>
                      )}
                    </div>
                    <p className="text-emerald-900/90 leading-relaxed font-medium">
                      {currentStatus.openNotice || 'Registration is currently open! High schools and student candidates across all 15 Liberian counties are invited to enroll today.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 flex items-start gap-3 text-xs">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4 text-amber-700" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="font-black text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                        Registration Status: Closed — Not Open Yet
                      </strong>
                      <span className="text-[10px] font-bold bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full">
                        Season {currentStatus.seasonYear || '2024/2025'}
                      </span>
                    </div>
                    <p className="text-amber-950/90 leading-relaxed font-medium">
                      {currentStatus.closedNotice || 'Registration for this program is not happening yet, so registration is closed. Please check back soon or follow official Secretariat press announcements.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Curriculum Modules */}
              <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-800" /> Key Learning Modules & Components:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentProgram.curriculum.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{c}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Impact Metric Card */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Proven Track Record & Impact:</span>
                <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                  {currentProgram.impact}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {currentProgram.id === 'debate-prog' && (
                  <button
                    onClick={() => {
                      setTab('debate');
                      setDebateSub('2024-25');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>Explore Tournament Editions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {currentProgram.id === 'stem-prog' && (
                  <button
                    onClick={() => {
                      setTab('stem');
                      setStemSub('current');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>View 2024/25 STEM Challenge</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {isOpen ? (
                  <button
                    id="btn-enroll-program"
                    onClick={() => {
                      setTab('involved');
                      setInvolvedSub(
                        currentProgram.id === 'debate-prog' || currentProgram.id === 'stem-prog' ? 'schools' :
                        currentProgram.id === 'mentorship' || currentProgram.id === 'academic' ? 'students' : 'volunteers'
                      );
                    }}
                    className="px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-950" />
                    <span>Open Now, Register</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="btn-enroll-program-disabled"
                    disabled
                    title="Registration for this program is currently closed by the Secretariat."
                    className="px-6 py-3 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-not-allowed border border-slate-300"
                  >
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Registration Closed (Not Open Yet)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Program Summary Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Explore All Programs</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {PROGRAMS_DETAILED.map(p => {
            const pOpen = isProgramOpen(p.id);
            return (
              <div
                key={p.id}
                onClick={() => setProgramsSub(p.id as ProgramsSubTab)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  programsSub === p.id 
                    ? 'bg-emerald-50 border-emerald-800 shadow-md ring-2 ring-emerald-500/20' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">{p.badge}</span>
                    {pOpen ? (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                        Open Now
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 uppercase flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> Closed
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{p.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>
                </div>
                <div className="pt-3 text-[11px] font-bold text-emerald-800 flex items-center justify-between">
                  <span>Learn More</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

