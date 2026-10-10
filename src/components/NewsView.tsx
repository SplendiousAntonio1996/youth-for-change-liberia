import React, { useState, useEffect } from 'react';
import { 
  Newspaper, Calendar, Clock, User, Share2, 
  ChevronRight, ArrowLeft, Tag, BookOpen, Check, RefreshCw,
  Sparkles, Lock
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { NewsArticle, NavTab } from '../types';
import { NEWS_ARTICLES } from '../data/contentData';
import { NewsGridSkeleton } from './SkeletonLoaders';
import { SafeImage } from './SafeImage';
import { PageHeroBanner } from './PageHeroBanner';

interface NewsViewProps {
  setTab: (tab: NavTab) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ setTab }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [liveArticles, setLiveArticles] = useState<NewsArticle[]>([]);

  // Realtime subscription to live Firestore stories
  useEffect(() => {
    try {
      if (!db) return;
      const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const custom: NewsArticle[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          custom.push({
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
        setLiveArticles(custom);
      }, (err) => {
        console.warn('Firestore news listener error:', err);
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not establish firestore listener', e);
    }
  }, []);

  // Combine live articles with default seed news articles (avoid duplicate IDs)
  const allCombinedNews = [
    ...liveArticles,
    ...NEWS_ARTICLES.filter(n => !liveArticles.some(la => la.id === n.id))
  ];

  // Trigger skeleton loading on category change or initial mount
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [selectedCategory]);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 350);
  };

  const categories = [
    'All',
    'Tournament News',
    'STEM Innovation',
    'Policy & Education',
    'Partner Spotlight',
    'Press Release'
  ];

  const filteredNews = selectedCategory === 'All'
    ? allCombinedNews
    : allCombinedNews.filter(n => n.category === selectedCategory);

  const handleShare = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const featuredArticle = filteredNews.length > 0 ? filteredNews[0] : null;
  const gridArticles = selectedCategory === 'All' && filteredNews.length > 1 ? filteredNews.slice(1) : filteredNews;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-20 space-y-10">
      {/* 1. Sleek Forest Green Hero Banner */}
      <PageHeroBanner
        category="ANNOUNCEMENTS, DRAWS, RESULTS & STORIES"
        badge="OFFICIAL FIELD DISPATCHES"
        title="FROM THE FIELD"
        subtitle="The latest official dispatches, press statements, fixture releases, and human interest stories from across Liberia."
        bgImage="/debate.jpg"
        stats={[
          { label: 'Published Dispatches', value: `${allCombinedNews.length}` },
          { label: 'Liberian Counties', value: '15' },
          { label: 'Verified Sources', value: '100%' },
          { label: 'Live Cloud Feed', value: `${liveArticles.length} Live` }
        ]}
      >
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-yellow-400 text-emerald-950 font-black shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
          <button
            type="button"
            onClick={handleRefresh}
            title="Fetch latest press articles"
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </PageHeroBanner>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* 2. Featured Article Spotlight (when category is All and articles exist) */}
        {!isLoading && selectedCategory === 'All' && featuredArticle && (
          <div 
            onClick={() => setActiveArticle(featuredArticle)}
            className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-xl transition-all cursor-pointer grid grid-cols-1 lg:grid-cols-12 gap-0 group"
          >
            <div className="lg:col-span-7 h-72 sm:h-96 relative overflow-hidden">
              <SafeImage
                src={featuredArticle.image}
                alt={featuredArticle.title}
                fallbackCategory="news"
                fallbackTitle={featuredArticle.title}
                priority
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-4 left-4 bg-[#063d2e] text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-xs shadow-xs">
                {featuredArticle.category}
              </span>
              <span className="absolute top-4 right-4 bg-yellow-400 text-emerald-950 text-xs font-black px-3 py-0.5 rounded-full shadow-xs uppercase tracking-wider">
                Featured Story
              </span>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {featuredArticle.date}</span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {featuredArticle.readTime}</span>
                </div>
                <h2 className="font-condensed font-black text-2xl sm:text-3xl text-slate-900 group-hover:text-emerald-800 transition-colors uppercase leading-tight">
                  {featuredArticle.title}
                </h2>
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-4">
                  {featuredArticle.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#063d2e] flex items-center justify-center font-bold text-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">{featuredArticle.author || 'Editorial Team'}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 group-hover:translate-x-1 transition-transform">
                  <span>Read Full Dispatch</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Main Grid of Articles or Skeleton */}
        {isLoading ? (
          <NewsGridSkeleton />
        ) : filteredNews.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-4 shadow-xs animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto">
              <Newspaper className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-900">No News Articles Published Yet</h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                {selectedCategory === 'All'
                  ? 'Official press releases, county tournament dispatches, and STEM project updates will appear here once published.'
                  : `No articles currently found under "${selectedCategory}".`}
              </p>
            </div>
            {selectedCategory !== 'All' && (
              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  View All Categories
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
              <h3 className="font-condensed font-black text-xl uppercase tracking-tight text-slate-900">
                {selectedCategory === 'All' ? 'Recent Articles & Reports' : `${selectedCategory} (${filteredNews.length})`}
              </h3>
              <span className="text-xs text-slate-400 font-medium">{gridArticles.length} Stories</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              {gridArticles.map(article => (
                <div
                  key={article.id}
                  onClick={() => setActiveArticle(article)}
                  className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="h-48 overflow-hidden relative">
                      <SafeImage
                        src={article.image}
                        alt={article.title}
                        fallbackCategory="news"
                        fallbackTitle={article.title}
                        priority
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-3 left-3 bg-[#063d2e]/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs">
                        {article.category}
                      </span>
                      {article.createdAt && (
                        <span className="absolute top-3 right-3 bg-yellow-400 text-emerald-950 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                          Live
                        </span>
                      )}
                    </div>
                    <div className="p-5 space-y-2">
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {article.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {article.readTime}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 group-hover:text-emerald-800 text-base leading-snug line-clamp-2">
                        {article.title}
                      </h4>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 pt-0 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-800 mt-2">
                    <span>Read Full Dispatch</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Article Reader Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-10 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <button
                onClick={() => setActiveArticle(null)}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to News Feed
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                  {copied ? 'Link Copied!' : 'Share Article'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold uppercase bg-emerald-100 text-emerald-900 px-3 py-0.5 rounded-full">
                  {activeArticle.category}
                </span>
                <span className="text-xs text-slate-400">• {activeArticle.date}</span>
                <span className="text-xs text-slate-400">• {activeArticle.readTime}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                {activeArticle.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 pb-2">
                <User className="w-3.5 h-3.5 text-emerald-700" />
                <span>Published by <strong>{activeArticle.author}</strong> ({activeArticle.source})</span>
              </div>
            </div>

            {activeArticle.image && (
              <div className="h-64 sm:h-80 rounded-2xl overflow-hidden shadow-xs">
                <SafeImage
                  src={activeArticle.image}
                  alt={activeArticle.title}
                  fallbackCategory="news"
                  fallbackTitle={activeArticle.title}
                  priority
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="bg-emerald-50/60 p-4 rounded-2xl border-l-4 border-emerald-600 text-sm text-emerald-950 font-medium italic">
              "{activeArticle.summary}"
            </div>

            <div className="space-y-4 text-slate-700 text-sm sm:text-base leading-relaxed">
              {activeArticle.fullContent.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-xs text-slate-400 text-center sm:text-left">
                Youth For Change Liberia • National Secretariat Press & Publications Office
              </p>
              <button
                onClick={() => setActiveArticle(null)}
                className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-sm transition-colors cursor-pointer"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
