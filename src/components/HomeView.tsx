import React, { useState, useEffect } from 'react';
import { 
  Trophy, Cpu, Users, Award, Star, ArrowRight, Play, 
  MapPin, CheckCircle2, Sparkles, ChevronRight, BookOpen, 
  Calendar, Flame, Globe, ExternalLink, ShieldCheck, HeartHandshake,
  Newspaper, Lock, MessageSquareQuote, Quote
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  NavTab, AboutSubTab, ProgramsSubTab, DebateSubTab, 
  StemSubTab, ResultsSubTab, GallerySubTab, InvolvedSubTab,
  AlumniSubTab, NewsArticle
} from '../types';
import { DEBATE_EDITIONS } from '../data/debateData';
import { CURRENT_STEM_CHALLENGE, STEM_PROJECTS } from '../data/stemData';
import { LIBERIA_COUNTIES, SCHOOL_LEADERBOARD, HALL_OF_FAME_WINNERS } from '../data/schoolData';
import { NEWS_ARTICLES } from '../data/contentData';
import { ALUMNI_TESTIMONIALS } from '../data/alumniData';
import { usePartners } from '../hooks/usePartners';
import { useDebateEditions } from '../hooks/useDebateEditions';
import { YocHeroCover } from './YocHeroCover';
import { SafeImage } from './SafeImage';
import { CountyImpactVisualizer } from './CountyImpactVisualizer';

