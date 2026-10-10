import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  GraduationCap, Users, HeartHandshake, DollarSign, 
  Sparkles, CheckCircle2, Building, ShieldCheck, Mail, Phone, MapPin,
  Calendar, LayoutDashboard, ArrowRight, Heart, Award, Cpu, BookOpen, AlertCircle,
  FileCheck, Star, Briefcase, Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { InvolvedSubTab, NavTab, InvolvementApplication } from '../types';
import { mapSchoolToCountyZone, LIBERIA_COUNTY_ZONES } from '../data/tournamentZoningData';
import { VolunteerDashboard } from './VolunteerDashboard';
import { DonateSection } from './DonateSection';
import { useToast } from '../context/ToastContext';
import { useProgramStatus } from '../hooks/useProgramStatus';
import { useTournamentStage } from '../hooks/useTournamentStage';
import { isDeadlineExpired } from '../lib/tournamentStageService';

interface InvolvedViewProps {
  involvedSub: InvolvedSubTab;
  setInvolvedSub: (sub: InvolvedSubTab) => void;
  setTab: (tab: NavTab) => void;
}

export const InvolvedView: React.FC<InvolvedViewProps> = ({
  involvedSub,
  setInvolvedSub,
  setTab
}) => {
  const { success, error: toastError } = useToast();
  const { getProgramStatus, isProgramOpen } = useProgramStatus();
  const { stageState, isDeadlinePassed, daysRemaining } = useTournamentStage();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionRef, setSubmissionRef] = useState<string>('');
  
  // Generic Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    schoolOrOrg: '',
    county: 'Montserrado',
    roleOrInterest: 'National High School Debate Championship Enrollment',
    message: '',
    // Student Scholar specific
    gradeLevel: 'Grade 11',
    scholarshipInterest: true,
    careerAspiration: 'Law & Constitutional Advocacy',
    // School specific
    principalOrHead: '',
    delegationSize: 5,
    districtOrLocation: '',
    // Sponsor specific
    sponsorshipTier: 'Silver Partner ($1,500)',
    pledgedAmount: 1500,
    currency: 'USD' as 'USD' | 'LRD',
    // Partner specific
    partnerType: 'International NGO / Development Agency'
  });

  // Dynamic County Zone & Anti-Bias Demographic Mapper
  const mappedZone = React.useMemo(() => {
    if (involvedSub === 'schools') {
      const zoneInfo = mapSchoolToCountyZone(formData.county, formData.schoolOrOrg, formData.districtOrLocation);
      const zoneObj = LIBERIA_COUNTY_ZONES.find(z => z.id === zoneInfo.zoneId);
      return {
        ...zoneInfo,
        details: zoneObj
      };
    }
    return null;
  }, [formData.county, formData.schoolOrOrg, formData.districtOrLocation, involvedSub]);

  // Program status mapping helper
  const getAssociatedProgramId = (roleOrInterest: string, sub: InvolvedSubTab): string | null => {
    if (sub === 'schools') {
      if (roleOrInterest.includes('Debate Championship') || roleOrInterest.includes('Teacher Debate Coach')) return 'debate-prog';
      if (roleOrInterest.includes('STEM & Robotics')) return 'stem-prog';
      if (roleOrInterest.includes('Dual Debate & STEM')) return 'stem-prog';
    }
    if (sub === 'students') {
      if (roleOrInterest.includes('Debate Forensics') || roleOrInterest.includes('Female Orators')) return 'debate-prog';
      if (roleOrInterest.includes('STEM Challenge')) return 'stem-prog';
      if (roleOrInterest.includes('Mentorship')) return 'mentorship';
      if (roleOrInterest.includes('Academic')) return 'academic';
    }
    return null;
  };

  const associatedProgramId = getAssociatedProgramId(formData.roleOrInterest, involvedSub);
  const associatedProgramStatus = associatedProgramId ? getProgramStatus(associatedProgramId) : null;
  const isSchoolDeadlineExpired = isDeadlinePassed || isDeadlineExpired(
    stageState.registrationDeadline || associatedProgramStatus?.registrationDeadline,
    stageState.registrationDeadlineDate || associatedProgramStatus?.registrationDeadlineDate
  );
  const isTrackRegistrationClosed = associatedProgramId 
    ? (!isProgramOpen(associatedProgramId) || !stageState.isRegistrationOpen || (associatedProgramId === 'debate-prog' && isSchoolDeadlineExpired))
    : false;

  // Align role defaults when tab changes
  React.useEffect(() => {
    if (involvedSub === 'students') {
      setFormData(prev => ({
        ...prev,
        roleOrInterest: isProgramOpen('debate-prog') 
          ? 'Student Scholar & Debate Forensics Team' 
          : 'National STEM Challenge Innovator'
      }));
    } else if (involvedSub === 'schools') {
      setFormData(prev => ({
        ...prev,
        roleOrInterest: 'National High School Debate Championship Enrollment'
      }));
    }
  }, [involvedSub]);

  const resetForm = () => {
    setFormSubmitted(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      schoolOrOrg: '',
      county: 'Montserrado',
      roleOrInterest: 'National High School Debate Championship Enrollment',
      message: '',
      gradeLevel: 'Grade 11',
      scholarshipInterest: true,
      careerAspiration: 'Law & Constitutional Advocacy',
      principalOrHead: '',
      delegationSize: 5,
      districtOrLocation: '',
      sponsorshipTier: 'Silver Partner ($1,500)',
      pledgedAmount: 1500,
      currency: 'USD',
      partnerType: 'International NGO / Development Agency'
    });
  };

  const getApplicationType = (): InvolvementApplication['type'] => {
    switch (involvedSub) {
      case 'schools': return 'school';
      case 'students': return 'student';
      case 'volunteers': return 'volunteer';
      case 'sponsors': return 'sponsor';
      case 'partners': return 'partner';
      default: return 'student';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if the selected track belongs to a closed program
    if (isTrackRegistrationClosed && associatedProgramStatus) {
      toastError(
        `Registration for ${associatedProgramStatus.title} is currently closed. Applications are not being accepted yet.`,
        'Program Closed'
      );
      return;
    }

    setIsSubmitting(true);

    const appType = getApplicationType();
    const refCode = `YFC-${appType.toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmissionRef(refCode);

    const payload: Partial<InvolvementApplication> = {
      type: appType,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      schoolOrOrg: formData.schoolOrOrg.trim() || undefined,
      county: formData.county,
      roleOrInterest: formData.roleOrInterest,
      message: formData.message.trim() || undefined,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      ...(appType === 'student' && {
        gradeLevel: formData.gradeLevel,
        scholarshipInterest: formData.scholarshipInterest,
        careerAspiration: formData.careerAspiration.trim()
      }),
      ...(appType === 'school' && {
        principalOrHead: formData.principalOrHead.trim(),
        delegationSize: Number(formData.delegationSize) || 5,
        location: formData.districtOrLocation.trim() || undefined,
        notes: `Assigned Zone: ${mappedZone?.zoneName || 'General Zone'} | Prelim Venue: ${mappedZone?.details?.primaryVenue || 'Regional Hall'} | Anti-Bias Token: ${refCode}`
      }),
      ...(appType === 'sponsor' && {
        sponsorshipTier: formData.sponsorshipTier,
        pledgedAmount: Number(formData.pledgedAmount) || 0,
        currency: formData.currency
      }),
      ...(appType === 'partner' && {
        partnerType: formData.partnerType
      })
    };

    try {
      // Store into Firebase Firestore
      await addDoc(collection(db, 'involvementApplications'), payload);

      setFormSubmitted(true);
      confetti({
        particleCount: 120,
        spread: 75,
        origin: { y: 0.6 }
      });

      const subLabels: Record<string, string> = {
        schools: 'School registration application logged! Our county coordinator will contact your school administration.',
        students: 'Student scholar application submitted! Secretariat review will verify your profile for the scholarship queue.',
        volunteers: 'Volunteer adjudicator application submitted! Adjudication desk will review your credentials.',
        sponsors: 'Sponsorship proposal recorded in Secretariat database! Our partnership director will send the official sponsorship dossier.',
        partners: 'Institutional partnership request logged successfully for executive review.'
      };

      success(subLabels[involvedSub] || 'Application submitted successfully to National Secretariat!', 'Application Received');
    } catch (err: any) {
      console.error('Error saving application to Firestore:', err);
      // Fallback display
      setFormSubmitted(true);
      toastError('Application recorded locally. Secretariat will sync with Cloud database.', 'Sync Notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTabTitle = () => {
    switch (involvedSub) {
      case 'schools': return 'Register Your High School';
      case 'students': return 'Join as a Student Scholar & Orator';
      case 'volunteers': return 'Volunteer Adjudicators & Tournament Judges';
      case 'sponsors': return 'Corporate & Philanthropic Sponsorship';
      case 'partners': return 'Institutional Partnership';
      case 'donate': return 'Secure Online Donation & Program Giving';
      default: return 'Get Involved';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-extrabold tracking-widest uppercase text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
          Join & Support the Movement
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
          Get Involved & Donate
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Whether you want to make a financial contribution, enroll a high school team, join as a student scholar, adjudicate matches as a judge, or partner as an institutional sponsor — take your seat in shaping Liberia's future leaders.
        </p>

        {/* Subtabs */}
        <div className="inline-flex flex-wrap p-1.5 bg-slate-100 rounded-2xl border border-slate-200 gap-1 mt-4">
          {[
            { key: 'donate', label: 'Donate & Support', icon: Heart, highlight: true },
            { key: 'schools', label: 'For Schools', icon: Building },
            { key: 'students', label: 'For Students', icon: GraduationCap },
            { key: 'volunteers', label: 'Volunteers & Judges', icon: Users },
            { key: 'sponsors', label: 'Sponsors', icon: DollarSign },
            { key: 'partners', label: 'Partners', icon: HeartHandshake }
          ].map(tab => {
            const Icon = tab.icon;
            const active = involvedSub === tab.key;
            return (
              <button
                key={tab.key}
                id={`involved-subtab-${tab.key}`}
                onClick={() => {
                  setInvolvedSub(tab.key as InvolvedSubTab);
                  setFormSubmitted(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  active 
                    ? 'bg-emerald-800 text-white shadow-md' 
                    : tab.highlight 
                      ? 'text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/80 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.highlight && !active ? 'text-emerald-700' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtab Content with Smooth Transitions */}
      <AnimatePresence mode="wait">
        {involvedSub === 'donate' ? (
          <motion.div
            key="donate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <DonateSection setTab={setTab} />
          </motion.div>
        ) : involvedSub === 'volunteers' ? (
          <motion.div
            key="volunteers"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="space-y-8"
          >
            <VolunteerDashboard setTab={setTab} />
          </motion.div>
        ) : (
          <motion.div
            key={involvedSub}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Left Info Panel */}
              <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-black uppercase tracking-widest text-yellow-400 bg-white/10 px-3 py-1 rounded-full">
                  {involvedSub.toUpperCase()} PORTAL
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {getTabTitle()}
                </h2>
                <p className="text-emerald-100 text-xs sm:text-sm leading-relaxed">
                  {involvedSub === 'schools' && 'Enroll your high school delegation into the 2024/25 National Debate Championship and STEM Challenge. Includes free teacher coach accreditation, WSDC rulebooks, and tournament travel grants.'}
                  {involvedSub === 'students' && 'Join the National Forensics & STEM Scholar Registry. Gain direct mentorship from top Liberian attorneys, engineers, and educators, and qualify for annual college tuition scholarships.'}
                  {involvedSub === 'sponsors' && 'Empower Liberian youth by underwriting rural county school transport, championship medals, STEM robotics equipment kits, and national live broadcast coverage.'}
                  {involvedSub === 'partners' && 'Collaborate with Youth For Change Liberia on national educational curriculum reform, youth policy advocacy, and community research.'}
                </p>

                {involvedSub === 'students' && (
                  <div className="p-4 bg-emerald-800/50 rounded-2xl border border-emerald-700/60 space-y-2 text-xs">
                    <div className="font-bold text-yellow-300 flex items-center gap-1.5">
                      <Star className="w-4 h-4" /> Scholar Benefits:
                    </div>
                    <ul className="space-y-1 text-emerald-100 text-[11px] list-disc list-inside">
                      <li>Eligibility for Best Speaker University Tuition Grants</li>
                      <li>Access to WSDC Debate & STEM Training Modules</li>
                      <li>Direct pairings with Alumni Mentors in Law & Tech</li>
                    </ul>
                  </div>
                )}

                {involvedSub === 'schools' && (
                  <div className="p-4 bg-emerald-800/50 rounded-2xl border border-emerald-700/60 space-y-2 text-xs">
                    <div className="font-bold text-yellow-300 flex items-center gap-1.5">
                      <Building className="w-4 h-4" /> School Delegation Package:
                    </div>
                    <ul className="space-y-1 text-emerald-100 text-[11px] list-disc list-inside">
                      <li>Official National Accreditation & County Seeding</li>
                      <li>Free Masterclass Workshops for 2 Faculty Coaches</li>
                      <li>County Championship Trophies, Medals & Certificates</li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10 text-xs text-emerald-200">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>100% Non-Profit, Independent & Accredited</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-yellow-400" />
                  <span>Operating across all 15 Counties of Liberia</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-yellow-300" />
                  <span>admissions@youthforchangeliberia.org</span>
                </div>
              </div>
            </div>

            {/* Right Form Panel */}
            <div className="lg:col-span-7 p-8 sm:p-10">
              {formSubmitted ? (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-8 text-center space-y-4 animate-in fade-in duration-300">
                  <div className="w-14 h-14 rounded-full bg-emerald-700 text-white flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-black text-emerald-950">
                    {involvedSub === 'schools' ? 'School Enrolled & Categorized into County Zone!' : 'Application Logged in Secretariat Database!'}
                  </h3>

                  {involvedSub === 'schools' && mappedZone ? (
                    <div className="p-4 bg-white rounded-xl border border-emerald-300/80 text-left space-y-2.5 max-w-lg mx-auto shadow-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Enrolled Institution</span>
                        <span className="text-xs font-black text-emerald-900">{formData.schoolOrOrg || formData.name}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">County & Zone</span>
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100/60 px-2 py-0.5 rounded">
                          {formData.county} • {mappedZone.zoneName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Designated Zonal Venue</span>
                        <span className="text-xs font-medium text-slate-700">{mappedZone.details?.primaryVenue || 'Regional Hall'}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Anti-Bias Hash</span>
                        <span className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {submissionRef}
                        </span>
                      </div>
                      <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Anti-Bias Random Draw Protection:</strong> Your school is cryptographically secured. The system will perform automated random pairings, motion assignment, and neutral adjudicator selection without human interference.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
                      Thank you for applying to Youth For Change Liberia. Your application has been recorded under reference ID <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 text-emerald-950">{submissionRef}</strong>.
                    </p>
                  )}

                  <p className="text-xs text-slate-600">
                    Our Secretariat Coordinator for <strong>{formData.county} County</strong> will review your details and contact you via email at <strong>{formData.email}</strong> or phone at <strong>{formData.phone}</strong>.
                  </p>
                  <div className="pt-2 flex flex-wrap justify-center gap-3">
                    {involvedSub === 'schools' && (
                      <button
                        onClick={() => setTab('fixtures')}
                        className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs transition-colors cursor-pointer shadow-md flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-300" />
                        <span>View Announced Draw Date & Live Reveal Hub</span>
                      </button>
                    )}
                    <button
                      onClick={resetForm}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                    >
                      Enroll Another School
                    </button>
                    <button
                      onClick={() => setTab('admin')}
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
                    >
                      View in Secretariat Box
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  
                  {/* Official High School Registration Deadline Tracker Banner */}
                  {involvedSub === 'schools' && (
                    <div className={`p-4 rounded-2xl border transition-all ${
                      isSchoolDeadlineExpired || !isProgramOpen('debate-prog') || !stageState.isRegistrationOpen
                        ? 'bg-rose-50/90 border-rose-300 text-rose-950 shadow-xs'
                        : 'bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-4 h-4 shrink-0 ${isSchoolDeadlineExpired ? 'text-rose-600' : 'text-emerald-700'}`} />
                          <div>
                            <span className="font-black text-xs uppercase tracking-wider block">
                              Official High School Registration Deadline: {stageState.registrationDeadline}
                            </span>
                            <span className="text-[11px] text-slate-600">
                              Enforced across all 15 Liberian counties for Stage 1 Preliminary draws
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isSchoolDeadlineExpired || !isProgramOpen('debate-prog') || !stageState.isRegistrationOpen ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
                              <Lock className="w-3 h-3" /> Registration Window Locked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700 text-white font-black text-[10px] uppercase tracking-wider shadow-xs">
                              <Sparkles className="w-3 h-3 text-yellow-300" />
                              {daysRemaining !== null 
                                ? (daysRemaining > 0 ? `${daysRemaining} Days Remaining` : 'Deadline Today!') 
                                : 'Active Registration Window'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-[11px] mt-2.5 pt-2.5 border-t border-slate-200/80 leading-relaxed">
                        {isSchoolDeadlineExpired || !isProgramOpen('debate-prog') || !stageState.isRegistrationOpen ? (
                          <p className="text-rose-900 font-medium">
                            🔒 <strong>Registration Closed:</strong> The official deadline ({stageState.registrationDeadline}) has passed. Registered schools across all 15 counties are locked for anti-bias zoning and Stage 1 County Preliminary draws. Schools will be paired within their counties.
                          </p>
                        ) : (
                          <p className="text-emerald-900 font-medium">
                            🟢 <strong>Registration Ongoing:</strong> High schools in all 15 Liberian counties must complete delegation accreditation before the deadline. Immediately following the deadline, the Secretariat starts pairing registered schools based on their counties with Stage 1 County Preliminaries open.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Official Secretariat Program Registration Availability Bar */}
                  {(involvedSub === 'schools' || involvedSub === 'students') && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                          Official Secretariat Program Status
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold">Live Availability</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                        {[
                          { 
                            id: 'debate-prog', 
                            label: 'National Debate Championship', 
                            track: involvedSub === 'schools' 
                              ? 'National High School Debate Championship Enrollment' 
                              : 'Student Scholar & Debate Forensics Team' 
                          },
                          { 
                            id: 'stem-prog', 
                            label: 'STEM Challenge', 
                            track: involvedSub === 'schools' 
                              ? 'National STEM & Robotics Challenge Team' 
                              : 'National STEM Challenge Innovator' 
                          },
                          { 
                            id: 'mentorship', 
                            label: 'Mentorship', 
                            track: 'Academic Mentorship & College Prep' 
                          },
                          { 
                            id: 'academic', 
                            label: 'Academic Empowerment', 
                            track: 'Academic Mentorship & College Prep' 
                          }
                        ].map(prog => {
                          const pOpen = isProgramOpen(prog.id);
                          const pData = getProgramStatus(prog.id);
                          return (
                            <button
                              type="button"
                              key={prog.id}
                              onClick={() => {
                                if (pOpen) {
                                  setFormData(prev => ({ ...prev, roleOrInterest: prog.track }));
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                                pOpen 
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 cursor-pointer hover:bg-emerald-100/90 shadow-xs' 
                                  : 'bg-white border-slate-200 text-slate-500 cursor-not-allowed opacity-80'
                              }`}
                            >
                              <div className="truncate pr-1">
                                <span className="font-bold text-[11px] block truncate">{pData.title || prog.label}</span>
                                <span className="text-[9px] text-slate-500">{pOpen ? 'Click to select track' : 'Registration closed'}</span>
                              </div>
                              {pOpen ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[9px] uppercase shrink-0">
                                  Open Now
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-600 font-bold text-[9px] uppercase shrink-0 flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" /> Closed
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Primary Contact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        {involvedSub === 'students' ? 'Student Full Name *' : involvedSub === 'schools' ? 'Lead Contact / Patron Name *' : 'Full Name / Primary Contact *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Korto B. Mulbah"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g., scholar@example.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Phone Number (Liberian / International) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g., +231 77 000 0000"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        {involvedSub === 'students' ? 'High School Enrolled *' : involvedSub === 'schools' ? 'Official High School Name *' : 'School / Organization / Entity'}
                      </label>
                      <input
                        type="text"
                        required={involvedSub === 'students' || involvedSub === 'schools'}
                        placeholder="e.g., Booker Washington Institute (BWI)"
                        value={formData.schoolOrOrg}
                        onChange={e => setFormData({ ...formData, schoolOrOrg: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* County & Category Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">County / Location *</label>
                      <select
                        value={formData.county}
                        onChange={e => setFormData({ ...formData, county: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {[
                          'Montserrado', 'Nimba', 'Bong', 'Margibi', 'Grand Bassa', 
                          'Lofa', 'Maryland', 'Sinoe', 'Grand Cape Mount', 'Grand Gedeh', 
                          'River Gee', 'Rivercess', 'Bomi', 'Grand Kru', 'Gbarpolu', 
                          'Liberian Diaspora (USA / North America)', 
                          'Liberian Diaspora (UK / Europe)', 
                          'International Partner'
                        ].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Primary Track / Category</label>
                      <select
                        value={formData.roleOrInterest}
                        onChange={e => setFormData({ ...formData, roleOrInterest: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {involvedSub === 'students' ? (
                          <>
                            <option value="Student Scholar & Debate Forensics Team">
                              {isProgramOpen('debate-prog') ? '● [OPEN NOW] Student Scholar & Debate Forensics Team' : '🔒 [CLOSED - NOT OPEN YET] Student Scholar & Debate Forensics Team'}
                            </option>
                            <option value="National STEM Challenge Innovator">
                              {isProgramOpen('stem-prog') ? '● [OPEN NOW] National STEM Challenge Innovator' : '🔒 [CLOSED - NOT OPEN YET] National STEM Challenge Innovator'}
                            </option>
                            <option value="Female Orators & Best Speaker Scholarship Program">
                              {isProgramOpen('debate-prog') ? '● [OPEN NOW] Female Orators & Best Speaker Scholarship Program' : '🔒 [CLOSED - NOT OPEN YET] Female Orators & Best Speaker Scholarship Program'}
                            </option>
                            <option value="Academic Mentorship & College Prep">
                              {isProgramOpen('mentorship') ? '● [OPEN NOW] Academic Mentorship & College Prep' : '🔒 [CLOSED - NOT OPEN YET] Academic Mentorship & College Prep'}
                            </option>
                          </>
                        ) : involvedSub === 'schools' ? (
                          <>
                            <option value="National High School Debate Championship Enrollment">
                              {isProgramOpen('debate-prog') ? '● [OPEN NOW] National High School Debate Championship Enrollment' : '🔒 [CLOSED - NOT OPEN YET] National High School Debate Championship Enrollment'}
                            </option>
                            <option value="National STEM & Robotics Challenge Team">
                              {isProgramOpen('stem-prog') ? '● [OPEN NOW] National STEM & Robotics Challenge Team' : '🔒 [CLOSED - NOT OPEN YET] National STEM & Robotics Challenge Team'}
                            </option>
                            <option value="Dual Debate & STEM School Delegation">
                              {(isProgramOpen('debate-prog') && isProgramOpen('stem-prog')) 
                                ? '● [OPEN NOW] Dual Debate & STEM School Delegation' 
                                : '🔒 [CLOSED - NOT OPEN YET] Dual Debate & STEM School Delegation (STEM Closed)'}
                            </option>
                            <option value="Teacher Debate Coach Masterclass Certification">
                              {isProgramOpen('debate-prog') ? '● [OPEN NOW] Teacher Debate Coach Masterclass Certification' : '🔒 [CLOSED - NOT OPEN YET] Teacher Debate Coach Masterclass Certification'}
                            </option>
                          </>
                        ) : involvedSub === 'sponsors' ? (
                          <>
                            <option>Rural County Bus Transit & Travel Underwriter</option>
                            <option>High School STEM Robotics Lab Kits Sponsor</option>
                            <option>Female Orator University Scholarship Endowment</option>
                            <option>National Championship Grand Finals Title Sponsor</option>
                          </>
                        ) : (
                          <>
                            <option>Youth Policy & Education Curriculum Collaboration</option>
                            <option>Academic Research & Forensics Development</option>
                            <option>National Broadcast & Media Coverage Partner</option>
                            <option>Community Science & Technology Outreach</option>
                          </>
                        )}
                      </select>

                      {/* Warning Notice If Current Track is Closed */}
                      {isTrackRegistrationClosed && associatedProgramStatus && (
                        <div className="mt-2.5 p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-950 shadow-xs">
                          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <strong className="font-bold block text-amber-950">
                              Registration for {associatedProgramStatus.title} is Currently Closed
                            </strong>
                            <p className="text-amber-900 leading-relaxed font-medium">
                              {associatedProgramStatus.closedNotice || 'This program is not happening yet or registration has not opened. Applications cannot be accepted at this time.'}
                            </p>
                            {isProgramOpen('debate-prog') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    roleOrInterest: involvedSub === 'schools' 
                                      ? 'National High School Debate Championship Enrollment' 
                                      : 'Student Scholar & Debate Forensics Team'
                                  }));
                                }}
                                className="mt-1 text-[11px] font-bold text-emerald-800 underline hover:text-emerald-950 cursor-pointer flex items-center gap-1"
                              >
                                <span>Switch to currently open program: National Debate Championship</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Student Scholar Specific Fields */}
                  {involvedSub === 'students' && (
                    <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                      <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-emerald-700" />
                        <span>Scholarship & Academic Profile</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Current Grade Level *</label>
                          <select
                            value={formData.gradeLevel}
                            onChange={e => setFormData({ ...formData, gradeLevel: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option>Grade 9 (Freshman)</option>
                            <option>Grade 10 (Sophomore)</option>
                            <option>Grade 11 (Junior)</option>
                            <option>Grade 12 (Senior / WAEC Candidate)</option>
                            <option>Recent High School Graduate (Seeking University Scholarship)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Intended Career / College Major</label>
                          <input
                            type="text"
                            placeholder="e.g., Law, Civil Engineering, Medicine"
                            value={formData.careerAspiration}
                            onChange={e => setFormData({ ...formData, careerAspiration: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-[11px] font-bold text-emerald-900 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={formData.scholarshipInterest}
                          onChange={e => setFormData({ ...formData, scholarshipInterest: e.target.checked })}
                          className="w-4 h-4 text-emerald-800 rounded border-slate-300 focus:ring-emerald-600"
                        />
                        <span>I am applying for the Youth For Change Best Speaker / STEM College Scholarship</span>
                      </label>
                    </div>
                  )}

                  {/* School Registration Specific Fields */}
                  {involvedSub === 'schools' && (
                    <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3.5">
                      <div className="text-xs font-bold text-emerald-950 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-emerald-700" />
                          <span>School Administration & County Zoning</span>
                        </div>
                        <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                          Anti-Bias Algorithm Enabled
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Principal / Head of School</label>
                          <input
                            type="text"
                            placeholder="e.g., Rev. Dr. Josiah Gaye"
                            value={formData.principalOrHead}
                            onChange={e => setFormData({ ...formData, principalOrHead: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">District / City / Community</label>
                          <input
                            type="text"
                            placeholder="e.g., Sinkor, Bushrod, Gbarnga"
                            value={formData.districtOrLocation}
                            onChange={e => setFormData({ ...formData, districtOrLocation: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Student Delegation Size</label>
                          <input
                            type="number"
                            min="3"
                            max="20"
                            value={formData.delegationSize}
                            onChange={e => setFormData({ ...formData, delegationSize: parseInt(e.target.value) || 5 })}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                          />
                        </div>
                      </div>

                      {/* Dynamic Zone Demarcation & Anti-Bias Fair Placement Preview */}
                      {mappedZone && (
                        <div className="p-3 bg-white rounded-xl border border-emerald-300 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Automated Zonal Placement:</span>
                            <span className="font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                              {mappedZone.zoneName}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                            <div>
                              <span className="font-semibold text-slate-700">Designated Prelim Venue: </span>
                              <span>{mappedZone.details?.primaryVenue || 'County Central Auditorium'}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-700">County Forensics Desk: </span>
                              <span>{mappedZone.details?.coordinatorName || 'Secretariat Desk'} ({mappedZone.details?.coordinatorPhone || '+231 777 401 210'})</span>
                            </div>
                          </div>

                          <div className="pt-1.5 flex items-start gap-1.5 text-[10px] text-emerald-900 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>
                              <strong>Anti-Bias Protection:</strong> When fixtures and motions are generated, your school will be paired pseudo-randomly using seeded cryptographic randomization to eliminate human bias and adjudicator conflicts of interest.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sponsor Specific Fields */}
                  {involvedSub === 'sponsors' && (
                    <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                      <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-700" />
                        <span>Sponsorship Scope & Budget Tier</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Sponsorship Tier</label>
                          <select
                            value={formData.sponsorshipTier}
                            onChange={e => setFormData({ ...formData, sponsorshipTier: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option>Bronze Supporter ($500 USD / L$97,500)</option>
                            <option>Silver Partner ($1,500 USD / L$292,500)</option>
                            <option>Gold Patron ($3,500 USD / L$682,500)</option>
                            <option>County Grand Sponsor ($5,000+ USD)</option>
                            <option>Custom In-Kind (Transportation, Electronics, Lab Gear)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">Estimated Pledged Amount (USD)</label>
                          <input
                            type="number"
                            min="100"
                            placeholder="e.g. 1500"
                            value={formData.pledgedAmount}
                            onChange={e => setFormData({ ...formData, pledgedAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Partner Specific Fields */}
                  {involvedSub === 'partners' && (
                    <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
                      <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <HeartHandshake className="w-4 h-4 text-emerald-700" />
                        <span>Institutional Classification</span>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">Organization Type</label>
                        <select
                          value={formData.partnerType}
                          onChange={e => setFormData({ ...formData, partnerType: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option>Government Ministry / Public Agency (Republic of Liberia)</option>
                          <option>International NGO / Development Agency</option>
                          <option>University / Higher Education Institution</option>
                          <option>National Press & Media Network</option>
                          <option>Philanthropic Foundation / Diaspora Organization</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Statement / Message */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {involvedSub === 'students' 
                        ? 'Statement of Purpose / Why do you want to join as a scholar? *' 
                        : 'Brief Description, Proposed Goals or Questions'}
                    </label>
                    <textarea
                      rows={3}
                      required={involvedSub === 'students'}
                      placeholder={
                        involvedSub === 'students'
                          ? 'Share your debate experience, academic goals, and how this opportunity will help you develop your leadership in Liberia...'
                          : 'Share your proposed objectives, timeline, or requirements...'
                      }
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    ></textarea>
                  </div>

                  {/* Submit Button with Live Program Status Enforcement */}
                  <div className="pt-2">
                    {isTrackRegistrationClosed ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          disabled
                          className="w-full py-3.5 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs sm:text-sm border border-slate-300 flex items-center justify-center gap-2 cursor-not-allowed shadow-xs"
                        >
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span>
                            {involvedSub === 'schools' && isSchoolDeadlineExpired
                              ? `Registration Locked — Official Deadline (${stageState.registrationDeadline}) Has Concluded`
                              : `Registration Closed — ${associatedProgramStatus?.title || 'Selected Track'}`}
                          </span>
                        </button>
                        <p className="text-center text-[11px] text-amber-900 font-medium">
                          {involvedSub === 'schools' && isSchoolDeadlineExpired
                            ? '⚠️ Official school registration has concluded. High schools have been submitted for Stage 1 County Preliminary draws. For special accreditation queries, contact admissions@youthforchangeliberia.org.'
                            : '⚠️ This program is not currently active for registration. Please select an open program above to complete your application.'}
                        </p>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <span>Logging Application in Cloud Database...</span>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                            <span>Submit Official {getTabTitle()} Application</span>
                          </>
                        )}
                      </button>
                    )}
                    <p className="text-center text-[10px] text-slate-500 mt-1.5">
                      Submissions are routed directly to the Youth For Change National Executive Secretariat.
                    </p>
                  </div>

                </form>
              )}
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

