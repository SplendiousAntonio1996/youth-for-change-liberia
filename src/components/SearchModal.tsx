import React, { useState, useMemo } from 'react';
import { Search, X, Trophy, Cpu, BookOpen, Newspaper, MapPin, ChevronRight, Star, GraduationCap, FileText } from 'lucide-react';
import { NavTab, AboutSubTab, ProgramsSubTab, DebateSubTab, StemSubTab, ResultsSubTab, GallerySubTab, InvolvedSubTab, AlumniSubTab } from '../types';
import { DEBATE_EDITIONS } from '../data/debateData';
import { useDebateEditions } from '../hooks/useDebateEditions';
import { normalizeEditionKey } from '../lib/debateService';
import { STEM_PROJECTS } from '../data/stemData';
import { SCHOOL_LEADERBOARD, LIBERIA_COUNTIES } from '../data/schoolData';
import { NEWS_ARTICLES, PROGRAMS_DETAILED } from '../data/contentData';
import { ALUMNI_PROFILES } from '../data/alumniData';
import { OFFICIAL_DOCUMENTS } from '../data/documentData';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
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
  const [query, setQuery] = useState('');
  const { editionsList } = useDebateEditions();

  const searchResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];

    const q = query.toLowerCase();
    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      type: string;
      action: () => void;
    }> = [];

    // Search Schools
    SCHOOL_LEADERBOARD.forEach(s => {
      if (s.name.toLowerCase().includes(q) || s.county.toLowerCase().includes(q) || s.city.toLowerCase().includes(q)) {
        results.push({
          id: `school-${s.id}`,
          title: s.name,
          subtitle: `${s.county} County • ${s.city} (${s.totalPoints} pts, ${s.debateTitles} Debate Titles)`,
          type: 'School',
          action: () => {
            setTab('results');
            setResultsSub('schools');
            onClose();
          }
        });
      }
    });

    // Search Debate Editions
    editionsList.forEach(ed => {
      const editionKey = ed.id || normalizeEditionKey(ed.year);
      if (
        (ed.title && ed.title.toLowerCase().includes(q)) ||
        (ed.championSchool && ed.championSchool.toLowerCase().includes(q)) ||
        (ed.championCounty && ed.championCounty.toLowerCase().includes(q)) ||
        (ed.finalMotion && ed.finalMotion.toLowerCase().includes(q)) ||
        (ed.bestSpeaker && ed.bestSpeaker.toLowerCase().includes(q)) ||
        (ed.year && ed.year.toLowerCase().includes(q))
      ) {
        results.push({
          id: `debate-${ed.year}`,
          title: `${ed.year} Debate Championship: ${ed.title || 'National Championship'}`,
          subtitle: `Champion: ${ed.championSchool || 'Pending'} (${ed.championCounty || 'N/A'}) • MVP: ${ed.bestSpeaker || 'Pending'}`,
          type: 'Debate Edition',
          action: () => {
            setTab('debate');
            setDebateSub(editionKey as DebateSubTab);
            onClose();
          }
        });
      }
    });

    // Search STEM Projects
    STEM_PROJECTS.forEach(p => {
      if (p.title.toLowerCase().includes(q) || p.school.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q)) {
        results.push({
          id: `stem-${p.id}`,
          title: p.title,
          subtitle: `${p.school} (${p.county}) • Category: ${p.category}`,
          type: 'STEM Project',
          action: () => {
            setTab('stem');
            setStemSub('projects');
            onClose();
          }
        });
      }
    });

    // Search News Articles
    NEWS_ARTICLES.forEach(n => {
      if (n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q) || n.category.toLowerCase().includes(q)) {
        results.push({
          id: `news-${n.id}`,
          title: n.title,
          subtitle: `${n.date} • ${n.category}`,
          type: 'News Article',
          action: () => {
            setTab('news');
            onClose();
          }
        });
      }
    });

    // Search Programs
    PROGRAMS_DETAILED.forEach(p => {
      if (p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
        results.push({
          id: `prog-${p.id}`,
          title: p.title,
          subtitle: p.subtitle,
          type: 'Program',
          action: () => {
            setTab('programs');
            setProgramsSub(p.id as ProgramsSubTab);
            onClose();
          }
        });
      }
    });

    // Search Alumni & Debaters
    ALUMNI_PROFILES.forEach(a => {
      if (a.name.toLowerCase().includes(q) || a.highSchool.toLowerCase().includes(q) || a.currentTitle.toLowerCase().includes(q) || a.county.toLowerCase().includes(q)) {
        results.push({
          id: `alumni-${a.id}`,
          title: a.name,
          subtitle: `${a.highSchool} (${a.tournamentYear}) • ${a.currentTitle} at ${a.organizationOrUniversity}`,
          type: 'Alumni',
          action: () => {
            setTab('alumni');
            if (setAlumniSub) setAlumniSub('directory');
            onClose();
          }
        });
      }
    });

    // Search Official Documents & PDFs
    OFFICIAL_DOCUMENTS.forEach(d => {
      if (d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q) || d.category.toLowerCase().includes(q)) {
        results.push({
          id: `doc-${d.id}`,
          title: d.title,
          subtitle: `${d.category} • ${d.fileType.toUpperCase()} (${d.fileSize})`,
          type: 'Document',
          action: () => {
            setTab('documents');
            onClose();
          }
        });
      }
    });

    // Search Counties
    LIBERIA_COUNTIES.forEach(c => {
      if (c.county.toLowerCase().includes(q) || c.coordinator.toLowerCase().includes(q) || c.highlight.toLowerCase().includes(q)) {
        results.push({
          id: `county-${c.county}`,
          title: `${c.county} County Division`,
          subtitle: `${c.activeSchools} Schools • Coordinator: ${c.coordinator}`,
          type: 'County',
          action: () => {
            setTab('results');
            setResultsSub('counties');
            onClose();
          }
        });
      }
    });

    return results.slice(0, 8);
  }, [query, setTab, setResultsSub, setDebateSub, setStemSub, setProgramsSub, setAlumniSub, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden space-y-0">
        {/* Search Input Box */}
        <div className="flex items-center px-6 py-4 border-b border-slate-200 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search debate editions, schools, STEM projects, counties, or news..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200"
          >
            Esc
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-2">
          {query.trim().length >= 2 && searchResults.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-xs sm:text-sm">
              No results found for "<strong className="text-slate-800">{query}</strong>". Try searching for "St. Patrick's", "Bong", "STEM", "2024", or "Bassa".
            </div>
          )}

          {searchResults.map(result => (
            <div
              key={result.id}
              onClick={result.action}
              className="p-3 rounded-2xl hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                    {result.type}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">
                    {result.title}
                  </h4>
                </div>
                <p className="text-xs text-slate-500">{result.subtitle}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-800 shrink-0" />
            </div>
          ))}

          {query.trim().length < 2 && (
            <div className="p-4 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suggested Quick Jumps</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '🏆 2024/25 Debate Final', action: () => { setTab('debate'); setDebateSub('2024-25'); onClose(); } },
                  { label: '🔬 STEM Student Projects', action: () => { setTab('stem'); setStemSub('projects'); onClose(); } },
                  { label: '🥇 Schools Leaderboard', action: () => { setTab('results'); setResultsSub('schools'); onClose(); } },
                  { label: '🇱🇷 15 Counties Performance', action: () => { setTab('results'); setResultsSub('counties'); onClose(); } },
                  { label: '📝 Register High School', action: () => { setTab('involved'); setInvolvedSub('schools'); onClose(); } }
                ].map((sug, i) => (
                  <button
                    key={i}
                    onClick={sug.action}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {sug.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
