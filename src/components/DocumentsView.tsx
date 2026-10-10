import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Download, Search, 
  Eye, BookOpen, ShieldCheck, 
  X, Zap, BarChart3, Sparkles
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { DocumentItem, NavTab } from '../types';
import { OFFICIAL_DOCUMENTS } from '../data/documentData';
import { DocumentPreview } from './DocumentPreview';
import { YearlyReportModal } from './YearlyReportModal';

interface DocumentsViewProps {
  setTab: (tab: NavTab) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ setTab }) => {
  const [liveDocs, setLiveDocs] = useState<DocumentItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isYearlyReportOpen, setIsYearlyReportOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Document In-Browser Preview State
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [isPreviewFullScreen, setIsPreviewFullScreen] = useState<boolean>(false);

  // Realtime subscription to live Firestore documents
  useEffect(() => {
    try {
      if (!db) return;
      const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: DocumentItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          fetched.push({
            id: docSnap.id,
            title: data.title || 'Untitled Document',
            category: data.category || 'Rulebooks & Guidelines',
            fileType: data.fileType || 'pdf',
            fileSize: data.fileSize || '1.0 MB',
            publishDate: data.publishDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            downloadCount: data.downloadCount || 0,
            editionYear: data.editionYear || '2024/2025',
            authorOrDept: data.authorOrDept || 'YFC Secretariat',
            description: data.description || '',
            tags: data.tags || [],
            contentSections: data.contentSections || [],
            fileUrl: data.fileUrl,
            authorUid: data.authorUid,
            createdAt: data.createdAt
          });
        });
        setLiveDocs(fetched);
      }, (err) => {
        console.warn('Firestore docs sync error:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not initialize docs firestore listener:', e);
    }
  }, []);

  const categories = [
    'All',
    'Rulebooks & Guidelines',
    'Research Dossiers & Motions',
    'Forms & Affiliation',
    'Impact Reports & Whitepapers',
    'STEM Toolkits'
  ];

  // Combined documents: realtime Firestore docs + default seeded documents
  const allDocuments = useMemo(() => [
    ...liveDocs,
    ...OFFICIAL_DOCUMENTS.filter(d => !liveDocs.some(ld => ld.id === d.id))
  ], [liveDocs]);

  // Filtered Documents
  const filteredDocs = useMemo(() => allDocuments.filter(doc => {
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.authorOrDept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  }), [allDocuments, selectedCategory, searchQuery]);

  // Curated list of official competition rules & guidelines
  const officialRulesAndGuidelines = useMemo(() => {
    return allDocuments.filter(doc => 
      doc.category === 'Rulebooks & Guidelines' ||
      doc.tags.some(t => t.toLowerCase().includes('rule') || t.toLowerCase().includes('guideline')) ||
      doc.title.toLowerCase().includes('rulebook') ||
      doc.title.toLowerCase().includes('guidelines') ||
      doc.title.toLowerCase().includes('manual')
    );
  }, [allDocuments]);

  // Select document for in-browser preview and smooth scroll
  const handleSelectPreview = (doc: DocumentItem) => {
    setPreviewDoc(doc);
    setTimeout(() => {
      const previewElement = document.getElementById('document-preview-pane');
      if (previewElement) {
        previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  // Client-Side Dynamic PDF Generation & Print Download
  const handlePrintOrDownloadPDF = (doc: DocumentItem) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const sectionsHTML = doc.contentSections.map(s => `
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 16px; color: #064e3b; border-bottom: 2px solid #047857; padding-bottom: 4px; margin-bottom: 12px; font-family: sans-serif;">
          ${s.title}
        </h2>
        ${s.content.map(p => `<p style="font-size: 13px; line-height: 1.7; color: #1e293b; margin-bottom: 10px; font-family: sans-serif;">${p}</p>`).join('')}
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${doc.title} - YFC Liberia Official Document</title>
          <style>
            @page { margin: 20mm; }
            body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; color: #0f172a; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header-banner { border-bottom: 3px double #064e3b; padding-bottom: 15px; margin-bottom: 25px; text-align: center; }
            .badge { display: inline-block; background-color: #fef08a; color: #064e3b; font-weight: bold; font-size: 11px; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 8px; }
            .title { font-size: 20px; font-weight: 800; color: #064e3b; margin: 8px 0; }
            .meta { font-size: 11px; color: #64748b; margin-top: 5px; }
            .footer { border-top: 1px solid #cbd5e1; margin-top: 40px; padding-top: 15px; font-size: 11px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div class="badge">Republic of Liberia • Youth For Change National Forensics Secretariat</div>
            <h1 class="title">${doc.title}</h1>
            <div class="meta">
              <strong>Category:</strong> ${doc.category} | 
              <strong>Edition:</strong> ${doc.editionYear} | 
              <strong>Issuing Directorate:</strong> ${doc.authorOrDept} | 
              <strong>Published:</strong> ${doc.publishDate}
            </div>
          </div>
          
          <div style="background-color: #f8fafc; border-left: 4px solid #047857; padding: 12px 16px; margin-bottom: 25px; font-size: 13px; color: #334155; font-style: italic;">
            <strong>Document Overview:</strong> ${doc.description}
          </div>

          <div class="content-body">
            ${sectionsHTML}
          </div>

          <div class="footer">
            Youth For Change Liberia (YFC) • Official High School Forensics & STEM Platform • Verified Document ID: ${doc.id.toUpperCase()}-2025
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-yellow-400 text-emerald-950 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
            <BookOpen className="w-4 h-4" />
            <span>Official Repository & PDF Dossier Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            Download & Read Official YFC Documents
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
            Access official National Debate Rulebooks, Adjudication Rubrics, 10-Year Motion Archives, STEM Challenge Blueprints, School Affiliation Forms, and Impact Whitepapers.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => setIsYearlyReportOpen(true)}
              className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer border border-yellow-500/40"
            >
              <BarChart3 className="w-4 h-4 text-emerald-950" />
              <span>Generate Yearly Partner Report</span>
              <span className="text-[10px] bg-emerald-950 text-yellow-300 px-1.5 py-0.5 rounded font-black uppercase">
                Audited
              </span>
            </button>
            <button
              onClick={() => {
                const debateRulebook = allDocuments.find(d => d.id === 'doc-01');
                if (debateRulebook) handleSelectPreview(debateRulebook);
              }}
              className="px-5 py-2.5 bg-emerald-900/90 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs sm:text-sm border border-emerald-700/80 shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-yellow-300" /> Preview Debate Rulebook
            </button>
            <button
              onClick={() => {
                const stemRules = allDocuments.find(d => d.id === 'doc-07' || d.id === 'doc-02');
                if (stemRules) handleSelectPreview(stemRules);
              }}
              className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm border border-emerald-600 shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-yellow-300" /> Preview STEM Competition Rules
            </button>
            <button
              onClick={() => setSelectedCategory('Rulebooks & Guidelines')}
              className="px-5 py-2.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 font-bold rounded-xl text-xs sm:text-sm border border-emerald-800 transition-all flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="w-4 h-4" /> Browse All Documents
            </button>
          </div>
        </div>
      </div>

      {/* Featured Banner: Official Annual Partner Accountability Report Generator */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-black uppercase tracking-wider border border-yellow-400/30">
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>Official Accountability Feature</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Comprehensive Yearly Report of Youth For Change
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Generate and export the formal multi-pillar institutional report for strategic partners, USAID, Ministry of Education, and donors: major achievements, news dispatches, 148 debate fixtures, 15-county school participation, and complete itemized money spending statements.
          </p>
          <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-emerald-200 font-bold">
            <span className="bg-white/10 px-2.5 py-1 rounded-lg">42,500+ Youth Impacted</span>
            <span className="bg-white/10 px-2.5 py-1 rounded-lg">15 Counties Covered</span>
            <span className="bg-white/10 px-2.5 py-1 rounded-lg">100% Itemized Spending</span>
            <span className="bg-white/10 px-2.5 py-1 rounded-lg">Executive Signatures</span>
          </div>
        </div>

        <button
          onClick={() => setIsYearlyReportOpen(true)}
          className="px-6 py-3.5 rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-emerald-950 font-black text-sm shadow-xl flex items-center gap-2 transition-all transform hover:scale-102 cursor-pointer shrink-0 border border-yellow-500/50"
        >
          <BarChart3 className="w-5 h-5 text-emerald-950" />
          <span>Generate Annual Report Now</span>
        </button>
      </div>

      {/* Quick Access Shelf: Official Guidelines & Competition Rules */}
      <div className="bg-gradient-to-br from-emerald-900/10 via-slate-50 to-amber-500/10 rounded-3xl p-6 sm:p-8 border border-emerald-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-900 bg-emerald-100/90 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Direct In-Browser Reference Center</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Official Guidelines & Competition Rules
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl">
              Inspect the official rulebooks, WSDC speaker point rubrics, STEM prototype guidelines, safety protocols, and judge standards directly in your browser without needing to download external files.
            </p>
          </div>

          {previewDoc && (
            <button
              onClick={() => {
                const previewElement = document.getElementById('document-preview-pane');
                if (previewElement) previewElement.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Eye className="w-3.5 h-3.5 text-yellow-300" /> Jump to Active Preview
            </button>
          )}
        </div>

        {/* Quick Preview Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {officialRulesAndGuidelines.slice(0, 6).map(doc => {
            const isCurrentlyPreviewed = previewDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between group ${
                  isCurrentlyPreviewed 
                    ? 'border-emerald-600 ring-2 ring-emerald-600/30 shadow-md bg-emerald-50/20' 
                    : 'border-slate-200 hover:border-emerald-300 hover:shadow-md'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                      {doc.category === 'Rulebooks & Guidelines' ? 'Official Rules' : doc.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {doc.editionYear}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm leading-snug group-hover:text-emerald-800 transition-colors line-clamp-2">
                    {doc.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {doc.description}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => handleSelectPreview(doc)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isCurrentlyPreviewed
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{isCurrentlyPreviewed ? 'Viewing in Browser' : 'Preview Rules'}</span>
                  </button>

                  <button
                    onClick={() => handlePrintOrDownloadPDF(doc)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    title="Print / Download PDF"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live In-Browser Document Preview Component Pane */}
      <div id="document-preview-pane" className="scroll-mt-20">
        <AnimatePresence>
          {previewDoc && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
              className="space-y-3"
            >
              {/* Preview Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-emerald-950 text-white px-5 py-3 rounded-2xl shadow-md border border-emerald-800">
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold text-amber-300">Live In-Browser Document Preview Active:</span>
                  <span className="font-medium text-emerald-100 truncate max-w-md hidden sm:inline">
                    {previewDoc.title}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPreviewFullScreen(!isPreviewFullScreen)}
                    className="px-3 py-1 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    {isPreviewFullScreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
                  </button>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="px-3 py-1 bg-rose-900/80 hover:bg-rose-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Close Preview
                  </button>
                </div>
              </div>

              {/* The Reusable DocumentPreview Component */}
              <DocumentPreview
                document={previewDoc}
                onClose={() => setPreviewDoc(null)}
                isFullScreen={isPreviewFullScreen}
                onToggleFullScreen={() => setIsPreviewFullScreen(!isPreviewFullScreen)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Search & Category Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Live Search */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rulebooks, motions, forms, dossiers, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 transition-all"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            {selectedCategory === 'All' ? 'All Publications & Repository Files' : selectedCategory}
          </h2>
          <p className="text-xs text-slate-500">
            Showing {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''} • Click "Preview in Browser" to inspect contents directly
          </p>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map(doc => {
          const isCurrentlyPreviewed = previewDoc?.id === doc.id;
          return (
            <div
              key={doc.id}
              className={`bg-white rounded-3xl border p-6 shadow-xs hover:shadow-xl transition-all flex flex-col justify-between group ${
                isCurrentlyPreviewed
                  ? 'border-emerald-600 ring-2 ring-emerald-600/30 shadow-lg'
                  : 'border-slate-200'
              }`}
            >
              <div className="space-y-4">
                {/* Card Header & Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold shrink-0 border border-emerald-100 shadow-xs group-hover:scale-105 transition-transform">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-400/20 text-yellow-900 px-2 py-0.5 rounded border border-yellow-300/40">
                      {doc.fileType.toUpperCase()} • {doc.fileSize}
                    </span>
                    {doc.createdAt && (
                      <span className="text-[10px] text-emerald-700 font-extrabold mt-1">
                        Live Upload
                      </span>
                    )}
                    {isCurrentlyPreviewed && (
                      <span className="text-[9px] bg-emerald-800 text-white font-black px-1.5 py-0.5 rounded mt-1 uppercase tracking-wider">
                        Active in Preview
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Category */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    {doc.category}
                  </span>
                  <h3 className="font-bold text-slate-900 group-hover:text-emerald-800 text-base leading-snug">
                    {doc.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                  {doc.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {doc.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Meta Info */}
                <div className="text-[11px] text-slate-400 space-y-0.5 pt-2 border-t border-slate-100">
                  <div><strong>Issuing Dept:</strong> {doc.authorOrDept}</div>
                  <div><strong>Edition:</strong> {doc.editionYear} • {doc.publishDate}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 mt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSelectPreview(doc)}
                  className={`py-2.5 px-3 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isCurrentlyPreviewed
                      ? 'bg-emerald-800 text-white'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                  }`}
                >
                  <Eye className={`w-3.5 h-3.5 ${isCurrentlyPreviewed ? 'text-amber-300' : 'text-emerald-700'}`} />
                  <span>{isCurrentlyPreviewed ? 'In Preview' : 'Preview in App'}</span>
                </button>

                <button
                  onClick={() => handlePrintOrDownloadPDF(doc)}
                  className="py-2.5 px-3 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-yellow-300" /> Download PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Official Youth For Change Yearly Partner Report Modal */}
      <YearlyReportModal
        isOpen={isYearlyReportOpen}
        onClose={() => setIsYearlyReportOpen(false)}
      />
    </div>
  );
};
