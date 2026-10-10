/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  NavTab, AboutSubTab, ProgramsSubTab, DebateSubTab, 
  StemSubTab, ResultsSubTab, GallerySubTab, InvolvedSubTab,
  AlumniSubTab
} from './types';

// Direct synchronous imports for instant 0ms tab switching (zero loading screens, zero delay)
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { AboutView } from './components/AboutView';
import { ProgramsView } from './components/ProgramsView';
import { DebateView } from './components/DebateView';
import { StemView } from './components/StemView';
import { ResultsView } from './components/ResultsView';
import { TournamentFixturesHub } from './components/TournamentFixturesHub';
import { GalleryView } from './components/GalleryView';
import { NewsView } from './components/NewsView';
import { AlumniView } from './components/AlumniView';
import { DocumentsView } from './components/DocumentsView';
import { InvolvedView } from './components/InvolvedView';
import { VolunteerDashboard } from './components/VolunteerDashboard';
import { ContactView } from './components/ContactView';
import { AdminPortal } from './components/AdminPortal';
import { AiForensicsCoach } from './components/AiForensicsCoach';
import { SearchModal } from './components/SearchModal';
import { NewsletterModal } from './components/NewsletterModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { YearlyReportModal } from './components/YearlyReportModal';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [aboutSub, setAboutSub] = useState<AboutSubTab>('story');
  const [programsSub, setProgramsSub] = useState<ProgramsSubTab>('debate-prog');
  const [debateSub, setDebateSub] = useState<DebateSubTab>('2024-25');
  const [stemSub, setStemSub] = useState<StemSubTab>('current');
  const [resultsSub, setResultsSub] = useState<ResultsSubTab>('winners');
  const [gallerySub, setGallerySub] = useState<GallerySubTab>('photos');
  const [involvedSub, setInvolvedSub] = useState<InvolvedSubTab>('schools');
  const [alumniSub, setAlumniSub] = useState<AlumniSubTab>('directory');
  
  // Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Yearly Partner Report Modal State
  const [isYearlyReportOpen, setIsYearlyReportOpen] = useState(false);

  // Smooth scroll to top on section or tab change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, aboutSub, programsSub, debateSub, stemSub, resultsSub, gallerySub, involvedSub, alumniSub]);

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-[#002868] selection:text-white">
      {/* Universal Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        aboutSub={aboutSub}
        setAboutSub={setAboutSub}
        programsSub={programsSub}
        setProgramsSub={setProgramsSub}
        debateSub={debateSub}
        setDebateSub={setDebateSub}
        stemSub={stemSub}
        setStemSub={setStemSub}
        resultsSub={resultsSub}
        setResultsSub={setResultsSub}
        gallerySub={gallerySub}
        setGallerySub={setGallerySub}
        involvedSub={involvedSub}
        setInvolvedSub={setInvolvedSub}
        alumniSub={alumniSub}
        setAlumniSub={setAlumniSub}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenYearlyReport={() => setIsYearlyReportOpen(true)}
      />

      {/* Main View Router - Instantaneous Rendering with No Loading Intermediaries */}
      <main className="flex-1">
        <div key={activeTab} className="w-full animate-view-fade-in">
          {activeTab === 'home' && (
            <HomeView
              setTab={setActiveTab}
              setAboutSub={setAboutSub}
              setProgramsSub={setProgramsSub}
              setDebateSub={setDebateSub}
              setStemSub={setStemSub}
              setResultsSub={setResultsSub}
              setGallerySub={setGallerySub}
              setInvolvedSub={setInvolvedSub}
              setAlumniSub={setAlumniSub}
            />
          )}

          {activeTab === 'about' && (
            <AboutView
              aboutSub={aboutSub}
              setAboutSub={setAboutSub}
              setTab={setActiveTab}
              setInvolvedSub={setInvolvedSub}
            />
          )}

          {activeTab === 'programs' && (
            <ProgramsView
              programsSub={programsSub}
              setProgramsSub={setProgramsSub}
              setTab={setActiveTab}
              setInvolvedSub={setInvolvedSub}
              setDebateSub={setDebateSub}
              setStemSub={setStemSub}
            />
          )}

          {activeTab === 'debate' && (
            <DebateView
              debateSub={debateSub}
              setDebateSub={setDebateSub}
              setTab={setActiveTab}
              setInvolvedSub={setInvolvedSub}
            />
          )}

          {activeTab === 'stem' && (
            <StemView
              stemSub={stemSub}
              setStemSub={setStemSub}
              setTab={setActiveTab}
              setInvolvedSub={setInvolvedSub}
            />
          )}

          {activeTab === 'results' && (
            <ResultsView
              resultsSub={resultsSub}
              setResultsSub={setResultsSub}
              setTab={setActiveTab}
              setDebateSub={setDebateSub}
            />
          )}

          {activeTab === 'fixtures' && (
            <TournamentFixturesHub
              onNavigateToInvolved={() => setActiveTab('involved')}
              onNavigateToDebate={(editionKey) => {
                if (editionKey) setDebateSub(editionKey);
                setActiveTab('debate');
              }}
            />
          )}

          {activeTab === 'gallery' && (
            <GalleryView
              gallerySub={gallerySub}
              setGallerySub={setGallerySub}
              setTab={setActiveTab}
            />
          )}

          {activeTab === 'news' && (
            <NewsView
              setTab={setActiveTab}
            />
          )}

          {activeTab === 'alumni' && (
            <AlumniView
              alumniSub={alumniSub}
              setAlumniSub={setAlumniSub}
              setTab={setActiveTab}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsView
              setTab={setActiveTab}
            />
          )}

          {activeTab === 'involved' && (
            <InvolvedView
              involvedSub={involvedSub}
              setInvolvedSub={setInvolvedSub}
              setTab={setActiveTab}
            />
          )}

          {activeTab === 'volunteer-dashboard' && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
              <VolunteerDashboard setTab={setActiveTab} />
            </div>
          )}

          {activeTab === 'contact' && (
            <ContactView />
          )}

          {activeTab === 'admin' && (
            <AdminPortal setTab={setActiveTab} />
          )}
        </div>
      </main>

      {/* Global AI Forensics & STEM Coach Widget */}
      <AiForensicsCoach />

      {/* Global Interactive Search Modal */}
      {isSearchOpen && (
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          setTab={setActiveTab}
          setAboutSub={setAboutSub}
          setProgramsSub={setProgramsSub}
          setDebateSub={setDebateSub}
          setStemSub={setStemSub}
          setResultsSub={setResultsSub}
          setGallerySub={setGallerySub}
          setInvolvedSub={setInvolvedSub}
          setAlumniSub={setAlumniSub}
        />
      )}

      {/* Non-Intrusive Newsletter Sign-Up Modal */}
      <NewsletterModal activeTab={activeTab} />

      {/* Service Worker Offline Status Indicator */}
      <OfflineIndicator />

      {/* Official Youth For Change Yearly Partner Report Modal */}
      <YearlyReportModal
        isOpen={isYearlyReportOpen}
        onClose={() => setIsYearlyReportOpen(false)}
      />

      {/* Universal Footer */}
      <Footer
        setTab={setActiveTab}
        setAboutSub={setAboutSub}
        setProgramsSub={setProgramsSub}
        setDebateSub={setDebateSub}
        setStemSub={setStemSub}
        setResultsSub={setResultsSub}
        setGallerySub={setGallerySub}
        setInvolvedSub={setInvolvedSub}
        setAlumniSub={setAlumniSub}
      />
    </div>
  );
}