interface HomeViewProps {
  setTab: (tab: NavTab) => void;
  setAboutSub: (sub: AboutSubTab) => void;
  setProgramsSub: (sub: ProgramsSubTab) => void;
  setDebateSub: (sub: DebateSubTab) => void;
  setStemSub: (sub: StemSubTab) => void;
  setResultsSub: (sub: ResultsSubTab) => void;
  setGallerySub: (sub: GallerySubTab) => void;
  setInvolvedSub: (sub: InvolvedSubTab) => void;
  setAlumniSub?: (sub: AlumniSubTab) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  setTab,
  setAboutSub,
  setProgramsSub,
  setDebateSub,
  setStemSub,
  setResultsSub,
  setGallerySub,
  setInvolvedSub,
  setAlumniSub
}) => {
  const [selectedCounty, setSelectedCounty] = useState<string>('Montserrado');
  const currentCountyData = LIBERIA_COUNTIES.find(c => c.county === selectedCounty) || LIBERIA_COUNTIES[0];

  const { editionsList } = useDebateEditions();
  const latestDebate = editionsList.find(ed => ed.year !== 'Future') || DEBATE_EDITIONS['2024-25'];
  const featuredStem = STEM_PROJECTS[0];
  const { partners: livePartners } = usePartners();

  // Dynamic Typewriter Effect with radiant green
  const TYPEWRITER_PHRASES = [
    "DETERMINES OUR FUTURE.",
    "EMPOWERS 15 COUNTIES.",
    "SHAPES TOMORROW'S LEADERS.",
    "IGNITES STEM INNOVATION.",
    "CHAMPIONS ACADEMIC EXCELLENCE."
  ];

  const [phraseIndex, setPhraseIndex] = useState<number>(0);
  const [typewriterText, setTypewriterText] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [liveStories, setLiveStories] = useState<NewsArticle[]>([]);

  // Typewriter ticker effect
  useEffect(() => {
    const currentPhrase = TYPEWRITER_PHRASES[phraseIndex];
    const speed = isDeleting ? 28 : 60;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (typewriterText.length < currentPhrase.length) {
          setTypewriterText(currentPhrase.slice(0, typewriterText.length + 1));
        } else {
          // Pause at completed word
          setTimeout(() => setIsDeleting(true), 2100);
        }
      } else {
        if (typewriterText.length > 0) {
          setTypewriterText(currentPhrase.slice(0, typewriterText.length - 1));
        } else {
          setIsDeleting(false);
          setPhraseIndex((prev) => (prev + 1) % TYPEWRITER_PHRASES.length);
        }
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [typewriterText, isDeleting, phraseIndex]);

  // Subscribe to live stories from Firestore
  useEffect(() => {
    try {
      if (!db) return;
      const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const stories: NewsArticle[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          stories.push({
            id: docSnap.id,
            title: data.title,
            date: data.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            readTime: data.readTime || '3 min read',
            category: data.category || 'Tournament News',
            source: data.source || 'Youth For Change Media',
            author: data.author || 'Editorial Team',
            image: data.image || '',
            summary: data.summary || '',
            fullContent: data.fullContent || [],
            authorUid: data.authorUid,
            createdAt: data.createdAt
          });
        });
        setLiveStories(stories);
      }, (err) => {
        console.warn('HomeView firestore news listener error:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not establish firestore listener in HomeView', e);
    }
  }, []);

  const allNewsStories = [
    ...liveStories,
    ...NEWS_ARTICLES.filter(n => !liveStories.some(ls => ls.id === n.id))
  ];

  return (
    <div className="w-full space-y-10 pb-16">
      {/* 1. Sleek Hero Banner with Mission Cover Photo */}
      <section className="relative bg-[#04261c] text-white overflow-hidden border-b border-emerald-950/70">
        {/* Real photo overlay in balanced opacity so the new background cover shows through clearly */}
        <div 
          className="absolute inset-0 bg-cover bg-[center_30%] opacity-65 scale-100 pointer-events-none transition-all duration-700"
          style={{ backgroundImage: `url('/mission.jpeg')` }}
        />
        {/* Soft translucent green gradient wash allowing background cover to show */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#063d2e]/80 via-[#063d2e]/55 to-[#063d2e]/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04261c] via-transparent to-black/25 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-14 sm:py-20 lg:py-24 relative z-10 space-y-6">
          {/* Seasonal Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/80 border border-emerald-600/40 text-emerald-200 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse"></span>
            <span>2026 SEASON — ZONAL ROUNDS OPEN 17 OCT</span>
          </div>

          {/* Punchy Condensed Heading with Radiant Green Typewriter Effect */}
          <h1 className="font-condensed font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl uppercase tracking-tight text-white leading-[0.92] max-w-4xl">
            OUR PRESENT <br />
            <span className="text-[#00e676] drop-shadow-[0_0_16px_rgba(0,230,118,0.45)]">
              {typewriterText || 'DETERMINES OUR FUTURE.'}
            </span>
            <span className="inline-block w-1 sm:w-1.5 h-8 sm:h-12 md:h-16 bg-[#00e676] ml-1.5 animate-pulse align-middle shadow-[0_0_10px_#00e676]" />
          </h1>

          {/* Subtitle */}
          <p className="text-emerald-100/90 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed font-normal">
            YOUTH for Change .INC runs Liberia's National Debate Championship and National STEM Challenge — giving students in all 15 counties a stage to think, build and lead.
          </p>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3.5">
            <button
              onClick={() => {
                setTab('debate');
                setDebateSub('2024-25');
              }}
              className="bg-[#00a859] hover:bg-[#00924c] text-white font-bold px-7 py-3 rounded-full text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              National Debate
            </button>

            <button
              onClick={() => {
                setTab('stem');
                setStemSub('current');
              }}
              className="bg-white hover:bg-slate-100 text-[#063d2e] font-bold px-7 py-3 rounded-full text-sm shadow-md transition-all active:scale-95 cursor-pointer"
            >
              STEM Challenge
            </button>

            <button
              onClick={() => setTab('fixtures')}
              className="bg-transparent hover:bg-white/10 text-white border border-white/40 font-semibold px-6 py-3 rounded-full text-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>View fixtures</span>
              <span className="text-base">&rarr;</span>
            </button>
          </div>

          {/* Bottom Stats Strip in Hero matching Screenshot 8 */}
          <div className="pt-10 mt-6 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                COUNTIES REACHED
              </div>
              <div className="font-condensed font-black text-4xl sm:text-5xl text-white">
                15
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                SCHOOLS COMPETING
              </div>
              <div className="font-condensed font-black text-4xl sm:text-5xl text-white">
                120+
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                STUDENTS ENGAGED
              </div>
              <div className="font-condensed font-black text-4xl sm:text-5xl text-white">
                8,000+
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                YEARS OF CHAMPIONSHIPS
              </div>
              <div className="font-condensed font-black text-4xl sm:text-5xl text-white">
                11
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container for Remaining Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

      {/* Three Core Feature Program Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Debate */}
        <div 
          onClick={() => {
            setTab('programs');
            setProgramsSub('debate-prog');
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Trophy className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1 group-hover:text-emerald-800 transition-colors">
            National Debate Championship
          </h3>
          <p className="text-slate-500 text-xs leading-relaxed flex-1">
            World Schools Debate Championship (WSDC) and Parliamentary forensic debates testing policy research, critical reasoning, Points of Information (POI), and national advocacy across 80+ accredited high schools.
          </p>
          <div className="mt-4 flex items-center text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
            <span>Explore 10-Year Archive</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* STEM */}
        <div 
          onClick={() => {
            setTab('programs');
            setProgramsSub('stem-prog');
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1 group-hover:text-emerald-800 transition-colors">
            National STEM Challenge
          </h3>
          <p className="text-slate-500 text-xs leading-relaxed flex-1">
            Hands-on clean energy, agro-processing, and water purification engineering competitions for high school innovators across Liberia.
          </p>
          <div className="mt-4 flex items-center text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
            <span>View Working Prototypes</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>

        {/* Mentorship & Leadership */}
        <div 
          onClick={() => {
            setTab('programs');
            setProgramsSub('mentorship');
          }}
          className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col shadow-xs hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-800 text-base mb-1 group-hover:text-emerald-800 transition-colors">
            Mentorship & Youth Leadership
          </h3>
          <p className="text-slate-500 text-xs leading-relaxed flex-1">
            Connecting emerging student leaders with university professors, corporate executives, and international forensic coaches.
          </p>
          <div className="mt-4 flex items-center text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
            <span>Learn About Mentorship</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </div>
      </section>

      {/* Impact Tracker & Grand Final Spotlight Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Decentralized Impact Tracker */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-4 bg-emerald-800 rounded-full"></span>
              <h3 className="font-bold text-slate-800 text-base">Decentralized 15-County Impact Tracker</h3>
            </div>
            <p className="text-slate-500 text-xs mb-6">
              Track real-time progress of our educational and forensics outreach across all subdivisions of Liberia.
            </p>

            <div className="space-y-4">
              {/* Progress 1 */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Counties Reached (All Subdivisions)</span>
                  <span className="text-emerald-800 font-bold">15 / 15 (100%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-700 h-2 rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
                </div>
              </div>

              {/* Progress 2 */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Accredited High Schools Enrolled</span>
                  <span className="text-emerald-800 font-bold">284+ Schools</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-700 h-2 rounded-full transition-all duration-500" style={{ width: '85%' }}></div>
                </div>
              </div>

              {/* Progress 3 */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Youth & Student Leaders Empowered</span>
                  <span className="text-emerald-700 font-bold">12,500+ Students</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-emerald-600 h-2 rounded-full transition-all duration-500" style={{ width: '92%' }}></div>
                </div>
              </div>

              {/* Progress 4 */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Scholarships & Science Grants Awarded</span>
                  <span className="text-amber-700 font-bold">$120,000+ USD</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="bg-amber-500 h-2 rounded-full transition-all duration-500" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Official Partner: Ministry of Education</span>
            <button
              onClick={() => {
                setTab('about');
                setAboutSub('story');
              }}
              className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Read Our 10-Year Story <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Reigning Champion Spotlight Card */}
        <div className="lg:col-span-5 bg-emerald-900 rounded-2xl p-6 text-white shadow-md flex flex-col justify-between border border-emerald-800">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="bg-yellow-400 text-emerald-950 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md">
                Reigning National Champion
              </span>
              <span className="text-xs text-emerald-200 flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" /> 2024/25 Finals
              </span>
            </div>

            <h4 className="text-xl font-bold text-white mb-1">
              {latestDebate.championSchool}
            </h4>
            <p className="text-xs text-emerald-200 flex items-center gap-1 mb-4">
              <MapPin className="w-3 h-3 text-red-400" /> {latestDebate.championCounty} County • Final Score: {latestDebate.finalScore}
            </p>

            <div className="bg-emerald-800/60 rounded-xl p-3.5 border border-emerald-700/50 space-y-1.5 mb-4">
              <span className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
                Grand Final Motion:
              </span>
              <p className="text-xs text-emerald-50 italic leading-relaxed">
                "{latestDebate.finalMotion}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs mb-4">
              <div className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800/60">
                <span className="text-emerald-300 block text-[10px] uppercase font-semibold">Runner-Up</span>
                <strong className="text-white truncate block">{latestDebate.runnerUpSchool}</strong>
              </div>
              <div className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800/60">
                <span className="text-yellow-300 block text-[10px] uppercase font-semibold">Tournament MVP</span>
                <strong className="text-yellow-200 truncate block">{latestDebate.bestSpeaker}</strong>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                setTab('debate');
                setDebateSub('2024-25');
              }}
              className="flex-1 bg-white hover:bg-slate-100 text-emerald-900 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
            >
              <span>View Full Tournament Recap</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setTab('gallery');
                setGallerySub('videos');
              }}
              className="px-3 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center cursor-pointer transition-colors"
              title="Watch Championship Clip"
            >
              <Play className="w-3.5 h-3.5 fill-current text-yellow-400" />
            </button>
          </div>
        </div>
      </section>

      {/* Data-Driven Impact Section for Liberia's 15 Counties (Recharts) */}
      <CountyImpactVisualizer
        selectedCounty={selectedCounty}
        onSelectCounty={setSelectedCounty}
        onRegisterSchool={() => {
          setTab('involved');
          setInvolvedSub('schools');
        }}
        onViewStandings={() => {
          setTab('results');
          setResultsSub('counties');
        }}
      />

      {/* Hall of Fame Snapshot & Schools Leaderboard Preview */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Top Ranked Schools */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-800 rounded-full"></span>
              <h3 className="font-bold text-slate-800 text-base">
                All-Time High Schools Leaderboard
              </h3>
            </div>
            <button
              onClick={() => {
                setTab('results');
                setResultsSub('schools');
              }}
              className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Full Leaderboard <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {SCHOOL_LEADERBOARD.slice(0, 5).map((s, idx) => (
              <div key={s.id} className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? 'bg-yellow-400 text-emerald-950 font-black' :
                    idx === 1 ? 'bg-slate-200 text-slate-700' :
                    idx === 2 ? 'bg-amber-100 text-amber-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{s.name}</h4>
                    <p className="text-[11px] text-slate-500">{s.city}, {s.county} County • Est. {s.established}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs sm:text-sm font-bold text-emerald-800">{s.totalPoints} pts</div>
                  <div className="text-[10px] text-yellow-600 font-semibold">{s.debateTitles + s.stemTitles} Titles (🏆)</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Hall of Fame Timeline Card */}
        <div className="lg:col-span-5 bg-emerald-900 text-white rounded-2xl p-6 shadow-md space-y-4 flex flex-col justify-between border border-emerald-800">
          <div>
            <div className="flex items-center justify-between border-b border-emerald-800 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <h4 className="font-bold text-white text-base">Hall of Fame Champions</h4>
              </div>
              <button
                onClick={() => {
                  setTab('results');
                  setResultsSub('winners');
                }}
                className="text-xs text-yellow-300 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5 mt-3">
              {HALL_OF_FAME_WINNERS.slice(0, 4).map((w) => (
                <div key={w.year} className="bg-emerald-800/50 p-2.5 rounded-xl border border-emerald-700/50 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black bg-yellow-400 text-emerald-950 px-1.5 py-0.5 rounded">
                        {w.year}
                      </span>
                      <strong className="text-xs text-white font-bold">{w.debateChampion}</strong>
                    </div>
                    <div className="text-[11px] text-emerald-200 mt-0.5">
                      MVP: <span className="text-yellow-200">{w.bestSpeaker}</span>
                    </div>
                  </div>
                  <div className="text-right text-[11px]">
                    <span className="text-emerald-300 block text-[9px] uppercase">County</span>
                    <span className="text-white font-semibold">{w.debateCounty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setTab('debate');
              setDebateSub('2024-25');
            }}
            className="w-full py-2.5 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold text-xs transition-colors cursor-pointer text-center shadow-sm"
          >
            Explore 10-Year Editions Archive (2015–2025)
          </button>
        </div>
      </section>

      {/* Alumni Testimonials & Voices of Impact Section */}
      <section className="bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 rounded-3xl p-6 sm:p-8 text-white border border-emerald-800/40 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-800/50 pb-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-400 text-emerald-950 rounded-full text-xs font-bold uppercase tracking-wider">
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>Alumni Testimonials & Voices of Impact</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">
              From High School Podiums to Global Leadership
            </h3>
            <p className="text-emerald-100 text-xs sm:text-sm">
              Discover how a decade of rigorous policy debate and STEM innovation shaped the next generation of Liberian jurists, biomedical researchers, and civic reformers.
            </p>
          </div>

          <button
            onClick={() => {
              setTab('alumni');
              if (setAlumniSub) setAlumniSub('testimonials');
            }}
            className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto shrink-0"
          >
            <span>Read All Alumni Stories</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Featured Alumni Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {ALUMNI_TESTIMONIALS.slice(0, 3).map(item => (
            <div
              key={item.id}
              onClick={() => {
                setTab('alumni');
                if (setAlumniSub) setAlumniSub('testimonials');
              }}
              className="bg-white/10 backdrop-blur-xs border border-white/10 hover:border-yellow-400/50 hover:bg-white/15 rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-yellow-400/60 shrink-0">
                    <SafeImage
                      src={item.photo}
                      alt={item.name}
                      priority
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm group-hover:text-yellow-300 transition-colors leading-tight">
                      {item.name}
                    </h4>
                    <p className="text-[11px] text-emerald-200 font-medium leading-tight mt-0.5">
                      {item.currentTitle}
                    </p>
                    <p className="text-[10px] text-slate-300">
                      {item.organizationOrUniversity}
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-950/60 p-3 rounded-xl border border-emerald-800/40 text-xs italic text-emerald-100 leading-relaxed relative">
                  <Quote className="w-3.5 h-3.5 text-yellow-400 mb-1" />
                  "{item.keyQuote}"
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-800/40 flex items-center justify-between text-[11px] text-emerald-200">
                <span>{item.highSchool} ({item.county})</span>
                <span className="text-yellow-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                  Story &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest News & Press Hub */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-emerald-800 rounded-full"></span>
            <h3 className="text-lg font-bold text-slate-800">
              Latest News & Press Releases
            </h3>
          </div>
          <button
            onClick={() => setTab('news')}
            className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
          >
            All Media <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {allNewsStories.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-800 rounded-xl flex items-center justify-center mx-auto">
              <Newspaper className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-sm">No Press Releases Published Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Official tournament bulletins, county qualifiers, and youth empowerment features will appear here once published.
              </p>
            </div>
            <div className="pt-1 flex justify-center gap-2">
              <button
                onClick={() => setTab('news')}
                className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Visit Media Hub
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {allNewsStories.slice(0, 3).map(article => (
              <div
                key={article.id}
                onClick={() => setTab('news')}
                className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="h-36 overflow-hidden relative">
                    <SafeImage
                      src={article.image}
                      alt={article.title}
                      fallbackCategory="news"
                      fallbackTitle={article.title}
                      priority
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-emerald-800 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      {article.category}
                    </span>
                    {article.createdAt && (
                      <span className="absolute top-2.5 right-2.5 bg-yellow-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded shadow-xs">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="p-4 space-y-1.5">
                    <div className="text-[11px] text-slate-400 font-medium">
                      {article.date} • {article.readTime}
                    </div>
                    <h4 className="font-bold text-slate-800 group-hover:text-emerald-800 text-sm leading-snug line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {article.summary}
                    </p>
                  </div>
                </div>
                <div className="px-4 pb-4 pt-1 flex items-center text-xs font-bold text-emerald-800 group-hover:translate-x-1 transition-transform">
                  Read Full Story <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Partners & Endorsement Ribbon */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 text-center space-y-4 shadow-xs">
        <div className="flex items-center justify-center gap-2">
          <HeartHandshake className="w-4 h-4 text-emerald-700" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Official Strategic Partners, Ministries & Sponsors ({livePartners.length})
          </p>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4">
          {livePartners.map((p, idx) => (
            <div
              key={p.id || p.name || idx}
              onClick={() => {
                setTab('about');
                setAboutSub('partners');
              }}
              className="group relative px-4 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-700 hover:text-emerald-900 hover:border-emerald-500 hover:bg-emerald-50/70 hover:shadow-xs cursor-pointer transition-all flex items-center gap-2"
              title={`${p.name} — ${p.description || p.category}`}
            >
              <span className="font-extrabold tracking-wide">{p.logoText || p.name}</span>
              {p.isLive && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active Accredited Partner" />
              )}
            </div>
          ))}
        </div>
        <div className="pt-1">
          <button
            onClick={() => {
              setTab('about');
              setAboutSub('partners');
            }}
            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 hover:underline cursor-pointer inline-flex items-center gap-1"
          >
            View All Accredited Partners & Sponsor Framework <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </section>
      </div>
    </div>
  );
};
