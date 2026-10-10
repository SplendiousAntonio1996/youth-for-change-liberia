import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Download, Printer, Copy, Check, X, Search,
  ZoomIn, ZoomOut, Maximize2, Minimize2, BookOpen, 
  ShieldCheck, ArrowUp, Calendar, Tag, UserCheck, 
  Sparkles, Layers, ListFilter, Eye, CheckCircle2, ChevronRight
} from 'lucide-react';
import { DocumentItem } from '../types';

interface DocumentPreviewProps {
  document: DocumentItem | null;
  onClose: () => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  onClose,
  isFullScreen = false,
  onToggleFullScreen
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [themeMode, setThemeMode] = useState<'paper' | 'warm' | 'night'>('paper');
  const [inDocSearch, setInDocSearch] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeSectionIdx, setActiveSectionIdx] = useState<number | null>(null);

  if (!document) return null;

  // Print or Download PDF representation
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const sectionsHTML = document.contentSections.map((s, idx) => `
      <div style="margin-bottom: 24px; page-break-inside: avoid;">
        <h3 style="font-size: 15px; font-weight: 700; color: #064e3b; border-bottom: 2px solid #047857; padding-bottom: 4px; margin-bottom: 12px; font-family: sans-serif;">
          ${s.title}
        </h3>
        ${s.content.map(p => `<p style="font-size: 12.5px; line-height: 1.7; color: #1e293b; margin-bottom: 10px; font-family: sans-serif;">${p}</p>`).join('')}
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${document.title} - YFC Official Document</title>
          <style>
            @page { margin: 18mm; size: A4; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; padding: 20px; max-width: 820px; margin: 0 auto; line-height: 1.6; }
            .header-banner { border-bottom: 3px double #064e3b; padding-bottom: 16px; margin-bottom: 20px; text-align: center; }
            .badge { display: inline-block; background-color: #fef08a; color: #064e3b; font-weight: 800; font-size: 10px; padding: 4px 10px; border-radius: 4px; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px; }
            .title { font-size: 20px; font-weight: 800; color: #064e3b; margin: 8px 0; }
            .meta { font-size: 11px; color: #475569; margin-top: 6px; }
            .overview { background-color: #f0fdf4; border-left: 4px solid #047857; padding: 12px 16px; margin-bottom: 24px; font-size: 12px; color: #166534; }
            .footer { border-top: 1px solid #cbd5e1; margin-top: 40px; padding-top: 16px; font-size: 10px; color: #94a3b8; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <div class="badge">Republic of Liberia • Youth For Change National Forensics & STEM Secretariat</div>
            <h1 class="title">${document.title}</h1>
            <div class="meta">
              <strong>Category:</strong> ${document.category} &nbsp;|&nbsp; 
              <strong>Edition:</strong> ${document.editionYear} &nbsp;|&nbsp; 
              <strong>Issuing Directorate:</strong> ${document.authorOrDept} &nbsp;|&nbsp; 
              <strong>Published:</strong> ${document.publishDate}
            </div>
          </div>
          
          <div class="overview">
            <strong>Official Executive Summary:</strong> ${document.description}
          </div>

          <div class="content-body">
            ${sectionsHTML}
          </div>

          <div class="footer">
            Youth For Change Liberia (YFC) • Official Publications Repository • Verified Document ID: ${document.id.toUpperCase()}-2025
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

  // Copy text to clipboard
  const handleCopy = () => {
    const fullText = `${document.title}\n` +
      `Category: ${document.category} | Edition: ${document.editionYear}\n` +
      `Published: ${document.publishDate} | Issuing Authority: ${document.authorOrDept}\n\n` +
      `Executive Summary:\n${document.description}\n\n` +
      document.contentSections.map(s => `=== ${s.title} ===\n${s.content.join('\n\n')}`).join('\n\n');

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Filter sections if in-document search is active
  const filteredSections = useMemo(() => {
    if (!inDocSearch.trim()) return document.contentSections;
    const query = inDocSearch.toLowerCase();
    return document.contentSections.filter(s => 
      s.title.toLowerCase().includes(query) ||
      s.content.some(c => c.toLowerCase().includes(query))
    );
  }, [document.contentSections, inDocSearch]);

  const matchCount = useMemo(() => {
    if (!inDocSearch.trim()) return 0;
    const query = inDocSearch.toLowerCase();
    let count = 0;
    document.contentSections.forEach(s => {
      if (s.title.toLowerCase().includes(query)) count++;
      s.content.forEach(p => {
        if (p.toLowerCase().includes(query)) count++;
      });
    });
    return count;
  }, [document.contentSections, inDocSearch]);

  // Styling theme mappings
  const themeClasses = {
    paper: 'bg-white text-slate-900 border-slate-200',
    warm: 'bg-[#faf7f0] text-stone-900 border-stone-300',
    night: 'bg-slate-950 text-slate-100 border-slate-800'
  };

  const headerThemeClasses = {
    paper: 'bg-slate-50/90 text-slate-900 border-slate-200',
    warm: 'bg-[#f4efe4] text-stone-900 border-stone-300',
    night: 'bg-slate-900/90 text-slate-100 border-slate-800'
  };

  const overviewBoxClasses = {
    paper: 'bg-emerald-50 border-emerald-300/80 text-emerald-950',
    warm: 'bg-amber-100/70 border-amber-300 text-stone-900',
    night: 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
  };

  const sectionHeadingClasses = {
    paper: 'text-emerald-950 border-emerald-200',
    warm: 'text-emerald-900 border-stone-300',
    night: 'text-emerald-400 border-slate-800'
  };

  const bodyTextSizes = {
    normal: 'text-xs sm:text-sm leading-relaxed',
    large: 'text-sm sm:text-base leading-relaxed',
    xlarge: 'text-base sm:text-lg leading-loose'
  };

  return (
    <div className={`w-full rounded-3xl border shadow-xl overflow-hidden flex flex-col transition-all duration-300 ${themeClasses[themeMode]} ${
      isFullScreen ? 'fixed inset-4 z-50 shadow-2xl max-h-[calc(100vh-2rem)]' : 'relative'
    }`}>
      {/* Top Document Preview Bar */}
      <div className={`px-4 sm:px-6 py-4 border-b flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 backdrop-blur-md ${headerThemeClasses[themeMode]}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md">
                <ShieldCheck className="w-3 h-3 text-emerald-700" />
                <span>Verified In-Browser Document Preview</span>
              </span>
              <span className="text-[10px] text-slate-500 font-bold hidden sm:inline">
                {document.editionYear}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black truncate max-w-md sm:max-w-xl text-slate-900 dark:text-white mt-0.5">
              {document.title}
            </h3>
          </div>
        </div>

        {/* Reader Controls Toolbar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Selector */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-[10px] font-bold">
            <button
              onClick={() => setThemeMode('paper')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                themeMode === 'paper' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Classic Paper"
            >
              Paper
            </button>
            <button
              onClick={() => setThemeMode('warm')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                themeMode === 'warm' ? 'bg-amber-200/80 text-amber-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Warm Eye-Comfort"
            >
              Warm
            </button>
            <button
              onClick={() => setThemeMode('night')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                themeMode === 'night' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Night Focus"
            >
              Night
            </button>
          </div>

          {/* Font Size Adjust */}
          <div className="hidden md:flex items-center bg-slate-200/80 p-0.5 rounded-xl text-[11px] font-bold">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                fontSize === 'normal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
              title="Default Font Size"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer font-extrabold ${
                fontSize === 'large' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
              title="Large Font Size"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize('xlarge')}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer font-black text-xs ${
                fontSize === 'xlarge' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
              title="Extra Large Font Size"
            >
              A++
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
            title="Copy Document Text"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden lg:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Print / PDF Button */}
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold shadow-xs"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden lg:inline">Print / PDF</span>
          </button>

          {/* Fullscreen Toggle (if handler provided) */}
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title={isFullScreen ? 'Minimize Preview' : 'Fullscreen Preview'}
            >
              {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 transition-colors cursor-pointer"
            title="Close Document Preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-bar: Search within document & Section Navigation Jumpers */}
      <div className="px-4 sm:px-6 py-2.5 bg-slate-100/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Quick in-document search filter */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search keywords in this document (e.g. rubric, scoring, safety, POI)..."
            value={inDocSearch}
            onChange={e => setInDocSearch(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-700"
          />
          {inDocSearch && (
            <button
              onClick={() => setInDocSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {inDocSearch && (
          <div className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-md">
            {matchCount > 0 ? `${matchCount} keyword match${matchCount > 1 ? 'es' : ''}` : 'No matches found in document'}
          </div>
        )}

        {/* Section Quick Jump Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full">
          <span className="text-[10px] font-black uppercase text-slate-400 shrink-0 flex items-center gap-1">
            <ListFilter className="w-3 h-3" /> Jump to:
          </span>
          {document.contentSections.map((sec, idx) => (
            <a
              key={idx}
              href={`#doc-sec-${idx}`}
              onClick={() => setActiveSectionIdx(idx)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                activeSectionIdx === idx 
                  ? 'bg-emerald-800 text-white' 
                  : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
            >
              Section {idx + 1}
            </a>
          ))}
        </div>
      </div>

      {/* Main Document Content Scrollable Body */}
      <div className="p-6 sm:p-10 overflow-y-auto space-y-8 flex-1 max-h-[75vh]">
        {/* Document Official Cover Banner */}
        <div className="border-b-2 border-dashed border-slate-200 pb-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-800 text-white">
                {document.category}
              </span>
              <span className="font-bold text-slate-700">
                Official Document #{document.id.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span><strong>Issuing Authority:</strong> {document.authorOrDept}</span>
              <span><strong>Published:</strong> {document.publishDate}</span>
              <span><strong>File Size:</strong> {document.fileSize}</span>
            </div>
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight">
              {document.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Official Reference Codification for High Schools Across the 15 Counties of Liberia
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {document.tags.map((tag, tIdx) => (
              <span key={tIdx} className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-semibold border border-slate-200">
                #{tag}
              </span>
            ))}
          </div>

          {/* Executive Overview Box */}
          <div className={`p-4 sm:p-5 rounded-2xl border text-xs sm:text-sm leading-relaxed ${overviewBoxClasses[themeMode]}`}>
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 shrink-0 text-emerald-700 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-black block uppercase text-[10px] tracking-wider text-emerald-900">
                  Document Overview & Regulatory Scope:
                </strong>
                <p>{document.description}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-10">
          {filteredSections.map((section, sIdx) => {
            const isMatch = inDocSearch.trim().length > 0;
            return (
              <div
                key={sIdx}
                id={`doc-sec-${sIdx}`}
                className="scroll-mt-32 space-y-4 pt-4 first:pt-0"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <h2 className={`text-base sm:text-lg font-black flex items-center gap-2 ${sectionHeadingClasses[themeMode]}`}>
                    <span className="w-6 h-6 rounded-lg bg-emerald-800 text-amber-300 text-xs font-black flex items-center justify-center shrink-0">
                      {sIdx + 1}
                    </span>
                    <span>{section.title}</span>
                  </h2>
                  <a
                    href="#top"
                    className="text-[10px] font-bold text-slate-400 hover:text-emerald-700 flex items-center gap-0.5"
                  >
                    <ArrowUp className="w-3 h-3" /> Top
                  </a>
                </div>

                <div className={`space-y-3 pl-2 sm:pl-8 ${bodyTextSizes[fontSize]}`}>
                  {section.content.map((paragraph, pIdx) => {
                    const isBulletOrNumbered = /^[0-9A-Z]\.|\-|\•/.test(paragraph.trim());
                    const containsKeyword = isMatch && paragraph.toLowerCase().includes(inDocSearch.toLowerCase());

                    if (isBulletOrNumbered) {
                      return (
                        <div
                          key={pIdx}
                          className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                            containsKeyword 
                              ? 'bg-yellow-50 border-amber-400 font-medium' 
                              : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="space-y-1 flex-1">
                            <p>{paragraph}</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <p
                        key={pIdx}
                        className={`leading-relaxed ${
                          containsKeyword ? 'bg-yellow-100 p-2 rounded-lg font-semibold text-slate-950' : ''
                        }`}
                      >
                        {paragraph}
                      </p>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Verification Stamping & Footer */}
        <div className="pt-8 border-t-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
              YFC
            </div>
            <div>
              <strong className="text-slate-900 block font-bold">Youth For Change National Forensics Secretariat</strong>
              <span>Republic of Liberia • Verified Publications Database</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Print / Download PDF Copy</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
