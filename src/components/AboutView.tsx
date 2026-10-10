import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { 
  BookOpen, Target, Users, HeartHandshake, ShieldCheck, 
  Sparkles, Award, Globe, MapPin, CheckCircle2, Star, ArrowRight,
  ExternalLink, Building2, Mail, Phone, X, Info, BarChart3
} from 'lucide-react';
import { AboutSubTab, NavTab, InvolvedSubTab, PartnerOrg } from '../types';
import { ABOUT_STORY, MISSION_VISION, LEADERSHIP_TEAM, LEADERSHIP_ROLES } from '../data/contentData';
import { usePartners } from '../hooks/usePartners';
import { useLeadership } from '../hooks/useLeadership';
import { SafeImage } from './SafeImage';
import { YocLogo } from './YocLogo';
import { YOC_COVER_SRC } from '../data/assets';
import { YearlyReportModal } from './YearlyReportModal';
import { PageHeroBanner } from './PageHeroBanner';

interface AboutViewProps {
  aboutSub: AboutSubTab;
  setAboutSub: (sub: AboutSubTab) => void;
  setTab: (tab: NavTab) => void;
  setInvolvedSub: (sub: InvolvedSubTab) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({
  aboutSub,
  setAboutSub,
  setTab,
  setInvolvedSub
}) => {
  const { partners: livePartners, loading: loadingPartners } = usePartners();
  const { activeLeaders, loading: loadingLeaders } = useLeadership();
  const [selectedPartner, setSelectedPartner] = useState<PartnerOrg | null>(null);
  const [leaderSearch, setLeaderSearch] = useState('');
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>('All');
  const [showYearlyReportModal, setShowYearlyReportModal] = useState<boolean>(false);
  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 space-y-10">
      {/* 1. Sleek Forest Green Hero Banner matching screenshot branding */}
      <PageHeroBanner
        category="YOUTH FOR CHANGE .INC • REPUBLIC OF LIBERIA"
        badge="FOUNDED 2015 • ALL 15 COUNTIES"
        title="ABOUT US: MISSION, VISION & LEADERSHIP"
        subtitle="Pioneering national academic forensics, hands-on STEM innovation, and ethical youth leadership across Liberia's 15 counties for over a decade."
        bgImage="/MISSION.jpeg"
        stats={[
          { label: 'COUNTIES SERVED', value: '15' },
          { label: 'YOUTH EMPOWERED', value: '12,500+' },
          { label: 'ACCREDITED SCHOOLS', value: '280+' },
          { label: 'LEADERSHIP DIRECTORS', value: '18+' }
        ]}
      >
        <button
          type="button"
          onClick={() => setAboutSub('story')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            aboutSub === 'story'
              ? 'bg-[#00a859] text-white shadow-md'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
          }`}
        >
          Our Story
        </button>
        <button
          type="button"
          onClick={() => setAboutSub('mission')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            aboutSub === 'mission'
              ? 'bg-[#00a859] text-white shadow-md'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
          }`}
        >
          Mission & Vision
        </button>
        <button
          type="button"
          onClick={() => setAboutSub('leadership')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            aboutSub === 'leadership'
              ? 'bg-[#00a859] text-white shadow-md'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
          }`}
        >
          Leadership Team
        </button>
        <button
          type="button"
          onClick={() => setAboutSub('partners')}
          className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            aboutSub === 'partners'
              ? 'bg-[#00a859] text-white shadow-md'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
          }`}
        >
          Strategic Partners
        </button>
      </PageHeroBanner>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Sleek Sub-tabs Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'story', label: 'Our Story & History', icon: BookOpen },
              { key: 'mission', label: 'Mission, Vision & Values', icon: Target },
              { key: 'leadership', label: 'Executive Leadership', icon: Users },
              { key: 'partners', label: 'Strategic Partners', icon: HeartHandshake }
            ].map(tab => {
              const Icon = tab.icon;
              const active = aboutSub === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`about-subtab-${tab.key}`}
                  onClick={() => setAboutSub(tab.key as AboutSubTab)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    active 
                      ? 'bg-[#063d2e] text-white shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 pr-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Non-Profit Registered in Liberia</span>
          </div>
        </div>

      {/* Sub-tabs Rendering with Smooth Transitions */}
      <AnimatePresence mode="wait">
        {aboutSub === 'story' && (
          <motion.div 
            key="story"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="space-y-12"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white p-1 shadow-md border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                    <YocLogo size="lg" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-200">
                      <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" /> Youth Empowerment & Leadership in Liberia
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                      {ABOUT_STORY.title}
                    </h2>
                  </div>
                </div>
                <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
                  {ABOUT_STORY.narrative.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-950">
                  <SafeImage
                    src="/group1.jpg"
                    alt="Youth For Change National Programs & Leadership"
                    fallbackCategory="about"
                    fallbackTitle="Youth For Change Liberia National Championship"
                    priority
                    className="w-full h-80 object-cover object-center"
                  />
                </div>
                <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white p-6 rounded-2xl shadow-md space-y-2 border border-emerald-800">
                  <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs uppercase tracking-wider">
                    <Globe className="w-4 h-4" /> Pan-Liberian Inclusivity Mandate
                  </div>
                  <p className="text-xs text-emerald-100">
                    Every high school across Liberia's 15 counties—regardless of private or public designation—has the right to participate in the National Championship with subsidized transport and lodging.
                  </p>
                </div>
              </div>
            </div>

            {/* Historical Milestones Timeline */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 space-y-6">
              <h3 className="text-xl font-bold text-slate-900 text-center">
                Key Historical Milestones
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { year: '2015', title: 'Inaugural Launch', desc: 'First 16 Montserrado high schools compete at Monrovia City Hall; St. Patrick’s lifts the first trophy.' },
                  { year: '2018', title: 'National Broadcasts', desc: 'Tournament aired live over ELBC Radio; Carroll High of Nimba makes the rural breakout final.' },
                  { year: '2021', title: 'STEM Challenge Founded', desc: 'Expanded into physical engineering and clean-tech; Gboveh High of Bong wins debate.' },
                  { year: '2025', title: '10th Jubilee & Mano River', desc: '15 counties fully integrated with 80 schools; expansion initiated to Sierra Leone and Guinea.' }
                ].map((m, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 relative shadow-xs">
                    <div className="text-xl font-black text-emerald-800">{m.year}</div>
                    <h4 className="font-bold text-slate-900 text-sm">{m.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{m.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Sub-tab 2: Mission & Vision */}
        {aboutSub === 'mission' && (
          <motion.div 
            key="mission"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="space-y-10"
          >
            {/* Mission & Vision Featured Visual Showcase */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-950">
              <div className="relative h-72 sm:h-96 md:h-[440px] w-full overflow-hidden">
                <SafeImage
                  src="/MISSION.jpeg"
                  alt="Youth For Change Liberia - Our Mission & Vision in Action"
                  fallbackCategory="about"
                  fallbackTitle="Youth For Change Liberia Mission and Vision"
                  priority
                  className="w-full h-full object-cover object-top hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/35 to-transparent flex flex-col justify-end p-6 sm:p-8 text-white">
                  <div className="inline-flex items-center gap-2 text-yellow-300 font-extrabold text-xs uppercase tracking-widest bg-slate-950/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-yellow-400/30 w-fit mb-2.5 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Our Mission & Vision in Action</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                    Nurturing Tomorrow's Forensics & STEM Leaders
                  </h3>
                  <p className="text-slate-200 text-xs sm:text-sm max-w-3xl mt-1.5 leading-relaxed">
                    Uniting youth scholars, debate finalists, and innovators from all 15 Liberian counties under a shared national vision of academic excellence and integrity.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Mission Card */}
              <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-4 border border-emerald-800">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-yellow-300 border border-white/20">
                  <Target className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-yellow-300">Our Strategic Purpose</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Our Mission</h2>
                <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
                  {MISSION_VISION.mission}
                </p>
              </div>

              {/* Vision Card */}
              <div className="bg-gradient-to-br from-emerald-800 to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-4 border border-emerald-700">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-yellow-300 border border-white/20">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-yellow-300">Our Long-Term Horizon</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Our Vision</h2>
                <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
                  {MISSION_VISION.vision}
                </p>
              </div>
            </div>

            {/* Core Values Grid */}
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">Ethical Principles</span>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900">Our 5 Core Values</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {MISSION_VISION.coreValues.map((v, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-colors space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      0{i + 1}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{v.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{v.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Sub-tab 3: Leadership */}
        {aboutSub === 'leadership' && (() => {
          const displayLeaders = activeLeaders.length > 0 ? activeLeaders : LEADERSHIP_TEAM;
          const searchLower = leaderSearch.toLowerCase().trim();
          const filteredLeaders = displayLeaders.filter(leader => {
            const matchesSearch = !searchLower ||
              (leader.name || '').toLowerCase().includes(searchLower) ||
              (leader.role || '').toLowerCase().includes(searchLower) ||
              (leader.department || '').toLowerCase().includes(searchLower) ||
              (leader.county || '').toLowerCase().includes(searchLower) ||
              (leader.bio || '').toLowerCase().includes(searchLower);

            const matchesCategory = selectedRoleCategory === 'All' ||
              (selectedRoleCategory === 'Executive' && leader.role.toLowerCase().includes('director')) ||
              (selectedRoleCategory === 'Programs' && leader.role.toLowerCase().includes('program')) ||
              (selectedRoleCategory === 'Finance' && (leader.role.toLowerCase().includes('finance') || leader.role.toLowerCase().includes('accountant'))) ||
              (selectedRoleCategory === 'Media' && (leader.role.toLowerCase().includes('communication') || leader.role.toLowerCase().includes('media'))) ||
              (selectedRoleCategory === 'Operations' && (leader.role.toLowerCase().includes('hr') || leader.role.toLowerCase().includes('procurement') || leader.role.toLowerCase().includes('training')));

            return matchesSearch && matchesCategory;
          });

          return (
            <motion.div 
              key="leadership"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="space-y-10"
            >
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">Executive Board & Directorate</span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Meet the Leadership Team</h2>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Passionate educators, legal attorneys, program directors, finance leads, and organizers steering Youth For Change Liberia across all 15 counties.
                </p>
              </div>

              {/* Roles & Search Filter Bar */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'All', label: `All Roles (${displayLeaders.length})` },
                    { id: 'Executive', label: 'Executive' },
                    { id: 'Programs', label: 'Programs' },
                    { id: 'Finance', label: 'Finance' },
                    { id: 'Media', label: 'Media & Comm' },
                    { id: 'Operations', label: 'HR & Ops' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedRoleCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedRoleCategory === cat.id
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[220px]">
                  <input
                    type="text"
                    placeholder="Search by role, name, or county..."
                    value={leaderSearch}
                    onChange={(e) => setLeaderSearch(e.target.value)}
                    className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                  {leaderSearch && (
                    <button
                      onClick={() => setLeaderSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {loadingLeaders && displayLeaders.length === 0 ? (
                <div className="p-16 text-center text-slate-400 space-y-3">
                  <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-600">Loading leadership directory...</p>
                </div>
              ) : filteredLeaders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
                  <p className="text-slate-600 text-sm font-semibold">No leadership roles match your current search.</p>
                  <button
                    onClick={() => { setLeaderSearch(''); setSelectedRoleCategory('All'); }}
                    className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredLeaders.map((leader, idx) => (
                    <div key={leader.id || idx} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-emerald-600 transition-all duration-300 flex flex-col justify-between group">
                      <div>
                        <div className="h-64 sm:h-72 overflow-hidden relative bg-slate-900">
                          <SafeImage
                            src={leader.image}
                            alt={leader.name}
                            fallbackCategory="leadership"
                            fallbackTitle={leader.name}
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          />
                          {leader.department && (
                            <div className="absolute top-3 left-3 bg-slate-950/85 text-emerald-200 text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs border border-white/10">
                              {leader.department}
                            </div>
                          )}
                          <div className="absolute bottom-3 left-3 bg-slate-900/90 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-1 border border-white/10">
                            <MapPin className="w-3 h-3 text-red-400" /> {leader.county}
                          </div>
                        </div>
                        <div className="p-6 space-y-2.5">
                          <div>
                            <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                              {leader.name}
                            </h3>
                            <div className="text-xs font-black text-emerald-800 uppercase tracking-wider pt-0.5">
                              {leader.role}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed pt-1 line-clamp-4">
                            {leader.bio}
                          </p>
                        </div>
                      </div>

                      <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          {leader.social && (
                            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                              {leader.social}
                            </span>
                          )}
                          {leader.email && !leader.social && (
                            <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                              {leader.email}
                            </span>
                          )}
                        </div>
                        <span className="font-bold text-[11px] text-emerald-800">Executive Directorate</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* Sub-tab 4: Partners */}
        {aboutSub === 'partners' && (
          <motion.div 
            key="partners"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="space-y-10"
          >
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">Collaborative Coalition</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Our Strategic Partners & Sponsors</h2>
              <p className="text-slate-600 text-xs sm:text-sm">
                We collaborate with government ministries, international development agencies, academic institutions, and corporate partners to sustain free participation for all high schools across Liberia.
              </p>
            </div>

            {/* Annual Partner Accountability Report Callout Banner */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl border border-emerald-500/30">
              <div className="space-y-1.5 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-black uppercase tracking-wider border border-yellow-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>Partner Accountability &amp; Governance</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Official Youth For Change Yearly Report
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Generate our comprehensive annual report: verified key achievements, news releases, fixtures, 15-county school participation, and complete itemized money spending statements presented to partners.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowYearlyReportModal(true)}
                className="px-6 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 cursor-pointer shrink-0 transition-transform transform hover:scale-102 border border-yellow-500/50"
              >
                <BarChart3 className="w-4 h-4 text-emerald-950" />
                <span>Generate Yearly Report</span>
              </button>
            </div>

            {loadingPartners ? (
              <div className="p-12 text-center text-slate-400">
                <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs font-bold">Loading accredited partner registry...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {livePartners.map((partner, idx) => (
                  <div 
                    key={partner.id || idx} 
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-emerald-600 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Cover Image / Banner */}
                      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-slate-900">
                        {partner.coverImage ? (
                          <SafeImage
                            src={partner.coverImage}
                            alt={partner.name}
                            fallbackCategory="leadership"
                            fallbackTitle={partner.name}
                            priority
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-emerald-900 via-emerald-950 to-slate-900 flex items-center justify-center p-6 text-center">
                            <Building2 className="w-12 h-12 text-emerald-400/40" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                        {/* Badges on Cover Banner */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white border border-white/20 uppercase tracking-wider shadow-sm">
                            {partner.category}
                          </span>
                          {partner.county && (
                            <span className="text-[10px] bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-400/30 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 shadow-sm">
                              <MapPin className="w-3 h-3 text-emerald-400" /> {partner.county}
                            </span>
                          )}
                        </div>

                        {/* Logo overlay badge on bottom left of cover */}
                        <div className="absolute bottom-3 left-4">
                          {partner.logoUrl ? (
                            <div className="h-11 w-auto max-w-[140px] px-3 py-1 rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md flex items-center justify-center">
                              <img
                                src={partner.logoUrl}
                                alt={partner.name}
                                className="max-h-full max-w-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className={`px-3 py-1 rounded-xl bg-white text-[11px] font-black tracking-wider border shadow-md ${partner.accentColor}`}>
                              {partner.logoText}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Partner Details */}
                      <div className="p-5 sm:p-6 space-y-3">
                        <h3 className="font-black text-slate-900 text-lg leading-snug group-hover:text-emerald-900 transition-colors">
                          {partner.name}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {partner.description}
                        </p>
                      </div>
                    </div>

                    {/* Footer Actions & Direct Website Link */}
                    <div className="p-5 sm:p-6 pt-0 space-y-3">
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Accredited Partner
                        </span>
                        {partner.contactPerson && (
                          <span className="text-slate-500 truncate max-w-[130px] font-medium" title={partner.contactPerson}>
                            {partner.contactPerson}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        {partner.websiteUrl ? (
                          <a
                            href={partner.websiteUrl.startsWith('http') ? partner.websiteUrl : `https://${partner.websiteUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
                          >
                            <span>Visit Official Website</span>
                            <ExternalLink className="w-3.5 h-3.5 text-yellow-400" />
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => setSelectedPartner(partner)}
                          className={`font-bold text-xs py-2.5 px-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                            partner.websiteUrl 
                              ? 'border-slate-300 hover:border-emerald-600 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900' 
                              : 'flex-1 bg-emerald-800 hover:bg-emerald-700 text-white shadow-xs'
                          }`}
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>{partner.websiteUrl ? 'Details' : 'View Partner Info'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Become a Partner Callout */}
            <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row justify-between items-center gap-6 shadow-xl border border-emerald-800">
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white">Partner with Youth For Change Liberia</h3>
                <p className="text-emerald-100 text-xs sm:text-sm max-w-xl">
                  Support high school STEM laboratories, fund student debate scholarships, or sponsor county preliminary rounds for the upcoming 2025/2026 season.
                </p>
              </div>
              <button
                onClick={() => {
                  setTab('involved');
                  setInvolvedSub('partners');
                }}
                className="px-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold text-sm shrink-0 transition-colors shadow-md cursor-pointer"
              >
                Partner With Us
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Partner Detailed Profile Lightbox Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 overflow-hidden relative">
            {/* Modal Cover Header */}
            <div className="relative h-48 sm:h-56 w-full bg-slate-950">
              {selectedPartner.coverImage ? (
                <SafeImage
                  src={selectedPartner.coverImage}
                  alt={selectedPartner.name}
                  fallbackCategory="leadership"
                  fallbackTitle={selectedPartner.name}
                  priority
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-emerald-950 to-slate-900 flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-emerald-500/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

              <button
                onClick={() => setSelectedPartner(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors cursor-pointer border border-white/20 shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
                <div className="space-y-1 text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 uppercase tracking-wider">
                      {selectedPartner.category}
                    </span>
                    {selectedPartner.county && (
                      <span className="text-xs text-emerald-200 flex items-center gap-1 font-semibold">
                        <MapPin className="w-3.5 h-3.5 text-yellow-400" /> {selectedPartner.county} County
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {selectedPartner.name}
                  </h2>
                </div>

                {selectedPartner.logoUrl ? (
                  <div className="h-12 w-auto max-w-[140px] px-3 py-1 rounded-xl bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md flex items-center justify-center shrink-0">
                    <img
                      src={selectedPartner.logoUrl}
                      alt={selectedPartner.name}
                      className="max-h-full max-w-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : (
                  <div className={`px-3 py-1 rounded-xl bg-white text-xs font-black tracking-wider border shrink-0 ${selectedPartner.accentColor}`}>
                    {selectedPartner.logoText}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                  About the Partnership & Mission
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {selectedPartner.description}
                </p>
              </div>

              {/* Contact and Accreditation Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {selectedPartner.contactPerson && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Liaison Contact</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedPartner.contactPerson}</p>
                  </div>
                )}
                {selectedPartner.contactEmail && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Official Email</span>
                    <a href={`mailto:${selectedPartner.contactEmail}`} className="font-bold text-emerald-800 hover:underline mt-0.5 block truncate">
                      {selectedPartner.contactEmail}
                    </a>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Accredited Strategic Partner of Youth For Change Liberia</span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedPartner(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>

                  {selectedPartner.websiteUrl && (
                    <a
                      href={selectedPartner.websiteUrl.startsWith('http') ? selectedPartner.websiteUrl : `https://${selectedPartner.websiteUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Visit Partner Website</span>
                      <ExternalLink className="w-3.5 h-3.5 text-yellow-400" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Official Youth For Change Yearly Partner Report Modal */}
      <YearlyReportModal
        isOpen={showYearlyReportModal}
        onClose={() => setShowYearlyReportModal(false)}
      />
      </div>
    </div>
  );
};
